/** Per-model load configuration, remembered between sessions. */

/** The durable subset of a load-options object. */
export declare function persistedConfig(options?: Record<string, unknown>): Record<string, unknown>

/**
 * A stable identity for a model file: file name plus byte size, so a moved
 * folder still finds its settings and a re-quantized file does not.
 */
export declare function configKey(model?: { path?: string; name?: string; bytes?: number }): string | undefined

export declare class ModelConfigStore {
  constructor(options: { file: string })
  readonly file: string
  /** Everything remembered, keyed by `configKey`. Never throws. */
  all(): Promise<Record<string, Record<string, unknown>>>
  /** Remembered options for one model, or undefined. */
  get(model?: { path?: string; name?: string; bytes?: number }): Promise<Record<string, unknown> | undefined>
  /**
   * One model's settings without awaiting the file.
   *
   * For synchronous callers — a capability override is read while rendering,
   * and awaiting there would make a flag flicker a frame late. Answers only
   * from what has already been loaded, so a caller that has never awaited
   * `all()` gets `undefined`; `undefined` and `{}` both mean "ask again after
   * priming" rather than "no settings".
   */
  snapshot(key?: string): Record<string, unknown> | undefined
  /** Store options for one model and flush to disk. Writes are serialized. */
  set(
    model: { path?: string; name?: string; bytes?: number } | undefined,
    options: Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined>
  /**
   * Change some of one model's settings, leaving the rest as they were.
   *
   * For a control that owns a few keys out of many: replacement would require
   * reading the record first, and anything another panel saved in between would
   * be lost. `undefined` means "not touching this field"; `null` means "clear
   * it", so a form can express an emptied field.
   */
  patch(
    model: { path?: string; name?: string; bytes?: number } | undefined,
    changes: Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined>
  /** Drop one model's settings. */
  remove(model?: { path?: string; name?: string; bytes?: number }): Promise<boolean>
}

/** Where the store lives, given the plugin data directory. */
export declare function modelConfigFile(dataDir: string): string
