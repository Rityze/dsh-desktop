/*
 * What this machine is.
 *
 * For the settings page's own "system information" row, and for the questions a
 * person actually asks when something is slow: how much memory is there, how
 * much is free, what is the engine's own footprint. Those are the numbers that
 * turn "the app feels heavy" into something checkable.
 *
 * Everything here is read from the operating system on request rather than
 * cached. Memory in particular is a moving quantity, and a cached figure from
 * when the page opened would be the one number the user was trying to see change.
 */
import { app } from './electron-shim.js';
import { arch, cpus, freemem, hostname, platform, release, totalmem } from 'node:os';
/**
 * The GPU, as Electron reports it.
 *
 * `getGPUInfo('basic')` rather than `'complete'`: the complete answer is tens of
 * kilobytes of driver internals, and the two fields wanted here — the vendor and
 * model string — are in the basic one. Measured, `'basic'` returns
 * `{ auxAttributes: { glRenderer, glVendor }, gpuDevice: [{ vendorId, deviceId }] }`.
 *
 * The renderer string is preferred over the device ids because it is what a user
 * recognises: `AMD Radeon RX 7900 XTX` rather than `0x744c`. The ids are the
 * fallback for the case where the driver reports nothing useful, which happens
 * on machines running purely on software rendering.
 *
 * Resolves to an empty strings pair rather than throwing when the information is
 * unavailable — a settings row is not a reason to fail, and a machine with no
 * GPU is a real configuration.
 */
async function gpuInfo() {
    try {
        const info = (await app.getGPUInfo('basic'));
        const vendor = typeof info?.auxAttributes?.glVendor === 'string' ? info.auxAttributes.glVendor.trim() : '';
        const renderer = typeof info?.auxAttributes?.glRenderer === 'string' ? info.auxAttributes.glRenderer.trim() : '';
        /*
         * Some drivers prefix the renderer with the vendor already — measured, one
         * reports `ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0)`.
         * Adding the vendor in front of that would name it twice, so it is only
         * prepended when the renderer does not already carry it.
         */
        const model = vendor && renderer && !renderer.toLowerCase().includes(vendor.toLowerCase())
            ? `${vendor} ${renderer}`
            : renderer || vendor;
        return { gpuVendor: vendor, gpuModel: model };
    }
    catch {
        return { gpuVendor: '', gpuModel: '' };
    }
}
export async function systemInfoAsync() {
    const gpu = await gpuInfo();
    return { ...systemInfo(), ...gpu, hardwareAcceleration: hardwareAcceleration() };
}
/**
 * Whether the GPU is rendering the interface.
 *
 * Read from the compositing status rather than from a flag this application set,
 * because the user can turn acceleration off from outside — a command-line
 * switch, a GPU driver blocklist, a remote session — and the honest answer is
 * what is happening, not what was asked for.
 *
 * A status of `enabled` for compositing is the signal. Anything else — including
 * an absent entry, which is what a headless or fully-software run reports — is
 * treated as off, because the question is "is the GPU doing this" and only
 * `enabled` answers yes.
 */
function hardwareAcceleration() {
    try {
        /*
         * The type is Electron's own `GPUFeatureStatus`, whose members are all
         * declared as `string` — so the field is read directly rather than through
         * a loosened cast. The values are Chromium's status names (`enabled`,
         * `disabled_software`, …), which is why the comparison is against a literal
         * rather than a boolean.
         */
        return app.getGPUFeatureStatus().gpu_compositing === 'enabled';
    }
    catch {
        return false;
    }
}
export function systemInfo() {
    const memory = process.memoryUsage();
    return {
        appVersion: app.getVersion(),
        electron: process.versions.electron ?? '',
        chrome: process.versions.chrome ?? '',
        node: process.versions.node ?? '',
        platform: platform(),
        arch: arch(),
        osRelease: release(),
        hostname: hostname(),
        /*
         * Trimmed, because some CPU strings arrive padded to a fixed width — the
         * measured one for this machine ends in fourteen spaces, which would push
         * the row's layout around for no reason visible to the reader.
         */
        cpuModel: (cpus()[0]?.model ?? '').trim(),
        cpuCount: cpus().length,
        memoryTotalGB: Math.round(totalmem() / 1024 ** 3),
        memoryFreeGB: Math.round(freemem() / 1024 ** 3),
        memoryUsedMB: Math.round(memory.rss / 1024 ** 2),
        uptimeSec: Math.round(process.uptime()),
        /* Filled by `systemInfoAsync`; empty here because reading the GPU is async. */
        gpuVendor: '',
        gpuModel: '',
        hardwareAcceleration: true
    };
}
