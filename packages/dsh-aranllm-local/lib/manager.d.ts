export interface ScannedModel {
  id: string
  name: string
  publisher?: string
  path: string
  size?: number
  bytes?: number
  architecture?: string
  quantization?: string
  parameters?: string
  /** llama.cpp's own size string — "27B", or "35B-A3B" for an MoE model. */
  sizeLabel?: string
  contextLength?: number
  chatTemplate?: string
  supportsTools?: boolean
  supportsVision?: boolean
  supportsMtp?: boolean
  multimodal?: boolean
  mmproj?: string
  draft?: string
  /**
   * A scanned entry always carries this — the scan computes it per file — but
   * it stays optional because `load()` accepts a minimal entry from a caller
   * that built one by hand, and the override layer tolerates its absence.
   */
  capabilities?: ModelCapabilities
  [key: string]: unknown
}

/** How strong the evidence for a vision verdict is. */
export type CapabilityConfidence = 'certain' | 'likely'

/** Which signal produced a vision verdict, weakest last. */
export type VisionSource = 'mmproj' | 'metadata' | 'architecture' | 'template'

export interface ModelCapabilities {
  toolCalling: boolean
  /** The value the interface acts on — the override, not the file. */
  vision: boolean
  reasoning: boolean
  hasTemplate: boolean
  visionConfidence: CapabilityConfidence
  visionSource?: VisionSource
  architecture?: string
  /** Whether the user's choice is in effect rather than the file's verdict. */
  visionOverridden?: boolean
  /** What the file itself said, kept so "auto" remains reachable. */
  inferredVision?: boolean
  /** Same pair for the thinking branch: the resolved value and the raw one. */
  reasoningOverridden?: boolean
  inferredReasoning?: boolean
}

export interface GgufHeader {
  architecture?: string
  quantization?: string
  parameters?: string
  contextLength?: number
  chatTemplate?: string
  [key: string]: unknown
}

/** The live model on the local route, as the adapter and the gateway read it. */
export interface LoadedModel {
  modelId: string
  modelName: string
  path: string
  port: number
  pid?: number
  contextLength?: number
  multimodal: boolean
  startedAt: number
  baseURL: string
}

/** Where a load is, in order. See lib/load-phase.js for why there is no percentage. */
export type LoadPhase = 'opening' | 'verifying' | 'reading' | 'initializing' | 'ready'

export interface LoadProgress {
  modelId: string
  modelName: string
  startedAt: number
  elapsedMs: number
  /** Model file size, when the catalog knew it — the honest scale for a wait. */
  bytes?: number
  phase: LoadPhase
  /** Milliseconds from `startedAt` to the line that reached this phase. */
  phaseAtMs?: number
  /** The engine line that caused the transition, for the log and for support. */
  phaseDetail?: string
  /** The phase's position in the sequence, 0..1. Not a measurement. */
  progress: number
}

export interface ManagerLogEntry {
  stream: 'info' | 'warn' | 'stderr'
  text: string
}

export interface LocalModelManagerOptions {
  routeName?: string
  log?(entry: ManagerLogEntry): void
  /** Load options applied to an implicit load; read per call. */
  loadOptions?(): Record<string, unknown>
  modelRoot?: string
}

export interface LoadRequest {
  model: ScannedModel
  options?: Record<string, unknown>
  signal?: AbortSignal
}

export interface LoadByIdRequest {
  root?: string
  options?: Record<string, unknown>
  signal?: AbortSignal
}

/**
 * Owns every managed llama-server process.
 *
 * Exactly one model is loaded at a time: `load()` awaits the unload of the
 * previous process before starting the next, because the GPU has to release the
 * weights first.
 */
export declare class LocalModelManager {
  constructor(options?: LocalModelManagerOptions)

  /** Scanned root; writable so a Settings edit applies without a restart. */
  modelRoot: string
  /** Language the adapter renders reasoning-effort names in. */
  language: 'zh' | 'en'
  /**
   * Remembered capability overrides for one model, injected by the host.
   *
   * A callback rather than a store so the manager owns no configuration: the
   * desktop main process reads its JSON file and the harness plugin reads its
   * settings scope. It is consulted while the catalog is served, so a change
   * takes effect on the next read without restarting anything.
   */
  capabilityOverrides?: (model: ScannedModel) => {
    visionOverride?: string
    reasoningOverride?: string
  }
  readonly routeName: string
  /** The harness-facing adapter. Throws unless `attach()` has run. */
  readonly adapter: unknown
  /**
   * Current load progress. Undefined only when nothing is loading and nothing
   * is loaded; after a finished load it reports the terminal `ready` phase so a
   * late poll does not read as "nothing happening".
   */
  readonly progress: LoadProgress | undefined
  /** Every running server, for shutdown and diagnostics. */
  readonly active: readonly LoadedModel[]

  load(request: LoadRequest): Promise<LoadedModel | undefined>
  loadById(modelId: string, request?: LoadByIdRequest): Promise<LoadedModel | undefined>
  unload(options?: { reason?: string }): Promise<boolean>
  shutdown(): Promise<void>
  /** The live model on the local route, or undefined. */
  loaded(route: string): LoadedModel | undefined
  describe(): LoadedModel | undefined
  /** Load options for an implicit load, from the plugin config. */
  defaultLoadOptions(): Record<string, unknown>
  catalog(root?: string, options?: { maxAgeMs?: number }): Promise<ScannedModel[]>
  /**
   * Populate the index before the picker reads it, with overrides applied.
   *
   * The chat model picker's path: a fresh launch has never scanned, so without
   * this the local provider would list nothing the first time the menu opens.
   */
  ready(): Promise<ScannedModel[]>
  /** The cached index with overrides applied, for the synchronous projection. */
  readonly catalogSnapshot: ScannedModel[]
  /**
   * The catalog with capability overrides applied.
   *
   * Applied on read rather than at scan time, so a just-flipped switch is
   * visible immediately instead of after the catalog cache expires. `source`
   * replaces the scan, which exists so a test can feed the layer entries it has
   * already produced — the sequence that happens in production through
   * `find()`, `ready()` and `load()`.
   */
  catalogWithOverrides(
    root?: string,
    options?: { maxAgeMs?: number; source?: ScannedModel[] }
  ): Promise<ScannedModel[]>
  find(modelId: string): ScannedModel | undefined
  /** Bind the manager to a harness llm registry. Not used by the desktop app. */
  attach(llm: unknown): Promise<void>
  detach(): void
}

export declare function formatBytes(bytes: number): string
export declare function resolveSpeculative(
  speculative: unknown,
  model: ScannedModel
): Record<string, unknown>
export declare function discoverLlamaServer(...args: unknown[]): string | null
export declare function packagedModelsRoot(...args: unknown[]): string
export declare function defaultModelRoots(...args: unknown[]): string
/** Back-compat alias kept for callers that expected a single root. */
export declare function defaultModelsRoot(...args: unknown[]): string
export declare function defaultDataDir(...args: unknown[]): string
export declare function scanModels(...args: unknown[]): Promise<ScannedModel[]>
export declare function readGgufHeader(...args: unknown[]): Promise<GgufHeader>
export declare function parseModelRoots(value: string): string[]
