/**
 * The two Electron calls the copied modules make.
 *
 * The local-model library was written for a desktop main process and reaches
 * for `electron` in exactly two ways: `app.getPath('userData')` to find a place
 * to keep files, and `shell.trashItem` to remove one recoverably. Everything
 * else in those files is plain Node.
 *
 * That is a small enough surface to stand in for rather than rewrite around, and
 * standing in for it is what makes the alternative possible: the modules move
 * here unchanged — one `import` line edited — instead of being reimplemented
 * against this host's services, which would mean re-deciding every one of their
 * behaviours and getting some of them subtly wrong.
 *
 * ## The directory
 *
 * `app.getPath('userData')` becomes a folder this plugin owns under the host's
 * home. Deliberately not the host's own data root: the files here are a model
 * config store, a hub cache and a log tail — all of them this feature's private
 * business, and putting them beside another feature's files is how one upgrade
 * ends up reading the other's state.
 *
 * ## The recycle bin
 *
 * Not reachable from here, so `trashItem` becomes a move into a folder the
 * plugin keeps. The property that matters survives: the file is still on disk,
 * so a deletion nobody meant is undoable — which at this size (weights measured
 * in gigabytes) is the difference between a mistake and an afternoon of
 * downloading.
 */
import { mkdirSync } from 'node:fs'
import { rename } from 'node:fs/promises'
import { basename, join } from 'node:path'

let base = ''

/**
 * Point the shim at the directory this plugin may write in.
 *
 * Called once from `index.js` before any copied module runs. A module-scope
 * value rather than an environment variable, because the copied files read the
 * path through `app.getPath` and nothing else — there is no second channel to
 * keep in step.
 */
export function configureShim(options) {
  base = options?.dataDir ?? ''
  if (base.length > 0) mkdirSync(base, { recursive: true })
}

export const app = {
  /**
   * The one path name the copied modules ask for.
   *
   * Anything else is returned as the same base rather than throwing: the
   * modules only ever pass `'userData'`, and a refusal here would turn a future
   * second call into a crash instead of a file in the wrong folder — one of
   * those is diagnosable from the log and the other is not.
   */
  getPath: (name) => {
    if (base.length === 0) {
      throw new Error('aranllm-local: the electron shim was used before it was configured')
    }
    return base
  }
}

export const shell = {
  /**
   * Move a file into this plugin's own discarded-files folder.
   *
   * The timestamp prefix keeps a second copy of the same model from overwriting
   * the first one's file — the same rule the model-removal route uses, for the
   * same reason.
   */
  trashItem: async (path) => {
    const trash = join(base, '.trash')
    mkdirSync(trash, { recursive: true })
    await rename(path, join(trash, `${String(Date.now())}-${basename(path)}`))
  }
}

export const dialog = {
  /**
   * No native picker from this process.
   *
   * Present so an import that names `dialog` fails on the call rather than on
   * the import — the picker is host-side and reaches the page over its own
   * route, so a copied module that still expects to open one is a module whose
   * caller has not been ported yet.
   */
  showOpenDialog: async () => {
    throw new Error('aranllm-local: the host owns the file picker; use the /api/aranllm route instead')
  }
}

/**
 * The session, as far as the copied modules can use it here.
 *
 * `network.js` calls `session.defaultSession.setProxy` to route every request
 * this process makes through the user's proxy. That is the right lever inside
 * Electron and it does not exist in a harness process — there is no session
 * object, and no ambient network stack to configure: the requests this feature
 * makes are `fetch` calls that go wherever the environment sends them.
 *
 * So the call is accepted and does nothing, and it says so once. The setting is
 * still stored, so a mirror never silently reverts, and the connection test
 * reports what the machine can actually reach — which is what makes an
 * inapplicable proxy visible rather than a control that appears to work.
 */
let proxyNoticeGiven = false

export const session = {
  defaultSession: {
    setProxy: async () => {
      if (proxyNoticeGiven) return
      proxyNoticeGiven = true
      try {
        process.stderr.write(
          '[aranllm-local] session.setProxy is not available outside Electron; ' +
            'the proxy preference is stored but not applied to this process.\n',
        )
      } catch {
        /* Reporting a limitation must not become a second one. */
      }
    },
  },
}

export default { app, shell, dialog, session, configureShim }
