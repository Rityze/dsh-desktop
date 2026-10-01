/**
 * Snapshot store for the plugin card: getSnapshot/subscribe/set.
 * Avoids importing the client-runtime store engine (external at bundle time,
 * but tests stub the same shape).
 */
/** Minimal observable used as a slot `hooks.*` snapshot. */
export interface SnapshotStore<T> {
    getSnapshot(): T;
    subscribe(fn: () => void): () => void;
    set(value: T): void;
}
/** Create a tiny in-memory snapshot store. */
export declare function createSnapshotStore<T>(initial: T): SnapshotStore<T>;
