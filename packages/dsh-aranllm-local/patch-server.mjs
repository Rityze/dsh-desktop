import { readFileSync, writeFileSync } from 'node:fs'
const file = 'lib/server.js'
let s = readFileSync(file, 'utf8')

const oldFn = `export function rocmPathEntries() {
  if (process.platform !== 'win32') return []
  const roots = [
    process.env.ROCM_PATH,
    'C:\\\\Program Files\\\\AMD\\\\ROCm\\\\7.2',
    'C:\\\\Program Files\\\\AMD\\\\ROCm\\\\7.1',
    'C:\\\\Program Files\\\\AMD\\\\ROCm',
  ].filter(Boolean)
  const entries = []
  for (const root of roots) {
    for (const sub of ['bin', 'lib']) {
      const candidate = join(root, sub)
      if (existsSync(candidate)) entries.push(candidate)
    }
  }
  return entries
}`

if (!s.includes(oldFn)) { console.error('rocmPathEntries anchor missing'); process.exit(1) }

const newFn = `export function rocmPathEntries({ binaryDirectory } = {}) {
  if (process.platform !== 'win32') return []
  const entries = []

  // A vendored runtime (the LM Studio derived llama.cpp package) ships the HIP
  // stack inside the engine folder as <dir>/rocm/bin. Those DLLs are what the
  // forked llama-server-impl.dll links against, so this directory is searched
  // first: it is version matched with the binary, unlike a machine-wide ROCm.
  if (binaryDirectory) {
    for (const sub of ['rocm\\\\bin', 'rocm\\\\lib', 'bin', 'lib']) {
      const candidate = join(binaryDirectory, sub)
      if (existsSync(candidate)) entries.push(candidate)
    }
  }

  // Fall back to a system-wide ROCm install when the engine is not vendored.
  const roots = [
    process.env.ROCM_PATH,
    'C:\\\\Program Files\\\\AMD\\\\ROCm\\\\7.2',
    'C:\\\\Program Files\\\\AMD\\\\ROCm\\\\7.1',
    'C:\\\\Program Files\\\\AMD\\\\ROCm',
  ].filter(Boolean)
  for (const root of roots) {
    for (const sub of ['bin', 'lib']) {
      const candidate = join(root, sub)
      if (existsSync(candidate)) entries.push(candidate)
    }
  }
  return entries
}`

s = s.replace(oldFn, newFn)

// Pass the binary's own directory through so the vendored layout is found.
const oldCall = `    extraPathEntries: rocmPathEntries(),`
if (!s.includes(oldCall)) { console.error('call site anchor missing'); process.exit(1) }
s = s.replace(oldCall, `    extraPathEntries: rocmPathEntries({ binaryDirectory }),`)

writeFileSync(file, s)
console.log('rocmPathEntries now resolves the vendored rocm/bin beside the binary')
