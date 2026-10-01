/** The load-time option surface the parameter panel renders. */

export type LoadParameterType =
  | 'number'
  | 'text'
  | 'boolean'
  | 'select'
  | 'string-list'
  | 'readonly'

export interface LoadParameterField {
  readonly key: string
  readonly label: string
  readonly type: LoadParameterType
  /** Absent means "use the engine's own default", which is what the panel shows as empty. */
  readonly defaultValue?: unknown
  readonly options?: readonly string[]
  /** True when llama.cpp derives a value the panel must not present as a choice. */
  readonly auto?: boolean
  readonly experimental?: boolean
  readonly collapsible?: boolean
  /** The llama-server flag this maps to, shown as the field's hint. Null for request-only fields. */
  readonly flag: string | null
}

export interface LoadParameterGroup {
  readonly id: string
  readonly title: string
  readonly fields: readonly LoadParameterField[]
}

export declare const KV_CACHE_TYPES: readonly string[]
export declare const LOAD_PARAMETER_GROUPS: readonly LoadParameterGroup[]
export declare const LOAD_PARAMETER_KEYS: readonly string[]

/**
 * Coerce a form-shaped request into the flat options object the argument
 * builder reads. Idempotent: a second pass over its own output is a no-op.
 */
export declare function normalizeLoadOptions(input?: Record<string, unknown>): Record<string, unknown>
