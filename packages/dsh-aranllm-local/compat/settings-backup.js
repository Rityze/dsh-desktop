/**
 * The user's configuration, as one file they can carry.
 *
 * Six files in the data directory hold what a user has set up — the endpoints
 * and their keys, the mirror and proxy choices, the model library paths, the
 * presets, the skill switches, the zoom level — and moving to another machine
 * means visiting every one of those screens again. This bundles them.
 *
 * ## Keys are exported as empty strings, and that is the point
 *
 * A backup file is meant to be copied around: mailed to another machine, put in
 * a synced folder, attached to a note. A file with live API keys in it turns
 * every one of those into a disclosure, and the failure is silent — the file
 * looks the same either way.
 *
 * What is exported instead is the *shape*: the endpoint's address, its name, the
 * models it offers. That is the part that is tedious to retype, and it is not
 * secret. The keys are reported on the way back in, by name, so the reader knows
 * exactly which ones to paste — which is more useful than a warning at export
 * time, because at export time nothing is yet missing.
 *
 * ## Why one file rather than a zip of the originals
 *
 * Two reasons. A zip is opaque — a reader cannot check what they are about to
 * send before sending it, and "check before you share" is the one habit this
 * design depends on. And the originals are not all the same kind of thing: some
 * are read on every launch and some are caches, so a restore that copied them
 * back verbatim would restore stale derived state along with the settings.
 *
 * ## Every field is optional on the way in
 *
 * An import is a file the user picked, and it may be from an older version, hand
 * edited, or not one of these at all. Anything unrecognised is skipped and
 * listed rather than refusing the whole file: a person who has just pasted their
 * endpoints back in should not lose that because one preset was malformed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
/** The version of the file format, so a future one can be told apart. */
const FORMAT = 1;
/** Read a JSON file, or undefined when it is missing or unreadable. */
function readJson(file) {
    try {
        if (!existsSync(file))
            return undefined;
        return JSON.parse(readFileSync(file, 'utf8'));
    }
    catch {
        /*
         * A corrupt file is treated as absent. The alternative — refusing to export
         * because one unrelated file is malformed — would leave the user unable to
         * back up the four that are fine.
         */
        return undefined;
    }
}
/** Write a JSON file, creating its directory. */
function writeJson(file, value) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
/**
 * Empty every `apiKey` in a source list, whatever shape the list is in.
 *
 * Written defensively because the file it reads is produced by an older version
 * of this application, or by hand: a source that is not an object, or whose
 * `apiKey` is not a string, must not stop the export — and must not be able to
 * smuggle a key through under a different key name either, which is why the
 * whole object is rebuilt rather than edited.
 */
function redact(sources) {
    if (!Array.isArray(sources))
        return [];
    return sources.map((entry) => {
        if (!entry || typeof entry !== 'object')
            return entry;
        const source = entry;
        return { ...source, apiKey: '' };
    });
}
/** Everything the user configured, as one object ready to be written out. */
export function buildBackup(dataDirectory) {
    const store = readJson(join(dataDirectory, 'model-sources.json'));
    return {
        format: FORMAT,
        exportedAt: new Date().toISOString(),
        app: 'AranLLM',
        sources: redact(store?.sources),
        ...(store?.defaultModel !== undefined ? { defaultModel: store.defaultModel } : {}),
        ...(store?.lastUsedModel !== undefined ? { lastUsedModel: store.lastUsedModel } : {}),
        ...(readJson(join(dataDirectory, 'hub.json')) !== undefined
            ? { hub: readJson(join(dataDirectory, 'hub.json')) }
            : {}),
        ...(readJson(join(dataDirectory, 'presets.json')) !== undefined
            ? { presets: readJson(join(dataDirectory, 'presets.json')) }
            : {}),
        ...(readJson(join(dataDirectory, 'skill-routing.json')) !== undefined
            ? { skillRouting: readJson(join(dataDirectory, 'skill-routing.json')) }
            : {}),
        ...(readJson(join(dataDirectory, 'zoom.json')) !== undefined
            ? { zoom: readJson(join(dataDirectory, 'zoom.json')) }
            : {})
    };
}
/**
 * Write a backup file back into the data directory.
 *
 * **Rebuilds rather than replaces.** A section that is absent from the file is
 * left alone rather than cleared — a user importing an older backup that predates
 * a setting should keep the setting they have, not lose it because the file was
 * written before it existed.
 */
export function restoreBackup(dataDirectory, raw) {
    const report = { restored: [], needsKey: [], skipped: [] };
    if (!raw || typeof raw !== 'object') {
        report.skipped.push('这个文件不是一个配置备份。');
        return report;
    }
    const file = raw;
    if (file.format !== FORMAT) {
        /* Not fatal: the fields below are checked individually, and a file from a
           later version may still have everything this one understands. */
        report.skipped.push(`文件格式版本是 ${String(file.format ?? '未知')}，本版本是 ${String(FORMAT)}。`);
    }
    if (Array.isArray(file.sources)) {
        const existing = (readJson(join(dataDirectory, 'model-sources.json')) ?? {});
        const sources = file.sources.map((entry) => {
            if (!entry || typeof entry !== 'object')
                return entry;
            const source = { ...entry };
            const name = typeof source.name === 'string' && source.name.length > 0 ? source.name : String(source.id ?? '');
            /*
             * An imported key is empty by construction. The name is collected so the
             * reader is told which screens to visit — see `needsKey`.
             */
            if (typeof source.apiKey !== 'string' || source.apiKey.length === 0) {
                source.apiKey = '';
                report.needsKey.push(name);
            }
            return source;
        });
        writeJson(join(dataDirectory, 'model-sources.json'), {
            ...existing,
            sources,
            ...(file.defaultModel !== undefined ? { defaultModel: file.defaultModel } : {}),
            ...(file.lastUsedModel !== undefined ? { lastUsedModel: file.lastUsedModel } : {})
        });
        report.restored.push(`接入点（${String(sources.length)} 个）`);
    }
    for (const [key, filename] of [
        ['hub', 'hub.json'],
        ['presets', 'presets.json'],
        ['skillRouting', 'skill-routing.json'],
        ['zoom', 'zoom.json']
    ]) {
        if (file[key] === undefined)
            continue;
        /*
         * The whole section replaces the file rather than merging into it. These are
         * each a single document owned by one screen, so a merge would have to know
         * which fields are lists and how to combine them — and the answer would
         * differ per section. Replacing is what "restore" means for a value the user
         * chose deliberately.
         */
        writeJson(join(dataDirectory, filename), file[key]);
        report.restored.push(filename);
    }
    return report;
}
