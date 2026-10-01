/**
 * The proxy the application's own requests go through.
 *
 * Needed because both model hosts are Chinese-facing mirrors that are sometimes
 * reachable only through a proxy, and because a download here is measured in
 * hours: a user who cannot reach the host at all needs a setting, not a retry.
 *
 * **Electron's session proxy is the right lever, and the only one that works.**
 * The obvious alternative — setting `HTTP_PROXY` in the environment — does
 * nothing for Node's `fetch`: undici reads that variable only when a dispatcher
 * is built to honour it, and Node does not do that by default. Measured the
 * hard way elsewhere in this codebase; the mistake costs an afternoon because
 * the setting looks correct and the requests keep going direct.
 *
 * `session.setProxy` applies to the whole session's network stack, so every
 * request made from this process — searches, file listings, downloads —
 * follows it with no per-call plumbing.
 *
 * Three modes, matching what a user actually has:
 *
 * - `system` — follow the operating system's proxy settings. The default.
 * - `none` — go direct, ignoring the system. For a machine whose system proxy
 *   is misconfigured, or set by something the user does not control.
 * - `manual` — one explicit URL.
 *
 * Nothing here is a credential store: a proxy with authentication is written
 * into the URL (`http://user:pass@host:port`), which is how the setting is
 * normally expressed and what the field accepts.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, session } from './electron-shim.js'
import { writeSetting } from './hub.js'





const DEFAULT = { mode: 'system' }

/** The three modes, in the order the picker offers them. */
export const PROXY_MODES = [
  { id: 'system', label: '跟随系统', note: '使用操作系统的代理设置' },
  { id: 'none', label: '不使用代理', note: '直连，忽略系统代理' },
  { id: 'manual', label: '手动指定', note: '填写一个代理地址' }
]

function settingsFile() {
  return join(app.getPath('userData'), 'hub.json')
}

/**
 * A proxy URL, checked before it is used.
 *
 * Validated on write rather than trusted, because the value goes straight into
 * an OS-level call: a malformed string is rejected there with a message about
 * an internal rule set, which tells the user nothing about the field they just
 * typed in.
 */
export function validProxyUrl(value) {
  const trimmed = value.trim()
  if (trimmed.length === 0) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'socks5:'
  } catch {
    return false
  }
}

/**
 * The stored settings.
 *
 * Read from the same file hub source, and tolerant of it holding only
 * one of the two — they are written independently and a user may configure
 * either first.
 */
export function readProxy() {
  try {
    const raw = JSON.parse(readFileSync(settingsFile(), 'utf8'))
    if (!raw || typeof raw !== 'object') return DEFAULT
    const record = raw
    const mode = record.proxyMode
    if (mode !== 'system' && mode !== 'none' && mode !== 'manual') return DEFAULT
    const url = typeof record.proxyUrl === 'string' ? record.proxyUrl.trim() : ''
    return { mode, ...(url.length > 0 ? { url } : {}) }
  } catch {
    // No file yet, or unreadable. The default is the answer either way.
    return DEFAULT
  }
}

/**
 * What Electron is told, for a given setting.
 *
 * Split out from the setter so the mapping can be checked without a session:
 * `system` is Electron's `system` mode, `none` is `direct`, and a manual proxy
 * is a `fixed_servers` rule whose scheme is left to the URL.
 */
export function proxyConfigFor(settings) {
  if (settings.mode === 'none') return { mode: 'direct' }
  if (settings.mode === 'manual' && settings.url && validProxyUrl(settings.url)) {
    return { mode: 'fixed_servers', proxyRules: settings.url }
  }
  return { mode: 'system' }
}

/** Apply a setting to the running session. */
export async function applyProxy(settings) {
  const config = proxyConfigFor(settings)
  try {
    await session.defaultSession.setProxy(config)
  } catch {
    /*
     * A rejected proxy is not fatal and must not take the window with it: the
     * requests will fail individually and each of those failures is reported
     * where the user can see it. Throwing here would leave a settings page that
     * cannot be opened to undo the value that caused it.
     */
  }
}

/** Store and apply, in that order so a failed apply still persists the choice. */
export function writeProxy(settings) {
  if (settings.mode === 'manual' && !validProxyUrl(settings.url ?? '')) {
    return { ok: false, error: '代理地址需要形如 http://127.0.0.1:7890。' }
  }
  /*
   * Written through `writeSetting` so the merge has one implementation. The hub
   * source lives in this same file, and a proxy write that replaced the whole
   * document would silently reset the user's host choice — a bug that would
   * only show up as "my mirror keeps switching back", days later.
   */
  const mode = writeSetting('proxyMode', settings.mode)
  if (!mode.ok) return mode
  const url = writeSetting('proxyUrl', settings.mode === 'manual' ? (settings.url ?? '') : '')
  if (!url.ok) return url
  void applyProxy(settings)
  return { ok: true }
}

/**
 * Reach the current source once, and say what happened.
 *
 * A proxy setting with no way to check it is a control the user cannot tell is
 * working — the difference between "the download is slow" and "the proxy is
 * wrong" is invisible until something fails, which on a 40 GB file is an hour
 * later. This is the smallest request that distinguishes them.
 */
export async function testConnection() {
  const started = Date.now()
  try {
    const response = await fetch('https://hf-mirror.com/api/models?limit=1', {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(12_000)
    })
    const elapsed = Date.now() - started
    if (!response.ok) {
      return { ok: false, error: `镜像返回 HTTP ${String(response.status)}。`, detail: `${String(elapsed)} 毫秒` }
    }
    await response.body?.cancel()
    return { ok: true, detail: `${String(elapsed)} 毫秒` }
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause)
    const timedOut = cause instanceof Error && cause.name === 'TimeoutError'
    return {
      ok: false,
      error: timedOut ? '12 秒内没有响应，可能代理不可用。' : `无法连接：${detail}`
    }
  }
}
