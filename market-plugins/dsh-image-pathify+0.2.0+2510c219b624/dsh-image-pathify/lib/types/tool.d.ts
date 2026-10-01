/**
 * Model-facing `analyze_image` tool: a local path or URL in, a text
 * description out, via the configured OpenAI-compatible vision endpoint.
 * Several images in one call are sent together in a single vision request.
 * Registered as a raw JSON-schema tool (no `defineTool` runtime import) so
 * this module loads in tests without `@deepseek-ai/dsh-tools` installed.
 * @module dsh-image-pathify/tool
 */
import type { Context } from "@deepseek-ai/cordis";
import type { Config } from "./config.ts";
/**
 * Collect unique non-empty image sources from `image` and/or `images`.
 * `image` may be a string or an array (models sometimes dump every path
 * into the singular field).
 */
export declare function collectImageSources(args: {
    image?: unknown;
    images?: unknown;
}): string[];
/**
 * Register `analyze_image`. `current` is read per call so a settings save
 * is picked up without remounting the tool.
 */
export declare function registerAnalyzeImageTool(ctx: Context, current: () => Config): void;
