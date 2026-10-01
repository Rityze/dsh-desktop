/**
 * OpenAI-compatible vision request: POST `{baseUrl}/chat/completions` with
 * one or more `image_url` parts (a data URL for a local file, or an http(s)
 * URL) and a text prompt. Several images share a single completion so the
 * vision model actually sees every attachment. Ported from
 * claude-vision-skill's `vision.js` without the clipboard fallback — pasted
 * chat images already have a durable disk path.
 * @module dsh-image-pathify/vision
 */
/** Default question when the model omits `prompt`. */
export declare const DEFAULT_VISION_PROMPT = "\u8BF7\u8BE6\u7EC6\u63CF\u8FF0\u8FD9\u5F20\u56FE\u7247\u7684\u5185\u5BB9\u3002";
/** One vision completion. */
export interface VisionRequest {
    /** Bearer token for the compatible-mode endpoint. */
    apiKey: string;
    /** Vision model id (default `deepseek-flash`). */
    model: string;
    /** OpenAI-compatible base URL, with or without a trailing slash. */
    baseUrl: string;
    /** Absolute local path or `http(s)://` URL. */
    image: string;
    /** Question about the image. */
    prompt: string;
    /** Optional abort for the HTTP round-trip and file read. */
    signal?: AbortSignal;
    /**
     * Optional `max_tokens`. `0` or omitted means do not send the field.
     */
    maxTokens?: number;
    /**
     * When true (default), DeepSeek-style endpoints get thinking disabled.
     * Set false to keep the provider default (DeepSeek thinks).
     */
    disableThinking?: boolean;
}
/** Shared fields for a multi-image vision request. */
export type VisionBatchRequest = Omit<VisionRequest, "image"> & {
    /** Absolute local paths or `http(s)://` URLs, sent in one completion. */
    images: readonly string[];
};
/** I/O seams tests replace. */
export interface VisionIo {
    readFile(path: string, signal?: AbortSignal): Promise<Uint8Array>;
    fetch: typeof fetch;
}
/** True when `image` should be sent as a remote URL rather than a local file. */
export declare function isRemoteImageUrl(image: string): boolean;
/**
 * DeepSeek vision models (including `deepseek-flash`) think by default.
 * Thinking tokens count against `max_tokens`; a 1024 cap often leaves
 * `message.content` empty. Captioning does not need a chain of thought, so
 * the request sends `thinking: { type: "disabled" }` — the same wire field
 * dsh-llm-deepseek uses for bounded output. Other providers must not see it.
 */
export declare function shouldDisableThinking(model: string, baseUrl: string): boolean;
/**
 * Ask the vision model to describe every attached image by order number.
 */
export declare function multiImagePrompt(count: number, question: string): string;
/**
 * Prefix the vision reply with the attachment order so the calling model
 * can map 图1 / 图2 back to file paths.
 */
export declare function formatMultiImageResult(images: readonly string[], description: string): string;
/**
 * Call the configured vision model and return its text description.
 * @param request - endpoint, credentials, and image source.
 * @param io - optional file/HTTP seams (tests).
 */
export declare function analyzeImage(request: VisionRequest, io?: VisionIo): Promise<string>;
/**
 * Send every image in one vision completion (multiple `image_url` parts).
 * The returned text includes an order legend mapping 图N to each path.
 */
export declare function analyzeImages(request: VisionBatchRequest, io?: VisionIo): Promise<string>;
