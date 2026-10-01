/**
 * Client-side Typert Remote contribution for the imagePathify host service.
 * @module dsh-image-pathify/client/remote
 */
import type { RemoteResult, TypertRemoteContribution } from "@deepseek-ai/dsh-typert-protocol";
import type { ImagePathifyUpdateStatus } from "../contract.ts";
/** The imagePathify Remote namespace's client contribution. */
export declare const IMAGE_PATHIFY_REMOTE: TypertRemoteContribution;
declare module "@deepseek-ai/dsh-typert-protocol" {
    /** The `imagePathify` namespace face mounted under `ctx.remote.imagePathify`. */
    interface TypertRemoteNamespace$696d61676550617468696679 {
        getUpdate: () => Promise<RemoteResult<ImagePathifyUpdateStatus>>;
    }
    interface TypertRemoteMap {
        "imagePathify/getUpdate": () => Promise<RemoteResult<ImagePathifyUpdateStatus>>;
    }
    interface TypertRemoteNamespaceMap {
        imagePathify: TypertRemoteNamespace$696d61676550617468696679;
    }
}
