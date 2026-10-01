import { readdir, stat, open } from 'node:fs/promises'
import { join, basename, dirname, extname, relative } from 'node:path'

/**
 * Minimal GGUF header reader. A model directory is the discovery unit: one
 * directory may hold the weights, an mmproj sidecar and a draft model, and the
 * loader needs the split names before it can build a command line.
 */
const GGUF_MAGIC = 0x46554747
const MAX_METADATA_ENTRIES = 8192
const MAX_STRING_BYTES = 1 << 20
/**
 * A metadata array's element count is data, not a bound on our work: the
 * tokenizer vocabulary is one array with a quarter-million entries, and it is
 * the largest thing in the header. Arrays are counted and skipped rather than
 * materialized, so the only cost is walking the element payloads.
 */
const MAX_ARRAY_ELEMENTS = 1 << 24

const GGUF_TYPE = {
  UINT8: 0, INT8: 1, UINT16: 2, INT16: 3, UINT32: 4, INT32: 5,
  FLOAT32: 6, BOOL: 7, STRING: 8, ARRAY: 9, UINT64: 10, INT64: 11, FLOAT64: 12,
}

const SCALAR_READERS = {
  [GGUF_TYPE.UINT8]: (b, o) => [b.readUInt8(o), 1],
  [GGUF_TYPE.INT8]: (b, o) => [b.readInt8(o), 1],
  [GGUF_TYPE.UINT16]: (b, o) => [b.readUInt16LE(o), 2],
  [GGUF_TYPE.INT16]: (b, o) => [b.readInt16LE(o), 2],
  [GGUF_TYPE.UINT32]: (b, o) => [b.readUInt32LE(o), 4],
  [GGUF_TYPE.INT32]: (b, o) => [b.readInt32LE(o), 4],
  [GGUF_TYPE.FLOAT32]: (b, o) => [b.readFloatLE(o), 4],
  [GGUF_TYPE.UINT64]: (b, o) => [b.readBigUInt64LE(o), 8],
  [GGUF_TYPE.INT64]: (b, o) => [b.readBigInt64LE(o), 8],
  [GGUF_TYPE.FLOAT64]: (b, o) => [b.readDoubleLE(o), 8],
  [GGUF_TYPE.BOOL]: (b, o) => [b.readUInt8(o) !== 0, 1],
}

/**
 * llama.cpp's `llama_ftype` enum (ggml/include/ggml.h), which is what
 * `general.file_type` stores. The number is opaque in a model list, so every
 * entry carries the name llama.cpp itself reports for it.
 */
const FILE_TYPE_NAMES = {
  0: 'ALL_F32', 1: 'MOSTLY_F16', 2: 'MOSTLY_Q4_0', 3: 'MOSTLY_Q4_1',
  4: 'MOSTLY_Q4_1_SOME_F16', 7: 'MOSTLY_Q8_0', 8: 'MOSTLY_Q5_0', 9: 'MOSTLY_Q5_1',
  10: 'MOSTLY_Q2_K', 11: 'MOSTLY_Q3_K_S', 12: 'MOSTLY_Q3_K_M', 13: 'MOSTLY_Q3_K_L',
  14: 'MOSTLY_Q4_K_S', 15: 'MOSTLY_Q4_K_M', 16: 'MOSTLY_Q5_K_S', 17: 'MOSTLY_Q5_K_M',
  18: 'MOSTLY_Q6_K', 19: 'MOSTLY_IQ2_XXS', 20: 'MOSTLY_IQ2_XS', 21: 'MOSTLY_Q2_K_S',
  22: 'MOSTLY_IQ3_XS', 23: 'MOSTLY_IQ3_XXS', 24: 'MOSTLY_IQ1_S', 25: 'MOSTLY_IQ4_NL',
  26: 'MOSTLY_IQ3_S', 27: 'MOSTLY_IQ3_M', 28: 'MOSTLY_IQ2_S', 29: 'MOSTLY_IQ2_M',
  30: 'MOSTLY_IQ4_XS', 31: 'MOSTLY_IQ1_M', 32: 'MOSTLY_BF16', 33: 'MOSTLY_Q4_0_4_4',
  34: 'MOSTLY_Q4_0_4_8', 35: 'MOSTLY_Q4_0_8_8', 36: 'MOSTLY_TQ1_0', 37: 'MOSTLY_TQ2_0',
  38: 'MOSTLY_MXFP4_MOE', 39: 'MOSTLY_NVFP4',
}
/** Bytes needed to size the header window, so a 14 GiB file is never read whole. */
const HEADER_PROBE_BYTES = 32 * 1024 * 1024

class Cursor {
  constructor(buffer) { this.buffer = buffer; this.offset = 0 }
  take(n) {
    if (this.offset + n > this.buffer.length) throw new Error('GGUF header truncated')
    const start = this.offset
    this.offset += n
    return start
  }
  u32() { const o = this.take(4); return this.buffer.readUInt32LE(o) }
  u64() { const o = this.take(8); return Number(this.buffer.readBigUInt64LE(o)) }
  string() {
    const length = this.u64()
    if (length > MAX_STRING_BYTES) throw new Error('GGUF string too long')
    const o = this.take(length)
    return this.buffer.toString('utf8', o, o + length)
  }
  value(type) {
    if (type === GGUF_TYPE.STRING) return this.string()
    if (type === GGUF_TYPE.ARRAY) {
      const elementType = this.u32()
      const count = this.u64()
      if (count > MAX_ARRAY_ELEMENTS) throw new Error('GGUF array too long')
      // Only the length is read out; a vocabulary array is skipped by walking
      // its payload rather than building an array we would immediately discard.
      this.skip(elementType, count)
      return count
    }
    const reader = SCALAR_READERS[type]
    if (!reader) throw new Error(`GGUF unsupported type ${type}`)
    const [value, size] = reader(this.buffer, this.offset)
    this.offset += size
    return typeof value === 'bigint' ? Number(value) : value
  }

  /**
   * Advance past `count` values of one type without materializing them.
   * A fixed-width element costs one multiply; a string is length-prefixed, so
   * the lengths must still be visited.
   */
  skip(type, count) {
    if (type === GGUF_TYPE.STRING) {
      for (let i = 0; i < count; i += 1) this.string()
      return
    }
    if (type === GGUF_TYPE.ARRAY) {
      for (let i = 0; i < count; i += 1) this.value(GGUF_TYPE.ARRAY)
      return
    }
    const widths = {
      [GGUF_TYPE.UINT8]: 1, [GGUF_TYPE.INT8]: 1, [GGUF_TYPE.BOOL]: 1,
      [GGUF_TYPE.UINT16]: 2, [GGUF_TYPE.INT16]: 2,
      [GGUF_TYPE.UINT32]: 4, [GGUF_TYPE.INT32]: 4, [GGUF_TYPE.FLOAT32]: 4,
      [GGUF_TYPE.UINT64]: 8, [GGUF_TYPE.INT64]: 8, [GGUF_TYPE.FLOAT64]: 8,
    }
    const width = widths[type]
    if (!width) throw new Error(`GGUF unsupported array element type ${type}`)
    this.take(width * count)
  }
}

/** Read one GGUF header, returning the metadata map and tensor count. A null result means "not a GGUF file". */
export async function readGgufHeader(path) {
  let handle
  try {
    handle = await open(path, 'r')
    const size = (await handle.stat()).size
    const window = Math.min(size, HEADER_PROBE_BYTES)
    const buffer = Buffer.allocUnsafe(window)
    await handle.read(buffer, 0, window, 0)
    const cursor = new Cursor(buffer)
    if (cursor.u32() !== GGUF_MAGIC) return null
    const version = cursor.u32()
    if (version < 2 || version > 3) return null
    const tensorCount = cursor.u64()
    const metadataCount = cursor.u64()
    if (metadataCount > MAX_METADATA_ENTRIES) return null
    const metadata = {}
    for (let i = 0; i < metadataCount; i += 1) {
      const key = cursor.string()
      metadata[key] = cursor.value(cursor.u32())
    }
    return { version, tensorCount, metadata, bytes: size }
  } catch {
    return null
  } finally {
    await handle?.close().catch(() => {})
  }
}

/**
 * A key/value bag from a file already known to be a GGUF.
 *
 * The weaker sibling of {@link readGgufHeader}, for a projector file: nothing
 * downstream needs its tensor count or size, and a projector that turns out to
 * be unreadable is an accepted state rather than a failed scan.
 *
 * A metadata segment that does not fit the probe window yields no bag, which
 * the one caller reads as "this file names nothing" rather than as a mismatch.
 *
 * @returns the bag, or null when the file cannot be read as a GGUF.
 */
export async function readGgufMetadata(path) {
  let handle
  try {
    handle = await open(path, 'r')
    const size = (await handle.stat()).size
    const window = Math.min(size, HEADER_PROBE_BYTES)
    const buffer = Buffer.allocUnsafe(window)
    await handle.read(buffer, 0, window, 0)
    const cursor = new Cursor(buffer)
    if (cursor.u32() !== GGUF_MAGIC) return null
    const version = cursor.u32()
    if (version < 2 || version > 3) return null
    cursor.u64()
    const metadataCount = cursor.u64()
    if (metadataCount > MAX_METADATA_ENTRIES) return null
    const metadata = {}
    for (let i = 0; i < metadataCount; i += 1) {
      const key = cursor.string()
      metadata[key] = cursor.value(cursor.u32())
    }
    return metadata
  } catch {
    return null
  } finally {
    await handle?.close().catch(() => {})
  }
}

/** llama.cpp reports the trained context length; split models repeat it per shard. */
/**
 * How many transformer blocks the model has.
 *
 * This is the denominator of the GPU-offload setting: llama.cpp takes a count
 * of layers to place on the device, and every layer not offloaded runs on the
 * CPU where it is roughly an order of magnitude slower. Without the total a
 * user cannot tell whether the 32 in the box is all of them or half, which
 * makes the field impossible to set deliberately.
 */
export function blockCountOf(metadata) {
  const architecture = metadata['general.architecture']
  const candidates = [
    architecture && `${architecture}.block_count`,
    'llama.block_count',
  ].filter(Boolean)
  for (const key of candidates) {
    const value = metadata[key]
    if (Number.isFinite(value) && value > 0) return value
  }
  return undefined
}

export function contextLengthOf(metadata) {
  const architecture = metadata['general.architecture']
  const candidates = [
    architecture && `${architecture}.context_length`,
    'llama.context_length',
  ].filter(Boolean)
  for (const key of candidates) {
    const value = metadata[key]
    if (Number.isFinite(value) && value > 0) return value
  }
  return undefined
}

export function parameterCountOf(metadata) {
  const architecture = metadata['general.architecture']
  const key = architecture && `${architecture}.parameter_count`
  const value = metadata[key]
  return Number.isFinite(value) && value > 0 ? value : undefined
}

/**
 * The parameter size as the file itself states it.
 *
 * `general.size_label` is what llama.cpp writes, and it is a *label* rather
 * than a number: "27B", but also "35B-A3B" for a mixture-of-experts model,
 * where the second figure is what is active per token. That is strictly more
 * information than a count, and it is what the file's publisher chose to
 * advertise, so it is shown verbatim.
 *
 * `parameter_count` is read as a fallback because some converters write it and
 * not the label; on the models measured here it is absent entirely, which is
 * why the label is the primary source rather than the other way round.
 */
export function sizeLabelOf(metadata) {
  const declared = metadata['general.size_label']
  if (typeof declared === 'string' && declared.trim()) return declared.trim()
  const count = parameterCountOf(metadata)
  if (!Number.isFinite(count) || count <= 0) return undefined
  // Rounded to one decimal below 10B so a 1.5B model is not reported as "2B".
  return `${(count / 1e9).toFixed(count < 1e10 ? 1 : 0)}B`
}

export function architectureOf(metadata) {
  const value = metadata['general.architecture']
  return typeof value === 'string' && value ? value : undefined
}

/**
 * The human-readable quantization label for `general.file_type`.
 * An unknown number is reported as its llama.cpp enum id rather than being
 * guessed at, so a new quantization shows up as `llama.cpp #41` instead of a
 * plausible but wrong name.
 */
export function quantizationOf(metadata) {
  const value = metadata['general.file_type']
  if (!Number.isFinite(value)) return undefined
  const name = FILE_TYPE_NAMES[value]
  return name ? name.replace(/^MOSTLY_/, '') : `llama.cpp #${value}`
}

/**
 * Multi-token prediction support, which llama.cpp exposes as
 * `{architecture}.nextn_predict_layers`. Its presence decides whether the
 * loader may enable speculative MTP decoding, and the count bounds the depth
 * of the prediction head.
 */
/**
 * Architecture-name fragments that ship a vision tower inside the model
 * itself, with no separate mmproj file.
 *
 * Matched as *fragments* rather than as exact names, because the families that
 * matter are versioned continuations: `qwen2vl` and `qwen2.5vl` and whatever
 * `qwen3.5vl` turns out to be are the same tower under a new number. An exact
 * list would go stale on the next release, which is precisely how a capable
 * model ends up advertised as text-only.
 */
const VISION_ARCHITECTURE_FRAGMENTS = [
  'llava', 'qwen2vl', 'qwen2.5vl', 'qwen3vl', 'qwen3.5vl', 'qwen3vl_moe',
  'nanovl', 'mllama', 'idefics', 'minicpmv', 'gemma3', 'paligemma',
  'florence', 'internvl', 'pixtral', 'smolvlm', 'molmo', 'ovis', 'cogvlm',
  'glm4v', 'glm4.1v', 'deepseekvl', 'llama4', 'phi3v', 'phi4mm', 'step3v',
  'kimi-vl', 'kimi_vl', 'ernie4.5', 'hunyuanvl', 'aria', 'emu3', 'janus'
]

/**
 * Metadata keys that only a multimodal file carries.
 *
 * These are the strongest available evidence for a *built-in* tower: a
 * vision block, a projector, an image token — all written by the converter
 * from the model's own config, and none of them present in a text model.
 * Checked before the architecture name, because a key is a fact the file
 * states while a name is a pattern we recognize.
 */
const VISION_METADATA_PATTERNS = [
  /\.vision\./i,
  /vision_config/i,
  /vision_tower/i,
  /\.mm_projector\./i,
  /mm_projector_type/i,
  /image_token/i,
  /patch_size/i,
  /\.v\.blk\./i
]

/**
 * Derive what a model can do from its own metadata, rather than assuming.
 *
 * llama.cpp does not record a single capability flag, so each capability is
 * inferred from the evidence the file carries, and the evidence is also
 * reported alongside the verdict:
 *
 *   tool calling  - the chat template emits a tool-call envelope.
 *   vision        - an mmproj sidecar exists, or the file carries a vision
 *                   metadata block, or the architecture is a known multimodal
 *                   family. The sidecar is *one* of three sources, not the
 *                   test: a model with its tower built in has no sidecar at
 *                   all, and treating the sidecar as authoritative is what
 *                   made those models look text-only.
 *   reasoning     - the template carries a thinking/analysis block.
 *
 * Each verdict comes with a confidence, because the sources are not equally
 * strong: a metadata key or a sidecar is something the file states, while an
 * architecture name is a pattern we recognize and may not know yet. The caller
 * uses that to decide whether to present a verdict as fact or as a default to
 * be confirmed — see `resolveCapabilities`.
 */
export function capabilitiesOf(metadata, { hasMmproj = false } = {}) {
  const template = metadata['tokenizer.chat_template']
  const text = typeof template === 'string' ? template.toLowerCase() : ''
  const rawArchitecture = architectureOf(metadata) ?? ''
  const architecture = rawArchitecture.toLowerCase()

  // A template that tests for tools is the signal llama.cpp itself relies on;
  // `tools` alone is not enough, since an unrelated word could contain it.
  const toolCalling = Boolean(text) && /tool_call|tool_calls|\btools\b|function_call/.test(text)
  const reasoning = Boolean(text) && /thinking|reasoning|analysis|thought/.test(text)

  const architectureMatch = VISION_ARCHITECTURE_FRAGMENTS.some(name => architecture.includes(name))
  // Only the metadata *keys* are scanned, not their values: a value is
  // arbitrary model text, while a key name is written by the converter.
  const metadataMatch = Object.keys(metadata).some(key =>
    VISION_METADATA_PATTERNS.some(pattern => pattern.test(key))
  )
  const templateMatch = /vision|image/.test(text) && /vision|image/.test(architecture)

  // Strongest evidence wins for the reported source, since that is what the
  // interface would show as the reason.
  const visionSource = hasMmproj ? 'mmproj'
    : metadataMatch ? 'metadata'
    : architectureMatch ? 'architecture'
    : templateMatch ? 'template'
    : undefined

  return {
    toolCalling,
    vision: Boolean(visionSource),
    reasoning,
    hasTemplate: Boolean(text),
    visionConfidence: confidenceOf(visionSource),
    visionSource,
    architecture: rawArchitecture || undefined
  }
}

/**
 * How much a vision verdict is worth, derived from where it came from.
 *
 * Derived rather than assigned beside the source so the two cannot disagree:
 * a caller that downgrades a sidecar to `orphanMmproj` — the case where the
 * file sits next to a model that is not the one it was built for — gets the
 * softer confidence for free, and there is no second place to update.
 *
 * `certain` means the file itself states it. `likely` means a name pattern or
 * an unverified neighbour matched, which a re-export or a moved file can
 * invalidate. A model with no vision evidence at all is also `certain`: that is
 * an assertion about the absence of a tower, which reading the file settles.
 */
function confidenceOf(source) {
  if (source === 'mmproj' || source === 'metadata') return 'certain'
  if (source) return 'likely'
  return 'certain'
}

/** The three states an inferred capability can be overridden into. */
export const CAPABILITY_OVERRIDES = ['auto', 'on', 'off']

/**
 * Apply a user's override to an inferred capability.
 *
 * The inference is a guess, and a guess about *vision* has a specific failure
 * mode that matters: telling a multimodal model it cannot see makes image
 * input unreachable, with no way for the user to correct it. So the override
 * exists, and `auto` is the default rather than a confirmed answer.
 *
 * `'on'` is honoured even when the inference says no, because it is the user
 * asserting what they can see for themselves; `'off'` is honoured because a
 * model whose tower is unsupported should not be offered image input it will
 * reject at the wire.
 *
 * @returns the effective flag, and whether it was overridden
 */
export function resolveCapability(inferred, override) {
  if (override === 'on') return { value: true, overridden: true }
  if (override === 'off') return { value: false, overridden: true }
  return { value: Boolean(inferred), overridden: false }
}
export function mtpInfoOf(metadata) {
  const architecture = architectureOf(metadata)
  if (!architecture) return { supported: false }
  const value = metadata[`${architecture}.nextn_predict_layers`]
  if (!Number.isFinite(value) || value <= 0) return { supported: false }
  return { supported: true, layers: value }
}

/**
 * A sharded model is named `...-00001-of-00003.gguf`. The first shard is the
 * loadable entry point; the rest are implied by the split metadata.
 */
const SPLIT_PATTERN = /^(.*)-(\d{5})-of-(\d{5})$/i

export function splitInfoOf(path) {
  const stem = basename(path, extname(path))
  const match = SPLIT_PATTERN.exec(stem)
  if (!match) return undefined
  return { prefix: match[1], index: Number(match[2]), total: Number(match[3]) }
}

/** mmproj sidecars carry the vision tower for a multimodal model. */
export function isMmproj(path) {
  const name = basename(path).toLowerCase()
  return name.includes('mmproj') || name.includes('projector')
}

/**
 * Does this projector say it belongs to this model?
 *
 * A sidecar is paired with a model by directory adjacency, and nothing checks
 * that the two were built for each other — a projector copied into a folder,
 * or left behind by a swapped-out weights file, is adopted exactly as if it
 * matched. It still declares its own identity (`general.name`, and often
 * `general.base_model.0.name`), which is what this reads.
 *
 * Only what the file declares is read. File names are deliberately not
 * consulted: a projector is named after the model it was ported with, so a
 * name comparison agrees with any pairing a user has assembled by hand — which
 * is precisely the case this exists to catch. It would also only ever be
 * reached when the metadata has already said the two do not match, so its one
 * effect would be to overturn that finding. A rename is the attack; a name is
 * not evidence.
 *
 * @returns true when the projector names this model, or when it names nothing
 *   that can be compared — an unreadable header is *not* evidence of a
 *   mismatch, and treating it as one would strip confidence from correct pairs.
 */
export function mmprojNamesModel(modelName, mmprojMetadata) {
  if (!mmprojMetadata) return true
  const declared = [mmprojMetadata['general.name'], mmprojMetadata['general.base_model.0.name']]
    .filter(value => typeof value === 'string' && value.length > 0)
  // Nothing declared is nothing to contradict, which is the same state as an
  // unreadable header and takes the same answer.
  if (declared.length === 0) return true
  return declared.some(candidate => sharesModelTokens(candidate, modelName))
}

/**
 * Do two model names describe the same size of the same model?
 *
 * Names in one library share their family by construction — every Qwen build
 * says `qwen3`, `v2` appears in half a vendor's catalogue — so an overlap there
 * says only that the two are related. The size is what tells one build from the
 * next, and it is written as a trailing unit: `9b`, `27b`, `35b`. A sparsity
 * does the same job for a mixture (`a3b` is the 3B active half of a 35B model).
 *
 * Requiring a shared *size* is what separates the two cases that look alike:
 * `Qwen3.5-9B` and `Qwen3.5-27B` share `qwen3` and are different models, while
 * `MiMo V2.6 Distill Qwen 9B` and `MiMo-V2.6-9B` share `9b` and are the same
 * one under two spellings. A shared family token must never be enough, which is
 * the mistake this replaced: any digit counted, so `3` in `qwen3` confirmed a
 * projector from a different size — the most likely mismatch in a real library.
 */
function sharesModelTokens(left, right) {
  const rightTokens = new Set(modelTokens(right))
  return modelTokens(left).some(token => rightTokens.has(token) && SIZE_SHAPE.test(token))
}

/**
 * The tokens a model name is made of.
 *
 * Short numbers are dropped as well as the noise list: a bare `3` from a
 * `3.5` version is not a size, and leaving it in lets the version alone pair
 * two different builds.
 */
function modelTokens(value) {
  return value.toLowerCase()
    .split(/[^a-z0-9]/)
    .filter(token => token.length >= 2 && !IDENTITY_NOISE.has(token))
}

/** How a size or a sparsity is written: `9b`, `27b`, `a3b`, `1.5b`. */
const SIZE_SHAPE = /^\d+(\.\d+)?b$|^a\d+(\.\d+)?b$/

/**
 * Tokens that appear in so many names they confirm nothing.
 *
 * Every quantization tag carries a digit, so each one would otherwise pass the
 * identifying-token test and let `Qwen3.5-9B-Q4_K_M` confirm a projector for
 * any other 9B Qwen: the tags describe how a file was stored, not what it is.
 * The projector's own marker and the format are here for the same reason —
 * they say "both are GGUFs with a projector" and nothing more.
 */
const IDENTITY_NOISE = new Set([
  'gguf', 'mmproj', 'model', 'quant', 'iq4', 'iq3', 'iq2', 'iq1',
  'q2', 'q3', 'q4', 'q5', 'q6', 'q8', 'q4k', 'q5k', 'q6k', 'q4km', 'q4ks', 'q5km', 'q5ks',
  'bf16', 'fp16', 'fp32', 'fp8', 'f16', 'f32', 'int8', 'int4',
  '00001', '00002', '00003', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
])

/** A draft model backs speculative decoding; the loader attaches it, so it is not listed as a chat model. */
export function isDraft(path) {
  const name = basename(path).toLowerCase()
  return /(^|[-_.])(draft|dflash|eagle|mtp|spec)([-_.]|$)/.test(name)
}

/**
 * Choose the shard that represents a whole split model.
 * @returns the first shard, or undefined for a middle/last shard.
 */
function firstShardOf(path) {
  const split = splitInfoOf(path)
  if (!split) return true
  return split.index === 1
}

/** One discovered model: what the picker shows and what the loader needs. */
function describeModel(id, directory, file, header) {
  const metadata = header.metadata
  const architecture = architectureOf(metadata)
  const declaredName = metadata['general.name']
  const name = typeof declaredName === 'string' && declaredName ? declaredName : basename(directory)
  const fileType = metadata['general.file_type']
  const mtp = mtpInfoOf(metadata)
  const capabilities = capabilitiesOf(metadata)
  return {
    id,
    path: file,
    directory,
    name,
    architecture,
    contextLength: contextLengthOf(metadata),
    blockCount: blockCountOf(metadata),
    parameterCount: parameterCountOf(metadata),
    // What the picker shows for size. A string, because the file's own label
    // can say more than a count ("35B-A3B").
    sizeLabel: sizeLabelOf(metadata),
    fileType: Number.isFinite(fileType) ? fileType : undefined,
    quantization: quantizationOf(metadata),
    hasMtp: mtp.supported,
    mtpLayers: mtp.layers,
    bytes: header.bytes,
    // `multimodal` is the vision flag the picker and loader read; `capabilities`
    // carries the fuller, evidence-based picture.
    multimodal: capabilities.vision,
    capabilities,
  }
}

/**
 * Split a models-root setting into absolute directories.
 *
 * The setting is free text so a user can point the app at the folders they
 * already have, including more than one library. Semicolons, commas, pipes and
 * newlines all separate entries, and quotes are tolerated so a path pasted from
 * Explorer round-trips.
 * @param roots - one root, or several separated by punctuation or newlines.
 * @returns trimmed, de-duplicated, non-empty roots in the order given.
 */
export function parseModelRoots(roots) {
  const list = Array.isArray(roots) ? roots : [roots]
  const out = []
  for (const entry of list) {
    if (typeof entry !== 'string') continue
    for (const piece of entry.split(/[;|,\r\n]+/)) {
      const trimmed = piece.trim().replace(/^"(.*)"$/, '$1').trim()
      if (trimmed && !out.includes(trimmed)) out.push(trimmed)
    }
  }
  return out
}

/**
 * Scan a models root for loadable GGUF models. Each top-level directory holding
 * a first-shard GGUF is one model; loose GGUF files in the root are one model
 * each. Draft models and mmproj sidecars are recorded as companions rather than
 * entries of their own, because the loader consumes them alongside their target.
 *
 * Several roots may be given; ids stay stable per root, and a model found under
 * two roots is listed once, because the same weights loaded twice would fight
 * for the same GPU memory.
 * @param root - one models root, or several separated by punctuation/newlines.
 * @returns discoverable models in stable name order.
 */
export async function scanModels(root, { maxDepth = 4 } = {}) {
  const models = []
  const seen = new Set()
  /*
   * Ids handed out so far, across every root.
   *
   * Separate from `seen`, which holds absolute paths: this one exists to catch
   * a model that appears under two libraries, where the paths differ and the id
   * does not. See the note where the id is built.
   */
  const seenIds = new Set()
  const roots = parseModelRoots(root)

  async function walk(directory, depth, rootDir) {
    if (depth > maxDepth) return
    let entries
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch {
      return
    }
    const ggufs = []
    for (const entry of entries) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(path, depth + 1, rootDir)
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.gguf') {
        ggufs.push(path)
      }
    }
    for (const path of ggufs) {
      if (isMmproj(path) || isDraft(path)) continue
      if (!firstShardOf(path)) continue
      if (seen.has(path)) continue
      seen.add(path)
      const header = await readGgufHeader(path)
      if (!header) continue
      // The id is `{publisher}/{model}`, matching the directory layout the
      // picker shows; the file name is a detail of how the weights are split.
      const relativePath = relative(rootDir, path).replace(/\\/g, '/')
      const baseId = relativePath.split('/').slice(0, -1).join('/') || basename(dirname(path))
      /*
       * A second library can hold a model the first one also has.
       *
       * The id above is relative to its own root, so `Xiaomi/MiMo-V2.6-9B`
       * names both copies — and everything downstream keys on the id: the
       * picker draws two identical rows, and `loadLocalModel`'s
       * `find(entry => entry.id === …)` returns the first, leaving the second
       * file unreachable through any click.
       *
       * Rather than make every caller path-aware, the id is made unique here,
       * where the collision is created. Only the *duplicate* is suffixed: a
       * single-library setup, which is the common one, sees exactly the ids it
       * saw before.
       */
      const rootLabel = basename(rootDir)
      let directoryId = baseId
      if (seenIds.has(directoryId)) {
        directoryId = `${baseId} (${rootLabel})`
      }
      seenIds.add(directoryId)
      const siblingNames = ggufs.map(candidate => basename(candidate).toLowerCase())
      // The id is what the picker shows, the directory is the model's own
      // folder (several GGUF files there are one model), and the file is the
      // first shard the loader opens.
      const model = describeModel(directoryId, dirname(path), path, header)
      model.mmproj = siblingNames.some(isMmproj)
        ? ggufs.find(candidate => isMmproj(candidate))
        : undefined
      model.draft = siblingNames.some(isDraft)
        ? ggufs.find(candidate => isDraft(candidate))
        : undefined
      model.multimodal = Boolean(model.mmproj)
      // An mmproj sibling is discovered after the header is read, so the
      // vision verdict is refreshed with it in hand; the template-derived
      // capabilities do not change.
      if (model.mmproj) {
        // Adjacency is how a projector is found, and it is all it takes to be
        // adopted: nothing in the layout says the two files were built for each
        // other. When the projector names a different model it is still read as
        // vision evidence — it *is* a projector, sometimes deliberately pointed
        // at a model it was not trained for — but it drops to the weaker source
        // so the interface offers the user a correction instead of asserting a
        // fact the file does not support.
        const adopted = mmprojNamesModel(model.name, await readGgufMetadata(model.mmproj))
        // `visionSource` is set on both branches. `capabilitiesOf` never saw the
        // sidecar — it is discovered here, after the header — so leaving the
        // field alone would report a source of `undefined` for a verdict that
        // only exists because a projector was found, and the interface would
        // have no reason to show.
        model.capabilities = adopted
          ? { ...model.capabilities, vision: true, visionSource: 'mmproj', visionConfidence: 'certain' }
          : { ...model.capabilities, vision: true, visionSource: 'orphanMmproj', visionConfidence: 'likely' }
      }
      models.push(model)
    }
  }

  for (const rootDir of roots) await walk(rootDir, 0, rootDir)
  models.sort((a, b) => a.id.localeCompare(b.id))
  return models
}

/** True when the path is a readable GGUF, used to validate a configured binary or model path. */
export async function existsAsFile(path) {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}
