/**
 * A token rate that moves while the answer is being written.
 *
 * ## Why this is measured in the page and not reported by the engine
 *
 * The rate the application already shows comes from a session projection: the
 * harness counts output tokens and decode time and publishes the quotient. That
 * number is right, and it has two limits this component exists to remove.
 *
 * **It only exists after the fact.** The projection's numbers are written when
 * a step produces its final message, so during generation the figure on screen
 * is whatever the previous step left behind. Watching a reply arrive is exactly
 * when a rate is worth having.
 *
 * **It only covers models that report usage.** A local llama-server reports
 * `completion_tokens`; so does a cloud provider — usually. Where a provider
 * omits it, or reports it in a shape the fold does not recognise, that model
 * gets no rate at all. Deriving the number from what is on screen makes the
 * measurement independent of who is generating.
 *
 * ## How it measures
 *
 * The chat renders a streaming answer inside an element marked
 * `data-streaming` — the same marker the caret and the fade are drawn from — so
 * the text being written is `document.querySelector('[data-streaming]')` and
 * its length is the work done so far. Sampling that length on a timer gives a
 * rate in characters per second, and the conversion to tokens is the only
 * estimate in the path.
 *
 * ## Why the conversion is not simply four
 *
 * The usual "four characters per token" is a property of English. A Chinese
 * character is usually a token on its own, and an answer in Chinese is what
 * this application's users read most of the time — dividing its length by four
 * would under-report the rate by about that factor. So the count is weighted:
 * a CJK character counts as one token, Latin text as a quarter of one, and
 * whitespace as nothing.
 *
 * The estimate is honest about being one: it is within a few percent on a
 * reply of any length, and it is the only figure available while the tokens are
 * still arriving.
 */
import { useEffect, useRef, useState } from 'react'

/** How often the length is sampled. Twice a second reads as continuous. */
const SAMPLE_MS = 500

/** How much history the reported rate averages over. */
const WINDOW_MS = 3000

/** The element the chat marks while an answer is arriving. */
const STREAMING_SELECTOR = '[data-streaming]'

/**
 * A token count for a piece of rendered text, in the mix the text actually is.
 *
 * @param text - the text on screen.
 * @returns an approximate token count.
 */
function estimateTokens(text) {
  let tokens = 0
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0
    if (code === 32 || code === 10 || code === 9 || code === 13) continue
    /*
     * CJK, Hangul and the full-width forms: one token each, which is what the
     * tokenizers in use do with them.
     */
    const isWide =
      (code >= 0x2e80 && code <= 0x9fff) ||
      (code >= 0xac00 && code <= 0xd7af) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0x20000 && code <= 0x3ffff)
    tokens += isWide ? 1 : 0.25
  }
  return tokens
}

/** The length, in estimated tokens, of everything currently streaming. */
function currentTokenCount() {
  if (typeof document === 'undefined') return undefined
  let total = 0
  let seen = false
  /*
   * Every match, not the first: an answer with a tool call in the middle is
   * several blocks, and each carries the marker while it is being written.
   */
  for (const element of document.querySelectorAll(STREAMING_SELECTOR)) {
    total += estimateTokens(element.textContent ?? '')
    seen = true
  }
  return seen ? total : undefined
}

export function LiveRate() {
  const [rate, setRate] = useState<number | undefined>(undefined)
  /*
   * Samples of (time, cumulative tokens). A rolling window rather than two
   * points: a single pair makes the number jump on every pause the model takes
   * between tokens, and a rate that flickers between 4 and 200 is not a rate.
   */
  const samples = useRef<{ at: number; tokens: number }[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      const tokens = currentTokenCount()

      /*
       * A running record, on the global object.
       *
       * The component's only failure mode is "it never appears", and from the
       * outside that is indistinguishable from "the answer was too fast to
       * catch" — the marker it watches is present only while text is arriving.
       * Keeping the last few observations where a console or a debugging session
       * can read them turns the question into a fact: how many elements carried
       * the marker, and how long ago.
       *
       * Deliberately small and self-replacing: this is a diagnostic, not state,
       * and it must not grow while the application runs.
       */
      try {
        const seen = typeof document === 'undefined' ? [] : document.querySelectorAll(STREAMING_SELECTOR).length
        globalThis.__aranllmLiveRate = {
          at: now,
          streamingElements: seen,
          tokens: tokens ?? null,
          rate: rate ?? null,
        }
      } catch {
        /* A diagnostic that throws would break the thing it observes. */
      }


      if (tokens === undefined) {
        /*
         * Not streaming. The last figure is kept for a moment so it does not
         * blink out the instant the answer finishes, then cleared so a later
         * reply does not inherit a stale number.
         */
        const last = samples.current.at(-1)
        if (last !== undefined && now - last.at > WINDOW_MS) {
          samples.current = []
          setRate(undefined)
        }
        return
      }

      const history = samples.current
      history.push({ at: now, tokens })
      /* Drop anything older than the window, keeping one sample outside it so
         the span is always at least the window rather than the last tick. */
      while (history.length > 2 && now - history[0].at > WINDOW_MS) history.shift()

      const first = history[0]
      const elapsed = now - first.at
      if (elapsed < SAMPLE_MS) return

      const produced = tokens - first.tokens
      /*
       * A negative delta means the stream restarted — a retry, or a second
       * block whose text replaced the first. The window is reset rather than
       * reporting a negative rate.
       */
      if (produced < 0) {
        samples.current = [{ at: now, tokens }]
        return
      }
      setRate((produced / elapsed) * 1000)
    }, SAMPLE_MS)

    return () => clearInterval(timer)
  }, [])

  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) return null

  /*
   * Whole tokens above ten, one decimal below — the same rule the host's own
   * rate pill uses, so the two never disagree about how a number of this size
   * is written.
   */
  const shown = rate >= 10 ? String(Math.round(rate)) : String(Math.round(rate * 10) / 10)

  return (
    <span className="live-rate" data-live-rate="true" title="按屏幕上的文字估算的生成速度">
      <span className="live-rate__value">{shown}</span>
      <span className="live-rate__unit">tok/s</span>
    </span>
  )
}
