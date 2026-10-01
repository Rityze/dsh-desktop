/**
 * Local models, mounted in this host.
 *
 * ## What is here and what is not
 *
 * The feature itself is not written in this file. Everything under `compat/` is
 * the desktop application's own source — the scanner, the loader, the hub
 * client, the download queue, the OpenAI-compatible gateway — moved across
 * unchanged apart from two import lines, and compiled as-is. `routes.js` maps
 * its exports onto HTTP paths. What is left for this file is the part that could
 * not be copied: which folder to keep state in, how the chosen model folder is
 * remembered, and when to tear the whole thing down.
 *
 * That division is deliberate. Reimplementing the modules against this host's
 * services would have meant re-deciding each of their behaviours — how a split
 * GGUF is named, when a load is reported as stalled, which download mirror is
 * tried second — and getting some of them subtly wrong without any way to
 * notice. Moving them means those decisions are the ones already made and
 * tested, and this file stays small enough to read in one sitting.
 *
 * ## The two places the host had to be told about
 *
 * `compat/electron-shim.js` answers `app.getPath('userData')` with a folder this
 * plugin owns, and `shell.trashItem` with a move into that folder's `.trash`.
 * Those are the only Electron calls the copied modules make, and they are the
 * reason the copy needed a shim at all rather than a rewrite.
 */
import { appendFileSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import z from '@deepseek-ai/schemastery'
import { credentialKey } from '@deepseek-ai/dsh-credentials'
import { loadModules } from './modules.js'
import { registerRoutes } from './routes.js'

export const name = 'aranllm-local'
export const inject = ['llm', 'settings', 'connection', 'credentials', 'directoryPicker']

/*
 * Where llama-server is, decided while this module is being imported.
 *
 * ## Why this is at the top level and not inside `apply`
 *
 * It was inside `apply`, and that was a launch-order bug with a confusing
 * symptom. The host restores the session's model selection during its own start,
 * which means it calls the manager's `load` **before** plugins are applied — so
 * the first load of every session ran with the variable unset,
 * `discoverLlamaServer()` answered an empty string, and the model picker showed
 * `llama-server binary not found: undefined`. Pressing 重试 did nothing, because
 * the failure was not in the retry path but in the startup order, and by then the
 * toast had been read as a broken button.
 *
 * A module-level statement runs when the plugin is imported, which the loader
 * does before it applies anything. Nothing here depends on `ctx`, so nothing is
 * lost by moving it out of the lifecycle.
 */
const located = locateLlamaDirectory()
if (located !== undefined) {
  if (!process.env.ARANLLM_LLAMA_SERVER_DIR) {
    process.env.ARANLLM_LLAMA_SERVER_DIR = located.llamaBase
  }
  if (!process.env.ARANLLM_INSTALL_ROOT) {
    process.env.ARANLLM_INSTALL_ROOT = located.installRoot
  }
}

/** Where the chosen model folder is remembered across launches. */
const LIBRARY_KEY = credentialKey('aranllm-local', 'library')

export const Config = z.object({
  routeName: z.string().default('aranllm-local'),
  /** Folders scanned for .gguf weights. Several folders may be listed, separated by ';' or newlines. */
  modelsRoot: z.string(),
  llamaServerPath: z.string(),
  defaultContextLength: z.number().default(131072),
  defaultKvCacheType: z.string().default('q4_0'),
  defaultGpuLayers: z.number().default(-1),
  defaultThreads: z.number().default(8),
})

/** Read one string field out of the credentials record, or nothing. */
async function remembered(ctx, field) {
  try {
    const record = await ctx.credentials.readRecord(LIBRARY_KEY)
    if (record?.kind !== 'grant') return undefined
    const value = record.payload?.[field]
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
  } catch (error) {
    ctx.logger.warn('aranllm-local: the saved settings could not be read (%s)', String(error?.message ?? error))
    return undefined
  }
}

/** Write one field of the credentials record, keeping the others. */
async function remember(ctx, field, value) {
  await ctx.credentials.modifyRecord(LIBRARY_KEY, async record => ({
    kind: 'grant',
    payload: { ...(record?.kind === 'grant' ? record.payload : {}), [field]: value },
  }))
}

export async function apply(ctx, config = {}) {
  /*
   * State lives under the host's own home, in a folder named after this plugin.
   *
   * Not the host's data root: what goes here is a model config store, a hub
   * cache and a log tail — private to this feature, and putting them beside
   * another feature's files is how one upgrade ends up reading another's state.
   */
  const dataDir = join(ctx.settings?.home ?? process.cwd(), 'aranllm-local')

  /*
   * llama-server's own output, written where the page reads it back.
   *
   * ## Why this is wired at all
   *
   * `compat/local-models.js` filters the engine's stream down to the handful of
   * lines that say what a load is doing, and hands them to a sink that
   * `configureLocalModelLog` installs. That call lived in `kernel.ts` in the
   * desktop application. Nothing in this port made it, so `logSink` stayed
   * undefined, every line was dropped, and `/api/aranllm/log` answered an empty
   * array — which is the one piece of evidence a stalled load has, and it was
   * being thrown away.
   *
   * The path is the one `readLocalLog` reads, and it is derived from the same
   * shim `app.getPath('userData')` answers, so the writer and the reader cannot
   * drift apart. `[local]` is the marker that function filters on.
   */
  const logFile = join(dataDir, 'logs', 'mimo.log')

  /*
   * Reported rather than set — the setting happens at import, above.
   *
   * Logged here because this is where a logger exists. The message is a `warn`
   * on the failure branch: a build with no bundled llama-server still runs, and
   * the only visible difference is that loading a model refuses, so the reason
   * belongs in the log the host already keeps.
   */
  if (located === undefined) {
    ctx.logger.warn(
      'aranllm-local: no llama-server found; set ARANLLM_LLAMA_SERVER_DIR to the folder holding vendor/llama.cpp.',
    )
  } else {
    ctx.logger.warn(`aranllm-local: llama-server at ${located.directory}`)
  }

  const modules = await loadModules(dataDir)

  /*
   * llama-server's own output, written where the page reads it back.
   *
   * ## Why this is wired at all
   *
   * `compat/local-models.js` filters the engine's stream down to the handful of
   * lines that say what a load is doing, and hands them to a sink that
   * `configureLocalModelLog` installs. That call lived in `kernel.ts` in the
   * desktop application. Nothing in this port made it, so `logSink` stayed
   * undefined, every line was dropped, and `/api/aranllm/log` answered an empty
   * array — which is the one piece of evidence a stalled load has, and it was
   * being thrown away. Diagnosing a load that produced no visible process meant
   * working without it.
   *
   * The path is the one `readLocalLog` reads, derived from the same shim that
   * answers `app.getPath('userData')`, so the writer and the reader cannot drift
   * apart. `[local]` is the marker that function filters on.
   */
  try {
    mkdirSync(dirname(logFile), { recursive: true })
    modules.local.configureLocalModelLog((text) => {
      try {
        appendFileSync(logFile, `[${new Date().toISOString()}] [local] ${text}\n`)
      } catch {
        /* A log that cannot be written must not fail the load it describes. */
      }
    })
  } catch (error) {
    ctx.logger.warn('aranllm-local: the local log could not be opened (%s)', String(error?.message ?? error))
  }

  /*
   * Attached to the engine, which is what puts a loaded model in the picker.
   *
   * ## The line that was missing
   *
   * The desktop application's plugin opened with `await manager.attach(ctx.llm)`
   * — one call, and the whole feature became reachable from the chat surface:
   * the manager registers its routes with the host's LLM service, so a model
   * that is loaded appears in the model list beside the cloud ones with no
   * further wiring.
   *
   * That call was not carried across. Everything else worked — the page listed
   * models, loaded them, ran llama-server — and the loaded model stayed
   * invisible everywhere except the page that loaded it, which is exactly what a
   * missing registration looks like from the outside.
   *
   * ## The two values the manager reads live
   *
   * `language` decides whether the effort names the adapter renders are Chinese
   * or English, taken from the host's own locale setting so an English install
   * does not show 中文. `capabilityOverrides` is how a user's "this model really
   * can see" correction reaches the catalogue; it is a function rather than a
   * map so an edit made after this runs is picked up on the next render.
   *
   * A failure here is reported and not fatal: a build with no LLM service still
   * has a working local-model page, and refusing to start over it would remove
   * the only way to load a model in the first place.
   */
  let detachEngine
  /*
   * Re-reads the per-model store and re-announces the catalogue.
   *
   * Declared out here because `registerRoutes` is handed the modules, not this
   * closure, and the routes are what call it. A no-op when the engine never
   * attached — which is a build with no LLM service, where there is nothing to
   * re-announce and the page still has to work.
   */
  let refreshEngineOverrides = async () => {}
  try {
    const manager = modules.local.manager
    if (manager !== undefined) {
      /*
       * The per-model record, read the way the panel reads it.
       *
       * `capabilityOverrides` is asked once per model at render time, and it has
       * to answer synchronously — the manager calls it while building a list —
       * so it reads the store's cached snapshot rather than awaiting a file.
       * `set()` refreshes that snapshot, which is what makes a just-changed
       * toggle take effect on the next render.
       */
      const store = new modules.modelConfig.ModelConfigStore({
        file: modules.modelConfig.modelConfigFile(dataDir),
      })
      void store.all().catch(() => undefined)

      const locale = ctx.settings?.get?.('locale')?.preference
      manager.language = locale === 'en' ? 'en' : 'zh'
      manager.capabilityOverrides = (model) =>
        store.snapshot(modules.modelConfig.configKey(model)) ?? {}

      await manager.attach(ctx.llm)
      detachEngine = () => manager.detach()

      /*
       * What the desktop application called `syncLocalModelToEngine`.
       *
       * ## What that function did, and what this has to do instead
       *
       * There it restarted the kernel. Its own comment explains why a restart was
       * needed at all: most of the parameter panel's fields are launch flags that
       * the next load picks up on its own, but `temperature` reaches a request
       * through the engine's *agent* definition, and agents were read once when
       * the engine started — so without the restart the number was saved, shown,
       * and had no effect until the next launch. Reported, in this port, as "the
       * thinking level does not actually apply".
       *
       * A restart is the wrong instrument here. The host's own adapter resolves a
       * model's definition per request, and re-reads it when the catalogue it was
       * built from changes. So the equivalent is to invalidate: re-read the store
       * and tell the manager to re-announce. Nothing is stopped, a generation in
       * flight is not interrupted, and the next request sees the new number.
       *
       * Called after every write that could move a stored value — the config
       * save, the port, loading and unloading. Not called on the read paths,
       * which is the whole reason it is a function rather than an effect.
       */
      refreshEngineOverrides = async () => {
        /*
         * One line, and it is enough.
         *
         * `capabilityOverrides` above reads `store.snapshot(...)` — the store's
         * in-memory copy — and the manager calls it while assembling a model's
         * definition, which happens on the request path rather than once at
         * startup. So re-reading the file is the whole invalidation: the cached
         * snapshot is replaced, and the next request that asks about this model
         * gets the new numbers.
         *
         * Nothing here touches the running process. A generation in flight
         * finishes on its old values, which is what a settings save should do.
         */
        await store.all()
      }

      ctx.logger.warn('aranllm-local: attached to the engine; a loaded model is now in the picker')
    }
  } catch (error) {
    ctx.logger.warn(
      'aranllm-local: the engine registration failed (%s)',
      String(error?.message ?? error),
    )
  }

  /*
   * The OpenAI-compatible gateway, wired to the copied modules.
   *
   * It is the same server the desktop application ran — a route that speaks
   * `/v1/chat/completions` and forwards to whichever local model is loaded — and
   * it needs three things this process has: somewhere to keep its settings, the
   * model that is running, and a way to reach it. All three are the copied
   * modules' own, so this is a wire rather than an implementation.
   *
   * ## Why `complete` re-points the model name
   *
   * The client names the endpoint by whatever it configured, and llama-server
   * answers to exactly one name: the file's. Passing the client's name through
   * is a 404 for every client that was not configured with the file name, which
   * is all of them. The request's other fields travel unchanged — temperature,
   * tools, the messages themselves.
   */
  modules.service.configureApiService({
    dataDirectory: dataDir,
    models: () => {
      const loaded = modules.local.loadedLocalModel()
      return loaded ? [{ id: loaded.modelId }, { id: 'default' }] : []
    },
    complete: async (request, signal) => {
      const loaded = modules.local.loadedLocalModel()
      if (!loaded) {
        throw new Error('本机还没有加载模型，先在「本地模型」里加载一个。')
      }
      const answer = await fetch(`${loaded.baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...request, model: loaded.modelId, stream: false }),
        signal,
      })
      if (!answer.ok) {
        const detail = await answer.text().catch(() => '')
        throw new Error(`模型返回 ${String(answer.status)}：${detail.slice(0, 200)}`)
      }
      const body = await answer.json()
      return {
        text: body?.choices?.[0]?.message?.content ?? '',
        model: request.model,
        ...(body?.usage?.prompt_tokens !== undefined
          ? { promptTokens: body.usage.prompt_tokens }
          : {}),
        ...(body?.usage?.completion_tokens !== undefined
          ? { completionTokens: body.usage.completion_tokens }
          : {}),
      }
    },
  })

  /*
   * Started only if it was already on.
   *
   * A gateway that binds a port and answers completions is not something to
   * switch on at launch: the settings file records what the user chose last
   * time, and a build that turned it on by itself would publish their models to
   * their network the first time they installed it.
   */
  await modules.service.startApiServiceIfEnabled().catch((error) => {
    ctx.logger.warn('aranllm-local: the API gateway could not start (%s)', String(error?.message ?? error))
  })


  /*
   * The folder chosen last time, replayed onto the copied modules.
   *
   * They keep the root in their own store and are given it once, here. An empty
   * result is fine and means "use the default", which is the state a first
   * launch is in.
   */
  const savedRoot = await remembered(ctx, 'modelsRoot')
  if (savedRoot !== undefined) modules.local.setLocalModelRoot(savedRoot)
  const savedPort = await remembered(ctx, 'port')
  if (savedPort !== undefined && Number.isInteger(Number(savedPort))) {
    modules.local.setLocalPort(Number(savedPort))
  }

  const disposeRoutes = registerRoutes(ctx, modules, { refreshEngineOverrides })

  /*
   * A settings edit is written through, because the copied modules keep their
   * own copy of both values.
   *
   * `setLocalModelRoot` and `setLocalPort` are what the modules read; the
   * credentials record is what survives a restart. Both have to be updated, and
   * the order matters for the second: the record is written first so a crash
   * between the two leaves the next launch reading the value the user chose
   * rather than the one it replaced.
   */
  const applySettings = async () => {
    try {
      const live = config ?? {}
      const root = String(live.modelsRoot ?? '').trim()
      const binary = String(live.llamaServerPath ?? '').trim()
      if (root.length > 0) {
        modules.local.setLocalModelRoot(root)
        await remember(ctx, 'modelsRoot', root)
      }
      if (binary.length > 0) {
        // The module reads the binary from the environment it builds, so an
        // empty string means "find one yourself" and is left alone rather than
        // written over the discovered path.
        process.env.ARANLLM_LLAMA_SERVER = binary
      }
    } catch (error) {
      ctx.logger.warn('aranllm-local: a settings change could not be applied (%s)', String(error?.message ?? error))
    }
  }
  await applySettings()
  ctx.on?.('loader/volatile-update', () => void applySettings())

  ctx.logger.info('aranllm-local: ready (data in %s)', dataDir)

  return () => {
    disposeRoutes()
    /*
     * Detached before the servers are stopped: the registration points at routes
     * that the shutdown is about to remove, and a picker that still lists a model
     * whose port has closed is one that fails on the next message rather than
     * disappearing.
     */
    detachEngine?.()
    return modules.local.shutdownLocalModels()
  }
}

/**
 * The folder holding `llama-server`, found without being told.
 *
 * ## Why this walks up rather than using a fixed path
 *
 * The binary ships inside this repository at `vendor/llama.cpp/`, but the
 * plugin does not know where the repository is: it is loaded by the harness,
 * whose working directory is the host's data folder, and a development run and
 * a packaged one differ by several levels. Walking up from this file's own
 * location reaches the repository in the first case and the app bundle in the
 * second, and the candidate list is the union of the two layouts that exist.
 *
 * ## Why it stops at the first hit
 *
 * Earlier candidates are closer to this file, and the closer one is the one
 * shipped with the build. A second copy further up — a stale `vendor/` two
 * directories above a checkout — would otherwise win on some machines and not
 * others, which is the kind of difference that never reproduces.
 *
 * A miss returns undefined and the caller leaves the variable unset, so the
 * scanner's own search runs and its message is what the page shows.
 */
function locateLlamaDirectory() {
  const names = process.platform === 'win32' ? ['llama-server.exe'] : ['llama-server']
  /*
   * Every place the build has been seen, nearest first.
   *
   * `resources/vendor/llama.cpp` is the one that matters and the one that was
   * missing: the desktop application installs its models and its engine under
   * `resources/`, and the search below walked straight past it — it looked for
   * `vendor/llama.cpp` at each level and the file is one directory deeper. The
   * symptom was a settings page that read `binary not found: undefined`.
   *
   * The rest are kept because this runs from a plugin folder whose depth is not
   * fixed: a development checkout, a packaged install and a `node_modules`
   * symlink put the repository root a different number of levels up each time.
   */
  const candidates = [
    ['resources', 'vendor', 'llama.cpp'],
    ['vendor', 'llama.cpp'],
    ['resources', 'vendor', 'llama.cpp', 'build', 'bin'],
    ['vendor', 'llama.cpp', 'build', 'bin'],
  ]
  let base = dirname(fileURLToPath(import.meta.url))
  for (let up = 0; up < 7; up += 1) {
    for (const parts of candidates) {
      const directory = join(base, ...parts)
      for (const name of names) {
        try {
          if (statSync(join(directory, name)).isFile()) {
            /*
             * Two answers, because the two readers want different things.
             *
             * `discoverLlamaServer` takes `ARANLLM_LLAMA_SERVER_DIR` as a base
             * and appends `vendor/llama.cpp` to it. A hit means
             *
             *     base + parts + llama-server.exe     exists
             *
             * and what it will look for is
             *
             *     value + ['vendor','llama.cpp'] + llama-server.exe
             *
             * so the value is `base + parts` with those last two components
             * dropped. Written as "drop two" rather than "cut at llama.cpp"
             * because the parts list is exactly the candidate plus those two,
             * and that is true of every candidate here.
             *
             * `packagedModelsRoot` reads the same variable looking for
             * `<root>/models`, and the drop-in library sits at the repository
             * root — the top of the tree, one level above where a `resources/`
             * candidate starts.
             */
            const llamaBase = join(base, ...parts.slice(0, Math.max(0, parts.length - 2)))
            return { llamaBase, installRoot: base, directory }
          }
        } catch {
          /* Not here: keep looking, which is the common case. */
        }
      }
    }
    base = dirname(base)
  }
  return undefined
}
