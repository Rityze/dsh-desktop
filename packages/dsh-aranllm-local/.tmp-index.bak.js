import { mkdir, rename } from 'node:fs/promises'
import { statSync } from 'node:fs'
import { basename, join, sep } from 'node:path'
import z from '@deepseek-ai/schemastery'
import { credentialKey } from '@deepseek-ai/dsh-credentials'
import { canOpenNativePath, openNativePath } from '@deepseek-ai/dsh-native-command'
import { LocalModelManager, defaultDataDir, defaultModelRoots, defaultModelsRoot, discoverLlamaServer, scanModels } from './lib/manager.js'
import { LOAD_PARAMETER_GROUPS, normalizeLoadOptions } from './lib/load-options.js'
import { parseModelRoots } from './lib/gguf.js'
import { DEFAULT_SERVER_PORT } from './lib/server.js'
import { ModelConfigStore, modelConfigFile, configKey } from './lib/model-config.js'

export const name = 'aranllm-local'
export const inject = ['llm', 'settings', 'connection', 'credentials']

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

const ROUTE = 'aranllm-local'

function json(run) {
  return async (...args) => {
    try {
      return Response.json(await run(...args), { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      const status = error?.status ?? (error?.code === 'BINARY_MISSING' || error?.code === 'MODEL_MISSING' ? 400 : 500)
      return Response.json(
        { code: error?.code ?? 'ERROR', error: error?.message ?? String(error) },
        { status, headers: { 'Cache-Control': 'no-store' } },
      )
    }
  }
}

export async function apply(ctx, config = {}) {
  const base = {
    routeName: config.routeName ?? ROUTE,
    modelsRoot: config.modelsRoot?.trim() || defaultModelsRoot(),
    llamaServerPath: config.llamaServerPath?.trim() || discoverLlamaServer(),
    defaultContextLength: config.defaultContextLength ?? 131072,
    defaultKvCacheType: config.defaultKvCacheType ?? 'q4_0',
    defaultGpuLayers: config.defaultGpuLayers ?? -1,
    defaultThreads: config.defaultThreads ?? 8,
  }

  /*
   * Configuration comes from this plugin's own `Config` schema.
   *
   * This used to call `ctx.settings.register(name, Config, { applies: 'live' })`
   * and read the scope it returned. Harness 0.1.7 removed that method: a plugin
   * declares its fields in the exported schema and the settings service derives
   * the form from it, so there is no registration step and no scope to hold. The
   * warning the host prints for a plugin that still tries is
   * "this host's settings service has no register()".
   *
   * Reading through `live()` rather than capturing fields keeps a later edit
   * visible without a restart, which is what the setting always promised. The
   * signal that an edit landed is `loader/volatile-update`, subscribed below.
   */
  let live = () => config

  // Remembered per-model load options. The file lives next to the plugin's other
  // state so that a reinstall of the renderer does not discard tuning work.
  const store = new ModelConfigStore({ file: modelConfigFile(config.dataDir ?? defaultDataDir()) })

  const manager = new LocalModelManager({
    routeName: base.routeName,
    modelRoot: base.modelsRoot,
    log: ({ stream, text }) => {
      const line = text.trim()
      if (!line) return
      if (stream === 'stderr') ctx.logger.debug('aranllm-local: %s', line)
      else ctx.logger.info('aranllm-local: %s', line)
    },
  })
  // Effort names are rendered by the adapter, so the plugin passes its own
  // locale through rather than leaving the Chinese default to be wrong for an
  // English install.
  try {
    manager.language = ctx.settings.get?.('locale')?.preference === 'en' ? 'en' : 'zh'
  } catch {
    manager.language = 'zh'
  }
  // Capability overrides come from the same per-model record the load options
  // do. The manager asks synchronously while the store answers asynchronously,
  // so it reads the store's cached snapshot; `set()` refreshes that snapshot,
  // which is what makes a just-changed toggle take effect on the next render
  // rather than after a restart.
  manager.capabilityOverrides = (model) => store.snapshot(configKey(model)) ?? {}

  // Prime it once, so the first catalog render already reflects any correction
  // the user made in a previous session.
  void store.all().catch(() => {})

  await manager.attach(ctx.llm)

  /**
   * The live resolved section, read per operation so an edit applies at once.
   *
   * ## Why an empty string does not win
   *
   * The two path fields are declared as plain `z.string()` with no default,
   * because their real default is not a constant — it is whatever
   * `defaultModelsRoot()` and `discoverLlamaServer()` compute on this machine.
   * The settings service therefore hands them over as **empty strings**, and a
   * plain `{...base, ...live()}` lets an empty string overwrite the value `base`
   * had just resolved.
   *
   * Measured: the panel said "no GGUF model was found in the local model
   * folder" while the folder held seven of them and `scanModels` returned them
   * when called by hand. The root had been reduced to `''` between the two.
   *
   * So the fallback is applied per field, on every read, to whichever value is
   * current — which also makes clearing the field in Settings mean "go back to
   * the default" rather than "scan nothing".
   */
  /*
   * The folder chosen last time, read back before anything asks for it.
   *
   * Awaited here rather than read lazily inside `current()`: that function is
   * synchronous by design — it is called from `root()` on the path that answers
   * the model list — and making it async to fetch one string would push an
   * await through every caller.
   *
   * A failure is not fatal. The store can be missing, unreadable or hold a
   * record from another plugin, and none of those is a reason to refuse to
   * start: an empty string means "use the default folder", which is the same
   * state a first launch is in.
   */
  let rememberedRoot = ''
  let rememberedPort = undefined
  try {
    const record = await ctx.credentials.readRecord(LIBRARY_KEY)
    if (record?.kind === 'grant' && typeof record.payload?.modelsRoot === 'string') {
      rememberedRoot = record.payload.modelsRoot.trim()
    }
    if (record?.kind === 'grant' && Number.isInteger(record.payload?.port)) {
      rememberedPort = record.payload.port
    }
  } catch (error) {
    ctx.logger.warn('aranllm-local: the saved model folder could not be read (%s)', String(error?.message ?? error))
  }

  const current = () => {
    try {
      const liveValues = live() ?? {}
      return {
        ...base,
        ...liveValues,
        // Remembered beats default; the schema's own value beats both, so the
        // settings form stays the authoritative way to change it.
        modelsRoot:
          String(liveValues.modelsRoot ?? '').trim() || rememberedRoot || defaultModelsRoot(),
        llamaServerPath: String(liveValues.llamaServerPath ?? '').trim() || discoverLlamaServer(),
      }
    } catch {
      return base
    }
  }
  // Hand the live root to the manager so the picker's first listModels call can
  // scan without waiting for a Settings visit; edits below keep it in step.
  const root = () => { const value = current().modelsRoot; manager.modelRoot = value; return value }
  const binary = () => current().llamaServerPath

  /**
   * Discover loadable models. Only the user's configured folders are scanned,
   * so an unset root is reported as such rather than silently listing nothing:
   * the model picker shows this message and offers the folder setting.
   */
  const discover = async () => {
    const roots = parseModelRoots(root())
    /*
     * Logged before the early return, not after it.
     *
     * The branch that answers "no folder configured" is the one worth seeing:
     * it is what the panel shows when the root came through empty, and a line
     * placed after it would be silent in exactly the case being investigated —
     * which is how this went unnoticed through several rounds.
     */
    ctx.logger.warn(
      'aranllm-local: discover root=%j roots=%j configured=%j',
      root(),
      roots,
      live()?.modelsRoot,
    )
    if (roots.length === 0) {
      return {
        root: '',
        models: [],
        loaded: manager.describe(),
        progress: manager.progress,
        needsRoot: true,
        message: 'No model folder is configured. Add one in Settings > Plugins > AranLLM Local, then rescan.',
      }
    }
    /*
     * `manager.catalog`, not `scanModels`.
     *
     * The catalogue is the manager's own, and it carries three things a bare
     * scan does not: a five-second cache, so a panel that re-reads on every
     * keystroke is not re-walking the disk each time; a record of which root the
     * current list came from, so a settings edit invalidates it; and the
     * capability overrides, which is what makes a user's "this model really can
     * see" correction survive into the list.
     *
     * This is the call the desktop application made too — `localModelsSnapshot`
     * in `local-models.ts` — and reaching past it to the scanner is what
     * produced the bug this file's `current()` comment describes: the folder was
     * reported empty while seven weights sat in it.
     */
    const found = await manager.catalog(root())
    ctx.logger.warn('aranllm-local: discover root=%s roots=%j found=%d', root(), roots, found.length)
    return { root: root(), roots, models: found, loaded: manager.describe(), progress: manager.progress }
  }

  const loadOptions = (input, model, remembered = {}) => ({
    binary: binary(),
    // Remembered beats the default; an explicit request beats both. `port: 0`
    // is llama.cpp's own "pick one for me" and stays a real value rather than
    // being treated as unset.
    port: Number.isFinite(input?.port) ? input.port : (remembered.port ?? rememberedPort),
    // The model's own trained context wins over the configured value: a 256K
    // model loaded at 128K silently truncates long conversations, while an
    // explicit request still overrides both.
    contextLength: Number.isFinite(input?.contextLength)
      ? input.contextLength
      : (remembered.contextLength ?? model?.contextLength ?? current().defaultContextLength),
    kvCacheType: input?.kvCacheType ?? remembered.kvCacheType ?? current().defaultKvCacheType,
    gpuLayers: Number.isFinite(input?.gpuLayers) ? input.gpuLayers : (remembered.gpuLayers ?? current().defaultGpuLayers),
    threads: Number.isFinite(input?.threads) ? input.threads : (remembered.threads ?? current().defaultThreads),
    batchSize: input?.batchSize ?? remembered.batchSize,
    ubatchSize: input?.ubatchSize ?? remembered.ubatchSize,
    flashAttention: input?.flashAttention ?? remembered.flashAttention ?? false,
    speculative: input?.speculative ?? remembered.speculative ?? { type: 'draft-mtp', nMax: 3 },
    defaultMaxTokens: input?.defaultMaxTokens,
    extraArgs: input?.extraArgs ?? remembered.extraArgs,
    apiKey: input?.apiKey,
    // Everything else the load dialog can express (mmap/mlock, overflow policy,
    // stop strings, seed, rope scaling, parallelism, draft weights) is normalized
    // into the shared option shape here, so the renderer and the argument builder
    // agree on exactly one vocabulary. Remembered values sit underneath this
    // request, so a re-load reproduces last session's tuning unless overridden.
    ...normalizeLoadOptions({ ...remembered, ...input?.load }, model),
  })

  ctx.connection.fetch.register({
    path: '/api/aranllm/models',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: json(discover),
  })

  ctx.connection.fetch.register({
    path: '/api/aranllm/models/load',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: json(async request => {
      const body = await request.json().catch(() => ({}))
      if (!body?.id) throw Object.assign(new Error('A model id is required.'), { status: 400, code: 'BAD_REQUEST' })
      const found = await scanModels(root())
      const model = found.find(entry => entry.id === body.id)
      if (!model) throw Object.assign(new Error(`Model not found on disk: ${body.id}`), { status: 404, code: 'MODEL_MISSING' })
      if (!binary()) throw Object.assign(new Error('Set the llama-server path in Settings > Plugins before loading a model.'), { status: 400, code: 'BINARY_MISSING' })

      // Resume whatever this model was last loaded with so the load dialog's
      // remembered fields survive across sessions and process restarts.
      const remembered = body.useRemembered === false ? {} : ((await store.get(model)) ?? {})
      const options = loadOptions(body, model, remembered)
      const loaded = await manager.load({ model, options })

      // Only a load that actually started the server is worth remembering: a
      // failed launch would otherwise overwrite good settings with bad ones.
      await store.set(model, options).catch(() => {})
      return { ok: true, loaded, remembered: await store.get(model) }
    }),
  })

  ctx.connection.fetch.register({
    path: '/api/aranllm/models/unload',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: json(async () => ({ ok: await manager.unload({ reason: 'user requested' }), loaded: manager.describe() })),
  })

  ctx.connection.fetch.register({
    path: '/api/aranllm/config',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: json(async request => {
      const id = new URL(request.url).searchParams.get('id')
      if (!id) throw Object.assign(new Error('A model id is required.'), { status: 400, code: 'BAD_REQUEST' })
      const found = await scanModels(root())
      const model = found.find(entry => entry.id === id)
      if (!model) throw Object.assign(new Error('Model not found on disk: ' + id), { status: 404, code: 'MODEL_MISSING' })
      return { ok: true, config: (await store.get(model)) ?? {}, file: store.file }
    }),
  })

  /*
   * These are read-only facts the desktop application served from its own
   * bridge (`models:parameters`, `models:library`). They are routes here for the
   * same reason as everything else in this block: the panel is a client plugin
   * and the only channel it has is same-origin HTTP.
   */
  ctx.connection.fetch.register({
    path: '/api/aranllm/parameters',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: json(async () => ({ groups: LOAD_PARAMETER_GROUPS })),
  })

  /*
   * Reveal the model folder in the host's file manager.
   *
   * Delegated to the host's own launcher rather than spawned here. It resolves
   * and verifies the application to run, and it is the same path the
   * open-in-app feature uses — so a file manager this host can offer elsewhere
   * is one this route can offer too, and one it refuses is refused for the same
   * reason rather than a second set of rules written here.
   */
  ctx.connection.fetch.register({
    path: '/api/aranllm/library/reveal',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: json(async () => {
      const folder = root()
      if (!folder) throw Object.assign(new Error('还没有设置模型目录。'), { status: 400, code: 'NO_ROOT' })
      const canOpen = await canOpenNativePath(folder).catch(() => false)
      if (!canOpen) {
        throw Object.assign(new Error(`无法打开这个目录：${folder}`), { status: 500, code: 'CANNOT_OPEN' })
      }
      await openNativePath(folder)
      return { ok: true, root: folder }
    }),
  })

  /*
   * Remove a model's weights.
   *
   * To the recycle bin, not unlinked, and then only if the file is inside a
   * configured root.
   *
   * The second rule is the one worth stating: the id arrives from the page, and
   * `find` resolves it against a fresh scan — so the path being deleted is one
   * this process just read, not one the caller supplied. The prefix check is
   * what keeps a symlinked root or a re-pointed `modelsRoot` between the two
   * reads from turning that into a delete anywhere.
   *
   * Reaching the bin rather than unlinking is the difference between a mistake
   * and a disaster at this size: the weights that get deleted by accident are
   * measured in gigabytes and take hours to fetch again.
   */
  ctx.connection.fetch.register({
    path: '/api/aranllm/models/remove',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: json(async request => {
      const body = await request.json().catch(() => ({}))
      const id = typeof body?.id === 'string' ? body.id : ''
      if (!id) throw Object.assign(new Error('模型标识无效。'), { status: 400, code: 'BAD_REQUEST' })

      const found = await manager.catalog(root(), { maxAgeMs: 0 })
      const model = found.find(entry => entry.id === id)
      if (!model) throw Object.assign(new Error('这个模型不在当前目录里，可能已被移动或删除。'), { status: 404, code: 'MODEL_MISSING' })

      const roots = parseModelRoots(root())
      const inside = roots.some(entry => model.path.startsWith(entry.replace(/[\\/]+$/, '') + sep))
      if (!inside) throw Object.assign(new Error('模型文件不在已配置的目录里，已拒绝删除。'), { status: 403, code: 'OUTSIDE_ROOT' })

      const stats = statSync(model.path, { throwIfNoEntry: false })
      if (stats === undefined) throw Object.assign(new Error('文件已经不在了。'), { status: 404, code: 'GONE' })
      /*
       * A directory would be trashed whole, taking whatever else is in it. The
       * scan returns files, so reaching here means the path changed shape
       * between the read and the delete — which is exactly when to stop.
       */
      if (!stats.isFile()) throw Object.assign(new Error('目标不是一个文件，已拒绝删除。'), { status: 400, code: 'NOT_A_FILE' })

      /*
       * Moved aside rather than deleted.
       *
       * The desktop build called `shell.trashItem`, which is a different animal
       * on each platform and is not reachable from this process — the host
       * exposes a launcher, not a file manager's recycle API. Moving the file
       * into a folder the application owns reaches the same end by a route that
       * behaves identically everywhere, and it keeps the property that matters:
       * the weights are still on disk, so a deletion nobody meant is undoable
       * without fetching fourteen gigabytes again.
       *
       * The name is prefixed with the time so a second copy of the same model
       * does not overwrite the first one's file.
       */
      const trash = join(defaultDataDir(), '.trash')
      await mkdir(trash, { recursive: true })
      await rename(model.path, join(trash, `${String(Date.now())}-${basename(model.path)}`))
      // The catalogue holds the removed model until it is told otherwise, and a
      // cached five-second list would show a file that has already been moved.
      manager.invalidateCatalog?.()
      return { ok: true, path: model.path, movedTo: trash }
    }),
  })

  ctx.connection.fetch.register({
    path: '/api/aranllm/library',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: json(async () => ({ root: root(), roots: parseModelRoots(root()) })),
  })

  ctx.connection.fetch.register({
    path: '/api/aranllm/library/set',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: json(async request => {
      const body = await request.json().catch(() => ({}))
      const next = String(body?.root ?? '').trim()
      /*
       * Stored the way this host stores plugin state, not in memory.
       *
       * The desktop build called `writeSetting('modelRoot', …)` into its own
       * file. There is no such file here, and the `Config` schema is the wrong
       * place: its fields are read from the profile patch the settings form
       * writes, so writing one from code would fight the form rather than feed
       * it. The credential store is the host's durable key-value record and is
       * what every other plugin uses for exactly this.
       */
      await ctx.credentials.modifyRecord(LIBRARY_KEY, async record => ({
        kind: 'grant',
        payload: { ...(record?.kind === 'grant' ? record.payload : {}), modelsRoot: next },
      }))
      /*
       * And through the manager, because the catalogue is keyed by the root it
       * came from: pointing it here is what makes the next read a scan of the
       * new folder rather than a cached list of the old one.
       */
      manager.modelRoot = next
      manager.invalidateCatalog?.()
      ctx.logger.warn('aranllm-local: model folder set to %j', next)
      return { ok: true, root: next }
    }),
  })

  ctx.connection.fetch.register({
    path: '/api/aranllm/config/set',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: json(async request => {
      const body = await request.json().catch(() => ({}))
      if (!body?.id) throw Object.assign(new Error('A model id is required.'), { status: 400, code: 'BAD_REQUEST' })
      const found = await scanModels(root())
      const model = found.find(entry => entry.id === body.id)
      if (!model) throw Object.assign(new Error('Model not found on disk: ' + body.id), { status: 404, code: 'MODEL_MISSING' })
      /*
       * A patch rather than a whole record.
       *
       * The panel edits one field at a time — a load parameter, or one of the
       * three capability switches — and the record it is editing also holds the
       * others. Sending the whole object back would mean the panel had to
       * restate values it never showed, and a field added by a later version
       * would be dropped the first time an older panel saved anything.
       *
       * `patch` is dropped rather than stored. It is the renderer's marker for
       * "merge this", carried over from the bridge this route replaces, where
       * the same call could mean replace or merge. Merging is the only thing
       * this route does, so keeping the flag would write a field named `patch`
       * into the record — and the next read would hand it back to the panel as
       * if it were a load option.
       */
      const { patch: _merge, ...changes } = body.changes ?? body.config ?? {}
      return { ok: true, config: await store.patch(model, changes) }
    }),
  })

  ctx.connection.fetch.register({
    path: '/api/aranllm/config/reset',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: json(async request => {
      const body = await request.json().catch(() => ({}))
      if (!body?.id) throw Object.assign(new Error('A model id is required.'), { status: 400, code: 'BAD_REQUEST' })
      const found = await scanModels(root())
      const model = found.find(entry => entry.id === body.id)
      if (!model) throw Object.assign(new Error('Model not found on disk: ' + body.id), { status: 404, code: 'MODEL_MISSING' })
      return { ok: true, removed: await store.remove(model) }
    }),
  })

  /*
   * The port the model server listens on.
   *
   * Read from the running server rather than from the setting, because those
   * two disagree in the window that matters: a load in flight has bound its
   * port and the setting still names the previous one. What the panel shows is
   * the address something can actually be pointed at.
   *
   * Writing it takes effect on the next load. The running server cannot be
   * moved — llama.cpp binds once — so re-porting a loaded model means unloading
   * it, and the panel says so rather than appearing to succeed.
   */
  ctx.connection.fetch.register({
    path: '/api/aranllm/port',
    methods: ['GET', 'POST'],
    requestBody: 'buffered',
    fetch: json(async request => {
      if (request.method === 'GET') {
        const described = manager.describe()
        return { port: described?.port ?? DEFAULT_SERVER_PORT, running: described?.port !== undefined }
      }
      const body = await request.json().catch(() => ({}))
      const next = Number(body?.port)
      if (!Number.isInteger(next) || next < 1 || next > 65535) {
        throw Object.assign(new Error('端口必须是 1 到 65535 之间的整数。'), { status: 400, code: 'BAD_PORT' })
      }
      if (manager.describe()?.port !== undefined) {
        throw Object.assign(new Error('模型正在运行，先卸载才能改端口。'), { status: 409, code: 'BUSY' })
      }
      await ctx.credentials.modifyRecord(LIBRARY_KEY, async record => ({
        kind: 'grant',
        payload: { ...(record?.kind === 'grant' ? record.payload : {}), port: next },
      }))
      rememberedPort = next
      return { ok: true, port: next }
    }),
  })

  ctx.connection.fetch.register({
    path: '/api/aranllm/models/status',
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: json(async () => ({ loaded: manager.describe(), progress: manager.progress, active: manager.active })),
  })

  /*
   * A settings edit landed.
   *
   * `config` is refreshed in place before this fires, so `live()` already reads
   * the new values — what this does is apply the ones that are not read per call
   * (the model root the manager holds, and the language the adapter renders).
   * Reading on every use covers the rest.
   *
   * Wrapped because a bad value here must not take the plugin down: the fields
   * are validated by the schema, so the realistic failure is a path that does
   * not exist yet, and the next scan reports that on its own.
   */
  ctx.on?.('loader/volatile-update', () => {
    try {
      root()
      manager.language = ctx.settings?.get?.('locale')?.preference === 'en' ? 'en' : 'zh'
    } catch (error) {
      ctx.logger?.warn?.('aranllm-local: a settings change could not be applied')
      ctx.logger?.warn?.(error)
    }
  })

  /*
   * The routes are registered; say so, once.
   *
   * A registration that silently did nothing is indistinguishable from one that
   * worked, and the symptom — `Request with GET/HEAD method cannot have body`,
   * from the connection bridge — points at the *transport* rather than at the
   * registration that was supposed to feed it. One line naming the paths makes
   * the next failure say which side it is on.
   */
  return () => {
    manager.detach()
    return manager.shutdown()
  }
}

