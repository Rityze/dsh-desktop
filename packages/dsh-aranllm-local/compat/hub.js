/**
 * Which model host to read, and the calls the page makes against it.
 *
 * This module is the thin part: it holds the chosen source and forwards. The
 * hosts themselves — and every measured difference between them — are in
 * `hub-sources.ts`.
 *
 * **Only the choice is persisted, never the content.** A repository id means
 * whatever the host it came from says it means, so a cached listing from one
 * host would be a list of names that may not exist on the other. Nothing here
 * caches; switching re-reads.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { app } from './electron-shim.js';
import { asSourceId, sourceFor, SOURCE_LIST, DEFAULT_SOURCE } from './hub-sources.js';
export { quantizationOf } from './hub-sources.js';
function settingsFile() {
    return join(app.getPath('userData'), 'hub.json');
}
function readSettings() {
    try {
        const raw = JSON.parse(readFileSync(settingsFile(), 'utf8'));
        return raw && typeof raw === 'object' ? raw : {};
    }
    catch {
        /*
         * No file yet, or unreadable. Not an error: a first launch has no file, and
         * the default is the answer either way.
         */
        return {};
    }
}
/**
 * Write one key into the settings file, leaving the others alone.
 *
 * Merged rather than replaced, and that is not tidiness: the proxy settings live
 * in this same file (see `network.ts`), so a write that replaced the whole
 * document would silently reset the user's proxy choice every time they
 * switched hosts — and the proxy is exactly the setting someone using one
 * cannot afford to lose.
 */
export function writeSetting(key, value) {
    const existing = readSettings();
    try {
        mkdirSync(app.getPath('userData'), { recursive: true });
        writeFileSync(settingsFile(), JSON.stringify({ ...existing, [key]: value }, null, 2), 'utf8');
        return { ok: true };
    }
    catch (cause) {
        return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
    }
}
/** One key from the settings file, or undefined. The read half of `writeSetting`. */
export function readSetting(key) {
    return readSettings()[key];
}
/** Which host the page is reading. */
export function hubSource() {
    return asSourceId(readSettings().source);
}
/** What the page needs to draw its source picker. */
export function hubSources() {
    return SOURCE_LIST.map((source) => ({ id: source.id, label: source.label, origin: source.origin }));
}
/**
 * Choose a host.
 *
 * Writing the file is best-effort — a failed write leaves the session on the new
 * source and only forgets it at exit, which is a better trade than refusing to
 * switch because a settings file is locked.
 */
export function setHubSource(id) {
    const next = id === 'modelscope' || id === 'hf-mirror' ? id : undefined;
    if (!next)
        return { ok: false, error: '未知的模型源。' };
    /* The outcome is deliberately ignored — see above. */
    writeSetting('source', next);
    return { ok: true, value: next };
}
/** One page of repositories from the chosen host. */
export async function searchRepos(query = {}) {
    const source = sourceFor(hubSource());
    /*
     * Bounded here rather than inside each host: a settings page that never
     * answers leaves a live control spinning, and the host cannot be trusted to
     * bound its own request — the timeout is this side's concern.
     */
    return await source.search(query, AbortSignal.timeout(20_000));
}
/** Every GGUF file in one repository, with sizes. */
export async function listFiles(repoId) {
    const source = sourceFor(hubSource());
    /*
     * A longer budget than a search: this host may walk several directories to
     * find files a single request does not reach, and a repository with a deep
     * tree is slow rather than broken.
     */
    return await source.files(repoId, AbortSignal.timeout(45_000));
}
/** The URL a file downloads from, for the source that owns the repository. */
export function downloadUrlFor(sourceId, repoId, file) {
    return sourceFor(sourceId).downloadUrl(repoId, file);
}
export { DEFAULT_SOURCE };
