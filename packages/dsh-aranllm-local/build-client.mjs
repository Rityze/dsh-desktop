/**
 * Assemble `client.js` from the built bundle and the registration around it.
 *
 * ## Why the bundle is inlined rather than fetched
 *
 * The host serves one file per client plugin and loads it as a script. There is
 * no second request for a plugin to make, and no resolver inside the factory it
 * runs — so a plugin's stylesheets and components have to be in the file the
 * loader fetches, which means the bundle is pasted in rather than imported.
 *
 * ## What the wrapper does
 *
 * Three things, in this order, because the order is what makes it work:
 *
 *   1. React, the JSX runtime and react-dom go on a global. The bundle reads
 *      them from there — it cannot import them, for the reason above — and the
 *      copies are the host's own, so the page keeps one React.
 *   2. The bundle runs. It assigns the components and the stylesheet strings
 *      onto the same global.
 *   3. The plugin registers its settings section, rendering the component the
 *      bundle produced.
 *
 * Step 2 is between 1 and 3 rather than after 3, because a registration whose
 * component is still undefined renders nothing and reports nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const bundle = readFileSync('ui/bundle.js', 'utf8')

const header = `/**
 * Local models, as the desktop application draws them.
 *
 * ## What this file is
 *
 * The smallest possible wrapper around a copy of the original UI. The page —
 * its layout, its stylesheets, its thirty-four-field parameter form — lives in
 * \`ui/\`, moved here from the desktop application with one import line changed
 * per file. \`build-client.mjs\` bundles it and pastes the result below.
 *
 * ## Why the components are not rewritten
 *
 * They were, and the rewrites are where the port went wrong: a list that lost
 * its per-row buttons, a parameter form that lost every field, a filter box that
 * moved. None of it was a design decision — each was a detail the rewrite did
 * not carry across. A copy cannot lose a detail it never restated.
 *
 * ## The one seam
 *
 * The components call \`bridge.models.*\`, which the old preload script built over
 * IPC. That object is built in \`ui/bridge-adapter.js\` over this host's HTTP
 * routes — same names, same argument shapes, same return shapes. Three methods
 * reshape their answer (\`port\`, \`library\`, \`log\`) because a route can only
 * answer JSON; the rest are a direct rename.
 */
window.__ModuleLoader__.load({
  id: 'dsh-aranllm-local',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    /*
     * The host's copies of the three shared packages.
     *
     * \`react/jsx-runtime\` is easy to leave out and its absence is confusing: the
     * compiler emits a call into it for every element, so a bundle that cannot
     * find it fails while rendering rather than while loading, and the error
     * names a hook.
     */
    const react = require('react')
    globalThis.__aranllmUI = {
      react,
      jsxRuntime: require('react/jsx-runtime'),
      reactDom: require('react-dom'),
    }

    /*
     * The clipboard, for the address line's copy button.
     *
     * The adapter reads this rather than importing the host's helper, because
     * the adapter is loaded by the bundle — which runs before the host's
     * packages are in hand. One global, installed here, read there.
     */
    try {
      globalThis.__aranllmWriteClipboard = require('@deepseek-ai/dsh-client-ui-primitives').writeClipboard
    } catch {
      /* Absent is not fatal: the copy button then reports its own failure. */
    }

    // ---- the copied UI, bundled -------------------------------------------
    /* eslint-disable */
${bundle}
    /* eslint-enable */
    // -----------------------------------------------------------------------

    const ui = globalThis.__aranllmUI
    if (typeof ui?.LocalModels !== 'function') {
      throw new Error('aranllm-local: the bundled UI did not load')
    }

    /*
     * The settings section.
     *
     * Registered unconditionally, unlike the host's own feature pages, which
     * gate on \`configForms.whileServed\`. That gate fires only while the Host
     * serves the matching settings namespace, and this page is not a form — its
     * content is the model list, served by this plugin's own routes. Gating on
     * the namespace made the whole section disappear, with no error, because
     * \`whileServed\` resolves normally and simply never calls its \`register\`.
     */
    const inject = ['slots', 'locale']

    function apply(ctx) {
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: 'aranllm-local',
            // After \`general\` (0) and \`models\` (10): the local model is a
            // machine-specific concern, not part of endpoint configuration.
            order: 20,
            label: () => '本地模型',
            inject: () => ({}),
          },
          ui.LocalModels,
        ),
      )

      /*
       * The model hub, as its own settings section.
       *
       * Placed after the model list (order 21) so the two read as a pair: what
       * is on this machine, then what can be fetched onto it.
       *
       *  is passed rather than assumed, and the reason is the same
       * class of thing the four ports before this one kept tripping on: the hub
       * page was written for a tabbed shell, where a tab is built once and asked
       * whether it is showing — it starts its first search from
       * . This host's settings section has no such concept;
       * it renders the component when the section is chosen. Answering the
       * question is what makes the two shells agree, without an edit to the
       * component that would have to be carried forward on the next copy.
       */
      if (typeof ui.Hub === 'function') {
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'aranllm-hub',
              order: 21,
              label: () => '模型仓库',
              inject: () => ({ active: true }),
            },
            ui.Hub,
          ),
        )
      }

      /*
       * The live rate, in the composer's dock row.
       *
       * Same slot the host's own stats pill registers into (\`id: 'stats'\`,
       * \`order: 0\`), placed after it so the two read as one line: the host's
       * session figures, then this one. It is a separate registration rather
       * than a change to that component because the component is in
       * \`node_modules\` — an edit there is lost on the next install, and this is
       * a measurement the page can make on its own.
       *
       * No \`inject\` props: everything it needs is in the document, which is
       * what makes it work for a reply from any provider rather than only the
       * ones that report their token counts.
       */
      if (typeof ui.LiveRate === 'function') {
        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register(
            {
              name: 'conversation.composer.dock',
              id: 'aranllm-live-rate',
              order: 1,
              inject: () => ({}),
            },
            ui.LiveRate,
          ),
        )
      }
    }

    exports.apply = apply
    exports.inject = inject
    exports.LocalModels = ui.LocalModels
    exports.LiveRate = ui.LiveRate
    exports.Hub = ui.Hub
    return module.exports
  }
})
`

writeFileSync('client.js', header)
console.log('client.js 写好:', header.length, 'bytes')
