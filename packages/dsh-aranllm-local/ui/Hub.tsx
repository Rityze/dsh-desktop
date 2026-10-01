/*
 * Browsing a Hugging Face mirror, choosing files, and downloading them.
 *
 * Three steps, because that is the shape of the task: a user knows *what* they
 * want ("a Qwen3.8 quantised model") but not which of forty repositories has it;
 * having chosen one they still have to pick among thirty files that differ only
 * in a five-character quantisation label; and having picked, they wait.
 *
 * **Only GGUF files are shown, and that is enforced twice** — the main process
 * filters them out of the listing, and the page filters again. The reason is
 * that everything here assumes it: a `.safetensors` shard would be offerable
 * for download and could never be loaded afterwards.
 *
 * **Sizes are shown everywhere they are known, and that is not decoration.** The
 * repository measured while writing this holds 439 GB across its GGUF files, one
 * of which is 46 GB. A picker that lists names without weights invites a
 * download the user would not have started, on a connection where it costs hours.
 *
 * `bridge.hub` never touches the network from here; the main process owns the
 * mirror host and every request.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bridge } from './bridge-adapter.js'
import { Icon } from './Icon/Icon.tsx'
import type {
  HubFile,
  HubProxyMode,
  HubProxyModeChoice,
  HubProxySettings,
  HubQueueState,
  HubRepo,
  HubSourceId
} from './hub-types.ts'
import './hub.css'

/** The queue with nothing in it, for the first render before the read lands. */
const NO_QUEUE: HubQueueState = {
  pending: [],
  completed: [],
  totalBytes: 0,
  doneBytes: 0,
  speedBytesPerSecond: 0,
  failed: [],
  stopping: false
}

/**
 * The hosts, in the order they are offered.
 *
 * `note` carries the one thing a user cannot guess from the names: whether the
 * host can be trusted to return only usable repositories. It cannot, on
 * ModelScope — see the module comment in `hub-sources.ts` — and that is worth
 * saying before someone picks it and wonders why the file list is empty.
 */
const SOURCE_CHOICES: readonly { id: HubSourceId; label: string; note: string }[] = [
  { id: 'hf-mirror', label: 'hf-mirror', note: 'Hugging Face 镜像，可按 GGUF 过滤' },
  { id: 'modelscope', label: '魔搭社区', note: 'ModelScope，不支持按 GGUF 过滤，可能搜到空仓库' }
]

type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; repos: HubRepo[]; nextCursor?: string }
  | { kind: 'failed'; error: string }

type FilesState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; id: string; files: HubFile[]; ggufBytes: number }
  | { kind: 'failed'; error: string }

type Progress = {
  kind: 'running' | 'done' | 'cancelled' | 'failed'
  file: string
  target?: string
  received: number
  total: number
  bytesPerSecond?: number
  resumed?: boolean
  error?: string
}

/** Byte counts at the scale a model file lives at. */
function bytes(value: number | undefined): string {
  if (value === undefined || value === 0) return '大小未知'
  const gb = value / 1024 ** 3
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = value / 1024 ** 2
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${String(Math.max(1, Math.round(value / 1024)))} KB`
}

/** A transfer rate, in the unit a person reads a rate in. */
function rate(value: number | undefined): string {
  if (!value || value <= 0) return '—'
  const mb = value / 1024 ** 2
  if (mb >= 1) return `${mb.toFixed(1)} MB/s`
  return `${String(Math.max(1, Math.round(value / 1024)))} KB/s`
}

/** How long the rest will take at the current rate, or empty when unknown. */
function eta(received: number, total: number, speed: number | undefined): string {
  if (!speed || speed <= 0 || total <= received) return ''
  const seconds = Math.round((total - received) / speed)
  if (seconds < 60) return `约 ${String(seconds)} 秒`
  if (seconds < 3600) return `约 ${String(Math.round(seconds / 60))} 分钟`
  return `约 ${(seconds / 3600).toFixed(1)} 小时`
}

/** Download counts, shortened the way a rank is easier to read than a number. */
/**
 * A stable small number from a string, for the avatar colours.
 *
 * Deterministic rather than random, so the same publisher reads the same colour
 * across a session and across launches — a colour that changed on every render
 * would be a flicker, and one that changed per row would defeat the point of
 * having it.
 *
 * The multiplier is the FNV prime, which is enough spread for six buckets and
 * costs nothing. A cryptographic hash would be the wrong tool: nothing here
 * needs to resist collision, and the cost would be paid on every row.
 */
function hashOf(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash) % 6
}

/**
 * Search results, most downloaded first.
 *
 * **Sorted here because one of the two mirrors will not do it.** Measured
 * against ModelScope's endpoint: `SortBy` accepts `'Default'` and returns HTTP
 * 400 for every other value tried — `Downloads`, `Stars`, `1`, `2`, `0` — so the
 * order it returns is its own and not popularity. `hf-mirror` does sort
 * server-side when asked (`sort=downloads`), and re-sorting its already-ordered
 * answer costs nothing and is idempotent.
 *
 * Ties are broken by name so the order does not depend on which mirror answered
 * — two results with the same download count would otherwise swap places
 * between searches, which reads as the list reordering itself.
 *
 * The limitation is that this orders one page, not the whole result set: a
 * "load more" appends a second page that is ordered internally but not against
 * the first. Fixing that needs the mirror to sort, which one of them will not.
 */
function byPopularity(repos: readonly HubRepo[]): HubRepo[] {
  return [...repos].sort((a, b) => {
    if (b.downloads !== a.downloads) return b.downloads - a.downloads
    return a.id.localeCompare(b.id)
  })
}

function count(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function when(iso: string): string {
  if (iso.length === 0) return ''
  const at = Date.parse(iso)
  if (!Number.isFinite(at)) return ''
  const days = Math.floor((Date.now() - at) / 86_400_000)
  if (days < 1) return '今天更新'
  if (days < 30) return `${String(days)} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${String(months)} 个月前`
  return `${String(Math.floor(months / 12))} 年前`
}

export function Hub({ active }: { active: boolean }) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<HubSourceId>('hf-mirror')
  const [search, setSearch] = useState<SearchState>({ kind: 'idle' })
  const [files, setFiles] = useState<FilesState>({ kind: 'idle' })
  const [chosen, setChosen] = useState('')
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set())
  const [progress, setProgress] = useState<Progress | undefined>(undefined)
  const [queue, setQueue] = useState<HubQueueState>(NO_QUEUE)
  /**
   * Whether the download list is showing.
   *
   * The desktop application opened this in a window of its own, so its button
   * called `openDownloadsWindow` and drew nothing. There is no second window
   * here — the host has one — so the same list is drawn inline, under the
   * button, and this is what the button toggles.
   *
   * It starts open when there is something to show. A queue restored from a
   * previous launch is exactly the case the feature exists for, and a list the
   * user has to go looking for is one they will not find.
   */
  const [queueOpen, setQueueOpen] = useState(false)
  /** Whether the download list is open. */
  /** Issued-search counter, so a late answer cannot replace a newer one. */
  const searchSeq = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    void bridge.hub
      .source()
      .then((id: unknown) => {
        if (mounted.current && typeof id === 'string') setSource(id as HubSourceId)
      })
      .catch(() => undefined)
  }, [])

  const runSearch = useCallback(
    async (text: string, cursor?: string) => {
    const seq = (searchSeq.current += 1)
    ;(globalThis.__hubDiag ??= []).push({ at: Date.now(), event: 'runSearch 开始', seq, text })
    setSearch({ kind: 'loading' })
    const answer = (await bridge.hub
      .search({ ...(text.trim() ? { search: text.trim() } : {}), ...(cursor ? { page: cursor } : {}) })
      .catch(() => ({ ok: false, error: '无法连接主进程。' }))) as
      | { ok: true; value: { repos: HubRepo[]; nextPage?: string } }
      | { ok: false; error: string }

    /*
     * Late answers are dropped rather than applied. Typing "qwen" fires five
     * searches, and without this the fourth one's results can land after the
     * fifth's and leave the list describing a prefix of what was typed.
     */
    ;(globalThis.__hubDiag ??= []).push({ at: Date.now(), event: '收到响应', seq, now: searchSeq.current, mounted: mounted.current, ok: answer.ok })
    if (!mounted.current || seq !== searchSeq.current) return

    if (!answer.ok) {
      setSearch({ kind: 'failed', error: answer.error })
      return
    }
    ;(globalThis.__hubDiag ??= []).push({ at: Date.now(), event: '设置 ready', seq, repos: answer.value.repos.length })
    setSearch((previous) => {
      const merged =
        cursor && previous.kind === 'ready' ? [...previous.repos, ...answer.value.repos] : answer.value.repos
      return {
        kind: 'ready',
        repos: merged,
        ...(answer.value.nextPage ? { nextCursor: answer.value.nextPage } : {})
      }
    })
    },
    []
  )

  /**
   * Switch hosts.
   *
   * The list is cleared rather than kept: a repository id means different things
   * on each host, and a stale row that was searchable on one and not the other
   * is a click through to a 404. The query text stays, because that is what the
   * user typed and it is usually what they want to re-run.
   */
  const [root, setRoot] = useState('')
  const [rootNote, setRootNote] = useState('')
  /** The folder just picked, and what moving into it would involve. */
  const [pendingMove, setPendingMove] = useState<
    { to: string; preview: { files: number; bytes: number } } | undefined
  >(undefined)
  const [moving, setMoving] = useState(false)
  const [proxy, setProxy] = useState<HubProxySettings>({ mode: 'system' })
  const [proxyModes, setProxyModes] = useState<HubProxyModeChoice[]>([])
  const [editingProxy, setEditingProxy] = useState(false)
  const [proxyDraft, setProxyDraft] = useState('')
  const [probe, setProbe] = useState<string>('')

  useEffect(() => {
    void bridge.hub
      .proxy()
      .then((answer) => {
        if (!mounted.current || !answer) return
        setProxy(answer.settings)
        setProxyModes(answer.modes ?? [])
        setProxyDraft(answer.settings.url ?? '')
      })
      .catch(() => undefined)
  }, [])

  /** Re-read the library root into this page's own field. */
  const readRoot = useCallback(async () => {
    try {
      const answer = await bridge.models.library()
      const first = answer?.roots?.[0]
      if (mounted.current && typeof first === 'string') setRoot(first)
    } catch {
      // The field keeps whatever it had; the catalogue below still renders.
    }
  }, [])

  useEffect(() => {
    void readRoot()
  }, [readRoot])

  /**
   * Ask the system for a folder, then ask what to do with the models here.
   *
   * The same two steps, through the same three calls, as the model page — a
   * typed path is the wrong control in both places for the same reason: a
   * mistyped one produces an empty catalogue rather than an error, which reads
   * as lost models. The layout differs between the pages; the decisions do not.
   */
  const chooseRoot = useCallback(async () => {
    setRootNote('')
    try {
      const picked = await bridge.models.chooseDirectory(root)
      /* Cancelling is a decision, not a failure. Nothing is said about it. */
      if (!picked) return
      const preview = await bridge.models.previewMove(picked)
      if (preview.blocked) {
        setRootNote(preview.blocked)
        return
      }
      setPendingMove({ to: picked, preview: { files: preview.files, bytes: preview.bytes } })
    } catch (cause) {
      setRootNote(cause instanceof Error ? cause.message : String(cause))
    }
  }, [root])

  /**
   * Carry out the choice.
   *
   * `keepOld` adds the new folder and keeps reading the old one; otherwise the
   * files are moved across. Both are answers a user can mean — a drive that is
   * going away, or a collection they maintain by hand — which is why the
   * question is asked rather than decided.
   */
  const confirmMove = useCallback(
    async (keepOld: boolean) => {
      const pending = pendingMove
      if (!pending) return
      setPendingMove(undefined)
      setMoving(true)
      setRootNote('')
      try {
        const answer = await bridge.models.moveLibrary(pending.to, keepOld)
        if (!answer.ok) {
          setRootNote(answer.error ?? '切换失败。')
          return
        }
        await readRoot()
        if (answer.skipped && answer.skipped.length > 0) {
          setRootNote(`有 ${String(answer.skipped.length)} 个文件没能移动，它们仍在原目录。`)
        }
      } catch (cause) {
        setRootNote(cause instanceof Error ? cause.message : String(cause))
      } finally {
        setMoving(false)
      }
    },
    [pendingMove, readRoot]
  )

  const chooseProxy = useCallback(
    async (mode: HubProxyMode, url?: string) => {
      const answer = await bridge.hub.setProxy(mode, url).catch(() => ({ ok: false, error: '无法连接主进程。' }))
      if (!answer.ok) {
        setProbe(answer.error ?? '设置失败。')
        return
      }
      setProxy({ mode, ...(url ? { url } : {}) })
      setEditingProxy(false)
      setProbe('')
    },
    []
  )

  const runProbe = useCallback(async () => {
    setProbe('测试中…')
    const answer = await bridge.hub
      .testConnection()
      .catch((): { ok: boolean; error?: string; detail?: string } => ({ ok: false, error: '无法连接主进程。' }))
    setProbe(answer.ok ? `连接正常${answer.detail ? `，${answer.detail}` : ''}` : (answer.error ?? '连接失败。'))
  }, [])

  const switchSource = useCallback(
    (id: HubSourceId) => {
      if (id === source) return
      setSource(id)
      setChosen('')
      setPicked(new Set())
      setFiles({ kind: 'idle' })
      setProgress(undefined)
      void bridge.hub.setSource(id).catch(() => undefined)
      void runSearch(query)
    },
    [source, query, runSearch]
  )

  const openRepo = useCallback(async (id: string) => {
    setChosen(id)
    setPicked(new Set())
    setFiles({ kind: 'loading' })
    const answer = (await bridge.hub.files(id).catch(() => ({
      ok: false,
      error: '无法连接主进程。'
    }))) as
      | { ok: true; value: { id: string; files: HubFile[]; ggufBytes: number } }
      | { ok: false; error: string }
    if (!mounted.current) return
    if (!answer.ok) {
      setFiles({ kind: 'failed', error: answer.error })
      return
    }
    /*
     * The main process already dropped everything but `.gguf`, so this is a
     * guard rather than a filter — kept because the page's whole file table is
     * built on "everything here can be loaded", and a mirror reached through a
     * different code path must not be able to break that silently.
     */
    const only = answer.value.files.filter((file) => file.path.toLowerCase().endsWith('.gguf'))
    setFiles({ kind: 'ready', id: answer.value.id, files: only, ggufBytes: answer.value.ggufBytes })
  }, [])

  /* The first search waits until the page is looked at — see the note below. */
  const started = useRef(false)
  useEffect(() => {
    if (!active || started.current) return
    started.current = true
    void runSearch('')
  }, [active, runSearch])

  /* Progress arrives as an event, not as a poll: it changes many times a second. */
  useEffect(() => {
    const off = bridge.hub.onDownload((raw: unknown) => {
      if (!mounted.current) return
      const state = raw as Progress
      if (!state || typeof state !== 'object') return
      setProgress(state)
    })
    return off
  }, [])

  /*
   * The queue is read on mount as well as subscribed to.
   *
   * A user who starts ten downloads, leaves the page and comes back must see
   * the queue they left running — an event-only subscription would show nothing
   * until the next change, which on a slow transfer is a long time.
   */
  useEffect(() => {
    void bridge.hub
      .queue()
      .then((state: unknown) => {
        if (mounted.current && state && typeof state === 'object') setQueue(state as HubQueueState)
      })
      .catch(() => undefined)
    return bridge.hub.onQueue((raw: unknown) => {
      if (!mounted.current) return
      if (raw && typeof raw === 'object') setQueue(raw as HubQueueState)
    })
  }, [])

  const toggle = useCallback((path: string) => {
    setPicked((previous) => {
      const next = new Set(previous)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const allFiles = files.kind === 'ready' ? files.files : []
  const pickedList = useMemo(() => allFiles.filter((file) => picked.has(file.path)), [allFiles, picked])
  const pickedBytes = pickedList.reduce((sum, file) => sum + (file.size ?? 0), 0)

  /**
   * Hand the ticked files to the main process's queue.
   *
   * Nothing is downloaded from here, and that is deliberate — see the note on
   * `download.ts`'s queue. A loop in this component would stop when the user
   * left the page, and would stop entirely on the first failure. The queue
   * keeps running through both, and this page only draws it.
   */
  const startPicked = useCallback(() => {
    if (chosen.length === 0 || pickedList.length === 0) return
    void bridge.hub
      .enqueue(
        pickedList.map((file) => ({
          repoId: chosen,
          file: file.path,
          ...(file.size !== undefined ? { size: file.size } : {})
        }))
      )
      .catch(() => undefined)
  }, [chosen, pickedList])

  /*
   * Order by downloads, not by the mirror's own idea of relevance.
   *
   * See `byPopularity` — the ordering is done on this side because ModelScope
   * will not do it, and a search whose first result is a repository with four
   * downloads reads as a broken search.
   */
  const repos = useMemo(
    () => byPopularity(search.kind === 'ready' ? search.repos : []),
    [search]
  )
  /*
   * The repository the detail pane is describing, found by id.
   *
   * Looked up rather than held as state: the file listing arrives from a second
   * request and the search results can be replaced underneath it, so a captured
   * copy would go stale exactly when the user re-searches while reading one.
   */
  const repo = repos.find((entry) => entry.id === chosen)
  const showProgress = progress !== undefined && progress.kind !== 'done'
  const percent =
    progress && progress.total > 0 ? Math.min(100, Math.round((progress.received / progress.total) * 100)) : 0

  return (
    <div className="hub">
      {/*
        The download list, at the top of the page.

        ## Why it is first rather than last

        A transfer is the one thing on this page that is still happening when the
        user has stopped looking at it: they queue forty gigabytes, leave, and
        come back to a window whose whole purpose is now "is it still going". At
        the bottom it was below a file table that can hold a hundred rows, so
        answering that question meant scrolling past everything the page had.

        At the top it is the first thing read and the first thing seen to change.
        The cost is that an empty queue occupies the best space on the page, so
        the whole block renders only when there is something to say — no queue,
        no bar, and the headings keep the top.

        ## What it does

        The button toggles the list below it; the badge counts what is waiting;
        and the pause/start control acts on the queue as a whole. Per-file
        controls live on each row, because on a list of ten files "not this one,
        the other nine" is the ordinary request.
      */}
      {queue.active !== undefined ||
      queue.pending.length > 0 ||
      queue.completed.length > 0 ||
      queue.failed.length > 0 ? (
      <div className="hub__dlbar">
        <button
          type="button"
          className="hub__btn hub__btn--quiet"
          onClick={() => setQueueOpen((open) => !open)}
          aria-expanded={queueOpen}
        >
          <Icon name="arrow-down-to-line" size="small" />
          下载清单
          {queue.active ? (
            <span className="hub__dlbadge hub__dlbadge--on">
              {String(queue.pending.length + 1)}
            </span>
          ) : queue.pending.length + queue.completed.length + queue.failed.length > 0 ? (
            <span className="hub__dlbadge">
              {String(queue.pending.length + queue.completed.length + queue.failed.length)}
            </span>
          ) : null}
        </button>
        {queue.active ? (
          <span className="hub__dlnote">
            {rate(queue.speedBytesPerSecond) || '正在下载'}
          </span>
        ) : queue.paused && queue.pending.length > 0 ? (
          <span className="hub__dlnote">已暂停 · 还有 {String(queue.pending.length)} 个文件</span>
        ) : null}
        {/*
          The two controls the queue's own state calls for.

          `paused` is a field this host added to the queue — the desktop shell
          had no concept of stopping without emptying — so the button that acts
          on it is added beside it rather than worked into the existing row.
        */}
        {queue.pending.length > 0 || queue.active ? (
          queue.paused ? (
            <button
              type="button"
              className="hub__btn hub__btn--quiet"
              onClick={() => void bridge.hub.resumeQueue().then(setQueue).catch(() => undefined)}
            >
              开始
            </button>
          ) : (
            <button
              type="button"
              className="hub__btn hub__btn--quiet"
              onClick={() => void bridge.hub.pauseQueue().then(setQueue).catch(() => undefined)}
            >
              暂停
            </button>
          )
        ) : null}
      </div>
      ) : null}

      {/*
        The list itself, on its own line under the bar.

        Under rather than inside: the bar is a single flex row — a button, a note
        and a control — and a list nested into it becomes a third column, which
        is what the first attempt drew: a 300-pixel box beside the button with
        every field squeezed into it.

        Its condition repeats the bar's rather than being nested in it, because
        the two are siblings now. Both read the same queue, so the list cannot
        appear without the bar that opens it.
      */}
      {queueOpen &&
      (queue.active !== undefined ||
        queue.pending.length > 0 ||
        queue.completed.length > 0 ||
        queue.failed.length > 0) ? (
        <QueuePanel
          queue={queue}
          onStart={(repoId, file) => void bridge.hub.enqueue([{ repoId, file }]).then(setQueue).catch(() => undefined)}
          onPause={() => void bridge.hub.pauseQueue().then(setQueue).catch(() => undefined)}
          onResume={() => void bridge.hub.resumeQueue().then(setQueue).catch(() => undefined)}
          onRemove={(repoId, file) =>
            void bridge.hub.removeQueueItem(repoId, file).then(setQueue).catch(() => undefined)
          }
          onClear={() => void bridge.hub.clearQueue().then(setQueue).catch(() => undefined)}
        />
      ) : null}

      <header className="hub__head">
        <div>
          <h1 className="hub__title">模型仓库</h1>
          <p className="hub__sub">从镜像站找模型，下载后可在「本地模型」里加载。</p>
        </div>
        {/*
          A segmented control, matching `local-models__sort` exactly — same
          border, radius, height, font size and active treatment. Two hosts are a
          choice between named alternatives, which is what that control is for.
        */}
        <div className="hub__sources" role="radiogroup" aria-label="模型源">
          {SOURCE_CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              role="radio"
              aria-checked={source === choice.id}
              data-active={source === choice.id ? 'true' : undefined}
              className="hub__source-item"
              title={choice.note}
              onClick={() => switchSource(choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </header>

      {/*
        Where the files go, which is the one fact a user wants before starting a
        download rather than after — a 40 GB mistake is expensive to undo.
      */}
      <div className="hub__net">
        <span className="hub__netlabel">下载到</span>
        <span className="hub__rootpath" title={root}>
          {root || '读取中…'}
        </span>
        {/*
          The system's own picker, not a text field — the same control the model
          page uses, through the same three calls. A typed path can be wrong in
          the way that yields an empty catalogue rather than an error, and the
          native dialog cannot return a path that does not exist.
        */}
        <button
          type="button"
          className="hub__btn hub__btn--quiet"
          disabled={moving}
          onClick={() => void chooseRoot()}
        >
          {moving ? '正在迁移…' : '更改'}
        </button>
        {rootNote ? (
          <span className="hub__netprobe hub__netprobe--bad" role="alert">
            {rootNote}
          </span>
        ) : null}
      </div>

      {/*
        The same question the model page asks, in this page's own layout.
        Nothing changes until it is answered.
      */}
      {pendingMove ? (
        <div className="hub__move" role="alertdialog" aria-label="迁移模型">
          <p className="hub__move-title">
            新目录：<code>{pendingMove.to}</code>
          </p>
          <p className="hub__move-body">
            {pendingMove.preview.files > 0
              ? `当前库里有 ${String(pendingMove.preview.files)} 个模型文件，共 ${bytes(pendingMove.preview.bytes)}。要把它们迁移到新目录吗？`
              : '当前库里没有模型文件，可以直接切换。'}
          </p>
          <div className="hub__move-actions">
            {pendingMove.preview.files > 0 ? (
              <>
                <button type="button" className="hub__btn hub__btn--primary" onClick={() => void confirmMove(false)}>
                  迁移过去
                </button>
                <button type="button" className="hub__btn" onClick={() => void confirmMove(true)}>
                  不迁移，保留原目录
                </button>
              </>
            ) : (
              <button type="button" className="hub__btn hub__btn--primary" onClick={() => void confirmMove(true)}>
                切换
              </button>
            )}
            <button type="button" className="hub__btn hub__btn--quiet" onClick={() => setPendingMove(undefined)}>
              取消
            </button>
          </div>
          {pendingMove.preview.files > 0 ? (
            <p className="hub__move-note">
              不迁移的话，原目录会作为副库继续读取，两个目录的模型都会出现在「本地模型」里。
            </p>
          ) : null}
        </div>
      ) : null}

      {/*
        One row, and it opens in place.

        The proxy is a prerequisite for everything else on this page, so it
        belongs beside the source picker rather than in a settings page three
        clicks away — when it is wrong, nothing here works and the reason is not
        visible from here. The probe button is not a nicety: a proxy setting the
        user cannot test is one whose effect they discover an hour into a
        download.
      */}
      <div className="hub__net">
        {editingProxy ? (
          <>
            <input
              className="hub__netinput"
              value={proxyDraft}
              onChange={(event) => setProxyDraft(event.target.value)}
              placeholder="http://127.0.0.1:7890"
              aria-label="代理地址"
            />
            <button
              type="button"
              className="hub__btn"
              onClick={() => void chooseProxy('manual', proxyDraft.trim())}
            >
              保存
            </button>
            <button type="button" className="hub__btn hub__btn--quiet" onClick={() => setEditingProxy(false)}>
              取消
            </button>
          </>
        ) : (
          <>
            <span className="hub__netlabel">
              代理 {proxyModes.find((m) => m.id === proxy.mode)?.label ?? '跟随系统'}
              {proxy.mode === 'manual' && proxy.url ? ` · ${proxy.url}` : ''}
            </span>
            {proxyModes.map((mode) =>
              mode.id === proxy.mode ? null : (
                <button
                  key={mode.id}
                  type="button"
                  className="hub__btn hub__btn--quiet"
                  title={mode.note}
                  onClick={() => (mode.id === 'manual' ? setEditingProxy(true) : void chooseProxy(mode.id))}
                >
                  {mode.label}
                </button>
              )
            )}
            <button type="button" className="hub__btn hub__btn--quiet" onClick={() => void runProbe()}>
              测试连接
            </button>
          </>
        )}
        {probe ? (
          <span className={`hub__netprobe${probe.startsWith('连接正常') ? '' : ' hub__netprobe--bad'}`} role="status">
            {probe}
          </span>
        ) : null}
      </div>

      <form
        className="hub__search"
        onSubmit={(event) => {
          event.preventDefault()
          setChosen('')
          setPicked(new Set())
          setFiles({ kind: 'idle' })
          void runSearch(query)
        }}
      >
        <input
          className="hub__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索模型，例如 qwen3.8、glm、mimo"
          aria-label="搜索仓库"
        />
        <button type="submit" className="hub__btn hub__btn--primary" disabled={search.kind === 'loading'}>
          {search.kind === 'loading' ? '搜索中…' : '搜索'}
        </button>
      </form>

      {search.kind === 'failed' ? (
        <div className="hub__error" role="alert">
          <p>{search.error}</p>
          <button type="button" className="hub__btn" onClick={() => void runSearch(query)}>
            重试
          </button>
        </div>
      ) : null}

      <div className="hub__body">
        <div className="hub__list" role="list">
          {repos.length === 0 && search.kind === 'ready' ? (
            <p className="hub__empty">没有带 GGUF 文件的仓库。换个关键词，或检查镜像是否可用。</p>
          ) : null}
          {repos.map((repo) => {
            const [publisher, ...rest] = String(repo.id ?? '').split('/')
            const shortName = rest.join('/') || publisher || repo.id
            return (
              <button
                key={repo.id}
                type="button"
                role="listitem"
                className={`hub__repo${chosen === repo.id ? ' hub__repo--on' : ''}`}
                onClick={() => void openRepo(repo.id)}
              >
                {/*
                  A monogram where the reference shows a thumbnail.

                  Its result rows carry the model card's image, which it can
                  fetch because it talks to Hugging Face directly. A mirror's
                  search response carries no image, and adding a request per row
                  to find out would put forty round trips in front of a list the
                  reader is skimming.

                  The letter is not a stand-in for the picture — it does the job
                  the picture does, which is to give a column of long names a
                  starting edge the eye can find. The colour is derived from the
                  publisher so the same org reads the same across its models.
                */}
                <span className="hub__avatar" data-seed={hashOf(publisher ?? repo.id)} aria-hidden="true">
                  {(publisher ?? repo.id).slice(0, 1).toUpperCase()}
                </span>

                <span className="hub__repobody">
                  <span className="hub__reponame" title={repo.id}>
                    {shortName}
                  </span>
                  <span className="hub__reposub">
                    {publisher ? <span className="hub__repopub">{publisher}</span> : null}
                    {repo.hasGguf ? (
                      <span className="hub__gguf" title="这个仓库里有可以加载的 GGUF">
                        GGUF
                      </span>
                    ) : null}
                    {repo.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="hub__tag">
                        {tag}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            )
          })}
          {search.kind === 'ready' && search.nextCursor ? (
            <button
              type="button"
              className="hub__btn hub__more"
              onClick={() => void runSearch(query, search.nextCursor)}
            >
              加载更多
            </button>
          ) : null}
        </div>

        <div className="hub__detail">
          {files.kind === 'idle' ? <p className="hub__empty">左边选一个仓库，这里会列出可下载的文件。</p> : null}
          {files.kind === 'loading' ? <p className="hub__empty">正在读取文件列表…</p> : null}
          {files.kind === 'failed' ? (
            <div className="hub__error" role="alert">
              <p>{files.error}</p>
              <button type="button" className="hub__btn" onClick={() => void openRepo(chosen)}>
                重试
              </button>
            </div>
          ) : null}
          {files.kind === 'ready' ? (
            <>
              <div className="hub__detailhead">
                <h2 className="hub__repotitle">{files.id}</h2>

                {/*
                  The figures belong here rather than on the card.

                  Two reasons, and the second is why they moved. A card is scanned
                  — the reader is looking for a name — and four characters of
                  download count beside every one of forty rows is noise in the
                  only column that has to stay legible. And the question these
                  numbers answer is comparative: "is this the one people use" is
                  asked about the repository in front of you, not about all of
                  them at once.

                  Same arrangement as the reference's detail header: the counts
                  as tinted chips on the left, the update time beside them.
                */}
                <div className="hub__stats">
                  <span className="hub__stat" title="下载次数">
                    ↓ {count(repo?.downloads ?? 0)}
                  </span>
                  {repo && repo.likes > 0 ? (
                    <span className="hub__stat" title="点赞">
                      ♥ {count(repo.likes)}
                    </span>
                  ) : null}
                  {repo?.updatedAt ? (
                    <span className="hub__statwhen">{when(repo.updatedAt)}更新</span>
                  ) : null}
                </div>

                <p className="hub__sub">
                  {files.files.length} 个 GGUF 文件，合计 {bytes(files.ggufBytes)}
                  {files.files.length === 0 ? '（这个仓库没有可下载的 GGUF）' : ''}
                </p>
              </div>

              <div className="hub__bar">
                <label className="hub__checkall">
                  <input
                    type="checkbox"
                    checked={allFiles.length > 0 && picked.size === allFiles.length}
                    onChange={(event) =>
                      setPicked(event.target.checked ? new Set(allFiles.map((f) => f.path)) : new Set())
                    }
                  />
                  全选
                </label>
                <span className="hub__pickedinfo">
                  {picked.size === 0
                    ? '勾选要下载的文件'
                    : `已选 ${String(picked.size)} 个，${bytes(pickedBytes)}`}
                </span>
                <button
                  type="button"
                  className="hub__btn hub__btn--primary"
                  disabled={picked.size === 0}
                  onClick={startPicked}
                >
                  加入下载
                </button>
              </div>

              <table className="hub__table">
                <thead>
                  <tr>
                    <th className="hub__colpick" />
                    <th>文件</th>
                    <th>量化</th>
                    <th>大小</th>
                  </tr>
                </thead>
                <tbody>
                  {allFiles.map((file) => (
                    <tr key={file.path} className={picked.has(file.path) ? 'hub__row--on' : ''}>
                      <td className="hub__colpick">
                        <input
                          type="checkbox"
                          checked={picked.has(file.path)}
                          onChange={() => toggle(file.path)}
                          aria-label={`选择 ${file.path}`}
                        />
                      </td>
                      <td className="hub__path" title={file.path}>
                        {file.isProjector ? <span className="hub__badge">视觉</span> : null}
                        {(file.path ?? '').split('/').pop() || file.path || '—'}
                      </td>
                      <td>{file.quantization ?? '—'}</td>
                      <td className="hub__size">{bytes(file.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allFiles.length === 0 ? (
                <p className="hub__empty">这个仓库里没有 GGUF 文件，本应用加载不了。</p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>



      {showProgress && progress ? (
        <div className={`hub__progress hub__progress--${progress.kind}`} role="status">
          <div className="hub__progresshead">
            <span className="hub__progressname" title={progress.file}>
              {progress.kind === 'running' ? '正在下载' : progress.kind === 'cancelled' ? '已取消' : '下载失败'}
              {' · '}
              {(progress.file ?? '').split('/').pop() || progress.file || ''}
            </span>
            <span className="hub__progressnum">
              {bytes(progress.received)}
              {progress.total > 0 ? ` / ${bytes(progress.total)}` : ''}
              {progress.kind === 'running' ? ` · ${rate(progress.bytesPerSecond)}` : ''}
            </span>
          </div>
          <div className="hub__track">
            <div
              className="hub__fill"
              style={{ width: progress.total > 0 ? `${String(percent)}%` : '100%' }}
              data-indeterminate={progress.total > 0 ? undefined : 'true'}
            />
          </div>
          <div className="hub__progressfoot">
            <span>
              {progress.kind === 'running'
                ? `${progress.resumed ? '已从断点继续 · ' : ''}${eta(progress.received, progress.total, progress.bytesPerSecond)}`
                : progress.error}
            </span>
            {progress.kind === 'running' ? (
              <button type="button" className="hub__btn hub__btn--quiet" onClick={() => void bridge.hub.cancelDownload()}>
                取消
              </button>
            ) : (
              <button type="button" className="hub__btn hub__btn--quiet" onClick={() => setProgress(undefined)}>
                关闭
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * What was queued, what is left, and what went wrong.
 *
 * ## Why this is inline and not a window
 *
 * The desktop application opened it in a window of its own, and its button
 * called a bridge method that opened one. This host has a single window, so the
 * same list is drawn under the button that used to open it — the panel with the
 * limitation removed rather than a second implementation of it.
 *
 * ## Why the rows carry their own controls
 *
 * A download is hours long, so the interesting operations are all per-file:
 * stop this one for now, start it again, or take it off the list. A queue that
 * could only be emptied as a whole would make "not this file, the other nine"
 * unexpressible, and on a list of ten files that is the ordinary request.
 *
 * The remove button forgets the entry; it does not delete the file. A partially
 * transferred 40 GB file is not something a × in a list should destroy, and the
 * model's own deletion path asks separately and moves the file to the trash.
 */
function QueuePanel({
  queue,
  onStart,
  onPause,
  onResume,
  onRemove,
  onClear
}: {
  queue: HubQueueState
  onStart: (repoId: string, file: string) => void
  onPause: () => void
  onResume: () => void
  onRemove: (repoId: string, file: string) => void
  onClear: () => void
}) {
  const entries = [
    ...(queue.active ? [{ ...queue.active, state: 'active' as const }] : []),
    ...queue.pending.map((item) => ({ ...item, state: 'pending' as const })),
    ...queue.failed.map((item) => ({ ...item, state: 'failed' as const })),
    ...queue.completed.map((item) => ({ ...item, state: 'done' as const }))
  ]

  if (entries.length === 0) {
    return (
      <div className="hub__queue" data-empty="true">
        <p className="hub__queueempty">下载清单是空的。上面勾选文件后点「下载」，这里会显示进度。</p>
      </div>
    )
  }

  const outstanding = queue.pending.length + (queue.active ? 1 : 0)

  return (
    <div className="hub__queue">
      <div className="hub__queuehead">
        <span className="hub__queuetitle">
          下载清单
          {outstanding > 0 ? ` · 还有 ${String(outstanding)} 个` : ''}
          {queue.paused && outstanding > 0 ? '（已暂停）' : ''}
        </span>
        <span className="hub__queueactions">
          {outstanding > 0 ? (
            queue.paused ? (
              <button type="button" className="hub__btn hub__btn--quiet" onClick={onResume}>
                继续全部
              </button>
            ) : (
              <button type="button" className="hub__btn hub__btn--quiet" onClick={onPause}>
                暂停全部
              </button>
            )
          ) : null}
          {queue.completed.length > 0 || queue.failed.length > 0 ? (
            <button type="button" className="hub__btn hub__btn--quiet" onClick={onClear}>
              清空记录
            </button>
          ) : null}
        </span>
      </div>

      <ul className="hub__queuelist">
        {entries.map((entry) => {
          const name = (entry.file ?? '').split('/').pop() || entry.file || '—'
          /* `error` only exists on failed entries; the union is narrowed below. */
          const error = 'error' in entry && typeof entry.error === 'string' ? entry.error : undefined
          return (
            <li key={`${entry.repoId} ${entry.file}`} className="hub__queueitem" data-state={entry.state}>
              <span className="hub__queuedot" aria-hidden="true" />
              <span className="hub__queuename" title={`${entry.repoId}/${entry.file}`}>
                {name}
                <span className="hub__queuerepo">{entry.repoId}</span>
              </span>
              <span className="hub__queuestate">
                {entry.state === 'active'
                  ? `下载中 · ${rate(queue.speedBytesPerSecond)}`
                  : entry.state === 'pending'
                    ? queue.paused
                      ? '已暂停'
                      : '等待中'
                    : entry.state === 'done'
                      ? '已完成'
                      : (error ?? '失败')}
              </span>
              <span className="hub__queuesize">
                {bytes(typeof entry.size === 'number' ? entry.size : undefined)}
              </span>
              <span className="hub__queueops">
                {/*
                  A pending entry that is not running can be started on its own.
                  `enqueue` de-duplicates by repository and path, so pressing it
                  on something already listed is a no-op rather than a second
                  copy of the same download.
                */}
                {entry.state === 'pending' || entry.state === 'failed' ? (
                  <button
                    type="button"
                    className="hub__btn hub__btn--quiet"
                    onClick={() => onStart(entry.repoId, entry.file)}
                    title="开始这个下载，已有进度会接着传"
                  >
                    开始
                  </button>
                ) : null}
                <button
                  type="button"
                  className="hub__btn hub__btn--quiet"
                  onClick={() => onRemove(entry.repoId, entry.file)}
                  title="从清单里移除，已下载的文件不会被删除"
                >
                  移除
                </button>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
