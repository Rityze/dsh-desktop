/**
 * The local model page's main-process half.
 *
 * AranLLM ships llama.cpp and can run a model on this machine, but never does so
 * on its own: a load happens only when a user clicks one. That is a deliberate
 * constraint rather than a default — multi-gigabyte weights loaded at launch
 * would make opening the app cost GPU memory the user never asked to spend, and
 * on a laptop it is the difference between a responsive window and a fan at full
 * speed.
 *
 * The manager itself is the one that shipped with the engine, reused rather than
 * reimplemented. It already owns the parts that are hard to get right — one
 * process at a time because the GPU has one set of weights, releasing memory
 * before the next load, mapping llama.cpp's log lines onto load phases, keeping
 * the last phase so a poll that arrives a moment late still reads `ready`. What
 * is written here is the wiring: where the models live, which binary to run, and
 * how the result becomes a model the chat pane can pick.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { availableParallelism } from 'node:os'
import { LocalModelManager, defaultModelRoots, discoverLlamaServer, defaultDataDir, formatBytes } from '../lib/manager.js'
import { DEFAULT_SERVER_PORT } from '../lib/server.js'
import { parseModelRoots } from '../lib/gguf.js'
import { ModelConfigStore, modelConfigFile } from '../lib/model-config.js'
import { readSetting, writeSetting } from './hub'
import {
  LOAD_PARAMETER_GROUPS,
  normalizeLoadOptions
} from '../lib/load-options.js'

/** One model as the page lists it. A projection of the scanner's entry. */
export type LocalModelEntry = {
  id: string
  name: string
  path: string
  directory: string
  architecture?: string
  contextLength?: number
  /** How many layers the file has, which is the scale GPU offload is measured on. */
  blockCount?: number
  sizeLabel?: string
  quantization?: string
  bytes: number
  /** The formatted size, so the page does not repeat the arithmetic. */
  humanSize: string
  multimodal: boolean
  hasMtp: boolean
}

/** Where a load has got to. `progress` is a phase position, not a completion. */
export type LocalLoadProgress = {
  modelId: string
  modelName: string
  elapsedMs: number
  phase: string
  phaseDetail?: string
  /** 0..1 across the five phases. See `load-phase.js`: llama.cpp reports no bytes. */
  progress: number
}

export type LocalLoadedModel = {
  modelId: string
  modelName: string
  path: string
  port: number
  baseURL: string
  contextLength?: number
  multimodal: boolean
  /**
   * What the loaded file's own template says it can do.
   *
   * Surfaced because the engine has to be told whether the model thinks before
   * it will offer the composer's levels: `capabilities.reasoning` is what the
   * local gateway's model entry carries as `reasoning`, and that flag is what
   * the encoder writes the level table under. A model whose template has no
   * thinking branch reports `false` here and gets no picker that does nothing.
   */
  capabilities?: { reasoning?: boolean } & Record<string, unknown>
}

export type LocalModelsSnapshot = {
  /** Where the scan looked. Several roots are possible, so it is the raw spec. */
  root: string
  /** Directories the spec resolved to, for display. */
  roots: string[]
  /** The llama-server executable that would be used, or undefined if missing. */
  binary?: string
  /** True while the on-disk index is being built. */
  scanning: boolean
  models: LocalModelEntry[]
  loaded?: LocalLoadedModel
  progress?: LocalLoadProgress
}

type ScannerModel = {
  id: string
  name: string
  path: string
  directory: string
  architecture?: string
  contextLength?: number
  blockCount?: number
  sizeLabel?: string
  quantization?: string
  bytes: number
  multimodal?: boolean
  hasMtp?: boolean
}

/*
 * The tuning a user has saved for a model file.
 *
 * Keyed by name-plus-size rather than by path (see `configKey`), so moving the
 * library folder keeps the settings and re-quantizing the same model name does
 * not silently inherit them. The manager reads it through `loadOptions` below,
 * which is why the store has to be built before the manager.
 */
const configs = new ModelConfigStore({ file: modelConfigFile(defaultDataDir()) })

/*
 * Which model the next implicit load is for.
 *
 * `LocalModelManagerOptions.loadOptions` is a zero-argument callback, because
 * the harness host reads its options from plugin config rather than from a
 * per-file record. This application does the opposite — every model has its own
 * saved tuning — so the callback needs to know which model is being loaded, and
 * the only place that is known is inside `loadLocalModel`. Set immediately
 * before the call and cleared after; nothing else loads a model.
 */
let pendingLoadOptions: Record<string, unknown> | undefined

/*
 * Where the manager's own log goes.
 *
 * Set by the caller rather than imported, because this module is deliberately
 * free of Electron: it is the one that knows nothing about windows, and giving
 * it an `app` import to write a log line would trade that for a convenience.
 *
 * The stream is filtered before it is handed over — see `forwardManagerLog`.
 */
let logSink: ((line: string) => void) | undefined

/** Point the manager's log at a writer. Called once, from `kernel.ts`. */
export function configureLocalModelLog(sink: (line: string) => void): void {
  logSink = sink
}

/**
 * The manager's log, filtered.
 *
 * A weight read is tens of thousands of llama.cpp lines, so only the four kinds
 * that say what is happening are forwarded: the load's start, its phase
 * transitions, its completion, and anything at warn or error.
 *
 * This used to be dropped entirely, on the reasoning that the page shows the
 * load phases. That reasoning held while a load progressed and failed
 * completely when one did not — a stalled load produces no phase change, so the
 * one piece of evidence about where it stopped was the stream that had been
 * thrown away. Measured: a model whose process was up and answering `/health`
 * while the load never returned, and nothing in any log said which step it was
 * in.
 */
function forwardManagerLog(entry: { stream?: string; text?: string }): void {
  const text = entry?.text?.trim()
  if (!text) return
  const worthKeeping =
    text.startsWith('load phase:') ||
    text.startsWith('loading ') ||
    text.startsWith('model ready:') ||
    text.startsWith('still loading') ||
    text.includes('model ready on port') ||
    /*
     * The memory projection, which llama.cpp prints once per load.
     *
     * Kept because it is the only place the fitter's own answer exists — how
     * much device memory the load is expected to take, and whether it needed to
     * adjust anything to fit. A handful of lines per load, and the alternative
     * is computing a second, worse estimate on this side.
     */
    text.includes('projected to use') ||
    text.includes('will leave') ||
    text.includes('available device memory') ||
    text.includes('KV buffer size') ||
    text.includes('model buffer size') ||
    entry.stream === 'warn' ||
    entry.stream === 'error'
  if (!worthKeeping) return
  logSink?.(text)
}


/* ── The listening port ───────────────────────────────────────────────────── */

/**
 * Where the port choice is kept.
 *
 * Beside the per-model tuning rather than in the renderer's storage: the port is
 * read by the *main* process when it launches llama-server and again when it
 * tells the engine where to connect, and neither of those runs in a page.
 */
function portFile(): string {
  return join(defaultDataDir(), 'server-port.json')
}

/**
 * The port a managed server listens on.
 *
 * Configurable because the default can be taken, and on this machine it was:
 * measured, a chat client held `0.0.0.0:8082` and the model server could not be
 * reached through the loopback address it had successfully bound. The
 * alternative — telling the user to close the other program — makes this
 * application's local-model feature depend on what else they happen to be
 * running.
 *
 * Changing it requires a restart of the engine, because the engine reads the
 * address once at launch and holds it. `setLocalPort` exists for that: the
 * caller changes the port and then restarts the engine, which is the same step a
 * model load already performs through `syncLocalModelToEngine`.
 */
export function localPort(): number {
  try {
    const raw = JSON.parse(readFileSync(portFile(), 'utf8')) as { port?: unknown }
    const port = Number(raw?.port)
    if (Number.isInteger(port) && port > 1024 && port < 65536) return port
  } catch {
    /* No file yet, or an unreadable one: the default is the answer. */
  }
  return DEFAULT_SERVER_PORT
}

/** Remember a port. The caller restarts the engine afterwards. */
export function setLocalPort(port: number): { ok: boolean; port: number; error?: string } {
  if (!Number.isInteger(port) || port <= 1024 || port >= 65536) {
    return { ok: false, port: localPort(), error: '端口要在 1025 到 65535 之间。' }
  }
  try {
    mkdirSync(defaultDataDir(), { recursive: true })
    writeFileSync(portFile(), JSON.stringify({ port }), 'utf8')
    return { ok: true, port }
  } catch (cause) {
    return {
      ok: false,
      port: localPort(),
      error: cause instanceof Error ? cause.message : String(cause)
    }
  }
}

export const manager = new LocalModelManager({
  routeName: 'aranllm-local',
  log: forwardManagerLog,
  /*
   * The port is merged **last**, so it wins over anything else that names one.
   *
   * It is an application-level setting, not per-model tuning: the engine is told
   * this address once at launch and holds it, so a stored per-model value that
   * disagreed would point the engine at a socket nothing is listening on. Spread
   * first, it would lose to such a value — measured, a load refused with
   * "端口 8082 已被占用" while the port had been changed to 18082.
   */
  /*
   * The options an implicit load runs with.
   *
   * ## Why the binary is discovered here rather than only in `loadLocalModel`
   *
   * This callback feeds `defaultLoadOptions()`, which is what an on-demand load
   * uses — a request for a model that is not the one running. That path never
   * goes through `loadLocalModel`, so it never receives the `pendingLoadOptions`
   * that function builds, and the binary it would otherwise inherit is simply
   * absent. Measured: choosing a local model in the chat window failed with
   * `llama-server binary not found: undefined`, while loading the same model
   * from the settings page worked.
   *
   * Discovering it here as well is cheap — a handful of `statSync` calls — and
   * it is the same value, read from the same environment the plugin sets at
   * import. The stored tuning still wins where it is present, and the port still
   * wins over everything: it is what the engine was told to expect.
   */
  loadOptions: () => ({
    ...(pendingLoadOptions ?? {}),
    binary: pendingLoadOptions?.binary ?? discoverLlamaServer() ?? undefined,
    port: localPort(),
  }),
  modelRoot: defaultModelRoots()
})

let scanning = false
let loadAbort: AbortController | undefined

/**
 * The folder a settings edit chose, or empty when the user has not chosen one.
 *
 * Persisted, in the same file the hub keeps its source and proxy in — a second
 * settings file for one string would be a second thing to keep in step with the
 * first, and this codebase has already paid for that once (see `writeSetting`).
 *
 * A stored value that no longer resolves to a directory is still returned: the
 * page shows the folder it was set to and the empty catalogue that follows is
 * the honest answer. Silently falling back to the default would hide a library
 * that has been moved or unmounted, which is the state most worth seeing.
 */
function storedRoot(): string {
  const value = readSetting('modelRoot')
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * The model root actually in use.
 *
 * The stored choice wins; without one the defaults apply — and `D:\models` is
 * among them (see `defaultModelRoots`), so a machine with an existing library
 * there needs no configuration at all. That is also the folder downloads are
 * written to, since they resolve their destination through this same function:
 * one setting, not two that have to agree.
 */
function currentRoot(): string {
  const configured = (manager as unknown as { modelRoot?: string }).modelRoot
  if (configured && configured.length > 0) return configured
  const stored = storedRoot()
  return stored.length > 0 ? stored : defaultModelRoots()
}

function toEntry(model: ScannerModel): LocalModelEntry {
  return {
    id: model.id,
    name: model.name,
    path: model.path,
    directory: model.directory,
    architecture: model.architecture,
    contextLength: model.contextLength,
    blockCount: model.blockCount,
    sizeLabel: model.sizeLabel,
    quantization: model.quantization,
    bytes: model.bytes,
    humanSize: formatBytes(model.bytes),
    multimodal: model.multimodal === true,
    hasMtp: model.hasMtp === true
  }
}

/** The snapshot the page renders, assembled from the manager's live state. */
export async function localModelsSnapshot(): Promise<LocalModelsSnapshot> {
  const root = currentRoot()
  const roots = parseModelRoots(root)
  /*
   * Normalised to `undefined` rather than carried as `null`.
   *
   * The scanner answers `null` for "no llama-server found", but the snapshot
   * field is an optional string, and the renderer distinguishes the two states
   * by presence — a `null` would serialise through IPC as a field that is there
   * but empty, which reads as "found a binary with no path".
   */
  const binary = discoverLlamaServer() ?? undefined

  let models: LocalModelEntry[] = []
  if (roots.length > 0) {
    scanning = true
    try {
      const found = (await manager.catalog(root)) as ScannerModel[]
      models = found.map(toEntry)
    } finally {
      scanning = false
    }
  }

  const loaded = manager.describe() as LocalLoadedModel | undefined
  const progress = manager.progress as LocalLoadProgress | undefined

  return {
    root,
    roots,
    binary,
    scanning,
    models,
    ...(loaded ? { loaded } : {}),
    ...(progress ? { progress } : {})
  }
}

/**
 * Point the page at a different folder, and remember it.
 *
 * The manager drops its cached index when the root changes, so the next
 * snapshot re-reads the new tree — no explicit invalidation needed here.
 *
 * **This is also where downloads go**, because `download.ts` resolves its
 * destination through `currentModelRoots()`. One setting rather than two: a
 * separate download folder would have to be kept in agreement with this one,
 * and a user who changed only one of them would download models they cannot
 * then load.
 */
export function setLocalModelRoot(root: string): void {
  const trimmed = root.trim()
  ;(manager as unknown as { modelRoot: string }).modelRoot = trimmed
  writeSetting('modelRoot', trimmed)
}

/**
 * Load one model, by id, from the current root.
 *
 * Every field the load needs is resolved here rather than sent from the page: a
 * caller that names an id cannot choose a binary or a path, so the renderer
 * cannot make the engine execute something it found in a transcript.
 */
export async function loadLocalModel(modelId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const root = currentRoot()
  if (root.length === 0) return { ok: false, error: '还没有设置模型目录。' }

  const binary = discoverLlamaServer()
  if (!binary) return { ok: false, error: '没有找到 llama-server，无法加载模型。' }

  const models = (await manager.catalog(root)) as ScannerModel[]
  const model = models.find((entry) => entry.id === modelId)
  if (!model) return { ok: false, error: '这个模型不在当前目录里，可能已被移动或删除。' }

  // Cancels a previous load rather than letting two race: the manager releases
  // the GPU before starting the next, and a second signal arriving mid-handover
  // would abort the load the user is waiting on.
  loadAbort?.abort()
  const controller = new AbortController()
  loadAbort = controller

  /*
   * The user's saved tuning for this file, coerced into the shape the argument
   * builder reads. `normalizeLoadOptions` is what turns the form's string values
   * into the numbers and nested `speculative` object llama-server expects, so a
   * record written straight from the panel works here without a second pass.
   *
   * `binary` is merged in rather than taken from the record: the executable is
   * discovered per call, and a remembered path would survive the user moving
   * it.
   */
  const saved = (await configs.get(model)) ?? {}
  pendingLoadOptions = { ...normalizeLoadOptions(saved), binary }

  try {
    /*
     * The port is passed explicitly, and it wins over the stored tuning.
     *
     * `local-models.ts` builds the options object itself and hands it to the
     * manager — the manager's own `loadOptions` callback is not consulted on this
     * path. So the application-level port has to be merged here, after the
     * stored per-model values, or a stored one would silently decide where the
     * server listens. Measured: a load refused with "端口 8082 已被占用" while the
     * application's port had already been changed to 18082.
     */
    await manager.load({
      model,
      options: { ...pendingLoadOptions, port: localPort() },
      signal: controller.signal
    })
    return { ok: true }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return { ok: false, error: message }
  } finally {
    if (loadAbort === controller) loadAbort = undefined
    pendingLoadOptions = undefined
  }
}

/** Stop the running model and free its memory. */
export async function unloadLocalModel(): Promise<boolean> {
  loadAbort?.abort()
  loadAbort = undefined
  return manager.unload({ reason: 'user requested' })
}

/** Stop everything. Called when the window closes, so no server outlives the app. */
export async function shutdownLocalModels(): Promise<void> {
  await manager.shutdown()
}

/** The port the loaded model answers on, for the settings bridge. */
export function loadedLocalModel(): LocalLoadedModel | undefined {
  return manager.describe() as LocalLoadedModel | undefined
}

/** Where the manager keeps per-model tuning. Reported by the page's footer. */
export function localModelsDataDir(): string {
  return defaultDataDir()
}

/**
 * The parameter panel's field definitions.
 *
 * Passed through from the package rather than restated here. The panel and the
 * argument builder have to agree on every key — a field the builder does not
 * recognise is a control that silently does nothing — and the only way to keep
 * them in step is for both to read the one declaration.
 */
/**
 * The panel's field schema, with the derived rows filled in.
 *
 * `cpuThreadsNote` is declared as a readonly row and carries no value of its
 * own, because the number it reports is a property of the machine rather than
 * of the model — the schema package cannot know it and the renderer should not
 * be asked to. It is resolved here, at the one point that has both the schema
 * and the host, so the declaration stays the single list of what the panel
 * shows and no control exists without a row behind it.
 */
export function localParameterGroups(): unknown {
  const threads = availableParallelism()
  return LOAD_PARAMETER_GROUPS.map((group) => ({
    ...group,
    fields: group.fields.map((field) =>
      field.type === 'readonly' ? { ...field, derived: threads } : field
    )
  }))
}

/**
 * The saved tuning for one model, as the panel should show it.
 *
 * Values the user has never set are absent rather than filled with the
 * package's defaults, because the two mean different things: absent is "let
 * llama.cpp decide", and the panel draws that as an empty field with the
 * default shown beside it. Writing the defaults in would turn every untouched
 * field into an explicit override the user cannot get back to automatic.
 */
export async function localModelConfig(modelId: string): Promise<Record<string, unknown>> {
  const model = await findModel(modelId)
  if (!model) return {}
  return (await configs.get(model)) ?? {}
}

/**
 * Save the panel's values for one model.
 *
 * A patch rather than a replacement for capabilities: the vision and reasoning
 * overrides are owned by controls elsewhere on the page, and a form that posted
 * only its own fields would clear them on every save.
 */
export async function setLocalModelConfig(
  modelId: string,
  values: unknown
): Promise<{ ok: true; value: Record<string, unknown> } | { ok: false; error: string }> {
  if (typeof values !== 'object' || values === null || Array.isArray(values)) {
    return { ok: false, error: '参数内容无效。' }
  }
  const model = await findModel(modelId)
  if (!model) return { ok: false, error: '这个模型不在当前目录里，可能已被移动或删除。' }

  const normalized = normalizeLoadOptions(values as Record<string, unknown>)
  /*
   * `null` clears a field, `undefined` leaves it alone — the store's own
   * convention. The panel sends `null` for an emptied box so that returning a
   * value to "automatic" is possible; without it a cleared number would come
   * back as `0` and be taken as a deliberate choice.
   */
  const changes: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(normalized)) changes[key] = value
  const saved = (await configs.patch(model, changes)) ?? {}
  return { ok: true, value: saved }
}

/**
 * Look one model up by id in the current root.
 *
 * By id rather than by the path the panel holds, so a stale page cannot ask
 * about a file outside the configured library — the same rule `loadLocalModel`
 * follows, for the same reason.
 */
async function findModel(modelId: string): Promise<ScannerModel | undefined> {
  const root = currentRoot()
  if (root.length === 0) return undefined
  const models = (await manager.catalog(root)) as ScannerModel[]
  return models.find((entry) => entry.id === modelId)
}

export { defaultModelRoots }


/** The configured model roots, as the manager would resolve them. */
export function currentModelRoots(): string[] {
  return currentRoot()
    .split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

/**
 * Mark the model index stale, so the next read rescans.
 *
 * For callers that have changed the tree themselves and know the cached index
 * no longer describes it — a finished download, most of all. See the note on
 * the manager's own method for why the window exists and why clearing the
 * timestamp alone is the right amount to clear.
 */
export function invalidateModelIndex(): void {
  ;(manager as unknown as { invalidateCatalog?: () => void }).invalidateCatalog?.()
}

/**
 * Every model the scanner currently finds.
 *
 * Scanned fresh rather than cached, because the caller uses this to decide
 * whether a path is still the file it was described as — and a cached answer is
 * the answer that was true before whatever change is in question.
 */
export async function localModelEntries(): Promise<ScannerModel[]> {
  const root = currentRoot()
  if (root.length === 0) return []
  const found = (await manager.catalog(root, { maxAgeMs: 0 })) as ScannerModel[]
  return Array.isArray(found) ? found : []
}

/**
 * The sampling settings to give the engine's agents.
 *
 * Read from whichever model the user last tuned, because the agent definition is
 * per-application while the panel that sets it is per-model. The alternative —
 * one global sampling block — would be a second place to set the same number,
 * and the panel is where the user already is when they think about it.
 *
 * Only fields the engine actually reads are returned. `temperature` is the one
 * measured to reach the request through an agent (`llm.ts`); `topP` and the rest
 * are read from the provider SDK's own options and would need an engine change,
 * so passing them would be a value that appears to be applied and is not.
 */
export function localSamplingSettings(): { temperature?: number } {
  try {
    /*
     * Read straight from the file rather than through the store.
     *
     * The store's `all()` is asynchronous — it caches through a write queue —
     * and the caller here is the engine's launch path, which is synchronous by
     * design. Reading the same JSON directly keeps that shape; the file is small
     * and this runs once per launch.
     */
const raw = JSON.parse(readFileSync(modelConfigFile(defaultDataDir()), 'utf8')) as Record<string, unknown>
    for (const value of Object.values(raw ?? {})) {
      const temperature = Number((value as { temperature?: unknown })?.temperature)
      if (Number.isFinite(temperature) && temperature >= 0) return { temperature }
    }
  } catch {
    /* No saved tuning yet: the engine's own default is the right answer. */
  }
  return {}
}

/* ── Server statistics ────────────────────────────────────────────────────── */

/**
 * One reading of llama-server's own counters.
 *
 * Read from the `/metrics` endpoint rather than derived from token counts on
 * this side. The server's numbers are the ones that include everything — prompt
 * tokens reused from the cache, drafts the speculative decoder proposed and how
 * many of them survived — and a figure this side computed would disagree with
 * them by exactly the parts it cannot see.
 */
export type ServerStats = {
  /** Prompt tokens processed, excluding reused ones. */
  promptTokens: number
  /** Prompt tokens that came from the KV cache instead of being re-evaluated. */
  cachedTokens: number
  /** Seconds spent on prompts, which is where a first token's latency lives. */
  promptSeconds: number
  predictedTokens: number
  predictedSeconds: number
  /** Drafts the speculative decoder proposed, and how many were accepted. */
  draftTokens: number
  acceptedTokens: number
  draftRounds: number
  requestsProcessing: number
  requestsDeferred: number
  /** `null` when the model is not loaded or the endpoint does not answer. */
  busySlots: number
}

/**
 * The counters, or undefined when nothing is loaded.
 *
 * `undefined` rather than zeroes: a model that is not running and a model that
 * has answered nothing are different states, and a row of zeroes would present
 * the first as the second.
 */
export async function localServerStats(): Promise<ServerStats | undefined> {
  const loaded = loadedLocalModel()
  if (!loaded) return undefined
  try {
    const response = await fetch(`http://127.0.0.1:${String(loaded.port)}/metrics`, {
      signal: AbortSignal.timeout(3000)
    })
    if (!response.ok) return undefined
    const text = await response.text()
    const pick = (name: string): number => {
      /*
       * The Prometheus text format: one `name value` line per metric, with
       * `#` comment lines around it. Matched at the start of a line so a metric
       * whose name is a prefix of another cannot be picked up by mistake.
       */
      const match = new RegExp(`^llamacpp:${name}\s+([0-9.eE+-]+)$`, 'm').exec(text)
      const value = Number(match?.[1])
      return Number.isFinite(value) ? value : 0
    }
    return {
      promptTokens: pick('prompt_tokens_total'),
      cachedTokens: pick('prompt_tokens_cached_total'),
      promptSeconds: pick('prompt_seconds_total'),
      predictedTokens: pick('tokens_predicted_total'),
      predictedSeconds: pick('tokens_predicted_seconds_total'),
      draftTokens: pick('spec_decode_num_draft_tokens_total'),
      acceptedTokens: pick('spec_decode_num_accepted_tokens_total'),
      draftRounds: pick('spec_decode_num_drafts_total'),
      requestsProcessing: pick('requests_processing'),
      requestsDeferred: pick('requests_deferred'),
      busySlots: pick('n_busy_slots_per_decode')
    }
  } catch {
    /* A stopped server or a refused read: the caller shows nothing. */
    return undefined
  }
}
