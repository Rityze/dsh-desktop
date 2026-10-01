/**
 * Plugin Config schema: pathify tunables plus the vision endpoint. Invalid
 * config fails at load. The same schema is the settings-namespace section.
 * @module dsh-image-pathify/config
 */
import z from "@deepseek-ai/schemastery";
/** Tunables; invalid config fails at load. The interface names the schema's output shape. */
export interface Config {
    /**
     * Restrict host-admission relaxation to these exact provider/model pairs.
     * Empty (default) relaxes every model whose declared input modalities
     * exclude `image` while an attachment store is present.
     */
    models: readonly {
        provider: string;
        model: string;
    }[];
    /**
     * Install the `ctx.llm.resolveModelInfo` shim that makes host image
     * admission preflights admit text-only models. Disable when the harness
     * itself already relaxes those gates.
     */
    relaxAdmission: boolean;
    /**
     * Credential reference resolved for each vision call. The literal is stored
     * by `ctx.credentials` (`$DSH_HOME/.credentials.yaml`), not in this section.
     */
    apiKeyEnv: string;
    /** Vision model id (default `deepseek-flash`). */
    visionModel: string;
    /** OpenAI-compatible vision base URL. */
    visionBaseUrl: string;
    /**
     * When true, DeepSeek-style endpoints get `thinking: { type: "disabled" }`.
     * Captioning does not need a chain of thought; uncheck to let the model think.
     */
    disableThinking: boolean;
    /**
     * `max_tokens` for a vision completion (one or many images). `0` omits
     * the field so the provider uses its own default cap.
     */
    maxTokens: number;
}
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    /**
     * Restrict host-admission relaxation to these exact provider/model pairs.
     * Empty (default) relaxes every model whose declared input modalities
     * exclude `image` while an attachment store is present.
     */
    models: z<({
        provider?: string | null | undefined;
        model?: string | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict)[], Schemastery.ObjectT<NoInfer<{
        provider: z<string, string, "plain">;
        model: z<string, string, "plain">;
    }>>[], "defined">;
    /**
     * Install the `ctx.llm.resolveModelInfo` shim that makes host image
     * admission preflights admit text-only models. Disable when the harness
     * itself already relaxes those gates.
     */
    relaxAdmission: z<boolean, boolean, "defined">;
    /** Credential reference resolved for each vision call. */
    apiKeyEnv: z<string, string, "defined">;
    /** Vision model id (default `deepseek-flash`). */
    visionModel: z<string, string, "defined">;
    /** OpenAI-compatible vision base URL. */
    visionBaseUrl: z<string, string, "defined">;
    /**
     * When true, DeepSeek-style endpoints get `thinking: { type: "disabled" }`.
     * Captioning does not need a chain of thought; uncheck to let the model think.
     */
    disableThinking: z<boolean, boolean, "defined">;
    /**
     * `max_tokens` for a vision completion (one or many images). `0` omits
     * the field so the provider uses its own default cap.
     */
    maxTokens: z<number, number, "defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    /**
     * Restrict host-admission relaxation to these exact provider/model pairs.
     * Empty (default) relaxes every model whose declared input modalities
     * exclude `image` while an attachment store is present.
     */
    models: z<({
        provider?: string | null | undefined;
        model?: string | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict)[], Schemastery.ObjectT<NoInfer<{
        provider: z<string, string, "plain">;
        model: z<string, string, "plain">;
    }>>[], "defined">;
    /**
     * Install the `ctx.llm.resolveModelInfo` shim that makes host image
     * admission preflights admit text-only models. Disable when the harness
     * itself already relaxes those gates.
     */
    relaxAdmission: z<boolean, boolean, "defined">;
    /** Credential reference resolved for each vision call. */
    apiKeyEnv: z<string, string, "defined">;
    /** Vision model id (default `deepseek-flash`). */
    visionModel: z<string, string, "defined">;
    /** OpenAI-compatible vision base URL. */
    visionBaseUrl: z<string, string, "defined">;
    /**
     * When true, DeepSeek-style endpoints get `thinking: { type: "disabled" }`.
     * Captioning does not need a chain of thought; uncheck to let the model think.
     */
    disableThinking: z<boolean, boolean, "defined">;
    /**
     * `max_tokens` for a vision completion (one or many images). `0` omits
     * the field so the provider uses its own default cap.
     */
    maxTokens: z<number, number, "defined">;
}>>, "plain">;
