/**
 * Vision API key lives in the credentials store (`$DSH_HOME/.credentials.yaml`),
 * addressed by `apiKeyEnv`. Settings never carry the literal.
 * @module dsh-image-pathify/credentials
 */
import type { Context } from "@deepseek-ai/cordis";
/**
 * Brand a settings `apiKeyEnv` value as a credential reference. Invalid names
 * fall back to the plugin default so a typo cannot crash plugin load.
 */
export declare function credentialRefName(value: string): string;
/**
 * Resolve the vision bearer token for one call. Credentials first, then the
 * process environment.
 */
export declare function resolveVisionApiKey(ctx: Context, apiKeyEnv: string): Promise<string>;
