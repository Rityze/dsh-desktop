import { statSync } from 'node:fs'
import { join } from 'node:path'
import { scanModels, readGgufHeader, existsAsFile, resolveCapability } from './gguf.js'
import { launchLlamaServer } from './server.js'
import { LoadPhaseTracker, phaseProgress, UNSTARTED_PHASE } from './load-phase.js'

/**
 * The context window a model gets when the user has not chosen one.
 *
 * Not the model's trained maximum: a GGUF that declares 256K invites a KV cache
 * sized for 256K, and that allocation happens on every load whether or not the
 * conversation will ever approach it. A default has to be survivable by
 * accident — large enough for a working session and a tool-call chain, small
 * enough that no one pays for it without deciding to. Unlike the ceiling, this
 * value is also a real target: 8192 is within reach of every model this app can
 * load, whereas the ceiling is a capability, not a use.
 */
/**
 * The window a load gets when the user has said nothing.
 *
 * Sized against the smallest thing that has to fit in it: the system prompt this
 * application sends. Measured, that prompt is **32,685 tokens** — it carries the
 * tool list, the safety rules and the agent instructions — and a window below it
 * makes every request fail before the model sees a word of the conversation:
 *
 *     request (32685 tokens) exceeds the available context size (16384 tokens)
 *
 * The earlier value was 8192, chosen when the engine's own prompt was smaller.
 * That number is not a preference here; it is a floor, and one that has to move
 * with the prompt it exists to hold. 32768 is that floor rounded up to a power of
 * two with room for a short exchange on top.
 *
 * This is a *default*, not a ceiling — the model's own `contextLength` is often
 * far larger (202,752 on the model measured here), and the parameter panel is
 * where it grows. The comment in `load-options.js` explains why the schema's
 * default must equal this one.
 */
export const DEFAULT_CONTEXT_LENGTH = 32768

/**
 * Owns every managed llama-server process and the provider routes they serve.
 *
 * Exactly one model is loaded at a time — the target GPU holds one of these
 * weights, and llama.cpp will happily start a second process that then fails on
 * memory, so the manager replaces rather than accumulates. A route exists only
 * while its process does, which is what makes "load a model, then chat with it"
 * immediate and free of any configuration write.
 */
export class LocalModelManager {
  #servers = new Map()
  #registration
  #registrationOwner
  #adapter
  #AdapterClass
  #routeName
  #loading
  #log
  #loadOptions
  #modelRoot

  #catalog = []
  #scanRoot
  #scanAt = 0
  #scanning

  constructor({ routeName = 'aranllm-local', log = () => {}, loadOptions, modelRoot } = {}) {
    this.#routeName = routeName
    this.#log = log
    this.#loadOptions = loadOptions
    this.#modelRoot = modelRoot
  }

  /**
   * Remembered capability overrides for one model, injected by the host.
   *
   * A callback rather than a store, so the manager keeps owning no
   * configuration: the desktop main process reads its JSON file and the
   * harness plugin reads its settings scope, and neither shape leaks in here.
   * @type {((model: object) => object) | undefined}
   */
  capabilityOverrides

  /**
   * Load options for an implicit load (a picker selection that is not yet
   * running). Comes from the plugin config so the binary path and defaults
   * apply without the caller repeating them.
   */
  defaultLoadOptions() {
    return this.#loadOptions?.() ?? {}
  }

  /**
   * The harness-facing adapter, built on first use.
   *
   * `adapter.js` extends the harness `LlmAdapter`, so importing it eagerly
   * would pull `@deepseek-ai/dsh-llm` into every consumer — including the
   * desktop main process, which owns the llama-server lifecycle but serves
   * the models to MiMo over HTTP and never speaks the harness vocabulary.
   * The import is deferred to here so that path pays nothing for it.
   */
  get adapter() {
    if (!this.#adapter) {
      if (!this.#AdapterClass) {
        throw new Error('The harness adapter was requested before attach() loaded it.')
      }
      this.#adapter = new this.#AdapterClass(this, this.#routeName)
    }
    return this.#adapter
  }
  get routeName() { return this.#routeName }

  /**
   * The language effort names are rendered in.
   *
   * Set by whichever host owns the adapter: the desktop main process knows the
   * application's locale, the harness plugin knows its own. Defaults to Chinese
   * because the shipped interface is Chinese, and an effort called "Medium" in
   * a Chinese selector is the kind of half-translated string this exists to
   * avoid.
   */
  language = 'zh'

  /** The live model on a route, or undefined. Shape is what the adapter reads. */
  loaded(route) {
    if (route !== this.#routeName) return undefined
    const entry = this.#servers.get(route)
    if (!entry?.server.running) return undefined
    // Resolved on read, for the same reason the catalog is: the entry's
    // capabilities were computed when the model was loaded, and a switch flipped
    // afterwards has to reach the chat picker without a reload. The process it
    // describes is untouched — only what the interface offers about it changes.
    return this.#withOverrides(entry)
  }

  /** Every running server, for shutdown and diagnostics. */
  get active() {
    return [...this.#servers.values()].map(entry => ({
      modelId: entry.modelId,
      modelName: entry.modelName,
      port: entry.server.port,
      pid: entry.server.pid,
      startedAt: entry.server.startedAt,
      contextLength: entry.contextLength,
    }))
  }

  /**
   * Load one model, replacing whatever is currently loaded.
   *
   * The previous process is stopped and awaited before the next starts: the GPU
   * memory must be released first, and a race here is the difference between a
   * clean load and an out-of-memory failure.
   */
  async load({ model, options = {}, signal }) {
    // The snapshot is published before the first await, not after it. `load` is
    // async and the binary check yields, so a UI that polls as soon as it calls
    // would otherwise see an empty progress object for the whole duration of
    // that check — reading, correctly, as "the click did nothing".
    const startedAt = Date.now()
    // The tracker lives here rather than inside launchLlamaServer because it
    // has to outlive the load: the phase the UI shows after this promise
    // resolves is `ready`, and a tracker owned by the launch would be gone by
    // the time the first poll arrives.
    const tracker = new LoadPhaseTracker(startedAt)
    this.#loading = { modelId: model.id, modelName: model.name, startedAt, tracker, bytes: model.bytes }

    try {
      if (options.binary && !await existsAsFile(options.binary)) {
        throw Object.assign(new Error(`llama-server binary not found: ${options.binary}`), { code: 'BINARY_MISSING' })
      }
      this.#log({ stream: 'info', text: `loading ${model.name} (${model.id})` })
      await this.unload({ reason: 'replaced by a new load' })

      const server = await launchLlamaServer({
        binary: options.binary,
        modelPath: model.path,
        onLog: this.#log,
        // The tracker owns the phase and the trail; the handler only has to keep
        // the manager's snapshot live, which happens because `#loading` holds
        // that same tracker. Logging the transition is what makes a load
        // diagnosable after the fact from the request log.
        onPhase: (info) => {
          this.#log({ stream: 'info', text: `load phase: ${info.phase} (${info.atMs}ms) ${info.detail ?? ''}`.trim() })
        },
        tracker,
        signal,
        // The full option surface is forwarded rather than enumerated: every
        // field the load UI can set has to reach the argument builder, and a
        // whitelist here is a silent-drop bug waiting to happen.
        //
        // The context length is defaulted to something modest rather than to
        // the model's own ceiling. `model.contextLength` is what the GGUF
        // declares it was *trained* for — often 128K or 256K — and using it as
        // the default would allocate a KV cache for a window nobody asked for:
        // gigabytes of VRAM spent before the first token, on every load, by a
        // user who never touched the setting. A window the user did not choose
        // should be small enough to be free and large enough to be useful; the
        // panel is where it grows.
        options: {
          ...options,
          contextLength: options.contextLength ?? DEFAULT_CONTEXT_LENGTH,
          mmprojPath: options.mmprojPath ?? model.mmproj,
          speculative: resolveSpeculative(options.speculative, model),
        },
      })

      // Overrides are applied here, not at scan time, so a model whose vision
      // verdict the user just corrected is loaded with the correction even
      // though the catalog entry it came from was cached before the change.
      const effective = this.#withOverrides(model)
      const entry = {
        server,
        modelId: model.id,
        modelName: model.name,
        // Kept in the catalog entry's own spelling as well as `modelName`:
        // `configKey` identifies a model by name and byte size, so an entry
        // that carries neither would resolve its overrides under a different
        // key than the settings page wrote them under — and a switch flipped
        // while the model was loaded would silently not apply.
        name: model.name,
        bytes: model.bytes,
        path: model.path,
        description: `${model.architecture ?? 'unknown'} · ${formatBytes(server ? model.bytes : 0)}${effective.multimodal ? ' · multimodal' : ''}`,
        // What the server was actually started with, which is the same fallback
        // the argument builder received. Reporting the model's ceiling here
        // would describe a window that no process is serving.
        contextLength: options.contextLength ?? DEFAULT_CONTEXT_LENGTH,
        defaultMaxTokens: options.defaultMaxTokens,
        multimodal: effective.multimodal,
        apiKey: options.apiKey,
        // The evidence-based capability set, carried on the entry so the
        // adapter can answer `resolveModel` without re-reading the header: the
        // GGUF is tens of gigabytes and its metadata is already in hand here.
        capabilities: effective.capabilities,
      }
      this.#servers.set(this.#routeName, entry)
      this.#refreshRoutes()
      // The tracker is handed to the entry so a poll that arrives after the
      // load finished still gets a terminal phase instead of an empty progress
      // object — the UI would otherwise flash back to "starting" exactly as the
      // model becomes usable.
      entry.tracker = tracker
      this.#log({ stream: 'info', text: `model ready: ${model.name} on port ${server.port}` })
      return this.#describe(entry)
    } finally {
      // Kept, not cleared: the last snapshot is what the UI renders while the
      // ready state settles. It is discarded on the next load and on unload.
      this.#loading = undefined
    }
  }

  /** Stop the managed server and withdraw its route. */
  async unload({ reason = 'requested' } = {}) {
    const entry = this.#servers.get(this.#routeName)
    if (!entry) return false
    this.#log({ stream: 'info', text: `unloading ${entry.modelName} (${reason})` })
    this.#servers.delete(this.#routeName)
    this.#refreshRoutes()
    // The entry carries the tracker, so deleting it here is what retires the
    // phase: a `ready` that outlived its model would tell the UI a load had
    // finished while nothing is running.
    await entry.server.stop()
    return true
  }

  /** Stop every managed server; called when the plugin is disposed. */
  async shutdown() {
    for (const [route, entry] of [...this.#servers]) {
      this.#servers.delete(route)
      await entry.server.stop().catch(error => this.#log({ stream: 'warn', text: `failed to stop ${entry.modelName}: ${error.message}` }))
    }
    this.#refreshRoutes()
  }

  /**
   * Current load progress, for a UI that polls while a large model loads.
   *
   * Reports the phase tracker's view alongside the clock. The clock alone says
   * how long ago the load began and nothing about what it is doing, which for
   * the ~18 silent seconds of a cold 27B load is indistinguishable from a hang;
   * the phase is what turns that silence into "reading weights".
   *
   * While a load is running the live tracker is used; once it finishes, the
   * tracker kept on the loaded entry answers, so a late poll still reads as
   * `ready` rather than as nothing happening at all.
   */
  get progress() {
    const loading = this.#loading
    if (loading) {
      const phase = loading.tracker.current
      return {
        modelId: loading.modelId,
        modelName: loading.modelName,
        startedAt: loading.startedAt,
        elapsedMs: Date.now() - loading.startedAt,
        bytes: loading.bytes,
        phase: phase?.phase ?? UNSTARTED_PHASE,
        phaseAtMs: phase?.atMs,
        phaseDetail: phase?.detail,
        // The position of the phase in the sequence, not a measurement of
        // completion. See load-phase.js: llama.cpp publishes no byte count.
        progress: phaseProgress(phase?.phase ?? UNSTARTED_PHASE),
      }
    }
    const live = this.loaded(this.#routeName)
    if (!live?.tracker) return undefined
    const phase = live.tracker.current
    return {
      modelId: live.modelId,
      modelName: live.modelName,
      startedAt: live.server.startedAt,
      elapsedMs: Date.now() - live.server.startedAt,
      bytes: undefined,
      phase: phase?.phase ?? 'ready',
      phaseAtMs: phase?.atMs,
      phaseDetail: phase?.detail,
      progress: 1,
    }
  }

  describe() {
    const entry = this.loaded(this.#routeName)
    return entry ? this.#describe(entry) : undefined
  }

  #describe(entry) {
    return {
      modelId: entry.modelId,
      modelName: entry.modelName,
      path: entry.path,
      port: entry.server.port,
      pid: entry.server.pid,
      contextLength: entry.contextLength,
      multimodal: entry.multimodal,
      startedAt: entry.server.startedAt,
      baseURL: entry.server.baseURL,
      // Surfaced so the settings section can show what the loaded model
      // actually supports, rather than only what the picker offered.
      capabilities: entry.capabilities,
    }
  }

  /**
   * Keep the route registered for the whole plugin lifetime.
   *
   * It deliberately does not track the live process: the picker needs the
   * route present to list on-disk models and to resolve a not-yet-loaded
   * selection, and the adapter reports emptiness itself. Withdrawing the
   * route here would make the local provider vanish from the picker whenever
   * nothing was loaded, which is exactly the state a fresh launch is in.
   */
  #refreshRoutes() {
    if (!this.#registrationOwner) return
    if (!this.#registration) {
      this.#registration = this.#registrationOwner.registerAdapter([this.#routeName], this.adapter)
      return
    }
    this.#registration.replace([this.#routeName])
  }

  /**
   * The on-disk model index the picker lists.
   *
   * The route is permanent, so the picker must show every discoverable model
   * even before one is loaded - that is what makes "click a model, confirm,
   * then chat" possible without a second trip to a settings page. Scans are
   * throttled and shared so a burst of catalog reads does not re-walk a large
   * model tree, and a failed scan keeps the previous index rather than
   * emptying the list.
   */
  /**
   * Forget how recently the catalog was read, so the next read rescans.
   *
   * The window `catalog` keeps (five seconds by default) exists so a burst of
   * reads — a page polling, several components mounting — does not re-walk a
   * large model tree each time. It is the wrong answer for exactly one caller: something
   * that has just *changed* the tree. A download that has finished writing a
   * multi-gigabyte file knows the index is stale, and waiting out a timer it
   * cannot see is how "it downloaded but the model list does not show it"
   * happens.
   *
   * Only the timestamp is cleared, not `#catalog`. A scan that fails keeps the
   * previous index rather than emptying the list, and that property has to hold
   * here too — discarding the entries up front would turn a transient scan
   * error into a list that goes blank.
   */
  invalidateCatalog() {
    this.#scanAt = 0
  }

  async catalog(root, { maxAgeMs = 5000 } = {}) {
    if (this.#scanRoot !== root) { this.#catalog = []; this.#scanAt = 0; this.#scanRoot = root }
    if (this.#scanning) return this.#scanning
    if (this.#catalog.length && Date.now() - this.#scanAt < maxAgeMs) return this.#catalog
    this.#scanning = (async () => {
      try {
        const found = await scanModels(root)
        this.#catalog = found
        this.#scanAt = Date.now()
        this.#log({ stream: 'info', text: `catalog: ${found.length} model(s) under ${root}` })
      } catch (error) {
        this.#log({ stream: 'warn', text: `catalog scan failed: ${error.message}` })
      } finally {
        this.#scanning = undefined
      }
      return this.#catalog
    })()
    return this.#scanning
  }

  /** Set the scan root; a Settings edit calls this so the next scan sees the new folder. */
  set modelRoot(root) { this.#modelRoot = root }

  get modelRoot() { return this.#modelRoot }

  /**
   * Ensure the on-disk index is populated before the picker reads it, with
   * capability overrides applied.
   *
   * listModels is synchronous in spirit but the catalog is not: a fresh launch
   * has never scanned, so without this the local provider would list zero models
   * and the chat picker would look empty. Scanning here is what makes local
   * models visible the first time the menu opens, with no separate settings visit.
   *
   * The overrides belong here rather than at the call site because this is the
   * chat picker's path: without them a model the user has marked as
   * vision-capable would still be offered as text-only in the composer while
   * Settings showed images as enabled — the same model, two answers.
   */
  async ready() {
    if (!this.#modelRoot) return this.#catalog.map(entry => this.#withOverrides(entry))
    return this.catalogWithOverrides(this.#modelRoot)
  }

  /**
   * The cached index with overrides applied, for the synchronous projection.
   *
   * A getter rather than a stored array, because applying overrides is the
   * whole point of this accessor and a caller reading the raw scan here would
   * get the file's verdict while every other path reports the user's.
   */
  get catalogSnapshot() {
    return this.#catalog.map(entry => this.#withOverrides(entry))
  }

  /**
   * One indexed model by id, for load-by-id without a fresh scan.
   *
   * Overrides applied, so a caller that inspects the entry sees the same
   * capabilities the load itself will act on.
   */
  find(modelId) {
    const entry = this.#catalog.find(item => item.id === modelId)
    return entry ? this.#withOverrides(entry) : undefined
  }

  /**
   * Remembered capability overrides for one model, or an empty object.
   *
   * Supplied by whichever host owns the settings store. Read *after* the scan
   * rather than baked into it, because the scan is cached for seconds and an
   * override a user just changed has to be visible immediately — a cached
   * verdict would make the toggle look broken until the cache expired.
   */
  #overridesFor(model) {
    try {
      return this.capabilityOverrides?.(model) ?? {}
    } catch {
      return {}
    }
  }

  /**
   * One catalog entry with its capability overrides applied.
   *
   * Both overridable capabilities go through the same path, because the failure
   * mode when they do not is invisible: the toggle renders, the value persists,
   * and nothing reads it. Reasoning was in exactly that state — stored, shown,
   * and ignored — while vision worked, which is why this is a loop rather than
   * two copies of the same block.
   *
   * For each one the raw inference is kept alongside the resolved value —
   * `inferredVision` against `vision` — so the settings section can show what
   * the file claims next to what the user chose, and can offer "auto" as a
   * return path. The flag the interface actually acts on is the resolved one.
   *
   * Idempotent: the `inferred*` field is preferred over the resolved one as the
   * input, so running this on an already-overridden entry keeps resolving
   * against the file rather than against the previous override. That matters
   * because `find()` and `catalogSnapshot` hand out overridden entries which
   * `load()` then runs through here a second time — without it, "on" would
   * launder itself into looking like the file's own answer.
   */
  #withOverrides(entry) {
    const overrides = this.#overridesFor(entry)
    const inferred = entry.capabilities ?? {}
    const capabilities = { ...inferred }

    for (const [name, overrideKey] of [
      ['vision', 'visionOverride'],
      ['reasoning', 'reasoningOverride']
    ]) {
      const raw = typeof inferred[`inferred${capitalize(name)}`] === 'boolean'
        ? inferred[`inferred${capitalize(name)}`]
        : inferred[name]
      const resolved = resolveCapability(raw, overrides[overrideKey])
      capabilities[name] = resolved.value
      capabilities[`${name}Overridden`] = resolved.overridden
      capabilities[`inferred${capitalize(name)}`] = Boolean(raw)
    }

    return {
      ...entry,
      // `multimodal` is the flag the picker and loader read, so it follows the
      // vision override too — otherwise the settings row and the chat picker
      // would disagree about the same model.
      multimodal: capabilities.vision,
      capabilities
    }
  }

  /**
   * The catalog with overrides applied, for callers that render or load it.
   *
   * `source` is for tests of the idempotence property. Production callers name
   * a root and let the scan supply the entries; a test that needs to feed the
   * layer its own output has no other way in, short of standing up a real
   * llama-server through `load()`.
   */
  async catalogWithOverrides(root, options = {}) {
    const { source, ...scanOptions } = options
    const entries = source ?? (await this.catalog(root, scanOptions))
    return entries.map(entry => this.#withOverrides(entry))
  }

  /** Load a model by id, scanning first when the index has not seen it. */
  async loadById(modelId, { root, options = {}, signal } = {}) {
    await this.catalog(root)
    const model = this.find(modelId)
    if (!model) throw Object.assign(new Error(`Model not found on disk: ${modelId}`), { code: 'MODEL_MISSING', status: 404 })
    return this.load({ model, options, signal })
  }

  /** Attach the manager to the llm registry; called once from the plugin. */
  async attach(llm) {
    // Loaded here rather than at module scope so that a host which never
    // attaches — the desktop main process — does not resolve the harness
    // packages at all.
    if (!this.#AdapterClass) {
      const { LlamaServerAdapter } = await import('./adapter.js')
      this.#AdapterClass = LlamaServerAdapter
    }
    this.#registrationOwner = llm
    this.#refreshRoutes()
  }

  detach() {
    this.#registration?.()
    this.#registration = undefined
    this.#registrationOwner = undefined
  }
}

/** Speculative decoding defaults to the model's own MTP weights, which need no draft file. */
function resolveSpeculative(speculative, model) {
  if (!speculative || speculative.type === 'none') return { type: 'none' }
  if (speculative.type === 'draft-simple') {
    const draft = speculative.draftModelPath ?? model.draft
    if (!draft) return { type: 'none' }
    return { ...speculative, draftModelPath: draft }
  }
  return speculative
}

/**
 * `vision` → `Vision`, for building the `inferred*` field names.
 *
 * The raw inference is stored under a name derived from the capability's, so
 * that adding a capability does not mean inventing a second naming convention
 * for the same idea.
 */
function capitalize(name) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'unknown size'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1 }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

/**
 * The llama-server build that ships with the application, discovered without
 * the user typing a path.
 *
 * AranLLM bundles a patched llama.cpp fork under `vendor/llama.cpp` because the
 * stock build lacks the ROCmFP4 weight path and the MTP (nextn) speculative
 * decoding this machine's models rely on. A bundled build is therefore always
 * preferred over anything on PATH, and the search walks outwards from the
 * process so development, packaged and harness-cwd launches all resolve.
 *
 * @returns an absolute path to llama-server(.exe), or an empty string.
 */
export function discoverLlamaServer() {
  const name = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'
  const bases = [
    process.env.ARANLLM_LLAMA_SERVER_DIR,
    process.env.ARANLLM_INSTALL_ROOT,
    process.env.DSH_DESKTOP_APP_ROOT,
    process.cwd(),
    join(process.cwd(), '..'),
    join(process.cwd(), '..', '..'),
  ].filter(Boolean)
  const relatives = [
    ['vendor', 'llama.cpp'],
    ['vendor', 'llama.cpp', 'build', 'bin'],
    ['resources', 'vendor', 'llama.cpp'],
    ['..', 'vendor', 'llama.cpp'],
    ['..', '..', 'vendor', 'llama.cpp'],
  ]
  for (const base of bases) {
    for (const parts of relatives) {
      const candidate = join(base, ...parts, name)
      try {
        if (statSync(candidate).isFile()) return candidate
      } catch {
        // Not here: keep looking. A missing candidate is the common case.
      }
    }
  }
  return ''
}

/**
 * The `models` folder that ships beside the application.
 *
 * AranLLM keeps a drop-in library next to the executable so a fresh install is
 * usable without a settings visit; DSH_DESKTOP_APP_ROOT is set by the Electron
 * host, while the `..` walk covers the harness cwd (`launch-root`) for
 * packaged and development launches alike.
 * @returns the install-root models folder, or an empty string when unknown.
 */
export function packagedModelsRoot() {
  const fromEnv = process.env.ARANLLM_INSTALL_ROOT ?? process.env.DSH_DESKTOP_APP_ROOT
  const bases = []
  if (fromEnv) bases.push(fromEnv)
  bases.push(process.cwd(), join(process.cwd(), '..'), join(process.cwd(), '..', '..'))
  for (const base of bases) {
    if (!base) continue
    const candidate = join(base, 'models')
    try {
      if (statSync(candidate).isDirectory()) return candidate
    } catch {
      // Not present: keep looking. A missing default root is normal.
    }
  }
  return ''
}

/**
 * Resolve the models roots used before the user picks their own.
 *
 * Precedence is explicit override first, then the install-root library that
 * ships with the application, then `D:\models` on Windows. The setting always
 * wins once the user edits it, so this only decides the initial value.
 *
 * **The bundled folder is the default library.** It ships beside the
 * application, so a fresh install has somewhere to put a model and somewhere to
 * read one from without a settings visit — and it is the folder downloads are
 * written to on first run (`download.ts` takes the first writable root).
 *
 * `D:\models` is a convenience for a collection that already exists there, not
 * the default. It is last on purpose: on a machine where it does not exist it
 * simply scans to nothing, and on one where it does, a user who wants it can
 * point the setting at it — which is what makes it their choice rather than
 * this function's.
 * @returns candidate roots, most likely first.
 */
export function defaultModelRoots() {
  const candidates = [process.env.ARANLLM_MODELS, packagedModelsRoot()]
  if (process.platform === 'win32') candidates.push('D:\\models')
  return [...new Set(candidates.filter(Boolean))].join(';')
}

/**
 * The directory the plugin keeps its own state in (remembered per-model load
 * options, request logs).
 *
 * It sits beside the models library rather than in the OS user profile so that
 * a portable install carries its tuning with it, and it is overridable by the
 * same env var used for the library root.
 */
export function defaultDataDir() {
  const explicit = process.env.ARANLLM_DATA_DIR
  if (explicit) return explicit
  const models = packagedModelsRoot()
  if (models) return join(models, '..', 'data')
  return join(process.cwd(), 'data')
}

/** Back-compat alias kept for callers that expected a single root. */
export function defaultModelsRoot() {
  return defaultModelRoots()
}

/** Re-exported so the plugin can describe a model without reading its header twice. */
export { scanModels, readGgufHeader }
