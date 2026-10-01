/**
 * Host admission policy shim.
 *
 * The host's `session.prompt` preflight refuses image messages for models
 * whose declared input modalities exclude `image`, and there is no plugin
 * seam on that gate. Other `resolveModelInfo` callers (MCP image results,
 * `read_image` route assertions, subagent image delivery) share the same
 * field. This wrapper reports `inputModalities: undefined` (unknown) for the
 * configured text-only models while an attachment store is present, so those
 * gates admit the image message; the `llm/stream` pathifier then rewrites
 * image blocks at dispatch, and the vision-skill flow reads the durable
 * files. Vision-capable models and unknown-capability routes pass through
 * untouched.
 *
 * On dsh 0.1.5, `session.selectModel` already allows a text-only selection
 * while durable or pending images remain; the shim is still required so a
 * *new* pasted image is not refused at `session.prompt`.
 * @module dsh-image-pathify/admission
 */
import type { Context } from "@deepseek-ai/cordis";
/** One provider/model pair treated as a text-only route. */
export interface PathifyModel {
    provider: string;
    model: string;
}
/** Admission relaxation policy. */
export interface AdmissionConfig {
    /**
     * Restrict relaxation to these exact provider/model pairs; empty means
     * every model whose declared modalities exclude `image`.
     */
    models: readonly PathifyModel[];
}
/**
 * Install the shim on the real `LlmRuntime` instance behind `ctx.llm`.
 * @param ctx - plugin context carrying the live `llm` service.
 * @param config - relaxation policy.
 * @returns a disposer restoring the original method.
 */
export declare function installAdmissionShim(ctx: Context, config: AdmissionConfig): () => void;
