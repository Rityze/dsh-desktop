/**
 * Build the copied components into the one file the loader can take.
 *
 * ## What this produces, and why it is not a module
 *
 * The host's client-module system hands a plugin a `factory` and calls it
 * synchronously. That factory is not a module context: it gets a `require` for
 * the host's own packages and nothing else, so a bundle that says
 * `import … from 'react'` cannot be loaded — there is no resolver inside the
 * factory, and an import would be evaluated before the factory was even called.
 *
 * So React, the JSX runtime and react-dom are aliased to the three files in
 * `shim/`, which read them off a global the plugin installs first. The output is
 * one classic script that runs top to bottom and touches no resolver.
 *
 *     globalThis.__aranllmUI = { react, jsxRuntime, reactDom }
 *     // … this bundle runs and assigns …
 *     globalThis.__aranllmUI.LocalModels = LocalModels
 *
 * The components themselves are untouched. React is the one thing they use
 * without naming, and that is the one thing this redirects.
 *
 * ## Why the stylesheets come out as text
 *
 * The host serves one file per plugin, so a stylesheet has to travel inside it.
 * esbuild's `text` loader turns each `.css` import into a string constant, and
 * the footer writes them into the document — guarded by a data attribute,
 * because an HMR reload runs the plugin twice and two copies of a stylesheet are
 * two of every rule.
 */
import { build } from 'esbuild'

await build({
  entryPoints: ['index.tsx'],
  bundle: true,
  format: 'iife',
  globalName: '__aranllmUIPending',
  platform: 'browser',
  target: ['chrome120'],
  jsx: 'automatic',
  alias: {
    react: './shim/react.js',
    'react/jsx-runtime': './shim/jsx-runtime.js',
    'react-dom': './shim/react-dom.js',
  },
  loader: { '.css': 'text' },
  outfile: 'bundle.js',
  footer: {
    js: `
/* Hand the finished components to the plugin, on the same global it read from. */
/* Same scope as the bundle own var, which esbuild emits as a local. */
const __aranllmDone = __aranllmUIPending
globalThis.__aranllmUI = Object.assign(globalThis.__aranllmUI ?? {}, __aranllmDone)

/*
 * The stylesheets, written into the document.
 *
 * Guarded by a data attribute, because the host runs a plugin again on an HMR
 * reload and a second copy of a stylesheet is a second copy of every rule —
 * which is not a visual difference until two rules disagree, and then it is a
 * difference nobody can explain.
 */
for (const [id, css] of Object.entries(__aranllmDone.stylesheets ?? {})) {
  if (typeof document === "undefined") continue
  if (typeof css !== "string" || css.length === 0) continue
  if (document.querySelector("style[data-aranllm=" + JSON.stringify(id) + "]") !== null) continue
  const tag = document.createElement("style")
  tag.dataset.aranllm = id
  tag.textContent = css
  document.head.append(tag)
}
`,
  },
  logLevel: 'warning',
})

console.log('bundle.js 写好')
