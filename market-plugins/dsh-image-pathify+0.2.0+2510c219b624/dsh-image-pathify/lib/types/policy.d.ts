/**
 * Steer text-only models away from `read_image` and toward `analyze_image`,
 * and keep vision-capable models off `analyze_image` entirely.
 *
 * 1. A system-prompt section names the pathify prefix and the replacement tool.
 * 2. `llm/stream` drops `analyze_image` (vision) or `read_image` (text-only)
 *    using the provider/model actually being dispatched. Vision also strips
 *    the `analyze_image` paragraph from `options.system` (older one-shot
 *    callers) and from `system`-role message text (0.1.5 agent-loop puts the
 *    prompt in history, not `GenerateOptions.system`). Assemble-time
 *    filtering only runs after a request header exists, because the first
 *    step's `agent.options` can lag the UI-selected model.
 * 3. `tools/pre-execute` denies `read_image` on text-only routes (reason names
 *    `analyze_image`) and denies `analyze_image` on vision routes.
 * @module dsh-image-pathify/policy
 */
import type { Context } from "@deepseek-ai/cordis";
import type { PreToolDecision, ToolExecution } from "@deepseek-ai/dsh-tools";
/** Prompt-section order in the 100–199 per-tool guidance band. */
export declare const VISION_PROMPT_ORDER = 118;
/** System-prompt section that teaches `analyze_image` to text-only models. */
export declare const VISION_PROMPT_NAME = "tool:analyze-image";
/** Model-facing tool name registered by this plugin. */
export declare const ANALYZE_IMAGE_TOOL = "analyze_image";
/** Host tool that loads a local image into a vision model's context. */
export declare const READ_IMAGE_TOOL = "read_image";
/** Structural face of the calling agent used to resolve the routed model. */
export interface RouteSource {
    session?: {
        requestHeader?: () => {
            config?: {
                provider?: string;
                model?: string;
            };
        } | undefined;
    };
    options?: {
        provider?: string;
        model?: string;
    };
}
/** Shape of one prompt assembly this policy may filter. */
export interface PromptAssemblyLike {
    sections: {
        name: string;
    }[];
    tools: {
        name: string;
    }[];
}
/** Per-assembly context that may carry the live agent and turn signal. */
export interface AssembleRoute {
    agent?: RouteSource;
    signal?: AbortSignal;
}
/**
 * Build the model-facing vision rule. The pathify prefix is a fixed marker,
 * not a user setting.
 */
export declare function visionPromptText(): string;
/**
 * Deny reason shown to the model when it calls `read_image` on a text-only route.
 */
export declare function readImageDenyReason(filePath: string): string;
/**
 * Deny reason shown to the model when it calls `analyze_image` on a vision route.
 */
export declare function analyzeImageDenyReason(): string;
/**
 * Drop this plugin's prompt section and tool schema from one assembly.
 */
export declare function stripAnalyzeImage<T extends PromptAssemblyLike>(assembly: T): T;
/**
 * Hide the tool the current route must not see. Vision keeps `read_image`;
 * text-only keeps `analyze_image`.
 */
export declare function filterAssemblyForRoute<T extends PromptAssemblyLike>(assembly: T, vision: boolean): T;
/** One content block we may inspect when stripping the vision prompt. */
export interface DispatchContentBlock {
    type: string;
    text?: string;
}
/** One adapter-facing message whose top-level text we may trim. */
export interface DispatchMessage {
    role?: string;
    content?: readonly DispatchContentBlock[];
}
/** One adapter-facing request whose tool catalog and system text we may trim. */
export interface DispatchRequest {
    tools?: readonly {
        name: string;
    }[];
    system?: string;
    messages?: readonly DispatchMessage[];
}
/**
 * Drop the off-route image tool from a live `llm/stream` request. Vision also
 * loses the text-only `analyze_image` prompt paragraph when it is present in
 * `system` or in `system`-role message text.
 */
export declare function filterDispatchForRoute<T extends DispatchRequest>(request: T, vision: boolean): T;
/**
 * Provider/model from the logged request header only. The first step of a
 * session has no header yet; `agent.options` can still hold a previous UI
 * selection, so it is not used here.
 */
export declare function requestHeaderRoute(agent: RouteSource | undefined): {
    provider: string;
    model: string;
} | undefined;
/**
 * `system-prompt/assemble` listener: hide the off-route image tool once the
 * session has a request header. Before that, leave both tools in place so
 * `llm/stream` can filter against the model actually being dispatched.
 */
export declare function assembleVisionPolicy<T extends PromptAssemblyLike>(ctx: Context, _assembly: T, context: AssembleRoute, next: () => Promise<T>): Promise<T>;
/**
 * Resolve the provider/model pair the calling agent is routed to.
 */
export declare function routedModel(agent: RouteSource | undefined): {
    provider: string;
    model: string;
} | undefined;
/**
 * True when the routed model explicitly declares image input. Unknown
 * capability is treated as non-vision (deny `read_image`).
 */
export declare function routeAcceptsImage(ctx: Context, agent: RouteSource | undefined, signal?: AbortSignal): Promise<boolean>;
/**
 * `tools/pre-execute` listener: deny `read_image` on non-vision routes.
 */
export declare function readImagePreExecute(ctx: Context, exec: ToolExecution, next: () => Promise<PreToolDecision>): Promise<PreToolDecision>;
/**
 * `tools/pre-execute` listener: deny `analyze_image` on vision routes.
 */
export declare function analyzeImagePreExecute(ctx: Context, exec: ToolExecution, next: () => Promise<PreToolDecision>): Promise<PreToolDecision>;
/**
 * Combined `tools/pre-execute` gate for both image tools.
 */
export declare function visionToolsPreExecute(ctx: Context, exec: ToolExecution, next: () => Promise<PreToolDecision>): Promise<PreToolDecision>;
/**
 * Register the prompt section and the assemble filter. Tool execution gates
 * are registered from `apply` on the tools fiber, which may load without
 * `systemPrompt`.
 */
export declare function installVisionPolicy(ctx: Context): void;
