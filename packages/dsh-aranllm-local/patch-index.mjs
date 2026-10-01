import { readFileSync, writeFileSync } from 'node:fs'
const file = 'index.js'
let s = readFileSync(file, 'utf8')

// 1. import the new discovery helper.
const oldImport = "import { LocalModelManager, defaultModelRoots, defaultModelsRoot, scanModels } from './lib/manager.js'"
if (!s.includes(oldImport)) { console.error('import anchor missing'); process.exit(1) }
s = s.replace(oldImport, "import { LocalModelManager, defaultModelRoots, defaultModelsRoot, discoverLlamaServer, scanModels } from './lib/manager.js'")

// 2. Route the settings default through the discovery helper.
const oldDefault = "    llamaServerPath: config.llamaServerPath ?? '',"
if (!s.includes(oldDefault)) { console.error('default anchor missing'); process.exit(1) }
s = s.replace(oldDefault, "    llamaServerPath: config.llamaServerPath?.trim() || discoverLlamaServer(),")

writeFileSync(file, s)
console.log('wired discoverLlamaServer into settings default')
