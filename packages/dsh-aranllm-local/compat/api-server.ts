/**
 * Making this application's models reachable to everything else on the machine.
 *
 * The local model is served by `llama-server`, which already speaks the OpenAI
 * protocol. What that does *not* give is a stable place to point at: the port is
 * chosen when a model loads, and it changes when the model does. A tool
 * configured against it — an editor, a script, another agent — breaks every time
 * the user loads something else.
 *
 * This is a second, fixed address in front of it. It resolves the running model
 * per request and translates, so the client's configuration never changes.
 *
 * ## Localhost by default, and the setting exists for the exception
 *
 * `127.0.0.1` unless the user says otherwise. A server that served models to the
 * whole local network by default would be a surprise of the worst kind: the
 * machine's owner would not know they had published an endpoint, and everything
 * this application can reach would be reachable through it.
 *
 * The bind address is therefore a setting, defaulting to loopback, and the UI
 * words the other option as what it is.
 *
 * ## The key is optional and is not the model's own credential
 *
 * A key set here is checked against what the client sends. It is not forwarded
 * anywhere: the request is answered by the model this application already has
 * loaded, through the connection this application already holds. So the key is
 * an access control for *this* endpoint, and leaving it empty means any local
 * process may use it — which is the ordinary case on a single-user machine and
 * the reason it defaults to empty.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { noteApiRequest } from './api-log'

/** What the endpoint is told to do. */
export type ApiServerOptions = {
  port: number
  /** `127.0.0.1` or `0.0.0.0`. The second is a deliberate act. */
  host: string
  /** Checked against `Authorization: Bearer …` when set. Empty means no check. */
  apiKey: string
  /** Whether a browser page from another origin may call this. */
  cors: boolean
  /**
   * Answers one completion.
   *
   * Injected rather than reached for, so the server does not depend on how the
   * model is loaded or where its port is. The caller holds that knowledge and
   * answers with the streamed text; this file is only the protocol.
   */
  complete: (
    request: { model: string; messages: ApiMessage[]; stream: boolean; [key: string]: unknown },
    signal: AbortSignal
  ) => Promise<ApiCompletion>
  /** What to answer `GET /v1/models` with. */
  models: () => { id: string }[]
}

export type ApiMessage = { role: string; content: unknown }

export type ApiCompletion = {
  /** The reply, already assembled. Streaming is emitted from this. */
  text: string
  /**
   * Which model answered.
   *
   * **Not what the response reports.** A client knows this endpoint by whatever
   * name it was configured with, and the server has exactly one model loaded —
   * so the name in the reply is the client's own, and `api-server` uses
   * `request.model` rather than this field. It is here for the log and for a
   * caller that wants to know what actually ran.
   */
  model: string
  promptTokens?: number
  completionTokens?: number
}

export interface ApiServerHandle {
  readonly url: string
  readonly port: number
  stop(): Promise<void>
}

/**
 * One request's identity, for the log.
 *
 * A short random string rather than a counter: a counter restarts at zero with
 * the application, so two requests in a log a day apart can share an id and the
 * log becomes ambiguous exactly when someone is reading it to find out what
 * happened.
 */
function requestId(): string {
  return Math.random().toString(36).slice(2, 10)
}

/** Read a request body, bounded. */
function body(request: IncomingMessage): Promise<string> {
  return new Promise((settle, fail) => {
    const chunks: Buffer[] = []
    let size = 0
    request.on('data', (chunk: Buffer) => {
      size += chunk.length
      /*
       * Bounded because the body is a prompt and this is a server on a socket:
       * an unbounded read is how one large request becomes an out-of-memory
       * crash for the whole application.
       */
      if (size > 32 * 1024 * 1024) {
        fail(new Error('请求体过大。'))
        request.destroy()
        return
      }
      chunks.push(chunk)
    })
    request.on('end', () => settle(Buffer.concat(chunks).toString('utf8')))
    request.on('error', fail)
  })
}

/** Send a JSON answer with the CORS headers the setting asks for. */
function json(response: ServerResponse, status: number, value: unknown, cors: boolean): void {
  const text = JSON.stringify(value)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    ...(cors
      ? {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'authorization, content-type',
          'access-control-allow-methods': 'GET, POST, OPTIONS'
        }
      : {})
  })
  response.end(text)
}

/**
 * The key a request presents, in either of the two spellings OpenAI clients use.
 *
 * `Authorization: Bearer …` is the documented one. `x-api-key` is what the
 * Anthropic-style clients send and costs nothing to accept — a client that
 * cannot authenticate against a server that would have accepted it is a support
 * question with no good answer.
 */
function presentedKey(request: IncomingMessage): string {
  const header = request.headers.authorization ?? ''
  if (header.startsWith('Bearer ')) return header.slice(7).trim()
  const alternative = request.headers['x-api-key']
  return typeof alternative === 'string' ? alternative.trim() : ''
}

/** Start the endpoint. Resolves once it is accepting connections. */
export async function startApiServer(options: ApiServerOptions): Promise<ApiServerHandle> {
  const server: Server = createServer((request, response) => {
    /*
     * `handle` has already logged this — it catches everything in order to. The
     * answer is written here rather than there so the log is complete before the
     * client is told, which is the order someone reading both would expect.
     */
    void handle(request, response, options).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      if (!response.headersSent) json(response, 500, { error: { message } }, options.cors)
      else response.end()
    })
  })

  await new Promise<void>((settle, fail) => {
    server.once('error', fail)
    /*
     * The bind address is the setting, and it is the whole security surface of
     * this file. See the header for why it defaults to loopback.
     */
    server.listen(options.port, options.host, () => {
      server.removeListener('error', fail)
      settle()
    })
  })

  const address = server.address()
  if (address === null || typeof address === 'string') {
    await new Promise<void>((settle) => server.close(() => settle()))
    throw new Error('服务没有报告端口。')
  }

  return {
    url: `http://127.0.0.1:${String(address.port)}/`,
    port: address.port,
    stop: () =>
      new Promise<void>((settle) => {
        server.close(() => settle())
      })
  }
}

/**
 * One request, wrapped in the record of it.
 *
 * The logging is a shell around `route` rather than a call at each exit, because
 * there are nine ways out of that function — a key refusal, four malformed-body
 * answers, a stream, a plain answer, and the catch-all — and a log that has to be
 * remembered at each of them is a log that will be missing the one case someone
 * is trying to diagnose. Here it is impossible to answer without being recorded.
 *
 * `OPTIONS` is the one thing not recorded: it is a browser's preflight, sent
 * before every real request, and it would be two entries for every one the user
 * cares about.
 */
async function handle(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions
): Promise<void> {
  if (request.method === 'OPTIONS') {
    json(response, 204, null, options.cors)
    return
  }

  const started = Date.now()
  const url = new URL(request.url ?? '/', 'http://localhost')
  const path = url.pathname.replace(/\/+$/, '') || '/'
  const seen: { model?: string; messages?: number } = {}

  try {
    await route(request, response, options, seen)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    noteApiRequest({
      method: request.method ?? 'GET',
      path,
      ...seen,
      outcome: 'failed',
      status: response.headersSent ? 200 : 500,
      ms: Date.now() - started,
      error: message
    })
    throw cause
  }

  /*
   * Read back from what was actually sent rather than from what was intended.
   * The status is the outcome — a handler that means to answer 200 and writes
   * 500 has failed — and this is the only place both are visible.
   */
  const status = response.statusCode
  noteApiRequest({
    method: request.method ?? 'GET',
    path,
    ...seen,
    outcome: outcomeOf(status),
    status,
    ms: Date.now() - started
  })
}

/**
 * Which of the four kinds of ending this status is.
 *
 * The split exists for the panel: a server refusing bad keys is *working*, and
 * colouring that the same as a model that failed to load would make a correct
 * setup look broken to anyone who once tried it with the wrong key.
 */
function outcomeOf(status: number): 'ok' | 'unauthorized' | 'rejected' | 'failed' {
  if (status === 401) return 'unauthorized'
  if (status >= 400 && status < 500) return 'rejected'
  if (status >= 500) return 'failed'
  return 'ok'
}

/** One request, from the routing table down to the answer. */
async function route(
  request: IncomingMessage,
  response: ServerResponse,
  options: ApiServerOptions,
  seen: { model?: string; messages?: number }
): Promise<void> {
  const id = requestId()
  const url = new URL(request.url ?? '/', 'http://localhost')
  const path = url.pathname.replace(/\/+$/, '') || '/'

  /*
   * The key is checked before anything else, including the route — otherwise an
   * unauthenticated caller learns which paths exist, and a 404 tells them their
   * guess about this server was right.
   */
  if (options.apiKey.length > 0 && presentedKey(request) !== options.apiKey) {
    json(response, 401, { error: { message: 'API key 无效。', type: 'invalid_request_error' } }, options.cors)
    return
  }

  if (request.method === 'GET' && path === '/v1/models') {
    json(
      response,
      200,
      {
        object: 'list',
        data: options.models().map((model) => ({
          id: model.id,
          object: 'model',
          created: Math.floor(Date.now() / 1000),
          owned_by: 'aranllm'
        }))
      },
      options.cors
    )
    return
  }

  if (request.method === 'POST' && (path === '/v1/chat/completions' || path === '/v1/completions')) {
    const raw = await body(request)
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      json(response, 400, { error: { message: '请求体不是合法 JSON。' } }, options.cors)
      return
    }

    const messages = Array.isArray(parsed.messages) ? (parsed.messages as ApiMessage[]) : []
    /*
     * `/v1/completions` is the older, prompt-shaped endpoint. Accepted because
     * a client configured for it should not need reconfiguring, and its one
     * difference is that the prompt arrives as a string.
     */
    if (messages.length === 0 && typeof parsed.prompt === 'string') {
      messages.push({ role: 'user', content: parsed.prompt })
    }
    if (messages.length === 0) {
      json(response, 400, { error: { message: '请求里没有 messages 或 prompt。' } }, options.cors)
      return
    }

    const stream = parsed.stream === true
    const model = typeof parsed.model === 'string' && parsed.model.length > 0 ? parsed.model : 'default'
    seen.model = model
    seen.messages = messages.length

    /*
     * The client hanging up must stop the work.
     *
     * Without this the model keeps generating into a socket nobody is reading —
     * on a local model that is the GPU busy for the rest of a reply the user
     * has already navigated away from.
     */
    const controller = new AbortController()
    request.on('close', () => controller.abort())

    const answer = await options.complete({ ...parsed, model, messages, stream }, controller.signal)

    if (!stream) {
      json(
        response,
        200,
        {
          id: `chatcmpl-${id}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          /*
           * The name the client used. See `ApiCompletion.model` for why — the
           * loaded model's own file name would make a client think it had
           * reached a different endpoint.
           */
          model: model,
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: answer.text },
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: answer.promptTokens ?? 0,
            completion_tokens: answer.completionTokens ?? 0,
            total_tokens: (answer.promptTokens ?? 0) + (answer.completionTokens ?? 0)
          }
        },
        options.cors
      )
      return
    }

    /*
     * Server-sent events, in the shape the protocol specifies.
     *
     * The whole reply is sent as one chunk rather than token by token: the
     * caller has already assembled it, and splitting it here would be a second
     * streaming implementation whose chunk boundaries do not match the model's.
     * A client that reads the protocol sees a valid stream either way.
     */
    response.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      ...(options.cors
        ? {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': 'authorization, content-type',
            'access-control-allow-methods': 'GET, POST, OPTIONS'
          }
        : {})
    })
    const envelope = {
      id: `chatcmpl-${id}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model
    }
    response.write(
      `data: ${JSON.stringify({ ...envelope, choices: [{ index: 0, delta: { role: 'assistant', content: answer.text }, finish_reason: null }] })}\n\n`
    )
    response.write(
      `data: ${JSON.stringify({ ...envelope, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\n`
    )
    /* The sentinel every client looks for; a stream without it never ends. */
    response.write('data: [DONE]\n\n')
    response.end()
    return
  }

  json(response, 404, { error: { message: `没有这个路由：${path}` } }, options.cors)
}
