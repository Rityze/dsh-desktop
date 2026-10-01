/**
 * Models hosted on this machine.
 *
 * The page is a catalogue and a switch. It reads the model roots, lists what it
 * found, and starts exactly one of them when the user says so — never before.
 * That ordering is the whole reason this is a page rather than a launch step:
 * a model is several gigabytes of weights and the GPU memory to hold them, and
 * spending both on a launch the user did not ask for is the one behaviour that
 * would make this feature worse than not having it.
 *
 * The state is polled rather than pushed. A load is a long-running process
 * outside this application's event system, so there is nothing to subscribe to;
 * the interval is only alive while a load is in flight, which is the only time
 * the answer changes on its own.
 */
import type { LoadParameterField, LoadParameterGroup, LocalLoadedModel, LocalLoadProgress, LocalModelEntry, LocalModelsSnapshot } from './types.js'
import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from './Icon/Icon.tsx'
import { Modal } from './Modal/Modal.tsx'
import { ParameterPanel } from './ParameterPanel.tsx'
import { bridge } from './bridge-adapter.js'
import './local-models.css'

/** What the five load phases are called in the progress line. */
const PHASE_LABEL: Record<string, string> = {
  opening: '打开模型文件',
  verifying: '校验文件头',
  reading: '读取权重',
  initializing: '初始化推理引擎',
  ready: '就绪'
}

/**
 * How often the page re-reads while something is loading.
 *
 * A second is chosen against the two things the poll drives: the elapsed timer
 * and the phase name. Both change on the scale of seconds — a weight read takes
 * tens of them — so a faster interval would re-render the list for no visible
 * difference, and a slower one would leave the timer visibly stepping.
 */
const POLL_MS = 1000

function seconds(ms: number): string {
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  return minutes > 0 ? `${minutes} 分 ${total % 60} 秒` : `${total} 秒`
}

/** A byte count at the scale a model library is measured in. */
function gigabytes(bytes: number): string {
  const gb = bytes / 1024 ** 3
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = bytes / 1024 ** 2
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${String(Math.max(1, Math.round(bytes / 1024)))} KB`
}

/**
 * One row's meta line: the facts about a file, in the order they matter.
 *
 * The context figure is labelled as a ceiling, and the word is doing real work.
 * `contextLength` is what the file declares it was trained for, which is the
 * largest window it can serve — it is not the window a load will use, and a
 * bare "198K 上下文" beside a 13 GiB file reads as a promise about the running
 * model. A load starts far below this unless the user has raised it (see
 * `DEFAULT_CONTEXT_LENGTH`), so the two numbers are different facts and are
 * worded as such. The loaded row below shows what is actually being served.
 */
function describe(model: LocalModelsSnapshot['models'][number]): string {
  const parts: string[] = []
  if (model.architecture) parts.push(model.architecture)
  if (model.sizeLabel) parts.push(model.sizeLabel)
  if (model.quantization) parts.push(model.quantization)
  parts.push(model.humanSize)
  if (model.contextLength) parts.push(`上下文上限 ${Math.round(model.contextLength / 1024)}K`)
  return parts.join(' · ')
}

export function LocalModels() {
  const [snapshot, setSnapshot] = useState<LocalModelsSnapshot | undefined>(undefined)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  const [busyId, setBusyId] = useState<string | undefined>(undefined)
  /** Whether a stop is in flight, so the button can say so rather than repeat. */
  const [cancellingLoad, setCancellingLoad] = useState(false)
  /** Whether a model import is running — the dialog is blocking, this is the wait after it. */
  const [importing, setImporting] = useState(false)
  const [notice, setNotice] = useState<string | undefined>(undefined)
  /** Every library being read, in order. More than one is a normal state. */
  const [libraries, setLibraries] = useState<string[]>([])
  /** The folder just picked, and what moving into it would involve. */
  const [pendingMove, setPendingMove] = useState<
    { to: string; preview: { files: number; bytes: number; sample: string[] } } | undefined
  >(undefined)
  const [moving, setMoving] = useState(false)
  /*
   * The model whose parameters are open.
   *
   * Held by id rather than as a copy of the entry: the catalogue is re-read
   * after every action, and a held object would keep showing the size and path
   * from before a rescan.
   */
  const [tuning, setTuning] = useState<string | undefined>(undefined)
  /*
   * The filter and the sort.
   *
   * Local state rather than anything persisted: a search is a question about
   * this moment, and a filter that survived a relaunch would hide models with no
   * visible reason why — the field above the list is the only sign, and it is
   * not where anyone looks first.
   */
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'name' | 'size' | 'context'>('name')
  /*
   * Which model's detail sheet is open, by id.
   *
   * By id rather than holding the entry: the snapshot is replaced on every poll
   * and an entry captured when the sheet opened would stop matching the file it
   * describes — a reload that changed its size would show the old one.
   */
  const [detail, setDetail] = useState<string | undefined>(undefined)
  /*
   * The model awaiting a delete confirmation, by id.
   *
   * Confirmed even though it is recoverable: what moves is a multi-gigabyte
   * file, and a user who did not mean to press it should not have to find the
   * recycle bin to undo it. The dialog says where it goes, which is the part
   * that makes the recovery believable.
   */
  const [removing, setRemoving] = useState<string | undefined>(undefined)
  const [removeBusy, setRemoveBusy] = useState(false)
  const [removeNote, setRemoveNote] = useState<string | undefined>(undefined)
  /*
   * The listening port.
   *
   * Read from the main process rather than kept as a constant: it is
   * configurable, and a copy here would go stale the moment it changed.
   */
  const [port, setPort] = useState<number | undefined>(undefined)
  /*
   * The load log, shown while a load runs.
   *
   * Polled rather than pushed: the file is written by the engine process, and a
   * subscription would need to be told about writes that happen outside this one.
   * Only while loading — a log that stayed on screen afterwards would be a
   * console, and this is a progress report.
   */
  const [logLines, setLogLines] = useState<string[]>([])
  /*
   * llama.cpp's own memory projection, read once when a load finishes.
   *
   * Not polled: it is written during the load and does not change afterwards,
   * so reading it on the same cadence as the counters would be a request per
   * second for the same value.
   */
  const [memory, setMemory] = useState<Awaited<ReturnType<typeof bridge.models.memory>>>(undefined)
  /*
   * The running server's counters.
   *
   * Polled while a model is loaded and only then: the numbers are meaningless
   * without a server, and a poll that ran anyway would be a request per second
   * for `undefined`.
   */
  const [stats, setStats] = useState<Awaited<ReturnType<typeof bridge.models.stats>>>(undefined)
  const [editingPort, setEditingPort] = useState<string | undefined>(undefined)
  /*
   * Which address was just copied, and a timer to clear the confirmation.
   *
   * The label has to change on click or the button gives no sign it did
   * anything — the clipboard is invisible, and "did that work?" is the only
   * question a copy button raises. Cleared rather than left reading 已复制 so
   * the button can be used again without a reload.
   */
  const [copied, setCopied] = useState<'openai' | 'claude' | undefined>(undefined)

  /*
   * The gateway's own settings: the key, whether it shows, and what happened
   * last time it was saved.
   *
   * Read from the host rather than kept in this component, because the same
   * values are written there and a second copy here would disagree the first
   * time the service was started from anywhere else.
   */
  const [apiKey, setApiKey] = useState('')
  const [keyVisible, setKeyVisible] = useState(false)
  const [gatewayRunning, setGatewayRunning] = useState(false)
  const [gatewayBusy, setGatewayBusy] = useState(false)
  const [gatewayNote, setGatewayNote] = useState<string | undefined>(undefined)

  useEffect(() => {
    void bridge.models.port().then(setPort).catch(() => undefined)
    void bridge.models
      .gateway()
      .then((state) => {
        setApiKey(typeof state?.settings?.apiKey === 'string' ? state.settings.apiKey : '')
        setGatewayRunning(state?.running === true)
      })
      .catch(() => undefined)
  }, [])

  /**
   * Write the gateway's settings and start or restart it with them.
   *
   * The port comes from the address line rather than from this row, because
   * that is where it is edited — and the two are one server, so a save has to
   * carry both. `enabled` is true whenever a key is set: an unprotected gateway
   * on a shared machine is the state this control exists to avoid, and turning
   * it on without a key would be the control doing the opposite of its job.
   */
  const saveGateway = async () => {
    setGatewayBusy(true)
    setGatewayNote(undefined)
    try {
      const state = await bridge.models.applyGateway({
        enabled: true,
        port: port ?? 11434,
        apiKey,
      })
      setGatewayRunning(state?.running === true)
      setGatewayNote(
        state?.error
          ? `启动失败：${state.error}`
          : `已保存。客户端请把 Key 填成上面这个（本地地址 127.0.0.1:${String(state?.port ?? port ?? '')}）。`,
      )
    } catch (cause) {
      setGatewayNote(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setGatewayBusy(false)
    }
  }

  /**
   * Put one of the two base URLs on the clipboard.
   *
   * They differ by more than the port, and that is why both exist. An
   * OpenAI-compatible client takes a base that **includes** `/v1`, because its
   * SDK appends only the endpoint; the Anthropic SDK appends `/v1/messages`
   * itself, so its base must **exclude** it. Pasting one into the other's field
   * produces `/v1/v1/…` or a bare host, and both fail as a connection error
   * with nothing in it to point at the cause.
   *
   * Measured against a running llama-server: `/v1/chat/completions` and
   * `/v1/messages` are both served, and the second answers in Anthropic's own
   * shape — `type: "message"`, `stop_reason`, content blocks — rather than
   * being translated. So neither address is aspirational.
   */
  const copyAddress = useCallback(async (which: 'openai' | 'claude', value: string) => {
    try {
      await bridge.shell.copyText(value)
      setCopied(which)
      window.setTimeout(() => setCopied((current) => (current === which ? undefined : current)), 1600)
    } catch {
      setNotice('复制失败，请手动选中地址复制。')
    }
  }, [])



  /*
   * Whether a load is in flight, read by the poll.
   *
   * A ref rather than state because the interval reads it on every tick without
   * being rebuilt by it. Rebuilding on each change would restart the timer at
   * the moment the load it is watching begins, which is precisely when the
   * elapsed count matters.
   */
  const loading = useRef(false)

  const read = useCallback(async () => {
    try {
      setSnapshot(await bridge.models.localCatalog())
      setFailure(undefined)
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  useEffect(() => {
    void read()
  }, [read])

  /*
   * Whether to poll, which is not the same as whether a load is reported.
   *
   * `progress` is read from the manager, and the manager only reports one while
   * a load is running — so gating the poll on it is circular: the page does not
   * poll because there is no progress, and there is no progress on screen because
   * it does not poll. Measured: the progress bar and the log stayed empty for a
   * whole nineteen-second load.
   *
   * `busyId` is the other half, and it is the one that can start the cycle: it is
   * set the moment the user asks for a load and cleared when the request
   * returns, which spans exactly the window the poll exists to cover.
   */
  const active = snapshot?.progress !== undefined || busyId !== undefined

  useEffect(() => {
    loading.current = active
    if (!active) return
    const timer = window.setInterval(() => void read(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [active, read])

  const load = useCallback(
    async (modelId: string) => {
      setBusyId(modelId)
      setNotice(undefined)
      try {
        const result = await bridge.models.loadLocal(modelId)
        if (!result.ok) setNotice(result.error)
        /*
         * Re-read either way. A failure may still have moved the manager — it
         * unloads the previous model before starting the next — so the list and
         * the running state have to be taken from the manager rather than
         * assumed from the result.
         */
        await read()
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : String(cause))
      } finally {
        setBusyId(undefined)
      }
    },
    [read]
  )

  const unload = useCallback(async () => {
    setNotice(undefined)
    try {
      await bridge.models.unloadLocal()
      await read()
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : String(cause))
    }
  }, [read])

  /** Re-read the library list. Cheap, and always taken from the main process. */
  const readLibraries = useCallback(async () => {
    try {
      const answer = await bridge.models.library()
      setLibraries(Array.isArray(answer?.roots) ? answer.roots : [])
    } catch {
      // The list stays as it was; the catalogue below still renders.
    }
  }, [])

  useEffect(() => {
    void readLibraries()
  }, [readLibraries])

  /**
   * Ask the system for a folder, then ask what to do with the models already here.
   *
   * Two steps rather than one, because changing the folder has a consequence
   * the folder itself does not express: the models under the old root are not
   * under the new one, so the catalogue empties. The user is asked which of the
   * two things they meant — bring the models along, or keep reading both — and
   * that question is the feature. A silent move of tens of gigabytes is not
   * undoable, and a silent non-move looks like the models were lost.
   *
   * The folder comes from the operating system's own picker rather than a text
   * field. A typed path can be wrong in a way that produces an *empty
   * catalogue* rather than an error, which reads as "the models are gone"; the
   * native dialog cannot return a path that does not exist.
   */
  const chooseRoot = useCallback(async () => {
    setNotice(undefined)
    try {
      const picked = await bridge.models.chooseDirectory(libraries[0])
      /* Cancelling is a decision, not a failure. Nothing is said about it. */
      if (!picked) return

      const preview = await bridge.models.previewMove(picked)
      if (preview.blocked) {
        setNotice(preview.blocked)
        return
      }
      setPendingMove({ to: picked, preview })
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : String(cause))
    }
  }, [libraries])

  /** Pick a folder and add it as an additional library, moving nothing. */
  const addRoot = useCallback(async () => {
    setNotice(undefined)
    try {
      const picked = await bridge.models.chooseDirectory(libraries[0])
      if (!picked) return
      if (libraries.some((root) => root.toLowerCase() === picked.toLowerCase())) {
        setNotice('这个目录已经在模型库里了。')
        return
      }
      /*
       * Added behind the existing roots, so the first library keeps producing
       * the unsuffixed model ids — adding a second folder should not rename
       * what the user already sees.
       */
      const result = await bridge.models.setLocalRoot([...libraries, picked].join(';'))
      if (!result.ok) {
        setNotice(result.error)
        return
      }
      setSnapshot(result.value)
      await readLibraries()
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : String(cause))
    }
  }, [libraries, readLibraries])

  /** Stop reading one folder. The files are not touched. */
  const removeRoot = useCallback(
    async (root: string) => {
      setNotice(undefined)
      try {
        const remaining = libraries.filter((entry) => entry !== root)
        const result = await bridge.models.setLocalRoot(remaining.join(';'))
        if (!result.ok) {
          setNotice(result.error)
          return
        }
        setSnapshot(result.value)
        await readLibraries()
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : String(cause))
      }
    },
    [libraries, readLibraries]
  )

  /** Carry out the choice: move the files, or add the folder and keep both. */
  const confirmMove = useCallback(
    async (keepOld: boolean) => {
      const pending = pendingMove
      if (!pending) return
      setPendingMove(undefined)
      setMoving(true)
      setNotice(undefined)
      try {
        const result = await bridge.models.moveLibrary(pending.to, keepOld)
        if (!result.ok) {
          setNotice(result.error ?? '目录切换失败。')
          return
        }
        await read()
        await readLibraries()
        if (result.skipped && result.skipped.length > 0) {
          /*
           * Said even though the move succeeded, and said as what happened
           * rather than as an error: those files are still readable under the
           * old root, which is why the old root is among the libraries listed
           * above. A silent partial move is the version of this that confuses.
           */
          setNotice(`有 ${String(result.skipped.length)} 个文件没能移动，它们仍在原目录。`)
        }
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : String(cause))
      } finally {
        setMoving(false)
      }
    },
    [pendingMove, read, readLibraries]
  )

  const loaded = snapshot?.loaded
  const progress = snapshot?.progress

  useEffect(() => {
    if (!loaded) {
      setMemory(undefined)
      return undefined
    }
    void bridge.models.memory().then(setMemory).catch(() => undefined)
    return undefined
  }, [loaded])

  useEffect(() => {
    if (!loaded) {
      setStats(undefined)
      return undefined
    }
    let cancelled = false
    const read = () => {
      void bridge.models
        .stats()
        .then((value) => {
          if (!cancelled) setStats(value)
        })
        .catch(() => undefined)
    }
    read()
    /*
     * Two seconds. The counters move per request rather than per token — the
     * server accumulates them and this is a readout, not a live rate — so a
     * faster poll would re-render for no visible change.
     */
    const timer = window.setInterval(read, 2000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [loaded])

  useEffect(() => {
    /*
     * Shown while the user is waiting, not only while the manager reports a
     * load. The two windows differ by the time between the request leaving and
     * the manager registering it, which is small — but the panel is also the
     * thing that says what is happening when the manager reports *nothing*,
     * which is what a stalled load looks like.
     */
    if (busyId === undefined && !progress) {
      /* Cleared when the load ends: what is left is the next load's to fill. */
      setLogLines([])
      return undefined
    }
    let cancelled = false
    const read = () => {
      void bridge.models
        .log(120)
        .then((lines) => {
          if (!cancelled) setLogLines(lines)
        })
        .catch(() => undefined)
    }
    read()
    const timer = window.setInterval(read, 1500)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [progress, busyId])
  const binary = snapshot?.binary
  const modelName = snapshot?.models.find((entry) => entry.id === tuning)?.name

  /*
   * What the list shows, after the filter and the sort.
   *
   * `useMemo` on the snapshot rather than a copy in state: the snapshot is
   * replaced on every poll — once a second while a load runs — and a list held
   * separately would have to be written from each of those, which is the shape
   * that goes stale the first time a path forgets.
   */
  const shown = useMemo(() => {
    const models = snapshot?.models ?? []
    const needle = query.trim().toLowerCase()
    const filtered =
      needle.length === 0
        ? models
        : models.filter(
            (model) =>
              model.name.toLowerCase().includes(needle) ||
              model.id.toLowerCase().includes(needle) ||
              (model.architecture ?? '').toLowerCase().includes(needle) ||
              (model.quantization ?? '').toLowerCase().includes(needle)
          )
    /*
     * A copy before sorting — `filter` already returns one, but the
     * unfiltered branch returns the snapshot's own array, and `sort` mutates.
     */
    const sorted = [...filtered]
    if (sort === 'size') sorted.sort((a, b) => b.bytes - a.bytes)
    else if (sort === 'context') sorted.sort((a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0))
    else sorted.sort((a, b) => a.name.localeCompare(b.name))
    return sorted
  }, [snapshot, query, sort])

  return (
    <div className="local-models">
      <header className="local-models__head">
        <div>
          <h1 className="local-models__title">本地模型</h1>
          <p className="local-models__hint">
            在这里的模型由本机运行，速度取决于显卡，与网络无关。加载由你手动触发，
            打开应用不会自动加载。
          </p>
        </div>
        <div className="local-models__head-actions">
          {loaded ? (
            <button type="button" className="local-models__action" onClick={() => void unload()}>
              <Icon name="circle-ban-sign" size="small" />
              卸载
            </button>
          ) : null}
          {/*
            Bringing in a file that is already on disk.

            Beside 重新扫描 because they answer the same question from two
            directions — one looks at what is in the folder, this one puts
            something there. A model downloaded by hand, or kept from another
            tool, needs somewhere to go, and the alternative was to explain the
            `local/<model>/` layout to the user and have them build it in a file
            manager.
          */}
          <button
            type="button"
            className="local-models__action"
            data-tone="quiet"
            disabled={importing}
            onClick={() => {
              setImporting(true)
              setNotice(undefined)
              void bridge.models
                .importModel()
                .then((answer) => {
                  if (answer.ok) {
                    setNotice(`已导入 ${answer.publisher}/${answer.model}`)
                    return read()
                  }
                  if (answer.cancelled !== true) setNotice(answer.error ?? '导入失败。')
                  return undefined
                })
                .catch((cause: unknown) => {
                  setNotice(cause instanceof Error ? cause.message : '导入失败。')
                })
                .finally(() => setImporting(false))
            }}
          >
            <Icon name="cloud-upload" size="small" />
            {importing ? '导入中…' : '导入'}
          </button>
          <button
            type="button"
            className="local-models__action"
            data-tone="quiet"
            onClick={() => void read()}
            disabled={active}
          >
            <Icon name="magnifying-glass" size="small" />
            重新扫描
          </button>
        </div>
      </header>

      {failure ? <p className="local-models__error">{failure}</p> : null}
      {notice ? <p className="local-models__error">{notice}</p> : null}
      {removeNote ? <p className="local-models__error">删除失败：{removeNote}</p> : null}

      {/*
        The service address, at the top of the page and always visible.

        Shown as the whole address rather than a bare port number, because the
        number is not what anyone types: it goes into a browser, a client's base
        URL, or a `curl`. A row reading `端口 18082` leaves the user to assemble
        the rest, and getting the host wrong — `0.0.0.0`, a LAN address — is the
        commoner mistake, since the server binds loopback only.

        Placed here rather than in a section of its own: it is a fact about the
        machine, not a setting to work through, and everything below it is what
        the page is actually for.
      */}
      <div className="local-models__address">
        <Icon name="server" size="small" />
        {editingPort !== undefined ? (
          <form
            className="local-models__address-form"
            onSubmit={(event) => {
              event.preventDefault()
              /*
               * The field takes a full address and only the port is used.
               *
               * Accepting `127.0.0.1:8080` as well as `8080` costs one split and
               * removes the failure a pasted address would otherwise cause —
               * `Number('127.0.0.1:8080')` is NaN, and a rejected paste reads as
               * a broken field rather than as a value that was not asked for.
               */
              const raw = editingPort.trim()
              const next = Number(raw.includes(':') ? (raw.split(':').pop() ?? '') : raw)
              setEditingPort(undefined)
              void bridge.models.setPort(next).then((r) => {
                setPort(r.port)
                setNotice(r.ok ? `服务地址已改为 127.0.0.1:${String(r.port)}，内核正在重启。` : r.error)
              })
            }}
          >
            <input
              className="local-models__address-input"
              value={editingPort}
              autoFocus
              spellCheck={false}
              aria-label="服务地址"
              onChange={(event) => setEditingPort(event.target.value)}
            />
            <button type="submit" className="local-models__action">
              保存
            </button>
            <button
              type="button"
              className="local-models__action"
              data-tone="quiet"
              onClick={() => setEditingPort(undefined)}
            >
              取消
            </button>
          </form>
        ) : (
          <>
            <code className="local-models__address-value">127.0.0.1:{port ?? '…'}</code>
            <button
              type="button"
              className="local-models__action"
              data-tone="quiet"
              title="模型服务监听的地址，改动会重启内核"
              onClick={() => setEditingPort(port !== undefined ? `127.0.0.1:${String(port)}` : '')}
            >
              修改
            </button>
            {/*
              The two base URLs a client would be configured with.

              Offered as copy buttons rather than a line to read and retype:
              these are long, they go into another program's settings, and a
              typo is a connection error with no clue in it.

              They differ in more than the port, and the difference is the
              reason both are here. An OpenAI-compatible client is configured
              with a base that **includes** `/v1`, because its SDK appends only
              the endpoint. The Anthropic SDK appends `/v1/messages` itself, so
              its base must **exclude** it. Copying one into the other's field
              gives `/v1/v1/…` or a bare host, and both fail as "not found".

              Measured against a running llama-server: `/v1/chat/completions`
              and `/v1/messages` are both served, so neither button is
              aspirational — the Anthropic one is served natively, in that
              shape, not translated.
            */}
            {port !== undefined ? (
              <>
                <button
                  type="button"
                  className="local-models__action"
                  data-tone="quiet"
                  title={copied === 'openai' ? '已复制' : '复制 OpenAI 兼容地址（含 /v1）'}
                  onClick={() => void copyAddress('openai', `http://127.0.0.1:${String(port)}/v1`)}
                >
                  <Icon name="copy" size="small" />
                  {copied === 'openai' ? '已复制' : 'OpenAI'}
                </button>
                <button
                  type="button"
                  className="local-models__action"
                  data-tone="quiet"
                  title={copied === 'claude' ? '已复制' : '复制 Claude 兼容地址（不含 /v1）'}
                  onClick={() => void copyAddress('claude', `http://127.0.0.1:${String(port)}`)}
                >
                  <Icon name="copy" size="small" />
                  {copied === 'claude' ? '已复制' : 'Claude'}
                </button>
              </>
            ) : null}
          </>
        )}
      </div>

      {/*
        The gateway's own settings, on the line under the address.

        ## Why the key is here rather than in Settings

        It belongs to the same object as the port: the address is what a client
        is pointed at and the key is what it authenticates with, and the two are
        copied out together. A key on another page would be found only by someone
        who already knew it existed, and the common report — "the client gets a
        401" — is answered by a field beside the address it was copied from.

        ## Why it is hidden by default

        A key is typed once and read zero times. Showing it by default would put
        it on screen every time this page is opened, which is one screenshot away
        from being published. The eye toggles it, and the toggle is a button
        rather than a checkbox because its state is not a value — nothing is
        being switched on.

        ## What saving does

        One call that sets the port, the host, the key and whether the gateway
        runs. They are one decision: a server whose address changed has to be
        rebound, so a save is a restart with the new values rather than a write
        that takes effect later.
      */}
      <div className="local-models__address local-models__gateway" data-gateway-settings="true">
        <Icon name="settings-gear" size="small" />
        <span className="local-models__address-label">API Key</span>
        <input
          className="local-models__address-input"
          type={keyVisible ? 'text' : 'password'}
          value={apiKey}
          spellCheck={false}
          autoComplete="off"
          placeholder="留空表示不校验"
          aria-label="API Key"
          data-api-key="true"
          onChange={(event) => setApiKey(event.target.value)}
        />
        <button
          type="button"
          className="local-models__action"
          data-tone="quiet"
          title={keyVisible ? '隐藏' : '显示'}
          aria-pressed={keyVisible}
          data-key-visible={keyVisible ? 'true' : 'false'}
          onClick={() => setKeyVisible((current) => !current)}
        >
          <Icon name={keyVisible ? 'eye-off' : 'eye'} size="small" />
          {keyVisible ? '隐藏' : '显示'}
        </button>
        <button
          type="button"
          className="local-models__action"
          disabled={gatewayBusy}
          data-gateway-save="true"
          onClick={() => void saveGateway()}
        >
          {gatewayBusy ? '保存中…' : '保存'}
        </button>
        <span className="local-models__address-note">
          {gatewayNote ??
            (gatewayRunning ? '服务正在运行。' : '保存后会启动服务，客户端需要带上这个 Key。')}
        </span>
      </div>

      {/*
        The binary is reported before the list.
        Without it a machine that has no llama-server shows an empty catalogue
        with no reason given, and the likely conclusion — that the models folder
        is wrong — sends the user to change a setting that was never the problem.
      */}
      {snapshot && !binary ? (
        <p className="local-models__error">
          没有找到 llama-server。请把它放进模型目录，或设置 <code>LLAMA_SERVER</code> 指向它。
        </p>
      ) : null}

      <section className="local-models__section">
        <h2 className="local-models__section-title">模型库</h2>

        {/*
          One row of folders, and a button that opens the system's own picker.

          The folders are listed rather than shown as one editable string
          because there can be more than one: declining a move keeps the old
          folder as a second library, and both are read. A `;`-joined line
          would make that look like a single value with a strange character in
          it, which is not what it is.
        */}
        <ul className="local-models__roots">
          {libraries.map((root, index) => (
            <li key={root} className="local-models__root">
              <code className="local-models__root-path" title={root}>
                {root}
              </code>
              {index === 0 ? <span className="local-models__root-tag">主库</span> : null}
              {libraries.length > 1 && index > 0 ? (
                <button
                  type="button"
                  className="local-models__action"
                  data-tone="quiet"
                  title="不再读取这个目录里的模型"
                  onClick={() => void removeRoot(root)}
                >
                  移除
                </button>
              ) : null}
            </li>
          ))}
          {libraries.length === 0 ? <li className="local-models__root">（未设置）</li> : null}
        </ul>

        <div className="local-models__root-actions">
          <button
            type="button"
            className="local-models__action"
            disabled={moving}
            onClick={() => void chooseRoot()}
          >
            <Icon name="folder-add-left" size="small" />
            {moving ? '正在迁移…' : '更换文件夹'}
          </button>
          <button
            type="button"
            className="local-models__action"
            data-tone="quiet"
            disabled={moving}
            onClick={() => void addRoot()}
          >
            添加副库
          </button>
        </div>

        {/*
          The question, once a folder has been picked.

          Deliberately not a decision made for the user: moving tens of
          gigabytes is not undoable in any practical sense, and *not* moving
          looks like the models were lost. Both answers are reasonable and only
          the user knows which applies — a drive that is going away, or one that
          is staying.
        */}
        {pendingMove ? (
          <div className="local-models__move" role="alertdialog" aria-label="迁移模型">
            <p className="local-models__move-title">
              新目录：<code>{pendingMove.to}</code>
            </p>
            <p className="local-models__move-body">
              {pendingMove.preview.files > 0 ? (
                <>
                  当前库里有 {String(pendingMove.preview.files)} 个模型文件，
                  共 {gigabytes(pendingMove.preview.bytes)}。
                  要把它们迁移到新目录吗？
                </>
              ) : (
                <>当前库里没有模型文件，可以直接切换。</>
              )}
            </p>
            {pendingMove.preview.sample.length > 0 ? (
              <p className="local-models__move-sample">
                {pendingMove.preview.sample.slice(0, 2).join('、')}
                {pendingMove.preview.files > 2 ? ` 等 ${String(pendingMove.preview.files)} 个` : ''}
              </p>
            ) : null}
            <div className="local-models__move-actions">
              {pendingMove.preview.files > 0 ? (
                <>
                  <button
                    type="button"
                    className="local-models__action"
                    onClick={() => void confirmMove(false)}
                  >
                    迁移过去
                  </button>
                  <button
                    type="button"
                    className="local-models__action"
                    data-tone="quiet"
                    onClick={() => void confirmMove(true)}
                  >
                    不迁移，保留原目录
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="local-models__action"
                  onClick={() => void confirmMove(true)}
                >
                  切换
                </button>
              )}
              <button
                type="button"
                className="local-models__action"
                data-tone="quiet"
                onClick={() => setPendingMove(undefined)}
              >
                取消
              </button>
            </div>
            {pendingMove.preview.files > 0 ? (
              <p className="local-models__move-note">
                不迁移的话，原目录会作为副库继续读取，两个目录的模型都会出现在下面的列表里。
              </p>
            ) : null}
          </div>
        ) : null}
      </section>


      <section className="local-models__section">
        <div className="local-models__section-head">
          <h2 className="local-models__section-title">可用模型</h2>
          {snapshot && snapshot.models.length > 0 ? (
            <span className="local-models__count">
              {query.trim().length > 0
                ? `${shown.length} / ${snapshot.models.length} 个`
                : `${snapshot.models.length} 个`}
            </span>
          ) : null}
        </div>

        {/*
          The toolbar, above the list and below the heading.
          Hidden when there is nothing to search — a field over an empty list is
          a control for a state that does not exist yet.
        */}
        {snapshot && snapshot.models.length > 0 ? (
          <div className="local-models__toolbar">
            <input
              type="text"
              className="local-models__search"
              placeholder="搜索名称、架构或量化"
              aria-label="搜索模型"
              value={query}
              spellCheck={false}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="local-models__sort" role="radiogroup" aria-label="排序方式">
              {(
                [
                  ['name', '名称'],
                  ['size', '大小'],
                  ['context', '上下文']
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={sort === value}
                  className="local-models__sort-item"
                  data-active={sort === value ? 'true' : undefined}
                  onClick={() => setSort(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {query.trim().length > 0 && shown.length === 0 ? (
          <p className="local-models__empty">没有匹配的模型。</p>
        ) : null}

        {progress ? (
          <div className="local-models__progress">
            <div className="local-models__progress-line">
              <span className="local-models__progress-name">{progress.modelName}</span>
              <span className="local-models__progress-phase">
                {PHASE_LABEL[progress.phase] ?? progress.phase}
                {progress.phaseDetail ? ` · ${progress.phaseDetail}` : ''}
              </span>
              <span className="local-models__progress-time">{seconds(progress.elapsedMs)}</span>
              {/*
                Stopping a load that is already under way.

                Measured against the bundled llama.cpp: a 27B model takes about
                19 seconds and prints nothing for 17 of them. Without a way out,
                the only remedy for having picked the wrong one is to wait it
                out — and on a larger model that is minutes.

                The signal is already wired end to end: `manager.load` takes one,
                `local-models.ts` holds the controller, and `models:unloadLocal`
                aborts it. This is the button that reaches it.
              */}
              <button
                type="button"
                className="local-models__progress-cancel"
                disabled={cancellingLoad}
                onClick={() => {
                  setCancellingLoad(true)
                  void bridge.models
                    .unloadLocal()
                    .catch(() => undefined)
                    .finally(() => setCancellingLoad(false))
                }}
              >
                {cancellingLoad ? '正在停止…' : '停止加载'}
              </button>
            </div>
            {/*
              A bar with a value, not a spinner.
              The value is the phase's position, not measured bytes — llama.cpp
              reports no byte count — so it moves in five steps and stops short of
              full until the load is done. Labelled as a phase for that reason:
              presented as a percentage it would read as a stalled download.
            */}
            <div className="local-models__bar" role="progressbar" aria-valuenow={progress.progress}>
              <div
                className="local-models__bar-fill"
                style={{ width: `${Math.round(progress.progress * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {/*
          The log, while a load is in flight.

          Below the progress bar rather than inside it: the bar says how far, the
          lines say what is happening, and when a load stalls the second is the
          only one that moves. Autoscrolled to the end because the newest line is
          the interesting one.
        */}
        {logLines.length > 0 ? (
          <details className="local-models__log" open>
            <summary className="local-models__log-head">加载日志（{logLines.length} 行）</summary>
            <pre className="local-models__log-body" ref={(el) => el?.scrollTo(0, el.scrollHeight)}>
              {logLines.join('\n')}
            </pre>
          </details>
        ) : null}

        {/*
          The running server's own counters.
          Shown only while a model is loaded: they describe a process, and there
          is none when the list is idle.
        */}
        {/*
          The counters, or a line saying there is nothing to count yet.

          A model that has loaded and answered nothing and a model that is busy
          look the same in a panel of zeroes, so the idle case says so rather
          than showing a row of numbers that all mean "no data".
        */}
        {stats ? (
          <div className="local-models__stats">
            {stats.predictedTokens === 0 &&
            stats.promptTokens === 0 &&
            stats.requestsProcessing === 0 ? (
              <span className="local-models__stat">还没有请求经过这个模型。</span>
            ) : null}
            {stats.predictedTokens > 0 ? (
              <span className="local-models__stat">
                生成{' '}
                <strong>
                  {(stats.predictedTokens / Math.max(stats.predictedSeconds, 0.001)).toFixed(1)}
                </strong>{' '}
                tok/s
              </span>
            ) : null}
            {stats.promptTokens + stats.cachedTokens > 0 ? (
              <span className="local-models__stat">
                提示词 <strong>{stats.promptTokens + stats.cachedTokens}</strong> token
                {stats.cachedTokens > 0 ? `（缓存复用 ${stats.cachedTokens}）` : ''}
              </span>
            ) : null}
            {/*
              The speculative decoder's hit rate, which is the one number that
              says whether MTP is paying for itself. A rate near zero means the
              drafts are being thrown away and the extra work is pure cost.
            */}
            {stats.draftTokens > 0 ? (
              <span className="local-models__stat">
                推测接受率{' '}
                <strong>
                  {((stats.acceptedTokens / stats.draftTokens) * 100).toFixed(0)}%
                </strong>
                （{stats.acceptedTokens}/{stats.draftTokens}）
              </span>
            ) : null}
            {stats.requestsDeferred > 0 ? (
              <span className="local-models__stat" data-warn="true">
                排队请求 {stats.requestsDeferred}
              </span>
            ) : null}
          </div>
        ) : null}

        {/*
          What llama.cpp expected the load to cost.
          Its fitter's own answer, shown because it is the one number that
          explains a load that adjusted itself or a card that is nearly full —
          and because a projection from the engine beats an estimate from here.
        */}
        {memory ? (
          <div className="local-models__memory">
            <span className="local-models__stat">
              显存 <strong>{memory.projectedMiB}</strong> MiB / 可用 {memory.freeMiB} MiB
              ，剩余 <strong>{memory.remainingMiB}</strong> MiB
              {memory.targetMiB > 0 ? `（保留 ${memory.targetMiB}）` : ''}
            </span>
            {memory.device ? <span className="local-models__stat">{memory.device}</span> : null}
            {!memory.fits ? (
              <span className="local-models__stat" data-warn="true">
                引擎调整了加载参数才装下，可减小上下文或卸载层数留出余量
              </span>
            ) : null}
          </div>
        ) : null}

        {loaded ? (
          <div className="local-models__running">
            <Icon name="circle-check" size="small" />
            <span className="local-models__running-name">{loaded.modelName}</span>
            <code className="local-models__running-url">{loaded.baseURL}</code>
            {/*
              What the process was started with, which is the window that will
              actually be served — the number that matters while it is running,
              and a different figure from the ceiling listed above.
            */}
            {loaded.contextLength ? (
              <span className="local-models__running-meta">
                上下文 {Math.round(loaded.contextLength / 1024)}K
              </span>
            ) : null}
            {loaded.multimodal ? (
              <span className="local-models__tag" data-tone="vision">
                支持图片
              </span>
            ) : null}
          </div>
        ) : null}

        {snapshot === undefined ? (
          <p className="local-models__empty">正在扫描…</p>
        ) : snapshot.models.length === 0 ? (
          <p className="local-models__empty">
            这个目录里没有找到 GGUF 模型。把 <code>.gguf</code> 文件放进去，再点「重新扫描」。
          </p>
        ) : (
          <ul className="local-models__list">
            {shown.map((model) => {
              const isLoaded = loaded?.modelId === model.id
              const isLoading = progress?.modelId === model.id
              const isTuning = tuning === model.id
              return (
                <li
                  key={model.id}
                  className="local-models__item"
                  data-loaded={isLoaded ? 'true' : undefined}
                  data-loading={isLoading ? 'true' : undefined}
                >
                  <div className="local-models__item-main">
                    <div className="local-models__item-name">
                      {model.name}
                      {model.multimodal ? (
                        <span className="local-models__tag" data-tone="vision">
                          图片
                        </span>
                      ) : null}
                      {model.hasMtp ? (
                        <span className="local-models__tag" data-tone="mtp">
                          MTP
                        </span>
                      ) : null}
                    </div>
                    <div className="local-models__item-meta">{describe(model)}</div>
                    {/*
                      The file path is shown under the meta rather than in it.
                      A model directory is often deep, and the name is what the
                      user recognises it by; the path is what they check when two
                      files have the same name, so it is present but second.
                    */}
                    <div className="local-models__item-path">{model.path}</div>
                  </div>
                  <button
                    type="button"
                    className="local-models__action"
                    data-tone="quiet"
                    onClick={() => setDetail(model.id)}
                  >
                    详情
                  </button>
                  <button
                    type="button"
                    className="local-models__action"
                    data-tone="quiet"
                    title="移到回收站"
                    onClick={() => {
                      setRemoveNote(undefined)
                      setRemoving(model.id)
                    }}
                  >
                    删除
                  </button>
                  <button
                    type="button"
                    className="local-models__action"
                    data-tone="quiet"
                    aria-expanded={isTuning}
                    onClick={() => setTuning(isTuning ? undefined : model.id)}
                  >
                    参数
                  </button>
                  {isLoaded ? (
                    <span className="local-models__item-state">已加载</span>
                  ) : isLoading ? (
                    <span className="local-models__item-state">加载中…</span>
                  ) : (
                    <button
                      type="button"
                      className="local-models__action"
                      disabled={busyId !== undefined}
                      onClick={() => void load(model.id)}
                    >
                      {busyId === model.id ? '正在启动…' : '加载'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

      </section>

      {loaded ? (
        <p className="local-models__foot">
          这个模型已登记到内核的 <code>{'provider.local'}</code> 来源，可以在新建任务时选择。
        </p>
      ) : null}

      {/*
        The parameters open over the page rather than inside a row.

        They are a form of thirty-odd settings, and a model's list has one row
        per file on disk. Inlined under a row the form would push every model
        below it off the screen and be read as belonging to the list when it
        belongs to one item; over the page it is clearly about the one model
        whose name is on it, and the catalogue stays where the user left it.
      */}
      <Modal
        open={tuning !== undefined}
        size="form"
        title={`加载参数 · ${modelName ?? ''}`}
        onClose={() => setTuning(undefined)}
      >
        {tuning ? (
          <ParameterPanel
            modelId={tuning}
            {...(() => {
              const entry = snapshot?.models.find((m) => m.id === tuning)
              return {
                ...(entry?.contextLength ? { contextLimit: entry.contextLength } : {}),
                ...(entry?.blockCount ? { layerCount: entry.blockCount } : {})
              }
            })()}
            onSaved={() => setNotice('参数已保存，下次加载时生效。')}
          />
        ) : null}
      </Modal>
      {/*
        The detail sheet.
        Read-only, and everything the scanner read out of the GGUF header. The
        list shows what distinguishes one model from another at a glance; this is
        for the questions that need the exact value — which quantization, which
        context ceiling, how many bytes — and for the path, which is long enough
        to need selecting rather than reading.
      */}
      <Modal
        open={detail !== undefined}
        title="模型详情"
        size="form"
        onClose={() => setDetail(undefined)}
        actions={
          <button
            type="button"
            className="modal__button"
            onClick={() => setDetail(undefined)}
          >
            关闭
          </button>
        }
      >
        {(() => {
          const model = (snapshot?.models ?? []).find((entry) => entry.id === detail)
          if (!model) return <p className="local-models__detail-note">这个模型已不在当前目录里。</p>
          const rows: [string, string][] = [
            ['名称', model.name],
            ['架构', model.architecture || '未知'],
            ['量化', model.quantization || '未知'],
            [
              '上下文上限',
              model.contextLength
                ? `${model.contextLength.toLocaleString()}（${Math.round(model.contextLength / 1024)}K）`
                : '未在文件里声明'
            ],
            ['层数', model.blockCount ? String(model.blockCount) : '未知'],
            ['文件大小', `${model.humanSize}（${model.bytes.toLocaleString()} 字节）`],
            ['多模态', model.multimodal ? '是' : '否'],
            ['MTP', model.hasMtp ? '支持' : '不支持'],
            ['文件', model.path],
            ['目录', model.directory],
            ['标识', model.id]
          ]
          return (
            <dl className="local-models__detail">
              {rows.map(([label, value]) => (
                <div key={label} className="local-models__detail-row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          )
        })()}
      </Modal>

      {/*
        The delete confirmation.
        Says where the file goes, because that is the difference between this and
        a destructive action — the model can come back, and a dialog that only
        warned would leave the user unsure whether it could.
      */}
      <Modal
        open={removing !== undefined}
        title="删除模型文件"
        onClose={() => setRemoving(undefined)}
        actions={
          <>
            <button
              type="button"
              className="modal__button"
              disabled={removeBusy}
              onClick={() => setRemoving(undefined)}
            >
              取消
            </button>
            <button
              type="button"
              className="modal__button"
              data-variant="danger"
              disabled={removeBusy}
              onClick={() => {
                const id = removing
                if (!id) return
                setRemoveBusy(true)
                void bridge.models
                  .removeFile(id)
                  .then((result) => {
                    setRemoving(undefined)
                    if (!result.ok) setRemoveNote(result.error)
                  })
                  .finally(() => setRemoveBusy(false))
              }}
            >
              移到回收站
            </button>
          </>
        }
      >
        {(() => {
          const model = (snapshot?.models ?? []).find((entry) => entry.id === removing)
          return (
            <p className="local-models__detail-note">
              {model
                ? `「${model.name}」的文件（${model.humanSize}）会被移到系统回收站，可以从那里还原。模型列表会重新扫描目录。`
                : '这个模型已不在当前目录里。'}
            </p>
          )
        })()}
      </Modal>

    </div>
  )
}
