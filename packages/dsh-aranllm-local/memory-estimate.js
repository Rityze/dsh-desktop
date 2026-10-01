/**
 * What a load is going to cost, before it is started.
 *
 * ## Where the formulas come from
 *
 * Measured off LM Studio's own `calculateLoadSizesLlamaCpp`, read out of the
 * installed application at
 * `D:\APPs\LM Studio\resources\app\.webpack\main\index.js`. Its names are
 * minified; the structure is not, and the structure is what a number has to
 * match to agree with the panel a user is comparing against.
 *
 * It sums four things, and the first attempt at this file summed two:
 *
 *     weights + kvCache + inputBuffer + computeBuffer
 *
 * The two buffers are not decoration. On a 27B model at 262K context they are
 * hundreds of megabytes, and leaving them out is the difference between a figure
 * a user can budget against and one that is wrong by a gigabyte.
 *
 * ## Why there is a second figure beside llama.cpp's own projection
 *
 * The copied modules already report one, read from llama.cpp's log after a load,
 * having accounted for the real device and the real tensors. That one is better.
 * What it cannot do is answer a question about a load that has not happened —
 * and the panel exists so the parameters are chosen *before* the model starts,
 * which is exactly when no log exists to read.
 *
 * ## What is still not counted
 *
 * The runtime's own allocations, the CUDA/HIP context, and the display's
 * framebuffer. They are real and they are hundreds of megabytes, and none of
 * them moves when a parameter does — so a figure that guessed at them would
 * change when the user touched something unrelated. This is a floor, and the
 * panel labels it 预估 for that reason.
 */

/**
 * Bytes per KV element, by the cache-type names llama.cpp accepts.
 *
 * The fractional values are the quantised formats: a `q4_0` block is 32
 * weights in 18 bytes, which is 4.5 bits each, which is 0.5625 bytes. Writing
 * them as fractions rather than as bit counts keeps one multiplication below
 * instead of two conversions.
 */
const KV_BYTES = {
  f32: 4,
  f16: 2,
  bf16: 2,
  q8_0: 1.0625,
  q5_1: 0.75,
  q5_0: 0.6875,
  q4_1: 0.5625,
  q4_0: 0.5625,
  iq4_nl: 0.5625,
}

const DEFAULT_KV_BYTES = KV_BYTES.f16

/** The bytes one KV element costs for a cache-type name. */
function bytesForKvType(name) {
  return KV_BYTES[String(name ?? '').toLowerCase()] ?? DEFAULT_KV_BYTES
}

/** The architecture prefix a metadata key belongs to, or an empty string. */
function architectureOf(metadata) {
  const declared = metadata?.['general.architecture']
  if (typeof declared === 'string' && declared.length > 0) return declared
  for (const key of Object.keys(metadata ?? {})) {
    const dot = key.indexOf('.')
    if (dot > 0 && key.endsWith('.block_count')) return key.slice(0, dot)
  }
  return ''
}

/** A metadata number, or undefined when it is absent or not finite. */
function numberAt(metadata, key) {
  const value = metadata?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * The parameters the estimate needs, read from a GGUF header.
 *
 * @param {object} metadata - the header's `metadata` map.
 * @returns {object} whatever was found; every field may be absent.
 */
export function kvGeometry(metadata) {
  const architecture = architectureOf(metadata)
  const at = (suffix) => numberAt(metadata, `${architecture}.${suffix}`)

  const layerCount = at('block_count') ?? numberAt(metadata, 'numHiddenLayers')
  const contextLength = at('context_length') ?? numberAt(metadata, 'contextLength')
  const embeddingLength = at('embedding_length') ?? numberAt(metadata, 'hiddenSize')
  const headCount = at('attention.head_count') ?? numberAt(metadata, 'numAttentionHeads')
  const headCountKv =
    at('attention.head_count_kv') ?? numberAt(metadata, 'numKvHeads') ?? headCount

  const keyLength = at('attention.key_length')
  const valueLength = at('attention.value_length')

  /*
   * Two cache shapes, and the test is not "does it declare `key_length`".
   *
   * That was the first version and it was wrong: `qwen35` writes both
   * `key_length` and a full `head_count_kv`, and the grouped-query formula is
   * the correct one for it. What separates the shapes is whether the declared
   * lengths **match the head arithmetic** — in a grouped-query file `key_length`
   * is `embedding_length / head_count` written out a second way, and in a
   * latent-attention file it is not. Measured: DeepSeek's are 576 and 512
   * against a head dimension of 102, and treating qwen35 the same way doubled
   * its cache.
   */
  const headDim =
    Number.isFinite(embeddingLength) && Number.isFinite(headCount) && headCount > 0
      ? embeddingLength / headCount
      : undefined
  const declaredWidthDiffers =
    keyLength !== undefined && headDim !== undefined && Math.abs(keyLength - headDim) > 0.5
  const isLatent = declaredWidthDiffers && keyLength !== undefined && valueLength !== undefined

  return {
    architecture,
    layerCount,
    contextLength,
    embeddingLength,
    headCount,
    headCountKv,
    keyLength,
    valueLength,
    headDim,
    isLatent,
  }
}

/**
 * The KV cache's size, in bytes.
 *
 * ## The formula
 *
 *     context × kvHeads × (headDim × 2) × bytesPerElement
 *
 * Two because each position keeps a key and a value. `kvHeads` rather than
 * `headCount`, which is the whole point of grouped-query attention: a model with
 * 32 query heads and 8 KV heads keeps a quarter of the cache.
 *
 * LM Studio writes the same thing in a different order —
 * `ctx / (headCount / kvHeads) × (gpuLayers × hiddenSize) × 2 × (bits / 8)` —
 * where `headCount / kvHeads` is the grouping factor and `hiddenSize / headCount`
 * is the head dimension. The two are equal; this one is written the way the GGUF
 * header names its fields.
 *
 * ## The latent-attention branch
 *
 * A file that stores a compressed KV representation declares its own per-token
 * width, and neither head count describes it. Those two numbers are used
 * directly, with no factor of two — the declared pair is already the whole
 * per-token footprint.
 *
 * @returns {number | undefined} bytes, or undefined when the file does not
 *   declare enough. Undefined rather than zero: a zero reads as "free".
 */
export function estimateKvBytes(geometry, { contextLength, kvCacheType, layersOnDevice } = {}) {
  const ctx = contextLength ?? geometry?.contextLength
  if (!Number.isFinite(ctx) || ctx <= 0) return undefined

  const layers = geometry?.layerCount
  const onDevice =
    Number.isFinite(layersOnDevice) && Number.isFinite(layers) && layers > 0
      ? layersOnDevice
      : layers
  if (!Number.isFinite(onDevice) || onDevice <= 0) return undefined

  const element = bytesForKvType(kvCacheType)

  if (geometry.isLatent) {
    const key = geometry.keyLength
    const value = geometry.valueLength
    if (!Number.isFinite(key) || !Number.isFinite(value)) return undefined
    return onDevice * ctx * (key + value) * element
  }

  const heads = geometry.headCountKv
  const headDim = geometry.headDim
  if (!Number.isFinite(heads) || !Number.isFinite(headDim)) return undefined
  return ctx * heads * headDim * 2 * element
}

/**
 * The input buffer: the batch a forward pass is staged in.
 *
 * Taken from the same function in LM Studio, where the six terms are
 * `batch + hidden × batch + batch + ctx × batch + ctx + batch` — one allocation
 * for the token ids, one for the embeddings they project to, one for the result
 * of each, and two scalars. The `ctx` terms dominate: at 262K they are what
 * makes this a hundred megabytes rather than one.
 *
 * @returns {number | undefined} bytes.
 */
export function estimateInputBufferBytes(geometry, { contextLength, batchSize } = {}) {
  const hidden = geometry?.embeddingLength
  const ctx = contextLength ?? geometry?.contextLength
  if (!Number.isFinite(hidden) || !Number.isFinite(ctx)) return undefined
  /* A load with no batch setting still runs one, and llama.cpp answers 512. */
  const batch = Number.isFinite(batchSize) && batchSize > 0 ? batchSize : Math.min(ctx, 2048)
  return batch + hidden * batch + batch + ctx * batch + ctx + batch
}

/**
 * The compute buffer: the scratch a graph runs in.
 *
 * LM Studio has two forms, chosen by whether flash attention is on, and they
 * differ by an order of magnitude. Without it the attention matrix is
 * materialised — `(ctx / 1024 × 2 + 0.75) × heads × 1024² × (batch / 2048)` —
 * which is quadratic in the context and is why a long context needs it.
 *
 * The `× 1024²` is not a fudge: the expression is written in kilobytes and the
 * result is wanted in bytes, so the constant converts one to the other.
 *
 * @returns {number | undefined} bytes.
 */
export function estimateComputeBufferBytes(
  geometry,
  { contextLength, batchSize, flashAttention, weightsBytes, kvBytes }
) {
  const heads = geometry?.headCount
  const ctx = contextLength ?? geometry?.contextLength
  if (!Number.isFinite(heads) || !Number.isFinite(ctx)) return undefined
  const batch = Number.isFinite(batchSize) && batchSize > 0 ? batchSize : Math.min(ctx, 2048)

  if (flashAttention === true) {
    /*
     * With flash attention the score matrix is never built, so the buffer is a
     * fraction of what is being read — weights and cache together. LM Studio's
     * own default for the ratio is a tenth, which is what a grouped-query model
     * at a moderate batch actually needs on the backends this application runs.
     */
    const feed = (weightsBytes ?? 0) + (kvBytes ?? 0)
    return feed * 0.1 * (batch / 2048)
  }

  return (ctx / 1024 * 2 + 0.75) * heads * 1024 * 1024 * (batch / 2048)
}

/**
 * The whole load's footprint, split the way the panel shows it.
 *
 * ## Why the weight part is proportional
 *
 * The file's own size is the total for every layer, and only some of them go to
 * the device. The layers are not identical — the first is often dense and the
 * rest are mixture-of-experts — so a proportional split is an approximation, and
 * it is the same one llama.cpp's `-ngl` behaves like. The alternative is reading
 * every tensor's offset, which is a full pass over a file measured in gigabytes.
 *
 * ## Why the buffers follow the weights
 *
 * They are allocated per device, not per layer, but their size is driven by how
 * much is being computed there. A model entirely on the host needs no device
 * scratch, and one entirely on the device needs all of it, so the same fraction
 * is applied.
 *
 * @returns {object} the figures the panel renders; any of them may be undefined.
 */
export function estimateLoad(geometry, options) {
  const fileBytes = Number.isFinite(options?.fileBytes) ? options.fileBytes : undefined
  const layers = geometry?.layerCount
  const requested = options?.gpuLayers

  /*
   * `-1` is llama.cpp's own spelling for "every layer", and it is also what an
   * unset field resolves to. Anything above the file's count is clamped, so a
   * number larger than the model cannot produce a footprint larger than the file.
   */
  let layersOnDevice
  if (!Number.isFinite(layers) || layers <= 0) layersOnDevice = undefined
  else if (!Number.isFinite(requested) || requested < 0 || requested > layers) layersOnDevice = layers
  else layersOnDevice = requested

  const fraction =
    layersOnDevice === undefined || !Number.isFinite(layers) || layers <= 0
      ? undefined
      : layersOnDevice / layers

  const weightsOnDevice =
    fileBytes === undefined || fraction === undefined ? undefined : fileBytes * fraction

  const ctx = Number.isFinite(options?.contextLength)
    ? options.contextLength
    : geometry?.contextLength
  const batchSize = Number.isFinite(options?.batchSize) ? options.batchSize : undefined
  const kvCacheType = options?.kvCacheType

  const kvBytes =
    fraction === undefined
      ? undefined
      : estimateKvBytes(geometry, { contextLength: ctx, kvCacheType, layersOnDevice })

  /*
   * The two buffers, each scaled by the same fraction as the weights.
   *
   * The compute buffer is asked for with the *device* weight figure, because
   * that is what the device has to hold while it computes — passing the whole
   * file's size would charge the scratch for layers that are not there.
   */
  const inputFull = estimateInputBufferBytes(geometry, { contextLength: ctx, batchSize })
  const computeFull = estimateComputeBufferBytes(geometry, {
    contextLength: ctx,
    batchSize,
    flashAttention: options?.flashAttention,
    weightsBytes: weightsOnDevice,
    kvBytes,
  })

  const inputBytes = inputFull === undefined || fraction === undefined ? undefined : inputFull * fraction
  const computeBytes =
    computeFull === undefined || fraction === undefined ? undefined : computeFull * fraction

  const contextBytes =
    kvBytes === undefined && inputBytes === undefined && computeBytes === undefined
      ? undefined
      : (kvBytes ?? 0) + (inputBytes ?? 0) + (computeBytes ?? 0)

  const deviceBytes =
    weightsOnDevice === undefined && contextBytes === undefined
      ? undefined
      : (weightsOnDevice ?? 0) + (contextBytes ?? 0)

  /*
   * What the host holds: the layers it kept, and nothing else. The cache and the
   * buffers were already scaled to the device's share, so a model loaded fully
   * on the device reports zero here — which is the honest answer and reads as a
   * number rather than as a bug once it has its own label.
   */
  const hostBytes =
    fileBytes === undefined || weightsOnDevice === undefined ? undefined : fileBytes - weightsOnDevice

  return {
    deviceBytes,
    hostBytes,
    kvBytes,
    inputBytes,
    computeBytes,
    contextBytes,
    weightsOnDevice,
    layersOnDevice,
    layers,
  }
}
