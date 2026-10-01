/**
 * Holds a heavy tool back until the conversation asks for it.
 *
 * ## The problem this solves
 *
 * Two measured symptoms, one cause.
 *
 * A greeting — 「你好」 — produced a plan and a tool call. A one-line question
 * spent 94.3K tokens of context. Both come from the same arrangement: every
 * registered tool is declared to the model on every request, and a local model
 * with a small window and a strong "plan your work" instruction will reach for
 * whatever it can see. It has nothing to do with the greeting; the greeting is
 * simply what arrived when the tools were on display.
 *
 * ## Why the gating is at two layers
 *
 * **Declarations cost tokens; calls cost turns.** Suppressing a schema keeps a
 * tool out of the prompt, which is where the 94K goes. Suppressing the call
 * keeps a tool from running once the model has named it anyway — which it will,
 * because the instruction to plan comes from the system prompt rather than from
 * the user, and the model is following it.
 *
 * The two are not alternatives. A gate that only hides declarations leaves a
 * model that has memorised `todo_write` free to call it; a gate that only
 * refuses calls pays the tokens for definitions nothing may use.
 *
 * ## What decides
 *
 * The last user message. Not the system prompt — that is the same on every
 * request and cannot distinguish a greeting from a task — and not the assistant
 * history, which is the model's own output and would let a stray tool call
 * justify the next one.
 *
 * ## Why `next()` is called on every path
 *
 * `agent/pre-step` and `tools/pre-execute` are *waterfalls*: the loop awaits a
 * decision object and reads its `kind`. A listener that returns nothing makes
 * that read throw — measured, as `Cannot read properties of undefined (reading
 * 'kind')` and a failed turn. So every branch here returns `next()` or a
 * decision, and there is no path that falls off the end.
 */
export const name = 'dsh-tool-gate'

const LINE = '[tool-gate]'

/** One line to stderr, never throwing. */
function say(text) {
  try {
    process.stderr.write(`${LINE} ${text}\n`)
  } catch {
    /* A gate that cannot report must still not break the loop it guards. */
  }
}

/**
 * The tool groups, each with the words that ask for it.
 *
 * ## Why words and not an intent classifier
 *
 * A classifier is a second model call before every request, on a machine whose
 * whole complaint is that the first one is slow. A word list is inspectable,
 * costs nothing, and is wrong in a direction that is safe: a miss leaves a tool
 * hidden, the model says it cannot do the thing, and the user asks again with
 * the word in it. The opposite arrangement — a gate that guesses and opens — is
 * how the current behaviour came about.
 *
 * ## What is deliberately absent
 *
 * `ask_user` and `present` are not listed. They are how the agent talks to the
 * user, and hiding them to save tokens would trade a sentence for a paragraph
 * of tool-call machinery. The same goes for anything with no group: a tool this
 * file has never heard of stays available, so a new plugin is not silently
 * muzzled by a list written before it existed.
 */
const GROUPS = [
  {
    id: 'files',
    tools: ['read', 'write', 'edit', 'glob', 'grep', 'read_image'],
    words: ['文件', '文档', '目录', '文件夹', '路径', '代码', '读一下', '写下', '改一下', '找一下', '搜索', '打开', '看一下', '源码', '.js', '.ts', '.py', '.md', '.json', '.css', '.html', 'file', 'folder', 'directory', 'path'],
  },
  {
    id: 'shell',
    tools: ['pwsh'],
    words: ['命令', '执行', '运行', '终端', 'shell', '命令行', '编译', '构建', 'npm', 'pnpm', 'node', 'git', '跑一下', '启动服务', '装一下', '安装'],
  },
  {
    id: 'plan',
    tools: ['todo_write', 'create_goal', 'update_goal', 'get_goal', 'exit_plan_mode'],
    words: ['计划', '任务', '步骤', '规划', '拆解', '待办', '分几步', '安排', '目标', 'roadmap'],
  },
  {
    id: 'web',
    tools: ['web_search', 'web_fetch'],
    words: ['http', 'www', '网址', '链接', '网页', '搜索一下', '查一下', '联网', '最新', '新闻', '资料'],
  },
  {
    id: 'delegate',
    tools: ['subagent_fork', 'send_message', 'list_agents', 'interrupt_agent', 'workflow', 'job_list', 'job_output', 'job_kill'],
    words: ['子任务', '并行', '子agent', '子 agent', '委派', '分工', 'workflow', '多agent', '派遣', '后台'],
  },
  {
    id: 'office',
    tools: ['pptd_render', 'pptd_import', 'pptd_write_file', 'pptd_add_asset', 'pptd_check', 'pptd_read_file', 'pptd_list_files', 'ppt_template_create_project', 'ppt_get_template_pages', 'ppt_get_template_reference', 'ppt_list_templates'],
    words: ['ppt', 'PPT', '幻灯片', '演示文稿', '汇报', '演讲稿'],
  },
  {
    id: 'image',
    tools: ['image_generate'],
    words: ['图片', '画一', '生成图', '配图', '插画', 'logo', '图标', '海报'],
  },
  {
    id: 'context',
    tools: ['search_context', 'compress', 'decompress'],
    words: ['之前', '上面', '历史', '前面说', '回顾', '总结一下', '梳理'],
  },
  {
    id: 'skill',
    tools: ['skill'],
    words: ['skill', '技能', '插件'],
  },
]

/** A tool this file knows about, mapped to the group that owns it. */
const OWNER = new Map()
for (const group of GROUPS) for (const tool of group.tools) OWNER.set(tool, group.id)

/**
 * Whether the text looks like a request rather than a greeting.
 *
 * ## Why greetings are special-cased rather than classified
 *
 * The reported failure is precise: 「你好」 opened a plan. A greeting is the one
 * class of message that is short, has no object, and unambiguously asks for
 * conversation — three properties a word list can test directly. Treating it
 * explicitly also makes the rule legible: a user who reads this file can see
 * exactly which messages are exempt.
 *
 * A message is a greeting when it is short **and** carries none of the words a
 * request would. Both halves matter: 「你好」 and 「继续」 are greetings-length but
 * 「继续」 may well resume a task, so it is not exempt; 「你好，帮我改个文件」 is
 * longer than a greeting and names work, so it is a request.
 */
export function isSmallTalk(text) {
  const trimmed = text.trim()
  if (trimmed.length === 0) return true
  /* Long enough to be a request even if it opens with a greeting. */
  if (trimmed.length > 24) return false
  /* Any word from any group makes it a request. */
  for (const group of GROUPS) {
    for (const word of group.words) {
      if (trimmed.includes(word)) return false
    }
  }
  /*
   * Anything that reads as a question or an instruction, short or not.
   *
   * The word lists cover the vocabulary of a request as it is written in this
   * application; these cover the shapes it takes. 「帮我看看」 and 「这个怎么
   * 回事」 are requests with no noun in them, and a length-and-words test alone
   * calls both greetings — which is how a task ends up with every tool closed
   * and a model that keeps re-answering.
   */
  if (/[?？]/.test(trimmed)) return false
  for (const marker of ['帮', '请', '怎么', '如何', '为什么', '能不能', '可以', '给我', '让我', '你是', '介绍', '解释', '说下', '写下', '算', '查']) {
    if (trimmed.includes(marker)) return false
  }
  return true
}

/**
 * The groups a request opens when it names no tool vocabulary at all.
 *
 * ## Why a fallback is needed rather than an exact list
 *
 * A task in this application is almost never expressible in the vocabulary of
 * one group. 「看一下当前目录有哪些文件」 is about files, but the tool that
 * answers it is `pwsh` — `ls` — and a gate that opened only the file group made
 * the model reach for a tool it had been denied, retry with another, and rewrite
 * its answer on every refusal. What the user saw was their text appearing and
 * then vanishing.
 *
 * The replacements are not a licence to use everything: the plan, delegate,
 * office, image and skill groups stay closed until named, and those are the ones
 * that produce the reported behaviour — a plan written for a greeting. What
 * opens is the pair needed to look at the workspace and run something, which is
 * what a request that reached this branch is asking for by definition, since it
 * was not recognised as a greeting.
 */
const FALLBACK_GROUPS = ['files', 'shell']

/** A value short enough for a log line. */
function briefish(value) {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 60)
  return String(value)
}

/** The plain text of one message block list. */
function textOf(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map((block) => (typeof block === 'string' ? block : (block?.text ?? ''))).join('\n')
}

/**
 * The words the conversation has offered so far.
 *
 * ## Why the tail rather than the whole history
 *
 * A gate that reads the entire transcript can never close again: the first
 * request for a file leaves 「文件」 in the history forever, and every later
 * message inherits it. The window is the recent turns — a user who asked about a
 * file ten messages ago and has since only said 「你好」 is having a different
 * conversation now.
 *
 * The system prompt is excluded for the stronger reason: it is identical on
 * every request, so including it would make every gate permanently open.
 */
function recentText(messages, limit = 6) {
  const userMessages = messages.filter((message) => message?.role === 'user')
  const tail = userMessages.slice(-limit)
  return tail.map((message) => textOf(message.content)).join('\n')
}

/** Which groups the recent conversation asks for. */
export function demandedGroups(text) {
  const wanted = new Set()
  for (const group of GROUPS) {
    for (const word of group.words) {
      if (text.includes(word)) {
        wanted.add(group.id)
        break
      }
    }
  }
  return wanted
}

/** Mount the gate. */
export const inject = ['tools']

/**
 * The groups opened so far, per agent.
 *
 * ## Why this is sticky within a turn and why a turn resets it
 *
 * A step is one model call. A task takes several, and the words that asked for a
 * tool are in the first of them — a later step is the model working, not the
 * user asking, and re-deriving from the same message would keep the gate open
 * only as long as that message stayed in the window. Remembering what was opened
 * makes the decision once per turn, which is also when the user made it.
 */
const opened = new WeakMap()

export function apply(ctx) {
  say('mounted')

  ctx.on('agent/pre-step', async (payload, next) => {
    try {
      const { agent, messages, turn } = payload ?? {}
      if (!Array.isArray(messages) || messages.length === 0) return await next()

      /*
       * The decision is keyed on the words, not on the step counter.
       *
       * `turn` identifies the turn but does not say whether the *question* has
       * changed, and a step inside one turn can arrive with a different value —
       * measured, a task step re-decided as small talk and closed the tools the
       * previous step had opened, which left the model re-answering and the
       * user watching their text appear and disappear. A fingerprint of the
       * request text is the thing that actually changes when the user asks
       * something new, so that is what re-opens the decision.
       */
      const text = recentText(messages)
      const fingerprint = text.trim().slice(0, 200)
      const already = agent === undefined ? undefined : opened.get(agent)

      if (already === undefined || already.fingerprint !== fingerprint) {
        const smallTalk = isSmallTalk(text)
        /*
         * Named words plus the fallback pair.
         *
         * A request that got past the greeting test is a request for work, and
         * the two groups that work needs first — reading the workspace and
         * running something in it — are opened whether or not the message named
         * them. A message that *does* name a group still only gets that group
         * and the fallback, so 「生成一张图」 does not pull in the office suite.
         */
        const groups = smallTalk ? new Set() : new Set([...demandedGroups(text), ...FALLBACK_GROUPS])
        if (agent !== undefined) opened.set(agent, { fingerprint, groups, smallTalk })

        const denied = GROUPS.filter((g) => !groups.has(g.id)).flatMap((g) => g.tools).length
        const names = [...groups]
        say(
          smallTalk
            ? `pre-step: 闲聊（${briefish(fingerprint.slice(0, 40))}）—— 所有重型工具保持关闭`
            : `pre-step: 开放 ${names.join(', ')}`,
        )

        /*
         * The restriction itself.
         *
         * `restrict` refuses a context-global call, so it is made on the agent's
         * own context when there is one. When there is not — an unscoped call,
         * such as the harness inspecting a model before any session exists —
         * the gate does nothing rather than guessing: denying a tool for every
         * agent at once is not recoverable within the process.
         */
        const tools = agent?.ctx?.tools
        if (tools !== undefined && typeof tools.restrict === 'function') {
          /*
           * Only names the registry actually holds.
           *
           * `restrict` validates its list and throws on an unknown name — and it
           * throws for the *whole* call, so one stale name leaves every tool
           * unrestricted. That is not theoretical: disabling the PPT and image
           * plugins left twelve names in this list that no longer existed, the
           * call failed, and the gate silently became a no-op while still
           * logging that it had decided. The guard below is what keeps a
           * plugin being switched off from switching the gate off with it.
           */
          let known
          try {
            known = new Set([...tools.view?.(agent.ctx)?.knownNames ?? []])
          } catch {
            known = undefined
          }
          const all = GROUPS.filter((group) => !groups.has(group.id)).flatMap((group) => group.tools)
          const deny = known === undefined ? all : all.filter((name) => known.has(name))

          try {
            if (already?.dispose !== undefined) already.dispose()
            const dispose = deny.length > 0 ? tools.restrict({ deny }) : undefined
            const record = opened.get(agent)
            if (record !== undefined) {
              record.dispose = dispose
              record.denied = deny.length
            }
          } catch (error) {
            say(`restrict 失败: ${error?.message ?? error}`)
          }
        }
      }
    } catch (error) {
      say(`pre-step 出错: ${error?.message ?? error}`)
    }
    return await next()
  })

  /*
   * The call gate, for the case the declaration gate cannot cover.
   *
   * A model that has already been told to plan will name `todo_write` even when
   * its schema was withheld — the instruction lives in the system prompt, which
   * this plugin does not own. Refusing the call here is what makes the gate
   * actually hold, and the reason it sends back is what turns a refusal into a
   * correction rather than a dead end.
   */
  ctx.on('tools/pre-execute', async (exec, next) => {
    try {
      const group = OWNER.get(exec?.name)
      if (group === undefined) return await next()

      const agent = exec?.agent
      const record = agent === undefined ? undefined : opened.get(agent)
      /* No decision recorded yet: nothing was asked, so nothing is opened. */
      if (record === undefined) return await next()
      if (record.smallTalk || !record.groups.has(group)) {
        const open = [...record.groups]
        say(`拒绝 ${exec.name}：本轮是${record.smallTalk ? '闲聊' : `「${open.join(',')}」`}`)
        /*
         * The reason is written to end the attempt, not to explain a rule.
         *
         * A refusal that only says "not allowed" leaves the model with a
         * problem and no solution, and what it does with that is try the next
         * tool — each attempt rewrites the answer, which is what the user sees
         * as their text appearing and then vanishing. Naming an open alternative
         * when there is one gives it somewhere to go; when there is none, the
         * instruction is to answer plainly, which is the whole point of the
         * gate.
         */
        const alternative =
          record.smallTalk || open.length === 0
            ? '直接用自然语言回答，这一轮不需要任何工具。'
            : `可以改用这些工具：${open.join(', ')}。`
        return {
          kind: 'deny',
          reason: `${alternative}如果确实需要 ${exec.name}，请先让用户明确说出要做什么——工具不会在没有要求时自动开放。`,
        }
      }
    } catch (error) {
      say(`pre-execute 出错: ${error?.message ?? error}`)
    }
    return await next()
  })

  ctx.on('turn/start', (payload) => {
    const agent = payload?.agent
    if (agent !== undefined) opened.delete(agent)
  })
}
