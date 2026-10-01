/*
 * Removing a model file.
 *
 * The one destructive operation the model list offers, and it is built around
 * that: the file is a multi-gigabyte download the user may have spent an hour on,
 * so nothing here deletes. `shell.trashItem` moves it to the system recycle bin,
 * where it is recoverable — the same choice `uninstallPlugin` makes, for a
 * stronger version of the same reason.
 *
 * The path is not accepted from the caller. What arrives is a model id; the path
 * is resolved here by scanning the configured roots, and then checked to be
 * inside one of them. That is not defence against a malicious page — it is
 * defence against a *mistake*: a stale id, a list rendered from a snapshot taken
 * before the root was changed, a model that has since been moved. Any of those
 * would otherwise be a request with a path that no longer means what the caller
 * thought, and the operation is irreversible enough to warrant re-deriving it.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';
import { app, shell } from './electron-shim.js';
import { currentModelRoots, localModelEntries } from './local-models.js';
/**
 * Move one model file to the recycle bin.
 *
 * The id is resolved against a *fresh* scan rather than a cached list: the whole
 * point of re-deriving is that the answer may have changed, and reading it from
 * the cache would defeat that.
 */
export async function removeModelFile(modelId) {
    if (modelId.length === 0)
        return { ok: false, error: '模型标识无效。' };
    const models = await localModelEntries();
    const model = models.find((entry) => entry.id === modelId);
    if (!model) {
        return { ok: false, error: '这个模型不在当前目录里，可能已被移动或删除。' };
    }
    /*
     * Inside a configured root, by string prefix on a resolved path.
     *
     * The trailing separator matters: without it `/models-other/foo.gguf` starts
     * with `/models` and would pass. The scan already only returns files under the
     * roots, so this is the second check rather than the first — and the second
     * check is the one that holds when the first is the part that changed.
     */
    const roots = currentModelRoots();
    const inside = roots.some((root) => model.path.startsWith(root + sep));
    if (!inside) {
        return { ok: false, error: '模型文件不在已配置的目录里，已拒绝删除。' };
    }
    if (!existsSync(model.path)) {
        return { ok: false, error: '文件已经不在了，可能已被其他程序删除。' };
    }
    try {
        const stats = statSync(model.path);
        if (!stats.isFile()) {
            /*
             * A directory would be trashed whole, taking whatever else is in it. The
             * scan returns files, so reaching here means the path changed shape
             * between the read and the delete — which is exactly when to stop.
             */
            return { ok: false, error: '目标不是一个文件，已拒绝删除。' };
        }
    }
    catch (cause) {
        return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
    }
    try {
        await shell.trashItem(model.path);
    }
    catch (cause) {
        return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
    }
    return { ok: true, path: model.path };
}
/* ── Exporting what was read ─────────────────────────────────────────────── */
/**
 * The models as Markdown, for a note or an issue report.
 *
 * A table rather than a list, because the questions it answers are comparative —
 * which of these is the big one, which has the long context — and a table puts
 * those columns next to each other. The values are the same ones the detail
 * sheet shows, from the same read, so the two cannot disagree.
 */
export function modelsToMarkdown(models) {
    const lines = ['# 本地模型', '', `共 ${String(models.length)} 个。`, ''];
    lines.push('| 名称 | 架构 | 量化 | 上下文 | 大小 | 多模态 | MTP | 文件 |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const model of models) {
        const cells = [
            model.name,
            model.architecture ?? '—',
            model.quantization ?? '—',
            model.contextLength ? String(model.contextLength) : '—',
            model.humanSize ?? '—',
            model.multimodal ? '是' : '否',
            model.hasMtp ? '是' : '否',
            /* A pipe in a cell would end the row, and a path can contain one. */
            model.path.replace(/\|/g, '\\|')
        ];
        lines.push(`| ${cells.join(' | ')} |`);
    }
    return `${lines.join('\n')}\n`;
}
/**
 * The models as JSON.
 *
 * The scanner's own entries rather than a shape built here: a field added to the
 * scan should appear in the export without this function being edited, and a
 * hand-built object would silently drop it.
 */
export function modelsToJson(models) {
    return `${JSON.stringify({ exportedAt: new Date().toISOString(), models }, null, 2)}\n`;
}
/** Every model, as the export reads them. */
export async function modelSummaries() {
    return (await localModelEntries());
}
/* ── The load log ─────────────────────────────────────────────────────────── */
/**
 * The tail of this application's engine log, filtered to local-model lines.
 *
 * The feed exists because a load that stalls produces no phase change — measured,
 * a port conflict left `waitForHealthy` polling for its full ten minutes with the
 * phase stuck on `ready` — and the lines that say where it stopped are the only
 * evidence there is. The same stream is also the one that named the process
 * holding the port.
 *
 * Read from the file rather than kept in memory: the writer is the log call
 * itself, and a second in-memory copy would be a second thing to keep in step
 * with it. Bounded to the last few hundred lines so a long session cannot make
 * this expensive.
 */
export function readLocalLog(lines = 200) {
    try {
        const path = join(app.getPath('userData'), 'logs', 'mimo.log');
        const text = readFileSync(path, 'utf8');
        return text
            .split('\n')
            .filter((line) => line.includes('[local]'))
            /*
              The `[local]` marker is stripped: it is how the lines are selected, not
              something the reader needs to see on every one of them.
            */
            .map((line) => line.replace(/^.*\[local\]\s*/, ''))
            .slice(-lines);
    }
    catch {
        return [];
    }
}
/**
 * The most recent projection in the log, or undefined.
 *
 * The last match rather than the first: a load that needed adjustment prints
 * several rounds as it tries values, and the interesting one is the conclusion.
 */
export function readMemoryProjection() {
    try {
        const path = join(app.getPath('userData'), 'logs', 'mimo.log');
        const lines = readFileSync(path, 'utf8').split('\n');
        /*
         * Scanned backwards so a long log costs nothing: the projection is always at
         * the end, and this runs on every poll of the page.
         */
        let projectedMiB;
        let freeMiB;
        let remainingMiB;
        let targetMiB;
        let fits = false;
        let device;
        /*
         * Scanned backwards, and each pattern tested independently.
         *
         * The earlier version chained them — only look for `will leave` once
         * `projected` has been found — which assumed the lines arrive in that order.
         * They do in the log, and a backwards scan therefore meets `will leave`
         * first, fails to find `projected` on it, and moves on without recording
         * it. Each line is matched against every pattern now, so the order the scan
         * happens to take cannot matter.
         */
        for (let i = lines.length - 1; i >= Math.max(0, lines.length - 4000); i -= 1) {
            const line = lines[i] ?? '';
            if (!device) {
                const m = /- (ROCm\d+|CUDA\d+|Vulkan\d+)\s*: ([^(]+)\(([^)]*)\)/.exec(line);
                if (m?.[2] && m[3])
                    device = `${m[2].trim()}（${m[3]}）`;
            }
            if (!projectedMiB) {
                const m = /projected to use (\d+) MiB of device memory vs\. (\d+) MiB of free/.exec(line);
                if (m) {
                    projectedMiB = Number(m[1]);
                    freeMiB = Number(m[2]);
                }
            }
            if (!remainingMiB) {
                const m = /will leave (\d+) >= (\d+) MiB of free device memory/.exec(line);
                if (m) {
                    remainingMiB = Number(m[1]);
                    targetMiB = Number(m[2]);
                    /*
                     * The trailing phrase is the verdict, not the inequality.
                     *
                     * Measured: `will leave 6507 >= 1024 MiB of free device memory, no
                     * changes needed`. The comparison is what was computed; the words
                     * after it are what was decided. Reading the comparison as the
                     * verdict reported "needs adjustment" for a load that said it needed
                     * none.
                     */
                    fits = /no changes needed\s*$/i.test(line);
                }
            }
            if (projectedMiB && remainingMiB !== undefined && device)
                break;
        }
        if (!projectedMiB || freeMiB === undefined)
            return undefined;
        return {
            projectedMiB,
            freeMiB,
            remainingMiB: remainingMiB ?? freeMiB - projectedMiB,
            targetMiB: targetMiB ?? 0,
            fits,
            ...(device ? { device } : {})
        };
    }
    catch {
        return undefined;
    }
}
