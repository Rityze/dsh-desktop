import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
/** Loader entry id. Also the `plugins.bundle.config` slot key. */
export declare const ENTRY_ID = "dsh-image-pathify";
/** Required services: slots, locale, the entry form, credentials, and the probe. */
export declare const inject: string[];
/**
 * Compose the Vision card on the installed-plugin page, above the row list.
 * The page does not pass a form; this plugin reads `configForms` itself.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
