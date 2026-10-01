/**
 * Downloading a model file, resumably.
 *
 * A model file is the largest thing this application ever moves — the repository
 * measured while writing §3.1 holds a 46 GB member — and on the connections this
 * feature exists for, a download is measured in hours. That makes resumption the
 * requirement rather than the nicety: a transfer that restarts from zero after a
 * dropped connection is not slow, it is unusable.
 *
 * **The whole design turns on one measured fact.** The mirror honours `Range`
 * for LFS objects and silently ignores it for small cached files (§21.62.2).
 * Measured against the same host minutes apart:
 *
 *     .gguf, 8.4 GB   → 302 → 206 Partial Content, correct Content-Range
 *     config.json, 1 KB → 307 → 200 OK, whole body
 *
 * So a resuming request is answered either `206` — append from the offset — or
 * `200` — the server decided to send everything. **Appending a `200` body to a
 * partial file produces a file that is the right shape and the wrong contents**,
 * and nothing notices until the model is loaded and it refuses to parse. The
 * rule below is therefore not an optimisation: on `200` the partial file is
 * discarded and the download starts over.
 *
 * Only one download runs at a time (3.5 is not built yet), and it is cancellable
 * at any point — the partial file stays on disk so the next attempt resumes.
 */
import { createWriteStream, existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from './electron-shim.js'
import { downloadUrlFor, hubSource } from './hub'
import { currentModelRoots, invalidateModelIndex } from './local-models'

/** How far a download has got, as the page reads it. */
export type DownloadProgress = {
  repoId: string
  /** The path inside the repository, e.g. `Q4_K_M/model-00001-of-00002.gguf`. */
  file: string
  /** Where it is being written. */
  target: string
  /** Bytes on disk. */
  received: number
  /** Total bytes, or 0 when the server did not say. */
  total: number
  /** Bytes per second over the last sample window. */
  bytesPerSecond: number
  /** Whether this attempt picked up an existing partial file. */
  resumed: boolean
}

export type DownloadState =
  | { kind: 'idle' }
  | ({ kind: 'running' } & DownloadProgress)
  | ({ kind: 'done' } & DownloadProgress)
  | { kind: 'failed'; file: string; error: string; received: number; total: number }
  | { kind: 'cancelled'; file: string; received: number; total: number }

/** One file, as the download needs to know it. */
export type DownloadRequest = {
  repoId: string
  /** Path inside the repository. */
  file: string
  /** Bytes, from the file listing. Used to name the target and to size the bar. */
  size?: number
}

/**
 * Where a downloaded model goes.
 *
 * Into a model library root, not into a private downloads folder, and that is
 * the whole of §3.4: a file that lands anywhere else is not found by the
 * scanner, so it downloads for an hour and then does not appear in the model
 * list. Writing it straight to its final location also means the partial file
 * of an interrupted transfer is already in the right place for the next resume
 * — no multi-gigabyte copy at the end, and nothing for a crash to lose.
 *
 * The roots are the ones the scanner itself uses, in the same order, so a user
 * who has pointed the application at `D:\models` gets downloads there too
 * without configuring anything twice.
 *
 * The first root that exists *or can be created* wins. The others are tried in
 * turn, because a library on a disconnected drive is a normal state on a
 * machine with several and must not stop the download that could have gone to
 * the one still attached.
 */
function libraryRoot(): string | undefined {
  for (const root of currentModelRoots()) {
    try {
      mkdirSync(root, { recursive: true })
      return root
    } catch {
      // Not writable, or not mountable. Try the next one.
    }
  }
  return undefined
}

/**
 * The directory the repository's own layout is reproduced under, or undefined.
 *
 * `userData/downloads` is the last resort, used only when no library root can
 * be written. It is worse — the file will not be picked up by the scanner until
 * the user moves it — but it is better than refusing the download outright, and
 * the state says where the file went so the user can find it.
 */
function downloadsRoot(): string {
  return libraryRoot() ?? join(app.getPath('userData'), 'downloads')
}

/**
 * The local path for one repository file, inside a model library.
 *
 * The result is the library's own convention — `{发布者}/{模型名}/{仓库内路径}` —
 * and `repoId` is already `{发布者}/{模型名}`, so no mapping table is needed:
 * the repository's id and its internal layout *are* the path.
 *
 * Two properties follow from reproducing the repository's shape rather than
 * flattening it:
 *
 * - **Shards stay together.** `Q4_K_M/model-00001-of-00002.gguf` lands in a
 *   subdirectory beside its sibling, which is what llama.cpp requires to load
 *   either of them. Flattened, they would be scattered among unrelated files.
 * - **Repositories cannot collide.** Two publishers offering `model.gguf` are
 *   two directories, so the second download cannot overwrite the first — on a
 *   40 GB file that would be a silent and expensive loss.
 *
 * **The path from the repository is not trusted.** It is a string from a remote
 * index, and `..` in it would write outside the library. Each segment is
 * validated and the resolved path is checked to still be under the root.
 */
export function downloadTarget(repoId: string, file: string): string | undefined {
  const root = downloadsRoot()
  const repoParts = repoId.split('/')
  const fileParts = file.split('/')
  for (const part of [...repoParts, ...fileParts]) {
    if (part.length === 0 || part === '.' || part === '..') return undefined
    // Windows refuses these outright; a name containing one is not a real file.
    if (/[<>:"|?*]/.test(part)) return undefined
  }
  const target = join(root, ...repoParts, ...fileParts)
  /*
   * Checked after joining rather than by inspecting the input: the separator
   * and drive-letter rules differ per platform, and `resolve` is what the
   * filesystem will actually use. The trailing separator matters — without it
   * a sibling directory whose name starts with the root's would pass.
   */
  if (!target.startsWith(root + (process.platform === 'win32' ? '\\' : '/'))) return undefined
  return target
}

/* ── The one running download ────────────────────────────────────────────── */

let current: AbortController | undefined
let state: DownloadState = { kind: 'idle' }
let listener: ((state: DownloadState) => void) | undefined

/** How the page is told. Called on every progress tick. */
export function configureDownloadListener(sink: (state: DownloadState) => void): void {
  listener = sink
}

function publish(next: DownloadState): void {
  state = next
  try {
    listener?.(next)
  } catch {
    // A listener that throws must not abort the transfer.
  }
  /*
   * The rate shown for the whole queue is the running transfer's rate.
   *
   * Carried across here rather than inside the transfer loop, because this is
   * the one place every progress tick passes through — a reader of the queue
   * wants "how fast is this going", and there is only ever one transfer to ask.
   *
   * Guarded on a change so the two channels do not double the event traffic: a
   * tick that does not move the number has nothing to say about the queue, and
   * a queue publish rebuilds the whole state object on the other side.
   */
  if (next.kind === 'running') {
    const rate = next.bytesPerSecond
    if (queue.active && queue.speedBytesPerSecond !== rate) {
      publishQueue({ ...queue, speedBytesPerSecond: rate })
    }
  }
}

export function downloadState(): DownloadState {
  return state
}

/**
 * The bytes that are already on disk for a target, or 0.
 *
 * Reported as 0 for anything unreadable, which makes the next attempt start
 * from the beginning — the safe direction to be wrong in, since a stale size
 * would otherwise be used as a resume offset against a file that is not there.
 */
function partialSize(target: string): number {
  try {
    const stats = statSync(target)
    return stats.isFile() ? stats.size : 0
  } catch {
    return 0
  }
}

/** Seconds since the transfer began, for the average speed shown on failure. */
function megabytes(bytes: number): string {
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

/**
 * Publish a finished download and mark the model index stale.
 *
 * One place rather than four, because this module reaches "done" by four
 * different routes — the file was already complete, the server answered 416,
 * the third `startDownload` recursion settled, or the stream ended — and each
 * one now has to do the same second thing as well as reporting success.
 * Missing it on one path is a download that works and a model list that does
 * not show it, which is the exact failure the index invalidation exists to
 * prevent.
 */
function succeed(progress: DownloadProgress): Extract<DownloadState, { kind: 'done' }> {
  const done = { kind: 'done' as const, ...progress }
  invalidateModelIndex()
  publish(done)
  return done
}

/**
 * Fetch one file, resuming if a partial one is on disk.
 *
 * Resolves when the file is complete. Rejects only for a reason the user can act
 * on; a cancel resolves through the `cancelled` state instead, because it is not
 * a failure.
 */
export async function startDownload(request: DownloadRequest): Promise<DownloadState> {
  if (current) {
    return { kind: 'failed', file: request.file, error: '已经有一个下载在进行。', received: 0, total: 0 }
  }

  const target = downloadTarget(request.repoId, request.file)
  if (!target) {
    return { kind: 'failed', file: request.file, error: '文件路径不合法，已拒绝下载。', received: 0, total: 0 }
  }

  const total = request.size ?? 0
  let received = partialSize(target)
  const resumed = received > 0

  /*
   * A partial file larger than the expected total is not resumable.
   *
   * It means the size changed under us — the repository was updated, or a
   * previous run wrote against a different revision. Resuming would append to
   * bytes that belong to another file, so it is deleted and restarted. Only
   * checked when a size was reported; without one there is nothing to compare.
   */
  if (total > 0 && received > total) {
    try {
      rmSync(target, { force: true })
    } catch {
      // Falls through: the Range request below will fail on its own if the
      // file cannot be replaced, and that error is more specific.
    }
    received = 0
  }

  if (total > 0 && received === total) {
    /*
     * Already on disk in full. Reached when a previous session finished and the
     * user asks again — with no `done` event ever having been delivered for it,
     * since states are not persisted. Reported as `resumed` because it is one:
     * nothing was transferred.
     */
    return succeed({
      repoId: request.repoId,
      file: request.file,
      target,
      received,
      total,
      bytesPerSecond: 0,
      resumed: true
    })
  }

  try {
    mkdirSync(dirname(target), { recursive: true })
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : String(cause)
    const failed: DownloadState = { kind: 'failed', file: request.file, error: `无法创建目录：${error}`, received, total }
    publish(failed)
    return failed
  }

  const controller = new AbortController()
  current = controller

  /*
   * The source is read once, here, and travels with the request.
   *
   * Not re-read per attempt: a user switching hosts mid-download would otherwise
   * have the next resume fetch a different file's bytes into the same partial —
   * the offset would be valid for one host and meaningless for the other.
   */
  const url = downloadUrlFor(hubSource(), request.repoId, request.file)
  const headers: Record<string, string> = {}
  if (received > 0) headers.Range = `bytes=${String(received)}-`

  let response: Response
  try {
    response = await fetch(url, { headers, signal: controller.signal })
  } catch (cause) {
    current = undefined
    const cancelled = controller.signal.aborted
    const error = cause instanceof Error ? cause.message : String(cause)
    const failed: DownloadState = cancelled
      ? { kind: 'cancelled', file: request.file, received, total }
      : { kind: 'failed', file: request.file, error: `无法连接：${error}`, received, total }
    publish(failed)
    return failed
  }

  /*
   * The rule this module exists for, and it reads `Content-Range` — not the
   * status code.
   *
   * The status code was the first version of this test, and it was wrong in a
   * way that only a second mirror revealed. Measured across both:
   *
   *     hf-mirror  8.4 GB .gguf   → 206, Content-Range present, honoured
   *     hf-mirror  1 KB  json     → 200, no Content-Range,  whole file sent
   *     ModelScope 16 GB .gguf    → 206, Content-Range present, honoured
   *     ModelScope 2 KB  file     → 200, **Content-Range present, honoured**
   *
   * That last line is the one that matters: a `200` that nevertheless starts at
   * the requested offset and sends only the requested span. Treating it as "the
   * server ignored the Range" — which is what testing `status === 206` does —
   * discards a perfectly good continuation and restarts the file from zero, on
   * every reconnect. The bug is invisible against hf-mirror alone.
   *
   * So the question asked is the literal one: did the body start where it was
   * asked to start?
   *
   *     Content-Range `bytes <start>-…` with start === offset → append
   *     anything else                                        → the whole file
   *
   * Appending a whole file to a partial one produces a file of the right shape
   * and the wrong contents, and nothing notices until it fails to load — so the
   * default when the answer is unclear is to start over.
   */
  let append = false
  if (received > 0) {
    const contentRange = response.headers.get('content-range') ?? ''
    const start = /^bytes\s+(\d+)-/.exec(contentRange.trim())?.[1]
    append = start !== undefined && Number(start) === received

    if (!append) received = 0

    if (response.status === 416) {
      /*
       * The offset is at or past the end. Measured: asking for `bytes=<size>-`
       * answers 416. With a partial file present this means it is already
       * complete; without a size to check against, it is safer to restart.
       */
      current = undefined
      if (total > 0) {
        return succeed({
          repoId: request.repoId,
          file: request.file,
          target,
          received,
          total,
          bytesPerSecond: 0,
          resumed: true
        })
      }
      try {
        rmSync(target, { force: true })
      } catch {
        // The retry below will report anything that matters.
      }
      received = 0
      return await startDownload(request)
    }
  }

  if (!response.ok && response.status !== 206 && response.status !== 200) {
    current = undefined
    const failed: DownloadState = {
      kind: 'failed',
      file: request.file,
      error:
        response.status === 401 || response.status === 403
          ? '仓库不存在，或这个文件需要授权才能下载。'
          : response.status === 404
            ? '这个文件在仓库里找不到，可能已被删除或改名。'
            : `镜像返回 HTTP ${String(response.status)}。`,
      received,
      total
    }
    publish(failed)
    return failed
  }

  /*
   * The total from the response is preferred over the one from the listing.
   *
   * On a resumed transfer `Content-Range` reports the *file's* size, while
   * `Content-Length` reports only this chunk's — using the latter would make
   * the bar jump around on every reconnect.
   */
  const contentRange = response.headers.get('content-range') ?? ''
  const sizeFromRange = /\/\s*(\d+)\s*$/.exec(contentRange)?.[1]
  const effectiveTotal = sizeFromRange ? Number(sizeFromRange) : (request.size ?? 0)

  const body = response.body
  if (!body) {
    current = undefined
    const failed: DownloadState = { kind: 'failed', file: request.file, error: '镜像没有返回内容。', received, total: effectiveTotal }
    publish(failed)
    return failed
  }

  return await new Promise<DownloadState>((resolve) => {
    const stream = createWriteStream(target, { flags: append ? 'a' : 'w' })

    /*
     * Sampled over a window rather than computed per chunk.
     *
     * A per-chunk rate on a fast connection flickers between absurd numbers
     * because the chunks are milliseconds apart; a one-second window is the
     * interval a person can actually read.
     */
    let windowStart = Date.now()
    let windowBytes = 0
    let rate = 0
    const started = Date.now()

    const finish = (next: DownloadState): void => {
      stream.destroy()
      current = undefined
      publish(next)
      resolve(next)
    }

    stream.on('error', (cause) => {
      finish({ kind: 'failed', file: request.file, error: `写入失败：${cause.message}`, received, total: effectiveTotal })
    })

    controller.signal.addEventListener(
      'abort',
      () => {
        finish({ kind: 'cancelled', file: request.file, received, total: effectiveTotal })
      },
      { once: true }
    )

    void (async () => {
      const reader = body.getReader()
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          if (controller.signal.aborted) return
          if (!value) continue

          received += value.byteLength
          windowBytes += value.byteLength
          if (!stream.write(Buffer.from(value))) {
            /*
             * Back-pressure is awaited rather than ignored: a 46 GB transfer
             * fills the write buffer long before it finishes, and continuing
             * to read would hold the whole difference in memory.
             */
            await new Promise<void>((drain) => stream.once('drain', () => drain()))
          }

          const now = Date.now()
          if (now - windowStart >= 1000) {
            rate = (windowBytes / (now - windowStart)) * 1000
            windowBytes = 0
            windowStart = now
            publish({
              kind: 'running',
              repoId: request.repoId,
              file: request.file,
              target,
              received,
              total: effectiveTotal,
              bytesPerSecond: rate,
              resumed
            })
          }
        }
      } catch (cause) {
        if (controller.signal.aborted) return
        const error = cause instanceof Error ? cause.message : String(cause)
        finish({ kind: 'failed', file: request.file, error: `传输中断：${error}`, received, total: effectiveTotal })
        return
      }

      stream.end(() => {
        /*
         * The average is used for the final tick rather than the last window:
         * the last second of a long transfer is often its slowest, and that is
         * the number that would otherwise be left on screen.
         */
        const elapsed = Math.max(1, Date.now() - started)
        /*
         * The index is marked stale here rather than inside `finish`, which is
         * shared with the failure paths — a failed transfer has not changed the
         * tree. Clearing it on failure would rescan for nothing, on a library
         * that may hold hundreds of files.
         */
        invalidateModelIndex()
        finish({
          kind: 'done',
          repoId: request.repoId,
          file: request.file,
          target,
          received,
          total: effectiveTotal,
          bytesPerSecond: received > 0 ? (received / elapsed) * 1000 : 0,
          resumed
        })
      })
    })()
  })
}

/**
 * Whether trying again could plausibly succeed.
 *
 * The distinction the panel needs and the one a single error string cannot
 * carry. A dropped connection or a timeout leaves a partial file that resumes
 * exactly where it stopped, so the useful action is "retry". A 404 means the
 * file is not there, and a retry will say so again — offering it would be
 * inviting the user to wait out the same failure twice.
 *
 * Matched on the message rather than on a code because the code is not carried
 * this far: every failure below becomes a string for the panel to print.
 */
function isResumable(error: string): boolean {
  if (/404|不存在|找不到/.test(error)) return false
  if (/401|403|授权/.test(error)) return false
  /* Everything else — timeouts, resets, image errors — is worth another try. */
  return true
}

/** Stop the running download. The partial file is kept so a retry resumes. */
export function cancelDownload(): boolean {
  if (!current) return false
  current.abort()
  return true
}

/** What the page shows when a download fails, for a message it can act on. */
export function describeFailure(state: Extract<DownloadState, { kind: 'failed' }>): string {
  if (state.received > 0) {
    return `${state.error}（已下载 ${megabytes(state.received)}，重试会从断点继续）`
  }
  return state.error
}

/** Whether the target file is already complete on disk. */
export function isComplete(request: DownloadRequest): boolean {
  const target = downloadTarget(request.repoId, request.file)
  if (!target || !existsSync(target)) return false
  if (request.size === undefined) return false
  return partialSize(target) === request.size
}

/* ── The queue ───────────────────────────────────────────────────────────── */

/**
 * A list of files to fetch one after another.
 *
 * The queue lives here rather than in the page, and that is the whole point of
 * it. A page-level loop was the first version and had three faults, each a
 * consequence of where the list was kept:
 *
 * 1. **Leaving the page stopped the queue.** The transfer itself carries on in
 *    this process — it has to, or a download would die on any re-render — but
 *    the loop that begins the *next* file does not. A user who picked ten
 *    models and then went to look at their chat got one.
 * 2. **One failure ended the rest.** Picking ten files and having the third
 *    return 404 left seven that would have succeeded unfetched, because the
 *    loop returned instead of continuing.
 * 3. **Nothing was visible.** "Downloading 3 of 10" is the fact a user wants,
 *    and it cannot be read off a bar that describes a single file.
 *
 * **Sequential, not parallel.** Three concurrent 20 GB transfers on a link that
 * cannot carry them finish later than the same three in order, and when one
 * fails the user has to work out which. There is also nothing to reconcile:
 * with one writer, a partial file has exactly one possible owner.
 */
export type QueueItem = {
  repoId: string
  file: string
  size?: number
}

export type QueueState = {
  /** Waiting to start, in the order they will run. */
  pending: QueueItem[]
  /** The one being fetched now, if any. */
  active?: QueueItem
  /**
   * Finished successfully, newest first.
   *
   * The entries and not a count, because the panel lists them — "3 completed"
   * tells a user how many and not which, and the one they want to check on is
   * always a particular file. Bounded in `noteCompleted` so a long session
   * cannot grow this without limit.
   */
  completed: QueueItem[]
  /**
   * Bytes across everything in this run — pending, active and completed.
   *
   * The denominator of the overall progress. Counted in bytes rather than in
   * files because files are not comparable: a run of nine 1 GB quants and one
   * 40 GB one is not 90% done when nine have finished.
   */
  totalBytes: number
  /** Bytes finished, summed from the completed entries. */
  doneBytes: number
  /** Bytes per second over the active transfer, or 0. */
  speedBytesPerSecond: number
  /** Of the finished ones, the ones that failed. */
  failed: { file: string; error: string; resumable: boolean }[]
  /** Whether the user has asked for the queue to stop after the current file. */
  stopping: boolean
}

/** How many finished entries are kept for the panel to list. */
const COMPLETED_KEEP = 40

const IDLE_QUEUE: QueueState = {
  pending: [],
  completed: [],
  totalBytes: 0,
  doneBytes: 0,
  speedBytesPerSecond: 0,
  failed: [],
  stopping: false
}

let queue: QueueState = IDLE_QUEUE
let runner: Promise<void> | undefined
let queueListener: ((state: QueueState) => void) | undefined

/** How the page is told about queue changes. */
export function configureQueueListener(sink: (state: QueueState) => void): void {
  queueListener = sink
}

function publishQueue(next: QueueState): void {
  queue = next
  try {
    queueListener?.(next)
  } catch {
    // A listener that throws must not stop the queue.
  }
}

export function queueState(): QueueState {
  return queue
}

/**
 * Add files and start working through them.
 *
 * Appending rather than replacing: a user who picks three files, starts them,
 * then goes back for two more means five downloads, not two. An item already
 * queued or already running is not added twice — the same file twice would be
 * two entries writing one path.
 */
export function enqueue(items: QueueItem[]): QueueState {
  const known = new Set([
    ...queue.pending.map((item) => `${item.repoId} ${item.file}`),
    ...(queue.active ? [`${queue.active.repoId} ${queue.active.file}`] : [])
  ])
  const fresh = items.filter((item) => {
    const key = `${item.repoId} ${item.file}`
    if (known.has(key)) return false
    known.add(key)
    return true
  })
  if (fresh.length === 0 && runner) return queue

  /*
   * The denominator grows with what is queued, not with what has finished.
   *
   * A file whose size the host did not report contributes nothing rather than
   * an estimate — the total is then smaller than the truth and the bar reads
   * high. That is the honest direction to be wrong in: it never claims more
   * progress than has actually happened.
   */
  const addedBytes = fresh.reduce((sum, item) => sum + (item.size ?? 0), 0)

  publishQueue({
    ...queue,
    pending: [...queue.pending, ...fresh],
    totalBytes: queue.totalBytes + addedBytes,
    stopping: false
  })
  if (!runner) {
    runner = drain().finally(() => {
      runner = undefined
    })
  }
  return queue
}

/**
 * Stop after the current file.
 *
 * Not immediate, and deliberately: aborting mid-file discards the bytes already
 * written, and those bytes are exactly what makes a retry cheap. The current
 * transfer is left to finish; the queue stops before the next one starts.
 *
 * `cancelDownload()` is the way to stop *now*, and it is a different request —
 * the partial file survives either way.
 */
export function stopQueue(): QueueState {
  publishQueue({ ...queue, pending: [], stopping: true })
  return queue
}

/** Clear the finished record, leaving anything still queued or running. */
export function clearQueueHistory(): QueueState {
  /*
   * The byte totals go back to whatever is still outstanding.
   *
   * They are not simply zeroed: a clear while something is queued must leave
   * that item's size in the denominator, or the bar would read 100% with work
   * still to do. `totalBytes` minus what was finished is exactly the
   * outstanding amount, and `doneBytes` starts again from zero.
   */
  const outstanding = queue.totalBytes - queue.doneBytes
  publishQueue({
    ...queue,
    completed: [],
    doneBytes: 0,
    totalBytes: Math.max(0, outstanding),
    failed: []
  })
  return queue
}

async function drain(): Promise<void> {
  for (;;) {
    const next = queue.pending[0]
    if (!next) break
    if (queue.stopping) break

    publishQueue({ ...queue, pending: queue.pending.slice(1), active: next })

    const result = await startDownload(next)

    /*
     * Re-read rather than reusing the captured value: a cancel, an enqueue or a
     * stop may have landed while the transfer ran, and the state worth
     * publishing is the one that includes them.
     */
    const failed =
      result.kind === 'failed'
        ? [...queue.failed, { file: next.file, error: result.error, resumable: isResumable(result.error) }]
        : queue.failed
    const completed =
      result.kind === 'done' ? [next, ...queue.completed].slice(0, COMPLETED_KEEP) : queue.completed
    const doneBytes = result.kind === 'done' ? queue.doneBytes + (next.size ?? 0) : queue.doneBytes
    publishQueue({
      ...queue,
      active: undefined,
      completed,
      doneBytes,
      /* Only the active transfer has a rate; nothing running means no rate. */
      speedBytesPerSecond: 0,
      failed
    })

    /*
     * A cancelled transfer stops the queue: the user pressed cancel, and
     * starting the next file would be the opposite of what that means. A failed
     * one does not — a 404 on one quantisation says nothing about the other
     * nine, and stopping would strand downloads that were going to work.
     */
    if (result.kind === 'cancelled') {
      publishQueue({ ...queue, pending: [], stopping: true })
      return
    }
  }
  /*
   * Reached only when the queue ran out of work rather than being stopped, so
   * `stopping` is cleared here and nowhere else.
   *
   * It was cleared here unconditionally, which the cancel path then overwrote
   * on the very next line — the flag was set and immediately reset, so the page
   * showed "stopping" for no longer than a frame and then went back to looking
   * idle while the queue was in fact finished. Returning early keeps the two
   * endings separate.
   */
  publishQueue({ ...queue, active: undefined, stopping: false })
}
