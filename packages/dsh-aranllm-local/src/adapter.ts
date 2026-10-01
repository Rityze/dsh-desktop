/**
 * @module dsh-aranllm-local/adapter
 *
 * `LlmAdapter` implementation for AranLLM's natively loaded local models.
 * The provider route `aranllm-local` is owned by this adapter; every model it
 * advertises comes from `LocalEngine.list()` over the on-disk GGUF roots, so
 * model identity is obtained natively rather than from any third-party API.
 *
 * Requests are dispatched to the llama.cpp server the engine spawned, over
 * loopback HTTP in the OpenAI-compatible shape llama-server exposes. Nothing
 * here reaches the public internet.
 */
import { LlmAdapter, LlmError } from '@deepseek-ai/dsh-llm';
import type { GenerateOptions, StreamChunk } from '@deepseek-ai/dsh-llm';
import type { LocalEngine, LocalModelFile, LoadOptions } from './engine.ts';

/** The single provider route this adapter owns. */
export const PROVIDER = 'aranllm-local';

/** Settings namespace backing the provider profile. */
export const NS = 'aranllm-local';

/** Runtime switch consulted before each request so UI changes take effect live. */
export interface AdapterConfig {
  engine(): LocalEngine;
  /** Model the user confirmed in the chat model switcher. */
  selectedModel(): string | undefined;
  /** Load parameters for that model. */
  loadOptions(): LoadOptions;
}

/** Render one discovered file as a stable, unique model id. */
export function modelIdOf(file: LocalModelFile): string {
  return file.path.replace(/\\/g, '/');
}

/**
 * One OpenAI-compatible streaming attempt against llama-server. The upstream
 * emits SSE `data:` frames; this yields harness `StreamChunk`s for the loop.
 */
async function* dispatch(
  baseURL: string,
  body: unknown,
  signal: AbortSignal | undefined,
): AsyncGenerator<StreamChunk> {
  const res = await fetch(`${baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...(body as object), stream: true }),
    ...(signal === undefined ? {} : { signal }),
  });
  if (!res.ok || res.body === null) {
    throw new LlmError(`aranllm-local: llama-server returned HTTP ${res.status}`, 'UPSTREAM_ERROR');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let index = 0;
  let opened = false;
  let pendingTool: { index: number; id: string; name?: string; args: string } | undefined;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') continue;
      let frame: any;
      try {
        frame = JSON.parse(payload);
      } catch {
        continue;
      }
      const delta = frame?.choices?.[0]?.delta;
      if (delta === undefined) continue;
      if (typeof delta.content === 'string' && delta.content.length > 0) {
        if (!opened) {
          opened = true;
          yield { type: 'block-start', index, blockType: 'text' };
        }
        yield { type: 'text-delta', index, text: delta.content };
      }
      if (typeof delta.reasoning_content === 'string' && delta.reasoning_content.length > 0) {
        yield { type: 'reasoning-delta', index, text: delta.reasoning_content };
      }
      for (const call of delta.tool_calls ?? []) {
        pendingTool ??= { index, id: String(call.id ?? ''), name: call.function?.name, args: '' };
        if (typeof call.id === 'string' && call.id.length > 0) pendingTool.id = call.id;
        if (typeof call.function?.name === 'string') pendingTool.name = call.function.name;
        if (typeof call.function?.arguments === 'string') pendingTool.args += call.function.arguments;
        yield {
          type: 'tool-call-delta',
          index,
          id: pendingTool.id as never,
          ...(call.function?.name === undefined ? {} : { name: call.function.name }),
          argumentsDelta: call.function?.arguments ?? '',
        };
      }
      if (frame?.usage !== undefined) {
        yield {
          type: 'usage',
          usage: {
            inputTokens: frame.usage.prompt_tokens ?? 0,
            outputTokens: frame.usage.completion_tokens ?? 0,
          } as never,
        };
      }
    }
  }
  if (opened) {
    yield { type: 'finish', reason: 'stop' as never };
  } else if (pendingTool !== undefined) {
    yield { type: 'finish', reason: 'tool-calls' as never };
  } else {
    yield { type: 'finish', reason: 'stop' as never };
  }
}

/**
 * Projects harness messages onto the OpenAI chat shape llama-server accepts.
 * File blocks were already flattened to handle text by request assembly, so
 * only text and image-less content reaches the wire here.
 */
function toWireMessages(options: GenerateOptions): unknown[] {
  return options.messages.map((message: any) => {
    const parts = Array.isArray(message.content) ? message.content : [];
    const text = parts
      .filter((block: any) => block?.type === 'text')
      .map((block: any) => String(block.text))
      .join('');
    const toolCalls = parts
      .filter((block: any) => block?.type === 'tool-call')
      .map((block: any) => ({
        id: block.id,
        type: 'function',
        function: { name: block.name, arguments: block.arguments },
      }));
    const toolResults = parts.filter((block: any) => block?.type === 'tool-result');
    if (message.role === 'tool' || toolResults.length > 0) {
      const block = toolResults[0];
      return {
        role: 'tool',
        tool_call_id: block?.toolCallId ?? '',
        content: block === undefined ? text : flatten(block.content),
      };
    }
    return {
      role: message.role,
      content: text,
      ...(toolCalls.length === 0 ? {} : { tool_calls: toolCalls }),
    };
  });
}

function flatten(content: unknown): string {
  if (!Array.isArray(content)) return typeof content === 'string' ? content : '';
  return content
    .filter((block: any) => block?.type === 'text')
    .map((block: any) => String(block.text))
    .join('\n');
}

/**
 * Local-model adapter. Model listing is advisory and reads the disk on demand,
 * so a file the user drops into a search root appears without a restart.
 */
export class LocalAdapter extends LlmAdapter {
  private readonly config: AdapterConfig;

  constructor(config: AdapterConfig) {
    super();
    this.config = config;
  }

  private fileFor(model: string): LocalModelFile | undefined {
    return this.config.engine().list().find((file) => modelIdOf(file) === model);
  }

  override providerInfo(provider: string) {
    return { id: provider, name: 'AranLLM 本地模型' };
  }

  override listModels(provider: string) {
    if (provider !== PROVIDER) {
      return Promise.reject(new LlmError(`aranllm-local does not own "${provider}"`, 'NO_ADAPTER'));
    }
    const models = this.config.engine().list().map((file) => ({
      provider,
      id: modelIdOf(file),
      name: file.name,
      description: `${(file.sizeBytes / 1024 ** 3).toFixed(2)} GB`,
      inputModalities: ['text'] as const,
    }));
    return Promise.resolve(models);
  }

  override resolveModel(provider: string, model: string) {
    const file = this.fileFor(model);
    if (file === undefined) {
      return Promise.reject(new LlmError(`aranllm-local: unknown model "${model}"`, 'UNKNOWN_MODEL'));
    }
    const loaded = this.config.engine().getStatus();
    const contextWindow = loaded.contextLength ?? 4096;
    return Promise.resolve({ provider, id: model, name: file.name, context: { contextWindow } });
  }

  override async *stream(options: GenerateOptions): AsyncGenerator<StreamChunk> {
    const file = this.fileFor(options.model);
    if (file === undefined) {
      throw new LlmError(`aranllm-local: unknown model "${options.model}"`, 'UNKNOWN_MODEL');
    }
    const engine = this.config.engine();
    const status = engine.getStatus();
    // Native path: a model without a running server is loaded in-process here,
    // never proxied through an external API.
    if (status.state !== 'ready' || status.modelPath !== file.path) {
      const loaded = await engine.load(file.path, this.config.loadOptions());
      if (loaded.state !== 'ready' || loaded.baseURL === undefined) {
        throw new LlmError(loaded.error ?? 'aranllm-local: model load failed', 'MODEL_LOAD_FAILED');
      }
    }
    const baseURL = engine.getStatus().baseURL;
    if (baseURL === undefined) {
      throw new LlmError('aranllm-local: engine has no base URL', 'MODEL_LOAD_FAILED');
    }
    const tools = options.tools?.map((tool) => ({
      type: 'function',
      function: { name: tool.name, description: tool.description, parameters: tool.parameters },
    }));
    const body = {
      model: file.name,
      messages: toWireMessages(options),
      ...(options.temperature === undefined ? {} : { temperature: options.temperature }),
      ...(options.maxTokens === undefined ? {} : { max_tokens: options.maxTokens }),
      ...(options.stop === undefined ? {} : { stop: [...options.stop] }),
      ...(tools === undefined || tools.length === 0 ? {} : { tools }),
    };
    yield* dispatch(baseURL, body, options.signal);
  }
}


