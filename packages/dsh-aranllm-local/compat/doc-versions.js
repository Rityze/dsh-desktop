/**
 * Versions of a document, kept beside it.
 *
 * ## What this is for
 *
 * The office pane can edit a workbook and cannot save it — that is deliberate,
 * and it matches the official desktop, whose office routes have no write-back
 * either. What it leaves out is the ability to *try* something: an edit that
 * turns out wrong has nowhere to go back to, because there was never anything to
 * go back to.
 *
 * A version is a snapshot of the bytes, taken on demand or before a change that
 * something else is about to make. The pane can then be handed any of them.
 *
 * ## Why the bytes rather than a diff
 *
 * A diff of an OOXML package is a diff of a zip: a changed formula rewrites the
 * whole shared-strings table, so the diff is larger than one side of it. And a
 * diff needs something to apply it to — the version immediately before it — so
 * losing one version loses every one after it.
 *
 * Snapshots are independent. A version can be restored from any later state, and
 * a corrupted one costs only itself.
 *
 * ## Where they live
 *
 * In this application's own data directory, keyed by a hash of the absolute
 * path, not next to the file. A `report.docx` in a project the user shares would
 * otherwise grow a `.report.docx.versions/` directory they never asked for and
 * would have to explain to whoever they send the project to.
 *
 * ## The size cap, and why it is counted rather than estimated
 *
 * Every version is a full copy, so an afternoon of edits on a large deck is a
 * lot of megabytes. The cap is on the total, and it is enforced by **deleting
 * the oldest first** — the version a user wants back is almost always a recent
 * one, and refusing to record a new version because old ones fill the budget
 * would make the feature stop working exactly when it is being used.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

/** One stored version, pane lists them. */


/** How much all versions of one document may take. */
const BUDGET_BYTES = 256 * 1024 * 1024

/** How many versions of one document are kept, whatever their size. */
const MAX_VERSIONS = 40

/** Where one document's versions live. See the header for why not beside it. */
function folderFor(dataDirectory, absPath) {
  /*
   * A hash of the resolved path rather than the path itself: a Windows path is
   * not a legal directory name (`:` and `\`), and the hash is stable across
   * runs which is what makes a version findable tomorrow.
   */
  const digest = createHash('sha256').update(absPath).digest('hex').slice(0, 16)
  return join(dataDirectory, 'docversions', `${digest}-${basename(absPath).replace(/[^\w.-]/g, '_')}`)
}


/** Everything stored for one document, newest first. */
function list(folder) {
  if (!existsSync(folder)) return []
  const entries = []
  let names
  try {
    names = readdirSync(folder)
  } catch {
    return []
  }
  for (const name of names) {
    /* `<epoch>-<id>.json` beside `<epoch>-<id>.bin`. The metadata file is the
       marker: a `.bin` with no `.json` is a write that was interrupted, and
       listing it would offer a restore into nothing. */
    if (!name.endsWith('.json')) continue
    try {
      const meta = JSON.parse(readFileSync(join(folder, name), 'utf8'))
      entries.push({ ...meta, id: name.slice(0, -'.json'.length), file: join(folder, name) })
    } catch {
      /* An unreadable entry costs itself. */
    }
  }
  return entries.sort((left, right) => right.at - left.at)
}

/** Drop the oldest until the folder is inside both limits. */
function trim(folder) {
  const entries = list(folder)
  let total = entries.reduce((sum, entry) => sum + entry.bytes, 0)
  const survivors = entries.slice(0, MAX_VERSIONS)
  for (const dropped of entries.slice(MAX_VERSIONS)) {
    rmSync(dropped.file.replace(/\.json$/, '.bin'), { force: true })
    rmSync(dropped.file, { force: true })
  }
  for (let index = survivors.length - 1; index >= 0 && total > BUDGET_BYTES; index--) {
    const entry = survivors[index]
    if (!entry) continue
    rmSync(entry.file.replace(/\.json$/, '.bin'), { force: true })
    rmSync(entry.file, { force: true })
    total -= entry.bytes
  }
}

/** Store one version. Returns what was written. */
export function recordVersion(dataDirectory, request) {
  const folder = folderFor(dataDirectory, request.absPath)
  mkdirSync(folder, { recursive: true })

  const at = Date.now()
  const id = `${String(at)}-${Math.random().toString(36).slice(2, 8)}`
  const bytes = Buffer.from(request.base64, 'base64')
  writeFileSync(join(folder, `${id}.bin`), bytes)
  const meta = {
    at,
    bytes: bytes.byteLength,
    source: request.source,
    ...(request.note !== undefined && request.note.length > 0 ? { note: request.note } : {})
  }
  writeFileSync(join(folder, `${id}.json`), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  trim(folder)
  return { id, ...meta }
}

/**
 * The first version of a document, recorded once.
 *
 * `init` rather than `record` because the caller is a pane that has just opened
 * a file and wants a baseline: the state the user started from. Doing it on
 * every open would store a copy per visit whether or not anything changed, which
 * is how a version list becomes forty identical entries.
 *
 * So it writes only when there is nothing stored yet, or when the newest stored
 * version is not the same bytes. The second case is the interesting one: a file
 * edited outside this application and reopened is a new baseline, and one that
 * silently keeps the old one would restore the user to a state they never saw.
 */
export function initVersion(dataDirectory, request) {
  const folder = folderFor(dataDirectory, request.absPath)
  const existing = list(folder)
  const incoming = Buffer.from(request.base64, 'base64')
  const newest = existing[0]
  if (newest !== undefined) {
    try {
      const stored = readFileSync(newest.file.replace(/\.json$/, '.bin'))
      if (stored.byteLength === incoming.byteLength && stored.equals(incoming)) return undefined
    } catch {
      /* Unreadable newest — treat and store. */
    }
  }
  return recordVersion(dataDirectory, {
    absPath: request.absPath,
    base64: request.base64,
    source: 'baseline',
    ...(request.note !== undefined ? { note: request.note } : {})
  })
}

/** What is stored for a document. */
export function listVersions(dataDirectory, absPath) {
  const folder = folderFor(dataDirectory, absPath)
  return list(folder).map((entry) => {
    const { file, ...rest } = entry
    void file
    return rest
  })
}

/** One version's bytes, base64, or nothing when it is gone. */
export function readVersion(dataDirectory, request) {
  /* The id is checked against the listing rather than joined onto the folder
     directly: an id arriving over IPC is a string from page script, and
     `../../` in it would read a file this function was never asked about. */
  const entry = list(folderFor(dataDirectory, request.absPath)).find((each) => each.id === request.id)
  if (!entry) return undefined
  try {
    return { base64: readFileSync(entry.file.replace(/\.json$/, '.bin')).toString('base64') }
  } catch {
    return undefined
  }
}

/**
 * Put a version back into the file it came from.
 *
 * ## Why this records before it overwrites
 *
 * The interesting property of a restore is that it is **reversible**. Without
 * the line below, one click on `v3` would destroy whatever was in the file, and
 * the version list — which exists so a wrong turn has somewhere to go back to —
 * would itself be the wrong turn. So the current bytes are stored first,
 * ordinary version with `source: 'before-restore'`, and the list immediately
 * after a restore has a new newest entry that undoes it.
 *
 * ## Why the caller supplies the bytes to compare against
 *
 * `current` is what the caller read from the file a moment ago. It is used only
 * to decide whether the restore would be a no-op, and passing it in rather than
 * reading it here keeps this function free of the workspace rules — the caller
 * has already resolved and checked the path, and a second read here would be a
 * second chance to get that wrong.
 *
 * Returns the version that was restored, or a sentence saying why not.
 */
export function restoreVersion(dataDirectory, request) {
  const stored = readVersion(dataDirectory, { absPath: request.absPath, id: request.id })
  if (stored === undefined) return { ok: false, reason: '找不到这个版本。' }

  const bytes = Buffer.from(stored.base64, 'base64')
  if (request.current !== undefined && request.current === stored.base64) {
    /* Already there. Writing it back would work and would also add a version
       that differs from its predecessor by nothing, which is how a list fills
       with entries a reader cannot tell apart. */
    const existing = list(folderFor(dataDirectory, request.absPath)).find(
      (entry) => entry.id === request.id
    )
    return existing === undefined
      ? { ok: false, reason: '找不到这个版本。' }
      : { ok: true, version: existing }
  }

  if (request.current !== undefined) {
    recordVersion(dataDirectory, {
      absPath: request.absPath,
      base64: request.current,
      source: 'before-restore',
      note: '回退前的状态'
    })
  }

  try {
    /*
     * No `mkdir` for the parent: the file being restored is the one the version
     * was taken from, so it existed when the list was drawn a moment ago. A
     * deleted file is a case this does not invent a directory for — the message
     * from `writeFileSync` says which path is missing, and that is more use
     * than a directory this function created on a guess.
     */
    writeFileSync(request.absPath, bytes)
  } catch (cause) {
    return { ok: false, reason: cause instanceof Error ? cause.message : '写不回去。' }
  }

  const restored = list(folderFor(dataDirectory, request.absPath)).find(
    (entry) => entry.id === request.id
  )
  return restored === undefined
    ? { ok: false, reason: '版本写回了，但记录不见了。' }
    : { ok: true, version: restored }
}

/**
 * Total bytes stored for a document, for a header line.
 *
 * Summed from the entries rather than read folder's own `size`. A
 * directory's `size` is the size of its directory record — 0 on NTFS, one block
 * on ext4 — and it has nothing to do with what is inside it. The first version
 * of this returned that number, which would have reported "0 B stored" beside a
 * list of a dozen versions.
 */
export function versionUsage(dataDirectory, absPath) {
  return list(folderFor(dataDirectory, absPath)).reduce((sum, entry) => sum + entry.bytes, 0)
}
