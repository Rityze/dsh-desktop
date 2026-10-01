/**
 * One load-parameter field.
 *
 * Rendered from the declaration rather than from a hand-written row per
 * setting. The package that builds the `llama-server` arguments also publishes
 * this schema, so a row written here would be a second copy of the same fact —
 * and the two would drift the first time a flag is added, in the one direction
 * that is hard to notice: a control that saves a key nothing reads.
 *
 * The default is shown beside the box rather than written into it. Absent and
 * "set to the default" mean different things to the engine — the first lets
 * llama.cpp decide, the second overrides it — and a field pre-filled with the
 * default would make the automatic state unreachable.
 */

export type ParameterFieldProps = {
  field: LoadParameterField
  value: unknown
  onChange: (value: unknown) => void
}

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
function defaultHint(field: LoadParameterField): string {
  if (field.defaultHint) return field.defaultHint
  if (field.auto) return '自动'
  if (field.defaultValue === undefined) return ''
  if (typeof field.defaultValue === 'boolean') return field.defaultValue ? '默认开' : '默认关'
  if (Array.isArray(field.defaultValue)) return ''
  return String(field.defaultValue)
}

/**
 * What an option value should read as.
 *
 * The map is keyed by value and may cover only some of them, so an unmapped
 * value is shown as itself rather than borrowing a neighbour's text — the
 * quantization types are the case that relies on this, being format names that
 * have no translation.
 */
function optionText(field: LoadParameterField, value: unknown): string {
  if (typeof value !== 'string') return String(value)
  return field.optionLabels?.[value] ?? value
}

/** A label's trailing markers: the two states that change how a value is read. */
function Markers({ field }: { field: LoadParameterField }) {
  return (
    <>
      {field.experimental ? <span className="param__badge">实验性</span> : null}
    </>
  )
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
function FieldNote({ field }: { field: LoadParameterField }) {
  if (!field.note) return null
  return <span className="param__field-note">{field.note}</span>
}

export function ParameterField({ field, value, onChange }: ParameterFieldProps) {
  const hint = defaultHint(field)

  /*
   * A readonly row is a statement, not a control.
   *
   * The sampling group ends with one: the thread count is derived from the
   * machine, and a disabled input would suggest it could be enabled.
   */
  if (field.type === 'readonly') {
    return (
      <div className="param__row" data-readonly="true">
        <span className="param__label">{field.label}</span>
        <span className="param__static">{field.derived ?? '—'}</span>
      </div>
    )
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
    const resolved = typeof value === 'boolean' ? value : Boolean(field.defaultValue)
    const overridden = typeof value === 'boolean'
    return (
      <div className="param__row">
        <span className="param__label">
          {field.label}
          <Markers field={field} />
        </span>
        <span className="param__control">
          {overridden ? (
            <button
              type="button"
              className="param__icon"
              title="恢复为自动"
              onClick={() => onChange(undefined)}
            >
              ↺
            </button>
          ) : (
            <span className="param__icon-spacer" />
          )}
          <button
            type="button"
            role="switch"
            aria-checked={resolved}
            aria-label={field.label}
            className="param__switch"
            data-on={resolved ? 'true' : undefined}
            data-overridden={overridden ? 'true' : undefined}
            onClick={() => onChange(!resolved)}
          >
            <span className="param__knob" />
          </button>
        </span>
      </div>
    )
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
    return (
      <div className={`param__row${field.note ? ' param__row--stacked' : ''}`}>
        <span className="param__label">
          {field.label}
          <Markers field={field} />
        </span>
        <span className="param__control">
          <select
            className="param__select"
            value={value === undefined ? '' : String(value)}
            aria-label={field.label}
            onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}
          >
            {/*
              The empty option is the automatic state, and it names what
              automatic resolves to.
              `selectedIndex` lands here whenever the model has no stored
              choice, so the text has to read as "nothing chosen yet, and this
              is what that gets you" — printing the bare default value instead
              would look like a selection the user made. The resolution is
              labelled, not spelled: an untranslated `truncate-middle` in this
              slot is the one string in the panel a Chinese reader cannot read.
            */}
            <option value="">
              {field.defaultValue === undefined
                ? '默认'
                : `默认（${optionText(field, field.defaultValue)}）`}
            </option>
            {(field.options ?? []).map((option) => (
              /*
               * The value stays as the engine spells it; only the label is
               * translated. A `<select>` reports back the `value`, and that is
               * what reaches `buildArgs` — putting the Chinese in both would
               * send `截断中间` to llama.cpp as a flag argument.
               */
              <option key={option} value={option}>
                {optionText(field, option)}
              </option>
            ))}
          </select>
        </span>
        <FieldNote field={field} />
      </div>
    )
  }

  if (field.type === 'string-list') {
    /*
     * One per line.
     *
     * A stop string is arbitrary text and may contain a comma, so a
     * comma-separated box would corrupt any value that has one. Lines are what
     * the normaliser already splits on.
     */
    const text = Array.isArray(value) ? value.join('\n') : typeof value === 'string' ? value : ''
    return (
      <div className="param__row param__row--stacked">
        <span className="param__label">{field.label}</span>
        <input
          className="param__input"
          value={text}
          placeholder="每行一个"
          spellCheck={false}
          aria-label={field.label}
          onChange={(event) => {
            const lines = event.target.value
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
            onChange(lines.length > 0 ? lines : undefined)
          }}
        />
      </div>
    )
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
    /*
     * The thumb sits at the top when nothing has been chosen, and the value it
     * reports is **-1**, not the top.
     *
     * ## The bug this exists to prevent
     *
     * A bounded field with no stored value used `field.max` as its own value —
     * so a slider that had never been touched read `32` for a 32-layer model and
     * reported `32` when the form was saved. That is one layer short of every
     * layer on a machine where `-1` means "all of them", and the layer left
     * behind is the output projection, which runs once per token. Measured, it
     * cost 41% of the generation rate: 52.9 tok/s at `--n-gpu-layers 32` against
     * 74.5 at `--n-gpu-layers 999999`, on the same model, same cache, same
     * machine.
     *
     * The panel's own hint said 全部层都放在显卡上 while it was doing this,
     * because the *display* treated "at the top" as "all of them" and the
     * *value* did not.
     *
     * ## What is shown and what is sent
     *
     * The thumb still starts at the top — an untouched slider should read as
     * the default, and the default is every layer. But the value is the
     * sentinel, so a save writes `-1` and the argument builder's own fallback
     * agrees with the label.
     *
     * A stored value that is a real count is shown as itself, including one
     * that happens to equal `field.max`: the user asked for that number of
     * layers, and silently replacing it with -1 would be the same class of
     * error in the other direction.
     */
    const stored = typeof value === 'number' ? value : undefined
    const all = stored === undefined || stored < 0 || stored >= field.max
    const position = all ? field.max : stored
    /* What the slider reports when dragged: the top is the sentinel. */
    const fromSlider = (raw: number) => (raw >= field.max ? -1 : raw)
    return (
      <div className="param__row param__row--stacked">
        <span className="param__label">
          {field.label}
          <Markers field={field} />
        </span>
        <div className="param__slider">
          <input
            type="range"
            className="param__range"
            min={0}
            max={field.max}
            step={1}
            value={position}
            aria-label={field.label}
            onChange={(event) => onChange(fromSlider(Number(event.target.value)))}
          />
          <span className="param__range-value">
            {all ? `全部 ${field.max}` : `${String(stored)} / ${field.max}`}
          </span>
        </div>
        <span className="param__range-hint">
          {all
            ? '全部层都放在显卡上，显存占用最高，速度最快。'
            : stored === 0
              ? '全部层都在 CPU 上运行，不占显存，速度最慢。'
              : `其余 ${field.max - (stored ?? 0)} 层在 CPU 上运行。`}
        </span>
      </div>
    )
  }

  const isNumber = field.type === 'number'
  return (
    <div className="param__row">
      <span className="param__label">
        {field.label}
        <Markers field={field} />
      </span>
      <span className="param__control">
        <input
          className="param__input"
          /*
           * `undefined` rather than `''` for an untouched field: React treats
           * both as uncontrolled-then-controlled flips in different ways, and
           * an empty string keeps the box controlled and clearable, which is
           * what the user needs to type a new number.
           */
          value={value === undefined || value === null ? '' : String(value)}
          inputMode={isNumber ? 'decimal' : 'text'}
          placeholder={hint}
          spellCheck={false}
          aria-label={field.label}
          onChange={(event) => {
            const raw = event.target.value
            onChange(raw === '' ? undefined : raw)
          }}
        />
      </span>
    </div>
  )
}import type { LoadParameterField, LoadParameterGroup, LocalLoadedModel, LocalLoadProgress, LocalModelEntry, LocalModelsSnapshot } from './types.js'

