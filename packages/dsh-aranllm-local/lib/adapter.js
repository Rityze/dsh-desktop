import { LlmAdapter } from '@deepseek-ai/dsh-llm'

import { inputModalitiesOf, reasoningInfoOf, reasoningRequestFields, isKnownEffort } from './capabilities.js'

/**
 * The ceiling one answer gets when the model's record does not name one.
 *
 * Sized against a measured failure rather than picked: a deliberation at the
 * low effort level runs roughly 800-1000 tokens, so this leaves room for the
 * thinking, a long answer and a tool-call round trip. It is also the value the
 * parameter panel's own field defaults to, and the two have to agree — a model
 * loaded from the panel would otherwise be sized differently from one loaded
 * from the chat picker.
 */
const DEFAULT_MAX_TOKENS = 8192

/**
 * Adapter over one managed llama-server process.
 *
 * The route set is dynamic: a route exists while its model is loaded, and
 * loading another model replaces it. Registration is driven by the server
 * manager, so this class never owns process state — it only translates the
 * harness vocabulary into llama-server's OpenAI-compatible wire format.
 */
export class LlamaServerAdapter extends LlmAdapter {
  /**
   * @param manager - the load manager, asked for the live server of a route.
   * @param routeName - provider route this instance serves.
   */
  constructor(manager, routeName) {
    super()
    this.manager = manager
    this.routeName = routeName
    /** In-flight loads, one per model id; see `#ensureLoaded`. */
    this.#loading = new Map()
  }

  /** In-flight loads, keyed by model id. */
  #loading

  providerInfo(provider) {
    const loaded = this.manager.loaded(provider)
    return {
      id: provider,
      name: loaded ? `Local · ${loaded.modelName}` : 'Local model',
    }
  }

  /**
   * Models offered on this route: every model found on disk, with the loaded
   * one marked. Listing the catalog (not just the loaded process) is what lets
   * the chat model picker switch models without a separate settings visit.
   */
  async listModels(provider) {
    const loaded = this.manager.loaded(provider)
    // Wake the index first: a fresh launch has never scanned, so reading the
    // snapshot alone would offer an empty list until something else loaded a
    // model. ready() scans the configured root, which is what makes the picker
    // show local models the very first time it opens.
    const entries = (await this.manager.ready()) ?? this.manager.catalogSnapshot ?? []
    const offered = entries.map(entry => ({
      provider,
      id: entry.id,
      name: entry.name,
      description: describeEntry(entry, loaded?.modelId === entry.id),
      inputModalities: inputModalitiesOf(entry.capabilities),
    }))
    if (loaded && !entries.some(entry => entry.id === loaded.modelId)) {
      offered.unshift({
        provider,
        id: loaded.modelId,
        name: loaded.modelName,
        description: loaded.description ?? '',
        inputModalities: inputModalitiesOf(loaded.capabilities),
      })
    }
    return offered
  }

  /**
   * Describe a model. **Does not load it.**
   *
   * ## What this used to do, and what it cost
   *
   * It loaded the model whenever the loaded one was not the one being asked
   * about, so that the chat window could switch models without a settings
   * detour. That intent is right and the placement was wrong: this method is
   * called by `resolveModelInfo` — the harness asking what a model *is*, so it
   * can print a name and a context window — and the session controller calls it
   * once per model that appears in a conversation's history. On a machine with
   * seven local models that was seven loads at startup, all sharing one route
   * name, and the manager replaces the previous one on every load. The result
   * was a progress bar that filled part way and vanished, no process left
   * running, and nothing in any log saying why: the seventh load cancelled the
   * sixth, and so on back to the first.
   *
   * The harness's own contract agrees with the fix. `resolveModelInfo` is
   * documented as "catalog membership remains advisory and does not control
   * request routing", and every field a caller can use is in the scan: the
   * entry carries the context length, the modalities and the template's
   * thinking branch, read from the GGUF header without starting anything.
   *
   * ## Where loading happens instead
   *
   * In `stream`, on the request that needs it, for exactly one model. That is
   * the moment a process is actually required, and it is the only moment the
   * user is waiting for one.
   */
  async resolveModel(provider, model) {
    const loaded = this.manager.loaded(provider)
    const onDisk = this.manager.find(model)

    /*
     * A running model answers for itself: it is the one whose template was
     * parsed at launch, so its capability reading is the more accurate of the
     * two. Anything else is described from the scan.
     */
    if (loaded && loaded.modelId === model) {
      return {
        provider,
        id: model,
        name: loaded.modelName,
        description: loaded.description,
        inputModalities: inputModalitiesOf(loaded.capabilities),
        context: loaded.contextLength ? { contextWindow: loaded.contextLength } : undefined,
        /*
         * The answer's ceiling, defaulted here rather than only in the schema.
         *
         * A model loaded before the field gained a default has no value on its
         * record, and `undefined` means the harness applies its own — which is
         * how a turn spent twelve minutes thinking and stopped at the cap with
         * no answer. The schema's default covers a fresh load; this covers the
         * record that was already written.
         */
        defaultMaxTokens: loaded.defaultMaxTokens ?? DEFAULT_MAX_TOKENS,
        // Absent when the template carries no thinking branch, which is what
        // hides the effort selector instead of offering one that does nothing.
        reasoning: reasoningInfoOf(loaded.capabilities, this.manager.language),
        systemPromptUpdate: 'in-history',
      }
    }

    if (!onDisk) {
      throw Object.assign(new Error(`No model "${model}" on route ${provider}`), {
        code: 'UNKNOWN_MODEL',
      })
    }

    return {
      provider,
      id: model,
      name: onDisk.name,
      description: describeEntry(onDisk, false),
      inputModalities: inputModalitiesOf(onDisk.capabilities),
      ...(onDisk.contextLength ? { context: { contextWindow: onDisk.contextLength } } : {}),
      reasoning: reasoningInfoOf(onDisk.capabilities, this.manager.language),
      systemPromptUpdate: 'in-history',
    }
  }

  /**
   * Make sure *this* model is the one running, before a request for it.
   *
   * The load moved here from `resolveModel`, and it is called from `stream`
   * only. One model, once, when a request actually needs a process — which is
   * also why there is no risk of the replacement cancelling something the user
   * is watching.
   */
  async #ensureLoaded(provider, model) {
    const loaded = this.manager.loaded(provider)
    if (loaded && loaded.modelId === model) return loaded

    /*
     * One load per model, however many requests arrive at once.
     *
     * ## The race this closes
     *
     * Two requests for the same model — a retry after a refusal, a second
     * session, a client that reconnects — each found nothing loaded and each
     * called `manager.load`. The manager replaces rather than accumulates, and
     * its port check is a check followed by a bind, so both passed the check
     * and both processes bound the same port. Measured: two `llama-server.exe`
     * children of one harness, identical argument lists, and a chat that hung on
     * the first tool call because the socket it reached was whichever process
     * the OS happened to hand the connection to.
     *
     * Holding the in-flight promise means the second caller waits for the first
     * instead of starting a replacement. It is cleared in `finally` so a failed
     * load does not poison the next attempt.
     */
    const pending = this.#loading.get(model)
    if (pending !== undefined) return await pending

    const entry = this.manager.find(model)
    if (!entry) {
      throw Object.assign(new Error(`No model "${model}" on route ${provider}`), {
        code: 'UNKNOWN_MODEL',
      })
    }

    const start = (async () => {
      await this.manager.load({ model: entry, options: this.manager.defaultLoadOptions?.() ?? {} })
      const started = this.manager.loaded(provider)
      if (!started) {
        throw Object.assign(new Error(`Local model "${model}" failed to start.`), {
          code: 'NO_ADAPTER',
        })
      }
      return started
    })()

    this.#loading.set(model, start)
    try {
      return await start
    } finally {
      this.#loading.delete(model)
    }
  }

  async *stream(options) {
    /*
     * Start the model if it is not the one running. This is the only load on a
     * request path, and the only one that should ever happen implicitly — see
     * `resolveModel` for the loop that lived here instead.
     */
    const loaded = await this.#ensureLoaded(options.provider, options.model)
    const body = {
      model: loaded.modelId,
      messages: toWireMessages(options),
      stream: true,
      stream_options: { include_usage: true },
    }
    if (options.temperature !== undefined) body.temperature = options.temperature
    if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
    if (options.tools?.length) body.tools = options.tools.map(toWireTool)
    if (options.stop?.length) body.stop = options.stop

    // The chosen thinking level, translated into the fields llama.cpp reads.
    // An unrecognized id is dropped rather than forwarded: it arrives from a
    // renderer, and both fields below are interpolated into the chat template.
    if (isKnownEffort(options.reasoningEffort)) {
      Object.assign(body, reasoningRequestFields(options.reasoningEffort))
    }

    const response = await fetch(`${loaded.server.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(loaded.apiKey ? { authorization: `Bearer ${loaded.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
      signal: options.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw Object.assign(
        new Error(`llama-server rejected the request (HTTP ${response.status})${detail ? `: ${detail.slice(0, 500)}` : ''}`),
        { code: response.status === 401 || response.status === 403 ? 'AUTH' : 'PROVIDER_ERROR', status: response.status },
      )
    }
    if (!response.body) throw Object.assign(new Error('llama-server returned an empty response body'), { code: 'PROVIDER_ERROR' })

    yield* translateStream(response.body, loaded.modelId)
  }
}

/**
 * Project the harness request onto the OpenAI chat-completions shape.
 *
 * Files never reach a provider: the harness already replaced each durable file
 * block with handle text before dispatch, so only text and images are handled
 * here. A text-only model receives an explicit placeholder for an image rather
 * than a malformed content part.
 */
function toWireMessages(options) {
  const messages = []
  if (options.system) messages.push({ role: 'system', content: options.system })
  for (const message of options.messages) {
    if (message.role === 'system') {
      const text = textOf(message.content)
      if (text) messages.push({ role: 'system', content: text })
      continue
    }
    const toolResults = message.content.filter(block => block.type === 'tool-result')
    if (toolResults.length) {
      for (const block of toolResults) {
        messages.push({
          role: 'tool',
          tool_call_id: block.toolCallId,
          content: sanitizeToolText(
            textOf(block.content) || (block.isError ? 'Tool call failed.' : 'Tool call completed.'),
          ),
        })
      }
      const extra = textOf(message.content.filter(block => block.type !== 'tool-result'))
      if (extra) messages.push({ role: 'user', content: extra })
      continue
    }
    const parts = message.content.map(toWirePart).filter(Boolean)
    if (!parts.length) continue
    messages.push({
      role: message.role,
      content: parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts,
      ...(message.role === 'assistant' ? assistantExtras(message.content) : {}),
    })
  }
  return messages
}

function toWirePart(block) {
  if (block.type === 'text') return { type: 'text', text: block.text }
  if (block.type === 'reasoning') return { type: 'text', text: block.text }
  if (block.type === 'image') return { type: 'text', text: '[An image was attached. This model reads text only.]' }
  if (block.type === 'file') return { type: 'text', text: '[A file was attached; its contents were saved to the workspace.]' }
  return null
}

function assistantExtras(content) {
  const toolCalls = content.filter(block => block.type === 'tool-call')
  if (!toolCalls.length) return {}
  return {
    tool_calls: toolCalls.map(block => ({
      id: block.id,
      type: 'function',
      function: { name: block.name, arguments: safeArguments(block.arguments) },
    })),
  }
}

/**
 * A tool call's arguments, guaranteed to be a JSON object literal.
 *
 * ## Why this is not just a pass-through
 *
 * The field is a *string containing JSON*, and llama-server parses it with a
 * strict reader before it ever looks at the outer request. A model that has just
 * read a web page will sometimes copy a fragment of it into its next call — a
 * `<meta charset="UTF-8">` inside a quoted URL is enough — and what it writes is
 * no longer valid JSON. Measured:
 *
 *     llama-server rejected the request (HTTP 500):
 *     Failed to parse tool call arguments as JSON:
 *     [json.exception.parse_error.101] invalid string: missing closing quote
 *
 * A 500 is not a recoverable turn here: the whole conversation fails and the
 * transcript keeps nothing. Sending `{}` instead costs one tool call that
 * arrives without its parameters, which the model sees as an error result and
 * corrects on the next step — a worse answer, not a dead session.
 *
 * ## What is accepted
 *
 * Anything that parses as a JSON object is passed through with its control
 * characters removed, which is the same treatment results get and for the same
 * reason. Anything else is dropped, including a bare `[...]` or a quoted
 * string: the schema says `arguments` is an object, and a shape the server will
 * reject is worth replacing rather than forwarding.
 *
 * @param {unknown} raw - what the harness recorded for this call.
 * @returns {string} a JSON object literal.
 */
function safeArguments(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return '{}'
  const cleaned = sanitizeToolText(raw)
  try {
    const parsed = JSON.parse(cleaned)
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return JSON.stringify(parsed)
    }
  } catch {
    /* Not JSON. Fall through to the placeholder below. */
  }
  /*
   * Re-serialised rather than echoed back, so a call that could not be read
   * still travels as a well-formed object and the model gets a result it can
   * act on rather than a transport error it cannot.
   */
  return '{}'
}

function textOf(content) {
  if (!Array.isArray(content)) return ''
  return content
    .filter(block => block.type === 'text' || block.type === 'reasoning')
    .map(block => block.text)
    .join('\n')
}

/** How much of one tool result is forwarded before it is cut. */
const TOOL_RESULT_LIMIT = 24_000

/**
 * Make a tool result safe to put in a chat-completions body.
 *
 * ## The failure this prevents
 *
 * llama-server parses the request with a strict JSON reader, and a tool result
 * is the one field in the body this application does not author — it is
 * whatever the tool produced. A `web_fetch` returns a web page, and a web page
 * contains control characters, lone surrogates and megabytes of markup. Sending
 * one produced:
 *
 *     llama-server rejected the request (HTTP 500):
 *     Failed to parse tool call arguments as JSON:
 *     [json.exception.parse_error.101] ... invalid string: missing closing quote
 *
 * and the turn died with nothing the user could act on. The error names the
 * *arguments* because that is where the parser was when it gave up, but the
 * malformed bytes came from the result being echoed back.
 *
 * ## What is removed, and why only that
 *
 * Control characters other than tab and newline, and the lone surrogate halves
 * that make a string un-encodable as UTF-8. Both are invisible in a terminal
 * and both are fatal to a strict reader. Everything else is preserved — the
 * angle brackets, the quotes, the backslashes — because this is a *wire* body
 * and `JSON.stringify` escapes them correctly; stripping them would corrupt the
 * content the model is supposed to read.
 *
 * ## Why a length limit
 *
 * A fetched page can be several hundred kilobytes of markup, and every one of
 * those tokens is paid for on every subsequent request in the conversation. The
 * cut is marked rather than silent: a model that sees a truncated result can ask
 * for a narrower one, and a model that sees an unmarked one assumes it has the
 * whole thing.
 *
 * @param {string} text - the tool's output.
 * @returns {string} the same text, minus what breaks the encoder.
 */
function sanitizeToolText(text) {
  if (typeof text !== 'string') return ''
  /*
   * The control-character class is built from code points rather than written
   * as a literal.
   *
   * It matches C0 controls except tab and newline — \x00 through \x08, \x0B,
   * \x0C, \x0E through \x1F — and written literally it contains characters no
   * editor, diff or review tool renders. That is not a hypothetical: the literal
   * form was mangled on the way into this file and left raw bytes in it. Naming
   * the code points says the same thing in a form that survives being copied.
   */
  const code = (n) => String.fromCharCode(n)
  const controls = new RegExp(
    `[${code(0)}-${code(8)}${code(11)}${code(12)}${code(14)}-${code(31)}]`,
    'g',
  )
  const cleaned = text
    .replace(controls, '')
    /* Lone surrogate halves: legal in a JS string, fatal to a JSON encoder. */
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
  if (cleaned.length <= TOOL_RESULT_LIMIT) return cleaned
  return `${cleaned.slice(0, TOOL_RESULT_LIMIT)}\n\n[结果过长已截断，共 ${cleaned.length} 字符。如果需要更多内容，请换一个更精确的查询。]`
}

function toWireTool(tool) {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters ?? { type: 'object', properties: {} },
    },
  }
}

/**
 * Translate an OpenAI-compatible SSE body into harness chunks.
 *
 * llama-server streams a tool call as a sequence of fragments keyed by index,
 * and the harness protocol expects block-start / delta / block-end per block,
 * so fragments accumulate until the block is complete.
 */
async function* translateStream(body, modelId) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let nextIndex = 0
  let textIndex
  let reasoningIndex
  let textStarted = false
  let reasoningStarted = false
  let usage
  let finishReason = 'stop'
  const openToolCalls = new Map()
  /*
   * The blocks' text, accumulated so `block-end` can carry it.
   *
   * ## Why the closing chunk needs the whole thing
   *
   * The assembler treats `block-end` as authoritative: it stores the chunk's
   * `block` over whatever the deltas built (`partial.block = chunk.block`). A
   * closing chunk with `text: ''` therefore **erases** the block — and an empty
   * block is filtered out of the rendered message entirely.
   *
   * This was sent with an empty text and the result was reported as "the text
   * appears for a moment and then vanishes once it finishes": every delta
   * streamed in and was drawn, then the close wiped it. Tool calls were never
   * affected because their closing block already carried the assembled
   * arguments.
   */
  let reasoningText = ''
  let textText = ''

  const startText = () => {
    if (textIndex === undefined) {
      textIndex = nextIndex
      nextIndex += 1
    }
    return textIndex
  }
  const startReasoning = () => {
    if (reasoningIndex === undefined) {
      reasoningIndex = nextIndex
      nextIndex += 1
    }
    return reasoningIndex
  }

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let boundary
      while ((boundary = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, boundary).trim()
        buffer = buffer.slice(boundary + 1)
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload) continue
        if (payload === '[DONE]') continue

        let event
        try {
          event = JSON.parse(payload)
        } catch {
          continue
        }
        if (event.usage) usage = event.usage
        const choice = event.choices?.[0]
        if (!choice) continue
        if (choice.finish_reason) finishReason = choice.finish_reason
        const delta = choice.delta
        if (!delta) continue

        const thinking = delta.reasoning_content ?? delta.reasoning
        if (typeof thinking === 'string' && thinking) {
          const index = startReasoning()
          if (!reasoningStarted) {
            yield { type: 'block-start', index, blockType: 'reasoning' }
            reasoningStarted = true
          }
          reasoningText += thinking
          yield { type: 'reasoning-delta', index, text: thinking }
        }

        if (typeof delta.content === 'string' && delta.content) {
          const index = startText()
          if (!textStarted) {
            yield { type: 'block-start', index, blockType: 'text' }
            textStarted = true
          }
          textText += delta.content
          yield { type: 'text-delta', index, text: delta.content }
        }

        if (Array.isArray(delta.tool_calls)) {
          for (const fragment of delta.tool_calls) {
            const key = fragment.index ?? 0
            let call = openToolCalls.get(key)
            if (!call) {
              call = { index: nextIndex, id: fragment.id ?? `call_${key}`, name: fragment.function?.name ?? '', arguments: '' }
              nextIndex += 1
              openToolCalls.set(key, call)
              yield { type: 'block-start', index: call.index, blockType: 'tool-call' }
            }
            if (fragment.id) call.id = fragment.id
            if (fragment.function?.name) call.name = fragment.function.name
            const argumentsDelta = fragment.function?.arguments ?? ''
            call.arguments += argumentsDelta
            yield { type: 'tool-call-delta', index: call.index, id: call.id, name: call.name || undefined, argumentsDelta }
          }
        }
      }
    }
  } finally {
    reader.releaseLock?.()
  }

  /*
   * Close blocks in their emission order so the assembler sees a consistent
   * index sequence, and carry the assembled text in each closing block — see
   * the note on `reasoningText` for why an empty one erases what it closes.
   */
  if (reasoningStarted) {
    yield { type: 'block-end', index: reasoningIndex, block: { type: 'reasoning', text: reasoningText } }
  }
  if (textStarted) {
    yield { type: 'block-end', index: textIndex, block: { type: 'text', text: textText } }
  }
  for (const call of [...openToolCalls.values()].sort((a, b) => a.index - b.index)) {
    yield {
      type: 'block-end',
      index: call.index,
      block: { type: 'tool-call', id: call.id, name: call.name, arguments: call.arguments || '{}' },
    }
  }

  if (usage) {
    yield {
      type: 'usage',
      usage: {
        inputTokens: usage.prompt_tokens ?? 0,
        outputTokens: usage.completion_tokens ?? 0,
        ...(usage.total_tokens !== undefined ? { totalTokens: usage.total_tokens } : {}),
      },
    }
  }

  yield {
    type: 'finish',
    reason: toolCallsFinish(finishReason, openToolCalls.size),
    replayState: { response: { model: modelId, stopReason: finishReason }, blocks: [...openToolCalls.values()].map(call => ({ id: call.id })) },
  }
}

function toolCallsFinish(finishReason, toolCallCount) {
  if (finishReason === 'tool_calls' || toolCallCount > 0) return { kind: 'tool-calls' }
  if (finishReason === 'length') return { kind: 'max-tokens' }
  return { kind: 'stop' }
}

/** One-line summary shown under a model in the picker. */
function describeEntry(entry, isLoaded) {
  const parts = []
  if (isLoaded) parts.push('loaded')
  if (entry.architecture) parts.push(entry.architecture)
  if (entry.parameterCount) parts.push(entry.parameterCount)
  if (entry.bytes) parts.push(formatBytes(entry.bytes))
  return parts.join(' \u00b7 ')
}

/** Compact byte size for picker subtitles. */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1 }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}
