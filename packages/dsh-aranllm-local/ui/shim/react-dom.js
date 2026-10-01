/*
 * `createPortal`, from the installed react-dom.
 *
 * The only thing in this bundle that reaches for react-dom: the Modal renders
 * its layer into the document body rather than in place, so it is not clipped by
 * whatever box it is opened from.
 */
const real = globalThis.__aranllmUI?.reactDom
if (real === undefined) {
  throw new Error('aranllm-local: the bundle ran before react-dom was installed')
}
export const { createPortal } = real
