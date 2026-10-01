/**
 * Host Typert manifest for the `imagePathify` update probe. Settings are the
 * Loader entry, edited through the plugins page, not this Remote.
 * @module dsh-image-pathify/typert
 */
import type { TypertContribution } from "@deepseek-ai/dsh-typert-registry/types";
declare module "@deepseek-ai/dsh-typert-protocol" {
    interface TypertRegistryContract {
        register(contribution: TypertContribution): () => void | Promise<void>;
    }
}
/** Host contribution claiming the `imagePathify` settings endpoints. */
export declare const TYPERT_MANIFEST: TypertContribution;
