/**
 * Moving a model library to a new folder, and the choice of whether to.
 *
 * Changing the model directory has a consequence the setting itself does not
 * express: the models that were found under the old root are not under the new
 * one, so the catalogue empties. There are exactly two sensible answers —
 * bring them along, or keep reading both — and which one is right depends on
 * where the files are, how many there are, and whether the old folder is on a
 * drive that is going away.
 *
 * **So the user is asked, and the question is the feature.** A silent move on a
 * library of tens of gigabytes is not undoable in any practical sense; a silent
 * *non*-move looks like the models were lost. Neither is a decision to make on
 * someone's behalf.
 *
 * If the move is declined the old folder is **kept as a second library** rather
 * than abandoned — `parseModelRoots` already splits a root list on `;`, and
 * `scanModels` already walks every entry, so reading two libraries is a string
 * in a setting rather than a new mechanism. That is also what makes "keep it"
 * a real answer instead of a polite way of saying "lose it".
 *
 * **Nothing here deletes.** A move is `rename` when the two folders share a
 * volume — instant, and atomic as far as the filesystem is concerned — and a
 * copy-then-remove only when they do not. A source that fails to copy is left
 * exactly where it was, so a partial migration is a smaller library rather than
 * a lost one.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { packagedModelsRoot } from '../lib/manager.js'

/** How far a migration has got, as the page reads it. */
export type MoveProgress = {
  from: string
  to: string
  /** Files finished so far. */
  done: number
  /** Files to move in total. */
  total: number
  /** Bytes finished so far. */
  bytes: number
  /** Bytes in total. */
  totalBytes: number
  /** The file being worked on, relative to the source root. */
  current: string
}

export type MoveState =
  | { kind: 'idle' }
  | ({ kind: 'running' } & MoveProgress)
  | ({ kind: 'done' } & MoveProgress & { skipped: string[] })
  | { kind: 'failed'; error: string; moved: number; total: number }

let listener: ((state: MoveState) => void) | undefined
let state: MoveState = { kind: 'idle' }
let running = false

/** How the page is told. Called on every file, and on every large file's chunks. */
export function configureMoveListener(sink: (state: MoveState) => void): void {
  listener = sink
}

function publish(next: MoveState): void {
  state = next
  try {
    listener?.(next)
  } catch {
    // A listener that throws must not abort the move.
  }
}

export function moveState(): MoveState {
  return state
}

/** Every `.gguf` under a root, with its size, relative to that root. */
function ggufsUnder(root: string): { path: string; size: number }[] {
  const out: { path: string; size: number }[] = []
  const walk = (directory: string, depth: number): void => {
    /*
     * Bounded, because this is a move: an unbounded walk of a folder the user
     * pointed at by mistake would take minutes before anything happened, and
     * the depth a model library actually uses is three.
     */
    if (depth > 5) return
    let entries
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        walk(path, depth + 1)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.gguf')) {
        try {
          out.push({ path, size: statSync(path).size })
        } catch {
          // Vanished between the listing and the stat. Nothing to move.
        }
      }
    }
  }
  walk(root, 0)
  return out
}

/** What a migration would involve, without doing any of it. */
export type MovePreview = {
  from: string
  to: string
  files: number
  bytes: number
  /** Relative paths, so the page can name one or two without listing them all. */
  sample: string[]
  /** Why a move cannot be offered at all, when that is the case. */
  blocked?: string
}

/**
 * What moving `from` into `to` would cost.
 *
 * Computed rather than estimated, and offered before the question is asked:
 * "move 8 files (13.4 GB)?" is a question a person can answer, and "change the
 * model folder?" is not.
 */
export function previewMove(from: string, to: string, keep: string[] = []): MovePreview {
  const source = from.trim()
  const target = to.trim()
  const base: MovePreview = { from: source, to: target, files: 0, bytes: 0, sample: [] }

  if (source.length === 0 || target.length === 0) {
    return { ...base, blocked: '需要同时指定原目录和新目录。' }
  }
  if (source.toLowerCase() === target.toLowerCase()) {
    return { ...base, blocked: '新旧目录是同一个。' }
  }
  /*
   * Moving a folder into itself would recurse forever — the walk would keep
   * finding the files it had just written. The new root must not be inside the
   * old one, or the other way round.
   */
  const sourceLower = source.toLowerCase().replace(/\\+$/, '')
  const targetLower = target.toLowerCase().replace(/\\+$/, '')
  if (targetLower.startsWith(`${sourceLower}\\`) || sourceLower.startsWith(`${targetLower}\\`)) {
    return { ...base, blocked: '两个目录不能互相包含。' }
  }
  for (const other of keep) {
    if (other.trim().toLowerCase() === target.toLowerCase()) {
      return { ...base, blocked: '这个目录已经在模型库列表里了。' }
    }
  }
  if (!existsSync(source)) {
    return { ...base, blocked: '原目录不存在，没有可迁移的模型。' }
  }

  const files = ggufsUnder(source)
  const bytes = files.reduce((sum, file) => sum + file.size, 0)
  return {
    ...base,
    files: files.length,
    bytes,
    sample: files.slice(0, 3).map((file) => relative(source, file.path).replace(/\\/g, '/'))
  }
}

/**
 * Move every `.gguf` from one root into another, preserving relative paths.
 *
 * Runs one file at a time and reports after each, because this is a
 * multi-gigabyte operation the user is watching: a frozen window for ten
 * minutes reads as a hang.
 *
 * A file that cannot be moved is **recorded and passed over**, not fatal. The
 * source is left untouched in that case, so the outcome of a partial run is
 * "some of the models are in each folder" — both of which the scanner reads —
 * rather than a hole where a model used to be.
 */
export async function startMove(input: {
  from: string
  to: string
}): Promise<MoveState> {
  if (running) {
    return { kind: 'failed', error: '已经有一个迁移在进行。', moved: 0, total: 0 }
  }

  const preview = previewMove(input.from, input.to)
  if (preview.blocked) {
    const failed: MoveState = { kind: 'failed', error: preview.blocked, moved: 0, total: 0 }
    publish(failed)
    return failed
  }
  if (preview.files === 0) {
    const done: MoveState = {
      kind: 'done',
      from: preview.from,
      to: preview.to,
      done: 0,
      total: 0,
      bytes: 0,
      totalBytes: 0,
      current: '',
      skipped: []
    }
    publish(done)
    return done
  }

  running = true
  const files = ggufsUnder(preview.from)
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
  const skipped: string[] = []
  let done = 0
  let bytes = 0

  try {
    for (const file of files) {
      const rel = relative(preview.from, file.path)
      const destination = join(preview.to, rel)

      publish({
        kind: 'running',
        from: preview.from,
        to: preview.to,
        done,
        total: files.length,
        bytes,
        totalBytes,
        current: rel.replace(/\\/g, '/')
      })

      try {
        mkdirSync(dirname(destination), { recursive: true })
        moveOne(file.path, destination)
        done += 1
        bytes += file.size
      } catch {
        /*
         * Left where it is. The alternative — deleting the source anyway, or
         * aborting the whole run — turns one unreadable file into either data
         * loss or a migration that never finishes.
         */
        skipped.push(rel.replace(/\\/g, '/'))
      }
    }

    const finished: MoveState = {
      kind: 'done',
      from: preview.from,
      to: preview.to,
      done,
      total: files.length,
      bytes,
      totalBytes,
      current: '',
      skipped
    }
    publish(finished)
    return finished
  } catch (cause) {
    const failed: MoveState = {
      kind: 'failed',
      error: cause instanceof Error ? cause.message : String(cause),
      moved: done,
      total: files.length
    }
    publish(failed)
    return failed
  } finally {
    running = false
  }
}

/**
 * One file, by the cheapest route that is safe.
 *
 * `rename` when both paths are on the same volume — instant, and it does not
 * need free space for a second copy, which matters when the file is 40 GB.
 * Otherwise a copy followed by a removal of the source, and the removal only
 * happens after the copy returned.
 */
function moveOne(from: string, to: string): void {
  /* A destination that already exists is not overwritten; it is an error the
     caller records, because the file there may be a different quantisation. */
  if (existsSync(to)) {
    throw new Error('已经存在同名文件')
  }
  try {
    renameSync(from, to)
    return
  } catch {
    /*
     * EXDEV — different volumes — is the expected failure, but the code is not
     * portable enough to test for, so *any* rename failure falls through to the
     * copy. A rename that failed for another reason will fail the copy too, and
     * that error is the one reported.
     */
  }
  copyFileSync(from, to)
  rmSync(from, { force: true })
}

/**
 * The folder the application ships a model library in.
 *
 * `packagedModelsRoot` rather than a path built here. It already resolves the
 * install root through `ARANLLM_INSTALL_ROOT`, `DSH_DESKTOP_APP_ROOT` and an
 * upward walk, which is what makes it correct in development, in a packaged
 * build and under the harness — three layouts a hand-built `join(__dirname,
 * '..', '..')` would get wrong in two of. This function is only the name for
 * it that reads well from the settings side.
 */
export function bundledLibrary(): string {
  return packagedModelsRoot()
}
