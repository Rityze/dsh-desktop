/**
 * Wire contract for the `imagePathify` Remote: public settings (no API key
 * literal) and the patch the settings page sends. Shared by the host Typert
 * manifest and the client `$mount` contribution.
 * @module dsh-image-pathify/contract
 */
import type { InvocationDescriptor, TypertSchema } from "@deepseek-ai/dsh-typert-protocol";
/** One provider/model pair the admission shim may relax. */
export interface PathifyModelEntry {
    readonly provider: string;
    readonly model: string;
}
/**
 * Settings the browser is allowed to see. The key literal never rides this
 * object; the client reads configured/writable from the credentials domain.
 */
export interface ImagePathifyPublicSettings {
    readonly apiKeyEnv: string;
    readonly visionModel: string;
    readonly visionBaseUrl: string;
    readonly disableThinking: boolean;
    readonly maxTokens: number;
    readonly models: readonly PathifyModelEntry[];
    readonly relaxAdmission: boolean;
}
/**
 * Result of a silent npm latest-version probe. `updateAvailable` is the only
 * signal the card uses; a failed probe still returns this shape with
 * `updateAvailable: false`.
 */
export interface ImagePathifyUpdateStatus {
    readonly installedVersion: string;
    readonly latestVersion: string;
    readonly updateAvailable: boolean;
    readonly command: string;
}
/**
 * One field patch from the settings page. The API key is not a field here —
 * the card writes it through `credentials.set`.
 */
export interface ImagePathifySettingsUpdate {
    readonly apiKeyEnv?: string;
    readonly visionModel?: string;
    readonly visionBaseUrl?: string;
    readonly disableThinking?: boolean;
    readonly maxTokens?: number;
    readonly models?: readonly PathifyModelEntry[];
    readonly relaxAdmission?: boolean;
}
/** Schema defaults as the public wire shape (no secret). */
export declare function defaultPublicSettings(): ImagePathifyPublicSettings;
/** Strict codec for the public settings object. */
export declare const publicSettingsSchema: TypertSchema<ImagePathifyPublicSettings>;
/** Strict codec for the update-probe result. */
export declare const updateStatusSchema: TypertSchema<ImagePathifyUpdateStatus>;
/** Host invocation descriptors shared with the client `$mount` contribution. */
export declare const IMAGE_PATHIFY_INVOCATIONS: readonly InvocationDescriptor[];
