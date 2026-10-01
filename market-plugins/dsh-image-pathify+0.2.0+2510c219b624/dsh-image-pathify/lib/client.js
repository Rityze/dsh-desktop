window.__ModuleLoader__.load({ id: 'dsh-image-pathify', factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
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

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  ENTRY_ID: () => ENTRY_ID,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/defaults.ts
var DEFAULT_VISION_MODEL = "deepseek-flash";
var DEFAULT_VISION_BASE_URL = "https://api.deepseek.com";
var DEFAULT_API_KEY_ENV = "IMAGE_PATHIFY_API_KEY";
var DEFAULT_MAX_TOKENS = 2048;
var MIN_VISION_MAX_TOKENS = 0;
var DEFAULT_DISABLE_THINKING = true;
var MAX_VISION_MAX_TOKENS = 32768;

// src/contract.ts
function defaultPublicSettings() {
  return {
    apiKeyEnv: DEFAULT_API_KEY_ENV,
    visionModel: DEFAULT_VISION_MODEL,
    visionBaseUrl: DEFAULT_VISION_BASE_URL,
    disableThinking: DEFAULT_DISABLE_THINKING,
    maxTokens: DEFAULT_MAX_TOKENS,
    models: [],
    relaxAdmission: true
  };
}
function fail(message) {
  throw new TypeError(message);
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readString(value, field) {
  return typeof value === "string" ? value : fail(`${field} must be a string`);
}
function readBoolean(value, field) {
  return typeof value === "boolean" ? value : fail(`${field} must be a boolean`);
}
function readMaxTokens(value, field) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(`${field} must be an integer`);
  }
  if (value < MIN_VISION_MAX_TOKENS || value > MAX_VISION_MAX_TOKENS) {
    fail(
      `${field} must be between ${String(MIN_VISION_MAX_TOKENS)} and ${String(MAX_VISION_MAX_TOKENS)}`
    );
  }
  return value;
}
function readModel(value) {
  if (!isRecord(value)) fail("models[] must be an object");
  const provider = readString(value.provider, "models[].provider").trim();
  const model = readString(value.model, "models[].model").trim();
  if (provider.length === 0 || model.length === 0) {
    fail("models[] requires non-empty provider and model");
  }
  return { provider, model };
}
var publicSettingsSchema = {
  parse(value) {
    if (!isRecord(value)) fail("settings must be an object");
    const modelsRaw = value.models;
    if (!Array.isArray(modelsRaw)) fail("models must be an array");
    return {
      apiKeyEnv: readString(value.apiKeyEnv, "apiKeyEnv"),
      visionModel: readString(value.visionModel, "visionModel"),
      visionBaseUrl: readString(value.visionBaseUrl, "visionBaseUrl"),
      disableThinking: readBoolean(value.disableThinking, "disableThinking"),
      maxTokens: readMaxTokens(value.maxTokens, "maxTokens"),
      models: modelsRaw.map(readModel),
      relaxAdmission: readBoolean(value.relaxAdmission, "relaxAdmission")
    };
  }
};
var updateStatusSchema = {
  parse(value) {
    if (!isRecord(value)) fail("update status must be an object");
    return {
      installedVersion: readString(value.installedVersion, "installedVersion"),
      latestVersion: readString(value.latestVersion, "latestVersion"),
      updateAvailable: readBoolean(value.updateAvailable, "updateAvailable"),
      command: readString(value.command, "command")
    };
  }
};
var IMAGE_PATHIFY_INVOCATIONS = [
  {
    id: "dsh-image-pathify#imagePathify/getUpdate",
    service: "imagePathify",
    namespace: "imagePathify",
    method: "getUpdate",
    invocation: { kind: "direct" },
    parameters: [],
    result: {
      mode: "strict",
      typeSymbol: "dsh-image-pathify#ImagePathifyUpdateStatus",
      create: () => updateStatusSchema
    }
  }
];

// src/client/store.ts
function createSnapshotStore(initial) {
  let snapshot = initial;
  const listeners = /* @__PURE__ */ new Set();
  return {
    getSnapshot: () => snapshot,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    set: (value) => {
      snapshot = value;
      for (const listener of listeners) listener();
    }
  };
}

// src/client/card-form.ts
var idleCredentials = {
  describe: async () => ({ configured: false, writable: true }),
  set: async () => {
  }
};
var DEFAULTS = defaultPublicSettings();
function modelsEqual(left, right) {
  return left.length === right.length && left.every(
    (entry, index) => entry.provider === right[index]?.provider && entry.model === right[index]?.model
  );
}
function cloneModels(entries) {
  return entries.map((entry) => ({
    provider: entry.provider,
    model: entry.model
  }));
}
function modelKey(entry) {
  return `${entry.provider}\0${entry.model}`;
}
function refOf(settings) {
  const declared = settings.apiKeyEnv.trim();
  return declared.length > 0 ? declared : DEFAULT_API_KEY_ENV;
}
function parseMaxTokens(text, fallback) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return fallback;
  if (!/^(0|[1-9]\d*)$/.test(trimmed)) return void 0;
  const n = Number(trimmed);
  if (n > MAX_VISION_MAX_TOKENS) return void 0;
  return n;
}
var ImagePathifyCardController = class {
  constructor(write, credentials = idleCredentials) {
    this.write = write;
    this.credentials = credentials;
    this.store = createSnapshotStore(this.projection());
  }
  write;
  credentials;
  stored = defaultPublicSettings();
  available = false;
  saving = false;
  failed = false;
  apiKeyDraft;
  visionModelDraft;
  visionBaseUrlDraft;
  disableThinkingDraft;
  maxTokensDraft;
  relaxDraft;
  modelsDraft;
  credential = { ref: "", configured: false, writable: true };
  installedVersion = "";
  update = void 0;
  store;
  /** Snapshot the card renderer reads through `useImagePathifyCard`. */
  get snapshot() {
    return this.store;
  }
  /** Seed or refresh from the Host. Staged edits survive a reload. */
  receive(settings) {
    this.stored = settings;
    this.available = true;
    this.publish();
    void this.syncCredential();
  }
  /** Hide the card while the Remote is down. */
  markUnavailable() {
    this.available = false;
    this.installedVersion = "";
    this.update = void 0;
    this.publish();
  }
  /**
   * Apply a host npm-probe result. The installed version is always kept for
   * the title; the upgrade banner is only kept when an update is available.
   */
  receiveUpdate(status) {
    this.installedVersion = status.installedVersion.trim();
    this.update = status.updateAvailable && this.installedVersion.length > 0 && status.latestVersion.length > 0 && status.command.length > 0 ? {
      installedVersion: this.installedVersion,
      latestVersion: status.latestVersion,
      command: status.command
    } : void 0;
    this.publish();
  }
  /**
   * Re-read whether the Host holds a key for the reference this card watches.
   * @param ref - when set, ignore updates for a different reference.
   */
  refreshCredential(ref) {
    if (ref !== void 0 && ref !== this.credential.ref) return;
    void this.syncCredential();
  }
  /** Ask the credentials domain about the reference the section currently names. */
  async syncCredential() {
    const ref = refOf(this.stored);
    if (ref !== this.credential.ref) {
      this.credential = { ref, configured: false, writable: true };
      this.publish();
    }
    let view;
    try {
      view = await this.credentials.describe(ref);
    } catch {
      return;
    }
    if (ref !== refOf(this.stored)) return;
    if (view.configured === this.credential.configured && view.writable === this.credential.writable) {
      return;
    }
    this.credential = {
      ref,
      configured: view.configured,
      writable: view.writable
    };
    this.publish();
  }
  /** Build the face the card's slot registration injects. */
  inject() {
    return {
      hooks: { imagePathifyCard: this.store },
      edit: (field, text) => {
        this.edit(field, text);
      },
      resetField: (field) => {
        this.resetField(field);
      },
      save: () => {
        void this.save();
      },
      discard: () => {
        this.discard();
      },
      setDisableThinking: (value) => {
        this.setDisableThinking(value);
      },
      setRelaxAdmission: (value) => {
        this.setRelaxAdmission(value);
      },
      addModel: (provider, model) => {
        this.addModel(provider, model);
      },
      removeModel: (provider, model) => {
        this.removeModel(provider, model);
      }
    };
  }
  projection() {
    const visionModel = this.visionModelDraft ?? this.stored.visionModel;
    const visionBaseUrl = this.visionBaseUrlDraft ?? this.stored.visionBaseUrl;
    const disableThinking = this.disableThinkingDraft ?? this.stored.disableThinking;
    const maxTokensText = this.maxTokensDraft ?? String(this.stored.maxTokens);
    const relax = this.relaxDraft ?? this.stored.relaxAdmission;
    const models = this.modelsDraft ?? this.stored.models;
    const resolvedModel = this.effectiveModel(visionModel);
    const resolvedUrl = this.effectiveUrl(visionBaseUrl);
    const resolvedMaxTokens = parseMaxTokens(maxTokensText, DEFAULT_MAX_TOKENS);
    return {
      available: this.available,
      writable: true,
      dirty: this.isDirty(),
      invalid: resolvedMaxTokens === void 0,
      saving: this.saving,
      failed: this.failed,
      apiKeyText: this.apiKeyDraft ?? "",
      apiKeySet: this.credential.configured,
      apiKeyWritable: this.credential.writable,
      visionModel: {
        text: visionModel,
        overridden: resolvedModel !== DEFAULT_VISION_MODEL
      },
      visionBaseUrl: {
        text: visionBaseUrl,
        overridden: resolvedUrl !== DEFAULT_VISION_BASE_URL
      },
      disableThinking: {
        checked: disableThinking,
        overridden: disableThinking !== DEFAULTS.disableThinking
      },
      maxTokens: {
        text: maxTokensText,
        overridden: resolvedMaxTokens !== void 0 && resolvedMaxTokens !== DEFAULT_MAX_TOKENS
      },
      relaxAdmission: {
        checked: relax,
        overridden: relax !== DEFAULTS.relaxAdmission
      },
      models: {
        entries: models,
        overridden: !modelsEqual(models, DEFAULTS.models)
      },
      installedVersion: this.installedVersion,
      update: this.update
    };
  }
  isDirty() {
    if (this.apiKeyDraft !== void 0 && this.apiKeyDraft.trim() !== "") {
      return true;
    }
    if (this.visionModelDraft !== void 0 && this.effectiveModel(this.visionModelDraft) !== this.effectiveModel(this.stored.visionModel)) {
      return true;
    }
    if (this.visionBaseUrlDraft !== void 0 && this.effectiveUrl(this.visionBaseUrlDraft) !== this.effectiveUrl(this.stored.visionBaseUrl)) {
      return true;
    }
    if (this.tokenDraftDirty()) return true;
    if (this.disableThinkingDraft !== void 0 && this.disableThinkingDraft !== this.stored.disableThinking) {
      return true;
    }
    if (this.relaxDraft !== void 0 && this.relaxDraft !== this.stored.relaxAdmission) {
      return true;
    }
    if (this.modelsDraft !== void 0 && !modelsEqual(this.modelsDraft, this.stored.models)) {
      return true;
    }
    return false;
  }
  effectiveModel(value) {
    const trimmed = value.trim();
    return trimmed === "" ? DEFAULT_VISION_MODEL : trimmed;
  }
  effectiveUrl(value) {
    const trimmed = value.trim();
    return trimmed === "" ? DEFAULT_VISION_BASE_URL : trimmed;
  }
  tokenDraftDirty() {
    if (this.maxTokensDraft === void 0) return false;
    const parsed = parseMaxTokens(this.maxTokensDraft, DEFAULT_MAX_TOKENS);
    return parsed === void 0 || parsed !== this.stored.maxTokens;
  }
  edit(field, text) {
    this.failed = false;
    if (field === "apiKey") {
      this.apiKeyDraft = text;
    } else if (field === "visionModel") {
      this.visionModelDraft = text;
    } else if (field === "visionBaseUrl") {
      this.visionBaseUrlDraft = text;
    } else if (field === "maxTokens") {
      this.maxTokensDraft = text;
    }
    this.publish();
  }
  resetField(field) {
    this.failed = false;
    if (field === "visionModel") this.visionModelDraft = DEFAULT_VISION_MODEL;
    else if (field === "visionBaseUrl") {
      this.visionBaseUrlDraft = DEFAULT_VISION_BASE_URL;
    } else if (field === "disableThinking") {
      this.disableThinkingDraft = DEFAULTS.disableThinking;
    } else if (field === "maxTokens") {
      this.maxTokensDraft = String(DEFAULT_MAX_TOKENS);
    } else if (field === "relaxAdmission") {
      this.relaxDraft = DEFAULTS.relaxAdmission;
    } else if (field === "models") this.modelsDraft = [];
    this.publish();
  }
  setDisableThinking(value) {
    this.failed = false;
    this.disableThinkingDraft = value;
    this.publish();
  }
  setRelaxAdmission(value) {
    this.failed = false;
    this.relaxDraft = value;
    this.publish();
  }
  addModel(provider, model) {
    const nextProvider = provider.trim();
    const nextModel = model.trim();
    if (nextProvider.length === 0 || nextModel.length === 0) return;
    this.failed = false;
    const current = cloneModels(this.modelsDraft ?? this.stored.models);
    const entry = { provider: nextProvider, model: nextModel };
    if (current.some((item) => modelKey(item) === modelKey(entry))) {
      this.modelsDraft = current;
      this.publish();
      return;
    }
    this.modelsDraft = [...current, entry];
    this.publish();
  }
  removeModel(provider, model) {
    this.failed = false;
    const key = modelKey({ provider, model });
    const current = this.modelsDraft ?? this.stored.models;
    this.modelsDraft = current.filter((item) => modelKey(item) !== key);
    this.publish();
  }
  discard() {
    if (!this.isDirty() && !this.failed) return;
    this.apiKeyDraft = void 0;
    this.visionModelDraft = void 0;
    this.visionBaseUrlDraft = void 0;
    this.disableThinkingDraft = void 0;
    this.maxTokensDraft = void 0;
    this.relaxDraft = void 0;
    this.modelsDraft = void 0;
    this.failed = false;
    this.publish();
  }
  planSettings() {
    const update = {};
    let dirty = false;
    const visionModel = this.effectiveModel(
      this.visionModelDraft ?? this.stored.visionModel
    );
    if (visionModel !== this.effectiveModel(this.stored.visionModel)) {
      update.visionModel = visionModel;
      dirty = true;
    }
    const visionBaseUrl = this.effectiveUrl(
      this.visionBaseUrlDraft ?? this.stored.visionBaseUrl
    );
    if (visionBaseUrl !== this.effectiveUrl(this.stored.visionBaseUrl)) {
      update.visionBaseUrl = visionBaseUrl;
      dirty = true;
    }
    const disableThinking = this.disableThinkingDraft ?? this.stored.disableThinking;
    if (disableThinking !== this.stored.disableThinking) {
      update.disableThinking = disableThinking;
      dirty = true;
    }
    const maxTokens = parseMaxTokens(
      this.maxTokensDraft ?? String(this.stored.maxTokens),
      DEFAULT_MAX_TOKENS
    );
    if (maxTokens !== void 0 && maxTokens !== this.stored.maxTokens) {
      update.maxTokens = maxTokens;
      dirty = true;
    }
    const relax = this.relaxDraft ?? this.stored.relaxAdmission;
    if (relax !== this.stored.relaxAdmission) {
      update.relaxAdmission = relax;
      dirty = true;
    }
    const models = this.modelsDraft ?? this.stored.models;
    if (!modelsEqual(models, this.stored.models)) {
      update.models = cloneModels(models);
      dirty = true;
    }
    return dirty ? update : void 0;
  }
  async save() {
    const key = this.apiKeyDraft?.trim() ?? "";
    const update = this.planSettings();
    if (key.length === 0 && update === void 0 || this.saving) return;
    this.saving = true;
    this.failed = false;
    this.publish();
    let landed = true;
    try {
      if (key.length > 0) {
        try {
          await this.credentials.set(refOf(this.stored), key);
        } catch {
          landed = false;
        }
        await this.syncCredential();
        if (!this.credential.configured) landed = false;
      }
      if (update !== void 0) {
        this.stored = await this.write(update);
      }
    } catch {
      landed = false;
    }
    if (landed) {
      this.apiKeyDraft = void 0;
      this.visionModelDraft = void 0;
      this.visionBaseUrlDraft = void 0;
      this.disableThinkingDraft = void 0;
      this.maxTokensDraft = void 0;
      this.relaxDraft = void 0;
      this.modelsDraft = void 0;
    } else {
      this.failed = true;
    }
    this.saving = false;
    this.publish();
  }
  publish() {
    this.store.set(this.projection());
  }
};

// src/client/ImagePathifyCard.tsx
var import_react = require("react");

// src/client/locales.ts
var zh = {
  save: "\u4FDD\u5B58",
  saving: "\u4FDD\u5B58\u4E2D\u2026",
  discard: "\u653E\u5F03\u4FEE\u6539",
  saveFailed: "\u4FDD\u5B58\u5931\u8D25\uFF0C\u4FEE\u6539\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u68C0\u67E5\u540E\u91CD\u8BD5\u3002",
  overridden: "\u5DF2\u8986\u76D6",
  reset: "\u6062\u590D\u9ED8\u8BA4",
  apiKey: "API Key",
  apiKeyHint: "\u4E0D\u5199\u5165\u8BBE\u7F6E\u6587\u4EF6\u3002\u7559\u7A7A\u8868\u793A\u4FDD\u6301\u5F53\u524D\u5BC6\u94A5\u3002",
  apiKeySet: "\u5DF2\u914D\u7F6E\u5BC6\u94A5\u3002",
  apiKeyUnset: "\u672A\u914D\u7F6E\u5BC6\u94A5\uFF1B\u914D\u7F6E\u4E4B\u524D\u63D2\u4EF6\u4E0D\u53EF\u8BC6\u56FE\u3002",
  visionModel: "\u8BC6\u56FE\u6A21\u578B",
  visionModelHint: "\u9ED8\u8BA4 deepseek-flash\u3002\u4E5F\u53EF\u586B\u5343\u95EE/\u667A\u8C31\u7B49 OpenAI \u517C\u5BB9\u8BC6\u56FE\u6A21\u578B\u3002",
  disableThinking: "\u7981\u7528\u601D\u8003",
  disableThinkingOffHint: "\u601D\u8003\u4F1A\u5360\u7528\u8F93\u51FA\u989D\u5EA6\uFF0C\u8BF7\u589E\u5927\u8F93\u51FA\u4E0A\u9650\uFF0C\u6216\u586B 0 \u4E0D\u4F20 max_tokens\u3002",
  visionBaseUrl: "\u63A5\u53E3\u5730\u5740",
  visionBaseUrlHint: "\u9ED8\u8BA4 https://api.deepseek.com\u3002\u652F\u6301\u4EFB\u4F55 OpenAI \u517C\u5BB9\u683C\u5F0F URL(\u90E8\u5206\u5730\u5740\u9700\u8981\u540E\u9762\u52A0/v1)\u3002",
  maxTokens: "\u8F93\u51FA\u4E0A\u9650",
  maxTokensHint: "\u89C6\u89C9\u6A21\u578B\u8F93\u51FA\u4E0A\u9650\uFF0C\u586B 0 \u8868\u793A\u4E0D\u4F20 max_tokens\uFF0C\u54CD\u5E94\u88AB\u622A\u65AD\u53EF\u8C03\u5927\u3002",
  relaxAdmission: "\u5141\u8BB8\u7ED9\u4E0D\u80FD\u770B\u56FE\u7684\u6A21\u578B\u53D1\u56FE",
  relaxAdmissionHint: "\u5173\u95ED\u540E\u6309\u6A21\u578B\u80FD\u529B\u62D2\u7EDD\u8D34\u56FE\u3002",
  models: "\u653E\u884C\u7684\u6A21\u578B",
  modelsHint: "\u7A7A\u8868\u793A\u5168\u90E8\u653E\u884C\u3002",
  modelsEmpty: "\u5F53\u524D\u653E\u884C\u5168\u90E8\u4E0D\u80FD\u770B\u56FE\u7684\u6A21\u578B\u3002",
  providerPlaceholder: "provider",
  modelPlaceholder: "model",
  add: "\u6DFB\u52A0",
  remove: "\u79FB\u9664 {name}",
  updateHint: "\u53D1\u73B0\u65B0\u7248\u672C {old} \u2192 {new}",
  updateCopy: "\u590D\u5236\u5347\u7EA7\u547D\u4EE4",
  updateCopied: "\u5DF2\u590D\u5236",
  updateCopyFail: "\u590D\u5236\u5931\u8D25"
};
var en = {
  save: "Save",
  saving: "Saving\u2026",
  discard: "Discard",
  saveFailed: "Save failed. Your edits were kept \u2014 check them and try again.",
  overridden: "Overridden",
  reset: "Reset to default",
  apiKey: "API key",
  apiKeyHint: "Stored outside the settings file. Leave blank to keep the current key.",
  apiKeySet: "A key is configured.",
  apiKeyUnset: "No key is configured; vision is unavailable until one is.",
  visionModel: "Vision model",
  visionModelHint: "Default is deepseek-flash. You can also use Qwen, GLM, or other OpenAI-compatible vision models.",
  disableThinking: "Disable thinking",
  disableThinkingOffHint: "Thinking consumes the output budget. Raise the cap, or set it to 0 to omit max_tokens.",
  visionBaseUrl: "Endpoint",
  visionBaseUrlHint: "Default is https://api.deepseek.com. Any OpenAI-compatible URL (some addresses need /v1 appended).",
  maxTokens: "Output cap",
  maxTokensHint: "Vision model output cap. Set 0 to omit max_tokens. Raise this if the response is truncated.",
  relaxAdmission: "Allow images on text-only models",
  relaxAdmissionHint: "Turn off to reject pasted images by model capability.",
  models: "Allowed models",
  modelsHint: "Empty admits every text-only model.",
  modelsEmpty: "Every text-only model is currently admitted.",
  providerPlaceholder: "provider",
  modelPlaceholder: "model",
  add: "Add",
  remove: "Remove {name}",
  updateHint: "Update available: {old} \u2192 {new}",
  updateCopy: "Copy upgrade command",
  updateCopied: "Copied",
  updateCopyFail: "Copy failed"
};
var NS = "image-pathify";
function fmt(template, params) {
  if (params === void 0) return template;
  return template.replace(
    /\{(\w+)\}/g,
    (whole, key) => params[key] ?? whole
  );
}

// src/client/ImagePathifyCard.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function RemoveIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", "aria-hidden": true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "path",
    {
      d: "m4 4 8 8m0-8-8 8",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.4",
      strokeLinecap: "round"
    }
  ) });
}
function PlusIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", "aria-hidden": true, width: "12", height: "12", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "path",
    {
      d: "M8 3v10M3 8h10",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeLinecap: "round"
    }
  ) });
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(input);
      return ok;
    } catch {
      return false;
    }
  }
}
function modelKey2(entry) {
  return `${entry.provider}\0${entry.model}`;
}
function OverrideBadges({
  overridden,
  disabled,
  overriddenLabel,
  resetLabel,
  onReset
}) {
  if (!overridden) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh_imagePathify_badges", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_imagePathify_badge", children: overriddenLabel }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        className: "dsh_imagePathify_reset",
        disabled,
        onClick: onReset,
        children: resetLabel
      }
    )
  ] });
}
function ImagePathifyCard({
  useImagePathifyCard,
  t,
  edit,
  resetField,
  save,
  discard,
  setDisableThinking,
  setRelaxAdmission,
  addModel,
  removeModel
}) {
  const [providerDraft, setProviderDraft] = (0, import_react.useState)("");
  const [modelDraft, setModelDraft] = (0, import_react.useState)("");
  const [copyState, setCopyState] = (0, import_react.useState)(
    "idle"
  );
  const state = useImagePathifyCard((snapshot) => snapshot);
  (0, import_react.useEffect)(() => {
    if (copyState === "idle") return;
    const id = window.setTimeout(() => {
      setCopyState("idle");
    }, 2e3);
    return () => {
      window.clearTimeout(id);
    };
  }, [copyState]);
  if (!state.available) return null;
  const disabled = !state.writable || state.saving;
  const blocked = !state.dirty || state.invalid || state.saving;
  const translate = (key, params) => fmt(t(key), params);
  const commitModel = () => {
    const provider = providerDraft.trim();
    const model = modelDraft.trim();
    if (provider.length === 0 || model.length === 0 || disabled) return;
    addModel(provider, model);
    setProviderDraft("");
    setModelDraft("");
  };
  const copyUpgrade = () => {
    const command = state.update?.command;
    if (command === void 0) return;
    void copyText(command).then((ok) => {
      setCopyState(ok ? "copied" : "failed");
    });
  };
  const copyLabel = copyState === "copied" ? t("updateCopied") : copyState === "failed" ? t("updateCopyFail") : t("updateCopy");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_form", children: [
    state.update !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_update", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_imagePathify_updateText", children: translate("updateHint", {
        old: state.update.installedVersion,
        new: state.update.latestVersion
      }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          type: "button",
          className: "dsh_imagePathify_updateCopy",
          onClick: copyUpgrade,
          children: copyLabel
        }
      )
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_fieldHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "label",
            {
              className: "dsh_imagePathify_label",
              htmlFor: "plugin-config-image-pathify-key",
              children: t("apiKey")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_imagePathify_badges", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "span",
            {
              className: state.apiKeySet ? "dsh_imagePathify_badge" : "dsh_imagePathify_badgeMuted",
              children: state.apiKeySet ? t("apiKeySet") : t("apiKeyUnset")
            }
          ) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            id: "plugin-config-image-pathify-key",
            className: "dsh_imagePathify_input",
            type: "password",
            autoComplete: "off",
            spellCheck: false,
            value: state.apiKeyText,
            disabled: state.saving || !state.apiKeyWritable,
            onChange: (event) => {
              edit("apiKey", event.target.value);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_imagePathify_hint", children: t("apiKeyHint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_fieldHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "label",
            {
              className: "dsh_imagePathify_label",
              htmlFor: "plugin-config-image-pathify-model",
              children: t("visionModel")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            OverrideBadges,
            {
              overridden: state.visionModel.overridden || state.disableThinking.overridden,
              disabled,
              overriddenLabel: t("overridden"),
              resetLabel: t("reset"),
              onReset: () => {
                resetField("visionModel");
                resetField("disableThinking");
              }
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_modelRow", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              id: "plugin-config-image-pathify-model",
              className: "dsh_imagePathify_input",
              spellCheck: false,
              value: state.visionModel.text,
              disabled,
              onChange: (event) => {
                edit("visionModel", event.target.value);
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh_imagePathify_inlineToggle", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: state.disableThinking.checked,
                disabled,
                onChange: (event) => {
                  setDisableThinking(event.target.checked);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("disableThinking") })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_imagePathify_hint", children: t("visionModelHint") }),
        state.disableThinking.checked ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_imagePathify_hint", children: t("disableThinkingOffHint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_fieldHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "label",
            {
              className: "dsh_imagePathify_label",
              htmlFor: "plugin-config-image-pathify-url",
              children: t("visionBaseUrl")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            OverrideBadges,
            {
              overridden: state.visionBaseUrl.overridden,
              disabled,
              overriddenLabel: t("overridden"),
              resetLabel: t("reset"),
              onReset: () => {
                resetField("visionBaseUrl");
              }
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            id: "plugin-config-image-pathify-url",
            className: "dsh_imagePathify_input",
            spellCheck: false,
            value: state.visionBaseUrl.text,
            disabled,
            onChange: (event) => {
              edit("visionBaseUrl", event.target.value);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_imagePathify_hint", children: t("visionBaseUrlHint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_fieldHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "label",
            {
              className: "dsh_imagePathify_label",
              htmlFor: "plugin-config-image-pathify-max-tokens",
              children: t("maxTokens")
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            OverrideBadges,
            {
              overridden: state.maxTokens.overridden,
              disabled,
              overriddenLabel: t("overridden"),
              resetLabel: t("reset"),
              onReset: () => {
                resetField("maxTokens");
              }
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "input",
          {
            id: "plugin-config-image-pathify-max-tokens",
            className: "dsh_imagePathify_input",
            inputMode: "numeric",
            spellCheck: false,
            value: state.maxTokens.text,
            disabled,
            onChange: (event) => {
              edit("maxTokens", event.target.value);
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_imagePathify_hint", children: t("maxTokensHint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_fieldHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh_imagePathify_toggle", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                type: "checkbox",
                checked: state.relaxAdmission.checked,
                disabled,
                onChange: (event) => {
                  setRelaxAdmission(event.target.checked);
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_imagePathify_label", children: t("relaxAdmission") })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            OverrideBadges,
            {
              overridden: state.relaxAdmission.overridden,
              disabled,
              overriddenLabel: t("overridden"),
              resetLabel: t("reset"),
              onReset: () => {
                resetField("relaxAdmission");
              }
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_imagePathify_hint", children: t("relaxAdmissionHint") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_fieldHead", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_imagePathify_label", children: t("models") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            OverrideBadges,
            {
              overridden: state.models.overridden,
              disabled,
              overriddenLabel: t("overridden"),
              resetLabel: t("reset"),
              onReset: () => {
                resetField("models");
              }
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_imagePathify_hint", children: t("modelsHint") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_imagePathify_list", "aria-live": "polite", children: state.models.entries.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_imagePathify_empty", children: t("modelsEmpty") }) : state.models.entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            className: "dsh_imagePathify_filterRow",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("code", { className: "dsh_imagePathify_filterName", children: [
                entry.provider,
                " / ",
                entry.model
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  type: "button",
                  className: "dsh_imagePathify_filterRemove",
                  title: translate("remove", {
                    name: `${entry.provider}/${entry.model}`
                  }),
                  "aria-label": translate("remove", {
                    name: `${entry.provider}/${entry.model}`
                  }),
                  disabled,
                  onClick: () => {
                    removeModel(entry.provider, entry.model);
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RemoveIcon, {})
                }
              )
            ]
          },
          modelKey2(entry)
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: "dsh_imagePathify_input",
              spellCheck: false,
              disabled,
              value: providerDraft,
              placeholder: t("providerPlaceholder"),
              onChange: (event) => {
                setProviderDraft(event.target.value);
              },
              onKeyDown: (event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                commitModel();
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "input",
            {
              className: "dsh_imagePathify_input",
              spellCheck: false,
              disabled,
              value: modelDraft,
              placeholder: t("modelPlaceholder"),
              onChange: (event) => {
                setModelDraft(event.target.value);
              },
              onKeyDown: (event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                commitModel();
              }
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "button",
            {
              type: "button",
              className: "dsh_imagePathify_addButton",
              disabled: disabled || providerDraft.trim().length === 0 || modelDraft.trim().length === 0,
              onClick: () => {
                commitModel();
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlusIcon, {}),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("add") })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_imagePathify_footer", children: [
        state.failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_imagePathify_failed", role: "status", children: t("saveFailed") }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: "dsh_imagePathify_save",
            disabled: blocked,
            onClick: save,
            children: t(state.saving ? "saving" : "save")
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            className: "dsh_imagePathify_discard",
            disabled: !state.dirty || state.saving,
            onClick: discard,
            children: t("discard")
          }
        )
      ] })
    ] })
  ] });
}

// src/client/credentials-api.ts
function isRecord2(value) {
  return typeof value === "object" && value !== null;
}
function isCredentialsMethods(value) {
  return isRecord2(value) && typeof value.describe === "function" && typeof value.set === "function";
}
function viewOf(value) {
  if (!isRecord2(value)) return void 0;
  return {
    configured: value.configured === true,
    writable: value.writable !== false
  };
}
function resolveCredentialsApi(ctx) {
  const nested = ctx.get("remote.credentials");
  if (isCredentialsMethods(nested)) return nested;
  const remote = ctx.get("remote");
  if (isRecord2(remote) && isCredentialsMethods(remote.credentials)) {
    return remote.credentials;
  }
  return void 0;
}
function describeView(result, ref) {
  if (!isRecord2(result)) return void 0;
  const inner = isRecord2(result.result) ? result.result : result;
  if (inner.ok === false) return { configured: false, writable: true };
  const value = inner.value;
  if (!isRecord2(value)) return void 0;
  const bag = isRecord2(value.credentials) ? value.credentials : value;
  return viewOf(bag[ref]);
}
function setRefused(result) {
  if (!isRecord2(result)) return false;
  const inner = isRecord2(result.result) ? result.result : result;
  return inner.ok === false;
}
function credentialsFace(api) {
  return {
    async describe(ref) {
      if (api === void 0) return { configured: false, writable: true };
      const result = await api.describe([ref]);
      return describeView(result, ref) ?? { configured: false, writable: true };
    },
    async set(ref, value) {
      if (api === void 0) {
        throw new Error("the credentials API is not available");
      }
      const result = await api.set(ref, value);
      if (setRefused(result)) {
        throw new Error("credentials.set refused");
      }
    }
  };
}
function liveCredentials(ctx) {
  return {
    describe(ref) {
      return credentialsFace(resolveCredentialsApi(ctx)).describe(ref);
    },
    set(ref, value) {
      return credentialsFace(resolveCredentialsApi(ctx)).set(ref, value);
    }
  };
}

// src/client/remote.ts
var IMAGE_PATHIFY_REMOTE = {
  package: "dsh-image-pathify",
  descriptors: IMAGE_PATHIFY_INVOCATIONS
};

// src/client/styles.ts
var STYLE_ID = "dsh-image-pathify-style";
var cssText = `
.dsh_imagePathify_form {
  display: flex;
  flex-direction: column;
  background: none;
}
.dsh_imagePathify_body {
  display: flex;
  flex-direction: column;
}
.dsh_imagePathify_field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 0;
}
.dsh_imagePathify_field + .dsh_imagePathify_field {
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}
.dsh_imagePathify_fieldHead {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dsh_imagePathify_label {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}
.dsh_imagePathify_badges {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.dsh_imagePathify_badge {
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 11px;
  line-height: 17px;
  white-space: nowrap;
  font-weight: 500;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-secondary);
}
.dsh_imagePathify_badgeMuted {
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 11px;
  line-height: 17px;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary);
}
.dsh_imagePathify_reset {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dsh_imagePathify_reset:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
}
.dsh_imagePathify_reset:disabled {
  cursor: default;
}
.dsh_imagePathify_input {
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}
.dsh_imagePathify_input:focus-visible {
  outline: none;
  border-color: var(--dsw-alias-brand-primary);
}
.dsh_imagePathify_input:disabled {
  color: var(--dsw-alias-label-tertiary);
  cursor: default;
}
.dsh_imagePathify_hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dsh_imagePathify_toggle {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  cursor: pointer;
}
.dsh_imagePathify_toggle input {
  flex: none;
  width: 16px;
  height: 16px;
  margin: 3px 0 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.dsh_imagePathify_list {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3);
}
.dsh_imagePathify_filterRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  min-height: 36px;
  padding: 0 8px 0 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
}
.dsh_imagePathify_filterRow:last-child {
  border-bottom: 0;
}
.dsh_imagePathify_filterName {
  min-width: 0;
  overflow: hidden;
  color: var(--dsw-alias-label-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsh_imagePathify_filterRemove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 14px;
  background: none;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.dsh_imagePathify_filterRemove:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover-danger);
  color: var(--dsw-alias-state-error-primary);
}
.dsh_imagePathify_filterRemove svg,
.dsh_imagePathify_addButton svg {
  width: 12px;
  height: 12px;
}
.dsh_imagePathify_empty {
  padding: 8px 12px;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 1.5;
}
.dsh_imagePathify_row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.dsh_imagePathify_row > .dsh_imagePathify_input {
  flex: 1 1 0;
  min-width: 0;
}
.dsh_imagePathify_modelRow {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dsh_imagePathify_modelRow > .dsh_imagePathify_input {
  flex: 1 1 0;
  min-width: 0;
  width: 0;
}
.dsh_imagePathify_inlineToggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  margin-left: auto;
  font-size: 12px;
  line-height: 1.4;
  color: var(--dsw-alias-label-primary);
  cursor: pointer;
  white-space: nowrap;
}
.dsh_imagePathify_inlineToggle input {
  flex: none;
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.dsh_imagePathify_addButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: none;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: none;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
}
.dsh_imagePathify_addButton:hover:not(:disabled) {
  border-color: var(--dsw-alias-label-dimmed);
}
.dsh_imagePathify_addButton:disabled,
.dsh_imagePathify_filterRemove:disabled {
  opacity: 0.4;
  cursor: default;
}
.dsh_imagePathify_footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
}
.dsh_imagePathify_failed {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-state-error-primary);
}
.dsh_imagePathify_discard,
.dsh_imagePathify_save {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 5px 14px;
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
}
.dsh_imagePathify_discard {
  border-color: var(--dsw-alias-border-l2);
  background: none;
  color: var(--dsw-alias-label-secondary);
}
.dsh_imagePathify_discard:hover:not(:disabled) {
  color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-label-dimmed);
}
.dsh_imagePathify_save {
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-bg-layer-3);
}
.dsh_imagePathify_discard:disabled,
.dsh_imagePathify_save:disabled {
  opacity: 0.4;
  cursor: default;
}
.dsh_imagePathify_discard:focus-visible,
.dsh_imagePathify_save:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.dsh_imagePathify_update {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 0 12px;
}
.dsh_imagePathify_updateText {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--dsw-alias-state-warn-primary);
}
.dsh_imagePathify_updateCopy {
  appearance: none;
  flex: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  padding: 3px 10px;
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  background: none;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dsh_imagePathify_updateCopy:hover {
  color: var(--dsw-alias-label-primary);
  border-color: var(--dsw-alias-label-dimmed);
}
.dsh_imagePathify_updateCopy:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
`;
function adoptStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = cssText;
  document.head.appendChild(style);
}

// src/client/index.ts
var ENTRY_ID = "dsh-image-pathify";
var inject = [
  "slots",
  "locale",
  "remote",
  "remote.credentials",
  "configForms"
];
function apply(ctx) {
  adoptStyles();
  ctx.effect(
    () => ctx.locale.register(NS, { zh, en }),
    "dsh-image-pathify: dictionaries"
  );
  const form = ctx.configForms.get(ENTRY_ID);
  let remote;
  let settingsTail = Promise.resolve();
  const readForm = () => {
    const snapshot = form.getSnapshot();
    if (snapshot.status !== "ready") return void 0;
    try {
      return publicSettingsSchema.parse(snapshot.value);
    } catch (error) {
      console.error("[dsh-image-pathify] settings read failed:", error);
      return void 0;
    }
  };
  const publishForm = () => {
    const value = readForm();
    if (value === void 0) {
      if (form.getSnapshot().status === "unavailable") card.markUnavailable();
      return;
    }
    card.receive(value);
  };
  const updateSettings = (update) => {
    const operation = settingsTail.then(async () => {
      const snapshot = form.getSnapshot();
      const ops = Object.entries(update).filter((entry) => entry[1] !== void 0).map(([key, value]) => ({ op: "set", path: [key], value }));
      if (ops.length > 0) {
        const ok = await form.mutate(ops, snapshot.revision);
        if (!ok) {
          const error = new Error("settings update was refused");
          console.error("[dsh-image-pathify] settings update failed:", error);
          throw error;
        }
      }
      const next = readForm();
      if (next === void 0) {
        throw new Error("settings update was refused");
      }
      return next;
    });
    settingsTail = operation.then(
      () => void 0,
      () => void 0
    );
    return operation;
  };
  const card = new ImagePathifyCardController(
    updateSettings,
    liveCredentials(ctx)
  );
  ctx.effect(() => form.subscribe(publishForm), "dsh-image-pathify: config");
  publishForm();
  ctx.effect(() => {
    const onUpdated = ctx.remote.$on;
    if (typeof onUpdated !== "function") return;
    const refresh = ((ref) => {
      card.refreshCredential(ref);
    });
    return onUpdated.call(ctx.remote, "credentials/reference-updated", refresh);
  }, "dsh-image-pathify: credential invalidations");
  const loadUpdate = async () => {
    const handle = remote;
    if (handle === void 0) return;
    try {
      const result = await handle.getUpdate();
      if (remote !== handle) return;
      if (!result.ok) return;
      card.receiveUpdate(result.value);
    } catch {
    }
  };
  ctx.effect(async () => {
    const dispose = await ctx.remote.$mount(IMAGE_PATHIFY_REMOTE);
    remote = ctx.reflect.get(
      "remote.imagePathify"
    );
    if (remote === void 0) {
      throw new Error(
        "dsh-image-pathify: the imagePathify Remote namespace did not mount"
      );
    }
    void loadUpdate();
    return () => {
      remote = void 0;
      void dispose();
    };
  }, "dsh-image-pathify: remote");
  ctx.on("connection/reset", () => {
    publishForm();
    void loadUpdate();
  });
  ctx.effect(
    () => ctx.configForms.whileServed(
      [ENTRY_ID],
      () => ctx.slots.inject(
        "plugins.bundle.config",
        () => ctx.slots.register(
          {
            name: "plugins.bundle.config",
            key: ENTRY_ID,
            locale: NS,
            inject: () => card.inject()
          },
          ImagePathifyCard
        )
      )
    ),
    "dsh-image-pathify: page"
  );
}
return module.exports; } });
//# sourceMappingURL=client.js.map
