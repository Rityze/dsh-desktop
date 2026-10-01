/**
 * Local models, as the desktop application draws them.
 *
 * ## What this file is
 *
 * The smallest possible wrapper around a copy of the original UI. The page —
 * its layout, its stylesheets, its thirty-four-field parameter form — lives in
 * `ui/`, moved here from the desktop application with one import line changed
 * per file. `build-client.mjs` bundles it and pastes the result below.
 *
 * ## Why the components are not rewritten
 *
 * They were, and the rewrites are where the port went wrong: a list that lost
 * its per-row buttons, a parameter form that lost every field, a filter box that
 * moved. None of it was a design decision — each was a detail the rewrite did
 * not carry across. A copy cannot lose a detail it never restated.
 *
 * ## The one seam
 *
 * The components call `bridge.models.*`, which the old preload script built over
 * IPC. That object is built in `ui/bridge-adapter.js` over this host's HTTP
 * routes — same names, same argument shapes, same return shapes. Three methods
 * reshape their answer (`port`, `library`, `log`) because a route can only
 * answer JSON; the rest are a direct rename.
 */
window.__ModuleLoader__.load({
  id: 'dsh-aranllm-local',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    /*
     * The host's copies of the three shared packages.
     *
     * `react/jsx-runtime` is easy to leave out and its absence is confusing: the
     * compiler emits a call into it for every element, so a bundle that cannot
     * find it fails while rendering rather than while loading, and the error
     * names a hook.
     */
    const react = require('react')
    globalThis.__aranllmUI = {
      react,
      jsxRuntime: require('react/jsx-runtime'),
      reactDom: require('react-dom'),
    }

    /*
     * The clipboard, for the address line's copy button.
     *
     * The adapter reads this rather than importing the host's helper, because
     * the adapter is loaded by the bundle — which runs before the host's
     * packages are in hand. One global, installed here, read there.
     */
    try {
      globalThis.__aranllmWriteClipboard = require('@deepseek-ai/dsh-client-ui-primitives').writeClipboard
    } catch {
      /* Absent is not fatal: the copy button then reports its own failure. */
    }

    // ---- the copied UI, bundled -------------------------------------------
    /* eslint-disable */
"use strict";
var __aranllmUIPending = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // index.tsx
  var index_exports = {};
  __export(index_exports, {
    Hub: () => Hub,
    Icon: () => Icon,
    LiveRate: () => LiveRate,
    LocalModels: () => LocalModels,
    Modal: () => Modal,
    ParameterField: () => ParameterField,
    ParameterPanel: () => ParameterPanel,
    bridge: () => bridge,
    stylesheets: () => stylesheets
  });

  // tokens.css
  var tokens_default = '/*\n * The design tokens.\n *\n * Generated from `scripts/extract/tokens.py`, which reads them out of the\n * reference application\'s built stylesheet. They are not transcribed by hand\n * and not read off the screen: the stylesheet is the only place that has the\n * whole set, including the states and panes the window is not currently\n * showing.\n *\n * Two blocks, light first. The dark block overrides only what differs \u2014 around\n * two thirds of the tokens \u2014 because several of them are defined in terms of\n * others and follow for free. `--color-sunken`, for instance, resolves to a\n * lighter grey in dark mode and a darker one in light: a recess reads as receded\n * when it is offset away from the surface, in whichever direction that is. A\n * mechanical inversion of the values would have produced a raised-looking well.\n *\n * The theme is switched by the `data-theme` attribute, not by\n * `prefers-color-scheme`. An attribute can be pinned regardless of what the\n * system prefers, which is what a manual choice needs.\n */\n\n:root {\n  /* colours */\n  /*\n   * Two colours, because they answer two different questions.\n   *\n   * `--color-accent` is the **identity** colour: what is selected, where the\n   * cursor is, that a thing is running. `--color-button` is the **action**\n   * colour: the fill of a button you are meant to press.\n   *\n   * They were one token, and splitting them is what lets each be right. An\n   * identity colour appears in a dozen places on one screen and has to stay\n   * quiet enough to do that; an action colour has to be unmistakable. A single\n   * value forced one of the two to be wrong.\n   *\n   * The action colour is near-black here and near-white in the dark theme \u2014\n   * it is the palette\'s own ink, not a hue. That is the same choice this\n   * interface already makes for its send button, and it is the one fill that\n   * cannot be mistaken for a status or a label, because it is the colour text\n   * is already in. `--color-accent-foreground` pairs with it.\n   */\n  /*\n   * `#2563eb` rather than the lighter `#3b82f6` it started as, and the reason\n   * is measured: white text on that one is 3.68:1, under the 4.5:1 a badge\n   * needs to be readable. This is the same blue one step down, 5.17:1, and it\n   * still reads as a light blue rather than as navy.\n   */\n  --color-accent: #2563eb;\n  --color-accent-2: #60a5fa;\n  --color-button: #151c13;\n  --color-accent-foreground: var(--color-send-fg);\n  --color-add: #1a7f37;\n  --color-auto-warning: #b86b1f;\n  --color-avatar-swatch-bg: transparent;\n  --color-await-pill: #6b7280;\n  /*\n   * The "new" and group badges, in the accent rather than in orange.\n   *\n   * These were a fixed amber pair \u2014 `#fff0db` on `#fe8559` \u2014 and that was the\n   * last orange left on a screen whose accent had already moved to blue. The\n   * name says orange because the value was; what the token *means* is "a small\n   * marker saying this one is new", which is an identity colour and has to\n   * follow the theme like every other one.\n   *\n   * Derived from `--color-accent-2` rather than `--color-accent`: this is a\n   * light marker on a list row, not the selected item, and the softer of the\n   * two accent steps is the one that reads as a label rather than as a state.\n   */\n  --color-badge-accent-bg: color-mix(in srgb, var(--color-accent-2) 18%, transparent);\n  --color-badge-accent-fg: var(--color-accent);\n  /*\n   * Pure white, where this used to carry a trace of warmth (`#fffefd`).\n   *\n   * That one value of yellow was doing real work: it separated the page from\n   * the panels, which are `#fff`, without a border anywhere. Now that the two\n   * are the same colour, that separation has to come from somewhere else \u2014 the\n   * surfaces that need an edge keep their `--color-line`, and the ones that\n   * were relying on the tint alone are listed below.\n   */\n  --color-bg: #ffffff;\n  --color-black: #000;\n  --color-blue: #2f6fed;\n  --color-border: var(--color-line);\n  --color-btn-border: var(--color-neutral-200);\n  --color-bubble: var(--color-settings-nav);\n  --color-chip-bg: #0000000d;\n  --color-chip-rm: var(--color-neutral-500);\n  --color-chip-rm-hover: #1a1a1a;\n  --color-chip-text: #137a3f;\n  --color-code-bg: #f0f0f2;\n  --color-code-fg: #3a3a38;\n  /*\n   * The ink for a *run* of code inside a sentence, as opposed to a block.\n   *\n   * Its own token rather than `--color-code-fg`, which is the grey a fenced\n   * listing uses: a listing is the content of the message, while an inline\n   * `path/to/file` is a term inside prose, and the two want to be told apart at\n   * a glance. Reusing `--color-danger-fg` would have been closer in colour and\n   * wrong in meaning \u2014 an inline code span is not an error, and a theme that\n   * ever restyles errors would silently restyle every path in every transcript.\n   */\n  --color-code-inline-fg: #b23c2e;\n  --color-composer-fg: #151c13;\n  --color-composer-input: #151c13;\n  --color-composer-placeholder: #151c1399;\n  --color-composer-surface: var(--color-input-bg);\n  --color-composer-tray-bg: var(--color-sunken);\n  --color-danger-bg: #fdecea;\n  --color-danger-bg-hover: #fadbd8;\n  --color-danger-fg: #d93025;\n  --color-del: #e5484d;\n  --color-destructive: var(--color-del);\n\n  /* diff colours */\n  --color-diff-add-bg: #e6ffec;\n  --color-diff-add-fg: #2da44e;\n  --color-diff-del-bg: #ffebe9;\n  --color-diff-del-fg: #cf222e;\n  --color-diff-hunk-bg: #f6f8fa;\n  --color-diff-hunk-fg: #8250df;\n  --color-diff-viewer-bg: var(--color-bg);\n\n  /* colours */\n  --color-dim: #151c1366;\n  --color-done: #21a366;\n  --color-editable: #3295fb;\n  --color-editable-rgb: 50, 149, 251;\n  --color-elevated-card: var(--color-bg);\n  --color-emerald-500: oklch(69.6% .17 162.48);\n  --color-err: #d23f3f;\n  --color-foreground: var(--color-txt);\n\n  /* file-type colours */\n  --color-ft-archive: #b45309;\n  --color-ft-code: #2f6fed;\n  --color-ft-data: #0d9488;\n  --color-ft-dir: #e0a63b;\n  --color-ft-doc: #16a34a;\n  --color-ft-media: #ec4899;\n  --color-ft-shell: #a855f7;\n  --color-ft-web: #ff6a2b;\n\n  /* colours */\n  --color-green-500: oklch(72.3% .219 149.579);\n  --color-hero-title-fg: var(--color-txt-strong);\n  --color-home-logo: #151c13;\n  --color-icon: var(--color-neutral-700);\n  --color-input: var(--color-btn-border);\n  --color-input-bg: #fff;\n  --color-input-border: #151c130f;\n  --color-kbd-launch-bg: var(--color-bg);\n  --color-line: var(--color-neutral-100);\n  --color-line-soft: #0000000d;\n  --color-line-strong: #dcdcd8;\n  --color-line-warm: #f0ebe5;\n  --color-link: #3295fb;\n  --color-main-bg: #fff;\n  --color-mask-opaque: #000;\n  --color-menu-active: #f1f0ec;\n  --color-menu-glass: #ffffffc7;\n  --color-menu-hover: #f1f0ec;\n  --color-modal-scrim: #00000026;\n  --color-mut: #151c1399;\n  --color-muted: var(--color-side);\n  --color-muted-foreground: var(--color-mut);\n  --color-neutral-100: #f1f1f1;\n  --color-neutral-200: #e3e3e0;\n  --color-neutral-400: #bbbbb6;\n  --color-neutral-500: #8a8a82;\n  --color-neutral-700: #5c5c57;\n\n  /* notice colours */\n  --color-notice-bg: #fff;\n  --color-notice-border: #ececec;\n  --color-notice-danger-bg: #ffd9d9;\n  --color-notice-danger-border: #ffbdbd;\n  --color-notice-success-bg: #e5f3ff;\n  --color-notice-success-border: #c9e6ff;\n  --color-notice-warning-bg: #ffe7d9;\n  --color-notice-warning-border: #ffd0b8;\n\n  /* colours */\n  --color-oauth-brand-bg: #111;\n  --color-oc-radio-border: var(--color-set-line);\n  --color-ok: #1a9e5f;\n  --color-panel: #fff;\n  --color-perm-full: #fb8147;\n  --color-popover: var(--color-bg);\n  --color-popover-foreground: var(--color-txt);\n  --color-primary: var(--color-send);\n  --color-primary-foreground: var(--color-send-fg);\n  --color-priority-on: #3295fb;\n  --color-profile-opt-border: color-mix(in srgb, var(--color-txt-strong) 12%, transparent);\n  --color-red-300: oklch(80.8% .114 19.571);\n  --color-red-400: oklch(70.4% .191 22.216);\n  --color-red-50: oklch(97.1% .013 17.38);\n  --color-red-500: oklch(63.7% .237 25.331);\n  --color-red-600: oklch(57.7% .245 27.325);\n  --color-red-800: oklch(44.4% .177 26.899);\n  --color-red-950: oklch(25.8% .092 26.042);\n\n  /* revision colours */\n  --color-revision-bar: #7c3aed;\n  --color-revision-comment-bg: #f3ecff;\n  --color-revision-comment-fg: #6b46c1;\n  --color-revision-ins-bg: #e6f0fa;\n  --color-revision-ins-fg: #2b6cb0;\n\n  /* colours */\n  --color-right-panel-page-bg: #fff;\n  --color-ring: #151c13;\n  --color-sc-tag-success-bg: #e6f4ea;\n  --color-scrim: #00000061;\n  --color-scrim-light: #0000001a;\n  --color-scrollbar-thumb: #0000002e;\n  --color-scrollbar-thumb-hover: #0000004d;\n  --color-secondary: var(--color-neutral-100);\n  --color-secondary-foreground: #151c13;\n  --color-selection-mark: #151c13;\n  --color-selection-strong: #151c13;\n  --color-selection-strong-fg: #fff;\n  --color-send: #151c13;\n  --color-send-empty: var(--color-neutral-400);\n  --color-send-fg: #fff;\n  --color-set-card: #fff;\n  --color-set-line: color-mix(in srgb, var(--color-line) 78%, transparent);\n  --color-set-thumb-fallback: #151c1333;\n  --color-settings-card: var(--color-set-card);\n  --color-settings-content: var(--color-panel);\n  --color-settings-line: var(--color-set-line);\n  --color-settings-nav: #f8f7f5;\n  /*\n   * One step darker than the page, not equal to it.\n   *\n   * This is the "raised block" colour: inline code, fenced blocks, cards, the\n   * terminal, a diff\'s header. All 26 uses are that same job, and each one is\n   * only legible because there is a step \u2014 a card the same white as the page has\n   * no edge to read.\n   *\n   * It was `#fff` while the theme was being made white, and the consequence was\n   * measured rather than guessed: `.md__code` computed to `rgb(255,255,255)` on\n   * a page background of `#ffffff`, so inline code lost its fill and a reply read\n   * as body text with a few red words in it. The report was "the red code blocks\n   * are gone", which is what a tint with no contrast against its page looks like.\n   *\n   * `--color-settings-nav` is the same step and was already correct, so this is\n   * that value rather than a new one: one step, one colour, one place to change.\n   */\n  --color-side: #f8f7f5;\n  --color-side-active: #f1f0ec;\n  --color-side-glass: var(--color-settings-nav);\n  --color-side-hover: #f1f0ec;\n  --color-side-item: #4a4a4a;\n  --color-side-sel: #eeedec;\n  --color-sidenav-fg: #151c13;\n  --color-status-danger: #fa664c;\n  --color-status-success: #30953b;\n  --color-status-warning: #fc8800;\n  --color-sunken: var(--color-side-glass);\n  --color-switch-off: var(--color-neutral-200);\n  --color-table-diff-add: #22a06b;\n  --color-term-cursor-bg: #2b2b2b;\n  --color-term-fg: var(--color-txt-strong);\n  --color-term-prompt-fg: #1a7f37;\n  --color-text-selection: #b3d7ff;\n  --color-thumbnail-bg: #fafafa;\n  --color-topbar-icon: #151c1399;\n  /*\n   * Body ink and emphatic ink, and the gap between them is the whole signal.\n   *\n   * MiSans ships two weights in this application \u2014 Regular 400 and Medium 500 \u2014\n   * so bold text cannot be made bold the usual way. Measured: a `<strong>` comes\n   * out at weight 500 against body 400, and at 14px that difference is close to\n   * invisible; the report was "the bold in important messages is gone", and it\n   * was accurate.\n   *\n   * So the colour carries it, and only the colour can. `--color-txt` is set well\n   * short of the emphatic ink rather than a shade under it: 60% of the ink\n   * against 100% reads as two distinct tones at body size, where the previous\n   * 80%-against-100% read as one tone with noise in it.\n   *\n   * The cost is that ordinary prose is now a dark grey rather than near-black,\n   * which is what every reading-focused interface does and for this reason: if\n   * the body is at full strength there is nothing left to emphasise with.\n   */\n  --color-txt: #151c1399;\n  --color-txt-strong: #151c13;\n  --color-upgrade-bg: #0077fa;\n  --color-upgrade-border: var(--color-line-warm);\n  --color-upgrade-fg: #fff;\n  --color-voice-glow: #0000000a;\n  --color-warn: #c07a1e;\n  --color-white: #fff;\n\n  /* easing */\n  --ease-emph: cubic-bezier(.16, 1, .3, 1);\n  --ease-enter: cubic-bezier(.2, .7, .2, 1);\n  --ease-exit: cubic-bezier(.4, 0, 1, 1);\n  --ease-in-out: cubic-bezier(.4, 0, .2, 1);\n  --ease-out: cubic-bezier(0, 0, .2, 1);\n  --ease-sidebar: cubic-bezier(.7, .1, .5, .9);\n\n  /* fonts */\n  --font-fallback-mono: "SF Mono", ui-monospace, Menlo, "Cascadia Mono", Consolas, "DejaVu Sans Mono", "Noto Sans Mono", "Liberation Mono", "PingFang SC", "Microsoft YaHei", "Noto Sans Mono CJK SC", "Source Han Mono SC", "WenQuanYi Micro Hei Mono", monospace;\n  --font-fallback-sans: "MiSans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Micro Hei", Inter, sans-serif;\n  --font-mono: var(--font-fallback-mono);\n  --font-sans: var(--font-fallback-sans);\n  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;\n  --font-weight-medium: 500;\n  --font-weight-normal: 400;\n  --font-weight-regular: 400;\n  /*\n   * Six hundred, and there is no such face.\n   *\n   * This is the token the headings and table headers reach for, and MiSans\n   * ships 400 and 500 in this application \u2014 see the `@font-face` block in\n   * `design/index.css` for why only those two. A `font-weight` with no matching\n   * face is not an error: the browser **synthesises** one by smearing the\n   * nearest, which at 12\u201314px reads as blur rather than as weight.\n   *\n   * So the value stays 600 \u2014 it is what a caller means, and the token is the\n   * one place to change it \u2014 but it resolves to the Medium face, which is the\n   * heaviest thing the family actually has. Adding a third file would let this\n   * be a real 600; until then, an honest 500 is better than a fake 600.\n   */\n  --font-weight-semibold: 500;\n\n  /* type scale */\n  --leading-tight: 1.25;\n\n  /* easing */\n  --motion-base: .18s;\n  --motion-fast: .12s;\n  --motion-slow: .2s;\n\n  /* radii */\n  --radius: 12px;\n  --radius-2xl: 1rem;\n  --radius-lg: .5rem;\n  --radius-md: .375rem;\n  --radius-search: 8px;\n  --radius-sm: .25rem;\n  --radius-xl: .75rem;\n\n  /* shadows */\n  --shadow-composer: 0 1px 2px #0000000d, 0 6px 18px #0000001b;\n  --shadow-composer-home: var(--shadow-composer);\n  --shadow-dock: 0 2px 10px #0000000a;\n  --shadow-menu: 0 8px 30px #0000002e, 0 1px 3px #0000001a;\n  --shadow-panel: none;\n  --shadow-pop: 0 12px 40px #00000024;\n  --shadow-tip: 0 2px 8px #0000000d, 0 1px 2px #0000000a;\n\n  /* spacing */\n  --spacing: .25rem;\n\n  /* type scale */\n  /*\n   * The code ladder, scaled by its own variable.\n   *\n   * `--code-font-scale` is separate from `--ui-font-scale` on purpose: a reader\n   * who raises the interface size is almost never asking for bigger code, and\n   * tying the two makes one of them wrong for everybody. Only the two steps the\n   * code styles actually use are defined \u2014 a third would be a size nothing asks\n   * for, and adding one later costs a line.\n   */\n  --code-11: calc(11px * var(--code-font-scale,1));\n  --code-12: calc(12px * var(--code-font-scale,1));\n  --text-10: calc(10px * var(--ui-font-scale,1));\n  --text-11: calc(11px * var(--ui-font-scale,1));\n  --text-12: calc(12px * var(--ui-font-scale,1));\n  --text-13: calc(13px * var(--ui-font-scale,1));\n  --text-14: calc(14px * var(--ui-font-scale,1));\n  --text-15: calc(15px * var(--ui-font-scale,1));\n  --text-16: calc(16px * var(--ui-font-scale,1));\n  --text-18: calc(18px * var(--ui-font-scale,1));\n  --text-19: calc(19px * var(--ui-font-scale,1));\n  --text-20: calc(20px * var(--ui-font-scale,1));\n  --text-22: calc(22px * var(--ui-font-scale,1));\n  --text-24: calc(24px * var(--ui-font-scale,1));\n  --text-26: calc(26px * var(--ui-font-scale,1));\n  --text-30: calc(30px * var(--ui-font-scale,1));\n  --text-8: calc(8px * var(--ui-font-scale,1));\n  --tracking-wide: .025em;\n  --tracking-widest: .1em;\n}\n\n/*\n * Dark. Only the tokens whose value actually changes appear here; everything\n * else inherits from the light block above.\n */\n[data-theme=\'dark\'] {\n  /* colours */\n  /*\n   * White, in the dark, and the accent had no value here at all before.\n   *\n   * That absence is why the orange survived a theme switch: the light block\n   * defines the token and nothing overrode it, so `[data-theme=\'dark\']` got the\n   * light theme\'s choice. It was never wrong on purpose \u2014 it was never decided.\n   *\n   * White rather than a lighter blue, because on a near-black surface a colour\n   * has to be bright to read as a colour at all, and a bright blue is what the\n   * link token already is. White is the one thing left that still means "this\n   * one, here" without competing with it.\n   */\n  --color-accent: #ffffff;\n  --color-accent-2: #d4d4d8;\n  /* The ink of the theme, as the action fill \u2014 see the light block. */\n  --color-button: #ececec;\n  --color-add: #3fb950;\n  --color-auto-action-bg: #f7f7f5;\n  --color-auto-action-bg-hover: #e7e7e4;\n  --color-auto-action-fg: #171717;\n  --color-auto-caret-border: #00000024;\n  --color-auto-caret-fg: #0000009e;\n  --color-avatar-swatch-bg: #1e1e1e;\n  /*\n   * Derived the same way as the light theme\'s, from the accent step rather\n   * than from a fixed value \u2014 on a dark surface a transparent tint has to be\n   * built from a lighter colour or the badge disappears into the row.\n   */\n  --color-badge-accent-bg: color-mix(in srgb, var(--color-accent-2) 26%, transparent);\n  --color-badge-accent-fg: var(--color-accent);\n  --color-beta-bg: #2a3f52;\n  --color-bg: #181818;\n  --color-blue: #5a9cff;\n  --color-btn-border: #3a3a3a;\n  --color-bubble: var(--color-code-bg);\n  --color-chip-bg: #ffffff14;\n  --color-chip-rm: #8a8a82;\n  --color-chip-rm-hover: #e6e6e6;\n  --color-chip-text: #4ade80;\n  --color-code-bg: #2e2e2e;\n  --color-code-fg: #e6e6e6;\n  /* Lightened, because the light theme\'s brick red goes to mud on a dark\n     surface. Same hue family, enough luminance to read at 12px. */\n  --color-code-inline-fg: #e08a76;\n  --color-composer-fg: #a0a0a0;\n  --color-composer-input: var(--color-txt);\n  --color-composer-placeholder: var(--color-composer-fg);\n  --color-composer-surface: #1f1f1f;\n  --color-composer-tray-bg: #151515;\n  --color-danger-bg: #3a2320;\n  --color-danger-bg-hover: #4a2c27;\n  --color-danger-fg: #ff9b7f;\n\n  /* diff colours */\n  --color-diff-add-bg: #2ea04726;\n  --color-diff-del-bg: #cf222e26;\n  --color-diff-hunk-bg: #1c2128;\n  --color-diff-viewer-bg: #1e1e1e;\n\n  /* colours */\n  --color-dim: #777;\n  --color-elevated-card: var(--color-set-card);\n\n  /* file-type colours */\n  --color-ft-archive: #d9822b;\n  --color-ft-code: #5a9cff;\n  --color-ft-data: #2dd4bf;\n  --color-ft-dir: #f0b850;\n  --color-ft-doc: #4ade80;\n  --color-ft-media: #f472b6;\n  --color-ft-shell: #c084fc;\n  --color-ft-web: #ff8a52;\n\n  /* colours */\n  --color-hero-title-fg: var(--color-txt);\n  --color-home-greet: var(--color-mut);\n  --color-home-logo: #fff;\n  --color-icon: #d0d0d0;\n  --color-icon-btn: #d0d0d0;\n  --color-input-bg: #181818;\n  --color-input-border: #2e2e2e;\n  --color-kbd-launch-bg: #2a2a2a;\n  --color-line: #2e2e2e;\n  --color-line-soft: #ffffff12;\n  --color-line-strong: var(--color-line);\n  --color-line-warm: #2e2e2e;\n  --color-main-bg: #181818;\n  --color-menu-active: #ffffff1a;\n  --color-menu-glass: #161616b8;\n  --color-menu-hover: #ffffff0f;\n  --color-modal-scrim: #0000003d;\n  --color-mut: #b8b8b8;\n  /* Lightened for the same reason as the rest of this block: #1a9e5f is a\n     light-surface green and disappears against #181818. */\n  --color-ok: #4ade80;\n\n  /* notice colours */\n  --color-notice-bg: #2e2e2e;\n  --color-notice-border: #3a3a3a;\n  --color-notice-danger-bg: #4d100e;\n  --color-notice-danger-border: #711a16;\n  --color-notice-success-bg: #00284d;\n  --color-notice-success-border: #0a3f75;\n  --color-notice-warning-bg: #4a2206;\n  --color-notice-warning-border: #6b3309;\n\n  /* colours */\n  --color-oc-radio-border: #c8c8c4;\n  --color-panel: #181818;\n  --color-profile-opt-border: #ffffff3d;\n\n  /* revision colours */\n  --color-revision-bar: #a78bfa;\n  --color-revision-comment-bg: #2a2140;\n  --color-revision-comment-fg: #c4b5fd;\n  --color-revision-ins-bg: #1c2b3d;\n  --color-revision-ins-fg: #7ab5e8;\n\n  /* colours */\n  --color-ring: #fff;\n  --color-sc-tag-success-bg: var(--color-diff-add-bg);\n  --color-scrim: #0009;\n  --color-scrim-light: #0000003d;\n  --color-scrollbar-thumb: #ffffff2e;\n  --color-scrollbar-thumb-hover: #ffffff4d;\n  --color-secondary: #2e2e2e;\n  --color-secondary-foreground: var(--color-txt-strong);\n  --color-selection-mark: #fff;\n  --color-send: #ececec;\n  --color-send-empty: #5a5a5a;\n  --color-send-fg: #0d0d0d;\n  --color-set-card: #1a1a1a;\n  --color-set-line: color-mix(in srgb, var(--color-line) 78%, transparent);\n  --color-set-thumb-fallback: #2e2e2e;\n  --color-settings-card: #282828;\n  --color-settings-content: #1f1f1f;\n  --color-settings-line: #3d3d3d;\n  --color-settings-nav: var(--color-side);\n  --color-side: #141414;\n  --color-side-active: #ffffff1a;\n  --color-side-glass: var(--color-side);\n  --color-side-hover: #ffffff0f;\n  --color-side-item: #ccc;\n  --color-side-sel: #ffffff1a;\n  --color-sidenav-fg: var(--color-txt-strong);\n  --color-sunken: #2e2e2e;\n  --color-switch-off: #4a4a4a;\n  --color-term-cursor-bg: var(--color-txt);\n  --color-term-fg: var(--color-txt);\n  --color-term-prompt-fg: var(--color-add);\n  --color-text-selection: #33518a;\n  --color-thumbnail-bg: #242424;\n  --color-topbar-icon: #f4f4f5;\n  /*\n   * The same two-tone split as the light theme, for the same reason.\n   *\n   * `#f4f4f5` against `#fff` is one tone at body size \u2014 the bold was invisible\n   * here too, and more so, because a bright ink on a dark ground already reads\n   * as emphasised. Dropping the body ink is what leaves the emphasis somewhere\n   * to go.\n   */\n  --color-txt: #f4f4f5b3;\n  --color-txt-strong: #fff;\n  --color-upgrade-bg: color-mix(in srgb, var(--color-blue) 22%, transparent);\n  --color-upgrade-border: transparent;\n  --color-upgrade-fg: var(--color-blue);\n  --color-voice-glow: #ffffff05;\n  --color-vr-stop: #2a2a2a;\n  --color-vr-stop-hover: #333;\n\n  /* shadows */\n  --shadow-composer: 0 1px 3px #0006;\n  --shadow-composer-home: 0 2px 10px #00000080;\n  --shadow-dock: 0 1px 2px #0000004d;\n  --shadow-menu: 0 8px 30px #0009, 0 1px 3px #0006;\n  --shadow-panel: none;\n  --shadow-pop: 0 12px 40px #00000080;\n  --shadow-tip: 0 2px 8px #0000004d, 0 1px 2px #00000040;\n}\n\n/*\n * \u2500\u2500 Motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n *\n * Five durations and three curves, transcribed from the reference desktop\'s own\n * stylesheet. They were already there as `--cds-dur-*` / `--cds-ease-*` and are\n * copied rather than invented, for the reason the colours above are: a hand-made\n * timing is a guess at a rhythm somebody already tuned, and a rhythm is the one\n * thing that has to be consistent to read as one interface.\n *\n * ## Why named steps rather than raw numbers\n *\n * A duration written where it is used is a decision remade every time \u2014 the\n * menus in this application had four different values for the same kind of\n * appearance, none of them wrong and none of them equal. A name makes the\n * question "which kind of movement is this" rather than "how many milliseconds\n * felt right here", and there are only five answers.\n *\n * `fast` is a change of colour under the cursor. `snap` is something appearing\n * that the user just asked for \u2014 a menu, a row of actions \u2014 and it has to feel\n * like it was already there. `base` is everything else small. `sheet` is a\n * surface that takes over part of the screen. `slow` is a change of what the\n * whole pane is showing, where anything shorter reads as a glitch.\n *\n * ## Why `overshoot` goes past 1\n *\n * `cubic-bezier(.34, 1.3, .64, 1)` \u2014 the second control point is above the\n * target, so the value passes it and comes back. That is the whole of the\n * bounce, and it is a *curve* rather than a keyframe animation: the property\n * still moves monotonically from A to B, it just arrives from the far side.\n * Used for a thing that was thrown or dropped, never for a thing that was\n * chosen \u2014 an overshoot on a menu reads as a mistake.\n */\n:root {\n  --dur-fast: 60ms;\n  --dur-snap: 0.12s;\n  --dur-base: 0.2s;\n  --dur-sheet: 0.3s;\n  --dur-slow: 0.45s;\n\n  --ease-out: cubic-bezier(0, 0, 0.2, 1);\n  --ease-snap: cubic-bezier(0.32, 0.72, 0, 1);\n  --ease-overshoot: cubic-bezier(0.34, 1.3, 0.64, 1);\n}\n';

  // local-models.css
  var local_models_default = `/*\r
 * Local models.\r
 *\r
 * A single column at the same 720px cap as settings, because the two pages are\r
 * read the same way \u2014 a list of rows, each with a name and a fact beside it. A\r
 * full-width list here would put a model's name and its load button at opposite\r
 * edges of a 1920px window, which is the one arrangement that makes a row read\r
 * as two unrelated things.\r
 */\r
\r
.local-models {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 20px;\r
  width: 100%;\r
  max-width: 720px;\r
  margin: 0 auto;\r
  padding: 28px 24px 40px;\r
}\r
\r
.local-models__head {\r
  display: flex;\r
  align-items: flex-start;\r
  justify-content: space-between;\r
  gap: 16px;\r
}\r
\r
.local-models__head-actions {\r
  display: flex;\r
  flex: none;\r
  gap: 8px;\r
}\r
\r
.local-models__title {\r
  margin: 0 0 6px;\r
  font-size: var(--text-18);\r
  font-weight: var(--font-weight-medium);\r
  color: var(--color-txt-strong);\r
}\r
\r
.local-models__hint {\r
  margin: 0;\r
  font-size: var(--text-13);\r
  line-height: 1.6;\r
  color: var(--color-mut);\r
}\r
\r
/*\r
 * Buttons carry no accent fill on this page.\r
 *\r
 * "Load" is a per-row action and there are as many of them as there are models\r
 * on disk, so a filled button against every row would leave no single act\r
 * reading as the page's. The bordered treatment is the row-level one; the fill\r
 * is kept for the case where there is exactly one \u2014 an empty catalogue inviting\r
 * the user to pick a folder.\r
 */\r
.local-models__action {\r
  display: inline-flex;\r
  flex: none;\r
  align-items: center;\r
  gap: 6px;\r
  height: 30px;\r
  padding: 0 12px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 8px;\r
  background: var(--color-side);\r
  color: var(--color-txt);\r
  font-family: inherit;\r
  font-size: var(--text-12);\r
  cursor: default;\r
}\r
\r
.local-models__action:hover:not(:disabled) {\r
  color: var(--color-txt-strong);\r
  border-color: var(--color-mut);\r
}\r
\r
.local-models__action:disabled {\r
  opacity: 0.5;\r
}\r
\r
/*\r
 * A borderless variant, for the secondary control on a row.\r
 *\r
 * "Load" is the act the row exists for; "parameters" is a detour. Two bordered\r
 * buttons of equal weight would read as a choice between them, which is the\r
 * wrong reading \u2014 one is the action and the other is a setting for it.\r
 */\r
.local-models__action[data-tone='quiet'] {\r
  border-color: transparent;\r
  background: transparent;\r
  color: var(--color-mut);\r
}\r
\r
.local-models__action[data-tone='quiet']:hover:not(:disabled) {\r
  background: var(--color-menu-hover);\r
  color: var(--color-txt-strong);\r
  border-color: transparent;\r
}\r
\r
.local-models__action[aria-expanded='true'] {\r
  background: var(--color-menu-hover);\r
  color: var(--color-txt-strong);\r
}\r
\r
.local-models__error {\r
  margin: 0;\r
  padding: 10px 12px;\r
  border-radius: 8px;\r
  background: var(--color-danger-bg);\r
  color: var(--color-danger-fg);\r
  font-size: var(--text-13);\r
  line-height: 1.6;\r
}\r
\r
.local-models__section {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 12px;\r
  padding-top: 20px;\r
  border-top: 1px solid var(--color-line);\r
}\r
\r
/* The first section has no rule: an edge at the top of a column reads as a table. */\r
.local-models__section:first-of-type {\r
  padding-top: 0;\r
  border-top: none;\r
}\r
\r
.local-models__section-head {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 12px;\r
}\r
\r
.local-models__section-title {\r
  margin: 0;\r
  font-size: var(--text-14);\r
  font-weight: var(--font-weight-medium);\r
  color: var(--color-txt-strong);\r
}\r
\r
.local-models__count {\r
  font-size: var(--text-12);\r
  color: var(--color-mut);\r
}\r
\r
/* \u2500\u2500 The model directory \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.local-models__root {\r
  display: flex;\r
  align-items: center;\r
  gap: 12px;\r
  padding: 12px 14px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 10px;\r
  background: var(--color-panel);\r
}\r
\r
.local-models__root-path {\r
  flex: 1;\r
  min-width: 0;\r
  overflow: hidden;\r
  font-family: var(--font-mono);\r
  font-size: var(--text-12);\r
  color: var(--color-txt);\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
  /* A path is the thing a user copies out to check in a file manager. */\r
  user-select: text;\r
}\r
\r
.local-models__root-form {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
}\r
\r
.local-models__root-input {\r
  flex: 1;\r
  min-width: 0;\r
  height: 32px;\r
  padding: 0 10px;\r
  border: 1px solid var(--color-set-line);\r
  border-radius: 8px;\r
  background: var(--color-input-bg);\r
  color: var(--color-txt-strong);\r
  font-family: var(--font-mono);\r
  font-size: var(--text-12);\r
}\r
\r
/* \u2500\u2500 Load progress \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.local-models__progress {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 8px;\r
  padding: 12px 14px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 10px;\r
  background: var(--color-panel);\r
}\r
\r
.local-models__progress-line {\r
  display: flex;\r
  align-items: baseline;\r
  gap: 10px;\r
  min-width: 0;\r
}\r
\r
.local-models__progress-name {\r
  flex: 1;\r
  min-width: 0;\r
  overflow: hidden;\r
  font-size: var(--text-13);\r
  color: var(--color-txt-strong);\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
.local-models__progress-phase {\r
  flex: none;\r
  font-size: var(--text-12);\r
  color: var(--color-mut);\r
}\r
\r
/*\r
 * The clock is tabular.\r
 *\r
 * A proportional font changes the width of every digit, so a counter updating\r
 * once a second shifts the text beside it on each tick. Fixed-width digits hold\r
 * the line still, which is the whole point of showing an elapsed time.\r
 */\r
.local-models__progress-time {\r
  flex: none;\r
  font-size: var(--text-12);\r
  color: var(--color-mut);\r
  font-variant-numeric: tabular-nums;\r
}\r
\r
.local-models__bar {\r
  height: 4px;\r
  overflow: hidden;\r
  border-radius: 2px;\r
  background: var(--color-line);\r
}\r
\r
.local-models__bar-fill {\r
  height: 100%;\r
  border-radius: 2px;\r
  background: var(--color-accent);\r
  transition: width var(--motion-slow) var(--ease-out);\r
}\r
\r
@media (prefers-reduced-motion: reduce) {\r
  .local-models__bar-fill {\r
    transition: none;\r
  }\r
}\r
\r
/* \u2500\u2500 The running model \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.local-models__running {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  min-width: 0;\r
  padding: 10px 14px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 10px;\r
  background: var(--color-panel);\r
  color: var(--color-ok);\r
}\r
\r
.local-models__running-name {\r
  flex: none;\r
  font-size: var(--text-13);\r
  color: var(--color-txt-strong);\r
}\r
\r
.local-models__running-url {\r
  flex: 1;\r
  min-width: 0;\r
  overflow: hidden;\r
  font-family: var(--font-mono);\r
  font-size: var(--text-12);\r
  color: var(--color-mut);\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
  user-select: text;\r
}\r
\r
.local-models__running-meta {\r
  flex: none;\r
  font-size: var(--text-12);\r
  color: var(--color-mut);\r
}\r
\r
/* \u2500\u2500 The catalogue \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.local-models__empty {\r
  margin: 0;\r
  padding: 28px 16px;\r
  border: 1px dashed var(--color-line);\r
  border-radius: 12px;\r
  font-size: var(--text-13);\r
  line-height: 1.6;\r
  color: var(--color-mut);\r
  text-align: center;\r
}\r
\r
.local-models__list {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 8px;\r
  margin: 0;\r
  padding: 0;\r
  list-style: none;\r
}\r
\r
.local-models__item {\r
  display: flex;\r
  align-items: center;\r
  gap: 12px;\r
  padding: 12px 14px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 10px;\r
  background: var(--color-panel);\r
}\r
\r
/*\r
 * The loaded row is outlined, not tinted.\r
 *\r
 * A filled row would have to pick a background that holds up in both themes and\r
 * still leaves the meta text legible; an accent left edge says the same thing\r
 * with one property and no contrast budget. It is also the only row whose state\r
 * is a fact rather than a suggestion, so it gets the one decoration on the page.\r
 */\r
.local-models__item[data-loaded='true'] {\r
  border-left: 3px solid var(--color-ok);\r
}\r
\r
.local-models__item[data-loading='true'] {\r
  border-left: 3px solid var(--color-accent);\r
}\r
\r
.local-models__item-main {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 2px;\r
  flex: 1;\r
  min-width: 0;\r
}\r
\r
.local-models__item-name {\r
  display: flex;\r
  align-items: center;\r
  gap: 6px;\r
  font-size: var(--text-13);\r
  color: var(--color-txt-strong);\r
}\r
\r
.local-models__item-meta {\r
  font-size: var(--text-12);\r
  color: var(--color-mut);\r
}\r
\r
.local-models__item-path {\r
  overflow: hidden;\r
  font-family: var(--font-mono);\r
  font-size: var(--text-12);\r
  color: var(--color-mut);\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
  user-select: text;\r
}\r
\r
.local-models__item-state {\r
  flex: none;\r
  font-size: var(--text-12);\r
  color: var(--color-mut);\r
}\r
\r
/* \u2500\u2500 Capability tags \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.local-models__tag {\r
  flex: none;\r
  padding: 1px 6px;\r
  border-radius: 4px;\r
  background: var(--color-chip-bg);\r
  color: var(--color-mut);\r
  font-size: var(--text-12);\r
  line-height: 1.5;\r
}\r
\r
.local-models__tag[data-tone='vision'] {\r
  color: var(--color-link);\r
}\r
\r
.local-models__tag[data-tone='mtp'] {\r
  color: var(--color-accent);\r
}\r
\r
.local-models__foot {\r
  margin: 0;\r
  font-size: var(--text-12);\r
  line-height: 1.6;\r
  color: var(--color-mut);\r
}\r
\r
/* \u2500\u2500 Model list: search and sort \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.local-models__toolbar {\r
  display: flex;\r
  align-items: center;\r
  gap: 8px;\r
  margin-bottom: 8px;\r
}\r
\r
.local-models__search {\r
  flex: 1;\r
  min-width: 0;\r
  height: 30px;\r
  padding: 0 10px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 8px;\r
  background: var(--color-input-bg);\r
  color: inherit;\r
  font: inherit;\r
  font-size: var(--text-13);\r
}\r
\r
.local-models__search:focus {\r
  outline: none;\r
  border-color: var(--color-accent);\r
}\r
\r
/*\r
 * Three segments in one track rather than three buttons.\r
 *\r
 * They are mutually exclusive and adjacent, which is what a segmented control\r
 * is \u2014 three separate buttons would each need their own border and would read as\r
 * three unrelated actions.\r
 */\r
.local-models__sort {\r
  display: flex;\r
  flex: none;\r
  border: 1px solid var(--color-line);\r
  border-radius: 8px;\r
  overflow: hidden;\r
}\r
\r
.local-models__sort-item {\r
  padding: 0 11px;\r
  height: 28px;\r
  border: 0;\r
  border-right: 1px solid var(--color-line);\r
  background: none;\r
  color: var(--color-muted-foreground);\r
  font: inherit;\r
  font-size: var(--text-12);\r
  cursor: pointer;\r
}\r
\r
.local-models__sort-item:last-child {\r
  border-right: 0;\r
}\r
\r
.local-models__sort-item:hover {\r
  background: var(--color-side-hover);\r
}\r
\r
.local-models__sort-item[data-active='true'] {\r
  background: color-mix(in oklab, var(--color-accent) 10%, transparent);\r
  color: var(--color-accent);\r
}\r
\r
.local-models__empty {\r
  margin: 0;\r
  padding: 12px 2px;\r
  color: var(--color-muted-foreground);\r
  font-size: var(--text-13);\r
}\r
\r
/* \u2500\u2500 Model detail sheet \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.local-models__detail {\r
  margin: 0;\r
  display: grid;\r
  grid-template-columns: auto minmax(0, 1fr);\r
  gap: 7px 16px;\r
  font-size: var(--text-12);\r
}\r
\r
.local-models__detail-row {\r
  display: contents;\r
}\r
\r
.local-models__detail dt {\r
  color: var(--color-muted-foreground);\r
  white-space: nowrap;\r
}\r
\r
/*\r
 * Values wrap and break rather than truncate. These are the exact figures a\r
 * user copies out, and an ellipsis in the middle of a byte count or a path is\r
 * worse than a second line.\r
 */\r
.local-models__detail dd {\r
  margin: 0;\r
  min-width: 0;\r
  word-break: break-all;\r
}\r
\r
.local-models__detail-note {\r
  margin: 0;\r
  color: var(--color-muted-foreground);\r
  font-size: var(--text-13);\r
}\r
\r
/* \u2500\u2500 Load log \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.local-models__log {\r
  margin: 8px 0 0;\r
  border: 1px solid var(--color-line);\r
  border-radius: 8px;\r
  overflow: hidden;\r
}\r
\r
.local-models__log-head {\r
  padding: 6px 10px;\r
  font-size: var(--text-12);\r
  color: var(--color-muted-foreground);\r
  cursor: pointer;\r
  background: var(--color-side);\r
}\r
\r
/*\r
 * Monospace, capped in height, scrolling.\r
 *\r
 * A weight read prints hundreds of lines and this is a progress report rather\r
 * than a document \u2014 the cap is what keeps a long load from pushing the rest of\r
 * the page off screen, and the scroll position is set to the end so the newest\r
 * line is the one in view.\r
 */\r
.local-models__log-body {\r
  margin: 0;\r
  max-height: 220px;\r
  overflow: auto;\r
  padding: 8px 10px;\r
  background: var(--color-panel);\r
  font-family: var(--font-mono, ui-monospace, 'Cascadia Mono', Consolas, monospace);\r
  font-size: var(--text-11);\r
  line-height: 1.5;\r
  white-space: pre-wrap;\r
  word-break: break-all;\r
}\r
\r
/* \u2500\u2500 Server statistics \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.local-models__stats {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 4px 14px;\r
  margin: 8px 0;\r
  padding: 7px 10px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 8px;\r
  background: var(--color-side);\r
  font-size: var(--text-12);\r
  color: var(--color-muted-foreground);\r
}\r
\r
/*\r
 * Tabular figures so a rate that changes every couple of seconds does not shift\r
 * the text around it \u2014 the readout is watched for movement, and reflow hides it.\r
 */\r
.local-models__stat strong {\r
  color: var(--color-txt-strong, inherit);\r
  font-variant-numeric: tabular-nums;\r
  font-weight: var(--font-weight-semibold);\r
}\r
\r
/* A queue is the one figure here that means "something is wrong". */\r
.local-models__stat[data-warn='true'] {\r
  color: var(--color-warn);\r
}\r
\r
/*\r
 * The memory projection.\r
 *\r
 * Same shape as the counters row and deliberately so: both are readouts about\r
 * the running server, and two different treatments would suggest two different\r
 * kinds of thing.\r
 */\r
.local-models__memory {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 4px 14px;\r
  margin: 8px 0;\r
  padding: 7px 10px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 8px;\r
  font-size: var(--text-12);\r
  color: var(--color-muted-foreground);\r
}\r
\r
/* \u2500\u2500 Model libraries \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
/*\r
 * A list, not a single editable line.\r
 *\r
 * There can be more than one library \u2014 declining a move keeps the old folder\r
 * as a second one \u2014 and a \`;\`-joined string would make that look like one value\r
 * with a strange character in it. A row per folder says what it is.\r
 */\r
.local-models__roots {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 4px;\r
  padding: 0;\r
  margin: 0 0 10px;\r
  list-style: none;\r
}\r
\r
.local-models__root {\r
  display: flex;\r
  gap: 8px;\r
  align-items: center;\r
  min-height: 26px;\r
  font-size: var(--text-13);\r
}\r
\r
.local-models__root-path {\r
  overflow: hidden;\r
  font-family: var(--font-mono, monospace);\r
  font-size: var(--text-12);\r
  color: var(--color-txt);\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
/*\r
 * The primary library is marked, because the order is not visible otherwise.\r
 *\r
 * The first root is the one models are downloaded into and the one whose ids\r
 * are unsuffixed; a user looking at two rows has no way to tell which that is.\r
 */\r
.local-models__root-tag {\r
  flex: none;\r
  padding: 1px 6px;\r
  font-size: var(--code-11);\r
  color: var(--color-accent);\r
  background: color-mix(in oklab, var(--color-accent) 10%, transparent);\r
  border-radius: 4px;\r
}\r
\r
.local-models__root-actions {\r
  display: flex;\r
  gap: 8px;\r
  align-items: center;\r
}\r
\r
/*\r
 * The move question.\r
 *\r
 * Bordered and set apart rather than inline, because it is a decision that\r
 * stops everything else: nothing is changed until one of the two answers is\r
 * given, and a block that looked like ordinary page content would let a user\r
 * scroll past the question they are being asked.\r
 */\r
.local-models__move {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 8px;\r
  padding: 14px 16px;\r
  margin-top: 12px;\r
  background: var(--color-auto-action-bg);\r
  border: 1px solid var(--color-line);\r
  border-radius: 10px;\r
}\r
\r
.local-models__move-title {\r
  margin: 0;\r
  font-size: var(--text-13);\r
  color: var(--color-txt-strong);\r
  word-break: break-all;\r
}\r
\r
.local-models__move-body {\r
  margin: 0;\r
  font-size: var(--text-13);\r
  line-height: 1.6;\r
  color: var(--color-txt);\r
}\r
\r
.local-models__move-sample {\r
  margin: 0;\r
  overflow: hidden;\r
  font-size: var(--text-12);\r
  color: var(--color-muted-foreground);\r
  text-overflow: ellipsis;\r
  white-space: nowrap;\r
}\r
\r
.local-models__move-actions {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 8px;\r
  align-items: center;\r
}\r
\r
.local-models__move-note {\r
  margin: 0;\r
  font-size: var(--text-12);\r
  line-height: 1.6;\r
  color: var(--color-muted-foreground);\r
}\r
\r
/*\r
 * A row of row-level actions.\r
 *\r
 * The section is a \`column\` flex container, so its direct children stack \u2014 two\r
 * buttons in a section are two rows, each the full width, which reads as a\r
 * stack of unrelated controls rather than as a toolbar. This wrapper is what\r
 * puts them side by side, and it is the same treatment \`.local-models__root-actions\`\r
 * gives the library buttons.\r
 */\r
.local-models__actions {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 8px;\r
  align-items: center;\r
}\r
\r
/*\r
 * The service address, above everything else on the page.\r
 *\r
 * A row of its own rather than a section: it is a fact about this machine, not\r
 * a setting to work through, and giving it a title and a rule would make it\r
 * read as the first of several things to configure when it is the one line a\r
 * user may need to copy out.\r
 */\r
.local-models__address {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 8px;\r
  align-items: center;\r
  padding: 8px 10px;\r
  font-size: var(--text-13);\r
  color: var(--color-muted-foreground);\r
  background: var(--color-auto-action-bg);\r
  border: 1px solid var(--color-line);\r
  border-radius: 8px;\r
}\r
\r
.local-models__address-form {\r
  display: flex;\r
  flex-wrap: wrap;\r
  gap: 8px;\r
  align-items: center;\r
}\r
\r
.local-models__address-value {\r
  font-family: var(--font-mono, monospace);\r
  font-size: var(--text-13);\r
  color: var(--color-txt-strong);\r
  user-select: all;\r
}\r
\r
/*\r
 * Wider than a port field, because it holds an address.\r
 *\r
 * \`user-select: all\` on the input's value is not set here \u2014 the whole row is\r
 * copyable at rest, and the point of the field is to be typed into rather than\r
 * read from.\r
 */\r
.local-models__address-input {\r
  width: 200px;\r
  height: 28px;\r
  padding: 0 10px;\r
  font: inherit;\r
  font-family: var(--font-mono, monospace);\r
  font-size: var(--text-12);\r
  color: var(--color-txt);\r
  background: var(--color-bg);\r
  border: 1px solid var(--color-line);\r
  border-radius: 6px;\r
}\r
\r
.local-models__address-input:focus-visible {\r
  outline: 2px solid var(--color-accent);\r
  outline-offset: 1px;\r
}\r
\r
/*\r
 * The copy buttons read as part of the address row, not as page actions.\r
 *\r
 * Set apart from the two on the left by a gap rather than a rule: they act on\r
 * the address beside them, and a divider would make them look like another\r
 * group of controls with its own subject.\r
 */\r
.local-models__address .local-models__action {\r
  padding: 3px 9px;\r
  font-size: var(--text-12);\r
}\r

/*
 * Stopping a load.
 *
 * Quiet, not red: this is not a destructive action \u2014 nothing is lost, the load
 * simply stops \u2014 and a red button beside a progress bar would read as "something
 * has gone wrong" at a moment when nothing has.
 */
.local-models__progress-cancel {
  flex: none;
  margin-left: auto;
  padding: 3px 10px;
  font: inherit;
  font-size: var(--text-12);
  color: var(--color-muted-foreground);
  cursor: pointer;
  background: none;
  border: 1px solid var(--color-line);
  border-radius: 7px;
  transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
}

.local-models__progress-cancel:hover:not(:disabled) {
  color: var(--color-txt-strong);
  border-color: var(--color-muted-foreground);
}

.local-models__progress-cancel:disabled {
  cursor: default;
  opacity: 0.6;
}
`;

  // parameter-panel.css
  var parameter_panel_default = `/*\r
 * The load-parameter form.\r
 *\r
 * A label column and a control column, right-aligned controls. That is the\r
 * reference's arrangement and it is the one that works for a form read as a\r
 * list of settings: the eye runs down the labels, and the values line up in a\r
 * single column so a scan finds the one that is wrong.\r
 *\r
 * No frame and no header: this is the body of a modal, and one of those is\r
 * already drawn around it. The scrolling lives on the modal's body too, so that\r
 * the footer the caller supplies stays put while the settings move.\r
 */\r
\r
.params__error {\r
  margin: 0;\r
  padding: 10px 12px;\r
  border-radius: 8px;\r
  background: var(--color-danger-bg);\r
  color: var(--color-danger-fg);\r
  font-size: var(--text-12);\r
  line-height: 1.5;\r
}\r
\r
.params__group + .params__group {\r
  margin-top: 4px;\r
  border-top: 1px solid var(--color-line);\r
}\r
\r
.params__group-head {\r
  display: flex;\r
  align-items: center;\r
  gap: 6px;\r
  width: 100%;\r
  padding: 8px 10px;\r
  border: none;\r
  border-radius: 6px;\r
  background: transparent;\r
  color: var(--color-txt-strong);\r
  font-family: inherit;\r
  font-size: var(--text-12);\r
  font-weight: var(--font-weight-medium);\r
  text-align: left;\r
  cursor: default;\r
}\r
\r
.params__group-head:hover {\r
  background: var(--color-menu-hover);\r
}\r
\r
/*\r
 * The chevron is rotated rather than swapped for a second glyph.\r
 *\r
 * Two glyphs would have to be optically matched by hand; a rotation of the one\r
 * is exact, and it animates, which is what tells the user the click registered.\r
 */\r
.params__chevron {\r
  display: inline-block;\r
  flex: none;\r
  color: var(--color-mut);\r
  font-size: 9px;\r
  transition: transform var(--motion-fast) var(--ease-out);\r
}\r
\r
.params__chevron[data-open='true'] {\r
  transform: rotate(90deg);\r
}\r
\r
@media (prefers-reduced-motion: reduce) {\r
  .params__chevron {\r
    transition: none;\r
  }\r
}\r
\r
.params__fields {\r
  display: flex;\r
  flex-direction: column;\r
  gap: 8px;\r
  padding: 2px 10px 12px;\r
}\r
\r
/* \u2500\u2500 A row \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.param__row {\r
  display: flex;\r
  align-items: center;\r
  gap: 12px;\r
  min-height: 26px;\r
}\r
\r
.param__row--stacked {\r
  flex-direction: column;\r
  align-items: stretch;\r
  gap: 4px;\r
}\r
\r
.param__label {\r
  display: flex;\r
  flex: 1;\r
  align-items: center;\r
  gap: 6px;\r
  min-width: 0;\r
  font-size: var(--text-12);\r
  color: var(--color-txt);\r
}\r
\r
.param__badge {\r
  flex: none;\r
  padding: 1px 5px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 4px;\r
  color: var(--color-mut);\r
  font-size: 10px;\r
  line-height: 1.4;\r
}\r
\r
.param__control {\r
  display: flex;\r
  flex: none;\r
  align-items: center;\r
  gap: 6px;\r
}\r
\r
.param__static {\r
  flex: none;\r
  font-size: var(--text-12);\r
  color: var(--color-mut);\r
}\r
\r
/* \u2500\u2500 A bounded number \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
/*\r
 * The slider row is stacked: label, then track with its reading, then a line of\r
 * prose. The prose is what makes the number meaningful \u2014 "9 / 40" says nothing\r
 * about where the remaining 31 layers run, and that is the whole decision.\r
 */\r
.param__slider {\r
  display: flex;\r
  align-items: center;\r
  gap: 10px;\r
}\r
\r
.param__range {\r
  flex: 1;\r
  min-width: 0;\r
  height: 20px;\r
  margin: 0;\r
  /*\r
   * \`appearance: none\` has to be set or the platform's own track is drawn on\r
   * top of the one styled below, and the two disagree about height on Windows.\r
   */\r
  appearance: none;\r
  background: transparent;\r
}\r
\r
.param__range::-webkit-slider-runnable-track {\r
  height: 4px;\r
  border-radius: 2px;\r
  background: var(--color-line);\r
}\r
\r
.param__range::-webkit-slider-thumb {\r
  appearance: none;\r
  width: 14px;\r
  height: 14px;\r
  margin-top: -5px;\r
  border: none;\r
  border-radius: 50%;\r
  background: var(--color-button);\r
}\r
\r
.param__range:focus-visible {\r
  outline: 1px solid var(--color-accent);\r
  outline-offset: 4px;\r
}\r
\r
/*\r
 * The reading is fixed-width.\r
 *\r
 * It sits beside a track and updates as the thumb moves; without tabular digits\r
 * the numbers either side of the slash shift on every step and the whole line\r
 * appears to jitter under the pointer.\r
 */\r
.param__range-value {\r
  flex: none;\r
  width: 84px;\r
  color: var(--color-txt-strong);\r
  font-size: var(--text-12);\r
  font-variant-numeric: tabular-nums;\r
  text-align: right;\r
}\r
\r
.param__range-hint {\r
  font-size: var(--text-12);\r
  line-height: 1.5;\r
  color: var(--color-mut);\r
}\r
\r
/*\r
 * The line under a field that has to say when it takes effect.\r
 *\r
 * Deliberately the same weight as the slider's own hint: both are prose that\r
 * explains the row above, and a reader who has seen one of them should not have\r
 * to work out whether the other is a warning.\r
 */\r
.param__field-note {\r
  font-size: var(--text-12);\r
  line-height: 1.5;\r
  color: var(--color-mut);\r
}\r
\r
/* \u2500\u2500 Inputs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
/*\r
 * A fixed width, not a flexible one.\r
 *\r
 * These hold numbers and short flag values. Stretched across the panel they\r
 * would read as prose fields and invite text that is not parseable, which is\r
 * the one input this form has to reject anyway.\r
 */\r
.param__input {\r
  width: 132px;\r
  height: 26px;\r
  padding: 0 8px;\r
  border: 1px solid var(--color-set-line);\r
  border-radius: 6px;\r
  background: var(--color-input-bg);\r
  color: var(--color-txt-strong);\r
  font-family: inherit;\r
  font-size: var(--text-12);\r
  /* A number that changes as it is typed shifts the box's text without this. */\r
  font-variant-numeric: tabular-nums;\r
  text-align: right;\r
}\r
\r
.param__row--stacked .param__input {\r
  width: 100%;\r
  text-align: left;\r
}\r
\r
.param__select {\r
  width: 132px;\r
  height: 26px;\r
  padding: 0 6px;\r
  border: 1px solid var(--color-set-line);\r
  border-radius: 6px;\r
  background: var(--color-input-bg);\r
  color: var(--color-txt-strong);\r
  font-family: inherit;\r
  font-size: var(--text-12);\r
}\r
\r
/* \u2500\u2500 Switch \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
.param__switch {\r
  position: relative;\r
  flex: none;\r
  width: 34px;\r
  height: 20px;\r
  padding: 0;\r
  border: none;\r
  border-radius: 10px;\r
  background: var(--color-neutral-400);\r
  cursor: default;\r
  transition: background var(--motion-fast) var(--ease-out);\r
}\r
\r
.param__switch[data-on='true'] {\r
  background: var(--color-button);\r
}\r
\r
/*\r
 * An overridden switch keeps full colour; one showing the engine's default is\r
 * dimmed. The distinction is the panel's whole point \u2014 a row that looks set but\r
 * is only inheriting is a user's setting silently not being applied.\r
 */\r
.param__switch[data-overridden='false'] {\r
  opacity: 0.45;\r
}\r
\r
.param__knob {\r
  position: absolute;\r
  top: 2px;\r
  left: 2px;\r
  width: 16px;\r
  height: 16px;\r
  border-radius: 50%;\r
  background: #fff;\r
  transition: transform var(--motion-fast) var(--ease-out);\r
}\r
\r
.param__switch[data-on='true'] .param__knob {\r
  transform: translateX(14px);\r
}\r
\r
@media (prefers-reduced-motion: reduce) {\r
  .param__switch,\r
  .param__knob {\r
    transition: none;\r
  }\r
}\r
\r
.param__icon {\r
  width: 20px;\r
  height: 20px;\r
  padding: 0;\r
  border: none;\r
  border-radius: 4px;\r
  background: transparent;\r
  color: var(--color-mut);\r
  font-family: inherit;\r
  font-size: var(--text-12);\r
  cursor: default;\r
}\r
\r
.param__icon:hover {\r
  background: var(--color-menu-hover);\r
  color: var(--color-txt-strong);\r
}\r
\r
.param__icon-spacer {\r
  display: inline-block;\r
  width: 20px;\r
}\r
\r
/* \u2500\u2500 Footer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r
\r
/*\r
 * The commit row stays pinned to the bottom of the scrolling area.\r
 *\r
 * It is the last child of the form, so without this it scrolls away with the\r
 * last group and a user who has filled the form in has to scroll back to find\r
 * the button that applies it. Sticky rather than lifted out to the modal's own\r
 * footer slot because the disabled states are computed here \u2014 "save" is only\r
 * live once something has changed \u2014 and a slot would mean the caller had to\r
 * know that.\r
 */\r
.params__foot {\r
  position: sticky;\r
  bottom: 0;\r
  display: flex;\r
  justify-content: flex-end;\r
  gap: 8px;\r
  margin-top: 8px;\r
  padding: 10px 10px 2px;\r
  /* Opaque, or the rows scrolling under it would show through the buttons. */\r
  background: var(--color-panel);\r
  border-top: 1px solid var(--color-line);\r
}\r
\r
.params__action {\r
  height: 28px;\r
  padding: 0 12px;\r
  border: 1px solid var(--color-line);\r
  border-radius: 8px;\r
  background: var(--color-side);\r
  color: var(--color-txt);\r
  font-family: inherit;\r
  font-size: var(--text-12);\r
  cursor: default;\r
}\r
\r
.params__action:hover:not(:disabled) {\r
  color: var(--color-txt-strong);\r
  border-color: var(--color-mut);\r
}\r
\r
.params__action[data-tone='primary'] {\r
  border-color: transparent;\r
  background: var(--color-button);\r
  color: #fff;\r
}\r
\r
.params__action[data-tone='primary']:hover:not(:disabled) {\r
  color: #fff;\r
  border-color: transparent;\r
  opacity: 0.9;\r
}\r
\r
.params__action:disabled {\r
  opacity: 0.45;\r
}\r
\r
/*\r
 * The three speed presets, above the groups.\r
 *\r
 * Above rather than inside a group because they are the answer to the question\r
 * that opened this panel \u2014 "why is it slow" \u2014 and the twenty fields below are\r
 * the follow-up. A reader who finds them after scrolling has already spent the\r
 * attention this is meant to save.\r
 */\r
.params__presets {\r
  display: flex;\r
  gap: 6px;\r
  align-items: center;\r
  padding: 0 0 8px;\r
}\r
\r
.params__presets-label {\r
  flex: none;\r
  font-size: var(--text-12);\r
  color: var(--color-muted-foreground);\r
}\r
\r
.params__preset {\r
  flex: none;\r
  height: 26px;\r
  padding: 0 12px;\r
  font: inherit;\r
  font-size: var(--text-12);\r
  color: var(--color-txt, inherit);\r
  cursor: pointer;\r
  background: var(--color-side);\r
  border: 1px solid var(--color-line);\r
  border-radius: 999px;\r
}\r
\r
.params__preset:hover {\r
  color: var(--color-txt-strong, inherit);\r
  background: var(--color-hover);\r
  border-color: var(--color-accent);\r
}\r
\r
/*\r
 * The note that says what a preset cannot do.\r
 *\r
 * Kept rather than dropped as a nag: "unlock the GPU" is the intent a user\r
 * arrives with, and the one thing this panel will not do is that. Leaving it\r
 * unsaid sends them away believing the sliders were the answer.\r
 */\r
.params__presets-note {\r
  margin: 0 0 12px;\r
  font-size: var(--text-11);\r
  line-height: 1.6;\r
  color: var(--color-mut);\r
}\r
`;

  // Icon/icon.css
  var icon_default = "/*\r\n * Icon.\r\n *\r\n * The wrapper is a square box and the svg fills it, so a caller positions an\r\n * icon by its box and never has to know the aspect ratio or the internal\r\n * viewBox. Sizes are a fixed ladder rather than a number, which keeps every icon\r\n * in the application on one of four steps.\r\n */\r\n\r\n[data-component='icon'] {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  flex-shrink: 0;\r\n  aspect-ratio: 1;\r\n  /*\r\n   * A muted grey by default, and a step below body text on purpose.\r\n   *\r\n   * The interface uses icons at three strengths \u2014 `--icon-base` for structural\r\n   * glyphs, `--icon-weak-base` for secondary actions, and the surrounding text\r\n   * colour when the icon is part of a label. A default that followed the text\r\n   * would erase the first two levels, so the muted value is the baseline and a\r\n   * caller that wants the third says so.\r\n   */\r\n  color: var(--color-icon);\r\n}\r\n\r\n[data-component='icon'] [data-slot='icon-svg'] {\r\n  width: 100%;\r\n  height: auto;\r\n  /*\r\n   * The svg is a drawing, not a control. Clicking it should reach whatever the\r\n   * icon is sitting inside \u2014 a button, a menu row \u2014 rather than being swallowed\r\n   * by the glyph's own bounding box.\r\n   */\r\n  pointer-events: none;\r\n}\r\n\r\n[data-component='icon'][data-size='small'] {\r\n  width: 16px;\r\n  height: 16px;\r\n}\r\n\r\n[data-component='icon'][data-size='normal'] {\r\n  width: 20px;\r\n  height: 20px;\r\n}\r\n\r\n[data-component='icon'][data-size='medium'] {\r\n  width: 24px;\r\n  height: 24px;\r\n}\r\n\r\n[data-component='icon'][data-size='large'] {\r\n  width: 24px;\r\n  height: 24px;\r\n}\r\n";

  // Modal/modal.css
  var modal_default = "/*\r\n * Modal.\r\n *\r\n * The backdrop is `position: fixed` on the window, so it is unaffected by the\r\n * `contain: strict` on `.shell__main` \u2014 `contain` makes an element a containing\r\n * block for absolutely and fixed positioned descendants, and a modal anchored\r\n * inside the main pane would centre on the pane rather than on the window.\r\n * Fixed positioning against the viewport sidesteps that entirely, which is why\r\n * the card is centred by flexbox on the backdrop rather than by\r\n * `translate(-50%, -50%)` on the card.\r\n */\r\n\r\n.modal {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 100;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  /*\r\n   * Two effects, not one. The tint separates the card from the window behind it;\r\n   * the blur keeps the labels of the sidebar from competing with the card's\r\n   * text. Blur is 2px rather than more because a heavier one at this size costs\r\n   * a full-window repaint on every frame the card animates.\r\n   */\r\n  background: color-mix(in srgb, var(--color-bg) 72%, transparent);\r\n  backdrop-filter: blur(2px);\r\n}\r\n\r\n.modal__card {\r\n  display: flex;\r\n  flex-direction: column;\r\n  width: 420px;\r\n  max-width: calc(100vw - 48px);\r\n  padding: 18px;\r\n  border: 1px solid var(--color-line);\r\n  border-radius: 14px;\r\n  background: var(--color-panel);\r\n  box-shadow: var(--shadow-pop);\r\n}\r\n\r\n.modal__title {\r\n  margin-bottom: 12px;\r\n  color: var(--color-txt-strong);\r\n  font-size: var(--text-14);\r\n  font-weight: var(--font-weight-medium);\r\n}\r\n\r\n.modal__body {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n}\r\n\r\n/*\r\n * The form variant.\r\n *\r\n * Wider, and bounded in height. The width is for rows that pair a label with a\r\n * control \u2014 at 420px the two columns meet in the middle and the labels start\r\n * wrapping. The bound is the part that matters: a form of thirty settings is\r\n * taller than any window, and without a ceiling the card would grow past both\r\n * edges and take its own footer out of reach, leaving a user who has filled it\r\n * in with nothing to click.\r\n *\r\n * `min-height: 0` on the body is what lets it scroll inside a flex column \u2014\r\n * without it the body's content sets the card's height and the overflow never\r\n * engages.\r\n */\r\n.modal__card[data-size='form'] {\r\n  width: 560px;\r\n  max-height: calc(100vh - 96px);\r\n}\r\n\r\n.modal__card[data-size='form'] .modal__body {\r\n  flex: 1;\r\n  min-height: 0;\r\n  overflow-y: auto;\r\n  /*\r\n   * The scrollbar would otherwise sit flush against the fields' right edge,\r\n   * where it reads as part of the last control.\r\n   */\r\n  padding-right: 4px;\r\n}\r\n\r\n/*\r\n * The text field.\r\n *\r\n * The border lives on the input itself here, unlike the composer where the card\r\n * is the field. A single-line input has no tray and no footer row, so there is\r\n * no outer box for the border to sit on, and the focus ring has to be on the\r\n * thing the user is typing into.\r\n */\r\n.modal__input {\r\n  width: 100%;\r\n  height: 36px;\r\n  padding: 0 10px;\r\n  border: 1px solid var(--color-line);\r\n  border-radius: 8px;\r\n  background: var(--color-bg);\r\n  color: var(--color-txt-strong);\r\n  font-family: inherit;\r\n  font-size: var(--text-14);\r\n  outline: none;\r\n}\r\n\r\n.modal__input:focus {\r\n  border-color: var(--color-icon);\r\n}\r\n\r\n/*\r\n * A refusal the form has to show.\r\n *\r\n * Red rather than the accent colour, and below the fields rather than above the\r\n * buttons: this is the answer to something the user typed, so it belongs beside\r\n * what they typed. The dialog stays open while it is visible \u2014 a form that\r\n * closed and reported the failure somewhere else would read as a success.\r\n */\r\n.modal__error {\r\n  margin: 10px 0 0;\r\n  color: var(--color-danger-fg);\r\n  font-size: var(--text-13, 13px);\r\n  line-height: 1.5;\r\n}\r\n\r\n/*\r\n * The question a confirmation asks.\r\n *\r\n * Body weight and a normal line height: this is the one sentence in the dialog\r\n * that has to be read, and it is often two \u2014 what will happen, and what cannot\r\n * be got back.\r\n */\r\n.modal__message {\r\n  margin: 0;\r\n  color: var(--color-txt);\r\n  font-size: var(--text-13, 13px);\r\n  line-height: 1.6;\r\n  word-break: break-word;\r\n}\r\n\r\n/*\r\n * The consequence, one step down from the sentence above it.\r\n *\r\n * The dialog's first line says what is about to happen; these say what it\r\n * costs and what it does not touch. Weaker on purpose rather than for looks:\r\n * three lines at the same weight read as one paragraph and get skipped whole,\r\n * where a sentence and two notes get a glance each. It is also why this is a\r\n * variant and not a smaller font size on a `<small>` \u2014 the styling belongs\r\n * with the reason, not with the markup.\r\n */\r\n.modal__message--muted {\r\n  margin-top: 8px;\r\n  color: var(--color-muted-foreground);\r\n  font-size: var(--text-12, 12px);\r\n}\r\n\r\n/*\r\n * The action that destroys something.\r\n *\r\n * Filled red, unlike the menu item of the same intent, because here the button\r\n * is the thing the user is being asked to press and there is a cancel beside it\r\n * doing nothing. In a menu the same treatment would make it the loudest row on\r\n * a list of ordinary verbs.\r\n */\r\n.modal__button[data-variant='danger'] {\r\n  border-color: transparent;\r\n  background: var(--color-danger-fg);\r\n  color: #ffffff;\r\n}\r\n\r\n.modal__button[data-variant='danger']:hover {\r\n  background: color-mix(in srgb, var(--color-danger-fg) 86%, #000000);\r\n}\r\n\r\n.modal__actions {\r\n  display: flex;\r\n  justify-content: flex-end;\r\n  gap: 8px;\r\n  margin-top: 18px;\r\n}\r\n\r\n/*\r\n * Buttons.\r\n *\r\n * `cursor: default` rather than `pointer` throughout the application: this is a\r\n * desktop window, and a hand cursor over a button is a web convention that reads\r\n * as a link here.\r\n */\r\n.modal__button {\r\n  height: 32px;\r\n  padding: 0 14px;\r\n  border: 1px solid var(--color-line);\r\n  border-radius: 8px;\r\n  background: transparent;\r\n  color: var(--color-txt-strong);\r\n  font-family: inherit;\r\n  font-size: var(--text-14);\r\n  cursor: default;\r\n}\r\n\r\n.modal__button:hover {\r\n  background: var(--color-side-hover);\r\n}\r\n\r\n.modal__button[data-variant='primary'] {\r\n  border-color: transparent;\r\n  background: var(--color-button);\r\n  color: #ffffff;\r\n}\r\n\r\n.modal__button[data-variant='primary']:hover {\r\n  background: color-mix(in srgb, var(--color-accent) 88%, #000000);\r\n}\r\n\r\n.modal__button:disabled {\r\n  opacity: 0.45;\r\n}\r\n";

  // host-overrides.css
  var host_overrides_default = "/*\n * The adjustments this host needs, kept apart from the copied stylesheets.\n *\n * ## Why the originals are not edited\n *\n * `Modal/modal.css` and `local-models.css` are the desktop application's own\n * files, moved here verbatim so they stay diffable against their source. An\n * edit inside one would be lost the next time they are re-copied, and would also\n * be invisible to anyone comparing the two trees. What this host needs on top is\n * stated here instead, where the reason is beside it.\n *\n * ## The modal layer\n *\n * The desktop application draws its settings as a *page*: the panel is part of\n * the document, and its own modal at `z-index: 100` is above everything by\n * default. Here the settings are the host's own dialog at `z-index: 1000`, so a\n * panel drawn at 100 opens **behind** the window that opened it \u2014 measured, and\n * it looks like the click did nothing.\n *\n * One more than the host's layer, and no more than that: a number chosen to be\n * the highest would sit above the host's own tooltips and menus, which is how a\n * dialog ends up covering the control it needs the user to press.\n */\n.modal {\n  z-index: 1001;\n}\n\n/*\n * The gateway row: an address line, a key field, and the two buttons beside it.\n *\n * ## Why it reuses `local-models__address`\n *\n * It is the same shape as the line above it \u2014 an icon, a value, a few quiet\n * actions \u2014 and the two sit one above the other, so a second visual treatment\n * would read as a different kind of thing rather than as the other half of the\n * same one. The class carries the frame; only what is different is stated here.\n *\n * ## The field\n *\n * A fixed width rather than `flex: 1`. It holds a key, which is a string of\n * unbroken characters with no useful length to see: a field that grew to the\n * width of the column would put the buttons a screen away from the thing they\n * act on, and a monospace face is what makes a wrong character visible.\n */\n.local-models__gateway {\n  gap: 8px;\n}\n\n.local-models__gateway .local-models__address-label {\n  flex: none;\n  font-size: var(--text-13);\n  font-weight: var(--font-weight-medium);\n  color: var(--color-txt-strong);\n}\n\n.local-models__gateway .local-models__address-input {\n  flex: none;\n  width: 240px;\n  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);\n}\n\n.local-models__gateway .local-models__address-note {\n  min-width: 0;\n  flex: 1 1 auto;\n  font-size: var(--text-13);\n  color: var(--color-mut);\n}\n\n/*\n * The load estimate row.\n *\n * ## Why it is not `.params__presets`\n *\n * It was, and that class is a single horizontal line of short labels \u2014 \u901F\u5EA6 and\n * three buttons. This row carries two sentences and two numbers, and a flex row\n * with `align-items: center` squeezed all four onto one line until they were\n * unreadable. Same position, different content, so it is a different class.\n *\n * ## Why the numbers are on their own line under the label\n *\n * The estimate is the thing the row exists to show, and it changes as the form\n * is edited. Putting it on the label's line would make it compete with the word\n * naming it, and the reader watching for a number to move should not have to\n * find it first.\n *\n * The figures are tabular \u2014 `font-variant-numeric` \u2014 because they are read as a\n * column: three values that change together while a field is edited, and\n * proportional digits make them jitter horizontally on every change.\n */\n.params__estimate {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  padding: 0 0 12px;\n  border-bottom: 1px solid var(--color-line, rgba(0, 0, 0, 0.08));\n  margin-bottom: 12px;\n}\n\n.params__estimate-label {\n  font-size: var(--text-12);\n  font-weight: var(--font-weight-medium);\n  color: var(--color-txt-strong);\n}\n\n.params__estimate-value {\n  font-size: var(--text-13);\n  font-variant-numeric: tabular-nums;\n  color: var(--color-txt, inherit);\n}\n\n.params__estimate-kv {\n  font-size: var(--text-12);\n  color: var(--color-mut);\n}\n\n/*\n * The estimate line, one figure at a time.\n *\n * ## Why the figures are separated rather than joined by a dot\n *\n * They were `\u663E\u5B58 37.2 GB \xB7 \u5185\u5B58 0 KB`, and the second is a real answer \u2014 every\n * layer is on the device, so the host holds nothing but the KV cache's\n * spillover. Read as a sentence it looks like a bug; read as a table it is\n * information. Each figure gets its own label so a zero is a value rather than\n * a broken join.\n *\n * ## Why the KV figure is on its own line\n *\n * It is the one number the form actually controls \u2014 context length and cache\n * type are two of the fields below \u2014 and the one users are surprised by, since\n * at 256K it exceeds the weights. On the same line as the totals it reads as a\n * breakdown of them; on its own line it reads as the reason they are large.\n */\n.params__estimate-figures {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px 16px;\n  font-size: var(--text-13);\n  font-variant-numeric: tabular-nums;\n  color: var(--color-txt, inherit);\n}\n\n.params__estimate-figure {\n  display: inline-flex;\n  align-items: baseline;\n  gap: 6px;\n}\n\n.params__estimate-figure > b {\n  font-weight: var(--font-weight-medium);\n  color: var(--color-txt-strong);\n}\n\n.params__estimate-kv {\n  font-size: var(--text-12);\n  color: var(--color-mut);\n  font-variant-numeric: tabular-nums;\n}\n\n/*\n * The chosen preset.\n *\n * ## Why there is a state to draw at all\n *\n * The copied stylesheet gives `.params__preset` a hover and nothing else, so a\n * preset that has been applied looks exactly like one that has not \u2014 reported as\n * \"these three might not be selectable, or nothing shows which is chosen\". Both\n * readings were reasonable: the button did write its values, and the panel said\n * nothing about it afterwards.\n *\n * ## Why the state is derived rather than remembered\n *\n * A `selected` flag set on click would survive the next edit, and would then be\n * claiming a preset is in force at the moment its values are no longer the ones\n * in the form. Comparing the draft against each preset's values instead makes\n * the highlight mean what a reader assumes it means \u2014 this is the set of values\n * currently in the fields \u2014 and it goes out on its own the moment one of them is\n * changed by hand.\n *\n * The fill is the accent at low alpha rather than the accent itself: the note\n * under these buttons is a sentence in muted grey, and three solid pills would\n * outweigh it. The border carries the weight instead, so the chosen one is\n * unmistakable without becoming the loudest thing in the panel.\n */\n.params__preset[data-active='true'] {\n  color: var(--color-accent);\n  background: color-mix(in srgb, var(--color-accent) 12%, transparent);\n  border-color: var(--color-accent);\n  font-weight: var(--font-weight-medium);\n}\n\n.params__preset[data-active='true']:hover {\n  color: var(--color-accent);\n  background: color-mix(in srgb, var(--color-accent) 20%, transparent);\n  border-color: var(--color-accent);\n}\n\n/*\n * The chosen preset's name, said in words as well as in colour.\n *\n * A border colour alone is the kind of state that is invisible to a reader who\n * cannot separate the two hues, and the three pills differ only by their label.\n * The dot is a second, uncoloured signal: filled for the chosen one, hollow for\n * the rest. It costs a character of width and it is readable in any rendering.\n */\n.params__preset-dot {\n  display: inline-block;\n  width: 6px;\n  height: 6px;\n  margin-right: 6px;\n  vertical-align: middle;\n  border: 1px solid currentColor;\n  border-radius: 50%;\n  opacity: 0.45;\n}\n\n.params__preset[data-active='true'] .params__preset-dot {\n  background: currentColor;\n  opacity: 1;\n}\n\n/*\n * The hub's own adjustments for a panel this narrow.\n *\n * ## The download bar wraps instead of compressing\n *\n * `.hub__dlbar` is a single flex row: the toggle, a note about what the queue is\n * doing, and a pause/start control. In the desktop shell the three fit on one\n * line and it never needed to say what happens when they do not. Here the panel\n * is 607px wide, so a note as long as \"\u5DF2\u6682\u505C \xB7 \u8FD8\u6709 1 \u4E2A\u6587\u4EF6\" pushed the control\n * half off the row and wrapped its own label to two lines \u2014 measured, as the\n * word \u5F00\u59CB stacked vertically beside the button.\n *\n * `flex-wrap` lets the control fall to a second line rather than being squeezed,\n * and `min-width: 0` lets the note shorten instead of holding its intrinsic\n * width. Both are the ordinary fixes for a row that was written for a wider\n * window.\n */\n.hub__dlbar {\n  flex-wrap: wrap;\n  row-gap: 8px;\n}\n\n.hub__dlbar > .hub__dlnote {\n  min-width: 0;\n  flex: 1 1 auto;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n/* The bar's own controls keep their width, so a wrap does not stretch them. */\n.hub__dlbar > .hub__btn {\n  flex: none;\n}\n\n/*\n * The list is full width, not a column inside the bar.\n *\n * It was nested in the bar during the move to the top of the page, which put it\n * in the row's third slot: a 300px box with a name, a repository, a state and\n * two buttons all wrapped inside it. As a sibling it takes the page's width,\n * which is what its grid expects.\n */\n.hub__queue {\n  width: 100%;\n  box-sizing: border-box;\n}\n";

  // live-rate.css
  var live_rate_default = "/*\n * The live rate pill.\n *\n * ## Why it is dressed as the host's own stats pill\n *\n * It sits in the same dock row as the host's `\u26A1 N tok/s \xB7 \u{1F5C4} \u7F13\u5B58\u547D\u4E2D N%`, and\n * two chips side by side are read as one control group. A second visual\n * language \u2014 a different radius, a different colour, a border \u2014 would make this\n * look like it came from somewhere else, which it did, and the row would read\n * as two unrelated things rather than as one line of figures.\n *\n * So the values below are the host's own, mirrored rather than imported: the\n * class names are hashed per-module and cannot be relied on across a version,\n * but the custom properties are part of the theme and are stable.\n */\n\n.live-rate {\n  box-sizing: border-box;\n  max-width: 100%;\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  padding: 1px 8px;\n  border-radius: 999px;\n  font: inherit;\n  font-size: calc(var(--dsh-content-font-size-secondary, 13px) - 1px);\n  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));\n  color: var(--dsw-alias-label-tertiary);\n  /*\n   * Tabular figures, because the number changes twice a second: proportional\n   * digits make the pill's width move with every sample, and a control that\n   * resizes while being watched reads as a fault rather than as a reading.\n   */\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n}\n\n/*\n * The number, one step brighter than its unit.\n *\n * The rate is what the pill is for; `tok/s` is the label on it. Weight rather\n * than size, because two sizes in a chip this small looks like a mistake.\n */\n.live-rate__value {\n  color: var(--dsw-alias-label-secondary);\n  font-weight: var(--font-weight-medium, 500);\n}\n\n.live-rate__unit {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 0.92em;\n}\n\n/*\n * The leading dot, so the pill is findable without reading it.\n *\n * It sits before the number rather than after, and it pulses: a rate that is\n * moving is the one signal that separates \"generating right now\" from \"the\n * last reply's average\", and the two are otherwise the same text.\n */\n.live-rate::before {\n  content: '';\n  width: 6px;\n  height: 6px;\n  flex: none;\n  border-radius: 50%;\n  background: var(--dsw-alias-state-business-primary, #4d6bfe);\n  animation: live-rate-pulse 1.4s ease-in-out infinite;\n}\n\n@keyframes live-rate-pulse {\n  0%,\n  100% {\n    opacity: 1;\n  }\n\n  50% {\n    opacity: 0.35;\n  }\n}\n\n/*\n * Motion is the one signal here that a reader cannot opt out of, so the\n * preference is honoured rather than ignored \u2014 the dot stays, it just stops.\n */\n@media (prefers-reduced-motion: reduce) {\n  .live-rate::before {\n    animation: none;\n  }\n}\n";

  // hub.css
  var hub_default = "/*\r\n * The model hub.\r\n *\r\n * Two columns rather than the single 720px stack the other pages use, and the\r\n * difference is the task: this page is a *choice between two sets at once* \u2014\r\n * which repository, then which file \u2014 and a reader moving back and forth\r\n * between them is the normal case, not an edge one. Stacked, choosing a file\r\n * would scroll its repository off the screen.\r\n *\r\n * The split is not even. The list is a fixed 320px because repository names\r\n * are short and their metadata is two numbers; the detail pane takes the rest,\r\n * because a file table has a name that can be eighty characters long and a size\r\n * that must stay beside it.\r\n */\r\n\r\n.hub {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 16px;\r\n  width: 100%;\r\n  height: 100%;\r\n  min-height: 0;\r\n  padding: 28px 24px 24px;\r\n}\r\n\r\n.hub__head {\r\n  display: flex;\r\n  flex: none;\r\n  align-items: flex-start;\r\n  justify-content: space-between;\r\n  gap: 16px;\r\n}\r\n\r\n.hub__title {\r\n  margin: 0 0 6px;\r\n  font-size: var(--text-18);\r\n  font-weight: var(--font-weight-medium);\r\n  color: var(--color-txt-strong);\r\n}\r\n\r\n.hub__sub {\r\n  margin: 0;\r\n  font-size: var(--text-13);\r\n  line-height: 1.6;\r\n  color: var(--color-mut);\r\n}\r\n\r\n/*\r\n * The hosts are a choice between named alternatives, drawn as the same\r\n * segmented control the model page uses for its sort order \u2014 copied from\r\n * `local-models__sort` line for line, including which tokens it names.\r\n *\r\n * The tokens are the reason this is a copy rather than a recollection: that\r\n * control uses `--color-line`, `--color-muted-foreground` and\r\n * `--color-side-hover`, which read as aliases of `--color-border`,\r\n * `--color-mut` and `--color-auto-action-bg-hover` and resolve to the same\r\n * values today. Writing them from memory gave a control that was *nearly* the\r\n * same, which is what a person notices.\r\n */\r\n.hub__sources {\r\n  display: flex;\r\n  flex: none;\r\n  overflow: hidden;\r\n  border: 1px solid var(--color-line);\r\n  border-radius: 8px;\r\n}\r\n\r\n.hub__source-item {\r\n  height: 28px;\r\n  padding: 0 11px;\r\n  font: inherit;\r\n  font-size: var(--text-12);\r\n  color: var(--color-muted-foreground);\r\n  cursor: pointer;\r\n  background: none;\r\n  border: 0;\r\n  border-right: 1px solid var(--color-line);\r\n}\r\n\r\n.hub__source-item:last-child {\r\n  border-right: 0;\r\n}\r\n\r\n.hub__source-item:hover {\r\n  background: var(--color-side-hover);\r\n}\r\n\r\n.hub__source-item[data-active='true'] {\r\n  color: var(--color-accent);\r\n  background: color-mix(in oklab, var(--color-accent) 10%, transparent);\r\n}\r\n\r\n/*\r\n * The proxy row.\r\n *\r\n * Mixed into a line rather than given a card of its own: it is a prerequisite\r\n * for the page, not a feature of it, and a bordered block would make it read as\r\n * the main thing here. The alternatives sit beside the current value as quiet\r\n * buttons \u2014 the shape a user reaches for when the answer is \"not that one\".\r\n */\r\n.hub__net {\r\n  display: flex;\r\n  flex: none;\r\n  flex-wrap: wrap;\r\n  gap: 8px;\r\n  align-items: center;\r\n  min-height: 28px;\r\n}\r\n\r\n.hub__netlabel {\r\n  font-size: var(--text-12);\r\n  color: var(--color-muted-foreground);\r\n}\r\n\r\n.hub__netinput {\r\n  width: 260px;\r\n  height: 28px;\r\n  padding: 0 10px;\r\n  font: inherit;\r\n  font-size: var(--text-12);\r\n  color: var(--color-txt);\r\n  background: var(--color-bg);\r\n  border: 1px solid var(--color-line);\r\n  border-radius: 6px;\r\n}\r\n\r\n.hub__netinput:focus-visible {\r\n  outline: 2px solid var(--color-accent);\r\n  outline-offset: 1px;\r\n}\r\n\r\n/*\r\n * Truncated from the left, not the right.\r\n *\r\n * A Windows path's meaningful end is its last segments \u2014 `\u2026\\AranLLM\\models`\r\n * says which folder it is; `D:\\APPs\\Ara\u2026` does not. `direction: rtl` clips the\r\n * start while keeping the text and the ellipsis in the right reading order.\r\n */\r\n.hub__rootpath {\r\n  max-width: 420px;\r\n  overflow: hidden;\r\n  font-size: var(--text-12);\r\n  color: var(--color-txt);\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n  direction: rtl;\r\n  text-align: left;\r\n  unicode-bidi: plaintext;\r\n}\r\n\r\n.hub__netprobe {\r\n  font-size: var(--text-12);\r\n  color: var(--color-mut);\r\n}\r\n\r\n.hub__netprobe--bad {\r\n  color: var(--color-chip-rm);\r\n}\r\n\r\n.hub__search {\r\n  display: flex;\r\n  flex: none;\r\n  gap: 8px;\r\n}\r\n\r\n.hub__input {\r\n  flex: 1;\r\n  padding: 9px 12px;\r\n  font: inherit;\r\n  font-size: var(--text-13);\r\n  color: var(--color-txt);\r\n  background: var(--color-bg);\r\n  border: 1px solid var(--color-border);\r\n  border-radius: 8px;\r\n}\r\n\r\n.hub__input:focus-visible {\r\n  outline: 2px solid var(--color-accent);\r\n  outline-offset: 1px;\r\n}\r\n\r\n.hub__btn {\r\n  padding: 8px 14px;\r\n  font: inherit;\r\n  font-size: var(--text-13);\r\n  color: var(--color-txt);\r\n  cursor: pointer;\r\n  background: var(--color-bg);\r\n  border: 1px solid var(--color-btn-border);\r\n  border-radius: 8px;\r\n}\r\n\r\n.hub__btn:hover:not(:disabled) {\r\n  background: var(--color-auto-action-bg-hover);\r\n}\r\n\r\n.hub__btn:disabled {\r\n  cursor: default;\r\n  opacity: 0.5;\r\n}\r\n\r\n.hub__btn--primary {\r\n  color: var(--color-accent-foreground);\r\n  background: var(--color-button);\r\n  border-color: var(--color-accent);\r\n}\r\n\r\n.hub__btn--quiet {\r\n  color: var(--color-mut);\r\n}\r\n\r\n.hub__note {\r\n  margin: 0;\r\n  font-size: var(--text-13);\r\n}\r\n\r\n.hub__note--bad {\r\n  color: var(--color-danger, var(--color-chip-rm));\r\n}\r\n\r\n.hub__body {\r\n  display: grid;\r\n  flex: 1;\r\n  /*\r\n   * The list is elastic between a floor and a ceiling.\r\n   *\r\n   * It was a flat 320px, which is narrower than the row needs: an avatar, a\r\n   * name and three figures do not fit, and the name \u2014 the thing the reader is\r\n   * scanning for \u2014 was the part that ellipsised. A `minmax` gives it room to\r\n   * grow on a wide window and stops the detail pane being squeezed on a narrow\r\n   * one, so the two panes share the shortage instead of the name absorbing it.\r\n   */\r\n  grid-template-columns: minmax(380px, 440px) 1fr;\r\n  gap: 20px;\r\n  min-height: 0;\r\n}\r\n\r\n.hub__list {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n  overflow-y: auto;\r\n  padding-right: 4px;\r\n}\r\n\r\n/*\r\n * A result row, to the reference's own shape.\r\n *\r\n * Its search results are horizontal bands: a square on the left, the name and a\r\n * line of detail in the middle, the figures at the trailing edge. What this was\r\n * \u2014 a vertical card with the name, the meta and the tags stacked \u2014 makes a list\r\n * of forty results a column of blocks, and comparing two of them means reading\r\n * each one down to find the same figure in both.\r\n *\r\n * Colours, radii and sizes are this application's; the *organisation* is what is\r\n * borrowed, which is the part that makes a long list scannable.\r\n */\r\n.hub__repo {\r\n  display: flex;\r\n  gap: 12px;\r\n  align-items: center;\r\n  width: 100%;\r\n  padding: 10px 12px;\r\n  font: inherit;\r\n  text-align: left;\r\n  cursor: pointer;\r\n  background: none;\r\n  border: 0;\r\n  border-radius: 10px;\r\n  transition: background-color 120ms ease;\r\n}\r\n\r\n.hub__repo:hover {\r\n  background: var(--color-side-hover);\r\n}\r\n\r\n/*\r\n * Marked with a left bar rather than only a fill.\r\n *\r\n * The row that is open in the detail pane has to be findable while the reader's\r\n * eye is on the right-hand column, and a fill alone is easy to lose against the\r\n * hover state that follows the pointer. The bar survives a scan down one edge.\r\n */\r\n.hub__repo--on {\r\n  background: var(--color-side-hover);\r\n  box-shadow: inset 2px 0 0 var(--color-accent);\r\n}\r\n\r\n/*\r\n * A monogram where the reference shows a model image.\r\n *\r\n * Forty pixels, which is the size that reads as an avatar rather than as an\r\n * icon \u2014 square with a radius rather than a circle, matching the reference's\r\n * thumbnails rather than an account photo, because what it stands for is a\r\n * repository and not a person.\r\n */\r\n.hub__avatar {\r\n  display: flex;\r\n  flex: none;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: 40px;\r\n  height: 40px;\r\n  font-size: var(--text-15);\r\n  font-weight: var(--font-weight-semibold);\r\n  color: var(--color-txt-strong);\r\n  background: var(--color-side);\r\n  border-radius: 10px;\r\n}\r\n\r\n/*\r\n * Six hues, all muted, all from the token set's own families.\r\n *\r\n * Derived from the publisher rather than chosen per row, so one organisation\r\n * reads as one colour down the list. Kept low-saturation and paired with the\r\n * strong ink: a saturated block here would compete with the name beside it,\r\n * which is the thing being read.\r\n */\r\n.hub__avatar[data-seed='0'] { background: color-mix(in srgb, var(--color-accent) 16%, var(--color-side)); }\r\n.hub__avatar[data-seed='1'] { background: color-mix(in srgb, var(--color-warn) 18%, var(--color-side)); }\r\n.hub__avatar[data-seed='2'] { background: color-mix(in srgb, var(--color-ok) 16%, var(--color-side)); }\r\n.hub__avatar[data-seed='3'] { background: color-mix(in srgb, var(--color-blue) 16%, var(--color-side)); }\r\n.hub__avatar[data-seed='4'] { background: color-mix(in srgb, var(--color-code-inline-fg) 16%, var(--color-side)); }\r\n.hub__avatar[data-seed='5'] { background: var(--color-side); }\r\n\r\n.hub__repobody {\r\n  display: flex;\r\n  flex: 1;\r\n  min-width: 0;\r\n  flex-direction: column;\r\n  gap: 3px;\r\n  /*\r\n   * The whole row's width, now that no figure column competes for it. The name\r\n   * was ellipsised to `Q...` while three numbers sat at the trailing edge; they\r\n   * have moved to the detail header, and the name has the room to itself.\r\n   */\r\n}\r\n\r\n.hub__reponame {\r\n  overflow: hidden;\r\n  font-size: var(--text-13);\r\n  font-weight: var(--font-weight-medium);\r\n  color: var(--color-txt-strong);\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n/* The second line: publisher, the GGUF mark, and a few tags. */\r\n.hub__reposub {\r\n  display: flex;\r\n  gap: 6px;\r\n  align-items: center;\r\n  min-width: 0;\r\n  overflow: hidden;\r\n}\r\n\r\n.hub__repopub {\r\n  flex: none;\r\n  font-size: var(--text-12);\r\n  color: var(--color-muted-foreground);\r\n}\r\n\r\n/*\r\n * The GGUF mark, kept apart from the tag list.\r\n *\r\n * A tag is what the mirror said; this is what this application checked. Mixing\r\n * them would make the one fact a reader filters on indistinguishable from the\r\n * forty that mean nothing here.\r\n */\r\n.hub__gguf {\r\n  flex: none;\r\n  padding: 1px 6px;\r\n  font-size: var(--text-11);\r\n  color: var(--color-ok);\r\n  background: color-mix(in srgb, var(--color-ok) 14%, transparent);\r\n  border-radius: 5px;\r\n}\r\n\r\n/*\r\n * The repository's figures, as chips in the detail header.\r\n *\r\n * Tinted blocks rather than plain text, following the reference: they are read\r\n * as a group \u2014 \"how popular is this\" \u2014 and a block reads as one unit where\r\n * three sets of characters separated by spacing read as three facts.\r\n */\r\n.hub__stats {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 6px;\r\n  align-items: center;\r\n}\r\n\r\n.hub__stat {\r\n  display: inline-flex;\r\n  gap: 4px;\r\n  align-items: center;\r\n  padding: 2px 8px;\r\n  font-size: var(--text-12);\r\n  font-variant-numeric: tabular-nums;\r\n  color: var(--color-txt);\r\n  background: var(--color-side);\r\n  border-radius: 7px;\r\n}\r\n\r\n.hub__statwhen {\r\n  font-size: var(--text-12);\r\n  color: var(--color-muted-foreground);\r\n}\r\n\r\n.hub__tags {\r\n  display: flex;\r\n  flex: none;\r\n  gap: 4px;\r\n  align-items: center;\r\n  overflow: hidden;\r\n}\r\n\r\n.hub__tag {\r\n  flex: none;\r\n  padding: 1px 6px;\r\n  font-size: var(--text-11);\r\n  color: var(--color-muted-foreground);\r\n  white-space: nowrap;\r\n  background: var(--color-side);\r\n  border-radius: 5px;\r\n}\r\n\r\n.hub__tags {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 4px;\r\n}\r\n\r\n.hub__tag {\r\n  padding: 1px 6px;\r\n  font-size: var(--code-11);\r\n  color: var(--color-mut);\r\n  background: var(--color-chip-bg);\r\n  border-radius: 4px;\r\n}\r\n\r\n.hub__detail {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 12px;\r\n  overflow-y: auto;\r\n  min-height: 0;\r\n}\r\n\r\n.hub__detailhead {\r\n  flex: none;\r\n}\r\n\r\n.hub__repotitle {\r\n  margin: 0 0 4px;\r\n  font-size: var(--text-15);\r\n  font-weight: var(--font-weight-medium);\r\n  color: var(--color-txt-strong);\r\n  word-break: break-all;\r\n}\r\n\r\n.hub__table {\r\n  width: 100%;\r\n  font-size: var(--text-13);\r\n  border-collapse: collapse;\r\n}\r\n\r\n/*\r\n * The two narrow columns are given a width and the name column is not.\r\n *\r\n * `hub__path` carries `max-width: 0`, which is the usual way to make a table\r\n * cell stop bidding for space \u2014 but it only works when some *other* cell does\r\n * bid. With all three unset the table laid itself out at its minimum and every\r\n * column came out narrow, which is why a 46 GB shard's name was ellipsised to\r\n * `Qwen3-Coder-3...`.\r\n *\r\n * Two words and a number are bounded; a file name is not, and it is the one\r\n * field a reader has to read in full \u2014 the shard suffix at the end is what\r\n * tells `\u2026-00001-of-00002` from `\u2026-00002-of-00002`.\r\n */\r\n.hub__table th:nth-child(2),\r\n.hub__table td:nth-child(2) {\r\n  width: 96px;\r\n}\r\n\r\n.hub__table th:nth-child(3),\r\n.hub__table td:nth-child(3) {\r\n  width: 104px;\r\n}\r\n\r\n.hub__table th {\r\n  position: sticky;\r\n  top: 0;\r\n  padding: 6px 8px;\r\n  font-size: var(--text-12);\r\n  font-weight: var(--font-weight-medium);\r\n  color: var(--color-mut);\r\n  text-align: left;\r\n  background: var(--color-bg);\r\n  border-bottom: 1px solid var(--color-border);\r\n}\r\n\r\n.hub__table td {\r\n  padding: 7px 8px;\r\n  color: var(--color-txt);\r\n  border-bottom: 1px solid var(--color-border);\r\n}\r\n\r\n/*\r\n * The name column takes what is left rather than being given a width: it is\r\n * the only column whose content varies in length, and the other two are two\r\n * words and a number.\r\n */\r\n.hub__path {\r\n  overflow: hidden;\r\n  width: 100%;\r\n  max-width: 0;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n/*\r\n * A name that still does not fit ends rather than middle-ellipsises.\r\n *\r\n * The tail is the part that distinguishes two shards of one model, and the head\r\n * is the part that says which model \u2014 so the ellipsis has to be at the end, and\r\n * the full name is in the title for the case where even that is not enough.\r\n */\r\n\r\n.hub__size {\r\n  font-variant-numeric: tabular-nums;\r\n  text-align: right;\r\n  white-space: nowrap;\r\n}\r\n\r\n.hub__badge {\r\n  padding: 1px 5px;\r\n  margin-right: 6px;\r\n  font-size: var(--code-11);\r\n  color: var(--color-accent-foreground);\r\n  background: var(--color-accent);\r\n  border-radius: 4px;\r\n}\r\n\r\n.hub__empty {\r\n  margin: 0;\r\n  padding: 16px 0;\r\n  font-size: var(--text-13);\r\n  line-height: 1.6;\r\n  color: var(--color-mut);\r\n}\r\n\r\n.hub__error {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 10px;\r\n  align-items: flex-start;\r\n  padding: 14px 16px;\r\n  background: var(--color-auto-action-bg);\r\n  border: 1px solid var(--color-border);\r\n  border-radius: 10px;\r\n}\r\n\r\n.hub__error p {\r\n  margin: 0;\r\n  font-size: var(--text-13);\r\n  line-height: 1.6;\r\n  color: var(--color-txt);\r\n}\r\n\r\n.hub__more {\r\n  align-self: center;\r\n  margin-top: 8px;\r\n}\r\n\r\n/*\r\n * Below this width the two columns stop fitting and the detail pane becomes\r\n * unusable at roughly the point a file name can no longer be told from its\r\n * neighbour. Stacked, in the order they are used.\r\n */\r\n@media (max-width: 860px) {\r\n  .hub__body {\r\n    grid-template-columns: 1fr;\r\n    grid-template-rows: minmax(140px, 40%) 1fr;\r\n  }\r\n}\r\n\r\n/* \u2500\u2500 Choosing and downloading \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r\n\r\n/*\r\n * The selection bar sits above the table and stays there.\r\n *\r\n * It is the answer to \"what have I picked and how big is it\", which is the\r\n * question a user has while ticking rows further down \u2014 so it must not scroll\r\n * away with them.\r\n */\r\n.hub__bar {\r\n  display: flex;\r\n  flex: none;\r\n  gap: 12px;\r\n  align-items: center;\r\n  padding: 8px 0;\r\n  border-bottom: 1px solid var(--color-border);\r\n}\r\n\r\n.hub__checkall {\r\n  display: flex;\r\n  gap: 6px;\r\n  align-items: center;\r\n  font-size: var(--text-13);\r\n  color: var(--color-txt);\r\n  cursor: pointer;\r\n}\r\n\r\n.hub__pickedinfo {\r\n  flex: 1;\r\n  font-size: var(--text-12);\r\n  color: var(--color-mut);\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\r\n/*\r\n * The checkbox column is sized to its control rather than to a fraction.\r\n * A fixed 32px keeps every row's name starting at the same x, which is what\r\n * makes a long file table scannable.\r\n */\r\n.hub__colpick {\r\n  width: 32px;\r\n  padding-right: 0;\r\n  text-align: center;\r\n}\r\n\r\n.hub__row--on {\r\n  background: var(--color-auto-action-bg);\r\n}\r\n\r\n/* \u2500\u2500 The progress panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r\n\r\n/*\r\n * Pinned to the bottom of the page, outside the scrolling body.\r\n *\r\n * A 46 GB transfer outlives any amount of scrolling, and a progress bar that\r\n * can be scrolled off the screen is one the user has to hunt for at exactly the\r\n * moment they want to check it.\r\n */\r\n.hub__progress {\r\n  display: flex;\r\n  flex: none;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n  padding: 12px 14px;\r\n  background: var(--color-auto-action-bg);\r\n  border: 1px solid var(--color-border);\r\n  border-radius: 10px;\r\n}\r\n\r\n.hub__progress--failed {\r\n  border-color: var(--color-chip-rm);\r\n}\r\n\r\n.hub__progresshead {\r\n  display: flex;\r\n  gap: 12px;\r\n  align-items: baseline;\r\n  justify-content: space-between;\r\n}\r\n\r\n.hub__progressname {\r\n  overflow: hidden;\r\n  font-size: var(--text-13);\r\n  color: var(--color-txt-strong);\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n.hub__progressnum {\r\n  flex: none;\r\n  font-size: var(--text-12);\r\n  color: var(--color-mut);\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\r\n.hub__track {\r\n  height: 6px;\r\n  overflow: hidden;\r\n  background: var(--color-border);\r\n  border-radius: 3px;\r\n}\r\n\r\n.hub__fill {\r\n  height: 100%;\r\n  background: var(--color-accent);\r\n  border-radius: 3px;\r\n  transition: width 200ms linear;\r\n}\r\n\r\n/*\r\n * With no total there is no honest percentage, so the bar sweeps instead of\r\n * filling. A bar sitting at 0% for ten minutes is worse than no bar at all:\r\n * it reads as a stalled download.\r\n */\r\n.hub__fill[data-indeterminate='true'] {\r\n  animation: hub-sweep 1.4s ease-in-out infinite;\r\n  opacity: 0.6;\r\n}\r\n\r\n@keyframes hub-sweep {\r\n  0% {\r\n    transform: translateX(-100%);\r\n  }\r\n  100% {\r\n    transform: translateX(100%);\r\n  }\r\n}\r\n\r\n@media (prefers-reduced-motion: reduce) {\r\n  .hub__fill[data-indeterminate='true'] {\r\n    animation: none;\r\n  }\r\n}\r\n\r\n.hub__progressfoot {\r\n  display: flex;\r\n  gap: 12px;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  font-size: var(--text-12);\r\n  color: var(--color-mut);\r\n}\r\n\r\n/* \u2500\u2500 The queue \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r\n\r\n/*\r\n * Sits above the progress panel and shares its treatment, because the two are\r\n * read together: one says which file, the other says how it is going.\r\n *\r\n * Capped in height and scrolled rather than allowed to grow. Ten queued models\r\n * would otherwise push the file table off the screen, and the table is what the\r\n * user is reading while the queue runs.\r\n */\r\n.hub__queue {\r\n  display: flex;\r\n  flex: none;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n  max-height: 168px;\r\n  padding: 12px 14px;\r\n  overflow-y: auto;\r\n  background: var(--color-auto-action-bg);\r\n  border: 1px solid var(--color-border);\r\n  border-radius: 10px;\r\n}\r\n\r\n.hub__queuehead {\r\n  display: flex;\r\n  gap: 12px;\r\n  align-items: baseline;\r\n  justify-content: space-between;\r\n}\r\n\r\n.hub__queuetitle {\r\n  font-size: var(--text-13);\r\n  color: var(--color-txt-strong);\r\n}\r\n\r\n.hub__queuenum {\r\n  flex: none;\r\n  font-size: var(--text-12);\r\n  color: var(--color-mut);\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\r\n.hub__queuelist {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 2px;\r\n  padding: 0;\r\n  margin: 0;\r\n  list-style: none;\r\n}\r\n\r\n.hub__queueitem {\r\n  display: flex;\r\n  gap: 10px;\r\n  justify-content: space-between;\r\n  overflow: hidden;\r\n  font-size: var(--text-12);\r\n  color: var(--color-mut);\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\n.hub__queueitem--more {\r\n  color: var(--color-muted-foreground);\r\n}\r\n\r\n.hub__queuesize {\r\n  flex: none;\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\r\n/*\r\n * Failures are marked by their text colour alone, not by a background or a\r\n * border. The list is already a quiet grey block, and a coloured row inside it\r\n * would read as a different kind of thing rather than as a note about one line.\r\n */\r\n.hub__queuelist--bad .hub__queueitem {\r\n  color: var(--color-chip-rm);\r\n}\r\n\r\n.hub__queuefoot {\r\n  display: flex;\r\n  gap: 12px;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n}\r\n\r\n.hub__queuenote {\r\n  font-size: var(--text-12);\r\n  line-height: 1.5;\r\n  color: var(--color-mut);\r\n}\r\n\r\n/*\r\n * The move question.\r\n *\r\n * Bordered and set apart rather than inline: nothing changes until one of the\r\n * answers is given, and a block that looked like ordinary page content would\r\n * let a user scroll past the question they are being asked.\r\n */\r\n.hub__move {\r\n  display: flex;\r\n  flex: none;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n  padding: 14px 16px;\r\n  background: var(--color-auto-action-bg);\r\n  border: 1px solid var(--color-line);\r\n  border-radius: 10px;\r\n}\r\n\r\n.hub__move-title {\r\n  margin: 0;\r\n  font-size: var(--text-13);\r\n  color: var(--color-txt-strong);\r\n  word-break: break-all;\r\n}\r\n\r\n.hub__move-body {\r\n  margin: 0;\r\n  font-size: var(--text-13);\r\n  line-height: 1.6;\r\n  color: var(--color-txt);\r\n}\r\n\r\n.hub__move-actions {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 8px;\r\n  align-items: center;\r\n}\r\n\r\n.hub__move-note {\r\n  margin: 0;\r\n  font-size: var(--text-12);\r\n  line-height: 1.6;\r\n  color: var(--color-muted-foreground);\r\n}\r\n\r\n/* \u2500\u2500 The download list entry point \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */\r\n\r\n/*\r\n * A button and, while something runs, the rate beside it.\r\n *\r\n * The count rides on the button rather than sitting in a section of the page:\r\n * the queue is something a user checks and leaves, and the number is the only\r\n * reason to open it. A badge rather than a label because the button's width\r\n * must not change as items finish \u2014 that is the row the eye is on.\r\n */\r\n.hub__dlbar {\r\n  display: flex;\r\n  flex: none;\r\n  gap: 10px;\r\n  align-items: center;\r\n}\r\n\r\n.hub__dlbadge {\r\n  min-width: 18px;\r\n  padding: 0 5px;\r\n  margin-left: 2px;\r\n  font-size: var(--code-11);\r\n  color: var(--color-muted-foreground);\r\n  text-align: center;\r\n  background: var(--color-chip-bg);\r\n  border-radius: 9px;\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\r\n/* A running download is the one case worth an accent. */\r\n.hub__dlbadge--on {\r\n  color: var(--color-accent-foreground);\r\n  background: var(--color-accent);\r\n}\r\n\r\n.hub__dlnote {\r\n  font-size: var(--text-12);\r\n  color: var(--color-muted-foreground);\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\n/*\n * The download list, drawn inline.\n *\n * ## Why it is not a window\n *\n * The desktop application opened this in a window of its own and its button\n * called a bridge method that opened one. This host has a single window, so the\n * call was a no-op and the button did nothing \u2014 reported as \"\u70B9\u51FB\u4E0B\u8F7D\u6E05\u5355\u6CA1\u6709\u53CD\u5E94\".\n * The list is drawn under that button instead, and the styles below are what\n * makes it read as attached to it rather than as a separate panel: the same\n * surface, one row narrower, and no shadow of its own.\n *\n * ## Why every row states its own condition\n *\n * A queue here can hold entries that are pending, running, failed or done, and\n * \u2014 unlike the desktop's \u2014 entries that are paused. Four states that differ only\n * by a word are hard to scan, so each carries a dot as well: a colour difference\n * a reader can take in without reading, and one that survives a monochrome\n * rendering where colour alone would not.\n */\n.hub__queue {\n  flex: none;\n  max-height: 320px;\n  overflow-y: auto;\n  margin-top: 8px;\n  border: 1px solid var(--color-line);\n  border-radius: 10px;\n  background: var(--color-side);\n}\n\n.hub__queuehead {\n  position: sticky;\n  top: 0;\n  z-index: 1;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 10px 12px;\n  border-bottom: 1px solid var(--color-line);\n  background: var(--color-side);\n}\n\n.hub__queuetitle {\n  font-size: var(--text-13);\n  font-weight: var(--font-weight-medium);\n  color: var(--color-txt-strong);\n}\n\n.hub__queueactions {\n  display: flex;\n  gap: 6px;\n}\n\n.hub__queueempty {\n  margin: 0;\n  padding: 14px 12px;\n  font-size: var(--text-13);\n  color: var(--color-mut);\n}\n\n.hub__queuelist {\n  display: flex;\n  flex-direction: column;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.hub__queueitem {\n  display: grid;\n  /* dot \xB7 name \xB7 state \xB7 size \xB7 actions */\n  grid-template-columns: 8px minmax(0, 1fr) auto auto auto;\n  align-items: center;\n  gap: 10px;\n  padding: 8px 12px;\n  border-bottom: 1px solid var(--color-line);\n}\n\n.hub__queueitem:last-child {\n  border-bottom: none;\n}\n\n/*\n * The dot's colour is the row's state, and the three tones are the ones the rest\n * of the page already uses: accent for work in progress, muted for waiting,\n * error for a failure, and a dimmed accent for a finished transfer.\n */\n.hub__queuedot {\n  width: 8px;\n  height: 8px;\n  border-radius: 50%;\n  background: var(--color-mut);\n}\n\n.hub__queueitem[data-state='active'] .hub__queuedot {\n  background: var(--color-accent);\n}\n\n.hub__queueitem[data-state='done'] .hub__queuedot {\n  background: color-mix(in srgb, var(--color-accent) 45%, transparent);\n}\n\n.hub__queueitem[data-state='failed'] .hub__queuedot {\n  background: var(--color-error, #d4380d);\n}\n\n.hub__queuename {\n  display: flex;\n  flex-direction: column;\n  min-width: 0;\n  font-size: var(--text-13);\n  color: var(--color-txt);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.hub__queuerepo {\n  font-size: var(--text-11);\n  color: var(--color-mut);\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.hub__queuestate,\n.hub__queuesize {\n  font-size: var(--text-12);\n  color: var(--color-mut);\n  white-space: nowrap;\n}\n\n.hub__queueitem[data-state='failed'] .hub__queuestate {\n  color: var(--color-error, #d4380d);\n}\n\n.hub__queueops {\n  display: flex;\n  gap: 4px;\n}\n";

  // shim/react.js
  var real = globalThis.__aranllmUI?.react;
  if (real === void 0) {
    throw new Error("aranllm-local: the bundle ran before React was installed");
  }
  var {
    useState,
    useEffect,
    useMemo,
    useRef,
    useCallback,
    useReducer,
    useLayoutEffect,
    useContext,
    createContext,
    forwardRef,
    memo,
    Fragment,
    createElement,
    cloneElement,
    Children,
    isValidElement
  } = real;

  // shim/jsx-runtime.js
  var real2 = globalThis.__aranllmUI?.jsxRuntime;
  if (real2 === void 0) {
    throw new Error("aranllm-local: the bundle ran before the JSX runtime was installed");
  }
  var { jsx, jsxs, Fragment: Fragment2 } = real2;

  // Icon/Icon.tsx
  var OPTICAL_SCALE = {
    // The sidebar's four destinations. `archive` is the reference: it is the only
    // filled glyph of the four and therefore the one the others are read against.
    providers: 1.16,
    //主体 11.25 单位，与 archive 的 16.83 相比明显偏轻
    server: 1.1,
    // 实心但只占 14.71 单位，且右边界到 16.14 而非 18.42，本身画偏
    "bubble-5": 1.05,
    // 单线描边，比实心块轻
    // The sidebar's brand row, beside the three-dot and search controls.
    "magnifying-glass": 1.12,
    /*
     * The plugin card's action pair. `ellipsis` is ink spanning 14.2 units in
     * three separate dots, so it reads lighter than its span suggests — the gaps
     * are most of what the eye measures. `circle-x` beside it is a filled disc at
     * 16.67 and needs nothing.
     */
    ellipsis: 1.1,
    /*
     * The composer's round buttons, where `archive` now sits beside `stop`.
     *
     * Measured: `stop` is a 10×10 rect and `archive` spans 16.83 units — 65% of
     * it — so on identical 30px discs the stop button read as a smaller shape on
     * a larger field, which is what "the backgrounds are different sizes"
     * describes. The discs were always the same; the glyphs inside were not.
     *
     * 1.2 and not the 1.53 the bounding boxes give. The two shapes fail that
     * measure in opposite directions: a filled square's ink *is* its box, while
     * `archive` is an outline around mostly empty space, so comparing boxes
     * overstates the difference. Matching ink area is closer to 1.2, and past
     * that the square starts to look heavier than its neighbour rather than
     * equal to it — the correction overshoots into its own kind of wrong.
     */
    stop: 1.2,
    /*
     * `arrow-up` beside them both. A thin single-stroke arrow at 12.9 units, so
     * it reads lighter than either — enlarged toward the same weight, and kept
     * below the filled shapes because a stroke at their scale looks swollen.
     */
    "arrow-up": 1.15,
    /*
     * `zip` beside them, and enlarged past both.
     *
     * It is an outline like `folder`, but a partly hollow one: the fastener bars
     * occupy the middle and the top and bottom thirds are empty, so its ink is
     * much less than its 15.83-unit span suggests. Without this it read as the
     * lightest of the three circles, which is backwards — it is the control with
     * the largest consequence.
     */
    zip: 1.18
  };
  var ICONS = {
    /*
     * A zip archive: a filled file outline with a fastener down the middle.
     *
     * Drawn rather than reused. `archive` is a box with a band across it — the
     * shape for "stored away", a filing cabinet rather than compression — and
     * beside a row of round buttons a banded box reads as a box. The distinction
     * only exists if the glyph carries the fastener.
     *
     * Four bars in the centre channel. Alternating teeth would be a more literal
     * zip, and at 16px they blur into a solid strip: four equal bars at this
     * spacing stay separate, and separation is the whole recognition. The channel
     * is narrow — 8.5 to 11.5 — so the bars read as sitting *in* the file rather
     * than across it.
     *
     * Stroke geometry matches `folder`: 2.083 to 17.917 across and 2.917 to
     * 17.083 down, so a scaled copy stays inside the 20-unit viewBox rather than
     * clipping at its edge.
     */
    zip: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M2.083 2.917H17.917V17.083H2.083V2.917Z",
            stroke: "currentColor",
            strokeWidth: "1.25",
            strokeLinecap: "square"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M8.5 6.25H11.5M8.5 8.583H11.5M8.5 10.917H11.5M8.5 13.25H11.5",
            stroke: "currentColor",
            strokeWidth: "1.25",
            strokeLinecap: "square"
          }
        )
      ] })
    },
    "align-right": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M12.292 6.04167L16.2503 9.99998L12.292 13.9583M2.91699 9.99998H15.6253M17.0837 3.75V16.25", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "arrow-up": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M9.99991 2.24121L16.0921 8.33343L15.2083 9.21731L10.6249 4.63397V17.5001H9.37492V4.63398L4.7916 9.21731L3.90771 8.33343L9.99991 2.24121Z", fill: "currentColor" }) })
    },
    "arrow-left": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M8.33464 4.58398L2.91797 10.0007L8.33464 15.4173M3.33464 10.0007H17.0846", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "arrow-right": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M11.6654 4.58398L17.082 10.0007L11.6654 15.4173M16.6654 10.0007H2.91536", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    archive: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M16.8747 6.24935H17.3747V5.74935H16.8747V6.24935ZM16.8747 16.8743V17.3743H17.3747V16.8743H16.8747ZM3.12467 16.8743H2.62467V17.3743H3.12467V16.8743ZM3.12467 6.24935V5.74935H2.62467V6.24935H3.12467ZM2.08301 2.91602V2.41602H1.58301V2.91602H2.08301ZM17.9163 2.91602H18.4163V2.41602H17.9163V2.91602ZM17.9163 6.24935V6.74935H18.4163V6.24935H17.9163ZM2.08301 6.24935H1.58301V6.74935H2.08301V6.24935ZM8.33301 9.08268H7.83301V10.0827H8.33301V9.58268V9.08268ZM11.6663 10.0827H12.1663V9.08268H11.6663V9.58268V10.0827ZM16.8747 6.24935H16.3747V16.8743H16.8747H17.3747V6.24935H16.8747ZM16.8747 16.8743V16.3743H3.12467V16.8743V17.3743H16.8747V16.8743ZM3.12467 16.8743H3.62467V6.24935H3.12467H2.62467V16.8743H3.12467ZM3.12467 6.24935V6.74935H16.8747V6.24935V5.74935H3.12467V6.24935ZM2.08301 2.91602V3.41602H17.9163V2.91602V2.41602H2.08301V2.91602ZM17.9163 2.91602H17.4163V6.24935H17.9163H18.4163V2.91602H17.9163ZM17.9163 6.24935V5.74935H2.08301V6.24935V6.74935H17.9163V6.24935ZM2.08301 6.24935H2.58301V2.91602H2.08301H1.58301V6.24935H2.08301ZM8.33301 9.58268V10.0827H11.6663V9.58268V9.08268H8.33301V9.58268Z", fill: "currentColor" }) })
    },
    "bubble-5": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M18.3327 9.99935C18.3327 5.57227 15.0919 2.91602 9.99935 2.91602C4.90676 2.91602 1.66602 5.57227 1.66602 9.99935C1.66602 11.1487 2.45505 13.1006 2.57637 13.3939C2.58707 13.4197 2.59766 13.4434 2.60729 13.4697C2.69121 13.6987 3.04209 14.9354 1.66602 16.7674C3.51787 17.6528 5.48453 16.1973 5.48453 16.1973C6.84518 16.9193 8.46417 17.0827 9.99935 17.0827C15.0919 17.0827 18.3327 14.4264 18.3327 9.99935Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    prompt: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M14.5841 12.0807H17.9193V2.91406H5.6276V6.2474M14.5859 6.2474H2.08594V15.4141H5.0026V17.4974L8.7526 15.4141H14.5859V6.2474Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    brain: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M13.332 8.7487C11.4911 8.7487 9.9987 7.25631 9.9987 5.41536M6.66536 11.2487C8.50631 11.2487 9.9987 12.7411 9.9987 14.582M9.9987 2.78209L9.9987 17.0658M16.004 15.0475C17.1255 14.5876 17.9154 13.4849 17.9154 12.1978C17.9154 11.3363 17.5615 10.5575 16.9913 9.9987C17.5615 9.43991 17.9154 8.66108 17.9154 7.79962C17.9154 6.21199 16.7136 4.90504 15.1702 4.73878C14.7858 3.21216 13.4039 2.08203 11.758 2.08203C11.1171 2.08203 10.5162 2.25337 9.9987 2.55275C9.48117 2.25337 8.88032 2.08203 8.23944 2.08203C6.59353 2.08203 5.21157 3.21216 4.82722 4.73878C3.28377 4.90504 2.08203 6.21199 2.08203 7.79962C2.08203 8.66108 2.43585 9.43991 3.00609 9.9987C2.43585 10.5575 2.08203 11.3363 2.08203 12.1978C2.08203 13.4849 2.87191 14.5876 3.99339 15.0475C4.46688 16.7033 5.9917 17.9154 7.79962 17.9154C8.61335 17.9154 9.36972 17.6698 9.9987 17.2488C10.6277 17.6698 11.384 17.9154 12.1978 17.9154C14.0057 17.9154 15.5305 16.7033 16.004 15.0475Z", stroke: "currentColor" }) })
    },
    fork: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.91602 7.91406L2.91602 2.91406H7.91602M12.0827 2.91406H17.0827L17.0827 7.91406M9.99935 9.9974L9.99935 17.0807M9.99935 9.9974L3.33268 3.33073M9.99935 9.9974L16.666 3.33073", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "bullet-list": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M9.58329 13.7497H17.0833M9.58329 6.24967H17.0833M6.24996 6.24967C6.24996 7.17015 5.50377 7.91634 4.58329 7.91634C3.66282 7.91634 2.91663 7.17015 2.91663 6.24967C2.91663 5.3292 3.66282 4.58301 4.58329 4.58301C5.50377 4.58301 6.24996 5.3292 6.24996 6.24967ZM6.24996 13.7497C6.24996 14.6701 5.50377 15.4163 4.58329 15.4163C3.66282 15.4163 2.91663 14.6701 2.91663 13.7497C2.91663 12.8292 3.66282 12.083 4.58329 12.083C5.50377 12.083 6.24996 12.8292 6.24996 13.7497Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "check-small": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M6.5 11.4412L8.97059 13.5L13.5 6.5", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "chevron-down": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M6.6665 8.33325L9.99984 11.6666L13.3332 8.33325", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "chevron-left": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M12 15L7 10L12 5", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "chevron-right": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M8 15L13 10L8 5", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "chevron-grabber-vertical": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M6.66675 12.4998L10.0001 15.8332L13.3334 12.4998M6.66675 7.49984L10.0001 4.1665L13.3334 7.49984", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "chevron-double-right": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M11.6654 13.3346L14.9987 10.0013L11.6654 6.66797M5.83203 13.3346L9.16536 10.0013L5.83203 6.66797", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    /*
     * Three dots, for "more actions on this row".
     *
     * Filled rather than stroked because at 20px a 1px outlined circle is a
     * smudge, and this glyph is read at a smaller size than most — it sits beside
     * two other buttons at the end of a dense row. The radius is 1.1 units rather
     * than a round 1 so the dots keep a visible gap once the optical scale below
     * is applied.
     */
    ellipsis: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("circle", { cx: "4", cy: "10", r: "1.1", fill: "currentColor" }),
        /* @__PURE__ */ jsx("circle", { cx: "10", cy: "10", r: "1.1", fill: "currentColor" }),
        /* @__PURE__ */ jsx("circle", { cx: "16", cy: "10", r: "1.1", fill: "currentColor" })
      ] })
    },
    "circle-x": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M1.6665 10.0003C1.6665 5.39795 5.39746 1.66699 9.99984 1.66699C14.6022 1.66699 18.3332 5.39795 18.3332 10.0003C18.3332 14.6027 14.6022 18.3337 9.99984 18.3337C5.39746 18.3337 1.6665 14.6027 1.6665 10.0003ZM7.49984 6.91107L6.91058 7.50033L9.41058 10.0003L6.91058 12.5003L7.49984 13.0896L9.99984 10.5896L12.4998 13.0896L13.0891 12.5003L10.5891 10.0003L13.0891 7.50033L12.4998 6.91107L9.99984 9.41107L7.49984 6.91107Z", fill: "currentColor" }) })
    },
    close: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M3.75 3.75L16.25 16.25M16.25 3.75L3.75 16.25", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "close-small": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M6 6L14 14M14 6L6 14", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    checklist: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M9.58342 13.7498H17.0834M9.58342 6.24984H17.0834M2.91675 6.6665L4.58341 7.9165L7.08341 4.1665M2.91675 14.1665L4.58341 15.4165L7.08341 11.6665", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    console: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M3.75 5.4165L8.33333 9.99984L3.75 14.5832M10.4167 14.5832H16.25", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    terminal: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M6.5 8L8.64286 10L6.5 12M10.9286 12H13.5M2 18H18V2H2V18Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "terminal-active": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M2 18H18V2H2V18Z", fill: "currentColor", fillOpacity: "0.1" }),
        /* @__PURE__ */ jsx("path", { d: "M6.5 8L8.64286 10L6.5 12M10.9286 12H13.5M2 18H18V2H2V18Z", stroke: "currentColor", strokeLinecap: "square" })
      ] })
    },
    review: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M7 14.5H13M7 7.99512H10.0049M10.0049 7.99512H13M10.0049 7.99512V5M10.0049 7.99512V11M18 18V2L2 2L2 18H18Z", stroke: "currentColor" }) })
    },
    "review-active": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M18 18V2L2 2L2 18H18Z", fill: "currentColor", fillOpacity: "0.1" }),
        /* @__PURE__ */ jsx("path", { d: "M7 14.5H13M7 7.99512H10.0049M10.0049 7.99512H13M10.0049 7.99512V5M10.0049 7.99512V11M18 18V2L2 2L2 18H18Z", stroke: "currentColor" })
      ] })
    },
    expand: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M4.58301 10.4163V15.4163H9.58301M10.4163 4.58301H15.4163V9.58301", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    collapse: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M16.666 8.33398H11.666V3.33398", stroke: "currentColor", strokeLinecap: "square" }),
        /* @__PURE__ */ jsx("path", { d: "M8.33398 16.666V11.666H3.33398", stroke: "currentColor", strokeLinecap: "square" })
      ] })
    },
    code: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M8.7513 7.5013L6.2513 10.0013L8.7513 12.5013M11.2513 7.5013L13.7513 10.0013L11.2513 12.5013M2.91797 2.91797H17.0846V17.0846H2.91797V2.91797Z", stroke: "currentColor" }) })
    },
    "code-lines": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.08325 3.75H11.2499M14.5833 3.75H17.9166M2.08325 10L7.08325 10M10.4166 10L17.9166 10M2.08325 16.25L8.74992 16.25M12.0833 16.25L17.9166 16.25", stroke: "currentColor", strokeLinecap: "square", strokeLinejoin: "round" }) })
    },
    "circle-ban-sign": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M15.3675 4.63087L4.55742 15.441M17.9163 9.9987C17.9163 14.371 14.3719 17.9154 9.99967 17.9154C7.81355 17.9154 5.83438 17.0293 4.40175 15.5966C2.96911 14.164 2.08301 12.1848 2.08301 9.9987C2.08301 5.62644 5.62742 2.08203 9.99967 2.08203C12.1858 2.08203 14.165 2.96813 15.5976 4.40077C17.0302 5.8334 17.9163 7.81257 17.9163 9.9987Z", stroke: "currentColor", strokeLinecap: "round" }) })
    },
    "edit-small-2": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M17.0834 17.0833V17.5833H17.5834V17.0833H17.0834ZM2.91675 17.0833H2.41675V17.5833H2.91675V17.0833ZM2.91675 2.91659V2.41659H2.41675V2.91659H2.91675ZM9.58341 3.41659H10.0834V2.41659H9.58341V2.91659V3.41659ZM17.5834 10.4166V9.91659H16.5834V10.4166H17.0834H17.5834ZM10.4167 7.08325L10.0632 6.7297L9.91675 6.87615V7.08325H10.4167ZM10.4167 9.58325H9.91675V10.0833H10.4167V9.58325ZM12.9167 9.58325V10.0833H13.1239L13.2703 9.93681L12.9167 9.58325ZM15.4167 2.08325L15.7703 1.7297L15.4167 1.37615L15.0632 1.7297L15.4167 2.08325ZM17.9167 4.58325L18.2703 4.93681L18.6239 4.58325L18.2703 4.2297L17.9167 4.58325ZM17.0834 17.0833V16.5833H2.91675V17.0833V17.5833H17.0834V17.0833ZM2.91675 17.0833H3.41675V2.91659H2.91675H2.41675V17.0833H2.91675ZM2.91675 2.91659V3.41659H9.58341V2.91659V2.41659H2.91675V2.91659ZM17.0834 10.4166H16.5834V17.0833H17.0834H17.5834V10.4166H17.0834ZM10.4167 7.08325H9.91675V9.58325H10.4167H10.9167V7.08325H10.4167ZM10.4167 9.58325V10.0833H12.9167V9.58325V9.08325H10.4167V9.58325ZM10.4167 7.08325L10.7703 7.43681L15.7703 2.43681L15.4167 2.08325L15.0632 1.7297L10.0632 6.7297L10.4167 7.08325ZM15.4167 2.08325L15.0632 2.43681L17.5632 4.93681L17.9167 4.58325L18.2703 4.2297L15.7703 1.7297L15.4167 2.08325ZM17.9167 4.58325L17.5632 4.2297L12.5632 9.2297L12.9167 9.58325L13.2703 9.93681L18.2703 4.93681L17.9167 4.58325Z", fill: "currentColor" }) })
    },
    eye: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M10 4.58325C5.83333 4.58325 2.5 9.99992 2.5 9.99992C2.5 9.99992 5.83333 15.4166 10 15.4166C14.1667 15.4166 17.5 9.99992 17.5 9.99992C17.5 9.99992 14.1667 4.58325 10 4.58325Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" }),
        /* @__PURE__ */ jsx("circle", { cx: "10", cy: "10", r: "2.5", stroke: "currentColor" })
      ] })
    },
    /*
     * The struck-through eye, for a field whose contents are visible.
     *
     * A second icon rather than a highlight on the first, because the question
     * this button answers is "is the text on screen readable right now" — and
     * that has to be known *before* pressing it, since pressing it is what
     * changes the answer. A colour swap leaves the user reading a modifier to
     * work out what they are about to reveal; the slash says it outright.
     *
     * The eyeball and its outline are the same two paths as `eye` above, so the
     * two never drift apart; only the slash is added, running corner to corner
     * on the same 20×20 grid.
     */
    "eye-off": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M10 4.58325C5.83333 4.58325 2.5 9.99992 2.5 9.99992C2.5 9.99992 5.83333 15.4166 10 15.4166C14.1667 15.4166 17.5 9.99992 17.5 9.99992C17.5 9.99992 14.1667 4.58325 10 4.58325Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" }),
        /* @__PURE__ */ jsx("circle", { cx: "10", cy: "10", r: "2.5", stroke: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M3.33325 3.33325L16.6666 16.6666", stroke: "currentColor", strokeLinecap: "round" })
      ] })
    },
    enter: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M5.83333 15.8334L2.5 12.5L5.83333 9.16671M3.33333 12.5H17.9167V4.58337H10", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    folder: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.08301 2.91675V16.2501H17.9163V5.41675H9.99967L8.33301 2.91675H2.08301Z", stroke: "currentColor", strokeLinecap: "round" }) })
    },
    "file-tree": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M18 18V5H9.5L7.5 2H2L2 18H5M18 18H5M18 18V8.5H5V18", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "file-tree-active": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M2 2L2 18H5L6.5 8.5H18V5H9.5L7.5 2H2Z", fill: "currentColor", fillOpacity: "0.1" }),
        /* @__PURE__ */ jsx("path", { d: "M5 18H18L19.5 8.5H18M5 18H2L2 2H7.5L9.5 5H18V8.5M5 18L6.5 8.5H18", stroke: "currentColor", strokeLinecap: "square" })
      ] })
    },
    /*
     * The one icon drawn on a 16x16 canvas instead of 20x20. Declaring it here
     * rather than scaling it to fit keeps its stroke the same visual weight as the
     * rest of the set — a 16-unit drawing stretched into a 20-unit box would have
     * thinner lines than all of its neighbours.
     */
    "magnifying-glass": {
      viewBox: "0 0 16 16",
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M13 13L10.6418 10.6418M11.9552 7.47761C11.9552 9.95053 9.95053 11.9552 7.47761 11.9552C5.0047 11.9552 3 9.95053 3 7.47761C3 5.0047 5.0047 3 7.47761 3C9.95053 3 11.9552 5.0047 11.9552 7.47761Z", stroke: "currentColor", strokeLinecap: "square", vectorEffect: "non-scaling-stroke" }) })
    },
    "plus-small": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M9.99984 5.41699V10.0003M9.99984 10.0003V14.5837M9.99984 10.0003H5.4165M9.99984 10.0003H14.5832", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    plus: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M9.9987 2.20703V9.9987M9.9987 9.9987V17.7904M9.9987 9.9987H2.20703M9.9987 9.9987H17.7904", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "new-session": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M12 2H2V18H18V8M6 11.3818V14H8.61818L18 4.61818L15.3818 2L6 11.3818Z", stroke: "currentColor" }) })
    },
    "new-session-active": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M6 11.3818V14H8.61818L18 4.61818L15.3818 2L6 11.3818Z", fill: "currentColor", fillOpacity: "0.1" }),
        /* @__PURE__ */ jsx("path", { d: "M12 2H2V18H18V8M6 11.3818V14H8.61818L18 4.61818L15.3818 2L6 11.3818Z", stroke: "currentColor" })
      ] })
    },
    "pencil-line": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M9.58301 17.9166H17.9163M17.9163 5.83325L14.1663 2.08325L2.08301 14.1666V17.9166H5.83301L17.9163 5.83325Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    mcp: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("path", { d: "M0.972656 9.37176L9.5214 1.60019C10.7018 0.527151 12.6155 0.527151 13.7957 1.60019C14.9761 2.67321 14.9761 4.41295 13.7957 5.48599L7.3397 11.3552", stroke: "currentColor", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("path", { d: "M7.42871 11.2747L13.7957 5.48643C14.9761 4.41338 16.8898 4.41338 18.0702 5.48643L18.1147 5.52688C19.2951 6.59993 19.2951 8.33966 18.1147 9.4127L10.3831 16.4414C9.98966 16.7991 9.98966 17.379 10.3831 17.7366L11.9707 19.1799", stroke: "currentColor", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("path", { d: "M11.6587 3.54346L5.33619 9.29119C4.15584 10.3642 4.15584 12.1039 5.33619 13.177C6.51649 14.25 8.43019 14.25 9.61054 13.177L15.9331 7.42923", stroke: "currentColor", strokeLinecap: "round" })
      ] }) })
    },
    glasses: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M0.416626 7.91667H1.66663M19.5833 7.91667H18.3333M11.866 7.57987C11.3165 7.26398 10.6793 7.08333 9.99996 7.08333C9.32061 7.08333 8.68344 7.26398 8.13389 7.57987M8.74996 10C8.74996 12.0711 7.07103 13.75 4.99996 13.75C2.92889 13.75 1.24996 12.0711 1.24996 10C1.24996 7.92893 2.92889 6.25 4.99996 6.25C7.07103 6.25 8.74996 7.92893 8.74996 10ZM18.75 10C18.75 12.0711 17.071 13.75 15 13.75C12.9289 13.75 11.25 12.0711 11.25 10C11.25 7.92893 12.9289 6.25 15 6.25C17.071 6.25 18.75 7.92893 18.75 10Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "magnifying-glass-menu": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.08325 10.0002H4.58325M2.08325 5.41683H5.41659M2.08325 14.5835H5.41659M16.4583 13.9585L18.7499 16.2502M17.9166 10.0002C17.9166 12.9917 15.4915 15.4168 12.4999 15.4168C9.50838 15.4168 7.08325 12.9917 7.08325 10.0002C7.08325 7.00862 9.50838 4.5835 12.4999 4.5835C15.4915 4.5835 17.9166 7.00862 17.9166 10.0002Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "window-cursor": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M17.9166 10.4167V3.75H2.08325V17.0833H10.4166M17.9166 13.5897L11.6666 11.6667L13.5897 17.9167L15.032 15.0321L17.9166 13.5897Z", stroke: "currentColor", strokeWidth: "1.07143", strokeLinecap: "square" }),
        /* @__PURE__ */ jsx("path", { d: "M5.00024 6.125C5.29925 6.12518 5.54126 6.36795 5.54126 6.66699C5.54108 6.96589 5.29914 7.20783 5.00024 7.20801C4.7012 7.20801 4.45843 6.966 4.45825 6.66699C4.45825 6.36784 4.70109 6.125 5.00024 6.125ZM7.91626 6.125C8.21541 6.125 8.45825 6.36784 8.45825 6.66699C8.45808 6.966 8.21531 7.20801 7.91626 7.20801C7.61736 7.20783 7.37542 6.96589 7.37524 6.66699C7.37524 6.36795 7.61726 6.12518 7.91626 6.125ZM10.8333 6.125C11.1324 6.125 11.3752 6.36784 11.3752 6.66699C11.3751 6.966 11.1323 7.20801 10.8333 7.20801C10.5342 7.20801 10.2914 6.966 10.2913 6.66699C10.2913 6.36784 10.5341 6.125 10.8333 6.125Z", fill: "currentColor", stroke: "currentColor", strokeWidth: "0.25", strokeLinecap: "square" })
      ] })
    },
    task: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M9.99992 2.0835V17.9168M7.08325 3.75016H2.08325V16.2502H7.08325M12.9166 16.2502H17.9166V3.75016H12.9166", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    stop: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("rect", { x: "5", y: "5", width: "10", height: "10", fill: "currentColor" }) })
    },
    /*
     * Two bars for pause, against `stop`'s filled square.
     *
     * The pair has to be distinguishable at 16px in a shape that carries no colour
     * difference, and one bar versus two is a distinction the eye makes by
     * counting rather than by measuring — which is the only kind that survives this
     * small. Drawn with the same 10-unit ink as `stop` so neither reads as the
     * lighter control.
     */
    pause: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("rect", { x: "4.5", y: "4.5", width: "4", height: "11", fill: "currentColor" }),
        /* @__PURE__ */ jsx("rect", { x: "11.5", y: "4.5", width: "4", height: "11", fill: "currentColor" })
      ] })
    },
    /*
     * Compressing, as arrows converging on a centre line.
     *
     * A summarising turn makes the transcript shorter, and the glyph says that
     * rather than naming the mechanism: two brackets pressing inward read as "make
     * this smaller" at any size, where a stack of lines or a document would read as
     * "file". The centre line is what makes the direction legible — without it the
     * brackets are just punctuation.
     */
    shrink: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M3.75 10H16.25", stroke: "currentColor", strokeLinecap: "square" }),
        /* @__PURE__ */ jsx("path", { d: "M7.08301 6.25L3.74967 10L7.08301 13.75", stroke: "currentColor", strokeLinecap: "square" }),
        /* @__PURE__ */ jsx("path", { d: "M12.917 6.25L16.2503 10L12.917 13.75", stroke: "currentColor", strokeLinecap: "square" })
      ] })
    },
    status: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2 10V18H18V10M2 10V2H18V10M2 10H18M5 6H9M5 14H9", stroke: "currentColor" }) })
    },
    "status-active": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M18 2H2V10H18V2Z", fill: "currentColor", fillOpacity: "0.1" }),
        /* @__PURE__ */ jsx("path", { d: "M2 18H18V10H2V18Z", fill: "currentColor", fillOpacity: "0.1" }),
        /* @__PURE__ */ jsx("path", { d: "M2 10V18H18V10M2 10V2H18V10M2 10H18M5 6H9M5 14H9", stroke: "currentColor" })
      ] })
    },
    sidebar: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M7.86667 2H5.2H2V18H5.2H7.86667M7.86667 2H18V18H7.86667M7.86667 2V18", stroke: "currentColor" }) })
    },
    "sidebar-active": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M2 2V18H5.2H7.86667V2H5.2H2Z", fill: "currentColor", fillOpacity: "0.1" }),
        /* @__PURE__ */ jsx("path", { d: "M7.86667 2H5.2H2V18H5.2H7.86667M7.86667 2H18V18H7.86667M7.86667 2V18", stroke: "currentColor" })
      ] })
    },
    "layout-left": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.91675 2.91699L2.91675 2.41699L2.41675 2.41699L2.41675 2.91699L2.91675 2.91699ZM17.0834 2.91699L17.5834 2.91699L17.5834 2.41699L17.0834 2.41699L17.0834 2.91699ZM17.0834 17.0837L17.0834 17.5837L17.5834 17.5837L17.5834 17.0837L17.0834 17.0837ZM2.91675 17.0837L2.41675 17.0837L2.41675 17.5837L2.91675 17.5837L2.91675 17.0837ZM7.41674 17.0837L7.41674 17.5837L8.41674 17.5837L8.41674 17.0837L7.91674 17.0837L7.41674 17.0837ZM8.41674 2.91699L8.41674 2.41699L7.41674 2.41699L7.41674 2.91699L7.91674 2.91699L8.41674 2.91699ZM2.91675 2.91699L2.91675 3.41699L17.0834 3.41699L17.0834 2.91699L17.0834 2.41699L2.91675 2.41699L2.91675 2.91699ZM17.0834 2.91699L16.5834 2.91699L16.5834 17.0837L17.0834 17.0837L17.5834 17.0837L17.5834 2.91699L17.0834 2.91699ZM17.0834 17.0837L17.0834 16.5837L2.91675 16.5837L2.91675 17.0837L2.91675 17.5837L17.0834 17.5837L17.0834 17.0837ZM2.91675 17.0837L3.41675 17.0837L3.41675 2.91699L2.91675 2.91699L2.41675 2.91699L2.41675 17.0837L2.91675 17.0837ZM7.91674 17.0837L8.41674 17.0837L8.41674 2.91699L7.91674 2.91699L7.41674 2.91699L7.41674 17.0837L7.91674 17.0837Z", fill: "currentColor" }) })
    },
    "layout-left-partial": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M2.91732 2.91602L7.91732 2.91602L7.91732 17.0827H2.91732L2.91732 2.91602Z", fill: "currentColor", fillOpacity: "16%" }),
        /* @__PURE__ */ jsx("path", { d: "M2.91732 2.91602L17.084 2.91602M2.91732 2.91602L2.91732 17.0827M2.91732 2.91602L7.91732 2.91602M17.084 2.91602L17.084 17.0827M17.084 2.91602L7.91732 2.91602M17.084 17.0827L2.91732 17.0827M17.084 17.0827L7.91732 17.0827M2.91732 17.0827H7.91732M7.91732 17.0827L7.91732 2.91602", stroke: "currentColor", strokeLinecap: "square" })
      ] })
    },
    "layout-left-full": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M2.91732 2.91602L7.91732 2.91602L7.91732 17.0827H2.91732L2.91732 2.91602Z", fill: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M2.91732 2.91602L17.084 2.91602M2.91732 2.91602L2.91732 17.0827M2.91732 2.91602L7.91732 2.91602M17.084 2.91602L17.084 17.0827M17.084 2.91602L7.91732 2.91602M17.084 17.0827L2.91732 17.0827M17.084 17.0827L7.91732 17.0827M2.91732 17.0827H7.91732M7.91732 17.0827L7.91732 2.91602", stroke: "currentColor", strokeLinecap: "square" })
      ] })
    },
    "layout-right": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.91536 2.91406H2.36536V2.36406H2.91536V2.91406ZM2.91536 17.0807V17.6307H2.36536V17.0807H2.91536ZM17.082 17.0807H17.632V17.6307H17.082V17.0807ZM17.082 2.91406V2.36406H17.632V2.91406H17.082ZM6.9987 2.91406H6.4487V2.36406H6.9987V2.91406ZM6.9987 17.0807V17.6307H6.4487V17.0807H6.9987ZM2.91536 2.91406H3.46536V17.0807H2.91536H2.36536V2.91406H2.91536ZM2.91536 17.0807V16.5307H17.082V17.0807V17.6307H2.91536V17.0807ZM17.082 17.0807H16.532V2.91406H17.082H17.632V17.0807H17.082ZM17.082 2.91406V3.46406H2.91536V2.91406V2.36406H17.082V2.91406ZM6.9987 2.91406H7.5487V17.0807H6.9987H6.4487V2.91406H6.9987ZM17.082 17.0807L17.082 17.6307L6.9987 17.6307V17.0807V16.5307L17.082 16.5307L17.082 17.0807ZM6.9987 2.91406V2.36406H17.082V2.91406V3.46406H6.9987V2.91406Z", fill: "currentColor" }) })
    },
    "layout-right-partial": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M17.082 17.0807L6.9987 17.0807V2.91406H17.082V17.0807Z", fill: "currentColor", fillOpacity: "16%" }),
        /* @__PURE__ */ jsx("path", { d: "M2.91536 2.91406H2.36536V2.36406H2.91536V2.91406ZM2.91536 17.0807V17.6307H2.36536V17.0807H2.91536ZM17.082 17.0807H17.632V17.6307H17.082V17.0807ZM17.082 2.91406V2.36406H17.632V2.91406H17.082ZM6.9987 2.91406H6.4487V2.36406H6.9987V2.91406ZM6.9987 17.0807V17.6307H6.4487V17.0807H6.9987ZM2.91536 2.91406H3.46536V17.0807H2.91536H2.36536V2.91406H2.91536ZM2.91536 17.0807V16.5307H17.082V17.0807V17.6307H2.91536V17.0807ZM17.082 17.0807H16.532V2.91406H17.082H17.632V17.0807H17.082ZM17.082 2.91406V3.46406H2.91536V2.91406V2.36406H17.082V2.91406ZM6.9987 2.91406H7.5487V17.0807H6.9987H6.4487V2.91406H6.9987ZM17.082 17.0807L17.082 17.6307L6.9987 17.6307V17.0807V16.5307L17.082 16.5307L17.082 17.0807ZM6.9987 2.91406V2.36406H17.082V2.91406V3.46406H6.9987V2.91406Z", fill: "currentColor" })
      ] })
    },
    "layout-right-full": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M17.082 17.0807L6.9987 17.0807V2.91406H17.082V17.0807Z", fill: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M2.91536 2.91406H2.36536V2.36406H2.91536V2.91406ZM2.91536 17.0807V17.6307H2.36536V17.0807H2.91536ZM17.082 17.0807H17.632V17.6307H17.082V17.0807ZM17.082 2.91406V2.36406H17.632V2.91406H17.082ZM6.9987 2.91406H6.4487V2.36406H6.9987V2.91406ZM6.9987 17.0807V17.6307H6.4487V17.0807H6.9987ZM2.91536 2.91406H3.46536V17.0807H2.91536H2.36536V2.91406H2.91536ZM2.91536 17.0807V16.5307H17.082V17.0807V17.6307H2.91536V17.0807ZM17.082 17.0807H16.532V2.91406H17.082H17.632V17.0807H17.082ZM17.082 2.91406V3.46406H2.91536V2.91406V2.36406H17.082V2.91406ZM6.9987 2.91406H7.5487V17.0807H6.9987H6.4487V2.91406H6.9987ZM17.082 17.0807L17.082 17.6307L6.9987 17.6307V17.0807V16.5307L17.082 16.5307L17.082 17.0807ZM6.9987 2.91406V2.36406H17.082V2.91406V3.46406H6.9987V2.91406Z", fill: "currentColor" })
      ] })
    },
    "square-arrow-top-right": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M7.91675 2.9165H2.91675V17.0832H17.0834V12.0832M12.0834 2.9165H17.0834V7.9165M9.58342 10.4165L16.6667 3.33317", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "open-file": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M7.91602 2.91406H2.91602V17.0807H17.0827V12.0807M12.0827 2.91406H17.0827V7.91406M9.58268 10.4141L16.666 3.33073", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "speech-bubble": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M18.3334 10.0003C18.3334 5.57324 15.0927 2.91699 10.0001 2.91699C4.90749 2.91699 1.66675 5.57324 1.66675 10.0003C1.66675 11.1497 2.45578 13.1016 2.5771 13.3949C2.5878 13.4207 2.59839 13.4444 2.60802 13.4706C2.69194 13.6996 3.04282 14.9364 1.66675 16.7684C3.5186 17.6538 5.48526 16.1982 5.48526 16.1982C6.84592 16.9202 8.46491 17.0837 10.0001 17.0837C15.0927 17.0837 18.3334 14.4274 18.3334 10.0003Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    comment: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M16.25 3.75H3.75V16.25L6.875 14.4643H16.25V3.75Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "folder-add-left": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.08333 9.58268V2.91602H8.33333L10 5.41602H17.9167V16.2493H8.75M3.75 12.0827V14.5827M3.75 14.5827V17.0827M3.75 14.5827H1.25M3.75 14.5827H6.25", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    github: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M10.0001 1.62549C14.6042 1.62549 18.3334 5.35465 18.3334 9.95882C18.333 11.7049 17.785 13.4068 16.7666 14.8251C15.7482 16.2434 14.3107 17.3066 12.6563 17.8651C12.2397 17.9484 12.0834 17.688 12.0834 17.4692C12.0834 17.188 12.0938 16.2922 12.0938 15.1776C12.0938 14.3963 11.8334 13.8963 11.5313 13.6359C13.3855 13.4276 15.3334 12.7192 15.3334 9.52132C15.3334 8.60465 15.0105 7.86507 14.4792 7.28174C14.5626 7.0734 14.8542 6.21924 14.3959 5.0734C14.3959 5.0734 13.698 4.84424 12.1042 5.92757C11.4376 5.74007 10.7292 5.64632 10.0209 5.64632C9.31258 5.64632 8.60425 5.74007 7.93758 5.92757C6.34383 4.85465 5.64592 5.0734 5.64592 5.0734C5.18758 6.21924 5.47925 7.0734 5.56258 7.28174C5.03133 7.86507 4.70842 8.61507 4.70842 9.52132C4.70842 12.7088 6.64592 13.4276 8.50008 13.6359C8.2605 13.8442 8.04175 14.2088 7.96883 14.7505C7.48967 14.9692 6.29175 15.3234 5.54175 14.063C5.3855 13.813 4.91675 13.1984 4.2605 13.2088C3.56258 13.2192 3.97925 13.6047 4.27092 13.7609C4.62508 13.9588 5.03133 14.6984 5.12508 14.938C5.29175 15.4067 5.83342 16.3026 7.92717 15.9172C7.92717 16.6151 7.93758 17.2713 7.93758 17.4692C7.93758 17.688 7.78133 17.938 7.36467 17.8651C5.70491 17.3126 4.26126 16.2515 3.23851 14.8324C2.21576 13.4133 1.66583 11.7081 1.66675 9.95882C1.66675 5.35465 5.39592 1.62549 10.0001 1.62549Z", fill: "currentColor" }) })
    },
    discord: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M16.0742 4.45014C14.9244 3.92097 13.7106 3.54556 12.4638 3.3335C12.2932 3.64011 12.1388 3.95557 12.0013 4.27856C10.6732 4.07738 9.32261 4.07738 7.99451 4.27856C7.85694 3.9556 7.70257 3.64014 7.53203 3.3335C6.28441 3.54735 5.06981 3.92365 3.91889 4.45291C1.63401 7.85128 1.01462 11.1652 1.32431 14.4322C2.6624 15.426 4.16009 16.1819 5.7523 16.6668C6.11082 16.1821 6.42806 15.6678 6.70066 15.1295C6.18289 14.9351 5.68315 14.6953 5.20723 14.4128C5.33249 14.3215 5.45499 14.2274 5.57336 14.136C6.95819 14.7907 8.46965 15.1302 9.99997 15.1302C11.5303 15.1302 13.0418 14.7907 14.4266 14.136C14.5463 14.2343 14.6688 14.3284 14.7927 14.4128C14.3159 14.6957 13.8152 14.9361 13.2965 15.1309C13.5688 15.669 13.8861 16.1828 14.2449 16.6668C15.8385 16.1838 17.3373 15.4283 18.6756 14.4335C19.039 10.645 18.0549 7.36145 16.0742 4.45014ZM7.09294 12.423C6.22992 12.423 5.51693 11.6357 5.51693 10.6671C5.51693 9.69852 6.20514 8.90427 7.09019 8.90427C7.97524 8.90427 8.68272 9.69852 8.66758 10.6671C8.65244 11.6357 7.97248 12.423 7.09294 12.423ZM12.907 12.423C12.0426 12.423 11.3324 11.6357 11.3324 10.6671C11.3324 9.69852 12.0206 8.90427 12.907 8.90427C13.7934 8.90427 14.4954 9.69852 14.4803 10.6671C14.4651 11.6357 13.7865 12.423 12.907 12.423Z", fill: "currentColor" }) })
    },
    "layout-bottom": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.91699 17.0832L2.41699 17.0832L2.41699 17.5832L2.91699 17.5832L2.91699 17.0832ZM2.91699 2.91653L2.91699 2.41653L2.41699 2.41653L2.41699 2.91653L2.91699 2.91653ZM17.0837 2.91653L17.5837 2.91653L17.5837 2.41653L17.0837 2.41653L17.0837 2.91653ZM17.0837 17.0832L17.5837 17.0832L17.5837 17.5832L17.0837 17.5832L17.0837 17.0832ZM17.0837 12.5827L17.5837 12.5827L17.5837 11.5827L17.0837 11.5827L17.0837 12.0827L17.0837 12.5827ZM2.91699 11.5827L2.41699 11.5827L2.41699 12.5827L2.91699 12.5827L2.91699 12.0827L2.91699 11.5827ZM2.91699 17.0832L3.41699 17.0832L3.41699 2.91653L2.91699 2.91653L2.41699 2.91653L2.41699 17.0832L2.91699 17.0832ZM2.91699 2.91653L2.91699 3.41653L17.0837 3.41653L17.0837 2.91653L17.0837 2.41653L2.91699 2.41653L2.91699 2.91653ZM17.0837 2.91653L16.5837 2.91653L16.5837 17.0832L17.0837 17.0832L17.5837 17.0832L17.5837 2.91653L17.0837 2.91653ZM17.0837 17.0832L17.0837 16.5832L2.91699 16.5832L2.91699 17.0832L2.91699 17.5832L17.0837 17.5832L17.0837 17.0832ZM17.0837 12.0827L17.0837 11.5827L2.91699 11.5827L2.91699 12.0827L2.91699 12.5827L17.0837 12.5827L17.0837 12.0827Z", fill: "currentColor" }) })
    },
    "layout-bottom-partial": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M2.91732 12.0827L17.084 12.0827L17.084 17.0827H2.91732L2.91732 12.0827Z", fill: "currentColor", fillOpacity: "16%" }),
        /* @__PURE__ */ jsx("path", { d: "M2.91732 2.91602L17.084 2.91602M2.91732 2.91602L2.91732 17.0827M17.084 2.91602L17.084 17.0827M17.084 17.0827L2.91732 17.0827M2.91732 12.0827L17.084 12.0827", stroke: "currentColor", strokeLinecap: "square" })
      ] })
    },
    "layout-bottom-full": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M2.91732 12.0827L17.084 12.0827L17.084 17.0827H2.91732L2.91732 12.0827Z", fill: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M2.91732 2.91602L17.084 2.91602M2.91732 2.91602L2.91732 17.0827M17.084 2.91602L17.084 17.0827M17.084 17.0827L2.91732 17.0827M2.91732 12.0827L17.084 12.0827", stroke: "currentColor", strokeLinecap: "square" })
      ] })
    },
    "dot-grid": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M2.08398 9.16602H3.75065V10.8327H2.08398V9.16602Z", fill: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M10.834 9.16602H9.16732V10.8327H10.834V9.16602Z", fill: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M16.2507 9.16602H17.9173V10.8327H16.2507V9.16602Z", fill: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M2.08398 9.16602H3.75065V10.8327H2.08398V9.16602Z", stroke: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M10.834 9.16602H9.16732V10.8327H10.834V9.16602Z", stroke: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M16.2507 9.16602H17.9173V10.8327H16.2507V9.16602Z", stroke: "currentColor" })
      ] })
    },
    "circle-check": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M12.4987 7.91732L8.7487 12.5007L7.08203 10.834M17.9154 10.0007C17.9154 14.3729 14.371 17.9173 9.9987 17.9173C5.62644 17.9173 2.08203 14.3729 2.08203 10.0007C2.08203 5.6284 5.62644 2.08398 9.9987 2.08398C14.371 2.08398 17.9154 5.6284 17.9154 10.0007Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    copy: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M6.2513 6.24935V2.91602H17.0846V13.7493H13.7513M13.7513 6.24935V17.0827H2.91797V6.24935H13.7513Z", stroke: "currentColor", strokeLinecap: "round" }) })
    },
    check: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M5 11.9657L8.37838 14.7529L15 5.83398", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    photo: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M16.6665 16.6666L11.6665 11.6666L9.99984 13.3333L6.6665 9.99996L3.08317 13.5833M2.9165 2.91663H17.0832V17.0833H2.9165V2.91663ZM13.3332 7.49996C13.3332 8.30537 12.6803 8.95829 11.8748 8.95829C11.0694 8.95829 10.4165 8.30537 10.4165 7.49996C10.4165 6.69454 11.0694 6.04163 11.8748 6.04163C12.6803 6.04163 13.3332 6.69454 13.3332 7.49996Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    share: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M10.0013 12.0846L10.0013 3.33464M13.7513 6.66797L10.0013 2.91797L6.2513 6.66797M17.0846 10.418V17.0846H2.91797V10.418", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    shield: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M7.49935 9.3737L9.16602 11.0404L12.4994 7.70703M9.99935 2.08203L17.0827 4.3737V9.92565C17.0827 14.0694 13.3327 16.2487 9.99935 18.047C6.66602 16.2487 2.91602 14.0694 2.91602 9.92565V4.3737L9.99935 2.08203Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    download: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M13.9583 10.6257L10 14.584L6.04167 10.6257M10 2.08398V13.959M16.25 17.9173H3.75", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    menu: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.5 5H17.5M2.5 10H17.5M2.5 15H17.5", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    server: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("rect", { x: "3.35547", y: "1.92969", width: "13.2857", height: "16.1429", stroke: "currentColor" }),
        /* @__PURE__ */ jsx("rect", { x: "3.35547", y: "11.9297", width: "13.2857", height: "6.14286", stroke: "currentColor" }),
        /* @__PURE__ */ jsx("rect", { x: "12.8555", y: "14.2852", width: "1.42857", height: "1.42857", fill: "currentColor" }),
        /* @__PURE__ */ jsx("rect", { x: "10", y: "14.2852", width: "1.42857", height: "1.42857", fill: "currentColor" })
      ] })
    },
    branch: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M14.2036 7.19987L14.2079 6.69989L13.2079 6.69132L13.2036 7.1913L13.7036 7.19559L14.2036 7.19987ZM8.14804 5.09032H7.64804C7.64804 5.75797 7.06861 6.34471 6.29619 6.34471V6.84471V7.34471C7.56926 7.34471 8.64804 6.36051 8.64804 5.09032H8.14804ZM6.29619 6.84471V6.34471C5.52376 6.34471 4.94434 5.75797 4.94434 5.09032H4.44434H3.94434C3.94434 6.36051 5.02311 7.34471 6.29619 7.34471V6.84471ZM4.44434 5.09032H4.94434C4.94434 4.42267 5.52376 3.83594 6.29619 3.83594V3.33594V2.83594C5.02311 2.83594 3.94434 3.82013 3.94434 5.09032H4.44434ZM6.29619 3.33594V3.83594C7.06861 3.83594 7.64804 4.42267 7.64804 5.09032H8.14804H8.64804C8.64804 3.82013 7.56926 2.83594 6.29619 2.83594V3.33594ZM8.14804 14.9149H7.64804C7.64804 15.5825 7.06861 16.1693 6.29619 16.1693V16.6693V17.1693C7.56926 17.1693 8.64804 16.1851 8.64804 14.9149H8.14804ZM6.29619 16.6693V16.1693C5.52376 16.1693 4.94434 15.5825 4.94434 14.9149H4.44434H3.94434C3.94434 16.1851 5.02311 17.1693 6.29619 17.1693V16.6693ZM4.44434 14.9149H4.94434C4.94434 14.2472 5.52376 13.6605 6.29619 13.6605V13.1605V12.6605C5.02311 12.6605 3.94434 13.6447 3.94434 14.9149H4.44434ZM6.29619 13.1605V13.6605C7.06861 13.6605 7.64804 14.2472 7.64804 14.9149H8.14804H8.64804C8.64804 13.6447 7.56926 12.6605 6.29619 12.6605V13.1605ZM15.5554 5.09032H15.0554C15.0554 5.75797 14.476 6.34471 13.7036 6.34471V6.84471V7.34471C14.9767 7.34471 16.0554 6.36051 16.0554 5.09032H15.5554ZM13.7036 6.84471V6.34471C12.9312 6.34471 12.3517 5.75797 12.3517 5.09032H11.8517H11.3517C11.3517 6.36051 12.4305 7.34471 13.7036 7.34471V6.84471ZM11.8517 5.09032H12.3517C12.3517 4.42267 12.9312 3.83594 13.7036 3.83594V3.33594V2.83594C12.4305 2.83594 11.3517 3.82013 11.3517 5.09032H11.8517ZM13.7036 3.33594V3.83594C14.476 3.83594 15.0554 4.42267 15.0554 5.09032H15.5554H16.0554C16.0554 3.82013 14.9767 2.83594 13.7036 2.83594V3.33594ZM13.7036 7.19559L13.2036 7.1913L13.1544 12.9277L13.6544 12.932L14.1544 12.9363L14.2036 7.19987L13.7036 7.19559ZM6.29619 6.84471H5.79619V13.1605H6.29619H6.79619V6.84471H6.29619ZM11.6545 14.9149V14.4149H8.14804V14.9149V15.4149H11.6545V14.9149ZM13.6544 12.932L13.1544 12.9277C13.1474 13.7511 12.4779 14.4149 11.6545 14.4149V14.9149V15.4149C13.0269 15.4149 14.1426 14.3086 14.1544 12.9363L13.6544 12.932Z", fill: "currentColor" }) })
    },
    edit: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M17.0832 17.0807V17.5807H17.5832V17.0807H17.0832ZM2.9165 17.0807H2.4165V17.5807H2.9165V17.0807ZM2.9165 2.91406V2.41406H2.4165V2.91406H2.9165ZM9.58317 3.41406H10.0832V2.41406H9.58317V2.91406V3.41406ZM17.5832 10.4141V9.91406H16.5832V10.4141H17.0832H17.5832ZM6.24984 11.2474L5.89628 10.8938L5.74984 11.0403V11.2474H6.24984ZM6.24984 13.7474H5.74984V14.2474H6.24984V13.7474ZM8.74984 13.7474V14.2474H8.95694L9.10339 14.101L8.74984 13.7474ZM15.2082 2.28906L15.5617 1.93551L15.2082 1.58196L14.8546 1.93551L15.2082 2.28906ZM17.7082 4.78906L18.0617 5.14262L18.4153 4.78906L18.0617 4.43551L17.7082 4.78906ZM17.0832 17.0807V16.5807H2.9165V17.0807V17.5807H17.0832V17.0807ZM2.9165 17.0807H3.4165V2.91406H2.9165H2.4165V17.0807H2.9165ZM2.9165 2.91406V3.41406H9.58317V2.91406V2.41406H2.9165V2.91406ZM17.0832 10.4141H16.5832V17.0807H17.0832H17.5832V10.4141H17.0832ZM6.24984 11.2474H5.74984V13.7474H6.24984H6.74984V11.2474H6.24984ZM6.24984 13.7474V14.2474H8.74984V13.7474V13.2474H6.24984V13.7474ZM6.24984 11.2474L6.60339 11.6009L15.5617 2.64262L15.2082 2.28906L14.8546 1.93551L5.89628 10.8938L6.24984 11.2474ZM15.2082 2.28906L14.8546 2.64262L17.3546 5.14262L17.7082 4.78906L18.0617 4.43551L15.5617 1.93551L15.2082 2.28906ZM17.7082 4.78906L17.3546 4.43551L8.39628 13.3938L8.74984 13.7474L9.10339 14.101L18.0617 5.14262L17.7082 4.78906Z", fill: "currentColor" }) })
    },
    help: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M7.91683 7.91927V6.2526H12.0835V8.7526L10.0002 10.0026V12.0859M10.0002 13.7526V13.7609M17.9168 10.0026C17.9168 14.3749 14.3724 17.9193 10.0002 17.9193C5.62791 17.9193 2.0835 14.3749 2.0835 10.0026C2.0835 5.63035 5.62791 2.08594 10.0002 2.08594C14.3724 2.08594 17.9168 5.63035 17.9168 10.0026Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    "settings-gear": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M7.62516 4.46094L5.05225 3.86719L3.86475 5.05469L4.4585 7.6276L2.0835 9.21094V10.7943L4.4585 12.3776L3.86475 14.9505L5.05225 16.138L7.62516 15.5443L9.2085 17.9193H10.7918L12.3752 15.5443L14.9481 16.138L16.1356 14.9505L15.5418 12.3776L17.9168 10.7943V9.21094L15.5418 7.6276L16.1356 5.05469L14.9481 3.86719L12.3752 4.46094L10.7918 2.08594H9.2085L7.62516 4.46094Z", stroke: "currentColor" }),
        /* @__PURE__ */ jsx("path", { d: "M12.5002 10.0026C12.5002 11.3833 11.3809 12.5026 10.0002 12.5026C8.61945 12.5026 7.50016 11.3833 7.50016 10.0026C7.50016 8.62189 8.61945 7.5026 10.0002 7.5026C11.3809 7.5026 12.5002 8.62189 12.5002 10.0026Z", stroke: "currentColor" })
      ] })
    },
    dash: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("rect", { x: "5", y: "9.5", width: "10", height: "1", fill: "currentColor" }) })
    },
    "cloud-upload": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M12.0833 16.25H15C17.0711 16.25 18.75 14.5711 18.75 12.5C18.75 10.5649 17.2843 8.97217 15.4025 8.77133C15.2 6.13103 12.8586 4.08333 10 4.08333C7.71532 4.08333 5.76101 5.49781 4.96501 7.49881C2.84892 7.90461 1.25 9.76559 1.25 11.6667C1.25 13.9813 3.30203 16.25 5.83333 16.25H7.91667M10 16.25V10.4167M12.0833 11.875L10 9.79167L7.91667 11.875", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    trash: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M4.58342 17.9134L4.58369 17.4134L4.22787 17.5384L4.22766 18.0384H4.58342V17.9134ZM15.4167 17.9134V18.0384H15.7725L15.7723 17.5384L15.4167 17.9134ZM2.08342 3.95508V3.45508H1.58342V3.95508H2.08342V4.45508V3.95508ZM17.9167 4.45508V4.95508H18.4167V4.45508H17.9167V3.95508V4.45508ZM4.16677 4.58008L3.66701 4.5996L4.22816 17.5379L4.72792 17.4934L5.22767 17.4489L4.66652 4.54055L4.16677 4.58008ZM4.58342 18.0384V17.9134H15.4167V18.0384V18.5384H4.58342V18.0384ZM15.4167 17.9134L15.8332 17.5379L16.2498 4.5996L15.7501 4.58008L15.2503 4.56055L14.8337 17.4989L15.4167 17.9134ZM15.8334 4.58008V4.08008H4.16677V4.58008V5.08008H15.8334V4.58008ZM2.08342 4.45508V4.95508H4.16677V4.58008V4.08008H2.08342V4.45508ZM15.8334 4.58008V5.08008H17.9167V4.45508V3.95508H15.8334V4.58008ZM6.83951 4.35149L7.432 4.55047C7.79251 3.47701 8.80699 2.70508 10.0001 2.70508V2.20508V1.70508C8.25392 1.70508 6.77335 2.83539 6.24702 4.15251L6.83951 4.35149ZM10.0001 2.20508V2.70508C11.1932 2.70508 12.2077 3.47701 12.5682 4.55047L13.1607 4.35149L13.7532 4.15251C13.2269 2.83539 11.7463 1.70508 10.0001 1.70508V2.20508Z", fill: "currentColor" }) })
    },
    sliders: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M3.625 6.25H10.9375M16.375 13.75H10.5625M3.625 13.75H4.9375M11.125 6.25C11.125 4.79969 12.2997 3.625 13.75 3.625C15.2003 3.625 16.375 4.79969 16.375 6.25C16.375 7.70031 15.2003 8.875 13.75 8.875C12.2997 8.875 11.125 7.70031 11.125 6.25ZM10.375 13.75C10.375 15.2003 9.20031 16.375 7.75 16.375C6.29969 16.375 5.125 15.2003 5.125 13.75C5.125 12.2997 6.29969 11.125 7.75 11.125C9.20031 11.125 10.375 12.2997 10.375 13.75Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    keyboard: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M5.125 7.375V4.375H14.875V2.875M8.3125 13.9375H11.6875M8.125 13.9375H11.875M2.125 7.375H17.875V17.125H2.125V7.375ZM5.5 10.375H5.125V10.75H5.5V10.375ZM8.5 10.375H8.125V10.75H8.5V10.375ZM11.875 10.375H11.5V10.75H11.875V10.375ZM14.875 10.375H14.5V10.75H14.875V10.375ZM14.875 13.75H14.5V14.125H14.875V13.75ZM5.5 13.75H5.125V14.125H5.5V13.75Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    selector: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M6.66626 12.5033L9.99959 15.8366L13.3329 12.5033M6.66626 7.50326L9.99959 4.16992L13.3329 7.50326", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    /*
    * A globe, for a page that is a document rather than a file of text.
    *
    * Distinct from `file-tree` on purpose: the two are the two halves of the file
    * pane's answer to "what is this", and at a glance they have to be told apart
    * before the label is read.
    */
    globe: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("circle", { cx: "10", cy: "10", r: "7.08333", stroke: "currentColor", strokeWidth: "1.25" }),
        /* @__PURE__ */ jsx(
          "ellipse",
          {
            cx: "10",
            cy: "10",
            rx: "3.4",
            ry: "7.08333",
            stroke: "currentColor",
            strokeWidth: "1.25"
          }
        )
      ] })
    },
    /*
     * The reload arrow. Drawn as an arc with a head rather than a full circle, so
     * the direction reads at 14px.
     */
    "arrow-clockwise": {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M16.6673 9.99935C16.6673 13.6812 13.6825 16.666 10.0007 16.666C6.31876 16.666 3.33398 13.6812 3.33398 9.99935C3.33398 6.31745 6.31876 3.33268 10.0007 3.33268C12.3023 3.33268 14.3357 4.48362 15.5252 6.24197", stroke: "currentColor", strokeLinecap: "round" }),
        /* @__PURE__ */ jsx("path", { d: "M15.8333 3.33301V6.66634H12.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" })
      ] })
    },
    /*
     * Angle brackets, for switching a page to its source.
     *
     * `code-lines` is already here and reads as a file of code; these two read as
     * *markup*, which is what the button offers.
     */
    "code-brackets": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M7.08333 5.83333L2.91667 10L7.08333 14.1667M12.9167 5.83333L17.0833 10L12.9167 14.1667", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" }) })
    },
    "arrow-down-to-line": {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M15.2083 11.6667L10 16.875L4.79167 11.6667M10 16.25V3.125", stroke: "currentColor", strokeWidth: "1.25", strokeLinecap: "square" }) })
    },
    warning: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M10 7.91667V11.6667M10 13.7417V13.75M10 2.5L1.875 16.25H18.125L10 2.5Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    reset: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M5.83333 4.16406L2.5 7.4974L5.83333 10.8307M3.33333 7.4974H17.9167V15.4141H10", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    link: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M2.08334 12.0833L1.72979 11.7298L1.37624 12.0833L1.72979 12.4369L2.08334 12.0833ZM7.91668 17.9167L7.56312 18.2702L7.91668 18.6238L8.27023 18.2702L7.91668 17.9167ZM17.9167 7.91666L18.2702 8.27022L18.6238 7.91666L18.2702 7.56311L17.9167 7.91666ZM12.0833 2.08333L12.4369 1.72977L12.0833 1.37622L11.7298 1.72977L12.0833 2.08333ZM8.39646 5.06311L8.0429 5.41666L8.75001 6.12377L9.10356 5.77021L8.75001 5.41666L8.39646 5.06311ZM5.77023 9.10355L6.12378 8.74999L5.41668 8.04289L5.06312 8.39644L5.41668 8.74999L5.77023 9.10355ZM14.2298 10.8964L13.8762 11.25L14.5833 11.9571L14.9369 11.6035L14.5833 11.25L14.2298 10.8964ZM11.6036 14.9369L11.9571 14.5833L11.25 13.8762L10.8965 14.2298L11.25 14.5833L11.6036 14.9369ZM7.14646 12.1464L6.7929 12.5L7.50001 13.2071L7.85356 12.8535L7.50001 12.5L7.14646 12.1464ZM12.8536 7.85355L13.2071 7.49999L12.5 6.79289L12.1465 7.14644L12.5 7.49999L12.8536 7.85355ZM2.08334 12.0833L1.72979 12.4369L7.56312 18.2702L7.91668 17.9167L8.27023 17.5631L2.4369 11.7298L2.08334 12.0833ZM17.9167 7.91666L18.2702 7.56311L12.4369 1.72977L12.0833 2.08333L11.7298 2.43688L17.5631 8.27022L17.9167 7.91666ZM12.0833 2.08333L11.7298 1.72977L8.39646 5.06311L8.75001 5.41666L9.10356 5.77021L12.4369 2.43688L12.0833 2.08333ZM5.41668 8.74999L5.06312 8.39644L1.72979 11.7298L2.08334 12.0833L2.4369 12.4369L5.77023 9.10355L5.41668 8.74999ZM14.5833 11.25L14.9369 11.6035L18.2702 8.27022L17.9167 7.91666L17.5631 7.56311L14.2298 10.8964L14.5833 11.25ZM7.91668 17.9167L8.27023 18.2702L11.6036 14.9369L11.25 14.5833L10.8965 14.2298L7.56312 17.5631L7.91668 17.9167ZM7.50001 12.5L7.85356 12.8535L12.8536 7.85355L12.5 7.49999L12.1465 7.14644L7.14646 12.1464L7.50001 12.5Z", fill: "currentColor" }) })
    },
    providers: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M10.0001 4.37562V2.875M13 4.37793V2.87793M7.00014 4.37793V2.875M10 17.1279V15.6279M13 17.1279V15.6279M7 17.1279V15.6279M15.625 13.0029H17.125M15.625 7.00293H17.125M15.625 10.0029H17.125M2.875 10.0029H4.375M2.875 13.0029H4.375M2.875 7.00293H4.375M4.375 4.37793H15.625V15.6279H4.375V4.37793ZM12.6241 10.0022C12.6241 11.4519 11.4488 12.6272 9.99908 12.6272C8.54934 12.6272 7.37408 11.4519 7.37408 10.0022C7.37408 8.55245 8.54934 7.3772 9.99908 7.3772C11.4488 7.3772 12.6241 8.55245 12.6241 10.0022Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    models: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M17.5 10C12.2917 10 10 12.2917 10 17.5C10 12.2917 7.70833 10 2.5 10C7.70833 10 10 7.70833 10 2.5C10 7.70833 12.2917 10 17.5 10Z", stroke: "currentColor" }) })
    },
    /*
     * The three window controls.
     *
     * Strokes rather than the filled glyphs the set uses elsewhere, because that
     * is what the platform draws in this corner: a user reads the top-right
     * cluster by shape and position long before they read the details, and three
     * solid blocks here would look like a different application's chrome.
     *
     * They sit on the same 20x20 grid and the same 1px stroke as everything else,
     * so they stay the same optical weight as the buttons to their left.
     */
    minimize: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M5 10H15", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    maximize: {
      body: /* @__PURE__ */ jsx(Fragment2, { children: /* @__PURE__ */ jsx("path", { d: "M5 5H15V15H5V5Z", stroke: "currentColor", strokeLinecap: "square" }) })
    },
    /*
     * Drawn as the overlap of two rectangles — the standard "restore" mark — and
     * offset a unit down-left to leave room for the second one. The front rectangle
     * is filled with the bar's own background so the back one shows only where it
     * actually sticks out, which is what makes the pair read as two overlapping
     * windows rather than as a square with a tick beside it.
     */
    restore: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M7 6.25H15.75V15H7V6.25Z", stroke: "currentColor", strokeLinecap: "square" }),
        /* @__PURE__ */ jsx("path", { d: "M4.25 4.25V13H5.75V5.75H13V4.25H4.25Z", fill: "currentColor" })
      ] })
    },
    /*
     * Take a conversation back out of the archive.
     *
     * The same box as `archive`, with an arrow rising out of it, so the two read
     * as the inverse of one another rather than as two unrelated controls. Not the
     * `restore` glyph above: that one is a window-control square and means
     * "un-maximise", which in a title bar and in a sidebar row would be the same
     * picture saying two different things.
     */
    unarchive: {
      body: /* @__PURE__ */ jsxs(Fragment2, { children: [
        /* @__PURE__ */ jsx("path", { d: "M2.08301 2.91602H17.9163V6.24935H2.08301V2.91602Z", stroke: "currentColor", strokeLinecap: "square" }),
        /* @__PURE__ */ jsx("path", { d: "M3.33301 6.66602H16.6663V16.666H3.33301V6.66602Z", stroke: "currentColor", strokeLinecap: "square" }),
        /* @__PURE__ */ jsx("path", { d: "M9.99967 13.7493V8.74935", stroke: "currentColor", strokeLinecap: "square" }),
        /* @__PURE__ */ jsx("path", { d: "M7.91634 10.8327L9.99967 8.74935L12.083 10.8327", stroke: "currentColor", strokeLinecap: "square" })
      ] })
    }
  };
  function Icon({ name, size = "normal", className }) {
    const entry = ICONS[name];
    const viewBox = entry.viewBox ?? "0 0 20 20";
    const scale = OPTICAL_SCALE[name];
    return /* @__PURE__ */ jsx("span", { "data-component": "icon", "data-size": size, className, children: /* @__PURE__ */ jsx(
      "svg",
      {
        "data-slot": "icon-svg",
        viewBox,
        fill: "none",
        "aria-hidden": "true",
        style: scale ? { transform: `scale(${scale})` } : void 0,
        children: entry.body
      }
    ) });
  }

  // shim/react-dom.js
  var real3 = globalThis.__aranllmUI?.reactDom;
  if (real3 === void 0) {
    throw new Error("aranllm-local: the bundle ran before react-dom was installed");
  }
  var { createPortal } = real3;

  // Modal/Modal.tsx
  function Modal({ open, title, onClose, children, actions, size = "compact" }) {
    const card = useRef(null);
    useEffect(() => {
      if (!open) return void 0;
      const onKey = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      };
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);
    if (!open) return null;
    return createPortal(
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "modal",
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) onClose();
          },
          children: /* @__PURE__ */ jsxs(
            "div",
            {
              className: "modal__card",
              "data-size": size,
              ref: card,
              role: "dialog",
              "aria-modal": "true",
              "aria-label": title,
              children: [
                /* @__PURE__ */ jsx("div", { className: "modal__title", children: title }),
                /* @__PURE__ */ jsx("div", { className: "modal__body", children }),
                actions ? /* @__PURE__ */ jsx("div", { className: "modal__actions", children: actions }) : null
              ]
            }
          )
        }
      ),
      document.body
    );
  }

  // ParameterField.tsx
  function defaultHint(field) {
    if (field.defaultHint) return field.defaultHint;
    if (field.auto) return "\u81EA\u52A8";
    if (field.defaultValue === void 0) return "";
    if (typeof field.defaultValue === "boolean") return field.defaultValue ? "\u9ED8\u8BA4\u5F00" : "\u9ED8\u8BA4\u5173";
    if (Array.isArray(field.defaultValue)) return "";
    return String(field.defaultValue);
  }
  function optionText(field, value) {
    if (typeof value !== "string") return String(value);
    return field.optionLabels?.[value] ?? value;
  }
  function Markers({ field }) {
    return /* @__PURE__ */ jsx(Fragment2, { children: field.experimental ? /* @__PURE__ */ jsx("span", { className: "param__badge", children: "\u5B9E\u9A8C\u6027" }) : null });
  }
  function FieldNote({ field }) {
    if (!field.note) return null;
    return /* @__PURE__ */ jsx("span", { className: "param__field-note", children: field.note });
  }
  function ParameterField({ field, value, onChange }) {
    const hint = defaultHint(field);
    if (field.type === "readonly") {
      return /* @__PURE__ */ jsxs("div", { className: "param__row", "data-readonly": "true", children: [
        /* @__PURE__ */ jsx("span", { className: "param__label", children: field.label }),
        /* @__PURE__ */ jsx("span", { className: "param__static", children: field.derived ?? "\u2014" })
      ] });
    }
    if (field.type === "boolean") {
      const resolved = typeof value === "boolean" ? value : Boolean(field.defaultValue);
      const overridden = typeof value === "boolean";
      return /* @__PURE__ */ jsxs("div", { className: "param__row", children: [
        /* @__PURE__ */ jsxs("span", { className: "param__label", children: [
          field.label,
          /* @__PURE__ */ jsx(Markers, { field })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "param__control", children: [
          overridden ? /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "param__icon",
              title: "\u6062\u590D\u4E3A\u81EA\u52A8",
              onClick: () => onChange(void 0),
              children: "\u21BA"
            }
          ) : /* @__PURE__ */ jsx("span", { className: "param__icon-spacer" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              role: "switch",
              "aria-checked": resolved,
              "aria-label": field.label,
              className: "param__switch",
              "data-on": resolved ? "true" : void 0,
              "data-overridden": overridden ? "true" : void 0,
              onClick: () => onChange(!resolved),
              children: /* @__PURE__ */ jsx("span", { className: "param__knob" })
            }
          )
        ] })
      ] });
    }
    if (field.type === "select") {
      return /* @__PURE__ */ jsxs("div", { className: `param__row${field.note ? " param__row--stacked" : ""}`, children: [
        /* @__PURE__ */ jsxs("span", { className: "param__label", children: [
          field.label,
          /* @__PURE__ */ jsx(Markers, { field })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "param__control", children: /* @__PURE__ */ jsxs(
          "select",
          {
            className: "param__select",
            value: value === void 0 ? "" : String(value),
            "aria-label": field.label,
            onChange: (event) => onChange(event.target.value === "" ? void 0 : event.target.value),
            children: [
              /* @__PURE__ */ jsx("option", { value: "", children: field.defaultValue === void 0 ? "\u9ED8\u8BA4" : `\u9ED8\u8BA4\uFF08${optionText(field, field.defaultValue)}\uFF09` }),
              (field.options ?? []).map((option) => (
                /*
                 * The value stays as the engine spells it; only the label is
                 * translated. A `<select>` reports back the `value`, and that is
                 * what reaches `buildArgs` — putting the Chinese in both would
                 * send `截断中间` to llama.cpp as a flag argument.
                 */
                /* @__PURE__ */ jsx("option", { value: option, children: optionText(field, option) }, option)
              ))
            ]
          }
        ) }),
        /* @__PURE__ */ jsx(FieldNote, { field })
      ] });
    }
    if (field.type === "string-list") {
      const text = Array.isArray(value) ? value.join("\n") : typeof value === "string" ? value : "";
      return /* @__PURE__ */ jsxs("div", { className: "param__row param__row--stacked", children: [
        /* @__PURE__ */ jsx("span", { className: "param__label", children: field.label }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "param__input",
            value: text,
            placeholder: "\u6BCF\u884C\u4E00\u4E2A",
            spellCheck: false,
            "aria-label": field.label,
            onChange: (event) => {
              const lines = event.target.value.split("\n").map((line) => line.trim()).filter(Boolean);
              onChange(lines.length > 0 ? lines : void 0);
            }
          }
        )
      ] });
    }
    if (field.type === "number" && typeof field.max === "number" && field.max > 0) {
      const stored = typeof value === "number" ? value : void 0;
      const all = stored === void 0 || stored < 0 || stored >= field.max;
      const position = all ? field.max : stored;
      const fromSlider = (raw) => raw >= field.max ? -1 : raw;
      return /* @__PURE__ */ jsxs("div", { className: "param__row param__row--stacked", children: [
        /* @__PURE__ */ jsxs("span", { className: "param__label", children: [
          field.label,
          /* @__PURE__ */ jsx(Markers, { field })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "param__slider", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "range",
              className: "param__range",
              min: 0,
              max: field.max,
              step: 1,
              value: position,
              "aria-label": field.label,
              onChange: (event) => onChange(fromSlider(Number(event.target.value)))
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "param__range-value", children: all ? `\u5168\u90E8 ${field.max}` : `${String(stored)} / ${field.max}` })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "param__range-hint", children: all ? "\u5168\u90E8\u5C42\u90FD\u653E\u5728\u663E\u5361\u4E0A\uFF0C\u663E\u5B58\u5360\u7528\u6700\u9AD8\uFF0C\u901F\u5EA6\u6700\u5FEB\u3002" : stored === 0 ? "\u5168\u90E8\u5C42\u90FD\u5728 CPU \u4E0A\u8FD0\u884C\uFF0C\u4E0D\u5360\u663E\u5B58\uFF0C\u901F\u5EA6\u6700\u6162\u3002" : `\u5176\u4F59 ${field.max - (stored ?? 0)} \u5C42\u5728 CPU \u4E0A\u8FD0\u884C\u3002` })
      ] });
    }
    const isNumber = field.type === "number";
    return /* @__PURE__ */ jsxs("div", { className: "param__row", children: [
      /* @__PURE__ */ jsxs("span", { className: "param__label", children: [
        field.label,
        /* @__PURE__ */ jsx(Markers, { field })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "param__control", children: /* @__PURE__ */ jsx(
        "input",
        {
          className: "param__input",
          value: value === void 0 || value === null ? "" : String(value),
          inputMode: isNumber ? "decimal" : "text",
          placeholder: hint,
          spellCheck: false,
          "aria-label": field.label,
          onChange: (event) => {
            const raw = event.target.value;
            onChange(raw === "" ? void 0 : raw);
          }
        }
      ) })
    ] });
  }

  // bridge-adapter.js
  async function get(path) {
    const response = await fetch(path);
    const body = await response.json().catch(() => void 0);
    if (!response.ok) throw new Error(body?.error ?? `\u672C\u5730\u6A21\u578B\u63A5\u53E3\u8FD4\u56DE ${response.status}\u3002`);
    return body;
  }
  async function post(path, payload) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload ?? {})
    });
    const body = await response.json().catch(() => void 0);
    if (!response.ok) throw new Error(body?.error ?? `\u672C\u5730\u6A21\u578B\u63A5\u53E3\u8FD4\u56DE ${response.status}\u3002`);
    return body;
  }
  var POLL_MS = 400;
  var subscriptions = /* @__PURE__ */ new Map();
  function subscribe(path, listener) {
    let entry = subscriptions.get(path);
    if (entry === void 0) {
      entry = { listeners: /* @__PURE__ */ new Set(), last: void 0, timer: void 0 };
      subscriptions.set(path, entry);
      const tick = async () => {
        try {
          const value = await get(path);
          const serialised = JSON.stringify(value);
          if (serialised !== entry.last) {
            entry.last = serialised;
            for (const receiver of [...entry.listeners]) {
              try {
                receiver(value);
              } catch {
              }
            }
          }
        } catch {
        }
        if (entry.listeners.size > 0) entry.timer = setTimeout(tick, POLL_MS);
        else subscriptions.delete(path);
      };
      entry.timer = setTimeout(tick, POLL_MS);
    }
    entry.listeners.add(listener);
    return () => {
      const current = subscriptions.get(path);
      if (current === void 0) return;
      current.listeners.delete(listener);
      if (current.listeners.size === 0) {
        clearTimeout(current.timer);
        subscriptions.delete(path);
      }
    };
  }
  function createBridge(writeClipboard) {
    return {
      models: {
        /* ── Scanning and loading ────────────────────────────────────────── */
        /** The whole page's data: the roots, the models, what is loaded, progress. */
        localCatalog: () => get("/api/aranllm/models"),
        /** The running model as an endpoint, or null. The picker reads this. */
        localSource: async () => {
          const status = await get("/api/aranllm/models/status");
          const loaded = status?.loaded;
          if (!loaded) return null;
          return {
            providerID: "aranllm-local",
            modelID: loaded.modelId,
            name: loaded.modelName,
            baseURL: loaded.baseURL
          };
        },
        loadLocal: (modelId) => post("/api/aranllm/models/load", { id: modelId }),
        /*
         * A boolean, because that is what the component reads.
         *
         * The route answers with the host function's result, which is the same
         * boolean — but a route can only answer JSON, so this is where "it was a
         * body, now it is a value" gets undone.
         */
        unloadLocal: async () => {
          const answer = await post("/api/aranllm/models/unload", {});
          return answer === true || answer?.ok === true;
        },
        /* ── The library on disk ─────────────────────────────────────────── */
        /** `{ roots, bundled }`: where models are read from, and the shipped folder. */
        library: async () => {
          const answer = await get("/api/aranllm/library");
          let bundled = "";
          try {
            bundled = (await get("/api/aranllm/library/bundled"))?.path ?? "";
          } catch {
          }
          return { roots: answer?.roots ?? [], bundled };
        },
        setLocalRoot: (root) => post("/api/aranllm/library/set", { root }),
        /**
         * The native folder picker.
         *
         * Not a route: the host owns the picker, and the component expects this to
         * return a path or undefined for a cancelled dialog. `undefined` rather
         * than an error is what tells the panel apart "the user changed their
         * mind" from "the dialog could not open".
         */
        chooseDirectory: async (start) => {
          const answer = await post("/api/aranllm/library/pick", { start });
          return answer?.path ?? void 0;
        },
        previewMove: (to) => post("/api/aranllm/library/preview", { to }),
        moveLibrary: (to, keepOld) => post("/api/aranllm/library/move", { to, keepOld }),
        moveState: () => get("/api/aranllm/library/move-state"),
        /* ── Per-model settings ──────────────────────────────────────────── */
        /*
         * The stored tuning, as the record itself.
         *
         * The route answers `{ ok, value }` — the same envelope the desktop
         * application's `models:localConfig` answered — and the component reads
         * the record straight out of it. This is the whole job of this file: the
         * routes answer in the shape the *old* bridge used, and anything that
         * differs is reconciled on this line rather than in the route, so the
         * copied components stay byte-identical to their source.
         */
        localConfig: async (modelId) => (await get(`/api/aranllm/config?id=${encodeURIComponent(modelId)}`))?.value ?? {},
        setLocalConfig: (modelId, values) => post("/api/aranllm/config/set", { id: modelId, values }),
        /*
         * The form's own field list, as the array it is.
         *
         * Wrapped by the route so it can grow a sibling field later; the component
         * calls `.map` on what it gets, so the wrapper is undone here rather than
         * in the route — a route that answered with a bare array could not add a
         * second field without breaking every other caller.
         */
        parameters: async () => (await get("/api/aranllm/parameters"))?.groups ?? [],
        /* ── The service itself ──────────────────────────────────────────── */
        /* A number, not `{ port }`: the address line renders it inline. */
        port: async () => (await get("/api/aranllm/port"))?.port,
        setPort: (port) => post("/api/aranllm/port/set", { port }),
        /** llama.cpp's own counters, from its `/metrics`. */
        stats: () => get("/api/aranllm/stats"),
        /*
         * What a load would cost, for parameters that have not been applied yet.
         *
         * A second memory figure, and the two answer different questions: that one
         * is llama.cpp's own projection for a load that happened, this one is for a
         * load that has not. The panel needs the second — it exists so the parameters
         * can be chosen before the model starts.
         */
        estimate: (request) => post("/api/aranllm/estimate", request),
        /** What llama.cpp projected for device memory, from its load log. */
        memory: () => get("/api/aranllm/memory"),
        /** The tail of the local-model log. An array of lines. */
        log: async (lines) => {
          const answer = await get(`/api/aranllm/log${lines ? `?lines=${String(lines)}` : ""}`);
          return Array.isArray(answer) ? answer : answer?.lines ?? [];
        },
        /* ── The OpenAI-compatible gateway ───────────────────────────────── */
        /*
         * The gateway's state: whether it runs, on what port, and with which key.
         *
         * Read rather than kept in the page, because the same values are written
         * by the settings section and a second copy in a component disagrees the
         * first time the service is started from anywhere else.
         */
        gateway: () => get("/api/aranllm/gateway/status"),
        /*
         * Save and (re)start. One call, because they are one decision — a server
         * whose address changed has to be rebound, so a save is a restart.
         */
        applyGateway: (settings) => post("/api/aranllm/gateway/apply", settings),
        stopGateway: () => post("/api/aranllm/gateway/stop", {}),
        /* ── Files ───────────────────────────────────────────────────────── */
        removeFile: (modelId) => post("/api/aranllm/models/remove", { id: modelId }),
        importModel: (request) => post("/api/aranllm/models/import", request ?? {})
      },
      /* ── The model hub ───────────────────────────────────────────────── */
      /*
       * Search, browse and download, with the desktop's two channels turned into
       * subscriptions this file makes itself.
       *
       * ## Why `onDownload` and `onQueue` are implemented here
       *
       * The desktop application pushed progress: the main process knew when a byte
       * arrived and sent it to the page, and `onDownload` registered the receiver.
       * This host has no such channel — the page reaches it over HTTP and nothing
       * can call back into the page — so the same interface is built on top of the
       * two state routes.
       *
       * What the caller sees is unchanged: it passes a function and gets back a
       * function that stops it. What differs is underneath, and the difference is
       * worth stating plainly — this polls, and the desktop did not.
       *
       * ## Why the interval is this and not a frame
       *
       * A transfer changes several times a second, and the desktop note argues
       * against polling for exactly that reason. What changes the calculus is that
       * the page no longer has a second way to hear: a poll is the only mechanism,
       * so the question is only how often. This is faster than a progress bar can
       * be read and slow enough that several panels open at once are not a load.
       *
       * The loop is shared per route — see `subscribe` — so a page with nothing
       * open makes no requests at all.
       */
      hub: {
        sources: async () => (await get("/api/aranllm/hub/sources"))?.sources ?? [],
        source: async () => (await get("/api/aranllm/hub/sources"))?.current,
        setSource: (id) => post("/api/aranllm/hub/source", { id }),
        search: (query) => post("/api/aranllm/hub/search", { query }),
        files: (repoId) => post("/api/aranllm/hub/files", { repoId }),
        download: (request) => post("/api/aranllm/download/start", request),
        cancelDownload: () => post("/api/aranllm/download/cancel", {}),
        downloadState: () => get("/api/aranllm/download/state"),
        enqueue: (items) => post("/api/aranllm/queue/enqueue", { items }),
        stopQueue: () => post("/api/aranllm/queue/stop", {}),
        queue: () => get("/api/aranllm/queue"),
        clearQueue: () => post("/api/aranllm/queue/clear", {}),
        /*
         * Pause, resume and forget — the three the desktop application did not
         * have. See the note on the routes: a queue that can only be emptied
         * cannot be stopped for the night and continued in the morning, and a
         * multi-hour transfer makes that the ordinary case rather than the edge.
         */
        pauseQueue: () => post("/api/aranllm/queue/pause", {}),
        resumeQueue: () => post("/api/aranllm/queue/resume", {}),
        removeQueueItem: (repoId, file) => post("/api/aranllm/queue/remove", { repoId, file }),
        /*
         * The proxy, and the one honest difference from the desktop.
         *
         * There, the setting reconfigured the session's network stack. Here it is
         * stored and reported, and the request that follows goes wherever the
         * environment sends it. `testConnection` is what makes that visible
         * rather than a setting that silently does nothing.
         */
        proxy: () => get("/api/aranllm/hub/proxy"),
        setProxy: (mode, url) => post("/api/aranllm/hub/proxy/set", { mode, url }),
        testConnection: () => post("/api/aranllm/hub/test", {}),
        /*
         * No separate window to open. Answered rather than refused, matching how
         * the browser build of this same bridge answers it: the caller renders a
         * button from this value, and `false` is the truth.
         */
        openDownloadsWindow: async () => ({ open: false }),
        /*
         * Progress, filtered to the states the desktop's channel could produce.
         *
         * ## Why `idle` is not delivered
         *
         * The desktop pushed this from a listener the module fires when a transfer
         * *changes*. A transfer that has never run is not a change, so `idle` never
         * arrived and the page never had to handle it — its render asks
         * `progress.kind !== 'done'` and labels anything left over as a failure.
         *
         * A poll cannot make that distinction on its own: the state route answers
         * `{ kind: 'idle' }` from the moment the page opens, and a subscription
         * faithfully delivers it. Measured, as a permanently visible red bar
         * reading 下载失败 on a machine that had downloaded nothing.
         *
         * So the filter lives here rather than in the component. It is what the
         * event channel did implicitly, and restoring it keeps the copied page
         * byte-identical to its original.
         */
        onDownload: (listener) => subscribe("/api/aranllm/download/state", (value) => {
          if (value === null || typeof value !== "object") return;
          if (value.kind === "idle") return;
          listener(value);
        }),
        onQueue: (listener) => subscribe("/api/aranllm/queue", listener)
      },
      shell: {
        /*
         * The clipboard, through the host's own writer.
         *
         * Passed in rather than reached for, because the host's helper is what
         * every other plugin uses and it handles the permission and the fallback
         * path for a page that cannot use `navigator.clipboard`.
         */
        copyText: (text) => {
          try {
            return Promise.resolve(writeClipboard(text));
          } catch (error) {
            return Promise.reject(error);
          }
        }
      }
    };
  }
  var writeClipboardLazy = (text) => {
    const writer = globalThis.__aranllmWriteClipboard;
    if (typeof writer !== "function") {
      throw new Error("aranllm-local: the clipboard writer was not installed");
    }
    return writer(text);
  };
  var bridge = createBridge(writeClipboardLazy);

  // ParameterPanel.tsx
  function withModelFacts(field, facts) {
    if (field.key === "contextLength" && facts.contextLimit) {
      return { ...field, defaultHint: `\u6700\u591A ${facts.contextLimit}` };
    }
    if (field.key === "gpuLayers" && facts.layerCount) {
      return { ...field, max: facts.layerCount };
    }
    return field;
  }
  var PRESETS = [
    {
      id: "fast",
      label: "\u5FEB",
      note: "\u4E0D\u601D\u8003\uFF0C\u56DE\u590D\u77ED\u3002\u9002\u5408\u95EE\u7B54\u548C\u6539\u5199\u3002",
      values: {
        enableThinking: false,
        limitResponseLength: true,
        maxTokens: 1024
      }
    },
    {
      id: "balanced",
      label: "\u5747\u8861",
      note: "\u601D\u8003\u4F46\u8BBE\u4E0A\u9650\uFF0C\u56DE\u590D\u957F\u5EA6\u9002\u4E2D\u3002\u9ED8\u8BA4\u63A8\u8350\u3002",
      values: {
        enableThinking: true,
        reasoningBudget: 2048,
        reasoningBudgetMessage: "\u591F\u4E86\uFF0C\u73B0\u5728\u76F4\u63A5\u7ED9\u51FA\u7ED3\u8BBA\u3002",
        limitResponseLength: true,
        maxTokens: 4096
      }
    },
    {
      id: "deep",
      label: "\u6DF1\u5165",
      note: "\u4E0D\u9650\u5236\u601D\u8003\u4E0E\u957F\u5EA6\u3002\u9002\u5408\u63A8\u7406\u548C\u957F\u6587\u3002",
      values: {
        enableThinking: true,
        reasoningBudget: -1,
        reasoningBudgetMessage: "",
        limitResponseLength: false
      }
    }
  ];
  function ParameterPanel({
    modelId,
    contextLimit,
    layerCount,
    onSaved
  }) {
    const [groups, setGroups] = useState([]);
    const [draft, setDraft] = useState({});
    const [saved, setSaved] = useState({});
    const [failure, setFailure] = useState(void 0);
    const [busy, setBusy] = useState(false);
    const [collapsed, setCollapsed] = useState({});
    const [estimate, setEstimate] = useState(void 0);
    const estimateInput = JSON.stringify({
      contextLength: draft["contextLength"],
      kvCacheType: draft["kvCacheTypeK"],
      gpuLayers: draft["gpuLayers"],
      flashAttention: draft["flashAttention"]
    });
    useEffect(() => {
      if (!modelId) return void 0;
      let cancelled = false;
      const timer = setTimeout(() => {
        void bridge.models.estimate({
          id: modelId,
          contextLength: numeric(draft["contextLength"]) ?? contextLimit,
          kvCacheType: typeof draft["kvCacheTypeK"] === "string" ? draft["kvCacheTypeK"] : void 0,
          gpuLayers: numeric(draft["gpuLayers"]),
          batchSize: numeric(draft["batchSize"]),
          flashAttention: draft["flashAttention"] === true
        }).then((answer) => {
          if (!cancelled) setEstimate(answer);
        }).catch(() => {
          if (!cancelled) setEstimate(void 0);
        });
      }, 150);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [modelId, estimateInput]);
    useEffect(() => {
      let cancelled = false;
      void Promise.all([bridge.models.parameters(), bridge.models.localConfig(modelId)]).then(([schema, values]) => {
        if (cancelled) return;
        setGroups(schema);
        setDraft(values);
        setSaved(values);
        setFailure(void 0);
      }).catch((cause) => {
        if (!cancelled) setFailure(cause instanceof Error ? cause.message : String(cause));
      });
      return () => {
        cancelled = true;
      };
    }, [modelId]);
    const set = useCallback((key, value) => {
      setDraft((current) => {
        const next = { ...current };
        if (value === void 0) delete next[key];
        else next[key] = value;
        return next;
      });
    }, []);
    const dirty = useMemo(
      () => JSON.stringify(draft) !== JSON.stringify(saved),
      [draft, saved]
    );
    const activePreset = useMemo(() => {
      for (let index = PRESETS.length - 1; index >= 0; index -= 1) {
        const preset = PRESETS[index];
        const matches = Object.entries(preset.values).every(([key, value]) => {
          const held = Object.hasOwn(draft, key) ? draft[key] : void 0;
          return JSON.stringify(held) === JSON.stringify(value);
        });
        if (matches) return preset.id;
      }
      return void 0;
    }, [draft]);
    const activeLabel = useMemo(
      () => PRESETS.find((preset) => preset.id === activePreset)?.label,
      [activePreset]
    );
    const save = useCallback(async () => {
      setBusy(true);
      setFailure(void 0);
      try {
        const payload = {};
        for (const group of groups) {
          for (const field of group.fields) {
            if (field.type === "readonly") continue;
            const now = Object.hasOwn(draft, field.key) ? draft[field.key] : null;
            const before = Object.hasOwn(saved, field.key) ? saved[field.key] : null;
            if (JSON.stringify(now) !== JSON.stringify(before)) payload[field.key] = now;
          }
        }
        const result = await bridge.models.setLocalConfig(modelId, payload);
        if (!result.ok) {
          setFailure(result.error);
          return;
        }
        setSaved(result.value);
        setDraft(result.value);
        onSaved?.();
      } catch (cause) {
        setFailure(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setBusy(false);
      }
    }, [draft, groups, modelId, onSaved]);
    const reset = useCallback(() => {
      setDraft(saved);
    }, [saved]);
    return /* @__PURE__ */ jsxs(Fragment2, { children: [
      failure ? /* @__PURE__ */ jsx("p", { className: "params__error", children: failure }) : null,
      /* @__PURE__ */ jsxs("section", { className: "params__estimate", "data-param-estimate": "true", children: [
        /* @__PURE__ */ jsx("span", { className: "params__estimate-label", children: "\u9884\u4F30\u5360\u7528" }),
        estimate === void 0 ? /* @__PURE__ */ jsx("span", { className: "params__estimate-value", children: "\u6B63\u5728\u4F30\u7B97\u2026" }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsxs("span", { className: "params__estimate-figures", "data-estimate-value": "true", children: [
            /* @__PURE__ */ jsxs("span", { className: "params__estimate-figure", children: [
              /* @__PURE__ */ jsx("b", { children: "\u663E\u5B58" }),
              sizeText(estimate.deviceBytes)
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "params__estimate-figure", children: [
              /* @__PURE__ */ jsx("b", { children: "\u5185\u5B58" }),
              sizeText(estimate.hostBytes)
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "params__estimate-figure", children: [
              /* @__PURE__ */ jsx("b", { children: "\u5C42" }),
              estimate.layersOnDevice ?? "\u2014"
            ] })
          ] }),
          estimate.kvBytes !== void 0 ? /* @__PURE__ */ jsx("span", { className: "params__estimate-kv", "data-estimate-kv": "true", children: `KV \u7F13\u5B58 ${sizeText(estimate.kvBytes)} \u2014\u2014 \u4E0A\u4E0B\u6587\u4E0E\u7F13\u5B58\u7C7B\u578B\u51B3\u5B9A\u5B83\uFF1B256K \u65F6\u5B83\u4F1A\u8D85\u8FC7\u6743\u91CD\u672C\u8EAB\u3002` }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "params__presets", "data-param-presets": "true", children: [
        /* @__PURE__ */ jsx("span", { className: "params__presets-label", children: "\u901F\u5EA6" }),
        PRESETS.map((preset) => {
          const active = preset.id === activePreset;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "params__preset",
              "data-preset": preset.id,
              "data-active": active ? "true" : "false",
              "aria-pressed": active,
              title: preset.note,
              onClick: () => {
                for (const [key, value] of Object.entries(preset.values)) set(key, value);
                const touched = new Set(
                  (groups ?? []).filter((group) => group.fields.some((field) => field.key in preset.values)).map((group) => group.id)
                );
                if (touched.size > 0) {
                  setCollapsed((current) => {
                    const next = { ...current };
                    for (const id of touched) delete next[id];
                    return next;
                  });
                }
              },
              children: [
                /* @__PURE__ */ jsx("span", { className: "params__preset-dot", "aria-hidden": "true" }),
                preset.label
              ]
            },
            preset.id
          );
        })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "params__presets-note", children: `${activeLabel === void 0 ? "\u5F53\u524D\u5B57\u6BB5\u4E0D\u5C5E\u4E8E\u4EFB\u4F55\u4E00\u4E2A\u9884\u8BBE" : `\u5F53\u524D\u662F\u300C${activeLabel}\u300D`}\u3002\u9884\u8BBE\u53EA\u6539\u4E0B\u9762\u7684\u5B57\u6BB5\uFF0C\u4ECD\u8981\u70B9\u300C\u4FDD\u5B58\u300D\u624D\u751F\u6548\u3002\u5B83\u4EEC\u4E0D\u89E3\u9501\u663E\u5361 \u2014\u2014 \u663E\u5B58\u5360\u7528\u4F4E\u662F 27B \u6A21\u578B\u9010\u5B57\u751F\u6210\u7684\u672C\u6765\u6837\u5B50\uFF1B\u6362\u4E00\u4E2A\u66F4\u5C0F\u7684\u6A21\u578B\u6BD4\u8C03\u4EFB\u4F55\u53C2\u6570\u90FD\u6709\u6548\u3002` }),
      groups.map((group) => {
        const open = collapsed[group.id] !== true;
        return /* @__PURE__ */ jsxs("section", { className: "params__group", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "params__group-head",
              "aria-expanded": open,
              onClick: () => setCollapsed((current) => ({ ...current, [group.id]: open })),
              children: [
                /* @__PURE__ */ jsx("span", { className: "params__chevron", "data-open": open ? "true" : void 0, children: "\u25B8" }),
                group.title
              ]
            }
          ),
          open ? /* @__PURE__ */ jsx("div", { className: "params__fields", children: group.fields.map((field) => /* @__PURE__ */ jsx(
            ParameterField,
            {
              field: withModelFacts(field, { contextLimit, layerCount }),
              value: draft[field.key],
              onChange: (value) => set(field.key, value)
            },
            field.key
          )) }) : null
        ] }, group.id);
      }),
      /* @__PURE__ */ jsxs("div", { className: "params__foot", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "params__action",
            onClick: reset,
            disabled: !dirty || busy,
            children: "\u64A4\u9500\u6539\u52A8"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "params__action",
            "data-tone": "primary",
            onClick: () => void save(),
            disabled: !dirty || busy,
            children: busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"
          }
        )
      ] })
    ] });
  }
  function numeric(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0) return void 0;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : void 0;
    }
    return void 0;
  }
  function sizeText(bytes2) {
    if (bytes2 === void 0 || !Number.isFinite(bytes2)) return "\u2014";
    const gb = bytes2 / 1024 ** 3;
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes2 / 1024 ** 2;
    if (mb >= 1) return `${mb.toFixed(0)} MB`;
    return `${(bytes2 / 1024).toFixed(0)} KB`;
  }

  // LocalModels.tsx
  var PHASE_LABEL = {
    opening: "\u6253\u5F00\u6A21\u578B\u6587\u4EF6",
    verifying: "\u6821\u9A8C\u6587\u4EF6\u5934",
    reading: "\u8BFB\u53D6\u6743\u91CD",
    initializing: "\u521D\u59CB\u5316\u63A8\u7406\u5F15\u64CE",
    ready: "\u5C31\u7EEA"
  };
  var POLL_MS2 = 1e3;
  function seconds(ms) {
    const total = Math.floor(ms / 1e3);
    const minutes = Math.floor(total / 60);
    return minutes > 0 ? `${minutes} \u5206 ${total % 60} \u79D2` : `${total} \u79D2`;
  }
  function gigabytes(bytes2) {
    const gb = bytes2 / 1024 ** 3;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes2 / 1024 ** 2;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${String(Math.max(1, Math.round(bytes2 / 1024)))} KB`;
  }
  function describe(model) {
    const parts = [];
    if (model.architecture) parts.push(model.architecture);
    if (model.sizeLabel) parts.push(model.sizeLabel);
    if (model.quantization) parts.push(model.quantization);
    parts.push(model.humanSize);
    if (model.contextLength) parts.push(`\u4E0A\u4E0B\u6587\u4E0A\u9650 ${Math.round(model.contextLength / 1024)}K`);
    return parts.join(" \xB7 ");
  }
  function LocalModels() {
    const [snapshot, setSnapshot] = useState(void 0);
    const [failure, setFailure] = useState(void 0);
    const [busyId, setBusyId] = useState(void 0);
    const [cancellingLoad, setCancellingLoad] = useState(false);
    const [importing, setImporting] = useState(false);
    const [notice, setNotice] = useState(void 0);
    const [libraries, setLibraries] = useState([]);
    const [pendingMove, setPendingMove] = useState(void 0);
    const [moving, setMoving] = useState(false);
    const [tuning, setTuning] = useState(void 0);
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("name");
    const [detail, setDetail] = useState(void 0);
    const [removing, setRemoving] = useState(void 0);
    const [removeBusy, setRemoveBusy] = useState(false);
    const [removeNote, setRemoveNote] = useState(void 0);
    const [port, setPort] = useState(void 0);
    const [logLines, setLogLines] = useState([]);
    const [memory, setMemory] = useState(void 0);
    const [stats, setStats] = useState(void 0);
    const [editingPort, setEditingPort] = useState(void 0);
    const [copied, setCopied] = useState(void 0);
    const [apiKey, setApiKey] = useState("");
    const [keyVisible, setKeyVisible] = useState(false);
    const [gatewayRunning, setGatewayRunning] = useState(false);
    const [gatewayBusy, setGatewayBusy] = useState(false);
    const [gatewayNote, setGatewayNote] = useState(void 0);
    useEffect(() => {
      void bridge.models.port().then(setPort).catch(() => void 0);
      void bridge.models.gateway().then((state) => {
        setApiKey(typeof state?.settings?.apiKey === "string" ? state.settings.apiKey : "");
        setGatewayRunning(state?.running === true);
      }).catch(() => void 0);
    }, []);
    const saveGateway = async () => {
      setGatewayBusy(true);
      setGatewayNote(void 0);
      try {
        const state = await bridge.models.applyGateway({
          enabled: true,
          port: port ?? 11434,
          apiKey
        });
        setGatewayRunning(state?.running === true);
        setGatewayNote(
          state?.error ? `\u542F\u52A8\u5931\u8D25\uFF1A${state.error}` : `\u5DF2\u4FDD\u5B58\u3002\u5BA2\u6237\u7AEF\u8BF7\u628A Key \u586B\u6210\u4E0A\u9762\u8FD9\u4E2A\uFF08\u672C\u5730\u5730\u5740 127.0.0.1:${String(state?.port ?? port ?? "")}\uFF09\u3002`
        );
      } catch (cause) {
        setGatewayNote(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setGatewayBusy(false);
      }
    };
    const copyAddress = useCallback(async (which, value) => {
      try {
        await bridge.shell.copyText(value);
        setCopied(which);
        window.setTimeout(() => setCopied((current) => current === which ? void 0 : current), 1600);
      } catch {
        setNotice("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D\u5730\u5740\u590D\u5236\u3002");
      }
    }, []);
    const loading = useRef(false);
    const read = useCallback(async () => {
      try {
        setSnapshot(await bridge.models.localCatalog());
        setFailure(void 0);
      } catch (cause) {
        setFailure(cause instanceof Error ? cause.message : String(cause));
      }
    }, []);
    useEffect(() => {
      void read();
    }, [read]);
    const active = snapshot?.progress !== void 0 || busyId !== void 0;
    useEffect(() => {
      loading.current = active;
      if (!active) return;
      const timer = window.setInterval(() => void read(), POLL_MS2);
      return () => window.clearInterval(timer);
    }, [active, read]);
    const load = useCallback(
      async (modelId) => {
        setBusyId(modelId);
        setNotice(void 0);
        try {
          const result = await bridge.models.loadLocal(modelId);
          if (!result.ok) setNotice(result.error);
          await read();
        } catch (cause) {
          setNotice(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setBusyId(void 0);
        }
      },
      [read]
    );
    const unload = useCallback(async () => {
      setNotice(void 0);
      try {
        await bridge.models.unloadLocal();
        await read();
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : String(cause));
      }
    }, [read]);
    const readLibraries = useCallback(async () => {
      try {
        const answer = await bridge.models.library();
        setLibraries(Array.isArray(answer?.roots) ? answer.roots : []);
      } catch {
      }
    }, []);
    useEffect(() => {
      void readLibraries();
    }, [readLibraries]);
    const chooseRoot = useCallback(async () => {
      setNotice(void 0);
      try {
        const picked = await bridge.models.chooseDirectory(libraries[0]);
        if (!picked) return;
        const preview = await bridge.models.previewMove(picked);
        if (preview.blocked) {
          setNotice(preview.blocked);
          return;
        }
        setPendingMove({ to: picked, preview });
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : String(cause));
      }
    }, [libraries]);
    const addRoot = useCallback(async () => {
      setNotice(void 0);
      try {
        const picked = await bridge.models.chooseDirectory(libraries[0]);
        if (!picked) return;
        if (libraries.some((root) => root.toLowerCase() === picked.toLowerCase())) {
          setNotice("\u8FD9\u4E2A\u76EE\u5F55\u5DF2\u7ECF\u5728\u6A21\u578B\u5E93\u91CC\u4E86\u3002");
          return;
        }
        const result = await bridge.models.setLocalRoot([...libraries, picked].join(";"));
        if (!result.ok) {
          setNotice(result.error);
          return;
        }
        setSnapshot(result.value);
        await readLibraries();
      } catch (cause) {
        setNotice(cause instanceof Error ? cause.message : String(cause));
      }
    }, [libraries, readLibraries]);
    const removeRoot = useCallback(
      async (root) => {
        setNotice(void 0);
        try {
          const remaining = libraries.filter((entry) => entry !== root);
          const result = await bridge.models.setLocalRoot(remaining.join(";"));
          if (!result.ok) {
            setNotice(result.error);
            return;
          }
          setSnapshot(result.value);
          await readLibraries();
        } catch (cause) {
          setNotice(cause instanceof Error ? cause.message : String(cause));
        }
      },
      [libraries, readLibraries]
    );
    const confirmMove = useCallback(
      async (keepOld) => {
        const pending = pendingMove;
        if (!pending) return;
        setPendingMove(void 0);
        setMoving(true);
        setNotice(void 0);
        try {
          const result = await bridge.models.moveLibrary(pending.to, keepOld);
          if (!result.ok) {
            setNotice(result.error ?? "\u76EE\u5F55\u5207\u6362\u5931\u8D25\u3002");
            return;
          }
          await read();
          await readLibraries();
          if (result.skipped && result.skipped.length > 0) {
            setNotice(`\u6709 ${String(result.skipped.length)} \u4E2A\u6587\u4EF6\u6CA1\u80FD\u79FB\u52A8\uFF0C\u5B83\u4EEC\u4ECD\u5728\u539F\u76EE\u5F55\u3002`);
          }
        } catch (cause) {
          setNotice(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setMoving(false);
        }
      },
      [pendingMove, read, readLibraries]
    );
    const loaded = snapshot?.loaded;
    const progress = snapshot?.progress;
    useEffect(() => {
      if (!loaded) {
        setMemory(void 0);
        return void 0;
      }
      void bridge.models.memory().then(setMemory).catch(() => void 0);
      return void 0;
    }, [loaded]);
    useEffect(() => {
      if (!loaded) {
        setStats(void 0);
        return void 0;
      }
      let cancelled = false;
      const read2 = () => {
        void bridge.models.stats().then((value) => {
          if (!cancelled) setStats(value);
        }).catch(() => void 0);
      };
      read2();
      const timer = window.setInterval(read2, 2e3);
      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    }, [loaded]);
    useEffect(() => {
      if (busyId === void 0 && !progress) {
        setLogLines([]);
        return void 0;
      }
      let cancelled = false;
      const read2 = () => {
        void bridge.models.log(120).then((lines) => {
          if (!cancelled) setLogLines(lines);
        }).catch(() => void 0);
      };
      read2();
      const timer = window.setInterval(read2, 1500);
      return () => {
        cancelled = true;
        window.clearInterval(timer);
      };
    }, [progress, busyId]);
    const binary = snapshot?.binary;
    const modelName = snapshot?.models.find((entry) => entry.id === tuning)?.name;
    const shown = useMemo(() => {
      const models = snapshot?.models ?? [];
      const needle = query.trim().toLowerCase();
      const filtered = needle.length === 0 ? models : models.filter(
        (model) => model.name.toLowerCase().includes(needle) || model.id.toLowerCase().includes(needle) || (model.architecture ?? "").toLowerCase().includes(needle) || (model.quantization ?? "").toLowerCase().includes(needle)
      );
      const sorted = [...filtered];
      if (sort === "size") sorted.sort((a, b) => b.bytes - a.bytes);
      else if (sort === "context") sorted.sort((a, b) => (b.contextLength ?? 0) - (a.contextLength ?? 0));
      else sorted.sort((a, b) => a.name.localeCompare(b.name));
      return sorted;
    }, [snapshot, query, sort]);
    return /* @__PURE__ */ jsxs("div", { className: "local-models", children: [
      /* @__PURE__ */ jsxs("header", { className: "local-models__head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "local-models__title", children: "\u672C\u5730\u6A21\u578B" }),
          /* @__PURE__ */ jsx("p", { className: "local-models__hint", children: "\u5728\u8FD9\u91CC\u7684\u6A21\u578B\u7531\u672C\u673A\u8FD0\u884C\uFF0C\u901F\u5EA6\u53D6\u51B3\u4E8E\u663E\u5361\uFF0C\u4E0E\u7F51\u7EDC\u65E0\u5173\u3002\u52A0\u8F7D\u7531\u4F60\u624B\u52A8\u89E6\u53D1\uFF0C \u6253\u5F00\u5E94\u7528\u4E0D\u4F1A\u81EA\u52A8\u52A0\u8F7D\u3002" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "local-models__head-actions", children: [
          loaded ? /* @__PURE__ */ jsxs("button", { type: "button", className: "local-models__action", onClick: () => void unload(), children: [
            /* @__PURE__ */ jsx(Icon, { name: "circle-ban-sign", size: "small" }),
            "\u5378\u8F7D"
          ] }) : null,
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "local-models__action",
              "data-tone": "quiet",
              disabled: importing,
              onClick: () => {
                setImporting(true);
                setNotice(void 0);
                void bridge.models.importModel().then((answer) => {
                  if (answer.ok) {
                    setNotice(`\u5DF2\u5BFC\u5165 ${answer.publisher}/${answer.model}`);
                    return read();
                  }
                  if (answer.cancelled !== true) setNotice(answer.error ?? "\u5BFC\u5165\u5931\u8D25\u3002");
                  return void 0;
                }).catch((cause) => {
                  setNotice(cause instanceof Error ? cause.message : "\u5BFC\u5165\u5931\u8D25\u3002");
                }).finally(() => setImporting(false));
              },
              children: [
                /* @__PURE__ */ jsx(Icon, { name: "cloud-upload", size: "small" }),
                importing ? "\u5BFC\u5165\u4E2D\u2026" : "\u5BFC\u5165"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "local-models__action",
              "data-tone": "quiet",
              onClick: () => void read(),
              disabled: active,
              children: [
                /* @__PURE__ */ jsx(Icon, { name: "magnifying-glass", size: "small" }),
                "\u91CD\u65B0\u626B\u63CF"
              ]
            }
          )
        ] })
      ] }),
      failure ? /* @__PURE__ */ jsx("p", { className: "local-models__error", children: failure }) : null,
      notice ? /* @__PURE__ */ jsx("p", { className: "local-models__error", children: notice }) : null,
      removeNote ? /* @__PURE__ */ jsxs("p", { className: "local-models__error", children: [
        "\u5220\u9664\u5931\u8D25\uFF1A",
        removeNote
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "local-models__address", children: [
        /* @__PURE__ */ jsx(Icon, { name: "server", size: "small" }),
        editingPort !== void 0 ? /* @__PURE__ */ jsxs(
          "form",
          {
            className: "local-models__address-form",
            onSubmit: (event) => {
              event.preventDefault();
              const raw = editingPort.trim();
              const next = Number(raw.includes(":") ? raw.split(":").pop() ?? "" : raw);
              setEditingPort(void 0);
              void bridge.models.setPort(next).then((r) => {
                setPort(r.port);
                setNotice(r.ok ? `\u670D\u52A1\u5730\u5740\u5DF2\u6539\u4E3A 127.0.0.1:${String(r.port)}\uFF0C\u5185\u6838\u6B63\u5728\u91CD\u542F\u3002` : r.error);
              });
            },
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  className: "local-models__address-input",
                  value: editingPort,
                  autoFocus: true,
                  spellCheck: false,
                  "aria-label": "\u670D\u52A1\u5730\u5740",
                  onChange: (event) => setEditingPort(event.target.value)
                }
              ),
              /* @__PURE__ */ jsx("button", { type: "submit", className: "local-models__action", children: "\u4FDD\u5B58" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "local-models__action",
                  "data-tone": "quiet",
                  onClick: () => setEditingPort(void 0),
                  children: "\u53D6\u6D88"
                }
              )
            ]
          }
        ) : /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsxs("code", { className: "local-models__address-value", children: [
            "127.0.0.1:",
            port ?? "\u2026"
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "local-models__action",
              "data-tone": "quiet",
              title: "\u6A21\u578B\u670D\u52A1\u76D1\u542C\u7684\u5730\u5740\uFF0C\u6539\u52A8\u4F1A\u91CD\u542F\u5185\u6838",
              onClick: () => setEditingPort(port !== void 0 ? `127.0.0.1:${String(port)}` : ""),
              children: "\u4FEE\u6539"
            }
          ),
          port !== void 0 ? /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "local-models__action",
                "data-tone": "quiet",
                title: copied === "openai" ? "\u5DF2\u590D\u5236" : "\u590D\u5236 OpenAI \u517C\u5BB9\u5730\u5740\uFF08\u542B /v1\uFF09",
                onClick: () => void copyAddress("openai", `http://127.0.0.1:${String(port)}/v1`),
                children: [
                  /* @__PURE__ */ jsx(Icon, { name: "copy", size: "small" }),
                  copied === "openai" ? "\u5DF2\u590D\u5236" : "OpenAI"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                className: "local-models__action",
                "data-tone": "quiet",
                title: copied === "claude" ? "\u5DF2\u590D\u5236" : "\u590D\u5236 Claude \u517C\u5BB9\u5730\u5740\uFF08\u4E0D\u542B /v1\uFF09",
                onClick: () => void copyAddress("claude", `http://127.0.0.1:${String(port)}`),
                children: [
                  /* @__PURE__ */ jsx(Icon, { name: "copy", size: "small" }),
                  copied === "claude" ? "\u5DF2\u590D\u5236" : "Claude"
                ]
              }
            )
          ] }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "local-models__address local-models__gateway", "data-gateway-settings": "true", children: [
        /* @__PURE__ */ jsx(Icon, { name: "settings-gear", size: "small" }),
        /* @__PURE__ */ jsx("span", { className: "local-models__address-label", children: "API Key" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            className: "local-models__address-input",
            type: keyVisible ? "text" : "password",
            value: apiKey,
            spellCheck: false,
            autoComplete: "off",
            placeholder: "\u7559\u7A7A\u8868\u793A\u4E0D\u6821\u9A8C",
            "aria-label": "API Key",
            "data-api-key": "true",
            onChange: (event) => setApiKey(event.target.value)
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "local-models__action",
            "data-tone": "quiet",
            title: keyVisible ? "\u9690\u85CF" : "\u663E\u793A",
            "aria-pressed": keyVisible,
            "data-key-visible": keyVisible ? "true" : "false",
            onClick: () => setKeyVisible((current) => !current),
            children: [
              /* @__PURE__ */ jsx(Icon, { name: keyVisible ? "eye-off" : "eye", size: "small" }),
              keyVisible ? "\u9690\u85CF" : "\u663E\u793A"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "local-models__action",
            disabled: gatewayBusy,
            "data-gateway-save": "true",
            onClick: () => void saveGateway(),
            children: gatewayBusy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "local-models__address-note", children: gatewayNote ?? (gatewayRunning ? "\u670D\u52A1\u6B63\u5728\u8FD0\u884C\u3002" : "\u4FDD\u5B58\u540E\u4F1A\u542F\u52A8\u670D\u52A1\uFF0C\u5BA2\u6237\u7AEF\u9700\u8981\u5E26\u4E0A\u8FD9\u4E2A Key\u3002") })
      ] }),
      snapshot && !binary ? /* @__PURE__ */ jsxs("p", { className: "local-models__error", children: [
        "\u6CA1\u6709\u627E\u5230 llama-server\u3002\u8BF7\u628A\u5B83\u653E\u8FDB\u6A21\u578B\u76EE\u5F55\uFF0C\u6216\u8BBE\u7F6E ",
        /* @__PURE__ */ jsx("code", { children: "LLAMA_SERVER" }),
        " \u6307\u5411\u5B83\u3002"
      ] }) : null,
      /* @__PURE__ */ jsxs("section", { className: "local-models__section", children: [
        /* @__PURE__ */ jsx("h2", { className: "local-models__section-title", children: "\u6A21\u578B\u5E93" }),
        /* @__PURE__ */ jsxs("ul", { className: "local-models__roots", children: [
          libraries.map((root, index) => /* @__PURE__ */ jsxs("li", { className: "local-models__root", children: [
            /* @__PURE__ */ jsx("code", { className: "local-models__root-path", title: root, children: root }),
            index === 0 ? /* @__PURE__ */ jsx("span", { className: "local-models__root-tag", children: "\u4E3B\u5E93" }) : null,
            libraries.length > 1 && index > 0 ? /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "local-models__action",
                "data-tone": "quiet",
                title: "\u4E0D\u518D\u8BFB\u53D6\u8FD9\u4E2A\u76EE\u5F55\u91CC\u7684\u6A21\u578B",
                onClick: () => void removeRoot(root),
                children: "\u79FB\u9664"
              }
            ) : null
          ] }, root)),
          libraries.length === 0 ? /* @__PURE__ */ jsx("li", { className: "local-models__root", children: "\uFF08\u672A\u8BBE\u7F6E\uFF09" }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "local-models__root-actions", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "local-models__action",
              disabled: moving,
              onClick: () => void chooseRoot(),
              children: [
                /* @__PURE__ */ jsx(Icon, { name: "folder-add-left", size: "small" }),
                moving ? "\u6B63\u5728\u8FC1\u79FB\u2026" : "\u66F4\u6362\u6587\u4EF6\u5939"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "local-models__action",
              "data-tone": "quiet",
              disabled: moving,
              onClick: () => void addRoot(),
              children: "\u6DFB\u52A0\u526F\u5E93"
            }
          )
        ] }),
        pendingMove ? /* @__PURE__ */ jsxs("div", { className: "local-models__move", role: "alertdialog", "aria-label": "\u8FC1\u79FB\u6A21\u578B", children: [
          /* @__PURE__ */ jsxs("p", { className: "local-models__move-title", children: [
            "\u65B0\u76EE\u5F55\uFF1A",
            /* @__PURE__ */ jsx("code", { children: pendingMove.to })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "local-models__move-body", children: pendingMove.preview.files > 0 ? /* @__PURE__ */ jsxs(Fragment2, { children: [
            "\u5F53\u524D\u5E93\u91CC\u6709 ",
            String(pendingMove.preview.files),
            " \u4E2A\u6A21\u578B\u6587\u4EF6\uFF0C \u5171 ",
            gigabytes(pendingMove.preview.bytes),
            "\u3002 \u8981\u628A\u5B83\u4EEC\u8FC1\u79FB\u5230\u65B0\u76EE\u5F55\u5417\uFF1F"
          ] }) : /* @__PURE__ */ jsx(Fragment2, { children: "\u5F53\u524D\u5E93\u91CC\u6CA1\u6709\u6A21\u578B\u6587\u4EF6\uFF0C\u53EF\u4EE5\u76F4\u63A5\u5207\u6362\u3002" }) }),
          pendingMove.preview.sample.length > 0 ? /* @__PURE__ */ jsxs("p", { className: "local-models__move-sample", children: [
            pendingMove.preview.sample.slice(0, 2).join("\u3001"),
            pendingMove.preview.files > 2 ? ` \u7B49 ${String(pendingMove.preview.files)} \u4E2A` : ""
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "local-models__move-actions", children: [
            pendingMove.preview.files > 0 ? /* @__PURE__ */ jsxs(Fragment2, { children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "local-models__action",
                  onClick: () => void confirmMove(false),
                  children: "\u8FC1\u79FB\u8FC7\u53BB"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "local-models__action",
                  "data-tone": "quiet",
                  onClick: () => void confirmMove(true),
                  children: "\u4E0D\u8FC1\u79FB\uFF0C\u4FDD\u7559\u539F\u76EE\u5F55"
                }
              )
            ] }) : /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "local-models__action",
                onClick: () => void confirmMove(true),
                children: "\u5207\u6362"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "local-models__action",
                "data-tone": "quiet",
                onClick: () => setPendingMove(void 0),
                children: "\u53D6\u6D88"
              }
            )
          ] }),
          pendingMove.preview.files > 0 ? /* @__PURE__ */ jsx("p", { className: "local-models__move-note", children: "\u4E0D\u8FC1\u79FB\u7684\u8BDD\uFF0C\u539F\u76EE\u5F55\u4F1A\u4F5C\u4E3A\u526F\u5E93\u7EE7\u7EED\u8BFB\u53D6\uFF0C\u4E24\u4E2A\u76EE\u5F55\u7684\u6A21\u578B\u90FD\u4F1A\u51FA\u73B0\u5728\u4E0B\u9762\u7684\u5217\u8868\u91CC\u3002" }) : null
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "local-models__section", children: [
        /* @__PURE__ */ jsxs("div", { className: "local-models__section-head", children: [
          /* @__PURE__ */ jsx("h2", { className: "local-models__section-title", children: "\u53EF\u7528\u6A21\u578B" }),
          snapshot && snapshot.models.length > 0 ? /* @__PURE__ */ jsx("span", { className: "local-models__count", children: query.trim().length > 0 ? `${shown.length} / ${snapshot.models.length} \u4E2A` : `${snapshot.models.length} \u4E2A` }) : null
        ] }),
        snapshot && snapshot.models.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "local-models__toolbar", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              className: "local-models__search",
              placeholder: "\u641C\u7D22\u540D\u79F0\u3001\u67B6\u6784\u6216\u91CF\u5316",
              "aria-label": "\u641C\u7D22\u6A21\u578B",
              value: query,
              spellCheck: false,
              onChange: (event) => setQuery(event.target.value)
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "local-models__sort", role: "radiogroup", "aria-label": "\u6392\u5E8F\u65B9\u5F0F", children: [
            ["name", "\u540D\u79F0"],
            ["size", "\u5927\u5C0F"],
            ["context", "\u4E0A\u4E0B\u6587"]
          ].map(([value, label]) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              role: "radio",
              "aria-checked": sort === value,
              className: "local-models__sort-item",
              "data-active": sort === value ? "true" : void 0,
              onClick: () => setSort(value),
              children: label
            },
            value
          )) })
        ] }) : null,
        query.trim().length > 0 && shown.length === 0 ? /* @__PURE__ */ jsx("p", { className: "local-models__empty", children: "\u6CA1\u6709\u5339\u914D\u7684\u6A21\u578B\u3002" }) : null,
        progress ? /* @__PURE__ */ jsxs("div", { className: "local-models__progress", children: [
          /* @__PURE__ */ jsxs("div", { className: "local-models__progress-line", children: [
            /* @__PURE__ */ jsx("span", { className: "local-models__progress-name", children: progress.modelName }),
            /* @__PURE__ */ jsxs("span", { className: "local-models__progress-phase", children: [
              PHASE_LABEL[progress.phase] ?? progress.phase,
              progress.phaseDetail ? ` \xB7 ${progress.phaseDetail}` : ""
            ] }),
            /* @__PURE__ */ jsx("span", { className: "local-models__progress-time", children: seconds(progress.elapsedMs) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "local-models__progress-cancel",
                disabled: cancellingLoad,
                onClick: () => {
                  setCancellingLoad(true);
                  void bridge.models.unloadLocal().catch(() => void 0).finally(() => setCancellingLoad(false));
                },
                children: cancellingLoad ? "\u6B63\u5728\u505C\u6B62\u2026" : "\u505C\u6B62\u52A0\u8F7D"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "local-models__bar", role: "progressbar", "aria-valuenow": progress.progress, children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "local-models__bar-fill",
              style: { width: `${Math.round(progress.progress * 100)}%` }
            }
          ) })
        ] }) : null,
        logLines.length > 0 ? /* @__PURE__ */ jsxs("details", { className: "local-models__log", open: true, children: [
          /* @__PURE__ */ jsxs("summary", { className: "local-models__log-head", children: [
            "\u52A0\u8F7D\u65E5\u5FD7\uFF08",
            logLines.length,
            " \u884C\uFF09"
          ] }),
          /* @__PURE__ */ jsx("pre", { className: "local-models__log-body", ref: (el) => el?.scrollTo(0, el.scrollHeight), children: logLines.join("\n") })
        ] }) : null,
        stats ? /* @__PURE__ */ jsxs("div", { className: "local-models__stats", children: [
          stats.predictedTokens === 0 && stats.promptTokens === 0 && stats.requestsProcessing === 0 ? /* @__PURE__ */ jsx("span", { className: "local-models__stat", children: "\u8FD8\u6CA1\u6709\u8BF7\u6C42\u7ECF\u8FC7\u8FD9\u4E2A\u6A21\u578B\u3002" }) : null,
          stats.predictedTokens > 0 ? /* @__PURE__ */ jsxs("span", { className: "local-models__stat", children: [
            "\u751F\u6210",
            " ",
            /* @__PURE__ */ jsx("strong", { children: (stats.predictedTokens / Math.max(stats.predictedSeconds, 1e-3)).toFixed(1) }),
            " ",
            "tok/s"
          ] }) : null,
          stats.promptTokens + stats.cachedTokens > 0 ? /* @__PURE__ */ jsxs("span", { className: "local-models__stat", children: [
            "\u63D0\u793A\u8BCD ",
            /* @__PURE__ */ jsx("strong", { children: stats.promptTokens + stats.cachedTokens }),
            " token",
            stats.cachedTokens > 0 ? `\uFF08\u7F13\u5B58\u590D\u7528 ${stats.cachedTokens}\uFF09` : ""
          ] }) : null,
          stats.draftTokens > 0 ? /* @__PURE__ */ jsxs("span", { className: "local-models__stat", children: [
            "\u63A8\u6D4B\u63A5\u53D7\u7387",
            " ",
            /* @__PURE__ */ jsxs("strong", { children: [
              (stats.acceptedTokens / stats.draftTokens * 100).toFixed(0),
              "%"
            ] }),
            "\uFF08",
            stats.acceptedTokens,
            "/",
            stats.draftTokens,
            "\uFF09"
          ] }) : null,
          stats.requestsDeferred > 0 ? /* @__PURE__ */ jsxs("span", { className: "local-models__stat", "data-warn": "true", children: [
            "\u6392\u961F\u8BF7\u6C42 ",
            stats.requestsDeferred
          ] }) : null
        ] }) : null,
        memory ? /* @__PURE__ */ jsxs("div", { className: "local-models__memory", children: [
          /* @__PURE__ */ jsxs("span", { className: "local-models__stat", children: [
            "\u663E\u5B58 ",
            /* @__PURE__ */ jsx("strong", { children: memory.projectedMiB }),
            " MiB / \u53EF\u7528 ",
            memory.freeMiB,
            " MiB \uFF0C\u5269\u4F59 ",
            /* @__PURE__ */ jsx("strong", { children: memory.remainingMiB }),
            " MiB",
            memory.targetMiB > 0 ? `\uFF08\u4FDD\u7559 ${memory.targetMiB}\uFF09` : ""
          ] }),
          memory.device ? /* @__PURE__ */ jsx("span", { className: "local-models__stat", children: memory.device }) : null,
          !memory.fits ? /* @__PURE__ */ jsx("span", { className: "local-models__stat", "data-warn": "true", children: "\u5F15\u64CE\u8C03\u6574\u4E86\u52A0\u8F7D\u53C2\u6570\u624D\u88C5\u4E0B\uFF0C\u53EF\u51CF\u5C0F\u4E0A\u4E0B\u6587\u6216\u5378\u8F7D\u5C42\u6570\u7559\u51FA\u4F59\u91CF" }) : null
        ] }) : null,
        loaded ? /* @__PURE__ */ jsxs("div", { className: "local-models__running", children: [
          /* @__PURE__ */ jsx(Icon, { name: "circle-check", size: "small" }),
          /* @__PURE__ */ jsx("span", { className: "local-models__running-name", children: loaded.modelName }),
          /* @__PURE__ */ jsx("code", { className: "local-models__running-url", children: loaded.baseURL }),
          loaded.contextLength ? /* @__PURE__ */ jsxs("span", { className: "local-models__running-meta", children: [
            "\u4E0A\u4E0B\u6587 ",
            Math.round(loaded.contextLength / 1024),
            "K"
          ] }) : null,
          loaded.multimodal ? /* @__PURE__ */ jsx("span", { className: "local-models__tag", "data-tone": "vision", children: "\u652F\u6301\u56FE\u7247" }) : null
        ] }) : null,
        snapshot === void 0 ? /* @__PURE__ */ jsx("p", { className: "local-models__empty", children: "\u6B63\u5728\u626B\u63CF\u2026" }) : snapshot.models.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "local-models__empty", children: [
          "\u8FD9\u4E2A\u76EE\u5F55\u91CC\u6CA1\u6709\u627E\u5230 GGUF \u6A21\u578B\u3002\u628A ",
          /* @__PURE__ */ jsx("code", { children: ".gguf" }),
          " \u6587\u4EF6\u653E\u8FDB\u53BB\uFF0C\u518D\u70B9\u300C\u91CD\u65B0\u626B\u63CF\u300D\u3002"
        ] }) : /* @__PURE__ */ jsx("ul", { className: "local-models__list", children: shown.map((model) => {
          const isLoaded = loaded?.modelId === model.id;
          const isLoading = progress?.modelId === model.id;
          const isTuning = tuning === model.id;
          return /* @__PURE__ */ jsxs(
            "li",
            {
              className: "local-models__item",
              "data-loaded": isLoaded ? "true" : void 0,
              "data-loading": isLoading ? "true" : void 0,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "local-models__item-main", children: [
                  /* @__PURE__ */ jsxs("div", { className: "local-models__item-name", children: [
                    model.name,
                    model.multimodal ? /* @__PURE__ */ jsx("span", { className: "local-models__tag", "data-tone": "vision", children: "\u56FE\u7247" }) : null,
                    model.hasMtp ? /* @__PURE__ */ jsx("span", { className: "local-models__tag", "data-tone": "mtp", children: "MTP" }) : null
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "local-models__item-meta", children: describe(model) }),
                  /* @__PURE__ */ jsx("div", { className: "local-models__item-path", children: model.path })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "local-models__action",
                    "data-tone": "quiet",
                    onClick: () => setDetail(model.id),
                    children: "\u8BE6\u60C5"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "local-models__action",
                    "data-tone": "quiet",
                    title: "\u79FB\u5230\u56DE\u6536\u7AD9",
                    onClick: () => {
                      setRemoveNote(void 0);
                      setRemoving(model.id);
                    },
                    children: "\u5220\u9664"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "local-models__action",
                    "data-tone": "quiet",
                    "aria-expanded": isTuning,
                    onClick: () => setTuning(isTuning ? void 0 : model.id),
                    children: "\u53C2\u6570"
                  }
                ),
                isLoaded ? /* @__PURE__ */ jsx("span", { className: "local-models__item-state", children: "\u5DF2\u52A0\u8F7D" }) : isLoading ? /* @__PURE__ */ jsx("span", { className: "local-models__item-state", children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "local-models__action",
                    disabled: busyId !== void 0,
                    onClick: () => void load(model.id),
                    children: busyId === model.id ? "\u6B63\u5728\u542F\u52A8\u2026" : "\u52A0\u8F7D"
                  }
                )
              ]
            },
            model.id
          );
        }) })
      ] }),
      loaded ? /* @__PURE__ */ jsxs("p", { className: "local-models__foot", children: [
        "\u8FD9\u4E2A\u6A21\u578B\u5DF2\u767B\u8BB0\u5230\u5185\u6838\u7684 ",
        /* @__PURE__ */ jsx("code", { children: "provider.local" }),
        " \u6765\u6E90\uFF0C\u53EF\u4EE5\u5728\u65B0\u5EFA\u4EFB\u52A1\u65F6\u9009\u62E9\u3002"
      ] }) : null,
      /* @__PURE__ */ jsx(
        Modal,
        {
          open: tuning !== void 0,
          size: "form",
          title: `\u52A0\u8F7D\u53C2\u6570 \xB7 ${modelName ?? ""}`,
          onClose: () => setTuning(void 0),
          children: tuning ? /* @__PURE__ */ jsx(
            ParameterPanel,
            {
              modelId: tuning,
              ...(() => {
                const entry = snapshot?.models.find((m) => m.id === tuning);
                return {
                  ...entry?.contextLength ? { contextLimit: entry.contextLength } : {},
                  ...entry?.blockCount ? { layerCount: entry.blockCount } : {}
                };
              })(),
              onSaved: () => setNotice("\u53C2\u6570\u5DF2\u4FDD\u5B58\uFF0C\u4E0B\u6B21\u52A0\u8F7D\u65F6\u751F\u6548\u3002")
            }
          ) : null
        }
      ),
      /* @__PURE__ */ jsx(
        Modal,
        {
          open: detail !== void 0,
          title: "\u6A21\u578B\u8BE6\u60C5",
          size: "form",
          onClose: () => setDetail(void 0),
          actions: /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "modal__button",
              onClick: () => setDetail(void 0),
              children: "\u5173\u95ED"
            }
          ),
          children: (() => {
            const model = (snapshot?.models ?? []).find((entry) => entry.id === detail);
            if (!model) return /* @__PURE__ */ jsx("p", { className: "local-models__detail-note", children: "\u8FD9\u4E2A\u6A21\u578B\u5DF2\u4E0D\u5728\u5F53\u524D\u76EE\u5F55\u91CC\u3002" });
            const rows = [
              ["\u540D\u79F0", model.name],
              ["\u67B6\u6784", model.architecture || "\u672A\u77E5"],
              ["\u91CF\u5316", model.quantization || "\u672A\u77E5"],
              [
                "\u4E0A\u4E0B\u6587\u4E0A\u9650",
                model.contextLength ? `${model.contextLength.toLocaleString()}\uFF08${Math.round(model.contextLength / 1024)}K\uFF09` : "\u672A\u5728\u6587\u4EF6\u91CC\u58F0\u660E"
              ],
              ["\u5C42\u6570", model.blockCount ? String(model.blockCount) : "\u672A\u77E5"],
              ["\u6587\u4EF6\u5927\u5C0F", `${model.humanSize}\uFF08${model.bytes.toLocaleString()} \u5B57\u8282\uFF09`],
              ["\u591A\u6A21\u6001", model.multimodal ? "\u662F" : "\u5426"],
              ["MTP", model.hasMtp ? "\u652F\u6301" : "\u4E0D\u652F\u6301"],
              ["\u6587\u4EF6", model.path],
              ["\u76EE\u5F55", model.directory],
              ["\u6807\u8BC6", model.id]
            ];
            return /* @__PURE__ */ jsx("dl", { className: "local-models__detail", children: rows.map(([label, value]) => /* @__PURE__ */ jsxs("div", { className: "local-models__detail-row", children: [
              /* @__PURE__ */ jsx("dt", { children: label }),
              /* @__PURE__ */ jsx("dd", { children: value })
            ] }, label)) });
          })()
        }
      ),
      /* @__PURE__ */ jsx(
        Modal,
        {
          open: removing !== void 0,
          title: "\u5220\u9664\u6A21\u578B\u6587\u4EF6",
          onClose: () => setRemoving(void 0),
          actions: /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "modal__button",
                disabled: removeBusy,
                onClick: () => setRemoving(void 0),
                children: "\u53D6\u6D88"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "modal__button",
                "data-variant": "danger",
                disabled: removeBusy,
                onClick: () => {
                  const id = removing;
                  if (!id) return;
                  setRemoveBusy(true);
                  void bridge.models.removeFile(id).then((result) => {
                    setRemoving(void 0);
                    if (!result.ok) setRemoveNote(result.error);
                  }).finally(() => setRemoveBusy(false));
                },
                children: "\u79FB\u5230\u56DE\u6536\u7AD9"
              }
            )
          ] }),
          children: (() => {
            const model = (snapshot?.models ?? []).find((entry) => entry.id === removing);
            return /* @__PURE__ */ jsx("p", { className: "local-models__detail-note", children: model ? `\u300C${model.name}\u300D\u7684\u6587\u4EF6\uFF08${model.humanSize}\uFF09\u4F1A\u88AB\u79FB\u5230\u7CFB\u7EDF\u56DE\u6536\u7AD9\uFF0C\u53EF\u4EE5\u4ECE\u90A3\u91CC\u8FD8\u539F\u3002\u6A21\u578B\u5217\u8868\u4F1A\u91CD\u65B0\u626B\u63CF\u76EE\u5F55\u3002` : "\u8FD9\u4E2A\u6A21\u578B\u5DF2\u4E0D\u5728\u5F53\u524D\u76EE\u5F55\u91CC\u3002" });
          })()
        }
      )
    ] });
  }

  // LiveRate.tsx
  var SAMPLE_MS = 500;
  var WINDOW_MS = 3e3;
  var STREAMING_SELECTOR = "[data-streaming]";
  function estimateTokens(text) {
    let tokens = 0;
    for (const character of text) {
      const code = character.codePointAt(0) ?? 0;
      if (code === 32 || code === 10 || code === 9 || code === 13) continue;
      const isWide = code >= 11904 && code <= 40959 || code >= 44032 && code <= 55215 || code >= 63744 && code <= 64255 || code >= 65280 && code <= 65376 || code >= 131072 && code <= 262143;
      tokens += isWide ? 1 : 0.25;
    }
    return tokens;
  }
  function currentTokenCount() {
    if (typeof document === "undefined") return void 0;
    let total = 0;
    let seen = false;
    for (const element of document.querySelectorAll(STREAMING_SELECTOR)) {
      total += estimateTokens(element.textContent ?? "");
      seen = true;
    }
    return seen ? total : void 0;
  }
  function LiveRate() {
    const [rate2, setRate] = useState(void 0);
    const samples = useRef([]);
    useEffect(() => {
      const timer = setInterval(() => {
        const now = Date.now();
        const tokens = currentTokenCount();
        try {
          const seen = typeof document === "undefined" ? [] : document.querySelectorAll(STREAMING_SELECTOR).length;
          globalThis.__aranllmLiveRate = {
            at: now,
            streamingElements: seen,
            tokens: tokens ?? null,
            rate: rate2 ?? null
          };
        } catch {
        }
        if (tokens === void 0) {
          const last = samples.current.at(-1);
          if (last !== void 0 && now - last.at > WINDOW_MS) {
            samples.current = [];
            setRate(void 0);
          }
          return;
        }
        const history = samples.current;
        history.push({ at: now, tokens });
        while (history.length > 2 && now - history[0].at > WINDOW_MS) history.shift();
        const first = history[0];
        const elapsed = now - first.at;
        if (elapsed < SAMPLE_MS) return;
        const produced = tokens - first.tokens;
        if (produced < 0) {
          samples.current = [{ at: now, tokens }];
          return;
        }
        setRate(produced / elapsed * 1e3);
      }, SAMPLE_MS);
      return () => clearInterval(timer);
    }, []);
    if (rate2 === void 0 || !Number.isFinite(rate2) || rate2 <= 0) return null;
    const shown = rate2 >= 10 ? String(Math.round(rate2)) : String(Math.round(rate2 * 10) / 10);
    return /* @__PURE__ */ jsxs("span", { className: "live-rate", "data-live-rate": "true", title: "\u6309\u5C4F\u5E55\u4E0A\u7684\u6587\u5B57\u4F30\u7B97\u7684\u751F\u6210\u901F\u5EA6", children: [
      /* @__PURE__ */ jsx("span", { className: "live-rate__value", children: shown }),
      /* @__PURE__ */ jsx("span", { className: "live-rate__unit", children: "tok/s" })
    ] });
  }

  // Hub.tsx
  var NO_QUEUE = {
    pending: [],
    completed: [],
    totalBytes: 0,
    doneBytes: 0,
    speedBytesPerSecond: 0,
    failed: [],
    stopping: false
  };
  var SOURCE_CHOICES = [
    { id: "hf-mirror", label: "hf-mirror", note: "Hugging Face \u955C\u50CF\uFF0C\u53EF\u6309 GGUF \u8FC7\u6EE4" },
    { id: "modelscope", label: "\u9B54\u642D\u793E\u533A", note: "ModelScope\uFF0C\u4E0D\u652F\u6301\u6309 GGUF \u8FC7\u6EE4\uFF0C\u53EF\u80FD\u641C\u5230\u7A7A\u4ED3\u5E93" }
  ];
  function bytes(value) {
    if (value === void 0 || value === 0) return "\u5927\u5C0F\u672A\u77E5";
    const gb = value / 1024 ** 3;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = value / 1024 ** 2;
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${String(Math.max(1, Math.round(value / 1024)))} KB`;
  }
  function rate(value) {
    if (!value || value <= 0) return "\u2014";
    const mb = value / 1024 ** 2;
    if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
    return `${String(Math.max(1, Math.round(value / 1024)))} KB/s`;
  }
  function eta(received, total, speed) {
    if (!speed || speed <= 0 || total <= received) return "";
    const seconds2 = Math.round((total - received) / speed);
    if (seconds2 < 60) return `\u7EA6 ${String(seconds2)} \u79D2`;
    if (seconds2 < 3600) return `\u7EA6 ${String(Math.round(seconds2 / 60))} \u5206\u949F`;
    return `\u7EA6 ${(seconds2 / 3600).toFixed(1)} \u5C0F\u65F6`;
  }
  function hashOf(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash) % 6;
  }
  function byPopularity(repos) {
    return [...repos].sort((a, b) => {
      if (b.downloads !== a.downloads) return b.downloads - a.downloads;
      return a.id.localeCompare(b.id);
    });
  }
  function count(value) {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return String(value);
  }
  function when(iso) {
    if (iso.length === 0) return "";
    const at = Date.parse(iso);
    if (!Number.isFinite(at)) return "";
    const days = Math.floor((Date.now() - at) / 864e5);
    if (days < 1) return "\u4ECA\u5929\u66F4\u65B0";
    if (days < 30) return `${String(days)} \u5929\u524D`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${String(months)} \u4E2A\u6708\u524D`;
    return `${String(Math.floor(months / 12))} \u5E74\u524D`;
  }
  function Hub({ active }) {
    const [query, setQuery] = useState("");
    const [source, setSource] = useState("hf-mirror");
    const [search, setSearch] = useState({ kind: "idle" });
    const [files, setFiles] = useState({ kind: "idle" });
    const [chosen, setChosen] = useState("");
    const [picked, setPicked] = useState(/* @__PURE__ */ new Set());
    const [progress, setProgress] = useState(void 0);
    const [queue, setQueue] = useState(NO_QUEUE);
    const [queueOpen, setQueueOpen] = useState(false);
    const searchSeq = useRef(0);
    const mounted = useRef(true);
    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);
    useEffect(() => {
      void bridge.hub.source().then((id) => {
        if (mounted.current && typeof id === "string") setSource(id);
      }).catch(() => void 0);
    }, []);
    const runSearch = useCallback(
      async (text, cursor) => {
        const seq = searchSeq.current += 1;
        (globalThis.__hubDiag ??= []).push({ at: Date.now(), event: "runSearch \u5F00\u59CB", seq, text });
        setSearch({ kind: "loading" });
        const answer = await bridge.hub.search({ ...text.trim() ? { search: text.trim() } : {}, ...cursor ? { page: cursor } : {} }).catch(() => ({ ok: false, error: "\u65E0\u6CD5\u8FDE\u63A5\u4E3B\u8FDB\u7A0B\u3002" }));
        (globalThis.__hubDiag ??= []).push({ at: Date.now(), event: "\u6536\u5230\u54CD\u5E94", seq, now: searchSeq.current, mounted: mounted.current, ok: answer.ok });
        if (!mounted.current || seq !== searchSeq.current) return;
        if (!answer.ok) {
          setSearch({ kind: "failed", error: answer.error });
          return;
        }
        ;
        (globalThis.__hubDiag ??= []).push({ at: Date.now(), event: "\u8BBE\u7F6E ready", seq, repos: answer.value.repos.length });
        setSearch((previous) => {
          const merged = cursor && previous.kind === "ready" ? [...previous.repos, ...answer.value.repos] : answer.value.repos;
          return {
            kind: "ready",
            repos: merged,
            ...answer.value.nextPage ? { nextCursor: answer.value.nextPage } : {}
          };
        });
      },
      []
    );
    const [root, setRoot] = useState("");
    const [rootNote, setRootNote] = useState("");
    const [pendingMove, setPendingMove] = useState(void 0);
    const [moving, setMoving] = useState(false);
    const [proxy, setProxy] = useState({ mode: "system" });
    const [proxyModes, setProxyModes] = useState([]);
    const [editingProxy, setEditingProxy] = useState(false);
    const [proxyDraft, setProxyDraft] = useState("");
    const [probe, setProbe] = useState("");
    useEffect(() => {
      void bridge.hub.proxy().then((answer) => {
        if (!mounted.current || !answer) return;
        setProxy(answer.settings);
        setProxyModes(answer.modes ?? []);
        setProxyDraft(answer.settings.url ?? "");
      }).catch(() => void 0);
    }, []);
    const readRoot = useCallback(async () => {
      try {
        const answer = await bridge.models.library();
        const first = answer?.roots?.[0];
        if (mounted.current && typeof first === "string") setRoot(first);
      } catch {
      }
    }, []);
    useEffect(() => {
      void readRoot();
    }, [readRoot]);
    const chooseRoot = useCallback(async () => {
      setRootNote("");
      try {
        const picked2 = await bridge.models.chooseDirectory(root);
        if (!picked2) return;
        const preview = await bridge.models.previewMove(picked2);
        if (preview.blocked) {
          setRootNote(preview.blocked);
          return;
        }
        setPendingMove({ to: picked2, preview: { files: preview.files, bytes: preview.bytes } });
      } catch (cause) {
        setRootNote(cause instanceof Error ? cause.message : String(cause));
      }
    }, [root]);
    const confirmMove = useCallback(
      async (keepOld) => {
        const pending = pendingMove;
        if (!pending) return;
        setPendingMove(void 0);
        setMoving(true);
        setRootNote("");
        try {
          const answer = await bridge.models.moveLibrary(pending.to, keepOld);
          if (!answer.ok) {
            setRootNote(answer.error ?? "\u5207\u6362\u5931\u8D25\u3002");
            return;
          }
          await readRoot();
          if (answer.skipped && answer.skipped.length > 0) {
            setRootNote(`\u6709 ${String(answer.skipped.length)} \u4E2A\u6587\u4EF6\u6CA1\u80FD\u79FB\u52A8\uFF0C\u5B83\u4EEC\u4ECD\u5728\u539F\u76EE\u5F55\u3002`);
          }
        } catch (cause) {
          setRootNote(cause instanceof Error ? cause.message : String(cause));
        } finally {
          setMoving(false);
        }
      },
      [pendingMove, readRoot]
    );
    const chooseProxy = useCallback(
      async (mode, url) => {
        const answer = await bridge.hub.setProxy(mode, url).catch(() => ({ ok: false, error: "\u65E0\u6CD5\u8FDE\u63A5\u4E3B\u8FDB\u7A0B\u3002" }));
        if (!answer.ok) {
          setProbe(answer.error ?? "\u8BBE\u7F6E\u5931\u8D25\u3002");
          return;
        }
        setProxy({ mode, ...url ? { url } : {} });
        setEditingProxy(false);
        setProbe("");
      },
      []
    );
    const runProbe = useCallback(async () => {
      setProbe("\u6D4B\u8BD5\u4E2D\u2026");
      const answer = await bridge.hub.testConnection().catch(() => ({ ok: false, error: "\u65E0\u6CD5\u8FDE\u63A5\u4E3B\u8FDB\u7A0B\u3002" }));
      setProbe(answer.ok ? `\u8FDE\u63A5\u6B63\u5E38${answer.detail ? `\uFF0C${answer.detail}` : ""}` : answer.error ?? "\u8FDE\u63A5\u5931\u8D25\u3002");
    }, []);
    const switchSource = useCallback(
      (id) => {
        if (id === source) return;
        setSource(id);
        setChosen("");
        setPicked(/* @__PURE__ */ new Set());
        setFiles({ kind: "idle" });
        setProgress(void 0);
        void bridge.hub.setSource(id).catch(() => void 0);
        void runSearch(query);
      },
      [source, query, runSearch]
    );
    const openRepo = useCallback(async (id) => {
      setChosen(id);
      setPicked(/* @__PURE__ */ new Set());
      setFiles({ kind: "loading" });
      const answer = await bridge.hub.files(id).catch(() => ({
        ok: false,
        error: "\u65E0\u6CD5\u8FDE\u63A5\u4E3B\u8FDB\u7A0B\u3002"
      }));
      if (!mounted.current) return;
      if (!answer.ok) {
        setFiles({ kind: "failed", error: answer.error });
        return;
      }
      const only = answer.value.files.filter((file) => file.path.toLowerCase().endsWith(".gguf"));
      setFiles({ kind: "ready", id: answer.value.id, files: only, ggufBytes: answer.value.ggufBytes });
    }, []);
    const started = useRef(false);
    useEffect(() => {
      if (!active || started.current) return;
      started.current = true;
      void runSearch("");
    }, [active, runSearch]);
    useEffect(() => {
      const off = bridge.hub.onDownload((raw) => {
        if (!mounted.current) return;
        const state = raw;
        if (!state || typeof state !== "object") return;
        setProgress(state);
      });
      return off;
    }, []);
    useEffect(() => {
      void bridge.hub.queue().then((state) => {
        if (mounted.current && state && typeof state === "object") setQueue(state);
      }).catch(() => void 0);
      return bridge.hub.onQueue((raw) => {
        if (!mounted.current) return;
        if (raw && typeof raw === "object") setQueue(raw);
      });
    }, []);
    const toggle = useCallback((path) => {
      setPicked((previous) => {
        const next = new Set(previous);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
    }, []);
    const allFiles = files.kind === "ready" ? files.files : [];
    const pickedList = useMemo(() => allFiles.filter((file) => picked.has(file.path)), [allFiles, picked]);
    const pickedBytes = pickedList.reduce((sum, file) => sum + (file.size ?? 0), 0);
    const startPicked = useCallback(() => {
      if (chosen.length === 0 || pickedList.length === 0) return;
      void bridge.hub.enqueue(
        pickedList.map((file) => ({
          repoId: chosen,
          file: file.path,
          ...file.size !== void 0 ? { size: file.size } : {}
        }))
      ).catch(() => void 0);
    }, [chosen, pickedList]);
    const repos = useMemo(
      () => byPopularity(search.kind === "ready" ? search.repos : []),
      [search]
    );
    const repo = repos.find((entry) => entry.id === chosen);
    const showProgress = progress !== void 0 && progress.kind !== "done";
    const percent = progress && progress.total > 0 ? Math.min(100, Math.round(progress.received / progress.total * 100)) : 0;
    return /* @__PURE__ */ jsxs("div", { className: "hub", children: [
      queue.active !== void 0 || queue.pending.length > 0 || queue.completed.length > 0 || queue.failed.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "hub__dlbar", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "hub__btn hub__btn--quiet",
            onClick: () => setQueueOpen((open) => !open),
            "aria-expanded": queueOpen,
            children: [
              /* @__PURE__ */ jsx(Icon, { name: "arrow-down-to-line", size: "small" }),
              "\u4E0B\u8F7D\u6E05\u5355",
              queue.active ? /* @__PURE__ */ jsx("span", { className: "hub__dlbadge hub__dlbadge--on", children: String(queue.pending.length + 1) }) : queue.pending.length + queue.completed.length + queue.failed.length > 0 ? /* @__PURE__ */ jsx("span", { className: "hub__dlbadge", children: String(queue.pending.length + queue.completed.length + queue.failed.length) }) : null
            ]
          }
        ),
        queue.active ? /* @__PURE__ */ jsx("span", { className: "hub__dlnote", children: rate(queue.speedBytesPerSecond) || "\u6B63\u5728\u4E0B\u8F7D" }) : queue.paused && queue.pending.length > 0 ? /* @__PURE__ */ jsxs("span", { className: "hub__dlnote", children: [
          "\u5DF2\u6682\u505C \xB7 \u8FD8\u6709 ",
          String(queue.pending.length),
          " \u4E2A\u6587\u4EF6"
        ] }) : null,
        queue.pending.length > 0 || queue.active ? queue.paused ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "hub__btn hub__btn--quiet",
            onClick: () => void bridge.hub.resumeQueue().then(setQueue).catch(() => void 0),
            children: "\u5F00\u59CB"
          }
        ) : /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "hub__btn hub__btn--quiet",
            onClick: () => void bridge.hub.pauseQueue().then(setQueue).catch(() => void 0),
            children: "\u6682\u505C"
          }
        ) : null
      ] }) : null,
      queueOpen && (queue.active !== void 0 || queue.pending.length > 0 || queue.completed.length > 0 || queue.failed.length > 0) ? /* @__PURE__ */ jsx(
        QueuePanel,
        {
          queue,
          onStart: (repoId, file) => void bridge.hub.enqueue([{ repoId, file }]).then(setQueue).catch(() => void 0),
          onPause: () => void bridge.hub.pauseQueue().then(setQueue).catch(() => void 0),
          onResume: () => void bridge.hub.resumeQueue().then(setQueue).catch(() => void 0),
          onRemove: (repoId, file) => void bridge.hub.removeQueueItem(repoId, file).then(setQueue).catch(() => void 0),
          onClear: () => void bridge.hub.clearQueue().then(setQueue).catch(() => void 0)
        }
      ) : null,
      /* @__PURE__ */ jsxs("header", { className: "hub__head", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "hub__title", children: "\u6A21\u578B\u4ED3\u5E93" }),
          /* @__PURE__ */ jsx("p", { className: "hub__sub", children: "\u4ECE\u955C\u50CF\u7AD9\u627E\u6A21\u578B\uFF0C\u4E0B\u8F7D\u540E\u53EF\u5728\u300C\u672C\u5730\u6A21\u578B\u300D\u91CC\u52A0\u8F7D\u3002" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hub__sources", role: "radiogroup", "aria-label": "\u6A21\u578B\u6E90", children: SOURCE_CHOICES.map((choice) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": source === choice.id,
            "data-active": source === choice.id ? "true" : void 0,
            className: "hub__source-item",
            title: choice.note,
            onClick: () => switchSource(choice.id),
            children: choice.label
          },
          choice.id
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hub__net", children: [
        /* @__PURE__ */ jsx("span", { className: "hub__netlabel", children: "\u4E0B\u8F7D\u5230" }),
        /* @__PURE__ */ jsx("span", { className: "hub__rootpath", title: root, children: root || "\u8BFB\u53D6\u4E2D\u2026" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "hub__btn hub__btn--quiet",
            disabled: moving,
            onClick: () => void chooseRoot(),
            children: moving ? "\u6B63\u5728\u8FC1\u79FB\u2026" : "\u66F4\u6539"
          }
        ),
        rootNote ? /* @__PURE__ */ jsx("span", { className: "hub__netprobe hub__netprobe--bad", role: "alert", children: rootNote }) : null
      ] }),
      pendingMove ? /* @__PURE__ */ jsxs("div", { className: "hub__move", role: "alertdialog", "aria-label": "\u8FC1\u79FB\u6A21\u578B", children: [
        /* @__PURE__ */ jsxs("p", { className: "hub__move-title", children: [
          "\u65B0\u76EE\u5F55\uFF1A",
          /* @__PURE__ */ jsx("code", { children: pendingMove.to })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "hub__move-body", children: pendingMove.preview.files > 0 ? `\u5F53\u524D\u5E93\u91CC\u6709 ${String(pendingMove.preview.files)} \u4E2A\u6A21\u578B\u6587\u4EF6\uFF0C\u5171 ${bytes(pendingMove.preview.bytes)}\u3002\u8981\u628A\u5B83\u4EEC\u8FC1\u79FB\u5230\u65B0\u76EE\u5F55\u5417\uFF1F` : "\u5F53\u524D\u5E93\u91CC\u6CA1\u6709\u6A21\u578B\u6587\u4EF6\uFF0C\u53EF\u4EE5\u76F4\u63A5\u5207\u6362\u3002" }),
        /* @__PURE__ */ jsxs("div", { className: "hub__move-actions", children: [
          pendingMove.preview.files > 0 ? /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--primary", onClick: () => void confirmMove(false), children: "\u8FC1\u79FB\u8FC7\u53BB" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn", onClick: () => void confirmMove(true), children: "\u4E0D\u8FC1\u79FB\uFF0C\u4FDD\u7559\u539F\u76EE\u5F55" })
          ] }) : /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--primary", onClick: () => void confirmMove(true), children: "\u5207\u6362" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--quiet", onClick: () => setPendingMove(void 0), children: "\u53D6\u6D88" })
        ] }),
        pendingMove.preview.files > 0 ? /* @__PURE__ */ jsx("p", { className: "hub__move-note", children: "\u4E0D\u8FC1\u79FB\u7684\u8BDD\uFF0C\u539F\u76EE\u5F55\u4F1A\u4F5C\u4E3A\u526F\u5E93\u7EE7\u7EED\u8BFB\u53D6\uFF0C\u4E24\u4E2A\u76EE\u5F55\u7684\u6A21\u578B\u90FD\u4F1A\u51FA\u73B0\u5728\u300C\u672C\u5730\u6A21\u578B\u300D\u91CC\u3002" }) : null
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "hub__net", children: [
        editingProxy ? /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "hub__netinput",
              value: proxyDraft,
              onChange: (event) => setProxyDraft(event.target.value),
              placeholder: "http://127.0.0.1:7890",
              "aria-label": "\u4EE3\u7406\u5730\u5740"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "hub__btn",
              onClick: () => void chooseProxy("manual", proxyDraft.trim()),
              children: "\u4FDD\u5B58"
            }
          ),
          /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--quiet", onClick: () => setEditingProxy(false), children: "\u53D6\u6D88" })
        ] }) : /* @__PURE__ */ jsxs(Fragment2, { children: [
          /* @__PURE__ */ jsxs("span", { className: "hub__netlabel", children: [
            "\u4EE3\u7406 ",
            proxyModes.find((m) => m.id === proxy.mode)?.label ?? "\u8DDF\u968F\u7CFB\u7EDF",
            proxy.mode === "manual" && proxy.url ? ` \xB7 ${proxy.url}` : ""
          ] }),
          proxyModes.map(
            (mode) => mode.id === proxy.mode ? null : /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "hub__btn hub__btn--quiet",
                title: mode.note,
                onClick: () => mode.id === "manual" ? setEditingProxy(true) : void chooseProxy(mode.id),
                children: mode.label
              },
              mode.id
            )
          ),
          /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--quiet", onClick: () => void runProbe(), children: "\u6D4B\u8BD5\u8FDE\u63A5" })
        ] }),
        probe ? /* @__PURE__ */ jsx("span", { className: `hub__netprobe${probe.startsWith("\u8FDE\u63A5\u6B63\u5E38") ? "" : " hub__netprobe--bad"}`, role: "status", children: probe }) : null
      ] }),
      /* @__PURE__ */ jsxs(
        "form",
        {
          className: "hub__search",
          onSubmit: (event) => {
            event.preventDefault();
            setChosen("");
            setPicked(/* @__PURE__ */ new Set());
            setFiles({ kind: "idle" });
            void runSearch(query);
          },
          children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "hub__input",
                value: query,
                onChange: (event) => setQuery(event.target.value),
                placeholder: "\u641C\u7D22\u6A21\u578B\uFF0C\u4F8B\u5982 qwen3.8\u3001glm\u3001mimo",
                "aria-label": "\u641C\u7D22\u4ED3\u5E93"
              }
            ),
            /* @__PURE__ */ jsx("button", { type: "submit", className: "hub__btn hub__btn--primary", disabled: search.kind === "loading", children: search.kind === "loading" ? "\u641C\u7D22\u4E2D\u2026" : "\u641C\u7D22" })
          ]
        }
      ),
      search.kind === "failed" ? /* @__PURE__ */ jsxs("div", { className: "hub__error", role: "alert", children: [
        /* @__PURE__ */ jsx("p", { children: search.error }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn", onClick: () => void runSearch(query), children: "\u91CD\u8BD5" })
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "hub__body", children: [
        /* @__PURE__ */ jsxs("div", { className: "hub__list", role: "list", children: [
          repos.length === 0 && search.kind === "ready" ? /* @__PURE__ */ jsx("p", { className: "hub__empty", children: "\u6CA1\u6709\u5E26 GGUF \u6587\u4EF6\u7684\u4ED3\u5E93\u3002\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u68C0\u67E5\u955C\u50CF\u662F\u5426\u53EF\u7528\u3002" }) : null,
          repos.map((repo2) => {
            const [publisher, ...rest] = String(repo2.id ?? "").split("/");
            const shortName = rest.join("/") || publisher || repo2.id;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                role: "listitem",
                className: `hub__repo${chosen === repo2.id ? " hub__repo--on" : ""}`,
                onClick: () => void openRepo(repo2.id),
                children: [
                  /* @__PURE__ */ jsx("span", { className: "hub__avatar", "data-seed": hashOf(publisher ?? repo2.id), "aria-hidden": "true", children: (publisher ?? repo2.id).slice(0, 1).toUpperCase() }),
                  /* @__PURE__ */ jsxs("span", { className: "hub__repobody", children: [
                    /* @__PURE__ */ jsx("span", { className: "hub__reponame", title: repo2.id, children: shortName }),
                    /* @__PURE__ */ jsxs("span", { className: "hub__reposub", children: [
                      publisher ? /* @__PURE__ */ jsx("span", { className: "hub__repopub", children: publisher }) : null,
                      repo2.hasGguf ? /* @__PURE__ */ jsx("span", { className: "hub__gguf", title: "\u8FD9\u4E2A\u4ED3\u5E93\u91CC\u6709\u53EF\u4EE5\u52A0\u8F7D\u7684 GGUF", children: "GGUF" }) : null,
                      repo2.tags.slice(0, 3).map((tag) => /* @__PURE__ */ jsx("span", { className: "hub__tag", children: tag }, tag))
                    ] })
                  ] })
                ]
              },
              repo2.id
            );
          }),
          search.kind === "ready" && search.nextCursor ? /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "hub__btn hub__more",
              onClick: () => void runSearch(query, search.nextCursor),
              children: "\u52A0\u8F7D\u66F4\u591A"
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hub__detail", children: [
          files.kind === "idle" ? /* @__PURE__ */ jsx("p", { className: "hub__empty", children: "\u5DE6\u8FB9\u9009\u4E00\u4E2A\u4ED3\u5E93\uFF0C\u8FD9\u91CC\u4F1A\u5217\u51FA\u53EF\u4E0B\u8F7D\u7684\u6587\u4EF6\u3002" }) : null,
          files.kind === "loading" ? /* @__PURE__ */ jsx("p", { className: "hub__empty", children: "\u6B63\u5728\u8BFB\u53D6\u6587\u4EF6\u5217\u8868\u2026" }) : null,
          files.kind === "failed" ? /* @__PURE__ */ jsxs("div", { className: "hub__error", role: "alert", children: [
            /* @__PURE__ */ jsx("p", { children: files.error }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn", onClick: () => void openRepo(chosen), children: "\u91CD\u8BD5" })
          ] }) : null,
          files.kind === "ready" ? /* @__PURE__ */ jsxs(Fragment2, { children: [
            /* @__PURE__ */ jsxs("div", { className: "hub__detailhead", children: [
              /* @__PURE__ */ jsx("h2", { className: "hub__repotitle", children: files.id }),
              /* @__PURE__ */ jsxs("div", { className: "hub__stats", children: [
                /* @__PURE__ */ jsxs("span", { className: "hub__stat", title: "\u4E0B\u8F7D\u6B21\u6570", children: [
                  "\u2193 ",
                  count(repo?.downloads ?? 0)
                ] }),
                repo && repo.likes > 0 ? /* @__PURE__ */ jsxs("span", { className: "hub__stat", title: "\u70B9\u8D5E", children: [
                  "\u2665 ",
                  count(repo.likes)
                ] }) : null,
                repo?.updatedAt ? /* @__PURE__ */ jsxs("span", { className: "hub__statwhen", children: [
                  when(repo.updatedAt),
                  "\u66F4\u65B0"
                ] }) : null
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "hub__sub", children: [
                files.files.length,
                " \u4E2A GGUF \u6587\u4EF6\uFF0C\u5408\u8BA1 ",
                bytes(files.ggufBytes),
                files.files.length === 0 ? "\uFF08\u8FD9\u4E2A\u4ED3\u5E93\u6CA1\u6709\u53EF\u4E0B\u8F7D\u7684 GGUF\uFF09" : ""
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "hub__bar", children: [
              /* @__PURE__ */ jsxs("label", { className: "hub__checkall", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: allFiles.length > 0 && picked.size === allFiles.length,
                    onChange: (event) => setPicked(event.target.checked ? new Set(allFiles.map((f) => f.path)) : /* @__PURE__ */ new Set())
                  }
                ),
                "\u5168\u9009"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "hub__pickedinfo", children: picked.size === 0 ? "\u52FE\u9009\u8981\u4E0B\u8F7D\u7684\u6587\u4EF6" : `\u5DF2\u9009 ${String(picked.size)} \u4E2A\uFF0C${bytes(pickedBytes)}` }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "hub__btn hub__btn--primary",
                  disabled: picked.size === 0,
                  onClick: startPicked,
                  children: "\u52A0\u5165\u4E0B\u8F7D"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("table", { className: "hub__table", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "hub__colpick" }),
                /* @__PURE__ */ jsx("th", { children: "\u6587\u4EF6" }),
                /* @__PURE__ */ jsx("th", { children: "\u91CF\u5316" }),
                /* @__PURE__ */ jsx("th", { children: "\u5927\u5C0F" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: allFiles.map((file) => /* @__PURE__ */ jsxs("tr", { className: picked.has(file.path) ? "hub__row--on" : "", children: [
                /* @__PURE__ */ jsx("td", { className: "hub__colpick", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: picked.has(file.path),
                    onChange: () => toggle(file.path),
                    "aria-label": `\u9009\u62E9 ${file.path}`
                  }
                ) }),
                /* @__PURE__ */ jsxs("td", { className: "hub__path", title: file.path, children: [
                  file.isProjector ? /* @__PURE__ */ jsx("span", { className: "hub__badge", children: "\u89C6\u89C9" }) : null,
                  (file.path ?? "").split("/").pop() || file.path || "\u2014"
                ] }),
                /* @__PURE__ */ jsx("td", { children: file.quantization ?? "\u2014" }),
                /* @__PURE__ */ jsx("td", { className: "hub__size", children: bytes(file.size) })
              ] }, file.path)) })
            ] }),
            allFiles.length === 0 ? /* @__PURE__ */ jsx("p", { className: "hub__empty", children: "\u8FD9\u4E2A\u4ED3\u5E93\u91CC\u6CA1\u6709 GGUF \u6587\u4EF6\uFF0C\u672C\u5E94\u7528\u52A0\u8F7D\u4E0D\u4E86\u3002" }) : null
          ] }) : null
        ] })
      ] }),
      showProgress && progress ? /* @__PURE__ */ jsxs("div", { className: `hub__progress hub__progress--${progress.kind}`, role: "status", children: [
        /* @__PURE__ */ jsxs("div", { className: "hub__progresshead", children: [
          /* @__PURE__ */ jsxs("span", { className: "hub__progressname", title: progress.file, children: [
            progress.kind === "running" ? "\u6B63\u5728\u4E0B\u8F7D" : progress.kind === "cancelled" ? "\u5DF2\u53D6\u6D88" : "\u4E0B\u8F7D\u5931\u8D25",
            " \xB7 ",
            (progress.file ?? "").split("/").pop() || progress.file || ""
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "hub__progressnum", children: [
            bytes(progress.received),
            progress.total > 0 ? ` / ${bytes(progress.total)}` : "",
            progress.kind === "running" ? ` \xB7 ${rate(progress.bytesPerSecond)}` : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hub__track", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "hub__fill",
            style: { width: progress.total > 0 ? `${String(percent)}%` : "100%" },
            "data-indeterminate": progress.total > 0 ? void 0 : "true"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "hub__progressfoot", children: [
          /* @__PURE__ */ jsx("span", { children: progress.kind === "running" ? `${progress.resumed ? "\u5DF2\u4ECE\u65AD\u70B9\u7EE7\u7EED \xB7 " : ""}${eta(progress.received, progress.total, progress.bytesPerSecond)}` : progress.error }),
          progress.kind === "running" ? /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--quiet", onClick: () => void bridge.hub.cancelDownload(), children: "\u53D6\u6D88" }) : /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--quiet", onClick: () => setProgress(void 0), children: "\u5173\u95ED" })
        ] })
      ] }) : null
    ] });
  }
  function QueuePanel({
    queue,
    onStart,
    onPause,
    onResume,
    onRemove,
    onClear
  }) {
    const entries = [
      ...queue.active ? [{ ...queue.active, state: "active" }] : [],
      ...queue.pending.map((item) => ({ ...item, state: "pending" })),
      ...queue.failed.map((item) => ({ ...item, state: "failed" })),
      ...queue.completed.map((item) => ({ ...item, state: "done" }))
    ];
    if (entries.length === 0) {
      return /* @__PURE__ */ jsx("div", { className: "hub__queue", "data-empty": "true", children: /* @__PURE__ */ jsx("p", { className: "hub__queueempty", children: "\u4E0B\u8F7D\u6E05\u5355\u662F\u7A7A\u7684\u3002\u4E0A\u9762\u52FE\u9009\u6587\u4EF6\u540E\u70B9\u300C\u4E0B\u8F7D\u300D\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u8FDB\u5EA6\u3002" }) });
    }
    const outstanding = queue.pending.length + (queue.active ? 1 : 0);
    return /* @__PURE__ */ jsxs("div", { className: "hub__queue", children: [
      /* @__PURE__ */ jsxs("div", { className: "hub__queuehead", children: [
        /* @__PURE__ */ jsxs("span", { className: "hub__queuetitle", children: [
          "\u4E0B\u8F7D\u6E05\u5355",
          outstanding > 0 ? ` \xB7 \u8FD8\u6709 ${String(outstanding)} \u4E2A` : "",
          queue.paused && outstanding > 0 ? "\uFF08\u5DF2\u6682\u505C\uFF09" : ""
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "hub__queueactions", children: [
          outstanding > 0 ? queue.paused ? /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--quiet", onClick: onResume, children: "\u7EE7\u7EED\u5168\u90E8" }) : /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--quiet", onClick: onPause, children: "\u6682\u505C\u5168\u90E8" }) : null,
          queue.completed.length > 0 || queue.failed.length > 0 ? /* @__PURE__ */ jsx("button", { type: "button", className: "hub__btn hub__btn--quiet", onClick: onClear, children: "\u6E05\u7A7A\u8BB0\u5F55" }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsx("ul", { className: "hub__queuelist", children: entries.map((entry) => {
        const name = (entry.file ?? "").split("/").pop() || entry.file || "\u2014";
        const error = "error" in entry && typeof entry.error === "string" ? entry.error : void 0;
        return /* @__PURE__ */ jsxs("li", { className: "hub__queueitem", "data-state": entry.state, children: [
          /* @__PURE__ */ jsx("span", { className: "hub__queuedot", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxs("span", { className: "hub__queuename", title: `${entry.repoId}/${entry.file}`, children: [
            name,
            /* @__PURE__ */ jsx("span", { className: "hub__queuerepo", children: entry.repoId })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "hub__queuestate", children: entry.state === "active" ? `\u4E0B\u8F7D\u4E2D \xB7 ${rate(queue.speedBytesPerSecond)}` : entry.state === "pending" ? queue.paused ? "\u5DF2\u6682\u505C" : "\u7B49\u5F85\u4E2D" : entry.state === "done" ? "\u5DF2\u5B8C\u6210" : error ?? "\u5931\u8D25" }),
          /* @__PURE__ */ jsx("span", { className: "hub__queuesize", children: bytes(typeof entry.size === "number" ? entry.size : void 0) }),
          /* @__PURE__ */ jsxs("span", { className: "hub__queueops", children: [
            entry.state === "pending" || entry.state === "failed" ? /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "hub__btn hub__btn--quiet",
                onClick: () => onStart(entry.repoId, entry.file),
                title: "\u5F00\u59CB\u8FD9\u4E2A\u4E0B\u8F7D\uFF0C\u5DF2\u6709\u8FDB\u5EA6\u4F1A\u63A5\u7740\u4F20",
                children: "\u5F00\u59CB"
              }
            ) : null,
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "hub__btn hub__btn--quiet",
                onClick: () => onRemove(entry.repoId, entry.file),
                title: "\u4ECE\u6E05\u5355\u91CC\u79FB\u9664\uFF0C\u5DF2\u4E0B\u8F7D\u7684\u6587\u4EF6\u4E0D\u4F1A\u88AB\u5220\u9664",
                children: "\u79FB\u9664"
              }
            )
          ] })
        ] }, `${entry.repoId} ${entry.file}`);
      }) })
    ] });
  }

  // index.tsx
  var stylesheets = {
    "aranllm-local-tokens": tokens_default,
    "aranllm-local-models": local_models_default,
    "aranllm-local-params": parameter_panel_default,
    "aranllm-local-icons": icon_default,
    "aranllm-local-modal": modal_default,
    "aranllm-local-live-rate": live_rate_default,
    "aranllm-local-hub": hub_default,
    // Last, so it can override the copied stylesheets without editing them.
    "aranllm-local-host": host_overrides_default
  };
  return __toCommonJS(index_exports);
})();

/* Hand the finished components to the plugin, on the same global it read from. */
/* Same scope as the bundle own var, which esbuild emits as a local. */
const __aranllmDone = __aranllmUIPending
globalThis.__aranllmUI = Object.assign(globalThis.__aranllmUI ?? {}, __aranllmDone)

/*
 * The stylesheets, written into the document.
 *
 * Guarded by a data attribute, because the host runs a plugin again on an HMR
 * reload and a second copy of a stylesheet is a second copy of every rule —
 * which is not a visual difference until two rules disagree, and then it is a
 * difference nobody can explain.
 */
for (const [id, css] of Object.entries(__aranllmDone.stylesheets ?? {})) {
  if (typeof document === "undefined") continue
  if (typeof css !== "string" || css.length === 0) continue
  if (document.querySelector("style[data-aranllm=" + JSON.stringify(id) + "]") !== null) continue
  const tag = document.createElement("style")
  tag.dataset.aranllm = id
  tag.textContent = css
  document.head.append(tag)
}


    /* eslint-enable */
    // -----------------------------------------------------------------------

    const ui = globalThis.__aranllmUI
    if (typeof ui?.LocalModels !== 'function') {
      throw new Error('aranllm-local: the bundled UI did not load')
    }

    /*
     * The settings section.
     *
     * Registered unconditionally, unlike the host's own feature pages, which
     * gate on `configForms.whileServed`. That gate fires only while the Host
     * serves the matching settings namespace, and this page is not a form — its
     * content is the model list, served by this plugin's own routes. Gating on
     * the namespace made the whole section disappear, with no error, because
     * `whileServed` resolves normally and simply never calls its `register`.
     */
    const inject = ['slots', 'locale']

    function apply(ctx) {
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: 'aranllm-local',
            // After `general` (0) and `models` (10): the local model is a
            // machine-specific concern, not part of endpoint configuration.
            order: 20,
            label: () => '本地模型',
            inject: () => ({}),
          },
          ui.LocalModels,
        ),
      )

      /*
       * The model hub, as its own settings section.
       *
       * Placed after the model list (order 21) so the two read as a pair: what
       * is on this machine, then what can be fetched onto it.
       *
       *  is passed rather than assumed, and the reason is the same
       * class of thing the four ports before this one kept tripping on: the hub
       * page was written for a tabbed shell, where a tab is built once and asked
       * whether it is showing — it starts its first search from
       * . This host's settings section has no such concept;
       * it renders the component when the section is chosen. Answering the
       * question is what makes the two shells agree, without an edit to the
       * component that would have to be carried forward on the next copy.
       */
      if (typeof ui.Hub === 'function') {
        ctx.slots.inject('settings.section', () =>
          ctx.slots.register(
            {
              name: 'settings.section',
              id: 'aranllm-hub',
              order: 21,
              label: () => '模型仓库',
              inject: () => ({ active: true }),
            },
            ui.Hub,
          ),
        )
      }

      /*
       * The live rate, in the composer's dock row.
       *
       * Same slot the host's own stats pill registers into (`id: 'stats'`,
       * `order: 0`), placed after it so the two read as one line: the host's
       * session figures, then this one. It is a separate registration rather
       * than a change to that component because the component is in
       * `node_modules` — an edit there is lost on the next install, and this is
       * a measurement the page can make on its own.
       *
       * No `inject` props: everything it needs is in the document, which is
       * what makes it work for a reply from any provider rather than only the
       * ones that report their token counts.
       */
      if (typeof ui.LiveRate === 'function') {
        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register(
            {
              name: 'conversation.composer.dock',
              id: 'aranllm-live-rate',
              order: 1,
              inject: () => ({}),
            },
            ui.LiveRate,
          ),
        )
      }
    }

    exports.apply = apply
    exports.inject = inject
    exports.LocalModels = ui.LocalModels
    exports.LiveRate = ui.LiveRate
    exports.Hub = ui.Hub
    return module.exports
  }
})
