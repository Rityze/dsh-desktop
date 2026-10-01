/**
 * Host Remote service (`ctx.imagePathify`, wire namespace `imagePathify`).
 * Mounted as a Cordis service; the Gateway resolves methods from the strict
 * Typert manifest rather than `@Remote` decorator state. The `typertRemote`
 * field is still required: `typert gateway` refuses dispatch when the live
 * service has no visible binding, even with a registered manifest.
 * @module dsh-image-pathify/runtime
 */
import { Service, type Context } from "@deepseek-ai/cordis";
import type { ImagePathifyUpdateStatus } from "./contract.ts";
/** Same shape `bindTypertRemote` freezes; kept local so this module does not import `dsh-typert-protocol`. */
export interface ImagePathifyTypertBinding {
    readonly service: object;
    readonly serviceKey: string;
    readonly namespace: string;
}
/** Update-probe Remote. Settings themselves are the Loader entry config. */
export declare class ImagePathifyRuntime extends Service {
    private readonly readUpdate;
    /** Visible binding consumed by the Host Gateway's source-mode discovery. */
    readonly typertRemote: ImagePathifyTypertBinding;
    constructor(ctx: Context, readUpdate: () => Promise<ImagePathifyUpdateStatus>);
    /** Return the cached npm latest-version probe (started at plugin load). */
    getUpdate(): Promise<ImagePathifyUpdateStatus>;
}
