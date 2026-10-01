/**
 * The bundle's entry: the copied components, and the stylesheets they need.
 *
 * ## Why every stylesheet is imported **with a binding**
 *
 * `import './x.css'` is dropped by esbuild: a bare import has no binding, so
 * nothing can be shown to depend on it, and the bundler removes it as a file
 * with no side effects. Measured — the first version of this file did exactly
 * that and every rule in all five stylesheets was missing from the output, which
 * is why the page rendered as unlabelled black rectangles.
 *
 * Binding the string to a name and exporting it under `stylesheets` is what
 * keeps them. The tail of `client.js` then writes that table into the document.
 *
 * ## Why they are here and also imported by the components themselves
 *
 * The components import their own stylesheet, which is how they were written and
 * is left alone. Whether esbuild keeps *that* import is out of this file's
 * hands — the answer above was no — so the entry imports each one again under a
 * name. Duplicated imports are deduplicated by the bundler to one constant.
 */
import tokens from './tokens.css'
import localModels from './local-models.css'
import parameterPanel from './parameter-panel.css'
import icon from './Icon/icon.css'
import modal from './Modal/modal.css'
import hostOverrides from './host-overrides.css'
import liveRate from './live-rate.css'
import hub from './hub.css'

export { LocalModels } from './LocalModels.tsx'
export { ParameterPanel } from './ParameterPanel.tsx'
export { ParameterField } from './ParameterField.tsx'
export { Icon } from './Icon/Icon.tsx'
export { Modal } from './Modal/Modal.tsx'
export { LiveRate } from './LiveRate.tsx'
export { Hub } from './Hub.tsx'
export { bridge } from './bridge-adapter.js'

/**
 * The stylesheets, by id.
 *
 * The ids are the data attribute the injector writes, so a second run of the
 * plugin — an HMR reload, which the host does — finds what the first one wrote
 * and adds nothing.
 */
export const stylesheets = {
  'aranllm-local-tokens': tokens,
  'aranllm-local-models': localModels,
  'aranllm-local-params': parameterPanel,
  'aranllm-local-icons': icon,
  'aranllm-local-modal': modal,
  'aranllm-local-live-rate': liveRate,
  'aranllm-local-hub': hub,
  // Last, so it can override the copied stylesheets without editing them.
  'aranllm-local-host': hostOverrides,
}
