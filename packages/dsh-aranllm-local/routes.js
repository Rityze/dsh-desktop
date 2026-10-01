/**
 * The HTTP surface over the copied modules.
 *
 * ## What this is, and what it deliberately is not
 *
 * Everything under `compat/` is the desktop application's own source, moved
 * here unchanged apart from two import lines. The functions it exports are the
 * feature — the scanner, the loader, the download queue, the hub client — and
 * none of them was rewritten.
 *
 * What was missing is a transport. That application called them from
 * `ipcMain.handle`, one channel per function; this host has no IPC, and the page
 * reaches it over same-origin HTTP. So this file is a list of mappings and
 * nothing else: a path, a method, and a call. There is no logic here to get
 * wrong, which is the point — every behaviour lives in the code that was already
 * written and tested.
 *
 * ## Why the parameter names match the callers
 *
 * Each handler reads the fields the old channel read, so the page's calls need
 * no translation either. `models:loadLocal` took a model id as its argument and
 * so does `/api/aranllm/models/load`.
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { json } from './compat/http.js'
import { estimateLoad, kvGeometry } from './memory-estimate.js'
import { readGgufHeader } from './lib/gguf.js'

/**
 * Register every route.
 *
 * @param {object} ctx - the plugin context.
 * @param {object} modules - the loaded `compat/` modules, keyed by short name.
 * @param {object} [hooks] - the plugin's own callbacks.
 * @param {() => Promise<void>} [hooks.refreshEngineOverrides] - re-read the
 *   per-model store and re-announce the catalogue. The desktop application did
 *   the equivalent by restarting its kernel after the same writes; see the
 *   comment on it in `index.js` for why this port invalidates instead.
 * @returns {() => void} a disposer removing every registration.
 */
export function registerRoutes(ctx, modules, hooks = {}) {
  const disposers = []
  const refreshEngineOverrides = hooks.refreshEngineOverrides ?? (async () => {})

  /**
   * One route.
   *
   * `requestBody: 'buffered'` throughout, including the GETs. That is not a
   * default being accepted — it is the only value this connection's bridge
   * handles without attaching a body, and an unrecognised value makes a GET
   * fail with `Request with GET/HEAD method cannot have body`, which reads as a
   * transport problem rather than the misconfiguration it is.
   */
  const route = (path, methods, handler) => {
    disposers.push(
      ctx.connection.fetch.register({
        path: `/api/aranllm${path}`,
        methods,
        requestBody: 'buffered',
        fetch: json(handler),
      }),
    )
  }

  /** The JSON body of a POST, or an empty object. */
  const body = async (request) => {
    try {
      return (await request.json()) ?? {}
    } catch {
      return {}
    }
  }

  const local = modules.local
  const files = modules.files
  const hub = modules.hub
  const download = modules.download
  const library = modules.library
  const network = modules.network

  /* ── Models ──────────────────────────────────────────────────────────── */

  route('/models', ['GET'], () => local.localModelsSnapshot())
  route('/models/entries', ['GET'], () => local.localModelEntries())
  route('/models/status', ['GET'], async () => ({
    loaded: local.loadedLocalModel(),
    stats: await local.localServerStats(),
  }))
  /*
   * Loading and unloading, with the engine told afterwards.
   *
   * ## The half that was missing
   *
   * The desktop application called these from `ipcMain.handle`, and every one of
   * those handlers did something this file did not: it followed the call with
   * `syncLocalModelToEngine()`, which was a kernel restart there. The page still
   * worked without it — models loaded, tokens streamed — so the omission was
   * invisible from the panel and only showed up in the chat surface, where the
   * model was not offered.
   *
   * The host here does not restart anything for this. Its adapter re-reads the
   * agent definition per request, so what the sync has to do is invalidate what
   * the manager cached — the model's own tuning, which feeds the request's
   * temperature and thinking budget. `local.refreshEngineOverrides` is that, and
   * it is called after anything that could change a stored value.
   */
  route('/models/load', ['POST'], async (request) => {
    const input = await body(request)
    if (typeof input.id !== 'string' || input.id.length === 0) {
      return { ok: false, error: '模型标识无效。' }
    }
    const result = await local.loadLocalModel(input.id)
    if (result.ok) void refreshEngineOverrides()
    return result
  })
  route('/models/unload', ['POST'], async () => {
    const stopped = await local.unloadLocalModel()
    // After the unload, so nothing the engine reads still carries a gateway
    // pointing at a port whose process has just exited.
    void refreshEngineOverrides()
    return stopped
  })
  route('/models/remove', ['POST'], async (request) => {
    const input = await body(request)
    if (typeof input.id !== 'string') return { ok: false, error: '模型标识无效。' }
    return files.removeModelFile(input.id)
  })
  /*
   * Importing a .gguf that is already on the machine.
   *
   * ## What changed from the desktop version, and why
   *
   * That one opened an OS file chooser and copied whatever came back. The host
   * here has a directory picker, not a file picker — it exists for "choose your
   * workspace", and the copy behind it branches on can-select-files only in the
   * macOS script. So the pick is a **folder**, and the .gguf is found inside it:
   *
   *   - the folder holds exactly one .gguf  → that is the file;
   *   - it holds several                  → the one whose name matches the
   *                                          model the user typed, else the
   *                                          first, and the answer says which.
   *
   * A user importing a model has just downloaded it, and a download lands in a
   * folder with the model in it. Asking for the folder rather than the file is
   * one extra click in the common case and the only workable one here.
   */
  route('/models/import', ['POST'], async (request) => {
    const input = await body(request)
    const roots = local.currentModelRoots()
    const root = roots[0]
    if (root === undefined) {
      throw Object.assign(new Error('还没有设置模型库目录。'), { status: 400, code: 'NO_ROOT' })
    }

    let source = typeof input.sourcePath === 'string' ? input.sourcePath.trim() : ''
    if (source.length === 0) {
      const picked = await pickDirectory(ctx, { title: '选择包含 .gguf 的文件夹' })
      if (picked === null) return { ok: false, cancelled: true }
      const found = findGguf(picked, input.modelName)
      if (found === undefined) {
        throw Object.assign(new Error(`这个文件夹里没有 .gguf 文件：${picked}`), {
          status: 400,
          code: 'NO_GGUF',
        })
      }
      source = found
    }

    const answer = await modules.importModel.importModelFile({
      sourcePath: source,
      libraryRoot: root,
      ...(typeof input.modelName === 'string' && input.modelName.length > 0
        ? { modelName: input.modelName }
        : {}),
    })
    /*
     * The catalogue is cached, so a file copied in is invisible until it is
     * invalidated — and an import that does not appear reads as a failure.
     */
    if (answer.ok) local.invalidateModelIndex()
    return answer
  })
  route('/models/summaries', ['GET'], () => files.modelSummaries())
  route('/models/export', ['POST'], async (request) => {
    const input = await body(request)
    return input.format === 'json' ? files.modelsToJson(await files.modelSummaries()) : files.modelsToMarkdown(await files.modelSummaries())
  })

  /* ── Configuration ───────────────────────────────────────────────────── */

  /*
   * The three config routes, each answering with the function's own result.
   *
   * ## Why nothing is constructed here
   *
   * `setLocalModelConfig` answers `{ ok: true, value }` on success and
   * `{ ok: false, error }` on failure, and the panel reads `result.value` back
   * into its draft — that is how a save normalises the form to what was actually
   * stored. An earlier version of this file returned `{ ok: true }` alone, and
   * the panel took the missing field as the new draft: `setDraft(undefined)`,
   * then `draft.contextLength` on the next render, and the settings page went
   * white. Reported as "saving a model setting blanks the screen".
   *
   * So the rule this file follows everywhere is the one it broke here: forward
   * what the function returned. A hand-written envelope is a second, silently
   * different contract for the same call.
   */
  route('/config', ['GET'], async (request) => {
    const id = new URL(request.url).searchParams.get('id') ?? ''
    return { ok: true, value: await local.localModelConfig(id) }
  })
  route('/config/set', ['POST'], async (request) => {
    const input = await body(request)
    const result = await local.setLocalModelConfig(input.id, input.values ?? {})
    /*
     * The sync, after the one write that most needs it.
     *
     * `temperature` is in this payload and it does not reach a request the way
     * the other fields do — they are launch flags the next load reads, while this
     * one goes through the model's agent definition. Saving it without telling
     * the engine leaves a number that is stored, displayed, and ignored, which is
     * the shape of "the thinking level has no effect".
     */
    if (result.ok) void refreshEngineOverrides()
    return result
  })
  route('/config/reset', ['POST'], async (request) => {
    const input = await body(request)
    const result = await local.setLocalModelConfig(input.id, {})
    if (result.ok) void refreshEngineOverrides()
    return result
  })
  /*
   * The parameter form's field list, wrapped.
   *
   * The function answers with the array itself; the panel reads `next.groups`.
   * That mismatch is invisible in the type system — both sides are plain JSON —
   * and it showed up as a panel that opened and drew nothing. So the array is
   * wrapped here rather than the reader changed: `groups` is also what the
   * shapes around it use, and a route that answers with a bare array is one that
   * cannot grow a sibling field later without breaking every caller.
   */
  route('/parameters', ['GET'], () => ({ groups: local.localParameterGroups() }))

  /* ── Library and port ────────────────────────────────────────────────── */

  route('/library', ['GET'], () => ({
    root: local.currentModelRoots()[0] ?? '',
    roots: local.currentModelRoots(),
    dataDir: local.localModelsDataDir(),
  }))
  /*
   * Setting the search root, answering with the rescan.
   *
   * The desktop version re-read the catalogue rather than only storing the path,
   * and the reason is visible on screen: the page shows what was discovered, so
   * a root that was accepted but not scanned would leave the previous folder's
   * models listed with no sign the change had taken. The panel reads the answer
   * straight into its snapshot, so the shape is `{ ok, value }` and not a bare
   * object.
   */
  route('/library/set', ['POST'], async (request) => {
    const input = await body(request)
    if (typeof input.root !== 'string' || input.root.trim().length === 0) {
      return { ok: false, error: '目录无效。' }
    }
    local.setLocalModelRoot(input.root.trim())
    return { ok: true, value: await local.localModelsSnapshot() }
  })
  route('/port', ['GET'], () => ({ port: local.localPort() }))
  route('/port/set', ['POST'], async (request) => {
    const input = await body(request)
    const result = local.setLocalPort(Number(input.port))
    if (result.ok) void refreshEngineOverrides()
    return result
  })

  /*
   * What the running server reports about itself, and what llama.cpp projected
   * for device memory.
   *
   * Both are read from llama.cpp's own output rather than estimated here — the
   * stats from its `/metrics`, the projection from its load log, where its
   * fitter has already worked out the tensor layout and what the backend has
   * free. An estimate computed in this process would disagree with the engine
   * about a machine the engine is the one running on.
   */
  route('/stats', ['GET'], () => local.localServerStats())

  /*
   * What a load would cost, for parameters that have not been applied yet.
   *
   * Read from the file each call rather than cached: the answer depends on the
   * parameters the panel currently has in its draft, so a cached figure would be
   * the figure for the last question rather than this one.
   */
  route('/estimate', ['POST'], async (request) => {
    const input = await body(request)
    const found = await local.localModelEntries()
    const entry = found.find((model) => model.id === input.id)
    if (!entry) {
      throw Object.assign(new Error('这个模型不在当前目录里。'), { status: 404, code: 'MODEL_MISSING' })
    }
    const header = await readGgufHeader(entry.path)
    const geometry = kvGeometry(header?.metadata)
    const answer = estimateLoad(geometry, {
      fileBytes: entry.bytes,
      contextLength: input.contextLength,
      kvCacheType: input.kvCacheType ?? 'f16',
      gpuLayers: input.gpuLayers,
      batchSize: input.batchSize,
      flashAttention: input.flashAttention === true,
    })
    return { ...answer, geometry }
  })
  route('/memory', ['GET'], () => files.readMemoryProjection())

  /* ── Moving the library ──────────────────────────────────────────────── */

  /*
   * Moving the model folder, asked about before it is done.
   *
   * The preview is what makes the question answerable: "move 8 files (13.4 GB)?"
   * rather than "keep them?". A move of this size is minutes of disk work and
   * the numbers are the only thing that tells a user whether that is the right
   * afternoon for it.
   */
  route('/library/preview', ['POST'], async (request) => {
    const input = await body(request)
    const roots = local.currentModelRoots()
    return library.previewMove(roots[0] ?? '', String(input.to ?? ''), roots.slice(1))
  })
  route('/library/move', ['POST'], async (request) => {
    const input = await body(request)
    return library.startMove({
      to: String(input.to ?? ''),
      keepOld: input.keepOld === true,
      /*
       * The move re-points the library when it finishes, and it does so through
       * the same setter the settings form uses. Handing it the function rather
       * than letting it write its own state is what keeps one definition of
       * where the models are.
       */
      setRoot: (next) => local.setLocalModelRoot(next),
      currentRoots: () => local.currentModelRoots(),
    })
  })
  route('/library/move-state', ['GET'], () => library.moveState())
  route('/library/bundled', ['GET'], () => ({ path: library.bundledLibrary() }))

  /*
   * The folder picker, answered by the host.
   *
   * `null` for a cancelled dialog rather than an error: the user closing it is
   * a decision, and the panel distinguishes that from a failure to open by
   * exactly this value.
   */
  route('/library/pick', ['POST'], async (request) => {
    const input = await body(request)
    if (typeof ctx.directoryPicker?.pick !== 'function') return { path: null }
    const chosen = await ctx.directoryPicker.pick({
      title: '选择模型库文件夹',
      ...(typeof input.start === 'string' && input.start.length > 0
        ? { start: input.start }
        : {}),
    })
    return { path: typeof chosen === 'string' && chosen.length > 0 ? chosen : null }
  })

  /*
   * The tail of the local-model log.
   *
   * The component renders it as an array of lines, and the reader here keeps
   * that shape rather than wrapping it — the panel maps over the result
   * directly.
   */
  route('/log', ['GET'], async (request) => {
    const asked = Number(new URL(request.url).searchParams.get('lines'))
    const lines = Number.isFinite(asked) && asked > 0 ? Math.min(asked, 1000) : 200
    return files.readLocalLog(lines)
  })

  /* ── The model hub ───────────────────────────────────────────────────── */

  /*
   * Search, browse and download, with the desktop's two event streams turned
   * into reads.
   *
   * Its own channels pushed progress: the main process knew when a byte arrived
   * and sent a message, so a page never had to ask. There is no such channel
   * here — the page talks to this process over HTTP and this process cannot call
   * into it — so progress is read instead of delivered, and the client polls.
   *
   * That is a real difference and it is worth naming rather than hiding. A
   * transfer changes several times a second and a poll at that rate is one
   * request per tick per open page, which is what the desktop note argues
   * against; the alternative is a stream, and a stream is what a later change
   * should use. Polling is what makes this correct today without inventing a
   * protocol the rest of the page does not speak.
   *
   * The state is the copied module's own, so a poll reads the same object its
   * listener would have been handed. The numbers cannot disagree.
   *
   * ## The names are the module's, not the channel's
   *
   * The desktop called these `hub:search`, `hub:files`, `hub:sources` — channel
   * names it chose. The module behind them exports `searchRepos`, `listFiles`
   * and `hubSources`, and the two sets are not the same words. Using the
   * channel's spelling here produced `hub.searchHub is not a function` on every
   * request, which the page reports as "cannot reach the main process" and
   * sends the reader looking in the wrong place entirely.
   */
  route('/hub/search', ['POST'], async (request) => {
    const input = await body(request)
    return hub.searchRepos(input.query ?? {}, request.signal)
  })
  route('/hub/files', ['POST'], async (request) => {
    const input = await body(request)
    return hub.listFiles(input.repoId ?? '', request.signal)
  })
  route('/hub/sources', ['GET'], () => ({
    sources: hub.hubSources(),
    current: hub.hubSource(),
  }))
  route('/hub/source', ['POST'], async (request) => {
    const input = await body(request)
    return hub.setHubSource(input.id)
  })
  route('/hub/proxy', ['GET'], () => ({
    settings: network.readProxy(),
    modes: network.PROXY_MODES,
  }))
  route('/hub/proxy/set', ['POST'], async (request) => {
    const input = await body(request)
    return network.writeProxy({
      mode: input.mode,
      ...(typeof input.url === 'string' ? { url: input.url } : {}),
    })
  })
  route('/hub/test', ['POST'], () => network.testConnection())

  /* ── Downloads ───────────────────────────────────────────────────────── */

  route('/download/start', ['POST'], async (request) => {
    const input = await body(request)
    return download.startDownload(input)
  })
  route('/download/cancel', ['POST'], async (request) => {
    const input = await body(request)
    return download.cancelDownload(input.id)
  })
  /** The read that replaces the desktop's progress event. */
  route('/download/state', ['GET'], () => download.downloadState())

  route('/queue', ['GET'], () => download.queueState())
  route('/queue/enqueue', ['POST'], async (request) => {
    const input = await body(request)
    const items = Array.isArray(input.items) ? input.items : []
    /*
     * An empty list is answered rather than refused, matching the desktop
     * channel: the page calls this after a selection, and a selection that
     * turned out to hold nothing is not an error.
     */
    return items.length === 0 ? download.queueState() : download.enqueue(items)
  })
  route('/queue/stop', ['POST'], () => download.stopQueue())
  route('/queue/clear', ['POST'], () => download.clearQueueHistory())

  /*
   * Pause, resume, and forget one entry.
   *
   * Three operations the desktop application did not have, added because a
   * download is measured in hours and a queue that cannot be stopped without
   * being emptied is one a user has to finish in a single sitting.
   *
   * `pause` and `stop` are deliberately different. `stop` empties the pending
   * list — "cancel what is waiting" — while `pause` keeps it and halts between
   * files. After a restore the entries are the whole point, so a stop that
   * dropped them would destroy the thing the restore exists to keep.
   */
  route('/queue/pause', ['POST'], () => download.pauseQueue())
  route('/queue/resume', ['POST'], () => download.resumeQueue())
  route('/queue/remove', ['POST'], async (request) => {
    const input = await body(request)
    if (typeof input.repoId !== 'string' || typeof input.file !== 'string') {
      return download.queueState()
    }
    return download.removeQueueItem(input.repoId, input.file)
  })

  route('/downloads', ['GET'], () => download.listDownloads())
  route('/downloads/clear', ['POST'], () => download.clearDownloads())

  /* ── Settings backup, identity, startup ──────────────────────────────── */

  route('/settings/export', ['POST'], () => modules.backup.exportSettings())
  route('/settings/import', ['POST'], () => modules.backup.importSettings())
  route('/sysinfo', ['GET'], () => modules.sysinfo.sysinfo())
  route('/launch-at-login', ['GET'], () => modules.launchAtLogin.launchAtLogin())
  route('/launch-at-login/set', ['POST'], async (request) => {
    const input = await body(request)
    return modules.launchAtLogin.setLaunchAtLogin(input.enabled === true)
  })

  /* ── The OpenAI-compatible gateway ───────────────────────────────────── */

  /*
   * The gateway's state and its one write.
   *
   * Started and stopped by the same call that sets its port, host and key,
   * because those are the same decision: a server whose address changed is a
   * server that has to be rebound anyway. Splitting them would allow a state the
   * panel could not describe — running on a port it is not configured for.
   *
   * `enabled` is what the Start/Stop control sets. Everything else is a field of
   * the same form, and a save with `enabled: true` is a start.
   */
  route('/gateway/status', ['GET'], () => modules.service.apiServiceState())
  route('/gateway/apply', ['POST'], async (request) => {
    const input = await body(request)
    return modules.service.applyApiService({
      enabled: input.enabled === true,
      // A port the OS reserves is not one a client can be pointed at; anything
      // outside the range is refused rather than clamped, so a typo is visible.
      ...(Number.isInteger(input.port) && input.port >= 1024 && input.port <= 65535
        ? { port: input.port }
        : {}),
      // Two values, and the second is a deliberate choice. A default of
      // `0.0.0.0` would publish the user's models to their network.
      ...(input.host === '0.0.0.0' ? { host: '0.0.0.0' } : { host: '127.0.0.1' }),
      ...(typeof input.apiKey === 'string' ? { apiKey: input.apiKey } : {}),
      ...(input.cors === true ? { cors: true } : {}),
    })
  })
  route('/gateway/stop', ['POST'], async () => {
    await modules.service.stopApiService()
    return modules.service.apiServiceState()
  })
  route('/gateway/log', ['GET'], () => ({
    entries: modules.apiLog.apiLog(),
    totals: modules.apiLog.apiLogTotals(),
  }))
  route('/gateway/log/clear', ['POST'], () => {
    modules.apiLog.clearApiLog()
    return { ok: true }
  })

  /*
   * Returning the disposers rather than owning the lifecycle: the plugin's own
   * `apply` decides when routes come down, and it already has an effect for it.
   * Handing back the list keeps this file free of any assumption about that.
   */
  return () => {
    for (const dispose of disposers) dispose?.()
  }
}

/**
 * Ask the host for a folder, or answer null when the picker cannot run.
 *
 * The capability is optional: a deployment may ship without one, and the seam's
 * own guidance is to hide the affordance rather than fail — a picker that throws
 * on a host that has none is a button that reports a fault the user cannot act
 * on. `null` is the same value a cancelled dialog produces, which is why the
 * caller treats "no picker" and "changed my mind" alike.
 */
async function pickDirectory(ctx, options) {
  const picker = ctx.directoryPicker
  if (picker === undefined) return null
  const capability = typeof picker.capability === 'function' ? picker.capability() : picker
  const choose = capability?.choose ?? capability?.pick ?? capability?.select
  if (typeof choose !== 'function') return null
  try {
    const chosen = await choose.call(capability, options)
    return typeof chosen === 'string' && chosen.length > 0 ? chosen : null
  } catch {
    return null
  }
}

/**
 * The .gguf to import from a folder.
 *
 * One file is the answer. Several is the case worth naming: a user who pointed
 * at their downloads folder may have half a dozen, and picking silently would
 * copy a model they did not mean while telling them the import succeeded. The
 * typed name narrows it when there is one — that is what the field is for — and
 * otherwise the first in name order wins, which is at least stable across runs.
 */
function findGguf(directory, wanted) {
  let entries = []
  try {
    entries = readdirSync(directory).filter((name) => name.toLowerCase().endsWith('.gguf'))
  } catch {
    return undefined
  }
  if (entries.length === 0) return undefined
  const named = entries.sort((a, b) => a.localeCompare(b))
  const hint = typeof wanted === 'string' ? wanted.trim().toLowerCase() : ''
  const preferred =
    hint.length > 0 ? named.find((name) => name.toLowerCase().includes(hint)) : undefined
  return join(directory, preferred ?? named[0])
}
