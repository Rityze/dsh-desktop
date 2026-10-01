/**
 * The load-time option surface, field for field what the load UI collects.
 *
 * Everything is optional: an absent field means "use llama.cpp's default",
 * which is what the UI renders as the automatic / placeholder state. Keeping
 * the shape flat (rather than nesting per section) keeps it cheap to send over
 * the load endpoint and to diff against the UI form.
 */

/** KV cache quantization type, as accepted by `--cache-type-k/-v`. */
export const KV_CACHE_TYPES = ['f32', 'f16', 'bf16', 'q8_0', 'q4_0', 'q4_1', 'iq4_nl', 'q5_0', 'q5_1']

/**
 * Display text for the values that are not already readable as themselves.
 *
 * A select's option is both the label and the value that reaches llama.cpp, so
 * the two cannot be the same string once the label is prose: the panel is read
 * in Chinese and `truncate-middle` is not. The map keeps the value intact and
 * gives the label somewhere else to live, which is also why it is keyed by the
 * value rather than listed in parallel — an unmapped value falls back to itself
 * instead of silently shifting every option after it.
 *
 * Quantization names are deliberately absent: `q4_0` is the name of the format
 * and is what the file on disk is called, so translating it would be inventing
 * a term rather than translating one.
 */
export const OPTION_LABELS = {
  contextOverflow: {
    'rolling-window': '滚动窗口',
    stop: '停止生成',
  },
  speculative: {
    off: '关闭',
    'draft-mtp': 'MTP 草稿',
    'draft-simple': '简单草稿',
  },
  reasoningEffort: {
    low: '低',
    medium: '中',
    high: '高',
  },
}

/**
 * The thinking levels a load can be started at.
 *
 * llama.cpp's own vocabulary, not this application's. The composer's picker has
 * five chips because a user moves one notch at a time; the templates this build
 * ships understand three, and `xhigh`/`max` are deliberately absent here rather
 * than mapped down to `high` — a load argument claims to be the value the
 * server starts with, and two names for one value would make the panel report a
 * setting the server does not hold.
 *
 * This is the *default* a load begins with, not the level a conversation runs
 * at. The per-turn choice is the composer's, travels as `variant`, and reaches
 * llama.cpp as a request field the server reads on every call — so it needs no
 * reload. Changing this one does.
 */
export const REASONING_EFFORT_LEVELS = ['low', 'medium', 'high']

/** Rows of the load UI, grouped the way the panel groups them. */
export const LOAD_PARAMETER_GROUPS = [
  {
    id: 'context',
    title: '上下文与卸载',
    fields: [
      /*
       * Both defaults are hints, not recommendations.
       *
       * The number in this slot is what a load gets when the user says nothing,
       * and it has to match what the engine actually defaults to — a schema
       * claiming 204800 beside a manager that starts at 8192 is a placeholder
       * that lies, and one a user may copy into the field believing it is the
       * intended value. See `DEFAULT_CONTEXT_LENGTH` in `manager.js`: the two
       * are the same decision and must not drift apart.
       *
       * The layer count is left out entirely because it can only come from the
       * file being loaded; the panel fills it from the GGUF and renders a
       * slider instead of a box.
       */
      { key: 'contextLength', label: '上下文长度', type: 'number', defaultValue: 32768, flag: '--ctx-size' },
      /*
       * Every layer, which is what the label above it says the top of the
       * slider means.
       *
       * `-1` is llama.cpp's sentinel for "all of them" and is not the same as
       * the block count: a model with 32 blocks and `--n-gpu-layers 32` leaves
       * one on the host, because the output projection is counted separately.
       * Measured on a 9B model, that single layer cost 41% of the generation
       * rate — 52.9 tok/s against 74.5.
       *
       * Stated here so that "unset" and "the top of the slider" agree for every
       * reader: the builder's fallback, the panel's initial position, and a
       * record saved before this field had a default.
       */
      { key: 'gpuLayers', label: 'GPU 卸载', type: 'number', defaultValue: -1, flag: '--n-gpu-layers' },
    ],
  },
  {
    id: 'advanced',
    title: '高级',
    fields: [
      { key: 'threads', label: 'CPU 线程池大小', type: 'number', defaultValue: 6, flag: '--threads' },
      { key: 'batchSize', label: '评估批处理大小', type: 'number', defaultValue: 2048, flag: '--batch-size' },
      /*
       * 256, not llama.cpp's default of 512 and not the 64 it used to be.
       *
       * 512 is documented here as a crash: a prompt long enough to need more
       * than one physical batch was reported to kill the ROCm FP4 build with
       * `0xc0000409` in `ucrtbase.dll` — the C runtime's stack-guard abort, a
       * memory fault inside the HIP kernels rather than a rejected argument —
       * invisible in ordinary use, because a short prompt fits in one batch and
       * never reaches the path that faults.
       *
       * Re-measured, with the loader's own arguments (q4_0 cache, flash
       * attention, 32K context) and a 3,801-token prompt, walking the value up:
       *
       *     ubatch   64   prompt  353 tok/s   首字 10.8s   正常
       *     ubatch  128   prompt  444 tok/s   首字  8.6s   正常
       *     ubatch  256   prompt  541 tok/s   首字  7.0s   正常
       *     ubatch  384   prompt  576 tok/s   首字  6.6s   正常
       *     ubatch  512   prompt  601 tok/s   首字  6.3s   正常
       *
       * Nothing faulted — but 64 is not cheap, which the earlier comment
       * claimed: it costs 42% of the time to first token on a prompt the size a
       * session actually sends. The old note was written against a *page* of a
       * few thousand tokens, where the effect is small; the real prompt carries
       * the tool list and the agent instructions and is an order larger.
       *
       * 256 is chosen as the point where the curve is most of the way done —
       * 541 of 601 tok/s — while staying half of the value that has a crash on
       * its record. A build without the fault can still select higher, and the
       * field remains the user's to set.
       */
      { key: 'ubatchSize', label: '物理批处理大小', type: 'number', defaultValue: 256, flag: '--ubatch-size' },
      { key: 'maxConcurrency', label: '最大并发数', type: 'number', defaultValue: 4, flag: '--parallel', experimental: true },
      { key: 'unifiedKv', label: '统一 KV 缓存', type: 'boolean', defaultValue: true, flag: '--kv-unified', experimental: true },
      { key: 'contextCheckpoints', label: '上下文检查点', type: 'number', defaultValue: 32, flag: '--ctx-checkpoints' },
      { key: 'reasoningBudgetMessage', label: '推理预算提示语', type: 'text', defaultValue: '', flag: null },
      { key: 'ropeFreqBase', label: 'RoPE 频率基', type: 'number', auto: true, flag: '--rope-freq-base' },
      { key: 'ropeFreqScale', label: 'RoPE 频率比例', type: 'number', auto: true, flag: '--rope-freq-scale' },
      { key: 'offloadKqv', label: '将 KV 缓存卸载到 GPU 内存', type: 'boolean', defaultValue: true, flag: '--no-kv-offload (取反)' },
      { key: 'keepInMemory', label: '保持模型在内存中', type: 'boolean', defaultValue: false, flag: '--mlock' },
      { key: 'useMmap', label: '尝试 mmap()', type: 'boolean', defaultValue: false, flag: '--load-mode none (取反)' },
      { key: 'seed', label: '种子', type: 'number', auto: true, flag: '--seed' },
      { key: 'speculative', label: '推测解码', type: 'select', options: ['off', 'draft-mtp', 'draft-simple'], optionLabels: OPTION_LABELS.speculative, defaultValue: 'draft-mtp', flag: '--spec-type' },
      { key: 'specDraftNMax', label: '草稿 token 上限', type: 'number', defaultValue: 2, flag: '--spec-draft-n-max' },
      { key: 'specDraftNMin', label: '草稿 token 下限', type: 'number', defaultValue: 0, flag: '--spec-draft-n-min' },
      { key: 'specDraftPMin', label: '草稿接受概率', type: 'number', defaultValue: 0.75, flag: '--spec-draft-p-min' },
    ],
  },
  {
    id: 'cache',
    title: '缓存与注意力',
    fields: [
      { key: 'flashAttention', label: '快速注意力', type: 'boolean', defaultValue: true, flag: '--flash-attn' },
      { key: 'kvCacheTypeK', label: 'K 缓存量化', type: 'select', options: KV_CACHE_TYPES, defaultValue: 'q4_0', experimental: true, flag: '--cache-type-k' },
      { key: 'kvCacheTypeV', label: 'V 缓存量化', type: 'select', options: KV_CACHE_TYPES, defaultValue: 'q4_0', experimental: true, flag: '--cache-type-v' },
    ],
  },
  {
    id: 'prompt',
    title: '提示与推理',
    fields: [
      { key: 'systemPrompt', label: '系统提示', type: 'text', collapsible: true, flag: null },
      { key: 'chatTemplate', label: '对话模板', type: 'text', collapsible: true, flag: '--chat-template' },
      { key: 'enableThinking', label: '开启思考', type: 'boolean', defaultValue: true, flag: null },
      /*
       * The level the server starts at, which is not the level a turn runs at.
       *
       * Two controls that read as one idea and are not. The composer's picker
       * (five chips, sent as `variant`) decides a *turn*, and reaches llama.cpp
       * as the `reasoning_effort` request field the server reads on every call —
       * so it takes effect immediately, on a model that is already loaded. This
       * row decides a *load*: it becomes `--reasoning-effort`, a process
       * argument, and the server cannot be told a new one without being
       * restarted.
       *
       * That asymmetry is why the note is spelled out rather than left to be
       * discovered. A user who lowers this expecting the next reply to change
       * would otherwise conclude the whole page is decorative, which is close
       * to the truth it had before `buildArgs` learned the flag at all.
       *
       * Three levels, not five: see `REASONING_EFFORT_LEVELS`. The composer's
       * `xhigh`/`max` have no counterpart in the template's ladder, and a load
       * argument naming one would be a claim about the server that is false.
       */
      {
        key: 'reasoningEffort',
        label: '起始思考等级',
        type: 'select',
        options: REASONING_EFFORT_LEVELS,
        optionLabels: OPTION_LABELS.reasoningEffort,
        flag: '--reasoning-effort',
        note: '加载时固定。改这里要重新加载模型才生效；只想调这一轮的档位，用聊天框的「思考」。',
      },
      { key: 'reasoningBudget', label: '推理预算', type: 'number', auto: true, flag: null },
    ],
  },
  {
    id: 'sampling',
    title: '采样',
    fields: [
      { key: 'temperature', label: '温度', type: 'number', defaultValue: 0.8, flag: null },
      { key: 'limitResponseLength', label: '限制响应长度', type: 'boolean', defaultValue: false, flag: null },
      /*
       * The ceiling on one answer, and the value the engine is told to expect.
       *
       * ## Why it has a default at all when the switch above is off
       *
       * The switch says whether to *enforce* a length; this number is what the
       * harness reads to size a turn's budget. Leaving it empty is not "no
       * limit" — it is the engine's own default, applied to a model that may
       * reasonably spend several thousand tokens thinking before it writes
       * anything. Measured: a "low" reasoning level on a question the model
       * found interesting produced a twelve-minute turn that hit the ceiling
       * with nothing but reasoning in it and an answer of zero characters.
       *
       * 8192 is sized against that failure: the effort control halves a
       * deliberation to roughly 800–1000 tokens, so this leaves room for the
       * thinking, a long answer, and a tool-call round trip without leaving room
       * for a small book. It is a ceiling, not a target — an ordinary reply uses
       * a fraction of it.
       */
      { key: 'maxTokens', label: '最大响应长度', type: 'number', defaultValue: 8192, flag: null },
      { key: 'contextOverflow', label: '上下文溢出', type: 'select', options: ['rolling-window', 'stop'], optionLabels: OPTION_LABELS.contextOverflow, defaultValue: 'rolling-window', flag: '--context-shift / --no-context-shift' },
      { key: 'stopStrings', label: '停止字符串', type: 'string-list', defaultValue: [], flag: '--reverse-prompt' },
      /*
       * Named for the machine, not for the thread pool.
       *
       * `threads` above is how many threads the engine is told to use; this row
       * is how many the machine has. Labelled "CPU 线程" they read as the same
       * number shown twice, and a user comparing them would think one was
       * wrong.
       */
      { key: 'cpuThreadsNote', label: '本机可用核心', type: 'readonly', flag: null },
    ],
  },
]

/** Every field key the load endpoint accepts, for validation. */
export const LOAD_PARAMETER_KEYS = LOAD_PARAMETER_GROUPS.flatMap(group => group.fields.map(field => field.key))

/**
 * Normalize a load request into the flat options object `buildArgs` reads.
 *
 * The UI sends the same shape, so this exists to (a) drop unknown keys, (b)
 * coerce numeric strings from form inputs, and (c) translate the speculative
 * settings into the nested object the argument builder expects.
 */
/**
 * Keys that live in the per-model record but describe the model rather than
 * the launch: they change what the interface offers, not what the engine is
 * told. They are carried through `normalizeLoadOptions` even though they are
 * not form fields, because a remembered record is fed back through here on the
 * way to a load — dropping them would silently undo a user's correction on the
 * next load of that model.
 */
const CAPABILITY_KEYS = ['visionOverride', 'reasoningOverride']

export function normalizeLoadOptions(input = {}) {
  const out = {}
  for (const key of [...LOAD_PARAMETER_KEYS, ...CAPABILITY_KEYS]) {
    /*
     * `null` is the form's "clear this field" and is dropped here rather than
     * by each type's own rule. Stated once, at the door, because the rules
     * below are written per shape — numbers, booleans, lists — and a shape
     * without one of them (a free-text field, say) would keep the null and hand
     * it to the argument builder as if it were a value.
     */
    if (input[key] !== undefined && input[key] !== null) out[key] = input[key]
  }

  for (const key of ['contextLength', 'gpuLayers', 'threads', 'batchSize', 'ubatchSize', 'maxConcurrency',
    'contextCheckpoints', 'ropeFreqBase', 'ropeFreqScale', 'seed', 'specDraftNMax', 'specDraftNMin',
    'specDraftPMin', 'temperature', 'maxTokens', 'reasoningBudget']) {
    if (out[key] === '' || out[key] === null) delete out[key]
    else if (out[key] !== undefined && !Number.isFinite(Number(out[key]))) delete out[key]
    else if (out[key] !== undefined) out[key] = Number(out[key])
  }

  for (const key of ['unifiedKv', 'offloadKqv', 'keepInMemory', 'useMmap', 'flashAttention', 'enableThinking', 'limitResponseLength']) {
    if (typeof out[key] === 'string') out[key] = out[key] === 'true' || out[key] === '1'
  }

  // `useMmap` is stated positively in the UI but the flag it maps to is
  // negative, so the builder reads the inverted form.
  if (out.useMmap !== undefined) out.noMmap = out.useMmap === false
  if (out.keepInMemory !== undefined) out.mlock = out.keepInMemory === true

  // `speculative` arrives either as the UI's select value ('off'/'draft-mtp'/
  // 'draft-simple') or already normalized to an object, which is what happens
  // when a remembered configuration is fed back through here. Handling both
  // keeps this function idempotent: a second pass over its own output is a
  // no-op instead of nesting `type` inside `type`.
  const specType = out.speculative
  // A cleared select arrives as `null`, which is neither a mode nor an object
  // and would otherwise be normalized into `{ type: null }` — a shape the
  // argument builder reads as an unknown mode rather than as "unset".
  if (specType === null) delete out.speculative
  else if (specType !== undefined) {
    if (typeof specType === 'object' && specType !== null) {
      out.speculative = {
        ...specType,
        type: specType.type ?? 'none',
        nMax: specType.nMax ?? out.specDraftNMax,
        nMin: specType.nMin ?? out.specDraftNMin,
        pMin: specType.pMin ?? out.specDraftPMin,
      }
    } else {
      out.speculative = specType === 'off'
        ? { type: 'none' }
        : {
            type: specType,
            nMax: out.specDraftNMax,
            nMin: out.specDraftNMin,
            pMin: out.specDraftPMin,
          }
    }
  }

  // `null` is the panel's "clear this field", and on a list it has to become an
  // empty list rather than reach the splitter: `String(null)` is the four-letter
  // word "null", which survives `filter(Boolean)` and is then handed to
  // llama-server as a stop sequence. The process refuses to start over it.
  if (out.stopStrings === null) out.stopStrings = []
  if (out.stopStrings !== undefined && !Array.isArray(out.stopStrings)) {
    out.stopStrings = String(out.stopStrings).split(/\r?\n|,(?=\S)/).map(s => s.trim()).filter(Boolean)
  }
  // An emptied list is the absence of the flag, not a flag with no value: the
  // builder emits `--stop` only for the items it finds, and there is nothing
  // left to distinguish an empty list from an unset one.
  if (Array.isArray(out.stopStrings) && out.stopStrings.length === 0) delete out.stopStrings

  return out
}
