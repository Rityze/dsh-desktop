/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    save: string;
    saving: string;
    discard: string;
    saveFailed: string;
    overridden: string;
    reset: string;
    apiKey: string;
    apiKeyHint: string;
    apiKeySet: string;
    apiKeyUnset: string;
    visionModel: string;
    visionModelHint: string;
    disableThinking: string;
    disableThinkingOffHint: string;
    visionBaseUrl: string;
    visionBaseUrlHint: string;
    maxTokens: string;
    maxTokensHint: string;
    relaxAdmission: string;
    relaxAdmissionHint: string;
    models: string;
    modelsHint: string;
    modelsEmpty: string;
    providerPlaceholder: string;
    modelPlaceholder: string;
    add: string;
    remove: string;
    updateHint: string;
    updateCopy: string;
    updateCopied: string;
    updateCopyFail: string;
};
/** The `image-pathify` namespace key union. */
export type ImagePathifyKey = keyof typeof zh;
/** English dictionary, checked complete against the zh key set. */
export declare const en: {
    save: string;
    saving: string;
    discard: string;
    saveFailed: string;
    overridden: string;
    reset: string;
    apiKey: string;
    apiKeyHint: string;
    apiKeySet: string;
    apiKeyUnset: string;
    visionModel: string;
    visionModelHint: string;
    disableThinking: string;
    disableThinkingOffHint: string;
    visionBaseUrl: string;
    visionBaseUrlHint: string;
    maxTokens: string;
    maxTokensHint: string;
    relaxAdmission: string;
    relaxAdmissionHint: string;
    models: string;
    modelsHint: string;
    modelsEmpty: string;
    providerPlaceholder: string;
    modelPlaceholder: string;
    add: string;
    remove: string;
    updateHint: string;
    updateCopy: string;
    updateCopied: string;
    updateCopyFail: string;
};
/** Locale namespace id registered under ctx.locale. */
export declare const NS = "image-pathify";
/**
 * Fill one dictionary template's `{name}`-style placeholders.
 */
export declare function fmt(template: string, params?: Record<string, string>): string;
declare module "@deepseek-ai/dsh-client-ui-slots" {
    interface LocaleNamespaceMap {
        /** Vision plugin-card copy. */
        [NS]: ImagePathifyKey;
    }
}
