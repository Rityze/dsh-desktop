/**
 * The load-parameter form.
 *
 * Opened for one model, edits that model's remembered tuning, and saves what it
 * has when the user asks. Saving on every keystroke would write the config file
 * on each digit of a number, and loading happens from a separate control — so
 * there is one explicit save and one explicit reset.
 *
 * The values live here as a draft rather than being written straight through.
 * The reason is the empty field: clearing a number is a step on the way to
 * typing a new one, and a write-through panel would store "no value" in the
 * middle of editing a value.
 *
 * Rendered as the body of a modal, which owns the title and the dismissal. This
 * component therefore draws no header and no frame: two of each would appear if
 * it did, and the pair that is about the model rather than about the form is
 * the one the caller is better placed to write.
 */
import type { LoadParameterField, LoadParameterGroup, LocalLoadedModel, LocalLoadProgress, LocalModelEntry, LocalModelsSnapshot } from './types.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ParameterField } from './ParameterField.tsx'
import { bridge } from './bridge-adapter.js'
import './parameter-panel.css'

export type ParameterPanelProps = {
  /** The model being edited. Changing it reloads the draft. */
  modelId: string
  /** The model's own context ceiling, for the length field's hint. */
  contextLimit?: number
  /** How many layers the file has, which bounds the GPU-offload control. */
  layerCount?: number
  /** Told after a successful save, so the catalogue can refresh its notes. */
  onSaved?: () => void
}

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
function withModelFacts(
  field: LoadParameterField,
  facts: { contextLimit?: number; layerCount?: number }
): LoadParameterField {
  if (field.key === 'contextLength' && facts.contextLimit) {
    return { ...field, defaultHint: `最多 ${facts.contextLimit}` }
  }
  if (field.key === 'gpuLayers' && facts.layerCount) {
    return { ...field, max: facts.layerCount }
  }
  return field
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
const PRESETS: { id: string; label: string; note: string; values: Record<string, unknown> }[] = [
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
]

export function ParameterPanel({
  modelId,
  contextLimit,
  layerCount,
  onSaved
}: ParameterPanelProps) {
  const [groups, setGroups] = useState<LoadParameterGroup[]>([])
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [saved, setSaved] = useState<Record<string, unknown>>({})
  const [failure, setFailure] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  /** Which groups are open. All of them, until the user folds one. */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  /** What the current draft would cost. Recomputed as the draft changes. */
  const [estimate, setEstimate] = useState<
    { deviceBytes?: number; hostBytes?: number; kvBytes?: number } | undefined
  >(undefined)

  /*
   * The estimate, debounced.
   *
   * Keyed on the four fields that move it rather than on the draft object: the
   * draft is replaced on every keystroke in every field, and a request per
   * keystroke would be a request per character of a context length — six of them
   * to type `131072`. Listing the four makes the effect run when the answer
   * could change and not otherwise.
   *
   * The timer is what keeps a typed number from firing on `1`, `13`, `131` —
   * each of which is a real value and each of which would be asked about.
   */
  const estimateInput = JSON.stringify({
    contextLength: draft['contextLength'],
    kvCacheType: draft['kvCacheTypeK'],
    gpuLayers: draft['gpuLayers'],
    flashAttention: draft['flashAttention'],
  })
  useEffect(() => {
    if (!modelId) return undefined
    let cancelled = false
    const timer = setTimeout(() => {
      void bridge.models
        .estimate({
          id: modelId,
          contextLength: numeric(draft['contextLength']) ?? contextLimit,
          kvCacheType: typeof draft['kvCacheTypeK'] === 'string' ? draft['kvCacheTypeK'] : undefined,
          gpuLayers: numeric(draft['gpuLayers']),
          batchSize: numeric(draft['batchSize']),
          flashAttention: draft['flashAttention'] === true
        })
        .then((answer) => {
          if (!cancelled) setEstimate(answer)
        })
        .catch(() => {
          /*
           * A file that does not declare enough to compute with is the ordinary
           * case for an unusual architecture. The panel then says 正在估算 rather
           * than showing a zero, because a zero reads as "this is free".
           */
          if (!cancelled) setEstimate(undefined)
        })
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, estimateInput])

  useEffect(() => {
    let cancelled = false
    void Promise.all([bridge.models.parameters(), bridge.models.localConfig(modelId)])
      .then(([schema, values]) => {
        if (cancelled) return
        setGroups(schema)
        setDraft(values)
        setSaved(values)
        setFailure(undefined)
      })
      .catch((cause) => {
        if (!cancelled) setFailure(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      cancelled = true
    }
  }, [modelId])

  const set = useCallback((key: string, value: unknown) => {
    setDraft((current) => {
      const next = { ...current }
      /*
       * `undefined` removes the key rather than storing it.
       *
       * The store reads `undefined` as "not touching this field" and `null` as
       * "clear it", so an emptied box has to send the second. Deleting here and
       * converting at save time keeps the draft readable — a record full of
       * explicit `undefined`s is indistinguishable from one with the key absent
       * when it is inspected.
       */
      if (value === undefined) delete next[key]
      else next[key] = value
      return next
    })
  }, [])

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved]
  )

  /**
   * Which preset the form currently holds, if any.
   *
   * ## Why this is derived and not stored
   *
   * A flag set in the click handler would keep saying "均衡" after the user had
   * gone on to change `maxTokens` by hand, and the panel would then be naming a
   * bundle that is no longer in the fields. Reading it back off the draft means
   * the answer is always about the values that are actually there.
   *
   * ## Why only the preset's own keys are compared
   *
   * A preset sets four or five fields and says nothing about the other twenty,
   * which is deliberate — it is a position on *thinking*, not a complete
   * configuration. Comparing every key would make every preset match only a
   * model whose remaining fields happened to be unset, which is none of them.
   * So a preset matches when every value it names is the value in the draft.
   *
   * ## Why the last match wins rather than the first
   *
   * `快` and `深入` both turn `enableThinking` on or off and neither sets the
   * other's fields, so a draft that has been through both can satisfy two
   * presets at once — and picking by order would then name the wrong one. The
   * scan runs backwards so the most recently applied preset is the one that
   * wins the tie, which is what the user's own history would say.
   */
  const activePreset = useMemo(() => {
    for (let index = PRESETS.length - 1; index >= 0; index -= 1) {
      const preset = PRESETS[index]!
      const matches = Object.entries(preset.values).every(([key, value]) => {
        const held = Object.hasOwn(draft, key) ? draft[key] : undefined
        return JSON.stringify(held) === JSON.stringify(value)
      })
      if (matches) return preset.id
    }
    return undefined
  }, [draft])

  /** The chosen preset's name, for the note under the buttons. */
  const activeLabel = useMemo(
    () => PRESETS.find((preset) => preset.id === activePreset)?.label,
    [activePreset]
  )

  const save = useCallback(async () => {
    setBusy(true)
    setFailure(undefined)
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
      const payload: Record<string, unknown> = {}
      for (const group of groups) {
        for (const field of group.fields) {
          if (field.type === 'readonly') continue
          const now = Object.hasOwn(draft, field.key) ? draft[field.key] : null
          const before = Object.hasOwn(saved, field.key) ? saved[field.key] : null
          if (JSON.stringify(now) !== JSON.stringify(before)) payload[field.key] = now
        }
      }
      const result = await bridge.models.setLocalConfig(modelId, payload)
      if (!result.ok) {
        setFailure(result.error)
        return
      }
      setSaved(result.value)
      setDraft(result.value)
      onSaved?.()
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }, [draft, groups, modelId, onSaved])

  const reset = useCallback(() => {
    /*
     * Reset is local to the draft, not a write.
     *
     * It puts the panel back to what is stored, which is what a user who has
     * been experimenting wants; clearing the file is a different intent and is
     * served by emptying the fields and saving. Doing it as a write would make
     * an accidental click destructive.
     */
    setDraft(saved)
  }, [saved])

  return (
    <>
      {failure ? <p className="params__error">{failure}</p> : null}

      {/*
        What these settings will cost, at the top of the form where the settings
        are changed.

        ## Why this is here and not in the model list

        The list shows what is on disk — a file's size is a fact about the file.
        This shows what a *load* would cost, which is a fact about the parameters
        below it, and the whole reason the form exists is that those numbers move.
        Putting it beside them is what makes the movement visible: change the
        context from 256K to 32K and the figure drops by thirty gigabytes, and
        seeing that is the decision being made.

        ## Why it is an estimate and says so

        `bridge.models.memory()` reports llama.cpp's own projection, read from its
        log — a better number, measured on the real device, and unavailable for a
        load that has not run. This one is computed from the file's own metadata
        and the draft's current values, and the panel names it 预估 because the
        difference is the point.
      */}
      <section className="params__estimate" data-param-estimate="true">
        <span className="params__estimate-label">预估占用</span>
        {estimate === undefined ? (
          <span className="params__estimate-value">正在估算…</span>
        ) : (
          <>
            {/*
              One figure per label rather than a joined sentence.

              `内存 0 KB` is the honest answer when every layer is on the device —
              the host keeps nothing but what the cache spills — and written after
              a dot it reads as a bug. Separated, a zero is a value.
            */}
            <span className="params__estimate-figures" data-estimate-value="true">
              <span className="params__estimate-figure">
                <b>显存</b>
                {sizeText(estimate.deviceBytes)}
              </span>
              <span className="params__estimate-figure">
                <b>内存</b>
                {sizeText(estimate.hostBytes)}
              </span>
              <span className="params__estimate-figure">
                <b>层</b>
                {estimate.layersOnDevice ?? '—'}
              </span>
            </span>
            {estimate.kvBytes !== undefined ? (
              <span className="params__estimate-kv" data-estimate-kv="true">
                {`KV 缓存 ${sizeText(estimate.kvBytes)} —— 上下文与缓存类型决定它；256K 时它会超过权重本身。`}
              </span>
            ) : null}
          </>
        )}
      </section>

      {/*
        Three settings that answer the three questions a slow local model raises.
        Each is a named position rather than a slider, because the values are not
        a continuum — they are three coherent bundles, and picking between them is
        the decision a user is actually making.
      */}
      <section className="params__presets" data-param-presets="true">
        <span className="params__presets-label">速度</span>
        {PRESETS.map((preset) => {
          const active = preset.id === activePreset
          return (
          <button
            type="button"
            className="params__preset"
            data-preset={preset.id}
            data-active={active ? 'true' : 'false'}
            aria-pressed={active}
            key={preset.id}
            title={preset.note}
            onClick={() => {
              for (const [key, value] of Object.entries(preset.values)) set(key, value)
              /*
               * Open the groups this preset touched.
               *
               * Without this the button appears to do nothing — measured, and it
               * was reported exactly that way. The fields it writes live in
               * groups that start collapsed (采样与生成, 提示与推理), so the
               * values changed in a place the reader could not see, and a control
               * whose only effect is off-screen is indistinguishable from a
               * broken one.
               *
               * Opened rather than scrolled to: the point is to let the reader
               * check what was set before saving, and scrolling to one group
               * would leave the others' changes unexplained.
               */
              const touched = new Set(
                (groups ?? [])
                  .filter((group) => group.fields.some((field) => field.key in preset.values))
                  .map((group) => group.id),
              )
              if (touched.size > 0) {
                setCollapsed((current) => {
                  const next = { ...current }
                  for (const id of touched) delete next[id]
                  return next
                })
              }
            }}
          >
            <span className="params__preset-dot" aria-hidden="true" />
            {preset.label}
          </button>
          )
        })}
      </section>
      {/*
        The note, as one string rather than as mixed children.

        Written first as a conditional expression with the rest of the sentence
        following it as bare JSX text, and `esbuild` — which is what bundles this
        for the host — emitted a syntax error out of the combination. The file
        parses under `tsc` and the failure only appears once the bundle is
        loaded, which is what a blank settings panel actually was.

        Interpolating into one template removes the shape that broke it, and
        removes a second problem with the same line: JSX collapses the newline
        between two text children into a space, so the sentence was rendering
        with a gap in the middle of it anyway.
      */}
      <p className="params__presets-note">
        {`${activeLabel === undefined ? '当前字段不属于任何一个预设' : `当前是「${activeLabel}」`}。预设只改下面的字段，仍要点「保存」才生效。它们不解锁显卡 —— 显存占用低是 27B 模型逐字生成的本来样子；换一个更小的模型比调任何参数都有效。`}
      </p>

      {groups.map((group) => {
        const open = collapsed[group.id] !== true
        return (
          <section className="params__group" key={group.id}>
            <button
              type="button"
              className="params__group-head"
              aria-expanded={open}
              onClick={() => setCollapsed((current) => ({ ...current, [group.id]: open }))}
            >
              <span className="params__chevron" data-open={open ? 'true' : undefined}>
                ▸
              </span>
              {group.title}
            </button>
            {open ? (
              <div className="params__fields">
                {group.fields.map((field) => (
                  <ParameterField
                    key={field.key}
                    field={withModelFacts(field, { contextLimit, layerCount })}
                    value={draft[field.key]}
                    onChange={(value) => set(field.key, value)}
                  />
                ))}
              </div>
            ) : null}
          </section>
        )
      })}

      <div className="params__foot">
        <button
          type="button"
          className="params__action"
          onClick={reset}
          disabled={!dirty || busy}
        >
          撤销改动
        </button>
        <button
          type="button"
          className="params__action"
          data-tone="primary"
          onClick={() => void save()}
          disabled={!dirty || busy}
        >
          {busy ? '保存中…' : '保存'}
        </button>
      </div>
    </>
  )
}

/** A draft value as a number, or undefined when it is empty or not one. */
function numeric(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) return undefined
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/**
 * A byte count, in the largest unit that keeps it readable.
 *
 * One decimal for gigabytes and none below that, because the figure is an
 * estimate and a tenth of a megabyte is not information. An absent count is
 * `—`, not `0`: the two mean different things here, and a zero would read as
 * "this costs nothing".
 */
function sizeText(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return '—'
  const gb = bytes / 1024 ** 3
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  const mb = bytes / 1024 ** 2
  if (mb >= 1) return `${mb.toFixed(0)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}
