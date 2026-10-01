/**
 * What a local model can be asked to do, derived from its own metadata.
 *
 * The harness models capabilities as three separate concerns and each maps to
 * a different part of a request:
 *
 *   inputModalities  - which content parts are legal. A vision-less model must
 *                      not be handed an image, so this decides what the
 *                      renderer offers.
 *   reasoning efforts - the selectable thinking levels, in display order. This
 *                      is a *list*, not a switch: llama.cpp's own `--reasoning`
 *                      surface is not something this build drives, so the
 *                      levels here are the ones that can be expressed as a
 *                      chat-template argument.
 *   thinking toggle  - whether the model reasons at all, which is the same
 *                      evidence as the reasoning list being non-empty.
 *
 * Everything is decided from the GGUF's tokenizer metadata, never assumed. A
 * model whose template carries no thinking branch reports no efforts, and the
 * UI then shows no selector rather than one that does nothing.
 */

/**
 * The reasoning levels a template-driven model exposes.
 *
 * llama.cpp's server accepts `reasoning_effort` and forwards it to the chat
 * template as a `reasoning_effort` variable when the template uses one. The
 * levels below are the common vocabulary across the Qwen3/DeepSeek families —
 * the architectures that actually ship a thinking branch in this deployment —
 * so they are offered only when a thinking block is present.
 *
 * `none` is deliberately first: llama.cpp treats an absent or disabled effort
 * as "answer directly", which is what a user toggling thinking off expects,
 * and making it the default would silently change behaviour for every existing
 * model. It is listed but never made the default.
 */
export const REASONING_EFFORTS = [
  { id: 'none', name: '关闭思考', description: '直接作答，不输出思考过程' },
  { id: 'low', name: '低', description: '简短的思考，适合简单问题' },
  { id: 'medium', name: '中', description: '默认档位，兼顾速度与质量' },
  { id: 'high', name: '高', description: '充分的思考，适合难题' }
]

/** English copy, for the same list. The ids are what the wire uses. */
const EFFORT_NAMES_EN = {
  none: { name: 'Off', description: 'Answer directly, with no reasoning trace' },
  low: { name: 'Low', description: 'Brief reasoning, for straightforward questions' },
  medium: { name: 'Medium', description: 'The default balance of speed and quality' },
  high: { name: 'High', description: 'Extended reasoning, for hard problems' }
}

/**
 * The default effort for a model that can reason.
 *
 * `medium` for reasoning models, and the whole list absent otherwise — see
 * `reasoningInfoOf`. Returning `none` would be wrong here: a model whose
 * template reasons is loaded because someone wants the reasoning, and the
 * toggle exists to turn it off per conversation, not to have it off by
 * default.
 */
export const DEFAULT_REASONING_EFFORT = 'medium'

/**
 * The input modalities a model accepts, in the order the picker shows them.
 *
 * Always `text`; `image` only when the file carries a vision tower. A model
 * that has an mmproj sidecar is multimodal regardless of architecture, because
 * the sidecar is the tower itself.
 */
export function inputModalitiesOf(capabilities = {}) {
  return capabilities.vision ? ['text', 'image'] : ['text']
}

/**
 * The harness `reasoning` metadata for one model, or undefined.
 *
 * Absent rather than empty-when-false: the harness contract says an absent
 * `reasoning` means "this route exposes no levels", which is what hides the
 * selector. An empty list would be a selector with nothing in it.
 *
 * @param capabilities as produced by `capabilitiesOf` in gguf.js
 * @param language 'zh' or 'en', for the effort names
 */
export function reasoningInfoOf(capabilities = {}, language = 'zh') {
  if (!capabilities.reasoning) return undefined
  const efforts = REASONING_EFFORTS.map((effort) => ({
    id: effort.id,
    name: language === 'en' ? EFFORT_NAMES_EN[effort.id]?.name ?? effort.name : effort.name,
    description:
      language === 'en'
        ? EFFORT_NAMES_EN[effort.id]?.description ?? effort.description
        : effort.description
  }))
  return { efforts, defaultEffort: DEFAULT_REASONING_EFFORT }
}

/**
 * Translate a chosen effort into the fields llama.cpp reads.
 *
 * ## What is sent, and what was believed
 *
 * An earlier version of this file sent only `chat_template_kwargs.enable_thinking`
 * and left the effort out, on the strength of a measurement that `reasoning_effort`
 * destroyed the reasoning channel — the deliberation appeared inside `content`
 * instead of beside it. That measurement was taken without an enable flag on the
 * request, so the two fields were never on the same request and the conclusion
 * did not follow from it.
 *
 * Re-measured on the same server with a question that forces deliberation, and
 * counting the characters that arrived in each field:
 *
 * | request                                        | reasoning | content |
 * |------------------------------------------------|-----------|---------|
 * | `{enable_thinking: true}`                      |      1750 |       0 |
 * | `{reasoning_effort:"low", enable_thinking:true}` |     830 |   **733** |
 * | `{reasoning_budget: 200, enable_thinking:true}` |     1709 |       0 |
 * | `{reasoning_budget: 512, enable_thinking:true}` |     1915 |       0 |
 * | `{enable_thinking: false}`                     |         0 |    1940 |
 *
 * So `reasoning_effort` is both safe and load-bearing: it halves the thinking
 * **and** is what lets an answer exist at all on a question the model would
 * otherwise deliberate through its whole budget. Without it, a "low" setting in
 * the panel reached only a launch flag that a running process ignores, and the
 * reported result was a twelve-minute turn that hit the output cap with nothing
 * but reasoning in it.
 *
 * `reasoning_budget` is accepted and ignored by this build — its numbers moved
 * the thinking *up*, which is noise — so it is not sent. `reasoning_effort` is
 * the only per-request lever that does anything.
 *
 * ## Why `none` is explicit
 *
 * `none` maps to an explicit "off" rather than to an omitted field: omitting it
 * would let the template's own default apply, which is exactly the behaviour the
 * user just turned off.
 *
 * @returns fields to merge into the chat-completions body, or undefined when
 *   the caller expressed no preference.
 */
export function reasoningRequestFields(effort) {
  if (effort === undefined || effort === null || effort === '') return undefined
  if (effort === 'none') return { chat_template_kwargs: { enable_thinking: false } }
  return {
    reasoning_effort: effort,
    chat_template_kwargs: { enable_thinking: true },
  }
}

/**
 * Whether an effort id is one this deployment understands.
 *
 * Validated at the boundary rather than trusted: the id arrives from a
 * renderer, and an unrecognized one must not be forwarded into a template
 * argument where it would be interpolated verbatim.
 */
export function isKnownEffort(effort) {
  return REASONING_EFFORTS.some((entry) => entry.id === effort)
}
