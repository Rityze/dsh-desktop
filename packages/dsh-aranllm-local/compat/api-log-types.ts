/**
 * The shape of one logged request.
 *
 * Kept in its own file with no imports, because it crosses three processes: the
 * main process writes these, the preload transports them, and the renderer draws
 * them. A type declared next to the buffer would pull `node:http` into the
 * renderer's graph the moment someone imported it.
 */

/**
 * How a request ended.
 *
 * `unauthorized` and `rejected` are separated from `failed` on purpose: they are
 * not the endpoint breaking, they are the endpoint working — refusing a bad key
 * or a malformed body. Showing them as failures would make a correctly configured
 * server look broken to anyone who tried it with the wrong key once.
 */
export type ApiLogOutcome = 'ok' | 'unauthorized' | 'rejected' | 'failed'

export type ApiLogEntry = {
  id: number
  /** Milliseconds since the epoch. */
  at: number
  method: string
  /** The path as requested, before any normalization. */
  path: string
  /** What the client called the model, when it said. */
  model?: string
  /** How many messages the request carried — the shape, not the contents. */
  messages?: number
  outcome: ApiLogOutcome
  /** HTTP status answered. */
  status: number
  /** How long the request took, in milliseconds. */
  ms: number
  /**
   * The failure message, when there was one.
   *
   * Model and request errors only. A refusal carries nothing here beyond its
   * status, which is what the client was told.
   */
  error?: string
}
