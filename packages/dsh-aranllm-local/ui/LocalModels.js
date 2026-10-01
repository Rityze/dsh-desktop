import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon/Icon.js';
import { Modal } from './Modal/Modal.js';
import { ParameterPanel } from './ParameterPanel.js';
import { bridge } from './bridge-adapter.js';
import './local-models.css';
/** What the five load phases are called in the progress line. */
const PHASE_LABEL = {
    opening: '打开模型文件',
    verifying: '校验文件头',
    reading: '读取权重',
    initializing: '初始化推理引擎',
    ready: '就绪'
};
/**
 * How often the page re-reads while something is loading.
 *
 * A second is chosen against the two things the poll drives: the elapsed timer
 * and the phase name. Both change on the scale of seconds — a weight read takes
 * tens of them — so a faster interval would re-render the list for no visible
 * difference, and a slower one would leave the timer visibly stepping.
 */
const POLL_MS = 1000;
function seconds(ms) {
    const total = Math.floor(ms / 1000);
    const minutes = Math.floor(total / 60);
    return minutes > 0 ? `${minutes} 分 ${total % 60} 秒` : `${total} 秒`;
}
/** A byte count at the scale a model library is measured in. */
function gigabytes(bytes) {
    const gb = bytes / 1024 ** 3;
    if (gb >= 1)
        return `${gb.toFixed(2)} GB`;
    const mb = bytes / 1024 ** 2;
    if (mb >= 1)
        return `${mb.toFixed(1)} MB`;
    return `${String(Math.max(1, Math.round(bytes / 1024)))} KB`;
}
/**
 * One row's meta line: the facts about a file, in the order they matter.
 *
 * The context figure is labelled as a ceiling, and the word is doing real work.
 * `contextLength` is what the file declares it was trained for, which is the
 * largest window it can serve — it is not the window a load will use, and a
 * bare "198K 上下文" beside a 13 GiB file reads as a promise about the running
 * model. A load starts far below this unless the user has raised it (see
 * `DEFAULT_CONTEXT_LENGTH`), so the two numbers are different facts and are
 * worded as such. The loaded row below shows what is actually being served.
 */
function describe(model) {
    const parts = [];
    if (model.architecture)
        parts.push(model.architecture);
    if (model.sizeLabel)
        parts.push(model.sizeLabel);
    if (model.quantization)
        parts.push(model.quantization);
    parts.push(model.humanSize);
    if (model.contextLength)
        parts.push(`上下文上限 ${Math.round(model.contextLength / 1024)}K`);
    return parts.join(' · ');
}
export function LocalModels() {
    const [snapshot, setSnapshot] = useState(undefined);
    const [failure, setFailure] = useState(undefined);
    const [busyId, setBusyId] = useState(undefined);
    /** Whether a stop is in flight, so the button can say so rather than repeat. */
    const [cancellingLoad, setCancellingLoad] = useState(false);
    /** Whether a model import is running — the dialog is blocking, this is the wait after it. */
    const [importing, setImporting] = useState(false);
    const [notice, setNotice] = useState(undefined);
    /** Every library being read, in order. More than one is a normal state. */
    const [libraries, setLibraries] = useState([]);
    /** The folder just picked, and what moving into it would involve. */
    const [pendingMove, setPendingMove] = useState(undefined);
    const [moving, setMoving] = useState(false);
    /*
     * The model whose parameters are open.
     *
     * Held by id rather than as a copy of the entry: the catalogue is re-read
     * after every action, and a held object would keep showing the size and path
     * from before a rescan.
     */
    const [tuning, setTuning] = useState(undefined);
    /*
     * The filter and the sort.
     *
     * Local state rather than anything persisted: a search is a question about
     * this moment, and a filter that survived a relaunch would hide models with no
     * visible reason why — the field above the list is the only sign, and it is
     * not where anyone looks first.
     */
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('name');
    /*
     * Which model's detail sheet is open, by id.
     *
     * By id rather than holding the entry: the snapshot is replaced on every poll
     * and an entry captured when the sheet opened would stop matching the file it
     * describes — a reload that changed its size would show the old one.
     */
    const [detail, setDetail] = useState(undefined);
    /*
     * The model awaiting a delete confirmation, by id.
     *
     * Confirmed even though it is recoverable: what moves is a multi-gigabyte
     * file, and a user who did not mean to press it should not have to find the
     * recycle bin to undo it. The dialog says where it goes, which is the part
     * that makes the recovery believable.
     */
    const [removing, setRemoving] = useState(undefined);
    const [removeBusy, setRemoveBusy] = useState(false);
    const [removeNote, setRemoveNote] = useState(undefined);
    /*
     * The listening port.
     *
     * Read from the main process rather than kept as a constant: it is
     * configurable, and a copy here would go stale the moment it changed.
     */
    const [port, setPort] = useState(undefined);
    /*
     * The load log, shown while a load runs.
     *
     * Polled rather than pushed: the file is written by the engine process, and a
     * subscription would need to be told about writes that happen outside this one.
     * Only while loading — a log that stayed on screen afterwards would be a
     * console, and this is a progress report.
     */
    const [logLines, setLogLines] = useState([]);
    /*
     * llama.cpp's own memory projection, read once when a load finishes.
     *
     * Not polled: it is written during the load and does not change afterwards,
     * so reading it on the same cadence as the counters would be a request per
     * second for the same value.
     */
    const [memory, setMemory] = useState(undefined);
    /*
     * The running server's counters.
     *
     * Polled while a model is loaded and only then: the numbers are meaningless
     * without a server, and a poll that ran anyway would be a request per second
     * for `undefined`.
     */
    const [stats, setStats] = useState(undefined);
    const [editingPort, setEditingPort] = useState(undefined);
    /*
     * Which address was just copied, and a timer to clear the confirmation.
     *
     * The label has to change on click or the button gives no sign it did
     * anything — the clipboard is invisible, and "did that work?" is the only
     * question a copy button raises. Cleared rather than left reading 已复制 so
     * the button can be used again without a reload.
     */
    const [copied, setCopied] = useState(undefined);
    useEffect(() => {
        void bridge.models.port().then(setPort).catch(() => undefined);
    }, []);
    /**
     * Put one of the two base URLs on the clipboard.
     *
     * They differ by more than the port, and that is why both exist. An
     * OpenAI-compatible client takes a base that **includes** `/v1`, because its
     * SDK appends only the endpoint; the Anthropic SDK appends `/v1/messages`
     * itself, so its base must **exclude** it. Pasting one into the other's field
     * produces `/v1/v1/…` or a bare host, and both fail as a connection error
     * with nothing in it to point at the cause.
     *
     * Measured against a running llama-server: `/v1/chat/completions` and
     * `/v1/messages` are both served, and the second answers in Anthropic's own
     * shape — `type: "message"`, `stop_reason`, content blocks — rather than
     * being translated. So neither address is aspirational.
     */
    const copyAddress = useCallback(async (which, value) => {
        try {
            await bridge.shell.copyText(value);
            setCopied(which);
            window.setTimeout(() => setCopied((current) => (current === which ? undefined : current)), 1600);
        }
        catch {
            setNotice('复制失败，请手动选中地址复制。');
        }
    }, []);
    /*
     * Whether a load is in flight, read by the poll.
     *
     * A ref rather than state because the interval reads it on every tick without
     * being rebuilt by it. Rebuilding on each change would restart the timer at
     * the moment the load it is watching begins, which is precisely when the
     * elapsed count matters.
     */
    const loading = useRef(false);
    const read = useCallback(async () => {
        try {
            setSnapshot(await bridge.models.localCatalog());
            setFailure(undefined);
        }
        catch (cause) {
            setFailure(cause instanceof Error ? cause.message : String(cause));
        }
    }, []);
    useEffect(() => {
        void read();
    }, [read]);
    /*
     * Whether to poll, which is not the same as whether a load is reported.
     *
     * `progress` is read from the manager, and the manager only reports one while
     * a load is running — so gating the poll on it is circular: the page does not
     * poll because there is no progress, and there is no progress on screen because
     * it does not poll. Measured: the progress bar and the log stayed empty for a
     * whole nineteen-second load.
     *
     * `busyId` is the other half, and it is the one that can start the cycle: it is
     * set the moment the user asks for a load and cleared when the request
     * returns, which spans exactly the window the poll exists to cover.
     */
    const active = snapshot?.progress !== undefined || busyId !== undefined;
    useEffect(() => {
        loading.current = active;
        if (!active)
            return;
        const timer = window.setInterval(() => void read(), POLL_MS);
        return () => window.clearInterval(timer);
    }, [active, read]);
    const load = useCallback(async (modelId) => {
        setBusyId(modelId);
        setNotice(undefined);
        try {
            const result = await bridge.models.loadLocal(modelId);
            if (!result.ok)
                setNotice(result.error);
            /*
             * Re-read either way. A failure may still have moved the manager — it
             * unloads the previous model before starting the next — so the list and
             * the running state have to be taken from the manager rather than
             * assumed from the result.
             */
            await read();
        }
        catch (cause) {
            setNotice(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setBusyId(undefined);
        }
    }, [read]);
    const unload = useCallback(async () => {
        setNotice(undefined);
        try {
            await bridge.models.unloadLocal();
            await read();
        }
        catch (cause) {
            setNotice(cause instanceof Error ? cause.message : String(cause));
        }
    }, [read]);
    /** Re-read the library list. Cheap, and always taken from the main process. */
    const readLibraries = useCallback(async () => {
        try {
            const answer = await bridge.models.library();
            setLibraries(Array.isArray(answer?.roots) ? answer.roots : []);
        }
        catch {
            // The list stays as it was; the catalogue below still renders.
        }
    }, []);
    useEffect(() => {
        void readLibraries();
    }, [readLibraries]);
    /**
     * Ask the system for a folder, then ask what to do with the models already here.
     *
     * Two steps rather than one, because changing the folder has a consequence
     * the folder itself does not express: the models under the old root are not
     * under the new one, so the catalogue empties. The user is asked which of the
     * two things they meant — bring the models along, or keep reading both — and
     * that question is the feature. A silent move of tens of gigabytes is not
     * undoable, and a silent non-move looks like the models were lost.
     *
     * The folder comes from the operating system's own picker rather than a text
     * field. A typed path can be wrong in a way that produces an *empty
     * catalogue* rather than an error, which reads as "the models are gone"; the
     * native dialog cannot return a path that does not exist.
     */
    const chooseRoot = useCallback(async () => {
        setNotice(undefined);
        try {
            const picked = await bridge.models.chooseDirectory(libraries[0]);
            /* Cancelling is a decision, not a failure. Nothing is said about it. */
            if (!picked)
                return;
            const preview = await bridge.models.previewMove(picked);
            if (preview.blocked) {
                setNotice(preview.blocked);
                return;
            }
            setPendingMove({ to: picked, preview });
        }
        catch (cause) {
            setNotice(cause instanceof Error ? cause.message : String(cause));
        }
    }, [libraries]);
    /** Pick a folder and add it as an additional library, moving nothing. */
    const addRoot = useCallback(async () => {
        setNotice(undefined);
        try {
            const picked = await bridge.models.chooseDirectory(libraries[0]);
            if (!picked)
                return;
            if (libraries.some((root) => root.toLowerCase() === picked.toLowerCase())) {
                setNotice('这个目录已经在模型库里了。');
                return;
            }
            /*
             * Added behind the existing roots, so the first library keeps producing
             * the unsuffixed model ids — adding a second folder should not rename
             * what the user already sees.
             */
            const result = await bridge.models.setLocalRoot([...libraries, picked].join(';'));
            if (!result.ok) {
                setNotice(result.error);
                return;
            }
            setSnapshot(result.value);
            await readLibraries();
        }
        catch (cause) {
            setNotice(cause instanceof Error ? cause.message : String(cause));
        }
    }, [libraries, readLibraries]);
    /** Stop reading one folder. The files are not touched. */
    const removeRoot = useCallback(async (root) => {
        setNotice(undefined);
        try {
            const remaining = libraries.filter((entry) => entry !== root);
            const result = await bridge.models.setLocalRoot(remaining.join(';'));
            if (!result.ok) {
                setNotice(result.error);
                return;
            }
            setSnapshot(result.value);
            await readLibraries();
        }
        catch (cause) {
            setNotice(cause instanceof Error ? cause.message : String(cause));
        }
    }, [libraries, readLibraries]);
    /** Carry out the choice: move the files, or add the folder and keep both. */
    const confirmMove = useCallback(async (keepOld) => {
        const pending = pendingMove;
        if (!pending)
            return;
        setPendingMove(undefined);
        setMoving(true);
        setNotice(undefined);
        try {
            const result = await bridge.models.moveLibrary(pending.to, keepOld);
            if (!result.ok) {
                setNotice(result.error ?? '目录切换失败。');
                return;
            }
            await read();
            await readLibraries();
            if (result.skipped && result.skipped.length > 0) {
                /*
                 * Said even though the move succeeded, and said as what happened
                 * rather than as an error: those files are still readable under the
                 * old root, which is why the old root is among the libraries listed
                 * above. A silent partial move is the version of this that confuses.
                 */
                setNotice(`有 ${String(result.skipped.length)} 个文件没能移动，它们仍在原目录。`);
            }
        }
        catch (cause) {
            setNotice(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setMoving(false);
        }
    }, [pendingMove, read, readLibraries]);
    const loaded = snapshot?.loaded;
    const progress = snapshot?.progress;
    useEffect(() => {
        if (!loaded) {
            setMemory(undefined);
            return undefined;
        }
        void bridge.models.memory().then(setMemory).catch(() => undefined);
        return undefined;
    }, [loaded]);
    useEffect(() => {
        if (!loaded) {
            setStats(undefined);
            return undefined;
        }
        let cancelled = false;
        const read = () => {
            void bridge.models
                .stats()
                .then((value) => {
                if (!cancelled)
                    setStats(value);
            })
                .catch(() => undefined);
        };
        read();
        /*
         * Two seconds. The counters move per request rather than per token — the
         * server accumulates them and this is a readout, not a live rate — so a
         * faster poll would re-render for no visible change.
         */
        const timer = window.setInterval(read, 2000);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [loaded]);
    useEffect(() => {
        /*
         * Shown while the user is waiting, not only while the manager reports a
         * load. The two windows differ by the time between the request leaving and
         * the manager registering it, which is small — but the panel is also the
         * thing that says what is happening when the manager reports *nothing*,
         * which is what a stalled load looks like.
         */
        if (busyId === undefined && !progress) {
            /* Cleared when the load ends: what is left is the next load's to fill. */
            setLogLines([]);
            return undefined;
        }
        let cancelled = false;
        const read = () => {
            void bridge.models
                .log(120)
                .then((lines) => {
                if (!cancelled)
                    setLogLines(lines);
            })
                .catch(() => undefined);
        };
        read();
        const timer = window.setInterval(read, 1500);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
        };
    }, [progress, busyId]);
    const binary = snapshot?.binary;
    const modelName = snapshot?.models.find((entry) => entry.id === tuning)?.name;
    /*
     * What the list shows, after the filter and the sort.
     *
     * `useMemo` on the snapshot rather than a copy in state: the snapshot is
     * replaced on every poll — once a second while a load runs — and a list held
     * separately would have to be written from each of those, which is the shape
     * that goes stale the first time a path forgets.
     */
    const shown = useMemo(() => {
        const models = snapshot?.models ?? [];
        const needle = query.trim().toLowerCase();
        const filtered = needle.length === 0
            ? models
            : models.filter((model) => model.name.toLowerCase().includes(needle) ||
                model.id.toLowerCase().includes(needle) ||
                (model.architecture ?? '').toLowerCase().includes(needle) ||
                (model.quantization ?? '').toLowerCase().includes(needle));
        /*
         * A copy before sorting — `filter` already returns one, but the
         * unfiltered branch returns the snapshot's own array, and `sort` mutates.
         */
        const sorted = [...filtered];
        if (sort === 'size')
            sorted.sort((a, b) => b.bytes - a.bytes);
        else if (sort === 'context')
            sorted.sort((a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0));
        else
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        return sorted;
    }, [snapshot, query, sort]);
    return (_jsxs("div", { className: "local-models", children: [_jsxs("header", { className: "local-models__head", children: [_jsxs("div", { children: [_jsx("h1", { className: "local-models__title", children: "\u672C\u5730\u6A21\u578B" }), _jsx("p", { className: "local-models__hint", children: "\u5728\u8FD9\u91CC\u7684\u6A21\u578B\u7531\u672C\u673A\u8FD0\u884C\uFF0C\u901F\u5EA6\u53D6\u51B3\u4E8E\u663E\u5361\uFF0C\u4E0E\u7F51\u7EDC\u65E0\u5173\u3002\u52A0\u8F7D\u7531\u4F60\u624B\u52A8\u89E6\u53D1\uFF0C \u6253\u5F00\u5E94\u7528\u4E0D\u4F1A\u81EA\u52A8\u52A0\u8F7D\u3002" })] }), _jsxs("div", { className: "local-models__head-actions", children: [loaded ? (_jsxs("button", { type: "button", className: "local-models__action", onClick: () => void unload(), children: [_jsx(Icon, { name: "circle-ban-sign", size: "small" }), "\u5378\u8F7D"] })) : null, _jsxs("button", { type: "button", className: "local-models__action", "data-tone": "quiet", disabled: importing, onClick: () => {
                                    setImporting(true);
                                    setNotice(undefined);
                                    void bridge.models
                                        .importModel()
                                        .then((answer) => {
                                        if (answer.ok) {
                                            setNotice(`已导入 ${answer.publisher}/${answer.model}`);
                                            return read();
                                        }
                                        if (answer.cancelled !== true)
                                            setNotice(answer.error ?? '导入失败。');
                                        return undefined;
                                    })
                                        .catch((cause) => {
                                        setNotice(cause instanceof Error ? cause.message : '导入失败。');
                                    })
                                        .finally(() => setImporting(false));
                                }, children: [_jsx(Icon, { name: "cloud-upload", size: "small" }), importing ? '导入中…' : '导入'] }), _jsxs("button", { type: "button", className: "local-models__action", "data-tone": "quiet", onClick: () => void read(), disabled: active, children: [_jsx(Icon, { name: "magnifying-glass", size: "small" }), "\u91CD\u65B0\u626B\u63CF"] })] })] }), failure ? _jsx("p", { className: "local-models__error", children: failure }) : null, notice ? _jsx("p", { className: "local-models__error", children: notice }) : null, removeNote ? _jsxs("p", { className: "local-models__error", children: ["\u5220\u9664\u5931\u8D25\uFF1A", removeNote] }) : null, _jsxs("div", { className: "local-models__address", children: [_jsx(Icon, { name: "server", size: "small" }), editingPort !== undefined ? (_jsxs("form", { className: "local-models__address-form", onSubmit: (event) => {
                            event.preventDefault();
                            /*
                             * The field takes a full address and only the port is used.
                             *
                             * Accepting `127.0.0.1:8080` as well as `8080` costs one split and
                             * removes the failure a pasted address would otherwise cause —
                             * `Number('127.0.0.1:8080')` is NaN, and a rejected paste reads as
                             * a broken field rather than as a value that was not asked for.
                             */
                            const raw = editingPort.trim();
                            const next = Number(raw.includes(':') ? (raw.split(':').pop() ?? '') : raw);
                            setEditingPort(undefined);
                            void bridge.models.setPort(next).then((r) => {
                                setPort(r.port);
                                setNotice(r.ok ? `服务地址已改为 127.0.0.1:${String(r.port)}，内核正在重启。` : r.error);
                            });
                        }, children: [_jsx("input", { className: "local-models__address-input", value: editingPort, autoFocus: true, spellCheck: false, "aria-label": "\u670D\u52A1\u5730\u5740", onChange: (event) => setEditingPort(event.target.value) }), _jsx("button", { type: "submit", className: "local-models__action", children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", className: "local-models__action", "data-tone": "quiet", onClick: () => setEditingPort(undefined), children: "\u53D6\u6D88" })] })) : (_jsxs(_Fragment, { children: [_jsxs("code", { className: "local-models__address-value", children: ["127.0.0.1:", port ?? '…'] }), _jsx("button", { type: "button", className: "local-models__action", "data-tone": "quiet", title: "\u6A21\u578B\u670D\u52A1\u76D1\u542C\u7684\u5730\u5740\uFF0C\u6539\u52A8\u4F1A\u91CD\u542F\u5185\u6838", onClick: () => setEditingPort(port !== undefined ? `127.0.0.1:${String(port)}` : ''), children: "\u4FEE\u6539" }), port !== undefined ? (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: "local-models__action", "data-tone": "quiet", title: copied === 'openai' ? '已复制' : '复制 OpenAI 兼容地址（含 /v1）', onClick: () => void copyAddress('openai', `http://127.0.0.1:${String(port)}/v1`), children: [_jsx(Icon, { name: "copy", size: "small" }), copied === 'openai' ? '已复制' : 'OpenAI'] }), _jsxs("button", { type: "button", className: "local-models__action", "data-tone": "quiet", title: copied === 'claude' ? '已复制' : '复制 Claude 兼容地址（不含 /v1）', onClick: () => void copyAddress('claude', `http://127.0.0.1:${String(port)}`), children: [_jsx(Icon, { name: "copy", size: "small" }), copied === 'claude' ? '已复制' : 'Claude'] })] })) : null] }))] }), snapshot && !binary ? (_jsxs("p", { className: "local-models__error", children: ["\u6CA1\u6709\u627E\u5230 llama-server\u3002\u8BF7\u628A\u5B83\u653E\u8FDB\u6A21\u578B\u76EE\u5F55\uFF0C\u6216\u8BBE\u7F6E ", _jsx("code", { children: "LLAMA_SERVER" }), " \u6307\u5411\u5B83\u3002"] })) : null, _jsxs("section", { className: "local-models__section", children: [_jsx("h2", { className: "local-models__section-title", children: "\u6A21\u578B\u5E93" }), _jsxs("ul", { className: "local-models__roots", children: [libraries.map((root, index) => (_jsxs("li", { className: "local-models__root", children: [_jsx("code", { className: "local-models__root-path", title: root, children: root }), index === 0 ? _jsx("span", { className: "local-models__root-tag", children: "\u4E3B\u5E93" }) : null, libraries.length > 1 && index > 0 ? (_jsx("button", { type: "button", className: "local-models__action", "data-tone": "quiet", title: "\u4E0D\u518D\u8BFB\u53D6\u8FD9\u4E2A\u76EE\u5F55\u91CC\u7684\u6A21\u578B", onClick: () => void removeRoot(root), children: "\u79FB\u9664" })) : null] }, root))), libraries.length === 0 ? _jsx("li", { className: "local-models__root", children: "\uFF08\u672A\u8BBE\u7F6E\uFF09" }) : null] }), _jsxs("div", { className: "local-models__root-actions", children: [_jsxs("button", { type: "button", className: "local-models__action", disabled: moving, onClick: () => void chooseRoot(), children: [_jsx(Icon, { name: "folder-add-left", size: "small" }), moving ? '正在迁移…' : '更换文件夹'] }), _jsx("button", { type: "button", className: "local-models__action", "data-tone": "quiet", disabled: moving, onClick: () => void addRoot(), children: "\u6DFB\u52A0\u526F\u5E93" })] }), pendingMove ? (_jsxs("div", { className: "local-models__move", role: "alertdialog", "aria-label": "\u8FC1\u79FB\u6A21\u578B", children: [_jsxs("p", { className: "local-models__move-title", children: ["\u65B0\u76EE\u5F55\uFF1A", _jsx("code", { children: pendingMove.to })] }), _jsx("p", { className: "local-models__move-body", children: pendingMove.preview.files > 0 ? (_jsxs(_Fragment, { children: ["\u5F53\u524D\u5E93\u91CC\u6709 ", String(pendingMove.preview.files), " \u4E2A\u6A21\u578B\u6587\u4EF6\uFF0C \u5171 ", gigabytes(pendingMove.preview.bytes), "\u3002 \u8981\u628A\u5B83\u4EEC\u8FC1\u79FB\u5230\u65B0\u76EE\u5F55\u5417\uFF1F"] })) : (_jsx(_Fragment, { children: "\u5F53\u524D\u5E93\u91CC\u6CA1\u6709\u6A21\u578B\u6587\u4EF6\uFF0C\u53EF\u4EE5\u76F4\u63A5\u5207\u6362\u3002" })) }), pendingMove.preview.sample.length > 0 ? (_jsxs("p", { className: "local-models__move-sample", children: [pendingMove.preview.sample.slice(0, 2).join('、'), pendingMove.preview.files > 2 ? ` 等 ${String(pendingMove.preview.files)} 个` : ''] })) : null, _jsxs("div", { className: "local-models__move-actions", children: [pendingMove.preview.files > 0 ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "local-models__action", onClick: () => void confirmMove(false), children: "\u8FC1\u79FB\u8FC7\u53BB" }), _jsx("button", { type: "button", className: "local-models__action", "data-tone": "quiet", onClick: () => void confirmMove(true), children: "\u4E0D\u8FC1\u79FB\uFF0C\u4FDD\u7559\u539F\u76EE\u5F55" })] })) : (_jsx("button", { type: "button", className: "local-models__action", onClick: () => void confirmMove(true), children: "\u5207\u6362" })), _jsx("button", { type: "button", className: "local-models__action", "data-tone": "quiet", onClick: () => setPendingMove(undefined), children: "\u53D6\u6D88" })] }), pendingMove.preview.files > 0 ? (_jsx("p", { className: "local-models__move-note", children: "\u4E0D\u8FC1\u79FB\u7684\u8BDD\uFF0C\u539F\u76EE\u5F55\u4F1A\u4F5C\u4E3A\u526F\u5E93\u7EE7\u7EED\u8BFB\u53D6\uFF0C\u4E24\u4E2A\u76EE\u5F55\u7684\u6A21\u578B\u90FD\u4F1A\u51FA\u73B0\u5728\u4E0B\u9762\u7684\u5217\u8868\u91CC\u3002" })) : null] })) : null] }), _jsxs("section", { className: "local-models__section", children: [_jsxs("div", { className: "local-models__section-head", children: [_jsx("h2", { className: "local-models__section-title", children: "\u53EF\u7528\u6A21\u578B" }), snapshot && snapshot.models.length > 0 ? (_jsx("span", { className: "local-models__count", children: query.trim().length > 0
                                    ? `${shown.length} / ${snapshot.models.length} 个`
                                    : `${snapshot.models.length} 个` })) : null] }), snapshot && snapshot.models.length > 0 ? (_jsxs("div", { className: "local-models__toolbar", children: [_jsx("input", { type: "text", className: "local-models__search", placeholder: "\u641C\u7D22\u540D\u79F0\u3001\u67B6\u6784\u6216\u91CF\u5316", "aria-label": "\u641C\u7D22\u6A21\u578B", value: query, spellCheck: false, onChange: (event) => setQuery(event.target.value) }), _jsx("div", { className: "local-models__sort", role: "radiogroup", "aria-label": "\u6392\u5E8F\u65B9\u5F0F", children: [
                                    ['name', '名称'],
                                    ['size', '大小'],
                                    ['context', '上下文']
                                ].map(([value, label]) => (_jsx("button", { type: "button", role: "radio", "aria-checked": sort === value, className: "local-models__sort-item", "data-active": sort === value ? 'true' : undefined, onClick: () => setSort(value), children: label }, value))) })] })) : null, query.trim().length > 0 && shown.length === 0 ? (_jsx("p", { className: "local-models__empty", children: "\u6CA1\u6709\u5339\u914D\u7684\u6A21\u578B\u3002" })) : null, progress ? (_jsxs("div", { className: "local-models__progress", children: [_jsxs("div", { className: "local-models__progress-line", children: [_jsx("span", { className: "local-models__progress-name", children: progress.modelName }), _jsxs("span", { className: "local-models__progress-phase", children: [PHASE_LABEL[progress.phase] ?? progress.phase, progress.phaseDetail ? ` · ${progress.phaseDetail}` : ''] }), _jsx("span", { className: "local-models__progress-time", children: seconds(progress.elapsedMs) }), _jsx("button", { type: "button", className: "local-models__progress-cancel", disabled: cancellingLoad, onClick: () => {
                                            setCancellingLoad(true);
                                            void bridge.models
                                                .unloadLocal()
                                                .catch(() => undefined)
                                                .finally(() => setCancellingLoad(false));
                                        }, children: cancellingLoad ? '正在停止…' : '停止加载' })] }), _jsx("div", { className: "local-models__bar", role: "progressbar", "aria-valuenow": progress.progress, children: _jsx("div", { className: "local-models__bar-fill", style: { width: `${Math.round(progress.progress * 100)}%` } }) })] })) : null, logLines.length > 0 ? (_jsxs("details", { className: "local-models__log", open: true, children: [_jsxs("summary", { className: "local-models__log-head", children: ["\u52A0\u8F7D\u65E5\u5FD7\uFF08", logLines.length, " \u884C\uFF09"] }), _jsx("pre", { className: "local-models__log-body", ref: (el) => el?.scrollTo(0, el.scrollHeight), children: logLines.join('\n') })] })) : null, stats ? (_jsxs("div", { className: "local-models__stats", children: [stats.predictedTokens === 0 &&
                                stats.promptTokens === 0 &&
                                stats.requestsProcessing === 0 ? (_jsx("span", { className: "local-models__stat", children: "\u8FD8\u6CA1\u6709\u8BF7\u6C42\u7ECF\u8FC7\u8FD9\u4E2A\u6A21\u578B\u3002" })) : null, stats.predictedTokens > 0 ? (_jsxs("span", { className: "local-models__stat", children: ["\u751F\u6210", ' ', _jsx("strong", { children: (stats.predictedTokens / Math.max(stats.predictedSeconds, 0.001)).toFixed(1) }), ' ', "tok/s"] })) : null, stats.promptTokens + stats.cachedTokens > 0 ? (_jsxs("span", { className: "local-models__stat", children: ["\u63D0\u793A\u8BCD ", _jsx("strong", { children: stats.promptTokens + stats.cachedTokens }), " token", stats.cachedTokens > 0 ? `（缓存复用 ${stats.cachedTokens}）` : ''] })) : null, stats.draftTokens > 0 ? (_jsxs("span", { className: "local-models__stat", children: ["\u63A8\u6D4B\u63A5\u53D7\u7387", ' ', _jsxs("strong", { children: [((stats.acceptedTokens / stats.draftTokens) * 100).toFixed(0), "%"] }), "\uFF08", stats.acceptedTokens, "/", stats.draftTokens, "\uFF09"] })) : null, stats.requestsDeferred > 0 ? (_jsxs("span", { className: "local-models__stat", "data-warn": "true", children: ["\u6392\u961F\u8BF7\u6C42 ", stats.requestsDeferred] })) : null] })) : null, memory ? (_jsxs("div", { className: "local-models__memory", children: [_jsxs("span", { className: "local-models__stat", children: ["\u663E\u5B58 ", _jsx("strong", { children: memory.projectedMiB }), " MiB / \u53EF\u7528 ", memory.freeMiB, " MiB \uFF0C\u5269\u4F59 ", _jsx("strong", { children: memory.remainingMiB }), " MiB", memory.targetMiB > 0 ? `（保留 ${memory.targetMiB}）` : ''] }), memory.device ? _jsx("span", { className: "local-models__stat", children: memory.device }) : null, !memory.fits ? (_jsx("span", { className: "local-models__stat", "data-warn": "true", children: "\u5F15\u64CE\u8C03\u6574\u4E86\u52A0\u8F7D\u53C2\u6570\u624D\u88C5\u4E0B\uFF0C\u53EF\u51CF\u5C0F\u4E0A\u4E0B\u6587\u6216\u5378\u8F7D\u5C42\u6570\u7559\u51FA\u4F59\u91CF" })) : null] })) : null, loaded ? (_jsxs("div", { className: "local-models__running", children: [_jsx(Icon, { name: "circle-check", size: "small" }), _jsx("span", { className: "local-models__running-name", children: loaded.modelName }), _jsx("code", { className: "local-models__running-url", children: loaded.baseURL }), loaded.contextLength ? (_jsxs("span", { className: "local-models__running-meta", children: ["\u4E0A\u4E0B\u6587 ", Math.round(loaded.contextLength / 1024), "K"] })) : null, loaded.multimodal ? (_jsx("span", { className: "local-models__tag", "data-tone": "vision", children: "\u652F\u6301\u56FE\u7247" })) : null] })) : null, snapshot === undefined ? (_jsx("p", { className: "local-models__empty", children: "\u6B63\u5728\u626B\u63CF\u2026" })) : snapshot.models.length === 0 ? (_jsxs("p", { className: "local-models__empty", children: ["\u8FD9\u4E2A\u76EE\u5F55\u91CC\u6CA1\u6709\u627E\u5230 GGUF \u6A21\u578B\u3002\u628A ", _jsx("code", { children: ".gguf" }), " \u6587\u4EF6\u653E\u8FDB\u53BB\uFF0C\u518D\u70B9\u300C\u91CD\u65B0\u626B\u63CF\u300D\u3002"] })) : (_jsx("ul", { className: "local-models__list", children: shown.map((model) => {
                            const isLoaded = loaded?.modelId === model.id;
                            const isLoading = progress?.modelId === model.id;
                            const isTuning = tuning === model.id;
                            return (_jsxs("li", { className: "local-models__item", "data-loaded": isLoaded ? 'true' : undefined, "data-loading": isLoading ? 'true' : undefined, children: [_jsxs("div", { className: "local-models__item-main", children: [_jsxs("div", { className: "local-models__item-name", children: [model.name, model.multimodal ? (_jsx("span", { className: "local-models__tag", "data-tone": "vision", children: "\u56FE\u7247" })) : null, model.hasMtp ? (_jsx("span", { className: "local-models__tag", "data-tone": "mtp", children: "MTP" })) : null] }), _jsx("div", { className: "local-models__item-meta", children: describe(model) }), _jsx("div", { className: "local-models__item-path", children: model.path })] }), _jsx("button", { type: "button", className: "local-models__action", "data-tone": "quiet", onClick: () => setDetail(model.id), children: "\u8BE6\u60C5" }), _jsx("button", { type: "button", className: "local-models__action", "data-tone": "quiet", title: "\u79FB\u5230\u56DE\u6536\u7AD9", onClick: () => {
                                            setRemoveNote(undefined);
                                            setRemoving(model.id);
                                        }, children: "\u5220\u9664" }), _jsx("button", { type: "button", className: "local-models__action", "data-tone": "quiet", "aria-expanded": isTuning, onClick: () => setTuning(isTuning ? undefined : model.id), children: "\u53C2\u6570" }), isLoaded ? (_jsx("span", { className: "local-models__item-state", children: "\u5DF2\u52A0\u8F7D" })) : isLoading ? (_jsx("span", { className: "local-models__item-state", children: "\u52A0\u8F7D\u4E2D\u2026" })) : (_jsx("button", { type: "button", className: "local-models__action", disabled: busyId !== undefined, onClick: () => void load(model.id), children: busyId === model.id ? '正在启动…' : '加载' }))] }, model.id));
                        }) }))] }), loaded ? (_jsxs("p", { className: "local-models__foot", children: ["\u8FD9\u4E2A\u6A21\u578B\u5DF2\u767B\u8BB0\u5230\u5185\u6838\u7684 ", _jsx("code", { children: 'provider.local' }), " \u6765\u6E90\uFF0C\u53EF\u4EE5\u5728\u65B0\u5EFA\u4EFB\u52A1\u65F6\u9009\u62E9\u3002"] })) : null, _jsx(Modal, { open: tuning !== undefined, size: "form", title: `加载参数 · ${modelName ?? ''}`, onClose: () => setTuning(undefined), children: tuning ? (_jsx(ParameterPanel, { modelId: tuning, ...(() => {
                        const entry = snapshot?.models.find((m) => m.id === tuning);
                        return {
                            ...(entry?.contextLength ? { contextLimit: entry.contextLength } : {}),
                            ...(entry?.blockCount ? { layerCount: entry.blockCount } : {})
                        };
                    })(), onSaved: () => setNotice('参数已保存，下次加载时生效。') })) : null }), _jsx(Modal, { open: detail !== undefined, title: "\u6A21\u578B\u8BE6\u60C5", size: "form", onClose: () => setDetail(undefined), actions: _jsx("button", { type: "button", className: "modal__button", onClick: () => setDetail(undefined), children: "\u5173\u95ED" }), children: (() => {
                    const model = (snapshot?.models ?? []).find((entry) => entry.id === detail);
                    if (!model)
                        return _jsx("p", { className: "local-models__detail-note", children: "\u8FD9\u4E2A\u6A21\u578B\u5DF2\u4E0D\u5728\u5F53\u524D\u76EE\u5F55\u91CC\u3002" });
                    const rows = [
                        ['名称', model.name],
                        ['架构', model.architecture || '未知'],
                        ['量化', model.quantization || '未知'],
                        [
                            '上下文上限',
                            model.contextLength
                                ? `${model.contextLength.toLocaleString()}（${Math.round(model.contextLength / 1024)}K）`
                                : '未在文件里声明'
                        ],
                        ['层数', model.blockCount ? String(model.blockCount) : '未知'],
                        ['文件大小', `${model.humanSize}（${model.bytes.toLocaleString()} 字节）`],
                        ['多模态', model.multimodal ? '是' : '否'],
                        ['MTP', model.hasMtp ? '支持' : '不支持'],
                        ['文件', model.path],
                        ['目录', model.directory],
                        ['标识', model.id]
                    ];
                    return (_jsx("dl", { className: "local-models__detail", children: rows.map(([label, value]) => (_jsxs("div", { className: "local-models__detail-row", children: [_jsx("dt", { children: label }), _jsx("dd", { children: value })] }, label))) }));
                })() }), _jsx(Modal, { open: removing !== undefined, title: "\u5220\u9664\u6A21\u578B\u6587\u4EF6", onClose: () => setRemoving(undefined), actions: _jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "modal__button", disabled: removeBusy, onClick: () => setRemoving(undefined), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "modal__button", "data-variant": "danger", disabled: removeBusy, onClick: () => {
                                const id = removing;
                                if (!id)
                                    return;
                                setRemoveBusy(true);
                                void bridge.models
                                    .removeFile(id)
                                    .then((result) => {
                                    setRemoving(undefined);
                                    if (!result.ok)
                                        setRemoveNote(result.error);
                                })
                                    .finally(() => setRemoveBusy(false));
                            }, children: "\u79FB\u5230\u56DE\u6536\u7AD9" })] }), children: (() => {
                    const model = (snapshot?.models ?? []).find((entry) => entry.id === removing);
                    return (_jsx("p", { className: "local-models__detail-note", children: model
                            ? `「${model.name}」的文件（${model.humanSize}）会被移到系统回收站，可以从那里还原。模型列表会重新扫描目录。`
                            : '这个模型已不在当前目录里。' }));
                })() })] }));
}
