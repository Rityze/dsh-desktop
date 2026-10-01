# Local ROCmFP4

What this branch adds to DSH Desktop, why each piece exists, and the measurements
that decided it.

This is a **branch**, not a fork of the release line. It carries work done on one
machine — an AMD Radeon RX 7900 XT with ROCm 7.2 — and is published so the changes
can be read and compared rather than merged unread. It descends from the 0.1.1
tree, so a diff against `main` shows upstream's own progress mixed with ours.

---

## Local models

**`packages/dsh-aranllm-local`**

Scans a folder for `.gguf` weights, starts `llama-server` on the one you pick, and
publishes it to the model picker — so a model loaded from the settings page appears
in the chat window's model list without a restart.

Everything below the UI is the AranLLM desktop application's own code, moved here
rather than reimplemented. The scanner, the loader, the download queue and the hub
client are the versions that were already written and tested; what this branch adds
is the wiring that connects them to Harness instead of to IPC.

### Speeds measured on this machine

| Model | Configuration | Generation |
|---|---|---|
| MiMo 9B Q4_K_M | `--n-gpu-layers -1` | **76.7 tok/s** |
| MiMo 9B Q4_K_M | `--n-gpu-layers 32` | 52.9 tok/s |
| Qwen3.8 27B FP4 | `--n-gpu-layers -1` | **26.6 tok/s** |
| Qwen3.8 27B FP4 | `--ubatch-size 64` | 26.6 tok/s, 10.8 s to first token |
| Qwen3.8 27B FP4 | `--ubatch-size 512` | 26.6 tok/s, 6.3 s to first token |

### The layer count is not the model's layer count

`llama.cpp` counts the output projection separately from the repeating blocks, so a
33-block model needs `--n-gpu-layers 33` or `-1` — **not 32**. One layer left on the
host costs more than it looks: that layer runs once per token, and the card spends
each step waiting for a PCIe round trip rather than computing.

Measured on MiMo 9B: **52.9 tok/s at `32`, 76.7 tok/s at `-1`** — 45% of the
generation rate, from a single layer.

The parameter form's slider used to report the block count as its own value, which
wrote `32` into the stored configuration the moment a user pressed save. That is
fixed here: the slider's top position reports `-1`, and `gpuLayers` carries `-1`
as its schema default.

### Batch size, and the time to first token

`--ubatch-size` was pinned to 64 because 512 has a crash on its record for this
ROCm FP4 build. Re-measured with the loader's own arguments and a 3,801-token
prompt, nothing faulted at any value and the cost of the small one was plain:

| `--ubatch-size` | Prompt | Time to first token |
|---|---|---|
| 64 | 353 tok/s | 10.8 s |
| 256 | 541 tok/s | 7.0 s |
| 512 | 601 tok/s | 6.3 s |

256 is the default here: most of the curve, half of the value with a crash on its
record.

### Thinking, and where it goes

`llama-server` was started with `--reasoning-format` unset, which leaves the choice
to `auto` — and on this model's template that put the deliberation inside
`message.content` rather than in `message.reasoning_content`. The visible result
was a reply that looked like one long block of thinking with no answer.

`--reasoning-format deepseek` is now passed always. Alongside it, the per-request
`reasoning_effort` field turns out to be load-bearing in a way that is not obvious:

| Request | Reasoning | Answer |
|---|---|---|
| `{enable_thinking: true}` | 1750 chars | **0 chars** |
| `{reasoning_effort: "low", enable_thinking: true}` | 830 chars | **733 chars** |
| `{reasoning_budget: 200, enable_thinking: true}` | 1709 chars | 0 chars |

Without it, a "low" setting in the panel reached only a launch flag that a running
process ignores, and the reported result was a twelve-minute turn that hit the
output cap with nothing but reasoning in it.

`reasoning_budget` is accepted and ignored by this build, so it is not sent.

---

## The model hub

**`packages/dsh-aranllm-local` (UI), routes in the same package**

Browse `hf-mirror` or ModelScope, pick the `.gguf` files you want, and download them
into the model library.

The desktop application drew this in a window of its own; here it is a settings
section, because the host has one window. The page itself is the original file,
unchanged apart from two import lines.

### Downloads resume, and the queue survives a restart

A model file is the largest thing this application moves — one repository measured
while writing this holds a 46 GB member — so a transfer that restarts from zero
after a dropped connection is not slow, it is unusable.

The queue is written to disk on every change and read back on the next launch.
**Restored entries come back paused**: a download is hours of bandwidth, and one
that begins the moment the application opens is one the user did not ask for at
that moment.

From the list each entry can be started, paused or removed, and the whole queue can
be paused or resumed. Removing an entry forgets it; it does not delete the file —
a partially transferred 40 GB file is not something a × in a list should destroy.

### One subtlety worth stating

A process that is killed mid-transfer has its entry in the *active* slot, not in
*pending* — the drain loop moves it there before starting it. A queue file built
from `pending` alone therefore describes an empty queue at exactly the moment it is
most interesting. Measured: killed a transfer at 40 MB of 47 MB and the restored
queue listed nothing at all. The running entry is written back to the head of
`pending`.

---

## Tool gating

**`packages/dsh-tool-gate`**

Every registered tool is declared to the model on every request, and a local model
with a small window will reach for whatever it can see. On this machine a one-line
greeting spent **94.3K tokens of context** and produced a plan with tool calls.

The gate holds heavy tool groups — file operations, the shell, planning, web
search, delegation, the office suite, image generation — out of the prompt until
the conversation asks for them, and refuses calls to a group that was never opened.

Both halves are needed. Declarations cost tokens; calls cost turns. A gate that
only hides declarations leaves a model that has memorised `todo_write` free to call
it; a gate that only refuses calls pays the tokens for definitions nothing may use.

### Measured

| | Context on a greeting | Tool calls |
|---|---|---|
| Before | 94.3K tokens | plan + tool calls |
| After | **11.9K tokens** | none |

The tool count also drops from 41 to 29, because the office and image plugins are
no longer mounted by default — see below.

### The heavy suites are off by default, reversibly

`dsh-ppt-composer` carries eleven `pptd_`/`ppt_` tools and `dsh-image-generation`
carries one; between them they are the largest single block of schemas a session
holds. Both are withheld until a document is actually being written.

They are switched off through `DEFAULT_DISABLED_HOST_PLUGINS` rather than with
`disabled: true` in the host patch. The two look equivalent and are not: a row
marked `disabled` in the patch is read *after* the state and outranks it, so the
settings toggle could never bring it back. Measured, as three failing tests about
exactly that.

---

## Chinese output

**`packages/dsh-chinese-output`**

Answers are pinned to Simplified Chinese. The reasoning is deliberately left
alone.

A model reasons in the language its training data was densest in, and forcing a
second language onto that has two costs: precision on arithmetic and multi-step
logic drops, and the same thought costs roughly 1.5–2× as many tokens — every one
of which is a forward pass. The reasoning is also a block the user can fold away;
what remains on screen is the answer, and that is what this pins.

---

## What is not here

- **No bundled API keys and no bundled model endpoint.** Every provider is added
  from the UI with its own base URL and key.
- **No automatic model loading at launch.** A multi-gigabyte load is a decision,
  and the application does not make it on the user's behalf.
- **No code signing.** The installer is unsigned, so Windows warns once and macOS
  refuses to open it by double-click until the user allows it.

---

## Building

```bash
npm ci
npm run build
node scripts/electron-builder-windows.mjs --win --x64 --publish never   # Windows
npx --no-install electron-builder --mac --arm64 --publish never         # macOS
```

Use the wrapper on Windows, not `electron-builder` directly: it installs the patch
that inserts `Call dshPromoteDirectories` into electron-builder's NSIS template.
Without it the installer builds, reports `warning 6010: install function
"dshPromoteDirectories" not referenced`, and leaves the install directory empty.
