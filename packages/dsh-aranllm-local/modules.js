/**
 * Load the copied modules once, in the order their shim needs them.
 *
 * ## Why the shim is configured before anything is imported
 *
 * The copied files read their data directory through `app.getPath('userData')`,
 * which is a call, not a constant — so importing one before the shim has a
 * directory does not fail. It produces whatever the first caller happened to ask
 * for, and the mistake shows up later as files in the wrong place. Configuring
 * first is what makes the import order matter, and this file is where that order
 * lives so no caller has to know it.
 *
 * ## Why the modules are imported rather than re-exported
 *
 * `local-models.ts` creates a `LocalModelManager` at module scope and wires it
 * to the adapters. Importing the module twice would create a second manager,
 * which would start a second llama-server on the same port and hand one
 * catalogue to each caller. ESM caches by specifier, so a single import list
 * held in one place is the whole guarantee — and this is that place.
 */
import { configureShim } from './compat/electron-shim.js'

let loaded

/**
 * Every copied module, loaded.
 *
 * @param {string} dataDir - the folder this plugin may write in.
 * @returns {Promise<object>} the modules, keyed by the short name `routes.js` uses.
 */
export async function loadModules(dataDir) {
  if (loaded !== undefined) return loaded

  configureShim({ dataDir })

  const [
    local,
    files,
    importModel,
    hub,
    hubSources,
    download,
    service,
    apiLog,
    backup,
    sysinfo,
    launchAtLogin,
    library,
    modelConfig,
    network,
    docVersions,
  ] = await Promise.all([
    import('./compat/local-models.js'),
    import('./compat/model-files.js'),
    import('./compat/model-import.js'),
    import('./compat/hub.js'),
    import('./compat/hub-sources.js'),
    import('./compat/download.js'),
    import('./compat/api-service.js'),
    import('./compat/api-log.js'),
    import('./compat/settings-backup.js'),
    import('./compat/sysinfo.js'),
    import('./compat/launch-at-login.js'),
    import('./compat/library.js'),
    import('./lib/model-config.js'),
    import('./compat/network.js'),
    import('./compat/doc-versions.js'),
  ])

  loaded = {
    local,
    files,
    importModel,
    hub,
    hubSources,
    download,
    service,
    apiLog,
    backup,
    sysinfo,
    launchAtLogin,
    library,
    modelConfig,
    network,
    docVersions,
  }
  return loaded
}
