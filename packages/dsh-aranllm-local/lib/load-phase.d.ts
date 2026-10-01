/**
 * Where a load is, in the order it passes through.
 *
 * `reading` is the long one and earns its own name: it is what the user is
 * actually waiting for, and naming it is the difference between "stuck" and
 * "reading 16 GB of weights".
 */
export type LoadPhase = 'opening' | 'verifying' | 'reading' | 'initializing' | 'ready'

export declare const LOAD_PHASES: readonly LoadPhase[]

/** A phase and when it started, in the terms the UI renders. */
export interface LoadPhaseInfo {
  phase: LoadPhase
  /** Milliseconds since the load began, as of the line that moved the phase. */
  atMs: number
  /** The engine line that caused the transition, for the log and for support. */
  detail?: string
}

/**
 * The phase a single engine line implies, or undefined when it implies none.
 *
 * A line matching more than one marker reports the later phase: the phases are
 * cumulative, and the latest one is the one that is now true.
 */
export declare function phaseForLine(line: string): LoadPhase | undefined

/**
 * A line-oriented phase tracker.
 *
 * Stateful because stderr arrives in chunks that do not respect line
 * boundaries: a marker split across two reads would be missed by a matcher run
 * per chunk, and the failure is silent — the phase simply never advances.
 */
export declare class LoadPhaseTracker {
  /**
   * @param startedAt when the load began, in the same units as `now`.
   * @param now a clock, injected so the silence rule can be tested without
   *   waiting real seconds.
   */
  constructor(startedAt: number, now?: () => number)

  /**
   * The phase in effect: what the last marker said, or an inference from
   * silence where the engine prints nothing.
   *
   * `reading` is inferred, not printed — it is the stretch where the engine
   * says nothing — so it can stop being true when the next line arrives.
   * Announcements use {@link LoadPhaseTracker.reached} instead; polls use this.
   */
  readonly current: LoadPhaseInfo | undefined

  /**
   * The furthest phase the load has actually reached, ignoring the inference.
   *
   * Monotonic and never inferred, so this is what drives announcements: a phase
   * that goes backwards would make the UI redraw earlier steps.
   */
  readonly reached: LoadPhaseInfo | undefined

  /** The most recent engine lines, in order, for the diagnostic trail. */
  readonly messages: readonly string[]

  /**
   * Feed one chunk of output and return the phase in effect.
   *
   * Returns the current phase rather than only a change, so a caller that polls
   * for progress gets an answer every time.
   */
  push(chunk: string | Uint8Array): LoadPhaseInfo | undefined
}

/** The phase to show while a load has not reached its first marker. */
export declare const UNSTARTED_PHASE: LoadPhase

/**
 * How far along a phase is, for a determinate-looking indicator.
 *
 * The values are the order of the phases, not a measurement — llama.cpp
 * publishes no byte count, so a bar driven by this shows position, not
 * completion.
 */
export declare function phaseProgress(phase: LoadPhase): number
