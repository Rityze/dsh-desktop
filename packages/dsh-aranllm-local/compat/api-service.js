/**
 * The compatibility endpoint's settings, and its life in this process.
 *
 * Two things live here that `api-server.ts` deliberately does not know: where the
 * settings are kept, and how a request is answered. The server is the protocol;
 * this is the policy.
 *
 * ## Off until asked for
 *
 * The endpoint does not start with the application. A port that opens by itself
 * is a change to the machine that the user did not ask for, and on the loopback
 * interface it is still a change — every process running as this user can reach
 * it. Starting it is a decision, and the switch that makes it is on the settings
 * page.
 *
 * ## Why the settings are a separate file
 *
 * `model-sources.json` holds the endpoints this application *calls*. This holds
 * the endpoint it *serves*. They would be easy to confuse in one file — both
 * have a `port` and a key — and the confusion is dangerous in one direction: a
 * key meant for callers being read as a credential to send somewhere.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { startApiServer } from './api-server.js';
/**
 * A port that is unlikely to collide.
 *
 * Chosen in the private range above the well-known ones and away from the
 * model server's own 8082 and the engine's ephemeral ports. Not zero — a random
 * port would make the endpoint's address change on every launch, which defeats
 * the only thing this exists for.
 */
const DEFAULT = {
    enabled: false,
    port: 11434,
    host: '127.0.0.1',
    apiKey: '',
    cors: false
};
function file(dataDirectory) {
    return join(dataDirectory, 'api-service.json');
}
/**
 * The saved settings, with every field validated.
 *
 * A hand-edited file is the expected failure mode — this one holds a port and a
 * key, and both are things someone might reasonably try to change in a text
 * editor — so each field is checked rather than trusted, and a bad one falls back
 * to the default instead of taking the whole file down.
 */
export function readApiService(dataDirectory) {
    let parsed;
    try {
        if (!existsSync(file(dataDirectory)))
            return { ...DEFAULT };
        parsed = JSON.parse(readFileSync(file(dataDirectory), 'utf8'));
    }
    catch {
        return { ...DEFAULT };
    }
    const record = (parsed ?? {});
    const port = Number(record.port);
    return {
        enabled: record.enabled === true,
        port: Number.isInteger(port) && port >= 1024 && port <= 65535 ? port : DEFAULT.port,
        /* Only two values, and anything else is the safe one. */
        host: record.host === '0.0.0.0' ? '0.0.0.0' : '127.0.0.1',
        apiKey: typeof record.apiKey === 'string' ? record.apiKey : '',
        cors: record.cors === true
    };
}
export function writeApiService(dataDirectory, next) {
    mkdirSync(dirname(file(dataDirectory)), { recursive: true });
    writeFileSync(file(dataDirectory), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}
let handle;
let settings = { ...DEFAULT };
let lastError;
let deps;
export function configureApiService(next) {
    deps = next;
    settings = readApiService(next.dataDirectory);
}
/** Current state, for the settings page and the status endpoint. */
export function apiServiceState() {
    return {
        running: handle !== undefined,
        ...(handle ? { url: handle.url, port: handle.port } : {}),
        ...(lastError !== undefined ? { error: lastError } : {}),
        settings
    };
}
/** Start it if the settings say so. Called once at launch. */
export async function startApiServiceIfEnabled() {
    if (!settings.enabled)
        return;
    await applyApiService(settings);
}
/**
 * Bring the running endpoint in line with these settings.
 *
 * Stop-then-start rather than a restart flag, because the port and the bind
 * address are both fixed at `listen` — there is nothing to reconfigure in place.
 * A failure is **reported and not thrown**: the caller is a settings form, and
 * a port already in use should appear next to the field rather than as a dialog.
 */
export async function applyApiService(next) {
    const store = deps?.dataDirectory;
    if (store)
        writeApiService(store, next);
    settings = next;
    lastError = undefined;
    if (handle) {
        await handle.stop();
        handle = undefined;
    }
    if (!next.enabled || !deps)
        return apiServiceState();
    try {
        handle = await startApiServer({
            port: next.port,
            host: next.host,
            apiKey: next.apiKey,
            cors: next.cors,
            complete: deps.complete,
            models: deps.models
        });
    }
    catch (cause) {
        /*
         * The common failure is a port already in use, and the message the operating
         * system gives for it — `EADDRINUSE` — is not something to put in front of a
         * user. This says what to do about it instead.
         */
        const message = cause instanceof Error ? cause.message : String(cause);
        lastError = /EADDRINUSE/i.test(message)
            ? `端口 ${String(next.port)} 已被占用，换一个再试。`
            : message;
    }
    return apiServiceState();
}
/** Stop it, on the way out. */
export async function stopApiService() {
    if (!handle)
        return;
    await handle.stop();
    handle = undefined;
}
