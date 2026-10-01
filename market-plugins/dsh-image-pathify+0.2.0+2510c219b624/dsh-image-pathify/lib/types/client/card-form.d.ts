/**
 * Staged form behind the Vision plugin card. Edits stay local until save.
 * The API key is a write-only control: it never rides a settings response
 * and is stored through the credentials domain, not the settings document.
 * @module dsh-image-pathify/client/card-form
 */
import type { ImagePathifyPublicSettings, ImagePathifySettingsUpdate, ImagePathifyUpdateStatus, PathifyModelEntry } from "../contract.ts";
import { type SnapshotStore } from "./store.ts";
/** One text control as the card renders it. */
export interface CardFieldState {
    text: string;
    overridden: boolean;
}
/** Credentials-domain face the card uses for the referenced key. */
export interface VisionCredentialFace {
    describe(ref: string): Promise<{
        configured: boolean;
        writable: boolean;
    }>;
    set(ref: string, value: string): Promise<void>;
}
/** Idle credentials face for tests that do not exercise the key control. */
export declare const idleCredentials: VisionCredentialFace;
/** Form state every plugin card shares, plus Vision-specific controls. */
export interface ImagePathifyCardState {
    available: boolean;
    writable: boolean;
    dirty: boolean;
    invalid: boolean;
    saving: boolean;
    failed: boolean;
    apiKeyText: string;
    apiKeySet: boolean;
    apiKeyWritable: boolean;
    visionModel: CardFieldState;
    visionBaseUrl: CardFieldState;
    disableThinking: {
        checked: boolean;
        overridden: boolean;
    };
    maxTokens: CardFieldState;
    relaxAdmission: {
        checked: boolean;
        overridden: boolean;
    };
    models: {
        entries: readonly PathifyModelEntry[];
        overridden: boolean;
    };
    /** Installed plugin version from the host probe; empty until it lands. */
    installedVersion: string;
    update: {
        installedVersion: string;
        latestVersion: string;
        command: string;
    } | undefined;
}
/** Actions the card's slot entry injects. */
export interface ImagePathifyCardActions {
    edit: (field: string, text: string) => void;
    resetField: (field: string) => void;
    save: () => void;
    discard: () => void;
    setDisableThinking: (value: boolean) => void;
    setRelaxAdmission: (value: boolean) => void;
    addModel: (provider: string, model: string) => void;
    removeModel: (provider: string, model: string) => void;
}
/**
 * Parse a max-tokens field. Empty uses `fallback`. `0` is valid and means
 * omit `max_tokens`. Non-integers and values outside 0…32768 are invalid.
 */
export declare function parseMaxTokens(text: string, fallback: number): number | undefined;
/** Stages Vision settings over the plugin-owned Remote and writes them on save. */
export declare class ImagePathifyCardController {
    private readonly write;
    private readonly credentials;
    private stored;
    private available;
    private saving;
    private failed;
    private apiKeyDraft;
    private visionModelDraft;
    private visionBaseUrlDraft;
    private disableThinkingDraft;
    private maxTokensDraft;
    private relaxDraft;
    private modelsDraft;
    private credential;
    private installedVersion;
    private update;
    private readonly store;
    constructor(write: (update: ImagePathifySettingsUpdate) => Promise<ImagePathifyPublicSettings>, credentials?: VisionCredentialFace);
    /** Snapshot the card renderer reads through `useImagePathifyCard`. */
    get snapshot(): SnapshotStore<ImagePathifyCardState>;
    /** Seed or refresh from the Host. Staged edits survive a reload. */
    receive(settings: ImagePathifyPublicSettings): void;
    /** Hide the card while the Remote is down. */
    markUnavailable(): void;
    /**
     * Apply a host npm-probe result. The installed version is always kept for
     * the title; the upgrade banner is only kept when an update is available.
     */
    receiveUpdate(status: ImagePathifyUpdateStatus): void;
    /**
     * Re-read whether the Host holds a key for the reference this card watches.
     * @param ref - when set, ignore updates for a different reference.
     */
    refreshCredential(ref?: string): void;
    /** Ask the credentials domain about the reference the section currently names. */
    syncCredential(): Promise<void>;
    /** Build the face the card's slot registration injects. */
    inject(): ImagePathifyCardActions & {
        hooks: {
            imagePathifyCard: SnapshotStore<ImagePathifyCardState>;
        };
    };
    private projection;
    private isDirty;
    private effectiveModel;
    private effectiveUrl;
    private tokenDraftDirty;
    private edit;
    private resetField;
    private setDisableThinking;
    private setRelaxAdmission;
    private addModel;
    private removeModel;
    private discard;
    private planSettings;
    save(): Promise<void>;
    private publish;
}
