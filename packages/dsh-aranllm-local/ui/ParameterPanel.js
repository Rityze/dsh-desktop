import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ParameterField } from './ParameterField.js';
import { bridge } from './bridge-adapter.js';
import './parameter-panel.css';
/**
 * Attach the model's own numbers to the fields that are about the model.
 *
 * The schema describes what a load accepts; it cannot describe what *this* file
 * is. Two rows are meaningless without that second half — a context length is
 * chosen against the file's ceiling, and a layer count is chosen against the
 * file's total — and both are facts the catalogue already holds. They are
 * attached here rather than in the schema because the schema is shared by every
 * model on disk and is the same object for all of them.
 */
function withModelFacts(field, facts) {
    if (field.key === 'contextLength' && facts.contextLimit) {
        return { ...field, defaultHint: `最多 ${facts.contextLimit}` };
    }
    if (field.key === 'gpuLayers' && facts.layerCount) {
        return { ...field, max: facts.layerCount };
    }
    return field;
}
/**
 * Three coherent bundles, named for what they cost rather than for what they set.
 *
 * ## Why presets at all
 *
 * The panel has twenty-odd fields across four groups, and the values that
 * actually decide how a local model feels are four of them: whether it thinks,
 * how long it thinks, and the two that bound a response. A reader who has just
 * loaded a 27B model and found it slow has no way to know which of the twenty
 * to touch, and the honest answer — "thinking is on and unbounded" — is spread
 * across three of them.
 *
 * ## What they are not
 *
 * A preset does not write anything. It sets the draft fields, and the user still
 * presses 保存, which is the same button every other edit goes through. Writing
 * on click would make a preset a different kind of control from everything
 * beside it, and there would be no way to look at what it changed before it took
 * effect.
 *
 * ## What they cannot fix
 *
 * **GPU occupancy.** A 27B model generating one token at a time does not saturate
 * a GPU, and no flag changes that — the work between two tokens is a few matrix
 * multiplies that finish before the next one is needed. The note under the
 * buttons says so, because a user who came here to "unlock the GPU" would
 * otherwise leave believing they had.
 */
const PRESETS = [
    {
        id: 'fast',
        label: '快',
        note: '不思考，回复短。适合问答和改写。',
        values: {
            enableThinking: false,
            limitResponseLength: true,
            maxTokens: 1024
        }
    },
    {
        id: 'balanced',
        label: '均衡',
        note: '思考但设上限，回复长度适中。默认推荐。',
        values: {
            enableThinking: true,
            reasoningBudget: 2048,
            reasoningBudgetMessage: '够了，现在直接给出结论。',
            limitResponseLength: true,
            maxTokens: 4096
        }
    },
    {
        id: 'deep',
        label: '深入',
        note: '不限制思考与长度。适合推理和长文。',
        values: {
            enableThinking: true,
            reasoningBudget: -1,
            reasoningBudgetMessage: '',
            limitResponseLength: false
        }
    }
];
export function ParameterPanel({ modelId, contextLimit, layerCount, onSaved }) {
    const [groups, setGroups] = useState([]);
    const [draft, setDraft] = useState({});
    const [saved, setSaved] = useState({});
    const [failure, setFailure] = useState(undefined);
    const [busy, setBusy] = useState(false);
    /** Which groups are open. All of them, until the user folds one. */
    const [collapsed, setCollapsed] = useState({});
    useEffect(() => {
        let cancelled = false;
        void Promise.all([bridge.models.parameters(), bridge.models.localConfig(modelId)])
            .then(([schema, values]) => {
            if (cancelled)
                return;
            setGroups(schema);
            setDraft(values);
            setSaved(values);
            setFailure(undefined);
        })
            .catch((cause) => {
            if (!cancelled)
                setFailure(cause instanceof Error ? cause.message : String(cause));
        });
        return () => {
            cancelled = true;
        };
    }, [modelId]);
    const set = useCallback((key, value) => {
        setDraft((current) => {
            const next = { ...current };
            /*
             * `undefined` removes the key rather than storing it.
             *
             * The store reads `undefined` as "not touching this field" and `null` as
             * "clear it", so an emptied box has to send the second. Deleting here and
             * converting at save time keeps the draft readable — a record full of
             * explicit `undefined`s is indistinguishable from one with the key absent
             * when it is inspected.
             */
            if (value === undefined)
                delete next[key];
            else
                next[key] = value;
            return next;
        });
    }, []);
    const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
    const save = useCallback(async () => {
        setBusy(true);
        setFailure(undefined);
        try {
            /*
             * Only what changed is sent.
             *
             * The store is a patch: a key that is absent is left alone and a key set
             * to `null` is cleared. Stating every field on every save would turn the
             * untouched ones into explicit clears, which happens to be harmless for a
             * number but is wrong for a list — an empty list is a value, and the
             * difference between "the user has no stop strings" and "the user has
             * never set any" is lost the moment they are written the same way.
             *
             * A field that *was* set and is now empty is the one case that must be
             * sent as null, because its absence from the draft is exactly what has to
             * reach the file.
             */
            const payload = {};
            for (const group of groups) {
                for (const field of group.fields) {
                    if (field.type === 'readonly')
                        continue;
                    const now = Object.hasOwn(draft, field.key) ? draft[field.key] : null;
                    const before = Object.hasOwn(saved, field.key) ? saved[field.key] : null;
                    if (JSON.stringify(now) !== JSON.stringify(before))
                        payload[field.key] = now;
                }
            }
            const result = await bridge.models.setLocalConfig(modelId, payload);
            if (!result.ok) {
                setFailure(result.error);
                return;
            }
            setSaved(result.value);
            setDraft(result.value);
            onSaved?.();
        }
        catch (cause) {
            setFailure(cause instanceof Error ? cause.message : String(cause));
        }
        finally {
            setBusy(false);
        }
    }, [draft, groups, modelId, onSaved]);
    const reset = useCallback(() => {
        /*
         * Reset is local to the draft, not a write.
         *
         * It puts the panel back to what is stored, which is what a user who has
         * been experimenting wants; clearing the file is a different intent and is
         * served by emptying the fields and saving. Doing it as a write would make
         * an accidental click destructive.
         */
        setDraft(saved);
    }, [saved]);
    return (_jsxs(_Fragment, { children: [failure ? _jsx("p", { className: "params__error", children: failure }) : null, _jsxs("section", { className: "params__presets", "data-param-presets": "true", children: [_jsx("span", { className: "params__presets-label", children: "\u901F\u5EA6" }), PRESETS.map((preset) => (_jsx("button", { type: "button", className: "params__preset", "data-preset": preset.id, title: preset.note, onClick: () => {
                            for (const [key, value] of Object.entries(preset.values))
                                set(key, value);
                        }, children: preset.label }, preset.id)))] }), _jsx("p", { className: "params__presets-note", children: "\u9884\u8BBE\u53EA\u6539\u4E0B\u9762\u7684\u5B57\u6BB5\uFF0C\u4ECD\u8981\u70B9\u300C\u4FDD\u5B58\u300D\u624D\u751F\u6548\u3002\u5B83\u4EEC\u4E0D\u89E3\u9501\u663E\u5361 \u2014\u2014 \u663E\u5B58\u5360\u7528\u4F4E\u662F 27B \u6A21\u578B\u9010\u5B57\u751F\u6210\u7684\u672C\u6765\u6837\u5B50\uFF1B\u6362\u4E00\u4E2A\u66F4\u5C0F\u7684\u6A21\u578B\u6BD4\u8C03\u4EFB\u4F55\u53C2\u6570\u90FD\u6709\u6548\u3002" }), groups.map((group) => {
                const open = collapsed[group.id] !== true;
                return (_jsxs("section", { className: "params__group", children: [_jsxs("button", { type: "button", className: "params__group-head", "aria-expanded": open, onClick: () => setCollapsed((current) => ({ ...current, [group.id]: open })), children: [_jsx("span", { className: "params__chevron", "data-open": open ? 'true' : undefined, children: "\u25B8" }), group.title] }), open ? (_jsx("div", { className: "params__fields", children: group.fields.map((field) => (_jsx(ParameterField, { field: withModelFacts(field, { contextLimit, layerCount }), value: draft[field.key], onChange: (value) => set(field.key, value) }, field.key))) })) : null] }, group.id));
            }), _jsxs("div", { className: "params__foot", children: [_jsx("button", { type: "button", className: "params__action", onClick: reset, disabled: !dirty || busy, children: "\u64A4\u9500\u6539\u52A8" }), _jsx("button", { type: "button", className: "params__action", "data-tone": "primary", onClick: () => void save(), disabled: !dirty || busy, children: busy ? '保存中…' : '保存' })] })] }));
}
