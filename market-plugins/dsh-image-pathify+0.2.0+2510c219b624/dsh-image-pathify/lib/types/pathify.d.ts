/**
 * Dispatch-time image pathification: rewrite `image` content blocks to
 * `Saved attachments: <absolute path>` text blocks so a model without the
 * image input modality still receives the images it needs. A vision tool
 * (`analyze_image`) then reads those files and turns them into image
 * descriptions.
 *
 * The durable session message is NEVER touched: the Web UI keeps rendering
 * thumbnails from the real image block; only the adapter-facing request is
 * rewritten, immediately before dispatch. Top-level image blocks are
 * rewritten, including images on `role: "tool"` messages.
 * @module dsh-image-pathify/pathify
 */
import type { AttachmentStore, ImageAttachmentRef } from "@deepseek-ai/dsh-attachment";
import type { GenerateOptions, RequestMessage } from "@deepseek-ai/dsh-llm";
/** True when any message in the request carries an image block. */
export declare function messagesHaveImage(messages: readonly RequestMessage[]): boolean;
/**
 * Resolve the durable absolute on-disk path of one stored image.
 *
 * @param attachments - live attachment store service.
 * @param ref - durable reference from the session log.
 * @param signal - optional abort for the fallback byte read.
 * @returns the absolute path of a readable image file.
 */
export declare function resolveImagePath(attachments: AttachmentStore, ref: ImageAttachmentRef, signal?: AbortSignal): Promise<string>;
/**
 * Rewrite the adapter-facing request: every top-level image block becomes a
 * text block carrying the durable file path (one text block per image).
 *
 * @param options - the request to rewrite; messages are replaced only when
 * the request actually carries images.
 * @param attachments - live attachment store service.
 * @param signal - optional abort for path resolution.
 * @returns the original options when no rewrite applies, else a copy whose
 * messages keep their identity, sources, and non-image blocks.
 */
export declare function pathifyImages(options: GenerateOptions, attachments: AttachmentStore, signal?: AbortSignal): Promise<GenerateOptions>;
