import { t as descriptor } from "./descriptor-1h1ZrvkP.js";
import { MEMORY_SPACE_PROVIDER_API_VERSION, NORMALIZED_RELEVANCE_SCORE, defineMemorySpaceProvider, defineMemorySpaceProviderDefinition } from "dsh-mnemon-source-memory-spaces/provider-sdk";
import { randomUUID } from "node:crypto";
//#region src/driver.ts
function object(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function string(value) {
	return typeof value === "string" ? value : void 0;
}
function number(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
const MEMORY_FOLDERS = {
	preference: "preferences",
	insight: "experiences",
	decision: "experiences",
	context: "events",
	fact: "entities",
	general: "entities"
};
function memoryUri(root, category, content) {
	const folder = Object.hasOwn(MEMORY_FOLDERS, category) ? MEMORY_FOLDERS[category] : "entities";
	const firstLine = content.split("\n").find((line) => line.trim().length > 0) ?? "memory";
	const slug = Array.from(firstLine.replace(/^#+\s*/u, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/gu, "")).slice(0, 48).join("").toLowerCase() || "memory";
	return `${root}/${folder}/${(/* @__PURE__ */ new Date()).toISOString().replace(/[-:T]/gu, "").slice(0, 14)}-${slug}-${randomUUID()}.md`;
}
function safeUser(user) {
	return /^[a-zA-Z0-9_.@-]+$/u.test(user) && user !== "." && user !== ".." && (user.match(/@/gu)?.length ?? 0) <= 1;
}
function discoveryUser(connection) {
	const user = String(connection.discoveryUser ?? "").trim();
	if (user === "") return void 0;
	if (!safeUser(user) || !safeUser(String(connection.account ?? "").trim())) throw new Error("OpenViking user-key discovery requires an explicit account and a safe discovery user");
	if (String(connection.apiKey ?? "").trim() === "") throw new Error("OpenViking user-key discovery requires a user API key");
	return user;
}
function isMemoryFile(uri, root) {
	if (!uri.startsWith(`${root}/`) || !uri.endsWith(".md") || /[%?#\\\u0000-\u001f\u007f]/u.test(uri)) return false;
	return uri.slice(root.length + 1).split("/").every((part) => part !== "" && !part.startsWith(".") && part.trim() === part);
}
function queueFailed(value) {
	return Object.values(object(value) ?? {}).some((entry) => {
		const queue = object(entry);
		return (number(queue?.error_count) ?? 0) > 0 || Array.isArray(queue?.errors) && queue.errors.length > 0;
	});
}
function categoryFromUri(uri) {
	const marker = "/memories/";
	return (uri.includes(marker) ? uri.slice(uri.indexOf(marker) + 10) : "").split("/")[0]?.replace(/\.md$/u, "") || "general";
}
var OpenVikingProvider = class {
	memorySpaces;
	id = "openviking";
	scoreSemantics = NORMALIZED_RELEVANCE_SCORE;
	requestFetch;
	requestTimeoutMs;
	constructor(memorySpaces, options = {}) {
		this.memorySpaces = memorySpaces;
		this.requestFetch = options.fetch ?? globalThis.fetch;
		this.requestTimeoutMs = options.requestTimeoutMs ?? 15e3;
	}
	async discover(connection, signal) {
		signal?.throwIfAborted();
		let account = String(connection.account ?? "").trim();
		const selectedUser = discoveryUser(connection);
		if (selectedUser !== void 0) {
			const targetUri = await this.validateUserNamespace(connection, selectedUser, signal);
			return [{
				externalId: `${account}:${selectedUser}`,
				name: selectedUser,
				description: `OpenViking memory namespace for ${selectedUser}`,
				connection: {
					targetUri,
					user: selectedUser,
					actorPeerId: "dsh"
				}
			}];
		}
		if (account === "") {
			const accounts = await this.requestConnection(connection, "/api/v1/admin/accounts", {}, { signal });
			const ids = (Array.isArray(accounts) ? accounts : []).flatMap((value) => {
				const id = string(object(value)?.account_id) ?? string(object(value)?.id);
				return id === void 0 ? [] : [id];
			});
			if (ids.length > 1) throw new Error("OpenViking exposes multiple accounts; configure the account to select one discovery scope");
			account = ids[0] ?? "default";
		}
		const users = await this.requestConnection({
			...connection,
			account
		}, `/api/v1/admin/accounts/${encodeURIComponent(account)}/users?limit=100`, {}, { signal });
		return (Array.isArray(users) ? users : []).flatMap((value) => {
			const item = object(value);
			const user = string(item?.user_id) ?? string(item?.id) ?? string(item?.name);
			if (user === void 0 || !safeUser(user)) return [];
			return [{
				externalId: `${account}:${user}`,
				name: string(item?.display_name) ?? string(item?.name) ?? user,
				description: string(item?.description) ?? string(item?.role) ?? `OpenViking memory namespace for ${user}`,
				connection: {
					targetUri: `viking://user/${user}/memories`,
					user,
					actorPeerId: "dsh"
				}
			}];
		});
	}
	async status(body, signal) {
		try {
			const connection = this.connection(body);
			const selectedUser = discoveryUser(connection);
			if (selectedUser === void 0) await this.request(body, "/health", {}, {
				signal,
				timeoutMs: 5e3
			});
			else {
				await this.memoryRoot(body, signal);
				await this.validateUserNamespace(connection, selectedUser, signal);
			}
			return { healthy: true };
		} catch (error) {
			return {
				healthy: false,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}
	async search(body, request, signal) {
		const memoryRoot = await this.memoryRoot(body, signal);
		const root = object(await this.request(body, "/api/v1/search/find", {
			method: "POST",
			body: JSON.stringify({
				query: request.query,
				target_uri: memoryRoot,
				context_type: ["memory"],
				limit: request.limit
			})
		}, { signal }));
		const matches = (Array.isArray(root?.memories) ? root.memories : []).flatMap((value) => {
			const item = object(value);
			const uri = string(item?.uri);
			if (uri === void 0 || !isMemoryFile(uri, memoryRoot)) return [];
			const score = number(item?.score);
			return [{
				id: uri,
				externalUri: uri,
				content: string(item?.overview) ?? string(item?.abstract) ?? uri,
				category: string(item?.category) ?? categoryFromUri(uri),
				source: "external",
				...score === void 0 ? {} : { score }
			}];
		}).slice(0, request.limit);
		return { results: await Promise.all(matches.map(async (item) => ({
			...item,
			content: await this.readContent(body, item.id, signal)
		}))) };
	}
	async graph(body, signal) {
		return {
			nodes: (await this.list(body, { limit: 200 }, signal)).map((item) => ({
				...item,
				color: "#5568d9"
			})),
			edges: [],
			generatedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
	async list(body, request, signal) {
		const memoryRoot = await this.memoryRoot(body, signal);
		const query = new URLSearchParams({
			uri: memoryRoot,
			recursive: "true",
			output: "original"
		});
		const result = await this.request(body, `/api/v1/fs/ls?${query}`, {}, { signal });
		const entries = Array.isArray(result) ? result : [];
		const limit = Math.min(Math.max(request.limit ?? 200, 1), 1e3);
		const files = entries.flatMap((value) => {
			const item = object(value);
			const uri = string(item?.uri);
			return item === void 0 || uri === void 0 || item.isDir === true || !isMemoryFile(uri, memoryRoot) ? [] : [{
				item,
				uri
			}];
		}).slice(0, limit);
		return Promise.all(files.map(async ({ item, uri }) => {
			const content = await this.readContent(body, uri, signal);
			const createdAt = string(item.modTime);
			return {
				id: uri,
				externalUri: uri,
				content,
				category: categoryFromUri(uri),
				source: "external",
				...createdAt === void 0 ? {} : { createdAt }
			};
		}));
	}
	async remember(body, request, signal) {
		const root = await this.memoryRoot(body, signal);
		const category = string(request.category) ?? "general";
		const uri = memoryUri(root, category, request.content);
		const tags = ["source=mnemon", `category=${category}`];
		const importance = number(request.importance);
		if (importance !== void 0) tags.push(`importance=${importance}`);
		const writtenBytes = Buffer.byteLength(request.content, "utf8");
		try {
			const written = object(await this.request(body, "/api/v1/content/write", {
				method: "POST",
				body: JSON.stringify({
					uri,
					content: request.content,
					mode: "create",
					wait: true,
					timeout: this.requestTimeoutMs / 1e3,
					tags
				})
			}, { signal }));
			if (written?.uri !== uri || written.content_updated !== true || written.written_bytes !== writtenBytes || written.mode !== "create" || written.context_type !== "memory" || written.vector_status !== "complete" || !["complete", "skipped"].includes(String(written.semantic_status)) || queueFailed(written.queue_status)) throw new Error("content API did not confirm this exact memory and completed indexing");
			if (await this.readContent(body, uri, signal) !== request.content) throw new Error("stored content does not match the requested text");
			signal?.throwIfAborted();
		} catch (error) {
			throw new Error(`OpenViking write was not verified at ${uri}; remote content may remain. Inspect this URI before retrying. ${error instanceof Error ? error.message : String(error)}`, { cause: error });
		}
		return {
			action: "stored",
			provider: "openviking",
			id: uri,
			uri,
			externalUri: uri,
			summary: `OpenViking stored the memory at ${uri} (category ${category}).`,
			writtenBytes,
			vectorStatus: "complete"
		};
	}
	async forget(body, id, signal) {
		const root = await this.memoryRoot(body, signal);
		const uri = id.trim();
		if (!isMemoryFile(uri, root)) throw new Error("OpenViking forget requires an exact non-generated .md memory URI inside this Memory Space");
		const query = new URLSearchParams({
			uri,
			recursive: "false"
		});
		const result = object(await this.request(body, `/api/v1/fs?${query}`, { method: "DELETE" }, { signal })) ?? {};
		if (result.uri !== uri) throw new Error("OpenViking did not confirm deletion of the requested memory URI");
		return {
			action: "deleted",
			provider: this.id,
			id: uri,
			uri,
			...number(result.estimated_deleted_count) === void 0 ? {} : { estimatedDeletedCount: number(result.estimated_deleted_count) }
		};
	}
	connection(body) {
		if ((body.provider.typeId ?? body.provider.id) !== this.id) throw new Error(`OpenViking cannot serve provider ${body.provider.id}`);
		const connection = this.memorySpaces.providerConnection(body.id, body.provider.id);
		return {
			endpoint: String(connection.endpoint ?? ""),
			targetUri: String(connection.targetUri ?? ""),
			apiKey: String(connection.apiKey ?? ""),
			account: String(connection.account ?? ""),
			user: String(connection.user ?? ""),
			actorPeerId: String(connection.actorPeerId ?? ""),
			discoveryUser: String(connection.discoveryUser ?? "")
		};
	}
	async validateUserNamespace(connection, user, signal) {
		const root = `viking://user/${user}/memories`;
		const query = new URLSearchParams({
			uri: root,
			recursive: "false",
			output: "original"
		});
		const result = await this.requestConnection(connection, `/api/v1/fs/ls?${query}`, {}, { signal });
		if (!Array.isArray(result) || result.some((item) => !string(object(item)?.uri)?.startsWith(`${root}/`))) throw new Error("OpenViking could not validate the selected memory namespace");
		return root;
	}
	async memoryRoot(body, signal) {
		signal?.throwIfAborted();
		const connection = this.connection(body);
		const root = connection.targetUri.replace(/\/+$/u, "");
		const match = /^viking:\/\/user(?:\/([^/]+))?\/memories$/u.exec(root);
		if (match === null || match[1] !== void 0 && !safeUser(match[1])) throw new Error("OpenViking memory URI must be a safe viking://user/<user>/memories root");
		const selectedUser = discoveryUser(connection);
		if (selectedUser !== void 0) {
			if (match[1] !== void 0 && match[1] !== selectedUser || connection.user?.trim() && connection.user.trim() !== selectedUser) throw new Error("OpenViking memory owner must match the configured discovery user");
			return `viking://user/${selectedUser}/memories`;
		}
		if (match[1] !== void 0) return root;
		const user = connection.user?.trim() || string(object(await this.request(body, "/api/v1/system/status", {}, { signal }))?.user) || "";
		if (!safeUser(user)) throw new Error("OpenViking could not resolve the memory owner; configure an explicit user memory URI");
		return `viking://user/${user}/memories`;
	}
	async readContent(body, uri, signal) {
		const result = await this.request(body, `/api/v1/content/read?${new URLSearchParams({ uri })}`, {}, { signal });
		if (typeof result !== "string") throw new Error("OpenViking content read did not return text");
		return result;
	}
	async request(body, path, init = {}, options = {}) {
		const connection = this.connection(body);
		return this.requestConnection(connection, path, init, options);
	}
	async requestConnection(connection, path, init = {}, options = {}) {
		options.signal?.throwIfAborted();
		const keyBound = discoveryUser(connection) !== void 0;
		const controller = new AbortController();
		const relay = () => controller.abort(options.signal?.reason);
		options.signal?.addEventListener("abort", relay, { once: true });
		const timer = setTimeout(() => controller.abort(/* @__PURE__ */ new Error("OpenViking request timed out")), options.timeoutMs ?? this.requestTimeoutMs);
		try {
			const response = await this.requestFetch(`${connection.endpoint}${path}`, {
				...init,
				headers: {
					"Content-Type": "application/json",
					...connection.apiKey === void 0 || connection.apiKey === "" ? {} : { Authorization: `Bearer ${connection.apiKey}` },
					...keyBound || connection.account === void 0 || connection.account === "" ? {} : { "X-OpenViking-Account": String(connection.account) },
					...keyBound || connection.user === void 0 || connection.user === "" ? {} : { "X-OpenViking-User": String(connection.user) },
					...connection.actorPeerId === void 0 || connection.actorPeerId === "" ? {} : { "X-OpenViking-Actor-Peer": String(connection.actorPeerId) },
					...init.headers
				},
				signal: controller.signal
			});
			const envelope = await response.json().catch(() => ({}));
			if (!response.ok || envelope.status === "error") {
				const trace = envelope.error?.trace_id ?? envelope.trace_id;
				throw new Error(`${envelope.error?.message ?? `OpenViking HTTP ${response.status}`}${trace === void 0 ? "" : ` (trace ${trace})`}`);
			}
			return envelope.result ?? envelope;
		} catch (error) {
			if (controller.signal.aborted && options.signal?.aborted !== true) throw new Error(`OpenViking request timed out after ${options.timeoutMs ?? this.requestTimeoutMs}ms`);
			throw error;
		} finally {
			clearTimeout(timer);
			options.signal?.removeEventListener("abort", relay);
		}
	}
};
//#endregion
//#region src/index.ts
const definition = defineMemorySpaceProviderDefinition({
	manifest: {
		apiVersion: MEMORY_SPACE_PROVIDER_API_VERSION,
		kind: "provider",
		typeId: descriptor.id,
		packageName: "dsh-mnemon-provider-openviking",
		version: "0.5.7",
		label: descriptor.label,
		icon: descriptor.icon,
		summary: descriptor.summary,
		...descriptor.summaryI18nKey === void 0 ? {} : { summaryI18nKey: descriptor.summaryI18nKey },
		origin: descriptor.origin,
		locality: descriptor.kind,
		workspaceBinding: descriptor.workspaceBinding,
		capabilities: descriptor.capabilities,
		fields: descriptor.fields,
		secrets: descriptor.fields.filter((field) => field.input === "secret").map((field) => field.key),
		scoreSemantics: "normalized-relevance"
	},
	create: (context) => new OpenVikingProvider(context.memorySpaces ?? context.memoryBodies, { requestTimeoutMs: context.config.timeoutMs })
});
var src_default = defineMemorySpaceProvider({
	id: descriptor.id,
	apply(ctx, host) {
		host.install(ctx, definition);
	}
});
//#endregion
export { OpenVikingProvider, src_default as default, definition, descriptor };
