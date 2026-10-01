/**
 * The desktop application's bridge, backed by this host's routes.
 *
 * ## Why this exists at all
 *
 * `LocalModels.tsx`, `ParameterPanel.tsx` and `ParameterField.tsx` are moved
 * here **verbatim** — not a line of their layout, styling or logic is changed.
 * What they call is `bridge.models.*`, an object the old preload script built
 * over IPC. This host has no IPC, so that object is built here instead, over
 * same-origin `fetch`.
 *
 * The value of doing it this way is that the three components stay diffable
 * against their originals. Rewriting them against a new API would have meant
 * re-deciding every one of their behaviours, and — measured twice already in
 * this port — the rewrites are where the layout drifts and the fields go
 * missing.
 *
 * ## Why some methods reshape the answer
 *
 * The routes answer with what the host functions return; the components expect
 * what the old channels returned, and in three places those differ:
 *
 *   - `port()`   — a route answers `{ port }` because a body is always JSON;
 *                  the component reads a number.
 *   - `library()`— the route reports the roots and the data directory; the
 *                  component reads `{ roots, bundled }`.
 *   - `log()`    — same reason as `port`.
 *
 * Reshaping here rather than changing the components is the whole point: one
 * small function per difference, in a file nobody else has to read.
 */

/** A GET, parsed as JSON, with the route's `error` field turned into a throw. */
async function get(path) {
  const response = await fetch(path)
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(body?.error ?? `本地模型接口返回 ${response.status}。`)
  return body
}

/** A POST with a JSON body, under the same error rule. */
async function post(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(body?.error ?? `本地模型接口返回 ${response.status}。`)
  return body
}

/** How often a subscribed route is read. See the note on `subscribe`. */
const POLL_MS = 400

/** The running polls, by route. */
const subscriptions = new Map()

/**
 * One polling loop per route, shared by every listener on it.
 *
 * ## Why the loop is shared rather than per-subscriber
 *
 * A page can have a download panel and a queue panel open on the same route, and
 * each would otherwise run its own timer against the same endpoint — two
 * requests where one would do, at a rate chosen to be tolerable for one. The map
 * keyed by path is what makes "the last subscriber leaving" a meaningful moment:
 * the loop stops then, so a page with nothing open is silent.
 *
 * ## Why the previous value is compared before delivery
 *
 * The state object is rebuilt on every read, so an equality check on identity
 * would fire every tick and re-render a panel with nothing new to show. The
 * first delivery arrives on the next tick rather than immediately, which is what
 * the desktop's own registration did too.
 *
 * @param {string} path - the route to read.
 * @param {(value: unknown) => void} listener - called with each new value.
 * @returns {() => void} stops this listener, and the loop when it is the last.
 */
function subscribe(path, listener) {
  let entry = subscriptions.get(path)
  if (entry === undefined) {
    entry = { listeners: new Set(), last: undefined, timer: undefined }
    subscriptions.set(path, entry)

    const tick = async () => {
      try {
        const value = await get(path)
        const serialised = JSON.stringify(value)
        if (serialised !== entry.last) {
          entry.last = serialised
          /*
           * Copied before iterating: a listener that unsubscribes itself — the
           * ordinary case for a component unmounting on the value it just
           * received — would otherwise mutate the set mid-iteration.
           */
          for (const receiver of [...entry.listeners]) {
            try {
              receiver(value)
            } catch {
              /* One broken listener must not stop the others. */
            }
          }
        }
      } catch {
        /* A route that is briefly unavailable is not a reason to stop polling. */
      }
      if (entry.listeners.size > 0) entry.timer = setTimeout(tick, POLL_MS)
      else subscriptions.delete(path)
    }

    entry.timer = setTimeout(tick, POLL_MS)
  }

  entry.listeners.add(listener)
  return () => {
    const current = subscriptions.get(path)
    if (current === undefined) return
    current.listeners.delete(listener)
    if (current.listeners.size === 0) {
      clearTimeout(current.timer)
      subscriptions.delete(path)
    }
  }
}


/**
 * The bridge, in the shape the copied components call it.
 *
 * Names and signatures match `src/renderer/lib/bridge.ts` exactly, so the only
 * edit to those files is the import path.
 */
export function createBridge(writeClipboard) {
  return {
    models: {
      /* ── Scanning and loading ────────────────────────────────────────── */

      /** The whole page's data: the roots, the models, what is loaded, progress. */
      localCatalog: () => get('/api/aranllm/models'),

      /** The running model as an endpoint, or null. The picker reads this. */
      localSource: async () => {
        const status = await get('/api/aranllm/models/status')
        const loaded = status?.loaded
        if (!loaded) return null
        return {
          providerID: 'aranllm-local',
          modelID: loaded.modelId,
          name: loaded.modelName,
          baseURL: loaded.baseURL,
        }
      },

      loadLocal: (modelId) => post('/api/aranllm/models/load', { id: modelId }),

      /*
       * A boolean, because that is what the component reads.
       *
       * The route answers with the host function's result, which is the same
       * boolean — but a route can only answer JSON, so this is where "it was a
       * body, now it is a value" gets undone.
       */
      unloadLocal: async () => {
        const answer = await post('/api/aranllm/models/unload', {})
        return answer === true || answer?.ok === true
      },

      /* ── The library on disk ─────────────────────────────────────────── */

      /** `{ roots, bundled }`: where models are read from, and the shipped folder. */
      library: async () => {
        const answer = await get('/api/aranllm/library')
        let bundled = ''
        try {
          bundled = (await get('/api/aranllm/library/bundled'))?.path ?? ''
        } catch {
          /* A build with no shipped folder is ordinary, not a failure. */
        }
        return { roots: answer?.roots ?? [], bundled }
      },

      setLocalRoot: (root) => post('/api/aranllm/library/set', { root }),

      /**
       * The native folder picker.
       *
       * Not a route: the host owns the picker, and the component expects this to
       * return a path or undefined for a cancelled dialog. `undefined` rather
       * than an error is what tells the panel apart "the user changed their
       * mind" from "the dialog could not open".
       */
      chooseDirectory: async (start) => {
        const answer = await post('/api/aranllm/library/pick', { start })
        return answer?.path ?? undefined
      },

      previewMove: (to) => post('/api/aranllm/library/preview', { to }),
      moveLibrary: (to, keepOld) => post('/api/aranllm/library/move', { to, keepOld }),
      moveState: () => get('/api/aranllm/library/move-state'),

      /* ── Per-model settings ──────────────────────────────────────────── */

      /*
       * The stored tuning, as the record itself.
       *
       * The route answers `{ ok, value }` — the same envelope the desktop
       * application's `models:localConfig` answered — and the component reads
       * the record straight out of it. This is the whole job of this file: the
       * routes answer in the shape the *old* bridge used, and anything that
       * differs is reconciled on this line rather than in the route, so the
       * copied components stay byte-identical to their source.
       */
      localConfig: async (modelId) =>
        (await get(`/api/aranllm/config?id=${encodeURIComponent(modelId)}`))?.value ?? {},

      setLocalConfig: (modelId, values) =>
        post('/api/aranllm/config/set', { id: modelId, values }),

      /*
       * The form's own field list, as the array it is.
       *
       * Wrapped by the route so it can grow a sibling field later; the component
       * calls `.map` on what it gets, so the wrapper is undone here rather than
       * in the route — a route that answered with a bare array could not add a
       * second field without breaking every other caller.
       */
      parameters: async () => (await get('/api/aranllm/parameters'))?.groups ?? [],

      /* ── The service itself ──────────────────────────────────────────── */

      /* A number, not `{ port }`: the address line renders it inline. */
      port: async () => (await get('/api/aranllm/port'))?.port,
      setPort: (port) => post('/api/aranllm/port/set', { port }),

      /** llama.cpp's own counters, from its `/metrics`. */
      stats: () => get('/api/aranllm/stats'),

      /*
       * What a load would cost, for parameters that have not been applied yet.
       *
       * A second memory figure, and the two answer different questions: that one
       * is llama.cpp's own projection for a load that happened, this one is for a
       * load that has not. The panel needs the second — it exists so the parameters
       * can be chosen before the model starts.
       */
      estimate: (request) => post('/api/aranllm/estimate', request),

      /** What llama.cpp projected for device memory, from its load log. */
      memory: () => get('/api/aranllm/memory'),

      /** The tail of the local-model log. An array of lines. */
      log: async (lines) => {
        const answer = await get(`/api/aranllm/log${lines ? `?lines=${String(lines)}` : ''}`)
        return Array.isArray(answer) ? answer : (answer?.lines ?? [])
      },

      /* ── The OpenAI-compatible gateway ───────────────────────────────── */

      /*
       * The gateway's state: whether it runs, on what port, and with which key.
       *
       * Read rather than kept in the page, because the same values are written
       * by the settings section and a second copy in a component disagrees the
       * first time the service is started from anywhere else.
       */
      gateway: () => get('/api/aranllm/gateway/status'),

      /*
       * Save and (re)start. One call, because they are one decision — a server
       * whose address changed has to be rebound, so a save is a restart.
       */
      applyGateway: (settings) => post('/api/aranllm/gateway/apply', settings),
      stopGateway: () => post('/api/aranllm/gateway/stop', {}),

      /* ── Files ───────────────────────────────────────────────────────── */

      removeFile: (modelId) => post('/api/aranllm/models/remove', { id: modelId }),
      importModel: (request) => post('/api/aranllm/models/import', request ?? {}),
    },

    /* ── The model hub ───────────────────────────────────────────────── */

    /*
     * Search, browse and download, with the desktop's two channels turned into
     * subscriptions this file makes itself.
     *
     * ## Why `onDownload` and `onQueue` are implemented here
     *
     * The desktop application pushed progress: the main process knew when a byte
     * arrived and sent it to the page, and `onDownload` registered the receiver.
     * This host has no such channel — the page reaches it over HTTP and nothing
     * can call back into the page — so the same interface is built on top of the
     * two state routes.
     *
     * What the caller sees is unchanged: it passes a function and gets back a
     * function that stops it. What differs is underneath, and the difference is
     * worth stating plainly — this polls, and the desktop did not.
     *
     * ## Why the interval is this and not a frame
     *
     * A transfer changes several times a second, and the desktop note argues
     * against polling for exactly that reason. What changes the calculus is that
     * the page no longer has a second way to hear: a poll is the only mechanism,
     * so the question is only how often. This is faster than a progress bar can
     * be read and slow enough that several panels open at once are not a load.
     *
     * The loop is shared per route — see `subscribe` — so a page with nothing
     * open makes no requests at all.
     */
    hub: {
      sources: async () => (await get('/api/aranllm/hub/sources'))?.sources ?? [],
      source: async () => (await get('/api/aranllm/hub/sources'))?.current,
      setSource: (id) => post('/api/aranllm/hub/source', { id }),
      search: (query) => post('/api/aranllm/hub/search', { query }),
      files: (repoId) => post('/api/aranllm/hub/files', { repoId }),

      download: (request) => post('/api/aranllm/download/start', request),
      cancelDownload: () => post('/api/aranllm/download/cancel', {}),
      downloadState: () => get('/api/aranllm/download/state'),

      enqueue: (items) => post('/api/aranllm/queue/enqueue', { items }),
      stopQueue: () => post('/api/aranllm/queue/stop', {}),
      queue: () => get('/api/aranllm/queue'),
      clearQueue: () => post('/api/aranllm/queue/clear', {}),

      /*
       * Pause, resume and forget — the three the desktop application did not
       * have. See the note on the routes: a queue that can only be emptied
       * cannot be stopped for the night and continued in the morning, and a
       * multi-hour transfer makes that the ordinary case rather than the edge.
       */
      pauseQueue: () => post('/api/aranllm/queue/pause', {}),
      resumeQueue: () => post('/api/aranllm/queue/resume', {}),
      removeQueueItem: (repoId, file) =>
        post('/api/aranllm/queue/remove', { repoId, file }),

      /*
       * The proxy, and the one honest difference from the desktop.
       *
       * There, the setting reconfigured the session's network stack. Here it is
       * stored and reported, and the request that follows goes wherever the
       * environment sends it. `testConnection` is what makes that visible
       * rather than a setting that silently does nothing.
       */
      proxy: () => get('/api/aranllm/hub/proxy'),
      setProxy: (mode, url) => post('/api/aranllm/hub/proxy/set', { mode, url }),
      testConnection: () => post('/api/aranllm/hub/test', {}),

      /*
       * No separate window to open. Answered rather than refused, matching how
       * the browser build of this same bridge answers it: the caller renders a
       * button from this value, and `false` is the truth.
       */
      openDownloadsWindow: async () => ({ open: false }),

      /*
       * Progress, filtered to the states the desktop's channel could produce.
       *
       * ## Why `idle` is not delivered
       *
       * The desktop pushed this from a listener the module fires when a transfer
       * *changes*. A transfer that has never run is not a change, so `idle` never
       * arrived and the page never had to handle it — its render asks
       * `progress.kind !== 'done'` and labels anything left over as a failure.
       *
       * A poll cannot make that distinction on its own: the state route answers
       * `{ kind: 'idle' }` from the moment the page opens, and a subscription
       * faithfully delivers it. Measured, as a permanently visible red bar
       * reading 下载失败 on a machine that had downloaded nothing.
       *
       * So the filter lives here rather than in the component. It is what the
       * event channel did implicitly, and restoring it keeps the copied page
       * byte-identical to its original.
       */
      onDownload: (listener) =>
        subscribe('/api/aranllm/download/state', (value) => {
          if (value === null || typeof value !== 'object') return
          if (value.kind === 'idle') return
          listener(value)
        }),
      onQueue: (listener) => subscribe('/api/aranllm/queue', listener),
    },

    shell: {
      /*
       * The clipboard, through the host's own writer.
       *
       * Passed in rather than reached for, because the host's helper is what
       * every other plugin uses and it handles the permission and the fallback
       * path for a page that cannot use `navigator.clipboard`.
       */
      copyText: (text) => {
        try {
          return Promise.resolve(writeClipboard(text))
        } catch (error) {
          return Promise.reject(error)
        }
      },
    },
  }
}

/**
 * The one bridge the copied components import.
 *
 * A module-level instance rather than a factory alone, because that is how the
 * desktop application's own `lib/bridge.ts` exported it: `import { bridge }` at
 * the top of each component, not a prop. Keeping that shape is what makes the
 * import line the only edit in those files.
 *
 * The clipboard writer is called through `globalThis` rather than imported, so
 * this module has no dependency on the host's module system — it is loaded by
 * `client.js` after the primitives are in hand, and that file installs the
 * writer before anything renders.
 */
const writeClipboardLazy = (text) => {
  const writer = globalThis.__aranllmWriteClipboard
  if (typeof writer !== 'function') {
    throw new Error('aranllm-local: the clipboard writer was not installed')
  }
  return writer(text)
}

export const bridge = createBridge(writeClipboardLazy)
