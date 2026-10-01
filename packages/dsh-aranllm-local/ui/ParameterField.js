import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * What the engine will use when the field is left empty.
 *
 * A caller may state its own wording through `defaultHint`. That exists for the
 * one case where the schema's own value would mislead: the context length's
 * declared default is what a load gets when the user says nothing, but the
 * model's ceiling is a different number and the only thing the caller knows
 * about it. Showing the ceiling in that slot is the field's whole purpose here
 * — it is the figure a user needs in order to decide — and it must be labelled
 * as a maximum rather than presented as the value the field already holds.
 */
function defaultHint(field) {
    if (field.defaultHint)
        return field.defaultHint;
    if (field.auto)
        return '自动';
    if (field.defaultValue === undefined)
        return '';
    if (typeof field.defaultValue === 'boolean')
        return field.defaultValue ? '默认开' : '默认关';
    if (Array.isArray(field.defaultValue))
        return '';
    return String(field.defaultValue);
}
/**
 * What an option value should read as.
 *
 * The map is keyed by value and may cover only some of them, so an unmapped
 * value is shown as itself rather than borrowing a neighbour's text — the
 * quantization types are the case that relies on this, being format names that
 * have no translation.
 */
function optionText(field, value) {
    if (typeof value !== 'string')
        return String(value);
    return field.optionLabels?.[value] ?? value;
}
/** A label's trailing markers: the two states that change how a value is read. */
function Markers({ field }) {
    return (_jsx(_Fragment, { children: field.experimental ? _jsx("span", { className: "param__badge", children: "\u5B9E\u9A8C\u6027" }) : null }));
}
/**
 * The sentence a field carries about when it takes effect.
 *
 * Rendered under the whole row rather than as a tooltip, because the one field
 * that has one is warning against a mistake the row's own shape invites: a
 * thinking level sits beside the composer's thinking level, they read the same,
 * and only one of them applies to the next reply. A tooltip on a label is a
 * thing the reader has to already suspect before they go looking for it, and
 * the reader who most needs this sentence is the one who does not.
 *
 * Nothing is rendered when there is no note, so the rows that need no
 * explanation — which is all but one — keep the two-column shape they had.
 */
function FieldNote({ field }) {
    if (!field.note)
        return null;
    return _jsx("span", { className: "param__field-note", children: field.note });
}
export function ParameterField({ field, value, onChange }) {
    const hint = defaultHint(field);
    /*
     * A readonly row is a statement, not a control.
     *
     * The sampling group ends with one: the thread count is derived from the
     * machine, and a disabled input would suggest it could be enabled.
     */
    if (field.type === 'readonly') {
        return (_jsxs("div", { className: "param__row", "data-readonly": "true", children: [_jsx("span", { className: "param__label", children: field.label }), _jsx("span", { className: "param__static", children: field.derived ?? '—' })] }));
    }
    if (field.type === 'boolean') {
        /*
         * A toggle with a third state, because the schema has one.
         *
         * `undefined` is "engine decides", which is neither on nor off. Drawn as a
         * switch it would have to show as one of them; the switch is therefore the
         * explicit choice and the small control beside it clears back to automatic,
         * the same shape the reference panel uses for its own overridable fields.
         */
        const resolved = typeof value === 'boolean' ? value : Boolean(field.defaultValue);
        const overridden = typeof value === 'boolean';
        return (_jsxs("div", { className: "param__row", children: [_jsxs("span", { className: "param__label", children: [field.label, _jsx(Markers, { field: field })] }), _jsxs("span", { className: "param__control", children: [overridden ? (_jsx("button", { type: "button", className: "param__icon", title: "\u6062\u590D\u4E3A\u81EA\u52A8", onClick: () => onChange(undefined), children: "\u21BA" })) : (_jsx("span", { className: "param__icon-spacer" })), _jsx("button", { type: "button", role: "switch", "aria-checked": resolved, "aria-label": field.label, className: "param__switch", "data-on": resolved ? 'true' : undefined, "data-overridden": overridden ? 'true' : undefined, onClick: () => onChange(!resolved), children: _jsx("span", { className: "param__knob" }) })] })] }));
    }
    if (field.type === 'select') {
        /*
         * A select with a note stacks; one without keeps the inline row.
         *
         * The note is a line of prose and the two-column row has no room for one —
         * it would either wrap under the control, which reads as a third column, or
         * push the control off the edge. Only the rows that carry a note pay for
         * the taller shape.
         */
        return (_jsxs("div", { className: `param__row${field.note ? ' param__row--stacked' : ''}`, children: [_jsxs("span", { className: "param__label", children: [field.label, _jsx(Markers, { field: field })] }), _jsx("span", { className: "param__control", children: _jsxs("select", { className: "param__select", value: value === undefined ? '' : String(value), "aria-label": field.label, onChange: (event) => onChange(event.target.value === '' ? undefined : event.target.value), children: [_jsx("option", { value: "", children: field.defaultValue === undefined
                                    ? '默认'
                                    : `默认（${optionText(field, field.defaultValue)}）` }), (field.options ?? []).map((option) => (
                            /*
                             * The value stays as the engine spells it; only the label is
                             * translated. A `<select>` reports back the `value`, and that is
                             * what reaches `buildArgs` — putting the Chinese in both would
                             * send `截断中间` to llama.cpp as a flag argument.
                             */
                            _jsx("option", { value: option, children: optionText(field, option) }, option)))] }) }), _jsx(FieldNote, { field: field })] }));
    }
    if (field.type === 'string-list') {
        /*
         * One per line.
         *
         * A stop string is arbitrary text and may contain a comma, so a
         * comma-separated box would corrupt any value that has one. Lines are what
         * the normaliser already splits on.
         */
        const text = Array.isArray(value) ? value.join('\n') : typeof value === 'string' ? value : '';
        return (_jsxs("div", { className: "param__row param__row--stacked", children: [_jsx("span", { className: "param__label", children: field.label }), _jsx("input", { className: "param__input", value: text, placeholder: "\u6BCF\u884C\u4E00\u4E2A", spellCheck: false, "aria-label": field.label, onChange: (event) => {
                        const lines = event.target.value
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean);
                        onChange(lines.length > 0 ? lines : undefined);
                    } })] }));
    }
    /*
     * A bounded field is a slider.
     *
     * Only the ones with a known ceiling get this — the row where the number
     * means "how many of the model's layers fit on the card" is a position
     * between two known points, and a text box makes the user guess where they
     * are and what the ends are. The count stays beside it so a value can be read
     * exactly rather than estimated from a thumb's position.
     */
    if (field.type === 'number' && typeof field.max === 'number' && field.max > 0) {
        /*
         * `-1` is llama.cpp's "every layer" and is a real sentinel rather than a
         * count, so the slider travels from 0 to the block count and treats the top
         * as "all of them" as well.
         */
        const current = typeof value === 'number' ? value : field.max;
        const all = current < 0 || current >= field.max;
        const position = all ? field.max : current;
        return (_jsxs("div", { className: "param__row param__row--stacked", children: [_jsxs("span", { className: "param__label", children: [field.label, _jsx(Markers, { field: field })] }), _jsxs("div", { className: "param__slider", children: [_jsx("input", { type: "range", className: "param__range", min: 0, max: field.max, step: 1, value: position, "aria-label": field.label, onChange: (event) => onChange(Number(event.target.value)) }), _jsx("span", { className: "param__range-value", children: all ? `全部 ${field.max}` : `${current} / ${field.max}` })] }), _jsx("span", { className: "param__range-hint", children: all
                        ? '全部层都放在显卡上，显存占用最高。'
                        : current === 0
                            ? '全部层都在 CPU 上运行，不占显存，速度最慢。'
                            : `其余 ${field.max - current} 层在 CPU 上运行。` })] }));
    }
    const isNumber = field.type === 'number';
    return (_jsxs("div", { className: "param__row", children: [_jsxs("span", { className: "param__label", children: [field.label, _jsx(Markers, { field: field })] }), _jsx("span", { className: "param__control", children: _jsx("input", { className: "param__input", 
                    /*
                     * `undefined` rather than `''` for an untouched field: React treats
                     * both as uncontrolled-then-controlled flips in different ways, and
                     * an empty string keeps the box controlled and clearable, which is
                     * what the user needs to type a new number.
                     */
                    value: value === undefined || value === null ? '' : String(value), inputMode: isNumber ? 'decimal' : 'text', placeholder: hint, spellCheck: false, "aria-label": field.label, onChange: (event) => {
                        const raw = event.target.value;
                        onChange(raw === '' ? undefined : raw);
                    } }) })] }));
}
