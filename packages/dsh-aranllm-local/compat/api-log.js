/**
 * How many entries are kept.
 *
 * Enough to see a pattern — a client retrying, a model timing out — and small
 * enough to render as a list without virtualization.
 */
const KEEP = 60;
const entries = [];
let next = 1;
let listeners = [];
/** The recent requests, newest first. */
export function apiLog() {
    return [...entries].reverse();
}
/** Counters since launch. Kept separately: the buffer forgets, the totals do not. */
let counted = { requests: 0, ok: 0, failed: 0, unauthorized: 0 };
let durations = [];
/**
 * Totals for the panel's header.
 *
 * The median rather than the mean: one request that waited on a model load takes
 * twenty seconds, and a mean would report that as the typical latency forever
 * after. The median says what a request usually costs.
 */
export function apiLogTotals() {
    const sorted = [...durations].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length === 0
        ? 0
        : sorted.length % 2 === 1
            ? (sorted[middle] ?? 0)
            : Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2);
    return { ...counted, medianMs: median };
}
/** Subscribe to additions. Returns the way to stop. */
export function onApiLog(listener) {
    listeners.push(listener);
    return () => {
        listeners = listeners.filter((each) => each !== listener);
    };
}
function announce() {
    for (const listener of [...listeners]) {
        /* One broken listener must not stop the request that is being logged. */
        try {
            listener();
        }
        catch {
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
export function noteApiRequest(entry) {
    const complete = { ...entry, id: next++, at: Date.now() };
    entries.push(complete);
    /*
     * `splice` from the front rather than a second array: the buffer is small and
     * fixed, and a queue that grows and is trimmed by copying would churn every
     * time it is full.
     */
    if (entries.length > KEEP)
        entries.splice(0, entries.length - KEEP);
    counted.requests++;
    if (complete.outcome === 'ok')
        counted.ok++;
    else if (complete.outcome === 'unauthorized')
        counted.unauthorized++;
    else if (complete.outcome === 'failed')
        counted.failed++;
    durations.push(complete.ms);
    announce();
    return complete;
}
/** Forget everything. For the clear button, and for tests. */
export function clearApiLog() {
    entries.length = 0;
    counted = { requests: 0, ok: 0, failed: 0, unauthorized: 0 };
    durations = [];
    announce();
}
/** Nothing to log with once the window is gone. */
export function resetApiLogListeners() {
    listeners = [];
}
