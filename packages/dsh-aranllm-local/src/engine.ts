/**
 * @module dsh-aranllm-local/engine
 *
 * Local-model engine: owns the llama.cpp server (the modified `llama.cpp`
 * build shipped with AranLLM) as a managed child process. One model is loaded
 * at a time — matching LM Studio's single-active-model behavior — and the
 * engine exposes load / unload / status operations plus model discovery over
 * the local GGUF directories.
 *
 * The engine is the ONLY component that talks to llama.cpp directly. The LLM
 * adapter (see ./adapter.ts) talks to the engine over loopback HTTP so that
 * native model loading never routes through a third-party API surface.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { cpus } from "node:os";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

/** One GGUF model discovered on disk. */
export interface LocalModelFile {
  /** Absolute path to the `.gguf` file. */
  readonly path: string;
  /** Directory holding the file. */
  readonly dir: string;
  /** Display name (file stem, model dir prefixed when nested). */
  readonly name: string;
  /** Size in bytes. */
  readonly sizeBytes: number;
  /** Publisher segment, when the standard `{root}/{publisher}/{model}/x.gguf` layout holds. */
  readonly publisher?: string;
}

/** Load-time parameters mirroring LM Studio's load dialog. */
export interface LoadOptions {
  /** Context window in tokens (`--ctx-size`, 0 = model default). */
  readonly contextLength?: number;
  /** GPU offload layer count (`--n-gpu-layers`). */
  readonly gpuLayers?: number;
  /** CPU thread count (`--threads`). */
  readonly threads?: number;
  /** KV-cache overflow policy. */
  readonly overflow?: "scroll" | "middle-truncate" | "stop";
  /** Stop strings appended to every request. */
  readonly stopStrings?: readonly string[];
  /** Extra CLI flags passed verbatim to llama-server. */
  readonly extraArgs?: readonly string[];
}

/** Live state of the loaded model. */
export interface EngineStatus {
  readonly state: "idle" | "loading" | "ready" | "failed";
  readonly modelPath?: string;
  readonly modelName?: string;
  readonly contextLength?: number;
  readonly baseURL?: string;
  readonly pid?: number;
  readonly error?: string;
  readonly startedAt?: number;
}

/** Engine configuration resolved from settings. */
export interface EngineConfig {
  /** `llama-server` executable path (bundled build, or a user override). */
  readonly serverPath: string;
  /** Model search roots, e.g. `D:\models`. */
  readonly modelDirs: readonly string[];
  /** Preferred port; the engine falls forward when it is taken. */
  readonly port: number;
  /** Milliseconds to wait for readiness after spawn. */
  readonly loadTimeoutMs: number;
}

const GGUF = ".gguf";

/** Recursively collect `.gguf` files under one root, depth-bounded. */
function scanRoot(root: string, out: LocalModelFile[], depth = 0): void {
  if (depth > 4 || !existsSync(root)) return;
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(root, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      scanRoot(full, out, depth + 1);
      continue;
    }
    if (extname(entry).toLowerCase() !== GGUF) continue;
    const stem = entry.slice(0, -GGUF.length);
    const modelDir = dirname(full);
    const name = modelDir === root ? stem : `${basenameOf(modelDir)}`;
    out.push({
      path: resolve(full),
      dir: resolve(modelDir),
      name: baseName(stem, name),
      sizeBytes: st.size,
      publisher: depth >= 2 ? basenameOf(dirname(modelDir)) : undefined,
    });
  }
}

function basenameOf(p: string): string {
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
}

/** Combine a model directory and the file stem into a stable display name. */
function baseName(stem: string, dirName: string): string {
  return stem.toLowerCase() === dirName.toLowerCase() ? stem : `${dirName} / ${stem}`;
}

/** Discover every GGUF model across the configured roots, sorted by name. */
export function discoverModels(dirs: readonly string[]): readonly LocalModelFile[] {
  const out: LocalModelFile[] = [];
  for (const dir of dirs) scanRoot(dir, out);
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** True when a TCP port on loopback is free. */
function portFree(port: number): Promise<boolean> {
  return new Promise((done) => {
    const probe = createServer();
    probe.once("error", () => done(false));
    probe.once("listening", () => probe.close(() => done(true)));
    probe.listen(port, "127.0.0.1");
  });
}

/** Find a free port at or above `preferred`. */
async function pickPort(preferred: number): Promise<number> {
  for (let port = preferred; port < preferred + 100; port += 1) {
    if (await portFree(port)) return port;
  }
  throw new Error(`AranLLM: no free port in ${preferred}..${preferred + 100}`);
}

/** Map the overflow policy onto the llama.cpp KV-cache flag. */
function overflowFlag(policy: LoadOptions["overflow"]): string[] {
  switch (policy) {
    case "scroll":
      return ["--context-shift"];
    case "stop":
      return ["--no-context-shift"];
    case "middle-truncate":
    default:
      return ["--context-shift", "--keep-middle"];
  }
}

/**
 * The llama.cpp lifecycle owner. Callers `load()` a model, `await ready()`
 * before issuing requests, and `unload()` to return to idle.
 */
export class LocalEngine {
  private child?: ChildProcess;
  private config: EngineConfig;
  private status: EngineStatus = { state: "idle" };
  private loading?: Promise<EngineStatus>;
  /** Receives stderr lines; wired to the app log by the host plugin. */
  onLog?: (line: string) => void;

  constructor(config: EngineConfig) {
    this.config = config;
  }

  /** Current engine state, safe to serialize to the renderer. */
  getStatus(): EngineStatus {
    return this.status;
  }

  /** Apply a new configuration; reloads are the caller's decision. */
  reconfigure(config: EngineConfig): void {
    this.config = config;
  }

  /** All locally available models. */
  list(): readonly LocalModelFile[] {
    return discoverModels(this.config.modelDirs);
  }

  /** Wait for an in-flight load, if any. */
  ready(): Promise<EngineStatus> {
    return this.loading ?? Promise.resolve(this.status);
  }

  /**
   * Load one model. Loading a different model evicts the current one first
   * (Auto-Evict), matching LM Studio.
   */
  async load(modelPath: string, options: LoadOptions = {}): Promise<EngineStatus> {
    if (this.status.state === "ready" && this.status.modelPath === modelPath) {
      return this.status;
    }
    if (this.loading) await this.loading.catch(() => undefined);
    this.loading = this.loadInternal(modelPath, options);
    try {
      return await this.loading;
    } finally {
      this.loading = undefined;
    }
  }

  private async loadInternal(modelPath: string, options: LoadOptions): Promise<EngineStatus> {
    await this.unload();
    if (!existsSync(modelPath)) {
      return this.fail(`model file not found: ${modelPath}`);
    }
    if (!existsSync(this.config.serverPath)) {
      return this.fail(`llama-server not found at ${this.config.serverPath}`);
    }
    const port = await pickPort(this.config.port);
    const args = [
      "--model", modelPath,
      "--host", "127.0.0.1",
      "--port", String(port),
      "--ctx-size", String(options.contextLength ?? 4096),
      "--n-gpu-layers", String(options.gpuLayers ?? 0),
      "--threads", String(options.threads ?? Math.max(2, (cpus().length ?? 4) - 2)),
      "--jinja",
      ...overflowFlag(options.overflow),
      ...(options.stopStrings ?? []).flatMap((s) => ["--stop", s]),
      ...(options.extraArgs ?? []),
    ];
    this.status = { state: "loading", modelPath, modelName: basenameOf(modelPath) };
    const child = spawn(this.config.serverPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    this.child = child;
    child.stderr?.on("data", (buf: Buffer) => {
      for (const line of buf.toString("utf8").split(/\r?\n/)) {
        if (line.trim().length > 0) this.onLog?.(line);
      }
    });
    child.once("exit", (code) => {
      if (this.child === child) {
        this.child = undefined;
        if (this.status.state !== "idle") {
          this.status = { state: "failed", error: `llama-server exited with code ${code}` };
        }
      }
    });
    const baseURL = `http://127.0.0.1:${port}`;
    const ok = await this.waitForHealth(baseURL, child);
    if (!ok) {
      await this.unload();
      return this.fail("llama-server did not become ready before the timeout");
    }
    this.status = {
      state: "ready",
      modelPath,
      modelName: basenameOf(modelPath),
      contextLength: options.contextLength ?? 4096,
      baseURL,
      pid: child.pid,
      startedAt: Date.now(),
    };
    return this.status;
  }

  /** Poll `/health` until the server answers or the timeout elapses. */
  private async waitForHealth(baseURL: string, child: ChildProcess): Promise<boolean> {
    const deadline = Date.now() + this.config.loadTimeoutMs;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) return false;
      try {
        const res = await fetch(`${baseURL}/health`);
        if (res.ok) return true;
      } catch {
        /* server not up yet */
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    return false;
  }

  private fail(error: string): EngineStatus {
    this.status = { state: "failed", error };
    return this.status;
  }

  /** Stop the server and return to idle. */
  async unload(): Promise<void> {
    const child = this.child;
    this.child = undefined;
    this.status = { state: "idle" };
    if (!child || child.exitCode !== null) return;
    await new Promise<void>((done) => {
      const timer = setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {
          /* already gone */
        }
        done();
      }, 5000);
      child.once("exit", () => {
        clearTimeout(timer);
        done();
      });
      try {
        child.kill();
      } catch {
        done();
      }
    });
  }
}


