/**
 * Read llama.cpp's load phases out of its output.
 *
 * A local load is the one operation in this app that can hold the user's
 * attention for minutes with nothing on screen: a 27B model spends about
 * eighteen of its nineteen seconds reading weights, and llama.cpp prints
 * nothing at all during that time. The elapsed clock the manager already
 * reports says how long ago the load started and nothing about what it is
 * doing, which is indistinguishable — to a user watching — from a hang.
 *
 * What llama.cpp does print is a handful of unambiguous transition lines. This
 * module turns those into a phase, and deliberately stops there. There is no
 * percentage because llama.cpp publishes no byte count: it reports when it
 * starts and when it finishes, and invents nothing in between. A progress bar
 * that filled smoothly across the silent stretch would be an animation
 * pretending to be a measurement.
 *
 * Kept as plain JS beside the TypeScript twin in src/main/runtime because this
 * package is copied into the installer as-is — `main` points at index.js and
 * `files` ships lib/ — so nothing here is ever compiled.
 */

/**
 * Where a load is, in the order it passes through.
 *
 * `reading` is the long one and earns its own name: it is what the user is
 * actually waiting for, and naming it is the difference between "stuck" and
 * "reading 16 GB of weights".
 */
/**
 * The tracker's own field: `ready` is the only phase after this one, and a
 * caller that wants the names typed can import them.
 */
export const LOAD_PHASES = ['opening', 'verifying', 'reading', 'initializing', 'ready']

/**
 * How long a load may go quiet before the silence is read as "reading weights".
 *
 * Measured: a 9B load is quiet for 5.5s between opening the file and the
 * threadpool init; a 27B load for 17.6s. Both are far above this threshold, so
 * both reach `reading`. It sits well below the shortest real silence because
 * the whole point is to name the wait while it is happening, not after.
 *
 * It must stay above the process start — a spawn plus ROCm DLL resolution is
 * a few hundred milliseconds of quiet that is *not* a weight read, and calling
 * that `reading` would be a guess about work that has not begun.
 */
const SILENCE_TO_READING_MS = 1200

/**
 * The lines that move a load forward, in the order they are tested.
 *
 * Matched on substrings rather than on a full line: llama.cpp prefixes every
 * line with a timestamp, a severity letter, a subsystem tag, and a function
 * name, and those columns have changed between releases. The message text is
 * the stable part.
 */
const TRANSITIONS = [
  // Printed last and therefore tested first: the load is over.
  { phase: 'ready', contains: 'listening on' },
  { phase: 'ready', contains: 'model loaded' },
  // `n_slots`/`n_ctx_slot` are chosen here, so the weights are in by now.
  { phase: 'initializing', contains: 'load_model: initializing' },
  // The threadpool init is the first line after the weight read, and therefore
  // the one that ends the long silence.
  { phase: 'initializing', contains: 'llama threadpool init' },
  // `unused tensor … --ignoring` lines are printed while the tensor table is
  // being checked, which happens after the file is open and before the read.
  { phase: 'verifying', contains: 'unused tensor' },
  { phase: 'opening', contains: 'load_model: loading model' }
]

/**
 * The phase a single engine line implies, or undefined when it implies none.
 *
 * The ordering in TRANSITIONS is the whole logic: a line that matches more than
 * one marker is reported as the later phase, because the phases are cumulative
 * and the latest one is the one that is now true.
 */
export function phaseForLine(line) {
  for (const transition of TRANSITIONS) {
    if (line.includes(transition.contains)) return transition.phase
  }
  return undefined
}

/** Enough of a partial line to hold any marker; markers are well under this. */
const MAX_PARTIAL = 4096
/** The trail is for diagnosis, and a load can print thousands of warnings. */
const MAX_MESSAGES = 400
const MAX_DETAIL = 240

/**
 * A line-oriented phase tracker.
 *
 * Stateful because the child's output arrives in chunks that do not respect
 * line boundaries: a marker split across two reads would be missed by a matcher
 * run per chunk, and the failure is silent — the phase simply never advances,
 * which is the exact symptom this module exists to remove. So the tracker holds
 * the trailing partial line until the rest of it arrives.
 *
 * Only the last partial line is retained, and it is bounded: a load that never
 * emits a newline must not grow a buffer without limit.
 */
export class LoadPhaseTracker {
  #buffer = ''
  /** What the last real marker said; `current` may refine this from silence. */
  #reached
  #startedAt
  /** When the last line arrived — the start of the current silence. */
  #lastActivityAt
  #clock
  #messages = []

  constructor(startedAt, now) {
    this.#startedAt = startedAt
    this.#lastActivityAt = startedAt
    // Injectable because the silence rule is a threshold on a clock, and a test
    // that waits real seconds for it is both slow and flaky.
    this.#clock = now
  }

  /**
   * The phase in effect: what the last marker said, or an inference from
   * silence where the engine prints nothing.
   *
   * `reading` is inferred, not printed. Nothing in llama.cpp's output marks the
   * weight read — it is precisely the stretch where the engine says nothing —
   * yet it is 91% of a 27B load and the one phase the user is waiting for. So
   * after `opening`, a quiet interval long enough to be a read is named as one.
   * The rule never looks back: once a real marker arrives it takes precedence,
   * so the inference can only ever fill a gap, never contradict the engine.
   */
  get current() {
    const reached = this.#reached?.phase
    if (reached !== 'opening' && reached !== 'verifying') return this.#reached
    const quiet = (this.#clock?.() ?? Date.now()) - this.#lastActivityAt
    if (quiet >= SILENCE_TO_READING_MS) {
      return {
        phase: 'reading',
        atMs: this.#lastActivityAt - this.#startedAt + SILENCE_TO_READING_MS,
        detail: 'reading weights',
      }
    }
    return this.#reached
  }

  /**
   * The furthest phase the load has reached, ignoring the silence inference.
   *
   * Events are driven from this rather than from {@link LoadPhaseTracker.current}
   * because the inferred `reading` is not a fact the engine reported: it can
   * stop being true when the next line arrives, and a phase that goes backwards
   * would make the UI redraw earlier steps — measured on a real load, `opening`
   * reappeared one second after `reading`. So announcements follow only the
   * printed markers, while polls get the richer, inferred view.
   */
  get reached() {
    return this.#reached
  }

  /** Every engine line seen, in order, for the diagnostic trail. */
  get messages() {
    return this.#messages
  }

  /**
   * Feed one chunk of output and return the phase in effect.
   *
   * Returns the current phase rather than only a change, because a caller that
   * polls for progress wants an answer every time and a caller that watches for
   * transitions can compare against what it last saw.
   */
  push(chunk) {
    this.#buffer += chunk
    let newline = this.#buffer.indexOf('\n')
    while (newline !== -1) {
      const line = this.#buffer.slice(0, newline).replace(/\r$/, '')
      this.#buffer = this.#buffer.slice(newline + 1)
      this.#consume(line)
      newline = this.#buffer.indexOf('\n')
    }
    // A partial line is kept, not dropped, and capped rather than trusted: the
    // markers are tens of bytes, so anything long is not a marker and keeping
    // it whole would only be a way to grow memory.
    if (this.#buffer.length > MAX_PARTIAL) this.#buffer = this.#buffer.slice(-MAX_PARTIAL)
    return this.current
  }

  #consume(line) {
    const text = line.trim()
    if (text.length === 0) return
    // A ring, not a fill-then-freeze: a load prints thousands of lines, and the
    // ones that explain a failure are at the end. Stopping at the cap would make
    // the trail a record of the start of a load that then went wrong.
    this.#messages.push(text)
    if (this.#messages.length > MAX_MESSAGES) this.#messages.shift()

    const phase = phaseForLine(text)
    // Any output ends the silence, whether or not it moved the phase: a chatty
    // weight read is still a read in progress, but one that keeps printing is
    // not silent, and the inference above must not fire over it. This is why
    // the clock is stamped before the marker test, not inside it.
    this.#lastActivityAt = this.#clock?.() ?? Date.now()
    if (!phase) return
    if (phase === this.#reached?.phase) return
    this.#reached = {
      phase,
      atMs: this.#lastActivityAt - this.#startedAt,
      // Truncated because this text reaches a log line and a support report,
      // and an engine message can carry a whole model path.
      detail: text.slice(0, MAX_DETAIL)
    }
  }
}

/**
 * What to show while a load has not reached its first marker.
 *
 * Not `opening`: the process has been spawned but has not said anything yet, so
 * claiming the file is open would be a guess. The UI treats an absent phase as
 * "starting" and shows the elapsed clock alone.
 */
export const UNSTARTED_PHASE = 'opening'

/**
 * How far along a phase is, for a determinate-looking indicator.
 *
 * The values are the order of the phases, not a measurement, and the UI must
 * present them as position rather than as completion — see the module comment.
 * `ready` is 1 and everything else sits below it so a bar can reach the end.
 */
export function phaseProgress(phase) {
  const index = LOAD_PHASES.indexOf(phase)
  if (index < 0) return 0
  return index / (LOAD_PHASES.length - 1)
}
