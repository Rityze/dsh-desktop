import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { LoadPhaseTracker, LOAD_PHASES } from './load-phase.js'

/**
 * The port every managed llama-server listens on.
 *
 * Fixed rather than chosen per load, and that is the whole point. The engine
 * reads this address once, when it starts, and holds it for the life of the
 * process — it does not re-read it when a model is loaded or unloaded. A port
 * picked at load time therefore describes an endpoint the engine is not
 * listening to: the first model works because it happened to be loaded before
 * the engine started, and every load after that leaves the engine pointing at a
 * socket that has since closed, where a send fails with a connection error and
 * no explanation the user can act on.
 *
 * A fixed port makes the address a constant of the installation, so an engine
 * started at any time is correct for the model that is running now.
 *
 * The cost of the choice is that the port can be taken by something else, which
 * is why an occupied port is an error rather than a reason to fall back to a
 * random one — falling back would restore exactly the bug this prevents, and
 * would do it silently at the one moment the user is watching a load.
 */
export const DEFAULT_SERVER_PORT = 8082

/** Whether the load's options name a port to use. */
function portFrom(options) {
  const port = Number(options?.port)
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : undefined
}

/**
 * What is holding the port, as far as this process can tell.
 *
 * Windows only, and best-effort: `netstat -ano` is the one tool that is always
 * present, and its output names the pid — the process name is then a second
 * lookup. Anything that fails here returns undefined, because this exists to make
 * an error message better, not to be a reason for one.
 *
 * The alternative was to tell the user "close whatever is using 8082", which on
 * this machine meant finding QQ by hand. Measured: QQ held `0.0.0.0:8082`, which
 * is exactly the case a person would not think to look for.
 */
async function describePortHolder(port) {
  if (process.platform !== 'win32') return undefined
  try {
    const { execFile } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const run = promisify(execFile)
    const { stdout } = await run('netstat', ['-ano', '-p', 'TCP'], { timeout: 4000 })
    const pids = new Set()
    for (const line of stdout.split('\n')) {
      const parts = line.trim().split(/\s+/)
      /* Proto, local, foreign, state, pid — the listening rows only. */
      if (parts.length < 5 || parts[0] !== 'TCP' || parts[3] !== 'LISTENING') continue
      if (!parts[1].endsWith(`:${port}`)) continue
      const pid = Number(parts[4])
      if (Number.isInteger(pid) && pid > 0) pids.add(pid)
    }
    if (pids.size === 0) return undefined
    const names = []
    for (const pid of pids) {
      try {
        const { stdout: task } = await run('tasklist', ['/FI', `PID eq ${String(pid)}`, '/FO', 'CSV', '/NH'], {
          timeout: 4000
        })
        const name = task.split(',')[0]?.replace(/"/g, '').trim()
        if (name) names.push(`${name}（PID ${String(pid)}）`)
      } catch {
        names.push(`PID ${String(pid)}`)
      }
    }
    return names.length > 0 ? names.join('、') : undefined
  } catch {
    return undefined
  }
}

/**
 * Whether the port a managed server needs can actually be reached.
 *
 * Binding is the only honest test: any check short of taking the port leaves a
 * window where another process can take it between the answer and the child's
 * own bind, and reporting a free port that is not free is worse than not
 * reporting at all.
 *
 * **Both loopback and wildcard are probed, and the wildcard one is why this
 * exists.** Measured on this machine: QQ held `0.0.0.0:8082` while this function
 * — which only ever bound `127.0.0.1` — reported the port free. Windows lets the
 * two coexist, and the child then bound `127.0.0.1:8082` successfully, so the
 * load looked fine from the inside. What the engine's own `/health` poll got was
 * a 404 from QQ, whose listener had claimed the wildcard address and therefore
 * won the route for connections to the loopback one.
 *
 * The symptom was a load that reached `model loaded` in llama.cpp's own log and
 * then sat in the health poll until a ten-minute timeout, with nothing anywhere
 * saying the port was shared. A loopback-only probe cannot see that, and the
 * loopback-only bind is exactly the case where it matters.
 */
export async function isPortAvailable(port) {
  const bind = (host) =>
    new Promise((resolve) => {
      const probe = createServer()
      probe.unref()
      probe.once('error', () => resolve(false))
      probe.listen(port, host, () => {
        probe.close(() => resolve(true))
      })
    })
  /*
   * Sequential rather than concurrent: two probes of the same port at once race
   * each other for it, and the second would report the first as a conflict.
   */
  if (!(await bind('127.0.0.1'))) return false
  return bind('0.0.0.0')
}

/**
 * Whether `phase` comes before `than` in the load sequence.
 *
 * Announcements must never go backwards. The inferred `reading` is not a fact
 * the engine printed, so it can be superseded or contradicted by a marker that
 * arrives later, and a caller that announced whatever the tracker currently said
 * would replay earlier steps.
 */
function isEarlier(phase, than) {
  if (!than) return false
  return LOAD_PHASES.indexOf(phase) < LOAD_PHASES.indexOf(than)
}

/**
 * One managed llama-server process bound to one model. Loading is exclusive by
 * design: the GPU cannot hold two of these models, so a new load replaces the
 * previous one instead of accumulating idle servers.
 */
export class LlamaServer {
  #child
  #port
  #exited

  constructor({ child, port, model, args, binary }) {
    this.#child = child
    this.#port = port
    this.#exited = false
    this.model = model
    this.args = args
    this.binary = binary
    this.startedAt = Date.now()
    this.stderr = []
    this.#child.once('exit', () => { this.#exited = true })
  }

  get port() { return this.#port }
  get baseURL() { return `http://127.0.0.1:${this.#port}` }
  get running() { return !this.#exited }
  get pid() { return this.#child?.pid }

  /** A bounded tail of server diagnostics, surfaced when a load fails. */
  get diagnostic() { return this.stderr.slice(-20).join('').trim() }

  /**
   * Ask the server to stop, escalating to a kill if it does not honor the
   * request. llama-server releases the GPU memory only after the process is
   * really gone, so the caller awaits this before starting the next load.
   */
  async stop({ timeoutMs = 8000 } = {}) {
    if (this.#exited) return
    /*
     * Bounded, because the `exit` event is not guaranteed to arrive.
     *
     * The wait below used to be unbounded: `await settled` resolved on the
     * child's `exit`, and the SIGKILL that follows was the only thing that
     * guaranteed one. Measured, that is not enough — a process killed from
     * outside this application (a `taskkill`, a task manager, a crash handler)
     * leaves the handle with no event left to fire, and the `await` never
     * returns. `unload()` waits on this before every load, so the observable
     * failure was a load that ran to completion — its process up and answering
     * `/health`, its phase log reading `model ready` — and a caller that never
     * heard back and never registered the model.
     *
     * The timeout is the escalation budget plus a margin: past it the process is
     * either gone or was already gone, and either way nothing is gained by
     * waiting longer.
     */
    let settle
    const settled = new Promise(resolve => {
      settle = resolve
      this.#child.once('exit', resolve)
    })
    const timer = setTimeout(() => {
      this.#child.kill('SIGKILL')
      settle()
    }, timeoutMs)
    this.#child.kill('SIGTERM')
    await settled
    clearTimeout(timer)
    this.#exited = true
  }
}

/**
 * ROCm install directories to add to the child's DLL search path.
 *
 * The ROCm backend ships `hipblas`/`amdhip64` outside the llama.cpp build, and
 * a spawned child inherits only this process's PATH. Missing them is what makes
 * a launched server exit instantly with no diagnostic at all.
 */
export function rocmPathEntries({ binaryDirectory } = {}) {
  if (process.platform !== 'win32') return []
  const entries = []

  // A vendored runtime (the LM Studio derived llama.cpp package) ships the HIP
  // stack inside the engine folder as <dir>/rocm/bin. Those DLLs are what the
  // forked llama-server-impl.dll links against, so this directory is searched
  // first: it is version matched with the binary, unlike a machine-wide ROCm.
  if (binaryDirectory) {
    // `rocm\bin\rocblas` holds the architecture-specific blas kernels as loose
    // files; the loader resolves them by name, so the leaf directory has to be
    // on PATH as well. `_vendor` is the flattened layout some packages use.
    for (const sub of ['rocm\\bin', 'rocm\\bin\\rocblas', 'rocm\\lib', 'bin', 'lib', '_vendor']) {
      const candidate = join(binaryDirectory, sub)
      if (existsSync(candidate)) entries.push(candidate)
    }
  }

  // Fall back to a system-wide ROCm install when the engine is not vendored.
  const roots = [
    process.env.ROCM_PATH,
    'C:\\Program Files\\AMD\\ROCm\\7.2',
    'C:\\Program Files\\AMD\\ROCm\\7.1',
    'C:\\Program Files\\AMD\\ROCm',
  ].filter(Boolean)
  for (const root of roots) {
    for (const sub of ['bin', 'lib']) {
      const candidate = join(root, sub)
      if (existsSync(candidate)) entries.push(candidate)
    }
  }
  return entries
}

/**
 * The directory rocBLAS should read its Tensile kernels from, or an empty string.
 *
 * **rocBLAS does not look on PATH for these.** It reads `ROCBLAS_TENSILE_LIBPATH`
 * and otherwise looks beside `rocblas.dll` for a `library/` folder. Being on PATH
 * is not the same as being findable, which is why `rocmPathEntries` — which does
 * put `rocm\\bin\\rocblas` on PATH — is not enough on its own.
 *
 * Measured, and the reason this function exists: without it a prefill past a few
 * hundred tokens dies with
 *
 *     rocBLAS error: Cannot read .../rocblas/library/TensileLibrary.dat:
 *     No such file or directory for GPU arch : gfx1100
 *     rocBLAS error: Could not initialize Tensile host
 *
 * and the failure is invisible from the application — the request's connection
 * is reset, with no error text, so it reads as "this model does not work here".
 * Short prompts survive it because they stay on the MMQ/MMVQ HIP kernels that
 * llama.cpp compiles itself; the fall back to rocBLAS is what triggers this.
 *
 * Two locations, vendored first for the same version-matching reason
 * `rocmPathEntries` gives: a machine-wide ROCm may be a different major version
 * than the rocblas the engine links against.
 */
export function tensileLibraryPath({ binaryDirectory } = {}) {
  if (process.platform !== 'win32') return ''
  const candidates = []
  if (binaryDirectory) {
    // Matches where this repository's own test harness leaves it, and the
    // `rocm` layout a vendored runtime uses.
    candidates.push(join(binaryDirectory, 'rocblas', 'library'))
    candidates.push(join(binaryDirectory, 'rocm', 'bin', 'rocblas', 'library'))
  }
  for (const root of [
    process.env.ROCM_PATH,
    'C:\\Program Files\\AMD\\ROCm\\7.2',
    'C:\\Program Files\\AMD\\ROCm\\7.1',
    'C:\\Program Files\\AMD\\ROCm',
  ]) {
    if (root) candidates.push(join(root, 'bin', 'rocblas', 'library'))
  }
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return ''
}

/**
 * This application's reasoning levels, in llama.cpp's vocabulary.
 *
 * Two names for one idea, and they are not the same set. `REASONING_LEVELS` is
 * what the composer offers — five steps so a user can move one notch at a time —
 * and llama.cpp's `--reasoning-effort` is whatever string the chat template
 * understands, which for the templates in use is three: `low`, `medium`,
 * `high`. `max` maps to `high` because the template has nothing above it, and
 * `default` means "say nothing and let the template decide".
 *
 * A level not in this table is left unsent rather than passed through: a
 * template that receives a word it does not know either ignores it or errors,
 * and neither is a useful answer to "make the model think harder".
 */
const REASONING_EFFORTS = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  xhigh: 'high',
  max: 'high',
  default: 'default'
}

/**
 * Build the llama-server argument list for one load request.
 *
 * Defaults mirror the measured best configuration for this machine (FAST
 * ROCmFP4 weights, MTP speculative decoding at n_max=3, q4_0 KV at the model's
 * trained context), and every field is overridable so the same builder serves
 * any GGUF.
 */
export function buildArgs({ modelPath, options = {} }) {
  const args = [
    '--model', modelPath,
    '--host', '127.0.0.1',
    '--port', String(options.port),
    '--no-webui',
    '--metrics',
  ]

  const context = options.contextLength
  if (Number.isFinite(context) && context > 0) args.push('--ctx-size', String(context))

  // -1 means "every layer"; the measured configuration offloads all of them.

  args.push('--n-gpu-layers', String(options.gpuLayers ?? -1))
  args.push('--threads', String(options.threads ?? 8))

  // K and V quantize independently in the load UI, so each is emitted on its
  // own. A shared `kvCacheType` stays supported for callers that predate the
  // split and for the plugin-level default.
  const kvType = options.kvCacheType ?? 'q4_0'
  const kvK = options.kvCacheTypeK ?? kvType
  const kvV = options.kvCacheTypeV ?? kvType
  const quantized = type => type && String(type).toLowerCase() !== 'f16'
  if (quantized(kvK)) args.push('--cache-type-k', String(kvK).toLowerCase())
  if (quantized(kvV)) args.push('--cache-type-v', String(kvV).toLowerCase())

  // V quantization and flash attention are coupled in llama.cpp: a quantized V
  // cache without flash attention is rejected at load, so the flag is forced on
  // rather than letting the process fail.
  if (quantized(kvV)) options = { ...options, flashAttention: true }

  if (options.flashAttention !== false) args.push('--flash-attn', 'on')

  // The DeltaNet/hybrid architectures fail to load without a single unified KV
  // buffer, so `--no-kv-unified` stays the default; the load UI can turn the
  // unified buffer on for the architectures that want it, and concurrency sets
  // the slot count.
  if (options.unifiedKv === true) args.push('--kv-unified')
  else args.push('--no-kv-unified')
  args.push('--parallel', String(options.parallel ?? options.maxConcurrency ?? 1))

  /*
   * Thinking, which the load UI has offered a switch for since before it did
   * anything.
   *
   * `enableThinking`, `reasoningBudget` and `reasoningBudgetMessage` were all
   * declared in `load-options.js` with `flag: null`, which meant "not a command
   * line flag" — and nothing else consumed them either. They appeared in the
   * settings, the settings persisted, and no process anywhere read them. A
   * user who turned thinking off got thinking anyway, and one who picked the
   * smallest level got whatever the model felt like, which is exactly the
   * report that led here: 「我选的最低思考也要思考很久」.
   *
   * llama.cpp has had the real flags all along (`--reasoning`,
   * `--reasoning-budget`, `--reasoning-effort`); the gap was a wire that was
   * never run.
   *
   * `--reasoning off` rather than a zero budget when the switch is down: a
   * budget of 0 means "end thinking immediately", which still opens the tag and
   * closes it, and some templates emit a stray `<｜end▁of▁thinking｜>` for it. Turning the
   * feature off is what the switch says.
   */
  if (options.enableThinking === false) args.push('--reasoning', 'off')
  else if (options.enableThinking === true) args.push('--reasoning', 'on')

  /*
   * Where the thinking goes, stated rather than left to `auto`.
   *
   * The server's default is `auto`, which decides per template, and the two
   * outcomes are not equivalent to the client:
   *
   *   - `deepseek` puts the thoughts in `message.reasoning_content`, a field
   *     beside the answer
   *   - `none` leaves them inside `message.content`, wrapped in the model's own
   *     markers
   *
   * The adapter reads the first and would have to strip markers out of the
   * second, and which one arrives depends on a template the application does not
   * control. Reported, before this was set, as "the thinking does not show up".
   * Asking for `deepseek` makes the field the client reads the field the server
   * writes, whatever the template would have preferred.
   *
   * `internal` is a third value this build also accepts, folding a summary into
   * the content; it is not used because a summary is not the thinking, and the
   * panel's reasoning levels are about the thinking.
   */
  const reasoningFormat = options.reasoningFormat ?? 'deepseek'
  if (typeof reasoningFormat === 'string' && reasoningFormat.length > 0) {
    args.push('--reasoning-format', reasoningFormat)
  }

  /*
   * The budget, when one is set.
   *
   * Left out entirely when unset rather than sent as -1: llama.cpp's default is
   * already unrestricted, and sending the same thing explicitly would make the
   * command line claim a decision nobody made.
   */
  const budget = options.reasoningBudget
  if (Number.isFinite(budget)) args.push('--reasoning-budget', String(budget))

  /*
   * The level, which the turn settings call `variant`.
   *
   * Two names for one idea: the engine names a level into the model's own
   * variants table, and llama.cpp asks the chat template for an effort. Mapped
   * here rather than passed through because they are not the same vocabulary —
   * `max` is this application's word and `high` is the template's highest.
   */
  const effort = REASONING_EFFORTS[String(options.reasoningEffort ?? '').toLowerCase()]
  if (effort !== undefined) args.push('--reasoning-effort', effort)

  if (typeof options.reasoningBudgetMessage === 'string' && options.reasoningBudgetMessage.length > 0) {
    args.push('--reasoning-budget-message', options.reasoningBudgetMessage)
  }

  // Bypassing mmap matters for two reasons: a full-precision KV cache is not
  // the only one -- the HIP path for hybrid attention requires rotation to be
  // off, and the environment variable below is what selects that kernel.
  //
  // Newer builds replaced the `--no-mmap` flag with `--load-mode`; the old flag
  // still works but prints a deprecation notice on every load, so the modern
  // spelling is used unless the caller asks for the legacy one.
  // mmap is on by default so weights are paged rather than copied; `noMmap`
  // (or the UI's `useMmap: false`) turns it off, and mlock pins what remains.
  if (options.noMmap === true || options.useMmap === false) {
    if (options.legacyFlags) args.push('--no-mmap')
    else args.push('--load-mode', 'none')
  }
  if (options.mlock === true || options.keepInMemory === true) args.push('--mlock')

  if (Number.isFinite(options.batchSize)) args.push('--batch-size', String(options.batchSize))
  /*
   * Always passed, never left to llama.cpp's own default.
   *
   * The default is 512, and 512 has a crash on its record for the ROCm FP4 build
   * this application ships: a prompt long enough to need more than one physical
   * batch was reported to kill the process with `0xc0000409` in `ucrtbase.dll`,
   * the C runtime's stack-guard abort — a memory fault inside the HIP kernels
   * rather than a rejected argument, and invisible in ordinary use because a
   * short prompt fits in one batch and never reaches the path that faults.
   *
   * Emitted unconditionally rather than only when the caller sets it, because
   * the panel's field default is a *form* initial value: a user who never opens
   * the advanced section sends no `ubatchSize` at all, and a flag omitted here
   * would be llama.cpp's 512 rather than whatever the form showed them.
   *
   * The fallback is 256 rather than the 512 above or the 64 this used to be.
   * Re-measured, with these exact arguments and a 3,801-token prompt: 64 costs
   * 42% of the time to first token (10.8s against 6.3s) and 256 recovers most of
   * that (7.0s) while staying half of the value with the crash on its record.
   */
  args.push('--ubatch-size', String(Number.isFinite(options.ubatchSize) ? options.ubatchSize : 256))

  // RoPE overrides stay opt-in: unset means the model's own trained values are
  // used, which is what the load UI shows as "automatic".
  if (Number.isFinite(options.ropeFreqBase) && options.ropeFreqBase > 0) {
    args.push('--rope-freq-base', String(options.ropeFreqBase))
  }
  if (Number.isFinite(options.ropeFreqScale) && options.ropeFreqScale > 0) {
    args.push('--rope-freq-scale', String(options.ropeFreqScale))
  }

  // Context checkpoints bound how far a long generation can be rolled back;
  // 0 (or unset) leaves llama.cpp's own default in place.
  if (Number.isFinite(options.contextCheckpoints) && options.contextCheckpoints > 0) {
    args.push('--ctx-checkpoints', String(options.contextCheckpoints))
  }

  // What a full context window does next is a switch, not a policy.
  //
  // This build has no `--ctx-overflow-*` family: the behaviour is selected by
  // `--context-shift`, which silently drops the oldest tokens to make room and
  // keeps generating, and `--no-context-shift`, which stops instead of
  // forgetting. Both are real flags in `llama-common.dll`; nothing resembling a
  // three-way mode exists, and an unrecognized flag is not ignored — the server
  // refuses to start, which is how the fabricated spelling was found.
  //
  // `--context-shift` is already the engine's default, so only the opt-out is
  // emitted. Passing it explicitly would be harmless but would also claim a
  // choice the user did not make.
  if (options.contextOverflow === 'stop') args.push('--no-context-shift')

  // The KV buffer lives on the GPU alongside the weights unless the caller opts
  // out, which is only useful when VRAM is tight.
  if (options.offloadKqv === false) args.push('--no-kv-offload')

  const speculative = options.speculative
  if (speculative?.type && speculative.type !== 'none') {
    args.push('--spec-type', speculative.type)
    if (Number.isFinite(speculative.nMax)) args.push('--spec-draft-n-max', String(speculative.nMax))
    if (Number.isFinite(speculative.nMin)) args.push('--spec-draft-n-min', String(speculative.nMin))
    if (Number.isFinite(speculative.pMin)) args.push('--spec-draft-p-min', String(speculative.pMin))
    if (speculative.draftModelPath && speculative.type === 'draft-simple') {
      args.push('--spec-draft-model', speculative.draftModelPath)
    }
  }

  if (options.mmprojPath) args.push('--mmproj', options.mmprojPath)
  if (options.apiKey) args.push('--api-key', options.apiKey)
  // Stop sequences are `--reverse-prompt` here, not `--stop`.
  //
  // `--stop` is the spelling the wider llama.cpp ecosystem uses and this build
  // has no such flag at all — it is not in any module, so passing it is a
  // startup failure rather than a no-op. One flag per sequence, repeated, which
  // is what the loop does; the flag does not take a list.
  //
  // Worth noting for the next reader: the empty-list case hid this for a while,
  // because an empty list emits no flag and therefore no error. The bug only
  // appears once a user actually sets a stop string.
  if (Array.isArray(options.stopStrings)) {
    for (const stop of options.stopStrings) {
      if (typeof stop === 'string' && stop) args.push('--reverse-prompt', stop)
    }
  }
  // A random seed is the UI default, and llama.cpp already randomizes when the
  // flag is absent; an explicit -1 keeps that behavior visible in diagnostics.
  if (Number.isFinite(options.seed)) args.push('--seed', String(options.seed))
  // The panel calls this row "Chat Template"; the builder historically called
  // it `template`. Both spellings are accepted because the load endpoint passes
  // the form's keys through verbatim, and a mismatch here is a text box that
  // silently does nothing.
  const template = options.chatTemplate ?? options.template
  if (template) args.push('--chat-template', template)

  const extra = options.extraArgs
  if (Array.isArray(extra)) args.push(...extra.filter(entry => typeof entry === 'string' && entry))

  // Log level is load-bearing, not cosmetic. On this fork the ROCm backend
  // (llm_engine_rocm.node + ggml-hip.dll) is only enumerated when a verbose
  // log level is requested; at the default level the child silently falls back
  // to the CPU-only llm_engine.dll, which is indistinguishable from a driver
  // fault except by watching the device list. Measured on the RX 7900 XT:
  //   no flag        -> "  - CPU     : AMD Ryzen 7 5700X"            (probe only)
  //   -v / -lv 5     -> "  - ROCm0   : AMD Radeon RX 7900 XT"        (66/66 offloaded)
  // Keep the flag on by default and let callers opt out with logLevel: null.
  const logLevel = options.logLevel === undefined ? 5 : options.logLevel
  if (Number.isFinite(logLevel) && logLevel > 0) args.push('--verbose', '-lv', String(logLevel))

  return args
}

/**
 * Environment the managed server needs beyond a clean inherit.
 *
 * `LLAMA_ATTN_ROT_DISABLE=1` is mandatory whenever the KV cache is quantized:
 * without it the hybrid-attention HIP kernel produces a load failure on this
 * GPU. The rest keeps the child's behavior deterministic under a spawned
 * (rather than shell-launched) parent.
 */
export function buildEnv({ options = {}, extraPathEntries = [] } = {}) {
  const env = { ...process.env, LLAMA_LOG_COLORS: '0' }
  if ((options.kvCacheType ?? 'q4_0') !== 'f16') env.LLAMA_ATTN_ROT_DISABLE = '1'

  // A machine-wide ROCm install can shadow the version-matched DLLs that ship
  // beside the engine (the vendored one is what `ggml-hip.dll` was linked
  // against), and the HIP loader consults these variables before PATH. Point
  // them at the vendored runtime when it is present so the pairing can never
  // be broken by an unrelated SDK on the box.
  const vendoredRocm = options.binaryDirectory ? join(options.binaryDirectory, 'rocm') : ''
  if (process.platform === 'win32' && vendoredRocm && existsSync(vendoredRocm)) {
    env.HIP_PATH = vendoredRocm
    env.ROCM_PATH = vendoredRocm
  }
  /*
   * Tensile kernels are located by this variable, not by PATH, so the entries
   * `rocmPathEntries` contributes do not cover them. Set only when a directory
   * was actually found: assigning an empty value would point rocBLAS at nowhere
   * and lose whatever default it would otherwise have tried.
   */
  const tensile = tensileLibraryPath({ binaryDirectory: options.binaryDirectory })
  if (tensile) env.ROCBLAS_TENSILE_LIBPATH = tensile
  // The runtime DLLs live beside the binary and in the ROCm install; a spawned
  // child inherits only what this process has, so the binary's own directory is
  // prepended on Windows where DLL lookup follows PATH.
  const entries = [options.binaryDirectory, ...extraPathEntries].filter(Boolean)
  if (entries.length) {
    const separator = process.platform === 'win32' ? ';' : ':'
    env.PATH = [...entries, env.PATH ?? ''].join(separator)
  }
  return env
}

/**
 * Launch llama-server and wait until it answers /health.
 *
 * A load holds tens of gigabytes of weights, so readiness is polled with a
 * generous budget and the child's stderr is retained: a failed load reports the
 * server's own last words rather than a bare timeout.
 */
export async function launchLlamaServer({
  binary, modelPath, options = {}, onLog = () => {}, onPhase, tracker, signal,
  healthTimeoutMs = 600_000, spawnImpl = options.spawnImpl ?? spawn,
  // Injectable so a caller can be told about an inferred phase sooner than the
  // default. The real threshold that matters is the tracker's own silence rule;
  // this only decides how promptly the arrival is noticed.
  phaseIntervalMs = 400,
}) {
  if (!existsSync(binary)) {
    throw Object.assign(new Error(`llama-server binary not found: ${binary}`), { code: 'BINARY_MISSING' })
  }
  if (!existsSync(modelPath)) {
    throw Object.assign(new Error(`model file not found: ${modelPath}`), { code: 'MODEL_MISSING' })
  }

  /*
   * The port is fixed, so an engine started before this load still describes
   * the model that is running now. See `DEFAULT_SERVER_PORT`.
   *
   * Availability is checked rather than assumed. An occupied port is reported
   * as a failure of this load: the alternative — quietly taking a free port —
   * produces a server the engine cannot reach, and a chat that fails with a
   * connection error rather than with the reason.
   */
  const port = portFrom(options) ?? DEFAULT_SERVER_PORT

  /*
   * Skipped when the caller supplies its own `spawn`.
   *
   * The check answers "will the child manage to bind", and a caller that
   * injects a fake child is asking about something else — every test of the
   * phase wiring, the health polling and the tracker does. Leaving the check in
   * made those tests depend on a fact about the machine rather than about the
   * code: they passed or failed according to what else was running, and one
   * program holding 8082 turned thirteen of them red with a message about a
   * port the test never opens.
   *
   * `isPortAvailable` and the check it guards are for the real launch, which is
   * the only case where a conflict is a fact the user has to act on.
   */
  if (spawnImpl === spawn && !await isPortAvailable(port)) {
    /*
     * The holder is named, because "close whatever is using it" is not an
     * instruction a user can follow without first finding out. Measured, the
     * answer on this machine was QQ — a program nobody would suspect of holding
     * a model server's port, and one that binds the wildcard address, which is
     * the shape a person checking `127.0.0.1` would miss.
     */
    const holder = await describePortHolder(port)
    throw Object.assign(
      new Error(
        holder
          ? `端口 ${port} 已被占用，无法启动本地模型。占用者是 ${holder}，关闭它之后重试。`
          : `端口 ${port} 已被占用，无法启动本地模型。请关闭占用该端口的程序后重试。`
      ),
      { code: 'PORT_IN_USE', port }
    )
  }
  const binaryDirectory = dirname(binary)
  const args = buildArgs({ modelPath, options: { ...options, port } })
  const env = buildEnv({
    options: { ...options, binaryDirectory },
    extraPathEntries: rocmPathEntries({ binaryDirectory }),
  })
  onLog({ stream: 'info', text: `launching ${binary} ${args.join(' ')}` })

  // A caller-owned tracker wins: the manager keeps the phase after this promise
  // resolves, and a tracker created here would be discarded with the function
  // frame. The local instance is the fallback for a direct launch with no
  // manager above it.
  const phases = tracker ?? new LoadPhaseTracker(Date.now())

  // Announced before the spawn lands so the UI has a phase from the first poll.
  // Waiting for the first engine line is not enough: that line arrives only
  // after a full process start plus DLL resolution, which on this machine is
  // the better part of a second of guaranteed blank screen.
  //
  // Recorded in `lastPhase` so the engine's own first line — which carries
  // `load_model: loading model`, also `opening` — does not announce a second
  // time. Without that the UI would report the very first phase twice, which
  // reads as the load having restarted.
  let lastPhase
  if (onPhase) {
    lastPhase = 'opening'
    onPhase(
      { phase: 'opening', atMs: 0, detail: `launching ${binary.split(/[\\/]/).pop() ?? binary}` },
      phases.messages
    )
  }

  const child = spawnImpl(binary, args, {
    cwd: binaryDirectory,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  })

  const server = new LlamaServer({ child, port, model: modelPath, args, binary })
  const decoder = new TextDecoder()
  // Both streams are fed to the tracker, not just stderr. llama.cpp writes its
  // progress lines to stderr, but a build that reconfigured its logging, or a
  // wrapper that merged the two, would put them on stdout — and a tracker that
  // only listened to one would simply never advance, which is the failure this
  // whole mechanism exists to remove.
  const forward = (stream, level) => chunk => {
    const text = decoder.decode(chunk, { stream: true })
    server.stderr.push(text)
    if (server.stderr.length > 400) server.stderr.splice(0, server.stderr.length - 400)
    onLog({ stream: level, text })
    // Fed unconditionally, not only when someone is listening. A caller that
    // passed a tracker expects it to hold the load's phases afterwards — that
    // is the whole point of owning one — so gating this on `onPhase` would
    // silently hand back an empty tracker whenever the caller polled instead of
    // subscribing.
    phases.push(text)
    if (onPhase) {
      announce(phases.reached, phases.messages)
    }
  }
  child.stdout?.on('data', forward('stdout', 'debug'))
  child.stderr?.on('data', forward('stderr', 'debug'))

  // A heartbeat, because a phase can now arrive without any output at all.
  // `reading` is inferred from silence, and silence is precisely the absence of
  // the output that used to be the only trigger — so without this the inferred
  // phase would exist for a polling caller but never reach `onPhase`, and a UI
  // driven by events rather than by polls would sit on `opening` for the whole
  // weight read. The interval is well under the inference threshold so the
  // phase is announced close to when it becomes true.
  // Announced from `reached`, the furthest printed marker, so the sequence
  // never plays a step twice or goes backwards. The heartbeat adds `current`
  // on top, which can name `reading` from silence — but only as a forward move,
  // so the inferred phase can never re-announce a step or replay an earlier one.
  const announce = (info, messages) => {
    if (!info) return
    if (lastPhase === info.phase || isEarlier(info.phase, lastPhase)) return
    lastPhase = info.phase
    onPhase(info, messages)
  }

  let heartbeat
  if (onPhase) {
    heartbeat = setInterval(() => announce(phases.current, phases.messages), phaseIntervalMs)
  }

  const failure = new Promise((_, reject) => {
    child.once('error', error => reject(Object.assign(error, { code: 'SPAWN_FAILED' })))
    child.once('exit', (code, sig) => {
      if (server.running === false) return
      reject(Object.assign(new Error(`llama-server exited during load (code=${code} signal=${sig})\n${server.diagnostic}`), { code: 'LOAD_FAILED' }))
    })
  })

  try {
    await Promise.race([waitForHealthy(server, { healthTimeoutMs, signal, onLog }), failure])
  } catch (error) {
    // Cleared on both paths: a live interval would hold the event loop open for
    // as long as the process lived, which on a failed load means the app never
    // becomes idle again.
    if (heartbeat) clearInterval(heartbeat)
    await server.stop().catch(() => {})
    throw error
  }
  if (heartbeat) clearInterval(heartbeat)
  return server
}

/** Poll /health until the server reports a loaded model, the child dies, or the budget expires. */
async function waitForHealthy(server, { healthTimeoutMs, signal, onLog }) {
  const deadline = Date.now() + healthTimeoutMs
  let lastReport = 0
  let lastError
  while (Date.now() < deadline) {
    if (!server.running) {
      throw Object.assign(new Error(`llama-server exited during load\n${server.diagnostic}`), { code: 'LOAD_FAILED' })
    }
    if (signal?.aborted) throw Object.assign(new Error('load cancelled'), { code: 'ABORTED' })
    try {
      const response = await fetch(`${server.baseURL}/health`, { signal: AbortSignal.timeout(2000) })
      const body = await response.json().catch(() => ({}))
      const status = body?.status
      if (status === 'ok') {
        onLog({ stream: 'info', text: `model ready on port ${server.port}` })
        return
      }
      if (status === 'error') {
        throw Object.assign(new Error(`llama-server reported a load error\n${server.diagnostic}`), { code: 'LOAD_FAILED' })
      }
      lastError = status
    } catch (error) {
      if (error?.code === 'LOAD_FAILED') throw error
      lastError = error?.message ?? String(error)
    }
    if (Date.now() - lastReport > 15_000) {
      lastReport = Date.now()
      onLog({ stream: 'info', text: `still loading (${lastError ?? 'starting'})` })
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw Object.assign(new Error(`timed out waiting for llama-server to load the model\n${server.diagnostic}`), { code: 'LOAD_TIMEOUT' })
}


