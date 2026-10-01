/**
 * Confirming a repository really carries GGUF, by looking at its files.
 *
 * Both mirrors describe a repository with a field that *stands for* its
 * contents — hf-mirror has a `gguf` tag, ModelScope has a `gguf` entry in
 * `Libraries` — and neither is the contents. A tag is typed by whoever uploaded
 * the model and can be wrong or out of date; `Libraries` is derived by the
 * platform and is better, but it is still a summary written at some point about
 * files that may since have been replaced.
 *
 * The only thing that is certainly true is the file list, and this application
 * already knows how to read it — `files()` walks the tree on both hosts, and it
 * is the same walk the download pane does when a repository is opened. So the
 * question "does this have a GGUF" is answered the same way the download would
 * answer it, rather than by trusting a label.
 *
 * ## Why this runs after a cheap filter rather than instead of one
 *
 * Reading a file list is a request per repository. Doing it for forty search
 * results is forty requests before the list can be drawn, on every keystroke
 * that starts a search — which is the shape of the mistake this codebase has
 * already been fixed for twice (the search field that queried per keystroke, the
 * fold that re-parsed per fragment).
 *
 * So the label runs first and is allowed to be generous: anything it rejects is
 * gone for free, and anything it keeps is confirmed. In practice the filter
 * removes most of a page — measured, a `qwen` search returns thirty results of
 * which six are really GGUF — so the expensive step runs on a handful.
 *
 * ## Why a failure means "no"
 *
 * A repository whose file list cannot be read is not shown. The two mistakes are
 * not symmetrical: hiding something usable costs the reader a second search,
 * and offering something unusable costs them a download that ends in a file the
 * model library refuses. The same reasoning the ModelScope mapper already uses
 * for a repository with no `Libraries` field at all.
 */

/**
 * How many repositories to read at once.
 *
 * Six rather than all of them: a search page is thirty results, and thirty
 * simultaneous requests to one host is the kind of thing that gets a client
 * rate-limited or blocked. Six keeps the wall-clock time close to one request
 * for a page that mostly passes, while staying inside what a public mirror will
 * serve to a desktop client.
 */
const AT_ONCE = 6

/** One repository, as little as this module needs to know about it. */
type Candidate = { id: string }

/**
 * Keep only the repositories whose file list actually contains a GGUF.
 *
 * Order is preserved — the caller has already sorted by popularity and this must
 * not disturb it. The work is done in batches of `AT_ONCE`, and within a batch
 * concurrently, so a page that mostly passes costs about one round trip rather
 * than one per row.
 */
export async function confirmGguf<T extends Candidate>(
  repos: readonly T[],
  /**
   * How to read one repository's files.
   *
   * Passed in rather than imported because the two hosts implement it
   * differently — ModelScope walks directories breadth-first where hf-mirror
   * returns the whole listing at once — and because a caller in a test can
   * answer without a network.
   */
  read: (id: string, signal: AbortSignal) => Promise<{ ok: boolean; value?: { files: { path: string }[] } }>,
  signal: AbortSignal
): Promise<T[]> {
  const kept: T[] = []

  for (let start = 0; start < repos.length; start += AT_ONCE) {
    const batch = repos.slice(start, start + AT_ONCE)
    const answers = await Promise.all(
      batch.map(async (repo) => {
        /* A cancelled search must not keep reading file lists behind it. */
        if (signal.aborted) return false
        try {
          const answer = await read(repo.id, signal)
          if (!answer.ok || !answer.value) return false
          return answer.value.files.some((file) => file.path.toLowerCase().endsWith('.gguf'))
        } catch {
          /*
           * Cancellation arrives here as a rejection on some paths. Either way
           * the answer is "not confirmed", which is what the caller acts on.
           */
          return false
        }
      })
    )
    batch.forEach((repo, index) => {
      if (answers[index] === true) kept.push(repo)
    })
  }

  return kept
}
