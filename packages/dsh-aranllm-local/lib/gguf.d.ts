/** GGUF header reading and the model index built from a directory tree. */

export interface GgufCapabilities {
  readonly toolCalling: boolean
  readonly vision: boolean
  readonly reasoning: boolean
  readonly hasTemplate: boolean
  /**
   * How much the vision verdict is worth.
   *
   * `certain` means the file carries the vision tower itself (a projector
   * sidecar or converter-written vision keys); `likely` means the verdict came
   * from a name or template match, which the user may need to correct.
   */
  readonly visionConfidence: 'certain' | 'likely'
  /** Which signal fired. Absent when nothing did. */
  readonly visionSource?: 'mmproj' | 'metadata' | 'architecture' | 'template'
  /** The file's own architecture string, so a wrong verdict can be traced. */
  readonly architecture?: string
}

export interface GgufHeader {
  readonly version: number
  readonly tensorCount: number
  readonly metadata: Record<string, unknown>
  readonly bytes: number
}

/** One discovered model: what the picker shows and what the loader needs. */
export interface ScannedModel {
  /** `{publisher}/{model}`, stable per root. */
  readonly id: string
  readonly path: string
  readonly directory: string
  readonly name: string
  readonly architecture?: string
  readonly contextLength?: number
  readonly parameterCount?: number
  /** The file's own size label: "27B", or "35B-A3B" for an MoE model. */
  readonly sizeLabel?: string
  readonly fileType?: number
  readonly quantization?: string
  readonly hasMtp: boolean
  readonly mtpLayers?: number
  readonly bytes: number
  readonly multimodal: boolean
  readonly capabilities: GgufCapabilities
  /** The vision tower beside this model, when one exists. */
  mmproj?: string
  /** The draft weights beside this model, when one exists. */
  draft?: string
}

/** One GGUF header, or null when the file is not a readable GGUF. */
export declare function readGgufHeader(path: string): Promise<GgufHeader | null>

/** Discover loadable models under one root, or several separated by punctuation. */
export declare function scanModels(
  root: string | readonly string[],
  options?: { maxDepth?: number }
): Promise<ScannedModel[]>

/** Split a models-root setting into individual directory strings. */
export declare function parseModelRoots(roots: string | readonly string[]): string[]

export declare function capabilitiesOf(
  metadata: Record<string, unknown>,
  options?: { hasMmproj?: boolean }
): GgufCapabilities

/** The values a capability override may take. */
export declare const CAPABILITY_OVERRIDES: readonly ['auto', 'on', 'off']

/**
 * Resolve a file's verdict against the user's override.
 *
 * Anything that is not `on` or `off` is treated as `auto`, so a hand-edited
 * record cannot silently disable a capability the file does declare.
 */
export declare function resolveCapability(
  inferred: unknown,
  override?: string
): { value: boolean; overridden: boolean }

export declare function architectureOf(metadata: Record<string, unknown>): string | undefined
export declare function contextLengthOf(metadata: Record<string, unknown>): number | undefined
export declare function parameterCountOf(metadata: Record<string, unknown>): number | undefined
export declare function sizeLabelOf(metadata: Record<string, unknown>): string | undefined
export declare function quantizationOf(metadata: Record<string, unknown>): string | undefined
export declare function mtpInfoOf(metadata: Record<string, unknown>): {
  supported: boolean
  layers?: number
}

export declare function isMmproj(path: string): boolean
export declare function isDraft(path: string): boolean
export declare function splitInfoOf(
  path: string
): { prefix: string; index: number; total: number } | undefined

/** True when the path is a readable file, used to validate a configured path. */
export declare function existsAsFile(path: string): Promise<boolean>
