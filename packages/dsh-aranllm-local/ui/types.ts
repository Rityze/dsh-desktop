/**
 * The types the copied components declare.
 *
 * Moved verbatim from the desktop application's `lib/bridge.ts`, which is the
 * file that defined them. They are types only — nothing here runs — so there is
 * nothing to adapt: the components refer to the same names with the same shapes
 * they always did, which is what lets them stay unedited.
 */

/**
 * One model file the local scanner found.
 *
 * Shaped by what the file itself declares rather than by a manifest: the
 * architecture, context length and quantization are all read out of the GGUF
 * header, so a model the user dropped into the directory themselves appears
 * here with the same detail as one this application shipped.
 */
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
  humanSize: string
  multimodal: boolean
  hasMtp: boolean
}

/** The running server. Present only while a model is loaded. */
export type LocalLoadedModel = {
  modelId: string
  modelName: string
  path: string
  port: number
  baseURL: string
  contextLength?: number
  multimodal: boolean
}

/**
 * How far a load has got.
 *
 * Weight loading is tens of seconds on a large model and prints nothing during
 * most of it, so this is what the user watches instead of a frozen window. The
 * phase is a name rather than a percentage because the last stretch — the GPU
 * upload — has no progress to report.
 */
export type LocalLoadProgress = {
  modelId: string
  modelName: string
  elapsedMs: number
  phase: string
  phaseDetail?: string
  progress: number
}

export type LocalModelsSnapshot = {
  root: string
  roots: string[]
  binary?: string
  scanning: boolean
  models: LocalModelEntry[]
  loaded?: LocalLoadedModel
  progress?: LocalLoadProgress
}

export type LoadResult = { ok: true } | { ok: false; error: string }
export type SetRootResult = { ok: true; value: LocalModelsSnapshot } | { ok: false; error: string }
export type SaveConfigResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string }

/**
 * One row of the load-parameter panel.
 *
 * `defaultValue` absent means the engine decides, which the panel draws as an
 * empty field with the default beside it — the distinction that lets a user get
 * a field back to automatic after having set it.
 */
export type LoadParameterField = {
  key: string
  label: string
  type: 'number' | 'text' | 'boolean' | 'select' | 'string-list' | 'readonly'
  defaultValue?: unknown
  /**
   * Wording to show where the default would go, when the schema's own value is
   * not the number that belongs there. Set by the caller that knows the model.
   */
  defaultHint?: string
  /**
   * The largest value the field accepts, when that is a fact about the model
   * rather than about the schema. Present only where a count has a denominator.
   */
  max?: number
  options?: readonly string[]
  /**
   * Display text per option value.
   *
   * A select's option is both the label and the value that reaches llama.cpp.
   * Where the two must differ — a Chinese label over an English flag argument —
   * the label is looked up here and the value is left alone. A missing entry
   * falls back to the value, so this can cover a subset.
   */
  optionLabels?: Readonly<Record<string, string>>
  /** llama.cpp derives this; the panel must not present it as a choice. */
  auto?: boolean
  experimental?: boolean
  collapsible?: boolean
  /**
   * A sentence about when this field takes effect, when that is not obvious.
   *
   * Almost nothing in the panel needs one: every other row is a launch argument,
   * and "press 保存, then load" is the panel's whole contract, stated once at the
   * bottom. The exception is a row that *looks* like it belongs to the turn —
   * the thinking level exists in two places, one of which is per request — and a
   * reader who changed it expecting the next reply to differ would be wrong
   * about a control whose neighbour does exactly that.
   */
  note?: string
  /**
   * The value of a readonly row, resolved against the host.
   *
   * Only readonly rows carry it, and they carry nothing else: the number shown
   * is a fact about this machine, so it cannot come from the schema and must not
   * be an editable control.
   */
  derived?: number
  /** The llama-server flag it maps to. Null for request-only fields. */
  flag: string | null
}

export type LoadParameterGroup = {
  id: string
  title: string
  fields: readonly LoadParameterField[]
}
