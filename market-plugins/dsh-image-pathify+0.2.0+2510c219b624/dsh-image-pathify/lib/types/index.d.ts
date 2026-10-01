/**
 * dsh-image-pathify — let models without image input (deepseek-v4-flash, …)
 * receive image messages, and analyze those images through a built-in
 * OpenAI-compatible vision tool (`analyze_image`).
 *
 * Two-layer split, installed entirely from this plugin:
 *
 * 1. The session keeps real image blocks (the Web UI keeps rendering
 *    thumbnails); nothing is rewritten at admission or at save time.
 * 2. Immediately before adapter dispatch, the `llm/stream` waterfall
 *    rewrites image blocks to `Saved attachments: <absolute path>` text
 *    blocks when the target model lacks the image input modality.
 *    `analyze_image` then reads those files through the configured vision
 *    API. Immediately
 *    before dispatch, `llm/stream` also drops `read_image` for text-only
 *    models and `analyze_image` for vision models, using the provider/model
 *    on that request (not the possibly-stale agent options). On a vision
 *    route it also strips the `analyze_image` paragraph from `options.system`
 *    and from `system`-role message text (0.1.5 agent-loop leaves
 *    `GenerateOptions.system` unset). `read_image` is denied on non-vision
 *    routes so a leftover call is steered to `analyze_image`. Vision-capable
 *    models keep original image blocks; `analyze_image` is omitted from their
 *    request and denied if they still call it.
 *
 * Because the host's image admission preflight (`session.prompt`, and any
 * other caller of `resolveModelInfo` that refuses non-image routes) has no
 * plugin seam, this plugin also installs a small, configurable shim on
 * `ctx.llm.resolveModelInfo` so those gates admit images for the configured
 * text-only models (see {@link admission}).
 *
 * `llm` is required. `tools`, `systemPrompt`, and `typert` are joined with
 * nested `ctx.inject` so pathify still loads in a composition that has only
 * the LLM seam (and so unit tests that stub only `llm` keep working). A web
 * or desktop profile provides all of them. Config is the Loader entry: every
 * field is volatile, so a plugins-page save is visible on the next call.
 * Desktop `desktopProfiles` is probed with `ctx.get`, never required
 * `inject`; ordinary DSH falls back to Loader `ctx.baseUrl`.
 * @module dsh-image-pathify
 */
import type { Context } from "@deepseek-ai/cordis";
export { Config } from "./config.ts";
export { readConfig } from "./live.ts";
export { DEFAULT_API_KEY_ENV, DEFAULT_MAX_TOKENS, DEFAULT_PREFIX, DEFAULT_VISION_BASE_URL, DEFAULT_VISION_MODEL, } from "./defaults.ts";
export { DEFAULT_VISION_PROMPT, analyzeImage, analyzeImages, formatMultiImageResult, isRemoteImageUrl, multiImagePrompt, } from "./vision.ts";
export { collectImageSources } from "./tool.ts";
export { ANALYZE_IMAGE_TOOL, READ_IMAGE_TOOL, VISION_PROMPT_NAME, VISION_PROMPT_ORDER, analyzeImageDenyReason, analyzeImagePreExecute, assembleVisionPolicy, filterAssemblyForRoute, filterDispatchForRoute, readImageDenyReason, readImagePreExecute, requestHeaderRoute, routeAcceptsImage, routedModel, stripAnalyzeImage, visionPromptText, visionToolsPreExecute, } from "./policy.ts";
/** Cordis plugin name used by Loader diagnostics. */
export declare const name = "dsh-image-pathify";
/** `llm` is required for pathify. Other seams activate through nested inject. */
export declare const inject: string[];
/**
 * Install the plugin. Registrations are effects: the `llm/stream` listener
 * unregisters with the plugin's fiber, and the admission shim (when
 * installed) restores the original `resolveModelInfo` on disposal.
 */
export declare function apply(ctx: Context, config?: object): void;
