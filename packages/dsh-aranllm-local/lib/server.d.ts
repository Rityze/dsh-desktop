import type { LoadPhaseInfo, LoadPhaseTracker } from './load-phase.js'

/** One managed llama-server process bound to one model. */
export declare class LlamaServer {
  readonly model: string
  readonly args: readonly string[]
  readonly binary: string
  readonly startedAt: number
  readonly stderr: string[]

  readonly port: number
  readonly baseURL: string
  readonly running: boolean
  readonly pid: number | undefined

  /** A bounded tail of server diagnostics, surfaced when a load fails. */
  readonly diagnostic: string

  /** Stop the server, escalating to a kill if it does not honor the request. */
  stop(options?: { timeoutMs?: number }): Promise<void>
}

/** ROCm install directories to add to the child's DLL search path. */
export declare function rocmPathEntries(options?: { binaryDirectory?: string }): string[]

/**
 * The port every managed llama-server listens on.
 *
 * Fixed rather than chosen per load: the engine reads the address once, at
 * startup, and never re-reads it, so a port picked at load time describes an
 * endpoint the engine is not listening to.
 */
export declare const DEFAULT_SERVER_PORT: number

/** Whether a loopback port can be bound right now. */
export declare function isPortAvailable(port: number): Promise<boolean>

/** Build the llama-server argument list for one load request. */
export declare function buildArgs(request: {
  modelPath: string
  options?: Record<string, unknown>
}): string[]

/** Environment the managed server needs beyond a clean inherit. */
export declare function buildEnv(options?: {
  options?: Record<string, unknown>
  extraPathEntries?: string[]
}): Record<string, string | undefined>

export interface LaunchRequest {
  binary: string
  modelPath: string
  options?: Record<string, unknown>
  onLog?(entry: { stream: string; text: string }): void
  /** Called once per phase transition, including the synthetic starting one. */
  onPhase?(info: LoadPhaseInfo, messages: readonly string[]): void
  /**
   * A caller-owned tracker. Supplying one lets the caller read the phase after
   * this function resolves; otherwise a tracker is created and discarded here.
   */
  tracker?: LoadPhaseTracker
  signal?: AbortSignal
  healthTimeoutMs?: number
  /**
   * How often to re-read the tracker for a phase that arrived without output.
   * The inferred `reading` comes from silence, so it needs a poll; this only
   * decides how promptly it is noticed, not whether it happens.
   */
  phaseIntervalMs?: number
  spawnImpl?: unknown
}

/**
 * Launch llama-server and wait until it answers /health.
 *
 * The child is killed on any failure, so a cancelled or failed load releases
 * its GPU memory before the next one starts.
 */
export declare function launchLlamaServer(request: LaunchRequest): Promise<LlamaServer>
