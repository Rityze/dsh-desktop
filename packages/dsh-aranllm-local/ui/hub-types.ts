/**
 * The model hub data shapes.
 *
 * Copied from the desktop application, where they were the contract between the
 * hub page and its preload channels. Only the values that cross to the page are
 * here: the channel declarations and the browser fallbacks stay behind, because
 * nothing in this host talks over IPC.
 */
export type HubSourceId = 'hf-mirror' | 'modelscope'

/** One repository as the search list shows it. */
export type HubRepo = {
  id: string
  downloads: number
  likes: number
  /** ISO timestamp, or empty when the mirror did not report one. */
  updatedAt: string
  /** Whether the repository carries anything this application can load. */
  hasGguf: boolean
  tags: string[]
}

/** A page of search results, with the cursor that fetches the next one. */
export type HubSearchPage = {
  repos: HubRepo[]
  /**
   * What fetches the next page. Absent on the last one.
   *
   * Opaque: a cursor on one host and a page number on the other, and neither
   * means anything to the other. Passed back unchanged.
   */
  nextPage?: string
}

/** One file in a repository. */
export type HubFile = {
  path: string
  /** Bytes, or undefined when the mirror did not report a size. */
  size?: number
  /** Read from the file name, or undefined when the name says nothing. */
  quantization?: string
  /** True for the multimodal projector half of a vision model. */
  isProjector: boolean
}

export type HubFiles = {
  id: string
  files: HubFile[]
  /** Total bytes across every `.gguf`, so a pick can be weighed first. */
  ggufBytes: number
}

/**
 * Where a download has got to.
 *
 * One shape for all four states rather than a discriminated union with differing
 * fields, because the progress panel draws the same three lines in every one of
 * them and only the wording changes. `total` is 0 when the server did not say,
 * which is what makes the bar sweep instead of filling.
 */
export type HubDownloadState = {
  kind: 'idle' | 'running' | 'done' | 'cancelled' | 'failed'
  /** The path inside the repository. */
  file: string
  /** Where it is being written, once the transfer started. */
  target?: string
  received: number
  total: number
  bytesPerSecond?: number
  /** Whether this attempt picked up a partial file rather than starting fresh. */
  resumed?: boolean
  error?: string
}

/** One file waiting in the download queue. */
export type HubQueueItem = {
  repoId: string
  file: string
  size?: number
}

/**
 * The download queue.
 *
 * Held by the main process so it outlives the page that started it, which is
 * the property that makes "pick ten models, go and read your chat" work.
 */
export type HubQueueState = {
  pending: HubQueueItem[]
  active?: HubQueueItem
  /**
   * Finished successfully, newest first.
   *
   * The entries and not a count, because the panel lists them — "3 completed"
   * says how many and not which, and the one a user wants to check on is always
   * a particular file.
   */
  completed: HubQueueItem[]
  /**
   * Bytes across everything in this run — pending, active and completed.
   *
   * The denominator of the overall bar. Counted in bytes rather than files
   * because files are not comparable: nine finished 1 GB quants and one 40 GB
   * model left is not 90% done.
   */
  totalBytes: number
  /** Bytes finished, summed from the completed entries. */
  doneBytes: number
  /** Bytes per second over the active transfer, or 0 when nothing runs. */
  speedBytesPerSecond: number
  /**
   * Of the finished ones, the ones that failed.
   *
   * `resumable` is whether trying again could plausibly succeed: a dropped
   * connection leaves a partial file that resumes, a 404 will say the same
   * thing next time. Offering "retry" for both invites waiting out the same
   * failure twice.
   */
  failed: { file: string; error: string; resumable: boolean }[]
  /**
   * Whether the queue is holding rather than running.
   *
   * A field this host added: the desktop shell could only empty a queue, so it
   * had no state that meant "stop for now and keep what is waiting". A restored
   * queue comes back with this set, which is what makes the list a thing a user
   * starts rather than a thing that starts itself.
   */
  paused?: boolean
  stopping: boolean
}

/** How the application reaches the network. */
export type HubProxyMode = 'system' | 'none' | 'manual'

export type HubProxySettings = {
  mode: HubProxyMode
  /** Only meaningful for `manual`. */
  url?: string
}

export type HubProxyModeChoice = {
  id: HubProxyMode
  label: string
  note: string
}

/* ── The model library ───────────────────────────────────────────────────── */

/**
 * What moving the library would cost, computed rather than estimated.
 *
 * `blocked` carries the reason a move cannot be offered at all — the two
 * folders are the same, one contains the other, the source is not there. Those
 * are worth saying before the question is asked: a user who cannot move has a
 * different decision to make than one who can.
 */
