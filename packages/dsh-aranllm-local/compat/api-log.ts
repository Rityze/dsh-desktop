/**
 * What has been asked of the compatibility endpoint, in memory.
 *
 * ## Why a ring buffer and not a file
 *
 * This answers "who is calling me right now, and is it working" — a question
 * asked while looking at a live screen. A file would answer a different question
 * (what happened last week), and answering that one properly means rotation,
 * size limits, and a viewer. The panel wants the last few dozen requests and
 * forgets the rest, so nothing is written down.
 *
 * ## Why the prompt is not kept
 *
 * A request body here is a user's prompt: source code, a document, whatever they
 * pasted into whatever tool is calling this. Keeping it would put the contents of
 * every request into the application's memory for the length of the session and
 * onto the screen of anyone who walks past. The log keeps the *shape* of a
 * request — its size, its model, how long it took, whether it worked — which is
 * what diagnosing an endpoint needs, and none of its contents.
 */
import type { ApiLogEntry, ApiLogOutcome } from './api-log-types'

export type { ApiLogEntry, ApiLogOutcome }

/**
 * How many entries are kept.
 *
 * Enough to see a pattern — a client retrying, a model timing out — and small
 * enough to render as a list without virtualization.
 */
const KEEP = 60

const entries: ApiLogEntry[] = []
let next = 1
let listeners: (() => void)[] = []

/** The recent requests, newest first. */
export function apiLog(): ApiLogEntry[] {
  return [...entries].reverse()
}

/** Counters over the whole session, not just the buffer. */
export type ApiLogTotals = {
  requests: number
  ok: number
  failed: number
  unauthorized: number
  /** Median response time, in milliseconds. Zero when nothing has run. */
  medianMs: number
}

/** Counters since launch. Kept separately: the buffer forgets, the totals do not. */
let counted: Omit<ApiLogTotals, 'medianMs'> = { requests: 0, ok: 0, failed: 0, unauthorized: 0 }
let durations: number[] = []

/**
 * Totals for the panel's header.
 *
 * The median rather than the mean: one request that waited on a model load takes
 * twenty seconds, and a mean would report that as the typical latency forever
 * after. The median says what a request usually costs.
 */
export function apiLogTotals(): ApiLogTotals {
  const sorted = [...durations].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  const median =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 1
        ? (sorted[middle] ?? 0)
        : Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
  return { ...counted, medianMs: median }
}

/** Subscribe to additions. Returns the way to stop. */
export function onApiLog(listener: () => void): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((each) => each !== listener)
  }
}

function announce(): void {
  for (const listener of [...listeners]) {
    /* One broken listener must not stop the request that is being logged. */
    try {
      listener()
    } catch {
      /* ignored deliberately: a UI that cannot redraw is not this module's
         problem, and throwing here would fail the request it is logging. */
    }
  }
}

/**
 * Record a request that has finished.
 *
 * Called once per request rather than with an in-progress entry that is later
 * updated: a panel that shows work in flight needs to answer "has it started"
 * from state that outlives a redraw, and this application already has that for
 * the chat. What is missing there — and what this provides — is the record of
 * what was asked of the endpoint and how it went.
 */
export function noteApiRequest(entry: Omit<ApiLogEntry, 'id' | 'at'>): ApiLogEntry {
  const complete: ApiLogEntry = { ...entry, id: next++, at: Date.now() }
  entries.push(complete)
  /*
   * `splice` from the front rather than a second array: the buffer is small and
   * fixed, and a queue that grows and is trimmed by copying would churn every
   * time it is full.
   */
  if (entries.length > KEEP) entries.splice(0, entries.length - KEEP)

  counted.requests++
  if (complete.outcome === 'ok') counted.ok++
  else if (complete.outcome === 'unauthorized') counted.unauthorized++
  else if (complete.outcome === 'failed') counted.failed++
  durations.push(complete.ms)

  announce()
  return complete
}

/** Forget everything. For the clear button, and for tests. */
export function clearApiLog(): void {
  entries.length = 0
  counted = { requests: 0, ok: 0, failed: 0, unauthorized: 0 }
  durations = []
  announce()
}

/** Nothing to log with once the window is gone. */
export function resetApiLogListeners(): void {
  listeners = []
}
