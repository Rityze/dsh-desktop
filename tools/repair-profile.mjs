/**
 * Bring the harness up when a plugin it cannot load is stopping the launch.
 *
 * ## The failure this repairs
 *
 * A plugin installed from the market is written into two places: its own
 * generation directory, and the profile's *enabled list* — `desired.json`. The
 * second write happens before anything tries to load it, so a plugin that is
 * installed but does not work still lands in the list, and the harness refuses
 * to start when it cannot activate:
 *
 *     dsh: startup failed: 1 required plugin did not activate
 *       vision-toolkit (required)
 *         TypeError: ctx.settings.register is not a function
 *
 * The window then shows nothing at all, because the harness is the window's
 * only source of content. Measured, with `dsh-vision-router`: its `@jimp/core`
 * dependency was rejected by the peer check — it lists `buffer` and `process`,
 * which are Node built-ins that resolve to bare names rather than to files — and
 * the plugin was left enabled anyway.
 *
 * ## What this does, and what it deliberately does not
 *
 * It reads the startup log for the plugins that failed to activate, removes
 * exactly those from the enabled list, and stops. Their generation directories
 * are left alone: a plugin that fails today may be fixed tomorrow, and deleting
 * the download would mean fetching it again to find out.
 *
 * It is a repair, not a policy. The alternative — making every plugin optional —
 * would let a broken one load halfway and fail at the first use, which is worse
 * than a launch that says which plugin is at fault.
 *
 * ## Usage
 *
 *     node tools/repair-profile.mjs            # report what it would remove
 *     node tools/repair-profile.mjs --apply    # remove them
 */
import { existsSync, readFileSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const apply = process.argv.includes('--apply')
const dshHome = join(process.env.APPDATA ?? '', 'dsh-desktop-dev', 'harness')
const generations = join(dshHome, 'profiles', '.generations')
const desiredFile = join(generations, 'desired.json')
const logDir = join(dshHome, 'logs')

if (!existsSync(desiredFile)) {
  console.error('找不到 desired.json：', desiredFile)
  process.exit(1)
}

/**
 * The plugins named in the newest startup failure.
 *
 * The log is the only record of *which* plugin failed: `desired.json` is a list
 * of generation ids and says nothing about whether any of them loaded. The
 * newest `startup-*.log` is the one from the launch that did not come up, and
 * the `(required)` marker beside an entry is what says it was fatal rather than
 * merely warned about.
 */
function failingFromLogs() {
  if (!existsSync(logDir)) return []
  const candidates = readdirSync(logDir)
    .filter((name) => name.startsWith('startup-') && name.endsWith('.log'))
    .sort()
    .slice(-3)

  const names = new Set()
  for (const file of candidates) {
    let text
    try {
      text = readFileSync(join(logDir, file), 'utf8')
    } catch {
      continue
    }
    /*
     * `Failed plugins (N):` followed by one indented line per plugin, each
     * naming the entry id and marking it `(required)`.
     *
     * Read line by line rather than by substring: the same log carries a JSON
     * summary elsewhere whose keys contain the same words, and a search finds
     * both — measured, as an entry reported with its surrounding quote marks
     * still attached.
     */
    const lines = text.split('\n')
    const header = lines.findIndex((line) => line.trim().startsWith('Failed plugins'))
    if (header === -1) continue
    for (let i = header + 1; i < lines.length; i += 1) {
      const raw = lines[i]
      const trimmed = raw.trim()
      if (trimmed.length === 0) continue
      /* The block ends at the first line that is not indented. */
      if (!/^\s/.test(raw)) break
      const at = trimmed.indexOf('(required)')
      if (at === -1) break
      const name = trimmed.slice(0, at).trim()
      if (name.length > 0) names.add(name)
    }
  }
  return [...names]
}

/**
 * The generation ids that belong to those plugins.
 *
 * `desired.json` stores ids shaped `publisher+package+version+hash`, and the log
 * names either the package or the entry id, so a match is a substring test on
 * the package's own name rather than an equality.
 */
function idsFor(plugins, ids) {
  const matched = []
  for (const id of ids) {
    for (const plugin of plugins) {
      const packageName = plugin.includes('/') ? plugin.split('/').pop() : plugin
      if (id.includes(packageName)) {
        matched.push(id)
        break
      }
    }
  }
  return matched
}

const ids = JSON.parse(readFileSync(desiredFile, 'utf8'))
if (!Array.isArray(ids)) {
  console.error('desired.json 不是一个数组')
  process.exit(1)
}

const failing = failingFromLogs()
console.log('启用清单里的插件:', ids.length, '个')
for (const id of ids) console.log('  ', id)

if (failing.length === 0) {
  console.log('\n最近的启动日志里没有失败插件。')
  console.log('如果窗口是空的，看 logs/ 下最新的 startup-*.log，找 "Failed plugins" 一节。')
  process.exit(0)
}

console.log('\n启动失败的插件:', failing.join(', '))
const remove = idsFor(failing, ids)
if (remove.length === 0) {
  console.log('它们不在启用清单里 —— 启动失败可能另有原因。')
  process.exit(0)
}

console.log('\n将从启用清单移除:')
for (const id of remove) console.log('  ', id)
console.log('\n生成目录会保留，重新安装时不必再下载。')

if (!apply) {
  console.log('\n这是预演。加 --apply 执行。')
  process.exit(0)
}

const backup = `${desiredFile}.bak-${String(Date.now())}`
copyFileSync(desiredFile, backup)
const kept = ids.filter((id) => !remove.includes(id))
writeFileSync(desiredFile, JSON.stringify(kept, null, 2), 'utf8')

console.log('\n已写入。备份:', backup)
console.log('剩下的插件:', kept.length, '个')
console.log('\n重启软件。')
