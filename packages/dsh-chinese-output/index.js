/**
 * Pins the answer to Simplified Chinese, and leaves the thinking alone.
 *
 * ## Why only the answer
 *
 * A model reasons in the language it was trained to reason in. Measured, in one
 * reply, the thinking arrived in English and the answer in Chinese — not because
 * the instruction was missing but because the two are produced differently: the
 * reasoning is not addressed to anyone, so nothing pulls it toward the question's
 * language, while the answer is.
 *
 * Asking for Chinese thinking as well was the first version of this file, and it
 * is worth recording why it was dropped:
 *
 *   - **Quality.** Reasoning in a second language is reasoning with a handicap.
 *     The model's precision on arithmetic, code and multi-step logic is highest
 *     in the language its training data was densest in, and a translated
 *     deliberation is a deliberation that has been through one more lossy step.
 *   - **Speed.** The user asked for this plugin and for faster generation in the
 *     same conversation, and they are the same request. The same thought costs
 *     roughly 1.5–2× as many tokens in Chinese as in English, and every one of
 *     them is a forward pass. Forcing Chinese thinking makes the model slower at
 *     exactly the moment its thinking is longest.
 *
 * The reasoning is also a block the user can fold away. What remains on screen
 * after they do is the answer, and that is what this pins.
 *
 * ## Why a prompt section rather than a wrapper around each request
 *
 * A wrapper would have to be applied at the adapter, which only exists for a
 * local model — the plugin would then be conditioning a language the local path
 * needs and leaving every other provider to its own devices, for no reason. The
 * system prompt is where an application states how its agent behaves, and it
 * reaches every provider through the one mechanism the harness provides.
 */
export const name = 'dsh-chinese-output'

/** The section name, distinct from the persona's so both can coexist. */
export const SECTION_NAME = 'chinese-output'

/**
 * The instruction.
 *
 * Written as a rule about the agent, not as a request from the user: this lands
 * in the system prompt, and a system prompt phrased as a favour is one the model
 * weighs against what the user said.
 *
 * The exclusions are listed because they are the cases a bare "reply in Chinese"
 * gets wrong: a model told to answer in Chinese will translate `npm install` and
 * a stack trace, and a faithfully translated error message is a worse search
 * query and a worse bug report than the original.
 */
export const TEXT = [
  '# 输出语言',
  '',
  '你面向用户的所有输出都使用简体中文。',
  '',
  '- 正文、解释、总结、提问、工具调用的说明文字，全部用简体中文。',
  '- 即使用户用英文或其他语言提问，仍然用简体中文回答。',
  '- 代码、命令、文件路径、标识符、专有名词、日志与错误信息保持原文，不要翻译。',
  '- 技术术语可以保留英文原词，但周围的句子必须是中文。',
  '- 你的内部思考不受此限，可以用最顺手的语言进行——那部分不需要给用户看。',
].join('\n')

/** Mount the section. */
export const inject = ['systemPrompt']

export function apply(ctx) {
  /*
   * The placement is the persona's suffix — after the agent's identity, before
   * the tool instructions. Not the prefix: an identity section that opens with
   * a language rule reads as though language were the agent's purpose. Not later
   * than the tools either, because a rule stated after forty tool schemas is a
   * rule competing with them for attention.
   *
   * `effect` ties the section to this plugin's lifetime, which is what makes a
   * reload remove it rather than leave a second copy.
   */
  ctx.effect(
    () =>
      ctx.systemPrompt.section({
        name: SECTION_NAME,
        order: ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_SUFFIX'),
        text: TEXT,
      }),
    'chinese-output.section()',
  )

  try {
    process.stderr.write('[chinese-output] mounted\n')
  } catch {
    /* Reporting is not worth failing a launch over. */
  }
}
