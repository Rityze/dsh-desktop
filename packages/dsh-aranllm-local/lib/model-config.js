/**
 * Per-model load configuration, remembered between sessions.
 *
 * LM Studio remembers, per model, how you last loaded it — context length, GPU
 * offload, flash attention, and so on. Re-picking the same file should not mean
 * re-entering the same numbers, so every successful load writes its options
 * here and the load dialog reads them back as the initial form state.
 *
 * The store is keyed by a stable identity rather than by absolute path: a model
 * folder that moves between drives, or a models root that is re-pointed, still
 * finds its settings. The identity is the GGUF file name plus the byte size,
 * which is stable across path changes and distinct between quantizations.
 *
 * Persistence is a single JSON file inside the plugin's data directory. A
 * corrupt or unreadable file degrades to "no remembered settings" rather than
 * failing a load: remembering is a convenience, never a prerequisite.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { LOAD_PARAMETER_GROUPS } from './load-options.js'

/** The filename inside the data directory. */
const FILENAME = 'model-configs.json'

/**
 * Options worth remembering. Deliberately excludes one-shot and
 * per-conversation values (apiKey, defaultMaxTokens, systemPrompt): those
 * belong to the request, not to the model, and silently restoring an apiKey
 * from a previous session would be a surprise.
 */
const PERSISTED_KEYS = [
  'contextLength', 'gpuLayers', 'threads', 'batchSize', 'ubatchSize',
  'kvCacheType', 'kvCacheTypeK', 'kvCacheTypeV', 'flashAttention',
  'unifiedKv', 'contextCheckpoints', 'ropeFreqBase', 'ropeFreqScale',
  'offloadKqv', 'keepInMemory', 'useMmap', 'seed', 'speculative',
  'specDraftNMax', 'specDraftNMin', 'specDraftPMin', 'temperature',
  'maxTokens', 'limitResponseLength', 'contextOverflow', 'stopStrings',
  'chatTemplate', 'enableThinking', 'reasoningBudget', 'reasoningEffort', 'extraArgs',
  // Capability overrides. These are *not* load options — they change what the
  // interface offers, not what llama.cpp is told — but they belong to the same
  // per-model record because they are per-model facts, and a user who corrects
  // a vision verdict should not have to redo it next session.
  //
  // Only the overrides are stored. The resolved verdict is not: `vision` is
  // computed from the file on every scan, so persisting it would freeze one
  // session's answer into the next one's settings and survive a model being
  // swapped underneath the same file name.
  'visionOverride', 'reasoningOverride',
]

/**
 * The values each enumerated key is still allowed to hold.
 *
 * Read from the schema rather than restated, so a value that stops existing
 * stops being restorable in the same edit that removes it. A remembered config
 * outlives the code that wrote it: the select it came from can lose an option
 * between one version and the next, and without this the retired value would be
 * read back into the form, accepted by the argument builder, and handed to a
 * server that no longer knows the flag — the load fails on a setting the user
 * cannot see, because the option is gone from the dropdown.
 */
const ENUMERATED_VALUES = {}
for (const group of LOAD_PARAMETER_GROUPS) {
  for (const field of group.fields) {
    if (field.options?.length) ENUMERATED_VALUES[field.key] = new Set(field.options)
  }
}

/** Pick the durable subset of a load-options object. */
export function persistedConfig(options = {}) {
  const out = {}
  for (const key of PERSISTED_KEYS) {
    const value = options[key]
    if (value === undefined || value === null) continue
    if (Array.isArray(value) && value.length === 0) continue
    // A retired option is not merely unknown, it is unusable: the flag it maps
    // to may have been removed from the engine too, where it is a startup
    // failure rather than a warning. Dropping it falls back to the schema's
    // default, which is a setting that still works.
    const allowed = ENUMERATED_VALUES[key]
    if (allowed && !allowed.has(value)) continue
    out[key] = value
  }
  return out
}

/**
 * A stable identity for a model file.
 *
 * Size is included so that re-quantizing a model in place (same file name, new
 * bytes) gets fresh settings instead of the previous quantization's — a q4_0
 * context length is not necessarily a q8_0 one.
 */
export function configKey(model) {
  if (!model?.path) return undefined
  const name = String(model.name ?? model.path)
  return `${name}::${Number.isFinite(model.bytes) ? model.bytes : 'unknown'}`
}

/** A JSON-file store of per-model load options. */
export class ModelConfigStore {
  #file
  #cache
  #write

  /** @param {{ file: string }} options the JSON file to read and write. */
  constructor({ file } = {}) {
    this.#file = file
  }

  get file() { return this.#file }

  /** Everything remembered, keyed by `configKey`. Never throws. */
  async all() {
    if (this.#cache) return this.#cache
    try {
      const text = await readFile(this.#file, 'utf8')
      const parsed = JSON.parse(text)
      this.#cache = parsed && typeof parsed === 'object' ? parsed : {}
    } catch (error) {
      // ENOENT on first run is the normal case; a parse error means the file was
      // hand-edited into something invalid, which is also recoverable by
      // starting empty.
      if (error?.code !== 'ENOENT') {
        this.#cache = {}
      } else {
        this.#cache = {}
      }
    }
    return this.#cache
  }

  /** Remembered options for one model, or undefined. */
  async get(model) {
    const key = configKey(model)
    if (!key) return undefined
    const all = await this.all()
    const entry = all[key]
    return entry && typeof entry === 'object' ? { ...entry } : undefined
  }

  /**
   * One model's settings without awaiting the file.
   *
   * Exists for synchronous callers — a capability override is read while
   * rendering, and awaiting there would make the flag flicker a frame later.
   * Answers only from what has already been loaded, so a caller that has never
   * awaited `all()` gets nothing instead of blocking; `undefined` and `{}` are
   * therefore both "ask again after priming".
   */
  snapshot(key) {
    if (!key || !this.#cache) return undefined
    const entry = this.#cache[key]
    return entry && typeof entry === 'object' ? { ...entry } : undefined
  }

  /**
   * Store options for one model and flush to disk.
   *
   * The whole read-modify-write runs inside one link of the write chain, not
   * merely the flush. Serializing only the flush is not enough: two saves that
   * both `await all()` before either assigns `#cache` each build their entry
   * onto the same snapshot, and whichever flushes last writes the other one
   * out of existence. Chaining the mutation is what makes the file's contents
   * equal to every write that has been awaited.
   */
  set(model, options) {
    const key = configKey(model)
    if (!key) return Promise.resolve(undefined)
    const saved = { ...persistedConfig(options), updatedAt: new Date().toISOString() }
    return this.#mutate((all) => {
      all[key] = saved
      return saved
    })
  }

  /**
   * Change some of one model's settings, leaving the rest as they were.
   *
   * `set` replaces the whole record, which is right for a form that owns every
   * field but wrong for a control that owns two. A caller patching a subset
   * would otherwise have to read the record, edit it, and write it back — and
   * between the read and the write, anything another panel saved is lost. That
   * is the same read-modify-write race as two concurrent `set`s, just moved
   * from the store into the renderer.
   *
   * Two ways to mean "nothing", and they differ. `undefined` — which is also
   * what a field missing from the payload looks like — means "I am not touching
   * this". `null` means "clear this", and the key is removed so the absent
   * value is what a later read sees. A form that only has `undefined` cannot
   * express clearing a field, and JSON cannot carry `undefined` at all, so
   * `null` is the only available spelling for the second intent.
   */
  patch(model, changes) {
    const key = configKey(model)
    if (!key) return Promise.resolve(undefined)
    const changed = Object.entries(changes ?? {}).filter(([, value]) => value !== undefined)
    const cleared = changed.filter(([, value]) => value === null).map(([name]) => name)
    const delta = Object.fromEntries(changed.filter(([, value]) => value !== null))
    return this.#mutate((all) => {
      const existing = all[key] && typeof all[key] === 'object' ? all[key] : {}
      // Through the same filter `set` uses, so a patch cannot smuggle in a key
      // the record is not supposed to carry.
      const saved = { ...existing, ...persistedConfig(delta), updatedAt: new Date().toISOString() }
      for (const name of cleared) delete saved[name]
      all[key] = saved
      return saved
    })
  }

  /** Drop one model's settings. */
  remove(model) {
    const key = configKey(model)
    if (!key) return Promise.resolve(false)
    return this.#mutate((all) => {
      if (!(key in all)) return false
      delete all[key]
      return true
    })
  }

  /**
   * Apply one mutation to the store and persist the result, serialized against
   * every other mutation.
   *
   * Both settlement paths run the mutation, so a failed flush does not leave
   * the next caller chained to a rejected promise. A failure is swallowed only
   * for the *chain* — the in-memory state is still correct and the next write
   * repairs the file — while the caller's own promise still rejects, so a save
   * that could not be persisted is not reported as successful.
   */
  #mutate(apply) {
    const run = async () => {
      const all = await this.all()
      const result = apply(all)
      this.#cache = all
      await this.#flush()
      return result
    }
    const result = (this.#write ?? Promise.resolve()).then(run, run)
    this.#write = result.catch(() => {})
    return result
  }

  async #flush() {
    await mkdir(dirname(this.#file), { recursive: true })
    await writeFile(this.#file, `${JSON.stringify(this.#cache ?? {}, null, 2)}\n`, 'utf8')
  }
}

/** Where the store lives, given the plugin data directory. */
export function modelConfigFile(dataDir) {
  return join(dataDir, FILENAME)
}
