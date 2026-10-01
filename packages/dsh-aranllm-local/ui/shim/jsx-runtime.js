/*
 * The automatic JSX runtime, from the same installed React.
 *
 * Separate from `shim/react.js` because the two are separate modules in React's
 * own package and the compiler emits calls into this one for every element.
 */
const real = globalThis.__aranllmUI?.jsxRuntime
if (real === undefined) {
  throw new Error('aranllm-local: the bundle ran before the JSX runtime was installed')
}
export const { jsx, jsxs, Fragment } = real
