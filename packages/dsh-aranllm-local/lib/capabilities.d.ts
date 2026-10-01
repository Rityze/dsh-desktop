/** Capability metadata derived from a GGUF's own tokenizer metadata. */

export interface ReasoningEffort {
  readonly id: string
  readonly name: string
  readonly description: string
}

export declare const REASONING_EFFORTS: readonly ReasoningEffort[]
export declare const DEFAULT_REASONING_EFFORT: string

export declare function inputModalitiesOf(capabilities?: {
  vision?: boolean
}): readonly string[]

/** Undefined when the model has no reasoning branch, which hides the selector. */
export declare function reasoningInfoOf(
  capabilities?: { reasoning?: boolean },
  language?: 'zh' | 'en'
): { efforts: readonly ReasoningEffort[]; defaultEffort: string } | undefined

export declare function reasoningRequestFields(
  effort?: string | null
): Record<string, unknown> | undefined

export declare function isKnownEffort(effort: unknown): boolean
