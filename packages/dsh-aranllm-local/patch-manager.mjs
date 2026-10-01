import { readFileSync, writeFileSync } from 'node:fs'
const file = 'lib/manager.js'
let s = readFileSync(file, 'utf8')
const anchor = '/**\n * The `models` folder that ships beside the application.'
if (!s.includes(anchor)) { console.error('ANCHOR NOT FOUND'); process.exit(1) }
if (s.includes('export function discoverLlamaServer')) { console.log('already patched'); process.exit(0) }
const added = [
  '/**',
  ' * The llama-server build that ships with the application, discovered without',
  ' * the user typing a path.',
  ' *',
  ' * AranLLM bundles a patched llama.cpp fork under `vendor/llama.cpp` because the',
  ' * stock build lacks the ROCmFP4 weight path and the MTP (nextn) speculative',
  ' * decoding this machine\'s models rely on. A bundled build is therefore always',
  ' * preferred over anything on PATH, and the search walks outwards from the',
  ' * process so development, packaged and harness-cwd launches all resolve.',
  ' *',
  ' * @returns an absolute path to llama-server(.exe), or an empty string.',
  ' */',
  'export function discoverLlamaServer() {',
  "  const name = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server'",
  '  const bases = [',
  '    process.env.ARANLLM_LLAMA_SERVER_DIR,',
  '    process.env.ARANLLM_INSTALL_ROOT,',
  '    process.env.DSH_DESKTOP_APP_ROOT,',
  '    process.cwd(),',
  "    join(process.cwd(), '..'),",
  "    join(process.cwd(), '..', '..'),",
  '  ].filter(Boolean)',
  '  const relatives = [',
  "    ['vendor', 'llama.cpp'],",
  "    ['vendor', 'llama.cpp', 'build', 'bin'],",
  "    ['resources', 'vendor', 'llama.cpp'],",
  "    ['..', 'vendor', 'llama.cpp'],",
  "    ['..', '..', 'vendor', 'llama.cpp'],",
  '  ]',
  '  for (const base of bases) {',
  '    for (const parts of relatives) {',
  '      const candidate = join(base, ...parts, name)',
  '      try {',
  '        if (statSync(candidate).isFile()) return candidate',
  '      } catch {',
  '        // Not here: keep looking. A missing candidate is the common case.',
  '      }',
  '    }',
  '  }',
  "  return ''",
  '}',
  '',
  '',
].join('\n')
s = s.replace(anchor, added + anchor)
writeFileSync(file, s)
console.log('inserted discoverLlamaServer')
