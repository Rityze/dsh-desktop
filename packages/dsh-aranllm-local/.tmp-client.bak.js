/**
 * The local-model section of Settings.
 *
 * This is the one place in AranLLM where a user waits on something with no
 * natural end in sight: loading a 27B GGUF takes about nineteen seconds, and
 * for roughly eighteen of those the engine prints nothing at all. The section
 * exists to make that wait legible and interruptible.
 *
 * What it shows is deliberately not a percentage. llama.cpp publishes no byte
 * count during a load — it reports when it starts and when it finishes, and
 * nothing in between — so the bar is driven by the *phase* the tracker
 * inferred, and a percentage derived from it would be an animation pretending
 * to be a measurement. Instead: the phase name, a running clock, the model's
 * size, and a cancel button that really does release the GPU.
 */
window.__ModuleLoader__.load({
  id: 'dsh-aranllm-local',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    const React = require('react')
    /*
     * The host's own component set.
     *
     * Every control on this page was a bare `<button>` styled with utility
     * classes, which is close enough to look right and not close enough to
     * behave right: the utility classes carry type and spacing, while the
     * hover, focus ring, disabled treatment and press feedback live in the
     * components. Using them is also what keeps a change to the design system
     * from having to be made twice.
     */
    const {
      Button,
      Input,
      Tag,
      Pill,
      StateDot,
      SegmentedControl,
      DisclosureRow,
      PathLabel,
      Modal,
      writeClipboard,
      IconPlayOutlineRegular,
      IconStopFillRegular,
      IconRefreshOutlineRegular,
      IconFolderOpenRegular,
      IconDownloadOutlineRegular,
      IconTrashOutlineRegular,
      IconCheckOutlineRegular,
      IconWarningTriangleOutlineRegular,
    } = require('@deepseek-ai/dsh-client-ui-primitives')

    const NS = 'settings.aranllmLocal'
    /** How often to re-read the status while a load is in flight. */
    const POLL_MS = 500

    // The phases, in the order a load passes through them. `reading` is the long
    // one and the reason this section exists: it is inferred from the engine's
    // silence, because that silence is the weight read.
    const PHASE_ORDER = ['opening', 'verifying', 'reading', 'initializing', 'ready']

    const en = {
      nav: 'Local models',
      title: 'Local model',
      intro: 'Load a GGUF model from this machine. Weights stay on your GPU until you unload them.',
      noneLoaded: 'No local model is loaded.',
      available: 'Models on this machine',
      load: 'Load',
      loading_model: 'Loading…',
      noModels: 'No GGUF models found in the models folder.',
      scanFailed: 'Could not scan the models folder.',
      loading: 'Loading',
      loaded: 'Loaded',
      unload: 'Unload',
      revealLibrary: 'Open folder',
      rescan: 'Rescan',
      changePort: 'Change',
      copyAddress: 'Copy address',
      filter: 'Filter…',
      params: 'Parameters',
      delete: 'Remove',
      unloading: 'Unloading…',
      cancel: 'Cancel',
      cancelling: 'Cancelling…',
      reload: 'Reload',
      failed: 'The load failed.',
      // Phase copy. `readingHint` matters most: it is what turns eighteen
      // seconds of nothing into "still working".
      opening: 'Opening the model file',
      verifying: 'Checking tensors',
      reading: 'Reading weights',
      initializing: 'Building the context',
      ready: 'Ready',
      readingHint: 'Reading weights from disk. No output during this step is normal.',
      elapsed: 'Elapsed',
      sizeUnknown: 'unknown size',
      port: 'Port',
      cancelHint: 'Cancelling releases the GPU memory this load was holding.',
      browserOnly: 'Local models can only be loaded from the desktop app.',
      // Load parameters. `auto` is the single most important word here: an
      // empty field does not mean zero, it means the engine decides.
      paramsTitle: 'Load parameters',
      paramsIntro: 'Applied the next time this model loads. Leave a field empty to let the engine decide.',
      paramsFor: 'For',
      paramsRemembered: 'Remembered from the last successful load.',
      paramsNone: 'Showing the engine defaults.',
      paramsSave: 'Save',
      paramsSaved: 'Saved',
      paramsReset: 'Reset to defaults',
      paramsResetDone: 'Cleared.',
      paramsAuto: 'auto',
      paramsBySection: 'Written to a file next to this app’s data, not to the endpoint.',
      paramsFailed: 'Could not read the load parameters.',
      flag: 'Flag',
      // Capability tags. Each is read off the file, never inferred from a name.
      capVision: 'Vision',
      capReasoning: 'Thinking',
      capTools: 'Tools',
      // Capability overrides. `auto` is the default and means "believe the
      // file"; the other two exist because the file's answer can be wrong in
      // both directions — a built-in vision tower the architecture list does
      // not know yet, or a projector this build cannot drive.
      capabilityTitle: 'Input capabilities',
      capabilityIntro: 'Read from the model file. Override it if the file is wrong.',
      visionLabel: 'Image input',
      visionAuto: 'Auto',
      visionOn: 'Allow',
      visionOff: 'Deny',
      visionSourceMmproj: 'Detected from the separate projector file.',
      visionSourceOrphanMmproj: 'A projector file sits in the same folder but names a different model, so this is a guess.',
      visionSourceMetadata: 'Detected from the vision settings stored in the model file.',
      visionSourceArchitecture: 'Inferred from the architecture name.',
      visionSourceTemplate: 'Inferred from the chat template.',
      visionNone: 'No vision support found in the file.',
      visionOverridden: 'Using your choice instead of the file.',
      visionFileSaid: ' The file said: ',
      reasoningCapLabel: 'Reasoning',
      reasoningCapAuto: 'Auto',
      reasoningCapOn: 'Allow',
      reasoningCapOff: 'Deny',
      capabilitySaved: 'Saved.'
    }

    const zh = {
      nav: '本地模型',
      title: '本地模型',
      intro: '从本机加载一个 GGUF 模型。权重会一直占用显卡，直到你手动卸载。',
      noneLoaded: '当前没有加载本地模型。',
      available: '本机模型',
      load: '加载',
      loading_model: '加载中…',
      noModels: '模型文件夹里没有找到 GGUF 模型。',
      scanFailed: '无法扫描模型文件夹。',
      loading: '正在加载',
      loaded: '已加载',
      unload: '卸载',
      revealLibrary: '打开目录',
      rescan: '重新扫描',
      changePort: '修改',
      copyAddress: '复制地址',
      filter: '筛选…',
      params: '参数',
      delete: '删除',
      unloading: '正在卸载…',
      cancel: '取消',
      cancelling: '正在取消…',
      reload: '重新加载',
      failed: '加载失败。',
      opening: '正在打开模型文件',
      verifying: '正在校验张量',
      reading: '正在读入权重',
      initializing: '正在建立上下文',
      ready: '就绪',
      readingHint: '正在从磁盘读入权重。这一步没有任何输出是正常的。',
      elapsed: '已耗时',
      sizeUnknown: '大小未知',
      port: '端口',
      cancelHint: '取消会释放本次加载占用的显存。',
      browserOnly: '本地模型只能在桌面应用中加载。',
      // 「自动」是这里最要紧的一个词：空不是 0，是交给引擎自己决定。
      paramsTitle: '加载参数',
      paramsIntro: '下次加载这个模型时生效。留空表示由引擎自行决定。',
      paramsFor: '当前模型',
      paramsRemembered: '来自上一次成功加载的记录。',
      paramsNone: '当前显示的是引擎默认值。',
      paramsSave: '保存',
      paramsSaved: '已保存',
      paramsReset: '恢复默认',
      paramsResetDone: '已清除。',
      paramsAuto: '自动',
      paramsBySection: '这些设置写在本机数据目录的文件里，不会写进接口配置。',
      paramsFailed: '无法读取加载参数。',
      flag: '对应参数',
      // 能力标签。全部读自文件本身，不做任何猜测。
      capVision: '可看图',
      capReasoning: '会思考',
      capTools: '可调工具',
      // 能力覆盖。「自动」是默认，意思是相信文件本身；
      // 另外两个选项之所以存在，是因为文件的答案可能两头都错——
      // 可能内置了视觉塔但架构名不在已知列表里，也可能有投影器但当前版本驱动不了。
      capabilityTitle: '输入能力',
      capabilityIntro: '来自模型文件本身的判定。如果判定不对，可以在这里手动改。',
      visionLabel: '看图输入',
      visionAuto: '自动',
      visionOn: '允许',
      visionOff: '禁止',
      visionSourceMmproj: '由独立的投影器文件判定。',
      visionSourceOrphanMmproj: '同一个文件夹里有投影器文件，但它自称属于别的模型，所以这里只是猜测。',
      visionSourceMetadata: '由模型文件里的视觉配置判定。',
      visionSourceArchitecture: '由架构名推断。',
      visionSourceTemplate: '由对话模板推断。',
      visionNone: '文件里没有找到视觉能力。',
      visionOverridden: '正在使用你的选择，而不是文件的判定。',
      visionFileSaid: '文件原判：',
      reasoningCapLabel: '思考',
      reasoningCapAuto: '自动',
      reasoningCapOn: '允许',
      reasoningCapOff: '禁止',
      capabilitySaved: '已保存。'
    }

    /**
     * One line of capability tags for a catalog row.
     *
     * Everything shown is evidence the file carries: an mmproj sidecar, a
     * thinking branch in the chat template, a tool envelope in the template.
     * A model that declares none of it gets its size alone rather than a row of
     * crossed-out tags, which would read as a defect rather than as a plain
     * model.
     */
    function describeCapabilities(model, t) {
      const parts = []
      const capabilities = model.capabilities ?? {}
      if (capabilities.vision) parts.push(t('capVision'))
      if (capabilities.reasoning) parts.push(t('capReasoning'))
      if (capabilities.toolCalling) parts.push(t('capTools'))
      // The file's own size label, which is a string: "27B", or "35B-A3B" for
      // an MoE model where the second figure is what is active per token.
      if (model.sizeLabel) parts.unshift(String(model.sizeLabel))
      if (model.quantization) parts.push(String(model.quantization).toUpperCase())
      return parts.join(' · ')
    }

    /** Seconds rendered as a short clock: 17.6, not 17600ms. */
    function formatSeconds(ms) {
      if (!Number.isFinite(ms) || ms < 0) return '0.0'
      return (ms / 1000).toFixed(1)
    }

    function formatBytes(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return null
      const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
      let value = bytes
      let unit = 0
      while (value >= 1024 && unit < units.length - 1) {
        value /= 1024
        unit += 1
      }
      return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
    }

    /**
     * The bar's fill, as a position in the phase sequence.
     *
     * Explicitly not a completion percentage: it is which step the load is on,
     * and the label next to it is what tells the user what that step is. A bar
     * that filled smoothly across the silent stretch would be claiming
     * knowledge the engine does not give us.
     */
    function phasePosition(phase) {
      const index = PHASE_ORDER.indexOf(phase)
      if (index < 0) return 0
      return (index + 1) / PHASE_ORDER.length
    }

    function LocalModelSection(props) {
      const { t } = props
      const [status, setStatus] = React.useState()
      const [error, setError] = React.useState()
      const [busy, setBusy] = React.useState(false)
      const [missing, setMissing] = React.useState(false)
      const [catalog, setCatalog] = React.useState()
      const [loadingId, setLoadingId] = React.useState()
      const [capabilityConfig, setCapabilityConfig] = React.useState({})
      const [port, setPort] = React.useState()
      const [editingPort, setEditingPort] = React.useState()
      const [filter, setFilter] = React.useState('')
      const [tuning, setTuning] = React.useState()
      const [removing, setRemoving] = React.useState()

      /*
       * The host's model bridge, over the harness's own fetch routes.
       *
       * The desktop build exposed this as `window.dshModels` from its preload
       * script, which cannot work here: this panel is a client plugin inside the
       * harness web surface, and that surface has no preload of ours. What it
       * does have is same-origin HTTP — the client and the host are the same
       * server — so the routes the host plugin already registers are reachable
       * by plain `fetch`, which is what every other client plugin does.
       *
       * The shape is kept identical to the old bridge on purpose: the panel
       * below is unchanged, and a name-per-route wrapper is the whole
       * difference between the two transports.
       */
      const api = React.useMemo(() => {
        if (typeof fetch !== 'function') return undefined

        const call = async (path, init) => {
          const response = await fetch(path, init)
          const body = await response.json().catch(() => undefined)
          if (!response.ok) {
            throw new Error(body?.error ?? `本地模型接口返回 ${response.status}。`)
          }
          return body
        }
        const post = (path, payload) =>
          call(path, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload ?? {}),
          })

        /*
         * One method per route in `routes.js`, named as the desktop bridge named
         * them.
         *
         * Keeping the old names is what lets the panel's body be the same code
         * it was: `bridge.models.localCatalog()` becomes `api.localCatalog()`
         * and nothing around it moves. A set of names invented for this host
         * would have meant editing every call site, and every edit is a chance
         * to change a behaviour by accident.
         */
        return {
          localCatalog: () => call('/api/aranllm/models'),
          localEntries: () => call('/api/aranllm/models/entries'),
          localStatus: () => call('/api/aranllm/models/status'),
          loadLocal: (payload) => post('/api/aranllm/models/load', payload),
          unloadLocal: () => post('/api/aranllm/models/unload'),
          removeLocal: (id) => post('/api/aranllm/models/remove', { id }),
          importModel: (payload) => post('/api/aranllm/models/import', payload ?? {}),
          localConfig: (id) => call(`/api/aranllm/config?id=${encodeURIComponent(id)}`),
          setLocalConfig: (id, changes) => post('/api/aranllm/config/set', { id, values: changes }),
          localParameters: () => call('/api/aranllm/parameters'),
          library: () => call('/api/aranllm/library'),
          setLocalRoot: (root) => post('/api/aranllm/library/set', { root }),
          revealLibrary: () => post('/api/aranllm/library/reveal', {}),
          port: () => call('/api/aranllm/port'),
          setPort: (port) => post('/api/aranllm/port/set', { port }),
        }
      }, [])

      /**
       * Re-read the catalog so the per-model tags reflect a just-changed
       * override.
       *
       * The tags are computed in the main process (the catalog is served with
       * overrides already applied), so the renderer cannot patch them locally:
       * flipping a toggle changes what the file's verdict tags read, and only a
       * fresh catalog carries that.
       */
      /*
       * The port is read once, on mount.
       *
       * It is a setting rather than a measurement — the value does not move
       * while the panel is open, except by way of the field that edits it — so
       * polling it would be a request per tick for a number that is already on
       * screen. The write path updates the state directly, which is where the
       * only change can come from.
       */
      React.useEffect(() => {
        if (!api?.port) return
        let stopped = false
        api
          .port()
          .then((answer) => {
            if (!stopped) setPort(answer?.port)
          })
          .catch(() => undefined)
        return () => {
          stopped = true
        }
      }, [api])

      const refreshCatalog = React.useCallback(async () => {
        if (!api?.localCatalog) return
        try {
          setCatalog(await api.localCatalog())
        } catch {
          // Leave the previous catalog in place. A failed refresh means the
          // tags are stale by one edit, which is better than blanking the list.
        }
      }, [api])

      /**
       * Re-read the stored record for every model in the catalog.
       *
       * One read per model rather than one for the active model, because the
       * catalog is re-rendered as a list and each row's tags depend on its own
       * override — reading lazily would make a row's tags depend on which row
       * was visited first.
       */
      const refreshCapabilityConfig = React.useCallback(async () => {
        if (!api?.localConfig) return
        const models = Array.isArray(catalog?.models) ? catalog.models : []
        const entries = await Promise.all(
          models.map(async (model) => {
            try {
              const next = await api.localConfig(model.id)
              return [model.id, next?.config ?? {}]
            } catch {
              // An unreadable record is not an error worth showing here: the
              // panel falls back to "auto", which is the correct default and
              // the same state a model with no record is in.
              return [model.id, {}]
            }
          })
        )
        setCapabilityConfig(Object.fromEntries(entries))
      }, [api, catalog?.models])

      React.useEffect(() => {
        refreshCapabilityConfig()
      }, [refreshCapabilityConfig])

      // Refresh both the stored record and the catalog-derived tags after an
      // override changes. Two reads rather than one because they answer
      // different questions: the record is what the toggles render from, the
      // catalog is what the list rows render from.
      const onCapabilitySaved = async () => {
        await refreshCapabilityConfig()
        await refreshCatalog()
      }

      // The catalog is read once on mount. The manager throttles and shares
      // scans on the main-process side, so re-reading on every poll would be
      // cheap there but pointless here: on-disk models do not change while the
      // section is open, and a fresh mount re-reads anyway.
      React.useEffect(() => {
        if (!api) return
        let stopped = false
        api
          .localCatalog()
          .then((next) => {
            if (!stopped) setCatalog(next)
          })
          .catch(() => {
            if (!stopped) setCatalog({ models: undefined })
          })
        return () => {
          stopped = true
        }
      }, [api])

      // Polls only while a load is in flight. A loaded or idle model has nothing
      // that changes, and polling forever would keep a timer running for the
      // whole session.
      React.useEffect(() => {
        if (!api) {
          setMissing(true)
          return undefined
        }
        let stopped = false
        let timer
        const read = async () => {
          try {
            const next = await api.localStatus()
            if (stopped) return
            setStatus(next)
            setError(undefined)
          } catch (cause) {
            if (stopped) return
            setError(cause instanceof Error ? cause.message : String(cause))
          }
          // Faster while loading, slower once settled.
          const phase = status?.progress?.phase
          const active = Boolean(phase) && phase !== 'ready'
          timer = setTimeout(read, active ? POLL_MS : 3000)
        }
        read()
        return () => {
          stopped = true
          if (timer) clearTimeout(timer)
        }
      }, [api, status?.progress?.phase])

      const load = async (modelId) => {
        if (!api || busy) return
        setBusy(true)
        setLoadingId(modelId)
        try {
          await api.loadLocal(modelId)
          setStatus(await api.localStatus())
          setError(undefined)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
          setLoadingId(undefined)
        }
      }

      const unload = async () => {
        if (!api || busy) return
        setBusy(true)
        try {
          await api.unloadLocal('unloaded from settings')
          setStatus(await api.localStatus())
          setError(undefined)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

      if (missing) {
        return React.createElement(
          'div',
          { className: 'flex flex-col gap-2 p-4' },
          React.createElement('span', { className: 'text-14-regular text-text-weak' }, t('browserOnly'))
        )
      }

      const progress = status?.progress
      const loaded = status?.loaded
      const phase = progress?.phase
      const active = Boolean(phase) && phase !== 'ready' && !loaded
      const elapsed = progress?.elapsedMs ?? 0
      const size = formatBytes(progress?.bytes)
      const name = progress?.modelName ?? loaded?.modelName

      // Which model the parameter panel edits. The loaded one wins — it is what
      // "the model" means to someone looking at this page — and otherwise the
      // first on disk, so tuning is reachable before the first load. The
      // `loadingId` from an in-flight click wins over both: the panel should
      // follow the click, not lag behind until the server reports ready.
      const catalogModels = Array.isArray(catalog?.models) ? catalog.models : []
      /*
       * The list after the filter.
       *
       * Matched on the name and the path, because those are the two strings on
       * the row: a user looking for a quantisation narrows by what is shown
       * (`Q4_K_M` lives in the meta line) and one looking for a file narrows by
       * the folder it is in. Case-insensitive, since neither is capitalised
       * consistently across files.
       */
      const needle = filter.trim().toLowerCase()
      const shown =
        needle.length === 0
          ? catalogModels
          : catalogModels.filter((model) =>
              `${String(model.name ?? '')} ${String(model.path ?? '')} ${String(model.quantization ?? '')}`
                .toLowerCase()
                .includes(needle),
            )
      const activeModel =
        catalogModels.find((entry) => entry.id === loadingId) ??
        catalogModels.find((entry) => entry.id === progress?.modelId) ??
        catalogModels.find((entry) => entry.id === loaded?.modelId) ??
        catalogModels[0]

      return React.createElement(
        'div',
        { className: 'flex flex-col gap-3 p-4' },
        /*
         * The head: what this page is, and the three things you do from it.
         *
         * The buttons sit on the title row rather than above the list, because
         * all three act on the *folder* — unload what is running, put a file in
         * it, look again — and the folder is what the title names. A version
         * placed beside the list reads as acting on the selected model, which
         * none of them does.
         *
         * `Button` from the host rather than a styled `<button>`: the hover,
         * focus ring and disabled treatment are behaviours, not colours, and a
         * bare element has none of them.
         */
        React.createElement(
          'div',
          { className: 'flex items-start justify-between gap-3' },
          React.createElement(
            'div',
            { className: 'flex flex-col gap-1' },
            React.createElement('span', { className: 'text-16-medium text-text-strong' }, t('title')),
            React.createElement('span', { className: 'text-14-regular text-text-weak' }, t('intro'))
          ),
          React.createElement(
            'div',
            { className: 'flex flex-none items-center gap-2' },
            loaded
              ? React.createElement(
                  Button,
                  {
                    variant: 'outline',
                    size: 'sm',
                    icon: React.createElement(IconStopFillRegular, { size: 14 }),
                    disabled: busy,
                    onClick: () => void unload(),
                  },
                  t('unload'),
                )
              : null,
            React.createElement(
              Button,
              {
                variant: 'outline',
                size: 'sm',
                icon: React.createElement(IconFolderOpenRegular, { size: 14 }),
                title: t('revealLibrary'),
                onClick: () => {
                  void api
                    ?.revealLibrary()
                    .catch((cause) =>
                      setError(cause instanceof Error ? cause.message : String(cause)),
                    )
                },
              },
              t('revealLibrary'),
            ),
            React.createElement(
              Button,
              {
                variant: 'outline',
                size: 'sm',
                icon: React.createElement(IconRefreshOutlineRegular, { size: 14 }),
                disabled: active,
                onClick: () => void refreshCatalog(),
              },
              t('rescan'),
            ),
          ),
        ),

        /*
         * The service address, under the title rather than in a section.
         *
         * It is a fact about the machine, not a setting to work through, and it
         * is the one line on this page that another program needs — so it is
         * shown as the whole address a client would be configured with, not as
         * a bare port. `127.0.0.1:8082` is what goes into a base URL; `8082`
         * leaves the reader to assemble the host, and getting that wrong
         * (`0.0.0.0`, a LAN address) is the commoner mistake since the server
         * binds loopback only.
         *
         * Copying rather than reading and retyping: the value is long enough to
         * typo and a typo surfaces as a connection error with no clue in it.
         */
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          React.createElement(StateDot, { tone: loaded ? 'active' : 'idle' }),
          editingPort !== undefined
            ? React.createElement(
                'span',
                { className: 'flex items-center gap-2' },
                React.createElement(Input, {
                  value: editingPort,
                  autoFocus: true,
                  spellCheck: false,
                  'aria-label': t('port'),
                  className: 'w-40',
                  onChange: (event) => setEditingPort(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key !== 'Enter') return
                    /*
                     * A full address is accepted and only the port is used.
                     *
                     * `127.0.0.1:8082` pasted into the field costs one split to
                     * accept, and refusing it costs the reader a confusing
                     * `NaN` — the number was not asked for in that shape, but
                     * it is the shape the line above the field is written in,
                     * so it is the shape that gets pasted.
                     */
                    const raw = String(editingPort).trim()
                    const next = Number(raw.includes(':') ? raw.split(':').pop() : raw)
                    setEditingPort(undefined)
                    void api
                      ?.setPort(next)
                      .then((answer) => {
                        setPort(answer.port)
                        setError(answer.ok ? undefined : answer.error)
                      })
                      .catch((cause) =>
                        setError(cause instanceof Error ? cause.message : String(cause)),
                      )
                  },
                }),
                React.createElement(
                  Button,
                  {
                    variant: 'primary',
                    size: 'sm',
                    onClick: () => {
                      const raw = String(editingPort).trim()
                      const next = Number(raw.includes(':') ? raw.split(':').pop() : raw)
                      setEditingPort(undefined)
                      void api
                        ?.setPort(next)
                        .then((answer) => {
                          setPort(answer.port)
                          setError(answer.ok ? undefined : answer.error)
                        })
                        .catch((cause) =>
                          setError(cause instanceof Error ? cause.message : String(cause)),
                        )
                    },
                  },
                  t('paramsSave'),
                ),
                React.createElement(
                  Button,
                  { variant: 'ghost', size: 'sm', onClick: () => setEditingPort(undefined) },
                  t('cancel'),
                ),
              )
            : React.createElement(
                React.Fragment,
                null,
                React.createElement(
                  'code',
                  { className: 'text-14-regular text-text-strong' },
                  `127.0.0.1:${String(port ?? '…')}`,
                ),
                React.createElement(
                  Button,
                  {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => setEditingPort(`127.0.0.1:${String(port ?? '')}`),
                  },
                  t('changePort'),
                ),
                React.createElement(
                  Button,
                  {
                    variant: 'ghost',
                    size: 'sm',
                    icon: React.createElement(IconCheckOutlineRegular, { size: 14 }),
                    onClick: () => {
                      void writeClipboard(`http://127.0.0.1:${String(port ?? '')}/v1`)
                    },
                  },
                  t('copyAddress'),
                ),
              ),
        ),

        /*
         * Loading state, with the host's own progress affordances.
         *
         * `StateDot` rather than a hand-rolled dot, and `IconStopFillRegular`
         * rather than the word 取消: the host already has one way to draw "this
         * is running" and one glyph for "stop it", and a page that invents its
         * own makes the two features look like they came from different
         * applications.
         */
        active
          ? React.createElement(
              'div',
              { className: 'flex flex-col gap-2' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between' },
                React.createElement(
                  'span',
                  { className: 'flex items-center gap-2 text-14-medium text-text-strong' },
                  React.createElement(StateDot, { tone: 'active' }),
                  `${t('loading')} · ${t(phase)}`
                ),
                React.createElement(
                  'span',
                  { className: 'flex items-center gap-2 text-14-regular text-text-weak' },
                  `${t('elapsed')} ${formatSeconds(elapsed)}s`,
                  React.createElement(Button, {
                    variant: 'outline',
                    size: 'sm',
                    icon: React.createElement(IconStopFillRegular, { size: 14 }),
                    disabled: busy,
                    onClick: () => void unload(),
                  }, t('cancel'))
                )
              ),
              React.createElement(
                'div',
                { className: 'h-1 w-full overflow-hidden rounded-full bg-surface-weak' },
                React.createElement('div', {
                  className: 'h-full rounded-full bg-accent-strong transition-[width] duration-500',
                  style: { width: `${Math.round(phasePosition(phase) * 100)}%` }
                })
              ),
              // Shown only for the silent stretch, because that is the only step
              // where "nothing is happening" needs saying out loud.
              phase === 'reading'
                ? React.createElement(
                    'span',
                    { className: 'text-14-regular text-text-weak' },
                    t('readingHint')
                  )
                : null,
              size
                ? React.createElement(
                    'span',
                    { className: 'text-14-regular text-text-weak' },
                    size
                  )
                : null
            )
          : null,

        loaded
          ? React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(
                'span',
                { className: 'text-14-medium text-text-strong' },
                `${t('loaded')} · ${loaded.modelName}`
              ),
              React.createElement(
                'span',
                { className: 'text-14-regular text-text-weak' },
                `${t('port')} ${loaded.port}`
              )
            )
          : !active
            ? React.createElement(
                'span',
                { className: 'text-14-regular text-text-weak' },
                t('noneLoaded')
              )
            : null,

        error
          ? React.createElement(
              'span',
              { className: 'text-14-regular text-text-danger' },
              error
            )
          : null,

        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          loaded
            ? React.createElement(
                'button',
                {
                  type: 'button',
                  className: 'text-14-medium text-text-strong',
                  onClick: unload,
                  disabled: busy
                },
                busy ? t('unloading') : t('unload')
              )
            : null
        ),

        // The picker. Shown whenever the catalog answered, loaded or not: a
        // second load replaces the first, so the list is the way to switch.
        catalog
          ? React.createElement(
              'div',
              { className: 'flex flex-col gap-1' },
              React.createElement(
                'div',
                { className: 'flex items-center justify-between gap-2' },
                React.createElement(
                  'span',
                  { className: 'text-14-medium text-text-strong' },
                  t('available')
                ),
                /*
                 * The count, and the filter beside it.
                 *
                 * The count is not decoration on a folder a user may have
                 * pointed at a 200-file directory: it is how they know the scan
                 * finished and how much of it is showing. The filter is what
                 * makes a list of that size usable, and it sits on the same row
                 * as the number it changes.
                 */
                React.createElement(
                  'span',
                  { className: 'flex flex-none items-center gap-2' },
                  Array.isArray(catalog.models)
                    ? React.createElement(
                        'span',
                        { className: 'text-14-regular text-text-weak' },
                        String(shown.length) + ' / ' + String(catalog.models.length),
                      )
                    : null,
                  React.createElement(Input, {
                    value: filter,
                    spellCheck: false,
                    placeholder: t('filter'),
                    'aria-label': t('filter'),
                    className: 'w-48',
                    onChange: (event) => setFilter(event.target.value),
                  }),
                ),
              ),
              Array.isArray(catalog.models) && catalog.models.length > 0
                ? React.createElement(
                    'div',
                    { className: 'flex flex-col gap-1' },
                    ...shown.map((model) => {
                      const isLoaded = loaded?.modelId === model.id
                      const isLoading = progress?.modelId === model.id
                      const isTuning = tuning === model.id
                      return React.createElement(
                        'div',
                        {
                          key: model.id,
                          className: 'flex items-center justify-between gap-2 py-1',
                          ...(isLoaded ? { 'data-loaded': 'true' } : {}),
                        },
                        React.createElement(
                          'div',
                          { className: 'flex min-w-0 flex-col gap-1' },
                          React.createElement(
                            'span',
                            { className: 'flex items-center gap-2' },
                            React.createElement(
                              'span',
                              { className: 'text-14-regular text-text-strong' },
                              model.name ?? model.id,
                            ),
                            /*
                             * Tags read off the file, never guessed from a name.
                             * `Tag` rather than a styled span so the two use the
                             * same shape as every other chip in the host.
                             */
                            model.multimodal === true
                              ? React.createElement(Tag, { tone: 'outline' }, t('capVision'))
                              : null,
                            model.hasMtp === true
                              ? React.createElement(Tag, { tone: 'outline' }, 'MTP')
                              : null,
                          ),
                          React.createElement(
                            'span',
                            { className: 'text-14-regular text-text-weak' },
                            describeCapabilities(model, t),
                          ),
                          /*
                           * The path under the meta rather than in it. A model
                           * directory is often deep, and the name is what the
                           * user recognises the file by; the path is what they
                           * check when two files share a name, so it is present
                           * and second.
                           */
                          model.path
                            ? React.createElement(PathLabel, { path: model.path })
                            : null,
                        ),
                        React.createElement(
                          'span',
                          { className: 'flex flex-none items-center gap-1' },
                          React.createElement(
                            Button,
                            {
                              variant: 'ghost',
                              size: 'sm',
                              'aria-expanded': isTuning,
                              onClick: () => setTuning(isTuning ? undefined : model.id),
                            },
                            t('params'),
                          ),
                          React.createElement(
                            Button,
                            {
                              variant: 'ghost',
                              size: 'sm',
                              icon: React.createElement(IconTrashOutlineRegular, { size: 14 }),
                              title: t('delete'),
                              'aria-label': t('delete'),
                              onClick: () => {
                                setError(undefined)
                                setRemoving(model.id)
                              },
                            },
                            null,
                          ),
                          isLoaded
                            ? React.createElement(
                                Tag,
                                { tone: 'accent' },
                                t('loaded'),
                              )
                            : isLoading
                              ? React.createElement(
                                  Tag,
                                  { tone: 'outline' },
                                  t('loading_model'),
                                )
                              : React.createElement(
                                  Button,
                                  {
                                    variant: 'primary',
                                    size: 'sm',
                                    icon: React.createElement(IconPlayOutlineRegular, { size: 14 }),
                                    disabled: busy || loadingId !== undefined,
                                    onClick: () => void load(model.id),
                                  },
                                  loadingId === model.id ? t('loading_model') : t('load'),
                                ),
                        ),
                      )
                    },
                  ),
                )
                : React.createElement(
                    'span',
                    { className: 'text-14-regular text-text-weak' },
                    t('noModels')
                  )
            )
          : null,

        // Capability overrides sit above the load parameters and target the
        // same model. They are placed first because they change what the rest
        // of the app offers for this model — the chat composer's attach button
        // reads the same verdict — so they are a precondition for tuning, not
        // part of it.
        React.createElement(CapabilityPanel, {
          t,
          api,
          model: activeModel,
          config: activeModel ? capabilityConfig[activeModel.id] : undefined,
          onSaved: onCapabilitySaved
        }),

        // The parameter panel targets one model, resolved the same way the
        // status block resolves its name: whatever is loaded, else the first
        // model on disk. Tuning before a first load is the normal case, so it
        // must not require loading first.
        //
        // `open` is the id of the model being tuned, or undefined. The list's
        // 参数 button sets it, and the panel compares it against its own model —
        // so the two controls drive one piece of state rather than two that have
        // to be kept in step.
        React.createElement(LoadParametersPanel, {
          t,
          api,
          /*
           * The model being tuned, falling back to the active one.
           *
           * The panel is a single instance rather than one per row, so it has to
           * be told which model the open button was about. Without the lookup it
           * would always edit whichever model happened to be loaded, which is
           * the one thing a per-row 参数 button must not do.
           */
          model:
            (tuning !== undefined ? catalogModels.find((entry) => entry.id === tuning) : undefined) ??
            activeModel,
          open: tuning,
          onToggle: setTuning,
        })
      )
    }

    /**
     * One field of the load-parameter form.
     *
     * Every control is uncontrolled-with-a-key rather than a controlled input
     * bound to a state tree: the form is a snapshot that is read once on save,
     * so mirroring 34 fields into React state would be 34 re-renders per
     * keystroke and no benefit. The draft is collected on submit instead.
     */
    function ParameterField(props) {
      const { field, t, draft, setDraft } = props
      const value = draft[field.key]
      const label = React.createElement(
        'span',
        { className: 'text-14-regular text-text-weak' },
        field.label
      )

      // A `readonly` row is explanatory text the engine owns: "CPU threads" is
      // decided by the build, and offering an input would imply otherwise.
      if (field.type === 'readonly') {
        return React.createElement(
          'div',
          { className: 'flex flex-col gap-1' },
          label,
          React.createElement(
            'span',
            { className: 'text-14-regular text-text-strong' },
            field.auto ? t('paramsAuto') : '—'
          )
        )
      }

      const inputClass =
        'text-14-regular text-text-strong bg-surface-weak rounded-md px-2 py-1 outline-none'

      let control
      if (field.type === 'boolean') {
        control = React.createElement(
          'label',
          { className: 'flex items-center gap-2' },
          React.createElement('input', {
            type: 'checkbox',
            // Absent means "the engine decides", which is a third state a
            // checkbox cannot show, so an unset box reads as unchecked and the
            // hint beside it carries the distinction.
            checked: value === undefined ? Boolean(field.defaultValue) : value === true,
            onChange: (event) =>
              setDraft((prev) => ({ ...prev, [field.key]: event.target.checked }))
          }),
          React.createElement(
            'span',
            { className: 'text-14-regular text-text-weak' },
            value === undefined ? `${t('paramsAuto')}` : ''
          )
        )
      } else if (field.type === 'select') {
        control = React.createElement(
          'select',
          {
            className: inputClass,
            value: value === undefined ? '' : String(value),
            onChange: (event) => {
              const next = event.target.value
              setDraft((prev) => ({ ...prev, [field.key]: next === '' ? undefined : next }))
            }
          },
          React.createElement('option', { value: '' }, t('paramsAuto')),
          ...(field.options ?? []).map((option) =>
            React.createElement('option', { key: option, value: option }, option)
          )
        )
      } else if (field.type === 'string-list') {
        control = React.createElement('textarea', {
          className: `${inputClass} min-h-16`,
          // One per line rather than a comma-separated blob: stop strings
          // routinely contain commas, and splitting on them would corrupt the
          // most common case.
          value: Array.isArray(value) ? value.join('\n') : '',
          placeholder: t('paramsAuto'),
          onChange: (event) =>
            setDraft((prev) => ({
              ...prev,
              [field.key]: event.target.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
            }))
        })
      } else {
        control = React.createElement('input', {
          className: inputClass,
          // `type: 'text'` even for numbers: a number input silently discards a
          // partially typed value like `-` or `0.`, and gpuLayers legitimately
          // takes -1. Coercion happens where the value is read.
          type: 'text',
          value: value === undefined || value === null ? '' : String(value),
          placeholder: t('paramsAuto'),
          onChange: (event) => {
            const raw = event.target.value
            setDraft((prev) => ({ ...prev, [field.key]: raw === '' ? undefined : raw }))
          }
        })
      }

      return React.createElement(
        'div',
        { className: 'flex flex-col gap-1' },
        React.createElement(
          'div',
          { className: 'flex items-center justify-between gap-2' },
          label,
          // The llama.cpp flag is shown next to the human label so a user
          // comparing against llama-server's own help can find the row.
          field.flag
            ? React.createElement(
                'span',
                { className: 'text-14-regular text-text-weak' },
                field.flag
              )
            : null
        ),
        control
      )
    }

    /**
     * The load-parameter panel for one model.
     *
     * Reads the declared field list from the main process — the same
     * declaration `buildArgs` is written against — so a parameter that exists
     * in the form but not in the argument builder is not representable.
     */
    function LoadParametersPanel(props) {
      const { model, t, api, open: openProp, onToggle } = props
      const [groups, setGroups] = React.useState()
      const [draft, setDraft] = React.useState({})
      const [remembered, setRemembered] = React.useState(false)
      /*
       * Open state, owned by the caller when it supplies one.
       *
       * Two controls open this panel — the header on the panel itself, and the
       * per-model button in the list above — and they have to agree. Keeping
       * the state here and mirroring it upward would give the list button a
       * value one render out of date; taking it as a prop makes the caller the
       * single owner and the two controls the same control.
       */
      const [openState, setOpenState] = React.useState(false)
      const open = openProp === undefined ? openState : openProp === model?.id
      const setOpen = (next) => {
        if (onToggle === undefined) setOpenState(typeof next === 'function' ? next(openState) : next)
        else onToggle(open ? undefined : model?.id)
      }
      const [status, setStatus] = React.useState()
      const [error, setError] = React.useState()

      // The field list is static for the life of the app, so it is read once
      // per panel rather than per model; the remembered values are per model and
      // are re-read whenever the selection changes.
      React.useEffect(() => {
        if (!api?.localParameters) return undefined
        let stopped = false
        api
          .localParameters()
          .then((next) => {
            if (!stopped) setGroups(next?.groups ?? [])
          })
          .catch((cause) => {
            if (!stopped) setError(cause instanceof Error ? cause.message : String(cause))
          })
        return () => {
          stopped = true
        }
      }, [api])

      React.useEffect(() => {
        if (!api?.localConfig || !model?.id) return undefined
        let stopped = false
        setStatus(undefined)
        api
          .localConfig(model.id)
          .then((next) => {
            if (stopped) return
            const config = next?.config ?? {}
            setDraft({ ...config })
            setRemembered(Object.keys(config).length > 0)
          })
          .catch(() => {
            if (!stopped) setDraft({})
          })
        return () => {
          stopped = true
        }
      }, [api, model?.id])

      if (!model) return null

      const save = async () => {
        try {
          // Only the fields this form declares. The record also holds the
          // capability overrides, which belong to the panel above and may have
          // been changed since this form read its copy — writing the whole
          // record back would silently revert them.
          const fields = {}
          for (const group of groups ?? []) {
            for (const field of group.fields) {
              if (field.type === 'readonly') continue
              // An emptied field means "go back to the automatic value", which
              // has to reach the store as an explicit clear rather than as an
              // absent key — absent would read as "leave it as it was", and the
              // field would appear to ignore the user.
              const value = draft[field.key]
              fields[field.key] = value === undefined ? null : value
            }
          }
          if ('extraArgs' in draft) fields.extraArgs = draft.extraArgs
          await api.setLocalConfig(model.id, { patch: true, ...fields })
          setStatus(t('paramsSaved'))
          setRemembered(true)
          setError(undefined)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      const reset = async () => {
        try {
          // Clears this form's fields, not the whole record: the record also
          // holds the capability overrides, and a button labelled "reset the
          // parameters" is not understood to switch vision off.
          const cleared = {}
          for (const group of groups ?? []) {
            for (const field of group.fields) {
              if (field.type === 'readonly') continue
              cleared[field.key] = null
            }
          }
          if ('extraArgs' in draft) cleared.extraArgs = null
          await api.setLocalConfig(model.id, { patch: true, ...cleared })
          setDraft({})
          setRemembered(false)
          setStatus(t('paramsResetDone'))
          setError(undefined)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      const header = React.createElement(
        'div',
        { className: 'flex items-center justify-between gap-2' },
        React.createElement(
          'button',
          {
            type: 'button',
            className: 'text-14-medium text-text-strong',
            onClick: () => setOpen((prev) => !prev)
          },
          `${t('paramsTitle')}${open ? ' ▾' : ' ▸'}`
        ),
        React.createElement(
          'span',
          { className: 'text-14-regular text-text-weak' },
          `${t('paramsFor')} ${model.name ?? model.id}`
        )
      )

      if (!open) return React.createElement('div', { className: 'flex flex-col gap-2' }, header)

      return React.createElement(
        'div',
        { className: 'flex flex-col gap-3' },
        header,
        React.createElement(
          'span',
          { className: 'text-14-regular text-text-weak' },
          t('paramsIntro')
        ),
        React.createElement(
          'span',
          { className: 'text-14-regular text-text-weak' },
          remembered ? t('paramsRemembered') : t('paramsNone')
        ),

        // Grouped the way the panel groups them, and collapsed by default
        // beyond the first: 34 fields at once is a wall, and the common edit is
        // context length or GPU offload.
        ...(groups ?? []).map((group) =>
          React.createElement(
            'div',
            { key: group.id, className: 'flex flex-col gap-2' },
            React.createElement(
              'span',
              { className: 'text-14-medium text-text-strong' },
              group.title
            ),
            ...group.fields.map((field) =>
              React.createElement(ParameterField, {
                key: field.key,
                field,
                t,
                draft,
                setDraft
              })
            )
          )
        ),

        React.createElement(
          'span',
          { className: 'text-14-regular text-text-weak' },
          t('paramsBySection')
        ),

        error
          ? React.createElement(
              'span',
              { className: 'text-14-regular text-text-danger' },
              error
            )
          : null,

        React.createElement(
          'div',
          { className: 'flex items-center gap-3' },
          React.createElement(
            'button',
            { type: 'button', className: 'text-14-medium text-text-strong', onClick: save },
            t('paramsSave')
          ),
          React.createElement(
            'button',
            { type: 'button', className: 'text-14-medium text-text-weak', onClick: reset },
            t('paramsReset')
          ),
          status
            ? React.createElement(
                'span',
                { className: 'text-14-regular text-text-weak' },
                status
              )
            : null
        )
      )
    }

    /**
     * A three-state control: auto / allow / deny.
     *
     * A checkbox cannot express this, and the distinction is the whole point:
     * "auto" is the file's verdict, and either explicit choice overrides it.
     * Rendering the inferred value as a checked box would make an override
     * indistinguishable from agreement.
     */
    function TriState(props) {
      const { label, value, onChange, t, autoText, onText, offText } = props
      const options = [
        { id: 'auto', text: autoText },
        { id: 'on', text: onText },
        { id: 'off', text: offText }
      ]
      return React.createElement(
        'div',
        { className: 'flex items-center justify-between gap-2' },
        React.createElement('span', { className: 'text-14-regular text-text-weak' }, label),
        React.createElement(
          'div',
          { className: 'flex items-center gap-2' },
          ...options.map((option) =>
            React.createElement(
              'button',
              {
                key: option.id,
                type: 'button',
                className:
                  (value ?? 'auto') === option.id
                    ? 'text-14-medium text-text-strong'
                    : 'text-14-regular text-text-weak',
                onClick: () => onChange(option.id)
              },
              option.text
            )
          )
        )
      )
    }

    /**
     * Input-capability settings for one model.
     *
     * This exists because inferring vision from an mmproj sidecar alone is
     * wrong for a whole class of models: many ship the vision tower inside the
     * main weights and have no sidecar at all. The inference is therefore
     * shown as a *guess with its evidence*, and the user can override it either
     * way — including turning vision *on* for a model the file does not
     * advertise, which is the case the sidecar-only rule got wrong.
     */
    function CapabilityPanel(props) {
      const { model, t, api, config, onSaved } = props
      const [status, setStatus] = React.useState()
      const [error, setError] = React.useState()

      if (!model) return null
      const capabilities = model.capabilities ?? {}
      const inferred = capabilities.inferredVision ?? capabilities.vision
      const override = config?.visionOverride ?? 'auto'

      // The evidence line. Which source fired decides which sentence is
      // accurate, and saying "detected from the projector file" when the
      // verdict came from an architecture name would be a lie about the
      // strength of the evidence.
      const sourceText =
        capabilities.visionSource === 'mmproj' ? t('visionSourceMmproj')
        : capabilities.visionSource === 'orphanMmproj' ? t('visionSourceOrphanMmproj')
        : capabilities.visionSource === 'metadata' ? t('visionSourceMetadata')
        : capabilities.visionSource === 'architecture' ? t('visionSourceArchitecture')
        : capabilities.visionSource === 'template' ? t('visionSourceTemplate')
        : t('visionNone')

      // A patch, not a replacement. This panel owns two keys out of the thirty
      // the record holds, and sending the whole record back would write this
      // render's copy of the load parameters over whatever the parameter form
      // saved in the meantime — and two quick toggles would fight each other,
      // since `config` only refreshes after the first save returns.
      const save = async (key, value) => {
        try {
          await api.setLocalConfig(model.id, { patch: true, [key]: value })
          setStatus(t('capabilitySaved'))
          setError(undefined)
          onSaved?.()
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        }
      }

      return React.createElement(
        'div',
        { className: 'flex flex-col gap-2' },
        React.createElement(
          'span',
          { className: 'text-14-medium text-text-strong' },
          t('capabilityTitle')
        ),
        React.createElement(
          'span',
          { className: 'text-14-regular text-text-weak' },
          t('capabilityIntro')
        ),

        React.createElement(TriState, {
          label: t('visionLabel'),
          value: override,
          t,
          autoText: t('visionAuto'),
          onText: t('visionOn'),
          offText: t('visionOff'),
          onChange: (next) => save('visionOverride', next)
        }),

        // What the file itself says, so the override is made against the
        // evidence rather than against a bare yes/no.
        React.createElement(
          'span',
          { className: 'text-14-regular text-text-weak' },
          sourceText
        ),
        override !== 'auto'
          ? React.createElement(
              'span',
              { className: 'text-14-regular text-text-weak' },
              // Naming the file's verdict explicitly, rather than reusing the
              // button words: "（禁止）" next to a panel the user just set to
              // "允许" reads as being about the current state, which is the
              // opposite of what this sentence is for.
              `${t('visionOverridden')}${t('visionFileSaid')}${inferred ? t('visionOn') : t('visionOff')}`
            )
          : null,

        // Reasoning is offered on the same footing, so a model whose template
        // hides its thinking branch can still be told to think.
        React.createElement(TriState, {
          label: t('reasoningCapLabel'),
          value: config?.reasoningOverride ?? 'auto',
          t,
          autoText: t('reasoningCapAuto'),
          onText: t('reasoningCapOn'),
          offText: t('reasoningCapOff'),
          onChange: (next) => save('reasoningOverride', next)
        }),

        error
          ? React.createElement('span', { className: 'text-14-regular text-text-danger' }, error)
          : null,
        status
          ? React.createElement('span', { className: 'text-14-regular text-text-weak' }, status)
          : null
      )
    }

    /*
     * `configForms` is the settings page's own service, and `whileServed` is how
     * a feature follows it.
     *
     * The section registers under `settings.section` either way; what the watch
     * adds is the *when*. `whileServed` fires only while the Host is actually
     * serving this plugin's settings namespace — which it derives from the
     * `Config` schema the host half exports — so the row exists exactly when
     * there is a form behind it, and disappears rather than opening onto nothing
     * when the plugin is disabled.
     *
     * Every shipped settings feature does it this way (`ui-settings-agent-loop`,
     * `ui-settings-shell`, `ui-settings-subagent`, `ui-settings-web-search`), and
     * it is the reason those pages can offer a Save button at all: the served
     * namespaces are also what the client-side form model binds against.
     */
    const inject = ['slots', 'locale']

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-aranllm-local: copy dictionaries')
      const t = ctx.locale.bind(NS)
      /*
       * Registered unconditionally, not through `configForms.whileServed`.
       *
       * The shipped settings features gate their row on that watch, which fires
       * only while the Host serves the matching settings namespace. The gate is
       * right for a page whose entire content is a configuration form: with no
       * form there is nothing to show.
       *
       * This page is not that. Its content is the model list, which is served by
       * this plugin's own routes and has nothing to do with whether the settings
       * service has a namespace for it. Gating on the namespace made the whole
       * section disappear — measured, and it is the failure mode the gate is
       * built to produce when the namespace does not match, because `whileServed`
       * resolves normally and simply never calls its `register`. There is no
       * exception to catch and no return value to test, so a fallback beside it
       * is dead code.
       *
       * What the gate would have bought is the Save button, once the host half
       * exposes its fields as a form. That is worth less than the list.
       */
      ctx.effect(
        () =>
          ctx.slots.inject('settings.section', () =>
            ctx.slots.register(
              {
                name: 'settings.section',
                id: 'aranllm-local',
                // After `general` (0) and `models` (10): the local model is a
                // machine-specific concern, not part of endpoint configuration.
                order: 20,
                label: () => t('nav'),
                inject: () => ({ t }),
              },
              LocalModelSection,
            ),
          ),
        'dsh-aranllm-local: settings section',
      )
    }

    exports.apply = apply
    exports.inject = inject
    // Exported for the render tests: the panel is otherwise unreachable, and
    // mounting the whole settings section to reach it would mean standing up
    // the host's model bridge first.
    exports.CapabilityPanel = CapabilityPanel
    exports.TriState = TriState
    return module.exports
  }
})
