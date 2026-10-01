/*
 * Launching with the system.
 *
 * Electron owns this: `app.setLoginItemSettings` writes the platform's own
 * autostart record — the registry on Windows, a launch agent on macOS — so there
 * is nothing to keep in this application's settings file. What is stored is the
 * operating system's, and reading it back from the OS rather than from a copy is
 * what keeps the two from disagreeing when the user changes it elsewhere (Task
 * Manager's Startup tab on Windows, System Settings on macOS).
 *
 * That decision has a visible consequence: the switch reflects the machine, not
 * this application. If something else turns the autostart entry off, the switch
 * moves on the next read, and it is right to move — the setting is not in force.
 */
import { app } from './electron-shim.js';
/**
 * The autostart record, as the platform reports it.
 *
 * `openAtLogin` is macOS and Windows; older Electron also has `openAsHidden`,
 * which this does not use — the window should appear normally, and a hidden
 * launch would leave the user with a tray-less process they cannot see.
 */
export function readLaunchAtLogin() {
    if (!app.isPackaged) {
        return {
            enabled: false,
            supported: false,
            reason: '开发模式下不会登记开机自启，避免把 Electron 本体加进启动项。'
        };
    }
    try {
        return { enabled: app.getLoginItemSettings().openAtLogin, supported: true };
    }
    catch (error) {
        /*
         * Reading can throw on a platform without the concept, or with a policy
         * that forbids it. An unsupported answer is honest; guessing false would
         * present a switch that appears off and cannot be turned on.
         */
        return {
            enabled: false,
            supported: false,
            reason: error instanceof Error ? error.message : String(error)
        };
    }
}
/**
 * Turn it on or off.
 *
 * `path` and `args` are passed explicitly only on Windows, and only when
 * packaging: without them Electron registers whatever started the process, which
 * for a packaged app is already correct but for a portable build can be an
 * extracted temporary directory. Passing `process.execPath` pins the record to
 * the real executable.
 */
export function writeLaunchAtLogin(enabled) {
    const current = readLaunchAtLogin();
    if (!current.supported)
        return current;
    try {
        app.setLoginItemSettings({
            openAtLogin: enabled,
            ...(process.platform === 'win32' ? { path: process.execPath } : {})
        });
        /*
         * Read back rather than echo what was asked for. The write can be refused —
         * a managed machine, a policy, a missing permission — and a switch that
         * reported the requested position would then be showing a setting that is
         * not in force.
         */
        return readLaunchAtLogin();
    }
    catch (error) {
        return {
            enabled: current.enabled,
            supported: false,
            reason: error instanceof Error ? error.message : String(error)
        };
    }
}
