/**
 * Bringing a model file that is already on disk into the library.
 *
 * The download path puts a model into the standard layout because it knows where
 * it came from: the mirror names a repository, and `{publisher}/{model}/` falls
 * out of that name. A file the user already has does not carry that — it is in a
 * downloads folder, or on another drive, and it is named whatever its uploader
 * called it.
 *
 * ## The layout it aims at
 *
 *     <library>/<publisher>/<model>/<file>.gguf
 *
 * `publisher` is `local` when nothing says otherwise. The scanner does not need
 * it — it reads the architecture and quantisation out of the GGUF header — but
 * the layout is what `§11.5` settled on for ids, and a file placed beside a
 * downloaded one should look like it belongs there.
 *
 * `model` is the file name with its quantisation and shard markers removed, so
 * `Qwen3.8-27B-UD-Q4_K_M.gguf` lands in `Qwen3.8-27B/`. That keeps the several
 * quants of one model in one folder, which is how a reader thinks about them.
 *
 * ## Why it is a copy and not a move
 *
 * The file may be the user's only copy and it may be on a drive they are about
 * to unplug. A move would be faster and would make the library the single owner
 * — which is right for the download path, where this application created the
 * file — and wrong here, where it did not. The cost is disk space for a file the
 * user chose to keep; the alternative cost is a lost model.
 *
 * ## Collisions are refused, not renamed
 *
 * A second import of the same model is either a mistake or an intent, and the two
 * look identical. Telling the user the name is taken lets them decide — pick
 * another name, or delete the one that is there — where a silent `-2` suffix
 * would quietly accumulate copies of a multi-gigabyte file.
 */
import { copyFile, mkdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'

/** Where a model with no stated origin goes. */
const DEFAULT_PUBLISHER = 'local'

export type ImportRequest = {
  /** An absolute path the user chose in a file dialog. */
  sourcePath: string
  /** Which library to write into, from the configured roots. */
  libraryRoot: string
  /** Overrides the derived folder name, when the user typed one. */
  modelName?: string
}

export type ImportResult =
  | { ok: true; path: string; model: string; publisher: string; bytes: number }
  | { ok: false; error: string }

/**
 * The folder a file belongs in, from its own name.
 *
 * Quantisation and shard markers are removed rather than the whole tail after
 * the first dash: `Qwen3.8-27B` must survive, and it is the *quantisation* that
 * distinguishes one file of a model from another.
 *
 * The result is checked because the derivation can produce nothing —
 * `Q4_K_M.gguf` is all marker — and an empty directory name would put the file
 * at the root, outside the layout this exists to create.
 */
export function modelFolderName(fileName: string): string | undefined {
  let stem = fileName.replace(/\.gguf$/i, '')

  /*
   * The quantisation suffix, matched here rather than through `quantizationOf`.
   *
   * That function answers a different question — *what* the label is — and its
   * patterns are anchored on word boundaries, which is right for a download
   * whose name uses `-` or `.` and wrong here: measured, it answers `undefined`
   * for `model_Q4_K_M`, because `_` is a word character and `` never holds
   * between it and the `Q`. An uploader using underscores is ordinary, and a
   * folder called `model_Q4_K_M` is exactly the scattering this function exists
   * to prevent.
   *
   * So the shapes are listed directly, and the same five families
   * `quantizationOf` documents are covered.
   */
  /*
   * The shard marker comes off first, and the order is the whole reason this is
   * written as two steps rather than one pattern.
   *
   * A sharded quantised file is named `model-Q4_K_M-00001-of-00002`, with the
   * shard at the *outer* end. Stripping the quantisation first cannot work —
   * that pattern is anchored on the end of the string, and the shard marker is
   * what is actually there. Measured: doing it in the other order leaves
   * `model-Q4_K_M`, which is the scattering this function exists to prevent.
   */
  stem = stem.replace(/[-_.]\d{5}-of-\d{5}$/i, '')

  const suffix = /[-_.]?(UD[-_])?(IQ\d[A-Z0-9_]*|Q\d[A-Z0-9_]*|BF16|F16|F32|FP16|FP8|FP4)$/i
  for (let i = 0; i < 3; i += 1) {
    const trimmed = stem.replace(suffix, '')
    if (trimmed === stem) break
    stem = trimmed
  }

  /* A trailing separator left behind by the removals above. */
  stem = stem.replace(/[-_.]+$/, '').trim()

  /*
   * Nothing left means the name was nothing but markers — `Q4_K_M.gguf`, say.
   * Answered as `undefined` rather than as an empty string, because a caller
   * that joined the empty one would put the file at the library root, outside
   * the layout this exists to create.
   */
  return stem.length > 0 ? stem : undefined
}

/**
 * Whether a path is inside a root, by resolved-prefix comparison.
 *
 * The trailing separator is the whole reason this is a function: without it
 * `/models-other/x.gguf` starts with `/models` and passes. The same check
 * `removeModelFile` makes, and for the same reason — a path that no longer means
 * what the caller thought.
 */
function inside(root: string, candidate: string): boolean {
  const normalise = (value: string): string =>
    value.replace(/[\\/]+$/, '').replace(/\\/g, '/').toLowerCase()
  const base = normalise(root)
  const target = normalise(candidate)
  return target === base || target.startsWith(`${base}/`)
}

/** Copy one model file into the standard layout under `libraryRoot`. */
export async function importModelFile(request: ImportRequest): Promise<ImportResult> {
  const source = request.sourcePath
  if (source.length === 0) return { ok: false, error: '没有选择文件。' }
  if (!source.toLowerCase().endsWith('.gguf')) {
    /*
     * Refused rather than accepted-and-unusable: the library is scanned for
     * `.gguf`, so anything else would be copied in and then never appear — a
     * successful import that produced nothing.
     */
    return { ok: false, error: '只能导入 .gguf 文件。' }
  }
  if (request.libraryRoot.length === 0) {
    return { ok: false, error: '还没有设置模型库目录。' }
  }

  let bytes: number
  try {
    const stats = await stat(source)
    if (!stats.isFile()) return { ok: false, error: '只能导入文件。' }
    bytes = stats.size
  } catch {
    return { ok: false, error: '读不到这个文件。' }
  }

  const file = basename(source)
  const model = (request.modelName ?? modelFolderName(file) ?? '').trim()
  if (model.length === 0) return { ok: false, error: '无法从文件名推断模型名，请手动填写。' }
  /*
   * A name with a separator in it would escape the layout — the same reason
   * `attachments.ts` reduces a name to its last segment. Checked here because
   * this one can come from a field the user typed.
   */
  if (model.includes('/') || model.includes('\\') || model.includes('..')) {
    return { ok: false, error: '模型名不能包含路径分隔符。' }
  }

  const directory = join(request.libraryRoot, DEFAULT_PUBLISHER, model)
  const target = join(directory, file)

  /* The layout is rebuilt from the root, so containment is a property of the
     strings above rather than a check — but a library root that is itself a
     relative path would break that, and this is where it would show. */
  if (!inside(request.libraryRoot, target)) {
    return { ok: false, error: '目标路径不在模型库内。' }
  }

  if (existsSync(target)) {
    return { ok: false, error: `${DEFAULT_PUBLISHER}/${model}/${file} 已经存在。` }
  }

  try {
    await mkdir(directory, { recursive: true })
    await copyFile(source, target)
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : '复制失败。' }
  }

  return { ok: true, path: target, model, publisher: DEFAULT_PUBLISHER, bytes }
}
