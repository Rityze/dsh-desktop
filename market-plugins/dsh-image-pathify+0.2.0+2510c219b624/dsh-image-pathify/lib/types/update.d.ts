/**
 * Silent npm latest-version probe. Failure is treated as "no update" so the
 * settings card never blocks on the registry.
 * @module dsh-image-pathify/update
 */
import type { ImagePathifyUpdateStatus } from "./contract.ts";
/** Last-resort default when Desktop and Loader `baseUrl` are both absent. */
export declare const DEFAULT_PLUGIN_PROFILE = "web";
/** Overrides used by tests; production always reads the installed package. */
export interface CheckUpdateOptions {
    readonly fetchImpl?: typeof fetch;
    readonly installedVersion?: string;
    readonly packageName?: string;
    /** Profile the copied `dsh plugin add` command should target. */
    readonly profile?: string;
}
/**
 * Read the profile directory basename from Loader `ctx.baseUrl`.
 *
 * Official boot sets this to `$DSH_HOME/profiles/<name>/` (the `cordis.yml`
 * directory). Nested or unrelated URLs are ignored.
 */
export declare function profileNameFromBaseUrl(baseUrl: unknown): string | undefined;
/**
 * Pick the profile the copied upgrade command should target.
 *
 * 1. `desktopProfiles.current.name` when Desktop registered the service
 * 2. `$DSH_HOME/profiles/<name>` basename from Loader `ctx.baseUrl`
 * 3. {@link DEFAULT_PLUGIN_PROFILE}
 */
export declare function resolvePluginProfile(desktopProfiles: unknown, baseUrl?: unknown): string;
/** Build the CLI command the card copies. Pins the probed version, not `@latest`. */
export declare function upgradeCommand(packageName: string, version: string, profile?: string): string;
/**
 * Compare two dotted versions (`1.2.3`). Pre-release suffixes are ignored.
 * @returns negative when `left` is older than `right`.
 */
export declare function compareVersions(left: string, right: string): number;
/**
 * Compare the installed package version with npm `dist-tags.latest`.
 * Network errors and missing tags resolve to `updateAvailable: false`.
 */
export declare function checkPluginUpdate(options?: CheckUpdateOptions): Promise<ImagePathifyUpdateStatus>;
