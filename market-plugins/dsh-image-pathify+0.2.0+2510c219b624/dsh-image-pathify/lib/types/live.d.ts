/**
 * Read the Loader-resolved Config, including 0.1.7 volatile field refs.
 * The host keeps those refs stable and writes new snapshots in place.
 * @module dsh-image-pathify/live
 */
import { type Config as ConfigShape } from "./config.ts";
/**
 * Snapshot the live config. 3.18.4 `.volatile()` and the loader both store
 * field refs; this returns the plain values callers compare and send.
 */
export declare function readConfig(input: unknown): ConfigShape;
