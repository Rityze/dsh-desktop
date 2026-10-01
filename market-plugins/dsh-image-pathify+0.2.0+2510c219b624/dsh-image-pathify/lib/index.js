// src/admission.ts
import { symbols } from "@deepseek-ai/cordis";
function unwrapService(value) {
  const target = value[symbols.original];
  return target ?? value;
}
function installAdmissionShim(ctx, config) {
  const llm = unwrapService(ctx.llm);
  const original = llm.resolveModelInfo.bind(llm);
  const wrapped = (async (provider, model, signal) => {
    const info = await original(provider, model, signal);
    if (ctx.get("attachments") === void 0) return info;
    if (info.inputModalities === void 0 || info.inputModalities.includes("image"))
      return info;
    if (config.models.length > 0 && !config.models.some(
      (entry) => entry.provider === provider && entry.model === model
    )) {
      return info;
    }
    const { inputModalities: _dropped, ...rest } = info;
    return rest;
  });
  llm.resolveModelInfo = wrapped;
  return () => {
    if (llm.resolveModelInfo === wrapped) llm.resolveModelInfo = original;
  };
}

// src/index.ts
import { deepFreeze as deepFreeze2 } from "@deepseek-ai/dsh-util-values";

// node_modules/@deepseek-ai/cosmokit/lib/index.js
function isNullable(value) {
  return value === null || value === void 0;
}
function isPlainObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}
function filterKeys(object, filter) {
  return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
}
function mapValues(object, transform) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
}
function pick(source, keys, forced) {
  if (!keys) return { ...source };
  const result = {};
  for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
  return result;
}
var write = /* @__PURE__ */ Symbol.for("cosmokit.volatile.write");
function snapshot(value, ancestors = /* @__PURE__ */ new Set()) {
  if (typeof value === "function") throw new TypeError("volatile config cannot contain functions");
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value)) throw new TypeError("volatile config cannot contain cycles");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) return Object.freeze(value.map((item) => snapshot(item, ancestors)));
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new TypeError("volatile config objects must be plain objects or arrays");
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item, ancestors)])));
  } finally {
    ancestors.delete(value);
  }
}
function createVolatile(value) {
  let current = snapshot(value);
  return Object.freeze({
    get: () => current,
    [write]: (value2) => {
      current = value2;
    }
  });
}
function isVolatile(value) {
  return typeof value === "object" && value !== null && write in value;
}
function is(type, value) {
  if (arguments.length === 1) return (value2) => is(type, value2);
  return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
var Binary;
(function(Binary2) {
  Binary2.is = isArrayBufferLike;
  Binary2.isSource = isArrayBufferSource;
  function fromSource(source) {
    if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    else return source;
  }
  Binary2.fromSource = fromSource;
  function toBase64(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
    let binary = "";
    const bytes = new Uint8Array(source);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  Binary2.toBase64 = toBase64;
  function fromBase64(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
    return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
  }
  Binary2.fromBase64 = fromBase64;
  function toHex(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
    return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  Binary2.toHex = toHex;
  function fromHex(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
    const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
    const buffer = [];
    for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
    return Uint8Array.from(buffer).buffer;
  }
  Binary2.fromHex = fromHex;
})(Binary || (Binary = {}));
var base64ToArrayBuffer = Binary.fromBase64;
var arrayBufferToBase64 = Binary.toBase64;
var hexToArrayBuffer = Binary.fromHex;
var arrayBufferToHex = Binary.toHex;
function clone(source, refs = /* @__PURE__ */ new Map()) {
  if (!source || typeof source !== "object") return source;
  if (is("Date", source)) return new Date(source.valueOf());
  if (is("RegExp", source)) return new RegExp(source.source, source.flags);
  if (isArrayBufferLike(source)) return source.slice(0);
  if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const cached = refs.get(source);
  if (cached) return cached;
  if (Array.isArray(source)) {
    const result2 = [];
    refs.set(source, result2);
    source.forEach((value, index) => {
      result2[index] = Reflect.apply(clone, null, [value, refs]);
    });
    return result2;
  }
  const result = Object.create(Object.getPrototypeOf(source));
  refs.set(source, result);
  for (const key of Reflect.ownKeys(source)) {
    const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
    if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
    Reflect.defineProperty(result, key, descriptor);
  }
  return result;
}
function deepEqual(a, b, strict) {
  const ancestors = /* @__PURE__ */ new Set();
  function compare(a2, b2) {
    if (a2 === b2) return true;
    if (isVolatile(a2) || isVolatile(b2)) return isVolatile(a2) && isVolatile(b2);
    if (!strict && isNullable(a2) && isNullable(b2)) return true;
    if (typeof a2 !== typeof b2 || typeof a2 !== "object" || !a2 || !b2) return false;
    if (ancestors.has(a2)) return false;
    function check(test, then) {
      return test(a2) ? test(b2) ? then(a2, b2) : false : test(b2) ? false : void 0;
    }
    ancestors.add(a2);
    try {
      return check(Array.isArray, (a3, b3) => {
        if (a3.length !== b3.length) return false;
        for (let index = 0; index < a3.length; index++) if (!compare(a3[index], b3[index])) return false;
        return true;
      }) ?? check(is("Date"), (a3, b3) => a3.valueOf() === b3.valueOf()) ?? check(is("URL"), (a3, b3) => a3.href === b3.href) ?? check(is("RegExp"), (a3, b3) => a3.source === b3.source && a3.flags === b3.flags) ?? check(isArrayBufferLike, (a3, b3) => {
        if (a3.byteLength !== b3.byteLength) return false;
        const viewA = new Uint8Array(a3);
        const viewB = new Uint8Array(b3);
        for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
        return true;
      }) ?? ((!strict || [a2, b2].every((value) => Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) && Object.keys({
        ...a2,
        ...b2
      }).every((key) => compare(a2[key], b2[key])));
    } finally {
      ancestors.delete(a2);
    }
  }
  return compare(a, b);
}
var Time;
(function(Time2) {
  Time2.millisecond = 1;
  Time2.second = 1e3;
  Time2.minute = Time2.second * 60;
  Time2.hour = Time2.minute * 60;
  Time2.day = Time2.hour * 24;
  Time2.week = Time2.day * 7;
  let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time2.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time2.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date2 = /* @__PURE__ */ new Date(), offset) {
    if (typeof date2 === "number") date2 = new Date(date2);
    if (offset === void 0) offset = timezoneOffset;
    return Math.floor((date2.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date2 = new Date(value * Time2.day);
    if (offset === void 0) offset = timezoneOffset;
    return new Date(+date2 + offset * Time2.minute);
  }
  Time2.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture) return 0;
    return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
  }
  Time2.parseTime = parseTime;
  function parseDate(date2) {
    const parsed = parseTime(date2);
    if (parsed) date2 = Date.now() + parsed;
    else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) date2 = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date2}`;
    else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date2)) date2 = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date2}`;
    return date2 ? new Date(date2) : /* @__PURE__ */ new Date();
  }
  Time2.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time2.day - Time2.hour / 2) return Math.round(ms / Time2.day) + "d";
    else if (abs >= Time2.hour - Time2.minute / 2) return Math.round(ms / Time2.hour) + "h";
    else if (abs >= Time2.minute - Time2.second / 2) return Math.round(ms / Time2.minute) + "m";
    else if (abs >= Time2.second) return Math.round(ms / Time2.second) + "s";
    return ms + "ms";
  }
  Time2.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time2.toDigits = toDigits;
  function template(template2, time = /* @__PURE__ */ new Date()) {
    return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time2.template = template;
})(Time || (Time = {}));

// node_modules/@deepseek-ai/schemastery/lib/index.mjs
var kSchema = /* @__PURE__ */ Symbol.for("schemastery");
var kValidationError = /* @__PURE__ */ Symbol.for("ValidationError");
globalThis.__schemastery_index__ ??= 0;
globalThis.__schemastery_refs__ = void 0;
var ValidationError = class extends TypeError {
  options;
  name = "ValidationError";
  constructor(message, options) {
    let prefix = "$";
    for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
    else if (typeof segment === "number") prefix += "[" + segment + "]";
    else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
    if (prefix.startsWith(".")) prefix = prefix.slice(1);
    super((prefix === "$" ? "" : `${prefix} `) + message);
    this.options = options;
  }
  static is(error) {
    return !!error?.[kValidationError];
  }
};
Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
var Schema = function(options) {
  const schema = function(data, options2 = {}) {
    return Schema.resolve(data, schema, options2)[0];
  };
  if (options.refs) {
    const refs = mapValues(options.refs, (options2) => new Schema(options2));
    const getRef = (uid) => refs[uid];
    for (const key in refs) {
      const options2 = refs[key];
      options2.sKey = getRef(options2.sKey);
      options2.inner = getRef(options2.inner);
      options2.list = options2.list && options2.list.map(getRef);
      options2.dict = options2.dict && mapValues(options2.dict, getRef);
    }
    return refs[options.uid];
  }
  Object.assign(schema, options);
  if (typeof schema.callback === "string") try {
    schema.callback = new Function("return " + schema.callback)();
  } catch {
  }
  Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
  Object.setPrototypeOf(schema, Schema.prototype);
  schema.meta ||= {};
  schema.toString = schema.toString.bind(schema);
  return schema;
};
Schema.prototype = Object.create(Function.prototype);
Schema.prototype[kSchema] = true;
Object.defineProperty(Schema.prototype, "~standard", { get() {
  return {
    version: 1,
    vendor: "schemastery",
    validate: (value) => {
      try {
        return { value: Schema.resolve(value, this, {})[0] };
      } catch (error) {
        if (ValidationError.is(error)) return { issues: [{
          message: error.message,
          path: error.options.path
        }] };
        throw error;
      }
    }
  };
} });
Schema.ValidationError = ValidationError;
Schema.prototype.toJSON = function toJSON() {
  if (globalThis.__schemastery_refs__) {
    globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
    return this.uid;
  }
  globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
  globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
  const result = {
    uid: this.uid,
    refs: globalThis.__schemastery_refs__
  };
  globalThis.__schemastery_refs__ = void 0;
  return result;
};
Schema.prototype.set = function set(key, value) {
  this.dict[key] = value;
  return this;
};
Schema.prototype.push = function push(value) {
  this.list.push(value);
  return this;
};
function mergeDesc(original, messages) {
  const result = typeof original === "string" ? { "": original } : { ...original };
  for (const locale in messages) {
    const value = messages[locale];
    if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
    else if (typeof value === "string") result[locale] = value;
  }
  return result;
}
function getInner(value) {
  return value?.$value ?? value?.$inner;
}
function extractKeys(data) {
  return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
}
Schema.prototype.i18n = function i18n(messages) {
  const schema = Schema(this);
  const desc = mergeDesc(schema.meta.description, messages);
  if (Object.keys(desc).length) schema.meta.description = desc;
  if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
    return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
  });
  if (schema.list) schema.list = schema.list.map((inner, index) => {
    return inner.i18n(mapValues(messages, (data = {}) => {
      if (Array.isArray(getInner(data))) return getInner(data)[index];
      if (Array.isArray(data)) return data[index];
      return extractKeys(data);
    }));
  });
  if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
    if (getInner(data)) return getInner(data);
    return extractKeys(data);
  }));
  if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
  return schema;
};
Schema.prototype.extra = function extra(key, value) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
};
for (const key of [
  "required",
  "disabled",
  "collapse",
  "hidden",
  "loose"
]) Object.assign(Schema.prototype, { [key](value = true) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
} });
Schema.prototype.deprecated = function deprecated() {
  const schema = Schema(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({
    text: "deprecated",
    type: "danger"
  });
  return schema;
};
Schema.prototype.experimental = function experimental() {
  const schema = Schema(this);
  schema.meta.badges ||= [];
  schema.meta.badges.push({
    text: "experimental",
    type: "warning"
  });
  return schema;
};
Schema.prototype.pattern = function pattern(regexp) {
  const schema = Schema(this);
  const pattern2 = pick(regexp, ["source", "flags"]);
  schema.meta = {
    ...schema.meta,
    pattern: pattern2
  };
  return schema;
};
Schema.prototype.simplify = function simplify(value) {
  if (isVolatile(value)) value = value.get();
  if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
  if (isNullable(value)) return value;
  if (this.type === "object" || this.type === "dict") {
    const result = {};
    for (const key in value) {
      const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
      if (this.type === "dict" || !isNullable(item)) result[key] = item;
    }
    if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
    return result;
  } else if (this.type === "array" || this.type === "tuple") {
    const result = [];
    value.forEach((value2, index) => {
      const schema = this.type === "array" ? this.inner : this.list[index];
      const item = schema ? schema.simplify(value2) : value2;
      result.push(item);
    });
    return result;
  } else if (this.type === "intersect") {
    const result = {};
    for (const item of this.list) Object.assign(result, item.simplify(value));
    return result;
  } else if (this.type === "union") for (const schema of this.list) try {
    Schema.resolve(value, schema, {});
    return schema.simplify(value);
  } catch {
  }
  return value;
};
Schema.prototype.toString = function toString(inline) {
  return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
};
Schema.prototype.role = function role(role, extra2) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    role,
    extra: extra2
  };
  return schema;
};
for (const key of [
  "default",
  "link",
  "comment",
  "description",
  "max",
  "min",
  "step"
]) Object.assign(Schema.prototype, { [key](value) {
  const schema = Schema(this);
  schema.meta = {
    ...schema.meta,
    [key]: value
  };
  return schema;
} });
Schema.prototype.volatile = function volatile() {
  if (this.meta.volatile) throw new TypeError("volatile schema is already wrapped");
  return this.extra("volatile", true);
};
var resolvers = {};
var checkedVolatile = /* @__PURE__ */ Symbol("checked-volatile-schema");
function validateVolatileSchema(schema, path = [], blocked = false, seen = /* @__PURE__ */ new Map()) {
  const states = seen.get(schema) ?? /* @__PURE__ */ new Set();
  if (states.has(blocked)) return;
  states.add(blocked);
  seen.set(schema, states);
  if (schema.meta?.volatile && blocked) throw new ValidationError("volatile fields require a fixed object path without an enclosing volatile field", { path });
  const nested = blocked || !!schema.meta?.volatile;
  if (schema.dict) for (const [key, child] of Object.entries(schema.dict)) validateVolatileSchema(child, [...path, key], nested, seen);
  if (schema.sKey) validateVolatileSchema(schema.sKey, [...path, "<key>"], true, seen);
  if (schema.inner && (schema.type !== "lazy" || schema.inner[kSchema])) validateVolatileSchema(schema.inner, [...path, "*"], true, seen);
  if (schema.list) for (let index = 0; index < schema.list.length; index++) validateVolatileSchema(schema.list[index], [...path, String(index)], true, seen);
}
Schema.extend = function extend(type, resolve2) {
  resolvers[type] = resolve2;
};
Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
  if (!schema) return [data];
  if (!options[checkedVolatile]) {
    validateVolatileSchema(schema, options.path);
    options = {
      ...options,
      [checkedVolatile]: true
    };
  }
  if (schema.meta?.volatile) {
    const inner = Schema(schema);
    inner.meta = {
      ...schema.meta,
      volatile: false
    };
    const [value, adapted] = Schema.resolve(data, inner, options, strict);
    try {
      return [createVolatile(value), adapted];
    } catch (error) {
      throw new ValidationError(error instanceof Error ? error.message : String(error), options);
    }
  }
  if (options.ignore?.(data, schema)) return [data];
  if (isNullable(data) && schema.type !== "lazy") {
    if (schema.meta.required) throw new ValidationError(`missing required value`, options);
    let current = schema;
    let fallback = schema.meta.default;
    while (current?.type === "intersect" && isNullable(fallback)) {
      current = current.list[0];
      fallback = current?.meta.default;
    }
    if (isNullable(fallback)) return [data];
    data = clone(fallback);
  }
  const callback = resolvers[schema.type];
  if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
  try {
    return callback(data, schema, options, strict);
  } catch (error) {
    if (!schema.meta.loose) throw error;
    return [schema.meta.default];
  }
};
Schema.from = function from(source) {
  if (isNullable(source)) return Schema.any();
  else if ([
    "string",
    "number",
    "boolean"
  ].includes(typeof source)) return Schema.const(source).required();
  else if (source[kSchema]) return source;
  else if (typeof source === "function") switch (source) {
    case String:
      return Schema.string().required();
    case Number:
      return Schema.number().required();
    case Boolean:
      return Schema.boolean().required();
    case Function:
      return Schema.function().required();
    default:
      return Schema.is(source).required();
  }
  else throw new TypeError(`cannot infer schema from ${source}`);
};
Schema.lazy = function lazy(builder) {
  const toJSON2 = () => {
    if (!schema.inner[kSchema]) {
      schema.inner = schema.builder();
      schema.inner.meta = {
        ...schema.meta,
        ...schema.inner.meta
      };
    }
    return schema.inner.toJSON();
  };
  const schema = new Schema({
    type: "lazy",
    builder,
    inner: { toJSON: toJSON2 }
  });
  return schema;
};
Schema.natural = function natural() {
  return Schema.number().step(1).min(0);
};
Schema.percent = function percent() {
  return Schema.number().step(0.01).min(0).max(1).role("slider");
};
Schema.date = function date() {
  return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
    const date2 = new Date(value);
    if (isNaN(+date2)) throw new ValidationError(`invalid date "${value}"`, options);
    return date2;
  }, true)]);
};
Schema.regExp = function regExp(flag = "") {
  return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
    try {
      return new RegExp(value, flag);
    } catch (e) {
      throw new ValidationError(e.message, options);
    }
  }, true)]);
};
Schema.arrayBuffer = function arrayBuffer(encoding) {
  return Schema.union([
    Schema.is(ArrayBuffer),
    Schema.is(SharedArrayBuffer),
    Schema.transform(Schema.any(), (value, options) => {
      if (Binary.isSource(value)) return Binary.fromSource(value);
      throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
    }, true),
    ...encoding ? [Schema.transform(Schema.string(), (value, options) => {
      try {
        return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
      } catch (e) {
        throw new ValidationError(e.message, options);
      }
    }, true)] : []
  ]);
};
Schema.extend("lazy", (data, schema, options, strict) => {
  if (!schema.inner[kSchema]) {
    schema.inner = schema.builder();
    schema.inner.meta = {
      ...schema.meta,
      ...schema.inner.meta
    };
    validateVolatileSchema(schema.inner, options.path, true);
  }
  return Schema.resolve(data, schema.inner, options, strict);
});
Schema.extend("any", (data) => {
  return [data];
});
Schema.extend("never", (data, _, options) => {
  throw new ValidationError(`expected nullable but got ${data}`, options);
});
Schema.extend("const", (data, { value }, options) => {
  if (deepEqual(data, value)) return [value];
  throw new ValidationError(`expected ${value} but got ${data}`, options);
});
function checkWithinRange(data, meta, description, options, skipMin = false) {
  const { max = Infinity, min = -Infinity } = meta;
  if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
  if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
}
Schema.extend("string", (data, { meta }, options) => {
  if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
  if (meta.pattern) {
    const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
    if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
  }
  checkWithinRange(data.length, meta, "string length", options);
  return [data];
});
function decimalShift(data, digits) {
  const str = data.toString();
  if (str.includes("e")) return data * Math.pow(10, digits);
  const index = str.indexOf(".");
  if (index === -1) return data * Math.pow(10, digits);
  const frac = str.slice(index + 1);
  const integer = str.slice(0, index);
  if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
  return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
}
function isMultipleOf(data, min, step) {
  step = Math.abs(step);
  if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
  const index = step.toString().indexOf(".");
  const digits = step.toString().slice(index + 1).length;
  return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
}
Schema.extend("number", (data, { meta }, options) => {
  if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
  checkWithinRange(data, meta, "number", options);
  const { step } = meta;
  if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
  return [data];
});
Schema.extend("boolean", (data, _, options) => {
  if (typeof data === "boolean") return [data];
  throw new ValidationError(`expected boolean but got ${data}`, options);
});
Schema.extend("bitset", (data, { bits, meta }, options) => {
  let value = 0, keys = [];
  if (typeof data === "number") {
    value = data;
    for (const key in bits) if (data & bits[key]) keys.push(key);
  } else if (Array.isArray(data)) {
    keys = data;
    for (const key of keys) {
      if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
      if (key in bits) value |= bits[key];
    }
  } else throw new ValidationError(`expected number or array but got ${data}`, options);
  if (value === meta.default) return [value];
  return [value, keys];
});
Schema.extend("function", (data, _, options) => {
  if (typeof data === "function") return [data];
  throw new ValidationError(`expected function but got ${data}`, options);
});
Schema.extend("is", (data, { constructor }, options) => {
  if (typeof constructor === "function") {
    if (data instanceof constructor) return [data];
    throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
  } else {
    if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
    let prototype = Object.getPrototypeOf(data);
    while (prototype) {
      if (prototype.constructor?.name === constructor) return [data];
      prototype = Object.getPrototypeOf(prototype);
    }
    throw new ValidationError(`expected ${constructor} but got ${data}`, options);
  }
});
function property(data, key, schema, options) {
  try {
    const [value, adapted] = Schema.resolve(data[key], schema, {
      ...options,
      path: [...options.path || [], key]
    });
    if (adapted !== void 0) data[key] = adapted;
    return value;
  } catch (e) {
    if (!options?.autofix) throw e;
    delete data[key];
    return schema.meta.volatile ? createVolatile(schema.meta.default) : schema.meta.default;
  }
}
Schema.extend("array", (data, { inner, meta }, options) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
  return [data.map((_, index) => property(data, index, inner, options))];
});
Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in data) {
    let rKey;
    try {
      rKey = Schema.resolve(key, sKey, options)[0];
    } catch (error) {
      if (strict) continue;
      throw error;
    }
    result[rKey] = property(data, key, inner, options);
    data[rKey] = data[key];
    if (key !== rKey) delete data[key];
  }
  return [result];
});
Schema.extend("tuple", (data, { list }, options, strict) => {
  if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
  const result = list.map((inner, index) => property(data, index, inner, options));
  if (strict) return [result];
  result.push(...data.slice(list.length));
  return [result];
});
function merge(result, data) {
  for (const key in data) {
    if (key in result) continue;
    result[key] = data[key];
  }
}
Schema.extend("object", (data, { dict }, options, strict) => {
  if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
  const result = {};
  for (const key in dict) {
    const value = property(data, key, dict[key], options);
    if (!isNullable(value) || key in data) result[key] = value;
  }
  if (!strict) merge(result, data);
  return [result];
});
Schema.extend("union", (data, { list, toString: toString2 }, options, strict) => {
  const messages = [];
  for (const inner of list) try {
    return Schema.resolve(data, inner, options, strict);
  } catch (error) {
    messages.push(error);
  }
  throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
});
Schema.extend("intersect", (data, { list, toString: toString2 }, options, strict) => {
  if (!list.length) return [data];
  let result;
  for (const inner of list) {
    const value = Schema.resolve(data, inner, options, true)[0];
    if (isNullable(value)) continue;
    if (isNullable(result)) result = value;
    else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
    else if (typeof value === "object") merge(result ??= {}, value);
    else if (result !== value) throw new ValidationError(`expected ${toString2()} but got ${JSON.stringify(data)}`, options);
  }
  if (!strict && isPlainObject(data)) merge(result, data);
  return [result];
});
Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
  const [result, adapted = data] = Schema.resolve(data, inner, options, true);
  if (preserve) return [callback(result)];
  else return [callback(result), callback(adapted)];
});
var formatters = {};
function defineMethod(name2, keys, format) {
  formatters[name2] = format;
  Object.assign(Schema, { [name2](...args) {
    const schema = new Schema({ type: name2 });
    keys.forEach((key, index) => {
      switch (key) {
        case "sKey":
          schema.sKey = args[index] ?? Schema.string();
          break;
        case "inner":
          schema.inner = Schema.from(args[index]);
          break;
        case "list":
          schema.list = args[index].map(Schema.from);
          break;
        case "dict":
          schema.dict = mapValues(args[index], Schema.from);
          break;
        case "bits":
          schema.bits = {};
          for (const key2 in args[index]) {
            if (typeof args[index][key2] !== "number") continue;
            schema.bits[key2] = args[index][key2];
          }
          break;
        case "callback": {
          const callback = schema.callback = args[index];
          callback["toJSON"] ||= () => callback.toString();
          break;
        }
        case "constructor": {
          const constructor = schema.constructor = args[index];
          if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
          break;
        }
        default:
          schema[key] = args[index];
      }
    });
    if (name2 === "object" || name2 === "dict") schema.meta.default = {};
    else if (name2 === "array" || name2 === "tuple") schema.meta.default = [];
    else if (name2 === "bitset") schema.meta.default = 0;
    return schema;
  } });
}
defineMethod("is", ["constructor"], ({ constructor }) => {
  if (typeof constructor === "function") return constructor.name;
  else return constructor;
});
defineMethod("any", [], () => "any");
defineMethod("never", [], () => "never");
defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
defineMethod("string", [], () => "string");
defineMethod("number", [], () => "number");
defineMethod("boolean", [], () => "boolean");
defineMethod("bitset", ["bits"], () => "bitset");
defineMethod("function", [], () => "function");
defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
defineMethod("object", ["dict"], ({ dict }) => {
  if (Object.keys(dict).length === 0) return "{}";
  return `{ ${Object.entries(dict).map(([key, inner]) => {
    return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
  }).join(", ")} }`;
});
defineMethod("union", ["list"], ({ list }, inline) => {
  const result = list.map(({ toString: format }) => format()).join(" | ");
  return inline ? `(${result})` : result;
});
defineMethod("intersect", ["list"], ({ list }) => {
  return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
});
defineMethod("transform", [
  "inner",
  "callback",
  "preserve"
], ({ inner }, isInner) => inner.toString(isInner));

// src/defaults.ts
var DEFAULT_PREFIX = "Saved attachments: ";
var DEFAULT_VISION_MODEL = "deepseek-flash";
var DEFAULT_VISION_BASE_URL = "https://api.deepseek.com";
var DEFAULT_API_KEY_ENV = "IMAGE_PATHIFY_API_KEY";
var DEFAULT_MAX_TOKENS = 2048;
var MIN_VISION_MAX_TOKENS = 0;
var DEFAULT_DISABLE_THINKING = true;
var MAX_VISION_MAX_TOKENS = 32768;

// src/config.ts
function live(schema) {
  const candidate = schema;
  if (typeof candidate.volatile === "function") return candidate.volatile();
  if (typeof candidate.extra === "function")
    return candidate.extra("volatile", true);
  return schema;
}
var Config = Schema.object({
  /**
   * Restrict host-admission relaxation to these exact provider/model pairs.
   * Empty (default) relaxes every model whose declared input modalities
   * exclude `image` while an attachment store is present.
   */
  models: live(
    Schema.array(
      Schema.object({
        provider: Schema.string(),
        model: Schema.string()
      })
    ).default([])
  ),
  /**
   * Install the `ctx.llm.resolveModelInfo` shim that makes host image
   * admission preflights admit text-only models. Disable when the harness
   * itself already relaxes those gates.
   */
  relaxAdmission: live(Schema.boolean().default(true)),
  /** Credential reference resolved for each vision call. */
  apiKeyEnv: live(
    Schema.string().role("credential-ref").default(DEFAULT_API_KEY_ENV)
  ),
  /** Vision model id (default `deepseek-flash`). */
  visionModel: live(Schema.string().default(DEFAULT_VISION_MODEL)),
  /** OpenAI-compatible vision base URL. */
  visionBaseUrl: live(Schema.string().default(DEFAULT_VISION_BASE_URL)),
  /**
   * When true, DeepSeek-style endpoints get `thinking: { type: "disabled" }`.
   * Captioning does not need a chain of thought; uncheck to let the model think.
   */
  disableThinking: live(Schema.boolean().default(DEFAULT_DISABLE_THINKING)),
  /**
   * `max_tokens` for a vision completion (one or many images). `0` omits
   * the field so the provider uses its own default cap.
   */
  maxTokens: live(
    Schema.number().min(MIN_VISION_MAX_TOKENS).max(MAX_VISION_MAX_TOKENS).step(1).default(DEFAULT_MAX_TOKENS)
  )
});
var VOLATILE_WRITE = /* @__PURE__ */ Symbol.for("cosmokit.volatile.write");
function isVolatileRef(value) {
  return typeof value === "object" && value !== null && VOLATILE_WRITE in value;
}
function volatileRef(value) {
  let current = value;
  return Object.freeze({
    get: () => current,
    [VOLATILE_WRITE](next) {
      current = next;
    }
  });
}
function wrapVolatileFields(schema, value) {
  if (schema.meta?.volatile) {
    return isVolatileRef(value) ? value : volatileRef(value);
  }
  if (schema.type === "object" && schema.dict !== void 0 && typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value;
    let changed = false;
    const next = { ...record };
    for (const [key, child] of Object.entries(schema.dict)) {
      if (!Object.hasOwn(record, key)) continue;
      const wrapped = wrapVolatileFields(child, record[key]);
      if (wrapped !== record[key]) {
        next[key] = wrapped;
        changed = true;
      }
    }
    return changed ? next : value;
  }
  return value;
}
var standard = Object.getOwnPropertyDescriptor(
  Object.getPrototypeOf(Config),
  "~standard"
);
if (standard?.get !== void 0) {
  Object.defineProperty(Config, "~standard", {
    configurable: true,
    get() {
      const face = standard.get.call(this);
      return {
        ...face,
        validate: (value) => {
          const result = face.validate(value);
          if (result.issues !== void 0 || !("value" in result))
            return result;
          return { value: wrapVolatileFields(this, result.value) };
        }
      };
    }
  });
}

// src/live.ts
var VOLATILE_WRITE2 = /* @__PURE__ */ Symbol.for("cosmokit.volatile.write");
var FIELDS = [
  "models",
  "relaxAdmission",
  "apiKeyEnv",
  "visionModel",
  "visionBaseUrl",
  "disableThinking",
  "maxTokens"
];
function isVolatileRef2(value) {
  return typeof value === "object" && value !== null && VOLATILE_WRITE2 in value;
}
function unwrap(value) {
  return isVolatileRef2(value) ? value.get() : value;
}
function plainFields(value) {
  if (typeof value !== "object" || value === null) return void 0;
  const record = value;
  if (!FIELDS.some((field) => isVolatileRef2(record[field]))) return void 0;
  const plain = {};
  for (const field of FIELDS) plain[field] = unwrap(record[field]);
  return plain;
}
function readConfig(input) {
  const source = plainFields(input) ?? input ?? {};
  const parsed = Config(source);
  return plainFields(parsed) ?? parsed;
}

// src/pathify.ts
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
import { contentHasImage, freezeMessage } from "@deepseek-ai/dsh-llm";
import { deepFreeze } from "@deepseek-ai/dsh-util-values";
var MEDIA_EXTENSION = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/avif": ".avif"
};
function messagesHaveImage(messages) {
  return messages.some((message) => contentHasImage(message.content));
}
function publishedImagePath(attachments, ref) {
  try {
    const path = attachments.imageHostPath(ref);
    return path !== void 0 && path.length > 0 ? path : void 0;
  } catch {
    return void 0;
  }
}
function fallbackFilePath(ref) {
  const leaf = String(ref.attachmentId).replace(/^sha256:/, "").replace(/[^a-z0-9]/gi, "_");
  return join(
    resolveDshHome(),
    "attachments",
    "vision-paths",
    `${leaf}${MEDIA_EXTENSION[ref.mediaType] ?? ""}`
  );
}
async function resolveImagePath(attachments, ref, signal) {
  const published = publishedImagePath(attachments, ref);
  if (published !== void 0) return published;
  const file = fallbackFilePath(ref);
  try {
    await access(file);
    return file;
  } catch {
  }
  const stored = await attachments.readImage(ref, signal);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, stored.data);
  return file;
}
async function rewriteBlocks(blocks, attachments, signal) {
  const next = await Promise.all(
    blocks.map(async (block) => {
      if (block.type !== "image") return block;
      const path = await resolveImagePath(
        attachments,
        block.attachment,
        signal
      );
      return { type: "text", text: `${DEFAULT_PREFIX}${path}` };
    })
  );
  if (next.every((block, index) => block === blocks[index])) return blocks;
  return next;
}
function isDurableMessage(message) {
  return message.id !== void 0;
}
function freezeRewritten(message, content) {
  if (!isDurableMessage(message)) return { role: "user", content };
  return freezeMessage({ ...message, content });
}
async function pathifyImages(options, attachments, signal) {
  if (!messagesHaveImage(options.messages)) return options;
  const messages = await Promise.all(
    options.messages.map(async (message) => {
      if (!contentHasImage(message.content)) return message;
      const content = await rewriteBlocks(message.content, attachments, signal);
      if (content === message.content) return message;
      return freezeRewritten(message, content);
    })
  );
  if (messages.every((message, index) => message === options.messages[index])) {
    return options;
  }
  const rewritten = { ...options, messages };
  return Object.isFrozen(options) ? deepFreeze(rewritten) : rewritten;
}

// src/policy.ts
var VISION_PROMPT_ORDER = 118;
var VISION_PROMPT_NAME = "tool:analyze-image";
var ANALYZE_IMAGE_TOOL = "analyze_image";
var READ_IMAGE_TOOL = "read_image";
function visionPromptText() {
  return [
    `When the user sends, pastes, or references an image \u2014 including an embedded image, a file:// URL, or a local path ending in .png/.jpg/.jpeg/.gif/.webp/.bmp/.tif/.tiff/.heic/.heif/.avif \u2014 call analyze_image with the absolute path. Never call read_image for an image.`,
    `Text that starts with "${DEFAULT_PREFIX}" is a saved image file. Strip that prefix and pass the remaining absolute path to analyze_image, with a question about the image.`,
    `When several images appear in the same turn, pass every path in a single analyze_image call via the images array. Do not call analyze_image once per image.`,
    `analyze_image also accepts an http(s) image URL. If analyze_image fails because the vision API is not configured, tell the user to open Settings \u2192 Plugins \u2192 Vision and set the API key and model.`
  ].join(" ");
}
function readImageDenyReason(filePath) {
  const path = filePath.trim().length > 0 ? filePath.trim() : "<image path>";
  return `Do not use read_image: the current model cannot accept image input. Call analyze_image with image="${path}" (the absolute path, without any "${DEFAULT_PREFIX.trimEnd()}" prefix) to get a text description instead.`;
}
function analyzeImageDenyReason() {
  return "Do not use analyze_image: the current model can view images. If an image is already in the conversation, describe it directly. If the user only gave a local file path, call read_image with that path instead.";
}
function stripAnalyzeImage(assembly) {
  return {
    ...assembly,
    sections: assembly.sections.filter(
      (section) => section.name !== VISION_PROMPT_NAME
    ),
    tools: assembly.tools.filter((tool) => tool.name !== ANALYZE_IMAGE_TOOL)
  };
}
function filterAssemblyForRoute(assembly, vision) {
  if (vision) return stripAnalyzeImage(assembly);
  const tools = assembly.tools.filter((tool) => tool.name !== READ_IMAGE_TOOL);
  if (tools.length === assembly.tools.length) return assembly;
  return { ...assembly, tools };
}
function stripVisionParagraph(text) {
  const paragraph = visionPromptText();
  if (paragraph.length === 0 || !text.includes(paragraph)) return text;
  return text.replace(paragraph, "").replace(/\n{3,}/g, "\n\n").trim();
}
function stripVisionPromptFromMessages(messages) {
  let changed = false;
  const next = messages.map((message) => {
    if (message.role !== "system" || message.content === void 0) {
      return message;
    }
    let contentChanged = false;
    const content = message.content.map((block) => {
      if (block.type !== "text" || typeof block.text !== "string") return block;
      const text = stripVisionParagraph(block.text);
      if (text === block.text) return block;
      contentChanged = true;
      return { ...block, text };
    });
    if (!contentChanged) return message;
    changed = true;
    return { ...message, content };
  });
  return changed ? next : messages;
}
function filterDispatchForRoute(request, vision) {
  const deny = vision ? ANALYZE_IMAGE_TOOL : READ_IMAGE_TOOL;
  const tools = request.tools;
  const nextTools = tools?.filter((tool) => tool.name !== deny);
  const toolsChanged = nextTools !== void 0 && nextTools.length !== (tools?.length ?? 0);
  let system = request.system;
  if (vision && typeof system === "string") {
    system = stripVisionParagraph(system);
  }
  const systemChanged = system !== request.system;
  let messages = request.messages;
  let messagesChanged = false;
  if (vision && messages !== void 0) {
    const stripped = stripVisionPromptFromMessages(messages);
    if (stripped !== messages) {
      messages = stripped;
      messagesChanged = true;
    }
  }
  if (!toolsChanged && !systemChanged && !messagesChanged) return request;
  return {
    ...request,
    ...toolsChanged ? { tools: nextTools } : {},
    ...systemChanged ? { system } : {},
    ...messagesChanged ? { messages } : {}
  };
}
function requestHeaderRoute(agent) {
  const routed = agent?.session?.requestHeader?.()?.config;
  const provider = routed?.provider;
  const model = routed?.model;
  if (provider === void 0 || model === void 0) return void 0;
  return { provider, model };
}
async function assembleVisionPolicy(ctx, _assembly, context, next) {
  const result = await next();
  const header = requestHeaderRoute(context.agent);
  if (header === void 0) return result;
  const vision = await routeAcceptsImage(
    ctx,
    { options: header },
    context.signal
  );
  return filterAssemblyForRoute(result, vision);
}
function routedModel(agent) {
  const routed = agent?.session?.requestHeader?.()?.config;
  const provider = routed?.provider ?? agent?.options?.provider;
  const model = routed?.model ?? agent?.options?.model;
  if (provider === void 0 || model === void 0) return void 0;
  return { provider, model };
}
async function routeAcceptsImage(ctx, agent, signal) {
  const route = routedModel(agent);
  const llm = ctx.get("llm");
  if (route === void 0 || llm === void 0) return false;
  let info;
  try {
    info = await llm.resolveModelInfo(route.provider, route.model, signal);
  } catch {
    return false;
  }
  return info.inputModalities !== void 0 && info.inputModalities.includes("image");
}
async function readImagePreExecute(ctx, exec, next) {
  if (exec.name !== "read_image") return next();
  if (await routeAcceptsImage(ctx, exec.agent, exec.signal)) return next();
  const filePath = typeof exec.arguments === "object" && exec.arguments !== null && "file_path" in exec.arguments && typeof exec.arguments.file_path === "string" ? exec.arguments.file_path : "";
  return { kind: "deny", reason: readImageDenyReason(filePath) };
}
async function analyzeImagePreExecute(ctx, exec, next) {
  if (exec.name !== ANALYZE_IMAGE_TOOL) return next();
  if (!await routeAcceptsImage(ctx, exec.agent, exec.signal)) return next();
  return { kind: "deny", reason: analyzeImageDenyReason() };
}
async function visionToolsPreExecute(ctx, exec, next) {
  if (exec.name === "read_image") return readImagePreExecute(ctx, exec, next);
  if (exec.name === ANALYZE_IMAGE_TOOL) {
    return analyzeImagePreExecute(ctx, exec, next);
  }
  return next();
}
function installVisionPolicy(ctx) {
  ctx.systemPrompt.section({
    name: VISION_PROMPT_NAME,
    order: VISION_PROMPT_ORDER,
    text: () => visionPromptText()
  });
  ctx.on(
    "system-prompt/assemble",
    (assembly, context, next) => assembleVisionPolicy(ctx, assembly, context, next)
  );
}

// src/runtime.ts
import { Service } from "@deepseek-ai/cordis";
var ImagePathifyRuntime = class extends Service {
  constructor(ctx, readUpdate) {
    super(ctx, "imagePathify");
    this.readUpdate = readUpdate;
    this.typertRemote = Object.freeze({
      service: this,
      serviceKey: this.name,
      namespace: this.name
    });
  }
  readUpdate;
  /** Visible binding consumed by the Host Gateway's source-mode discovery. */
  typertRemote;
  /** Return the cached npm latest-version probe (started at plugin load). */
  getUpdate() {
    return this.readUpdate();
  }
};

// src/credentials.ts
var REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
function credentialRefName(value) {
  const trimmed = value.trim();
  return REF_PATTERN.test(trimmed) ? trimmed : DEFAULT_API_KEY_ENV;
}
async function resolveVisionApiKey(ctx, apiKeyEnv) {
  const ref = credentialRefName(apiKeyEnv);
  const credentials = ctx.get("credentials");
  if (credentials !== void 0) {
    const hit = await credentials.resolve(ref);
    if (hit !== void 0 && hit.value.length > 0) return hit.value;
  }
  const ambient = process.env[ref];
  return ambient !== void 0 && ambient.length > 0 ? ambient : "";
}

// src/vision.ts
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
var DEFAULT_VISION_PROMPT = "\u8BF7\u8BE6\u7EC6\u63CF\u8FF0\u8FD9\u5F20\u56FE\u7247\u7684\u5185\u5BB9\u3002";
var MIME_BY_EXT = {
  jpg: "jpeg",
  jpeg: "jpeg",
  jpe: "jpeg",
  jfif: "jpeg",
  png: "png",
  gif: "gif",
  webp: "webp",
  bmp: "bmp",
  tif: "tiff",
  tiff: "tiff",
  heic: "heic",
  heif: "heif",
  avif: "avif"
};
var defaultIo = {
  async readFile(path, signal) {
    return new Uint8Array(await readFile(path, { signal }));
  },
  fetch: (input, init) => globalThis.fetch(input, init)
};
function isRemoteImageUrl(image) {
  return /^https?:\/\//i.test(image.trim());
}
function completionsUrl(baseUrl) {
  const trimmed = baseUrl.trim();
  if (trimmed.length === 0) {
    throw new Error(
      "Vision API base URL is empty. Open Settings \u2192 Plugins \u2192 Vision and set the endpoint."
    );
  }
  return `${trimmed.replace(/\/?$/, "/")}chat/completions`;
}
function shouldDisableThinking(model, baseUrl) {
  return /deepseek/i.test(model) || /deepseek\.com/i.test(baseUrl);
}
function imageSubtype(path, data) {
  if (data.length >= 8 && data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71) {
    return "png";
  }
  if (data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255) {
    return "jpeg";
  }
  if (data.length >= 6 && data[0] === 71 && data[1] === 73 && data[2] === 70) {
    return "gif";
  }
  if (data.length >= 12 && data[0] === 82 && data[1] === 73 && data[2] === 70 && data[3] === 70 && data[8] === 87 && data[9] === 69 && data[10] === 66 && data[11] === 80) {
    return "webp";
  }
  const ext = extname(path).toLowerCase().replace(".", "");
  return MIME_BY_EXT[ext] ?? "jpeg";
}
async function imageUrlPart(image, io, signal) {
  const source = image.trim();
  if (source.length === 0)
    throw new Error("image must be a non-empty path or URL");
  if (isRemoteImageUrl(source)) return source;
  signal?.throwIfAborted();
  const data = await io.readFile(source, signal);
  const subtype = imageSubtype(source, data);
  return `data:image/${subtype};base64,${Buffer.from(data).toString("base64")}`;
}
function assertVisionConfigured(apiKey, model) {
  if (apiKey.trim().length === 0 || model.trim().length === 0) {
    throw new Error(
      "Vision API is not configured. Open Settings \u2192 Plugins \u2192 Vision and set the API key and model."
    );
  }
}
function textFromContent(content) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content.map((part) => {
    if (typeof part === "string") return part;
    if (typeof part !== "object" || part === null) return "";
    const text = part.text;
    return typeof text === "string" ? text : "";
  }).join("").trim();
}
function contentFromResponse(payload) {
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Vision API returned a non-object body");
  }
  const choices = payload.choices;
  if (!Array.isArray(choices) || choices[0] === void 0) {
    throw new Error("Vision API returned no choices");
  }
  const choice = choices[0];
  const message = choice.message;
  const content = textFromContent(message?.content);
  if (content.length > 0) return content;
  const reasoning = textFromContent(message?.reasoning_content);
  if (reasoning.length > 0) return reasoning;
  const finish = typeof choice.finish_reason === "string" && choice.finish_reason.length > 0 ? ` (finish_reason=${choice.finish_reason})` : "";
  throw new Error(`Vision API returned an empty message${finish}`);
}
function multiImagePrompt(count, question) {
  return [
    `\u4EE5\u4E0B\u5171 ${String(count)} \u5F20\u56FE\u7247\uFF0C\u5DF2\u5168\u90E8\u9644\u4E0A\uFF0C\u6309\u51FA\u73B0\u987A\u5E8F\u7F16\u53F7\u4E3A\u56FE1 \u5230 \u56FE${String(count)}\u3002`,
    "\u8BF7\u6309\u7F16\u53F7\u5206\u522B\u8BE6\u7EC6\u63CF\u8FF0\u6BCF\u4E00\u5F20\uFF0C\u4E0D\u8981\u8BF4\u53EA\u80FD\u770B\u5230\u4E00\u5F20\u56FE\u3002",
    "",
    question
  ].join("\n");
}
function formatMultiImageResult(images, description) {
  const legend = images.map((image, index) => `${String(index + 1)}. ${image}`).join("\n");
  return `Images in order:
${legend}

${description}`;
}
async function completeVision(request, io) {
  const apiKey = request.apiKey.trim();
  const model = request.model.trim();
  assertVisionConfigured(apiKey, model);
  if (request.images.length === 0) {
    throw new Error("image or images must include a non-empty path or URL");
  }
  const imageUrls = await Promise.all(
    request.images.map((image) => imageUrlPart(image, io, request.signal))
  );
  request.signal?.throwIfAborted();
  const content = [
    ...imageUrls.map((url) => ({
      type: "image_url",
      image_url: { url }
    })),
    { type: "text", text: request.prompt }
  ];
  const body = {
    model,
    messages: [{ role: "user", content }],
    stream: false
  };
  if (typeof request.maxTokens === "number" && request.maxTokens > 0) {
    body.max_tokens = request.maxTokens;
  }
  if ((request.disableThinking ?? true) && shouldDisableThinking(model, request.baseUrl)) {
    body.thinking = { type: "disabled" };
  }
  const response = await io.fetch(completionsUrl(request.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    signal: request.signal
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Vision API ${String(response.status)}: ${text.slice(0, 300)}`
    );
  }
  try {
    return contentFromResponse(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError) return text;
    throw error;
  }
}
async function analyzeImage(request, io = defaultIo) {
  return completeVision(
    {
      apiKey: request.apiKey,
      model: request.model,
      baseUrl: request.baseUrl,
      prompt: request.prompt,
      signal: request.signal,
      disableThinking: request.disableThinking,
      images: [request.image],
      maxTokens: request.maxTokens
    },
    io
  );
}
async function analyzeImages(request, io = defaultIo) {
  if (request.images.length === 0) {
    throw new Error("image or images must include a non-empty path or URL");
  }
  if (request.images.length === 1) {
    return analyzeImage({ ...request, image: request.images[0] }, io);
  }
  const text = await completeVision(
    {
      ...request,
      prompt: multiImagePrompt(request.images.length, request.prompt)
    },
    io
  );
  return formatMultiImageResult(request.images, text);
}

// src/tool.ts
function collectImageSources(args) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) return;
    seen.add(trimmed);
    out.push(trimmed);
  };
  if (Array.isArray(args.image)) {
    for (const item of args.image) add(item);
  } else {
    add(args.image);
  }
  if (Array.isArray(args.images)) {
    for (const item of args.images) add(item);
  }
  return out;
}
function registerAnalyzeImageTool(ctx, current) {
  ctx.tools.register({
    name: "analyze_image",
    description: 'Analyze one or more images at local absolute paths or HTTP(S) URLs and return text descriptions. Use this instead of read_image when the current model cannot view images, including when the user gives a local image path rather than embedding the file. If you can already see the image, answer directly and do not call this tool. Conversation text that starts with "Saved attachments: " is a saved image file \u2014 pass the absolute path after that prefix. When the user sends several images, pass every path in a single call via images (or an image array). Do not call this tool once per image.',
    parameters: {
      type: "object",
      properties: {
        image: {
          oneOf: [
            { type: "string" },
            { type: "array", items: { type: "string" } }
          ],
          description: 'Absolute local image path, or an http(s) URL. Do not include the "Saved attachments: " prefix. For several images, prefer images.'
        },
        images: {
          type: "array",
          items: { type: "string" },
          description: "One or more absolute local paths or http(s) URLs. When the user sends several images in the same turn, pass every path here in a single call."
        },
        prompt: {
          type: "string",
          description: "Question about the image(s). Defaults to a detailed Chinese description."
        }
      }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => [
        { type: "text", text: value }
      ]
    },
    presentCall: (args) => {
      const sources = collectImageSources(args);
      if (sources.length === 0) return void 0;
      if (sources.length === 1) {
        const only = sources[0];
        return {
          card: "generic",
          title: only,
          kind: "read",
          rawInput: only
        };
      }
      return {
        card: "generic",
        title: `${String(sources.length)} images`,
        kind: "read",
        rawInput: sources.join("\n")
      };
    },
    async execute(args, exec) {
      const images = collectImageSources(args);
      if (images.length === 0) {
        throw new Error("image or images must include a non-empty path or URL");
      }
      const settings = current();
      const prompt = typeof args.prompt === "string" && args.prompt.trim().length > 0 ? args.prompt.trim() : DEFAULT_VISION_PROMPT;
      const request = {
        apiKey: await resolveVisionApiKey(ctx, settings.apiKeyEnv),
        model: settings.visionModel.trim() || DEFAULT_VISION_MODEL,
        baseUrl: settings.visionBaseUrl,
        prompt,
        signal: exec.signal,
        disableThinking: settings.disableThinking,
        maxTokens: settings.maxTokens
      };
      if (images.length === 1) {
        return analyzeImage({
          ...request,
          image: images[0]
        });
      }
      return analyzeImages({
        ...request,
        images
      });
    }
  });
}

// src/contract.ts
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

// src/typert.ts
var TYPERT_MANIFEST = {
  package: "dsh-image-pathify",
  face: "host",
  schemas: [],
  model: {
    services: [
      {
        key: "imagePathify",
        exportName: "ImagePathifyRuntime",
        description: "npm latest-version probe for this plugin.",
        tags: [],
        members: [
          {
            kind: "method",
            name: "getUpdate",
            signature: "getUpdate(): Promise<ImagePathifyUpdateStatus>"
          }
        ],
        types: []
      }
    ],
    events: [],
    objects: []
  },
  invocations: IMAGE_PATHIFY_INVOCATIONS
};

// src/update.ts
import { readFileSync } from "node:fs";
import { basename, dirname as dirname2, join as join2 } from "node:path";
import { fileURLToPath } from "node:url";
var REGISTRIES = [
  "https://registry.npmmirror.com",
  "https://registry.npmjs.org"
];
var FETCH_TIMEOUT_MS = 8e3;
var DEFAULT_PLUGIN_PROFILE = "web";
function isUsableProfileName(name2) {
  return name2.length > 0 && name2 !== "." && name2 !== ".." && name2 !== "node_modules" && !name2.includes("/") && !name2.includes("\\") && !name2.includes("\0");
}
function desktopProfileName(desktopProfiles) {
  if (typeof desktopProfiles !== "object" || desktopProfiles === null) {
    return void 0;
  }
  const name2 = desktopProfiles.current?.name;
  return typeof name2 === "string" && isUsableProfileName(name2) ? name2 : void 0;
}
function profileNameFromBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.length === 0) return void 0;
  let dir;
  try {
    dir = fileURLToPath(baseUrl);
  } catch {
    return void 0;
  }
  const trimmed = dir.replace(/[\\/]+$/, "");
  if (basename(dirname2(trimmed)) !== "profiles") return void 0;
  const name2 = basename(trimmed);
  return isUsableProfileName(name2) ? name2 : void 0;
}
function quoteProfileArg(profile) {
  return /^[A-Za-z0-9._-]+$/.test(profile) ? profile : JSON.stringify(profile);
}
function resolvePluginProfile(desktopProfiles, baseUrl) {
  return desktopProfileName(desktopProfiles) ?? profileNameFromBaseUrl(baseUrl) ?? DEFAULT_PLUGIN_PROFILE;
}
function readOwnPackage() {
  const fallback = { name: "dsh-image-pathify", version: "0.0.0" };
  try {
    const pkgPath = join2(
      dirname2(fileURLToPath(import.meta.url)),
      "..",
      "package.json"
    );
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    return {
      name: typeof pkg.name === "string" ? pkg.name : fallback.name,
      version: typeof pkg.version === "string" ? pkg.version : fallback.version
    };
  } catch {
    return fallback;
  }
}
function upgradeCommand(packageName, version, profile = DEFAULT_PLUGIN_PROFILE) {
  return `dsh plugin --profile ${quoteProfileArg(profile)} add ${packageName}@${version}`;
}
function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let i = 0; i < 3; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av < bv ? -1 : 1;
  }
  return 0;
}
function parseVersion(value) {
  const core = value.trim().replace(/^v/i, "").split("-")[0] ?? "0";
  const parts = core.split(".").map((part) => {
    const n = Number.parseInt(part, 10);
    return Number.isFinite(n) ? n : 0;
  });
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}
function idleStatus(packageName, installedVersion, profile) {
  return {
    installedVersion,
    latestVersion: installedVersion,
    updateAvailable: false,
    command: upgradeCommand(packageName, installedVersion, profile)
  };
}
async function fetchNpmLatest(packageName, fetchImpl) {
  for (const base of REGISTRIES) {
    try {
      const response = await fetchImpl(
        `${base}/${encodeURIComponent(packageName)}`,
        {
          headers: { "User-Agent": "dsh-image-pathify" },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        }
      );
      if (!response.ok) continue;
      const body = await response.json();
      const latest = body["dist-tags"]?.latest;
      if (typeof latest === "string" && latest.length > 0) return latest;
    } catch {
    }
  }
  return void 0;
}
async function checkPluginUpdate(options = {}) {
  const own = readOwnPackage();
  const packageName = options.packageName ?? own.name;
  const installedVersion = options.installedVersion ?? own.version;
  const profile = options.profile ?? DEFAULT_PLUGIN_PROFILE;
  const fetchImpl = options.fetchImpl ?? fetch;
  const latestVersion = await fetchNpmLatest(packageName, fetchImpl);
  if (latestVersion === void 0) {
    return idleStatus(packageName, installedVersion, profile);
  }
  return {
    installedVersion,
    latestVersion,
    updateAvailable: compareVersions(installedVersion, latestVersion) < 0,
    command: upgradeCommand(packageName, latestVersion, profile)
  };
}

// src/index.ts
var name = "dsh-image-pathify";
var inject = ["llm"];
async function shouldRewrite(ctx, options) {
  let info;
  try {
    info = await ctx.llm.resolveModelInfo(
      options.provider,
      options.model,
      options.signal
    );
  } catch {
    info = void 0;
  }
  return !(info?.inputModalities !== void 0 && info.inputModalities.includes("image"));
}
function applyDispatchPolicy(ctx, options, vision) {
  const filtered = filterDispatchForRoute(options, vision);
  if (filtered === options) return options;
  return Object.isFrozen(options) ? deepFreeze2(filtered) : filtered;
}
function pathifyStream(ctx, options, next) {
  return (async function* () {
    const resume = (routed2) => routed2 === options ? next() : ctx.llm.stream(routed2);
    const vision = !await shouldRewrite(ctx, options);
    const routed = applyDispatchPolicy(ctx, options, vision);
    if (vision || !messagesHaveImage(routed.messages)) {
      yield* resume(routed);
      return;
    }
    const attachments = ctx.get("attachments");
    if (attachments === void 0) {
      yield* resume(routed);
      return;
    }
    options.signal?.throwIfAborted();
    const rewritten = await pathifyImages(routed, attachments, options.signal);
    if (rewritten === options) {
      yield* next();
      return;
    }
    options.signal?.throwIfAborted();
    yield* ctx.llm.stream(rewritten);
  })();
}
function apply(ctx, config) {
  const current = () => readConfig(config);
  ctx.on(
    "llm/stream",
    (options, next) => {
      return pathifyStream(ctx, options, next);
    }
  );
  let disposeShim;
  const syncAdmission = () => {
    disposeShim?.();
    disposeShim = void 0;
    if (current().relaxAdmission) {
      disposeShim = installAdmissionShim(ctx, { models: current().models });
    }
  };
  ctx.effect(() => {
    syncAdmission();
    return () => {
      disposeShim?.();
      disposeShim = void 0;
    };
  });
  ctx.on("loader/volatile-update", () => {
    syncAdmission();
  });
  ctx.inject(["typert"], (tctx) => {
    const updateProbe = checkPluginUpdate({
      profile: resolvePluginProfile(ctx.get("desktopProfiles"), ctx.baseUrl)
    });
    new ImagePathifyRuntime(tctx, () => updateProbe);
    tctx.effect(() => {
      const dispose = tctx.typert.register(TYPERT_MANIFEST);
      return () => {
        void dispose();
      };
    }, "dsh-image-pathify: typert manifest");
  });
  ctx.inject(["tools"], (tctx) => {
    registerAnalyzeImageTool(tctx, current);
    tctx.on(
      "tools/pre-execute",
      (exec, next) => visionToolsPreExecute(tctx, exec, next)
    );
  });
  ctx.inject(["systemPrompt"], (pctx) => {
    installVisionPolicy(pctx);
  });
}
export {
  ANALYZE_IMAGE_TOOL,
  Config,
  DEFAULT_API_KEY_ENV,
  DEFAULT_MAX_TOKENS,
  DEFAULT_PREFIX,
  DEFAULT_VISION_BASE_URL,
  DEFAULT_VISION_MODEL,
  DEFAULT_VISION_PROMPT,
  READ_IMAGE_TOOL,
  VISION_PROMPT_NAME,
  VISION_PROMPT_ORDER,
  analyzeImage,
  analyzeImageDenyReason,
  analyzeImagePreExecute,
  analyzeImages,
  apply,
  assembleVisionPolicy,
  collectImageSources,
  filterAssemblyForRoute,
  filterDispatchForRoute,
  formatMultiImageResult,
  inject,
  isRemoteImageUrl,
  multiImagePrompt,
  name,
  readConfig,
  readImageDenyReason,
  readImagePreExecute,
  requestHeaderRoute,
  routeAcceptsImage,
  routedModel,
  stripAnalyzeImage,
  visionPromptText,
  visionToolsPreExecute
};
//# sourceMappingURL=index.js.map
