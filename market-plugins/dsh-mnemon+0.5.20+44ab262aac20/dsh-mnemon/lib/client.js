window.__ModuleLoader__.load({
	id: "dsh-mnemon",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_dom = require("react-dom");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/host/view-protocol.ts
		const MNEMON_VIEW_CHANNEL = "/dsh-mnemon-view";
		const MNEMON_VIEW_WRITE_CHANNEL = "/dsh-mnemon-view-settings";
		//#endregion
		//#region src/host/display-mode.ts
		/** Keep the historical misspelling at input boundaries, never in UI or runtime state. */
		function normalizeDisplayMode(value) {
			if (value === void 0 || value === "sidebar") return "sidebar";
			if (value === "builtin" || value === "buildin") return "builtin";
			throw new Error("dsh-mnemon: displayMode must be sidebar or builtin (legacy buildin is accepted)");
		}
		//#endregion
		//#region src/host/protocol.ts
		/** Starter Entry ids remain reserved when DSH nests them under an include. */
		function isDefaultSourceInstance(instanceKey, sourceTypeId) {
			return instanceKey.startsWith("source:") && instanceKey.endsWith(":mnemon-source-" + sourceTypeId);
		}
		const MNEMON_READ_CHANNEL = "/dsh-mnemon-read";
		const MNEMON_ACTIVATION_CHANNEL = "/dsh-mnemon-activation";
		const MNEMON_WRITE_CHANNEL = "/dsh-mnemon-write";
		const MNEMON_PACK_CHANNEL = "/dsh-mnemon-pack";
		const MNEMON_SETTINGS_CHANNEL = "/dsh-mnemon-settings";
		/** DSH API Gateway endpoints used by paired remote Web clients. */
		const MNEMON_REMOTE_CHANNEL = "/api";
		const MNEMON_REMOTE_NAMESPACE = "dshMnemon";
		const MNEMON_REMOTE_READ_ENDPOINT = `${MNEMON_REMOTE_NAMESPACE}/read`;
		const MNEMON_REMOTE_ACTIVATION_ENDPOINT = `${MNEMON_REMOTE_NAMESPACE}/activation`;
		const MNEMON_REMOTE_WRITE_ENDPOINT = `${MNEMON_REMOTE_NAMESPACE}/write`;
		const MNEMON_REMOTE_PACK_ENDPOINT = `${MNEMON_REMOTE_NAMESPACE}/pack`;
		const MNEMON_REMOTE_SETTINGS_ENDPOINT = `${MNEMON_REMOTE_NAMESPACE}/settings`;
		const MNEMON_REMOTE_VIEW_ENDPOINT = `${MNEMON_REMOTE_NAMESPACE}/view`;
		const MNEMON_REMOTE_VIEW_WRITE_ENDPOINT = `${MNEMON_REMOTE_NAMESPACE}/viewWrite`;
		const MNEMON_SETTINGS_NAMESPACE = "mnemon";
		const MNEMON_UI_SETTINGS_NAMESPACE = "mnemon-ui";
		function isWorkspaceStorageScope(scope) {
			return scope === "workspace" || scope === "workspaces";
		}
		const DEFAULT_IDLE_REVIEW = {
			enabled: true,
			provider: "spawn",
			fallback: "spawn",
			agentTeams: "pause",
			minIntervalMs: 3e5,
			maxPerSession: 20,
			maxContextChars: 24e3,
			maxTokens: 4096
		};
		/** The Sources that keep their data in Mnemon's data directory, in the order a backup lists them. */
		const MNEMON_PACK_COMPONENTS = [
			"runtime",
			"documents",
			"memory-spaces"
		];
		const MNEMON_EMBEDDING_PROTOCOLS = [
			"auto",
			"ollama",
			"openai"
		];
		//#endregion
		//#region src/client/component-ui.tsx
		/**
		* A component's own settings, on its page: keyed by the component's package
		* name, rendered after the page's generated state, relations and options.
		*/
		const MNEMON_COMPONENT_SETTINGS_SLOT = "mnemon.component.settings";
		/**
		* What a component's card on the Memory System's Status page says while it
		* runs, keyed by the component's package name. A card that is not running
		* shows the page's own note instead.
		*/
		const MNEMON_COMPONENT_STATUS_SLOT = "mnemon.component.status";
		const PACKAGE_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/u;
		/**
		* Register a component's interface into the regions dsh-mnemon declares, the
		* way shipped components do. Registration waits for each region to exist and
		* is released by the returned function.
		*/
		function installMemoryComponentUI(ctx, contribution) {
			const key = contribution.packageName;
			if (!PACKAGE_NAME.test(key)) throw new Error("memory component UI requires the package name of the component");
			const { settings, status } = contribution;
			const disposers = [];
			if (settings !== void 0) disposers.push(ctx.slots.inject(MNEMON_COMPONENT_SETTINGS_SLOT, () => ctx.slots.register({
				name: MNEMON_COMPONENT_SETTINGS_SLOT,
				key
			}, (props) => (0, react.createElement)(settings, props))));
			if (status !== void 0) disposers.push(ctx.slots.inject(MNEMON_COMPONENT_STATUS_SLOT, () => ctx.slots.register({
				name: MNEMON_COMPONENT_STATUS_SLOT,
				key
			}, (props) => (0, react.createElement)(status, props))));
			if (disposers.length === 0) throw new Error("memory component UI contributes nothing: " + key);
			return () => {
				for (const dispose of disposers.reverse()) dispose();
			};
		}
		/** Thin adapter over a DSH child Slot: it keeps no registry of its own. */
		function createComponentRegionDirectory(ctx, region) {
			let version = -1;
			let snapshot = /* @__PURE__ */ new Set();
			const read = () => {
				const current = ctx.slots.getVersion(region);
				if (current === version) return snapshot;
				version = current;
				snapshot = new Set(ctx.slots.entriesOfSlot(region).flatMap((entry) => entry.options.key === void 0 ? [] : [entry.options.key]));
				return snapshot;
			};
			return {
				getSnapshot: read,
				subscribe: (listener) => ctx.slots.subscribe(region, () => {
					read();
					listener();
				})
			};
		}
		function createComponentSettingsDirectory(ctx) {
			return createComponentRegionDirectory(ctx, MNEMON_COMPONENT_SETTINGS_SLOT);
		}
		/** A contribution that fails renders nothing and leaves the page around it working. */
		var ContributionBoundary = class extends react.Component {
			state = { failed: false };
			static getDerivedStateFromError() {
				return { failed: true };
			}
			componentDidCatch(error, info) {
				console.error(`dsh-mnemon: the interface ${this.props.packageName} contributed failed`, error, info.componentStack);
			}
			render() {
				return this.state.failed ? null : this.props.children;
			}
		};
		/**
		* Render what one component registered into a region, where the page is not
		* the region's declaring owner, as DSH's row page for a component is not:
		* a child slot has one declaring entry, the configuration's.
		*/
		function renderComponentRegion(ctx, region, packageName, props) {
			const entry = ctx.slots.entriesOfSlot(region).find((candidate) => candidate.options.key === packageName);
			return entry === void 0 ? null : (0, react.createElement)(ContributionBoundary, {
				packageName,
				children: (0, react.createElement)(entry.component, props)
			});
		}
		//#endregion
		//#region src/client/remote-rpc.ts
		const REMOTE_ENDPOINT = /* @__PURE__ */ new Map([
			[MNEMON_READ_CHANNEL, MNEMON_REMOTE_READ_ENDPOINT],
			[MNEMON_ACTIVATION_CHANNEL, MNEMON_REMOTE_ACTIVATION_ENDPOINT],
			[MNEMON_WRITE_CHANNEL, MNEMON_REMOTE_WRITE_ENDPOINT],
			[MNEMON_PACK_CHANNEL, MNEMON_REMOTE_PACK_ENDPOINT],
			[MNEMON_SETTINGS_CHANNEL, MNEMON_REMOTE_SETTINGS_ENDPOINT],
			[MNEMON_VIEW_CHANNEL, MNEMON_REMOTE_VIEW_ENDPOINT],
			[MNEMON_VIEW_WRITE_CHANNEL, MNEMON_REMOTE_VIEW_WRITE_ENDPOINT]
		]);
		function isClientRpcResult(value) {
			if (typeof value !== "object" || value === null || !Object.hasOwn(value, "ok")) return false;
			const candidate = value;
			if (candidate.ok === true) return Object.hasOwn(candidate, "value");
			if (candidate.ok !== false || typeof candidate.error !== "object" || candidate.error === null) return false;
			return typeof candidate.error.message === "string";
		}
		function isLoopbackHostname(hostname) {
			if (hostname === "localhost" || hostname === "[::1]") return true;
			const parts = hostname.split(".");
			return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
		}
		/**
		* A window the application serves itself, such as DSH Desktop's
		* `dsh-app://app/`, runs beside its Host rather than across a network.
		*/
		function isApplicationPage(page) {
			const protocol = page?.protocol;
			return typeof protocol === "string" && protocol !== "" && protocol !== "http:" && protocol !== "https:";
		}
		/**
		* A network page is remote when its hostname or the DSH Connection is not
		* loopback. An application page is local unless DSH declares a transport that
		* does not own the Host, which only a page connected to another machine does.
		*/
		function isRemoteConnection(connection) {
			const page = globalThis.location;
			if (isApplicationPage(page)) {
				const transport = globalThis.__DSH_TRANSPORT__;
				return transport !== void 0 && transport !== null && transport.ownsHost !== true;
			}
			const hostname = page?.hostname;
			return typeof hostname === "string" && hostname !== "" && !isLoopbackHostname(hostname) || !connection.isLoopback;
		}
		/** Route only paired remote pages through API Gateway; local clients retain legacy channels. */
		async function callMnemonRpc(connection, channel, endpoint, payload, signal) {
			const remoteEndpoint = REMOTE_ENDPOINT.get(channel);
			if (!isRemoteConnection(connection) || remoteEndpoint === void 0) return signal === void 0 ? connection.rpc.call(channel, endpoint, payload) : connection.rpc.call(channel, endpoint, payload, signal);
			const remotePayload = { args: {
				endpoint,
				payload
			} };
			const response = await (signal === void 0 ? connection.rpc.call(MNEMON_REMOTE_CHANNEL, remoteEndpoint, remotePayload) : connection.rpc.call(MNEMON_REMOTE_CHANNEL, remoteEndpoint, remotePayload, signal));
			if (!response.ok) return response;
			if (!isClientRpcResult(response.value)) throw new Error("DSH API Gateway returned an invalid Mnemon response");
			return response.value;
		}
		//#endregion
		//#region src/client/api.ts
		const turnActivityCache = /* @__PURE__ */ new WeakMap();
		async function loadTurnActivities(connection, sessionId, requiredCursor) {
			let sessions = turnActivityCache.get(connection);
			if (sessions === void 0) {
				sessions = /* @__PURE__ */ new Map();
				turnActivityCache.set(connection, sessions);
			}
			const key = sessionId ?? "";
			let entry = sessions.get(key);
			if (entry === void 0) {
				entry = {
					cursor: -1,
					activities: /* @__PURE__ */ new Map()
				};
				sessions.set(key, entry);
			}
			if (entry.cursor >= requiredCursor) return {
				cursor: entry.cursor,
				activities: [...entry.activities.values()]
			};
			if (entry.inFlight !== void 0) {
				const snapshot = await entry.inFlight;
				return snapshot.cursor >= requiredCursor ? snapshot : loadTurnActivities(connection, sessionId, requiredCursor);
			}
			const request = callMnemonRpc(connection, MNEMON_READ_CHANNEL, "turn-activities", sessionId === void 0 ? {} : { sessionId }).then((response) => {
				if (!response.ok) throw new Error(response.error.message);
				const snapshot = response.value;
				entry.cursor = snapshot.cursor;
				entry.activities = new Map(snapshot.activities.map((activity) => [activity.turn, activity]));
				return snapshot;
			}).finally(() => {
				delete entry.inFlight;
			});
			entry.inFlight = request;
			return request;
		}
		var MnemonClient = class {
			connection;
			sessionId;
			workspaceId;
			constructor(connection, sessionId, workspaceId) {
				this.connection = connection;
				this.sessionId = sessionId;
				this.workspaceId = workspaceId;
			}
			async call(channel, endpoint, payload) {
				const response = await callMnemonRpc(this.connection, channel, endpoint, payload);
				if (!response.ok) throw new Error(response.error.message);
				return response.value;
			}
			scoped(payload = {}) {
				return {
					...payload,
					...this.sessionId === void 0 ? {} : { sessionId: this.sessionId },
					...this.workspaceId === void 0 ? {} : { workspaceId: this.workspaceId }
				};
			}
			status() {
				return this.call(MNEMON_READ_CHANNEL, "status", this.scoped());
			}
			statusSummary() {
				return this.call(MNEMON_READ_CHANNEL, "status-summary", this.scoped());
			}
			embeddingStatus() {
				return this.call(MNEMON_READ_CHANNEL, "embedding-status", this.scoped());
			}
			memorySystem() {
				return this.call(MNEMON_READ_CHANNEL, "memory-system", this.scoped());
			}
			viewDashboard() {
				return this.call(MNEMON_VIEW_CHANNEL, "dashboard", this.scoped());
			}
			applyView(configuration) {
				return this.call(MNEMON_VIEW_WRITE_CHANNEL, "apply", this.scoped({
					configuration,
					confirmed: true
				}));
			}
			sourceManagementCatalog() {
				return this.call(MNEMON_READ_CHANNEL, "source-management-catalog", this.scoped());
			}
			readSourceManagement(sourceInstanceKey, operation, input = null) {
				return this.call(MNEMON_READ_CHANNEL, "source-management-read", this.scoped({
					sourceInstanceKey,
					operation,
					input
				}));
			}
			mutateSourceManagement(sourceInstanceKey, operation, input, expectedRevision, confirmed) {
				return this.call(MNEMON_WRITE_CHANNEL, "source-management-mutate", this.scoped({
					sourceInstanceKey,
					operation,
					input,
					expectedRevision,
					confirmed
				}));
			}
			assistSource(sourceInstanceKey, operation, input, expectedRevision, confirmed) {
				return this.call(operation === "activation" ? MNEMON_ACTIVATION_CHANNEL : confirmed ? MNEMON_WRITE_CHANNEL : MNEMON_READ_CHANNEL, "source-assistance", this.scoped({
					sourceInstanceKey,
					operation,
					input,
					expectedRevision,
					confirmed
				}));
			}
			taskAgentModels(includeCatalog) {
				return this.call(MNEMON_READ_CHANNEL, "task-agent-models", includeCatalog === void 0 ? {} : { includeCatalog });
			}
			versions() {
				return this.call(MNEMON_READ_CHANNEL, "versions", {});
			}
			updateVersion(component) {
				return this.call(MNEMON_WRITE_CHANNEL, "version-update", { component });
			}
			providerServices() {
				return this.call(MNEMON_READ_CHANNEL, "provider-services", this.scoped());
			}
			updateProviderService(request) {
				return this.call(MNEMON_WRITE_CHANNEL, "provider-service-update", this.scoped(request));
			}
			/** Settled memory-tool activity of one turn, shared across all mounted tails. */
			async turnActivity(turn, cursor = 0) {
				return (await loadTurnActivities(this.connection, this.sessionId, cursor)).activities.find((activity) => activity.turn === turn) ?? null;
			}
			/** Plain text of one finalized assistant message; null when absent or empty. */
			assistantMessageText(messageId) {
				return this.call(MNEMON_READ_CHANNEL, "assistant-message", {
					sessionId: this.sessionId,
					messageId
				});
			}
			supervise(content, idempotencyKey) {
				return this.call(MNEMON_WRITE_CHANNEL, "supervise", this.scoped({
					content,
					...idempotencyKey === void 0 ? {} : { idempotencyKey }
				}));
			}
			packTarget() {
				return this.call(MNEMON_PACK_CHANNEL, "target", this.scoped());
			}
			exportPack() {
				return this.call(MNEMON_PACK_CHANNEL, "export", this.scoped());
			}
			inspectPack(base64, fileName) {
				return this.call(MNEMON_PACK_CHANNEL, "inspect", this.scoped({
					base64,
					...fileName === void 0 ? {} : { fileName }
				}));
			}
			importPack(base64) {
				return this.call(MNEMON_PACK_CHANNEL, "import", this.scoped({ base64 }));
			}
		};
		//#endregion
		//#region src/client/component-copy.ts
		/** Packages the dsh-mnemon Starter installs; any other component came from an installed extension. */
		const SHIPPED_PACKAGES = /* @__PURE__ */ new Set([
			"dsh-mnemon-source-runtime",
			"dsh-mnemon-source-documents",
			"dsh-mnemon-source-memory-spaces",
			"dsh-mnemon-strategy-default-three-tier",
			"dsh-mnemon-strategy-general",
			"dsh-mnemon-strategy-auto-capture",
			"dsh-mnemon-strategy-light-context",
			"dsh-mnemon-strategy-scoped"
		]);
		/** Whether a component ships with dsh-mnemon rather than an installed extension. */
		function isShipped(entry) {
			return SHIPPED_PACKAGES.has(entry.packageName);
		}
		/**
		* A component's name and description in the page's language, from its own
		* declaration: shipped and installed components are named the same way.
		*/
		function componentCopy(entry, language) {
			const zh = language.toLowerCase().startsWith("zh");
			return {
				label: zh ? entry.label["zh-CN"] : entry.label.en,
				hint: zh ? entry.description["zh-CN"] : entry.description.en
			};
		}
		/** Quoted names joined in the page's language. */
		function nameList(names, t) {
			return names.map((name) => t("config.quoted", { name })).join(t("config.listSeparator"));
		}
		//#endregion
		//#region src/client/component-model.ts
		/** Shipped Source packages are named after the memory layer they serve. */
		const SHIPPED_SOURCE_PREFIX = "dsh-mnemon-source-";
		/** An enhancement that fits whichever main Strategy offers its slot. */
		const ANY_STRATEGY = "*";
		const running = (entry) => entry.enabled && entry.active;
		function componentModel(dashboard) {
			const mains = dashboard.entries.filter((entry) => entry.roles.includes("strategy") && entry.typeId !== void 0);
			const enhancements = dashboard.entries.filter((entry) => entry.roles.includes("strategy-extension"));
			const selected = mains.find((entry) => entry.typeId === dashboard.strategyTypeId);
			const others = mains.filter((entry) => entry !== selected && running(entry));
			const composing = selected !== void 0 && running(selected) ? selected : others.length === 1 ? others[0] : void 0;
			return {
				mains,
				enhancements,
				selected,
				composing,
				idle: composing === selected ? others : [],
				contenders: composing === void 0 && others.length > 1 ? others : []
			};
		}
		/** The memory layer a Source component serves: its registered type, or while it is off, the shipped package's name. */
		function layerOf(entry) {
			if (!entry.roles.includes("source")) return void 0;
			if (entry.typeId !== void 0) return entry.typeId;
			return entry.packageName.startsWith(SHIPPED_SOURCE_PREFIX) ? entry.packageName.slice(18) : void 0;
		}
		/** The Source component serving a memory layer, including one that is switched off and so has no registered type. */
		function sourceOf(dashboard, layerId) {
			const sources = dashboard.entries.filter((entry) => entry.roles.includes("source"));
			return sources.find((entry) => entry.typeId === layerId) ?? sources.find((entry) => layerOf(entry) === layerId);
		}
		function provides(entry, capability) {
			return entry.provides.some((value) => value.id === capability);
		}
		/**
		* Capabilities no listed component switches: a running Source the plugin
		* manager does not manage still provides its role, as the Host counts it.
		*/
		function implicitCapabilities(dashboard) {
			const managed = new Set(dashboard.entries.map((entry) => entry.packageName));
			return new Set(dashboard.sources.filter((source) => !managed.has(source.packageName)).flatMap((source) => ["source", "source." + source.role]));
		}
		/**
		* Whether two components cannot run together, as the Host judges it: they
		* provide the same capability and either claims it alone, or they are
		* enhancements filling the same slot for the same main Strategy.
		*/
		function conflicts(left, right) {
			if (left === right) return false;
			if (left.provides.some((capability) => right.provides.some((other) => other.id === capability.id && (capability.exclusive || other.exclusive)))) return true;
			if (left.slot === void 0 || left.slot !== right.slot || !left.roles.includes("strategy-extension") || !right.roles.includes("strategy-extension")) return false;
			const [one, two] = [left.strategyTypeId ?? ANY_STRATEGY, right.strategyTypeId ?? ANY_STRATEGY];
			return one === two || one === ANY_STRATEGY || two === ANY_STRATEGY;
		}
		/**
		* Keep the components consistent around the switches the user asked for.
		* Whatever is turned on brings what it requires and nothing provides, and
		* turns off what cannot run beside it; whatever loses a capability it
		* requires goes off too. A main Strategy never goes off that way: taking away
		* the last Source it needs is refused instead.
		*/
		function planSwitches(dashboard, asked) {
			const state = new Map(dashboard.entries.map((entry) => [entry.entryId, entry.enabled]));
			const implicit = implicitCapabilities(dashboard);
			const reasons = /* @__PURE__ */ new Map();
			const wanted = new Map(asked.map(({ entry, enabled }) => [entry.entryId, enabled]));
			const on = (entry) => state.get(entry.entryId) === true;
			const set = (entry, enabled, reason) => {
				state.set(entry.entryId, enabled);
				if (reason !== void 0 && !wanted.has(entry.entryId)) reasons.set(entry.entryId, reason);
			};
			const turnedOn = [];
			for (const { entry, enabled } of asked) {
				set(entry, enabled);
				if (enabled) turnedOn.push(entry);
			}
			for (let index = 0; index < turnedOn.length; index += 1) {
				const entry = turnedOn[index];
				for (const other of dashboard.entries) if (on(other) && wanted.get(other.entryId) !== true && conflicts(entry, other)) set(other, false, "conflict");
				for (const requirement of entry.requires) {
					if (implicit.has(requirement) || dashboard.entries.some((candidate) => on(candidate) && provides(candidate, requirement))) continue;
					const provider = dashboard.entries.find((candidate) => !on(candidate) && candidate.writable && wanted.get(candidate.entryId) !== false && provides(candidate, requirement) && !dashboard.entries.some((other) => on(other) && conflicts(candidate, other)));
					if (provider === void 0) continue;
					set(provider, true, "needed");
					turnedOn.push(provider);
				}
			}
			const metBefore = (requirement) => implicit.has(requirement) || dashboard.entries.some((candidate) => candidate.enabled && provides(candidate, requirement));
			const metNow = (requirement) => implicit.has(requirement) || dashboard.entries.some((candidate) => on(candidate) && provides(candidate, requirement));
			for (let moved = true; moved;) {
				moved = false;
				for (const entry of dashboard.entries) {
					if (!on(entry) || !entry.enabled || !entry.requires.some((requirement) => metBefore(requirement) && !metNow(requirement))) continue;
					if (entry.roles.includes("strategy")) return { blocked: "last-source" };
					set(entry, false, "dependent");
					moved = true;
				}
			}
			return { changes: dashboard.entries.flatMap((entry) => {
				const enabled = state.get(entry.entryId);
				if (enabled === entry.enabled && !wanted.has(entry.entryId)) return [];
				const reason = reasons.get(entry.entryId);
				return [{
					entry,
					enabled,
					...reason === void 0 ? {} : { reason }
				}];
			}) };
		}
		/** What turning one component on or off takes along; see {@link planSwitches}. */
		function switchPlan(dashboard, entry, enabled) {
			return planSwitches(dashboard, [{
				entry,
				enabled
			}]);
		}
		/** One main Strategy composes memory: choosing one turns it on and every other main Strategy off. */
		function mainPlan(dashboard, entry) {
			const others = dashboard.entries.filter((other) => other !== entry && other.enabled && other.roles.includes("strategy") && other.typeId !== void 0);
			return planSwitches(dashboard, [{
				entry,
				enabled: true
			}, ...others.map((other) => ({
				entry: other,
				enabled: false
			}))]);
		}
		function relationsOf(dashboard, entry) {
			const implicit = implicitCapabilities(dashboard);
			return {
				needs: entry.requires.map((requirement) => {
					const providers = dashboard.entries.filter((candidate) => candidate !== entry && provides(candidate, requirement));
					return {
						requirement,
						providers,
						met: implicit.has(requirement) || providers.some((candidate) => candidate.enabled)
					};
				}),
				neededBy: !entry.enabled ? [] : dashboard.entries.filter((candidate) => candidate !== entry && candidate.enabled && candidate.requires.some((requirement) => provides(entry, requirement) && !implicit.has(requirement) && !dashboard.entries.some((other) => other !== entry && other.enabled && provides(other, requirement)))),
				conflictsWith: dashboard.entries.filter((candidate) => conflicts(entry, candidate))
			};
		}
		/** What a switched-on component requires that no switched-on component provides. */
		function unmetRequirements(dashboard, entry) {
			const implicit = implicitCapabilities(dashboard);
			return entry.requires.flatMap((requirement) => implicit.has(requirement) || dashboard.entries.some((candidate) => candidate.enabled && provides(candidate, requirement)) ? [] : [{
				requirement,
				providers: dashboard.entries.filter((candidate) => !candidate.enabled && provides(candidate, requirement))
			}]);
		}
		/** Whether the composing main Strategy takes this enhancement. */
		function enhancementApplies(entry, composing) {
			return composing !== void 0 && (entry.strategyTypeId === void 0 || entry.strategyTypeId === ANY_STRATEGY || entry.strategyTypeId === composing.typeId);
		}
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/src/client/MnemonSettingsCard.module.css.mjs
		const css$13 = "._v_wrq_page{box-sizing:border-box;width:100%;min-width:0;color:var(--dsw-alias-label-primary);flex-direction:column;gap:32px;font-family:inherit;display:flex}._v_wrq_surface{color:var(--dsw-alias-label-primary)}:where(._v_wrq_page,._v_wrq_surface) *,:where(._v_wrq_page,._v_wrq_surface) :before,:where(._v_wrq_page,._v_wrq_surface) :after{box-sizing:border-box}:where(._v_wrq_page,._v_wrq_surface) :where(button,input,select,textarea){color:inherit;font:inherit}._v_wrq_loading{min-height:140px;color:var(--dsw-alias-label-tertiary);text-align:center;margin:0;font-size:13px;line-height:140px}._v_wrq_section{flex-direction:column;gap:4px;min-width:0;display:flex}._v_wrq_sectionHeading{grid-template-columns:minmax(0,1fr) auto;align-items:start;column-gap:12px;min-width:0;display:grid}._v_wrq_sectionHeading h2{grid-column:1;margin:0;font-size:14px;font-weight:500;line-height:20px}._v_wrq_sectionHeading p{max-width:66ch;color:var(--dsw-alias-label-tertiary);grid-column:1;margin:2px 0 0;font-size:12px;line-height:18px}._v_wrq_sectionHeading ._v_wrq_miniSpinner{grid-area:1/2}._v_wrq_sectionHeading>._v_wrq_boardLinks{grid-column:1;padding-top:6px}._v_wrq_componentListNote{max-width:72ch;color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}._v_wrq_appliesNow{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs);color:var(--dsw-alias-label-secondary);white-space:nowrap;grid-area:1/2;align-self:center;padding:1px 6px;font-size:11px;line-height:16px}._v_wrq_rows{flex-direction:column;min-width:0;display:flex}._v_wrq_settingRow,._v_wrq_toggleRow{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 16px;min-width:0;padding:14px 0;display:flex;position:relative}._v_wrq_rows>:last-child,._v_wrq_rows>._v_wrq_packRow:last-child>._v_wrq_settingRow{border-bottom:0}._v_wrq_rows>._v_wrq_packRow:last-child{padding-bottom:0}._v_wrq_settingRow[data-stacked]{flex-direction:column;align-items:stretch}._v_wrq_settingCopy{flex-direction:column;flex:1 1 0;gap:2px;min-width:min(240px,100%);display:flex}._v_wrq_settingCopy strong,._v_wrq_settingCopy label{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}._v_wrq_settingCopy small{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;font-size:12px;line-height:18px}._v_wrq_settingCopy code{font-family:var(--ds-font-family-code,ui-monospace, monospace)}._v_wrq_settingControl{flex:none;justify-content:flex-end;align-items:center;gap:8px;min-width:0;display:flex}._v_wrq_settingRow[data-stacked] ._v_wrq_settingControl{flex:auto;justify-content:stretch}._v_wrq_switch{flex:none}._v_wrq_rowNote{min-width:0;color:var(--dsw-alias-label-secondary);flex-wrap:wrap;align-items:center;gap:4px 8px;padding-top:4px;font-size:12px;line-height:18px;display:flex}._v_wrq_groupCallout{margin:8px 0 4px}._v_wrq_boardSection{container-type:inline-size}._v_wrq_board{flex-direction:column;min-width:0;margin-top:10px;display:flex}._v_wrq_boardProblem{margin:0 0 4px}._v_wrq_boardLoading{min-height:40px;color:var(--dsw-alias-label-secondary);align-items:center;gap:8px;margin:0;font-size:13px;line-height:20px;display:flex}._v_wrq_boardGroup{flex-direction:column;min-width:0;padding-top:14px;display:flex}._v_wrq_boardGroupHead{justify-content:space-between;align-items:baseline;gap:8px;min-width:0;display:flex}._v_wrq_boardGroupHead h3{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;font-weight:500;line-height:18px}._v_wrq_boardGroupHead span{color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-size:12px;line-height:18px}._v_wrq_pageLink{appearance:none;border-radius:var(--dsw-radius-sm);max-width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;align-items:center;padding:0;display:inline-flex}._v_wrq_pageLink>span{overflow-wrap:anywhere;min-width:0}._v_wrq_pageLink:hover>span{text-underline-offset:3px;text-decoration:underline}._v_wrq_settingCopy ._v_wrq_pageLink{width:fit-content;color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}._v_wrq_boardIconButton{border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:0;flex:none;place-items:center;padding:0;display:inline-grid}._v_wrq_boardIconButton:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}._v_wrq_boardLinks{flex-wrap:wrap;align-items:center;gap:4px;min-width:0;padding-top:4px;display:flex}._v_wrq_boardLink{appearance:none;border:.5px solid var(--dsw-alias-border-l3);max-width:100%;color:var(--dsw-alias-label-tertiary);font:inherit;white-space:nowrap;cursor:pointer;background:0 0;border-radius:999px;align-items:center;gap:4px;padding:0 8px;font-size:11px;line-height:18px;transition:color .12s,border-color .12s;display:inline-flex}._v_wrq_boardLink[data-on]{color:var(--dsw-alias-label-secondary)}._v_wrq_boardLink:hover{border-color:var(--dsw-alias-border-l4);color:var(--dsw-alias-label-primary)}._v_wrq_boardLink>svg{flex:none}._v_wrq_boardLinksLabel{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}._v_wrq_pageLink:focus-visible,._v_wrq_boardIconButton:focus-visible,._v_wrq_boardLink:focus-visible,._v_wrq_detailsBack:focus-visible,._v_wrq_boardSearch:focus-within{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline:none}._v_wrq_boardSearch{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);min-width:0;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-base);align-items:center;gap:8px;margin:12px 0 0;padding:0 10px;display:flex}._v_wrq_boardSearch input{min-width:0;height:32px;color:var(--dsw-alias-label-primary);font:inherit;background:0 0;border:0;outline:none;flex:1;font-size:13px}._v_wrq_detailsDialog{width:min(560px,100%);max-height:100%}._v_wrq_detailsScroll{overscroll-behavior:contain;min-height:0;overflow-y:auto}._v_wrq_detailsBody{flex-direction:column;gap:16px;min-width:0;display:flex}._v_wrq_detailsHead{flex-direction:column;gap:6px;min-width:0;display:flex}._v_wrq_detailsHeadLine{flex-wrap:wrap;align-items:center;gap:8px 10px;min-width:0;display:flex}._v_wrq_detailsPackage{min-width:0;color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code,ui-monospace, monospace);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:16px;overflow:hidden}._v_wrq_detailsControl{align-items:center;margin-left:auto;display:flex}._v_wrq_detailsSection{border-top:.5px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;min-width:0;padding-top:14px;display:flex}._v_wrq_detailsSection>h3{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;font-weight:500;line-height:18px}._v_wrq_detailsRelations{grid-template-columns:max-content minmax(0,1fr);gap:6px 16px;min-width:0;margin:0;font-size:13px;line-height:20px;display:grid}._v_wrq_detailsRelations>div{display:contents}._v_wrq_detailsRelations dt{color:var(--dsw-alias-label-secondary)}._v_wrq_detailsRelations dd{min-width:0;color:var(--dsw-alias-label-primary);flex-wrap:wrap;gap:4px 12px;margin:0;display:flex}._v_wrq_detailsName{appearance:none;color:inherit;font:inherit;cursor:pointer;background:0 0;border:0;align-items:center;gap:6px;padding:0;display:inline-flex}._v_wrq_detailsName:hover>span{text-underline-offset:3px;text-decoration:underline}._v_wrq_detailsBack{appearance:none;border-radius:var(--dsw-radius-sm);width:fit-content;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border:0;align-items:center;gap:2px;margin:-4px 0 -6px -4px;padding:2px 4px;font-size:12px;line-height:18px;display:inline-flex}._v_wrq_detailsBack:hover{color:var(--dsw-alias-label-primary)}._v_wrq_detailsMissing{color:var(--dsw-alias-label-secondary)}._v_wrq_detailsEffect{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}._v_wrq_detailsBody ._v_wrq_optionsPanel{background:0 0;border-radius:0;margin:0;padding:0}._v_wrq_componentRowPage{flex-direction:column;gap:16px;min-width:0;display:flex}._v_wrq_detailsContributed{border-top:.5px solid var(--dsw-alias-border-l2);flex-direction:column;gap:16px;min-width:0;padding-top:14px;display:flex}._v_wrq_panelSection{flex-direction:column;gap:8px;min-width:0;display:flex}._v_wrq_panelHeading{grid-template-columns:minmax(0,1fr) auto;column-gap:12px;min-width:0;display:grid}._v_wrq_panelHeading h3{color:var(--dsw-alias-label-primary);margin:0;font-size:13px;font-weight:500;line-height:20px}._v_wrq_panelHeading p{color:var(--dsw-alias-label-tertiary);grid-column:1;margin:2px 0 0;font-size:12px;line-height:18px}._v_wrq_panelHeading ._v_wrq_miniSpinner{grid-area:1/2}._v_wrq_panelNote{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}._v_wrq_panelActions{flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:8px;min-width:0;padding-top:8px;display:flex}._v_wrq_panelActions>span{min-width:0;color:var(--dsw-alias-label-secondary);flex:1;font-size:12px;line-height:18px}._v_wrq_panelActions>span._v_wrq_panelError,._v_wrq_panelError{color:var(--dsw-alias-state-error-primary)}._v_wrq_rows>._v_wrq_panelActions{border-bottom:.5px solid var(--dsw-alias-border-l2);padding:10px 0}._v_wrq_rows>._v_wrq_panelNote{padding:8px 0}._v_wrq_panelError{margin:0;font-size:12px;line-height:18px}._v_wrq_boardRow{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-direction:column;min-width:0;padding:14px 0;display:flex}._v_wrq_boardRowLine{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 16px;min-width:0;display:flex}._v_wrq_boardGroup>._v_wrq_boardRow:last-child,._v_wrq_boardOthersList>._v_wrq_boardRow:last-child{border-bottom:0;padding-bottom:4px}._v_wrq_boardMain{padding-top:12px}._v_wrq_boardEmpty{color:var(--dsw-alias-label-tertiary);margin:0;padding:12px 0 4px;font-size:12px;line-height:18px}._v_wrq_boardOthers{flex-direction:column;min-width:0;padding-top:10px;display:flex}._v_wrq_boardOthersToggle{border-radius:var(--dsw-radius-sm);width:fit-content;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border:0;align-items:center;gap:6px;margin-left:-4px;padding:2px 4px;font-size:12px;font-weight:500;line-height:18px;display:inline-flex}._v_wrq_boardOthersToggle:hover{color:var(--dsw-alias-label-primary)}._v_wrq_boardOthersToggle>svg{transition:transform .14s;transform:rotate(-90deg)}._v_wrq_boardOthersToggle[aria-expanded=true]>svg{transform:rotate(0)}._v_wrq_boardOthersList{flex-direction:column;min-width:0;display:flex}._v_wrq_boardFootnote{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:18px}._v_wrq_optionsPanel{border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-module-platform);flex-direction:column;gap:14px;min-width:0;margin-top:12px;padding:14px 16px;display:flex}._v_wrq_optionField{flex-direction:column;gap:6px;min-width:0;display:flex}._v_wrq_optionLabel{justify-content:space-between;align-items:center;gap:8px;min-width:0;display:flex}._v_wrq_optionLabel label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}._v_wrq_optionDefault{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs);color:var(--dsw-alias-label-tertiary);padding:0 6px;font-size:11px;line-height:16px}._v_wrq_optionReset{border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-state-business-primary);font:inherit;cursor:pointer;background:0 0;border:0;padding:0 4px;font-size:12px;line-height:18px}._v_wrq_optionReset:disabled{cursor:default;opacity:.5}._v_wrq_optionInput{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);width:100%;min-width:0;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);font:inherit;resize:vertical;outline:none;padding:7px 10px;font-size:13px;line-height:20px}._v_wrq_optionInput:focus-visible{border-color:var(--dsw-alias-state-business-primary)}._v_wrq_optionInput[aria-invalid=true]{border-color:var(--dsw-alias-state-error-primary)}._v_wrq_optionInput:disabled{opacity:.5}._v_wrq_optionHint{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;font-size:12px;line-height:18px}._v_wrq_optionHint[data-error]{color:var(--dsw-alias-state-error-primary)}._v_wrq_optionChoices{flex-wrap:wrap;gap:6px 16px;min-width:0;display:flex}._v_wrq_optionEmpty{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}._v_wrq_boardControl{flex-wrap:wrap;flex:0 auto;justify-content:flex-end;align-items:center;gap:6px 12px;min-width:0;margin-left:auto;display:flex}._v_wrq_boardState{min-width:0;color:var(--dsw-alias-label-tertiary);white-space:nowrap;align-items:center;gap:6px;font-size:12px;line-height:18px;display:inline-flex}._v_wrq_boardState[data-tone=warning],._v_wrq_boardState[data-tone=error]{color:var(--dsw-alias-label-secondary)}._v_wrq_boardValue{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}@container (width<=420px){._v_wrq_boardMain ._v_wrq_boardControl{justify-content:stretch;width:100%}._v_wrq_boardMain ._v_wrq_boardControl>:last-child{flex:1}}@container (width<=180px){._v_wrq_boardSection ._v_wrq_sectionHeading p,._v_wrq_boardSection ._v_wrq_settingCopy small{display:none}._v_wrq_boardSection ._v_wrq_boardRow{padding:10px 0}._v_wrq_boardSection ._v_wrq_boardRowLine{grid-template-columns:minmax(0,1fr);gap:6px;display:grid}._v_wrq_boardSection ._v_wrq_settingCopy{min-width:0}._v_wrq_boardSection ._v_wrq_settingCopy strong{overflow-wrap:anywhere}._v_wrq_boardSection ._v_wrq_boardControl{justify-self:end}}._v_wrq_placeholderRow{border-bottom:.5px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:center;gap:16px;min-height:70px;display:flex}._v_wrq_placeholderRow span{background:var(--dsw-alias-bg-module-platform);border-radius:6px;height:12px;animation:1.4s ease-in-out infinite _v_wrq_placeholder-pulse}._v_wrq_placeholderRow span:first-child{width:38%}._v_wrq_placeholderRow span:last-child{border-radius:10px;width:36px;height:20px}@keyframes _v_wrq_placeholder-pulse{50%{opacity:.45}}@media (prefers-reduced-motion:reduce){._v_wrq_boardRowCopy,._v_wrq_boardOthersToggle>svg{transition:none}._v_wrq_placeholderRow span{animation:none}}._v_wrq_selector{appearance:none;border-radius:var(--dsw-radius-md);max-width:280px;height:36px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-module-platform);white-space:nowrap;cursor:pointer;border:0;align-items:center;gap:12px;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}._v_wrq_selector>span{text-overflow:ellipsis;min-width:0;overflow:hidden}._v_wrq_selector>svg{color:var(--dsw-alias-label-tertiary);flex:none}._v_wrq_selector:hover:not(:disabled),._v_wrq_selector[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}._v_wrq_selector:disabled{cursor:default;opacity:.4}._v_wrq_selectMenu{min-width:220px}._v_wrq_selectOption{white-space:normal;gap:1px;min-width:0;display:grid}._v_wrq_selectOption>small{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;font-size:12px;line-height:18px}._v_wrq_directoryInput{border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);width:100%;min-width:0;height:34px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3);font-family:var(--ds-font-family-code,ui-monospace, monospace);outline:none;padding:0 12px;font-size:12px;line-height:20px}._v_wrq_directoryInput::placeholder{color:var(--dsw-alias-label-dimmed);font-family:var(--dsw-font-family);font-size:13px}._v_wrq_directoryInput:focus-visible{border-color:var(--dsw-alias-state-business-primary)}._v_wrq_directoryInput[aria-invalid=true]{border-color:var(--dsw-alias-state-error-primary)}._v_wrq_directoryInput:disabled{cursor:default;opacity:.5}._v_wrq_rowDetail{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-direction:column;gap:10px;min-width:0;padding:0 0 14px;display:flex}._v_wrq_settingRow:has(+._v_wrq_rowDetail){border-bottom:0;padding-bottom:10px}._v_wrq_effectiveRoute{min-width:0;color:var(--dsw-alias-label-tertiary);justify-content:space-between;align-items:center;gap:12px;font-size:12px;line-height:18px;display:flex}._v_wrq_effectiveRoute code{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs);min-width:0;color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code,ui-monospace, monospace);text-overflow:ellipsis;white-space:nowrap;padding:1px 6px;font-size:11px;line-height:16px;overflow:hidden}._v_wrq_effectiveRoute small{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:12px;overflow:hidden}._v_wrq_warning{color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;margin:0;font-size:12px;line-height:18px}._v_wrq_advanced{min-width:0;padding:12px 0 2px}._v_wrq_advanced>summary{border-radius:var(--dsw-radius-sm);width:fit-content;color:var(--dsw-alias-label-secondary);cursor:pointer;align-items:center;gap:6px;margin-left:-4px;padding:2px 4px;font-size:12px;font-weight:500;line-height:18px;list-style:none;display:inline-flex}._v_wrq_advanced>summary::-webkit-details-marker{display:none}._v_wrq_advanced>summary>svg{transition:transform .14s}._v_wrq_advanced[open]>summary>svg{transform:rotate(180deg)}._v_wrq_advanced>summary:hover{color:var(--dsw-alias-label-primary)}._v_wrq_advanced>._v_wrq_fieldGrid{padding-top:12px}._v_wrq_miniSpinner{border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-label-secondary);border-radius:50%;flex:none;width:14px;height:14px;margin-top:4px;animation:.7s linear infinite _v_wrq_settings-spin}@keyframes _v_wrq_settings-spin{to{transform:rotate(360deg)}}._v_wrq_providerList{flex-direction:column;gap:8px;min-width:0;margin-top:10px;display:flex}._v_wrq_providerRow{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill);overflow:hidden}._v_wrq_providerRowHeader{align-items:center;gap:12px;min-width:0;padding:12px 14px;display:flex}summary._v_wrq_providerRowHeader{cursor:pointer;list-style:none}summary._v_wrq_providerRowHeader::-webkit-details-marker{display:none}._v_wrq_providerDisclosure{appearance:none;min-width:0;color:inherit;cursor:pointer;text-align:left;background:0 0;border:0;outline:none;flex:1;align-items:center;gap:8px;padding:0;display:flex}._v_wrq_providerDisclosure:disabled{cursor:default}._v_wrq_providerDisclosure:focus-visible,summary._v_wrq_providerRowHeader:focus-visible{border-radius:var(--dsw-radius-md);box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}._v_wrq_providerIdentity{flex:1;align-items:center;gap:12px;min-width:0;display:flex}._v_wrq_providerIdentity>span{flex-direction:column;min-width:0;display:flex}._v_wrq_providerIdentity strong{font-size:14px;font-weight:500;line-height:22px}._v_wrq_providerIdentity small{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}._v_wrq_providerMark{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1);flex:none;place-items:center;width:36px;height:36px;padding:6px;display:grid;overflow:hidden}._v_wrq_providerMark>img,._v_wrq_providerMark>svg{object-fit:contain;border-radius:4px;width:100%;height:100%;display:block}._v_wrq_providerEnableControl{flex:none;align-items:center;gap:10px;display:flex}._v_wrq_providerScopeTag{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs);color:var(--dsw-alias-label-secondary);flex:none;padding:1px 6px;font-size:11px;line-height:16px}._v_wrq_providerScopeTag[data-scope=workspace]{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, transparent);color:var(--dsw-alias-state-business-primary)}._v_wrq_providerState{color:var(--dsw-alias-label-tertiary);white-space:nowrap;flex:none;align-items:center;gap:6px;font-size:12px;line-height:18px;display:inline-flex}._v_wrq_providerState:before{content:\"\";background:var(--dsw-alias-state-idle-primary);border-radius:50%;flex:none;width:6px;height:6px}._v_wrq_providerState[data-enabled]:before{background:var(--dsw-alias-state-success-primary)}._v_wrq_providerChevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .14s}._v_wrq_providerDisclosure[aria-expanded=true] ._v_wrq_providerChevron,details[open]>summary ._v_wrq_providerChevron{transform:rotate(180deg)}._v_wrq_providerToggle{cursor:pointer;display:inline-flex;position:relative}._v_wrq_providerInlineBody{padding:0 14px 14px}._v_wrq_providerToggleError{color:var(--dsw-alias-state-error-primary);margin:0;padding:0 14px 12px;font-size:12px;line-height:18px}._v_wrq_providerServiceForm,._v_wrq_editor{border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-module-platform);flex-direction:column;gap:12px;min-width:0;padding:14px 16px;display:flex}._v_wrq_providerServicePrompt,._v_wrq_editorNote{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}._v_wrq_editorHeading h3{margin:0;font-size:14px;font-weight:500;line-height:22px}._v_wrq_editorHeading p{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;margin:2px 0 0;font-size:12px;line-height:18px}._v_wrq_editor ._v_wrq_toggleRow{border-top:.5px solid var(--dsw-alias-border-l3);border-bottom:.5px solid var(--dsw-alias-border-l3);padding:10px 0}._v_wrq_embeddingTest{justify-content:space-between;align-items:center;gap:12px;min-width:0;display:flex}._v_wrq_embeddingTest>span{min-width:0;color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;font-size:12px;line-height:18px}._v_wrq_embeddingTest>span._v_wrq_error{color:var(--dsw-alias-state-error-primary)}._v_wrq_globalLocationSetting{flex-direction:column;min-width:0;display:flex}._v_wrq_providerServiceLocation{border-bottom:.5px solid var(--dsw-alias-border-l3);padding-bottom:12px}._v_wrq_providerServiceLocation>._v_wrq_nativeLocation{padding:0 0 12px}._v_wrq_providerLocationField{padding-top:2px}._v_wrq_nativeLocation{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px 16px;min-width:0;display:flex}._v_wrq_inlineChoices{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-interactive-bg-hover);flex:none;align-items:center;gap:2px;padding:3px;display:inline-flex}._v_wrq_inlineChoices label{cursor:pointer;position:relative}._v_wrq_inlineChoices input{z-index:1;opacity:0;width:100%;height:100%;cursor:inherit;margin:0;position:absolute;inset:0}._v_wrq_inlineChoices span{border-radius:var(--dsw-radius-sm);height:28px;color:var(--dsw-alias-label-secondary);white-space:nowrap;align-items:center;padding:0 12px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}._v_wrq_inlineChoices input:checked+span{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-soft)}._v_wrq_inlineChoices input:focus-visible+span{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}._v_wrq_inlineChoices input:disabled+span{cursor:default;opacity:.4}._v_wrq_fieldGrid,._v_wrq_providerSettingsGrid{grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px;min-width:0;display:grid}._v_wrq_providerSettingsGrid{grid-template-columns:minmax(0,1fr)}._v_wrq_fieldGrid>label,._v_wrq_providerFieldControl>label:not(._v_wrq_providerBoolean){min-width:0;color:var(--dsw-alias-label-primary);flex-direction:column;gap:6px;font-size:13px;font-weight:500;line-height:20px;display:flex}._v_wrq_fieldGrid input,._v_wrq_fieldGrid select,._v_wrq_providerFieldControl input:not([type=checkbox]),._v_wrq_providerFieldControl select{border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);width:100%;min-width:0;height:34px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3);font:inherit;outline:none;padding:0 12px;font-size:13px;font-weight:400;line-height:20px}._v_wrq_fieldGrid input::placeholder,._v_wrq_providerFieldControl input::placeholder{color:var(--dsw-alias-label-dimmed)}._v_wrq_fieldGrid select,._v_wrq_providerFieldControl select{appearance:none;cursor:pointer;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-position:right 12px center;background-repeat:no-repeat;background-size:12px 12px;padding-right:32px}._v_wrq_fieldGrid select:disabled,._v_wrq_providerFieldControl select:disabled{cursor:default}._v_wrq_fieldGrid input:focus-visible,._v_wrq_fieldGrid select:focus-visible,._v_wrq_providerFieldControl input:focus-visible,._v_wrq_providerFieldControl select:focus-visible{border-color:var(--dsw-alias-state-business-primary)}._v_wrq_fieldGrid input[aria-invalid=true],._v_wrq_providerFieldControl input:invalid{border-color:var(--dsw-alias-state-error-primary)}._v_wrq_fieldGrid input:disabled,._v_wrq_fieldGrid select:disabled,._v_wrq_providerFieldControl input:disabled,._v_wrq_providerFieldControl select:disabled{opacity:.5}._v_wrq_providerFieldControl{flex-direction:column;justify-content:flex-end;gap:4px;min-width:0;display:flex}._v_wrq_providerBoolean{min-height:34px;color:var(--dsw-alias-label-primary);align-items:center;gap:8px;font-size:13px;display:flex}._v_wrq_providerBoolean input{width:16px;height:16px;accent-color:var(--dsw-alias-brand-primary);margin:0}._v_wrq_providerSecretInput{min-width:0;position:relative}._v_wrq_providerSecretInput>input{padding-right:40px}._v_wrq_providerSecretVisibility{appearance:none;border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;place-items:center;padding:0;display:grid;position:absolute;top:3px;right:3px}._v_wrq_providerSecretVisibility:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}._v_wrq_providerSecretVisibility:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline:none}._v_wrq_providerSecretVisibility:disabled{cursor:default;opacity:.35}._v_wrq_providerSecretVisibility svg{width:16px;height:16px}._v_wrq_memoryConfigFooter{justify-content:space-between;align-items:center;gap:10px;min-height:36px;display:flex}._v_wrq_memoryConfigFooter>div{align-items:center;gap:6px;display:flex}._v_wrq_providerServiceFooter{align-items:flex-end;min-height:0}._v_wrq_configFeedback{flex:1;min-width:0;font-size:12px;line-height:18px}._v_wrq_scopeChanging,._v_wrq_providerTarget{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:18px}._v_wrq_scopeChanging{border-radius:var(--dsw-radius-md);color:var(--dsw-alias-state-warn-label,var(--dsw-alias-label-secondary));background:var(--dsw-alias-state-warn-tertiary,var(--dsw-alias-bg-module-platform));padding:8px 12px}._v_wrq_providerLoadError{justify-content:space-between;align-items:center;gap:10px;font-size:12px;display:flex}._v_wrq_visuallyHidden{clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}._v_wrq_location{align-items:baseline;gap:6px;min-width:0;display:flex}._v_wrq_locationRow{border-bottom:.5px solid var(--dsw-alias-border-l2);gap:10px;padding:14px 0}._v_wrq_rowActions{flex:none;align-items:center;gap:8px;display:flex}._v_wrq_packRow{flex-direction:column;gap:8px;min-width:0;padding-bottom:14px;display:flex}._v_wrq_packRow>._v_wrq_settingRow{border-bottom:0;padding-bottom:6px}._v_wrq_packRow:has(>._v_wrq_packFeedback:empty):not(:has(>._v_wrq_importBar))>._v_wrq_settingRow{padding-bottom:0}._v_wrq_rows>._v_wrq_packRow:not(:last-child){border-bottom:.5px solid var(--dsw-alias-border-l2)}._v_wrq_importBar{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:10px;min-width:0;padding:10px 12px;display:grid}._v_wrq_importBar>div{min-width:0;display:grid}._v_wrq_importBar strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}._v_wrq_importBar small{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}._v_wrq_packFeedback{gap:4px;display:grid}._v_wrq_packFeedback:empty{display:none}._v_wrq_packFeedback p{overflow-wrap:anywhere;margin:0;font-size:12px;line-height:18px}._v_wrq_error{color:var(--dsw-alias-state-error-primary)}._v_wrq_readOnlyNotice{color:var(--dsw-alias-label-tertiary);margin:0 0 -20px;font-size:12px;line-height:18px}._v_wrq_packSuccess{color:var(--dsw-alias-state-success-primary)}._v_wrq_selector:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline:none}@media (width<=620px){._v_wrq_page{gap:28px}._v_wrq_rowActions{width:100%}._v_wrq_rowActions button{flex:1}._v_wrq_importBar{grid-template-columns:minmax(0,1fr) auto}._v_wrq_importBar>button:last-child{grid-column:1/-1}._v_wrq_inlineChoices{width:100%}._v_wrq_inlineChoices label{flex:1}._v_wrq_inlineChoices span{justify-content:center;width:100%}._v_wrq_providerRowHeader{align-items:flex-start;gap:8px}._v_wrq_providerEnableControl{flex-wrap:wrap;justify-content:flex-end;gap:6px;max-width:132px}._v_wrq_providerState{text-overflow:ellipsis;max-width:120px;overflow:hidden}._v_wrq_memoryConfigFooter{flex-direction:column;align-items:stretch}._v_wrq_memoryConfigFooter>div:last-child{width:100%}._v_wrq_memoryConfigFooter button{flex:1}}@media (prefers-reduced-motion:reduce){._v_wrq_providerChevron,._v_wrq_advanced>summary>svg{transition:none}._v_wrq_miniSpinner{animation:none}}";
		const tagId$13 = "dsh-mnemon/src/client/MnemonSettingsCard.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$13) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$13;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$13) tag.textContent = css$13;
		}
		var MnemonSettingsCard_module_css_default = {
			"advanced": "_v_wrq_advanced",
			"appliesNow": "_v_wrq_appliesNow",
			"board": "_v_wrq_board",
			"boardControl": "_v_wrq_boardControl",
			"boardEmpty": "_v_wrq_boardEmpty",
			"boardFootnote": "_v_wrq_boardFootnote",
			"boardGroup": "_v_wrq_boardGroup",
			"boardGroupHead": "_v_wrq_boardGroupHead",
			"boardIconButton": "_v_wrq_boardIconButton",
			"boardLink": "_v_wrq_boardLink",
			"boardLinks": "_v_wrq_boardLinks",
			"boardLinksLabel": "_v_wrq_boardLinksLabel",
			"boardLoading": "_v_wrq_boardLoading",
			"boardMain": "_v_wrq_boardMain",
			"boardOthers": "_v_wrq_boardOthers",
			"boardOthersList": "_v_wrq_boardOthersList",
			"boardOthersToggle": "_v_wrq_boardOthersToggle",
			"boardProblem": "_v_wrq_boardProblem",
			"boardRow": "_v_wrq_boardRow",
			"boardRowCopy": "_v_wrq_boardRowCopy",
			"boardRowLine": "_v_wrq_boardRowLine",
			"boardSearch": "_v_wrq_boardSearch",
			"boardSection": "_v_wrq_boardSection",
			"boardState": "_v_wrq_boardState",
			"boardValue": "_v_wrq_boardValue",
			"componentListNote": "_v_wrq_componentListNote",
			"componentRowPage": "_v_wrq_componentRowPage",
			"configFeedback": "_v_wrq_configFeedback",
			"detailsBack": "_v_wrq_detailsBack",
			"detailsBody": "_v_wrq_detailsBody",
			"detailsContributed": "_v_wrq_detailsContributed",
			"detailsControl": "_v_wrq_detailsControl",
			"detailsDialog": "_v_wrq_detailsDialog",
			"detailsEffect": "_v_wrq_detailsEffect",
			"detailsHead": "_v_wrq_detailsHead",
			"detailsHeadLine": "_v_wrq_detailsHeadLine",
			"detailsMissing": "_v_wrq_detailsMissing",
			"detailsName": "_v_wrq_detailsName",
			"detailsPackage": "_v_wrq_detailsPackage",
			"detailsRelations": "_v_wrq_detailsRelations",
			"detailsScroll": "_v_wrq_detailsScroll",
			"detailsSection": "_v_wrq_detailsSection",
			"directoryInput": "_v_wrq_directoryInput",
			"editor": "_v_wrq_editor",
			"editorHeading": "_v_wrq_editorHeading",
			"editorNote": "_v_wrq_editorNote",
			"effectiveRoute": "_v_wrq_effectiveRoute",
			"embeddingTest": "_v_wrq_embeddingTest",
			"error": "_v_wrq_error",
			"fieldGrid": "_v_wrq_fieldGrid",
			"globalLocationSetting": "_v_wrq_globalLocationSetting",
			"groupCallout": "_v_wrq_groupCallout",
			"importBar": "_v_wrq_importBar",
			"inlineChoices": "_v_wrq_inlineChoices",
			"loading": "_v_wrq_loading",
			"location": "_v_wrq_location",
			"locationRow": "_v_wrq_locationRow",
			"memoryConfigFooter": "_v_wrq_memoryConfigFooter",
			"miniSpinner": "_v_wrq_miniSpinner",
			"nativeLocation": "_v_wrq_nativeLocation",
			"optionChoices": "_v_wrq_optionChoices",
			"optionDefault": "_v_wrq_optionDefault",
			"optionEmpty": "_v_wrq_optionEmpty",
			"optionField": "_v_wrq_optionField",
			"optionHint": "_v_wrq_optionHint",
			"optionInput": "_v_wrq_optionInput",
			"optionLabel": "_v_wrq_optionLabel",
			"optionReset": "_v_wrq_optionReset",
			"optionsPanel": "_v_wrq_optionsPanel",
			"packFeedback": "_v_wrq_packFeedback",
			"packRow": "_v_wrq_packRow",
			"packSuccess": "_v_wrq_packSuccess",
			"page": "_v_wrq_page",
			"pageLink": "_v_wrq_pageLink",
			"panelActions": "_v_wrq_panelActions",
			"panelError": "_v_wrq_panelError",
			"panelHeading": "_v_wrq_panelHeading",
			"panelNote": "_v_wrq_panelNote",
			"panelSection": "_v_wrq_panelSection",
			"placeholder-pulse": "_v_wrq_placeholder-pulse",
			"placeholderRow": "_v_wrq_placeholderRow",
			"providerBoolean": "_v_wrq_providerBoolean",
			"providerChevron": "_v_wrq_providerChevron",
			"providerDisclosure": "_v_wrq_providerDisclosure",
			"providerEnableControl": "_v_wrq_providerEnableControl",
			"providerFieldControl": "_v_wrq_providerFieldControl",
			"providerIdentity": "_v_wrq_providerIdentity",
			"providerInlineBody": "_v_wrq_providerInlineBody",
			"providerList": "_v_wrq_providerList",
			"providerLoadError": "_v_wrq_providerLoadError",
			"providerLocationField": "_v_wrq_providerLocationField",
			"providerMark": "_v_wrq_providerMark",
			"providerRow": "_v_wrq_providerRow",
			"providerRowHeader": "_v_wrq_providerRowHeader",
			"providerScopeTag": "_v_wrq_providerScopeTag",
			"providerSecretInput": "_v_wrq_providerSecretInput",
			"providerSecretVisibility": "_v_wrq_providerSecretVisibility",
			"providerServiceFooter": "_v_wrq_providerServiceFooter",
			"providerServiceForm": "_v_wrq_providerServiceForm",
			"providerServiceLocation": "_v_wrq_providerServiceLocation",
			"providerServicePrompt": "_v_wrq_providerServicePrompt",
			"providerSettingsGrid": "_v_wrq_providerSettingsGrid",
			"providerState": "_v_wrq_providerState",
			"providerTarget": "_v_wrq_providerTarget",
			"providerToggle": "_v_wrq_providerToggle",
			"providerToggleError": "_v_wrq_providerToggleError",
			"readOnlyNotice": "_v_wrq_readOnlyNotice",
			"rowActions": "_v_wrq_rowActions",
			"rowDetail": "_v_wrq_rowDetail",
			"rowNote": "_v_wrq_rowNote",
			"rows": "_v_wrq_rows",
			"scopeChanging": "_v_wrq_scopeChanging",
			"section": "_v_wrq_section",
			"sectionHeading": "_v_wrq_sectionHeading",
			"selectMenu": "_v_wrq_selectMenu",
			"selectOption": "_v_wrq_selectOption",
			"selector": "_v_wrq_selector",
			"settingControl": "_v_wrq_settingControl",
			"settingCopy": "_v_wrq_settingCopy",
			"settingRow": "_v_wrq_settingRow",
			"settings-spin": "_v_wrq_settings-spin",
			"surface": "_v_wrq_surface",
			"switch": "_v_wrq_switch",
			"toggleRow": "_v_wrq_toggleRow",
			"visuallyHidden": "_v_wrq_visuallyHidden",
			"warning": "_v_wrq_warning"
		};
		//#endregion
		//#region plugins/dsh-mnemon-source-runtime/presentation/locales.json
		var zh$3 = {
			"nav.runtime": "运行时",
			"runtime.title": "运行时记忆",
			"runtime.description": "每轮对话都会带上的紧凑记忆，保存为 USER.md 与 MEMORY.md。",
			"runtime.total": "{count} 条记忆",
			"runtime.entriesAria": "运行时记忆列表",
			"runtime.scopeAria": "运行时记忆范围",
			"runtime.scopeAll": "全部",
			"runtime.filterAria": "筛选运行时记忆",
			"runtime.filterPlaceholder": "按内容筛选…",
			"runtime.noMatch": "没有符合当前范围与查询条件的记忆。",
			"runtime.hotContext": "每轮上下文",
			"runtime.addTitle": "添加运行时记忆",
			"runtime.addDescription": "每轮对话都会带上；长期内容请存入记忆空间。",
			"runtime.content": "运行时记忆内容",
			"runtime.placeholder": "输入一条简洁、独立、未来仍然有用的信息…",
			"runtime.target": "保存到",
			"runtime.importance": "重要性",
			"runtime.saving": "处理中…",
			"runtime.addButton": "添加记忆",
			"runtime.addAction": "添加",
			"runtime.target.user": "用户画像",
			"runtime.target.user.description": "身份、习惯与协作偏好；只保存在本地。",
			"runtime.target.memory": "工作记忆",
			"runtime.target.memory.description": "项目事实、约定与经验；写满时按主题归档到记忆空间。",
			"runtime.importance.critical": "关键",
			"runtime.importance.normal": "普通",
			"runtime.importance.low": "低",
			"runtime.branches": "适用分支",
			"runtime.branchesPlaceholder": "如 main、dev（逗号分隔；留空=全部分支可见）",
			"runtime.branchesHint": "留空表示清除分支限制（全部分支可见）",
			"runtime.branchBadge": "分支限定",
			"runtime.editContent": "编辑运行时记忆",
			"runtime.editAction": "编辑",
			"runtime.saveEdit": "保存修改",
			"runtime.removeAction": "移除",
			"runtime.removeTitle": "移除运行时记忆？",
			"runtime.removeWarning": "移除后，这条内容将不再随每轮上下文加载。该操作无法撤销。",
			"runtime.result.add": "已添加到{target} · 当前 {count} 条",
			"runtime.result.replace": "已更新{target} · 当前 {count} 条",
			"runtime.result.remove": "已从{target}移除 · 当前 {count} 条",
			"runtime.result.maintenance": "容量整理完成：已先归档到记忆空间 {spaces}，再更新{target} · 当前 {count} 条",
			"runtime.result.localCompaction": "本地画像整理完成：未写入记忆空间，已更新{target} · 当前 {count} 条",
			"runtime.readOnly": "当前为只读模式；运行时记忆仍会进入上下文，但不能在此修改。",
			"runtime.footnote": "memories.json 是唯一事实源；两个 Markdown 文件由控制层生成，不应直接编辑。"
		};
		var en$3 = {
			"nav.runtime": "Runtime",
			"runtime.title": "Runtime Memory",
			"runtime.description": "Compact memory carried into every turn, kept as USER.md and MEMORY.md.",
			"runtime.total": "{count} entries",
			"runtime.entriesAria": "Runtime memory list",
			"runtime.scopeAria": "Runtime memory scope",
			"runtime.scopeAll": "All",
			"runtime.filterAria": "Filter runtime memory",
			"runtime.filterPlaceholder": "Filter by content…",
			"runtime.noMatch": "No runtime memory matches the current scope and query.",
			"runtime.hotContext": "Every-turn context",
			"runtime.addTitle": "Add runtime memory",
			"runtime.addDescription": "Carried into every turn; keep long-term knowledge in Memory Spaces.",
			"runtime.content": "Runtime memory content",
			"runtime.placeholder": "Enter one compact, self-contained fact that will remain useful…",
			"runtime.target": "Save to",
			"runtime.importance": "Importance",
			"runtime.saving": "Working…",
			"runtime.addButton": "Add memory",
			"runtime.addAction": "Add",
			"runtime.target.user": "User Profile",
			"runtime.target.user.description": "Identity, habits and working preferences; kept local only.",
			"runtime.target.memory": "Working Memory",
			"runtime.target.memory.description": "Project facts, conventions and lessons; archived to Memory Spaces by topic when full.",
			"runtime.importance.critical": "Critical",
			"runtime.importance.normal": "Normal",
			"runtime.importance.low": "Low",
			"runtime.branches": "Branches",
			"runtime.branchesPlaceholder": "e.g. main, dev (comma-separated; empty = visible on all branches)",
			"runtime.branchesHint": "Empty input clears the branch restriction (visible on all branches)",
			"runtime.branchBadge": "Branch-scoped",
			"runtime.editContent": "Edit runtime memory",
			"runtime.editAction": "Edit",
			"runtime.saveEdit": "Save change",
			"runtime.removeAction": "Remove",
			"runtime.removeTitle": "Remove runtime memory?",
			"runtime.removeWarning": "After removal, this content will no longer load with every turn. This action cannot be undone.",
			"runtime.result.add": "Added to {target} · {count} entries",
			"runtime.result.replace": "Updated {target} · {count} entries",
			"runtime.result.remove": "Removed from {target} · {count} entries",
			"runtime.result.maintenance": "Capacity maintenance complete: archived to {spaces}, then updated {target} · {count} entries",
			"runtime.result.localCompaction": "Local profile compaction complete: no Memory Space write; updated {target} · {count} entries",
			"runtime.readOnly": "Read only here: runtime memory still enters context but cannot be changed on this page.",
			"runtime.footnote": "memories.json is the only source of truth. The control plane generates both Markdown files; do not edit them directly."
		};
		//#endregion
		//#region plugins/dsh-mnemon-source-documents/presentation/locales.json
		var zh$2 = {
			"nav.documents": "档案",
			"documents.title": "项目档案",
			"documents.description": "当前工作区的项目文档：先检索，再按需阅读全文；接近容量上限时，最久未用的档案会归档。",
			"documents.capacity": "{used} / {limit}",
			"documents.summary": "档案存储摘要",
			"documents.active": "活跃档案",
			"documents.activeHint": "近场检索范围",
			"documents.archivedCount": "归档",
			"documents.archivedHint": "不占活跃容量",
			"documents.activeCapacity": "活跃容量",
			"documents.capacityHint": "按实际 UTF-8 文件大小计算",
			"documents.searchAria": "检索项目档案",
			"documents.searchPlaceholder": "搜索设计、调查、流程或交接记录…",
			"documents.search": "检索",
			"documents.scope": "档案范围",
			"documents.new": "新建档案",
			"documents.newTitle": "创建托管档案",
			"documents.editTitle": "编辑活跃档案",
			"documents.editorHint": "控制层会生成 frontmatter、哈希与修订号；原项目文件始终只读。",
			"documents.managedCopy": "托管副本",
			"documents.name": "标题",
			"documents.routing": "检索说明",
			"documents.sources": "来源路径",
			"documents.sourcesPlaceholder": "src/index.ts, docs/architecture.md",
			"documents.markdown": "Markdown 内容",
			"documents.saving": "保存中…",
			"documents.create": "创建档案",
			"documents.save": "保存修订",
			"documents.created": "已创建活跃档案。",
			"documents.createdAfterArchive": "已先迁移 {count} 份旧档案，再创建活跃档案。",
			"documents.updated": "已保存新的档案修订。",
			"documents.updatedAfterArchive": "已先迁移 {count} 份旧档案，再保存修订。",
			"documents.archived": "已建立 Mnemon 冷索引并归档；关联记忆空间：{spaces}",
			"documents.list": "项目档案列表",
			"documents.activeList": "活跃目录",
			"documents.archiveList": "归档目录",
			"documents.noDescription": "暂无检索说明。",
			"documents.missing": "文件缺失",
			"documents.emptyActive": "还没有活跃档案",
			"documents.emptyActiveText": "复杂对话达到活动评分门槛后会自动审阅并整理档案，也可以在上方手动创建。",
			"documents.emptyArchived": "还没有归档",
			"documents.emptyArchivedText": "只有完成 Mnemon 索引的档案才会迁移到这里。",
			"documents.reader": "档案阅读器",
			"documents.selectTitle": "选择一份档案",
			"documents.selectText": "在左侧查看活跃项目知识或沿 Mnemon 引用打开归档原文。",
			"documents.coldArchive": "归档原文",
			"documents.edit": "编辑",
			"documents.path": "托管路径",
			"documents.revision": "修订",
			"documents.hash": "内容哈希",
			"documents.size": "文件大小",
			"documents.archiveReceipt": "Mnemon 冷索引回执",
			"documents.archiveTitle": "迁入归档",
			"documents.archiveDescription": "独立任务 Agent 先拟定摘要和目标空间；Host 校验后写入冷索引，再移动原文。需要已启用且支持精确写入与删除的记忆空间。",
			"documents.archive": "归档",
			"documents.archiveConfirm": "确认建立 Mnemon 索引并迁移这份档案？",
			"documents.archiving": "索引并迁移中…",
			"documents.archiveNow": "确认归档",
			"documents.footnote": "`.mnemon/documents/index.json` 是控制面事实源；active 总量固定不超过 10 MB，archived 不计入上限，项目源文件不会被修改。"
		};
		var en$2 = {
			"nav.documents": "Documents",
			"documents.title": "Project Documents",
			"documents.description": "Project documents for this workspace: searched first, read in full when needed; near the limit the least-used ones are archived.",
			"documents.capacity": "{used} / {limit}",
			"documents.summary": "Document storage summary",
			"documents.active": "Active",
			"documents.activeHint": "Near-field search scope",
			"documents.archivedCount": "Archive",
			"documents.archivedHint": "Excluded from active capacity",
			"documents.activeCapacity": "Active capacity",
			"documents.capacityHint": "Measured from actual UTF-8 files",
			"documents.searchAria": "Search project documents",
			"documents.searchPlaceholder": "Search designs, investigations, procedures, or handoffs…",
			"documents.search": "Search",
			"documents.scope": "Document scope",
			"documents.new": "New document",
			"documents.newTitle": "Create managed document",
			"documents.editTitle": "Edit active document",
			"documents.editorHint": "The control plane generates frontmatter, hashes, and revisions. Project source files stay read only.",
			"documents.managedCopy": "Managed copy",
			"documents.name": "Title",
			"documents.routing": "Retrieval description",
			"documents.sources": "Source paths",
			"documents.sourcesPlaceholder": "src/index.ts, docs/architecture.md",
			"documents.markdown": "Markdown content",
			"documents.saving": "Saving…",
			"documents.create": "Create document",
			"documents.save": "Save revision",
			"documents.created": "Active document created.",
			"documents.createdAfterArchive": "Archived {count} older document(s), then created the active document.",
			"documents.updated": "New document revision saved.",
			"documents.updatedAfterArchive": "Archived {count} older document(s), then saved the revision.",
			"documents.archived": "Mnemon cold index created and document archived; Memory Spaces: {spaces}",
			"documents.list": "Project document list",
			"documents.activeList": "Active directory",
			"documents.archiveList": "Archive directory",
			"documents.noDescription": "No retrieval description.",
			"documents.missing": "File missing",
			"documents.emptyActive": "No active documents yet",
			"documents.emptyActiveText": "Complex work is reviewed after it reaches the activity-score gate, or you can create a Document above.",
			"documents.emptyArchived": "No archives yet",
			"documents.emptyArchivedText": "Only documents with a completed Mnemon index are moved here.",
			"documents.reader": "Document reader",
			"documents.selectTitle": "Select a document",
			"documents.selectText": "Read active project knowledge or follow a Mnemon reference to an archived original.",
			"documents.coldArchive": "Archived original",
			"documents.edit": "Edit",
			"documents.path": "Managed path",
			"documents.revision": "Revision",
			"documents.hash": "Content hash",
			"documents.size": "File size",
			"documents.archiveReceipt": "Mnemon cold-index receipt",
			"documents.archiveTitle": "Move to archive",
			"documents.archiveDescription": "An independent task Agent proposes a summary and destination. The Host validates and writes the cold index before moving the original. An active Memory Space with exact writes and safe deletion is required.",
			"documents.archive": "Archive",
			"documents.archiveConfirm": "Create the Mnemon index and archive this document?",
			"documents.archiving": "Indexing and moving…",
			"documents.archiveNow": "Confirm archive",
			"documents.footnote": "`.mnemon/documents/index.json` is the control-plane source of truth. active stays at or below 10 MB, archived is excluded, and project source files are never modified."
		};
		//#endregion
		//#region plugins/dsh-mnemon-source-memory-spaces/presentation/locales.json
		var zh$1 = {
			"term.space": "记忆空间",
			"term.spaces": "记忆空间",
			"category.decision": "决策",
			"category.preference": "偏好",
			"category.fact": "事实",
			"category.insight": "洞察",
			"category.context": "上下文",
			"category.general": "通用",
			"nav.memory.aria": "记忆空间页面",
			"nav.overview": "概览",
			"nav.bodies": "记忆空间",
			"nav.search": "检索",
			"nav.entities": "实体",
			"nav.rememberAction": "存入记忆",
			"nav.content": "内容",
			"overview.title": "记忆空间",
			"overview.description": "由 Mnemon Native 或第三方 Provider 承载的长期记忆；已激活的空间参与召回。",
			"overview.pageDescription": "创建和启停记忆空间，查看每个 Provider 的存储状态与实时关联快照。",
			"overview.interval": "进入时全量同步 · 点击卡片按需同步",
			"overview.fullSyncPending": "等待首次全量同步",
			"overview.fullSyncJustNow": "上次全量同步：刚刚",
			"overview.fullSyncSeconds": "上次全量同步：{count} 秒前",
			"overview.fullSyncMinutes": "上次全量同步：{count} 分钟前",
			"overview.fullSyncHours": "上次全量同步：{count} 小时前",
			"overview.fullSyncDays": "上次全量同步：{count} 天前",
			"overview.directory": "记忆空间目录",
			"overview.directory.description": "每张卡片是一个记忆空间；点击卡片检查连接，开关决定它是否参与召回。",
			"overview.directory.unsynced": "目录尚未同步",
			"overview.directory.unsyncedBadge": "目录待同步",
			"overview.directoryLoading": "正在加载记忆空间目录",
			"overview.healthLoading": "正在检测各记忆空间状态",
			"overview.storageHealthy": "存储正常",
			"overview.storageUnhealthy": "存储异常",
			"overview.storageChecking": "检测中",
			"overview.reconnecting": "重连中",
			"overview.reconnectHint": "点击卡片重新检测并同步这个记忆空间",
			"overview.reconnectAria": "重新连接{name}",
			"overview.snapshotLoading": "正在加载多记忆空间实时快照",
			"overview.metadataAction": "整理名称与说明",
			"overview.metadataTitle": "AI 维护记忆空间元信息",
			"overview.metadataDescription": "选择一个或多个已激活记忆空间。系统会分别通过各 Provider 最快的原生查询路径读取少量样本，再由独立任务 Agent 生成标题与说明。",
			"overview.metadataUnavailable": "暂时无法运行：未找到与当前记忆范围匹配的活跃 Agent",
			"overview.metadataLoading": "正在载入可维护的记忆空间…",
			"overview.metadataEmpty": "当前没有可由 AI 维护元信息的已激活记忆空间。",
			"overview.metadataSelected": "已选择 {count} 个记忆空间",
			"overview.metadataSelectAll": "全选",
			"overview.metadataClear": "清空",
			"overview.metadataSafety": "仅更新本地标题与说明，不会修改、移动或删除记忆内容。Provider 关闭后，这些本地元数据会随映射一起清理。",
			"overview.metadataGenerate": "AI 生成（{count}）",
			"overview.metadataGenerating": "AI 正在生成…",
			"overview.metadataRunningCount": "{count} 个生成中",
			"overview.metadataTaskRunning": "生成中…",
			"overview.metadataTaskSuccess": "已更新",
			"overview.metadataTaskError": "失败：{error}",
			"overview.metadataTaskUnknown": "未知错误",
			"overview.metadataCompleted": "已更新 {count} 个记忆空间的元信息。",
			"overview.mnemonDefault": "Mnemon 默认",
			"overview.toggleAria": "{name}读取开关",
			"overview.toggling": "切换中",
			"overview.noDescription": "尚未提供路由说明。",
			"overview.unsyncedTitle": "记忆空间目录尚未同步",
			"overview.unsyncedShort": "当前 Web 客户端与 DSH Host 状态不一致；重启 Host 后会重新登记既有 Store。",
			"overview.unsyncedLong": "当前 Host 仍在使用旧插件契约；重启 DSH 后会重新发现既有 Store，期间不会删除任何 .db。",
			"overview.emptyTitle": "还没有记忆空间",
			"overview.emptyShort": "创建第一个记忆空间并写入稳定上下文后，它会出现在这里。",
			"overview.emptyLong": "创建一个 Mnemon 记忆空间，或在“插件 → 可组合记忆”页面启用第三方 Provider 以同步其已有记忆空间。",
			"overview.noActiveTitle": "没有激活的记忆空间",
			"overview.noActiveText": "开启至少一个记忆空间的读取开关，即可在这里聚合它的实时图谱。",
			"overview.noContentTitle": "已激活记忆空间尚无内容",
			"overview.noContentText": "存入记忆后，这里会显示节点与关系。",
			"overview.createTitle": "创建记忆空间",
			"overview.createDialogHint": "这里定义记忆空间用途并选择底层 Provider；服务、凭据和全局数据位置沿用“插件 → 可组合记忆”页面中的配置。",
			"overview.createIdentityTitle": "记忆空间信息",
			"overview.createIdentityHint": "名称用于识别；描述会帮助 Agent 判断什么内容应写入和召回。",
			"overview.createPlacementTitle": "记忆空间 Provider",
			"overview.createPlacementHint": "这是一次明确的手动创建；选择一个已启用 Provider。任务 Agent 新建空间时的选择在“新空间的 Provider”中设置。",
			"overview.createName": "新记忆空间名称",
			"overview.createNamePlaceholder": "名称",
			"overview.createDescription": "新记忆空间描述",
			"overview.createDescriptionPlaceholder": "说明哪些内容属于它，以及何时应被召回",
			"overview.placementMode": "底层选择方式",
			"overview.placementManual": "手动指定",
			"overview.placementManualHint": "直接选择一个已启用 Provider",
			"overview.placementAutomatic": "智能选择",
			"overview.placementAutomaticHint": "先应用数据边界与能力规则，再由 Agent 在合格候选中选择",
			"overview.placementUnavailable": "需要一个已连接且与当前工作区对齐的对话",
			"overview.recommended": "推荐",
			"overview.placementPolicy": "选择策略",
			"overview.placementPolicyHint": "规则由系统强制执行，Prompt 只影响合格候选之间的判断。",
			"overview.agentDecision": "Agent 决策",
			"overview.placementPrompt": "策略 Prompt（可选）",
			"overview.placementPromptPlaceholder": "例如：这是团队协作知识；在满足精确写入要求时优先本地，否则优先共享。",
			"overview.dataBoundary": "数据边界",
			"overview.dataBoundaryRemote": "允许远程服务",
			"overview.dataBoundaryLocal": "仅限本地",
			"overview.preference": "软偏好",
			"overview.preferenceBalanced": "综合平衡",
			"overview.preferenceLocal": "本地优先",
			"overview.preferenceShared": "共享优先",
			"overview.requiredCapabilities": "必须具备（可多选）",
			"overview.capability.graph": "关系图谱",
			"overview.capability.exact-write": "精确写入",
			"overview.capability.forget": "安全遗忘",
			"overview.candidateNativeReady": "官方原生 · 跟随当前记忆范围",
			"overview.providerServiceRequired": "未启用",
			"overview.nativeCliRequired": "需要在本机安装 Mnemon CLI；其他 Provider 不受影响",
			"overview.workspaceBinding.automatic": "跟随当前记忆范围",
			"overview.workspaceBinding.optional-override": "跟随当前范围；全局可自定义位置",
			"overview.workspaceBinding.provider-global": "始终使用全局范围",
			"overview.candidateOpenViking": "纳入远程候选并提供连接",
			"overview.candidateLocal": "本地 Provider · 跟随当前记忆范围",
			"overview.candidateRemote": "远程 Provider · 使用全局服务配置",
			"overview.placementByLlm": "Agent 智能选择",
			"overview.placementByRules": "规则自动确定",
			"overview.placementConfidence": "置信度：{confidence}",
			"overview.confidence.high": "高",
			"overview.confidence.medium": "中",
			"overview.confidence.low": "低",
			"overview.providerLabel": "记忆引擎",
			"overview.nativeOfficial": "官方原生",
			"overview.providerNativeHint": "官方原生、本地优先，保留完整图谱与软删除能力",
			"strategy.action": "新空间的 Provider",
			"strategy.title": "新空间的 Provider",
			"strategy.description": "任务 Agent 需要新建记忆空间时，如何选择 Provider；已有空间仍按名称与说明路由。",
			"strategy.loading": "正在读取 Provider 目录…",
			"strategy.modeTitle": "Provider 选择方式",
			"strategy.modeHint": "只影响任务 Agent 新建的记忆空间；手动创建时始终由你指定。",
			"strategy.manualHint": "固定使用一个 Provider，Agent 无法改选",
			"strategy.automaticHint": "先执行硬规则，再由任务 Agent 选择合格 Provider",
			"strategy.manualTitle": "固定 Provider",
			"strategy.manualDescription": "当现有记忆空间都不适合时，新记忆空间固定创建在这个 Provider 中。",
			"strategy.automaticTitle": "智能选择规则",
			"strategy.automaticDescription": "数据边界与能力要求由主机强制执行，Prompt 只影响合格候选之间的判断。",
			"strategy.save": "保存",
			"strategy.saving": "保存中…",
			"overview.providerOpenVikingHint": "连接已有 OpenViking 服务，由记忆空间工作流统一调度",
			"overview.providerSummary.mnemon-native": "官方原生、本地优先，保留完整图谱与软删除能力",
			"overview.providerSummary.openviking": "文件系统形态的共享记忆，支持经验证的精确写入与语义召回",
			"overview.providerSummary.honcho": "跨会话用户建模、Peer 档案、辩证推理与持久结论",
			"overview.providerSummary.mem0": "自动事实提取、语义召回、重排与去重",
			"overview.providerSummary.hindsight": "知识图谱记忆，具备实体解析、多策略召回与反思",
			"overview.providerSummary.holographic": "本地结构化事实记忆，支持可信度、实体解析与组合召回",
			"overview.providerSummary.retaindb": "云端混合向量/BM25 召回、用户画像与类型化事实",
			"overview.providerSummary.byterover": "通过 brv CLI 使用的本地优先分层知识树",
			"overview.providerSummary.supermemory": "语义记忆、持久画像、会话摄取与多容器召回",
			"overview.providerEndpoint": "服务地址",
			"overview.providerEndpointPlaceholder": "例如：http://127.0.0.1:1933",
			"overview.providerTargetUri": "记忆范围 URI",
			"overview.providerTargetPlaceholder": "例如：viking://user/memories",
			"overview.providerAdvanced": "身份与凭据（可选）",
			"overview.providerApiKey": "API Key",
			"overview.providerApiKeyOptional": "未启用鉴权时可留空",
			"overview.providerApiKeyKeep": "已保存；留空表示保持不变",
			"overview.providerAccount": "Account",
			"overview.providerDiscoveryUser": "User Key 所属用户（跳过 Admin）",
			"overview.providerUser": "User",
			"overview.providerActorPeer": "Actor Peer",
			"overview.providerField.workspace": "工作区",
			"overview.providerField.userId": "用户 ID",
			"overview.providerField.agentId": "Agent ID",
			"overview.providerField.mode": "接入模式",
			"overview.providerField.rerank": "重排检索结果",
			"overview.providerField.bankId": "记忆库",
			"overview.providerField.budget": "召回预算",
			"overview.providerField.dataPath": "事实存储路径",
			"overview.providerField.defaultDirectory": "默认知识目录",
			"overview.providerField.defaultTrust": "默认可信度",
			"overview.providerField.minTrust": "最低召回可信度",
			"overview.providerField.project": "项目标识",
			"overview.providerField.cliPath": "brv 可执行文件",
			"overview.providerField.workingDirectory": "知识目录",
			"overview.providerField.containerTag": "容器标签",
			"overview.providerField.searchMode": "检索模式",
			"overview.providerOption.platform": "Mem0 Platform",
			"overview.providerOption.self-hosted": "自托管服务",
			"overview.providerOption.low": "低",
			"overview.providerOption.mid": "中",
			"overview.providerOption.high": "高",
			"overview.providerOption.hybrid": "混合检索",
			"overview.providerOption.memories": "仅记忆",
			"overview.providerOption.documents": "仅文档",
			"overview.providerKindLocal": "本地引擎",
			"overview.providerKindRemote": "远程服务",
			"overview.providerSecretClear": "清除已保存的凭据",
			"overview.providerWriteExact": "精确写入",
			"overview.providerWriteAsync": "异步语义提炼",
			"overview.providerGraphReady": "支持关系图谱",
			"overview.providerSearchReady": "支持统一检索",
			"overview.providerRemote": "三方远程记忆",
			"overview.providerLocal": "三方本地记忆",
			"overview.creating": "创建中…",
			"overview.createAction": "创建",
			"overview.editBody": "编辑",
			"overview.editBodyAria": "编辑{name}",
			"overview.editName": "名称",
			"overview.editDescription": "路由说明",
			"overview.saveBody": "保存",
			"overview.savingBody": "保存中…",
			"overview.deleteBody": "删除",
			"overview.deleteBodyAria": "删除{name}",
			"overview.deleteTitle": "删除“{name}”？",
			"overview.deleteWarning": "该操作会永久删除这个记忆空间及其中的全部记忆与关系，无法撤销。",
			"overview.lastStoreDeleteHint": "Mnemon 需要保留至少一个原生 Store；可将最后一个记忆空间设为未激活，但不能删除。",
			"overview.deleteAction": "确认删除",
			"overview.disconnectBody": "断开",
			"overview.disconnectBodyAria": "断开{name}",
			"overview.disconnectTitle": "断开“{name}”？",
			"overview.disconnectWarning": "这里只会从 DSH 记忆空间目录移除 {provider} 连接；底层引擎中的记忆不会被删除。",
			"overview.disconnectAction": "确认断开",
			"overview.deletingBody": "删除中…",
			"overview.snapshot": "多记忆空间实时快照",
			"overview.snapshotSources": "快照可观察范围",
			"overview.snapshotSourcesHint": "真实关系图、无边内容投影和查询型记忆空间分别呈现，不伪造 Provider 不具备的关系。",
			"overview.noVisualTitle": "当前记忆空间只支持按需查询",
			"overview.noVisualText": "这些 Provider 不提供可枚举内容或图谱；请前往“检索”输入明确问题。",
			"overview.waitingSnapshot": "等待首个快照",
			"overview.updatedAt": "更新于 {time}",
			"overview.edgeScope": "空间归属",
			"overview.edgeTemporal": "时间",
			"overview.edgeSemantic": "语义",
			"overview.edgeCausal": "因果",
			"overview.edgeEntity": "实体关联",
			"overview.graphComposition": "{spaces} 个空间 · {memories} 条记忆 · {entities} 个实体",
			"overview.graphCount": "展示 {visible} / {total} 个元素",
			"overview.graphEdges": "{count} 条图谱连接",
			"overview.inspector": "记忆详情",
			"overview.inspectorSpace": "记忆空间详情",
			"overview.inspectorEntity": "实体详情",
			"overview.selectNode": "选择一个图谱元素",
			"overview.selectNodeText": "查看记忆空间、实体或记忆的精确上下文。",
			"overview.closeInspector": "关闭节点详情",
			"overview.memoryId": "记忆 ID",
			"overview.spaceId": "记忆空间 ID",
			"overview.containedMemories": "包含记忆",
			"overview.entityMentions": "索引次数",
			"overview.exploreNode": "围绕它检索",
			"overview.previewAria": "查看全文",
			"overview.previewTitle": "内容全文",
			"overview.loading": "正在同步多记忆空间实时快照…",
			"graph.layoutAria": "图谱布局",
			"graph.layoutNatural": "自然布局",
			"graph.layoutUniform": "均匀布局",
			"graph.layoutCustom": "自定义布局",
			"graph.layoutStatus": "布局状态：{layout}",
			"graph.draggable": "{layout} · 可拖拽",
			"graph.naturalAction": "自然铺开",
			"graph.uniformAction": "均匀重置",
			"graph.aria": "Mnemon 实时记忆图谱，{nodes} 个元素，{edges} 条连接",
			"graph.kindSpace": "记忆空间",
			"graph.kindEntity": "实体",
			"search.title": "检索记忆",
			"search.description": "在已激活的记忆空间中检索：直接检索返回原文，Agent 查询给出带引用的回答。",
			"search.maxResults": "最多 {count} 条",
			"search.placeholder": "为什么选用 SQLite？这个项目有哪些发布约定？",
			"search.queryAria": "记忆查询",
			"search.categoryAria": "记忆分类",
			"search.strategy": "策略",
			"search.modeAria": "检索模式",
			"search.modeSmart": "智能召回",
			"search.modeKeyword": "关键词检索",
			"search.modeBasic": "基础匹配",
			"search.searching": "检索中…",
			"search.action": "直接检索",
			"search.agentAction": "Agent 查询",
			"search.agentSearching": "Agent 分析中…",
			"search.agentAnswer": "Agent 查询结果",
			"search.agentAnswerHint": "基于下方召回证据",
			"search.startTitle": "从一个明确问题开始",
			"search.startText": "聚焦实体、决策或时间线，比批量加载整库更可靠。",
			"search.emptyTitle": "没有命中",
			"search.emptyText": "换一个更具体的实体、决策或时间线关键词试试。",
			"search.results": "原始召回内容",
			"search.related": "关联记忆",
			"search.closeRelated": "关闭关联记忆",
			"search.traversing": "正在遍历图谱…",
			"search.noRelated": "没有找到两跳内的关联节点。",
			"search.sourcesTitle": "本次检索范围",
			"entities.title": "实体查阅",
			"entities.description": "查看实体在事实、决策与上下文之间的关联。",
			"entities.sourcesTitle": "实体能力范围",
			"entities.unsupportedTitle": "没有支持实体索引的记忆空间",
			"entities.unsupportedText": "当前激活 Provider 仍可通过“检索”召回，但不会在这里伪装成实体图谱。",
			"entities.count": "{count} 个活跃实体",
			"entities.nameAria": "实体名称",
			"entities.placeholder": "输入任意实体…",
			"entities.action": "查阅",
			"entities.top": "高频实体",
			"entities.frequency": "按出现频率",
			"entities.filterHint": "输入时即时过滤左侧列表（按 Esc 清空）",
			"entities.emptyRail": "写入带实体的记忆后，这里会形成入口。",
			"entities.filterEmpty": "本地无匹配。点“查阅”向宿主发起查询。",
			"entities.loading": "正在沿实体关系召回…",
			"entities.selectTitle": "选择或输入一个实体",
			"entities.selectText": "实体视图会聚合与它相关的记忆，而不是只做字面匹配。",
			"entities.emptyTitle": "没有关联记忆",
			"entities.emptyText": "尝试更完整的名称或另一个实体别名。",
			"remember.title": "存入记忆",
			"remember.description": "任务 Agent 会判断是否值得保存，去重、提炼后写入合适的记忆空间，不占用当前对话。",
			"remember.readOnlyTitle": "当前为只读模式",
			"remember.readOnlyText": "当前部署禁止记忆写入；如需调整，请修改 DSH 的 Mnemon 配置并保存。",
			"remember.candidate": "候选内容",
			"remember.placeholder": "输入希望长期保留的背景、偏好、决策或结论。",
			"remember.sessionHint": "当前视图没有可用的模型路由，无法创建独立任务 Agent。",
			"remember.taskAgentHint": "当前 Host 暂时无法创建独立任务 Agent，请刷新状态后重试。",
			"remember.processing": "任务 Agent 处理中…",
			"remember.action": "交给任务 Agent",
			"remember.advanced": "高级选项",
			"remember.advancedHint": "指定目标记忆空间、分类与重要性",
			"remember.expand": "展开",
			"remember.target": "目标记忆空间",
			"remember.asyncProviderHint": "该记忆空间会等待远程提炼任务完成后再返回真实写入回执。",
			"remember.entities": "实体（逗号分隔）",
			"remember.tags": "标签（逗号分隔）",
			"remember.advancedText": "这些约束同样经过任务 Agent 的去重与回执。",
			"remember.saving": "任务 Agent 处理中…",
			"remember.advancedAction": "按约束交给任务 Agent",
			"content.title": "记忆内容",
			"content.description": "浏览各记忆空间保存的内容。",
			"content.sourcesTitle": "Provider 内容模型",
			"content.count": "{count} 条记忆",
			"content.filterAria": "筛选记忆内容",
			"content.filterPlaceholder": "按内容或精确 ID 筛选…",
			"content.categoryAria": "记忆分类",
			"content.apply": "应用筛选",
			"content.notice": "查询型 Provider 需要输入关键词后才显示内容。",
			"content.queryRequiredTitle": "查询型记忆空间等待问题",
			"content.queryRequiredText": "输入一个明确查询即可读取 ByteRover 等不提供全量列表的 Provider。",
			"content.showing": "当前显示 {visible} / {total}",
			"content.showMore": "再显示 {count} 条",
			"content.emptyTitle": "没有符合条件的记忆",
			"content.emptyText": "清空筛选，或先存入第一条记忆。",
			"nav.spaces": "记忆空间",
			"overview.editSpace": "编辑",
			"overview.editSpaceAria": "编辑{name}",
			"overview.saveSpace": "保存",
			"overview.savingSpace": "保存中…",
			"overview.deleteSpace": "删除",
			"overview.deleteSpaceAria": "删除{name}",
			"overview.disconnectSpace": "断开",
			"overview.disconnectSpaceAria": "断开{name}",
			"overview.deletingSpace": "删除中…",
			"common.score": "相关度 {value}",
			"overview.providerEnableHint": "未启用的 Provider 可在“插件 → 可组合记忆”的“记忆空间”页面中启用。",
			"search.citations": "引用"
		};
		var en$1 = {
			"term.space": "Memory Space",
			"term.spaces": "Memory Spaces",
			"category.decision": "Decision",
			"category.preference": "Preference",
			"category.fact": "Fact",
			"category.insight": "Insight",
			"category.context": "Context",
			"category.general": "General",
			"nav.memory.aria": "Memory Space pages",
			"nav.overview": "Overview",
			"nav.bodies": "Memory Spaces",
			"nav.search": "Recall",
			"nav.entities": "Entities",
			"nav.rememberAction": "Save to memory",
			"nav.content": "Content",
			"overview.title": "Memory Spaces",
			"overview.description": "Long-term memory held by Mnemon Native or third-party Providers; active spaces take part in recall.",
			"overview.pageDescription": "Create and activate Memory Spaces, then inspect storage health and live relation snapshots across providers.",
			"overview.interval": "Full sync on entry · Click a card to sync on demand",
			"overview.fullSyncPending": "Waiting for the first full sync",
			"overview.fullSyncJustNow": "Last full sync: just now",
			"overview.fullSyncSeconds": "Last full sync: {count}s ago",
			"overview.fullSyncMinutes": "Last full sync: {count}m ago",
			"overview.fullSyncHours": "Last full sync: {count}h ago",
			"overview.fullSyncDays": "Last full sync: {count}d ago",
			"overview.directory": "Memory Space Directory",
			"overview.directory.description": "Each card is one Memory Space; click it to check the connection, and use its switch to include it in recall.",
			"overview.directory.unsynced": "Directory not synchronized",
			"overview.directory.unsyncedBadge": "Directory pending",
			"overview.directoryLoading": "Loading the Memory Space directory",
			"overview.healthLoading": "Checking Memory Space health",
			"overview.storageHealthy": "Storage healthy",
			"overview.storageUnhealthy": "Storage unavailable",
			"overview.storageChecking": "Checking",
			"overview.reconnecting": "Reconnecting",
			"overview.reconnectHint": "Click the card to reconnect and synchronize this Memory Space",
			"overview.reconnectAria": "Reconnect {name}",
			"overview.snapshotLoading": "Loading the multi-space live snapshot",
			"overview.metadataAction": "Tidy names and descriptions",
			"overview.metadataTitle": "Maintain Memory Space metadata with AI",
			"overview.metadataDescription": "Select one or more active Memory Spaces. The system reads a small sample through each Provider’s fastest native path, then gives each space to an independent task Agent for its title and description.",
			"overview.metadataUnavailable": "Temporarily unavailable: no active Agent matches the current memory scope",
			"overview.metadataLoading": "Loading maintainable Memory Spaces…",
			"overview.metadataEmpty": "There are no active Memory Spaces whose metadata can be maintained by AI.",
			"overview.metadataSelected": "{count} Memory Spaces selected",
			"overview.metadataSelectAll": "Select all",
			"overview.metadataClear": "Clear",
			"overview.metadataSafety": "Only local titles and descriptions are updated. Memory content is never changed, moved, or deleted. Disabling a Provider removes this local metadata with its projection.",
			"overview.metadataGenerate": "Generate with AI ({count})",
			"overview.metadataGenerating": "AI is generating…",
			"overview.metadataRunningCount": "{count} running",
			"overview.metadataTaskRunning": "Generating…",
			"overview.metadataTaskSuccess": "Updated",
			"overview.metadataTaskError": "Failed: {error}",
			"overview.metadataTaskUnknown": "Unknown error",
			"overview.metadataCompleted": "Updated metadata for {count} Memory Spaces.",
			"overview.mnemonDefault": "Mnemon default",
			"overview.toggleAria": "{name} read toggle",
			"overview.toggling": "Switching",
			"overview.noDescription": "No routing description yet.",
			"overview.unsyncedTitle": "Memory Space directory is not synchronized",
			"overview.unsyncedShort": "The Web client and DSH Host are using different contracts. Restart the Host to register existing Stores.",
			"overview.unsyncedLong": "The Host is still using the previous plugin contract. Restart DSH to rediscover existing Stores; no .db file will be deleted.",
			"overview.emptyTitle": "No Memory Spaces yet",
			"overview.emptyShort": "Create the first space and distill durable context into it.",
			"overview.emptyLong": "Create a Mnemon Memory Space, or enable a third-party provider on the dsh-mnemon page under Plugins to synchronize its existing namespaces.",
			"overview.noActiveTitle": "No active Memory Spaces",
			"overview.noActiveText": "Enable read access for at least one space to aggregate its live graph here.",
			"overview.noContentTitle": "Active spaces have no content yet",
			"overview.noContentText": "Save memories to see their nodes and relations here.",
			"overview.createTitle": "Create Memory Space",
			"overview.createDialogHint": "Define this Memory Space and choose its provider here. It reuses services, credentials, and global data locations configured on the dsh-mnemon page under Plugins.",
			"overview.createIdentityTitle": "Memory Space details",
			"overview.createIdentityHint": "The name identifies the space; the description guides when the agent writes and recalls it.",
			"overview.createPlacementTitle": "Memory Space provider",
			"overview.createPlacementHint": "This is an explicit manual creation; choose one enabled Provider. What a task Agent chooses for new spaces is set in Provider for new spaces.",
			"overview.createName": "New Memory Space name",
			"overview.createNamePlaceholder": "Name",
			"overview.createDescription": "New Memory Space description",
			"overview.createDescriptionPlaceholder": "Describe what belongs here and when it should be recalled",
			"overview.placementMode": "Engine selection",
			"overview.placementManual": "Choose manually",
			"overview.placementManualHint": "Choose one enabled provider directly",
			"overview.placementAutomatic": "Smart selection",
			"overview.placementAutomaticHint": "Apply data-boundary and capability rules first, then let the agent choose among eligible providers",
			"overview.placementUnavailable": "Requires a connected conversation aligned with this workspace",
			"overview.recommended": "Recommended",
			"overview.placementPolicy": "Selection policy",
			"overview.placementPolicyHint": "The host enforces rules. The prompt only guides judgment among eligible candidates.",
			"overview.agentDecision": "Agent decision",
			"overview.placementPrompt": "Strategy prompt (optional)",
			"overview.placementPromptPlaceholder": "For example: This is collaborative knowledge. Prefer local storage when exact writes are required; otherwise prefer sharing.",
			"overview.dataBoundary": "Data boundary",
			"overview.dataBoundaryRemote": "Remote services allowed",
			"overview.dataBoundaryLocal": "Local only",
			"overview.preference": "Soft preference",
			"overview.preferenceBalanced": "Balanced",
			"overview.preferenceLocal": "Local first",
			"overview.preferenceShared": "Shared first",
			"overview.requiredCapabilities": "Required capabilities (select any)",
			"overview.capability.graph": "Relation graph",
			"overview.capability.exact-write": "Exact writes",
			"overview.capability.forget": "Safe forget",
			"overview.candidateNativeReady": "Official native · follows the active memory scope",
			"overview.providerServiceRequired": "Off",
			"overview.nativeCliRequired": "Needs the Mnemon CLI on this machine; other providers work without it",
			"overview.workspaceBinding.automatic": "Follows the active memory scope",
			"overview.workspaceBinding.optional-override": "Follows the active scope; global location can be customized",
			"overview.workspaceBinding.provider-global": "Always uses the global scope",
			"overview.candidateOpenViking": "Include the remote candidate and provide its connection",
			"overview.candidateLocal": "Local provider · follows the active memory scope",
			"overview.candidateRemote": "Remote provider · uses the global service configuration",
			"overview.placementByLlm": "Agent selected",
			"overview.placementByRules": "Rule selected",
			"overview.placementConfidence": "Confidence: {confidence}",
			"overview.confidence.high": "High",
			"overview.confidence.medium": "Medium",
			"overview.confidence.low": "Low",
			"overview.providerLabel": "Memory engine",
			"overview.nativeOfficial": "Official native",
			"overview.providerNativeHint": "Official native, local-first storage with the full graph and soft-delete semantics",
			"strategy.action": "Provider for new spaces",
			"strategy.title": "Provider for new spaces",
			"strategy.description": "How a task Agent picks a Provider when it creates a Memory Space; existing spaces are still chosen by name and description.",
			"strategy.loading": "Loading Provider directory…",
			"strategy.modeTitle": "Provider selection",
			"strategy.modeHint": "Applies only to spaces a task Agent creates; you always choose when you create one yourself.",
			"strategy.manualHint": "Fix one Provider; the Agent cannot override it",
			"strategy.automaticHint": "Apply hard rules first, then let the task Agent choose an eligible Provider",
			"strategy.manualTitle": "Fixed Provider",
			"strategy.manualDescription": "When no existing space fits, create the new space on this Provider.",
			"strategy.automaticTitle": "Smart selection rules",
			"strategy.automaticDescription": "The host enforces data and capability rules. The prompt only guides judgment among eligible candidates.",
			"strategy.save": "Save",
			"strategy.saving": "Saving…",
			"overview.providerOpenVikingHint": "Connect an existing OpenViking service under the same Memory Space workflow",
			"overview.providerSummary.mnemon-native": "Official native, local-first storage with the full graph and soft-delete semantics",
			"overview.providerSummary.openviking": "Filesystem-shaped shared memory with verified exact writes and semantic retrieval",
			"overview.providerSummary.honcho": "Cross-session user modelling, peer profiles, dialectic reasoning, and persistent conclusions",
			"overview.providerSummary.mem0": "Automatic fact extraction, semantic retrieval, reranking, and deduplication",
			"overview.providerSummary.hindsight": "Knowledge-graph memory with entity resolution, multi-strategy recall, and reflection",
			"overview.providerSummary.holographic": "Local structured fact memory with trust scoring, entity resolution, and compositional retrieval",
			"overview.providerSummary.retaindb": "Cloud hybrid vector/BM25 retrieval, user profiles, and typed durable facts",
			"overview.providerSummary.byterover": "Local-first hierarchical knowledge tree accessed through the brv CLI",
			"overview.providerSummary.supermemory": "Semantic memory, persistent profiles, conversation ingest, and multi-container recall",
			"overview.providerEndpoint": "Service endpoint",
			"overview.providerEndpointPlaceholder": "For example: http://127.0.0.1:1933",
			"overview.providerTargetUri": "Memory scope URI",
			"overview.providerTargetPlaceholder": "For example: viking://user/memories",
			"overview.providerAdvanced": "Identity and credentials (optional)",
			"overview.providerApiKey": "API Key",
			"overview.providerApiKeyOptional": "Leave blank when authentication is disabled",
			"overview.providerApiKeyKeep": "Saved; leave blank to keep unchanged",
			"overview.providerAccount": "Account",
			"overview.providerDiscoveryUser": "User key owner (skip admin)",
			"overview.providerUser": "User",
			"overview.providerActorPeer": "Actor Peer",
			"overview.providerField.workspace": "Workspace",
			"overview.providerField.userId": "User ID",
			"overview.providerField.agentId": "Agent ID",
			"overview.providerField.mode": "Mode",
			"overview.providerField.rerank": "Rerank search results",
			"overview.providerField.bankId": "Memory bank",
			"overview.providerField.budget": "Recall budget",
			"overview.providerField.dataPath": "Fact store path",
			"overview.providerField.defaultDirectory": "Default knowledge directory",
			"overview.providerField.defaultTrust": "Default trust",
			"overview.providerField.minTrust": "Minimum recall trust",
			"overview.providerField.project": "Project",
			"overview.providerField.cliPath": "brv executable",
			"overview.providerField.workingDirectory": "Knowledge directory",
			"overview.providerField.containerTag": "Container tag",
			"overview.providerField.searchMode": "Search mode",
			"overview.providerOption.platform": "Mem0 Platform",
			"overview.providerOption.self-hosted": "Self-hosted server",
			"overview.providerOption.low": "Low",
			"overview.providerOption.mid": "Medium",
			"overview.providerOption.high": "High",
			"overview.providerOption.hybrid": "Hybrid",
			"overview.providerOption.memories": "Memories",
			"overview.providerOption.documents": "Documents",
			"overview.providerKindLocal": "Local engine",
			"overview.providerKindRemote": "Remote service",
			"overview.providerSecretClear": "Clear the saved credential",
			"overview.providerWriteExact": "Exact writes",
			"overview.providerWriteAsync": "Asynchronous semantic extraction",
			"overview.providerGraphReady": "Relation graph available",
			"overview.providerSearchReady": "Unified search available",
			"overview.providerRemote": "Third-party remote memory",
			"overview.providerLocal": "Third-party local memory",
			"overview.creating": "Creating…",
			"overview.createAction": "Create",
			"overview.editBody": "Edit",
			"overview.editBodyAria": "Edit {name}",
			"overview.editName": "Name",
			"overview.editDescription": "Routing description",
			"overview.saveBody": "Save",
			"overview.savingBody": "Saving…",
			"overview.deleteBody": "Delete",
			"overview.deleteBodyAria": "Delete {name}",
			"overview.deleteTitle": "Delete “{name}”?",
			"overview.deleteWarning": "This permanently deletes the Memory Space and every memory and relation it contains. This cannot be undone.",
			"overview.lastStoreDeleteHint": "Mnemon must retain at least one native Store. The last Memory Space may be inactive, but it cannot be deleted.",
			"overview.deleteAction": "Delete permanently",
			"overview.disconnectBody": "Disconnect",
			"overview.disconnectBodyAria": "Disconnect {name}",
			"overview.disconnectTitle": "Disconnect “{name}”?",
			"overview.disconnectWarning": "This only removes the {provider} connection from the DSH Memory Space directory. Memories in the underlying engine remain untouched.",
			"overview.disconnectAction": "Disconnect",
			"overview.deletingBody": "Deleting…",
			"overview.snapshot": "Live multi-space snapshot",
			"overview.snapshotSources": "Snapshot observability",
			"overview.snapshotSourcesHint": "True relation graphs, edge-free content projections, and query-only spaces remain distinct; missing provider relations are never invented.",
			"overview.noVisualTitle": "Active spaces are query-only",
			"overview.noVisualText": "These providers expose neither enumerable content nor a graph. Open Recall and ask a focused question.",
			"overview.waitingSnapshot": "Waiting for the first snapshot",
			"overview.updatedAt": "Updated at {time}",
			"overview.edgeScope": "Space scope",
			"overview.edgeTemporal": "Temporal",
			"overview.edgeSemantic": "Semantic",
			"overview.edgeCausal": "Causal",
			"overview.edgeEntity": "Entity relation",
			"overview.graphComposition": "{spaces} spaces · {memories} memories · {entities} entities",
			"overview.graphCount": "Showing {visible} / {total} elements",
			"overview.graphEdges": "{count} graph edges",
			"overview.inspector": "Memory details",
			"overview.inspectorSpace": "Memory Space details",
			"overview.inspectorEntity": "Entity details",
			"overview.selectNode": "Select a graph element",
			"overview.selectNodeText": "Inspect the exact context for a Memory Space, entity, or memory.",
			"overview.closeInspector": "Close node details",
			"overview.memoryId": "Memory ID",
			"overview.spaceId": "Memory Space ID",
			"overview.containedMemories": "Contained memories",
			"overview.entityMentions": "Indexed mentions",
			"overview.exploreNode": "Recall around this",
			"overview.previewAria": "View full content",
			"overview.previewTitle": "Full content",
			"overview.loading": "Synchronizing the multi-space live snapshot…",
			"graph.layoutAria": "Graph layout",
			"graph.layoutNatural": "Natural layout",
			"graph.layoutUniform": "Uniform layout",
			"graph.layoutCustom": "Custom layout",
			"graph.layoutStatus": "Layout: {layout}",
			"graph.draggable": "{layout} · draggable",
			"graph.naturalAction": "Natural spread",
			"graph.uniformAction": "Uniform reset",
			"graph.aria": "Mnemon live memory graph with {nodes} elements and {edges} edges",
			"graph.kindSpace": "Memory Space",
			"graph.kindEntity": "Entity",
			"search.title": "Recall Memory",
			"search.description": "Search the active Memory Spaces: direct search returns the stored text, an Agent query answers with citations.",
			"search.maxResults": "Up to {count} results",
			"search.placeholder": "Why did we choose SQLite? What release conventions apply?",
			"search.queryAria": "Memory query",
			"search.categoryAria": "Memory category",
			"search.strategy": "Strategy",
			"search.modeAria": "Recall mode",
			"search.modeSmart": "Smart recall",
			"search.modeKeyword": "Keyword search",
			"search.modeBasic": "Basic match",
			"search.searching": "Recalling…",
			"search.action": "Direct search",
			"search.agentAction": "Ask Agent",
			"search.agentSearching": "Agent analyzing…",
			"search.agentAnswer": "Agent answer",
			"search.agentAnswerHint": "Grounded in the recalled evidence below",
			"search.startTitle": "Start with a focused question",
			"search.startText": "A focused entity, decision, or timeline is more reliable than loading the whole database.",
			"search.emptyTitle": "No matches",
			"search.emptyText": "Try a more specific entity, decision, or timeline keyword.",
			"search.results": "Raw recalled evidence",
			"search.related": "Related memories",
			"search.closeRelated": "Close related memories",
			"search.traversing": "Traversing the graph…",
			"search.noRelated": "No related nodes found within two hops.",
			"search.sourcesTitle": "Search coverage",
			"entities.title": "Entity Explorer",
			"entities.description": "See how entities connect facts, decisions and context.",
			"entities.sourcesTitle": "Entity capability coverage",
			"entities.unsupportedTitle": "No active space exposes an entity index",
			"entities.unsupportedText": "The active providers remain searchable through Recall, but are not presented here as a fabricated entity graph.",
			"entities.count": "{count} active entities",
			"entities.nameAria": "Entity name",
			"entities.placeholder": "Enter any entity…",
			"entities.action": "Explore",
			"entities.top": "Top entities",
			"entities.frequency": "By frequency",
			"entities.filterHint": "Type to filter the rail locally (Esc to clear).",
			"entities.emptyRail": "Entities appear here after memories with entity metadata are stored.",
			"entities.filterEmpty": "No local match. Press Explore to query the host.",
			"entities.loading": "Recalling entity relations…",
			"entities.selectTitle": "Select or enter an entity",
			"entities.selectText": "The entity view aggregates related memories instead of relying on literal matching.",
			"entities.emptyTitle": "No related memories",
			"entities.emptyText": "Try the full name or another entity alias.",
			"remember.title": "Save to memory",
			"remember.description": "A task Agent decides whether this is worth keeping, removes duplicates, distills it and writes it to the right Memory Space, outside this conversation.",
			"remember.readOnlyTitle": "Read-only mode",
			"remember.readOnlyText": "This deployment disables memory writes. Change and save the DSH Mnemon configuration to enable them.",
			"remember.candidate": "Candidate",
			"remember.placeholder": "Background, preferences, decisions or conclusions worth keeping.",
			"remember.sessionHint": "No usable model route is available for an independent task Agent.",
			"remember.taskAgentHint": "The Host cannot currently create an isolated task Agent. Refresh status and try again.",
			"remember.processing": "Task Agent working…",
			"remember.action": "Send to task Agent",
			"remember.advanced": "Advanced options",
			"remember.advancedHint": "Choose the target space, category and importance",
			"remember.expand": "Expand",
			"remember.target": "Target Memory Space",
			"remember.asyncProviderHint": "This Memory Space waits for remote extraction to settle before returning a truthful write receipt.",
			"remember.entities": "Entities (comma-separated)",
			"remember.tags": "Tags (comma-separated)",
			"remember.advancedText": "Constraints still go through the task Agent’s duplicate check and receipt.",
			"remember.saving": "Task Agent working…",
			"remember.advancedAction": "Send with constraints",
			"content.title": "Memory Content",
			"content.description": "Browse what each Memory Space holds.",
			"content.sourcesTitle": "Provider content models",
			"content.count": "{count} memories",
			"content.filterAria": "Filter memory content",
			"content.filterPlaceholder": "Filter by content or exact ID…",
			"content.categoryAria": "Memory category",
			"content.apply": "Apply filters",
			"content.notice": "Query-only Providers show content once you enter a query.",
			"content.queryRequiredTitle": "Query-only spaces are waiting",
			"content.queryRequiredText": "Enter a focused query to inspect providers such as ByteRover that do not expose a complete list.",
			"content.showing": "Showing {visible} / {total}",
			"content.showMore": "Show {count} more",
			"content.emptyTitle": "No matching memories",
			"content.emptyText": "Clear the filters or save a first memory.",
			"nav.spaces": "Memory Spaces",
			"overview.editSpace": "Edit",
			"overview.editSpaceAria": "Edit {name}",
			"overview.saveSpace": "Save",
			"overview.savingSpace": "Saving…",
			"overview.deleteSpace": "Delete",
			"overview.deleteSpaceAria": "Delete {name}",
			"overview.disconnectSpace": "Disconnect",
			"overview.disconnectSpaceAria": "Disconnect {name}",
			"overview.deletingSpace": "Deleting…",
			"common.score": "Score {value}",
			"overview.providerEnableHint": "Turn on more Providers on Memory Spaces’ page under Plugins → dsh-mnemon.",
			"search.citations": "Cites"
		};
		//#endregion
		//#region src/client/locales.ts
		/** Mnemon workspace copy, synchronized with DSH's global locale service. */
		const zh = {
			...zh$3,
			...zh$2,
			...zh$1,
			"tab.label": "记忆系统",
			"nav.aria": "Mnemon 页面",
			"nav.status": "状态",
			"common.refresh": "刷新",
			"common.openConfiguration": "前往配置",
			"common.loading": "载入中…",
			"common.cancel": "取消",
			"common.close": "关闭",
			"common.copyId": "复制 ID",
			"common.readOnly": "只读模式",
			"common.activationOnly": "仅可切换激活状态",
			"common.active": "已激活",
			"common.inactive": "未激活",
			"common.category": "分类",
			"common.importanceLabel": "重要性",
			"common.importance": "重要性 {value}",
			"common.hops": "{count} 跳",
			"common.allCategories": "全部分类",
			"common.memories": "{count} 条记忆",
			"common.edges": "{count} 条连接",
			"common.showing": "当前显示 {visible} / {total}",
			"common.showMore": "再显示 {count} 条",
			"header.backToConversation": "返回会话",
			"header.configure": "配置",
			"header.compositionHint": "点击前往配置调整组合。",
			"header.checking": "检查中",
			"header.connected": "已连接",
			"header.unavailable": "不可用",
			"header.notReady": "Mnemon 尚未就绪",
			"workspace.viewing": "查看工作区",
			"workspace.selectorAria": "选择要查看的记忆工作区",
			"workspace.storageMode": "存储范围",
			"workspace.storageModeAria": "存储范围：{mode}",
			"workspace.mismatchTitle": "查看目录与当前会话未对齐",
			"workspace.mismatchShort": "非对话工作区",
			"workspace.selectedRoot": "查看：{root}",
			"workspace.effectiveRoot": "生效：{root}",
			"workspace.align": "对齐对话",
			"workspace.remoteReadOnly": "远程访问为只读：在 profile 的 mnemon 配置中设置 remoteAccess: trusted-host 并重启 DSH 后，可在此管理记忆。",
			"sourcePage.instance": "Source 实例",
			"sourcePage.instanceAria": "选择 Source 实例",
			"sourcePage.summaryAria": "Source 状态与权限摘要",
			"sourcePage.package": "来源包",
			"sourcePage.availability": "可用性",
			"sourcePage.availability.ready": "可用",
			"sourcePage.availability.degraded": "降级",
			"sourcePage.availability.unavailable": "不可用",
			"sourcePage.role": "语义角色",
			"sourcePage.revision": "当前修订",
			"sourcePage.permissions": "受权能力",
			"sourcePage.diagnostics": "诊断",
			"sourcePage.configuration": "声明式配置",
			"sourcePage.configurationDescription": "字段来自 Host 的脱敏 management descriptor；提交会按当前实例与修订重新授权。",
			"sourcePage.configLoading": "载入配置…",
			"sourcePage.configSave": "保存配置",
			"sourcePage.configSaving": "保存中…",
			"sourcePage.configSaved": "配置已提交，正在刷新 Source 状态。",
			"sourcePage.secretPlaceholder": "留空以保留现有密钥",
			"sourcePage.unavailable": "Source 当前不可用",
			"sourcePage.unavailableDescription": "当前 scope 中没有可调用的实例。Host 与 Headless 记忆运行不受此页面影响。",
			"config.providerSecretShow": "显示凭证",
			"config.providerSecretHide": "隐藏凭证",
			"config.providerSecretStoredValue": "已保存凭证",
			"card.confirmText": "软删除这条记忆？",
			"card.processing": "处理中…",
			"card.confirmForget": "确认忘记",
			"card.related": "查看关联",
			"card.clone": "基于此新建",
			"card.forget": "忘记",
			"turnTail.label": "本回合记忆",
			"turnTail.recall": "召回 {count}",
			"turnTail.write": "写入 {count}",
			"turnTail.documents": "档案检索 {count}",
			"turnTail.inspect": "检查 {count}",
			"turnTail.failed": "失败 {count}",
			"turnTail.toolList": "本回合记忆工具",
			"turnTail.more": "另 {count} 条",
			"turnTail.openTool": "打开 {tool} 对应的记忆页面",
			"turnTail.tool.recall": "记忆空间召回",
			"turnTail.tool.related": "关联查询",
			"turnTail.tool.documentSearch": "项目档案检索",
			"turnTail.tool.documentManage": "项目档案更新",
			"turnTail.tool.documentCreate": "新建项目档案",
			"turnTail.tool.runtime": "运行时记忆更新",
			"turnTail.tool.remember": "存入记忆空间",
			"turnTail.tool.link": "建立关联",
			"turnTail.tool.forget": "删除记忆",
			"turnTail.tool.status": "记忆状态",
			"turnTail.tool.spaces": "记忆空间目录",
			"turnTail.tool.spaceCreate": "新建记忆空间",
			"turnTail.tool.spaceUpdate": "更新记忆空间",
			"turnTail.tool.spaceMerge": "合并记忆空间",
			"turnTail.tool.viewRoute": "读取记忆",
			"turnTail.tool.viewAction": "更新记忆",
			"receipt.written": "已存入",
			"receipt.updated": "已更新",
			"receipt.pending": "已提交，等待 Provider 确认",
			"receipt.skipped": "已跳过",
			"receipt.partial": "部分完成",
			"receipt.unfinished": "未完成",
			"receipt.failed": "失败",
			"receipt.view": "在记忆空间中查看",
			"taskAgent.ready": "任务 Agent 就绪",
			"taskAgent.unavailable": "任务 Agent 不可用",
			"saveAction.button": "存入记忆",
			"saveAction.tooltip": "将这条回复存入记忆",
			"saveAction.title": "存入记忆",
			"saveAction.hint": "任务 Agent 会判断是否值得保存，去重、提炼后写入合适的记忆空间，不占用当前对话。",
			"saveAction.fetching": "提取消息文本…",
			"saveAction.missing": "无法从会话记录提取这条消息的文本。",
			"saveAction.candidate": "候选内容（可编辑）",
			"saveAction.truncated": "原回复较长，这里仅载入前 {limit} 个字符。",
			"saveAction.submit": "交给任务 Agent",
			"saveAction.submitting": "任务 Agent 处理中…",
			"saveAction.readOnly": "当前部署为只读模式，无法写入记忆。",
			"saveAction.close": "关闭",
			"readSources.all": "全部 Provider",
			"readSources.mode.search": "原生检索",
			"readSources.mode.graph": "真实关系图",
			"readSources.mode.projection": "内容投影",
			"readSources.mode.enumerable": "可枚举内容",
			"readSources.mode.query-only": "仅查询",
			"readSources.mode.entities": "实体索引",
			"readSources.mode.unsupported": "不支持",
			"readSources.status.ready": "{count} 条可观察",
			"readSources.status.empty": "已连接 · 暂无内容",
			"readSources.status.query-required": "输入查询后读取",
			"readSources.status.unsupported": "当前表面不可用",
			"readSources.status.unavailable": "连接不可用",
			"readSources.edges": "{count} 条真实关系",
			"readSources.model.mnemon-native": "事实、实体与类型关系",
			"readSources.model.openviking": "目录与分层内容",
			"readSources.model.honcho": "Peer 结论与画像",
			"readSources.model.mem0": "提炼后的语义记忆",
			"readSources.model.hindsight": "记忆单元与知识图",
			"readSources.model.holographic": "可信事实与实体",
			"readSources.model.retaindb": "画像与类型化事实",
			"readSources.model.byterover": "知识树查询",
			"readSources.model.supermemory": "记忆与摄取文档",
			"status.title": "系统状态",
			"status.description": "dsh-mnemon、记忆 Provider 与各层存储的运行状态。",
			"status.nominal": "系统正常",
			"status.reviewFailed": "后台审查失败",
			"status.reviewFailedDetail": "本轮记忆检查未完成，不会自动重放。后续审查受冷却时间和会话次数限制。",
			"status.reviewPartial": "已有写入提交；请按下列回执核对，未回滚。",
			"status.reviewTeamPaused": "Agent Teams 工具在役时按兼容设置暂停空闲审查。DSH 与官方 Teams 0.1.7-rc.2 可在“插件 → 可组合记忆”页面的空闲审查中选择“受限子代理审查”。召回与主动写入设置不变。",
			"status.reviewRun": "审查运行：{id}",
			"status.reviewContextWindow": "请切换为有界检查点（spawn），或选择上下文窗口足以覆盖父会话的任务模型。",
			"config.reviewTitle": "空闲审查",
			"config.reviewDescription": "对话空闲时整理记忆；关闭不影响召回与写入",
			"config.reviewEnabled": "启用空闲审查",
			"config.reviewLimits": "审查参数",
			"config.reviewProvider": "审查方式",
			"config.reviewSpawn": "有界检查点（spawn）",
			"config.reviewSpawnHint": "子代理只读取有界的检查点",
			"config.reviewFork": "完整父上下文（fork）",
			"config.reviewForkHint": "子代理带着完整的父上下文",
			"config.reviewFallback": "fork 不可用时（仅启动前）",
			"config.reviewSkip": "跳过本次审查",
			"config.reviewAgentTeams": "Agent Teams 兼容模式",
			"config.reviewTeamPause": "暂停审查（兼容旧版）",
			"config.reviewTeamPauseHint": "Agent Teams 运行时跳过审查",
			"config.reviewTeamScoped": "受限子代理审查",
			"config.reviewTeamScopedHint": "在受限子代理中审查，不用 Teams 工具",
			"config.review.minIntervalMs": "最小审查间隔（秒）",
			"config.review.maxPerSession": "每会话最多尝试次数",
			"config.review.maxContextChars": "spawn 检查点字符预算",
			"config.review.maxTokens": "每次模型输出 token 上限",
			"config.reviewLimitInvalid": "{field}需在 {min}–{max} 之间",
			"status.checkRequired": "需要检查",
			"status.memoryOff": "记忆未生效",
			"status.memoryOffDetail": "对话照常进行，但不会使用记忆。",
			"status.compositionStale": "最近的组件变更没有生效",
			"status.compositionStaleDetail": "记忆仍按之前的组合运行。",
			"status.strategyFallback": "所选主策略没有运行",
			"status.strategyFallbackDetail": "记忆暂由唯一可用的主策略组合。",
			"status.reasonNoStrategy": "没有正在运行的主策略。",
			"status.reasonNoSource": "没有正在运行的记忆来源。",
			"status.reasonNotComposed": "记忆组件还在加载。",
			"status.reasonSelectedStrategyOff": "所选主策略没有运行，而可用的主策略不止一个。",
			"status.reasonDependency": "{component} 缺少依赖 {requirement}。",
			"status.reasonConflict": "有组件相互冲突。",
			"status.reasonRejected": "组合被拒绝：{detail}",
			"status.layerOffDetail": "在配置中重新开启后恢复",
			"status.layerStoppedDetail": "组件已开启，但没有运行",
			"status.layerMemoryOffDetail": "主策略恢复运行后可用",
			"status.rechecking": "检查中…",
			"status.aria": "Mnemon 运行状态",
			"status.engine": "记忆引擎",
			"status.engineUnavailable": "Mnemon 不可用",
			"status.versionWaiting": "等待版本信息",
			"status.pluginChecking": "正在检查插件状态",
			"status.pluginReady": "插件运行正常",
			"status.nativeAria": "Mnemon Native 状态",
			"status.nativeCliMissing": "未找到 Mnemon CLI",
			"status.providersTitle": "记忆 Provider",
			"status.providersDescription": "正在运行的 Provider 及其记忆空间的连接状态。",
			"status.providersAria": "记忆 Provider 状态",
			"status.providersEnabled": "{enabled} / {total} 已启用",
			"status.providersOff": "另有 {count} 个 Provider 未启用",
			"status.providerState.disabled": "已关闭",
			"status.providerState.idle": "服务就绪 · 尚无已激活记忆空间",
			"status.providerState.healthy": "连接正常",
			"status.providerState.unhealthy": "连接需要检查",
			"status.providerSpaces": "{active} / {total} 个记忆空间参与运行",
			"versions.checkAction": "检查版本",
			"versions.title": "检查与更新版本",
			"versions.description": "查看当前安装，按需更新；展开 dsh-mnemon 可维护各子包。",
			"versions.missing": "未安装（可选）",
			"versions.restart": "待重启",
			"versions.local": "本地版本",
			"versions.modeNpmCli": "npm",
			"versions.hintNpm": "由 npm 管理；可在此更新，或在宿主终端运行 mnemon update。",
			"versions.hintNpmMissing": "已找到 npm 启动器，但宿主当前找不到 npm；请检查 Node.js 环境。",
			"versions.hintNpmUnmanaged": "当前 npm 不拥有这个 CLI 的全局安装；请切换到原 Node.js 环境，或按下方指引迁移。",
			"versions.hintUnreadable": "找到了 CLI，但无法读取版本；请在宿主终端检查该命令，或重新安装。",
			"versions.hintStarter": "随 dsh-mnemon 主包维护；升级主包以采用经过验证的子包组合。",
			"versions.npmRecommended": "npm 安装与维护",
			"versions.npmMaintenance": "通过 npm 维护 CLI",
			"versions.npmInstall": "通过 npm 安装（推荐）",
			"versions.npmMigrate": "改用 npm 维护（推荐）",
			"versions.npmRepair": "检查或修复 npm 安装",
			"versions.npmRepairDetail": "请先检查上方的安装状态。需要重新安装时，在运行 DSH 的宿主终端执行以下命令（Node.js 22+）。",
			"versions.npmUpdateDetail": "后续更新可直接运行以下命令；更新后点击“重新检查”确认生效。",
			"versions.npmInstallDetail": "只有 Mnemon Native 需要这个独立的 CLI。需要时在运行 DSH 的宿主终端执行以下命令（Node.js 22+）。",
			"versions.npmMigrateDetail": "若改用 npm，在 DSH 宿主终端执行（Node.js 22+）。",
			"versions.npmVerify": "安装后确认版本，再点击“重新检查”：",
			"versions.npmNextSteps": "安装后：验证版本与生效路径",
			"versions.npmPath": "确保 npm 全局命令目录位于 PATH 前部。若设置了 MNEMON_CLI_PATH 或 mnemon.cliPath，请同步指向新的启动器；宿主环境改变后重启 DSH，并核对上方的可执行文件路径。",
			"versions.installGuide": "查看安装说明",
			"versions.copy": "复制",
			"versions.copied": "已复制",
			"versions.copyCommand": "复制命令：{command}",
			"versions.copyFailed": "无法访问剪贴板，请选中命令手动复制。",
			"versions.readOnly": "当前为只读访问，可检查版本和复制命令；在拥有管理权限的连接中执行页面更新。",
			"versions.packages": "子包版本（{count}）",
			"versions.packagesOutdated": "{count} 个有新版本",
			"versions.packagesDetail": "展开查看维护方式",
			"versions.packagesHide": "收起子包详情",
			"versions.packagesHint": "默认组合随主包更新；在当前 Profile 中独立安装的子包可单独更新。更新后重启 dsh web。",
			"versions.managedStarter": "随主包维护",
			"versions.managedProfile": "Profile 独立维护",
			"versions.starterVersion": "主包指定",
			"versions.kind.source": "Sources · 记忆源",
			"versions.kind.strategy": "Strategies · 策略",
			"versions.kind.provider": "Providers · 后端",
			"versions.checking": "正在检查远程仓库中的新版本…",
			"versions.checkingShort": "检查中…",
			"versions.recheck": "重新检查",
			"versions.failed": "版本操作失败",
			"versions.timeout": "版本检查超时，请检查网络后重试。",
			"versions.current": "已是最新",
			"versions.available": "可更新",
			"versions.unknown": "无法确认",
			"versions.installed": "当前版本",
			"versions.latest": "最新版本",
			"versions.executable": "可执行文件",
			"versions.profileLocation": "Profile · {name}",
			"versions.sourceLocation": "源码",
			"versions.linkSourceLocation": "源码 · Profile {name}",
			"versions.packageLocation": "包目录",
			"versions.update": "更新",
			"versions.updating": "更新中…",
			"versions.updated": "{name} 已更新",
			"versions.alreadyCurrent": "当前已经是最新版本",
			"versions.restartRequired": "请重启 dsh web，以加载新的 dsh-mnemon 插件代码。",
			"versions.checkedAt": "检查于 {time}",
			"versions.latestUnavailable": "暂时无法读取远程最新版本；请检查网络后重试。",
			"versions.modeHomebrew": "Homebrew",
			"versions.modeGo": "Go 安装",
			"versions.modeNpm": "DSH Profile",
			"versions.modeLink": "本地 Link",
			"versions.modeManual": "手工安装",
			"versions.modeMissing": "未安装",
			"versions.hintHomebrew": "由 Homebrew 管理；发现新版本时可在此安全更新。",
			"versions.hintBrewMissing": "检测到 Homebrew 安装，但当前找不到 brew 命令。",
			"versions.hintGo": "由 go install 管理；发现新版本时可在此安全更新。",
			"versions.hintPnpm": "由当前 DSH Profile 管理；更新后需要重启 dsh web。",
			"versions.hintPnpmMissing": "检测到 DSH Profile 安装，但当前找不到 pnpm 命令。",
			"versions.hintLink": "当前为本地 Link 开发版本；请在源码目录拉取并构建，避免覆盖本地修改。",
			"versions.hintInstall": "未安装 Mnemon CLI。只有 Mnemon Native 需要它；需要时安装并确保 mnemon 位于 PATH，或设置 MNEMON_CLI_PATH / mnemon.cliPath。",
			"versions.hintManual": "无法安全识别安装来源；请沿用原安装方式手工更新。",
			"status.activeRatio": "{active} / {total} 已激活",
			"status.runtimeRatio": "{user} 用户 · {memory} 项目",
			"status.runtimeBytes": "{bytes} 已使用",
			"status.runtimeWaiting": "等待同步",
			"status.runtimeWaitingDetail": "宿主存储清单待返回",
			"status.directoryUnsynced": "目录尚未同步",
			"status.activeMemories": "{count} 条激活记忆",
			"status.documentsWaiting": "等待工作区",
			"status.documentsSession": "绑定活动会话后可用",
			"status.documentRatio": "{active} 份活跃 · {archived} 份归档",
			"status.documentUsage": "{used} / {limit} 活跃容量",
			"status.storageDomains": "存储域",
			"status.storageDomainsText": "运行时记忆、记忆空间与项目档案共用的存储位置。",
			"status.storageGlobal": "全局",
			"status.storageWorkspace": "工作区",
			"status.storageWorkspaces": "集中存储 · 工作区隔离",
			"status.storageCustom": "自定义",
			"status.storageWaiting": "正在读取存储域目录…",
			"status.storageCustomUnset": "尚未配置自定义目录。当前只展示已经由 DSH 配置并启用的自定义根。",
			"status.storageWorkspaceUnavailable": "当前会话没有可用的工作区目录。",
			"status.storageActiveRoot": "当前读写根",
			"status.storageAvailable": "目录可用",
			"status.storageNotCreated": "目录尚未创建",
			"status.storageRuntime": "运行时记忆",
			"status.storageSpaces": "记忆空间",
			"status.storageDocuments": "项目档案",
			"status.storageState": "后台状态",
			"status.storageReady": "正常",
			"status.storageEmpty": "空",
			"status.storageMissing": "未创建",
			"status.storageInvalid": "需修复",
			"status.storageItems": "项",
			"status.storageRuntimeDetail": "USER {user} · MEMORY {memory}",
			"status.storageSpacesDetail": "{active} 个激活 · {databases} 个数据库",
			"status.storageDocumentsDetail": "{active} 份活跃 · {archived} 份归档",
			"status.storageStateReady": "审阅水位已经持久化",
			"status.storageStateVolatile": "当前审阅状态仍由 Host 进程维护",
			"status.storageFootnote": "当前实际读写根：{root}。存储范围只在“插件 → 可组合记忆”页面中修改，保存后实时生效；插件不会自动迁移、合并或删除旧内容。",
			"config.aria": "记忆系统配置",
			"plugin.openWorkspace": "打开记忆系统",
			"config.interfaceTitle": "界面",
			"config.unsaved": "有未保存的修改",
			"config.ready": "已保存并实时生效",
			"config.displayTitle": "记忆系统入口",
			"config.displaySidebar": "侧边栏",
			"config.displaySidebarHint": "独立页面，可查看其他工作区",
			"config.displayBuiltin": "会话标签页",
			"config.displayBuiltinHint": "在当前会话中打开",
			"config.storageTitle": "存储",
			"storage.usedBy": "用于",
			"storage.usedByTitle": "“{component}”的数据保存在这里",
			"storage.default": "默认",
			"storage.directoryExample": "例如 ~/Documents/mnemon",
			"storage.thisWorkspace": "本工作区",
			"storage.moveNote": "应用后读写新位置，已有数据不会迁移",
			"config.scopeTitle": "存储范围",
			"config.global": "全局",
			"config.workspace": "工作区",
			"config.workspaces": "集中存储 · 按工作区隔离",
			"config.workspacesHint": "一个根目录下，每个工作区一个子目录（按路径区分）",
			"config.custom": "自定义",
			"config.globalScopeHint": "所有工作区共用一个目录",
			"config.workspaceScopeHint": "每个工作区自己的 .mnemon 目录",
			"config.dataDirectory": "数据目录",
			"config.runtimeUserScopeTitle": "用户画像范围",
			"config.runtimeUserScopeStorage": "跟随存储范围",
			"config.runtimeUserScopeStorageHint": "与 MEMORY.md 在同一目录",
			"config.runtimeUserScopeGlobal": "全局共享",
			"config.runtimeUserScopeGlobalHint": "所有工作区共用；MEMORY.md 仍按存储范围",
			"config.enhancementsRefreshFailed": "设置已更新，但状态刷新失败；请重新打开此页面。",
			"config.strategyTitle": "主策略",
			"config.strategyFailed": "无法切换主策略，已保留原设置，请重试。",
			"config.appliesNow": "即时生效",
			"config.quoted": "“{name}”",
			"config.listSeparator": "、",
			"config.sentenceGap": "",
			"config.enableStrategy": "开启“{strategy}”",
			"config.useStrategy": "改用“{strategy}”",
			"config.stopStrategies": "关闭{strategies}",
			"config.enableComponentNamed": "开启“{component}”",
			"config.providersSpacesOffTitle": "“记忆空间”已关闭",
			"config.providersSpacesOffDetail": "已保存的连接会保留",
			"config.providersSpacesOn": "开启“记忆空间”",
			"config.providersReadOnlyTitle": "dsh-mnemon 当前为只读",
			"config.providersReadOnlyDetail": "writeEnabled 为 false 时，不能启用或停用 Provider。",
			"board.title": "记忆组合",
			"board.description": "每轮对话的记忆由以下组件组合",
			"board.loading": "正在读取记忆组合…",
			"board.componentsUnavailable": "暂时无法读取记忆组件；这里只能开关记忆层。",
			"board.sources": "记忆来源",
			"board.enhancements": "增强",
			"board.running": "运行中",
			"board.off": "已关闭",
			"board.notRunning": "未运行",
			"board.needs": "需要“{component}”",
			"board.needsMissing": "所需组件未安装",
			"board.unused": "当前主策略不使用",
			"board.strategyMissing": "所选的主策略没有安装。",
			"board.turningOn": "正在开启…",
			"board.turningOff": "正在关闭…",
			"board.noMainMissing": "记忆未生效：所选的主策略没有安装",
			"board.noMainOff": "记忆未生效：主策略“{strategy}”已关闭",
			"board.noMainWaiting": "记忆未生效：“{strategy}”已开启，但还没有运行",
			"board.contenders": "记忆未生效：所选的“{strategy}”没有运行，{strategies}不能一同替它组合",
			"board.fallback": "所选的“{selected}”没有运行，记忆暂由“{composing}”组合",
			"board.fallbackMissing": "所选的主策略没有安装，记忆暂由“{composing}”组合",
			"board.noSource": "记忆未生效：没有正在运行的记忆来源",
			"board.memoryOff": "记忆未生效：当前组合无法使用",
			"board.stale": "最近的修改没有生效，记忆仍按之前的组合运行",
			"board.idle": "{strategies}也在运行，但不参与组合",
			"board.switching": "正在切换…",
			"board.composing": "正在组合记忆",
			"board.lastSource": "运行中 · 唯一的来源",
			"board.enabledCount": "{on} / {total} 已开启",
			"board.search": "搜索组件",
			"board.searchEmpty": "没有与“{query}”匹配的组件。",
			"details.open": "“{component}”的详情",
			"details.shipped": "随附",
			"details.installed": "已安装的扩展",
			"details.relations": "关系",
			"details.needs": "需要",
			"details.needsAny": "需要其一",
			"details.needsMissing": "尚未安装提供 {capability} 的组件",
			"details.neededBy": "被依赖",
			"details.conflicts": "不能同时运行",
			"details.options": "选项",
			"details.effectOn": "开启时一同开启：{names}",
			"details.effectOnReplace": "开启时关闭：{names}",
			"details.effectOnMixed": "开启时一同开启：{on}；关闭：{off}",
			"details.effectOff": "关闭时一同关闭：{names}",
			"details.effectLast": "唯一运行的来源，不能关闭",
			"details.currentMain": "当前主策略",
			"details.useMain": "设为主策略",
			"details.back": "返回“{component}”",
			"spaces.offNote": "开启后可配置 Provider 与嵌入",
			"threeTier.offNote": "开启后这些后台任务才会运行",
			"board.otherEnhancements": "适用于其他主策略的增强（{count}）",
			"board.more": "更多组件可在插件列表中添加",
			"board.relationNeeds": "需要“{component}”",
			"board.relationNeededBy": "“{component}”依赖它",
			"options.aria": "“{component}”的选项",
			"options.apply": "应用",
			"options.fix": "先修正标出的选项",
			"options.applying": "正在应用…",
			"options.default": "默认",
			"options.reset": "恢复默认",
			"options.integer": "请输入整数",
			"options.between": "请输入 {min} 到 {max} 之间的整数",
			"options.atLeast": "请输入不小于 {min} 的整数",
			"options.atMost": "请输入不大于 {max} 的整数",
			"options.tooLong": "最多 {max} 个字符",
			"options.listLimit": "最多 {count} 项，每项不超过 {length} 个字符，且不能重复",
			"options.listHint": "每行一项。",
			"options.noSources": "当前没有可选的记忆来源。",
			"options.sourceUnavailable": "{source}（当前不可用）",
			"feedback.memoryOff": "记忆未生效：没有正在运行的主策略",
			"feedback.memoryRestored": "记忆已恢复，由“{strategy}”组合",
			"feedback.fallback": "“{selected}”已关闭，记忆暂由“{composing}”组合",
			"feedback.fallbackMissing": "所选的主策略没有安装，记忆暂由“{composing}”组合",
			"feedback.switchedMain": "已改用“{strategy}”",
			"feedback.switchedMainOff": "已改用“{strategy}”，并关闭{others}",
			"feedback.switchedMainWith": "已改用“{strategy}”，并一同开启它需要的{others}",
			"feedback.switchedMainMixed": "已改用“{strategy}”：一同开启{on}，关闭{off}",
			"feedback.externalMain": "主策略已改为“{strategy}”",
			"feedback.idleMain": "“{component}”也在运行，但不参与组合",
			"feedback.sourceOn": "已开启“{component}”，这一层恢复读写",
			"feedback.sourceOff": "已关闭“{component}”，这一层暂停读写",
			"feedback.componentOn": "已开启“{component}”",
			"feedback.componentOff": "已关闭“{component}”",
			"feedback.externalSourceOn": "“{component}”已开启，这一层恢复读写",
			"feedback.externalSourceOff": "“{component}”已关闭，这一层暂停读写",
			"feedback.externalComponentOn": "“{component}”已开启",
			"feedback.externalComponentOff": "“{component}”已关闭",
			"feedback.several": "已更新 {count} 个组件",
			"feedback.enabledWith": "已开启“{component}”，并一同开启它需要的{others}",
			"feedback.disabledWith": "已关闭“{component}”，依赖它的{others}也一同关闭",
			"feedback.enabledReplacing": "已开启“{component}”，并关闭不能与它同时运行的{others}",
			"feedback.enabledMixed": "已开启“{component}”：一同开启{on}，关闭{off}",
			"feedback.optionsSaved": "已更新“{component}”的选项",
			"feedback.externalOptions": "“{component}”的选项已更改",
			"feedback.externalSeveral": "{count} 个组件已变化",
			"feedback.pendingMain": "正在切换到“{strategy}”…",
			"feedback.pendingOn": "正在开启“{component}”…",
			"feedback.pendingOff": "正在关闭“{component}”…",
			"feedback.pendingOptions": "正在应用“{component}”的选项…",
			"feedback.pendingSeveral": "正在应用修改…",
			"feedback.undo": "撤销",
			"feedback.undone": "已撤销，恢复为之前的设置",
			"feedback.show": "查看",
			"feedback.retry": "重试",
			"feedback.failed": "未能应用修改，已保留原来的设置。",
			"feedback.layerResumed": "“{layer}”已恢复运行",
			"config.componentListNote": "下方组件列表中的 dsh-mnemon/bundle 是 Starter 的分组条目，显示“已关闭”不影响运行。",
			"layers.disabledBadge": "已关闭",
			"layers.disabledTitle": "{layer} 已关闭",
			"layers.disabledDescription": "此记忆层当前不参与记忆处理。",
			"layers.disabledText": "已有数据完整保留；在“插件 → 可组合记忆”页面中重新开启后，即可恢复读取、写入与按需调用。",
			"layers.stoppedBadge": "未运行",
			"layers.stoppedTitle": "{layer} 未运行",
			"layers.stoppedDescription": "这一层的组件已开启，但没有运行。",
			"layers.stoppedText": "已有数据完整保留；可以在“插件 → 可组合记忆”页面查看它的状态，组件恢复运行后即可继续读取、写入与按需调用。",
			"layers.memoryOffBadge": "未生效",
			"layers.memoryOffTitle": "{layer} 未生效",
			"layers.memoryOffDescription": "记忆当前未生效，这一层暂不可用。",
			"layers.memoryOffText": "已有数据完整保留；在“插件 → 可组合记忆”页面中恢复主策略后，即可重新使用。",
			"config.providersTitle": "记忆 Provider",
			"config.providersDescription": "Provider 为记忆空间提供存储。启用或保存会同步其中已有的记忆空间；关闭只移除本地映射，不会删除第三方数据。",
			"config.nativeName": "Mnemon Native",
			"config.nativeSummary": "官方原生长期记忆与完整关系图",
			"config.officialNative": "官方原生",
			"config.nativeCliMissing": "未安装 CLI（可选）",
			"config.embeddingTitle": "本地向量嵌入",
			"config.embeddingDescription": "让 DSH Host 为每次 Mnemon CLI 调用注入嵌入 Endpoint 与模型；Endpoint 以 /v1 结尾时 Mnemon 自动使用 OpenAI 兼容协议（/v1/embeddings + Bearer 认证），否则使用 Ollama 协议；不以 /v1 结尾的兼容端点可在“协议”下拉中显式指定。",
			"config.embeddingManaged": "由 DSH 管理嵌入配置",
			"config.embeddingManagedHint": "开启后以这里保存的值覆盖 Mnemon 子进程环境；关闭后继续沿用 Host 环境与 Mnemon 默认值。",
			"config.embeddingEndpoint": "嵌入 Endpoint",
			"config.embeddingModel": "嵌入模型",
			"config.embeddingApiKey": "API Key（可选，OpenAI 兼容服务）",
			"config.embeddingApiKeyInvalid": "API Key 不能包含控制字符，且长度不超过 2048。",
			"config.embeddingProtocol": "协议",
			"config.embeddingProtocolAuto": "自动（按 /v1 探测）",
			"config.embeddingProtocolOllama": "Ollama",
			"config.embeddingProtocolOpenai": "OpenAI 兼容",
			"config.embeddingProtocolInvalid": "协议必须是 自动 / Ollama / OpenAI 兼容 之一。",
			"config.embeddingEndpointInvalid": "嵌入 Endpoint 必须是不含凭据、查询参数或片段的 HTTP(S) 绝对 URL。",
			"config.embeddingModelInvalid": "嵌入模型必须包含 1–200 个字符，且不能包含控制字符。",
			"config.embeddingSecurity": "Mnemon 会把记忆与查询正文发送到该 Endpoint；API Key 与其他设置一样保存在 DSH 设置文件中。远程 HTTP 会明文传输，请仅使用受信任的本地地址，或为远程服务配置 HTTPS。",
			"config.embeddingTest": "测试状态",
			"config.embeddingNotTested": "尚未检查当前 Mnemon Store 的连接与嵌入覆盖率。",
			"config.embeddingTesting": "正在通过 Mnemon 检查嵌入服务与覆盖率…",
			"config.embeddingSaveBeforeTest": "请先保存嵌入配置，再测试实际运行值。",
			"config.embeddingTestUnavailable": "当前 DSH Host 不提供嵌入状态检查。",
			"config.embeddingCliMissing": "测试需要 Mnemon CLI；向量设置只作用于 Mnemon Native。",
			"config.embeddingStatusAvailable": "嵌入服务可用 · {model} · 已嵌入 {embedded}/{total}（{coverage}）",
			"config.embeddingStatusAvailableWithProtocol": "嵌入服务可用 · {model} · 协议 {protocol} · 已嵌入 {embedded}/{total}（{coverage}）",
			"config.embeddingStatusUnavailable": "嵌入服务不可达 · {model} · 已嵌入 {embedded}/{total}（{coverage}）",
			"config.embeddingStatusUnavailableWithProtocol": "嵌入服务不可达 · {model} · 协议 {protocol} · 已嵌入 {embedded}/{total}（{coverage}）",
			"config.embeddingStatusFailed": "嵌入状态检查失败：{error}",
			"config.providerGlobalLocation": "全局数据位置",
			"config.providerGlobalLocationHint": "{provider} 默认使用全局范围目录，也可以指定一个自定义位置。",
			"config.providerGlobalLocationWorkspaceHint": "当前使用工作区默认位置；切换到全局范围后可指定自定义位置。",
			"config.providerDefaultLocation": "默认（跟随范围）",
			"config.providerSaveFailed": "配置保存失败：{error}",
			"config.providerServiceTitle": "服务配置",
			"config.providerServiceHint": "供该 Provider 的所有记忆空间复用；启用或保存时会刷新记忆空间目录中的映射与元信息。",
			"config.providerEnableHint": "填写服务配置并保存后，Provider 会启用并同步所有可见记忆空间。",
			"config.providerEnabled": "已启用",
			"config.providerDisabled": "未启用",
			"config.providerDisabledConfigured": "已关闭 · 配置已保留",
			"config.providerNeedsConfiguration": "需要完成配置",
			"config.providerToggleAria": "启用 {provider}",
			"config.providerToggleFailed": "切换失败：{error}",
			"config.enableProvider": "保存并启用",
			"config.providerServiceSaved": "服务配置已保存，记忆空间目录已同步",
			"config.saveProviderService": "保存服务配置",
			"config.providerUnavailable": "当前 DSH 主机不支持 Provider 服务配置。",
			"config.saveScopeBeforeProviders": "存储范围有未保存修改。请先保存范围，再配置对应目录中的 Provider。",
			"config.backgroundTitle": "后台任务",
			"config.backgroundDescription": "沉淀、归档与审查在后台运行，不占用主对话",
			"config.providerTargetWorkspace": "当前工作区：{workspace}；标记“工作区”的 Provider 配置与记忆空间使用此范围。",
			"config.loadingProviders": "正在读取 Provider 配置…",
			"config.providerLoadFailed": "读取 Provider 配置失败：{error}",
			"config.retryProviders": "重试",
			"config.taskAgentTitle": "任务 Agent 模型",
			"config.taskAgentInherit": "跟随主链路",
			"config.taskAgentInheritHint": "使用 DSH 新会话默认模型",
			"config.taskAgentFixed": "指定模型",
			"config.taskAgentFixedHint": "为后台任务和子代理委托固定 Provider 与模型",
			"config.taskAgentProvider": "模型 Provider",
			"config.taskAgentModel": "模型",
			"config.taskAgentImageInput": "图片输入",
			"config.taskAgentEffective": "当前将使用",
			"config.taskAgentLoading": "正在读取模型目录",
			"config.taskAgentUnavailable": "尚无可用的 Provider / Model 路由",
			"config.taskAgentLoadFailed": "模型目录读取失败：{error}",
			"config.taskAgentPartial": "有 {count} 个 Provider 暂时无法读取，其他选项仍可使用。",
			"config.customAbsolute": "需要绝对路径，或以 ~/ 开头",
			"config.saveFailed": "保存失败：{error}",
			"config.readOnly": "当前部署的插件设置为只读。",
			"config.remoteReadOnly": "远程访问时插件设置为只读：在 profile 的 mnemon 配置中设置 remoteAccess: trusted-host 并重启 DSH 后可在此修改。",
			"config.unavailable": "无法加载记忆系统设置。请检查 Host 是否已为当前 Web 部署授权设置 RPC。",
			"config.discard": "放弃修改",
			"config.saving": "保存中…",
			"config.interactionTurnBar": "回合记忆栏",
			"config.interactionTurnBarHint": "每轮回复下方显示本轮的召回与写入",
			"config.interactionSaveAction": "存入记忆按钮",
			"config.interactionSaveActionHint": "在回复旁手动存入，确认后写入记忆空间",
			"config.packTitle": "备份与迁移",
			"config.packUnavailable": "当前 DSH 主机不支持 Mnemon ZIP 备份通道。",
			"config.packExporting": "导出中…",
			"config.packInspecting": "检查中…",
			"config.packImporting": "导入中…",
			"config.packExported": "已导出 {file}（{size}）。",
			"config.packFailed": "ZIP 操作失败：{error}",
			"config.packSimpleDescription": "ZIP 含上述组件的数据，不含第三方 Provider 与密钥",
			"config.packImportZip": "导入 ZIP",
			"config.packExportZip": "导出 ZIP",
			"config.packChooseZip": "选择 Mnemon 备份 ZIP",
			"config.packUnnamedZip": "Mnemon 备份.zip",
			"config.packZipReady": "校验通过 · {components} 个组件 · {items} 项 · {size}",
			"config.packImportZipAction": "安全导入",
			"config.packImportedWhole": "已将 ZIP 安全合并到 {root}。"
		};
		const en = {
			...en$3,
			...en$2,
			...en$1,
			"tab.label": "Memory System",
			"nav.aria": "Mnemon pages",
			"nav.status": "Status",
			"common.refresh": "Refresh",
			"common.openConfiguration": "Open configuration",
			"common.loading": "Loading…",
			"common.cancel": "Cancel",
			"common.close": "Close",
			"common.copyId": "Copy ID",
			"common.readOnly": "Read only",
			"common.activationOnly": "Activation control only",
			"common.active": "Active",
			"common.inactive": "Inactive",
			"common.category": "Category",
			"common.importanceLabel": "Importance",
			"common.importance": "Importance {value}",
			"common.hops": "{count} hops",
			"common.allCategories": "All categories",
			"common.memories": "{count} memories",
			"common.edges": "{count} edges",
			"common.showing": "Showing {visible} / {total}",
			"common.showMore": "Show {count} more",
			"header.backToConversation": "Back to chat",
			"header.configure": "Configure",
			"header.compositionHint": "Select to change the composition in the configuration.",
			"header.checking": "Checking",
			"header.connected": "Connected",
			"header.unavailable": "Unavailable",
			"header.notReady": "Mnemon is not ready",
			"workspace.viewing": "Viewing workspace",
			"workspace.selectorAria": "Select a memory workspace to inspect",
			"workspace.storageMode": "Storage scope",
			"workspace.storageModeAria": "Storage scope: {mode}",
			"workspace.mismatchTitle": "The inspected directory is not aligned with this session",
			"workspace.mismatchShort": "Not conversation workspace",
			"workspace.selectedRoot": "Viewing: {root}",
			"workspace.effectiveRoot": "Effective: {root}",
			"workspace.align": "Align to conversation",
			"workspace.remoteReadOnly": "Remote access is read only: set remoteAccess: trusted-host in the mnemon profile configuration and restart DSH to manage memory here.",
			"sourcePage.instance": "Source instance",
			"sourcePage.instanceAria": "Select Source instance",
			"sourcePage.summaryAria": "Source status and permission summary",
			"sourcePage.package": "Package",
			"sourcePage.availability": "Availability",
			"sourcePage.availability.ready": "Ready",
			"sourcePage.availability.degraded": "Degraded",
			"sourcePage.availability.unavailable": "Unavailable",
			"sourcePage.role": "Semantic role",
			"sourcePage.revision": "Current revision",
			"sourcePage.permissions": "Authorized capabilities",
			"sourcePage.diagnostics": "Diagnostics",
			"sourcePage.configuration": "Declarative configuration",
			"sourcePage.configurationDescription": "Fields come from the sanitized Host management descriptor; submission is re-authorized against this instance and revision.",
			"sourcePage.configLoading": "Loading configuration…",
			"sourcePage.configSave": "Save configuration",
			"sourcePage.configSaving": "Saving…",
			"sourcePage.configSaved": "Configuration submitted; refreshing Source status.",
			"sourcePage.secretPlaceholder": "Leave blank to keep the existing secret",
			"sourcePage.unavailable": "Source is unavailable",
			"sourcePage.unavailableDescription": "No callable instance is visible in this scope. Host and Headless memory behavior are unaffected by this page.",
			"config.providerSecretShow": "Show credential",
			"config.providerSecretHide": "Hide credential",
			"config.providerSecretStoredValue": "Saved credential",
			"card.confirmText": "Soft-delete this memory?",
			"card.processing": "Processing…",
			"card.confirmForget": "Confirm forget",
			"card.related": "View related",
			"card.clone": "Create from this",
			"card.forget": "Forget",
			"turnTail.label": "Turn memory",
			"turnTail.recall": "recalled {count}",
			"turnTail.write": "wrote {count}",
			"turnTail.documents": "document search {count}",
			"turnTail.inspect": "inspected {count}",
			"turnTail.failed": "failed {count}",
			"turnTail.toolList": "Memory tools this turn",
			"turnTail.more": "{count} more",
			"turnTail.openTool": "Open the Memory page for {tool}",
			"turnTail.tool.recall": "Memory Spaces recall",
			"turnTail.tool.related": "Related memories",
			"turnTail.tool.documentSearch": "Document search",
			"turnTail.tool.documentManage": "Document update",
			"turnTail.tool.documentCreate": "New document",
			"turnTail.tool.runtime": "Runtime memory update",
			"turnTail.tool.remember": "Saved to Memory Spaces",
			"turnTail.tool.link": "Linked memories",
			"turnTail.tool.forget": "Deleted a memory",
			"turnTail.tool.status": "Memory status",
			"turnTail.tool.spaces": "Memory Space list",
			"turnTail.tool.spaceCreate": "New Memory Space",
			"turnTail.tool.spaceUpdate": "Memory Space update",
			"turnTail.tool.spaceMerge": "Merged Memory Spaces",
			"turnTail.tool.viewRoute": "Memory read",
			"turnTail.tool.viewAction": "Memory update",
			"receipt.written": "Saved",
			"receipt.updated": "Updated",
			"receipt.pending": "Submitted; the Provider confirms later",
			"receipt.skipped": "Skipped",
			"receipt.partial": "Partly saved",
			"receipt.unfinished": "Not finished",
			"receipt.failed": "Failed",
			"receipt.view": "View in Memory Spaces",
			"taskAgent.ready": "Task Agent ready",
			"taskAgent.unavailable": "Task Agent unavailable",
			"saveAction.button": "Save to memory",
			"saveAction.tooltip": "Save this reply to memory",
			"saveAction.title": "Save to memory",
			"saveAction.hint": "A task Agent decides whether this is worth keeping, removes duplicates, distills it and writes it to the right Memory Space, outside this conversation.",
			"saveAction.fetching": "Extracting message text…",
			"saveAction.missing": "Could not extract this message text from the session log.",
			"saveAction.candidate": "Candidate (editable)",
			"saveAction.truncated": "This reply is long; only the first {limit} characters are loaded here.",
			"saveAction.submit": "Send to task Agent",
			"saveAction.submitting": "Task Agent working…",
			"saveAction.readOnly": "This deployment is read only; memory writes are disabled.",
			"saveAction.close": "Close",
			"readSources.all": "All providers",
			"readSources.mode.search": "Native search",
			"readSources.mode.graph": "True relation graph",
			"readSources.mode.projection": "Content projection",
			"readSources.mode.enumerable": "Enumerable content",
			"readSources.mode.query-only": "Query only",
			"readSources.mode.entities": "Entity index",
			"readSources.mode.unsupported": "Unsupported",
			"readSources.status.ready": "{count} observable",
			"readSources.status.empty": "Connected · no content",
			"readSources.status.query-required": "Read after a query",
			"readSources.status.unsupported": "Unavailable on this surface",
			"readSources.status.unavailable": "Connection unavailable",
			"readSources.edges": "{count} true relations",
			"readSources.model.mnemon-native": "Facts, entities, and typed relations",
			"readSources.model.openviking": "Hierarchy and tiered content",
			"readSources.model.honcho": "Peer conclusions and profiles",
			"readSources.model.mem0": "Extracted semantic memories",
			"readSources.model.hindsight": "Memory units and knowledge graph",
			"readSources.model.holographic": "Trusted facts and entities",
			"readSources.model.retaindb": "Profiles and typed facts",
			"readSources.model.byterover": "Knowledge-tree queries",
			"readSources.model.supermemory": "Memories and ingested documents",
			"status.title": "System Status",
			"status.description": "How dsh-mnemon, memory Providers and each storage layer are running.",
			"status.nominal": "System nominal",
			"status.reviewFailed": "Background review failed",
			"status.reviewFailedDetail": "This checkpoint did not complete and will not be replayed automatically. Later reviews respect the cooldown and session limit.",
			"status.reviewPartial": "Some writes committed. Reconcile the receipts below; they were not rolled back.",
			"status.reviewTeamPaused": "Idle review is paused by the Agent Teams compatibility setting. With DSH and official Teams 0.1.7-rc.2, select “Scoped child review” under Idle review on the dsh-mnemon page under Plugins. Recall and writeback settings are unchanged.",
			"status.reviewRun": "Review run: {id}",
			"status.reviewContextWindow": "Choose bounded checkpoint review (spawn), or a task model with a context window large enough for the parent conversation.",
			"config.reviewTitle": "Idle review",
			"config.reviewDescription": "Tidies memory while the conversation is idle; recall and writes work either way",
			"config.reviewEnabled": "Enable idle review",
			"config.reviewLimits": "Review limits",
			"config.reviewProvider": "Review method",
			"config.reviewSpawn": "Bounded checkpoint (spawn)",
			"config.reviewSpawnHint": "A child reads a bounded checkpoint",
			"config.reviewFork": "Full parent context (fork)",
			"config.reviewForkHint": "A child with the full parent context",
			"config.reviewFallback": "When fork is unavailable (before startup only)",
			"config.reviewSkip": "Skip this review",
			"config.reviewAgentTeams": "Agent Teams compatibility",
			"config.reviewTeamPause": "Pause review (legacy compatible)",
			"config.reviewTeamPauseHint": "Skips review while Agent Teams runs",
			"config.reviewTeamScoped": "Scoped child review",
			"config.reviewTeamScopedHint": "Reviews in a scoped child without Teams tools",
			"config.review.minIntervalMs": "Minimum review interval (seconds)",
			"config.review.maxPerSession": "Maximum attempts per session",
			"config.review.maxContextChars": "Spawn checkpoint character budget",
			"config.review.maxTokens": "Model output token limit per request",
			"config.reviewLimitInvalid": "{field} must be between {min} and {max}",
			"status.checkRequired": "Check required",
			"status.memoryOff": "Memory not in use",
			"status.memoryOffDetail": "Conversations continue without memory.",
			"status.compositionStale": "The latest component change did not take effect",
			"status.compositionStaleDetail": "Memory still runs as composed before.",
			"status.strategyFallback": "The selected main strategy is not running",
			"status.strategyFallbackDetail": "The only available main strategy composes memory for now.",
			"status.reasonNoStrategy": "No main strategy is running.",
			"status.reasonNoSource": "No memory source is running.",
			"status.reasonNotComposed": "Memory components are still loading.",
			"status.reasonSelectedStrategyOff": "The selected main strategy is not running, and more than one other could compose memory.",
			"status.reasonDependency": "{component} is missing {requirement}.",
			"status.reasonConflict": "Some components conflict.",
			"status.reasonRejected": "The composition was refused: {detail}",
			"status.layerOffDetail": "Turn it back on in the configuration",
			"status.layerStoppedDetail": "Its component is on but not running",
			"status.layerMemoryOffDetail": "Available once a main strategy runs",
			"status.rechecking": "Checking…",
			"status.aria": "Mnemon runtime status",
			"status.engine": "Memory engine",
			"status.engineUnavailable": "Mnemon unavailable",
			"status.versionWaiting": "Waiting for version",
			"status.pluginChecking": "Checking plugin status",
			"status.pluginReady": "Plugin running normally",
			"status.nativeAria": "Mnemon Native status",
			"status.nativeCliMissing": "Mnemon CLI not found",
			"status.providersTitle": "Memory providers",
			"status.providersDescription": "Connection status of the running Providers and their Memory Spaces.",
			"status.providersAria": "Memory provider status",
			"status.providersEnabled": "{enabled} / {total} enabled",
			"status.providersOff": "{count} more Providers are off",
			"status.providerState.disabled": "Off",
			"status.providerState.idle": "Service ready · no active Memory Space",
			"status.providerState.healthy": "Connection healthy",
			"status.providerState.unhealthy": "Connection needs attention",
			"status.providerSpaces": "{active} / {total} Memory Spaces running",
			"versions.checkAction": "Check versions",
			"versions.title": "Check and update versions",
			"versions.description": "Review your installation and update when needed. Expand dsh-mnemon to maintain its subpackages.",
			"versions.missing": "Not installed (optional)",
			"versions.restart": "Restart needed",
			"versions.local": "Local version",
			"versions.modeNpmCli": "npm",
			"versions.hintNpm": "Managed by npm. Update here or run mnemon update in the Host terminal.",
			"versions.hintNpmMissing": "The npm launcher was found, but npm is unavailable on the Host. Check the Node.js environment.",
			"versions.hintNpmUnmanaged": "The current npm does not own this global CLI installation. Use its original Node.js environment or migrate below.",
			"versions.hintUnreadable": "The CLI was found, but its version could not be read. Check the command in the Host terminal or reinstall it.",
			"versions.hintStarter": "Maintained with the dsh-mnemon Starter. Update the Starter to use its tested package combination.",
			"versions.npmRecommended": "npm installation and maintenance",
			"versions.npmMaintenance": "Maintain the CLI with npm",
			"versions.npmInstall": "Install with npm (recommended)",
			"versions.npmMigrate": "Switch to npm (recommended)",
			"versions.npmRepair": "Check or repair the npm installation",
			"versions.npmRepairDetail": "Check the installation status above. To reinstall, run this command in the terminal on the DSH Host (Node.js 22+).",
			"versions.npmUpdateDetail": "Run this command for future updates, then choose Check again to verify the active version.",
			"versions.npmInstallDetail": "Only Mnemon Native needs this separate CLI. To use it, run this command in the terminal on the DSH Host (Node.js 22+).",
			"versions.npmMigrateDetail": "To switch to npm, run this on the DSH Host (Node.js 22+).",
			"versions.npmVerify": "Verify the installed version, then choose Check again:",
			"versions.npmNextSteps": "After installation: verify the version and active path",
			"versions.npmPath": "Put the npm global bin directory first on PATH. If MNEMON_CLI_PATH or mnemon.cliPath is set, point it to the new launcher. Restart DSH after changing its environment and verify the executable path above.",
			"versions.installGuide": "Installation guide",
			"versions.copy": "Copy",
			"versions.copied": "Copied",
			"versions.copyCommand": "Copy command: {command}",
			"versions.copyFailed": "Clipboard unavailable. Select the command and copy it manually.",
			"versions.readOnly": "This connection is read-only. You can check versions and copy commands; use a connection with management access to update here.",
			"versions.packages": "Subpackage versions ({count})",
			"versions.packagesOutdated": "{count} updates available",
			"versions.packagesDetail": "Expand for maintenance options",
			"versions.packagesHide": "Collapse package details",
			"versions.packagesHint": "Default packages update with the Starter. Packages installed independently in this Profile can update individually. Restart dsh web afterward.",
			"versions.managedStarter": "Maintained with Starter",
			"versions.managedProfile": "Managed by Profile",
			"versions.starterVersion": "Starter pin",
			"versions.kind.source": "Sources",
			"versions.kind.strategy": "Strategies",
			"versions.kind.provider": "Providers",
			"versions.checking": "Checking remote repositories for new versions…",
			"versions.checkingShort": "Checking…",
			"versions.recheck": "Check again",
			"versions.failed": "Version operation failed",
			"versions.timeout": "The version check timed out. Check the network and try again.",
			"versions.current": "Up to date",
			"versions.available": "Update available",
			"versions.unknown": "Cannot verify",
			"versions.installed": "Installed",
			"versions.latest": "Latest",
			"versions.executable": "Executable",
			"versions.profileLocation": "Profile · {name}",
			"versions.sourceLocation": "Source",
			"versions.linkSourceLocation": "Source · Profile {name}",
			"versions.packageLocation": "Package directory",
			"versions.update": "Update",
			"versions.updating": "Updating…",
			"versions.updated": "{name} updated",
			"versions.alreadyCurrent": "Already on the latest version",
			"versions.restartRequired": "Restart dsh web to load the new dsh-mnemon plugin code.",
			"versions.checkedAt": "Checked at {time}",
			"versions.latestUnavailable": "The remote latest version is unavailable. Check the network and try again.",
			"versions.modeHomebrew": "Homebrew",
			"versions.modeGo": "Go install",
			"versions.modeNpm": "DSH Profile",
			"versions.modeLink": "Local link",
			"versions.modeManual": "Manual",
			"versions.modeMissing": "Missing",
			"versions.hintHomebrew": "Managed by Homebrew; an available release can be safely updated here.",
			"versions.hintBrewMissing": "A Homebrew installation was detected, but the brew command is unavailable.",
			"versions.hintGo": "Managed by go install; an available release can be safely updated here.",
			"versions.hintPnpm": "Managed by the current DSH Profile; restart dsh web after updating.",
			"versions.hintPnpmMissing": "A DSH Profile installation was detected, but the pnpm command is unavailable.",
			"versions.hintLink": "This is a local linked development build. Pull and build in the source directory to preserve local changes.",
			"versions.hintInstall": "Mnemon CLI is not installed. Only Mnemon Native needs it; to use Native, install it and place mnemon on PATH, or set MNEMON_CLI_PATH / mnemon.cliPath.",
			"versions.hintManual": "The installation source cannot be identified safely. Update it using the original installation method.",
			"status.activeRatio": "{active} / {total} active",
			"status.runtimeRatio": "{user} user · {memory} project",
			"status.runtimeBytes": "{bytes} used",
			"status.runtimeWaiting": "Waiting",
			"status.runtimeWaitingDetail": "Awaiting the Host storage inventory",
			"status.directoryUnsynced": "Directory not synchronized",
			"status.activeMemories": "{count} active memories",
			"status.documentsWaiting": "Waiting for workspace",
			"status.documentsSession": "Available after binding a live session",
			"status.documentRatio": "{active} active · {archived} archived",
			"status.documentUsage": "{used} / {limit} active capacity",
			"status.storageDomains": "Storage Domains",
			"status.storageDomainsText": "Where runtime memory, Memory Spaces and Project Documents are stored.",
			"status.storageGlobal": "Global",
			"status.storageWorkspace": "Workspace",
			"status.storageWorkspaces": "Centralized workspaces",
			"status.storageCustom": "Custom",
			"status.storageWaiting": "Reading storage-domain directories…",
			"status.storageCustomUnset": "No custom directory is configured. This view exposes only a custom root already configured and active in DSH.",
			"status.storageWorkspaceUnavailable": "The current session has no available workspace directory.",
			"status.storageActiveRoot": "Current read/write root",
			"status.storageAvailable": "Directory available",
			"status.storageNotCreated": "Directory not created",
			"status.storageRuntime": "Runtime Memory",
			"status.storageSpaces": "Memory Spaces",
			"status.storageDocuments": "Project Documents",
			"status.storageState": "Background State",
			"status.storageReady": "Ready",
			"status.storageEmpty": "Empty",
			"status.storageMissing": "Not created",
			"status.storageInvalid": "Repair needed",
			"status.storageItems": "items",
			"status.storageRuntimeDetail": "USER {user} · MEMORY {memory}",
			"status.storageSpacesDetail": "{active} active · {databases} databases",
			"status.storageDocumentsDetail": "{active} active · {archived} archived",
			"status.storageStateReady": "Review watermarks are persisted",
			"status.storageStateVolatile": "Review state is currently owned by the Host process",
			"status.storageFootnote": "Current read/write root: {root}. Change the scope only on the dsh-mnemon page under Plugins; it applies live after Save and never auto-migrates, merges, or deletes old content.",
			"config.aria": "Memory system configuration",
			"plugin.openWorkspace": "Open Memory System",
			"config.interfaceTitle": "Interface",
			"config.unsaved": "Unsaved changes",
			"config.ready": "Saved and applied live",
			"config.displayTitle": "Memory System opens in",
			"config.displaySidebar": "Sidebar",
			"config.displaySidebarHint": "A standalone page that can show other workspaces",
			"config.displayBuiltin": "Conversation tab",
			"config.displayBuiltinHint": "Opens inside the current conversation",
			"config.storageTitle": "Storage",
			"storage.usedBy": "Used by",
			"storage.usedByTitle": "“{component}” keeps its data here",
			"storage.default": "Default",
			"storage.directoryExample": "For example ~/Documents/mnemon",
			"storage.thisWorkspace": "This workspace",
			"storage.moveNote": "Memory moves to the new location; existing data stays where it is",
			"config.scopeTitle": "Storage scope",
			"config.global": "Global",
			"config.workspace": "Workspace",
			"config.workspaces": "Centralized · isolated by workspace",
			"config.workspacesHint": "One root with a subdirectory per workspace, by its path",
			"config.custom": "Custom",
			"config.globalScopeHint": "All workspaces share one directory",
			"config.workspaceScopeHint": "Each workspace keeps its own .mnemon directory",
			"config.dataDirectory": "Data directory",
			"config.runtimeUserScopeTitle": "User profile scope",
			"config.runtimeUserScopeStorage": "Follow storage scope",
			"config.runtimeUserScopeStorageHint": "Kept with MEMORY.md",
			"config.runtimeUserScopeGlobal": "Shared globally",
			"config.runtimeUserScopeGlobalHint": "Shared by every workspace; MEMORY.md still follows the storage scope",
			"config.enhancementsRefreshFailed": "The setting was updated, but its status could not be refreshed. Reopen this page.",
			"config.strategyTitle": "Main strategy",
			"config.strategyFailed": "Could not switch the main strategy. The previous choice is kept; try again.",
			"config.appliesNow": "Applies at once",
			"config.quoted": "“{name}”",
			"config.listSeparator": ", ",
			"config.sentenceGap": " ",
			"config.enableStrategy": "Turn on “{strategy}”",
			"config.useStrategy": "Use “{strategy}”",
			"config.stopStrategies": "Turn off {strategies}",
			"config.enableComponentNamed": "Turn on “{component}”",
			"config.providersSpacesOffTitle": "Memory Spaces is off",
			"config.providersSpacesOffDetail": "Saved connections are kept",
			"config.providersSpacesOn": "Turn on “Memory Spaces”",
			"config.providersReadOnlyTitle": "dsh-mnemon is read-only",
			"config.providersReadOnlyDetail": "With writeEnabled false, Providers cannot be switched on or off.",
			"board.title": "Memory composition",
			"board.description": "Each turn's memory is composed from these components",
			"board.loading": "Reading the memory composition…",
			"board.componentsUnavailable": "Memory components cannot be read right now; only the memory layers can be switched here.",
			"board.sources": "Memory sources",
			"board.enhancements": "Enhancements",
			"board.running": "Running",
			"board.off": "Off",
			"board.notRunning": "Not running",
			"board.needs": "Needs “{component}”",
			"board.needsMissing": "Needs a component that is not installed",
			"board.unused": "Not used by this strategy",
			"board.strategyMissing": "The selected main strategy is not installed.",
			"board.turningOn": "Turning on…",
			"board.turningOff": "Turning off…",
			"board.noMainMissing": "Memory is not in use: the selected main strategy is not installed",
			"board.noMainOff": "Memory is not in use: the main strategy “{strategy}” is off",
			"board.noMainWaiting": "Memory is not in use: “{strategy}” is on but not running yet",
			"board.contenders": "Memory is not in use: the selected “{strategy}” is not running, and {strategies} cannot stand in for it together",
			"board.fallback": "The selected “{selected}” is not running; “{composing}” composes memory for now",
			"board.fallbackMissing": "The selected main strategy is not installed; “{composing}” composes memory for now",
			"board.noSource": "Memory is not in use: no memory source is running",
			"board.memoryOff": "Memory is not in use: this composition cannot be served",
			"board.stale": "The latest change did not take effect; memory still runs as composed before",
			"board.idle": "Also running, composing nothing: {strategies}",
			"board.switching": "Switching…",
			"board.composing": "Composing memory",
			"board.lastSource": "Running · the only source",
			"board.enabledCount": "{on} of {total} on",
			"board.search": "Search components",
			"board.searchEmpty": "No component matches “{query}”.",
			"details.open": "Details of “{component}”",
			"details.shipped": "Shipped",
			"details.installed": "Installed extension",
			"details.relations": "Relations",
			"details.needs": "Needs",
			"details.needsAny": "Needs one of",
			"details.needsMissing": "No installed component provides {capability}",
			"details.neededBy": "Needed by",
			"details.conflicts": "Cannot run beside",
			"details.options": "Options",
			"details.effectOn": "Turning on also turns on: {names}",
			"details.effectOnReplace": "Turning on turns off: {names}",
			"details.effectOnMixed": "Turning on also turns on: {on}; turns off: {off}",
			"details.effectOff": "Turning off also turns off: {names}",
			"details.effectLast": "The only running source; it stays on",
			"details.currentMain": "Current main strategy",
			"details.useMain": "Use as main strategy",
			"details.back": "Back to “{component}”",
			"spaces.offNote": "Turn it on to configure Providers and embedding",
			"threeTier.offNote": "These background tasks run once it is on",
			"board.otherEnhancements": "Enhancements for other main strategies ({count})",
			"board.more": "Add more components from the Plugins list",
			"board.relationNeeds": "Needs “{component}”",
			"board.relationNeededBy": "“{component}” depends on it",
			"options.aria": "Options of “{component}”",
			"options.apply": "Apply",
			"options.fix": "Fix the marked options first",
			"options.applying": "Applying…",
			"options.default": "Default",
			"options.reset": "Reset to default",
			"options.integer": "Enter a whole number",
			"options.between": "Enter a whole number from {min} to {max}",
			"options.atLeast": "Enter a whole number of at least {min}",
			"options.atMost": "Enter a whole number of at most {max}",
			"options.tooLong": "At most {max} characters",
			"options.listLimit": "Up to {count} unique items of at most {length} characters each",
			"options.listHint": "One item per line.",
			"options.noSources": "No memory source to choose from right now.",
			"options.sourceUnavailable": "{source} (unavailable now)",
			"feedback.memoryOff": "Memory is not in use: no main strategy is running",
			"feedback.memoryRestored": "Memory is back, composed by “{strategy}”",
			"feedback.fallback": "“{selected}” is off; “{composing}” composes memory for now",
			"feedback.fallbackMissing": "The selected main strategy is not installed; “{composing}” composes memory for now",
			"feedback.switchedMain": "Switched to “{strategy}”",
			"feedback.switchedMainOff": "Switched to “{strategy}” and turned off {others}",
			"feedback.switchedMainWith": "Switched to “{strategy}” and turned on {others}, which it needs",
			"feedback.switchedMainMixed": "Switched to “{strategy}”: turned on {on} and turned off {off}",
			"feedback.externalMain": "The main strategy is now “{strategy}”",
			"feedback.idleMain": "“{component}” is running too, but composes nothing",
			"feedback.sourceOn": "Turned on “{component}”; its layer reads and writes again",
			"feedback.sourceOff": "Turned off “{component}”; its layer stops reading and writing",
			"feedback.componentOn": "Turned on “{component}”",
			"feedback.componentOff": "Turned off “{component}”",
			"feedback.externalSourceOn": "“{component}” was turned on; its layer reads and writes again",
			"feedback.externalSourceOff": "“{component}” was turned off; its layer stops reading and writing",
			"feedback.externalComponentOn": "“{component}” was turned on",
			"feedback.externalComponentOff": "“{component}” was turned off",
			"feedback.several": "Updated {count} components",
			"feedback.enabledWith": "Turned on “{component}” and {others}, which it needs",
			"feedback.disabledWith": "Turned off “{component}” and {others}, which depended on it",
			"feedback.enabledReplacing": "Turned on “{component}” and turned off {others}, which cannot run beside it",
			"feedback.enabledMixed": "Turned on “{component}”: also turned on {on} and turned off {off}",
			"feedback.optionsSaved": "Updated the options of “{component}”",
			"feedback.externalOptions": "The options of “{component}” changed",
			"feedback.externalSeveral": "{count} components changed",
			"feedback.pendingMain": "Switching to “{strategy}”…",
			"feedback.pendingOn": "Turning on “{component}”…",
			"feedback.pendingOff": "Turning off “{component}”…",
			"feedback.pendingOptions": "Applying the options of “{component}”…",
			"feedback.pendingSeveral": "Applying changes…",
			"feedback.undo": "Undo",
			"feedback.undone": "Undone; the previous settings are back",
			"feedback.show": "Show",
			"feedback.retry": "Retry",
			"feedback.failed": "Could not apply the change; the previous settings are kept.",
			"feedback.layerResumed": "“{layer}” is running again",
			"config.componentListNote": "In the component list below, dsh-mnemon/bundle is the Starter's grouping entry; it shows as off without affecting anything.",
			"layers.disabledBadge": "Off",
			"layers.disabledTitle": "{layer} is off",
			"layers.disabledDescription": "This memory layer is not participating in memory processing.",
			"layers.disabledText": "Existing data is preserved. Re-enable the layer on the dsh-mnemon page under Plugins to restore reads, writes, and on-demand use.",
			"layers.stoppedBadge": "Not running",
			"layers.stoppedTitle": "{layer} is not running",
			"layers.stoppedDescription": "The component for this layer is on but not running.",
			"layers.stoppedText": "Existing data is preserved. Check its state on the dsh-mnemon page under Plugins; reads, writes, and on-demand use resume once the component runs.",
			"layers.memoryOffBadge": "Not in use",
			"layers.memoryOffTitle": "{layer} is not in use",
			"layers.memoryOffDescription": "Memory is not in use, so this layer is unavailable.",
			"layers.memoryOffText": "Existing data is preserved. Restore a main strategy on the dsh-mnemon page under Plugins to use it again.",
			"config.providersTitle": "Memory providers",
			"config.providersDescription": "Providers store memory spaces. Enabling or saving one synchronizes its existing spaces; turning it off removes only the local mapping, never third-party data.",
			"config.nativeName": "Mnemon Native",
			"config.nativeSummary": "Official native long-term memory with a complete relation graph",
			"config.officialNative": "Official native",
			"config.nativeCliMissing": "CLI not installed (optional)",
			"config.embeddingTitle": "Local vector embeddings",
			"config.embeddingDescription": "Have the DSH Host inject the embedding endpoint and model into every Mnemon CLI call; an endpoint ending in /v1 automatically uses the OpenAI-compatible protocol (/v1/embeddings with Bearer auth), otherwise the Ollama protocol. Compatible endpoints that do not end in /v1 can set the protocol explicitly.",
			"config.embeddingManaged": "Manage embedding settings in DSH",
			"config.embeddingManagedHint": "When enabled, saved values override the Mnemon child-process environment. When off, Mnemon keeps the Host environment and its built-in defaults.",
			"config.embeddingEndpoint": "Embedding endpoint",
			"config.embeddingModel": "Embedding model",
			"config.embeddingApiKey": "API key (optional, OpenAI-compatible servers)",
			"config.embeddingApiKeyInvalid": "The API key must contain no control characters and at most 2048 characters.",
			"config.embeddingProtocol": "Protocol",
			"config.embeddingProtocolAuto": "Auto (detect via /v1)",
			"config.embeddingProtocolOllama": "Ollama",
			"config.embeddingProtocolOpenai": "OpenAI-compatible",
			"config.embeddingProtocolInvalid": "The protocol must be one of Auto / Ollama / OpenAI-compatible.",
			"config.embeddingEndpointInvalid": "The embedding endpoint must be an absolute HTTP(S) URL without credentials, a query, or a fragment.",
			"config.embeddingModelInvalid": "The embedding model must contain 1–200 characters and no control characters.",
			"config.embeddingSecurity": "Mnemon sends memory and query text to this endpoint; the API key is stored in the DSH settings file like other settings. Remote HTTP is unencrypted; use a trusted local address or HTTPS for a remote service.",
			"config.embeddingTest": "Test status",
			"config.embeddingNotTested": "The current Mnemon Store connection and embedding coverage have not been checked.",
			"config.embeddingTesting": "Checking the embedding server and coverage through Mnemon…",
			"config.embeddingSaveBeforeTest": "Save the embedding settings before testing their effective runtime values.",
			"config.embeddingTestUnavailable": "This DSH Host does not provide embedding status checks.",
			"config.embeddingCliMissing": "Testing needs the Mnemon CLI; these embedding settings only apply to Mnemon Native.",
			"config.embeddingStatusAvailable": "Embedding server available · {model} · {embedded}/{total} embedded ({coverage})",
			"config.embeddingStatusAvailableWithProtocol": "Embedding server available · {model} · protocol {protocol} · {embedded}/{total} embedded ({coverage})",
			"config.embeddingStatusUnavailable": "Embedding server unreachable · {model} · {embedded}/{total} embedded ({coverage})",
			"config.embeddingStatusUnavailableWithProtocol": "Embedding server unreachable · {model} · protocol {protocol} · {embedded}/{total} embedded ({coverage})",
			"config.embeddingStatusFailed": "Embedding status check failed: {error}",
			"config.providerGlobalLocation": "Global data location",
			"config.providerGlobalLocationHint": "{provider} uses the global scope directory by default, or you can choose a custom location.",
			"config.providerGlobalLocationWorkspaceHint": "The workspace default is active. Switch to Global to choose a custom location.",
			"config.providerDefaultLocation": "Default (follows scope)",
			"config.providerSaveFailed": "Could not save configuration: {error}",
			"config.providerServiceTitle": "Service configuration",
			"config.providerServiceHint": "Shared by this provider’s Memory Spaces; enabling or saving refreshes their directory mappings and metadata.",
			"config.providerEnableHint": "Complete and save the service configuration to enable the provider and synchronize every visible namespace.",
			"config.providerEnabled": "Enabled",
			"config.providerDisabled": "Not enabled",
			"config.providerDisabledConfigured": "Off · configuration kept",
			"config.providerNeedsConfiguration": "Configuration required",
			"config.providerToggleAria": "Enable {provider}",
			"config.providerToggleFailed": "Could not change provider state: {error}",
			"config.enableProvider": "Save and enable",
			"config.providerServiceSaved": "Service configuration saved and Memory Spaces synchronized",
			"config.saveProviderService": "Save service configuration",
			"config.providerUnavailable": "This DSH host does not support provider service configuration.",
			"config.saveScopeBeforeProviders": "The storage scope has unsaved changes. Save the scope before configuring providers in that directory.",
			"config.backgroundTitle": "Background tasks",
			"config.backgroundDescription": "Capture, archiving and review run in the background, outside the conversation",
			"config.providerTargetWorkspace": "Current workspace: {workspace}. Providers tagged Workspace use this scope for configuration and Memory Spaces.",
			"config.loadingProviders": "Loading provider configurations…",
			"config.providerLoadFailed": "Could not load provider configurations: {error}",
			"config.retryProviders": "Retry",
			"config.taskAgentTitle": "Task Agent model",
			"config.taskAgentInherit": "Follow the main route",
			"config.taskAgentInheritHint": "Use the DSH new-session default model",
			"config.taskAgentFixed": "Choose a model",
			"config.taskAgentFixedHint": "Pin background tasks and subagent delegations to one provider and model",
			"config.taskAgentProvider": "Model provider",
			"config.taskAgentModel": "Model",
			"config.taskAgentImageInput": "Image input",
			"config.taskAgentEffective": "Will currently use",
			"config.taskAgentLoading": "Loading model directory",
			"config.taskAgentUnavailable": "No Provider / Model route is currently available",
			"config.taskAgentLoadFailed": "Could not load the model directory: {error}",
			"config.taskAgentPartial": "{count} providers could not be read; the remaining options are still available.",
			"config.customAbsolute": "Use an absolute path or one that starts with ~/",
			"config.saveFailed": "Save failed: {error}",
			"config.readOnly": "Plugin settings are read-only in this deployment.",
			"config.remoteReadOnly": "Plugin settings are read only over remote access: set remoteAccess: trusted-host in the mnemon profile configuration and restart DSH to change them here.",
			"config.unavailable": "Memory System settings could not be loaded. Check whether the Host grants the settings RPC to this Web deployment.",
			"config.discard": "Discard changes",
			"config.saving": "Saving…",
			"config.interactionTurnBar": "Turn memory bar",
			"config.interactionTurnBarHint": "Shows each turn's recall and writes below the reply",
			"config.interactionSaveAction": "Save to memory action",
			"config.interactionSaveActionHint": "Save a reply by hand; it goes into a Memory Space after you confirm",
			"config.packTitle": "Backup and migration",
			"config.packUnavailable": "This DSH host does not provide the Mnemon ZIP backup channel.",
			"config.packExporting": "Exporting…",
			"config.packInspecting": "Inspecting…",
			"config.packImporting": "Importing…",
			"config.packExported": "Exported {file} ({size}).",
			"config.packFailed": "ZIP operation failed: {error}",
			"config.packSimpleDescription": "A ZIP of the components above, without third-party providers or credentials",
			"config.packImportZip": "Import ZIP",
			"config.packExportZip": "Export ZIP",
			"config.packChooseZip": "Choose a Mnemon backup ZIP",
			"config.packUnnamedZip": "Mnemon backup.zip",
			"config.packZipReady": "Verified · {components} components · {items} items · {size}",
			"config.packImportZipAction": "Safe import",
			"config.packImportedWhole": "Safely merged the ZIP into {root}."
		};
		function interpolate(dictionary, key, params) {
			const template = dictionary[key];
			if (params === void 0) return template;
			return template.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match);
		}
		function translateZh(key, params) {
			return interpolate(zh, key, params);
		}
		function translateEn(key, params) {
			return interpolate(en, key, params);
		}
		//#endregion
		//#region src/client/view-styles.ts
		/** Compose shared view styles with the fixed sidebar skin. */
		function appearanceClass(base, sidebar) {
			return [base, sidebar].filter((value) => value !== void 0 && value !== "").join(" ");
		}
		//#endregion
		//#region src/client/ui-icons.ts
		const IconChevronLeftOutline14 = _deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutlineRegular;
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/src/client/MnemonView.module.css.mjs
		const css$12 = ".IIa07q_shell{--mn-bg:var(--dsw-alias-bg-base);--mn-backdrop:var(--dsw-alias-bg-overlay,var(--mn-bg));--mn-surface:linear-gradient(var(--mn-bg), var(--mn-bg)), linear-gradient(var(--mn-backdrop), var(--mn-backdrop)) var(--mn-bg);--mn-layer-1:var(--dsw-alias-bg-layer-1);--mn-layer-2:var(--dsw-alias-bg-layer-2);--mn-fill:var(--dsw-alias-bg-module-platform);--mn-input:var(--dsw-alias-bg-layer-1);--mn-text:var(--dsw-alias-label-primary);--mn-muted:var(--dsw-alias-label-secondary);--mn-faint:var(--dsw-alias-label-tertiary);--mn-caption:var(--dsw-alias-label-caption);--mn-line:var(--dsw-alias-border-l2);--mn-line-strong:var(--dsw-alias-border-l3);--mn-field-line:var(--dsw-alias-border-l4);--mn-card-line:var(--dsw-alias-settings-card-stroke);--mn-accent:var(--dsw-alias-state-business-primary);--mn-hover:var(--dsw-alias-interactive-bg-hover);--mn-pressed:var(--dsw-alias-interactive-bg-active);--mn-danger:var(--dsw-alias-state-error-primary);--mn-success:var(--dsw-alias-state-success-primary);--mn-warn:var(--dsw-alias-state-warn-primary);--mn-idle:var(--dsw-alias-state-idle-primary);--mn-priority:var(--dsw-alias-state-warn-primary);--mn-focus:var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));--mn-code:var(--ds-font-family-code,\"SFMono-Regular\", Consolas, monospace);--mn-sans:var(--dsw-font-family,-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif);box-sizing:border-box;min-width:0;height:100%;min-height:0;color:var(--mn-text);background:var(--mn-surface);font:13px/20px var(--mn-sans);-webkit-tap-highlight-color:transparent;flex-direction:column;display:flex;overflow:hidden}:has(>[data-conversation-scroll]>[data-slot=conversation\\.session]>*>[data-slot=conversation\\.view]>.IIa07q_shell[data-mnemon-surface=builtin])>[data-width-handle]{visibility:hidden;pointer-events:none}.IIa07q_shell *,.IIa07q_shell :before,.IIa07q_shell :after{box-sizing:border-box}.IIa07q_shell :where(button,input,select,textarea){color:inherit;font:inherit}.IIa07q_shell :where(button,select){touch-action:manipulation}.IIa07q_shell button:focus-visible,.IIa07q_shell input:focus-visible,.IIa07q_shell select:focus-visible,.IIa07q_shell textarea:focus-visible,.IIa07q_shell summary:focus-visible,.IIa07q_shell [role=button]:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--mn-focus);outline-offset:2px}.IIa07q_shell :is(textarea,input:not([type=checkbox],[type=radio],[type=file])):focus-visible{outline:none}.IIa07q_shell code{font-family:var(--mn-code);font-size:.92em}.IIa07q_masthead{background:var(--mn-surface);flex:none;align-items:center;gap:12px;min-height:48px;padding:10px 24px 4px;display:flex}.IIa07q_backButton{flex:none;align-items:center;gap:4px;min-width:max-content;display:inline-flex}.IIa07q_backButton>svg{flex:none}.IIa07q_brand{flex-wrap:wrap;flex:auto;align-items:center;gap:4px 10px;min-width:0;display:flex}.IIa07q_brand h1{flex:none;margin:0;font-size:16px;font-weight:500;line-height:24px}.IIa07q_storageMode{color:var(--mn-faint);background:var(--mn-fill);white-space:nowrap;border-radius:999px;flex:none;align-items:center;gap:4px;padding:1px 8px;font-size:11px;line-height:17px;display:inline-flex}.IIa07q_storageMode>strong{color:var(--mn-muted);font-weight:500}.IIa07q_statusCluster{color:var(--mn-faint);white-space:nowrap;flex:none;align-items:center;gap:6px;font-size:13px;line-height:20px;display:inline-flex}.IIa07q_statusDot{background:var(--mn-idle);border-radius:50%;flex:none;width:6px;height:6px}.IIa07q_online{background:var(--mn-success)}.IIa07q_offline{background:var(--mn-danger)}.IIa07q_checking{background:var(--mn-idle)}.IIa07q_iconButton{border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--mn-caption);cursor:pointer;background:0 0;border:0;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.IIa07q_iconButton:hover:not(:disabled){color:var(--mn-muted);background:var(--mn-hover)}.IIa07q_iconButton>svg{flex:none}.IIa07q_headerActions{flex:none;justify-content:flex-end;align-items:center;gap:8px;min-width:0;display:flex}.IIa07q_workspacePicker{min-width:0;color:var(--mn-faint);align-items:center;gap:6px;font-size:12px;line-height:18px;display:inline-flex}.IIa07q_workspacePicker>[data-part=label]{white-space:nowrap}.IIa07q_workspacePicker button{width:min(200px,22vw);min-width:112px}.IIa07q_alert,.IIa07q_inlineError{border-radius:var(--dsw-radius-md);color:var(--mn-danger);background:color-mix(in srgb, var(--mn-danger) 8%, transparent);padding:8px 12px;font-size:12px;line-height:18px}.IIa07q_alert{flex-direction:column;flex:none;gap:2px;margin:8px 24px 0;display:flex}.IIa07q_alert ul{margin:4px 0 0;padding-left:18px}.IIa07q_alert[role=status]{color:var(--dsw-alias-state-warn-label,var(--mn-text));background:var(--dsw-alias-state-warn-tertiary,color-mix(in srgb, var(--mn-warn) 12%, transparent))}.IIa07q_notice{flex:none;margin:8px 24px 0}.IIa07q_compositionStatus{border-radius:var(--dsw-radius-sm);min-width:0;color:inherit;font:inherit;cursor:pointer;background:0 0;border:0;align-items:center;gap:6px;padding:2px 6px;display:inline-flex}.IIa07q_compositionStatus:hover:not(:disabled){background:var(--mn-hover)}.IIa07q_compositionStatus:disabled{cursor:default}.IIa07q_compositionStrategy{color:var(--mn-muted)}.IIa07q_compositionStrategy:before{content:\"·\";color:var(--mn-faint);margin-right:6px}.IIa07q_compositionStatusWrap{min-width:0;display:inline-flex;position:relative}.IIa07q_compositionSummary{z-index:20;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2);width:max-content;max-width:min(320px,100vw - 32px);box-shadow:var(--dsw-elevation-prominent);color:var(--mn-muted);white-space:normal;opacity:0;pointer-events:none;flex-direction:column;align-items:flex-start;gap:8px;padding:12px;font-size:12px;line-height:18px;transition:opacity .14s ease-out,transform .14s ease-out;display:flex;position:absolute;top:calc(100% + 6px);right:0;transform:translateY(-4px)}.IIa07q_compositionStatusWrap:hover .IIa07q_compositionSummary,.IIa07q_compositionStatusWrap:focus-within .IIa07q_compositionSummary{opacity:1;transition-delay:.2s;transform:none}.IIa07q_compositionSummary>strong{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_compositionLayers{flex-wrap:wrap;gap:6px;display:flex}.IIa07q_compositionHint{color:var(--mn-faint)}@media (prefers-reduced-motion:reduce){.IIa07q_compositionSummary{transition:none}}.IIa07q_workspaceMismatch{border:.5px solid color-mix(in srgb, var(--dsw-alias-state-warn-label,var(--mn-warn)) 20%, transparent);border-radius:var(--dsw-radius-sm);min-width:0;min-height:28px;color:var(--dsw-alias-state-warn-label,var(--mn-text));background:var(--dsw-alias-state-warn-tertiary,color-mix(in srgb, var(--mn-warn) 12%, transparent));white-space:nowrap;flex:none;align-items:center;gap:6px;padding:0 3px 0 10px;font-size:12px;font-weight:500;line-height:18px;display:inline-flex}.IIa07q_workspaceMismatch>button{border-radius:var(--dsw-radius-xs);min-height:22px;color:inherit;background:color-mix(in srgb, currentColor 10%, transparent);cursor:pointer;border:0;padding:0 8px;font-size:12px}.IIa07q_workspaceMismatch>button:hover{background:color-mix(in srgb, currentColor 16%, transparent)}.IIa07q_workspace{flex-direction:column;flex:1;min-height:0;display:flex}.IIa07q_topNavigation{border-bottom:.5px solid var(--mn-line-strong);background:var(--mn-surface);flex:none;align-items:flex-end;min-width:0;padding:0 24px;display:flex}.IIa07q_nav{overscroll-behavior-inline:contain;scrollbar-width:none;flex:1;align-items:flex-end;gap:28px;min-width:0;display:flex;overflow-x:auto}.IIa07q_nav::-webkit-scrollbar{display:none}.IIa07q_nav button{min-width:max-content;color:var(--mn-faint);text-align:left;cursor:pointer;background:0 0;border:0;border-bottom:2px solid #0000;align-items:center;gap:6px;margin-bottom:-.5px;padding:10px 0 9px;font-size:13px;font-weight:500;line-height:16px;display:flex;position:relative}.IIa07q_nav button:hover{color:var(--mn-muted)}.IIa07q_nav button[data-active]{color:var(--mn-accent)}.IIa07q_nav button[data-layer-disabled]:not([data-active]){color:var(--mn-caption)}.IIa07q_nav .IIa07q_layerDisabledBadge{border:.5px solid var(--mn-field-line);color:var(--mn-faint);border-radius:999px;align-items:center;padding:0 6px;font-size:11px;font-style:normal;font-weight:500;line-height:15px;display:inline-flex}.IIa07q_canvas{overscroll-behavior-x:contain;overscroll-behavior-y:auto;scroll-behavior:auto;-webkit-overflow-scrolling:touch;background:var(--mn-surface);flex:1;min-width:0;overflow:auto}.IIa07q_page{width:100%;min-height:100%;margin:0 auto;padding:20px 24px clamp(96px,14vh,150px)}.IIa07q_pageHeader{justify-content:space-between;align-items:flex-start;gap:16px 24px;margin-bottom:16px;display:flex}.IIa07q_pageHeader>div:first-child{min-width:0}.IIa07q_pageHeader h2{margin:0;font-size:16px;font-weight:500;line-height:24px}.IIa07q_pageHeader p{max-width:72ch;color:var(--mn-muted);margin:2px 0 0;font-size:13px;line-height:20px}.IIa07q_pageHeaderMeta{flex-wrap:wrap;flex:none;justify-content:flex-end;align-items:center;gap:8px;min-width:0;display:flex}.IIa07q_pageHeaderMeta>code{border:.5px solid var(--mn-field-line);color:var(--mn-faint);font:500 11px/17px var(--mn-sans);font-variant-numeric:tabular-nums;white-space:nowrap;border-radius:999px;padding:1px 8px}.IIa07q_pageSpinner{width:20px;height:20px;color:var(--mn-faint);flex:none;place-items:center;display:inline-grid}.IIa07q_pageSpinner>i{border:2px solid color-mix(in srgb, currentColor 25%, transparent);border-top-color:currentColor;border-radius:50%;width:14px;height:14px;animation:.9s linear infinite IIa07q_mnemon-spin}.IIa07q_primaryButton,.IIa07q_secondaryButton,.IIa07q_ghostButton,.IIa07q_dangerButton,.IIa07q_dangerSolidButton{border-radius:var(--dsw-radius-md);min-height:32px;color:var(--mn-text);white-space:nowrap;cursor:pointer;background:0 0;border:0;justify-content:center;align-items:center;gap:4px;padding:0 12px;font-size:13px;font-weight:400;line-height:20px;transition:background-color .12s,color .12s,border-color .12s;display:inline-flex}.IIa07q_primaryButton{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-button-primary-fill)}.IIa07q_primaryButton:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.IIa07q_secondaryButton{border:.5px solid var(--mn-line-strong)}.IIa07q_secondaryButton:hover:not(:disabled),.IIa07q_ghostButton:hover:not(:disabled){background:var(--mn-hover)}.IIa07q_secondaryButton:active:not(:disabled),.IIa07q_ghostButton:active:not(:disabled){background:var(--mn-pressed)}.IIa07q_dangerButton{color:var(--mn-danger)}.IIa07q_dangerButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,color-mix(in srgb, var(--mn-danger) 8%, transparent))}.IIa07q_dangerSolidButton{color:var(--dsw-static-neutral-00,#fff);background:var(--mn-danger)}.IIa07q_dangerSolidButton:hover:not(:disabled){background:color-mix(in srgb, var(--mn-danger), black 8%)}.IIa07q_shell :where(button:disabled){cursor:not-allowed;opacity:.4}.IIa07q_emptyState{text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:12px;min-height:200px;padding:32px 24px;display:flex}.IIa07q_emptyGlyph{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-lg);width:48px;height:48px;color:var(--mn-faint);flex:none;place-items:center;font-size:20px;line-height:1;display:grid}.IIa07q_emptyState h3{margin:0 0 4px;font-size:14px;font-weight:500;line-height:22px}.IIa07q_emptyState p{max-width:480px;color:var(--mn-faint);margin:0;font-size:13px;line-height:20px}.IIa07q_sourceManagementSummary{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);grid-template-columns:minmax(220px,1.2fr) minmax(260px,1fr) minmax(220px,1fr);gap:16px;margin-top:12px;padding:16px;display:grid}.IIa07q_sourceManagementIdentity{grid-template-columns:6px minmax(0,1fr);align-items:center;gap:10px;min-width:0;display:grid}.IIa07q_sourceManagementIdentity>span{background:var(--mn-success);border-radius:50%;width:6px;height:6px}.IIa07q_sourceManagementSummary[data-availability=degraded] .IIa07q_sourceManagementIdentity>span{background:var(--mn-warn)}.IIa07q_sourceManagementSummary[data-availability=unavailable] .IIa07q_sourceManagementIdentity>span{background:var(--mn-danger)}.IIa07q_sourceManagementIdentity>div{gap:2px;min-width:0;display:grid}.IIa07q_sourceManagementIdentity small,.IIa07q_sourceManagementCapabilities>small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_sourceManagementIdentity strong{text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;overflow:hidden}.IIa07q_sourceManagementIdentity code{color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;font-size:12px;overflow:hidden}.IIa07q_sourceManagementSummary dl{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0;display:grid}.IIa07q_sourceManagementSummary dl>div{border-radius:var(--dsw-radius-sm);background:var(--mn-fill);align-content:center;gap:2px;min-width:0;padding:8px 10px;display:grid}.IIa07q_sourceManagementSummary dt{color:var(--mn-faint);font-size:11px;line-height:14px}.IIa07q_sourceManagementSummary dd{text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:13px;line-height:20px;overflow:hidden}.IIa07q_sourceManagementSummary dd code{font-size:12px}.IIa07q_sourceManagementCapabilities{align-content:center;gap:6px;min-width:0;display:grid}.IIa07q_sourceManagementCapabilities>div{flex-wrap:wrap;gap:4px;display:flex}.IIa07q_sourceManagementCapabilities span{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_sourceManagementDiagnostics,.IIa07q_sourceManagementForm{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-top:12px;padding:16px}.IIa07q_sourceManagementDiagnostics h3,.IIa07q_sourceManagementForm h3{margin:0;font-size:14px;font-weight:500;line-height:22px}.IIa07q_sourceManagementDiagnostics ul{color:var(--mn-muted);gap:4px;margin:8px 0 0;padding-left:18px;font-size:12px;line-height:18px;display:grid}.IIa07q_sourceManagementForm>div:first-child p{color:var(--mn-faint);margin:2px 0 0;font-size:12px;line-height:18px}.IIa07q_sourceManagementForm .IIa07q_formGrid label>small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_sourceManagementForm .IIa07q_formGrid input[type=checkbox]{width:16px;min-width:0;height:16px;min-height:0;accent-color:var(--dsw-alias-brand-primary)}.IIa07q_sectionSpinner{z-index:6;width:20px;height:20px;color:var(--mn-faint);place-items:center;display:grid;position:absolute;top:10px;right:10px}.IIa07q_sectionSpinner>i{border:2px solid color-mix(in srgb, currentColor 25%, transparent);border-top-color:currentColor;border-radius:50%;width:14px;height:14px;animation:.9s linear infinite IIa07q_mnemon-spin}@keyframes IIa07q_mnemon-spin{to{transform:rotate(360deg)}}.IIa07q_inlineError{margin:0 0 12px}.IIa07q_loading{color:var(--mn-faint);padding:16px 0;font-size:13px}.IIa07q_bodyEdit{gap:12px;padding-top:2px;display:grid}.IIa07q_bodyEdit label,.IIa07q_formGrid label{color:var(--mn-muted);gap:6px;font-size:12px;font-weight:500;line-height:18px;display:grid}.IIa07q_bodyEdit input,.IIa07q_bodyEdit select,.IIa07q_bodyEdit textarea,.IIa07q_formGrid select,.IIa07q_formGrid input{border:.5px solid var(--mn-field-line);border-radius:var(--dsw-radius-md);width:100%;min-width:0;min-height:32px;color:var(--mn-text);background:var(--mn-input);outline:0;padding:5px 10px;font-size:13px;font-weight:400;line-height:20px}.IIa07q_bodyEdit textarea{resize:vertical}.IIa07q_bodyEdit input::placeholder,.IIa07q_bodyEdit textarea::placeholder,.IIa07q_formGrid input::placeholder{color:var(--dsw-alias-label-dimmed)}.IIa07q_bodyEdit input:focus,.IIa07q_bodyEdit select:focus,.IIa07q_bodyEdit textarea:focus,.IIa07q_formGrid select:focus,.IIa07q_formGrid input:focus{border-color:var(--mn-accent)}.IIa07q_providerFieldControl{gap:4px;min-width:0;display:grid}.IIa07q_providerFieldControl input[type=checkbox]{width:16px;height:16px;min-height:0;accent-color:var(--dsw-alias-brand-primary);margin:2px 0;padding:0}.IIa07q_bodyDeleteConfirm{gap:16px;display:grid}.IIa07q_bodyDeleteConfirm>p{color:var(--mn-muted);margin:0;font-size:13px;line-height:20px}.IIa07q_bodyDeleteSummary{border-radius:var(--dsw-radius-md);background:color-mix(in srgb, var(--mn-danger) 6%, transparent);gap:4px;padding:12px;display:grid}.IIa07q_bodyDeleteSummary strong{font-size:13px;font-weight:500}.IIa07q_bodyDeleteContent{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font-size:13px;font-weight:400;line-height:20px}.IIa07q_bodyDeleteSummary span{color:var(--mn-muted);font-size:12px;line-height:18px}.IIa07q_sectionHeading{justify-content:space-between;align-items:center;gap:16px;min-height:36px;margin-bottom:8px;display:flex}.IIa07q_sectionHeading h3{margin:0;font-size:14px;font-weight:500;line-height:22px}.IIa07q_sectionHeading>div>span{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_sectionHeading>strong{color:var(--mn-muted);background:var(--mn-fill);font-variant-numeric:tabular-nums;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_sectionHeading button{border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--mn-caption);cursor:pointer;background:0 0;border:0;justify-content:center;align-items:center;padding:0;display:inline-flex}.IIa07q_sectionHeading button:hover:not(:disabled){color:var(--mn-muted);background:var(--mn-hover)}.IIa07q_runtimeNotice{border-radius:var(--dsw-radius-md);color:var(--mn-success);background:color-mix(in srgb, var(--mn-success) 8%, transparent);margin-bottom:12px;padding:8px 12px;font-size:12px;line-height:18px}.IIa07q_runtimeFootnote{color:var(--mn-faint);margin:12px 2px 0;font-size:12px;line-height:18px}.IIa07q_formGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;display:grid}.IIa07q_listProgress{border-top:.5px solid var(--mn-line);min-height:56px;color:var(--mn-faint);justify-content:center;align-items:center;gap:12px;margin-top:12px;padding:10px;font-size:12px;line-height:18px;display:flex}.IIa07q_compactListProgress{border-top:.5px solid var(--mn-line);color:var(--mn-faint);text-align:center;justify-items:stretch;gap:8px;margin-top:8px;padding:10px 2px 2px;font-size:12px;line-height:18px;display:grid}.IIa07q_compactListProgress button{width:100%}.IIa07q_modalPortal{z-index:1000;isolation:isolate;pointer-events:none;position:fixed;inset:0}.IIa07q_modalTheme.IIa07q_modalTheme.IIa07q_modalTheme{width:auto;min-width:0;height:auto;min-height:0;color:var(--mn-text);pointer-events:none;background:0 0;display:block;position:absolute;inset:0;overflow:visible}.IIa07q_modalBackdrop{z-index:0;overscroll-behavior:contain;padding:max(24px, var(--dsh-frame-top-clearance,24px)) 24px;background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur);touch-action:none;pointer-events:auto;justify-content:center;align-items:center;animation:.18s ease-out both IIa07q_mnemon-dialog-backdrop-enter;display:flex;position:fixed;inset:0;overflow:hidden}.IIa07q_modal{box-sizing:border-box;border-radius:var(--dsw-radius-panel);background:linear-gradient(var(--mn-layer-2), var(--mn-layer-2)), var(--mn-surface);width:min(640px,100%);min-height:0;max-height:100%;box-shadow:var(--dsw-elevation-prominent);touch-action:auto;transform-origin:50% 100%;backface-visibility:hidden;will-change:transform, opacity;border:0;flex-direction:column;animation:.2s cubic-bezier(.2,.75,.2,1) both IIa07q_mnemon-dialog-enter;display:flex;overflow:hidden}.IIa07q_modalBackdrop[data-closing],.IIa07q_modal[data-closing]{pointer-events:none}.IIa07q_modalDragHandle{display:none}.IIa07q_modalWide{width:min(760px,100%)}.IIa07q_modal>header{flex:none;justify-content:space-between;align-items:flex-start;gap:8px;padding:22px 14px 12px 24px;display:flex}.IIa07q_modal>header>div{min-width:0;padding-top:2px}.IIa07q_modal>header h2{margin:0;font-size:16px;font-weight:500;line-height:24px}.IIa07q_modal>header p{overflow-wrap:anywhere;max-width:64ch;color:var(--mn-muted);margin:4px 0 0;font-size:13px;line-height:20px}.IIa07q_modal>header .IIa07q_iconButton{color:var(--mn-muted);flex:none}.IIa07q_modalBody{overscroll-behavior:contain;scrollbar-gutter:stable;touch-action:pan-y;-webkit-overflow-scrolling:touch;min-height:0;padding:8px 24px 20px;overflow:hidden auto}.IIa07q_modalFooter{background:0 0;flex:none;justify-content:flex-end;align-items:center;gap:12px;padding:4px 24px 24px;display:flex}.IIa07q_modalFooter button{min-height:36px;padding-inline:14px}.IIa07q_modalFooterMeta{color:var(--mn-faint);margin-right:auto;font-size:12px;line-height:18px}.IIa07q_modalFooterActions{justify-content:flex-end;align-items:center;gap:8px;min-width:0;margin-left:auto;display:flex}@keyframes IIa07q_mnemon-dialog-backdrop-enter{0%{opacity:0}}@keyframes IIa07q_mnemon-dialog-enter{0%{opacity:0;transform:translateY(8px)scale(.985)}}@keyframes IIa07q_mnemon-sheet-enter{0%{transform:translateY(calc(100% + 32px))}to{transform:translate3d(0, var(--mn-modal-drag-y,0px), 0)}}@keyframes IIa07q_mnemon-metadata-sweep{to{transform:translate(120%)}}@keyframes IIa07q_mnemon-metadata-refreshed{0%{border-color:color-mix(in srgb, var(--mn-accent) 60%, var(--mn-card-line));box-shadow:0 0 0 2px color-mix(in srgb, var(--mn-accent) 14%, transparent)}to{border-color:var(--mn-card-line);box-shadow:0 0 #0000}}.IIa07q_healthStrip{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);flex-wrap:wrap;margin-bottom:16px;display:flex;position:relative;overflow:hidden}.IIa07q_asyncStatusBlock{min-width:0;min-height:36px;position:relative}.IIa07q_healthStrip article{box-sizing:border-box;border-top:.5px solid var(--mn-line);border-left:.5px solid var(--mn-line);flex:150px;align-items:flex-start;gap:10px;min-width:0;min-height:76px;margin:-.5px 0 0 -.5px;padding:14px 16px;display:flex}.IIa07q_healthStrip article>div{min-width:0}.IIa07q_healthStrip small{color:var(--mn-faint);margin-bottom:2px;font-size:12px;line-height:18px;display:block}.IIa07q_healthStrip strong{text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:22px;display:block;overflow:hidden}.IIa07q_healthStrip p{color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;margin:2px 0 0;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_healthIndicator{border-radius:50%;flex:none;width:6px;height:6px;margin-top:6px}.IIa07q_healthGood{background:var(--mn-success)}.IIa07q_healthBad{background:var(--mn-danger)}.IIa07q_healthMuted{background:var(--mn-idle)}.IIa07q_providerHealth{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:16px;padding:16px}.IIa07q_providerHealthList{margin-top:8px}.IIa07q_providerHealthList article{align-items:center;gap:12px;min-width:0;min-height:56px;padding:8px 0;display:flex}.IIa07q_providerHealthList article+article{border-top:.5px solid var(--mn-line)}.IIa07q_providerHealthOff{border-top:.5px solid var(--mn-line);min-width:0;color:var(--mn-faint);justify-content:space-between;align-items:center;gap:12px;margin-top:4px;padding-top:10px;font-size:12px;line-height:18px;display:flex}.IIa07q_providerHealthMark{box-sizing:border-box;border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-md);flex:none;place-items:center;width:36px;height:36px;padding:6px;display:grid;overflow:hidden}.IIa07q_providerHealthMark>img,.IIa07q_providerHealthMark>svg{object-fit:contain;border-radius:4px;width:100%;height:100%;display:block}.IIa07q_providerHealthCopy{flex:1;gap:0;min-width:0;display:grid}.IIa07q_providerHealthCopy strong{text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;overflow:hidden}.IIa07q_providerHealthCopy small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_providerHealthCopy p{color:var(--mn-danger);text-overflow:ellipsis;white-space:nowrap;margin:2px 0 0;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_providerHealthMeta{flex:none;align-items:center;gap:6px;display:flex}.IIa07q_providerHealthMeta small{color:var(--mn-faint);font-variant-numeric:tabular-nums;font-size:12px;line-height:18px}.IIa07q_providerHealthSignal{background:var(--mn-idle);border-radius:50%;width:6px;height:6px}.IIa07q_providerHealthList article[data-status=healthy] .IIa07q_providerHealthSignal{background:var(--mn-success)}.IIa07q_providerHealthList article[data-status=unhealthy] .IIa07q_providerHealthSignal{background:var(--mn-danger)}.IIa07q_providerHealthList article[data-status=idle] .IIa07q_providerHealthSignal{background:var(--mn-idle)}.IIa07q_storageDomains{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:16px;padding:16px}.IIa07q_storageRoot{border-radius:var(--dsw-radius-md);background:var(--mn-fill);justify-content:space-between;align-items:center;gap:16px;min-width:0;margin-top:12px;padding:10px 12px;display:flex}.IIa07q_storageRoot>div:first-child{gap:2px;min-width:0;display:grid}.IIa07q_storageRoot span,.IIa07q_storageRoot small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_storageRoot code{color:var(--mn-muted);text-overflow:ellipsis;white-space:nowrap;font-size:12px;overflow:hidden}.IIa07q_storageRoot>div:last-child{flex:none;justify-items:end;gap:2px;display:grid}.IIa07q_storageRoot strong{font-variant-numeric:tabular-nums;font-size:13px;font-weight:500}.IIa07q_storageAreaGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px;display:grid}.IIa07q_storageAreaGrid article{box-sizing:border-box;border:.5px solid var(--mn-line);border-radius:var(--dsw-radius-md);flex-direction:column;min-width:0;min-height:148px;padding:12px 14px;display:flex}.IIa07q_storageAreaGrid article>header{justify-content:space-between;align-items:center;gap:8px;display:flex}.IIa07q_storageAreaGrid article>header>div{align-items:center;gap:8px;min-width:0;display:flex}.IIa07q_storageAreaGrid article>header span{background:var(--mn-idle);border-radius:50%;flex:none;width:6px;height:6px}.IIa07q_storageAreaGrid article[data-status=ready]>header span{background:var(--mn-success)}.IIa07q_storageAreaGrid article[data-status=invalid]>header span{background:var(--mn-danger)}.IIa07q_storageAreaGrid article>header strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;overflow:hidden}.IIa07q_storageAreaGrid article>header em{color:var(--mn-faint);white-space:nowrap;font-size:11px;font-style:normal;line-height:14px}.IIa07q_storageAreaMetric{align-items:baseline;gap:6px;margin-top:12px;display:flex}.IIa07q_storageAreaMetric strong{font-variant-numeric:tabular-nums;font-size:20px;font-weight:500;line-height:28px}.IIa07q_storageAreaMetric span{color:var(--mn-faint);font-size:12px}.IIa07q_storageAreaMetric code{color:var(--mn-faint);margin-left:auto;font-size:11px}.IIa07q_storageAreaGrid article>p{min-height:36px;color:var(--mn-faint);margin:6px 0 8px;font-size:12px;line-height:18px}.IIa07q_storagePath{border-top:.5px solid var(--mn-line);color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;margin-top:auto;padding-top:8px;font-size:11px;line-height:16px;display:block;overflow:hidden}.IIa07q_storageAreaGrid article>small{color:var(--mn-danger);margin-top:6px;font-size:12px;line-height:18px;display:block}.IIa07q_storageUnavailable{border-radius:var(--dsw-radius-md);min-height:120px;color:var(--mn-muted);background:var(--mn-fill);text-align:center;place-content:center;gap:4px;margin-top:12px;display:grid}.IIa07q_storageUnavailable strong{font-size:13px;font-weight:500}.IIa07q_storageUnavailable p{max-width:520px;color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_storageFootnote{color:var(--mn-faint);margin:12px 0 0;font-size:12px;line-height:18px}.IIa07q_statusSectionHeader{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.IIa07q_statusSectionHeader h3{margin:0;font-size:14px;font-weight:500;line-height:22px}.IIa07q_statusSectionHeader p{max-width:640px;color:var(--mn-faint);margin:2px 0 0;font-size:12px;line-height:18px}.IIa07q_phaseBadge{color:var(--mn-muted);background:var(--mn-fill);font-variant-numeric:tabular-nums;white-space:nowrap;border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_statusHeaderActions{align-items:center;gap:8px;display:flex}.IIa07q_versionDialogBody{grid-template-columns:minmax(0,1fr);gap:12px;display:grid}.IIa07q_versionChecking{min-height:112px;color:var(--mn-muted);justify-content:center;align-items:center;gap:10px;font-size:13px;display:flex}.IIa07q_versionChecking span{border:2px solid color-mix(in srgb, currentColor 25%, transparent);border-top-color:currentColor;border-radius:50%;width:14px;height:14px;animation:.9s linear infinite IIa07q_mnemon-spin}.IIa07q_versionError,.IIa07q_versionResult{border-radius:var(--dsw-radius-md);color:var(--mn-danger);background:color-mix(in srgb, var(--mn-danger) 8%, transparent);padding:10px 12px}.IIa07q_versionResult{color:var(--mn-success);background:color-mix(in srgb, var(--mn-success) 8%, transparent)}.IIa07q_versionError strong,.IIa07q_versionResult strong{font-size:13px;font-weight:500}.IIa07q_versionError p,.IIa07q_versionResult p{color:var(--mn-muted);margin:2px 0 0;font-size:12px;line-height:18px}.IIa07q_versionList{grid-template-columns:minmax(0,1fr);gap:8px;display:grid}.IIa07q_versionList article{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);padding:12px 14px}.IIa07q_versionList article>header{justify-content:space-between;align-items:center;gap:12px;display:flex}.IIa07q_versionList article>header>div{align-items:center;gap:8px;min-width:0;display:flex}.IIa07q_versionList article>header strong{font-size:14px;font-weight:500;line-height:22px}.IIa07q_versionList article>header span{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_versionList article>header em{color:var(--mn-success);white-space:nowrap;font-size:12px;font-style:normal;line-height:18px}.IIa07q_versionList article[data-outdated]>header em{color:var(--mn-accent)}.IIa07q_versionNumbers{grid-template-columns:1fr auto 1fr;align-items:end;gap:10px;margin-top:10px;display:grid}.IIa07q_versionNumbers>div{gap:2px;display:grid}.IIa07q_versionNumbers small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_versionNumbers code{font-size:13px}.IIa07q_versionNumbers>span{color:var(--mn-faint);padding-bottom:1px}.IIa07q_versionLocation{min-width:0;color:var(--mn-faint);gap:6px;margin-top:8px;font-size:12px;line-height:18px;display:flex}.IIa07q_versionLocation>span{flex:none}.IIa07q_versionLocation>code{min-width:0;color:inherit;text-overflow:ellipsis;white-space:nowrap;font-size:11px;overflow:hidden}.IIa07q_versionList article>footer{border-top:.5px solid var(--mn-line);justify-content:space-between;align-items:flex-end;gap:16px;margin-top:10px;padding-top:10px;display:flex}.IIa07q_versionList article>footer p{max-width:470px;color:var(--mn-muted);margin:0;font-size:12px;line-height:18px}.IIa07q_versionList article>footer button{flex:none}.IIa07q_versionList article>header em[data-state=unknown],.IIa07q_versionList article>header em[data-state=local],.IIa07q_versionList article>header em[data-state=missing]{color:var(--mn-faint)}.IIa07q_versionList article>header em[data-state=restart]{color:var(--mn-accent)}.IIa07q_versionNotice{color:var(--mn-muted);margin:8px 0 0;font-size:12px;line-height:18px}.IIa07q_versionGuidance{border-radius:var(--dsw-radius-md);background:var(--mn-fill);gap:6px;min-width:0;margin-top:10px;padding:10px 12px;display:grid}.IIa07q_versionGuidance>strong{font-size:13px;font-weight:500}.IIa07q_versionGuidance>p{color:var(--mn-muted);margin:0;font-size:12px;line-height:18px}.IIa07q_versionGuidance>a{color:var(--dsw-alias-link,var(--mn-accent));justify-self:start;font-size:12px}.IIa07q_versionGuidanceDetails{min-width:0;color:var(--mn-muted);font-size:12px;line-height:18px}.IIa07q_versionGuidanceDetails>summary{cursor:pointer}.IIa07q_versionGuidanceDetails>p{margin:8px 0}.IIa07q_versionGuidanceDetails>a{color:var(--dsw-alias-link,var(--mn-accent))}.IIa07q_versionCommand{border-radius:var(--dsw-radius-sm);background:var(--mn-layer-1);flex-wrap:wrap;align-items:center;gap:8px;min-width:0;padding:8px 10px;display:flex}.IIa07q_versionCommand>code{overflow-wrap:anywhere;white-space:pre-wrap;user-select:text;flex:1;min-width:0;font-size:12px}.IIa07q_versionCommand>button{flex:none}.IIa07q_versionCommand>small{color:var(--mn-faint);flex-basis:100%;font-size:12px}.IIa07q_versionPackages{border-top:.5px solid var(--mn-line);min-width:0;margin-top:12px}.IIa07q_versionPackagesToggle{width:100%;min-height:44px;color:var(--mn-text);text-align:start;cursor:pointer;background:0 0;border:0;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 0 0;display:flex}.IIa07q_versionPackagesToggle>strong{font-size:13px;font-weight:500}.IIa07q_versionPackagesToggle>small{color:var(--mn-faint);margin-left:auto;font-size:12px}.IIa07q_versionPackages h4{color:var(--mn-faint);margin:16px 0 8px;font-size:12px;font-weight:500;line-height:18px}.IIa07q_versionPackages ul{gap:8px;margin:0;padding:0;list-style:none;display:grid}.IIa07q_versionPackage{border:.5px solid var(--mn-line);border-radius:var(--dsw-radius-md);min-width:0;padding:10px 12px}.IIa07q_versionPackageHeader{flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:6px 12px;display:flex}.IIa07q_versionPackageHeader strong{overflow-wrap:anywhere;min-width:0;font-size:13px;font-weight:500}.IIa07q_versionPackageHeader em{color:var(--mn-faint);font-size:12px;font-style:normal}.IIa07q_versionPackageHeader em[data-state=available],.IIa07q_versionPackageHeader em[data-state=restart]{color:var(--mn-accent)}.IIa07q_versionPackageHeader em[data-state=current]{color:var(--mn-success)}.IIa07q_versionPackageMeta,.IIa07q_versionPackageNumbers{color:var(--mn-faint);flex-wrap:wrap;gap:6px 14px;margin-top:6px;font-size:12px;line-height:18px;display:flex}.IIa07q_versionPackageNumbers code{color:var(--mn-text)}.IIa07q_versionPackageAction{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-top:8px;display:flex}.IIa07q_versionPackageAction p{min-width:150px;color:var(--mn-muted);flex:1;margin:0;font-size:12px;line-height:18px}.IIa07q_versionPackageAction button{flex:none}@media (width<=1000px){.IIa07q_sourceManagementSummary{grid-template-columns:1fr 1fr}.IIa07q_sourceManagementCapabilities{grid-column:1/-1}.IIa07q_storageAreaGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (width<=760px){.IIa07q_shell{min-height:0;overflow:hidden}.IIa07q_sourceManagementSummary{grid-template-columns:1fr}.IIa07q_sourceManagementSummary dl,.IIa07q_sourceManagementCapabilities{grid-column:auto}.IIa07q_masthead{padding:8px 16px 2px}.IIa07q_alert,.IIa07q_notice{margin-inline:16px}.IIa07q_topNavigation{padding:0 16px}.IIa07q_workspacePicker>[data-part=label]{display:none}.IIa07q_workspacePicker button{width:min(170px,32vw)}.IIa07q_modalBackdrop{padding:max(10px, env(safe-area-inset-top,0px)) 0 0;align-items:flex-end}.IIa07q_modal,.IIa07q_modalWide{width:100vw;max-height:calc(100vh - max(10px, env(safe-area-inset-top,0px)));border-radius:var(--dsw-radius-xl) var(--dsw-radius-xl) 0 0;transform:translate3d(0, var(--mn-modal-drag-y,0px), 0);animation-name:IIa07q_mnemon-sheet-enter;animation-duration:.34s;animation-timing-function:cubic-bezier(.2,.82,.2,1)}.IIa07q_modalDragHandle{cursor:grab;touch-action:none;user-select:none;flex:none;place-items:center;width:100%;height:28px;display:grid}.IIa07q_modalDragHandle span{background:var(--mn-line-strong);border-radius:999px;width:36px;height:4px;transition:width .14s,background-color .14s}.IIa07q_modal[data-dragging] .IIa07q_modalDragHandle{cursor:grabbing}.IIa07q_modal[data-dragging] .IIa07q_modalDragHandle span{background:var(--dsw-alias-border-l4);width:44px}.IIa07q_modal>header{padding:10px max(14px, env(safe-area-inset-right,0px)) 12px max(14px, env(safe-area-inset-left,0px));gap:12px}.IIa07q_modal>header p{-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}.IIa07q_modal>header .IIa07q_iconButton{width:44px;height:44px;margin:-4px -5px -4px 0}.IIa07q_modalBody{padding:14px max(14px, env(safe-area-inset-right,0px)) 18px max(14px, env(safe-area-inset-left,0px));scrollbar-gutter:auto;scroll-padding-bottom:12px}.IIa07q_modalBody button{min-height:44px}.IIa07q_modalFooter{padding:10px max(14px, env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(14px, env(safe-area-inset-left,0px));flex-direction:column;align-items:stretch;gap:8px}.IIa07q_modalFooterMeta{max-width:none;margin:0}.IIa07q_modalFooterActions{grid-template-columns:minmax(82px,.55fr) minmax(0,1.45fr);gap:8px;width:100%;margin:0;display:grid}.IIa07q_modalFooterActions button{white-space:normal;min-width:0;min-height:44px;padding-block:8px}.IIa07q_versionList article>footer{flex-direction:column;align-items:stretch}.IIa07q_nav{gap:22px}.IIa07q_page{padding:16px 16px calc(170px + env(safe-area-inset-bottom,0px))}.IIa07q_pageHeader{gap:10px;display:grid}.IIa07q_pageHeaderMeta{justify-content:flex-start}.IIa07q_healthStrip article{flex-basis:100%}.IIa07q_providerHealthMeta{flex-direction:column;align-items:flex-end;gap:4px}.IIa07q_storageRoot{flex-direction:column;align-items:flex-start}.IIa07q_storageRoot>div:last-child{justify-items:start}.IIa07q_storageAreaGrid{grid-template-columns:1fr}}@media (width<=520px){.IIa07q_workspacePicker select{width:min(150px,39vw)}.IIa07q_nav{scroll-snap-type:x proximity;gap:18px}.IIa07q_nav button{scroll-snap-align:start}.IIa07q_pageHeaderMeta{align-items:stretch}.IIa07q_pageHeaderMeta>code{align-items:center;display:inline-flex}.IIa07q_pageHeaderMeta>button{flex:1}.IIa07q_emptyState{min-height:180px;padding:24px 16px}.IIa07q_formGrid{grid-template-columns:1fr}}@media (width<=360px){.IIa07q_modalFooterActions{grid-template-columns:1fr}}@media (height<=420px){.IIa07q_modal>header p{white-space:nowrap;text-overflow:ellipsis;display:block;overflow:hidden}}@media (width>=761px) and (height<=560px){.IIa07q_modalBackdrop{padding:8px}}@supports (height:100dvh){@media (width<=760px){.IIa07q_modal,.IIa07q_modalWide{max-height:calc(100dvh - max(10px, env(safe-area-inset-top,0px)))}}}@media (width<=1000px) and (height<=760px){.IIa07q_shell{min-height:0}.IIa07q_masthead{min-height:44px}}@media (width<=760px) and (pointer:coarse){.IIa07q_shell input,.IIa07q_shell select,.IIa07q_shell textarea{font-size:16px!important}}@media (pointer:coarse){.IIa07q_modal>header .IIa07q_iconButton{width:44px;min-width:44px;height:44px;min-height:44px}.IIa07q_modalBody button,.IIa07q_modalFooter button{min-height:44px}}@media (prefers-reduced-motion:reduce){.IIa07q_shell *,.IIa07q_shell :before,.IIa07q_shell :after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}.IIa07q_modalBackdrop,.IIa07q_modal{animation:none!important}}.IIa07q_page[data-source-page]>.IIa07q_workspacePicker{margin-bottom:16px}.IIa07q_page[data-source-page] .IIa07q_page{width:100%;min-height:0;margin:0;padding:0}";
		const tagId$12 = "dsh-mnemon/src/client/MnemonView.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$12) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$12;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$12) tag.textContent = css$12;
		}
		var MnemonView_module_css_default = {
			"alert": "IIa07q_alert",
			"asyncStatusBlock": "IIa07q_asyncStatusBlock",
			"backButton": "IIa07q_backButton",
			"bodyDeleteConfirm": "IIa07q_bodyDeleteConfirm",
			"bodyDeleteContent": "IIa07q_bodyDeleteContent",
			"bodyDeleteSummary": "IIa07q_bodyDeleteSummary",
			"bodyEdit": "IIa07q_bodyEdit",
			"brand": "IIa07q_brand",
			"canvas": "IIa07q_canvas",
			"checking": "IIa07q_checking",
			"compactListProgress": "IIa07q_compactListProgress",
			"compositionHint": "IIa07q_compositionHint",
			"compositionLayers": "IIa07q_compositionLayers",
			"compositionStatus": "IIa07q_compositionStatus",
			"compositionStatusWrap": "IIa07q_compositionStatusWrap",
			"compositionStrategy": "IIa07q_compositionStrategy",
			"compositionSummary": "IIa07q_compositionSummary",
			"dangerButton": "IIa07q_dangerButton",
			"dangerSolidButton": "IIa07q_dangerSolidButton",
			"emptyGlyph": "IIa07q_emptyGlyph",
			"emptyState": "IIa07q_emptyState",
			"formGrid": "IIa07q_formGrid",
			"ghostButton": "IIa07q_ghostButton",
			"headerActions": "IIa07q_headerActions",
			"healthBad": "IIa07q_healthBad",
			"healthGood": "IIa07q_healthGood",
			"healthIndicator": "IIa07q_healthIndicator",
			"healthMuted": "IIa07q_healthMuted",
			"healthStrip": "IIa07q_healthStrip",
			"iconButton": "IIa07q_iconButton",
			"inlineError": "IIa07q_inlineError",
			"layerDisabledBadge": "IIa07q_layerDisabledBadge",
			"listProgress": "IIa07q_listProgress",
			"loading": "IIa07q_loading",
			"masthead": "IIa07q_masthead",
			"mnemon-dialog-backdrop-enter": "IIa07q_mnemon-dialog-backdrop-enter",
			"mnemon-dialog-enter": "IIa07q_mnemon-dialog-enter",
			"mnemon-metadata-refreshed": "IIa07q_mnemon-metadata-refreshed",
			"mnemon-metadata-sweep": "IIa07q_mnemon-metadata-sweep",
			"mnemon-sheet-enter": "IIa07q_mnemon-sheet-enter",
			"mnemon-spin": "IIa07q_mnemon-spin",
			"modal": "IIa07q_modal",
			"modalBackdrop": "IIa07q_modalBackdrop",
			"modalBody": "IIa07q_modalBody",
			"modalDragHandle": "IIa07q_modalDragHandle",
			"modalFooter": "IIa07q_modalFooter",
			"modalFooterActions": "IIa07q_modalFooterActions",
			"modalFooterMeta": "IIa07q_modalFooterMeta",
			"modalPortal": "IIa07q_modalPortal",
			"modalTheme": "IIa07q_modalTheme",
			"modalWide": "IIa07q_modalWide",
			"nav": "IIa07q_nav",
			"notice": "IIa07q_notice",
			"offline": "IIa07q_offline",
			"online": "IIa07q_online",
			"page": "IIa07q_page",
			"pageHeader": "IIa07q_pageHeader",
			"pageHeaderMeta": "IIa07q_pageHeaderMeta",
			"pageSpinner": "IIa07q_pageSpinner",
			"phaseBadge": "IIa07q_phaseBadge",
			"primaryButton": "IIa07q_primaryButton",
			"providerFieldControl": "IIa07q_providerFieldControl",
			"providerHealth": "IIa07q_providerHealth",
			"providerHealthCopy": "IIa07q_providerHealthCopy",
			"providerHealthList": "IIa07q_providerHealthList",
			"providerHealthMark": "IIa07q_providerHealthMark",
			"providerHealthMeta": "IIa07q_providerHealthMeta",
			"providerHealthOff": "IIa07q_providerHealthOff",
			"providerHealthSignal": "IIa07q_providerHealthSignal",
			"runtimeFootnote": "IIa07q_runtimeFootnote",
			"runtimeNotice": "IIa07q_runtimeNotice",
			"secondaryButton": "IIa07q_secondaryButton",
			"sectionHeading": "IIa07q_sectionHeading",
			"sectionSpinner": "IIa07q_sectionSpinner",
			"shell": "IIa07q_shell",
			"sourceManagementCapabilities": "IIa07q_sourceManagementCapabilities",
			"sourceManagementDiagnostics": "IIa07q_sourceManagementDiagnostics",
			"sourceManagementForm": "IIa07q_sourceManagementForm",
			"sourceManagementIdentity": "IIa07q_sourceManagementIdentity",
			"sourceManagementSummary": "IIa07q_sourceManagementSummary",
			"statusCluster": "IIa07q_statusCluster",
			"statusDot": "IIa07q_statusDot",
			"statusHeaderActions": "IIa07q_statusHeaderActions",
			"statusSectionHeader": "IIa07q_statusSectionHeader",
			"storageAreaGrid": "IIa07q_storageAreaGrid",
			"storageAreaMetric": "IIa07q_storageAreaMetric",
			"storageDomains": "IIa07q_storageDomains",
			"storageFootnote": "IIa07q_storageFootnote",
			"storageMode": "IIa07q_storageMode",
			"storagePath": "IIa07q_storagePath",
			"storageRoot": "IIa07q_storageRoot",
			"storageUnavailable": "IIa07q_storageUnavailable",
			"topNavigation": "IIa07q_topNavigation",
			"versionChecking": "IIa07q_versionChecking",
			"versionCommand": "IIa07q_versionCommand",
			"versionDialogBody": "IIa07q_versionDialogBody",
			"versionError": "IIa07q_versionError",
			"versionGuidance": "IIa07q_versionGuidance",
			"versionGuidanceDetails": "IIa07q_versionGuidanceDetails",
			"versionList": "IIa07q_versionList",
			"versionLocation": "IIa07q_versionLocation",
			"versionNotice": "IIa07q_versionNotice",
			"versionNumbers": "IIa07q_versionNumbers",
			"versionPackage": "IIa07q_versionPackage",
			"versionPackageAction": "IIa07q_versionPackageAction",
			"versionPackageHeader": "IIa07q_versionPackageHeader",
			"versionPackageMeta": "IIa07q_versionPackageMeta",
			"versionPackageNumbers": "IIa07q_versionPackageNumbers",
			"versionPackages": "IIa07q_versionPackages",
			"versionPackagesToggle": "IIa07q_versionPackagesToggle",
			"versionResult": "IIa07q_versionResult",
			"workspace": "IIa07q_workspace",
			"workspaceMismatch": "IIa07q_workspaceMismatch",
			"workspacePicker": "IIa07q_workspacePicker"
		};
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/src/client/MnemonSidebarView.module.css.mjs
		const css$11 = "._Bh55G_shell._Bh55G_shell{background:var(--mn-surface);font-family:var(--dsw-font-family)}._Bh55G_shell ._Bh55G_masthead{background:var(--mn-surface)}._Bh55G_shell ._Bh55G_brand{min-width:0}._Bh55G_shell ._Bh55G_headerActions{gap:8px}._Bh55G_shell ._Bh55G_statusCluster{min-height:28px}._Bh55G_shell ._Bh55G_workspacePicker{flex:none}._Bh55G_shell ._Bh55G_workspaceMismatch{justify-content:flex-start}._Bh55G_shell ._Bh55G_topNavigation{background:var(--mn-surface);gap:0;min-height:0}._Bh55G_shell ._Bh55G_nav{padding-right:0}._Bh55G_shell ._Bh55G_nav button[data-active]{color:var(--dsw-alias-state-business-primary);border-bottom-color:var(--dsw-alias-state-business-primary)}._Bh55G_shell ._Bh55G_modalBackdrop{z-index:1300}._Bh55G_shell ._Bh55G_modal._Bh55G_modalWide{width:min(760px,100%)}._Bh55G_shell ._Bh55G_modal>[class*=modalBody]{overscroll-behavior:contain;scrollbar-gutter:stable;touch-action:pan-y;-webkit-overflow-scrolling:touch;min-height:0;overflow:hidden auto}._Bh55G_shell ._Bh55G_canvas{background:var(--mn-surface)}._Bh55G_shell button,._Bh55G_shell input,._Bh55G_shell select,._Bh55G_shell textarea{font-family:var(--dsw-font-family)}._Bh55G_shell textarea{font-family:var(--dsw-font-family);font-size:13px;font-weight:400}._Bh55G_shell select{cursor:pointer;font-weight:400}._Bh55G_shell textarea{line-height:20px}._Bh55G_shell ._Bh55G_pageHeader{margin-bottom:16px}._Bh55G_shell ._Bh55G_canvas[data-lock-page-header] [class*=pageHeader]{z-index:12;border-bottom:.5px solid var(--dsw-alias-border-l2);background:var(--mn-surface);margin:-20px -24px 16px;padding:20px 24px 12px;position:sticky;top:0}._Bh55G_shell ._Bh55G_canvas[data-lock-page-header] [class*=pageHeader] [class*=pageHeaderMeta]{background:0 0;border:0;margin:0;padding:0;position:static}._Bh55G_shell ._Bh55G_itemActionButton{border-radius:var(--dsw-radius-sm);min-height:28px;padding:0 10px;font-size:12px;line-height:18px}._Bh55G_shell ._Bh55G_itemEditAction{border:.5px solid var(--dsw-alias-border-l3);color:var(--dsw-alias-label-primary);background:0 0}._Bh55G_shell ._Bh55G_itemEditAction:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}._Bh55G_shell ._Bh55G_itemDangerAction{color:var(--dsw-alias-state-error-primary);background:0 0;border:0}._Bh55G_shell ._Bh55G_itemDangerAction:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent));text-decoration:none}@media (width<=760px){._Bh55G_shell ._Bh55G_headerActions{max-width:none}._Bh55G_shell ._Bh55G_statusCluster>span:not([class*=statusDot]){display:inline}._Bh55G_shell ._Bh55G_workspacePicker>[data-part=label],._Bh55G_shell ._Bh55G_workspaceMismatch>span{display:none}._Bh55G_shell ._Bh55G_canvas[data-lock-page-header] [class*=pageHeader]{margin:-16px -16px 16px;padding:16px 16px 12px}._Bh55G_shell ._Bh55G_modalBackdrop{padding:max(10px, env(safe-area-inset-top,0px)) 0 0;align-items:flex-end}._Bh55G_shell ._Bh55G_modal,._Bh55G_shell ._Bh55G_modal._Bh55G_modalWide{width:100vw;max-height:calc(100vh - max(10px, env(safe-area-inset-top,0px)));border-radius:var(--dsw-radius-xl) var(--dsw-radius-xl) 0 0}._Bh55G_shell ._Bh55G_modal>header{padding:10px max(14px, env(safe-area-inset-right,0px)) 12px max(14px, env(safe-area-inset-left,0px));gap:12px}._Bh55G_shell ._Bh55G_modal>header p{-webkit-line-clamp:2;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}._Bh55G_shell ._Bh55G_modal>header [class*=iconButton]{width:44px;min-width:44px;height:44px;min-height:44px}._Bh55G_shell ._Bh55G_modal>[class*=modalBody]{padding:14px max(14px, env(safe-area-inset-right,0px)) 18px max(14px, env(safe-area-inset-left,0px));scrollbar-gutter:auto}._Bh55G_shell ._Bh55G_modal>[class*=modalBody] button{min-height:44px}._Bh55G_shell ._Bh55G_modal>[class*=modalFooter]{padding:10px max(14px, env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(14px, env(safe-area-inset-left,0px))}._Bh55G_shell ._Bh55G_modal>[class*=modalFooter] [class*=modalFooterActions] button{min-height:44px;padding-block:8px}}@media (width>=761px) and (height<=560px){._Bh55G_shell ._Bh55G_modalBackdrop{padding:8px}}@supports (height:100dvh){@media (width<=760px){._Bh55G_shell ._Bh55G_modal,._Bh55G_shell ._Bh55G_modal._Bh55G_modalWide{max-height:calc(100dvh - max(10px, env(safe-area-inset-top,0px)))}}}@media (width<=520px){._Bh55G_shell ._Bh55G_headerActions{flex:none;max-width:none}._Bh55G_shell [class*=backButton]>span{display:none}._Bh55G_shell ._Bh55G_workspacePicker button{width:min(118px,30vw)}._Bh55G_shell ._Bh55G_statusCluster [class*=iconButton],._Bh55G_shell [class*=compositionStrategy]{display:none}}@media (height<=420px){._Bh55G_shell ._Bh55G_modal>header p{white-space:nowrap;text-overflow:ellipsis;display:block;overflow:hidden}}@media (pointer:coarse){._Bh55G_shell ._Bh55G_modal>header [class*=iconButton]{width:44px;min-width:44px;height:44px;min-height:44px}._Bh55G_shell ._Bh55G_modal>[class*=modalBody] button,._Bh55G_shell ._Bh55G_modal>[class*=modalFooter] button{min-height:44px}}";
		const tagId$11 = "dsh-mnemon/src/client/MnemonSidebarView.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$11) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$11;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$11) tag.textContent = css$11;
		}
		var MnemonSidebarView_module_css_default = {
			"brand": "_Bh55G_brand",
			"canvas": "_Bh55G_canvas",
			"headerActions": "_Bh55G_headerActions",
			"itemActionButton": "_Bh55G_itemActionButton",
			"itemDangerAction": "_Bh55G_itemDangerAction",
			"itemEditAction": "_Bh55G_itemEditAction",
			"masthead": "_Bh55G_masthead",
			"modal": "_Bh55G_modal",
			"modalBackdrop": "_Bh55G_modalBackdrop",
			"modalWide": "_Bh55G_modalWide",
			"nav": "_Bh55G_nav",
			"pageHeader": "_Bh55G_pageHeader",
			"shell": "_Bh55G_shell",
			"statusCluster": "_Bh55G_statusCluster",
			"topNavigation": "_Bh55G_topNavigation",
			"workspaceMismatch": "_Bh55G_workspaceMismatch",
			"workspacePicker": "_Bh55G_workspacePicker"
		};
		//#endregion
		//#region src/client/MnemonDialog.tsx
		const SHEET_MEDIA = "(max-width: 760px)";
		const REDUCED_MOTION_MEDIA = "(prefers-reduced-motion: reduce)";
		const CLOSE_DURATION_MS = 240;
		const SNAP_DURATION_MS = 280;
		function matches(query) {
			return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
		}
		function currentTransform(element) {
			const value = window.getComputedStyle(element).transform;
			return value === "" || value === "none" ? "translate3d(0, 0, 0)" : value;
		}
		function currentTranslateY(element) {
			const transform = currentTransform(element);
			if (transform === "translate3d(0, 0, 0)") return 0;
			try {
				return Math.max(new DOMMatrixReadOnly(transform).m42, 0);
			} catch {
				const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
				if (matrix3d !== null) return Math.max(Number(matrix3d[1]?.split(",")[13]) || 0, 0);
				const matrix = transform.match(/^matrix\((.+)\)$/);
				return matrix === null ? 0 : Math.max(Number(matrix[1]?.split(",")[5]) || 0, 0);
			}
		}
		function cancelAnimations(element) {
			if (element === null || typeof element.getAnimations !== "function") return;
			element.getAnimations().forEach((animation) => animation.cancel());
		}
		function releaseDragCapture(drag) {
			try {
				if (typeof drag.captureTarget.hasPointerCapture !== "function" || drag.captureTarget.hasPointerCapture(drag.pointerId)) drag.captureTarget.releasePointerCapture?.(drag.pointerId);
			} catch {}
		}
		function waitForAnimations(animations, duration) {
			return new Promise((resolve) => {
				let settled = false;
				const finish = () => {
					if (settled) return;
					settled = true;
					window.clearTimeout(timeout);
					resolve();
				};
				const timeout = window.setTimeout(finish, duration + 100);
				Promise.allSettled(animations.map((animation) => animation.finished)).then(finish);
			});
		}
		/** Shared top-layer dialog behavior for every Mnemon workspace action surface. */
		function MnemonDialog(props) {
			const titleId = (0, react.useId)();
			const descriptionId = (0, react.useId)();
			const backdropRef = (0, react.useRef)(null);
			const dialogRef = (0, react.useRef)(null);
			const closeButtonRef = (0, react.useRef)(null);
			const returnFocusRef = (0, react.useRef)(null);
			const dragRef = (0, react.useRef)(null);
			const snapGenerationRef = (0, react.useRef)(0);
			const closingRef = (0, react.useRef)(false);
			const mountedRef = (0, react.useRef)(true);
			const busyRef = (0, react.useRef)(props.busy === true);
			const onCloseRef = (0, react.useRef)(props.onClose);
			busyRef.current = props.busy === true;
			onCloseRef.current = props.onClose;
			const focusPreferredControl = (0, react.useCallback)(() => {
				(dialogRef.current?.querySelector("[data-autofocus]:not(:disabled)") ?? dialogRef.current?.querySelector("input:not(:disabled), textarea:not(:disabled), select:not(:disabled)"))?.focus({ preventScroll: true });
			}, []);
			const finishClose = (0, react.useCallback)(() => {
				if (mountedRef.current) onCloseRef.current();
			}, []);
			const requestClose = (0, react.useCallback)(() => {
				if (busyRef.current || closingRef.current) return;
				const dialog = dialogRef.current;
				const backdrop = backdropRef.current;
				if (dialog === null || backdrop === null || matches(REDUCED_MOTION_MEDIA) || typeof dialog.animate !== "function" || typeof backdrop.animate !== "function") {
					finishClose();
					return;
				}
				closingRef.current = true;
				snapGenerationRef.current += 1;
				dialog.dataset.closing = "true";
				backdrop.dataset.closing = "true";
				const sheet = matches(SHEET_MEDIA);
				const fromTransform = currentTransform(dialog);
				const fromBackdropOpacity = window.getComputedStyle(backdrop).opacity;
				cancelAnimations(dialog);
				cancelAnimations(backdrop);
				const easing = sheet ? "cubic-bezier(.4, 0, 1, 1)" : "cubic-bezier(.4, 0, .2, 1)";
				waitForAnimations([dialog.animate(sheet ? [{
					opacity: 1,
					transform: fromTransform
				}, {
					opacity: 1,
					transform: "translate3d(0, calc(100% + 32px), 0)"
				}] : [{
					opacity: 1,
					transform: fromTransform
				}, {
					opacity: 0,
					transform: "translate3d(0, 8px, 0) scale(.985)"
				}], {
					duration: CLOSE_DURATION_MS,
					easing,
					fill: "forwards"
				}), backdrop.animate([{ opacity: fromBackdropOpacity }, { opacity: 0 }], {
					duration: CLOSE_DURATION_MS,
					easing: "ease-out",
					fill: "forwards"
				})], CLOSE_DURATION_MS).then(finishClose);
			}, [finishClose]);
			const resetDrag = (0, react.useCallback)(() => {
				const dialog = dialogRef.current;
				const backdrop = backdropRef.current;
				if (dialog === null || backdrop === null) return;
				const drag = dragRef.current;
				const offset = drag?.offset ?? 0;
				const snapGeneration = ++snapGenerationRef.current;
				dragRef.current = null;
				if (drag !== null) releaseDragCapture(drag);
				delete dialog.dataset.dragging;
				if (offset <= 0 || matches(REDUCED_MOTION_MEDIA) || typeof dialog.animate !== "function" || typeof backdrop.animate !== "function") {
					dialog.style.removeProperty("--mn-modal-drag-y");
					backdrop.style.removeProperty("opacity");
					return;
				}
				const dialogAnimation = dialog.animate([{ transform: currentTransform(dialog) }, { transform: "translate3d(0, 0, 0)" }], {
					duration: SNAP_DURATION_MS,
					easing: "cubic-bezier(.2, .8, .2, 1)",
					fill: "forwards"
				});
				const backdropAnimation = backdrop.animate([{ opacity: window.getComputedStyle(backdrop).opacity }, { opacity: 1 }], {
					duration: SNAP_DURATION_MS,
					easing: "ease-out",
					fill: "forwards"
				});
				waitForAnimations([dialogAnimation, backdropAnimation], SNAP_DURATION_MS).then(() => {
					if (!mountedRef.current || snapGenerationRef.current !== snapGeneration) return;
					dialog.style.removeProperty("--mn-modal-drag-y");
					backdrop.style.removeProperty("opacity");
					dialogAnimation.cancel();
					backdropAnimation.cancel();
				});
			}, []);
			const beginDrag = (event) => {
				if (busyRef.current || closingRef.current || !event.isPrimary || !matches(SHEET_MEDIA)) return;
				if (event.pointerType === "mouse" && event.button !== 0) return;
				const dialog = dialogRef.current;
				if (dialog === null) return;
				snapGenerationRef.current += 1;
				const initialOffset = currentTranslateY(dialog);
				const backdrop = backdropRef.current;
				const initialBackdropOpacity = backdrop === null ? "" : window.getComputedStyle(backdrop).opacity;
				cancelAnimations(dialog);
				cancelAnimations(backdrop);
				const time = event.timeStamp;
				dragRef.current = {
					pointerId: event.pointerId,
					captureTarget: event.currentTarget,
					startY: event.clientY,
					initialOffset,
					lastY: event.clientY,
					lastTime: time,
					velocity: 0,
					offset: initialOffset,
					height: Math.max(dialog.getBoundingClientRect().height, 1)
				};
				dialog.dataset.dragging = "true";
				dialog.style.setProperty("--mn-modal-drag-y", `${initialOffset}px`);
				if (backdrop !== null) backdrop.style.opacity = initialBackdropOpacity;
				try {
					event.currentTarget.setPointerCapture?.(event.pointerId);
				} catch {}
			};
			const moveDrag = (0, react.useCallback)((event) => {
				const drag = dragRef.current;
				const dialog = dialogRef.current;
				const backdrop = backdropRef.current;
				if (drag === null || dialog === null || backdrop === null || drag.pointerId !== event.pointerId) return;
				event.preventDefault();
				const rawOffset = Math.max(0, drag.initialOffset + event.clientY - drag.startY);
				const offset = rawOffset <= drag.height ? rawOffset : drag.height + (rawOffset - drag.height) * .16;
				const elapsed = Math.max(event.timeStamp - drag.lastTime, 1);
				const sampleVelocity = (event.clientY - drag.lastY) / elapsed;
				drag.velocity = drag.velocity * .35 + sampleVelocity * .65;
				drag.lastY = event.clientY;
				drag.lastTime = event.timeStamp;
				drag.offset = offset;
				dialog.style.setProperty("--mn-modal-drag-y", `${offset}px`);
				backdrop.style.opacity = String(1 - Math.min(offset / drag.height * .58, .52));
			}, []);
			const endDrag = (0, react.useCallback)((event) => {
				const drag = dragRef.current;
				if (drag === null || drag.pointerId !== event.pointerId) return;
				const threshold = Math.min(Math.max(drag.height * .22, 96), 180);
				if (drag.offset >= threshold || drag.offset >= 28 && drag.velocity >= .55) {
					dragRef.current = null;
					releaseDragCapture(drag);
					if (dialogRef.current !== null) delete dialogRef.current.dataset.dragging;
					requestClose();
				} else resetDrag();
			}, [requestClose, resetDrag]);
			const cancelDrag = (0, react.useCallback)((event) => {
				if (dragRef.current?.pointerId === event.pointerId) resetDrag();
			}, [resetDrag]);
			(0, react.useLayoutEffect)(() => {
				returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				(dialogRef.current?.querySelector("[data-autofocus]:not(:disabled)") ?? dialogRef.current?.querySelector("input:not(:disabled), textarea:not(:disabled), select:not(:disabled)") ?? dialogRef.current?.querySelector("button:not(:disabled)"))?.focus({ preventScroll: true });
				return () => {
					if (returnFocusRef.current?.isConnected === true) returnFocusRef.current.focus({ preventScroll: true });
				};
			}, []);
			(0, react.useLayoutEffect)(() => {
				if (props.contentReady !== true) return;
				const active = document.activeElement;
				if (active !== closeButtonRef.current && active !== dialogRef.current) return;
				focusPreferredControl();
			}, [focusPreferredControl, props.contentReady]);
			(0, react.useEffect)(() => {
				mountedRef.current = true;
				const previousOverflow = document.body.style.overflow;
				document.body.style.overflow = "hidden";
				return () => {
					mountedRef.current = false;
					document.body.style.overflow = previousOverflow;
				};
			}, []);
			(0, react.useEffect)(() => {
				const onKey = (event) => {
					if (event.key === "Escape") {
						event.preventDefault();
						requestClose();
						return;
					}
					if (event.key !== "Tab" || closingRef.current) return;
					const controls = Array.from(dialogRef.current?.querySelectorAll("button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex=\"-1\"])") ?? []).filter((control) => control.getAttribute("aria-hidden") !== "true");
					const first = controls[0];
					const last = controls.at(-1);
					if (first === void 0 || last === void 0) {
						event.preventDefault();
						return;
					}
					const active = document.activeElement;
					if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
						event.preventDefault();
						last.focus();
					} else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
						event.preventDefault();
						first.focus();
					}
				};
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, [requestClose]);
			(0, react.useEffect)(() => {
				const cancelOnBlur = () => {
					if (dragRef.current !== null) resetDrag();
				};
				const cancelWhenHidden = () => {
					if (document.visibilityState === "hidden") cancelOnBlur();
				};
				window.addEventListener("pointermove", moveDrag, { passive: false });
				window.addEventListener("pointerup", endDrag);
				window.addEventListener("pointercancel", cancelDrag);
				window.addEventListener("blur", cancelOnBlur);
				document.addEventListener("visibilitychange", cancelWhenHidden);
				return () => {
					window.removeEventListener("pointermove", moveDrag);
					window.removeEventListener("pointerup", endDrag);
					window.removeEventListener("pointercancel", cancelDrag);
					window.removeEventListener("blur", cancelOnBlur);
					document.removeEventListener("visibilitychange", cancelWhenHidden);
				};
			}, [
				cancelDrag,
				endDrag,
				moveDrag,
				resetDrag
			]);
			const interceptCloseControl = (event) => {
				const target = event.target instanceof Element ? event.target.closest("[data-dialog-close]") : null;
				if (target === null || !dialogRef.current?.contains(target)) return;
				event.preventDefault();
				event.stopPropagation();
				requestClose();
			};
			if (typeof document === "undefined") return null;
			return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: MnemonView_module_css_default.modalPortal,
				"data-mnemon-dialog-portal": "",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: appearanceClass(appearanceClass(MnemonView_module_css_default.modalTheme, MnemonView_module_css_default.shell), MnemonSidebarView_module_css_default.shell),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						ref: backdropRef,
						className: appearanceClass(MnemonView_module_css_default.modalBackdrop, MnemonSidebarView_module_css_default.modalBackdrop),
						onPointerDown: (event) => {
							if (event.target === event.currentTarget) requestClose();
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							ref: dialogRef,
							className: appearanceClass(appearanceClass(MnemonView_module_css_default.modal, MnemonSidebarView_module_css_default.modal), props.wide === true ? appearanceClass(MnemonView_module_css_default.modalWide, MnemonSidebarView_module_css_default.modalWide) : void 0),
							role: "dialog",
							"aria-modal": "true",
							"aria-busy": props.contentReady === false || props.busy === true ? true : void 0,
							"aria-labelledby": titleId,
							"aria-describedby": props.description === void 0 ? void 0 : descriptionId,
							onClickCapture: interceptCloseControl,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: MnemonView_module_css_default.modalDragHandle,
									"data-dialog-drag-handle": "",
									"aria-hidden": "true",
									onPointerDown: beginDrag,
									onLostPointerCapture: (event) => {
										if (dragRef.current?.pointerId === event.pointerId) resetDrag();
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									id: titleId,
									children: props.title
								}), props.description !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									id: descriptionId,
									children: props.description
								})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									ref: closeButtonRef,
									type: "button",
									className: MnemonView_module_css_default.iconButton,
									disabled: props.busy,
									onClick: requestClose,
									"aria-label": props.closeLabel,
									title: props.closeLabel,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, { size: 16 })
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: MnemonView_module_css_default.modalBody,
									children: props.children
								}),
								props.footer !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("footer", {
									className: MnemonView_module_css_default.modalFooter,
									children: props.footer
								})
							]
						})
					})
				})
			}), document.body);
		}
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/plugins/dsh-mnemon-source-runtime/presentation/page.module.css.mjs
		const css$10 = ".IIa07q_runtimeComposer{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:12px;padding:16px}.IIa07q_runtimeComposerHeading{justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px;display:flex}.IIa07q_runtimeComposerHeading h3{margin:0 0 2px;font-size:14px;font-weight:500;line-height:22px}.IIa07q_runtimeComposerHeading p{color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_runtimeComposerHeading>span{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_runtimeComposer>textarea,.IIa07q_runtimeEntry textarea{resize:vertical;border:.5px solid var(--mn-field-line);border-radius:var(--dsw-radius-md);width:100%;color:var(--mn-text);background:var(--mn-input);outline:0;padding:8px 10px;font-size:13px;line-height:20px}.IIa07q_runtimeComposer>textarea:focus,.IIa07q_runtimeEntry textarea:focus{border-color:var(--mn-accent)}.IIa07q_runtimeComposerActions{justify-content:flex-end;align-items:flex-end;gap:8px;margin-top:12px;display:flex}.IIa07q_runtimeComposerActions label{color:var(--mn-muted);gap:6px;font-size:12px;font-weight:500;line-height:18px;display:grid}.IIa07q_runtimeChoice button{min-width:136px}.IIa07q_runtimeReadOnly{border-radius:var(--dsw-radius-md);color:var(--mn-muted);background:var(--mn-fill);margin-bottom:12px;padding:8px 12px;font-size:12px;line-height:18px}.IIa07q_runtimeSummaryGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:12px;display:grid}.IIa07q_runtimeSummaryCard{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);min-width:0}.IIa07q_runtimeBrowser{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);overflow:hidden}.IIa07q_runtimeBrowserToolbar{border-bottom:.5px solid var(--mn-line);justify-content:space-between;align-items:center;gap:12px;padding:10px 12px;display:flex}.IIa07q_runtimeScopeFilter{border-radius:var(--dsw-radius-md);background:var(--mn-hover);flex-wrap:wrap;align-items:center;gap:2px;padding:3px;display:inline-flex}.IIa07q_runtimeScopeFilter button{border-radius:var(--dsw-radius-sm);min-height:28px;color:var(--mn-muted);cursor:pointer;background:0 0;border:0;padding:0 12px;font-size:13px;font-weight:500;line-height:20px}.IIa07q_runtimeScopeFilter button:hover{color:var(--mn-text)}.IIa07q_runtimeScopeFilter button[data-active]{color:var(--mn-text);background:var(--mn-layer-1);box-shadow:var(--dsw-elevation-soft)}.IIa07q_runtimeScopeFilter b{color:var(--mn-faint);font-variant-numeric:tabular-nums;margin-left:6px;font-size:12px;font-weight:400}.IIa07q_runtimeFilterQuery{width:min(320px,42%);min-width:210px}.IIa07q_runtimeUnifiedList{grid-template-columns:1fr;gap:8px;padding:12px;display:grid}.IIa07q_runtimeEntryBadges{flex-wrap:wrap;align-items:center;gap:6px;display:flex}.IIa07q_runtimeEntryMeta .IIa07q_runtimeEntryTarget{color:var(--mn-accent);background:color-mix(in srgb, var(--mn-accent) 10%, transparent)}.IIa07q_runtimeEntryMeta .IIa07q_runtimeEntryBranch{text-overflow:ellipsis;white-space:nowrap;max-width:140px;color:var(--mn-muted);background:var(--mn-fill);font-family:var(--mn-code);overflow:hidden}.IIa07q_runtimeComposerBranch{color:var(--mn-muted);gap:6px;font-size:12px;font-weight:500;line-height:18px;display:grid}.IIa07q_runtimeComposerBranch input{border:.5px solid var(--mn-field-line);border-radius:var(--dsw-radius-md);width:100%;height:36px;color:var(--mn-text);background:var(--mn-input);outline:0;padding:0 10px;font-size:13px;font-weight:400}.IIa07q_runtimeComposerBranch input:focus{border-color:var(--mn-accent)}.IIa07q_bodyEditBranch{color:var(--mn-muted);gap:6px;font-size:12px;font-weight:500;line-height:18px;display:grid}.IIa07q_bodyEditBranch input{border:.5px solid var(--mn-field-line);border-radius:var(--dsw-radius-md);width:100%;height:32px;color:var(--mn-text);background:var(--mn-input);outline:0;padding:0 10px;font-size:13px;font-weight:400}.IIa07q_bodyEditBranch input:focus{border-color:var(--mn-accent)}.IIa07q_bodyEditBranch small{color:var(--mn-faint);font-size:12px;font-weight:400}.IIa07q_runtimeTargetHeader{justify-content:space-between;align-items:center;gap:16px;padding:14px 16px 8px;display:flex}.IIa07q_runtimeTargetHeader>div{gap:0;display:grid}.IIa07q_runtimeTargetHeader span{color:var(--mn-faint);font-family:var(--mn-code);font-size:11px;line-height:16px}.IIa07q_runtimeTargetHeader h3{margin:0;font-size:14px;font-weight:500;line-height:22px}.IIa07q_runtimeTargetHeader>strong{color:var(--mn-muted);background:var(--mn-fill);font-variant-numeric:tabular-nums;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_capacityLine{align-items:center;gap:10px;padding:0 16px;display:flex}.IIa07q_capacityLine>div{background:var(--mn-fill);border-radius:999px;flex:1;height:4px;overflow:hidden}.IIa07q_capacityLine i{border-radius:inherit;background:var(--dsw-alias-brand-primary);height:100%;transition:width .25s;display:block}.IIa07q_capacityLine>span{min-width:88px;color:var(--mn-faint);text-align:right;font-variant-numeric:tabular-nums;font-size:11px}.IIa07q_runtimeTargetDescription{min-height:36px;color:var(--mn-faint);margin:8px 16px 14px;font-size:12px;line-height:18px}.IIa07q_runtimeEntry{--mn-provider-color:var(--mn-accent);border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-md);padding:12px 14px 10px;position:relative}.IIa07q_runtimeEntry[data-importance=critical]{--mn-provider-color:var(--mn-priority)}.IIa07q_runtimeEntry[data-importance=low]{--mn-provider-color:var(--mn-faint)}.IIa07q_runtimeEntry[data-focused]{border-color:color-mix(in srgb, var(--mn-accent) 60%, var(--mn-card-line));box-shadow:0 0 0 2px color-mix(in srgb, var(--mn-accent) 14%, transparent)}.IIa07q_runtimeEntryMeta{justify-content:space-between;align-items:center;gap:12px;display:flex}.IIa07q_runtimeEntryMeta>span,.IIa07q_runtimeEntryBadges>span{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_runtimeEntry[data-importance=critical] .IIa07q_runtimeEntryMeta>span,.IIa07q_runtimeEntry[data-importance=critical] .IIa07q_runtimeEntryBadges>span:not(.IIa07q_runtimeEntryTarget){color:var(--mn-warn);background:color-mix(in srgb, var(--mn-warn) 12%, transparent)}.IIa07q_runtimeEntryMeta time{color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums;font-size:11px;overflow:hidden}.IIa07q_runtimeEntry>p{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0;font-size:14px;line-height:22px}.IIa07q_runtimeEntry>select{margin-top:8px}.IIa07q_runtimeEntry footer{border-top:.5px solid var(--mn-line);justify-content:flex-end;align-items:center;gap:8px;min-height:32px;margin-top:8px;padding-top:8px;display:flex}.IIa07q_runtimeEntry footer>span{color:var(--mn-danger);margin-right:auto;font-size:12px}.IIa07q_runtimeEmpty{min-height:128px;color:var(--mn-faint);text-align:center;align-content:center;place-items:center;gap:6px;display:grid}.IIa07q_runtimeEmpty>span{font-size:20px;line-height:1}.IIa07q_runtimeEmpty p{margin:0;font-size:13px;line-height:20px}@media (width<=1000px){.IIa07q_runtimeSummaryGrid{grid-template-columns:1fr}}@media (width<=760px){.IIa07q_runtimeComposerHeading,.IIa07q_runtimeComposerActions{flex-direction:column;align-items:stretch}.IIa07q_runtimeComposerActions>*,.IIa07q_runtimeComposerActions button{width:100%}.IIa07q_runtimeBrowserToolbar{flex-direction:column;align-items:stretch}.IIa07q_runtimeFilterQuery{width:100%;min-width:0}}";
		const tagId$10 = "dsh-mnemon-source-runtime/presentation/page.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$10) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$10;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$10) tag.textContent = css$10;
		}
		var page_module_css_default$2 = {
			"bodyEditBranch": "IIa07q_bodyEditBranch",
			"capacityLine": "IIa07q_capacityLine",
			"runtimeBrowser": "IIa07q_runtimeBrowser",
			"runtimeBrowserToolbar": "IIa07q_runtimeBrowserToolbar",
			"runtimeChoice": "IIa07q_runtimeChoice",
			"runtimeComposer": "IIa07q_runtimeComposer",
			"runtimeComposerActions": "IIa07q_runtimeComposerActions",
			"runtimeComposerBranch": "IIa07q_runtimeComposerBranch",
			"runtimeComposerHeading": "IIa07q_runtimeComposerHeading",
			"runtimeEmpty": "IIa07q_runtimeEmpty",
			"runtimeEntry": "IIa07q_runtimeEntry",
			"runtimeEntryBadges": "IIa07q_runtimeEntryBadges",
			"runtimeEntryBranch": "IIa07q_runtimeEntryBranch",
			"runtimeEntryMeta": "IIa07q_runtimeEntryMeta",
			"runtimeEntryTarget": "IIa07q_runtimeEntryTarget",
			"runtimeFilterQuery": "IIa07q_runtimeFilterQuery",
			"runtimeReadOnly": "IIa07q_runtimeReadOnly",
			"runtimeScopeFilter": "IIa07q_runtimeScopeFilter",
			"runtimeSummaryCard": "IIa07q_runtimeSummaryCard",
			"runtimeSummaryGrid": "IIa07q_runtimeSummaryGrid",
			"runtimeTargetDescription": "IIa07q_runtimeTargetDescription",
			"runtimeTargetHeader": "IIa07q_runtimeTargetHeader",
			"runtimeUnifiedList": "IIa07q_runtimeUnifiedList"
		};
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/plugins/dsh-mnemon-source-runtime/presentation/sidebar.module.css.mjs
		const css$9 = "._Bh55G_shell ._Bh55G_modal form[class*=runtimeComposer]{background:0 0;border:0;border-radius:0;margin:0;padding:0}._Bh55G_shell ._Bh55G_modal form[class*=runtimeComposer]>[class*=runtimeComposerHeading]{display:none}._Bh55G_shell [class*=runtimeEntryBadges]>span{border-radius:999px;align-items:center;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;display:inline-flex}._Bh55G_shell [class*=runtimeEntryBadges]>[class*=runtimeEntryTarget]{color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);font-family:var(--dsw-font-family)}._Bh55G_shell [class*=runtimeEntry][data-importance=critical] [class*=runtimeEntryBadges]>span:last-child{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent)}";
		const tagId$9 = "dsh-mnemon-source-runtime/presentation/sidebar.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$9;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$9) tag.textContent = css$9;
		}
		var sidebar_module_css_default$2 = {
			"modal": "_Bh55G_modal",
			"shell": "_Bh55G_shell"
		};
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/plugins/dsh-mnemon-source-documents/presentation/page.module.css.mjs
		const css$8 = ".IIa07q_documentSummary{grid-template-columns:.7fr .7fr 1.6fr;gap:12px;margin-bottom:12px;display:grid}.IIa07q_documentSummary article{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);min-width:0;min-height:92px;padding:14px 16px}.IIa07q_documentSummary article>span{color:var(--mn-faint);font-size:12px;line-height:18px;display:block}.IIa07q_documentSummary article>strong{font-variant-numeric:tabular-nums;margin:4px 0 2px;font-size:20px;font-weight:500;line-height:28px;display:block}.IIa07q_documentSummary article>small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_documentCapacity>div{background:var(--mn-fill);border-radius:999px;height:4px;margin:8px 0 6px;overflow:hidden}.IIa07q_documentCapacity>div i{border-radius:inherit;background:var(--dsw-alias-brand-primary);height:100%;transition:width .3s;display:block}.IIa07q_documentToolbar{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);align-items:center;gap:8px;margin-bottom:12px;padding:8px;display:flex}.IIa07q_documentToolbar form{flex:1;align-items:center;gap:8px;min-width:260px;display:flex}.IIa07q_documentSearch{flex:1}.IIa07q_documentEditor input,.IIa07q_documentEditor textarea{border:.5px solid var(--mn-field-line);border-radius:var(--dsw-radius-md);width:100%;color:var(--mn-text);background:var(--mn-input);outline:0;padding:6px 10px;font-size:13px;line-height:20px}.IIa07q_documentEditor input:focus,.IIa07q_documentEditor textarea:focus{border-color:var(--mn-accent)}.IIa07q_documentToolbar>div{border-radius:var(--dsw-radius-md);background:var(--mn-hover);align-items:center;gap:2px;padding:3px;display:flex}.IIa07q_documentToolbar>div button{border-radius:var(--dsw-radius-sm);min-height:28px;color:var(--mn-muted);cursor:pointer;background:0 0;border:0;padding:0 12px;font-size:13px;font-weight:500;line-height:20px}.IIa07q_documentToolbar>div button:hover{color:var(--mn-text)}.IIa07q_documentToolbar>div button[data-active]{color:var(--mn-text);background:var(--mn-layer-1);box-shadow:var(--dsw-elevation-soft)}.IIa07q_documentToolbar>div b{color:var(--mn-faint);font-variant-numeric:tabular-nums;margin-left:6px;font-size:12px;font-weight:400}.IIa07q_documentWorkspace{grid-template-columns:minmax(250px,310px) minmax(0,1fr);gap:12px;min-height:590px;display:grid}.IIa07q_documentList,.IIa07q_documentReader{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);min-width:0;overflow:hidden}.IIa07q_documentList{align-self:stretch}.IIa07q_documentList>header{border-bottom:.5px solid var(--mn-line);min-height:44px;color:var(--mn-faint);justify-content:space-between;align-items:center;padding:0 14px;font-size:12px;line-height:18px;display:flex}.IIa07q_documentList>header code{color:var(--mn-muted)}.IIa07q_documentList>button{--mn-provider-color:var(--mn-faint);border-radius:var(--dsw-radius-md);width:calc(100% - 12px);color:var(--mn-text);text-align:left;cursor:pointer;background:0 0;border:0;margin:6px 6px 0;padding:10px 12px;transition:background-color .15s;display:block}.IIa07q_documentList>button:hover{background:var(--mn-hover)}.IIa07q_documentList>button[data-selected]{background:var(--mn-fill)}.IIa07q_documentList>button>div{justify-content:space-between;align-items:baseline;gap:12px;display:flex}.IIa07q_documentList>button strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}.IIa07q_documentList>button time{color:var(--mn-faint);font-variant-numeric:tabular-nums;flex:none;font-size:11px}.IIa07q_documentList>button p{color:var(--mn-faint);-webkit-line-clamp:2;-webkit-box-orient:vertical;margin:4px 0 6px;font-size:12px;line-height:18px;display:-webkit-box;overflow:hidden}.IIa07q_documentList>button footer{color:var(--mn-faint);align-items:center;gap:8px;font-size:11px;line-height:16px;display:flex}.IIa07q_documentList>button footer code{margin-left:auto}.IIa07q_documentList>button footer em{color:var(--mn-danger);font-style:normal}.IIa07q_documentListEmpty{min-height:230px;color:var(--mn-muted);text-align:center;align-content:center;place-items:center;gap:4px;padding:24px;display:grid}.IIa07q_documentListEmpty>span{color:var(--mn-faint);margin-bottom:6px;font-size:24px;line-height:1}.IIa07q_documentListEmpty p{color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_documentReader{padding:clamp(16px,2vw,24px)}.IIa07q_documentReader>.IIa07q_emptyState{background:0 0;border:0;height:100%}.IIa07q_documentDetail>header{border-bottom:.5px solid var(--mn-line);justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:14px;display:flex}.IIa07q_documentDetail>header span{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_documentDetail>header h3{margin:2px 0;font-size:16px;font-weight:500;line-height:24px}.IIa07q_documentDetail>header p{color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_documentDetail>dl{border:.5px solid var(--mn-line);border-radius:var(--dsw-radius-md);grid-template-columns:2fr .45fr .8fr .55fr;margin:12px 0;display:grid;overflow:hidden}.IIa07q_documentDetail>dl>div{min-width:0;padding:8px 10px}.IIa07q_documentDetail>dl>div+div{border-left:.5px solid var(--mn-line)}.IIa07q_documentDetail dt{color:var(--mn-faint);margin-bottom:2px;font-size:11px;line-height:16px}.IIa07q_documentDetail dd{text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_documentSources{flex-wrap:wrap;align-items:center;gap:6px;margin:12px 0;display:flex}.IIa07q_documentSources>span{color:var(--mn-faint);margin-right:4px;font-size:12px}.IIa07q_documentSources code,.IIa07q_documentArchiveReceipt code{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px}.IIa07q_markdownBody{overflow-wrap:anywhere;border:.5px solid var(--mn-line);border-radius:var(--dsw-radius-md);min-height:310px;color:var(--mn-text);margin:16px 0 0;padding:clamp(16px,2.5vw,28px);font-size:14px;line-height:1.75}.IIa07q_markdownBody>:first-child{margin-top:0}.IIa07q_markdownBody>:last-child{margin-bottom:0}.IIa07q_markdownBody h1,.IIa07q_markdownBody h2,.IIa07q_markdownBody h3,.IIa07q_markdownBody h4{color:var(--mn-text);margin:1.5em 0 .6em;font-weight:500;line-height:1.35}.IIa07q_markdownBody h1{border-bottom:.5px solid var(--mn-line);padding-bottom:.35em;font-size:1.6em}.IIa07q_markdownBody h2{border-bottom:.5px solid var(--mn-line);padding-bottom:.3em;font-size:1.35em}.IIa07q_markdownBody h3{font-size:1.15em}.IIa07q_markdownBody p,.IIa07q_markdownBody ul,.IIa07q_markdownBody ol,.IIa07q_markdownBody blockquote,.IIa07q_markdownBody table,.IIa07q_markdownBody pre{margin:.85em 0}.IIa07q_markdownBody ul,.IIa07q_markdownBody ol{padding-left:1.6em}.IIa07q_markdownBody li+li{margin-top:.3em}.IIa07q_markdownBody blockquote{border-left:2px solid var(--mn-line-strong);color:var(--mn-muted);margin-inline:0;padding:.1em 1em}.IIa07q_markdownBody code{border-radius:var(--dsw-radius-xs);color:var(--mn-text);background:var(--dsw-alias-markdown-inline-code,var(--mn-fill));font:.88em/1.55 var(--mn-code);padding:.15em .4em}.IIa07q_markdownBody pre{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-markdown-code-block,var(--mn-fill));max-width:100%;padding:12px 16px;overflow:auto}.IIa07q_markdownBody pre code{background:0 0;padding:0;font-size:12px}.IIa07q_markdownBody a{color:var(--dsw-alias-link,var(--mn-accent));text-underline-offset:3px;text-decoration-thickness:1px}.IIa07q_markdownBody hr{border:0;border-top:.5px solid var(--mn-line);margin:1.8em 0}.IIa07q_markdownBody table{border-collapse:collapse;max-width:100%;display:block;overflow-x:auto}.IIa07q_markdownBody th,.IIa07q_markdownBody td{border:.5px solid var(--mn-line);text-align:left;vertical-align:top;padding:8px 10px}.IIa07q_markdownBody th{background:var(--mn-fill);font-weight:500}.IIa07q_markdownBody img{border-radius:var(--dsw-radius-sm);max-width:100%;height:auto}.IIa07q_documentArchiveReceipt{border-radius:var(--dsw-radius-md);background:color-mix(in srgb, var(--mn-success) 8%, transparent);margin:12px 0;padding:10px 12px}.IIa07q_documentArchiveReceipt p{color:var(--mn-muted);margin:2px 0 8px;font-size:12px;line-height:18px}.IIa07q_documentArchiveReceipt div{flex-wrap:wrap;gap:6px;display:flex}.IIa07q_documentDanger{border-top:.5px solid var(--mn-line);justify-content:flex-end;align-items:center;gap:8px;min-height:56px;margin-top:12px;padding-top:12px;display:flex}.IIa07q_documentDanger>div{margin-right:auto}.IIa07q_documentDanger strong{font-size:13px;font-weight:500;line-height:20px;display:block}.IIa07q_documentDanger p{color:var(--mn-faint);margin:2px 0 0;font-size:12px;line-height:18px}.IIa07q_documentDanger>span{color:var(--mn-danger);margin-right:auto;font-size:12px}.IIa07q_documentEditor{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:12px;padding:16px}.IIa07q_documentReader>.IIa07q_documentEditor{background:0 0;border:0;margin:0;padding:0}.IIa07q_documentEditor>header{justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px;display:flex}.IIa07q_documentEditor h3{margin:0;font-size:14px;font-weight:500;line-height:22px}.IIa07q_documentEditor header p{color:var(--mn-faint);margin:2px 0 0;font-size:12px;line-height:18px}.IIa07q_documentEditor header>span,.IIa07q_documentEditor header>code{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_documentEditor label{color:var(--mn-muted);gap:6px;margin-top:12px;font-size:12px;font-weight:500;line-height:18px;display:grid}.IIa07q_documentEditor textarea{resize:vertical;line-height:1.65}.IIa07q_documentEditorMeta{grid-template-columns:.8fr 1.2fr;gap:12px;display:grid}.IIa07q_documentEditorMeta label{margin:0}.IIa07q_documentEditor footer{justify-content:flex-end;gap:8px;margin-top:12px;display:flex}@media (width<=1000px){.IIa07q_documentWorkspace{grid-template-columns:minmax(220px,270px) minmax(0,1fr)}.IIa07q_documentDetail>dl{grid-template-columns:repeat(2,minmax(0,1fr))}.IIa07q_documentDetail>dl>div+div{border-left:0}.IIa07q_documentDetail>dl>div:nth-child(2n){border-left:.5px solid var(--mn-line)}.IIa07q_documentDetail>dl>div:nth-child(n+3){border-top:.5px solid var(--mn-line)}}@media (width<=760px){.IIa07q_documentSummary{grid-template-columns:repeat(2,minmax(0,1fr))}.IIa07q_documentCapacity{grid-column:1/-1}.IIa07q_documentToolbar{flex-direction:column;align-items:stretch}.IIa07q_documentToolbar form{min-width:0}.IIa07q_documentToolbar>div,.IIa07q_documentToolbar>button{width:100%}.IIa07q_documentToolbar>div button{flex:1}.IIa07q_documentWorkspace{grid-template-columns:1fr;min-height:0}.IIa07q_documentList{-webkit-overflow-scrolling:touch;max-height:330px;overflow:auto}.IIa07q_documentReader{min-height:430px}.IIa07q_documentEditorMeta{grid-template-columns:1fr}}@media (width<=520px){.IIa07q_documentDetail>header,.IIa07q_documentDanger{flex-direction:column;align-items:flex-start}.IIa07q_documentDetail>header>div:last-child,.IIa07q_documentDetail>header button{width:100%}.IIa07q_documentDanger>div,.IIa07q_documentDanger>span{margin-right:0}.IIa07q_documentDanger>button{width:100%}.IIa07q_documentDetail>dl{grid-template-columns:1fr}.IIa07q_documentDetail>dl>div:nth-child(2n){border-left:0}.IIa07q_documentDetail>dl>div+div{border-top:.5px solid var(--mn-line)}.IIa07q_markdownBody{padding:16px;font-size:13px}}";
		const tagId$8 = "dsh-mnemon-source-documents/presentation/page.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$8) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$8;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$8) tag.textContent = css$8;
		}
		var page_module_css_default$1 = {
			"documentArchiveReceipt": "IIa07q_documentArchiveReceipt",
			"documentCapacity": "IIa07q_documentCapacity",
			"documentDanger": "IIa07q_documentDanger",
			"documentDetail": "IIa07q_documentDetail",
			"documentEditor": "IIa07q_documentEditor",
			"documentEditorMeta": "IIa07q_documentEditorMeta",
			"documentList": "IIa07q_documentList",
			"documentListEmpty": "IIa07q_documentListEmpty",
			"documentReader": "IIa07q_documentReader",
			"documentSearch": "IIa07q_documentSearch",
			"documentSources": "IIa07q_documentSources",
			"documentSummary": "IIa07q_documentSummary",
			"documentToolbar": "IIa07q_documentToolbar",
			"documentWorkspace": "IIa07q_documentWorkspace",
			"emptyState": "IIa07q_emptyState",
			"markdownBody": "IIa07q_markdownBody"
		};
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/plugins/dsh-mnemon-source-documents/presentation/sidebar.module.css.mjs
		const css$7 = "._Bh55G_shell ._Bh55G_modal form[class*=documentEditor]{background:0 0;border:0;border-radius:0;margin:0;padding:0}._Bh55G_shell ._Bh55G_modal form[class*=documentEditor]>header{display:none}._Bh55G_shell [class*=documentWorkspace]{align-items:stretch;height:clamp(520px,100dvh - 220px,760px);min-height:520px}._Bh55G_shell [class*=documentList],._Bh55G_shell [class*=documentReader]{overscroll-behavior:contain;scrollbar-gutter:stable;min-height:0;overflow-y:auto}@media (width<=760px){._Bh55G_shell [class*=documentWorkspace]{height:auto;min-height:0}._Bh55G_shell [class*=documentList]{scrollbar-gutter:auto;overflow-y:auto}._Bh55G_shell [class*=documentReader]{scrollbar-gutter:auto;overflow:visible}}";
		const tagId$7 = "dsh-mnemon-source-documents/presentation/sidebar.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$7;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$7) tag.textContent = css$7;
		}
		var sidebar_module_css_default$1 = {
			"modal": "_Bh55G_modal",
			"shell": "_Bh55G_shell"
		};
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/plugins/dsh-mnemon-source-memory-spaces/presentation/page.module.css.mjs
		const css$6 = ".IIa07q_entityHeading>span,.IIa07q_inspectorHeading>span{color:var(--mn-faint);font-size:12px;font-weight:500;line-height:18px}.IIa07q_memoryHeaderActions{align-items:center;gap:8px;display:flex}.IIa07q_memoryHeaderActions>button{white-space:nowrap}.IIa07q_asyncRegion{min-width:0;position:relative}.IIa07q_asyncResults{min-width:0;min-height:120px;position:relative}.IIa07q_asyncPlaceholder{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);min-height:220px;color:var(--mn-faint);place-items:center;display:grid;position:relative}.IIa07q_muted{color:var(--mn-faint);padding:16px 0;font-size:13px}.IIa07q_readSources{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);gap:8px;margin:0 0 16px;padding:12px 14px;display:grid}.IIa07q_readSources>header{justify-content:space-between;align-items:flex-start;gap:16px;display:flex}.IIa07q_readSources>header>div{gap:2px;display:grid}.IIa07q_readSources>header strong{font-size:13px;font-weight:500;line-height:20px}.IIa07q_readSources>header p{max-width:92ch;color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_readSources>header>button{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-sm);min-height:28px;color:var(--mn-text);cursor:pointer;background:0 0;flex:none;padding:0 10px;font-size:12px;line-height:18px}.IIa07q_readSources>header>button:hover{background:var(--mn-hover)}.IIa07q_readSources>header>button[data-selected]{background:var(--mn-fill);border-color:#0000}.IIa07q_readSources>div{grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:8px;display:grid}.IIa07q_readSourceCard,.IIa07q_bodyCard,.IIa07q_metadataList>label{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-md);color:var(--mn-text);background:0 0}.IIa07q_readSourceCard{text-align:left;grid-template-columns:6px minmax(0,1fr) auto;align-items:center;gap:10px;min-width:0;min-height:56px;padding:8px 10px 8px 12px;display:grid}button.IIa07q_readSourceCard{cursor:pointer}button.IIa07q_readSourceCard:hover{background:var(--mn-hover)}.IIa07q_readSourceCard[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_readSourceSignal{background:var(--mn-success);border-radius:50%;width:6px;height:6px}.IIa07q_readSourceCard[data-mode=projection] .IIa07q_readSourceSignal,.IIa07q_readSourceCard[data-mode=enumerable] .IIa07q_readSourceSignal{background:var(--mn-success)}.IIa07q_readSourceCard[data-mode=query-only] .IIa07q_readSourceSignal{background:var(--mn-warn)}.IIa07q_readSourceCard[data-status=unavailable] .IIa07q_readSourceSignal{background:var(--mn-danger)}.IIa07q_readSourceCard[data-status=unsupported] .IIa07q_readSourceSignal,.IIa07q_readSourceCard[data-status=empty] .IIa07q_readSourceSignal{background:var(--mn-idle)}.IIa07q_readSourceCard[data-status=unsupported]{color:var(--mn-faint)}.IIa07q_readSourceIdentity,.IIa07q_readSourceState{gap:2px;min-width:0;display:grid}.IIa07q_readSourceIdentity strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}.IIa07q_readSourceMeta{align-items:center;gap:6px;min-width:0;display:flex}.IIa07q_readSourceMeta>small{color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_readSourceState{text-align:right;justify-items:end}.IIa07q_readSourceState em{width:fit-content;color:var(--mn-muted);background:var(--mn-fill);white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:11px;font-style:normal;font-weight:500;line-height:17px}.IIa07q_readSourceCard[data-status=unsupported] .IIa07q_readSourceState em{border:.5px solid var(--mn-field-line);color:var(--mn-faint);background:0 0}.IIa07q_readSourceState small{color:var(--mn-faint);white-space:nowrap;font-size:11px;line-height:14px}.IIa07q_bodyDirectory{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:12px;padding:16px;position:relative}.IIa07q_bodyDirectoryHeader{flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px;display:flex}.IIa07q_bodyDirectoryHeader>div:first-child{flex:260px;min-width:0}.IIa07q_bodyDirectoryHeader h3{margin:0;font-size:13px;font-weight:500;line-height:20px}.IIa07q_bodyDirectoryHeader p{color:var(--mn-faint);margin:2px 0 0;font-size:12px;line-height:18px}.IIa07q_bodyDirectoryPath{max-width:100%;color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;margin-top:4px;font-size:11px;line-height:16px;display:block;overflow:hidden}.IIa07q_bodyDirectoryControls{flex:none;justify-content:flex-end;align-items:center;gap:8px;padding-right:28px;display:flex}.IIa07q_bodyDirectoryControls>strong{color:var(--mn-muted);background:var(--mn-fill);font-variant-numeric:tabular-nums;border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_bodyGrid{grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:8px;display:grid}.IIa07q_bodyDirectoryEmpty{border-radius:var(--dsw-radius-md);min-height:96px;color:var(--mn-muted);background:var(--mn-fill);grid-column:1/-1;justify-content:center;align-items:center;gap:12px;display:flex}.IIa07q_bodyDirectoryEmpty>span{color:var(--mn-faint);font-size:24px}.IIa07q_bodyDirectoryEmpty strong{color:var(--mn-text);font-weight:500;display:block}.IIa07q_bodyDirectoryEmpty p{color:var(--mn-faint);margin:2px 0 0;font-size:12px}.IIa07q_bodyCard{--mn-body-accent:var(--mn-success);min-width:0;padding:12px 14px;transition:border-color .16s,background-color .16s}.IIa07q_bodyCard:not([data-active]){background:var(--mn-fill);border-color:#0000}.IIa07q_bodyCard[data-reconnectable]{cursor:pointer}.IIa07q_bodyCard[data-reconnectable]:hover{border-color:var(--mn-field-line)}.IIa07q_bodyCard[data-reconnectable]:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--mn-focus);outline-offset:2px}.IIa07q_bodySignal{background:var(--mn-idle);border-radius:50%;width:6px;height:6px}.IIa07q_bodyCard[data-active] .IIa07q_bodySignal{background:var(--mn-body-accent)}.IIa07q_bodyCard:not([data-healthy]) .IIa07q_bodySignal{background:var(--mn-danger)}.IIa07q_bodyCard[data-status-loading] .IIa07q_bodySignal{background:var(--mn-idle)}.IIa07q_bodyCard[data-reconnecting] .IIa07q_bodySignal{box-sizing:border-box;border:1.5px solid color-mix(in srgb, var(--mn-faint) 25%, transparent);border-top-color:var(--mn-faint);background:0 0;width:8px;height:8px;animation:.9s linear infinite IIa07q_mnemon-spin}.IIa07q_bodyHealth{color:var(--mn-success);font-size:12px;line-height:18px}.IIa07q_bodyCard:not([data-healthy]) .IIa07q_bodyHealth{color:var(--mn-danger)}.IIa07q_bodyCard[data-status-loading] .IIa07q_bodyHealth{color:var(--mn-faint)}.IIa07q_mnemonDefaultBadge{width:fit-content;color:var(--mn-accent);background:color-mix(in srgb, var(--mn-accent) 10%, transparent);white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_providerBadge{width:fit-content;max-width:100%;color:var(--mn-muted);background:var(--mn-fill);text-align:center;text-overflow:ellipsis;vertical-align:middle;white-space:nowrap;border-radius:999px;flex:none;justify-content:center;align-items:center;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;display:inline-flex;overflow:hidden}.IIa07q_providerBadge,.IIa07q_readSourceCard,.IIa07q_bodyCard,.IIa07q_metadataList>label,.IIa07q_graphNode,.IIa07q_providerBadge[data-provider=mnemon-native],.IIa07q_readSourceCard[data-provider=mnemon-native],.IIa07q_bodyCard[data-provider=mnemon-native],.IIa07q_metadataList>label[data-provider=mnemon-native],.IIa07q_graphNode[data-provider=mnemon-native]{--mn-provider-color:#64748b}.IIa07q_providerBadge[data-provider=openviking],.IIa07q_readSourceCard[data-provider=openviking],.IIa07q_bodyCard[data-provider=openviking],.IIa07q_metadataList>label[data-provider=openviking],.IIa07q_graphNode[data-provider=openviking]{--mn-provider-color:#3b82d0}.IIa07q_providerBadge[data-provider=honcho],.IIa07q_readSourceCard[data-provider=honcho],.IIa07q_bodyCard[data-provider=honcho],.IIa07q_metadataList>label[data-provider=honcho],.IIa07q_graphNode[data-provider=honcho]{--mn-provider-color:#c44fcf}.IIa07q_providerBadge[data-provider=mem0],.IIa07q_readSourceCard[data-provider=mem0],.IIa07q_bodyCard[data-provider=mem0],.IIa07q_metadataList>label[data-provider=mem0],.IIa07q_graphNode[data-provider=mem0]{--mn-provider-color:#8b5cf6}.IIa07q_providerBadge[data-provider=hindsight],.IIa07q_readSourceCard[data-provider=hindsight],.IIa07q_bodyCard[data-provider=hindsight],.IIa07q_metadataList>label[data-provider=hindsight],.IIa07q_graphNode[data-provider=hindsight]{--mn-provider-color:#0891b2}.IIa07q_providerBadge[data-provider=holographic],.IIa07q_readSourceCard[data-provider=holographic],.IIa07q_bodyCard[data-provider=holographic],.IIa07q_metadataList>label[data-provider=holographic],.IIa07q_graphNode[data-provider=holographic]{--mn-provider-color:#6366d9}.IIa07q_providerBadge[data-provider=retaindb],.IIa07q_readSourceCard[data-provider=retaindb],.IIa07q_bodyCard[data-provider=retaindb],.IIa07q_metadataList>label[data-provider=retaindb],.IIa07q_graphNode[data-provider=retaindb]{--mn-provider-color:#d08a28}.IIa07q_providerBadge[data-provider=byterover],.IIa07q_readSourceCard[data-provider=byterover],.IIa07q_bodyCard[data-provider=byterover],.IIa07q_metadataList>label[data-provider=byterover],.IIa07q_graphNode[data-provider=byterover]{--mn-provider-color:#0f9a83}.IIa07q_providerBadge[data-provider=supermemory],.IIa07q_readSourceCard[data-provider=supermemory],.IIa07q_bodyCard[data-provider=supermemory],.IIa07q_metadataList>label[data-provider=supermemory],.IIa07q_graphNode[data-provider=supermemory]{--mn-provider-color:#df4d72}.IIa07q_bodySwitch{min-height:28px;color:var(--mn-faint);cursor:pointer;background:0 0;border:0;align-items:center;gap:8px;padding:0;font-size:12px;line-height:18px;display:flex}.IIa07q_bodySwitchTrack{box-sizing:border-box;background:var(--mn-line-strong);border-radius:999px;flex:none;width:36px;height:20px;padding:2px;transition:background-color .12s;position:relative}.IIa07q_bodySwitchTrack i{background:var(--dsw-alias-label-primary-foreground);border-radius:50%;width:16px;height:16px;transition:transform .12s;display:block}.IIa07q_bodySwitch:hover,.IIa07q_bodySwitch[aria-checked=true]{color:var(--mn-muted)}.IIa07q_bodySwitch[aria-checked=true] .IIa07q_bodySwitchTrack{background:var(--dsw-alias-brand-primary)}.IIa07q_bodySwitch[aria-checked=true] .IIa07q_bodySwitchTrack i{transform:translate(16px)}.IIa07q_bodyCardActions{align-items:center;gap:8px;display:flex}.IIa07q_bodyCreateForm{gap:16px;padding-top:0}.IIa07q_createSection{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);gap:12px;padding:14px 16px;display:grid}.IIa07q_createSectionHeading{align-items:flex-start;gap:10px;display:flex}.IIa07q_createSectionHeading>span{min-width:22px;height:22px;color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;flex:none;place-items:center;padding:0 6px;font-size:11px;font-weight:500;line-height:1;display:grid}.IIa07q_createSectionHeading>div{gap:2px;min-width:0;display:grid}.IIa07q_createSectionHeading strong{color:var(--mn-text);font-size:14px;font-weight:500;line-height:22px}.IIa07q_createSectionHeading small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_createIdentityGrid{grid-template-columns:minmax(0,1fr);align-items:stretch;gap:12px;display:grid}.IIa07q_createIdentityGrid>label{align-content:start}.IIa07q_createIdentityGrid textarea{min-height:72px}.IIa07q_strategyForm{gap:16px;padding-top:0}.IIa07q_strategyLoading{border-radius:var(--dsw-radius-md);min-height:88px;color:var(--mn-faint);background:var(--mn-fill);justify-content:center;align-items:center;font-size:12px;display:flex;position:relative}.IIa07q_strategyLoading .IIa07q_sectionSpinner{top:10px;right:10px}.IIa07q_placementMode{border:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0;padding:0;display:grid}.IIa07q_placementMode legend{color:var(--mn-muted);margin-bottom:6px;font-size:12px;font-weight:500;line-height:18px}.IIa07q_placementMode label{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-md);cursor:pointer;grid-template-columns:16px minmax(0,1fr);align-items:center;gap:10px;min-width:0;padding:12px;display:grid;position:relative}.IIa07q_placementMode label:hover{background:var(--mn-hover)}.IIa07q_placementMode label[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_placementMode label[data-disabled]{cursor:not-allowed;opacity:.5}.IIa07q_placementMode input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_placementMode span{gap:2px;display:grid}.IIa07q_placementMode strong{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_placementMode strong em{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;margin-left:6px;padding:1px 8px;font-size:11px;font-style:normal;font-weight:500;line-height:17px}.IIa07q_placementMode small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_placementPolicy{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-md);gap:10px;margin:0;padding:12px 14px;display:grid}.IIa07q_placementPolicyHeading{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.IIa07q_placementPolicyHeading>div{gap:2px;display:grid}.IIa07q_placementPolicyHeading strong{font-size:13px;font-weight:500;line-height:20px}.IIa07q_placementPolicyHeading small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_placementPolicyHeading>span{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_placementRuleGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;display:grid}.IIa07q_capabilityRules{border:0;flex-wrap:wrap;gap:6px;margin:0;padding:0;display:flex}.IIa07q_capabilityRules legend{width:100%;color:var(--mn-faint);margin-bottom:4px;font-size:12px;line-height:18px}.IIa07q_capabilityRules label{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-sm);width:fit-content;min-height:28px;color:var(--mn-muted);cursor:pointer;align-items:center;gap:6px;padding:0 10px;font-size:12px;display:flex;position:relative}.IIa07q_capabilityRules label:hover{background:var(--mn-hover)}.IIa07q_capabilityRules label[data-selected]{border-color:var(--mn-field-line);color:var(--mn-text);background:var(--mn-fill)}.IIa07q_capabilityRules input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_placementCandidates{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;display:grid}.IIa07q_placementCandidates>span,.IIa07q_placementCandidates>label{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-md);grid-template-columns:28px minmax(0,1fr) 16px;align-items:center;gap:10px;min-width:0;padding:8px 10px;display:grid;position:relative}.IIa07q_placementCandidates>label{cursor:pointer}.IIa07q_placementCandidates>label:hover{background:var(--mn-hover)}.IIa07q_placementCandidates>[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_placementCandidates>label[data-disabled]{cursor:not-allowed;opacity:.5}.IIa07q_placementCandidates input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_placementCandidates>span>span:not(.IIa07q_candidateIcon),.IIa07q_placementCandidates>label>span:not(.IIa07q_candidateIcon){gap:2px;min-width:0;display:grid}.IIa07q_placementCandidates strong{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_placementCandidates small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_providerChoice{border:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0;padding:0;display:grid}.IIa07q_providerChoice legend{color:var(--mn-muted);margin-bottom:6px;font-size:12px;font-weight:500;line-height:18px}.IIa07q_providerChoice label{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-md);cursor:pointer;grid-template-columns:32px minmax(0,1fr) 16px;align-items:center;gap:10px;min-width:0;padding:10px 12px;display:grid;position:relative}.IIa07q_providerChoice label:hover{background:var(--mn-hover)}.IIa07q_providerChoice label[data-native]{grid-column:1/-1}.IIa07q_providerChoice label[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_providerChoice label[data-disabled]{cursor:not-allowed;opacity:.5}.IIa07q_providerChoice input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_providerChoice span{gap:2px;display:grid}.IIa07q_providerChoice strong{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_providerChoice strong em{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;margin-left:6px;padding:1px 8px;font-size:11px;font-style:normal;font-weight:500;line-height:17px}.IIa07q_providerChoice label[data-selected] strong em{background:var(--mn-layer-1)}.IIa07q_providerChoice small{color:var(--mn-faint);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:12px;line-height:18px;display:-webkit-box;overflow:hidden}.IIa07q_providerChoiceIcon,.IIa07q_candidateIcon,.IIa07q_providerFieldIcon{box-sizing:border-box;border:.5px solid var(--mn-line-strong);background:var(--mn-layer-1);place-items:center;display:grid;overflow:hidden}.IIa07q_providerChoiceIcon{border-radius:var(--dsw-radius-sm);width:32px;height:32px;padding:4px}.IIa07q_candidateIcon{border-radius:var(--dsw-radius-sm);width:28px;height:28px;padding:4px}.IIa07q_providerFieldIcon{border-radius:var(--dsw-radius-sm);flex:none;width:32px;height:32px;padding:4px}.IIa07q_providerChoiceIcon>img,.IIa07q_providerChoiceIcon>svg,.IIa07q_candidateIcon>img,.IIa07q_candidateIcon>svg,.IIa07q_providerFieldIcon>img,.IIa07q_providerFieldIcon>svg{object-fit:contain;border-radius:4px;width:100%;height:100%;display:block}.IIa07q_choiceControl{box-sizing:border-box;border:1px solid var(--mn-field-line);background:var(--mn-layer-1);border-radius:4px;flex:none;place-items:center;width:16px;height:16px;display:grid;position:relative}.IIa07q_choiceControl[data-kind=radio]{border-radius:50%}[data-selected]>.IIa07q_choiceControl{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary)}[data-selected]>.IIa07q_choiceControl[data-kind=check]:after{border-bottom:1.5px solid var(--dsw-alias-label-primary-foreground);border-left:1.5px solid var(--dsw-alias-label-primary-foreground);content:\"\";width:7px;height:4px;transform:translateY(-1px)rotate(-45deg)}[data-selected]>.IIa07q_choiceControl[data-kind=radio]:after{content:\"\";background:var(--dsw-alias-label-primary-foreground);border-radius:50%;width:6px;height:6px}.IIa07q_placementMode label:has(input:focus-visible),.IIa07q_providerChoice label:has(input:focus-visible),.IIa07q_capabilityRules label:has(input:focus-visible),.IIa07q_placementCandidates label:has(input:focus-visible){outline:var(--dsw-focus-ring-width,2px) solid var(--mn-focus);outline-offset:1px}.IIa07q_providerFields{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-md);gap:10px;padding:12px 14px;display:grid}.IIa07q_providerFieldHeading{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.IIa07q_providerFieldIdentity{align-items:center;gap:10px;min-width:0;display:flex}.IIa07q_providerFieldIdentity>div{gap:2px;min-width:0;display:grid}.IIa07q_providerFieldHeading strong{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_providerFieldHeading small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_providerFieldHeading>span{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_providerFields details{min-width:0}.IIa07q_providerFields summary{width:fit-content;color:var(--mn-muted);cursor:pointer;font-size:12px;line-height:18px}.IIa07q_providerFields summary:hover{color:var(--mn-text)}.IIa07q_providerEnableHint{color:var(--mn-faint);margin-top:8px;font-size:12px;line-height:18px;display:block}.IIa07q_providerAdvancedGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:8px;display:grid}.IIa07q_providerFieldControl .IIa07q_providerSecretClear{color:var(--mn-muted);cursor:pointer;align-items:center;gap:6px;font-size:12px;font-weight:400;display:flex}.IIa07q_providerWriteHint{color:var(--mn-faint);margin-top:4px;font-size:12px;line-height:18px;display:block}.IIa07q_placementReceipt{border-radius:var(--dsw-radius-sm);min-width:0;color:var(--mn-muted);background:var(--mn-fill);align-items:flex-start;gap:8px;margin:8px 0;padding:8px 10px;display:flex}.IIa07q_placementReceipt>span{flex:none;font-size:12px}.IIa07q_placementReceipt>div{grid-template-columns:minmax(0,1fr) auto;gap:2px 8px;min-width:0;display:grid}.IIa07q_placementReceipt strong,.IIa07q_placementReceipt small{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.IIa07q_placementReceipt strong{color:var(--mn-text);font-size:12px;font-weight:500;line-height:18px}.IIa07q_placementReceipt small{color:var(--mn-faint);font-size:11px;line-height:18px}.IIa07q_placementReceipt p{color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;grid-column:1/-1;margin:0;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_bodyCard>p{min-height:18px;color:var(--mn-muted);margin:8px 0;font-size:13px;line-height:20px}.IIa07q_bodyCard footer{border-top:.5px solid var(--mn-line);min-width:0;color:var(--mn-faint);flex-wrap:nowrap;gap:4px 12px;padding-top:8px;font-size:12px;line-height:18px;display:flex;overflow:hidden}.IIa07q_bodyFooterBlock{text-overflow:ellipsis;white-space:nowrap;flex:0 auto;min-width:0;display:block;overflow:hidden}.IIa07q_bodyFooterGrow{flex:auto}.IIa07q_graphLayout{grid-template-columns:minmax(0,1fr) minmax(240px,280px);gap:12px;display:grid}.IIa07q_graphPanel,.IIa07q_graphInspector{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg)}.IIa07q_graphPanel{min-width:0;position:relative;overflow:hidden}.IIa07q_graphToolbar,.IIa07q_graphFooter{min-height:44px;color:var(--mn-faint);justify-content:space-between;align-items:center;gap:16px;padding:0 14px;font-size:12px;line-height:18px;display:flex}.IIa07q_graphToolbar{border-bottom:.5px solid var(--mn-line)}.IIa07q_graphToolbar>div:first-child{align-items:center;gap:8px;display:flex}.IIa07q_graphToolbar small{color:var(--mn-faint)}.IIa07q_liveDot{background:var(--mn-success);border-radius:50%;width:6px;height:6px}.IIa07q_graphLegend{flex-wrap:wrap;justify-content:flex-end;gap:4px 12px;display:flex}.IIa07q_graphLegend span{align-items:center;gap:6px;display:flex}.IIa07q_graphLegend span:before{content:\"\";background:var(--edge-color);border-radius:2px;width:14px;height:2px}.IIa07q_graphLegend [data-edge=temporal]{--edge-color:#87909f}.IIa07q_graphLegend [data-edge=scope]{--edge-color:#708199}.IIa07q_graphLegend [data-edge=scope]:before{background:repeating-linear-gradient(90deg, var(--edge-color) 0 4px, transparent 4px 7px)}.IIa07q_graphLegend [data-edge=semantic]{--edge-color:#4d7cfe}.IIa07q_graphLegend [data-edge=causal]{--edge-color:#ef6b5b}.IIa07q_graphLegend [data-edge=entity]{--edge-color:#22a879}.IIa07q_graphViewport{min-height:clamp(390px,42vw,560px);position:relative;overflow:hidden}.IIa07q_graphCanvasControls{z-index:2;border-radius:var(--dsw-radius-md);background:var(--dsw-specific-menu,var(--mn-layer-2));box-shadow:var(--dsw-elevation-soft);backdrop-filter:var(--dsw-menu-backdrop-filter);align-items:center;gap:4px;padding:4px;display:flex;position:absolute;top:10px;right:10px}.IIa07q_graphCanvasControls span{color:var(--mn-faint);align-items:center;gap:6px;padding:0 6px;font-size:12px;display:flex}.IIa07q_graphCanvasControls span i{background:var(--mn-accent);border-radius:50%;width:6px;height:6px}.IIa07q_graphCanvasControls button{border-radius:var(--dsw-radius-sm);min-height:28px;color:var(--mn-muted);cursor:pointer;background:0 0;border:0;padding:0 10px;font-size:12px}.IIa07q_graphCanvasControls button:hover{color:var(--mn-text);background:var(--mn-hover)}.IIa07q_graphCanvasControls button[data-active]{color:var(--mn-text);background:var(--mn-fill)}.IIa07q_graphSvg{touch-action:pan-y pinch-zoom;user-select:none;width:100%;height:clamp(390px,42vw,560px);display:block}.IIa07q_graphBackdrop{fill:var(--mn-layer-1)}.IIa07q_graphGridLine{stroke:var(--mn-line);stroke-width:.6px;opacity:.5}.IIa07q_graphEdge{fill:none;stroke:#87909f;stroke-width:1px;opacity:.32;vector-effect:non-scaling-stroke}.IIa07q_graphEdge[data-edge=scope]{stroke:#708199;stroke-dasharray:4 5;opacity:.28}.IIa07q_graphEdge[data-edge=semantic]{stroke:#4d7cfe;opacity:.48}.IIa07q_graphEdge[data-edge=causal]{stroke:#ef6b5b;opacity:.52}.IIa07q_graphEdge[data-edge=entity]{stroke:#22a879;stroke-width:1.45px;opacity:.78}.IIa07q_graphNode{--node:#8290a8;cursor:grab;touch-action:none;outline:none}.IIa07q_graphNode[data-dragging]{cursor:grabbing}.IIa07q_graphNode[data-category=decision]{--node:#ef8354}.IIa07q_graphNode[data-category=preference]{--node:#a879e1}.IIa07q_graphNode[data-category=fact]{--node:#4d7cfe}.IIa07q_graphNode[data-category=insight]{--node:#19a77d}.IIa07q_graphNode[data-category=context]{--node:#d8a624}.IIa07q_graphNode[data-kind=space]{--node:var(--mn-provider-color)}.IIa07q_graphNode[data-kind=entity]{--node:#2b9db9}.IIa07q_nodeHalo{fill:color-mix(in srgb, var(--node) 18%, var(--mn-layer-1));stroke:color-mix(in srgb, var(--node) 60%, var(--mn-layer-1));stroke-width:1.5px;transition:r .16s}.IIa07q_nodeCore{fill:var(--node)}.IIa07q_nodeLabel{fill:var(--mn-muted);font:11px var(--mn-sans);pointer-events:auto}.IIa07q_nodeBodyLabel{fill:var(--mn-faint);font:500 11px var(--mn-sans);pointer-events:auto}.IIa07q_graphSvg[data-density=sparse] .IIa07q_nodeLabel{font-size:12px}.IIa07q_graphNode:hover .IIa07q_nodeHalo,.IIa07q_graphNode:focus .IIa07q_nodeHalo,.IIa07q_graphNode[data-selected] .IIa07q_nodeHalo{fill:color-mix(in srgb, var(--node) 28%, var(--mn-layer-1));stroke:var(--node)}.IIa07q_graphNode[data-selected] .IIa07q_nodeLabel{fill:var(--mn-text);font-weight:500}.IIa07q_graphFooter{border-top:.5px solid var(--mn-line);min-height:40px;color:var(--mn-faint)}.IIa07q_graphInspector{min-width:0;min-height:calc(clamp(390px,42vw,560px) + 84px);padding:16px;overflow:hidden}.IIa07q_inspectorEmpty{text-align:center;flex-direction:column;justify-content:center;align-items:center;height:100%;display:flex}.IIa07q_inspectorLogo{border-radius:var(--dsw-radius-lg);opacity:.72;width:48px;height:48px;margin-bottom:12px}.IIa07q_inspectorEmpty h3{margin:6px 0 2px;font-size:14px;font-weight:500;line-height:22px}.IIa07q_inspectorEmpty p{color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_inspectorHeading{justify-content:space-between;align-items:center;display:flex}.IIa07q_inspectorHeading button{border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--mn-muted);cursor:pointer;background:0 0;border:0;place-items:center;display:grid}.IIa07q_inspectorHeading button:hover{background:var(--mn-hover)}.IIa07q_inspectorChips{flex-wrap:wrap;align-items:center;gap:6px;margin-top:20px;display:flex}.IIa07q_categoryChip{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;display:inline-flex}.IIa07q_inspectorTitleRow{align-items:flex-start;gap:8px;min-width:0;margin:12px 0 20px;display:flex}.IIa07q_inspectorTitle{overflow-wrap:anywhere;white-space:pre-wrap;-webkit-line-clamp:6;-webkit-box-orient:vertical;flex:1;min-width:0;margin:0;font-size:14px;font-weight:400;line-height:22px;display:-webkit-box;overflow:hidden}.IIa07q_inspectorEye{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--mn-muted);cursor:pointer;background:0 0;flex:none;place-items:center;transition:color .15s,background-color .15s;display:grid}.IIa07q_inspectorEye:hover{color:var(--mn-text);background:var(--mn-hover)}.IIa07q_inspectorMeta{margin:0}.IIa07q_inspectorMeta>div{border-top:.5px solid var(--mn-line);gap:2px;padding:10px 0;display:grid}.IIa07q_inspectorMeta dt{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_inspectorMeta dd{overflow-wrap:anywhere;color:var(--mn-muted);margin:0;font-size:13px;line-height:20px}.IIa07q_inspectorActions{gap:8px;margin-top:20px;display:grid}.IIa07q_previewContent{white-space:pre-wrap;overflow-wrap:anywhere;color:var(--mn-text);margin:0;font-size:14px;line-height:22px}.IIa07q_searchBar{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:16px;padding:14px}.IIa07q_queryField{width:100%;height:40px}.IIa07q_searchChoice{min-width:160px}.IIa07q_searchControls{justify-content:flex-end;align-items:flex-end;gap:12px;padding-top:12px;display:flex}.IIa07q_searchActions{align-items:center;gap:8px;display:flex}.IIa07q_agentAnswer{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:16px;padding:16px}.IIa07q_agentAnswerHeading{justify-content:space-between;align-items:flex-start;gap:16px;display:flex}.IIa07q_agentAnswerHeading span{color:var(--mn-faint);font-size:12px;font-weight:500;line-height:18px}.IIa07q_agentAnswerHeading h3{margin:2px 0 0;font-size:14px;font-weight:500;line-height:22px}.IIa07q_agentAnswerHeading>code{color:var(--mn-faint);font-size:11px}.IIa07q_agentAnswer>p{white-space:pre-wrap;color:var(--mn-text);margin:12px 0;font-size:14px;line-height:22px}.IIa07q_agentCitations{border-top:.5px solid var(--mn-line);flex-wrap:wrap;align-items:center;gap:6px;padding-top:10px;display:flex}.IIa07q_agentCitations small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_agentCitations span{max-width:100%;color:var(--mn-muted);background:var(--mn-fill);text-overflow:ellipsis;white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_fieldWide{color:var(--mn-muted);gap:6px;font-size:12px;font-weight:500;line-height:18px;display:grid}.IIa07q_supervisedForm textarea:focus{border-color:var(--mn-accent)}.IIa07q_singleColumn{max-width:830px}.IIa07q_resultLayout{grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);align-items:start;gap:16px;display:grid}.IIa07q_results,.IIa07q_relatedPane,.IIa07q_entityResults{min-width:0}.IIa07q_relatedPane{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);-webkit-overflow-scrolling:touch;max-height:calc(100dvh - 230px);padding:14px;scroll-margin-top:14px;position:sticky;top:12px;overflow:auto}.IIa07q_relatedSource{border-radius:var(--dsw-radius-sm);color:var(--mn-muted);background:var(--mn-fill);margin:0 0 12px;padding:10px 12px;font-size:13px;line-height:20px}.IIa07q_insightCard{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);min-width:0;margin-bottom:8px;padding:14px 16px;transition:background-color .15s}.IIa07q_insightCard:hover{background:color-mix(in srgb, var(--mn-hover) 50%, transparent)}.IIa07q_cardTop{justify-content:space-between;align-items:center;gap:12px;display:flex}.IIa07q_badges,.IIa07q_tags,.IIa07q_entities{flex-wrap:wrap;gap:6px;display:flex}.IIa07q_badge{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_id{color:var(--mn-faint);font-size:11px}.IIa07q_content{white-space:pre-wrap;overflow-wrap:anywhere;margin:10px 0;font-size:14px;line-height:22px}.IIa07q_tags{color:var(--mn-accent);font-size:12px;line-height:18px}.IIa07q_entities{margin-top:8px}.IIa07q_entities span{border:.5px solid var(--mn-field-line);color:var(--mn-faint);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_cardActions{border-top:.5px solid var(--mn-line);justify-content:flex-end;align-items:center;gap:4px;min-height:32px;margin-top:10px;padding-top:8px;display:flex}.IIa07q_entityLayout{grid-template-columns:264px minmax(0,1fr);align-items:start;gap:16px;display:grid}.IIa07q_entityRail{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);padding:12px;position:sticky;top:0}.IIa07q_entitySearch{grid-template-columns:minmax(0,1fr) auto;gap:8px;display:grid}.IIa07q_entitySearch input{min-width:0}.IIa07q_entityHeading{justify-content:space-between;align-items:center;margin:16px 4px 6px;display:flex}.IIa07q_entityHeading small{color:var(--mn-faint);font-size:12px}.IIa07q_entityList{gap:2px;display:grid}.IIa07q_entityList button{border-radius:var(--dsw-radius-sm);min-height:32px;color:var(--mn-muted);cursor:pointer;text-align:left;background:0 0;border:0;justify-content:space-between;align-items:center;gap:10px;padding:0 10px;display:flex}.IIa07q_entityList button:hover,.IIa07q_entityList button[aria-pressed=true]{color:var(--mn-text);background:var(--mn-hover)}.IIa07q_entityList button[aria-pressed=true]{background:var(--mn-fill)}.IIa07q_entityList button>span{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.IIa07q_entityList strong{color:var(--mn-faint);font-variant-numeric:tabular-nums;flex:none;font-size:12px;font-weight:400}.IIa07q_entityResults>.IIa07q_emptyState{min-height:360px}.IIa07q_supervisedComposer{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);overflow:hidden}.IIa07q_supervisedForm{padding:16px}.IIa07q_candidateHeading{justify-content:space-between;align-items:center;gap:8px;min-width:0;margin-bottom:8px;display:flex}.IIa07q_candidateHeading>label{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_supervisedForm textarea{resize:vertical;border:.5px solid var(--mn-field-line);border-radius:var(--dsw-radius-md);width:100%;color:var(--mn-text);background:var(--mn-input);outline:0;padding:10px 12px;font-size:14px;line-height:22px}.IIa07q_sessionHint{color:var(--mn-danger);margin:8px 0 0;font-size:12px;line-height:18px}.IIa07q_fieldWide{grid-column:1/-1}.IIa07q_advancedWrite{border-top:.5px solid var(--mn-line)}.IIa07q_advancedWrite summary{cursor:pointer;justify-content:space-between;align-items:center;gap:16px;min-height:56px;padding:10px 16px;list-style:none;display:flex}.IIa07q_advancedWrite summary:hover{background:var(--mn-hover)}.IIa07q_advancedWrite summary::-webkit-details-marker{display:none}.IIa07q_advancedWrite summary>span:first-child{gap:2px;display:grid}.IIa07q_advancedWrite summary strong{font-size:13px;font-weight:500;line-height:20px}.IIa07q_advancedWrite summary small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_advancedWrite summary>span:last-child{color:var(--mn-faint);font-size:16px;line-height:1}.IIa07q_advancedWrite[open] summary{border-bottom:.5px solid var(--mn-line)}.IIa07q_advancedWrite[open] summary>span:last-child{font-size:0}.IIa07q_advancedWrite[open] summary>span:last-child:after{content:\"−\";font-size:16px}.IIa07q_manualForm{padding:4px 16px 16px}.IIa07q_manualActions{justify-content:space-between;align-items:center;gap:16px;margin-top:16px;display:flex}.IIa07q_manualActions p{max-width:520px;color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_listToolbar{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);grid-template-columns:minmax(0,1fr) 180px auto;gap:8px;padding:12px;display:grid}.IIa07q_listToolbar>*{min-width:0}.IIa07q_listNotice{color:var(--mn-faint);margin:10px 2px 16px;font-size:12px;line-height:18px}.IIa07q_listNotice span{color:var(--mn-success);background:color-mix(in srgb, var(--mn-success) 10%, transparent);border-radius:999px;margin-right:8px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_memoryList{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:8px;display:grid}.IIa07q_memoryList .IIa07q_insightCard{height:100%;margin:0}.IIa07q_modalFooterNote{max-width:54ch;color:var(--mn-faint);margin:0 auto 0 0;font-size:12px;line-height:18px}.IIa07q_modalInlineStatus{color:var(--mn-muted);overflow-wrap:anywhere;margin:12px 0 0;font-size:12px;line-height:18px}.IIa07q_metadataDialog{gap:12px;display:grid}.IIa07q_metadataToolbar{color:var(--mn-faint);justify-content:space-between;align-items:center;gap:12px;font-size:12px;line-height:18px;display:flex}.IIa07q_metadataToolbar>span{align-items:center;gap:8px;min-width:0;display:flex}.IIa07q_metadataToolbar em{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-style:normal;font-weight:500;line-height:17px}.IIa07q_metadataList{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;display:grid}.IIa07q_metadataEmpty{border-radius:var(--dsw-radius-md);color:var(--mn-faint);background:var(--mn-fill);text-align:center;grid-column:1/-1;padding:20px;font-size:12px}.IIa07q_metadataList>label{cursor:pointer;grid-template-columns:16px minmax(0,1fr);align-items:start;gap:10px;min-width:0;min-height:76px;padding:12px;display:grid;position:relative}.IIa07q_metadataList>label:hover{background:var(--mn-hover)}.IIa07q_metadataList>label[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_metadataList>label[data-refreshing]{overflow:hidden}.IIa07q_metadataList>label[data-refreshing]:after{content:\"\";background:linear-gradient(105deg, transparent 20%, color-mix(in srgb, var(--mn-accent) 10%, transparent) 45%, transparent 70%);pointer-events:none;animation:.9s ease-in-out infinite IIa07q_mnemon-metadata-sweep;position:absolute;inset:0;transform:translate(-120%)}.IIa07q_metadataList>label[data-refreshed]{animation:.9s ease-out IIa07q_mnemon-metadata-refreshed}.IIa07q_metadataList>label[data-failed]{border-color:color-mix(in srgb, var(--mn-danger) 40%, transparent)}.IIa07q_metadataList>label>input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_metadataList>label>span{gap:4px;min-width:0;display:grid}.IIa07q_metadataList strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}.IIa07q_metadataList small{color:var(--mn-faint);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:12px;line-height:18px;display:-webkit-box;overflow:hidden}.IIa07q_metadataList>label>span>span{align-items:center;gap:6px;min-width:0;display:flex}.IIa07q_metadataList code{color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;font-size:11px;overflow:hidden}.IIa07q_metadataTaskStatus{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_metadataTaskStatus[data-status=running]{color:var(--mn-faint)}.IIa07q_metadataTaskStatus[data-status=success]{color:var(--mn-success)}.IIa07q_metadataTaskStatus[data-status=error]{color:var(--mn-danger)}@media (prefers-reduced-motion:reduce){.IIa07q_metadataList>label[data-refreshing]:after,.IIa07q_metadataList>label[data-refreshed]{animation:none}}@media (width<=1000px){.IIa07q_graphLayout{display:block;position:relative}.IIa07q_graphInspector{width:auto;min-height:0;box-shadow:none;margin-top:12px;position:static;overflow:visible}.IIa07q_graphInspector[data-empty]{display:none}.IIa07q_resultLayout{grid-template-columns:1fr}.IIa07q_relatedPane{grid-row:1;max-height:none;position:static}.IIa07q_memoryList{grid-template-columns:1fr}}@media (width<=760px){.IIa07q_metadataList{grid-template-columns:1fr}.IIa07q_modalFooterNote{max-width:none;margin:0}.IIa07q_modal .IIa07q_supervisedForm textarea{min-height:clamp(130px,30vh,210px)}.IIa07q_entityLayout{grid-template-columns:1fr}.IIa07q_manualActions{flex-direction:column;align-items:stretch}.IIa07q_entityRail{position:static}.IIa07q_searchControls{grid-template-columns:repeat(2,minmax(0,1fr));display:grid}.IIa07q_searchActions{grid-column:1/-1}.IIa07q_searchActions>button{flex:1}.IIa07q_listToolbar{grid-template-columns:1fr}.IIa07q_bodyDirectoryHeader{grid-template-columns:minmax(0,1fr);display:grid}.IIa07q_bodyDirectoryHeader>div{min-width:0}.IIa07q_bodyDirectoryPath{max-width:100%}.IIa07q_bodyDirectoryControls{flex-wrap:wrap;justify-content:flex-start;padding-right:0}.IIa07q_createIdentityGrid,.IIa07q_placementMode,.IIa07q_placementRuleGrid,.IIa07q_placementCandidates,.IIa07q_providerChoice,.IIa07q_providerAdvancedGrid{grid-template-columns:1fr}.IIa07q_graphViewport{min-height:360px}.IIa07q_graphSvg{height:390px}.IIa07q_graphCanvasControls{top:8px;right:8px}.IIa07q_graphCanvasControls span{display:none}}@media (width<=520px){.IIa07q_memoryHeaderActions{width:100%}.IIa07q_memoryHeaderActions>button{flex:1}.IIa07q_cardTop{flex-direction:column;align-items:flex-start}.IIa07q_cardActions{flex-wrap:wrap;align-items:stretch}.IIa07q_cardActions button{flex:1}.IIa07q_searchControls{grid-template-columns:1fr}}@supports (height:100dvh){@media (width<=760px){.IIa07q_modal .IIa07q_supervisedForm textarea{min-height:clamp(130px,30dvh,210px)}}}@media (width<=1000px) and (height<=760px){.IIa07q_graphViewport{min-height:300px}.IIa07q_graphSvg{height:300px}}";
		const tagId$6 = "dsh-mnemon-source-memory-spaces/presentation/page.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$6;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$6) tag.textContent = css$6;
		}
		var page_module_css_default = {
			"advancedWrite": "IIa07q_advancedWrite",
			"agentAnswer": "IIa07q_agentAnswer",
			"agentAnswerHeading": "IIa07q_agentAnswerHeading",
			"agentCitations": "IIa07q_agentCitations",
			"asyncPlaceholder": "IIa07q_asyncPlaceholder",
			"asyncRegion": "IIa07q_asyncRegion",
			"asyncResults": "IIa07q_asyncResults",
			"badge": "IIa07q_badge",
			"badges": "IIa07q_badges",
			"bodyCard": "IIa07q_bodyCard",
			"bodyCardActions": "IIa07q_bodyCardActions",
			"bodyCreateForm": "IIa07q_bodyCreateForm",
			"bodyDirectory": "IIa07q_bodyDirectory",
			"bodyDirectoryControls": "IIa07q_bodyDirectoryControls",
			"bodyDirectoryEmpty": "IIa07q_bodyDirectoryEmpty",
			"bodyDirectoryHeader": "IIa07q_bodyDirectoryHeader",
			"bodyDirectoryPath": "IIa07q_bodyDirectoryPath",
			"bodyFooterBlock": "IIa07q_bodyFooterBlock",
			"bodyFooterGrow": "IIa07q_bodyFooterGrow",
			"bodyGrid": "IIa07q_bodyGrid",
			"bodyHealth": "IIa07q_bodyHealth",
			"bodySignal": "IIa07q_bodySignal",
			"bodySwitch": "IIa07q_bodySwitch",
			"bodySwitchTrack": "IIa07q_bodySwitchTrack",
			"candidateHeading": "IIa07q_candidateHeading",
			"candidateIcon": "IIa07q_candidateIcon",
			"capabilityRules": "IIa07q_capabilityRules",
			"cardActions": "IIa07q_cardActions",
			"cardTop": "IIa07q_cardTop",
			"categoryChip": "IIa07q_categoryChip",
			"choiceControl": "IIa07q_choiceControl",
			"content": "IIa07q_content",
			"createIdentityGrid": "IIa07q_createIdentityGrid",
			"createSection": "IIa07q_createSection",
			"createSectionHeading": "IIa07q_createSectionHeading",
			"emptyState": "IIa07q_emptyState",
			"entities": "IIa07q_entities",
			"entityHeading": "IIa07q_entityHeading",
			"entityLayout": "IIa07q_entityLayout",
			"entityList": "IIa07q_entityList",
			"entityRail": "IIa07q_entityRail",
			"entityResults": "IIa07q_entityResults",
			"entitySearch": "IIa07q_entitySearch",
			"fieldWide": "IIa07q_fieldWide",
			"graphBackdrop": "IIa07q_graphBackdrop",
			"graphCanvasControls": "IIa07q_graphCanvasControls",
			"graphEdge": "IIa07q_graphEdge",
			"graphFooter": "IIa07q_graphFooter",
			"graphGridLine": "IIa07q_graphGridLine",
			"graphInspector": "IIa07q_graphInspector",
			"graphLayout": "IIa07q_graphLayout",
			"graphLegend": "IIa07q_graphLegend",
			"graphNode": "IIa07q_graphNode",
			"graphPanel": "IIa07q_graphPanel",
			"graphSvg": "IIa07q_graphSvg",
			"graphToolbar": "IIa07q_graphToolbar",
			"graphViewport": "IIa07q_graphViewport",
			"id": "IIa07q_id",
			"insightCard": "IIa07q_insightCard",
			"inspectorActions": "IIa07q_inspectorActions",
			"inspectorChips": "IIa07q_inspectorChips",
			"inspectorEmpty": "IIa07q_inspectorEmpty",
			"inspectorEye": "IIa07q_inspectorEye",
			"inspectorHeading": "IIa07q_inspectorHeading",
			"inspectorLogo": "IIa07q_inspectorLogo",
			"inspectorMeta": "IIa07q_inspectorMeta",
			"inspectorTitle": "IIa07q_inspectorTitle",
			"inspectorTitleRow": "IIa07q_inspectorTitleRow",
			"listNotice": "IIa07q_listNotice",
			"listToolbar": "IIa07q_listToolbar",
			"liveDot": "IIa07q_liveDot",
			"manualActions": "IIa07q_manualActions",
			"manualForm": "IIa07q_manualForm",
			"memoryHeaderActions": "IIa07q_memoryHeaderActions",
			"memoryList": "IIa07q_memoryList",
			"metadataDialog": "IIa07q_metadataDialog",
			"metadataEmpty": "IIa07q_metadataEmpty",
			"metadataList": "IIa07q_metadataList",
			"metadataTaskStatus": "IIa07q_metadataTaskStatus",
			"metadataToolbar": "IIa07q_metadataToolbar",
			"mnemon-metadata-refreshed": "IIa07q_mnemon-metadata-refreshed",
			"mnemon-metadata-sweep": "IIa07q_mnemon-metadata-sweep",
			"mnemon-spin": "IIa07q_mnemon-spin",
			"mnemonDefaultBadge": "IIa07q_mnemonDefaultBadge",
			"modal": "IIa07q_modal",
			"modalFooterNote": "IIa07q_modalFooterNote",
			"modalInlineStatus": "IIa07q_modalInlineStatus",
			"muted": "IIa07q_muted",
			"nodeBodyLabel": "IIa07q_nodeBodyLabel",
			"nodeCore": "IIa07q_nodeCore",
			"nodeHalo": "IIa07q_nodeHalo",
			"nodeLabel": "IIa07q_nodeLabel",
			"placementCandidates": "IIa07q_placementCandidates",
			"placementMode": "IIa07q_placementMode",
			"placementPolicy": "IIa07q_placementPolicy",
			"placementPolicyHeading": "IIa07q_placementPolicyHeading",
			"placementReceipt": "IIa07q_placementReceipt",
			"placementRuleGrid": "IIa07q_placementRuleGrid",
			"previewContent": "IIa07q_previewContent",
			"providerAdvancedGrid": "IIa07q_providerAdvancedGrid",
			"providerBadge": "IIa07q_providerBadge",
			"providerChoice": "IIa07q_providerChoice",
			"providerChoiceIcon": "IIa07q_providerChoiceIcon",
			"providerEnableHint": "IIa07q_providerEnableHint",
			"providerFieldControl": "IIa07q_providerFieldControl",
			"providerFieldHeading": "IIa07q_providerFieldHeading",
			"providerFieldIcon": "IIa07q_providerFieldIcon",
			"providerFieldIdentity": "IIa07q_providerFieldIdentity",
			"providerFields": "IIa07q_providerFields",
			"providerSecretClear": "IIa07q_providerSecretClear",
			"providerWriteHint": "IIa07q_providerWriteHint",
			"queryField": "IIa07q_queryField",
			"readSourceCard": "IIa07q_readSourceCard",
			"readSourceIdentity": "IIa07q_readSourceIdentity",
			"readSourceMeta": "IIa07q_readSourceMeta",
			"readSourceSignal": "IIa07q_readSourceSignal",
			"readSourceState": "IIa07q_readSourceState",
			"readSources": "IIa07q_readSources",
			"relatedPane": "IIa07q_relatedPane",
			"relatedSource": "IIa07q_relatedSource",
			"resultLayout": "IIa07q_resultLayout",
			"results": "IIa07q_results",
			"searchActions": "IIa07q_searchActions",
			"searchBar": "IIa07q_searchBar",
			"searchChoice": "IIa07q_searchChoice",
			"searchControls": "IIa07q_searchControls",
			"sectionSpinner": "IIa07q_sectionSpinner",
			"sessionHint": "IIa07q_sessionHint",
			"singleColumn": "IIa07q_singleColumn",
			"strategyForm": "IIa07q_strategyForm",
			"strategyLoading": "IIa07q_strategyLoading",
			"supervisedComposer": "IIa07q_supervisedComposer",
			"supervisedForm": "IIa07q_supervisedForm",
			"tags": "IIa07q_tags"
		};
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/plugins/dsh-mnemon-source-memory-spaces/presentation/sidebar.module.css.mjs
		const css$5 = "._Bh55G_shell ._Bh55G_memoryWorkspace{z-index:12;border-bottom:.5px solid var(--dsw-alias-border-l2);background:var(--mn-surface);flex:none;margin:-20px -24px 16px;padding:20px 24px 0;position:sticky;top:0}._Bh55G_shell ._Bh55G_memoryWorkspace>[class*=pageHeader],._Bh55G_shell ._Bh55G_memoryWorkspace~[class*=page]>[class*=pageHeader]{margin-bottom:12px}._Bh55G_shell ._Bh55G_memoryWorkspace~[class*=page]>[class*=pageHeader] h2{font-size:14px;line-height:22px}._Bh55G_shell ._Bh55G_memoryWorkspace~[class*=page]>[class*=pageHeader] p{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}._Bh55G_shell [class*=relatedPane],._Bh55G_shell [class*=entityRail]{position:static}._Bh55G_shell ._Bh55G_memoryNavigation{flex:none;align-items:flex-end;gap:12px;min-width:0;padding:0;display:flex}._Bh55G_shell ._Bh55G_memoryTabs{scrollbar-width:none;flex:1;gap:22px;min-width:0;display:flex;overflow-x:auto}._Bh55G_shell ._Bh55G_memoryTabs::-webkit-scrollbar{display:none}._Bh55G_shell ._Bh55G_memoryTabs button{min-width:max-content;min-height:0;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-bottom:2px solid #0000;margin-bottom:-.5px;padding:6px 1px 9px;font-size:13px;line-height:20px;position:relative}._Bh55G_shell ._Bh55G_memoryTabs button:hover{color:var(--dsw-alias-label-primary)}._Bh55G_shell ._Bh55G_memoryTabs button[data-active]{border-bottom-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-label-primary)}._Bh55G_shell ._Bh55G_memoryWriteButton{flex:none}._Bh55G_shell ._Bh55G_modal section[class*=supervisedComposer]{border:0;overflow:visible}._Bh55G_shell ._Bh55G_modal form[class*=supervisedForm]{padding:0}._Bh55G_shell ._Bh55G_modal [class*=supervisedHeading]{margin-bottom:12px}._Bh55G_shell ._Bh55G_modal [class*=supervisedHeading] h3{display:none}._Bh55G_shell ._Bh55G_modal details[class*=advancedWrite]{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-md);margin-top:16px;overflow:hidden}._Bh55G_shell [class*=inspectorEye],._Bh55G_shell [class*=inspectorHeading] button{border-radius:var(--dsw-radius-sm);width:28px;height:28px;min-height:0;color:var(--dsw-alias-label-caption);cursor:pointer;background:0 0;border:0;justify-content:center;align-items:center;padding:0;font-size:13px;transition:background-color .12s,color .12s;display:inline-flex}._Bh55G_shell [class*=inspectorEye]:hover:not(:disabled),._Bh55G_shell [class*=inspectorHeading] button:hover:not(:disabled){color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover)}._Bh55G_shell [class*=inspectorEye]:disabled{cursor:default;opacity:.4}._Bh55G_shell [class*=bodyGrid]{grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))}._Bh55G_shell article[class*=bodyCard]{flex-direction:column;height:100%;display:flex}._Bh55G_shell ._Bh55G_bodyCardHeader{justify-content:space-between;align-items:flex-start;gap:12px;min-width:0;display:flex}._Bh55G_shell ._Bh55G_bodyDirectoryActions{flex:none;align-items:center;gap:8px;display:flex}._Bh55G_shell ._Bh55G_bodyCardIdentity{flex:1;align-items:flex-start;gap:8px;min-width:0;display:flex}._Bh55G_shell ._Bh55G_bodyCardIdentity>[class*=bodySignal]{flex:none;width:6px;height:6px;margin-top:7px}._Bh55G_shell article[class*=bodyCard][data-reconnecting] ._Bh55G_bodyCardIdentity>[class*=bodySignal]{width:8px;height:8px;margin-top:6px}._Bh55G_shell ._Bh55G_bodyCardIdentity>div{flex:1;gap:2px;min-width:0;display:grid}._Bh55G_shell ._Bh55G_bodyCardIdentity strong{text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;overflow:hidden}._Bh55G_shell ._Bh55G_bodyCardMeta{flex-wrap:wrap;align-items:center;gap:4px 8px;min-width:0;display:flex}._Bh55G_shell ._Bh55G_bodyCardMeta code{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;overflow:hidden}._Bh55G_shell ._Bh55G_bodyCardMeta [class*=bodyHealth],._Bh55G_shell ._Bh55G_bodyCardHeader>[class*=bodySwitch]{flex:none}._Bh55G_shell article[class*=bodyCard]>p{-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:40px;max-height:40px;margin:10px 0;display:-webkit-box;overflow:hidden}._Bh55G_shell ._Bh55G_bodyCardFooter{white-space:nowrap;grid-template-columns:minmax(0,1fr) max-content;align-items:center;gap:12px;min-width:0;margin-top:auto;padding-top:10px;display:grid}._Bh55G_shell ._Bh55G_bodyCardStats{flex-wrap:nowrap;align-items:center;gap:12px;min-width:0;display:flex;overflow:hidden}._Bh55G_shell ._Bh55G_bodyCardFooter [class*=bodyCardActions]{flex-wrap:nowrap;flex:none;align-items:center;gap:8px;display:flex}._Bh55G_shell [class*=cardActions]{gap:8px}._Bh55G_shell ._Bh55G_inspectorGlyph{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-lg);width:48px;height:48px;color:var(--dsw-alias-label-tertiary);place-items:center;margin-bottom:12px;font-size:20px;line-height:1;display:grid}@media (width<=760px){._Bh55G_shell ._Bh55G_memoryWorkspace{margin:-16px -16px 16px;padding:16px 16px 0}}@media (width<=520px){._Bh55G_shell ._Bh55G_memoryTabs{gap:18px}}@media (prefers-reduced-motion:reduce){._Bh55G_shell [class*=inspectorEye],._Bh55G_shell [class*=inspectorHeading] button{transition:none}}";
		const tagId$5 = "dsh-mnemon-source-memory-spaces/presentation/sidebar.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$5;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$5) tag.textContent = css$5;
		}
		var sidebar_module_css_default = {
			"bodyCardFooter": "_Bh55G_bodyCardFooter",
			"bodyCardHeader": "_Bh55G_bodyCardHeader",
			"bodyCardIdentity": "_Bh55G_bodyCardIdentity",
			"bodyCardMeta": "_Bh55G_bodyCardMeta",
			"bodyCardStats": "_Bh55G_bodyCardStats",
			"bodyDirectoryActions": "_Bh55G_bodyDirectoryActions",
			"inspectorGlyph": "_Bh55G_inspectorGlyph",
			"memoryNavigation": "_Bh55G_memoryNavigation",
			"memoryTabs": "_Bh55G_memoryTabs",
			"memoryWorkspace": "_Bh55G_memoryWorkspace",
			"memoryWriteButton": "_Bh55G_memoryWriteButton",
			"modal": "_Bh55G_modal",
			"shell": "_Bh55G_shell"
		};
		//#endregion
		//#region src/client/page-kit.tsx
		const I18nContext = (0, react.createContext)(translateZh);
		const LocaleContext = (0, react.createContext)("zh");
		function useT() {
			return (0, react.useContext)(I18nContext);
		}
		function useLocale() {
			const locale = (0, react.useContext)(LocaleContext);
			return locale === "en" ? "en-US" : locale === "zh" ? "zh-CN" : locale;
		}
		function humanBytes(bytes) {
			if (bytes < 1024) return `${bytes} B`;
			if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
			return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
		}
		function message(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function parseBranchesInput(raw) {
			const parsed = raw.split(",").map((value) => value.trim()).filter((value) => value !== "");
			return parsed.length === 0 ? void 0 : parsed;
		}
		function short(value, max) {
			return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
		}
		function PageHeader(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: appearanceClass(MnemonView_module_css_default.pageHeader, MnemonSidebarView_module_css_default.pageHeader),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: props.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: props.description })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonView_module_css_default.pageHeaderMeta,
					children: [
						props.loadingLabel !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageSpinner, { label: props.loadingLabel }),
						props.meta !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: props.meta }),
						props.action
					]
				})]
			});
		}
		function PageSpinner({ label }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: MnemonView_module_css_default.pageSpinner,
				role: "status",
				"aria-label": label,
				title: label,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { "aria-hidden": "true" })
			});
		}
		function SectionSpinner({ label }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: MnemonView_module_css_default.sectionSpinner,
				role: "status",
				"aria-label": label,
				title: label,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", { "aria-hidden": "true" })
			});
		}
		function ProgressiveFooter(props) {
			const t = useT();
			if (props.total === 0) return null;
			const remaining = Math.max(0, props.total - props.visible);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: props.compact === true ? MnemonView_module_css_default.compactListProgress : MnemonView_module_css_default.listProgress,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("common.showing", {
					visible: props.visible,
					total: props.total
				}) }), remaining > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: MnemonView_module_css_default.secondaryButton,
					onClick: props.onMore,
					children: t("common.showMore", { count: Math.min(props.pageSize, remaining) })
				})]
			});
		}
		/** DSH-style action dialog shared by Sidebar add/write flows. */
		function SidebarModal(props) {
			const t = useT();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonDialog, {
				...props,
				closeLabel: t("common.close")
			});
		}
		/** The search glyph is drawn with DSH's search icon, as every search field shows it. */
		const SEARCH_GLYPH = "⌕";
		function EmptyState(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonView_module_css_default.emptyState,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: MnemonView_module_css_default.emptyGlyph,
					"aria-hidden": "true",
					children: props.glyph === SEARCH_GLYPH ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutlineRegular, { size: 18 }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.glyph })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: props.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: props.children })] })]
			});
		}
		const memoryPageStyles = {
			...MnemonView_module_css_default,
			...page_module_css_default$2,
			...page_module_css_default$1,
			...page_module_css_default
		};
		const memorySidebarStyles = {
			...MnemonSidebarView_module_css_default,
			...sidebar_module_css_default$2,
			...sidebar_module_css_default$1,
			...sidebar_module_css_default
		};
		//#endregion
		//#region src/client/settings-panel.tsx
		/**
		* The two ways a group of settings saves. A choice (switch or selector)
		* applies when it is made; edits that need checking, or that move data, wait
		* for their group's Apply. No group joins another group's save.
		*/
		function useScope(scope) {
			const subscribe = (0, react.useMemo)(() => scope.subscribe.bind(scope), [scope]);
			const getSnapshot = (0, react.useMemo)(() => scope.getSnapshot.bind(scope), [scope]);
			return (0, react.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
		}
		/**
		* One group's staged edits, applied together with its own button. Edits that
		* come back to the saved values leave nothing to apply.
		*/
		function useStaged(value, write) {
			const [draft, setDraft] = (0, react.useState)(value);
			const [edited, setDirty] = (0, react.useState)(false);
			const [saving, setSaving] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(null);
			const [applied, setApplied] = (0, react.useState)(false);
			const serialized = JSON.stringify(value);
			const dirty = edited && JSON.stringify(draft) !== serialized;
			(0, react.useEffect)(() => {
				if (!dirty) setDraft(value);
			}, [serialized]);
			return {
				draft,
				dirty,
				saving,
				failed,
				applied,
				edit: (next) => {
					setDraft((current) => ({
						...current,
						...next
					}));
					setDirty(true);
					setFailed(null);
					setApplied(false);
				},
				discard: () => {
					setDraft(value);
					setDirty(false);
					setFailed(null);
				},
				apply: async () => {
					setSaving(true);
					setFailed(null);
					try {
						await write(draft);
						setDirty(false);
						setApplied(true);
					} catch (reason) {
						setFailed(message(reason));
					} finally {
						setSaving(false);
					}
				}
			};
		}
		/**
		* A choice that saves when it is made: it shows the chosen value at once, and
		* the saved one again if the write fails.
		*/
		function useLive(saved, write) {
			const [pending, setPending] = (0, react.useState)(null);
			const [failed, setFailed] = (0, react.useState)(null);
			const request = (0, react.useRef)(0);
			return {
				value: pending === null ? saved : pending.value,
				failed,
				set: (value) => {
					const current = ++request.current;
					setPending({ value });
					setFailed(null);
					write(value).then(() => {
						if (request.current === current) setPending(null);
					}, (reason) => {
						if (request.current === current) {
							setPending(null);
							setFailed(message(reason));
						}
					});
				}
			};
		}
		/** A failed write, beside the controls that made it. */
		function WriteFailure(props) {
			return props.error === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: MnemonSettingsCard_module_css_default.panelError,
				role: "alert",
				children: props.t("config.saveFailed", { error: props.error })
			});
		}
		/** Discard and Apply for one group, shown while it has edits; `note` says what applying does. */
		function PanelActions(props) {
			const { t } = props;
			if (!props.dirty) return props.applied ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: MnemonSettingsCard_module_css_default.panelNote,
				role: "status",
				children: t("config.ready")
			}) : null;
			const problem = props.invalid ?? (props.failed === null ? null : t("config.saveFailed", { error: props.failed }));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonSettingsCard_module_css_default.panelActions,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						role: problem === null ? void 0 : "alert",
						className: problem === null ? void 0 : MnemonSettingsCard_module_css_default.panelError,
						children: problem ?? props.note ?? t("config.unsaved")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						disabled: props.saving,
						onClick: props.onDiscard,
						children: t("config.discard")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "primary",
						size: "sm",
						disabled: props.saving || props.disabled || props.invalid !== null,
						"aria-busy": props.saving || void 0,
						onClick: props.onApply,
						children: props.saving ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.TextShimmer, {
							active: true,
							children: t("options.applying")
						}) : t("options.apply")
					})
				]
			});
		}
		//#endregion
		//#region src/client/component-options.tsx
		/** The Host's limits on a list option, from the configuration contract. */
		const LIST_ITEMS = 32;
		const LIST_ITEM_LENGTH = 500;
		const TEXT_LENGTH = 4e3;
		function listOf(value) {
			return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
		}
		function staged(field, value, own) {
			const shown = value ?? field.defaultValue;
			return {
				text: field.input === "string-list" ? listOf(shown).join("\n") : typeof shown === "number" || typeof shown === "string" ? String(shown) : "",
				sources: field.input === "source-list" ? listOf(shown) : [],
				own
			};
		}
		function initial(entry) {
			return Object.fromEntries(entry.fields.map((field) => [field.key, staged(field, entry.config[field.key], Object.hasOwn(entry.config, field.key))]));
		}
		/** The value an option writes, or why the Host would refuse it. */
		function parse(field, value, t) {
			if (field.input === "number") {
				const number = Number(value.text.trim());
				if (value.text.trim() !== "" && Number.isInteger(number) && (field.minimum === void 0 || number >= field.minimum) && (field.maximum === void 0 || number <= field.maximum)) return { value: number };
				return { error: field.minimum !== void 0 && field.maximum !== void 0 ? t("options.between", {
					min: field.minimum,
					max: field.maximum
				}) : field.minimum !== void 0 ? t("options.atLeast", { min: field.minimum }) : field.maximum !== void 0 ? t("options.atMost", { max: field.maximum }) : t("options.integer") };
			}
			if (field.input === "string-list" || field.input === "source-list") {
				const items = field.input === "source-list" ? value.sources : value.text.split("\n").map((item) => item.trim()).filter((item) => item !== "");
				return items.length <= LIST_ITEMS && items.every((item) => item.length <= LIST_ITEM_LENGTH) && new Set(items).size === items.length ? { value: items } : { error: t("options.listLimit", {
					count: LIST_ITEMS,
					length: LIST_ITEM_LENGTH
				}) };
			}
			const maximum = field.maximum ?? TEXT_LENGTH;
			return value.text.length <= maximum ? { value: value.text } : { error: t("options.tooLong", { max: maximum }) };
		}
		/**
		* A component's options, drawn from the fields it declares, so an installed
		* Strategy or enhancement brings its own settings. Typed values wait for
		* Apply, which appears once something changed; an option left at its default
		* is not written, and one set here can be put back to its default.
		*/
		function ComponentOptions(props) {
			const { entry, t } = props;
			const id = (0, react.useId)();
			const [draft, setDraft] = (0, react.useState)(() => initial(entry));
			const zh = props.language.toLowerCase().startsWith("zh");
			const text = (value) => value === void 0 ? "" : zh ? value["zh-CN"] : value.en;
			const results = entry.fields.map((field) => ({
				field,
				result: parse(field, draft[field.key], t)
			}));
			const invalid = results.some(({ field, result }) => draft[field.key].own && "error" in result);
			const config = Object.fromEntries(results.flatMap(({ field, result }) => draft[field.key].own && "value" in result ? [[field.key, result.value]] : []));
			const edited = JSON.stringify(draft) !== JSON.stringify(initial(entry));
			const edit = (field, next) => setDraft((current) => ({
				...current,
				[field.key]: {
					...current[field.key],
					...next,
					own: true
				}
			}));
			const reset = (field) => setDraft((current) => ({
				...current,
				[field.key]: staged(field, void 0, false)
			}));
			const locked = props.disabled || props.pending;
			const sourceName = (sourceTypeId, fallback) => {
				const component = props.dashboard.entries.find((candidate) => candidate.roles.includes("source") && candidate.typeId === sourceTypeId);
				return component === void 0 ? fallback : componentCopy(component, props.language).label;
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonSettingsCard_module_css_default.optionsPanel,
				role: "group",
				"aria-label": t("options.aria", { component: props.name }),
				children: [results.map(({ field, result }) => {
					const value = draft[field.key];
					const control = `${id}-${field.key}`;
					const error = value.own && "error" in result ? result.error : void 0;
					const description = text(field.description);
					const hint = error ?? [description, field.input === "string-list" ? t("options.listHint") : ""].filter((part) => part !== "").join(t("config.sentenceGap"));
					const describedBy = hint === "" ? void 0 : `${control}-hint`;
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.optionField,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MnemonSettingsCard_module_css_default.optionLabel,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									htmlFor: field.input === "source-list" ? void 0 : control,
									id: `${control}-label`,
									children: text(field.label)
								}), value.own ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: MnemonSettingsCard_module_css_default.optionReset,
									disabled: locked,
									onClick: () => reset(field),
									children: t("options.reset")
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MnemonSettingsCard_module_css_default.optionDefault,
									children: t("options.default")
								})]
							}),
							field.input === "source-list" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SourceChoice, {
								field,
								value,
								sources: props.dashboard.sources,
								name: sourceName,
								labelledBy: `${control}-label`,
								disabled: locked,
								t,
								onChange: (sources) => edit(field, { sources })
							}) : field.input === "textarea" || field.input === "string-list" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
								id: control,
								className: MnemonSettingsCard_module_css_default.optionInput,
								rows: field.input === "string-list" ? 3 : 4,
								value: value.text,
								disabled: locked,
								"aria-invalid": error !== void 0,
								"aria-describedby": describedBy,
								onChange: (event) => edit(field, { text: event.target.value })
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: control,
								className: MnemonSettingsCard_module_css_default.optionInput,
								type: "text",
								inputMode: field.input === "number" ? "numeric" : void 0,
								value: value.text,
								disabled: locked,
								"aria-invalid": error !== void 0,
								"aria-describedby": describedBy,
								onChange: (event) => edit(field, { text: event.target.value })
							}),
							describedBy !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
								id: describedBy,
								className: MnemonSettingsCard_module_css_default.optionHint,
								"data-error": error === void 0 ? void 0 : "",
								children: hint
							})
						]
					}, field.key);
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PanelActions, {
					dirty: edited,
					saving: props.pending,
					invalid: invalid ? t("options.fix") : null,
					failed: null,
					applied: false,
					disabled: props.disabled,
					t,
					onDiscard: () => setDraft(initial(entry)),
					onApply: () => {
						props.onApply(config);
					}
				})]
			});
		}
		/** Sources a Strategy may use, in the order chosen; ones no longer running stay listed so they can be removed. */
		function SourceChoice(props) {
			const { field, value, t } = props;
			const eligible = props.sources.filter((source) => field.sourceRoles === void 0 || field.sourceRoles.length === 0 || field.sourceRoles.includes(source.role));
			const missing = value.sources.filter((key) => !eligible.some((source) => source.sourceInstanceKey === key));
			const several = (sourceTypeId) => eligible.filter((source) => source.sourceTypeId === sourceTypeId).length > 1;
			const toggle = (key, on) => props.onChange(on ? [...value.sources, key] : value.sources.filter((item) => item !== key));
			if (eligible.length === 0 && missing.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: MnemonSettingsCard_module_css_default.optionEmpty,
				children: t("options.noSources")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonSettingsCard_module_css_default.optionChoices,
				role: "group",
				"aria-labelledby": props.labelledBy,
				children: [eligible.map((source) => {
					const label = props.name(source.sourceTypeId, source.label);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Checkbox, {
						checked: value.sources.includes(source.sourceInstanceKey),
						disabled: props.disabled,
						label: several(source.sourceTypeId) ? `${label} · ${source.sourceInstanceKey}` : label,
						onChange: (on) => toggle(source.sourceInstanceKey, on)
					}, source.sourceInstanceKey);
				}), missing.map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Checkbox, {
					checked: true,
					disabled: props.disabled,
					label: t("options.sourceUnavailable", { source: key }),
					onChange: (on) => toggle(key, on)
				}, key))]
			});
		}
		//#endregion
		//#region src/client/component-details.tsx
		/** A component's page in a dialog over the configuration, the way the board opens it. */
		function ComponentDetails(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: true,
				onClose: props.onClose,
				title: props.name(props.entry),
				description: props.hint,
				closeLabel: props.t("common.close"),
				className: MnemonSettingsCard_module_css_default.detailsDialog ?? "",
				contentClassName: MnemonSettingsCard_module_css_default.detailsScroll ?? "",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComponentPage, { ...props })
			});
		}
		/**
		* Everything one component brings, in one place: what it is and where it
		* came from, how it relates to the other components installed and what its
		* switch would move, the options it declares and the settings it contributed.
		* Relations and options are drawn from the component's own declarations, so an
		* installed extension gets the same page as a shipped component. The same
		* page shows in a dialog over the configuration and on DSH's own row page.
		*/
		function ComponentPage(props) {
			const { entry, dashboard, name, t } = props;
			const relations = relationsOf(dashboard, entry);
			const names = (entries) => nameList(entries.map(name), t);
			const plan = entry.roles.includes("strategy") ? void 0 : switchPlan(dashboard, entry, !entry.enabled);
			const others = plan?.changes?.filter((change) => change.entry !== entry) ?? [];
			const on = names(others.filter((change) => change.enabled).map((change) => change.entry));
			const off = names(others.filter((change) => !change.enabled).map((change) => change.entry));
			const effect = plan?.blocked === "last-source" ? t("details.effectLast") : entry.enabled ? off === "" ? void 0 : t("details.effectOff", { names: off }) : on === "" && off === "" ? void 0 : off === "" ? t("details.effectOn", { names: on }) : on === "" ? t("details.effectOnReplace", { names: off }) : t("details.effectOnMixed", {
				on,
				off
			});
			const needs = relations.needs.filter((need) => need.providers.length > 0 || !need.met);
			const hasRelations = needs.length > 0 || relations.neededBy.length > 0 || relations.conflictsWith.length > 0 || effect !== void 0;
			const link = (other, on) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: MnemonSettingsCard_module_css_default.detailsName,
				onClick: () => props.onOpen(other),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: on ? "done" : "idle" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: name(other) })]
			}, other.entryId);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${MnemonSettingsCard_module_css_default.surface} ${MnemonSettingsCard_module_css_default.detailsBody}`,
				children: [
					props.back !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: MnemonSettingsCard_module_css_default.detailsBack,
						onClick: props.back.go,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutlineRegular, {
							size: 12,
							"aria-hidden": "true"
						}), t("details.back", { component: props.back.name })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.detailsHead,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonSettingsCard_module_css_default.detailsHeadLine,
							children: [
								props.state !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MnemonSettingsCard_module_css_default.boardState,
									"data-tone": props.state.pending === true ? "ongoing" : props.state.tone,
									children: props.state.pending === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.TextShimmer, {
										active: true,
										children: props.state.text
									})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [props.state.tone !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: props.state.tone }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.state.text })] })
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
									tone: isShipped(entry) ? "neutral" : "info",
									children: t(isShipped(entry) ? "details.shipped" : "details.installed")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MnemonSettingsCard_module_css_default.detailsControl,
									children: props.control
								})
							]
						}), props.headed !== true && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
							className: MnemonSettingsCard_module_css_default.detailsPackage,
							children: entry.packageName
						})]
					}),
					hasRelations && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: MnemonSettingsCard_module_css_default.detailsSection,
						"aria-label": t("details.relations"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("details.relations") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
								className: MnemonSettingsCard_module_css_default.detailsRelations,
								children: [
									needs.map((need) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t(need.providers.length > 1 ? "details.needsAny" : "details.needs") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: need.providers.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MnemonSettingsCard_module_css_default.detailsMissing,
										children: t("details.needsMissing", { capability: need.requirement })
									}) : need.providers.map((provider) => link(provider, provider.enabled)) })] }, need.requirement)),
									relations.neededBy.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("details.neededBy") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: relations.neededBy.map((dependent) => link(dependent, true)) })] }),
									relations.conflictsWith.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("details.conflicts") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: relations.conflictsWith.map((other) => link(other, other.enabled)) })] })
								]
							}),
							effect !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: MnemonSettingsCard_module_css_default.detailsEffect,
								children: effect
							})
						]
					}),
					entry.fields.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: MnemonSettingsCard_module_css_default.detailsSection,
						"aria-label": t("details.options"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("details.options") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComponentOptions, {
							entry,
							name: name(entry),
							dashboard,
							language: props.language,
							t,
							disabled: !props.writable || !entry.writable,
							pending: props.applying,
							onApply: props.onApply
						}, entry.entryId + JSON.stringify(entry.config))]
					}),
					props.settings !== void 0 && props.settings !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonSettingsCard_module_css_default.detailsContributed,
						children: props.settings
					})
				]
			});
		}
		/** The choice of a main Strategy inside its page: the current one says so, another offers to switch. */
		function MainChoice(props) {
			return props.selected ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
				tone: "solid",
				children: props.t("details.currentMain")
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "outline",
				size: "sm",
				disabled: props.disabled,
				onClick: props.onChoose,
				children: props.t("details.useMain")
			});
		}
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/src/client/MnemonFeedback.module.css.mjs
		const css$4 = ".lD-nda_reveal{opacity:1;grid-template-rows:1fr;transition:grid-template-rows .22s cubic-bezier(.2,0,0,1),opacity .16s ease-out;display:grid}.lD-nda_reveal[data-state=closing]{opacity:0;pointer-events:none;grid-template-rows:0fr}@starting-style{.lD-nda_reveal[data-state=open]{opacity:0;grid-template-rows:0fr}}.lD-nda_revealBody{min-width:0;min-height:0;overflow:hidden}[data-mnemon-flash]{animation:1.3s ease-out lD-nda_mnemon-flash}@keyframes lD-nda_mnemon-flash{0%,25%{background-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)}to{background-color:#0000}}.lD-nda_callout{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);flex-wrap:wrap;align-items:center;gap:8px 10px;min-width:0;padding:10px 12px;font-size:12px;line-height:18px;display:flex}.lD-nda_callout[data-tone=error]{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 7%, var(--dsw-alias-bg-module-platform))}.lD-nda_callout[data-tone=warning]{background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, var(--dsw-alias-bg-module-platform))}.lD-nda_calloutDot{flex:none;align-self:flex-start;margin-top:4px}.lD-nda_calloutCopy{overflow-wrap:anywhere;flex-direction:column;flex:1 1 0;gap:2px;min-width:min(220px,100%);display:flex}.lD-nda_calloutCopy strong{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}.lD-nda_calloutCopy span{color:var(--dsw-alias-label-secondary)}.lD-nda_calloutActions{flex-wrap:wrap;flex:none;gap:6px;margin-left:auto;display:flex}.lD-nda_actionButton{white-space:nowrap}.lD-nda_chip{border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);max-width:100%;min-height:28px;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;border-radius:999px;align-items:center;gap:6px;padding:0 10px;font-size:12px;line-height:18px;transition:background-color .15s,border-color .15s,color .15s;display:inline-flex}button.lD-nda_chip{cursor:pointer}button.lD-nda_chip:hover{background:var(--dsw-alias-interactive-bg-hover)}.lD-nda_chip[data-state=idle]{color:var(--dsw-alias-label-tertiary);border-style:dashed}.lD-nda_chip[data-state=warning]{border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent)}.lD-nda_chip[data-state=error]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent)}.lD-nda_chipLabel{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.lD-nda_chipNote{color:var(--dsw-alias-label-tertiary);white-space:nowrap}@media (prefers-reduced-motion:reduce){.lD-nda_reveal,.lD-nda_chip{transition:none}[data-mnemon-flash]{animation:none}}";
		const tagId$4 = "dsh-mnemon/src/client/MnemonFeedback.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$4;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$4) tag.textContent = css$4;
		}
		var MnemonFeedback_module_css_default = {
			"actionButton": "lD-nda_actionButton",
			"callout": "lD-nda_callout",
			"calloutActions": "lD-nda_calloutActions",
			"calloutCopy": "lD-nda_calloutCopy",
			"calloutDot": "lD-nda_calloutDot",
			"chip": "lD-nda_chip",
			"chipLabel": "lD-nda_chipLabel",
			"chipNote": "lD-nda_chipNote",
			"mnemon-flash": "lD-nda_mnemon-flash",
			"reveal": "lD-nda_reveal",
			"revealBody": "lD-nda_revealBody"
		};
		//#endregion
		//#region src/client/feedback.tsx
		/**
		* Long enough to read, as DSH's Plugins page sizes its own toasts, and long
		* enough to reach an action such as Undo.
		*/
		function holdMs(toast) {
			const reading = Math.min(8e3, Math.max(3e3, toast.text.length * 80));
			return toast.actions === void 0 || toast.actions.length === 0 ? reading : Math.max(reading, 6e3);
		}
		/** One toast at a time: a newer announcement replaces the one on screen. */
		function useToast() {
			const [current, setCurrent] = (0, react.useState)(null);
			const seq = (0, react.useRef)(0);
			const show = (0, react.useCallback)((toast) => {
				seq.current += 1;
				setCurrent({
					seq: seq.current,
					toast
				});
			}, []);
			if (current === null) return {
				show,
				element: null
			};
			const dismiss = () => setCurrent((existing) => existing?.seq === current.seq ? null : existing);
			const { toast } = current;
			return {
				show,
				element: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
					text: toast.text,
					holdMs: holdMs(toast),
					onDone: dismiss,
					...toast.tone === "success" ? { tone: "success" } : toast.tone === "warning" ? { icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutlineRegular, {}) } : {},
					...toast.actions === void 0 ? {} : { actions: toast.actions.map((action) => ({
						label: action.label,
						onClick: () => {
							dismiss();
							action.run();
						}
					})) }
				}, current.seq)
			};
		}
		const REVEAL_MS = 220;
		/**
		* Content that slides open when it appears and closed when it goes, so a note
		* never pushes the page at once. Closing content stays readable while it
		* leaves but is hidden from assistive technology and the pointer.
		*/
		function Reveal({ children, className }) {
			const open = children !== null && children !== void 0 && children !== false;
			const last = (0, react.useRef)(null);
			if (open) last.current = children;
			const [closing, setClosing] = (0, react.useState)(false);
			const wasOpen = (0, react.useRef)(open);
			(0, react.useEffect)(() => {
				if (open) {
					wasOpen.current = true;
					setClosing(false);
					return;
				}
				if (!wasOpen.current) return;
				wasOpen.current = false;
				setClosing(true);
				const timer = setTimeout(() => {
					last.current = null;
					setClosing(false);
				}, REVEAL_MS);
				return () => clearTimeout(timer);
			}, [open]);
			if (!open && !closing) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: [MnemonFeedback_module_css_default.reveal, className].filter(Boolean).join(" "),
				"data-state": open ? "open" : "closing",
				"aria-hidden": open ? void 0 : true,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: MnemonFeedback_module_css_default.revealBody,
					children: open ? children : last.current
				})
			});
		}
		function reducedMotion() {
			return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
		}
		/** The attribute marking what a change touched, so the page can point at it. */
		const TARGET = "data-mnemon-target";
		/**
		* Point at what a change touched: briefly tint the matching elements, and
		* scroll the first into view when asked to.
		* @param root the element to search within.
		* @param targets values of {@link TARGET}.
		*/
		function locate(root, targets, options = {}) {
			if (root === null) return;
			const marked = [...root.querySelectorAll(`[${TARGET}]`)];
			const elements = targets.flatMap((target) => marked.filter((element) => element.getAttribute(TARGET) === target));
			if (elements.length === 0) return;
			const still = reducedMotion();
			if (options.scroll === true) elements[0].scrollIntoView({
				block: "center",
				behavior: still ? "auto" : "smooth"
			});
			if (still) return;
			for (const element of elements) {
				element.removeAttribute("data-mnemon-flash");
				element.offsetWidth;
				element.setAttribute("data-mnemon-flash", "");
				setTimeout(() => {
					element.removeAttribute("data-mnemon-flash");
				}, 1400);
			}
		}
		/**
		* A state the user should notice, with the actions that resolve it: a state
		* dot, a short title, one line of detail and the buttons.
		*/
		function Callout(props) {
			const role = props.live === false ? void 0 : props.tone === "error" ? "alert" : "status";
			const titleId = (0, react.useId)();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: [MnemonFeedback_module_css_default.callout, props.className].filter(Boolean).join(" "),
				"data-tone": props.tone,
				"aria-labelledby": titleId,
				...role === void 0 ? {} : { role },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, {
						state: props.tone,
						className: MnemonFeedback_module_css_default.calloutDot
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonFeedback_module_css_default.calloutCopy,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
							id: titleId,
							children: props.title
						}), props.children !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.children })]
					}),
					props.actions !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonFeedback_module_css_default.calloutActions,
						children: props.actions
					})
				]
			});
		}
		/**
		* A button whose own label says when its write is running, so the result of
		* a press shows where the press happened.
		*/
		function ActionButton(props) {
			const pending = props.pending === true;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: props.primary === true ? "primary" : "outline",
				size: "sm",
				className: MnemonFeedback_module_css_default.actionButton,
				disabled: props.disabled === true || pending,
				"aria-busy": pending || void 0,
				...props.ariaLabel === void 0 ? {} : { "aria-label": props.ariaLabel },
				onClick: props.onClick,
				children: pending ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.TextShimmer, {
					active: true,
					children: props.pendingLabel ?? props.label
				}) : props.label
			});
		}
		//#endregion
		//#region src/client/settings-controls.tsx
		/** Marks a row as the place a component's state shows, so the page can point at it. */
		const targetOf = (target) => target === void 0 ? {} : { [TARGET]: target };
		/**
		* A DSH preference row: title and hint on the left, one control on the right.
		* Shared by Mnemon Settings and the Plugins page composition.
		*/
		function SettingRow(props) {
			const title = props.htmlFor === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
				id: props.titleId,
				children: props.title
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
				id: props.titleId,
				htmlFor: props.htmlFor,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.title })
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonSettingsCard_module_css_default.settingRow,
				"data-stacked": props.stacked === true ? "" : void 0,
				...targetOf(props.target),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.settingCopy,
					children: [title, props.hint !== void 0 && props.hint !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: props.hint })]
				}), props.children !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: MnemonSettingsCard_module_css_default.settingControl,
					children: props.children
				})]
			});
		}
		/** The DSH settings selector: a gray button that opens a Menu of the options. */
		function SettingSelect(props) {
			const [open, setOpen] = (0, react.useState)(false);
			const valueId = (0, react.useId)();
			const current = props.options.find((option) => option.value === props.value);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open,
				onClose: () => setOpen(false),
				align: "end",
				portal: true,
				selectedId: props.value,
				listClassName: MnemonSettingsCard_module_css_default.selectMenu,
				items: props.options.map((option) => ({
					id: option.value,
					label: option.detail === void 0 ? option.label : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: MnemonSettingsCard_module_css_default.selectOption,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: option.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: option.detail })]
					}),
					...option.disabled === true ? { disabled: true } : {}
				})),
				onSelect: (id) => {
					setOpen(false);
					if (id !== props.value) props.onChange(id);
				},
				anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: MnemonSettingsCard_module_css_default.selector,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					"aria-labelledby": `${props.labelledBy} ${valueId}`,
					disabled: props.disabled,
					onClick: () => setOpen((value) => !value),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						id: valueId,
						children: current?.label ?? props.value
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { size: 12 })]
				})
			});
		}
		/** A row whose control is a selector; the chosen option's detail doubles as the hint. */
		function SelectRow(props) {
			const titleId = `${props.id}-title`;
			const detail = props.options.find((option) => option.value === props.value)?.detail;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingRow, {
				title: props.label,
				titleId,
				hint: props.hint ?? detail,
				target: props.target,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingSelect, {
					labelledBy: titleId,
					value: props.value,
					options: props.options,
					disabled: props.disabled === true,
					onChange: props.onChange
				})
			});
		}
		/**
		* A row whose control is the DSH Switch. A note under the hint states what the
		* switch depends on and offers what resolves it; it slides in and out.
		*/
		function ToggleRow(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonSettingsCard_module_css_default.toggleRow,
				id: props.id,
				...targetOf(props.target),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.settingCopy,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.label }),
						props.hint !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: props.hint }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Reveal, { children: props.note === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MnemonSettingsCard_module_css_default.rowNote,
							children: props.note
						}) })
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
					className: MnemonSettingsCard_module_css_default.switch,
					checked: props.checked,
					label: props.ariaLabel ?? props.label,
					disabled: props.disabled,
					onChange: props.onChange
				})]
			});
		}
		//#endregion
		//#region src/client/view-store.ts
		/** The Host's answer when a View write was prepared against an older revision. */
		const STALE_VIEW = /configuration changed/u;
		/** How long the plugin manager's announcements of a write's own switches may trail it. */
		const ECHO_MS = 5e3;
		/** Keep each requested switch and option, over the configuration the Host holds now. */
		function rebase(request, dashboard) {
			return Object.fromEntries(Object.entries(request.entries).map(([entryId, preference]) => {
				const current = dashboard.entries.find((entry) => entry.entryId === entryId);
				const config = request.configured.includes(entryId) ? preference.config : current?.config ?? preference.config;
				return [entryId, {
					enabled: preference.enabled,
					config: structuredClone(config)
				}];
			}));
		}
		/** Entries whose switch differs between two dashboards, as they are after. */
		function switchedEntries(before, after) {
			return after.entries.filter((entry) => {
				const previous = before.entries.find((candidate) => candidate.entryId === entry.entryId);
				return previous !== void 0 && previous.enabled !== entry.enabled;
			});
		}
		/** Entries whose options differ between two dashboards, as they are after. */
		function reconfiguredEntries(before, after) {
			return after.entries.filter((entry) => {
				const previous = before.entries.find((candidate) => candidate.entryId === entry.entryId);
				return previous !== void 0 && JSON.stringify(previous.config) !== JSON.stringify(entry.config);
			});
		}
		function moved(before, after) {
			return before.strategyTypeId !== after.strategyTypeId || switchedEntries(before, after).length > 0 || reconfiguredEntries(before, after).length > 0;
		}
		/**
		* One reader and writer of the View dashboard for the configuration page, so
		* the overview and the Strategy, memory layer and Provider groups show the
		* same component states and switch components through one revision-fenced
		* write. It records each change with the states on either side, so the page
		* can say what changed, undo its own writes and retry a refused one.
		*/
		var MnemonViewStore = class {
			client;
			state;
			listeners = /* @__PURE__ */ new Set();
			ticket = 0;
			seq = 0;
			last;
			own;
			constructor(client) {
				this.client = client;
				this.state = {
					status: client === void 0 ? "unavailable" : "loading",
					dashboard: null,
					working: null,
					failure: null,
					change: null
				};
			}
			getSnapshot = () => this.state;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			/** Re-read the dashboard, keeping the current one on screen until the answer arrives. */
			async load() {
				if (this.client === void 0 || this.state.working !== null) return;
				const ticket = ++this.ticket;
				const previous = this.state.status === "ready" ? this.state.dashboard : null;
				if (this.state.status !== "ready") this.publish({
					...this.state,
					status: "loading"
				});
				try {
					const dashboard = await this.client.viewDashboard();
					if (ticket !== this.ticket) return;
					const external = previous !== null && moved(previous, dashboard) && !this.echoes(previous, dashboard);
					this.publish({
						...this.state,
						status: "ready",
						dashboard,
						failure: null,
						change: external ? {
							seq: ++this.seq,
							origin: "external",
							before: previous,
							after: dashboard
						} : this.state.change
					});
				} catch {
					if (ticket === this.ticket) this.publish({
						...this.state,
						status: "unavailable",
						dashboard: null
					});
				}
			}
			/**
			* Switch components and choose the main Strategy in one View write. The
			* change shows at once and reverts to the Host's state if refused; a write
			* that met a change made elsewhere is applied once more on top of it.
			* @param strategyTypeId the main Strategy to choose; omitted, the write keeps the one the Host holds.
			* @returns whether the Host accepted the write.
			*/
			async apply(key, strategyTypeId, entries, configured = []) {
				const previous = this.state.dashboard;
				if (this.client === void 0 || previous === null || this.state.working !== null) return false;
				const ticket = ++this.ticket;
				const request = {
					key,
					strategyTypeId,
					entries,
					configured
				};
				this.last = request;
				this.own = {
					at: Date.now(),
					request
				};
				const optimistic = {
					...previous,
					strategyTypeId: strategyTypeId ?? previous.strategyTypeId,
					entries: previous.entries.map((entry) => entries[entry.entryId] === void 0 ? entry : {
						...entry,
						enabled: entries[entry.entryId].enabled,
						active: entries[entry.entryId].enabled,
						...configured.includes(entry.entryId) ? { config: entries[entry.entryId].config } : {}
					})
				};
				this.publish({
					...this.state,
					working: {
						key,
						before: previous,
						after: optimistic
					},
					failure: null,
					dashboard: optimistic
				});
				let base = previous;
				try {
					for (let attempt = 0;; attempt += 1) try {
						await this.client.applyView({
							expectedRevision: base.revision,
							strategyTypeId: strategyTypeId ?? base.strategyTypeId,
							entries: rebase(request, base)
						});
						break;
					} catch (reason) {
						const latest = attempt === 0 && STALE_VIEW.test(message(reason)) ? await this.client.viewDashboard().catch(() => void 0) : void 0;
						if (latest === void 0 || ticket !== this.ticket) throw reason;
						base = latest;
					}
				} catch {
					if (ticket !== this.ticket) return false;
					const current = await this.client.viewDashboard().catch(() => previous);
					if (ticket === this.ticket) this.publish({
						...this.state,
						dashboard: current,
						working: null,
						failure: {
							seq: ++this.seq,
							key,
							kind: "apply"
						}
					});
					return false;
				}
				try {
					const next = await this.client.viewDashboard();
					if (ticket === this.ticket) this.publish({
						...this.state,
						status: "ready",
						dashboard: next,
						working: null,
						change: {
							seq: ++this.seq,
							origin: "own",
							key,
							before: base,
							after: next
						}
					});
				} catch {
					if (ticket === this.ticket) this.publish({
						...this.state,
						dashboard: this.state.dashboard === null ? null : {
							...this.state.dashboard,
							writable: false
						},
						working: null,
						failure: {
							seq: ++this.seq,
							key,
							kind: "refresh"
						}
					});
				}
				return true;
			}
			/** Switch components on or off, keeping whichever main Strategy the Host holds. */
			setEnabled(key, changes) {
				return this.apply(key, void 0, Object.fromEntries(changes.map(({ entry, enabled }) => [entry.entryId, {
					enabled,
					config: structuredClone(entry.config)
				}])));
			}
			/** Set one component's options, keeping its switch. */
			configure(key, entry, config) {
				return this.apply(key, void 0, { [entry.entryId]: {
					enabled: entry.enabled,
					config: structuredClone(config)
				} }, [entry.entryId]);
			}
			/** Put back the main Strategy, the switches and the options a change moved. */
			revert(change) {
				const reconfigured = reconfiguredEntries(change.before, change.after).map((entry) => entry.entryId);
				const touched = /* @__PURE__ */ new Set([...switchedEntries(change.before, change.after).map((entry) => entry.entryId), ...reconfigured]);
				const entries = Object.fromEntries([...touched].map((entryId) => {
					const before = change.before.entries.find((candidate) => candidate.entryId === entryId);
					return [entryId, {
						enabled: before.enabled,
						config: structuredClone(before.config)
					}];
				}));
				return this.apply("revert:" + String(change.seq), change.before.strategyTypeId, entries, reconfigured);
			}
			/** Send the last refused write again, over the state the Host holds now. */
			retry() {
				const last = this.last;
				return last === void 0 ? Promise.resolve(false) : this.apply(last.key, last.strategyTypeId, last.entries, last.configured);
			}
			/** Whether a reload only shows the switches this page's latest write asked for. */
			echoes(before, after) {
				const own = this.own;
				if (own === void 0 || Date.now() - own.at > ECHO_MS) return false;
				if (before.strategyTypeId !== after.strategyTypeId && after.strategyTypeId !== own.request.strategyTypeId) return false;
				return switchedEntries(before, after).every((entry) => own.request.entries[entry.entryId]?.enabled === entry.enabled) && reconfiguredEntries(before, after).every((entry) => own.request.configured.includes(entry.entryId));
			}
			publish(state) {
				this.state = state;
				for (const listener of [...this.listeners]) listener();
			}
		};
		/** The page's View store, re-read whenever `refreshKey` moves. */
		function useViewStore(client, refreshKey) {
			const store = (0, react.useMemo)(() => new MnemonViewStore(client), [client]);
			const state = (0, react.useSyncExternalStore)(store.subscribe, store.getSnapshot, store.getSnapshot);
			(0, react.useEffect)(() => {
				store.load();
			}, [store, refreshKey]);
			return {
				store,
				state
			};
		}
		//#endregion
		//#region src/client/CompositionBoard.tsx
		/**
		* The groups the composition is drawn in, by the role a component declares.
		* A role missing here still gets a group of its own, titled by its id, so a
		* new kind of component appears without a change to this page.
		*/
		const ROLE_GROUPS = [{
			role: "source",
			title: "board.sources"
		}, {
			role: "strategy-extension",
			title: "board.enhancements"
		}];
		/** More components than this, and the board offers a search. */
		const SEARCH_FROM = 8;
		function usePageTrail() {
			const [trail, setTrail] = (0, react.useState)([]);
			return (0, react.useMemo)(() => ({
				trail,
				open: (entryId, from) => setTrail((current) => from === "page" ? current.at(-1) === entryId ? current : [...current, entryId] : [entryId]),
				back: () => setTrail((current) => current.slice(0, -1)),
				close: () => setTrail([])
			}), [trail]);
		}
		/** A component's name, which opens its page; underlined on hover. */
		function PageLink(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: MnemonSettingsCard_module_css_default.pageLink,
				"aria-haspopup": "dialog",
				onClick: props.onOpen,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.label })
			});
		}
		/** The gear that opens a component's page where its settings are: the page's visible way in. */
		function SettingsGear(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: MnemonSettingsCard_module_css_default.boardIconButton,
				"aria-haspopup": "dialog",
				"aria-label": props.label,
				title: props.label,
				onClick: props.onOpen,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSettingsOutlineRegular, { size: 16 })
			});
		}
		/** Components named as chips, each opening its page; the dot-less chip is one switched off. */
		function ComponentChips(props) {
			if (props.chips.length === 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: MnemonSettingsCard_module_css_default.boardLinks,
				children: [props.label !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: MnemonSettingsCard_module_css_default.boardLinksLabel,
					children: props.label
				}), props.chips.map((chip) => chip.open === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: MnemonSettingsCard_module_css_default.boardLink,
					title: chip.title,
					"data-on": chip.on ? "" : void 0,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconLinkOutlineRegular, { size: 12 }), chip.name]
				}, chip.key) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: MnemonSettingsCard_module_css_default.boardLink,
					"aria-haspopup": "dialog",
					title: chip.title,
					"data-on": chip.on ? "" : void 0,
					onClick: chip.open,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconLinkOutlineRegular, { size: 12 }), chip.name]
				}, chip.key))]
			});
		}
		/** The View request for a plan: every switch it moves, each keeping its options. */
		function requestOf(plan) {
			return plan.changes === void 0 ? void 0 : Object.fromEntries(plan.changes.map(({ entry, enabled }) => [entry.entryId, {
				enabled,
				config: structuredClone(entry.config)
			}]));
		}
		/**
		* One main Strategy composes memory. Choosing one switches it on and every
		* other main Strategy off, with whatever that brings or takes along.
		*/
		function chooseMain(store, dashboard, entry) {
			const entries = requestOf(mainPlan(dashboard, entry));
			return entries === void 0 ? Promise.resolve(false) : store.apply("strategy:" + entry.entryId, entry.typeId, entries);
		}
		/** Switch one component, with whatever it brings or takes along. */
		function switchComponent(store, dashboard, entry, enabled) {
			const plan = switchPlan(dashboard, entry, enabled);
			return plan.changes === void 0 ? Promise.resolve(false) : store.setEnabled("component:" + entry.entryId, plan.changes);
		}
		/**
		* Turn a memory layer on or off with its Source component, which DSH's
		* component list shows as the same switch. A layer an earlier configuration
		* turned off comes back on through that saved switch as well.
		*/
		async function switchLayer(view, system, layers, layerId, on) {
			const dashboard = view.state.dashboard;
			const component = dashboard === null ? void 0 : sourceOf(dashboard, layerId);
			const saved = system?.configuration.layers[layerId]?.enabled !== false;
			if (component === void 0 || !component.writable) {
				if (saved !== on) await layers.set(layerId, on);
				return;
			}
			if (on && !saved) await layers.set(layerId, true);
			if (component.enabled !== on) await switchComponent(view.store, dashboard, component, on);
		}
		/**
		* A component as a preference row: its name and what it does; the components
		* it relates to, each opening its own page; its state as DSH shows it; a gear
		* where it has settings of its own; and its switch. The gear and the name
		* both open the component's page.
		*/
		function BoardRow(props) {
			const { item, t } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: MnemonSettingsCard_module_css_default.boardRow,
				[TARGET]: item.target,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.boardRowLine,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.settingCopy,
						children: [
							props.onOpen === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: item.label }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageLink, {
								label: item.label,
								onOpen: props.onOpen
							}),
							item.hint !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: item.hint }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComponentChips, { chips: item.relations })
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.boardControl,
						children: [
							item.state !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StateLabel, { state: item.state }),
							props.onOpen !== void 0 && props.configurable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsGear, {
								label: t("options.aria", { component: item.label }),
								onOpen: props.onOpen
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
								className: MnemonSettingsCard_module_css_default.switch,
								checked: item.checked,
								label: item.label,
								disabled: item.disabled,
								onChange: item.onSwitch
							})
						]
					})]
				})
			});
		}
		function StateLabel(props) {
			const { state } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: MnemonSettingsCard_module_css_default.boardState,
				"data-tone": state.pending === true ? "ongoing" : state.tone,
				children: state.pending === true ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.TextShimmer, {
					active: true,
					children: state.text
				})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [state.tone !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: state.tone }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: state.text })] })
			});
		}
		/**
		* The memory composition, drawn from the components installed: the main
		* Strategy as a choice of one, then a group of switches for each role the
		* other components declare. Shipped components and installed extensions are
		* named, related and configured the same way, from their own declarations.
		* Every switch applies at once and brings or takes along what depends on it;
		* a component's page says what that would be and holds its options. The
		* board speaks up only when memory is not composed as chosen.
		*/
		function CompositionBoard(props) {
			const { view, system, t, language } = props;
			const instance = (0, react.useId)();
			const [layerPending, setLayerPending] = (0, react.useState)(null);
			const ownPages = usePageTrail();
			const pages = props.pages ?? ownPages;
			const [othersOpen, setOthersOpen] = (0, react.useState)(false);
			const [query, setQuery] = (0, react.useState)("");
			const dashboard = view.state.dashboard;
			const componentsUnavailable = dashboard === null && view.state.status === "unavailable";
			const pageMode = props.page !== void 0;
			if (componentsUnavailable && (pageMode || system === null)) return pageMode ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: MnemonSettingsCard_module_css_default.boardEmpty,
				role: "status",
				children: t("board.componentsUnavailable")
			}) : null;
			const name = (entry) => componentCopy(entry, language).label;
			const model = dashboard === null ? void 0 : componentModel(dashboard);
			const working = view.state.working;
			const changing = new Map(working === null ? [] : switchedEntries(working.before, working.after).map((entry) => [entry.entryId, entry.enabled]));
			const busy = working !== null || layerPending !== null || props.readOnly;
			const locked = busy || dashboard?.writable !== true;
			const selectedRunning = model !== void 0 && model.selected !== void 0 && model.selected === model.composing;
			const pendingText = (on) => t(on ? "board.turningOn" : "board.turningOff");
			const placeholders = (count) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: MnemonSettingsCard_module_css_default.boardGroup,
				"aria-hidden": "true",
				children: Array.from({ length: count }, (_, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.placeholderRow,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})]
				}, index))
			});
			const frame = (content, pending) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: `${MnemonSettingsCard_module_css_default.section} ${MnemonSettingsCard_module_css_default.boardSection}`,
				"aria-labelledby": `${instance}-heading`,
				"aria-busy": pending,
				[TARGET]: "overview",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.sectionHeading,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
							id: `${instance}-heading`,
							children: t("board.title")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("board.description") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonSettingsCard_module_css_default.appliesNow,
							children: t("config.appliesNow")
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: MnemonSettingsCard_module_css_default.board,
					children: content
				})]
			});
			if (model === void 0 && !componentsUnavailable) {
				if (pageMode) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
					className: MnemonSettingsCard_module_css_default.boardLoading,
					role: "status",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.TextShimmer, {
						active: true,
						children: t("board.loading")
					})]
				});
				return frame(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
					className: MnemonSettingsCard_module_css_default.boardLoading,
					role: "status",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: "ongoing" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.TextShimmer, {
						active: true,
						children: t("board.loading")
					})]
				}), placeholders(4)] }), true);
			}
			const problem = model === void 0 ? {
				tone: "idle",
				text: t("board.componentsUnavailable"),
				actions: []
			} : working === null ? problemOf(props, model, dashboard, name) : void 0;
			const stateOf = (entry) => {
				const pending = changing.get(entry.entryId);
				if (pending !== void 0) return {
					text: pendingText(pending),
					pending: true
				};
				if (!entry.enabled) return entry.roles.includes("source") ? {
					tone: "idle",
					text: t("board.off")
				} : void 0;
				const unmet = unmetRequirements(dashboard, entry)[0];
				if (unmet !== void 0) return {
					tone: "warning",
					text: unmet.providers[0] === void 0 ? t("board.needsMissing") : t("board.needs", { component: name(unmet.providers[0]) })
				};
				if (!entry.active) return {
					tone: "warning",
					text: t("board.notRunning")
				};
				if (entry.roles.includes("strategy-extension") && !enhancementApplies(entry, model.composing)) return {
					tone: "idle",
					text: t("board.unused")
				};
				if (entry.roles.includes("source") && switchPlan(dashboard, entry, false).blocked === "last-source") return {
					tone: "done",
					text: t("board.lastSource")
				};
				return {
					tone: "done",
					text: t("board.running")
				};
			};
			/**
			* The components a row names: each one it needs that only a single installed
			* component provides, and each running one that depends on it alone.
			*/
			const relationsFor = (entry) => {
				const relations = relationsOf(dashboard, entry);
				const needs = relations.needs.flatMap((need) => need.providers.length === 1 ? [need.providers[0]] : []).map((other) => ({
					key: "needs:" + other.entryId,
					name: name(other),
					on: other.enabled,
					title: t("board.relationNeeds", { component: name(other) }),
					open: () => pages.open(other.entryId, "configuration")
				}));
				const neededBy = relations.neededBy.map((other) => ({
					key: "by:" + other.entryId,
					name: name(other),
					on: true,
					title: t("board.relationNeededBy", { component: name(other) }),
					open: () => pages.open(other.entryId, "configuration")
				}));
				return [...needs, ...neededBy];
			};
			/** A component's own row: its switch brings or takes along what depends on it. */
			const componentItem = (entry, target) => {
				const plan = switchPlan(dashboard, entry, !entry.enabled);
				const missing = !entry.enabled && unmetRequirements(dashboard, entry).some((unmet) => unmet.providers.length === 0);
				return {
					key: entry.entryId,
					entry,
					label: name(entry),
					hint: componentCopy(entry, language).hint,
					relations: relationsFor(entry),
					state: stateOf(entry),
					checked: changing.get(entry.entryId) ?? entry.enabled,
					target,
					disabled: locked || !entry.writable || !selectedRunning || missing || plan.blocked !== void 0,
					onSwitch: (next) => {
						switchComponent(view.store, dashboard, entry, next);
					}
				};
			};
			const layerIds = Object.keys(system?.configuration.layers ?? {});
			const sources = dashboard?.entries.filter((entry) => entry.roles.includes("source")) ?? [];
			const sourceItems = [.../* @__PURE__ */ new Set([...layerIds, ...sources.map((entry) => layerOf(entry) ?? "component:" + entry.entryId)])].map((key) => {
				const layerId = key.startsWith("component:") ? void 0 : key;
				const component = layerId === void 0 ? sources.find((entry) => "component:" + entry.entryId === key) : dashboard === null ? void 0 : sourceOf(dashboard, layerId);
				if (layerId === void 0) return componentItem(component, key);
				const saved = system?.configuration.layers[layerId]?.enabled !== false;
				const pending = layerPending !== null && layerPending.layerId === layerId ? layerPending.on : void 0;
				const run = (next) => {
					if (component === void 0 || !component.writable || !saved) setLayerPending({
						layerId,
						on: next
					});
					switchLayer(view, system, props.layers, layerId, next).finally(() => setLayerPending((current) => current?.layerId === layerId ? null : current));
				};
				if (component !== void 0) {
					const item = componentItem(component, "layer:" + layerId);
					return {
						...item,
						onSwitch: run,
						checked: pending ?? (saved && item.checked),
						state: pending !== void 0 ? {
							text: pendingText(pending),
							pending: true
						} : !saved ? {
							tone: "idle",
							text: t("board.off")
						} : item.state,
						disabled: busy || item.disabled && component.writable && saved
					};
				}
				const running = system?.sources.some((source) => source.sourceTypeId === layerId) === true;
				return {
					key,
					entry: void 0,
					label: system?.sources.find((source) => source.sourceTypeId === layerId)?.management.label ?? layerId,
					hint: "",
					relations: [],
					target: "layer:" + layerId,
					onSwitch: run,
					disabled: busy,
					checked: pending ?? saved,
					state: pending !== void 0 ? {
						text: pendingText(pending),
						pending: true
					} : !saved ? {
						tone: "idle",
						text: t("board.off")
					} : running ? {
						tone: "done",
						text: t("board.running")
					} : {
						tone: "warning",
						text: t("board.notRunning")
					}
				};
			});
			const others = dashboard?.entries.filter((entry) => !entry.roles.includes("strategy") && !entry.roles.includes("source")) ?? [];
			const roles = [...new Set(others.map((entry) => entry.roles.find((role) => role !== "strategy" && role !== "source")))].sort((left, right) => rank(left) - rank(right) || left.localeCompare(right));
			const total = sourceItems.length + others.length;
			const needle = query.trim().toLowerCase();
			const matches = (item) => needle === "" || [
				item.label,
				item.hint,
				item.entry?.packageName ?? ""
			].some((text) => text.toLowerCase().includes(needle));
			const openRow = (entry) => entry === void 0 ? void 0 : () => pages.open(entry.entryId, "configuration");
			const configurable = (entry) => entry !== void 0 && (entry.fields.length > 0 || props.componentSettings?.has(entry.packageName) === true);
			const rows = (items) => items.filter(matches).map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BoardRow, {
				item,
				configurable: configurable(item.entry),
				t,
				onOpen: openRow(item.entry)
			}, item.key));
			const count = (items) => t("board.enabledCount", {
				on: items.filter((item) => item.checked).length,
				total: items.length
			});
			const otherItems = others.map((entry) => componentItem(entry, "enhancement:" + entry.entryId));
			const groups = roles.map((role) => {
				const items = otherItems.filter((item) => item.entry.roles.includes(role));
				const title = ROLE_GROUPS.find((group) => group.role === role)?.title;
				const fits = (entry) => role !== "strategy-extension" || entry.enabled || changing.has(entry.entryId) || enhancementApplies(entry, model?.composing ?? model?.selected);
				const shown = items.filter((item) => fits(item.entry));
				const later = items.filter((item) => !fits(item.entry));
				const visible = rows(shown);
				const hidden = rows(later);
				if (needle !== "" && visible.length === 0 && hidden.length === 0) return null;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.boardGroup,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonSettingsCard_module_css_default.boardGroupHead,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: title === void 0 ? role : t(title) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: count(items) })]
						}),
						visible,
						later.length > 0 && (needle === "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonSettingsCard_module_css_default.boardOthers,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: MnemonSettingsCard_module_css_default.boardOthersToggle,
								"aria-expanded": othersOpen,
								onClick: () => setOthersOpen((value) => !value),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { size: 12 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("board.otherEnhancements", { count: later.length }) })]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Reveal, { children: othersOpen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MnemonSettingsCard_module_css_default.boardOthersList,
								children: hidden
							}) : null })]
						}) : hidden)
					]
				}, role);
			});
			const sourceRows = rows(sourceItems);
			const mainState = (entry) => {
				const pending = changing.get(entry.entryId);
				if (pending !== void 0) return {
					text: pendingText(pending),
					pending: true
				};
				if (entry === model?.composing) return {
					tone: "done",
					text: t("board.composing")
				};
				return entry.enabled ? {
					tone: "warning",
					text: t("board.notRunning")
				} : {
					tone: "idle",
					text: t("board.off")
				};
			};
			/** A component's page: its state and control, as its row has them, and what it declares and contributed. */
			const pageOf = (entry, board) => {
				const isMain = entry.roles.includes("strategy");
				const item = isMain ? void 0 : [...sourceItems, ...otherItems].find((candidate) => candidate.entry === entry);
				const control = isMain ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MainChoice, {
					selected: entry.typeId === board.strategyTypeId,
					disabled: locked || !entry.writable,
					t,
					onChoose: () => {
						chooseMain(view.store, board, entry);
					}
				}) : item === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
					className: MnemonSettingsCard_module_css_default.switch,
					checked: item.checked,
					label: item.label,
					disabled: item.disabled,
					onChange: item.onSwitch
				});
				return {
					entry,
					dashboard: board,
					name,
					hint: componentCopy(entry, language).hint,
					state: isMain ? mainState(entry) : item?.state,
					control,
					writable: !locked,
					applying: working?.key === "options:" + entry.entryId,
					language,
					t,
					settings: props.componentSettings?.has(entry.packageName) === true ? props.componentSettings.render(entry, !props.readOnly) : void 0,
					onApply: (config) => view.store.configure("options:" + entry.entryId, entry, config)
				};
			};
			const openedId = pages.trail.at(-1);
			const open = openedId === void 0 || dashboard === null ? void 0 : dashboard.entries.find((entry) => entry.entryId === openedId);
			const previous = pages.trail.length < 2 || dashboard === null ? void 0 : dashboard.entries.find((entry) => entry.entryId === pages.trail.at(-2));
			const details = open === void 0 || dashboard === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComponentDetails, {
				...pageOf(open, dashboard),
				...previous === void 0 ? {} : { back: {
					name: name(previous),
					go: pages.back
				} },
				onOpen: (other) => pages.open(other.entryId, "page"),
				onClose: pages.close
			});
			if (pageMode) {
				const own = dashboard?.entries.find((entry) => entry.packageName === props.page);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: MnemonSettingsCard_module_css_default.componentRowPage,
					"aria-busy": working !== null,
					children: [own === void 0 || dashboard === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MnemonSettingsCard_module_css_default.boardEmpty,
						role: "status",
						children: t("board.componentsUnavailable")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComponentPage, {
						...pageOf(own, dashboard),
						headed: true,
						onOpen: (other) => pages.open(other.entryId, "configuration")
					}), details]
				});
			}
			return frame(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Reveal, { children: problem === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Callout, {
					tone: problem.tone,
					className: MnemonSettingsCard_module_css_default.boardProblem,
					title: problem.text,
					...problem.actions.length === 0 ? {} : { actions: problem.actions.map((action) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ActionButton, {
						label: action.label,
						disabled: locked,
						...action.primary === true ? { primary: true } : {},
						onClick: action.run
					}, action.key)) }
				}) }),
				model !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MainStrategyRow, {
					...props,
					model,
					dashboard,
					locked,
					name,
					pending: working?.key.startsWith("strategy:") === true,
					onOpen: model.selected === void 0 ? void 0 : () => pages.open(model.selected.entryId, "configuration")
				}),
				total > SEARCH_FROM && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
					className: MnemonSettingsCard_module_css_default.boardSearch,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutlineRegular, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "search",
						value: query,
						placeholder: t("board.search"),
						"aria-label": t("board.search"),
						onChange: (event) => setQuery(event.target.value)
					})]
				}),
				sourceRows.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.boardGroup,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.boardGroupHead,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("board.sources") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: count(sourceItems) })]
					}), sourceRows]
				}) : needle === "" && props.systemPending === true ? placeholders(3) : null,
				groups,
				needle !== "" && sourceRows.length === 0 && groups.every((group) => group === null) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: MnemonSettingsCard_module_css_default.boardEmpty,
					children: t("board.searchEmpty", { query: query.trim() })
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: MnemonSettingsCard_module_css_default.boardFootnote,
					children: t("board.more")
				}),
				details
			] }), working !== null);
		}
		function rank(role) {
			const index = ROLE_GROUPS.findIndex((group) => group.role === role);
			return index < 0 ? ROLE_GROUPS.length : index;
		}
		/**
		* The main Strategy as a choice of one, the same way however many are
		* installed: a selector naming each with its description. Its gear opens the
		* selected Strategy's page, with its options and settings.
		*/
		function MainStrategyRow(props) {
			const { model, dashboard, t } = props;
			const id = (0, react.useId)();
			const { mains, selected } = model;
			if (mains.length === 0) return null;
			const choose = (typeId) => {
				const entry = mains.find((candidate) => candidate.typeId === typeId);
				if (entry !== void 0) chooseMain(props.view.store, dashboard, entry);
			};
			const hint = selected === void 0 ? t("board.strategyMissing") : componentCopy(selected, props.language).hint;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: `${MnemonSettingsCard_module_css_default.boardRow} ${MnemonSettingsCard_module_css_default.boardMain}`,
				[TARGET]: "strategy",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.boardRowLine,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.settingCopy,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
							id: `${id}-title`,
							children: t("config.strategyTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: hint })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.boardControl,
						children: [
							props.pending && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StateLabel, { state: {
								text: t("board.switching"),
								pending: true
							} }),
							props.onOpen !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingsGear, {
								label: t("details.open", { component: props.name(selected) }),
								onOpen: props.onOpen
							}),
							mains.length === 1 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MnemonSettingsCard_module_css_default.boardValue,
								children: props.name(mains[0])
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingSelect, {
								labelledBy: `${id}-title`,
								value: dashboard.strategyTypeId,
								disabled: props.locked,
								onChange: choose,
								options: mains.map((entry) => ({
									value: entry.typeId,
									label: props.name(entry),
									detail: componentCopy(entry, props.language).hint,
									...entry.writable ? {} : { disabled: true }
								}))
							})
						]
					})]
				})
			});
		}
		/** Whether memory is composed as chosen; when it is not, what is wrong and the one switch that fixes it. */
		function problemOf(props, model, dashboard, name) {
			const { view, system, t } = props;
			const { selected, composing, idle, contenders } = model;
			const choose = (entry) => () => {
				chooseMain(view.store, dashboard, entry);
			};
			const enableSelected = selected !== void 0 && !selected.enabled ? [{
				key: "strategy:" + selected.entryId,
				label: t("config.enableStrategy", { strategy: name(selected) }),
				primary: true,
				run: choose(selected)
			}] : [];
			if (composing === void 0) {
				const text = selected === void 0 ? t("board.noMainMissing") : contenders.length > 0 ? t("board.contenders", {
					strategy: name(selected),
					strategies: nameList(contenders.map(name), t)
				}) : !selected.enabled ? t("board.noMainOff", { strategy: name(selected) }) : t("board.noMainWaiting", { strategy: name(selected) });
				const alternatives = selected === void 0 ? model.mains.filter((entry) => entry.writable).slice(0, 2).map((entry) => ({
					key: "strategy:" + entry.entryId,
					label: t("config.useStrategy", { strategy: name(entry) }),
					run: choose(entry)
				})) : [];
				return {
					tone: "error",
					text,
					actions: [...enableSelected, ...alternatives]
				};
			}
			if (composing !== selected) return {
				tone: "warning",
				text: selected === void 0 ? t("board.fallbackMissing", { composing: name(composing) }) : t("board.fallback", {
					selected: name(selected),
					composing: name(composing)
				}),
				actions: [...enableSelected, {
					key: "strategy:" + composing.entryId,
					label: t("config.useStrategy", { strategy: name(composing) }),
					run: choose(composing)
				}]
			};
			if (system !== null && !system.serving) {
				const missing = dashboard.entries.find((entry) => entry.roles.includes("source") && !entry.enabled && entry.writable);
				return {
					tone: "error",
					text: t(system.evaluation.diagnostics.some((diagnostic) => diagnostic.code === "missing-source") ? "board.noSource" : "board.memoryOff"),
					actions: missing === void 0 ? [] : [{
						key: "component:" + missing.entryId,
						label: t("config.enableComponentNamed", { component: name(missing) }),
						primary: true,
						run: () => {
							switchComponent(view.store, dashboard, missing, true);
						}
					}]
				};
			}
			if (system !== null && system.evaluation.state !== "ready") return {
				tone: "warning",
				text: t("board.stale"),
				actions: []
			};
			if (idle.length > 0) {
				const names = nameList(idle.map(name), t);
				return {
					tone: "warning",
					text: t("board.idle", { strategies: names }),
					actions: [{
						key: "strategy:idle",
						label: t("config.stopStrategies", { strategies: names }),
						run: () => {
							view.store.setEnabled("strategy:idle", idle.map((entry) => ({
								entry,
								enabled: false
							})));
						}
					}]
				};
			}
		}
		//#endregion
		//#region src/client/component-feedback.ts
		/** Where a component shows on the configuration page. */
		function targetsOf(entry) {
			if (entry.roles.includes("strategy")) return ["strategy"];
			if (entry.roles.includes("strategy-extension")) return ["enhancement:" + entry.entryId];
			const layer = layerOf(entry);
			if (layer === void 0) return [];
			return layer === "memory-spaces" ? ["layer:" + layer, "providers"] : ["layer:" + layer];
		}
		/** The component a write was made for, from the key of the control that made it. */
		function primaryOf(change) {
			const key = change.key ?? "";
			for (const prefix of [
				"component:",
				"strategy:",
				"options:"
			]) if (key.startsWith(prefix)) return key.slice(prefix.length);
		}
		/**
		* Whether a change needs saying beyond what its own control shows: a change
		* made elsewhere, an undo, a switch that took other components along, a new
		* main Strategy, or memory composed differently. A plain switch already
		* shows its result in its own row.
		*/
		function announces(change) {
			if (change.origin === "external" || change.key?.startsWith("revert:") === true) return true;
			if (reconfiguredEntries(change.before, change.after).length > 0) return true;
			if (change.before.strategyTypeId !== change.after.strategyTypeId || switchedEntries(change.before, change.after).length !== 1) return true;
			return componentModel(change.before).composing?.entryId !== componentModel(change.after).composing?.entryId;
		}
		/**
		* Say what moved between two dashboards, leading with what it does to memory
		* as a whole: whether a main Strategy still composes it, and which one.
		* @param origin `own` for a write from this page, `external` for one made elsewhere.
		* @param name a component's display name.
		* @param primary the component the write was made for, when it took others along.
		*/
		function describeChange(before, after, origin, name, t, primary) {
			const switched = switchedEntries(before, after);
			const reconfigured = reconfiguredEntries(before, after);
			if (switched.length === 0 && reconfigured.length === 0 && before.strategyTypeId === after.strategyTypeId) return void 0;
			const was = componentModel(before);
			const now = componentModel(after);
			const targets = [.../* @__PURE__ */ new Set([
				"overview",
				...switched.flatMap(targetsOf),
				...reconfigured.flatMap(targetsOf),
				...before.strategyTypeId === after.strategyTypeId ? [] : ["strategy"]
			])];
			const own = origin === "own";
			const list = (entries) => entries.map((entry) => t("config.quoted", { name: name(entry) })).join(t("config.listSeparator"));
			if (switched.length === 0 && before.strategyTypeId === after.strategyTypeId) {
				const component = reconfigured.length === 1 ? name(reconfigured[0]) : void 0;
				return {
					text: component === void 0 ? t(own ? "feedback.several" : "feedback.externalSeveral", { count: reconfigured.length }) : t(own ? "feedback.optionsSaved" : "feedback.externalOptions", { component }),
					tone: own ? "success" : "info",
					targets
				};
			}
			if (was.composing !== void 0 && now.composing === void 0) return {
				text: t("feedback.memoryOff"),
				tone: "warning",
				targets
			};
			if (was.composing === void 0 && now.composing !== void 0) return {
				text: t("feedback.memoryRestored", { strategy: name(now.composing) }),
				tone: "success",
				targets
			};
			if (now.composing !== void 0 && now.composing !== now.selected && was.composing?.entryId !== now.composing.entryId) return {
				text: now.selected === void 0 ? t("feedback.fallbackMissing", { composing: name(now.composing) }) : t("feedback.fallback", {
					selected: name(now.selected),
					composing: name(now.composing)
				}),
				tone: "warning",
				targets
			};
			if (was.composing?.entryId !== now.composing?.entryId && now.composing !== void 0) {
				const strategy = name(now.composing);
				if (!own) return {
					text: t("feedback.externalMain", { strategy }),
					tone: "info",
					targets
				};
				const others = switched.filter((entry) => entry !== now.composing);
				const on = others.filter((entry) => entry.enabled);
				const off = others.filter((entry) => !entry.enabled);
				return {
					text: on.length === 0 && off.length === 0 ? t("feedback.switchedMain", { strategy }) : on.length === 0 ? t("feedback.switchedMainOff", {
						strategy,
						others: list(off)
					}) : off.length === 0 ? t("feedback.switchedMainWith", {
						strategy,
						others: list(on)
					}) : t("feedback.switchedMainMixed", {
						strategy,
						on: list(on),
						off: list(off)
					}),
					tone: "success",
					targets
				};
			}
			if (switched.length !== 1) {
				const lead = switched.find((entry) => entry.entryId === primary);
				if (own && lead !== void 0) {
					const on = switched.filter((entry) => entry !== lead && entry.enabled);
					const off = switched.filter((entry) => entry !== lead && !entry.enabled);
					const component = name(lead);
					const text = !lead.enabled ? on.length === 0 ? t("feedback.disabledWith", {
						component,
						others: list(off)
					}) : void 0 : off.length === 0 ? t("feedback.enabledWith", {
						component,
						others: list(on)
					}) : on.length === 0 ? t("feedback.enabledReplacing", {
						component,
						others: list(off)
					}) : t("feedback.enabledMixed", {
						component,
						on: list(on),
						off: list(off)
					});
					if (text !== void 0) return {
						text,
						tone: "success",
						targets
					};
				}
				return {
					text: t(own ? "feedback.several" : "feedback.externalSeveral", { count: switched.length }),
					tone: own ? "success" : "info",
					targets
				};
			}
			const entry = switched[0];
			const component = name(entry);
			if (entry.enabled && now.idle.includes(entry)) return {
				text: t("feedback.idleMain", { component }),
				tone: "warning",
				targets
			};
			const source = layerOf(entry) !== void 0;
			return {
				text: t(own ? source ? entry.enabled ? "feedback.sourceOn" : "feedback.sourceOff" : entry.enabled ? "feedback.componentOn" : "feedback.componentOff" : source ? entry.enabled ? "feedback.externalSourceOn" : "feedback.externalSourceOff" : entry.enabled ? "feedback.externalComponentOn" : "feedback.externalComponentOff", { component }),
				tone: own ? "success" : "info",
				targets
			};
		}
		//#endregion
		//#region src/client/view-feedback.tsx
		/**
		* Say what each component change did, where the user is looking, and point at
		* the rows it touched: this page's own writes with Undo, changes made
		* elsewhere (DSH's component list, another window) with Show, refused writes
		* with Retry.
		* @param root the page, searched for the rows a change touched.
		* @returns the toast to render.
		*/
		function useViewFeedback(view, root, t, language) {
			const toast = useToast();
			const show = toast.show;
			const name = (0, react.useCallback)((entry) => componentCopy(entry, language).label, [language]);
			const { store, state } = view;
			const seenChange = (0, react.useRef)(state.change?.seq ?? 0);
			(0, react.useEffect)(() => {
				const change = state.change;
				if (change === null || change.seq === seenChange.current) return;
				seenChange.current = change.seq;
				if (!announces(change)) return;
				const summary = describeChange(change.before, change.after, change.origin, name, t, primaryOf(change));
				if (summary === void 0) return;
				locate(root.current, summary.targets.filter((target) => target !== "overview"));
				if (change.key?.startsWith("revert:") === true) {
					show({
						text: t("feedback.undone"),
						tone: "success"
					});
					return;
				}
				show({
					text: summary.text,
					tone: summary.tone,
					actions: change.origin === "own" ? [{
						label: t("feedback.undo"),
						run: () => {
							store.revert(change);
						}
					}] : [{
						label: t("feedback.show"),
						run: () => locate(root.current, ["overview"], { scroll: true })
					}]
				});
			}, [
				state.change,
				store,
				name,
				root,
				show,
				t
			]);
			const seenFailure = (0, react.useRef)(state.failure?.seq ?? 0);
			(0, react.useEffect)(() => {
				const failure = state.failure;
				if (failure === null || failure.seq === seenFailure.current) return;
				seenFailure.current = failure.seq;
				if (failure.kind === "refresh") {
					show({
						text: t("config.enhancementsRefreshFailed"),
						tone: "warning"
					});
					return;
				}
				const text = failure.key.startsWith("strategy:") ? t("config.strategyFailed") : t("feedback.failed");
				show({
					text,
					tone: "warning",
					actions: [{
						label: t("feedback.retry"),
						run: () => {
							store.retry();
						}
					}]
				});
			}, [
				state.failure,
				store,
				show,
				t
			]);
			return toast.element;
		}
		//#endregion
		//#region src/client/is-record.ts
		/** Plain object check shared by settings, Source configuration and projection readers. */
		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		//#endregion
		//#region src/client/MnemonPackSection.tsx
		/** Where memory lives now, read again whenever `refreshKey` moves. */
		function usePackTarget(connection, sessionId, workspaceId, refreshKey) {
			const client = (0, react.useMemo)(() => connection === void 0 ? null : new MnemonClient(connection, sessionId, workspaceId), [
				connection,
				sessionId,
				workspaceId
			]);
			const [state, setState] = (0, react.useState)({
				target: null,
				failed: null
			});
			(0, react.useEffect)(() => {
				if (client === null) return;
				let active = true;
				client.packTarget().then((target) => {
					if (active) setState({
						target,
						failed: null
					});
				}, (reason) => {
					if (active) setState({
						target: null,
						failed: message(reason)
					});
				});
				return () => {
					active = false;
				};
			}, [client, refreshKey]);
			return state;
		}
		const ZIP_ACCEPT = ".zip,application/zip";
		function fileBase64(file) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onerror = () => reject(reader.error ?? /* @__PURE__ */ new Error("Could not read ZIP file"));
				reader.onload = () => {
					const value = reader.result;
					if (typeof value !== "string") return reject(/* @__PURE__ */ new Error("Could not read ZIP file"));
					const separator = value.indexOf(",");
					if (separator < 0) return reject(/* @__PURE__ */ new Error("ZIP file encoding is invalid"));
					resolve(value.slice(separator + 1));
				};
				reader.readAsDataURL(file);
			});
		}
		function bytesFromBase64(base64) {
			const binary = atob(base64);
			const buffer = new ArrayBuffer(binary.length);
			const bytes = new Uint8Array(buffer);
			for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
			return buffer;
		}
		function download(result) {
			const blob = new Blob([bytesFromBase64(result.base64)], { type: result.mimeType });
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = result.fileName;
			anchor.hidden = true;
			document.body.append(anchor);
			anchor.click();
			anchor.remove();
			window.setTimeout(() => URL.revokeObjectURL(url), 0);
		}
		/** Backup and migration of the data directory as one ZIP; the directory itself shows beside the storage choice. */
		function MnemonPackSection({ connection, sessionId, workspaceId, target, t }) {
			const client = (0, react.useMemo)(() => connection === void 0 ? null : new MnemonClient(connection, sessionId, workspaceId), [
				connection,
				sessionId,
				workspaceId
			]);
			const input = (0, react.useRef)(null);
			const [pending, setPending] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(null);
			const [failed, setFailed] = (0, react.useState)(null);
			const [notice, setNotice] = (0, react.useState)(null);
			const exportZip = async () => {
				if (client === null || busy !== null) return;
				setBusy("export");
				setFailed(null);
				setNotice(null);
				try {
					const result = await client.exportPack();
					download(result);
					setNotice(t("config.packExported", {
						file: result.fileName,
						size: humanBytes(result.bytes)
					}));
				} catch (reason) {
					setFailed(message(reason));
				} finally {
					setBusy(null);
				}
			};
			const inspectZip = async (file) => {
				if (client === null || busy !== null) return;
				setBusy("inspect");
				setFailed(null);
				setNotice(null);
				setPending(null);
				try {
					const base64 = await fileBase64(file);
					const preview = await client.inspectPack(base64, file.name);
					setPending({
						base64,
						preview
					});
				} catch (reason) {
					setFailed(message(reason));
				} finally {
					setBusy(null);
				}
			};
			const chooseFile = (event) => {
				const file = event.currentTarget.files?.[0];
				event.currentTarget.value = "";
				if (file !== void 0) inspectZip(file);
			};
			const importZip = async () => {
				if (client === null || pending === null || busy !== null) return;
				setBusy("import");
				setFailed(null);
				setNotice(null);
				try {
					const result = await client.importPack(pending.base64);
					setNotice(t("config.packImportedWhole", { root: result.targetRoot }));
					setPending(null);
				} catch (reason) {
					setFailed(message(reason));
				} finally {
					setBusy(null);
				}
			};
			const items = pending?.preview.manifest.summary.reduce((sum, component) => sum + component.items, 0) ?? 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonSettingsCard_module_css_default.packRow,
				role: "group",
				"aria-labelledby": "mnemon-pack-heading",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(SettingRow, {
						title: t("config.packTitle"),
						titleId: "mnemon-pack-heading",
						hint: t("config.packSimpleDescription"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonSettingsCard_module_css_default.rowActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								disabled: client === null || busy !== null,
								onClick: () => input.current?.click(),
								children: busy === "inspect" ? t("config.packInspecting") : t("config.packImportZip")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								disabled: client === null || busy !== null || target === null,
								onClick: () => void exportZip(),
								children: busy === "export" ? t("config.packExporting") : t("config.packExportZip")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							ref: input,
							className: MnemonSettingsCard_module_css_default.visuallyHidden,
							type: "file",
							accept: ZIP_ACCEPT,
							"aria-label": t("config.packChooseZip"),
							onChange: chooseFile
						})]
					}),
					pending !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.importBar,
						role: "status",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: pending.preview.fileName ?? t("config.packUnnamedZip") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.packZipReady", {
								components: pending.preview.manifest.components.length,
								items,
								size: humanBytes(pending.preview.archiveBytes)
							}) })] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "ghost",
								size: "sm",
								disabled: busy !== null,
								onClick: () => setPending(null),
								children: t("common.cancel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "primary",
								size: "sm",
								disabled: busy !== null,
								onClick: () => void importZip(),
								children: busy === "import" ? t("config.packImporting") : t("config.packImportZipAction")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.packFeedback,
						"aria-live": "polite",
						children: [
							failed !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: MnemonSettingsCard_module_css_default.error,
								role: "alert",
								children: t("config.packFailed", { error: failed })
							}),
							notice !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: MnemonSettingsCard_module_css_default.packSuccess,
								children: notice
							}),
							client === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: MnemonSettingsCard_module_css_default.readOnly,
								children: t("config.packUnavailable")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/GlobalLocationSetting.tsx
		/** The default or custom location control: the storage directory, Native and workspace-aware providers. */
		function GlobalLocationSetting(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `${MnemonSettingsCard_module_css_default.globalLocationSetting}${props.className === void 0 ? "" : ` ${props.className}`}`,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.nativeLocation,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.settingCopy,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.label }), props.hint !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: props.hint })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.inlineChoices,
						role: "radiogroup",
						"aria-label": props.ariaLabel,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "radio",
							name: props.name,
							checked: props.workspace || !props.custom,
							disabled: props.disabled || props.workspace,
							onClick: props.onInteract,
							onChange: () => props.onChange(false)
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.defaultLabel })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "radio",
							name: props.name,
							checked: !props.workspace && props.custom,
							disabled: props.disabled || props.workspace,
							onClick: props.onInteract,
							onChange: () => props.onChange(true)
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.customLabel })] })]
					})]
				}), !props.workspace && props.custom ? props.children : null]
			});
		}
		//#endregion
		//#region src/client/MnemonStorageSection.tsx
		function legacyPackDirectory(value) {
			const packs = value.customPacks ?? [];
			return packs.find((pack) => pack.id === value.customPackId)?.dataDir?.trim() ?? (packs.length === 1 ? packs[0]?.dataDir?.trim() : void 0) ?? "";
		}
		function savedDirectory(value) {
			return value.dataDir?.trim() || legacyPackDirectory(value);
		}
		/** The scope the configuration stores; a global scope with its own directory is `custom`. */
		function savedScope(value) {
			return value.storageScope ?? (savedDirectory(value) === "" ? "global" : "custom");
		}
		function storedScope(draft) {
			return draft.scope === "global" ? draft.location === "custom" ? "custom" : "global" : draft.scope;
		}
		function storageDraft(value) {
			const resolved = value ?? {};
			const dataDir = savedDirectory(resolved);
			const stored = savedScope(resolved);
			return {
				scope: stored === "workspace" || stored === "workspaces" ? stored : "global",
				location: stored === "custom" || stored !== "global" && dataDir !== "" ? "custom" : "default",
				dataDir
			};
		}
		/** Whether the draft waits for a directory to be typed; an empty field is not yet a mistake. */
		function storageMissing(draft) {
			return draft.scope !== "workspace" && draft.location === "custom" && draft.dataDir.trim() === "";
		}
		function storageProblem(t, draft) {
			if (draft.scope === "workspace" || draft.location === "default") return null;
			const directory = draft.dataDir.trim();
			if (directory === "") return null;
			const posixAbsolute = directory.startsWith("/");
			const homeRelative = directory === "~" || directory.startsWith("~/");
			const windowsDriveAbsolute = /^[a-zA-Z]:[\\/]/.test(directory);
			const windowsUncAbsolute = /^\\\\[^\\/]+[\\/][^\\/]+/.test(directory);
			if (directory.includes("\0") || !posixAbsolute && !homeRelative && !windowsDriveAbsolute && !windowsUncAbsolute) return t("config.customAbsolute");
			return null;
		}
		/** A directory as DSH shows a path: its end stays in view, the whole of it on hover. */
		function Path(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: MnemonSettingsCard_module_css_default.location,
				children: [props.label !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.PathLabel, { path: props.value })]
			});
		}
		/**
		* Where memory lives: the scope and directory, applied together because a
		* change moves where every component below reads and writes, and the ZIP
		* backup that carries the data from one place to another. The components
		* that keep their data here are named at the top, each opening its page.
		*
		* The directory is Mnemon's default one or one the user types, chosen
		* outright rather than implied by an empty field, and the row shows the one
		* path memory uses.
		*/
		function MnemonStorageSection(props) {
			const { t } = props;
			const value = props.value ?? {};
			const saved = storageDraft(value);
			const storage = useStaged(saved, async (draft) => {
				const operations = [];
				const scope = storedScope(draft);
				if (scope !== savedScope(value)) operations.push({
					op: "set",
					path: ["storageScope"],
					value: scope
				});
				if (draft.scope !== "workspace") {
					const directory = draft.location === "custom" ? draft.dataDir.trim() : "";
					if (directory !== saved.dataDir.trim()) operations.push(directory === "" && draft.scope === "global" ? {
						op: "unset",
						path: ["dataDir"]
					} : {
						op: "set",
						path: ["dataDir"],
						value: directory
					});
				}
				if (operations.length === 0) return;
				if (Object.hasOwn(props.user, "customPackId")) operations.push({
					op: "unset",
					path: ["customPackId"]
				});
				if (Object.hasOwn(props.user, "customPacks")) operations.push({
					op: "unset",
					path: ["customPacks"]
				});
				await props.scope.mutate(operations);
				props.onSaved();
			});
			const { draft } = storage;
			const problem = storageProblem(t, draft);
			const focusDirectory = (0, react.useRef)(false);
			const chooseLocation = (location) => {
				focusDirectory.current = location === "custom";
				storage.edit({
					location,
					dataDir: saved.dataDir
				});
			};
			const order = (entry) => MNEMON_PACK_COMPONENTS.indexOf(entry.typeId ?? "");
			const users = (props.dashboard?.entries ?? []).filter((entry) => entry.roles.includes("source") && order(entry) >= 0).sort((left, right) => order(left) - order(right));
			const current = storage.dirty ? void 0 : props.target?.root;
			const defaultRoot = props.target?.defaultRoot ?? (saved.scope === "global" && saved.location === "default" ? current : void 0);
			const directoryHint = draft.scope === "workspaces" ? current === void 0 ? "" : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Path, {
				label: t("storage.thisWorkspace"),
				value: current
			}) : draft.location === "default" && defaultRoot !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Path, { value: defaultRoot }) : "";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MnemonSettingsCard_module_css_default.section,
				"aria-labelledby": "mnemon-storage-heading",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.sectionHeading,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						id: "mnemon-storage-heading",
						children: t("config.storageTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ComponentChips, {
						label: t("storage.usedBy"),
						chips: users.map((entry) => {
							const name = componentCopy(entry, props.language).label;
							return {
								key: entry.entryId,
								name,
								on: entry.enabled,
								title: t("storage.usedByTitle", { component: name }),
								open: () => props.onOpen(entry)
							};
						})
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.rows,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectRow, {
							id: "mnemon-storage-scope",
							label: t("config.scopeTitle"),
							value: draft.scope,
							disabled: props.disabled,
							onChange: (scope) => storage.edit({ scope }),
							options: [
								{
									value: "global",
									label: t("config.global"),
									detail: t("config.globalScopeHint")
								},
								{
									value: "workspace",
									label: t("config.workspace"),
									detail: t("config.workspaceScopeHint")
								},
								{
									value: "workspaces",
									label: t("config.workspaces"),
									detail: t("config.workspacesHint")
								}
							]
						}),
						draft.scope === "workspace" ? current === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SettingRow, {
							title: t("config.dataDirectory"),
							hint: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Path, { value: current })
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GlobalLocationSetting, {
							name: "mnemon-data-location",
							className: MnemonSettingsCard_module_css_default.locationRow,
							ariaLabel: t("config.dataDirectory"),
							label: t("config.dataDirectory"),
							hint: directoryHint,
							defaultLabel: t("storage.default"),
							customLabel: t("config.custom"),
							custom: draft.location === "custom",
							workspace: false,
							disabled: props.disabled,
							onChange: (custom) => chooseLocation(custom ? "custom" : "default"),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: "mnemon-data-directory",
								className: MnemonSettingsCard_module_css_default.directoryInput,
								type: "text",
								value: draft.dataDir,
								"aria-label": t("config.dataDirectory"),
								"aria-invalid": problem !== null,
								placeholder: t("storage.directoryExample"),
								disabled: props.disabled,
								autoComplete: "off",
								spellCheck: false,
								autoCapitalize: "none",
								autoCorrect: "off",
								ref: (element) => {
									if (element !== null && focusDirectory.current) {
										focusDirectory.current = false;
										element.focus();
									}
								},
								onChange: (event) => storage.edit({ dataDir: event.target.value })
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PanelActions, {
							dirty: storage.dirty,
							saving: storage.saving,
							invalid: problem,
							failed: storage.failed,
							applied: storage.applied,
							disabled: props.disabled || storageMissing(draft),
							note: t("storage.moveNote"),
							t,
							onDiscard: storage.discard,
							onApply: () => {
								storage.apply();
							}
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonPackSection, {
							...props.connection === void 0 ? {} : { connection: props.connection },
							...props.sessionId === void 0 ? {} : { sessionId: props.sessionId },
							...props.workspaceId === void 0 ? {} : { workspaceId: props.workspaceId },
							target: props.target,
							t
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/client/MnemonSettingsCard.tsx
		const NO_CHANGE_SIGNAL$1 = {
			subscribe: () => () => {},
			getSnapshot: () => 0
		};
		/**
		* The dsh-mnemon configuration, shown on its bundle page under DSH Plugins:
		* the memory composition, then only what belongs to no component — where
		* memory lives and how the interface shows it. Each component's own settings
		* live on its page, which a component's name opens anywhere on this page.
		*
		* Switches and selectors apply when they change, as the composition's do.
		* Typed values wait for their group's Apply; the storage location waits too,
		* because it moves where every component reads and writes.
		*/
		function MnemonSettingsCard({ scope, interactionScope: suppliedInteractionScope, connection, sessionId, workspaceId, workspaceLabel, t = translateZh, language = "zh", componentChanges = NO_CHANGE_SIGNAL$1, componentSettings, component }) {
			const interactionScope = suppliedInteractionScope ?? scope;
			const coreSnapshot = useScope(scope);
			const interactionSnapshot = useScope(interactionScope);
			const [targetRevision, setTargetRevision] = (0, react.useState)(0);
			const dataRevision = targetRevision + (0, react.useSyncExternalStore)(componentChanges.subscribe, componentChanges.getSnapshot, componentChanges.getSnapshot) + (coreSnapshot.revision ?? 0);
			const view = useViewStore((0, react.useMemo)(() => connection === void 0 ? void 0 : new MnemonClient(connection, sessionId, workspaceId), [
				connection,
				sessionId,
				workspaceId
			]), dataRevision);
			const pages = usePageTrail();
			const layerSettings = (0, react.useMemo)(() => ({ set: async (layerId, enabled) => {
				await scope.mutate([{
					op: "set",
					path: [
						"memoryTopology",
						"layers",
						layerId,
						"enabled"
					],
					value: enabled
				}]);
				setTargetRevision((revision) => revision + 1);
			} }), [scope]);
			const root = (0, react.useRef)(null);
			const feedbackToast = useViewFeedback(view, root, t, language);
			const [memorySystem, setMemorySystem] = (0, react.useState)(null);
			const [memorySystemState, setMemorySystemState] = (0, react.useState)(connection === void 0 ? "unavailable" : "loading");
			const topologyRequest = (0, react.useRef)(0);
			const { target } = usePackTarget(connection, sessionId, workspaceId, dataRevision);
			(0, react.useEffect)(() => {
				if (connection === void 0) {
					topologyRequest.current += 1;
					setMemorySystem(null);
					setMemorySystemState("unavailable");
					return;
				}
				const request = topologyRequest.current + 1;
				topologyRequest.current = request;
				setMemorySystemState("loading");
				new MnemonClient(connection, sessionId, workspaceId).memorySystem().then((descriptor) => {
					if (topologyRequest.current !== request) return;
					setMemorySystem(descriptor);
					setMemorySystemState("ready");
				}, () => {
					if (topologyRequest.current !== request) return;
					setMemorySystem(null);
					setMemorySystemState("error");
				});
				return () => {
					topologyRequest.current += 1;
				};
			}, [
				connection,
				sessionId,
				workspaceId,
				dataRevision
			]);
			const coreUser = (0, react.useMemo)(() => isRecord(coreSnapshot.user) ? coreSnapshot.user : {}, [coreSnapshot.user]);
			const loading = coreSnapshot.status === "loading" || interactionSnapshot.status === "loading";
			const writable = coreSnapshot.writable && interactionSnapshot.writable;
			const display = useLive(normalizeDisplayMode(coreSnapshot.value?.displayMode), async (value) => {
				await scope.mutate([{
					op: "set",
					path: ["displayMode"],
					value
				}]);
			});
			const turnBar = useLive(interactionSnapshot.value?.turnBar !== false, async (value) => {
				await interactionScope.mutate([{
					op: "set",
					path: ["turnBar"],
					value
				}]);
			});
			const saveAction = useLive(interactionSnapshot.value?.saveAction !== false, async (value) => {
				await interactionScope.mutate([{
					op: "set",
					path: ["saveAction"],
					value
				}]);
			});
			const settingsRenderer = (0, react.useMemo)(() => componentSettings === void 0 ? void 0 : {
				has: (packageName) => componentSettings.has(packageName),
				render: (entry, writableNow) => componentSettings.render(entry, {
					enabled: entry.enabled,
					label: componentCopy(entry, language).label,
					writable: writableNow,
					language,
					...sessionId === void 0 ? {} : { sessionId },
					...workspaceId === void 0 ? {} : { workspace: {
						id: workspaceId,
						...workspaceLabel === void 0 ? {} : { label: workspaceLabel }
					} }
				})
			}, [
				componentSettings,
				language,
				sessionId,
				workspaceId,
				workspaceLabel
			]);
			if (coreSnapshot.status === "unavailable" && interactionSnapshot.status === "unavailable") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
				className: MnemonSettingsCard_module_css_default.page,
				"aria-label": t("config.aria"),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: MnemonSettingsCard_module_css_default.error,
					role: "alert",
					children: t("config.unavailable")
				})
			});
			const coreDisabled = loading || !coreSnapshot.writable;
			const readOnlyNotice = connection !== void 0 && isRemoteConnection(connection) ? t("config.remoteReadOnly") : t("config.readOnly");
			const interactionDisabled = loading || !interactionSnapshot.writable;
			if (component !== void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				ref: root,
				className: MnemonSettingsCard_module_css_default.page,
				"aria-label": t("config.aria"),
				"aria-busy": loading,
				children: [
					!writable && !loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MnemonSettingsCard_module_css_default.readOnlyNotice,
						children: readOnlyNotice
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompositionBoard, {
						view,
						system: memorySystem,
						systemPending: memorySystemState === "loading",
						layers: layerSettings,
						readOnly: !coreSnapshot.writable,
						language,
						t,
						pages,
						page: component,
						...settingsRenderer === void 0 ? {} : { componentSettings: settingsRenderer }
					}),
					feedbackToast
				]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
				ref: root,
				className: MnemonSettingsCard_module_css_default.page,
				"aria-label": t("config.aria"),
				"aria-busy": loading,
				children: loading ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: MnemonSettingsCard_module_css_default.loading,
					role: "status",
					children: t("common.loading")
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					!writable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MnemonSettingsCard_module_css_default.readOnlyNotice,
						children: readOnlyNotice
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompositionBoard, {
						view,
						system: memorySystem,
						systemPending: memorySystemState === "loading",
						layers: layerSettings,
						readOnly: !coreSnapshot.writable,
						language,
						t,
						pages,
						...settingsRenderer === void 0 ? {} : { componentSettings: settingsRenderer }
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonStorageSection, {
						scope,
						value: coreSnapshot.value,
						user: coreUser,
						disabled: coreDisabled,
						dashboard: view.state.dashboard,
						target,
						...connection === void 0 ? {} : { connection },
						...sessionId === void 0 ? {} : { sessionId },
						...workspaceId === void 0 ? {} : { workspaceId },
						language,
						t,
						onOpen: (entry) => pages.open(entry.entryId, "configuration"),
						onSaved: () => setTargetRevision((revision) => revision + 1)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: MnemonSettingsCard_module_css_default.section,
						"aria-labelledby": "mnemon-interface-heading",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MnemonSettingsCard_module_css_default.sectionHeading,
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									id: "mnemon-interface-heading",
									children: t("config.interfaceTitle")
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MnemonSettingsCard_module_css_default.rows,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectRow, {
										id: "mnemon-display",
										label: t("config.displayTitle"),
										value: display.value,
										disabled: coreDisabled,
										onChange: display.set,
										options: [{
											value: "sidebar",
											label: t("config.displaySidebar"),
											detail: t("config.displaySidebarHint")
										}, {
											value: "builtin",
											label: t("config.displayBuiltin"),
											detail: t("config.displayBuiltinHint")
										}]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToggleRow, {
										id: "mnemon-interaction-turn-bar",
										label: t("config.interactionTurnBar"),
										hint: t("config.interactionTurnBarHint"),
										checked: turnBar.value,
										disabled: interactionDisabled,
										onChange: turnBar.set
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToggleRow, {
										id: "mnemon-interaction-save-action",
										label: t("config.interactionSaveAction"),
										hint: t("config.interactionSaveActionHint"),
										checked: saveAction.value,
										disabled: interactionDisabled,
										onChange: saveAction.set
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(WriteFailure, {
								error: display.failed ?? turnBar.failed ?? saveAction.failed,
								t
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MnemonSettingsCard_module_css_default.componentListNote,
						children: t("config.componentListNote")
					}),
					feedbackToast
				] })
			});
		}
		//#endregion
		//#region src/client/session-binding.ts
		/** Root surfaces follow DSH's default/main binding, independently of its catalog. */
		function useMnemonSessionId(binding) {
			const subscribe = (0, react.useCallback)((listener) => binding.subscribe(listener), [binding]);
			const getSnapshot = (0, react.useCallback)(() => binding.getSnapshot().key, [binding]);
			return (0, react.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
		}
		//#endregion
		//#region src/client/MnemonSettingsHost.tsx
		/** The dsh-mnemon bundle page body; root-slot injection is cached, so session and workspace stay live here. */
		function MnemonSettingsHost({ view, currentSession, sessions, workspaces, localeRuntime, componentSettingsDirectory, renderSlot, renderContributed, ...props }) {
			const sessionId = useMnemonSessionId(currentSession);
			const subscribeSessions = (0, react.useCallback)((listener) => sessions.list.subscribe(listener), [sessions.list]);
			const getSessions = (0, react.useCallback)(() => sessions.list.getSnapshot(), [sessions.list]);
			const subscribeWorkspaces = (0, react.useCallback)((listener) => workspaces.list.subscribe(listener), [workspaces.list]);
			const getWorkspaces = (0, react.useCallback)(() => workspaces.list.getSnapshot(), [workspaces.list]);
			const subscribeLocale = (0, react.useCallback)((listener) => localeRuntime.subscribe(listener), [localeRuntime]);
			const getLanguage = (0, react.useCallback)(() => localeRuntime.getSnapshot().active, [localeRuntime]);
			const language = (0, react.useSyncExternalStore)(subscribeLocale, getLanguage, getLanguage);
			const catalog = (0, react.useSyncExternalStore)(subscribeSessions, getSessions, getSessions);
			const workspaceList = (0, react.useSyncExternalStore)(subscribeWorkspaces, getWorkspaces, getWorkspaces);
			const subscribeDirectory = (0, react.useCallback)((listener) => componentSettingsDirectory?.subscribe(listener) ?? (() => {}), [componentSettingsDirectory]);
			const getDirectory = (0, react.useCallback)(() => componentSettingsDirectory?.getSnapshot(), [componentSettingsDirectory]);
			const contributed = (0, react.useSyncExternalStore)(subscribeDirectory, getDirectory, getDirectory);
			const componentSettings = (0, react.useMemo)(() => renderSlot === void 0 && renderContributed === void 0 || contributed === void 0 ? void 0 : {
				has: (packageName) => contributed.has(packageName),
				render: (entry, page) => {
					const owner = {
						component: {
							packageName: entry.packageName,
							label: page.label,
							enabled: page.enabled
						},
						writable: page.writable,
						language: page.language,
						...page.sessionId === void 0 ? {} : { sessionId: page.sessionId },
						...page.workspace === void 0 ? {} : { workspace: page.workspace }
					};
					return renderSlot !== void 0 ? renderSlot(MNEMON_COMPONENT_SETTINGS_SLOT, owner, {
						entryKey: entry.packageName,
						fallback: null
					}) : renderContributed(entry.packageName, owner);
				}
			}, [
				renderSlot,
				renderContributed,
				contributed
			]);
			if (view !== "page") return null;
			const cwd = sessionId === void 0 ? void 0 : Object.entries(catalog.byId).find(([id]) => id === sessionId)?.[1]?.cwd;
			const normalizePath = (value) => value.replace(/[\\/]+$/u, "");
			const workspace = sessionId === void 0 ? workspaceList.items[0] : cwd === void 0 ? void 0 : workspaceList.items.find((candidate) => normalizePath(candidate.path) === normalizePath(cwd));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonSettingsCard, {
				...props,
				...componentSettings === void 0 ? {} : { componentSettings },
				language,
				...sessionId === void 0 ? {} : { sessionId },
				...workspace === void 0 ? {} : {
					workspaceId: String(workspace.workspaceId),
					workspaceLabel: workspace.title
				}
			});
		}
		/**
		* DSH's page for one component row: the component's page alone. The settings
		* region is declared by the bundle's configuration, so contributions render as
		* they were registered rather than through a slot of this entry.
		*/
		function MnemonComponentRowHost(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonSettingsHost, { ...props });
		}
		//#endregion
		//#region src/client/MnemonLogo.tsx
		/** Official Mnemon mark from mnemon-dev/mnemon (Apache-2.0). */
		function MnemonLogo({ className, title = "Mnemon" }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className,
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: "0 0 400 400",
				role: "img",
				"aria-label": title,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						width: "400",
						height: "400",
						fill: "#1A1A1A"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M 91.5,153.5 L 98.5,146.5 L 98.5,98.5 L 146.5,98.5 L 153.5,91.5 L 91.5,91.5 Z",
						fill: "#D4D4D8"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M 246.5,91.5 L 253.5,98.5 L 301.5,98.5 L 301.5,146.5 L 308.5,153.5 L 308.5,91.5 Z",
						fill: "#D4D4D8"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M 91.5,246.5 L 98.5,253.5 L 98.5,301.5 L 146.5,301.5 L 153.5,308.5 L 91.5,308.5 Z",
						fill: "#D4D4D8"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M 308.5,246.5 L 301.5,253.5 L 301.5,301.5 L 253.5,301.5 L 246.5,308.5 L 308.5,308.5 Z",
						fill: "#D4D4D8"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", {
						points: "265,187 278,200 265,213",
						fill: "none",
						stroke: "#D4D4D8",
						strokeWidth: "2",
						strokeLinecap: "square"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polyline", {
						points: "135,187 122,200 135,213",
						fill: "none",
						stroke: "#D4D4D8",
						strokeWidth: "2",
						strokeLinecap: "square"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("polygon", {
						points: "200,155 245,200 200,245 155,200",
						fill: "none",
						stroke: "#D4D4D8",
						strokeWidth: "7"
					})
				]
			});
		}
		//#endregion
		//#region src/client/ProviderIcon.tsx
		function GenericProviderMark() {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 36 36",
				fill: "none",
				xmlns: "http://www.w3.org/2000/svg",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						width: "36",
						height: "36",
						rx: "9",
						fill: "#F1F3F7"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ellipse", {
						cx: "18",
						cy: "11",
						rx: "8",
						ry: "3.5",
						fill: "#68738A"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M10 11v7c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-7M10 18v7c0 1.93 3.58 3.5 8 3.5s8-1.57 8-3.5v-7",
						stroke: "#68738A",
						strokeWidth: "1.6"
					})
				]
			});
		}
		/** Only the owning plugin supplies image data; unknown brands get a neutral mark. */
		function ProviderIcon({ providerId, icon, className, title }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className,
				"data-provider-icon": providerId,
				...title === void 0 ? { "aria-hidden": true } : {
					role: "img",
					"aria-label": title
				},
				children: icon?.kind === "brand" && icon.value === "mnemon" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonLogo, {}) : icon?.kind === "glyph" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					"aria-hidden": "true",
					children: icon.value
				}) : icon?.kind === "data-url" && /^data:image\/(?:png|jpeg|webp|svg\+xml);/u.test(icon.value) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					src: icon.value,
					alt: ""
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GenericProviderMark, {})
			});
		}
		//#endregion
		//#region src/client/use-request-version.ts
		/**
		* Guards UI state against responses from an older request or an unmounted
		* component. Starting a request invalidates every earlier version.
		*/
		function useRequestVersion() {
			const current = (0, react.useRef)(0);
			(0, react.useEffect)(() => () => {
				current.current += 1;
			}, []);
			return (0, react.useMemo)(() => ({
				begin: () => {
					current.current += 1;
					return current.current;
				},
				isCurrent: (version) => current.current === version
			}), []);
		}
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/src/client/PageControls.module.css.mjs
		const css$3 = ".Zl-6yW_search{min-width:0}.Zl-6yW_field{gap:6px;min-width:0;display:inline-grid}.Zl-6yW_fieldLabel{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px}.Zl-6yW_hiddenLabel{clip-path:inset(50%);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.Zl-6yW_selector{appearance:none;border-radius:var(--dsw-radius-md);min-width:0;max-width:100%;height:36px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-module-platform);font:inherit;white-space:nowrap;cursor:pointer;border:0;justify-content:space-between;align-items:center;gap:12px;padding:0 14px;font-size:14px;line-height:22px;display:inline-flex}.Zl-6yW_selector>span{text-overflow:ellipsis;min-width:0;overflow:hidden}.Zl-6yW_selector>svg{color:var(--dsw-alias-label-tertiary);flex:none}.Zl-6yW_selector:hover:not(:disabled),.Zl-6yW_selector[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover)}.Zl-6yW_selector:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}.Zl-6yW_selector:disabled{cursor:default;opacity:.4}.Zl-6yW_menuRoot{min-width:0;display:block}.Zl-6yW_field:not([data-inline]) .Zl-6yW_selector{width:100%}.Zl-6yW_field[data-inline]{align-items:center;gap:8px;display:inline-flex}.Zl-6yW_field[data-inline] .Zl-6yW_menuRoot{display:inline-block}.Zl-6yW_field[data-inline]>.Zl-6yW_fieldLabel{color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-weight:400}.Zl-6yW_field[data-size=sm] .Zl-6yW_selector{border-radius:var(--dsw-radius-sm);gap:8px;height:28px;padding:0 10px;font-size:12px;line-height:18px}.Zl-6yW_menu{min-width:200px}.Zl-6yW_option{white-space:normal;gap:1px;min-width:0;display:grid}.Zl-6yW_option>small{color:var(--dsw-alias-label-tertiary);overflow-wrap:anywhere;font-size:12px;line-height:18px}.Zl-6yW_receipt{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);flex-wrap:wrap;align-items:flex-start;gap:8px 10px;min-width:0;margin-top:12px;padding:10px 12px;display:flex}.Zl-6yW_receipt>p{min-width:0;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;flex:240px;margin:0;font-size:13px;line-height:20px}.Zl-6yW_receipt>:first-child{flex:none;margin-top:1px}.Zl-6yW_receiptAction{flex:none;margin-left:auto}";
		const tagId$3 = "dsh-mnemon/src/client/PageControls.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$3;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$3) tag.textContent = css$3;
		}
		var PageControls_module_css_default = {
			"field": "Zl-6yW_field",
			"fieldLabel": "Zl-6yW_fieldLabel",
			"hiddenLabel": "Zl-6yW_hiddenLabel",
			"menu": "Zl-6yW_menu",
			"menuRoot": "Zl-6yW_menuRoot",
			"option": "Zl-6yW_option",
			"receipt": "Zl-6yW_receipt",
			"receiptAction": "Zl-6yW_receiptAction",
			"search": "Zl-6yW_search",
			"selector": "Zl-6yW_selector"
		};
		//#endregion
		//#region src/client/page-controls.tsx
		/**
		* Controls every memory page shares, so a search, a choice or a write receipt
		* looks and behaves the same on each page: the DSH input and its search icon,
		* the DSH selector and its menu, and one receipt for a task Agent's write.
		*/
		/** A search box: the DSH input with its search icon. */
		function SearchField({ label, className, ...input }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
				...input,
				"aria-label": label,
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutlineRegular, { size: 16 }),
				className: [PageControls_module_css_default.search, className].filter(Boolean).join(" ")
			});
		}
		/** A labelled choice: the DSH selector, opening a menu of the options. */
		function SelectField(props) {
			const [open, setOpen] = (0, react.useState)(false);
			const labelId = (0, react.useId)();
			const nameId = (0, react.useId)();
			const valueId = (0, react.useId)();
			const current = props.options.find((option) => option.value === props.value);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: [PageControls_module_css_default.field, props.className].filter(Boolean).join(" "),
				"data-inline": props.inline === true ? "" : void 0,
				"data-size": props.size === "sm" ? "sm" : void 0,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						id: labelId,
						"data-part": "label",
						className: props.hideLabel === true ? PageControls_module_css_default.hiddenLabel : PageControls_module_css_default.fieldLabel,
						"aria-hidden": props.ariaLabel === void 0 ? void 0 : true,
						children: props.label
					}),
					props.ariaLabel !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						id: nameId,
						className: PageControls_module_css_default.hiddenLabel,
						children: props.ariaLabel
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
						open,
						onClose: () => setOpen(false),
						align: "start",
						portal: true,
						selectedId: props.value,
						className: PageControls_module_css_default.menuRoot,
						listClassName: PageControls_module_css_default.menu,
						items: props.options.map((option) => ({
							id: option.value,
							label: option.detail === void 0 ? option.label : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: PageControls_module_css_default.option,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: option.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: option.detail })]
							}),
							...option.disabled === true ? { disabled: true } : {}
						})),
						onSelect: (id) => {
							setOpen(false);
							if (id !== props.value) props.onChange(id);
						},
						anchor: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: PageControls_module_css_default.selector,
							"aria-haspopup": "menu",
							"aria-expanded": open,
							"aria-labelledby": `${props.ariaLabel === void 0 ? labelId : nameId} ${valueId}`,
							disabled: props.disabled === true,
							onClick: () => setOpen((value) => !value),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								id: valueId,
								children: current?.label ?? props.value
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { size: 12 })]
						})
					})
				]
			});
		}
		const OUTCOMES = {
			stored: "written",
			added: "written",
			created: "written",
			merged: "written",
			linked: "written",
			updated: "updated",
			replaced: "updated",
			accepted: "pending",
			candidate: "pending",
			skipped: "skipped",
			partial: "partial"
		};
		/** Map a write action from a receipt to what the user reads. */
		function writeOutcome(action) {
			return OUTCOMES[action] ?? "unfinished";
		}
		const TONES = {
			written: "success",
			updated: "success",
			pending: "info",
			skipped: "neutral",
			partial: "warning",
			unfinished: "warning"
		};
		const LABELS = {
			written: "receipt.written",
			updated: "receipt.updated",
			pending: "receipt.pending",
			skipped: "receipt.skipped",
			partial: "receipt.partial",
			unfinished: "receipt.unfinished"
		};
		/**
		* What a task Agent did with a candidate: the outcome, the Agent's own
		* summary, and, when something was written, a way to see it.
		*/
		function WriteReceipt(props) {
			const shared = useT();
			const t = props.t ?? shared;
			if (props.error !== void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: PageControls_module_css_default.receipt,
				role: "alert",
				"data-outcome": "failed",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
					tone: "danger",
					children: t("receipt.failed")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: props.error })]
			});
			const outcome = writeOutcome(props.action ?? "");
			const viewable = outcome !== "skipped" && outcome !== "unfinished";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: PageControls_module_css_default.receipt,
				role: "status",
				"data-outcome": outcome,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
						tone: TONES[outcome],
						children: t(LABELS[outcome])
					}),
					props.summary !== void 0 && props.summary !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: props.summary }),
					props.onView !== void 0 && viewable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						className: PageControls_module_css_default.receiptAction,
						onClick: props.onView,
						children: t("receipt.view")
					})
				]
			});
		}
		/** Whether a task Agent can take a write now. */
		function TaskAgentTag(props) {
			const shared = useT();
			const t = props.t ?? shared;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
				tone: props.available ? "success" : "warning",
				children: t(props.available ? "taskAgent.ready" : "taskAgent.unavailable")
			});
		}
		//#endregion
		//#region src/client/provider-presentation.ts
		function providerSummary(t, provider) {
			if (provider.summaryI18nKey === void 0) return provider.summary;
			const localized = t(provider.summaryI18nKey);
			return typeof localized !== "string" || localized.length === 0 || localized === provider.summaryI18nKey ? provider.summary : localized;
		}
		function providerFieldLabel(t, field) {
			if (field.i18nKey === void 0) return field.label;
			const localized = t(field.i18nKey);
			return typeof localized !== "string" || localized.length === 0 || localized === field.i18nKey ? field.label : localized;
		}
		function providerOptionLabel(t, option) {
			if (option.i18nKey === void 0) return option.label;
			const localized = t(option.i18nKey);
			return typeof localized !== "string" || localized.length === 0 || localized === option.i18nKey ? option.label : localized;
		}
		//#endregion
		//#region src/client/ProviderSettingsSection.tsx
		const SAVED_SECRET_MASK = "••••••••••••";
		const EMPTY_PROVIDER_CATALOG = {
			providers: [],
			items: [],
			generatedAt: ""
		};
		const providerCatalogCache = /* @__PURE__ */ new WeakMap();
		function catalogRouteKey(sessionId, workspaceId) {
			return `${sessionId ?? ""}\u0000${workspaceId ?? ""}`;
		}
		function cachedCatalog(connection, key) {
			return connection === void 0 ? void 0 : providerCatalogCache.get(connection)?.get(key);
		}
		function cacheCatalog(connection, key, catalog) {
			if (connection === void 0) return;
			let routes = providerCatalogCache.get(connection);
			if (routes === void 0) {
				routes = /* @__PURE__ */ new Map();
				providerCatalogCache.set(connection, routes);
			}
			routes.set(key, catalog);
		}
		function stabilizeProviderCard(element) {
			const view = element.ownerDocument.defaultView;
			let scrollContainer;
			for (let ancestor = element.parentElement; ancestor !== null; ancestor = ancestor.parentElement) {
				const overflowY = view?.getComputedStyle(ancestor).overflowY ?? ancestor.style.overflowY;
				if (scrollContainer !== void 0 && overflowY === "hidden" && ancestor.scrollTop !== 0) ancestor.scrollTop = 0;
				if (scrollContainer === void 0 && (overflowY === "auto" || overflowY === "scroll") && ancestor.scrollHeight > ancestor.clientHeight) scrollContainer = ancestor;
				if (ancestor.getAttribute("role") === "dialog") break;
			}
			if (scrollContainer === void 0) return;
			const headerRect = (element.firstElementChild instanceof HTMLElement ? element.firstElementChild : element).getBoundingClientRect();
			const containerRect = scrollContainer.getBoundingClientRect();
			if (headerRect.top < containerRect.top) scrollContainer.scrollTop -= containerRect.top - headerRect.top;
			else if (headerRect.bottom > containerRect.bottom) scrollContainer.scrollTop += headerRect.bottom - containerRect.bottom;
		}
		function serviceFields(provider) {
			return provider.fields.filter((field) => field.scope === "service");
		}
		function globalLocationFields(provider) {
			return serviceFields(provider).filter((field) => field.role === "global-location");
		}
		function serviceDefaults(provider) {
			return Object.fromEntries(serviceFields(provider).flatMap((field) => field.defaultValue === void 0 ? [] : [[field.key, field.defaultValue]]));
		}
		function draftFor(provider, service) {
			return { settings: {
				...serviceDefaults(provider),
				...service.settings,
				...service.secretValues
			} };
		}
		function configurationComplete(provider, draft, service) {
			return serviceFields(provider).every((field) => {
				if (!field.required) return true;
				if (field.input === "secret" && service.configuredSecrets.includes(field.key)) return true;
				const value = draft.settings[field.key];
				return field.input === "boolean" ? typeof value === "boolean" : String(value ?? "").trim() !== "";
			});
		}
		function SecretVisibilityIcon({ visible }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 20 20",
				fill: "none",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "M2.3 10s2.8-4.5 7.7-4.5 7.7 4.5 7.7 4.5-2.8 4.5-7.7 4.5S2.3 10 2.3 10Z",
						stroke: "currentColor",
						strokeWidth: "1.4",
						strokeLinecap: "round",
						strokeLinejoin: "round"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
						cx: "10",
						cy: "10",
						r: "2.1",
						stroke: "currentColor",
						strokeWidth: "1.4"
					}),
					visible && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
						d: "m3.5 3.5 13 13",
						stroke: "currentColor",
						strokeWidth: "1.4",
						strokeLinecap: "round"
					})
				]
			});
		}
		function ServiceField(props) {
			const [secretVisible, setSecretVisible] = (0, react.useState)(false);
			const label = providerFieldLabel(props.t, props.field);
			const savedSecret = props.configuredSecrets.includes(props.field.key);
			const required = props.field.required && !savedSecret;
			const secret = props.field.input === "secret";
			const fieldValue = String(props.value ?? "");
			const showingSavedMask = secret && savedSecret && fieldValue === "";
			const displayValue = showingSavedMask ? secretVisible ? props.t("config.providerSecretStoredValue") : SAVED_SECRET_MASK : fieldValue;
			const input = props.field.input === "boolean" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: MnemonSettingsCard_module_css_default.providerBoolean,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					"aria-label": label,
					type: "checkbox",
					checked: Boolean(props.value),
					disabled: props.disabled,
					onChange: (event) => props.onChange(event.target.checked)
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })]
			}) : props.field.input === "select" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
				label,
				value: String(props.value ?? ""),
				disabled: props.disabled,
				options: (props.field.options ?? []).map((option) => ({
					value: option.value,
					label: providerOptionLabel(props.t, option)
				})),
				onChange: (next) => props.onChange(next)
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [label, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: secret ? MnemonSettingsCard_module_css_default.providerSecretInput : void 0,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					"aria-label": label,
					type: secret ? secretVisible ? "text" : "password" : props.field.input === "number" ? "number" : props.field.input === "url" ? "url" : "text",
					value: displayValue,
					required,
					disabled: props.disabled,
					autoComplete: secret ? "new-password" : void 0,
					placeholder: props.field.placeholder ?? (secret ? props.t("overview.providerApiKeyOptional") : void 0),
					maxLength: props.field.maxLength ?? (secret ? 8e3 : 2e3),
					min: props.field.min,
					max: props.field.max,
					pattern: props.field.pattern,
					step: props.field.input === "number" ? "any" : void 0,
					onFocus: (event) => {
						if (showingSavedMask) event.currentTarget.select();
					},
					onClick: (event) => {
						if (showingSavedMask) event.currentTarget.select();
					},
					onChange: (event) => {
						const value = showingSavedMask ? event.target.value.replace(SAVED_SECRET_MASK, "").replace(props.t("config.providerSecretStoredValue"), "") : event.target.value;
						props.onChange(value);
					}
				}), secret && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: MnemonSettingsCard_module_css_default.providerSecretVisibility,
					"aria-label": props.t(secretVisible ? "config.providerSecretHide" : "config.providerSecretShow"),
					title: props.t(secretVisible ? "config.providerSecretHide" : "config.providerSecretShow"),
					"aria-pressed": secretVisible,
					disabled: props.disabled,
					onClick: () => setSecretVisible((value) => !value),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SecretVisibilityIcon, { visible: secretVisible })
				})]
			})] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: MnemonSettingsCard_module_css_default.providerFieldControl,
				"data-input": props.field.input,
				children: input
			});
		}
		function ProviderServiceForm(props) {
			const [draft, setDraft] = (0, react.useState)(() => draftFor(props.provider, props.service));
			const [customLocations, setCustomLocations] = (0, react.useState)(() => new Set(globalLocationFields(props.provider).filter((field) => String(props.service.settings[field.key] ?? "").trim() !== "").map((field) => field.key)));
			const [saving, setSaving] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(null);
			const [saved, setSaved] = (0, react.useState)(false);
			const formRef = (0, react.useRef)(null);
			const stabilizeAfterLocationLayout = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				setDraft(draftFor(props.provider, props.service));
				setCustomLocations(new Set(globalLocationFields(props.provider).filter((field) => String(props.service.settings[field.key] ?? "").trim() !== "").map((field) => field.key)));
			}, [props.provider, props.service]);
			(0, react.useLayoutEffect)(() => {
				if (!stabilizeAfterLocationLayout.current || formRef.current === null) return;
				stabilizeAfterLocationLayout.current = false;
				stabilizeProviderCard(formRef.current.closest("[data-provider]") ?? formRef.current);
			}, [customLocations]);
			const submit = async (event) => {
				event.preventDefault();
				const locationsComplete = props.activeScope === "workspace" || globalLocationFields(props.provider).every((field) => !customLocations.has(field.key) || String(draft.settings[field.key] ?? "").trim() !== "");
				if (!configurationComplete(props.provider, draft, props.service) || !locationsComplete || saving || props.disabled) return;
				setSaving(true);
				setFailed(null);
				setSaved(false);
				const settings = { ...draft.settings };
				for (const field of globalLocationFields(props.provider)) if (props.activeScope === "workspace" || !customLocations.has(field.key)) settings[field.key] = "";
				try {
					await props.onSave(props.provider, { settings });
					setSaved(true);
				} catch (reason) {
					setFailed(message(reason));
				} finally {
					setSaving(false);
				}
			};
			const update = (key, value) => {
				setDraft((current) => ({
					...current,
					settings: {
						...current.settings,
						[key]: value
					}
				}));
				setFailed(null);
				setSaved(false);
			};
			const useCustomLocation = (field, custom) => {
				stabilizeAfterLocationLayout.current = true;
				setCustomLocations((current) => {
					const next = new Set(current);
					if (custom) next.add(field.key);
					else next.delete(field.key);
					return next;
				});
				setFailed(null);
				setSaved(false);
			};
			const stabilizeLocationCard = () => {
				if (formRef.current === null) return;
				stabilizeProviderCard(formRef.current.closest("[data-provider]") ?? formRef.current);
			};
			const locations = globalLocationFields(props.provider);
			const regularFields = serviceFields(props.provider).filter((field) => field.role !== "global-location");
			const locationsComplete = props.activeScope === "workspace" || locations.every((field) => !customLocations.has(field.key) || String(draft.settings[field.key] ?? "").trim() !== "");
			const formComplete = configurationComplete(props.provider, draft, props.service) && locationsComplete;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
				ref: formRef,
				className: MnemonSettingsCard_module_css_default.providerServiceForm,
				onSubmit: (event) => void submit(event),
				"data-provider": props.provider.id,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MnemonSettingsCard_module_css_default.providerServicePrompt,
						children: props.t(props.service.configured ? "config.providerServiceHint" : "config.providerEnableHint")
					}),
					locations.map((field) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GlobalLocationSetting, {
						className: MnemonSettingsCard_module_css_default.providerServiceLocation,
						name: `${props.provider.id}-${field.key}-location`,
						ariaLabel: `${props.provider.label} ${props.t("config.providerGlobalLocation")}`,
						label: props.t("config.providerGlobalLocation"),
						hint: props.t(props.activeScope === "workspace" ? "config.providerGlobalLocationWorkspaceHint" : "config.providerGlobalLocationHint", { provider: props.provider.label }),
						defaultLabel: props.t("config.providerDefaultLocation"),
						customLabel: props.t("config.custom"),
						custom: customLocations.has(field.key),
						workspace: props.activeScope === "workspace",
						disabled: props.disabled || saving,
						onInteract: stabilizeLocationCard,
						onChange: (custom) => useCustomLocation(field, custom),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MnemonSettingsCard_module_css_default.providerLocationField,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServiceField, {
								field,
								value: draft.settings[field.key],
								configuredSecrets: props.service.configuredSecrets,
								disabled: props.disabled || saving,
								t: props.t,
								onChange: (value) => update(field.key, value)
							})
						})
					}, field.key)),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonSettingsCard_module_css_default.providerSettingsGrid,
						children: regularFields.map((field) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServiceField, {
							field,
							value: draft.settings[field.key],
							configuredSecrets: props.service.configuredSecrets,
							disabled: props.disabled || saving,
							t: props.t,
							onChange: (value) => update(field.key, value)
						}, field.key))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: `${MnemonSettingsCard_module_css_default.memoryConfigFooter} ${MnemonSettingsCard_module_css_default.providerServiceFooter}`,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonSettingsCard_module_css_default.configFeedback,
							"aria-live": "polite",
							children: [failed !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MnemonSettingsCard_module_css_default.error,
								children: props.t("config.providerSaveFailed", { error: failed })
							}), saved && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MnemonSettingsCard_module_css_default.packSuccess,
								children: props.t("config.providerServiceSaved")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							type: "submit",
							variant: "primary",
							size: "sm",
							disabled: props.disabled || saving || !formComplete,
							children: saving ? props.t("config.saving") : props.t(props.service.configured ? "config.saveProviderService" : "config.enableProvider")
						})]
					})
				]
			});
		}
		function ProviderPanel(props) {
			const [enabled, setEnabled] = (0, react.useState)(props.service.enabled);
			const [expanded, setExpanded] = (0, react.useState)(props.service.enabled && !props.service.configured);
			const [toggling, setToggling] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(null);
			const rowRef = (0, react.useRef)(null);
			const stabilizeAfterLayout = (0, react.useRef)(false);
			(0, react.useLayoutEffect)(() => {
				if (!stabilizeAfterLayout.current || rowRef.current === null) return;
				stabilizeAfterLayout.current = false;
				stabilizeProviderCard(rowRef.current);
			}, [enabled, expanded]);
			(0, react.useEffect)(() => {
				if (toggling) return;
				setEnabled(props.service.enabled);
				if (!props.service.enabled) setExpanded(false);
			}, [props.service.enabled, toggling]);
			const toggle = async (next) => {
				setFailed(null);
				stabilizeAfterLayout.current = true;
				if (next && !props.service.configured) {
					setEnabled(true);
					setExpanded(true);
					return;
				}
				if (!next && !props.service.enabled) {
					setEnabled(false);
					setExpanded(false);
					return;
				}
				const restoreEnabled = enabled;
				const restoreExpanded = expanded;
				setEnabled(next);
				if (!next && expanded) setExpanded(false);
				setToggling(true);
				try {
					const updated = await props.onToggle(props.provider, next);
					setEnabled(updated.enabled);
					if (!next) setExpanded(false);
				} catch (reason) {
					setEnabled(restoreEnabled);
					if (restoreExpanded) setExpanded(true);
					setFailed(message(reason));
				} finally {
					setToggling(false);
				}
			};
			const stateKey = enabled ? props.service.configured ? "config.providerEnabled" : "config.providerNeedsConfiguration" : props.service.configured ? "config.providerDisabledConfigured" : "config.providerDisabled";
			const providerScope = props.provider.workspaceBinding === "provider-global" ? "global" : props.activeScope;
			const controlDisabled = props.disabled || toggling;
			const toggleExpanded = () => {
				stabilizeAfterLayout.current = true;
				setExpanded((value) => !value);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: rowRef,
				className: MnemonSettingsCard_module_css_default.providerRow,
				"data-provider": props.provider.id,
				"data-enabled": enabled || void 0,
				"data-expanded": expanded || void 0,
				role: "group",
				"aria-label": `${props.provider.label} ${props.t("config.providerServiceTitle")}`,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.providerRowHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: MnemonSettingsCard_module_css_default.providerDisclosure,
							"aria-expanded": expanded,
							disabled: !enabled || controlDisabled,
							onClick: toggleExpanded,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: MnemonSettingsCard_module_css_default.providerIdentity,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
									providerId: props.provider.id,
									icon: props.provider.icon,
									className: MnemonSettingsCard_module_css_default.providerMark
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.provider.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: providerSummary(props.t, props.provider) })] })]
							}), enabled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, {
								className: MnemonSettingsCard_module_css_default.providerChevron,
								size: 14
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonSettingsCard_module_css_default.providerEnableControl,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MnemonSettingsCard_module_css_default.providerScopeTag,
									"data-scope": providerScope,
									children: props.t(`config.${providerScope}`)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MnemonSettingsCard_module_css_default.providerState,
									"data-enabled": enabled || void 0,
									children: props.t(stateKey)
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
									className: MnemonSettingsCard_module_css_default.providerToggle,
									checked: enabled,
									label: props.t("config.providerToggleAria", { provider: props.provider.label }),
									disabled: controlDisabled,
									onChange: (next) => void toggle(next)
								})
							]
						})]
					}),
					failed !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MnemonSettingsCard_module_css_default.providerToggleError,
						role: "alert",
						children: props.t("config.providerToggleFailed", { error: failed })
					}),
					enabled && expanded && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonSettingsCard_module_css_default.providerInlineBody,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderServiceForm, {
							provider: props.provider,
							service: props.service,
							activeScope: props.activeScope,
							disabled: controlDisabled,
							t: props.t,
							onSave: props.onSave
						})
					})
				]
			});
		}
		function ProviderSettingsSection(props) {
			const client = (0, react.useMemo)(() => props.connection === void 0 ? null : new MnemonClient(props.connection, props.sessionId, props.workspaceId), [
				props.connection,
				props.sessionId,
				props.workspaceId
			]);
			const routeKey = catalogRouteKey(props.sessionId, props.workspaceId);
			const initialCatalog = cachedCatalog(props.connection, routeKey);
			const [catalog, setCatalog] = (0, react.useState)(() => initialCatalog ?? EMPTY_PROVIDER_CATALOG);
			const [loading, setLoading] = (0, react.useState)(client !== null && initialCatalog === void 0);
			const [failed, setFailed] = (0, react.useState)(null);
			const loadRequests = useRequestVersion();
			const load = (0, react.useCallback)(async (quiet = false) => {
				if (client === null) return;
				const request = loadRequests.begin();
				if (!quiet) setLoading(true);
				setFailed(null);
				try {
					const next = await client.providerServices();
					if (!loadRequests.isCurrent(request)) return;
					cacheCatalog(props.connection, routeKey, next);
					setCatalog(next);
				} catch (reason) {
					if (!loadRequests.isCurrent(request)) return;
					setFailed(message(reason));
				} finally {
					if (!quiet && loadRequests.isCurrent(request)) setLoading(false);
				}
			}, [
				client,
				loadRequests,
				props.connection,
				routeKey
			]);
			const blocked = props.blocked !== void 0;
			const pending = props.pending === true;
			(0, react.useEffect)(() => {
				if (blocked || pending) {
					loadRequests.begin();
					setLoading(pending);
					setFailed(null);
					return;
				}
				const cached = cachedCatalog(props.connection, routeKey);
				setCatalog(cached ?? EMPTY_PROVIDER_CATALOG);
				setLoading(client !== null && cached === void 0);
				load(cached !== void 0);
			}, [
				blocked,
				client,
				load,
				loadRequests,
				pending,
				props.connection,
				props.refreshKey,
				routeKey
			]);
			const acceptService = (0, react.useCallback)((service) => {
				setCatalog((current) => {
					const items = current.items.some((item) => item.providerId === service.providerId) ? current.items.map((item) => item.providerId === service.providerId ? service : item) : [...current.items, service];
					const next = {
						...current,
						items,
						generatedAt: (/* @__PURE__ */ new Date()).toISOString()
					};
					cacheCatalog(props.connection, routeKey, next);
					return next;
				});
			}, [props.connection, routeKey]);
			const save = async (provider, draft) => {
				if (client === null) throw new Error(props.t("config.providerUnavailable"));
				const settings = Object.fromEntries(Object.entries(draft.settings).filter(([key, value]) => serviceFields(provider).find((field) => field.key === key)?.input !== "secret" || String(value).trim() !== ""));
				acceptService(await client.updateProviderService({
					providerId: provider.id,
					settings,
					enabled: true
				}));
			};
			const toggle = async (provider, enabled) => {
				if (client === null) throw new Error(props.t("config.providerUnavailable"));
				const updated = await client.updateProviderService({
					providerId: provider.id,
					settings: {},
					enabled
				});
				acceptService(updated);
				return updated;
			};
			const disabled = props.disabled || props.scopeChanging || client === null || loading || catalog.generatedAt === "";
			if (blocked) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Reveal, { children: props.blocked }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: MnemonSettingsCard_module_css_default.providerList,
				children: props.leading
			})] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Reveal, { children: props.notice ?? null }),
				props.scopeChanging && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: MnemonSettingsCard_module_css_default.scopeChanging,
					role: "status",
					children: props.t("config.saveScopeBeforeProviders")
				}),
				props.workspaceLabel !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: MnemonSettingsCard_module_css_default.providerTarget,
					children: props.t("config.providerTargetWorkspace", { workspace: props.workspaceLabel })
				}),
				loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: MnemonSettingsCard_module_css_default.visuallyHidden,
					role: "status",
					children: props.t("config.loadingProviders")
				}),
				failed !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.providerLoadError,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: MnemonSettingsCard_module_css_default.error,
						children: props.t("config.providerLoadFailed", { error: failed })
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => void load(),
						children: props.t("config.retryProviders")
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.providerList,
					"aria-busy": loading,
					children: [props.leading, catalog.providers.map((provider) => {
						const service = catalog.items.find((item) => item.providerId === provider.id) ?? {
							providerId: provider.id,
							enabled: false,
							configured: false,
							settings: {},
							configuredSecrets: []
						};
						return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderPanel, {
							provider,
							service,
							disabled,
							activeScope: props.activeScope,
							t: props.t,
							onSave: save,
							onToggle: toggle
						}, provider.id);
					})]
				})
			] });
		}
		//#endregion
		//#region src/client/component-settings.tsx
		/** The packages whose own settings dsh-mnemon supplies, through the same region an installed component uses. */
		const RUNTIME_PACKAGE = "dsh-mnemon-source-runtime";
		const MEMORY_SPACES_PACKAGE = "dsh-mnemon-source-memory-spaces";
		const THREE_TIER_PACKAGE = "dsh-mnemon-strategy-default-three-tier";
		/**
		* Register the settings dsh-mnemon keeps for its shipped components, the way
		* an installed component registers its own: Runtime Memory carries where its
		* user profile lives, Memory Spaces its Providers and embedding, the Layered
		* strategy the background tasks it drives.
		*/
		function installShippedComponentSettings(ctx, services) {
			const disposers = [
				installMemoryComponentUI(ctx, {
					packageName: RUNTIME_PACKAGE,
					settings: (page) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RuntimeSettings, {
						...services,
						page
					})
				}),
				installMemoryComponentUI(ctx, {
					packageName: MEMORY_SPACES_PACKAGE,
					settings: (page) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemorySpacesSettings, {
						...services,
						page
					})
				}),
				installMemoryComponentUI(ctx, {
					packageName: THREE_TIER_PACKAGE,
					settings: (page) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ThreeTierSettings, {
						...services,
						page
					})
				})
			];
			return () => {
				for (const dispose of disposers.reverse()) dispose();
			};
		}
		/** Runtime Memory's own setting: whether USER.md follows the storage scope or is shared by every workspace. */
		function RuntimeSettings(props) {
			const { scope, page, t } = props;
			const snapshot = useScope(scope);
			const profile = useLive(snapshot.value?.runtimeUserScope === "global" ? "global" : "storage", async (value) => {
				await scope.mutate([{
					op: "set",
					path: ["runtimeUserScope"],
					value
				}]);
			});
			const disabled = !page.writable || snapshot.status === "loading" || !snapshot.writable;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MnemonSettingsCard_module_css_default.panelSection,
				"aria-label": t("config.runtimeUserScopeTitle"),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: MnemonSettingsCard_module_css_default.rows,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectRow, {
						id: "mnemon-runtime-user-scope",
						label: t("config.runtimeUserScopeTitle"),
						value: profile.value,
						disabled,
						onChange: profile.set,
						options: [{
							value: "storage",
							label: t("config.runtimeUserScopeStorage"),
							detail: t("config.runtimeUserScopeStorageHint")
						}, {
							value: "global",
							label: t("config.runtimeUserScopeGlobal"),
							detail: t("config.runtimeUserScopeGlobalHint")
						}]
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WriteFailure, {
					error: profile.failed,
					t
				})]
			});
		}
		function embeddingDraft(value) {
			const embedding = value?.embedding;
			return {
				endpoint: embedding?.endpoint?.trim() || "http://localhost:11434",
				model: embedding?.model?.trim() || "nomic-embed-text",
				apiKey: embedding?.apiKey?.trim() ?? "",
				protocol: embedding?.protocol ?? "auto"
			};
		}
		function validEmbeddingEndpoint(value) {
			const endpoint = value.trim();
			if (endpoint === "" || endpoint.length > 2048) return false;
			try {
				const parsed = new URL(endpoint);
				return ["http:", "https:"].includes(parsed.protocol) && parsed.username === "" && parsed.password === "" && !endpoint.includes("?") && !endpoint.includes("#");
			} catch {
				return false;
			}
		}
		function validEmbeddingModel(value) {
			const model = value.trim();
			return model.length > 0 && model.length <= 200 && !/[\u0000-\u001f\u007f]/u.test(model);
		}
		function validEmbeddingApiKey(value) {
			const key = value.trim();
			return key.length <= 2048 && !/[\u0000-\u001f\u007f]/u.test(key);
		}
		const validProtocol = (protocol) => MNEMON_EMBEDDING_PROTOCOLS.includes(protocol);
		function embeddingProblem(draft, t) {
			if (!validEmbeddingEndpoint(draft.endpoint)) return t("config.embeddingEndpointInvalid");
			if (!validEmbeddingModel(draft.model)) return t("config.embeddingModelInvalid");
			if (!validEmbeddingApiKey(draft.apiKey)) return t("config.embeddingApiKeyInvalid");
			if (!validProtocol(draft.protocol)) return t("config.embeddingProtocolInvalid");
			return null;
		}
		/** The stored value: a switched-off override keeps only the fields that are valid. */
		function embeddingValue(enabled, draft) {
			const endpoint = draft.endpoint.trim().replace(/\/+$/u, "");
			if (enabled) return {
				enabled: true,
				endpoint,
				model: draft.model.trim(),
				protocol: draft.protocol,
				apiKey: draft.apiKey.trim()
			};
			return {
				enabled: false,
				...validEmbeddingEndpoint(draft.endpoint) ? { endpoint } : {},
				...validEmbeddingModel(draft.model) ? { model: draft.model.trim() } : {},
				...validProtocol(draft.protocol) ? { protocol: draft.protocol } : {},
				...validEmbeddingApiKey(draft.apiKey) ? { apiKey: draft.apiKey.trim() } : {}
			};
		}
		/**
		* Memory Spaces' own settings: the Providers that store its spaces, Mnemon
		* Native first with the embedding runtime only Native reads.
		*/
		function MemorySpacesSettings(props) {
			const { scope, connection, page, t } = props;
			const snapshot = useScope(scope);
			const sessionId = page.sessionId;
			const workspaceId = page.workspace?.id;
			const client = (0, react.useMemo)(() => connection === void 0 ? void 0 : new MnemonClient(connection, sessionId, workspaceId), [
				connection,
				sessionId,
				workspaceId
			]);
			const saved = embeddingDraft(snapshot.value);
			const managedSaved = snapshot.value?.embedding?.enabled === true;
			const managed = useLive(managedSaved, async (enabled) => {
				await scope.mutate([{
					op: "set",
					path: ["embedding"],
					value: embeddingValue(enabled, saved)
				}]);
			});
			const form = useStaged(saved, async (draft) => {
				await scope.mutate([{
					op: "set",
					path: ["embedding"],
					value: embeddingValue(managedSaved, draft)
				}]);
			});
			const [nativeCliFound, setNativeCliFound] = (0, react.useState)(void 0);
			const [status, setStatus] = (0, react.useState)({ state: "idle" });
			const statusRequest = (0, react.useRef)(0);
			const on = page.component.enabled;
			(0, react.useEffect)(() => {
				if (client === void 0 || !on) {
					setNativeCliFound(void 0);
					return;
				}
				let current = true;
				client.statusSummary().then((summary) => {
					if (current) setNativeCliFound(summary.commandFound);
				}, () => {
					if (current) setNativeCliFound(void 0);
				});
				return () => {
					current = false;
				};
			}, [
				client,
				on,
				snapshot.revision
			]);
			(0, react.useEffect)(() => {
				statusRequest.current += 1;
				setStatus({ state: "idle" });
			}, [client, snapshot.revision]);
			if (!on) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: MnemonSettingsCard_module_css_default.panelNote,
				children: t("spaces.offNote")
			});
			const test = () => {
				if (client === void 0) return;
				const request = statusRequest.current + 1;
				statusRequest.current = request;
				setStatus({ state: "loading" });
				client.embeddingStatus().then((value) => {
					if (statusRequest.current === request) setStatus({
						state: "ready",
						value
					});
				}, (reason) => {
					if (statusRequest.current === request) setStatus({
						state: "error",
						error: message(reason)
					});
				});
			};
			const activeScope = isWorkspaceStorageScope(snapshot.value?.storageScope ?? "global") ? "workspace" : "global";
			const readOnly = snapshot.value?.writeEnabled === false;
			const disabled = !page.writable || snapshot.status === "loading" || !snapshot.writable;
			const cliMissing = nativeCliFound === false;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MnemonSettingsCard_module_css_default.panelSection,
				"aria-labelledby": "mnemon-spaces-providers",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.panelHeading,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						id: "mnemon-spaces-providers",
						children: t("config.providersTitle")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.providersDescription") })]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderSettingsSection, {
					...connection === void 0 ? {} : { connection },
					...sessionId === void 0 ? {} : { sessionId },
					...workspaceId === void 0 ? {} : { workspaceId },
					...activeScope !== "workspace" || page.workspace?.label === void 0 ? {} : { workspaceLabel: page.workspace.label },
					activeScope,
					refreshKey: snapshot.revision ?? 0,
					disabled: disabled || readOnly,
					scopeChanging: false,
					...readOnly ? { notice: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Callout, {
						tone: "warning",
						className: MnemonSettingsCard_module_css_default.groupCallout,
						title: t("config.providersReadOnlyTitle"),
						children: t("config.providersReadOnlyDetail")
					}) } : {},
					t,
					leading: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NativeProviderCard, {
						activeScope,
						cliMissing,
						t,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EmbeddingEditor, {
							managed: managed.value,
							draft: form.draft,
							disabled,
							connectionAvailable: client !== void 0,
							cliMissing,
							changing: form.dirty,
							status,
							t,
							onEdit: form.edit,
							onTest: test,
							onManaged: (on) => {
								if (!on) form.discard();
								managed.set(on);
							},
							actions: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(WriteFailure, {
								error: managed.failed,
								t
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PanelActions, {
								dirty: form.dirty,
								saving: form.saving,
								invalid: embeddingProblem(form.draft, t),
								failed: form.failed,
								applied: form.applied,
								disabled,
								t,
								onDiscard: form.discard,
								onApply: () => {
									form.apply();
								}
							})] })
						})
					})
				})]
			});
		}
		/** Mnemon Native, listed first among the Providers; its body holds the settings only Native reads. */
		function NativeProviderCard(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
				className: MnemonSettingsCard_module_css_default.providerRow,
				"data-provider": "mnemon-native",
				"data-native": "",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
					className: MnemonSettingsCard_module_css_default.providerRowHeader,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: MnemonSettingsCard_module_css_default.providerIdentity,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
							providerId: "mnemon-native",
							icon: {
								kind: "brand",
								value: "mnemon"
							},
							className: MnemonSettingsCard_module_css_default.providerMark
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.t("config.nativeName") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: props.t("config.nativeSummary") })] })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: MnemonSettingsCard_module_css_default.providerEnableControl,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MnemonSettingsCard_module_css_default.providerScopeTag,
								"data-scope": props.activeScope,
								children: props.t(`config.${props.activeScope}`)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MnemonSettingsCard_module_css_default.providerState,
								"data-enabled": props.cliMissing ? void 0 : "",
								children: props.t(props.cliMissing ? "config.nativeCliMissing" : "config.officialNative")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, {
								className: MnemonSettingsCard_module_css_default.providerChevron,
								size: 14
							})
						]
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: MnemonSettingsCard_module_css_default.providerInlineBody,
					children: props.children
				})]
			});
		}
		/** Reachability and coverage line; the protocol appears only when the Host reports one. */
		function embeddingStatusText(t, status) {
			const coverage = {
				embedded: status.embedded,
				total: status.totalInsights,
				coverage: status.coverage
			};
			return status.protocol === void 0 ? t(status.available ? "config.embeddingStatusAvailable" : "config.embeddingStatusUnavailable", {
				model: status.model,
				...coverage
			}) : t(status.available ? "config.embeddingStatusAvailableWithProtocol" : "config.embeddingStatusUnavailableWithProtocol", {
				model: status.model,
				protocol: status.protocol,
				...coverage
			});
		}
		/** The embedding runtime: the switch applies at once; the connection fields, shown while DSH manages it, wait for Apply. */
		function EmbeddingEditor(props) {
			const { draft, t, status } = props;
			const feedback = props.cliMissing ? t("config.embeddingCliMissing") : props.changing ? t("config.embeddingSaveBeforeTest") : status.state === "loading" ? t("config.embeddingTesting") : status.state === "error" ? t("config.embeddingStatusFailed", { error: status.error ?? "" }) : status.state === "ready" && status.value !== void 0 ? embeddingStatusText(t, status.value) : !props.connectionAvailable ? t("config.embeddingTestUnavailable") : t("config.embeddingNotTested");
			const text = (field, type, label, valid, placeholder) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [label, /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
				type,
				"aria-label": label,
				"aria-invalid": !valid,
				value: draft[field],
				disabled: props.disabled,
				autoComplete: "off",
				spellCheck: false,
				autoCapitalize: "none",
				autoCorrect: "off",
				placeholder,
				onChange: (event) => props.onEdit({ [field]: event.target.value })
			})] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MnemonSettingsCard_module_css_default.editor,
				"aria-labelledby": "mnemon-embedding-heading",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.editorHeading,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
							id: "mnemon-embedding-heading",
							children: t("config.embeddingTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.embeddingDescription") })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToggleRow, {
						id: "mnemon-embedding-managed",
						label: t("config.embeddingManaged"),
						hint: t("config.embeddingManagedHint"),
						checked: props.managed,
						disabled: props.disabled,
						onChange: props.onManaged
					}),
					props.managed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.fieldGrid,
						children: [
							text("endpoint", "url", t("config.embeddingEndpoint"), validEmbeddingEndpoint(draft.endpoint), "http://localhost:11434"),
							text("model", "text", t("config.embeddingModel"), validEmbeddingModel(draft.model), "nomic-embed-text"),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
								label: t("config.embeddingProtocol"),
								value: draft.protocol,
								disabled: props.disabled,
								options: [
									{
										value: "auto",
										label: t("config.embeddingProtocolAuto")
									},
									{
										value: "ollama",
										label: t("config.embeddingProtocolOllama")
									},
									{
										value: "openai",
										label: t("config.embeddingProtocolOpenai")
									}
								],
								onChange: (protocol) => props.onEdit({ protocol })
							}),
							text("apiKey", "password", t("config.embeddingApiKey"), validEmbeddingApiKey(draft.apiKey), "sk-…")
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MnemonSettingsCard_module_css_default.editorNote,
						children: t("config.embeddingSecurity")
					})] }),
					props.actions,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.embeddingTest,
						"aria-live": "polite",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: status.state === "error" ? MnemonSettingsCard_module_css_default.error : void 0,
							role: status.state === "error" ? "alert" : void 0,
							children: feedback
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							disabled: props.disabled || !props.connectionAvailable || props.cliMissing || props.changing || status.state === "loading",
							onClick: props.onTest,
							children: t("config.embeddingTest")
						})]
					})
				]
			});
		}
		/** Each limit as the page shows it: the interval in seconds, the others as stored. */
		const LIMITS = [
			{
				key: "minIntervalMs",
				min: 5e3,
				max: 864e5,
				scale: 1e3
			},
			{
				key: "maxPerSession",
				min: 0,
				max: 200,
				scale: 1
			},
			{
				key: "maxContextChars",
				min: 1e3,
				max: 1e6,
				scale: 1
			},
			{
				key: "maxTokens",
				min: 128,
				max: 131072,
				scale: 1
			}
		];
		function routeOf(value) {
			return {
				mode: value?.taskAgentModel?.mode === "fixed" ? "fixed" : "inherit",
				provider: value?.taskAgentModel?.provider?.trim() ?? "",
				model: value?.taskAgentModel?.model?.trim() ?? ""
			};
		}
		function reviewOf(value) {
			return {
				...DEFAULT_IDLE_REVIEW,
				...value?.idleReview
			};
		}
		const choiceOf = (review) => ({
			enabled: review.enabled,
			provider: review.provider,
			fallback: review.fallback,
			agentTeams: review.agentTeams
		});
		const limitsOf = (review) => Object.fromEntries(LIMITS.map((limit) => [limit.key, String(review[limit.key] / limit.scale)]));
		/** The value a limit stores, or undefined when the Host would refuse it. */
		function limitValue(limit, text) {
			if (text.trim() === "") return void 0;
			const value = Math.round(Number(text) * limit.scale);
			return Number.isInteger(value) && value >= limit.min && value <= limit.max ? value : void 0;
		}
		/**
		* The idle review is written whole, as the Host stores it: what is configured
		* now plus what changed, so a setting never set keeps inheriting its default.
		*/
		function reviewWrite(configured, next, before) {
			const changed = Object.keys(next).filter((key) => next[key] !== before[key]);
			if (changed.length === 0) return [];
			return [{
				op: "set",
				path: ["idleReview"],
				value: {
					...configured,
					...Object.fromEntries(changed.map((key) => [key, next[key]]))
				}
			}];
		}
		/** The route choosing a fixed model starts from: the saved one, else DSH's default, else the first listed. */
		function startingRoute(catalog, current) {
			const listed = (provider) => catalog.groups.some((group) => group.id === provider);
			const provider = (listed(current.provider) ? current.provider : "") || catalog.defaultSelection?.provider || catalog.groups[0]?.id || "";
			const models = catalog.groups.find((group) => group.id === provider)?.models ?? [];
			const model = (current.provider === provider ? current.model : "") || (catalog.defaultSelection?.provider === provider ? catalog.defaultSelection.model : "") || models[0]?.id || "";
			return provider === "" || model === "" ? void 0 : {
				provider,
				model
			};
		}
		/**
		* The Layered strategy's own settings: the model its background task Agents use,
		* and the idle review that keeps its layers in shape. Choices apply at once;
		* the review limits are typed and wait for their Apply.
		*/
		function ThreeTierSettings(props) {
			const { scope, connection, page, t } = props;
			const snapshot = useScope(scope);
			const savedReview = reviewOf(snapshot.value);
			const route = useLive(routeOf(snapshot.value), async (next) => {
				await scope.mutate([{
					op: "set",
					path: ["taskAgentModel"],
					value: next.mode === "inherit" ? { mode: "inherit" } : {
						mode: "fixed",
						provider: next.provider,
						model: next.model
					}
				}]);
			});
			const configured = snapshot.value?.idleReview;
			const choice = useLive(choiceOf(savedReview), async (next) => {
				const operations = reviewWrite(configured, next, choiceOf(savedReview));
				if (operations.length > 0) await scope.mutate(operations);
			});
			const limits = useStaged(limitsOf(savedReview), async (draft) => {
				const next = Object.fromEntries(LIMITS.map((limit) => [limit.key, limitValue(limit, draft[limit.key])]));
				const before = Object.fromEntries(LIMITS.map((limit) => [limit.key, savedReview[limit.key]]));
				const operations = reviewWrite(configured, next, before);
				if (operations.length > 0) await scope.mutate(operations);
			});
			const [catalog, setCatalog] = (0, react.useState)({
				state: connection === void 0 ? "unavailable" : "loading",
				value: null,
				error: null,
				full: false
			});
			const request = (0, react.useRef)(0);
			const loaded = (0, react.useRef)("none");
			const load = (0, react.useCallback)((full) => {
				if (connection === void 0) return;
				const current = ++request.current;
				setCatalog((value) => ({
					...value,
					state: "loading",
					error: null
				}));
				new MnemonClient(connection).taskAgentModels(full).then((value) => {
					if (request.current !== current) return;
					loaded.current = full ? "full" : "route";
					setCatalog({
						state: "ready",
						value,
						error: null,
						full
					});
				}, (reason) => {
					if (request.current === current) setCatalog((value) => ({
						...value,
						state: "error",
						error: message(reason)
					}));
				});
			}, [connection]);
			(0, react.useEffect)(() => () => {
				request.current += 1;
			}, []);
			const configuredMode = snapshot.value?.taskAgentModel?.mode === "fixed" ? "fixed" : "inherit";
			(0, react.useEffect)(() => {
				if (configuredMode === "fixed" ? loaded.current === "full" : loaded.current !== "none") return;
				load(configuredMode === "fixed");
			}, [configuredMode, load]);
			const [choosing, setChoosing] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (!choosing) return;
				if (catalog.state === "error") {
					setChoosing(false);
					return;
				}
				if (!catalog.full || catalog.value === null) return;
				setChoosing(false);
				const start = startingRoute(catalog.value, route.value);
				if (start !== void 0) route.set({
					mode: "fixed",
					...start
				});
			}, [choosing, catalog]);
			const chooseMode = (mode) => {
				if (mode === "inherit") {
					setChoosing(false);
					route.set({
						mode: "inherit",
						provider: "",
						model: ""
					});
					return;
				}
				const start = catalog.full && catalog.value !== null ? startingRoute(catalog.value, route.value) : void 0;
				if (start !== void 0) {
					route.set({
						mode: "fixed",
						...start
					});
					return;
				}
				setChoosing(true);
				load(true);
			};
			const disabled = !page.writable || snapshot.status === "loading" || !snapshot.writable;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MnemonSettingsCard_module_css_default.panelSection,
				"aria-labelledby": "mnemon-three-tier-background",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.panelHeading,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								id: "mnemon-three-tier-background",
								children: t("config.backgroundTitle")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.backgroundDescription") }),
							catalog.state === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MnemonSettingsCard_module_css_default.miniSpinner,
								"aria-hidden": "true"
							})
						]
					}),
					!page.component.enabled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MnemonSettingsCard_module_css_default.panelNote,
						children: t("threeTier.offNote")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonSettingsCard_module_css_default.rows,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(TaskAgentModelRows, {
							mode: choosing ? "fixed" : route.value.mode,
							route: route.value,
							choosing,
							catalog: catalog.value,
							state: catalog.state,
							error: catalog.error,
							disabled,
							onMode: chooseMode,
							onRoute: (next) => route.set({
								mode: "fixed",
								...next
							}),
							t
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IdleReviewRows, {
							choice: choice.value,
							limits,
							disabled,
							onChoice: (next) => choice.set({
								...choice.value,
								...next
							}),
							t
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(WriteFailure, {
						error: route.failed ?? choice.failed,
						t
					})
				]
			});
		}
		function TaskAgentModelRows(props) {
			const { route, t } = props;
			const groups = props.catalog?.groups ?? [];
			const group = groups.find((candidate) => candidate.id === route.provider);
			const inherited = props.catalog?.defaultSelection ?? (props.catalog?.effective?.source === "fixed" ? void 0 : props.catalog?.effective);
			const fixed = props.mode === "fixed" && !props.choosing;
			const effective = props.mode === "fixed" ? !fixed || route.provider === "" || route.model === "" ? void 0 : {
				provider: route.provider,
				model: route.model
			} : inherited;
			const shared = (name) => groups.filter((candidate) => candidate.name === name).length > 1;
			const providers = [...route.provider !== "" && group === void 0 ? [{
				value: route.provider,
				label: route.provider
			}] : [], ...groups.map((candidate) => ({
				value: candidate.id,
				label: candidate.name,
				...shared(candidate.name) ? { detail: candidate.id } : {}
			}))];
			const models = [...route.model !== "" && group?.models.some((model) => model.id === route.model) !== true ? [{
				value: route.model,
				label: route.model
			}] : [], ...(group?.models ?? []).map((model) => ({
				value: model.id,
				label: model.name,
				...model.inputModalities?.includes("image") === true ? { detail: t("config.taskAgentImageInput") } : {}
			}))];
			const chooseProvider = (provider) => {
				const model = groups.find((candidate) => candidate.id === provider)?.models[0]?.id;
				if (model !== void 0) props.onRoute({
					provider,
					model
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectRow, {
					id: "mnemon-task-agent",
					label: t("config.taskAgentTitle"),
					value: props.mode,
					disabled: props.disabled,
					onChange: props.onMode,
					options: [{
						value: "inherit",
						label: t("config.taskAgentInherit"),
						detail: t("config.taskAgentInheritHint")
					}, {
						value: "fixed",
						label: t("config.taskAgentFixed"),
						detail: t("config.taskAgentFixedHint"),
						...props.state === "unavailable" ? { disabled: true } : {}
					}]
				}),
				fixed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectRow, {
					id: "mnemon-task-agent-provider",
					label: t("config.taskAgentProvider"),
					value: route.provider,
					disabled: props.disabled || props.state !== "ready",
					options: providers,
					onChange: chooseProvider
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectRow, {
					id: "mnemon-task-agent-model",
					label: t("config.taskAgentModel"),
					value: route.model,
					disabled: props.disabled || props.state !== "ready" || group === void 0,
					options: models,
					onChange: (model) => props.onRoute({
						provider: route.provider,
						model
					})
				})] }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonSettingsCard_module_css_default.rowDetail,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MnemonSettingsCard_module_css_default.effectiveRoute,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.taskAgentEffective") }), effective === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: props.state === "loading" || props.choosing ? t("config.taskAgentLoading") : t("config.taskAgentUnavailable") }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("code", { children: [
								effective.provider,
								" / ",
								effective.model
							] })]
						}),
						props.state === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: MnemonSettingsCard_module_css_default.warning,
							children: t("config.taskAgentLoadFailed", { error: props.error ?? "" })
						}),
						(props.catalog?.failures.length ?? 0) > 0 && groups.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: MnemonSettingsCard_module_css_default.warning,
							children: t("config.taskAgentPartial", { count: props.catalog.failures.length })
						})
					]
				})
			] });
		}
		function IdleReviewRows(props) {
			const { choice, limits, t } = props;
			const invalid = LIMITS.find((limit) => limitValue(limit, limits.draft[limit.key]) === void 0);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ToggleRow, {
				id: "mnemon-idle-review",
				label: t("config.reviewTitle"),
				ariaLabel: t("config.reviewEnabled"),
				hint: t("config.reviewDescription"),
				checked: choice.enabled,
				disabled: props.disabled,
				onChange: (enabled) => props.onChoice({ enabled })
			}), choice.enabled && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectRow, {
					id: "mnemon-review-provider",
					label: t("config.reviewProvider"),
					value: choice.provider,
					disabled: props.disabled,
					onChange: (provider) => props.onChoice({ provider }),
					options: [{
						value: "spawn",
						label: t("config.reviewSpawn"),
						detail: t("config.reviewSpawnHint")
					}, {
						value: "fork",
						label: t("config.reviewFork"),
						detail: t("config.reviewForkHint")
					}]
				}),
				choice.provider === "fork" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectRow, {
					id: "mnemon-review-fallback",
					label: t("config.reviewFallback"),
					value: choice.fallback,
					disabled: props.disabled,
					onChange: (fallback) => props.onChoice({ fallback }),
					options: [{
						value: "spawn",
						label: t("config.reviewSpawn")
					}, {
						value: "skip",
						label: t("config.reviewSkip")
					}]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectRow, {
					id: "mnemon-review-teams",
					label: t("config.reviewAgentTeams"),
					value: choice.agentTeams,
					disabled: props.disabled,
					onChange: (agentTeams) => props.onChoice({ agentTeams }),
					options: [{
						value: "pause",
						label: t("config.reviewTeamPause"),
						detail: t("config.reviewTeamPauseHint")
					}, {
						value: "scoped",
						label: t("config.reviewTeamScoped"),
						detail: t("config.reviewTeamScopedHint")
					}]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
					className: MnemonSettingsCard_module_css_default.advanced,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [t("config.reviewLimits"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, { size: 12 })] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MnemonSettingsCard_module_css_default.fieldGrid,
							children: LIMITS.map((limit) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [t(`config.review.${limit.key}`), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "number",
								step: "1",
								inputMode: "numeric",
								value: limits.draft[limit.key],
								disabled: props.disabled,
								"aria-invalid": limitValue(limit, limits.draft[limit.key]) === void 0,
								onChange: (event) => limits.edit({ [limit.key]: event.target.value })
							})] }, limit.key))
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PanelActions, {
							dirty: limits.dirty,
							saving: limits.saving,
							applied: limits.applied,
							failed: limits.failed,
							disabled: props.disabled,
							t,
							invalid: invalid === void 0 ? null : t("config.reviewLimitInvalid", {
								field: t(`config.review.${invalid.key}`),
								min: invalid.min / invalid.scale,
								max: invalid.max / invalid.scale
							}),
							onDiscard: limits.discard,
							onApply: () => {
								limits.apply();
							}
						})
					]
				})
			] })] });
		}
		//#endregion
		//#region src/client/component-status.tsx
		const DOCUMENTS_PACKAGE = "dsh-mnemon-source-documents";
		/**
		* The status the Memory System read for the conversation and workspace it
		* shows. Only dsh-mnemon's own cards read it; a card an installed component
		* contributes reads its own Source.
		*/
		const WorkbenchStatusContext = (0, react.createContext)(null);
		/**
		* Register the Status cards of the shipped Sources, the way an installed
		* component registers its own: each says what its Source holds.
		*/
		function installShippedComponentStatus(ctx) {
			const disposers = [
				installMemoryComponentUI(ctx, {
					packageName: RUNTIME_PACKAGE,
					status: () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RuntimeStatus, {})
				}),
				installMemoryComponentUI(ctx, {
					packageName: DOCUMENTS_PACKAGE,
					status: () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DocumentsStatus, {})
				}),
				installMemoryComponentUI(ctx, {
					packageName: MEMORY_SPACES_PACKAGE,
					status: () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SpacesStatus, {})
				})
			];
			return () => {
				for (const dispose of disposers.reverse()) dispose();
			};
		}
		/** A card's headline and one line under it. */
		function Figure(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.headline }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: props.detail })] });
		}
		function RuntimeStatus() {
			const t = useT();
			const storage = (0, react.useContext)(WorkbenchStatusContext)?.storage;
			const area = storage?.scopes.find((scope) => scope.kind === (storage.activeKind ?? "global"))?.areas.find((candidate) => candidate.kind === "runtime");
			if (area === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Figure, {
				headline: t("status.runtimeWaiting"),
				detail: t("status.runtimeWaitingDetail")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Figure, {
				headline: t("status.runtimeRatio", {
					user: Number(area.details.userEntries ?? 0),
					memory: Number(area.details.memoryEntries ?? 0)
				}),
				detail: t("status.runtimeBytes", { bytes: humanBytes(area.bytes) })
			});
		}
		function DocumentsStatus() {
			const t = useT();
			const documents = (0, react.useContext)(WorkbenchStatusContext)?.documents;
			if (documents === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Figure, {
				headline: t("status.documentsWaiting"),
				detail: t("status.documentsSession")
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Figure, {
				headline: t("status.documentRatio", {
					active: documents.activeCount,
					archived: documents.archivedCount
				}),
				detail: t("status.documentUsage", {
					used: humanBytes(documents.activeBytes),
					limit: humanBytes(documents.limitBytes)
				})
			});
		}
		function SpacesStatus() {
			const t = useT();
			const status = (0, react.useContext)(WorkbenchStatusContext);
			const spaces = status?.memoryBodies;
			if (spaces === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Figure, {
				headline: t("status.directoryUnsynced"),
				detail: t("status.activeMemories", { count: status?.stats?.totalInsights ?? 0 })
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Figure, {
				headline: t("status.activeRatio", {
					active: spaces.filter((space) => space.active).length,
					total: spaces.length
				}),
				detail: t("status.activeMemories", { count: status?.stats?.totalInsights ?? 0 })
			});
		}
		//#endregion
		//#region src/client/starter-rows.ts
		/**
		* The component rows the Starter bundle's patch declares: each row's id and
		* the package it names. DSH lists them under the bundle's page; each opens a
		* page of its own, which shows that package's component page as the
		* configuration's board opens it.
		*/
		const STARTER_COMPONENT_ROWS = [
			{
				rowId: "mnemon-source-runtime",
				packageName: "dsh-mnemon-source-runtime"
			},
			{
				rowId: "mnemon-source-documents",
				packageName: "dsh-mnemon-source-documents"
			},
			{
				rowId: "mnemon-source-memory-spaces",
				packageName: "dsh-mnemon-source-memory-spaces"
			},
			{
				rowId: "mnemon-strategy-default-three-tier",
				packageName: "dsh-mnemon-strategy-default-three-tier"
			},
			{
				rowId: "mnemon-strategy-general",
				packageName: "dsh-mnemon-strategy-general"
			},
			{
				rowId: "mnemon-strategy-auto-capture",
				packageName: "dsh-mnemon-strategy-auto-capture"
			},
			{
				rowId: "mnemon-strategy-light-context",
				packageName: "dsh-mnemon-strategy-light-context"
			},
			{
				rowId: "mnemon-strategy-scoped",
				packageName: "dsh-mnemon-strategy-scoped"
			}
		];
		//#endregion
		//#region src/client/anchor.ts
		const MNEMON_ANCHOR_EVENT = "mnemon:anchor";
		const pendingBySession = /* @__PURE__ */ new Map();
		function keyOf(sessionId) {
			return sessionId === void 0 || sessionId === "" ? "*" : sessionId;
		}
		/** Ask the Mnemon view to open a page; held until a matching view consumes it. */
		function dispatchMnemonAnchor(anchor) {
			pendingBySession.set(keyOf(anchor.sessionId), anchor);
			window.dispatchEvent(new CustomEvent(MNEMON_ANCHOR_EVENT, { detail: anchor }));
		}
		/** Take the anchor held for this session (usually at mount time), or null. */
		function consumeMnemonAnchor(sessionId) {
			const key = keyOf(sessionId);
			const anchor = pendingBySession.get(key);
			if (anchor === void 0) return null;
			pendingBySession.delete(key);
			return anchor;
		}
		/** Subscribe to anchors addressed to this session; returns an unsubscribe. */
		function subscribeMnemonAnchor(sessionId, onAnchor) {
			const key = keyOf(sessionId);
			const handler = (event) => {
				const anchor = event.detail;
				if (anchor !== void 0 && keyOf(anchor.sessionId) === key) {
					if (pendingBySession.get(key) === anchor) pendingBySession.delete(key);
					onAnchor(anchor);
				}
			};
			window.addEventListener(MNEMON_ANCHOR_EVENT, handler);
			return () => window.removeEventListener(MNEMON_ANCHOR_EVENT, handler);
		}
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/src/client/MnemonTurnTail.module.css.mjs
		const css$2 = "._3g7pq_root{min-width:0;margin:2px 0}._3g7pq_bar{border-radius:var(--dsw-radius-sm);cursor:pointer;min-width:0;max-width:100%;height:24px;color:var(--dsw-alias-label-tertiary);font:inherit;background:0 0;border:0;align-items:center;gap:6px;padding:0 6px;font-size:12px;line-height:18px;display:flex}._3g7pq_bar:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}._3g7pq_bar:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}._3g7pq_mark{flex:none;display:inline-flex}._3g7pq_label{flex:none;font-weight:500}._3g7pq_metrics{align-items:center;gap:8px;min-width:0;display:inline-flex;overflow:hidden}._3g7pq_metrics span{white-space:nowrap}._3g7pq_failureMetric{color:var(--dsw-alias-state-error-primary)}._3g7pq_chevron{flex:none;margin-left:auto;transition:transform .12s}._3g7pq_chevronOpen{transform:rotate(180deg)}._3g7pq_details{gap:4px;min-width:0;margin:2px 0 4px;padding:4px 6px;list-style:none;display:grid;container-type:inline-size}._3g7pq_toolRow{align-items:flex-start;gap:8px;min-width:0;display:flex}._3g7pq_toolChip{cursor:pointer;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);font:inherit;white-space:nowrap;border:none;border-radius:999px;flex:none;align-items:center;gap:3px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;display:inline-flex}._3g7pq_toolCount{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}._3g7pq_toolChip:hover{background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}._3g7pq_toolChip:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}._3g7pq_items{flex:auto;justify-items:start;gap:2px;min-width:0;display:grid}._3g7pq_item{border-radius:var(--dsw-radius-sm);cursor:pointer;min-width:0;max-width:100%;color:var(--dsw-alias-label-secondary);font:inherit;text-align:left;background:0 0;border:0;align-items:baseline;gap:6px;padding:0 4px;font-size:12px;line-height:19px;display:flex}._3g7pq_item:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}._3g7pq_item:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}._3g7pq_itemText{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}._3g7pq_itemPlace{min-width:0;max-width:40%;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;flex:0 auto;overflow:hidden}._3g7pq_itemMore{color:var(--dsw-alias-label-tertiary);padding:0 4px;font-size:12px;line-height:19px}@container (width<=420px){._3g7pq_toolRow{flex-direction:column;align-items:stretch;gap:2px}._3g7pq_toolChip{align-self:flex-start}}@media (prefers-reduced-motion:reduce){._3g7pq_chevron{transition:none}}";
		const tagId$2 = "dsh-mnemon/src/client/MnemonTurnTail.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$2;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$2) tag.textContent = css$2;
		}
		var MnemonTurnTail_module_css_default = {
			"bar": "_3g7pq_bar",
			"chevron": "_3g7pq_chevron",
			"chevronOpen": "_3g7pq_chevronOpen",
			"details": "_3g7pq_details",
			"failureMetric": "_3g7pq_failureMetric",
			"item": "_3g7pq_item",
			"itemMore": "_3g7pq_itemMore",
			"itemPlace": "_3g7pq_itemPlace",
			"itemText": "_3g7pq_itemText",
			"items": "_3g7pq_items",
			"label": "_3g7pq_label",
			"mark": "_3g7pq_mark",
			"metrics": "_3g7pq_metrics",
			"root": "_3g7pq_root",
			"toolChip": "_3g7pq_toolChip",
			"toolCount": "_3g7pq_toolCount",
			"toolRow": "_3g7pq_toolRow"
		};
		//#endregion
		//#region src/client/memory-icon.tsx
		/** Brain outline shared by native, fallback and Better Sidebar navigation. */
		const MEMORY_ICON_PATHS = [
			"M8 3.4C8 2.2 7.2 1.5 6.2 1.5C5.2 1.5 4.4 2.2 4.3 3.2C2.8 3.2 1.9 4.4 2.2 5.8C.9 6.8 1 8.8 2.4 9.6C2.1 11 3.1 12.2 4.5 12.2C4.8 14.7 8 14.9 8 12.3C8 14.9 11.2 14.7 11.5 12.2C12.9 12.2 13.9 11 13.6 9.6C15 8.8 15.1 6.8 13.8 5.8C14.1 4.4 13.2 3.2 11.7 3.2C11.6 2.2 10.8 1.5 9.8 1.5C8.8 1.5 8 2.2 8 3.4Z",
			"M8 3.4v8.9",
			"M4.3 3.2C4.2 4.1 4.7 4.8 5.5 5.1M11.7 3.2C11.8 4.1 11.3 4.8 10.5 5.1",
			"M2.4 9.6C3.2 10 4.4 9.7 4.8 8.8M13.6 9.6C12.8 10 11.6 9.7 11.2 8.8",
			"M4.5 12.2C4.4 11.2 4.9 10.5 5.7 10.2M11.5 12.2C11.6 11.2 11.1 10.5 10.3 10.2"
		];
		/** The brain outline for React surfaces; the surrounding control owns labels and state. */
		function MemoryIcon({ size, ...marker }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...marker,
				"aria-hidden": "true",
				viewBox: "0 0 16 16",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				children: MEMORY_ICON_PATHS.map((path) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: path }, path))
			});
		}
		/** The same outline built with DOM APIs for the fallback sidebar entry, which renders outside React. */
		function createMemoryIcon(size) {
			const namespace = "http://www.w3.org/2000/svg";
			const icon = document.createElementNS(namespace, "svg");
			icon.setAttribute("viewBox", "0 0 16 16");
			icon.setAttribute("width", String(size));
			icon.setAttribute("height", String(size));
			icon.setAttribute("fill", "none");
			icon.setAttribute("stroke", "currentColor");
			icon.setAttribute("stroke-width", "1");
			icon.setAttribute("stroke-linecap", "round");
			icon.setAttribute("stroke-linejoin", "round");
			icon.setAttribute("aria-hidden", "true");
			for (const data of MEMORY_ICON_PATHS) {
				const path = document.createElementNS(namespace, "path");
				path.setAttribute("d", data);
				icon.append(path);
			}
			return icon;
		}
		//#endregion
		//#region src/client/MnemonTurnTail.tsx
		function turnNumber(turn) {
			const value = turn?.turn;
			return typeof value === "number" ? value : void 0;
		}
		function isClosedTurn(turn) {
			return turn?.status === "closed";
		}
		/** Route a settled tool name to the workbench page that explains its effect. */
		function memoryPageForTool(name) {
			if (name === "mnemon_document_search" || name === "mnemon_document_manage" || name === "mnemon_document_create") return "documents/library";
			if (name === "mnemon_runtime_memory") return "runtime/entries";
			if (name === "mnemon_recall" || name === "mnemon_related") return "memory-spaces/explore";
			if (name === "mnemon_status") return "status";
			return "memory-spaces/spaces";
		}
		/** What each memory tool did, as its chip says it; another tool keeps its own name. */
		const TOOL_LABELS = {
			mnemon_recall: "turnTail.tool.recall",
			mnemon_related: "turnTail.tool.related",
			mnemon_document_search: "turnTail.tool.documentSearch",
			mnemon_document_manage: "turnTail.tool.documentManage",
			mnemon_document_create: "turnTail.tool.documentCreate",
			mnemon_runtime_memory: "turnTail.tool.runtime",
			mnemon_remember: "turnTail.tool.remember",
			mnemon_link: "turnTail.tool.link",
			mnemon_forget: "turnTail.tool.forget",
			mnemon_status: "turnTail.tool.status",
			mnemon_memory_bodies: "turnTail.tool.spaces",
			mnemon_memory_body_create: "turnTail.tool.spaceCreate",
			mnemon_memory_body_update: "turnTail.tool.spaceUpdate",
			mnemon_memory_body_merge: "turnTail.tool.spaceMerge",
			mnemon_view_route: "turnTail.tool.viewRoute",
			mnemon_view_action: "turnTail.tool.viewAction"
		};
		/** One chip per tool, in the order the turn first used it, with how many times it did. */
		function turnTools(names) {
			const counts = /* @__PURE__ */ new Map();
			for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
			return [...counts].map(([name, count]) => ({
				name,
				count
			}));
		}
		/** Open a document by id, a memory by recalling its text, a runtime entry by its text. */
		function itemTarget(toolName, sourceTypeId, operationId, item, text) {
			if (sourceTypeId === "documents") return {
				page: "documents/library",
				seed: item.id
			};
			if (sourceTypeId === "runtime") return {
				page: "runtime/entries",
				seed: text
			};
			if (sourceTypeId === "memory-spaces" && operationId !== "manage-spaces") return {
				page: "memory-spaces/explore",
				seed: text
			};
			return { page: memoryPageForTool(toolName) };
		}
		/** What each tool read or wrote this turn; an item known only by its id is left out. */
		function turnItems(activity) {
			const byTool = /* @__PURE__ */ new Map();
			const add = (toolName, sourceTypeId, operationId, item, key) => {
				const memory = sourceTypeId === "memory-spaces" && item.excerpt !== void 0;
				const text = memory ? item.excerpt : item.title;
				if (text === item.id) return;
				const items = byTool.get(toolName) ?? [];
				if (items.some((existing) => existing.text === text)) return;
				items.push({
					key,
					text,
					...memory ? { place: item.title } : {},
					...itemTarget(toolName, sourceTypeId, operationId, item, text)
				});
				byTool.set(toolName, items);
			};
			for (const read of activity.retrieved ?? []) read.items.forEach((item, index) => add(read.toolName, read.sourceTypeId, read.operationId, item, `${read.callId}:${index}`));
			for (const write of activity.writebacks ?? []) add(write.toolName, write.sourceTypeId, write.operationId, write.item, write.callId);
			return byTool;
		}
		const ITEMS_PER_TOOL = 3;
		/** One-line memory-activity bar under a completed turn; hides when the turn touched no memory. */
		const MnemonTurnTail = (0, react.memo)(function MnemonTurnTail({ turn, seq, sessionId, connection, localeRuntime, t }) {
			const subscribeLocale = (0, react.useCallback)((listener) => localeRuntime.subscribe(listener), [localeRuntime]);
			const getLocale = (0, react.useCallback)(() => localeRuntime.getSnapshot(), [localeRuntime]);
			(0, react.useSyncExternalStore)(subscribeLocale, getLocale, getLocale);
			const [activity, setActivity] = (0, react.useState)(void 0);
			const [open, setOpen] = (0, react.useState)(false);
			const number = turnNumber(turn);
			const closed = isClosedTurn(turn);
			(0, react.useEffect)(() => {
				if (!closed || number === void 0) {
					setActivity(null);
					return;
				}
				let alive = true;
				new MnemonClient(connection, sessionId).turnActivity(number, seq).then((result) => {
					if (alive) setActivity(result);
				}).catch(() => {
					if (alive) setActivity(null);
				});
				return () => {
					alive = false;
				};
			}, [
				connection,
				sessionId,
				number,
				seq,
				closed
			]);
			if (!closed || number === void 0) return null;
			if (activity === void 0 || activity === null) return null;
			const openPage = (page, seed, event) => {
				event.stopPropagation();
				dispatchMnemonAnchor({
					page,
					...seed === void 0 ? {} : { seed },
					...sessionId === void 0 ? {} : { sessionId }
				});
			};
			const items = turnItems(activity);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonTurnTail_module_css_default.root,
				"data-open": open || void 0,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: MnemonTurnTail_module_css_default.bar,
					"aria-expanded": open,
					onClick: () => setOpen((value) => !value),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonTurnTail_module_css_default.mark,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryIcon, { size: 14 })
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonTurnTail_module_css_default.label,
							children: t("turnTail.label")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MnemonTurnTail_module_css_default.metrics,
							children: [
								activity.recalls > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("turnTail.recall", { count: activity.recalls }) }),
								activity.writes > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("turnTail.write", { count: activity.writes }) }),
								activity.documentSearches > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("turnTail.documents", { count: activity.documentSearches }) }),
								activity.inspections > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("turnTail.inspect", { count: activity.inspections }) }),
								activity.failures > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MnemonTurnTail_module_css_default.failureMetric,
									children: t("turnTail.failed", { count: activity.failures })
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutlineRegular, {
							size: 12,
							className: `${MnemonTurnTail_module_css_default.chevron} ${open ? MnemonTurnTail_module_css_default.chevronOpen : ""}`
						})
					]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
					className: MnemonTurnTail_module_css_default.details,
					"aria-label": t("turnTail.toolList"),
					children: turnTools(activity.names).map(({ name, count }) => {
						const label = TOOL_LABELS[name] === void 0 ? name : t(TOOL_LABELS[name]);
						const used = items.get(name) ?? [];
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: MnemonTurnTail_module_css_default.toolRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
								label: name,
								side: "bottom",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: MnemonTurnTail_module_css_default.toolChip,
									"aria-label": t("turnTail.openTool", { tool: label }),
									onClick: (event) => openPage(memoryPageForTool(name), void 0, event),
									children: [label, count > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MnemonTurnTail_module_css_default.toolCount,
										children: ["×", count]
									})]
								})
							}), used.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: MnemonTurnTail_module_css_default.items,
								children: [used.slice(0, ITEMS_PER_TOOL).map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: MnemonTurnTail_module_css_default.item,
									title: item.text,
									onClick: (event) => openPage(item.page, item.seed, event),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MnemonTurnTail_module_css_default.itemText,
										children: item.text
									}), item.place !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MnemonTurnTail_module_css_default.itemPlace,
										children: item.place
									})]
								}, item.key)), used.length > ITEMS_PER_TOOL && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: MnemonTurnTail_module_css_default.itemMore,
									children: t("turnTail.more", { count: used.length - ITEMS_PER_TOOL })
								})]
							})]
						}, name);
					})
				})]
			});
		});
		//#endregion
		//#region src/client/MnemonPluginActions.tsx
		/** The npm package whose page under DSH Plugins carries the Mnemon configuration. */
		const MNEMON_PACKAGE_NAME = "dsh-mnemon";
		/** Head controls on the dsh-mnemon page under Plugins: a way back to the memory workspace. */
		function MnemonPluginActions({ subject, workspace, t }) {
			const open = (0, react.useSyncExternalStore)(workspace.subscribe, workspace.getSnapshot, workspace.getSnapshot);
			if (subject.kind !== "bundle" || subject.pkg.name !== "dsh-mnemon" || !subject.pkg.enabled || open === void 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				variant: "outline",
				size: "sm",
				icon: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryIcon, { size: 13 }),
				onClick: open,
				children: t("plugin.openWorkspace")
			});
		}
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/src/client/MnemonSaveAction.module.css.mjs
		const css$1 = ".ypSjoa_wrap{display:inline-flex;position:relative}.ypSjoa_button{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:28px;justify-content:center;align-items:center;padding:6px;display:inline-flex}.ypSjoa_button:hover,.ypSjoa_button[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}.ypSjoa_button:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}.ypSjoa_icon{flex:none;width:16px;height:16px;display:inline-flex}.ypSjoa_modal{width:min(640px, calc(100vw - max(12px, env(safe-area-inset-left,0px)) - max(12px, env(safe-area-inset-right,0px))));max-height:calc(100vh - 24px)}.ypSjoa_modalContent{overscroll-behavior:contain;-webkit-overflow-scrolling:touch;min-height:0;overflow-y:auto}.ypSjoa_modalAction{min-width:96px}.ypSjoa_status{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px;line-height:20px}.ypSjoa_readOnly{border-radius:var(--dsw-radius-md);background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label);margin-bottom:12px;padding:8px 12px;font-size:12px;line-height:18px}.ypSjoa_candidate{display:block}.ypSjoa_candidateHeading{justify-content:space-between;align-items:center;gap:8px;min-width:0;margin-bottom:6px;display:flex}.ypSjoa_candidateHeading>label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}.ypSjoa_candidate textarea{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);resize:vertical;background:var(--dsw-alias-bg-layer-3);width:100%;min-height:260px;max-height:50vh;color:var(--dsw-alias-label-primary);font:14px/22px var(--dsw-font-family);padding:10px 12px;display:block}.ypSjoa_candidate textarea:focus-visible{border-color:var(--dsw-alias-state-business-primary);outline:none}.ypSjoa_truncated{color:var(--dsw-alias-label-tertiary);margin-top:6px;font-size:12px;line-height:18px;display:block}@media (width<=640px),(height<=560px){.ypSjoa_modal{width:min(100%, calc(100vw - max(8px, env(safe-area-inset-left,0px)) - max(8px, env(safe-area-inset-right,0px))));max-height:calc(100vh - 16px)}.ypSjoa_modal .ypSjoa_modalAction{min-width:0;min-height:44px}.ypSjoa_candidate textarea{min-height:clamp(140px,32vh,220px);max-height:42vh}}@media (pointer:coarse) and (width<=640px),(pointer:coarse) and (height<=560px){.ypSjoa_candidate textarea{font-size:16px}}@supports (height:100dvh){.ypSjoa_modal{max-height:calc(100dvh - 24px)}@media (width<=640px),(height<=560px){.ypSjoa_modal{max-height:calc(100dvh - 16px)}.ypSjoa_candidate textarea{min-height:clamp(140px,32dvh,220px);max-height:42dvh}}}";
		const tagId$1 = "dsh-mnemon/src/client/MnemonSaveAction.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId$1;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$1) tag.textContent = css$1;
		}
		var MnemonSaveAction_module_css_default = {
			"button": "ypSjoa_button",
			"candidate": "ypSjoa_candidate",
			"candidateHeading": "ypSjoa_candidateHeading",
			"icon": "ypSjoa_icon",
			"modal": "ypSjoa_modal",
			"modalAction": "ypSjoa_modalAction",
			"modalContent": "ypSjoa_modalContent",
			"readOnly": "ypSjoa_readOnly",
			"status": "ypSjoa_status",
			"truncated": "ypSjoa_truncated",
			"wrap": "ypSjoa_wrap"
		};
		//#endregion
		//#region src/client/MnemonSaveAction.tsx
		const PREVIEW_LIMIT = 8e3;
		/**
		* Save-to-memory action on finalized assistant messages. A task Agent decides
		* whether the (editable) reply is worth keeping and writes it; the dialog
		* shows the same receipt as Save to memory on the Memory Spaces page.
		*/
		const MnemonSaveAction = (0, react.memo)(function MnemonSaveAction({ messageId, sessionId, connection, settingsScope, localeRuntime, t }) {
			const subscribeLocale = (0, react.useCallback)((listener) => localeRuntime.subscribe(listener), [localeRuntime]);
			const getLocale = (0, react.useCallback)(() => localeRuntime.getSnapshot(), [localeRuntime]);
			(0, react.useSyncExternalStore)(subscribeLocale, getLocale, getLocale);
			const subscribeSettings = (0, react.useCallback)((listener) => settingsScope.subscribe(listener), [settingsScope]);
			const getSettingsSnapshot = (0, react.useCallback)(() => settingsScope.getSnapshot(), [settingsScope]);
			const settingsSnapshot = (0, react.useSyncExternalStore)(subscribeSettings, getSettingsSnapshot, getSettingsSnapshot);
			const managementWritable = settingsSnapshot.status === "ready" && settingsSnapshot.writable;
			const [open, setOpen] = (0, react.useState)(false);
			const [writeEnabled, setWriteEnabled] = (0, react.useState)(void 0);
			const [taskAgent, setTaskAgent] = (0, react.useState)(void 0);
			const [candidate, setCandidate] = (0, react.useState)(void 0);
			const [truncated, setTruncated] = (0, react.useState)(false);
			const [missing, setMissing] = (0, react.useState)(false);
			const [submitting, setSubmitting] = (0, react.useState)(false);
			const [outcome, setOutcome] = (0, react.useState)(null);
			const candidateId = (0, react.useId)();
			const openRef = (0, react.useRef)(false);
			const requestVersionRef = (0, react.useRef)(0);
			const submitActiveRef = (0, react.useRef)(false);
			const setPanelOpen = (next) => {
				requestVersionRef.current += 1;
				openRef.current = next;
				setOpen(next);
			};
			(0, react.useEffect)(() => {
				if (!open) {
					setWriteEnabled(void 0);
					setTaskAgent(void 0);
					setCandidate(void 0);
					setTruncated(false);
					setMissing(false);
					setSubmitting(submitActiveRef.current);
					setOutcome(null);
					return;
				}
				const requestVersion = ++requestVersionRef.current;
				let alive = true;
				setSubmitting(submitActiveRef.current);
				const client = new MnemonClient(connection, sessionId);
				client.status().then((status) => {
					if (!alive || requestVersionRef.current !== requestVersion) return;
					setWriteEnabled(status.writeEnabled && managementWritable);
					setTaskAgent(status.lifecycle?.taskAgentAvailable);
				}).catch(() => {
					if (alive && requestVersionRef.current === requestVersion) setWriteEnabled(false);
				});
				client.assistantMessageText(messageId).then((result) => {
					if (!alive || requestVersionRef.current !== requestVersion) return;
					if (result === null || result.text === "") setMissing(true);
					else {
						setTruncated(result.text.length > PREVIEW_LIMIT);
						setCandidate(result.text.slice(0, PREVIEW_LIMIT));
					}
				}).catch(() => {
					if (alive && requestVersionRef.current === requestVersion) setMissing(true);
				});
				return () => {
					alive = false;
				};
			}, [
				open,
				connection,
				sessionId,
				messageId,
				managementWritable
			]);
			const content = candidate?.trim() ?? "";
			const answered = outcome !== null && outcome.content === content;
			const canSubmit = content !== "" && !submitting && writeEnabled === true && taskAgent !== false && !answered;
			const submit = () => {
				if (!canSubmit || submitActiveRef.current) return;
				const requestVersion = requestVersionRef.current;
				submitActiveRef.current = true;
				setSubmitting(true);
				setOutcome(null);
				new MnemonClient(connection, sessionId).supervise(content, messageId).then((result) => {
					if (openRef.current && requestVersionRef.current === requestVersion) setOutcome({
						content,
						action: result.action,
						summary: result.summary
					});
				}).catch((reason) => {
					if (openRef.current && requestVersionRef.current === requestVersion) setOutcome({
						content,
						error: message(reason)
					});
				}).finally(() => {
					submitActiveRef.current = false;
					if (openRef.current) setSubmitting(false);
				});
			};
			const viewMemory = () => {
				setPanelOpen(false);
				dispatchMnemonAnchor({
					page: "memory-spaces/content",
					...sessionId === void 0 ? {} : { sessionId }
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonSaveAction_module_css_default.wrap,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label: t("saveAction.tooltip"),
					side: "bottom",
					disabled: open,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: MnemonSaveAction_module_css_default.button,
						"aria-label": t("saveAction.button"),
						"aria-haspopup": "dialog",
						"aria-expanded": open,
						onClick: () => setPanelOpen(!openRef.current),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonSaveAction_module_css_default.icon,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryIcon, { size: 16 })
						})
					})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
					open,
					onClose: () => setPanelOpen(false),
					title: t("saveAction.title"),
					closeLabel: t("saveAction.close"),
					description: t("saveAction.hint"),
					className: MnemonSaveAction_module_css_default.modal,
					contentClassName: MnemonSaveAction_module_css_default.modalContent,
					footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						className: MnemonSaveAction_module_css_default.modalAction,
						disabled: submitting,
						onClick: () => setPanelOpen(false),
						children: outcome === null ? t("common.cancel") : t("saveAction.close")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "primary",
						className: MnemonSaveAction_module_css_default.modalAction,
						disabled: !canSubmit,
						onClick: submit,
						children: submitting ? t("saveAction.submitting") : t("saveAction.submit")
					})] }),
					children: [
						writeEnabled === false && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MnemonSaveAction_module_css_default.readOnly,
							role: "status",
							children: t("saveAction.readOnly")
						}),
						candidate === void 0 && !missing && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MnemonSaveAction_module_css_default.status,
							children: t("saveAction.fetching")
						}),
						missing && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MnemonSaveAction_module_css_default.status,
							role: "status",
							children: t("saveAction.missing")
						}),
						candidate !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonSaveAction_module_css_default.candidate,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MnemonSaveAction_module_css_default.candidateHeading,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										htmlFor: candidateId,
										children: t("saveAction.candidate")
									}), writeEnabled === true && taskAgent !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(TaskAgentTag, {
										available: taskAgent,
										t
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									id: candidateId,
									rows: 12,
									value: candidate,
									onChange: (event) => setCandidate(event.target.value),
									autoFocus: true
								}),
								truncated && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
									className: MnemonSaveAction_module_css_default.truncated,
									children: t("saveAction.truncated", { limit: PREVIEW_LIMIT })
								})
							]
						}),
						outcome !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WriteReceipt, {
							t,
							action: outcome.action,
							summary: outcome.summary,
							error: outcome.error,
							onView: viewMemory
						})
					]
				})]
			});
		});
		//#endregion
		//#region src/client/action-seat.ts
		/**
		* One action a surface offers while its owner can perform it, such as opening
		* the dsh-mnemon page under DSH Plugins while that page provides navigation.
		* Readers render the control only while an action is present.
		*/
		var MnemonActionSeat = class {
			action;
			listeners = /* @__PURE__ */ new Set();
			getSnapshot = () => this.action;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			/** Offer the action until the returned disposer runs; a newer offer replaces it. */
			provide(action) {
				this.action = action;
				this.emit();
				return () => {
					if (this.action !== action) return;
					this.action = void 0;
					this.emit();
				};
			}
			emit() {
				for (const listener of [...this.listeners]) listener();
			}
		};
		//#endregion
		//#region src/client/change-signal.ts
		/**
		* A revision other surfaces bump when something they cannot observe directly
		* changed, such as a component switched on DSH's Plugins page. Readers reload
		* their own data when the revision moves.
		*/
		var MnemonChangeSignal = class {
			settleMs;
			revision = 0;
			pending;
			listeners = /* @__PURE__ */ new Set();
			constructor(settleMs = 100) {
				this.settleMs = settleMs;
			}
			getSnapshot = () => this.revision;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			/** A burst of announcements, such as one per component a write switched, moves the revision once. */
			bump = () => {
				if (this.pending !== void 0) return;
				this.pending = setTimeout(() => {
					this.pending = void 0;
					this.revision += 1;
					for (const listener of [...this.listeners]) listener();
				}, this.settleMs);
			};
		};
		//#endregion
		//#region src/client/settings.ts
		var MnemonSettingsScope = class {
			connection;
			namespace;
			requestTimeoutMs;
			snapshot = {
				status: "loading",
				writable: false,
				mode: "host"
			};
			listeners = /* @__PURE__ */ new Set();
			tail = Promise.resolve();
			constructor(connection, namespace = MNEMON_SETTINGS_NAMESPACE, requestTimeoutMs = 12e3) {
				this.connection = connection;
				this.namespace = namespace;
				this.requestTimeoutMs = requestTimeoutMs;
				this.load();
			}
			getSnapshot = () => this.snapshot;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => this.listeners.delete(listener);
			};
			/** Queue one revision-fenced Host write of these operations. */
			mutate(ops) {
				return this.write(ops);
			}
			/**
			* Re-read the Host snapshot after a change made elsewhere. Queued behind
			* writes so an older read never replaces a newer answer; a failed read
			* keeps the current snapshot.
			*/
			refresh() {
				const task = this.tail.then(async () => {
					try {
						const response = await this.call("get", { namespace: this.namespace });
						if (response.ok) this.publish(response.value);
					} catch {}
				});
				this.tail = task;
				return task;
			}
			async load() {
				try {
					const response = await this.call("get", { namespace: this.namespace });
					if (!response.ok) {
						this.publish({
							status: "unavailable",
							writable: false,
							mode: "host"
						});
						return;
					}
					this.publish(response.value);
				} catch {
					this.publish({
						status: "unavailable",
						writable: false,
						mode: "host"
					});
				}
			}
			write(ops) {
				const task = this.tail.then(async () => {
					const response = await this.call("mutate", {
						namespace: this.namespace,
						ops,
						...this.snapshot.revision === void 0 ? {} : { expectedRevision: this.snapshot.revision }
					});
					if (!response.ok) {
						await this.load();
						throw new Error(response.error.message);
					}
					this.publish(response.value);
				});
				this.tail = task.catch(() => {});
				return task;
			}
			async call(endpoint, payload) {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), Math.max(1, this.requestTimeoutMs));
				try {
					return await callMnemonRpc(this.connection, MNEMON_SETTINGS_CHANNEL, endpoint, payload, controller.signal);
				} catch (error) {
					if (controller.signal.aborted) throw new Error("Mnemon settings request timed out");
					throw error;
				} finally {
					clearTimeout(timeout);
				}
			}
			publish(snapshot) {
				this.snapshot = snapshot;
				for (const listener of this.listeners) try {
					listener();
				} catch (error) {
					console.warn("dsh-mnemon: settings listener failed; keeping the published Host snapshot", error);
				}
			}
		};
		//#endregion
		//#region src/client/source-pages.tsx
		const MNEMON_SOURCE_PAGE_SLOT = "mnemon.source.page";
		/** Conventional operations used by Mnemon's descriptor-driven Source page. */
		const MNEMON_SOURCE_CONFIGURATION_READ = "configuration";
		const MNEMON_SOURCE_CONFIGURATION_MUTATE = "configuration";
		const SOURCE_TYPE_ID = /^[a-z][a-z0-9-]{0,127}$/u;
		const PAGE_ID = /^[a-z][a-z0-9-]{0,127}$/u;
		function memorySourcePageEntryId(sourceTypeId, pageId) {
			if (!SOURCE_TYPE_ID.test(sourceTypeId)) throw new Error("memory Source UI sourceTypeId must match [a-z][a-z0-9-]{0,127}");
			if (!PAGE_ID.test(pageId)) throw new Error("memory Source UI page id must match [a-z][a-z0-9-]{0,127}");
			return `${sourceTypeId}/${pageId}`;
		}
		/**
		* Thin Client-Fiber adapter over the DSH child Slot. It creates no service or
		* registry: `slots.inject/register` own declaration waiting and disposal.
		*/
		function installMemorySourceUI(ctx, contribution) {
			if (contribution.pages.length === 0) throw new Error("memory Source UI requires at least one page");
			const seen = /* @__PURE__ */ new Set();
			const pages = contribution.pages.map((page, index) => {
				const entryId = memorySourcePageEntryId(contribution.sourceTypeId, page.id);
				if (seen.has(entryId)) throw new Error(`memory Source UI page is duplicated: ${entryId}`);
				seen.add(entryId);
				return {
					page,
					entryId,
					order: page.order ?? 1e3 + index
				};
			});
			return ctx.slots.inject(MNEMON_SOURCE_PAGE_SLOT, () => {
				const disposers = [];
				try {
					for (const { page, entryId, order } of pages) disposers.push(ctx.slots.register({
						name: MNEMON_SOURCE_PAGE_SLOT,
						id: entryId,
						order,
						label: page.label
					}, Object.assign((props) => (0, react.createElement)(page.component, props), { mnemonNavigation: page.navigation })));
				} catch (error) {
					for (const dispose of disposers.reverse()) dispose();
					throw error;
				}
				return () => {
					for (const dispose of disposers.reverse()) dispose();
				};
			});
		}
		/** Stable uSES directory over the Slot ledger; no parallel page registry. */
		function createMemorySourcePageDirectory(ctx) {
			let version = -1;
			let localeSnapshot;
			let snapshot = Object.freeze([]);
			const read = () => {
				const currentVersion = ctx.slots.getVersion(MNEMON_SOURCE_PAGE_SLOT);
				const currentLocale = ctx.locale.getSnapshot();
				if (currentVersion === version && currentLocale === localeSnapshot) return snapshot;
				version = currentVersion;
				localeSnapshot = currentLocale;
				snapshot = Object.freeze(ctx.slots.entriesOfSlot(MNEMON_SOURCE_PAGE_SLOT).flatMap((entry) => {
					const id = entry.options.id;
					if (id === void 0) return [];
					const separator = id.indexOf("/");
					if (separator <= 0 || separator === id.length - 1) return [];
					let label;
					try {
						label = typeof entry.options.label === "function" ? entry.options.label() : entry.options.label;
					} catch {}
					const metadata = entry.component?.mnemonNavigation;
					let navigation;
					if (metadata !== void 0) {
						let detail;
						try {
							detail = typeof metadata.detail === "function" ? metadata.detail() : metadata.detail;
						} catch {}
						navigation = {
							...metadata,
							...detail === void 0 ? { detail: void 0 } : { detail }
						};
					}
					return [{
						id,
						sourceTypeId: id.slice(0, separator),
						pageId: id.slice(separator + 1),
						label: label?.trim() || id.slice(separator + 1),
						order: entry.options.order ?? 0,
						...navigation === void 0 ? {} : { navigation }
					}];
				}).sort((left, right) => left.order - right.order || left.id.localeCompare(right.id)));
				return snapshot;
			};
			return {
				getSnapshot: read,
				subscribe(listener) {
					const changed = () => {
						read();
						listener();
					};
					const stopSlots = ctx.slots.subscribe(MNEMON_SOURCE_PAGE_SLOT, changed);
					const stopLocale = ctx.locale.subscribe(changed);
					return () => {
						stopLocale();
						stopSlots();
					};
				}
			};
		}
		//#endregion
		//#region src/client/better-sidebar-seat.ts
		/**
		* Carries only Better Sidebar's DOM seat and scope into the DSH-owned renderer
		* tree. Source child Slots never cross this boundary: the shell entry renders
		* them itself and portals the resulting workspace into the supplied seat.
		*/
		var MnemonBetterSidebarSeat = class {
			placement;
			owner;
			listeners = /* @__PURE__ */ new Set();
			getSnapshot = () => this.placement;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			attach(target, scope, visible) {
				const owner = Symbol("better-sidebar-seat");
				this.owner = owner;
				this.placement = {
					target,
					scope,
					visible
				};
				this.emit();
				return () => {
					if (this.owner !== owner) return;
					this.owner = void 0;
					this.placement = void 0;
					this.emit();
				};
			}
			emit() {
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region src/client/VersionDialog.tsx
		function versionModeLabel(t, mode, cli = false) {
			if (mode === "homebrew") return t("versions.modeHomebrew");
			if (mode === "go") return t("versions.modeGo");
			if (mode === "npm") return t(cli ? "versions.modeNpmCli" : "versions.modeNpm");
			if (mode === "link") return t("versions.modeLink");
			if (mode === "missing") return t("versions.modeMissing");
			return t("versions.modeManual");
		}
		function versionHint(t, component) {
			if (component.updateHint === "npm") return t("versions.hintNpm");
			if (component.updateHint === "npm-missing") return t("versions.hintNpmMissing");
			if (component.updateHint === "npm-unmanaged") return t("versions.hintNpmUnmanaged");
			if (component.updateHint === "cli-unreadable") return t("versions.hintUnreadable");
			if (component.updateHint === "starter") return t("versions.hintStarter");
			if (component.updateHint === "brew") return t("versions.hintHomebrew");
			if (component.updateHint === "brew-missing") return t("versions.hintBrewMissing");
			if (component.updateHint === "go") return t("versions.hintGo");
			if (component.updateHint === "pnpm") return t("versions.hintPnpm");
			if (component.updateHint === "pnpm-missing") return t("versions.hintPnpmMissing");
			if (component.updateHint === "link") return t("versions.hintLink");
			if (component.updateHint === "install") return t("versions.hintInstall");
			return t("versions.hintManual");
		}
		function versionState(component) {
			if (component.installMode === "missing") return "missing";
			if (component.restartRequired) return "restart";
			if (component.current === void 0 || component.latest === void 0 || component.checkError !== void 0) return "unknown";
			if (component.outdated) return "available";
			return component.current.replace(/^v/, "") === component.latest.replace(/^v/, "") ? "current" : "local";
		}
		function CommandSnippet({ command }) {
			const t = useT();
			const [copied, setCopied] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(false);
			const copy = async () => {
				const accepted = await (0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(command);
				setCopied(accepted);
				setFailed(!accepted);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonView_module_css_default.versionCommand,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: command }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: MnemonView_module_css_default.ghostButton,
						"aria-label": t("versions.copyCommand", { command }),
						onClick: () => void copy(),
						children: t(copied ? "versions.copied" : "versions.copy")
					}),
					failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
						role: "status",
						children: t("versions.copyFailed")
					})
				]
			});
		}
		function NpmGuidance({ component }) {
			const t = useT();
			const missing = component.installMode === "missing";
			const npm = component.installMode === "npm";
			const managed = npm && component.updateHint === "npm";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MnemonView_module_css_default.versionGuidance,
				"aria-label": t("versions.npmRecommended"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(managed ? "versions.npmMaintenance" : npm ? "versions.npmRepair" : missing ? "versions.npmInstall" : "versions.npmMigrate") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t(managed ? "versions.npmUpdateDetail" : npm ? "versions.npmRepairDetail" : missing ? "versions.npmInstallDetail" : "versions.npmMigrateDetail") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CommandSnippet, { command: managed ? "mnemon update" : "npm install --global @mnemon-dev/mnemon@latest" }),
					!managed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						className: MnemonView_module_css_default.versionGuidanceDetails,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("versions.npmNextSteps") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("versions.npmVerify") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CommandSnippet, { command: "mnemon --version" }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("versions.npmPath") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								href: "https://github.com/mnemon-dev/mnemon#install",
								target: "_blank",
								rel: "noreferrer",
								children: t("versions.installGuide")
							})
						]
					})
				]
			});
		}
		function dshInstallLabel(t, component) {
			if (component.installMode === "npm") return t("versions.profileLocation", { name: component.installProfile ?? "—" });
			if (component.installMode === "link") return component.installProfile === void 0 ? t("versions.sourceLocation") : t("versions.linkSourceLocation", { name: component.installProfile });
			return t("versions.packageLocation");
		}
		function VersionDialog(props) {
			const t = useT();
			const [snapshot, setSnapshot] = (0, react.useState)(null);
			const [checking, setChecking] = (0, react.useState)(true);
			const [updating, setUpdating] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [result, setResult] = (0, react.useState)(null);
			const [packagesOpen, setPackagesOpen] = (0, react.useState)(false);
			const updateInFlight = (0, react.useRef)(false);
			const checkRequestRef = (0, react.useRef)(0);
			const checkTimeoutRef = (0, react.useRef)(null);
			const check = (0, react.useCallback)(async () => {
				const requestVersion = ++checkRequestRef.current;
				setChecking(true);
				setError(null);
				let timeout;
				try {
					const deadline = new Promise((_resolve, reject) => {
						timeout = setTimeout(() => reject(new Error(t("versions.timeout"))), 15e3);
						checkTimeoutRef.current = timeout;
					});
					const next = await Promise.race([props.client.versions(), deadline]);
					if (checkRequestRef.current === requestVersion) setSnapshot(next);
				} catch (reason) {
					if (checkRequestRef.current === requestVersion) setError(message(reason));
				} finally {
					if (timeout !== void 0) clearTimeout(timeout);
					if (checkTimeoutRef.current === timeout) checkTimeoutRef.current = null;
					if (checkRequestRef.current === requestVersion) setChecking(false);
				}
			}, [props.client, t]);
			(0, react.useEffect)(() => {
				check();
				return () => {
					checkRequestRef.current += 1;
					if (checkTimeoutRef.current !== null) clearTimeout(checkTimeoutRef.current);
					checkTimeoutRef.current = null;
				};
			}, [check]);
			const update = async (component) => {
				if (updateInFlight.current || !props.writeEnabled) return;
				updateInFlight.current = true;
				setUpdating(component.id);
				setError(null);
				setResult(null);
				try {
					const next = await props.client.updateVersion(component.id);
					setResult(next);
					await check();
					props.onRefreshStatus();
				} catch (reason) {
					setError(message(reason));
				} finally {
					setUpdating(null);
					updateInFlight.current = false;
				}
			};
			const updatingBusy = updating !== null;
			const controlsBusy = checking || updatingBusy;
			const updateButton = (component) => props.writeEnabled && component.outdated && component.updateSupported && component.checkError === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: MnemonView_module_css_default.primaryButton,
				disabled: controlsBusy,
				onClick: () => void update(component),
				children: updating === component.id ? t("versions.updating") : t("versions.update")
			}) : null;
			const renderPackage = (component) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: MnemonView_module_css_default.versionPackage,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.versionPackageHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: component.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", {
							"data-state": versionState(component),
							children: t(`versions.${versionState(component)}`)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.versionPackageMeta,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: versionModeLabel(t, component.installMode) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(component.managedBy === "starter" ? "versions.managedStarter" : "versions.managedProfile") })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.versionPackageNumbers,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								t("versions.installed"),
								" ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: component.current ?? "—" })
							] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								t("versions.latest"),
								" ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: component.latest ?? "—" })
							] }),
							component.expectedVersion !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								t("versions.starterVersion"),
								" ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: component.expectedVersion })
							] })
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.versionPackageAction,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [versionHint(t, component), component.checkError !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [" ", t("versions.latestUnavailable")] })] }), updateButton(component)]
					})
				]
			}, component.id);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SidebarModal, {
				title: t("versions.title"),
				description: t("versions.description"),
				busy: updatingBusy,
				contentReady: !checking,
				onClose: props.onClose,
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: MnemonView_module_css_default.modalFooterMeta,
					children: snapshot === null ? "" : t("versions.checkedAt", { time: new Date(snapshot.checkedAt).toLocaleTimeString() })
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonView_module_css_default.modalFooterActions,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"data-autofocus": true,
						className: MnemonView_module_css_default.secondaryButton,
						disabled: controlsBusy,
						onClick: () => void check(),
						children: checking ? t("versions.checkingShort") : t("versions.recheck")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"data-dialog-close": true,
						className: MnemonView_module_css_default.secondaryButton,
						disabled: updatingBusy,
						onClick: props.onClose,
						children: t("common.close")
					})]
				})] }),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: MnemonView_module_css_default.versionDialogBody,
					children: [
						checking && snapshot === null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonView_module_css_default.versionChecking,
							role: "status",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}), t("versions.checking")]
						}),
						error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonView_module_css_default.versionError,
							role: "alert",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("versions.failed") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: error })]
						}),
						!props.writeEnabled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: MnemonView_module_css_default.versionNotice,
							children: t("versions.readOnly")
						}),
						result !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: MnemonView_module_css_default.versionResult,
							role: "status",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: result.updated ? t("versions.updated", { name: result.component === "mnemon" ? "Mnemon CLI" : result.component }) : t("versions.alreadyCurrent") }), result.restartRequired && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("versions.restartRequired") })]
						}),
						snapshot !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MnemonView_module_css_default.versionList,
							children: snapshot.components.map((component) => {
								const state = versionState(component);
								const packages = component.packages ?? [];
								const outdated = packages.filter((item) => item.outdated).length;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
									"data-outdated": component.outdated || void 0,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: component.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: versionModeLabel(t, component.installMode, component.id === "mnemon") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", {
											"data-state": state,
											children: t(`versions.${state}`)
										})] }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MnemonView_module_css_default.versionNumbers,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("versions.installed") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: component.current ?? "—" })] }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "→" }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("versions.latest") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: component.latest ?? "—" })] })
											]
										}),
										component.id === "mnemon" && component.executablePath !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", {
											className: MnemonView_module_css_default.versionLocation,
											title: component.executablePath,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("versions.executable") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: component.executablePath })]
										}),
										component.id === "dsh-mnemon" && component.installPath !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", {
											className: MnemonView_module_css_default.versionLocation,
											title: component.installPath,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: dshInstallLabel(t, component) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: component.installPath })]
										}),
										component.restartRequired && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: MnemonView_module_css_default.versionNotice,
											role: "status",
											children: t("versions.restartRequired")
										}),
										component.checkError !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: MnemonView_module_css_default.versionNotice,
											children: t("versions.latestUnavailable")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: versionHint(t, component) }), updateButton(component)] }),
										component.id === "mnemon" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NpmGuidance, { component }),
										component.id === "dsh-mnemon" && packages.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: MnemonView_module_css_default.versionPackages,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: MnemonView_module_css_default.versionPackagesToggle,
												"aria-expanded": packagesOpen,
												"aria-controls": "mnemon-version-packages",
												onClick: () => setPackagesOpen((open) => !open),
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														"aria-hidden": "true",
														children: packagesOpen ? "▾" : "▸"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("versions.packages", { count: packages.length }) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: outdated > 0 ? t("versions.packagesOutdated", { count: outdated }) : t(packagesOpen ? "versions.packagesHide" : "versions.packagesDetail") })
												]
											}), packagesOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												id: "mnemon-version-packages",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
													className: MnemonView_module_css_default.versionNotice,
													children: t("versions.packagesHint")
												}), [
													"source",
													"strategy",
													"provider"
												].map((kind) => {
													const members = packages.filter((item) => item.kind === kind);
													return members.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
														"aria-label": t(`versions.kind.${kind}`),
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: t(`versions.kind.${kind}`) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: members.map(renderPackage) })]
													}, kind);
												})]
											})]
										})
									]
								}, component.id);
							})
						})
					]
				})
			});
		}
		//#endregion
		//#region src/client/composition-notice.ts
		/** The Host's first diagnostic, in the user's words where it is one the Host is known to give. */
		function reason(system, t) {
			for (const diagnostic of system.evaluation.diagnostics) {
				if (diagnostic.code === "missing-strategy") return t("status.reasonNoStrategy");
				if (diagnostic.code === "missing-source") return t("status.reasonNoSource");
				if (diagnostic.code === "not-composed") return t("status.reasonNotComposed");
				if (diagnostic.code !== "composition-rejected") continue;
				if (/selected memory Strategy (?:type|instance) is unavailable/u.test(diagnostic.message)) return t("status.reasonSelectedStrategyOff");
				const dependency = /dependency unavailable: (\S+) requires (\S+)/u.exec(diagnostic.message);
				if (dependency !== null) return t("status.reasonDependency", {
					component: dependency[1],
					requirement: dependency[2]
				});
				if (/(?:capability|slot) conflict/u.test(diagnostic.message)) return t("status.reasonConflict");
				return t("status.reasonRejected", { detail: diagnostic.message });
			}
			return "";
		}
		function compositionNotice(system, t) {
			if (system === void 0) return void 0;
			const cause = reason(system, t);
			const detail = (...sentences) => sentences.filter((sentence) => sentence !== "").join(t("config.sentenceGap"));
			if (!system.serving) return {
				tone: "error",
				title: t("status.memoryOff"),
				detail: detail(cause, t("status.memoryOffDetail"))
			};
			if (system.evaluation.state !== "ready") return {
				tone: "warn",
				title: t("status.compositionStale"),
				detail: detail(cause, t("status.compositionStaleDetail"))
			};
			if (system.evaluation.diagnostics.some((diagnostic) => diagnostic.code === "strategy-fallback")) return {
				tone: "warn",
				title: t("status.strategyFallback"),
				detail: t("status.strategyFallbackDetail")
			};
		}
		//#endregion
		//#region src/client/MnemonWorkbench.tsx
		const NO_ACTION_SEAT = {
			subscribe: () => () => {},
			getSnapshot: () => void 0
		};
		const NO_CHANGE_SIGNAL = {
			subscribe: () => () => {},
			getSnapshot: () => 0
		};
		const EMPTY_SOURCE_PAGE_SNAPSHOT = Object.freeze([]);
		const EMPTY_SOURCE_MANAGEMENT_FIELDS = [];
		const EMPTY_SOURCE_PAGE_DIRECTORY = {
			getSnapshot: () => EMPTY_SOURCE_PAGE_SNAPSHOT,
			subscribe: () => () => {}
		};
		function sourcePage(entryId) {
			return `source:${entryId}`;
		}
		function sourcePageEntryId(page) {
			return page.startsWith("source:") ? page.slice(7) : void 0;
		}
		function managedSourcePage(sourceTypeId) {
			return `source-management:${sourceTypeId}`;
		}
		function managedSourceTypeId(page) {
			return page.startsWith("source-management:") ? page.slice(18) : void 0;
		}
		function stoppedSourcePage(sourceTypeId) {
			return `source-stopped:${sourceTypeId}`;
		}
		function stoppedSourceTypeId(page) {
			return page.startsWith("source-stopped:") ? page.slice(15) : void 0;
		}
		/**
		* How memory is composed now, beside the connection in the header: the main
		* Strategy composing it, and on hover each layer's state. Selecting it opens
		* the configuration where that composition is changed.
		*/
		function CompositionStatus(props) {
			const t = useT();
			const summaryId = (0, react.useId)();
			const layerDot = (state) => state === "on" ? "done" : state === "stopped" ? "warning" : "idle";
			const layerNote = (state) => state === "on" ? void 0 : t(state === "off" ? "layers.disabledBadge" : state === "stopped" ? "layers.stoppedBadge" : "layers.memoryOffBadge");
			const anchor = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: MnemonView_module_css_default.compositionStatus,
				onClick: props.onOpen,
				disabled: props.onOpen === void 0,
				"aria-label": props.strategy === void 0 ? props.label : `${props.label} · ${props.strategy}`,
				...props.layers.length === 0 ? {} : { "aria-describedby": summaryId },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: props.tone }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: props.label }),
					props.strategy !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: MnemonView_module_css_default.compositionStrategy,
						children: props.strategy
					})
				]
			});
			if (props.layers.length === 0) return anchor;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
				className: MnemonView_module_css_default.compositionStatusWrap,
				children: [anchor, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					id: summaryId,
					className: MnemonView_module_css_default.compositionSummary,
					role: "tooltip",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("board.title") }),
						props.strategy !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: MnemonFeedback_module_css_default.chip,
							"data-state": props.tone === "done" ? "done" : "warning",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: props.tone === "done" ? "done" : "warning" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: MnemonFeedback_module_css_default.chipLabel,
								children: props.strategy
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonView_module_css_default.compositionLayers,
							children: props.layers.map((layer) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: MnemonFeedback_module_css_default.chip,
								"data-state": layerDot(layer.state),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: layerDot(layer.state) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MnemonFeedback_module_css_default.chipLabel,
										children: layer.label
									}),
									layerNote(layer.state) !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MnemonFeedback_module_css_default.chipNote,
										children: layerNote(layer.state)
									})
								]
							}, layer.id))
						}),
						props.onOpen !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonView_module_css_default.compositionHint,
							children: t("header.compositionHint")
						})
					]
				})]
			});
		}
		function bindSourceManagementClient(client, instance, taskClient) {
			return {
				sourceInstanceKey: instance.sourceInstanceKey,
				revision: instance.revision,
				...instance.assistance === void 0 || instance.assistance.length === 0 ? {} : { assistance: {
					operations: instance.assistance,
					execute: (operation, input, options) => {
						return ([
							"agent-search",
							"supervise",
							"body-create",
							"body-metadata-maintain"
						].includes(operation) ? taskClient : client).assistSource(instance.sourceInstanceKey, operation, input, options.expectedRevision, options.confirmed);
					}
				} },
				read: (operation, input = null) => client.readSourceManagement(instance.sourceInstanceKey, operation, input),
				mutate: (operation, input, options) => client.mutateSourceManagement(instance.sourceInstanceKey, operation, input, options.expectedRevision ?? instance.revision, options.confirmed)
			};
		}
		function jsonRecord(value) {
			return isRecord(value) ? value : void 0;
		}
		function SourceDisabledPage(props) {
			const t = useT();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonView_module_css_default.page,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageHeader, {
					title: props.title,
					description: t("layers.disabledDescription"),
					meta: t("layers.disabledBadge"),
					...props.onOpenConfiguration === void 0 ? {} : { action: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: MnemonView_module_css_default.secondaryButton,
						onClick: props.onOpenConfiguration,
						children: t("common.openConfiguration")
					}) }
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EmptyState, {
					glyph: "⊘",
					title: t("layers.disabledTitle", { layer: props.title }),
					children: t("layers.disabledText")
				})]
			});
		}
		/** A layer that is on but whose Source is not running: its component did not start, or no memory is composed at all. */
		function SourceStoppedPage(props) {
			const t = useT();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonView_module_css_default.page,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageHeader, {
					title: props.title,
					description: t(props.memoryOff ? "layers.memoryOffDescription" : "layers.stoppedDescription"),
					meta: t(props.memoryOff ? "layers.memoryOffBadge" : "layers.stoppedBadge"),
					...props.onOpenConfiguration === void 0 ? {} : { action: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: MnemonView_module_css_default.secondaryButton,
						onClick: props.onOpenConfiguration,
						children: t("common.openConfiguration")
					}) }
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EmptyState, {
					glyph: "⊘",
					title: t(props.memoryOff ? "layers.memoryOffTitle" : "layers.stoppedTitle", { layer: props.title }),
					children: t(props.memoryOff ? "layers.memoryOffText" : "layers.stoppedText")
				})]
			});
		}
		function WorkspaceNavigation(props) {
			const t = useT();
			const entries = [{
				id: "status",
				page: "status",
				label: t("nav.status"),
				detail: "",
				group: "system",
				glyph: "⌘",
				primary: true
			}, ...props.sourcePages];
			const selectedType = sourcePageEntryId(props.page)?.split("/")[0];
			const button = (item) => {
				const active = props.page === item.page || selectedType !== void 0 && selectedType === item.sourceTypeId;
				const badge = item.sourceTypeId !== void 0 && props.disabledTypes.has(item.sourceTypeId) ? t("layers.disabledBadge") : item.stopped === true ? t(props.memoryOff ? "layers.memoryOffBadge" : "layers.stoppedBadge") : void 0;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "tab",
					"aria-selected": active,
					"data-active": active ? "" : void 0,
					"aria-label": badge === void 0 ? void 0 : item.label + " · " + badge,
					"data-layer-disabled": badge === void 0 ? void 0 : "",
					onClick: () => props.onSelect(item.page),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: item.label }), badge !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", {
						className: MnemonView_module_css_default.layerDisabledBadge,
						children: badge
					})]
				}, item.id);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: appearanceClass(MnemonView_module_css_default.topNavigation, MnemonSidebarView_module_css_default.topNavigation),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: appearanceClass(MnemonView_module_css_default.nav, MnemonSidebarView_module_css_default.nav),
					role: "tablist",
					"aria-label": t("nav.aria"),
					children: entries.filter((entry) => entry.primary).map(button)
				})
			});
		}
		/** Fixed descriptor-driven baseline; custom Source pages can only add to it. */
		function SourceManagementPage(props) {
			const t = useT();
			const fields = props.instance.management.fields ?? EMPTY_SOURCE_MANAGEMENT_FIELDS;
			const [draft, setDraft] = (0, react.useState)({});
			const [loading, setLoading] = (0, react.useState)(false);
			const [saving, setSaving] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [saved, setSaved] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let active = true;
				setDraft({});
				setError(null);
				setSaved(false);
				if (fields.length === 0 || props.management === void 0) {
					setLoading(false);
					return () => {
						active = false;
					};
				}
				setLoading(true);
				props.management.read(MNEMON_SOURCE_CONFIGURATION_READ).then((result) => {
					if (!active) return;
					const values = jsonRecord(jsonRecord(result.value)?.values ?? result.value) ?? {};
					setDraft(Object.fromEntries(fields.flatMap((field) => {
						if (field.secret === true || field.input === "secret") return [];
						const value = values[field.key];
						return value === void 0 ? [] : [[field.key, value]];
					})));
				}).catch((reason) => {
					if (active) setError(message(reason));
				}).finally(() => {
					if (active) setLoading(false);
				});
				return () => {
					active = false;
				};
			}, [
				fields,
				props.instance.revision,
				props.instance.sourceInstanceKey,
				props.management
			]);
			const submit = async (event) => {
				event.preventDefault();
				if (props.management === void 0) return;
				setSaving(true);
				setSaved(false);
				setError(null);
				try {
					const input = Object.fromEntries(fields.flatMap((field) => {
						const value = draft[field.key];
						if ((field.secret === true || field.input === "secret") && (value === void 0 || value === "")) return [];
						if (field.input === "number" && value !== void 0 && value !== "") return [[field.key, Number(value)]];
						if (field.input === "boolean") return [[field.key, value === true]];
						return value === void 0 || value === "" ? [] : [[field.key, value]];
					}));
					await props.management.mutate(MNEMON_SOURCE_CONFIGURATION_MUTATE, input, { confirmed: true });
					setSaved(true);
					props.onMutate();
				} catch (reason) {
					setError(message(reason));
				} finally {
					setSaving(false);
				}
			};
			const availability = t(`sourcePage.availability.${props.instance.availability}`);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonView_module_css_default.page,
				"data-source-management": props.instance.sourceTypeId,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageHeader, {
						title: props.instance.management.label,
						description: props.instance.management.description,
						meta: props.instance.sourceTypeId,
						...loading ? { loadingLabel: t("sourcePage.configLoading") } : {}
					}),
					props.instances.length > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
						inline: true,
						size: "sm",
						className: MnemonView_module_css_default.workspacePicker,
						label: t("sourcePage.instance"),
						ariaLabel: t("sourcePage.instanceAria"),
						value: props.instance.sourceInstanceKey,
						options: props.instances.map((instance) => ({
							value: instance.sourceInstanceKey,
							label: instance.management.label,
							detail: instance.sourceInstanceKey
						})),
						onChange: props.onSelect
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: MnemonView_module_css_default.sourceManagementSummary,
						"data-availability": props.instance.availability,
						"aria-label": t("sourcePage.summaryAria"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MnemonView_module_css_default.sourceManagementIdentity,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { "aria-hidden": "true" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("sourcePage.package") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.instance.packageName }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: props.instance.sourceInstanceKey })
								] })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("sourcePage.availability") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: availability })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("sourcePage.role") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: props.instance.role })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("sourcePage.revision") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: short(props.instance.revision, 32) }) })] })
							] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: MnemonView_module_css_default.sourceManagementCapabilities,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("sourcePage.permissions") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: props.instance.capabilities.map((capability) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: capability }, capability)) })]
							})
						]
					}),
					props.instance.management.diagnostics !== void 0 && props.instance.management.diagnostics.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: MnemonView_module_css_default.sourceManagementDiagnostics,
						"aria-label": t("sourcePage.diagnostics"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("sourcePage.diagnostics") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: props.instance.management.diagnostics.map((diagnostic, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: diagnostic }, `${index}:${diagnostic}`)) })]
					}),
					fields.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
						className: MnemonView_module_css_default.sourceManagementForm,
						onSubmit: (event) => void submit(event),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("sourcePage.configuration") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("sourcePage.configurationDescription") })] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MnemonView_module_css_default.formGrid,
								children: fields.map((field) => {
									const value = draft[field.key];
									const update = (next) => setDraft((current) => ({
										...current,
										[field.key]: next
									}));
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
										field.label,
										field.input === "boolean" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: value === true,
											onChange: (event) => update(event.target.checked)
										}) : field.input === "select" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
											hideLabel: true,
											label: field.label,
											value: typeof value === "string" ? value : "",
											options: [{
												value: "",
												label: "—"
											}, ...(field.options ?? []).map((option) => ({
												value: option.value,
												label: option.label
											}))],
											onChange: update
										}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: field.input === "secret" ? "password" : field.input === "number" ? "number" : field.input === "url" ? "url" : "text",
											value: typeof value === "string" || typeof value === "number" ? value : "",
											required: field.required && field.input !== "secret",
											autoComplete: field.input === "secret" ? "new-password" : void 0,
											placeholder: field.input === "secret" ? t("sourcePage.secretPlaceholder") : void 0,
											onChange: (event) => update(event.target.value)
										}),
										field.description !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: field.description })
									] }, field.key);
								})
							}),
							error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MnemonView_module_css_default.alert,
								role: "alert",
								children: error
							}),
							saved && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: MnemonView_module_css_default.runtimeNotice,
								role: "status",
								children: t("sourcePage.configSaved")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "submit",
								className: MnemonView_module_css_default.primaryButton,
								disabled: saving || loading || props.management === void 0 || props.instance.availability === "unavailable",
								children: saving ? t("sourcePage.configSaving") : t("sourcePage.configSave")
							}), props.management === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("sourcePage.unavailable") })] })
						]
					}),
					fields.length === 0 && props.instance.availability === "unavailable" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.emptyState,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonView_module_css_default.emptyGlyph,
							children: "!"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("sourcePage.unavailable") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("sourcePage.unavailableDescription") })] })]
					})
				]
			});
		}
		function StatusPage(props) {
			const t = useT();
			const [versionsOpen, setVersionsOpen] = (0, react.useState)(false);
			const status = props.status;
			const reviewError = status?.lifecycle?.current?.lastError;
			const storage = status?.storage;
			const selectedScopeKind = storage?.activeKind ?? "global";
			const selectedScope = storage?.scopes.find((scope) => scope.kind === selectedScopeKind);
			const idle = (state) => state === "on" ? void 0 : state === "off" ? {
				title: t("layers.disabledBadge"),
				detail: t("status.layerOffDetail")
			} : state === "memory-off" ? {
				title: t("layers.memoryOffBadge"),
				detail: t("status.layerMemoryOffDetail")
			} : {
				title: t("layers.stoppedBadge"),
				detail: t("status.layerStoppedDetail")
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonView_module_css_default.page,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(PageHeader, {
						title: t("status.title"),
						description: t("status.description"),
						meta: status === null && props.loading ? t("common.loading") : status === null || reviewError !== void 0 || props.attention ? t("status.checkRequired") : t("status.nominal"),
						...props.loading ? { loadingLabel: t("status.rechecking") } : {},
						action: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: MnemonView_module_css_default.statusHeaderActions,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: MnemonView_module_css_default.secondaryButton,
								onClick: () => setVersionsOpen(true),
								children: t("versions.checkAction")
							})
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: MnemonView_module_css_default.healthStrip,
						"aria-label": t("status.aria"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `${MnemonView_module_css_default.healthIndicator} ${status === null ? MnemonView_module_css_default.healthMuted : MnemonView_module_css_default.healthGood}` }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("status.engine") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: status?.dshMnemonVersion === void 0 ? "dsh-mnemon" : `dsh-mnemon ${status.dshMnemonVersion}` }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: status === null ? t("status.pluginChecking") : t("status.pluginReady") })
						] })] }), props.components.map((card) => {
							const note = idle(card.state);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
								"data-component": card.packageName,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `${MnemonView_module_css_default.healthIndicator} ${note === void 0 && status !== null ? MnemonView_module_css_default.healthGood : MnemonView_module_css_default.healthMuted}` }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: card.label }), note === void 0 ? props.renderCard(card) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: note.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: note.detail })] })] })]
							}, card.key);
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonView_module_css_default.asyncStatusBlock,
						children: status !== null && (status.providerServices !== void 0 || status.memoryBodies !== void 0 && nativeInUse(status)) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderHealth, {
							status,
							services: status.providerServices ?? [],
							onOpenConfiguration: props.onOpenConfiguration
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonView_module_css_default.asyncStatusBlock,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StorageDomains, {
							catalog: storage,
							selected: selectedScope,
							selectedKind: selectedScopeKind,
							areaName: props.areaName
						})
					}),
					versionsOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VersionDialog, {
						client: props.client,
						writeEnabled: props.writeEnabled,
						onClose: () => setVersionsOpen(false),
						onRefreshStatus: props.onRefresh
					})
				]
			});
		}
		/** Mnemon Native is one Provider among peers: it has a health card once its CLI is installed or a space uses it. */
		function nativeInUse(status) {
			return status.commandFound || (status.memoryBodies ?? []).some((body) => body.provider.origin === "native");
		}
		/** Mnemon Native as the first row of the Provider list; its health comes from the CLI and its own spaces. */
		function NativeProviderRow({ status }) {
			const t = useT();
			const bodies = (status.memoryBodies ?? []).filter((body) => body.provider.origin === "native");
			const active = bodies.filter((body) => body.active);
			const pending = active.filter((body) => body.statusLoading === true);
			const failed = active.filter((body) => body.statusLoading !== true && !body.healthy);
			const state = !status.commandFound || failed.length > 0 ? "unhealthy" : active.length === 0 || pending.length > 0 ? "idle" : "healthy";
			const error = !status.commandFound ? t("status.nativeCliMissing") : failed.map((body) => `${body.name}: ${body.error ?? t("status.engineUnavailable")}`).join("; ");
			const version = status.version === void 0 ? t("status.versionWaiting") : `Mnemon ${status.version}`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
				"aria-label": t("status.nativeAria"),
				"data-status": state,
				"data-native": "",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
						providerId: "mnemon-native",
						icon: {
							kind: "brand",
							value: "mnemon"
						},
						className: MnemonView_module_css_default.providerHealthMark
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.providerHealthCopy,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.nativeName") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", { children: [
								t(`status.providerState.${state}`),
								" · ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: version })
							] }),
							error !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								title: error,
								children: error
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.providerHealthMeta,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonView_module_css_default.providerHealthSignal,
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("status.providerSpaces", {
							active: active.length,
							total: bodies.length
						}) })]
					})
				]
			});
		}
		/** The Providers that run, one row each; the ones that are off share one line saying where to turn them on. */
		function ProviderHealth({ status, services, onOpenConfiguration }) {
			const t = useT();
			const native = status.memoryBodies !== void 0 && nativeInUse(status);
			const running = services.filter((service) => service.enabled);
			const off = services.length - running.length;
			const enabled = running.length + (native && status.commandFound ? 1 : 0);
			const total = services.length + (native ? 1 : 0);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MnemonView_module_css_default.providerHealth,
				"aria-label": t("status.providersAria"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.statusSectionHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("status.providersTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("status.providersDescription") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonView_module_css_default.phaseBadge,
							children: t("status.providersEnabled", {
								enabled,
								total
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.providerHealthList,
						children: [native && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NativeProviderRow, { status }), running.map((service) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
							"data-status": service.status,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
									providerId: service.providerId,
									icon: service.icon,
									className: MnemonView_module_css_default.providerHealthMark
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MnemonView_module_css_default.providerHealthCopy,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: service.label }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t(`status.providerState.${service.status}`) }),
										service.error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											title: service.error,
											children: service.error
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MnemonView_module_css_default.providerHealthMeta,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: MnemonView_module_css_default.providerHealthSignal,
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("status.providerSpaces", {
										active: service.activeMemoryBodyCount,
										total: service.memoryBodyCount
									}) })]
								})
							]
						}, service.providerId))]
					}),
					off > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.providerHealthOff,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("status.providersOff", { count: off }) }), onOpenConfiguration !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "ghost",
							size: "sm",
							onClick: onOpenConfiguration,
							children: t("common.openConfiguration")
						})]
					})
				]
			});
		}
		function storageScopeLabel(t, kind) {
			return t(kind === "global" ? "status.storageGlobal" : kind === "workspace" ? "status.storageWorkspace" : kind === "workspaces" ? "status.storageWorkspaces" : "status.storageCustom");
		}
		/** Resolve the configured scope before the first status round-trip to keep the Sidebar header stable. */
		function configuredStorageScope(config) {
			return config?.storageScope ?? (config?.dataDir?.trim() ? "custom" : "global");
		}
		/** The Source whose data a storage area holds. */
		const AREA_SOURCES = {
			runtime: "runtime",
			documents: "documents",
			"memory-bodies": "memory-spaces"
		};
		function storageAreaLabel(t, kind) {
			return t(kind === "runtime" ? "status.storageRuntime" : kind === "memory-bodies" ? "status.storageSpaces" : kind === "documents" ? "status.storageDocuments" : "status.storageState");
		}
		function storageAreaDetails(t, area) {
			if (area.kind === "runtime") return t("status.storageRuntimeDetail", {
				user: area.details.userEntries ?? 0,
				memory: area.details.memoryEntries ?? 0
			});
			if (area.kind === "memory-bodies") return t("status.storageSpacesDetail", {
				active: area.details.activeBodies ?? 0,
				databases: area.details.databases ?? 0
			});
			if (area.kind === "documents") return t("status.storageDocumentsDetail", {
				active: area.details.activeDocuments ?? 0,
				archived: area.details.archivedDocuments ?? 0
			});
			return area.details.reviewLedger === true ? t("status.storageStateReady") : t("status.storageStateVolatile");
		}
		function StorageDomains(props) {
			const t = useT();
			const areaStatus = (status) => t(status === "ready" ? "status.storageReady" : status === "empty" ? "status.storageEmpty" : status === "missing" ? "status.storageMissing" : "status.storageInvalid");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: MnemonView_module_css_default.storageDomains,
				"aria-label": t("status.storageDomains"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.statusSectionHeader,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("status.storageDomains") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("status.storageDomainsText") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: MnemonView_module_css_default.phaseBadge,
							children: storageScopeLabel(t, props.selectedKind)
						})]
					}),
					props.catalog === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonView_module_css_default.storageUnavailable,
						children: t("status.storageWaiting")
					}) : props.selected?.root === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.storageUnavailable,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: storageScopeLabel(t, props.selectedKind) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: props.selectedKind === "custom" ? t("status.storageCustomUnset") : t("status.storageWorkspaceUnavailable") })]
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.storageRoot,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
							storageScopeLabel(t, props.selectedKind),
							" · ",
							t("status.storageActiveRoot")
						] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: props.selected.root })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: humanBytes(props.selected.totalBytes) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: props.selected.available ? t("status.storageAvailable") : t("status.storageNotCreated") })] })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonView_module_css_default.storageAreaGrid,
						children: props.selected.areas.filter((area) => area.kind !== "state").map((area) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
							"data-status": area.status,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.areaName(area.kind) })
								] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: areaStatus(area.status) })] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: MnemonView_module_css_default.storageAreaMetric,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: area.itemCount }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("status.storageItems") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: humanBytes(area.bytes) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: storageAreaDetails(t, area) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
									className: MnemonView_module_css_default.storagePath,
									children: area.path
								}),
								area.issue !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: area.issue })
							]
						}, area.kind))
					})] }),
					props.catalog !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: MnemonView_module_css_default.storageFootnote,
						children: t("status.storageFootnote", { root: props.catalog.activeRoot })
					})
				]
			});
		}
		function MnemonWorkbench(props) {
			const t = props.t ?? translateZh;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(I18nContext.Provider, {
				value: t,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LocaleContext.Provider, {
					value: props.locale ?? "zh",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonWorkspace, { ...props })
				})
			});
		}
		function MnemonWorkspace({ connection, settingsScope, sessionId, workspaceId, workspaceSelection, surface = "sidebar", active = true, onClose, configuration, componentChanges, sourcePageDirectory = EMPTY_SOURCE_PAGE_DIRECTORY, renderSlot }) {
			const t = useT();
			const locale = useLocale();
			const configurationSeat = configuration ?? NO_ACTION_SEAT;
			const openConfiguration = (0, react.useSyncExternalStore)(configurationSeat.subscribe, configurationSeat.getSnapshot, configurationSeat.getSnapshot);
			const componentSignal = componentChanges ?? NO_CHANGE_SIGNAL;
			const componentRevision = (0, react.useSyncExternalStore)(componentSignal.subscribe, componentSignal.getSnapshot, componentSignal.getSnapshot);
			const subscribeSettings = (0, react.useCallback)((listener) => settingsScope.subscribe(listener), [settingsScope]);
			const getSettingsSnapshot = (0, react.useCallback)(() => settingsScope.getSnapshot(), [settingsScope]);
			const settingsSnapshot = (0, react.useSyncExternalStore)(subscribeSettings, getSettingsSnapshot, getSettingsSnapshot);
			const subscribeSourcePages = (0, react.useCallback)((listener) => sourcePageDirectory.subscribe(listener), [sourcePageDirectory]);
			const getSourcePages = (0, react.useCallback)(() => sourcePageDirectory.getSnapshot(), [sourcePageDirectory]);
			const sourcePageEntries = (0, react.useSyncExternalStore)(subscribeSourcePages, getSourcePages, getSourcePages);
			const client = (0, react.useMemo)(() => new MnemonClient(connection, sessionId, workspaceId), [
				connection,
				sessionId,
				workspaceId
			]);
			const taskClient = (0, react.useMemo)(() => surface === "builtin" ? client : new MnemonClient(connection, void 0, workspaceId), [
				client,
				connection,
				surface,
				workspaceId
			]);
			const viewContextKey = `${`${sessionId ?? ""}\u0000${workspaceId ?? ""}`}\u0000${settingsSnapshot.revision === void 0 ? "loading" : JSON.stringify([
				settingsSnapshot.value?.storageScope ?? null,
				settingsSnapshot.value?.dataDir ?? null,
				settingsSnapshot.value?.runtimeUserScope ?? null
			])}`;
			const [page, setPage] = (0, react.useState)("status");
			const workspaceToast = useToast();
			const showWorkspaceToast = workspaceToast.show;
			const canvasRef = (0, react.useRef)(null);
			const selectPage = (0, react.useCallback)((next) => setPage(next), []);
			/** Pages share one plugin-owned scroll container; never mutate DSH ancestor scrollports. */
			const resetViewportScroll = (0, react.useCallback)(() => {
				const canvas = canvasRef.current;
				if (canvas !== null) canvas.scrollTop = 0;
			}, []);
			const revealElement = (0, react.useCallback)((element, topInset) => {
				const canvas = canvasRef.current;
				if (canvas === null || !canvas.contains(element)) return;
				const header = topInset === void 0 && canvas.hasAttribute("data-lock-page-header") ? canvas.querySelector(`.${MnemonView_module_css_default.pageHeader}`) : null;
				const inset = topInset ?? (header === null ? 0 : header.getBoundingClientRect().height + 12);
				canvas.scrollTop = Math.max(0, canvas.scrollTop + element.getBoundingClientRect().top - canvas.getBoundingClientRect().top - inset);
			}, []);
			(0, react.useLayoutEffect)(() => {
				resetViewportScroll();
			}, [
				viewContextKey,
				page,
				resetViewportScroll
			]);
			const [statusState, setStatusState] = (0, react.useState)(() => ({
				contextKey: viewContextKey,
				value: null,
				loading: true,
				error: null
			}));
			const currentStatusState = statusState.contextKey === viewContextKey ? statusState : {
				contextKey: viewContextKey,
				value: null,
				loading: true,
				error: null
			};
			const status = currentStatusState.value;
			const statusLoading = currentStatusState.loading;
			const statusError = currentStatusState.error;
			const statusRequest = (0, react.useRef)(0);
			const [revision, setRevision] = (0, react.useState)(0);
			const [sourceCatalogState, setSourceCatalogState] = (0, react.useState)(() => ({
				contextKey: viewContextKey,
				value: null,
				error: null
			}));
			const [selectedSourceInstances, setSelectedSourceInstances] = (0, react.useState)({});
			const [navigationInput, setNavigationInput] = (0, react.useState)();
			/** A tab opens its page fresh; only an anchor carries navigation into a page. */
			const openTab = (0, react.useCallback)((next) => {
				setNavigationInput(void 0);
				setPage(next);
			}, []);
			(0, react.useEffect)(() => {
				let active = true;
				client.sourceManagementCatalog().then((value) => {
					if (active) setSourceCatalogState({
						contextKey: viewContextKey,
						value,
						error: null
					});
				}).catch((reason) => {
					if (active) setSourceCatalogState({
						contextKey: viewContextKey,
						value: null,
						error: message(reason)
					});
				});
				return () => {
					active = false;
				};
			}, [
				client,
				revision,
				viewContextKey
			]);
			const sourceCatalog = sourceCatalogState.contextKey === viewContextKey ? sourceCatalogState.value : null;
			const sourceInstances = sourceCatalog?.sources ?? [];
			const sourceManagementClients = (0, react.useMemo)(() => new Map(sourceInstances.map((source) => [source.sourceInstanceKey, bindSourceManagementClient(client, source, taskClient)])), [
				client,
				sourceInstances,
				taskClient
			]);
			const visibleSourcePages = (0, react.useMemo)(() => {
				const visibleTypes = new Set(sourceInstances.map((source) => source.sourceTypeId));
				return sourcePageEntries.filter((entry) => visibleTypes.has(entry.sourceTypeId));
			}, [sourceInstances, sourcePageEntries]);
			const managedSourceTypes = (0, react.useMemo)(() => {
				const byType = /* @__PURE__ */ new Map();
				for (const source of sourceInstances) {
					if (sourcePageEntries.some((entry) => entry.sourceTypeId === source.sourceTypeId) && (source.management.fields?.length ?? 0) === 0) continue;
					const current = byType.get(source.sourceTypeId);
					if (current === void 0) byType.set(source.sourceTypeId, [source]);
					else current.push(source);
				}
				return [...byType.entries()].sort(([left], [right]) => left.localeCompare(right));
			}, [sourceInstances, sourcePageEntries]);
			const stoppedLayers = status?.memorySystem?.configuration.layers;
			const stoppedTypes = (0, react.useMemo)(() => {
				if (sourceCatalog === null || stoppedLayers === void 0) return /* @__PURE__ */ new Set();
				const running = new Set(sourceInstances.map((source) => source.sourceTypeId));
				return new Set(Object.keys(stoppedLayers).filter((id) => !running.has(id)));
			}, [
				sourceCatalog,
				sourceInstances,
				stoppedLayers
			]);
			const [dashboard, setDashboard] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let current = true;
				client.viewDashboard().then((value) => {
					if (current) setDashboard(Array.isArray(value?.entries) ? value : null);
				}, () => {
					if (current) setDashboard(null);
				});
				return () => {
					current = false;
				};
			}, [
				client,
				revision,
				componentRevision
			]);
			const sourceName = (0, react.useCallback)((sourceTypeId, fallback) => {
				const component = dashboard === null ? void 0 : sourceOf(dashboard, sourceTypeId);
				return component === void 0 ? fallback ?? sourceTypeId : componentCopy(component, locale).label;
			}, [dashboard, locale]);
			const strategyName = (typeId) => {
				const component = dashboard?.entries.find((entry) => entry.roles.includes("strategy") && entry.typeId === typeId);
				return component === void 0 ? typeId : componentCopy(component, locale).label;
			};
			const switchedOff = (0, react.useMemo)(() => new Set(dashboard === null ? [] : [...stoppedTypes].filter((id) => sourceOf(dashboard, id)?.enabled === false)), [dashboard, stoppedTypes]);
			const sourceNavigationEntries = (0, react.useMemo)(() => {
				const entries = [];
				const stopped = (sourceTypeId, label) => ({
					id: "stopped:" + sourceTypeId,
					page: stoppedSourcePage(sourceTypeId),
					sourceTypeId,
					label,
					detail: sourceTypeId,
					group: "sources",
					glyph: "◇",
					primary: true,
					stopped: true
				});
				const stoppedShown = /* @__PURE__ */ new Set();
				const named = /* @__PURE__ */ new Set();
				const tabName = (sourceTypeId, label) => {
					if (named.has(sourceTypeId)) return label;
					named.add(sourceTypeId);
					return sourceName(sourceTypeId, label);
				};
				for (const entry of sourcePageEntries) {
					const primary = entry.navigation?.primary ?? true;
					if (visibleSourcePages.includes(entry)) entries.push({
						id: entry.id,
						page: sourcePage(entry.id),
						sourceTypeId: entry.sourceTypeId,
						label: primary ? tabName(entry.sourceTypeId, entry.label) : entry.label,
						detail: entry.navigation?.detail ?? entry.sourceTypeId,
						group: entry.navigation?.group ?? "sources",
						glyph: entry.navigation?.glyph ?? "◇",
						primary
					});
					else if (stoppedTypes.has(entry.sourceTypeId) && !stoppedShown.has(entry.sourceTypeId) && primary) {
						stoppedShown.add(entry.sourceTypeId);
						entries.push(stopped(entry.sourceTypeId, tabName(entry.sourceTypeId, entry.label)));
					}
				}
				for (const sourceTypeId of stoppedTypes) if (!stoppedShown.has(sourceTypeId) && dashboard !== null && sourceOf(dashboard, sourceTypeId) !== void 0) entries.push(stopped(sourceTypeId, sourceName(sourceTypeId)));
				entries.push(...managedSourceTypes.map(([sourceTypeId, instances]) => ({
					id: "management:" + sourceTypeId,
					page: managedSourcePage(sourceTypeId),
					sourceTypeId,
					label: sourceName(sourceTypeId, instances[0].management.label),
					detail: sourceTypeId,
					group: "sources",
					glyph: "◇",
					primary: true
				})));
				return entries;
			}, [
				dashboard,
				managedSourceTypes,
				sourceName,
				sourcePageEntries,
				stoppedTypes,
				visibleSourcePages
			]);
			(0, react.useEffect)(() => {
				if (sourceCatalog === null) return;
				const entryId = sourcePageEntryId(page);
				const managedTypeId = managedSourceTypeId(page);
				const stoppedTypeId = stoppedSourceTypeId(page);
				const whileStopped = (sourceTypeId) => sourceTypeId !== void 0 && stoppedTypes.has(sourceTypeId) ? stoppedSourcePage(sourceTypeId) : "status";
				if (entryId !== void 0 && !visibleSourcePages.some((entry) => entry.id === entryId)) setPage(whileStopped(sourcePageEntries.find((entry) => entry.id === entryId)?.sourceTypeId));
				else if (managedTypeId !== void 0 && !managedSourceTypes.some(([sourceTypeId]) => sourceTypeId === managedTypeId)) setPage(whileStopped(managedTypeId));
				else if (stoppedTypeId !== void 0 && !stoppedTypes.has(stoppedTypeId)) {
					const resumed = visibleSourcePages.find((entry) => entry.sourceTypeId === stoppedTypeId && (entry.navigation?.primary ?? true));
					setPage(resumed !== void 0 ? sourcePage(resumed.id) : managedSourceTypes.some(([sourceTypeId]) => sourceTypeId === stoppedTypeId) ? managedSourcePage(stoppedTypeId) : "status");
					showWorkspaceToast({
						text: t("feedback.layerResumed", { layer: sourceName(stoppedTypeId, resumed?.label) }),
						tone: "success"
					});
				}
			}, [
				managedSourceTypes,
				page,
				sourcePageEntries,
				stoppedTypes,
				visibleSourcePages,
				sourceCatalog,
				showWorkspaceToast,
				sourceName,
				t
			]);
			(0, react.useLayoutEffect)(() => {
				setNavigationInput(void 0);
			}, [viewContextKey]);
			/** Anchors address Source page ids; no Source component is imported here. */
			const applyAnchor = (0, react.useCallback)((anchor) => {
				setNavigationInput({
					page: anchor.page,
					value: {
						seed: anchor.seed ?? "",
						nonce: Date.now()
					}
				});
				selectPage(anchor.page === "status" ? "status" : sourcePage(anchor.page));
			}, [selectPage]);
			(0, react.useEffect)(() => {
				const held = consumeMnemonAnchor(sessionId);
				if (held !== null) applyAnchor(held);
				return subscribeMnemonAnchor(sessionId, applyAnchor);
			}, [sessionId, applyAnchor]);
			const loadStatus = (0, react.useCallback)(async () => {
				const request = ++statusRequest.current;
				setStatusState((current) => ({
					contextKey: viewContextKey,
					value: current.contextKey === viewContextKey ? current.value : null,
					loading: true,
					error: null
				}));
				try {
					const summary = await client.statusSummary();
					if (request !== statusRequest.current) return;
					const needsDeepStatus = summary.memoryBodies?.some((body) => body.statusLoading === true) === true || summary.commandFound === true && summary.version === void 0;
					setStatusState({
						contextKey: viewContextKey,
						value: summary,
						loading: needsDeepStatus,
						error: null
					});
					if (!needsDeepStatus) return;
					try {
						const next = await client.status();
						if (request === statusRequest.current) setStatusState({
							contextKey: viewContextKey,
							value: next,
							loading: false,
							error: null
						});
					} catch (reason) {
						if (request === statusRequest.current) setStatusState({
							contextKey: viewContextKey,
							value: summary,
							loading: false,
							error: message(reason)
						});
					}
				} catch (reason) {
					if (request === statusRequest.current) setStatusState({
						contextKey: viewContextKey,
						value: null,
						loading: false,
						error: message(reason)
					});
				}
			}, [client, viewContextKey]);
			(0, react.useEffect)(() => {
				loadStatus();
			}, [loadStatus]);
			const mutate = (0, react.useCallback)(() => {
				setRevision((value) => value + 1);
				loadStatus();
			}, [loadStatus]);
			const refreshAll = mutate;
			const [refreshKey, setRefreshKey] = (0, react.useState)(0);
			const refreshPage = (0, react.useCallback)(() => {
				setRefreshKey((value) => value + 1);
				refreshAll();
			}, [refreshAll]);
			const shown = (0, react.useRef)(active);
			(0, react.useEffect)(() => {
				if (active && !shown.current) refreshAll();
				shown.current = active;
			}, [active, refreshAll]);
			const seenComponents = (0, react.useRef)(componentRevision);
			(0, react.useEffect)(() => {
				if (componentRevision === seenComponents.current) return;
				seenComponents.current = componentRevision;
				refreshAll();
			}, [componentRevision, refreshAll]);
			const seenSettings = (0, react.useRef)({
				revision: settingsSnapshot.revision,
				context: viewContextKey
			});
			(0, react.useEffect)(() => {
				const seen = seenSettings.current;
				seenSettings.current = {
					revision: settingsSnapshot.revision,
					context: viewContextKey
				};
				if (seen.revision !== settingsSnapshot.revision && seen.context === viewContextKey) refreshAll();
			}, [
				settingsSnapshot.revision,
				viewContextKey,
				refreshAll
			]);
			const activationEnabled = status?.writeEnabled === true;
			const writeEnabled = activationEnabled && settingsSnapshot.status === "ready" && settingsSnapshot.writable;
			const remoteReadOnly = activationEnabled && settingsSnapshot.status === "ready" && !settingsSnapshot.writable && isRemoteConnection(connection);
			const workspaceContext = status?.workspaceContext;
			const storageMode = workspaceContext?.mode ?? status?.storage?.activeKind ?? configuredStorageScope(settingsSnapshot.value);
			const storageModeText = storageScopeLabel(t, storageMode);
			const showWorkspacePicker = isWorkspaceStorageScope(storageMode) && workspaceSelection !== void 0 && workspaceSelection.options.length > 0;
			const canAlignWorkspace = workspaceContext !== void 0 && isWorkspaceStorageScope(workspaceContext.mode) && !workspaceContext.aligned && workspaceSelection?.effectiveWorkspaceId !== void 0;
			const workspaceDifference = workspaceContext === void 0 ? "" : `${t("workspace.selectedRoot", { root: workspaceContext.selectedRoot })}; ${t("workspace.effectiveRoot", { root: workspaceContext.effectiveRoot })}`;
			const workspacePicker = showWorkspacePicker && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
				inline: true,
				size: "sm",
				className: appearanceClass(MnemonView_module_css_default.workspacePicker, MnemonSidebarView_module_css_default.workspacePicker),
				label: t("workspace.viewing"),
				ariaLabel: t("workspace.selectorAria"),
				value: workspaceSelection.selectedWorkspaceId ?? "",
				options: workspaceSelection.options.map((workspace) => ({
					value: workspace.id,
					label: workspace.title
				})),
				onChange: workspaceSelection.onSelect
			});
			const savedLayers = settingsSnapshot.value?.memoryTopology?.layers;
			const configuredLayers = status?.memorySystem?.configuration.layers;
			const disabledTypes = new Set([.../* @__PURE__ */ new Set([...Object.keys(configuredLayers ?? {}), ...Object.keys(savedLayers ?? {})])].filter((id) => (savedLayers?.[id]?.enabled ?? configuredLayers?.[id]?.enabled) === false || switchedOff.has(id)));
			const notice = compositionNotice(status?.memorySystem, t);
			const memoryOff = status?.memorySystem !== void 0 && !status.memorySystem.serving;
			const composingType = status?.memorySystem?.serving === true ? status.memorySystem.strategyTypeId : void 0;
			const composingLabel = composingType === void 0 ? void 0 : strategyName(composingType);
			const statusTone = status === null && statusLoading ? "ongoing" : statusError !== null || notice?.tone === "error" || status?.healthy === false && notice === void 0 ? "error" : notice !== void 0 ? "warning" : "done";
			const connectionLabel = status === null && statusLoading ? t("header.checking") : notice?.tone === "error" ? t("status.memoryOff") : status?.healthy !== true ? t("header.unavailable") : t("header.connected");
			const allInstancesFor = (sourceTypeId) => sourceInstances.filter((source) => source.sourceTypeId === sourceTypeId);
			const instancesFor = (sourceTypeId) => allInstancesFor(sourceTypeId);
			const renderSourceContribution = (entryId) => {
				const sourceTypeId = entryId.split("/")[0];
				const instances = instancesFor(sourceTypeId);
				const selectedKey = selectedSourceInstances[sourceTypeId];
				const selected = instances.find((instance) => instance.sourceInstanceKey === selectedKey) ?? instances.find((instance) => isDefaultSourceInstance(instance.sourceInstanceKey, sourceTypeId)) ?? instances[0];
				if (selected === void 0 || renderSlot === void 0) return null;
				if (disabledTypes.has(sourceTypeId)) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SourceDisabledPage, {
					title: sourceName(sourceTypeId, selected.management.label),
					onOpenConfiguration: openConfiguration
				});
				const management = sourceManagementClients.get(selected.sourceInstanceKey);
				const preferences = !isDefaultSourceInstance(selected.sourceInstanceKey, "memory-spaces") ? void 0 : {
					value: JSON.parse(JSON.stringify({ persistenceStrategy: {
						...settingsSnapshot.value?.persistenceStrategy,
						providerConnections: {}
					} })),
					writable: settingsSnapshot.writable,
					replace: async (value) => {
						const requested = jsonRecord(value)?.persistenceStrategy;
						const strategy = requested === void 0 ? void 0 : jsonRecord(requested);
						if (strategy === void 0) throw new Error("Persistence strategy preferences must be an object");
						const connections = jsonRecord(strategy.providerConnections ?? {}) ?? {};
						const merged = { ...settingsSnapshot.value?.persistenceStrategy?.providerConnections };
						for (const [id, fields] of Object.entries(connections)) merged[id] = {
							...merged[id],
							...jsonRecord(fields)
						};
						await settingsScope.mutate([{
							op: "set",
							path: ["persistenceStrategy"],
							value: {
								...strategy,
								providerConnections: merged
							}
						}]);
					}
				};
				return renderSlot(MNEMON_SOURCE_PAGE_SLOT, {
					sourceTypeId,
					sourceInstanceKey: selected.sourceInstanceKey,
					sourceInstances: instances,
					writable: writeEnabled,
					locale,
					...management === void 0 ? {} : { management },
					...sessionId === void 0 ? {} : { sessionId },
					...workspaceId === void 0 ? {} : { workspaceId },
					...navigationInput?.page === entryId ? { navigationInput: navigationInput.value } : {},
					...preferences === void 0 ? {} : { preferences },
					onRefresh: mutate,
					refreshKey,
					onResetScroll: resetViewportScroll,
					onRevealElement: revealElement
				}, { only: entryId });
			};
			const activeStoppedType = stoppedSourceTypeId(page);
			const stoppedTitle = (sourceTypeId) => sourceName(sourceTypeId, sourceNavigationEntries.find((entry) => entry.page === page)?.label);
			const layerState = (sourceTypeId) => disabledTypes.has(sourceTypeId) ? "off" : !stoppedTypes.has(sourceTypeId) ? "on" : memoryOff ? "memory-off" : "stopped";
			const layerIds = Object.keys(status?.memorySystem?.configuration.layers ?? {});
			const headerLayers = layerIds.map((id) => ({
				id,
				label: sourceName(id),
				state: layerState(id)
			}));
			const sourceComponents = (dashboard?.entries ?? []).filter((entry) => entry.roles.includes("source"));
			const rank = (entry) => {
				const index = layerIds.indexOf(layerOf(entry) ?? "");
				return index < 0 ? layerIds.length : index;
			};
			const componentCards = dashboard === null ? layerIds.map((id) => ({
				key: id,
				packageName: "dsh-mnemon-source-" + id,
				label: sourceName(id),
				enabled: layerState(id) !== "off",
				state: layerState(id)
			})) : [...sourceComponents].sort((left, right) => rank(left) - rank(right)).map((entry) => {
				const layerId = layerOf(entry);
				return {
					key: entry.entryId,
					packageName: entry.packageName,
					label: componentCopy(entry, locale).label,
					enabled: entry.enabled,
					state: !entry.enabled ? "off" : layerId === void 0 ? memoryOff ? "memory-off" : "stopped" : layerState(layerId)
				};
			});
			const renderCard = (card) => renderSlot === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("board.running") }) : renderSlot(MNEMON_COMPONENT_STATUS_SLOT, {
				component: {
					packageName: card.packageName,
					label: card.label,
					enabled: card.enabled
				},
				language: locale,
				...sessionId === void 0 ? {} : { sessionId },
				...workspaceId === void 0 ? {} : { workspace: { id: workspaceId } }
			}, {
				entryKey: card.packageName,
				fallback: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("board.running") })
			});
			const areaName = (kind) => {
				const sourceTypeId = AREA_SOURCES[kind];
				return sourceTypeId === void 0 ? storageAreaLabel(t, kind) : sourceName(sourceTypeId, storageAreaLabel(t, kind));
			};
			const activeSourcePageId = sourcePageEntryId(page);
			const activeSourcePage = activeSourcePageId === void 0 ? void 0 : visibleSourcePages.find((entry) => entry.id === activeSourcePageId);
			const activeSourceInstances = activeSourcePage === void 0 ? [] : instancesFor(activeSourcePage.sourceTypeId);
			const activeSelectedKey = activeSourcePage === void 0 ? void 0 : selectedSourceInstances[activeSourcePage.sourceTypeId];
			const activeSelectedInstance = activeSourceInstances.find((instance) => instance.sourceInstanceKey === activeSelectedKey) ?? activeSourceInstances.find((instance) => isDefaultSourceInstance(instance.sourceInstanceKey, activeSourcePage?.sourceTypeId ?? "")) ?? activeSourceInstances[0];
			const customSourcePage = activeSourcePage === void 0 || activeSelectedInstance === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: MnemonView_module_css_default.page,
				"data-source-page": activeSourcePage.id,
				children: [activeSourceInstances.length > 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectField, {
					inline: true,
					size: "sm",
					className: MnemonView_module_css_default.workspacePicker,
					label: t("sourcePage.instance"),
					ariaLabel: t("sourcePage.instanceAria"),
					value: activeSelectedInstance.sourceInstanceKey,
					options: activeSourceInstances.map((instance) => ({
						value: instance.sourceInstanceKey,
						label: instance.management.label,
						detail: instance.sourceInstanceKey
					})),
					onChange: (value) => setSelectedSourceInstances((current) => ({
						...current,
						[activeSourcePage.sourceTypeId]: value
					}))
				}), renderSourceContribution(activeSourcePage.id)]
			});
			const activeManagedSourceTypeId = managedSourceTypeId(page);
			const activeManagedSourceInstances = activeManagedSourceTypeId === void 0 ? [] : allInstancesFor(activeManagedSourceTypeId);
			const activeManagedSelectedKey = activeManagedSourceTypeId === void 0 ? void 0 : selectedSourceInstances[activeManagedSourceTypeId];
			const activeManagedSourceInstance = activeManagedSourceInstances.find((instance) => instance.sourceInstanceKey === activeManagedSelectedKey) ?? activeManagedSourceInstances[0];
			const managedSourcePageContent = activeManagedSourceTypeId === void 0 || activeManagedSourceInstance === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SourceManagementPage, {
				instance: activeManagedSourceInstance,
				instances: activeManagedSourceInstances,
				...sourceManagementClients.get(activeManagedSourceInstance.sourceInstanceKey) === void 0 ? {} : { management: sourceManagementClients.get(activeManagedSourceInstance.sourceInstanceKey) },
				onSelect: (sourceInstanceKey) => setSelectedSourceInstances((current) => ({
					...current,
					[activeManagedSourceTypeId]: sourceInstanceKey
				})),
				onMutate: mutate
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
				className: appearanceClass(MnemonView_module_css_default.shell, MnemonSidebarView_module_css_default.shell),
				"data-dsh-plugin": "dsh-mnemon",
				"data-dsh-part": "mnemon-view",
				"data-mnemon-surface": surface,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
						className: appearanceClass(MnemonView_module_css_default.masthead, MnemonSidebarView_module_css_default.masthead),
						children: [
							onClose !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: appearanceClass(MnemonView_module_css_default.ghostButton, MnemonView_module_css_default.backButton),
								onClick: onClose,
								"aria-label": t("header.backToConversation"),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconChevronLeftOutline14, { size: 14 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("header.backToConversation") })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: appearanceClass(MnemonView_module_css_default.brand, MnemonSidebarView_module_css_default.brand),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h1", { children: t("tab.label") }), surface === "sidebar" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: MnemonView_module_css_default.storageMode,
										"aria-label": t("workspace.storageModeAria", { mode: storageModeText }),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("workspace.storageMode") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: storageModeText })]
									}),
									workspacePicker,
									canAlignWorkspace && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: appearanceClass(MnemonView_module_css_default.workspaceMismatch, MnemonSidebarView_module_css_default.workspaceMismatch),
										role: "status",
										"aria-label": `${t("workspace.mismatchTitle")}. ${workspaceDifference}`,
										title: workspaceDifference,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("workspace.mismatchShort") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: workspaceSelection.onAlign,
											children: t("workspace.align")
										})]
									})
								] })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: appearanceClass(MnemonView_module_css_default.headerActions, MnemonSidebarView_module_css_default.headerActions),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: appearanceClass(MnemonView_module_css_default.statusCluster, MnemonSidebarView_module_css_default.statusCluster),
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(CompositionStatus, {
										tone: statusTone,
										label: connectionLabel,
										strategy: composingLabel,
										layers: headerLayers,
										onOpen: openConfiguration
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: MnemonView_module_css_default.iconButton,
										disabled: statusLoading,
										onClick: refreshPage,
										"aria-label": t("common.refresh"),
										title: t("common.refresh"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutlineRegular, { size: 16 })
									})]
								}), openConfiguration !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: MnemonView_module_css_default.iconButton,
									onClick: openConfiguration,
									"aria-label": t("header.configure"),
									title: t("header.configure"),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSettingsOutlineRegular, { size: 16 })
								})]
							})
						]
					}),
					sourceCatalogState.contextKey === viewContextKey && sourceCatalogState.error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonView_module_css_default.alert,
						role: "alert",
						children: sourceCatalogState.error
					}),
					(statusError !== null || status?.healthy === false && notice === void 0) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.alert,
						role: "alert",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("header.notReady") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: statusError ?? status?.error })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Reveal, {
						className: MnemonView_module_css_default.notice,
						children: statusError === null && notice !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Callout, {
							tone: notice.tone === "error" ? "error" : "warning",
							title: notice.title,
							actions: openConfiguration === void 0 ? void 0 : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								onClick: openConfiguration,
								children: t("common.openConfiguration")
							}),
							children: notice.detail
						})
					}),
					workspaceToast.element,
					remoteReadOnly && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonView_module_css_default.alert,
						role: "status",
						children: t("workspace.remoteReadOnly")
					}),
					status?.lifecycle?.current?.idleReviewBlocked === "agent-team" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: MnemonView_module_css_default.alert,
						role: "status",
						children: t("status.reviewTeamPaused")
					}),
					status?.lifecycle?.current?.lastError !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.alert,
						role: "alert",
						"aria-label": t("status.reviewFailed"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("status.reviewFailed") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: status.lifecycle.current.lastError }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("status.reviewFailedDetail") }),
							status.lifecycle.current.lastReviewFailure?.status === "partial" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("status.reviewPartial") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("status.reviewRun", { id: status.lifecycle.current.lastReviewFailure.runId ?? "" }) }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: status.lifecycle.current.lastReviewFailure.receipts.map((receipt, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: [
									receipt.tool,
									receipt.action,
									receipt.documentId,
									receipt.target,
									receipt.revision
								].filter(Boolean).join(" · ") }, index)) })
							] }),
							/CONTEXT_WINDOW_EXCEEDED|exceed(?:s|ed)? (?:the )?(?:available )?context (?:size|window)/iu.test(status.lifecycle.current.lastError) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("status.reviewContextWindow") })
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: MnemonView_module_css_default.workspace,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkspaceNavigation, {
							page,
							onSelect: openTab,
							sourcePages: sourceNavigationEntries,
							disabledTypes,
							memoryOff
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: appearanceClass(MnemonView_module_css_default.canvas, MnemonSidebarView_module_css_default.canvas),
							ref: canvasRef,
							"data-testid": "mnemon-canvas",
							"data-lock-page-header": activeSourcePage?.navigation?.stickyHeader !== false ? "" : void 0,
							children: [
								page === "status" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkbenchStatusContext.Provider, {
									value: status,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StatusPage, {
										client,
										status,
										loading: statusLoading,
										writeEnabled,
										attention: notice !== void 0,
										components: componentCards,
										renderCard,
										areaName,
										onRefresh: () => void loadStatus(),
										onOpenConfiguration: openConfiguration
									})
								}),
								activeManagedSourceInstance !== void 0 && managedSourcePageContent,
								activeSourcePage !== void 0 && customSourcePage,
								activeStoppedType !== void 0 && (disabledTypes.has(activeStoppedType) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SourceDisabledPage, {
									title: stoppedTitle(activeStoppedType),
									onOpenConfiguration: openConfiguration
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SourceStoppedPage, {
									title: stoppedTitle(activeStoppedType),
									memoryOff,
									onOpenConfiguration: openConfiguration
								}))
							]
						}, viewContextKey)]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-mnemon-css:/home/runner/work/dsh-mnemon/dsh-mnemon/src/client/MnemonWorkspace.module.css.mjs
		const css = ".NS3bAW_workspacePanel{box-sizing:border-box;background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-base));pointer-events:auto;min-width:0;min-height:0;display:flex;position:fixed;overflow:hidden}.NS3bAW_workspacePanel>*{flex:auto;width:100%;min-width:0}.NS3bAW_betterSidebarSeat,.NS3bAW_nativeWorkspace{flex:auto;width:100%;min-width:0;height:100%;min-height:0;display:flex;overflow:hidden}.NS3bAW_betterSidebarSeat>*,.NS3bAW_nativeWorkspace>*{flex:auto;min-width:0}.NS3bAW_nativeWorkspace{z-index:2;position:relative}.NS3bAW_nativeWorkspace[data-dsh-mnemon-main-seat]{box-sizing:border-box;padding-block-start:var(--dsh-frame-top-clearance,0px)}.NS3bAW_nativeWorkspace[hidden]{display:none}.NS3bAW_entry{box-sizing:border-box;width:100%;min-height:36px;color:var(--dsw-alias-label-secondary);white-space:nowrap;cursor:pointer;background:0 0;border:none;border-radius:8px;align-items:center;gap:8px;padding:0 10px;font-size:13px;display:flex}.NS3bAW_entry:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.NS3bAW_entry[data-active]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-active);font-weight:600}.NS3bAW_entryIcon{flex:none;justify-content:center;align-items:center;width:24px;height:24px;display:inline-flex}.NS3bAW_entryIcon svg{width:18px;height:18px;display:block}.NS3bAW_entryLabel{text-overflow:ellipsis;overflow:hidden}[data-sidebar-collapsed] .NS3bAW_entry{width:36px;min-height:36px;color:var(--dsw-alias-label-primary);border-radius:50%;justify-content:center;margin:0 auto 12px;padding:0}[data-sidebar-collapsed] .NS3bAW_entryIcon svg{width:20px;height:20px}[data-sidebar-collapsed] .NS3bAW_entryLabel{display:none}";
		const tagId = "dsh-mnemon/src/client/MnemonWorkspace.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = tagId;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css) tag.textContent = css;
		}
		var MnemonWorkspace_module_css_default = {
			"betterSidebarSeat": "NS3bAW_betterSidebarSeat",
			"entry": "NS3bAW_entry",
			"entryIcon": "NS3bAW_entryIcon",
			"entryLabel": "NS3bAW_entryLabel",
			"nativeWorkspace": "NS3bAW_nativeWorkspace",
			"workspacePanel": "NS3bAW_workspacePanel"
		};
		//#endregion
		//#region src/client/sidebar-entry.ts
		const FAMILY_SELECTOR = "[data-dsh-taskboard-entry], [data-dsh-ssh-entry], [data-dsh-mnemon-entry]";
		function sidebarRoot() {
			const column = document.querySelector("[data-pane=\"sidebar\"], [class*=\"sidebarCol\"], .dshDesktopUpstreamSidebar");
			if (column === null) return void 0;
			return column.querySelector("[class*=\"logoRow\"]")?.parentElement ?? column.firstElementChild;
		}
		function newSessionButton(root) {
			const nested = root.querySelector("button[class*=\"newSession\"]");
			if (nested !== null) return nested;
			for (const child of root.children) if (child.tagName === "BUTTON") return child;
		}
		function createEntry(controller) {
			const entry = document.createElement("button");
			entry.type = "button";
			entry.dataset.dshMnemonEntry = "";
			entry.dataset.dshPlugin = "dsh-mnemon";
			entry.dataset.dshPart = "sidebar-entry";
			entry.className = MnemonWorkspace_module_css_default.entry ?? "";
			const icon = document.createElement("span");
			icon.className = MnemonWorkspace_module_css_default.entryIcon ?? "";
			icon.append(createMemoryIcon(18));
			const label = document.createElement("span");
			label.className = MnemonWorkspace_module_css_default.entryLabel ?? "";
			entry.append(icon, label);
			entry.addEventListener("click", () => {
				controller.open();
			});
			return {
				entry,
				label
			};
		}
		function placeEntry(root, entry) {
			const button = newSessionButton(root);
			if (button === void 0) return false;
			const row = button.closest("[class*=\"logoRow\"]");
			const base = row !== null && row.parentElement === root ? row : button;
			const parent = base.parentElement ?? root;
			if (entry.parentElement === parent) return true;
			const anchor = Array.from(parent.children).filter((element) => element instanceof HTMLElement && element.matches(FAMILY_SELECTOR)).at(-1)?.nextElementSibling ?? base.nextElementSibling;
			parent.insertBefore(entry, anchor !== null && anchor.parentElement === parent ? anchor : null);
			return true;
		}
		/** Mount a self-healing official-style entry under the New Session row. */
		function mountMnemonSidebarEntry(controller, t, subscribeLocale) {
			const { entry, label } = createEntry(controller);
			let root;
			let placed = false;
			const syncLabel = () => {
				const text = t("tab.label");
				if (entry.getAttribute("aria-label") !== text) entry.setAttribute("aria-label", text);
				if (entry.title !== text) entry.title = text;
				if (label.textContent !== text) label.textContent = text;
			};
			const rootObserver = new MutationObserver(() => {
				if (root === void 0 || !root.isConnected) {
					placed = false;
					tryPlace();
					return;
				}
				if (!root.contains(entry)) placed = placeEntry(root, entry);
			});
			const tryPlace = () => {
				syncLabel();
				if (root !== void 0 && !root.isConnected) {
					rootObserver.disconnect();
					root = void 0;
					placed = false;
				}
				if (placed && document.body.contains(entry)) return;
				if (placed) {
					rootObserver.disconnect();
					root = void 0;
					placed = false;
				}
				root ??= sidebarRoot();
				if (root === void 0) return;
				placed = placeEntry(root, entry);
				if (placed) rootObserver.observe(root, {
					childList: true,
					subtree: true
				});
			};
			const waitObserver = new MutationObserver(tryPlace);
			waitObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
			const syncActive = () => {
				if (controller.getSnapshot().open) entry.dataset.active = "true";
				else delete entry.dataset.active;
			};
			const unsubscribe = controller.subscribe(syncActive);
			const unsubscribeLocale = subscribeLocale(syncLabel);
			const dispose = () => {
				waitObserver.disconnect();
				rootObserver.disconnect();
				unsubscribe();
				unsubscribeLocale();
				entry.remove();
			};
			try {
				syncActive();
				tryPlace();
				return dispose;
			} catch (error) {
				dispose();
				throw error;
			}
		}
		//#endregion
		//#region src/client/workspace-controller.ts
		/** Small framework-neutral state holder shared by the sidebar row and panel. */
		var MnemonWorkspaceController = class {
			snapshot = { open: false };
			listeners = /* @__PURE__ */ new Set();
			getSnapshot = () => this.snapshot;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			open() {
				this.setOpen(true, true);
			}
			close() {
				this.setOpen(false);
			}
			setOpen(open, reassert = false) {
				if (this.snapshot.open === open && !reassert) return;
				this.snapshot = { open };
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region src/client/workspace-mount.tsx
		const ACTIVE_ATTR = "data-dsh-mnemon-active";
		const TASKBOARD_ACTIVE_ATTR = "data-dsh-taskboard-active";
		const SSH_ACTIVE_ATTR = "data-dsh-ssh-active";
		const ACTIVATE_EVENT = "dsh-panel-activate";
		const SIDEBAR_CONTEXT_SELECTOR = "[data-dsh-taskboard-entry], [data-dsh-ssh-entry], [class*=\"sessionRow\"], [class*=\"projectRow\"], [class*=\"searchResultRow\"], [class*=\"searchResultWorkspace\"], [class*=\"newSession\"]";
		/** Conversation column that the Sidebar workspace overlay covers. */
		function resolveWorkspaceColumn() {
			return document.querySelector("[data-pane=\"conversation\"]") ?? document.querySelector(".dshDesktopConversationSurface") ?? document.querySelector("[class*=\"centerCol\"]") ?? void 0;
		}
		function normalizePath(value) {
			return value.replace(/[\\/]+$/u, "");
		}
		/** Builtin follows its DSH slot session, never the Sidebar's workspace picker. */
		function MnemonBuiltinWorkspaceHost(props) {
			const subscribeLocale = (0, react.useCallback)((listener) => props.localeRuntime.subscribe(listener), [props.localeRuntime]);
			const getLocale = (0, react.useCallback)(() => props.localeRuntime.getSnapshot(), [props.localeRuntime]);
			const locale = (0, react.useSyncExternalStore)(subscribeLocale, getLocale, getLocale);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonWorkbench, {
				connection: props.connection,
				settingsScope: props.settingsScope,
				sessionId: props.sessionId,
				surface: "builtin",
				t: props.t,
				locale: locale.active,
				sourcePageDirectory: props.sourcePageDirectory,
				...props.configuration === void 0 ? {} : { configuration: props.configuration },
				...props.componentChanges === void 0 ? {} : { componentChanges: props.componentChanges },
				...props.renderSlot === void 0 ? {} : { renderSlot: props.renderSlot }
			});
		}
		/** Shared workspace body; its DSH registration owns Source child-render authority. */
		function MnemonWorkspaceHost(props) {
			const subscribeLocale = (0, react.useCallback)((listener) => props.localeRuntime.subscribe(listener), [props.localeRuntime]);
			const getLocale = (0, react.useCallback)(() => props.localeRuntime.getSnapshot(), [props.localeRuntime]);
			const subscribeSessions = (0, react.useCallback)((listener) => props.sessions.list.subscribe(listener), [props.sessions.list]);
			const getSessions = (0, react.useCallback)(() => props.sessions.list.getSnapshot(), [props.sessions.list]);
			const subscribeWorkspaces = (0, react.useCallback)((listener) => props.workspaces.list.subscribe(listener), [props.workspaces.list]);
			const getWorkspaces = (0, react.useCallback)(() => props.workspaces.list.getSnapshot(), [props.workspaces.list]);
			const locale = (0, react.useSyncExternalStore)(subscribeLocale, getLocale, getLocale);
			const sessions = (0, react.useSyncExternalStore)(subscribeSessions, getSessions, getSessions);
			const workspaces = (0, react.useSyncExternalStore)(subscribeWorkspaces, getWorkspaces, getWorkspaces);
			const mainSessionId = useMnemonSessionId(props.currentSession);
			const [selectedWorkspaceId, setSelectedWorkspaceId] = (0, react.useState)();
			const sessionId = Object.hasOwn(props, "sessionId") ? props.sessionId : mainSessionId;
			const currentCwd = props.cwd ?? (sessionId === void 0 ? void 0 : Object.entries(sessions.byId).find(([id]) => id === sessionId)?.[1]?.cwd);
			const effectiveWorkspace = currentCwd === void 0 ? void 0 : workspaces.items.find((workspace) => normalizePath(workspace.path) === normalizePath(currentCwd));
			const fallbackWorkspace = effectiveWorkspace ?? workspaces.items[0];
			const resolvedSelectedId = selectedWorkspaceId !== void 0 && workspaces.items.some((workspace) => String(workspace.workspaceId) === selectedWorkspaceId) ? selectedWorkspaceId : fallbackWorkspace === void 0 ? void 0 : String(fallbackWorkspace.workspaceId);
			(0, react.useEffect)(() => {
				if (resolvedSelectedId !== selectedWorkspaceId) setSelectedWorkspaceId(resolvedSelectedId);
			}, [resolvedSelectedId, selectedWorkspaceId]);
			const selection = (0, react.useMemo)(() => ({
				options: workspaces.items.map((workspace) => ({
					id: String(workspace.workspaceId),
					title: workspace.title,
					path: workspace.path
				})),
				...resolvedSelectedId === void 0 ? {} : { selectedWorkspaceId: resolvedSelectedId },
				...effectiveWorkspace === void 0 ? {} : { effectiveWorkspaceId: String(effectiveWorkspace.workspaceId) },
				onSelect: setSelectedWorkspaceId,
				onAlign: () => {
					if (effectiveWorkspace !== void 0) setSelectedWorkspaceId(String(effectiveWorkspace.workspaceId));
				}
			}), [
				effectiveWorkspace,
				resolvedSelectedId,
				workspaces.items
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonWorkbench, {
				connection: props.connection,
				settingsScope: props.settingsScope,
				...sessionId === void 0 ? {} : { sessionId },
				...resolvedSelectedId === void 0 ? {} : { workspaceId: resolvedSelectedId },
				workspaceSelection: selection,
				active: props.active ?? true,
				t: props.t,
				locale: locale.active,
				sourcePageDirectory: props.sourcePageDirectory,
				...props.configuration === void 0 ? {} : { configuration: props.configuration },
				...props.componentChanges === void 0 ? {} : { componentChanges: props.componentChanges },
				...props.renderSlot === void 0 ? {} : { renderSlot: props.renderSlot },
				...props.navigation === void 0 ? {} : { onClose: props.navigation.close }
			});
		}
		/** Sidebar presentation in DSH's additive shell.overlay, also without a session. */
		function MnemonSidebarWorkspaceHost(props) {
			const state = (0, react.useSyncExternalStore)(props.controller.subscribe, props.controller.getSnapshot, props.controller.getSnapshot);
			const subscribeBetterSidebar = (0, react.useCallback)((listener) => props.betterSidebarSeat?.subscribe(listener) ?? (() => {}), [props.betterSidebarSeat]);
			const getBetterSidebar = (0, react.useCallback)(() => props.betterSidebarSeat?.getSnapshot(), [props.betterSidebarSeat]);
			const betterSidebar = (0, react.useSyncExternalStore)(subscribeBetterSidebar, getBetterSidebar, getBetterSidebar);
			const subscribeNativeSidebar = (0, react.useCallback)((listener) => props.nativeSidebarSeat?.subscribe(listener) ?? (() => {}), [props.nativeSidebarSeat]);
			const getNativeSidebar = (0, react.useCallback)(() => props.nativeSidebarSeat?.getSnapshot(), [props.nativeSidebarSeat]);
			const nativeSidebar = (0, react.useSyncExternalStore)(subscribeNativeSidebar, getNativeSidebar, getNativeSidebar);
			const [bounds, setBounds] = (0, react.useState)();
			(0, react.useEffect)(() => {
				if (!state.open || nativeSidebar?.available) return;
				let column;
				let previousInert = false;
				const update = () => {
					if (column === void 0) return;
					const { left, top, width, height } = column.getBoundingClientRect();
					setBounds((previous) => previous?.left === left && previous.top === top && previous.width === width && previous.height === height ? previous : {
						left,
						top,
						width,
						height
					});
				};
				const observer = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(update);
				const detach = () => {
					if (column !== void 0) {
						observer?.unobserve(column);
						column.inert = previousInert;
					}
					column = void 0;
				};
				const connect = () => {
					const next = resolveWorkspaceColumn();
					if (next !== column) {
						detach();
						column = next;
						if (column !== void 0) {
							previousInert = column.inert;
							column.inert = true;
							observer?.observe(column);
						}
					}
					update();
				};
				connect();
				const shell = new MutationObserver(connect);
				shell.observe(document.body, {
					childList: true,
					subtree: true
				});
				window.addEventListener("resize", update);
				return () => {
					shell.disconnect();
					observer?.disconnect();
					window.removeEventListener("resize", update);
					detach();
				};
			}, [
				state.open,
				props.controller,
				nativeSidebar?.available
			]);
			(0, react.useEffect)(() => {
				if (!state.open) return;
				const escape = (event) => {
					if (event.key === "Escape" && !event.defaultPrevented && document.querySelector("[role=\"dialog\"]") === null) {
						if (props.navigation !== void 0) props.navigation.close();
						else props.controller.close();
					}
				};
				window.addEventListener("keydown", escape);
				return () => {
					window.removeEventListener("keydown", escape);
				};
			}, [
				state.open,
				props.controller,
				props.navigation
			]);
			const betterSidebarView = betterSidebar === void 0 ? null : (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonWorkspaceHost, {
				connection: props.connection,
				settingsScope: props.settingsScope,
				sessions: props.sessions,
				workspaces: props.workspaces,
				currentSession: props.currentSession,
				localeRuntime: props.localeRuntime,
				sourcePageDirectory: props.sourcePageDirectory,
				...props.configuration === void 0 ? {} : { configuration: props.configuration },
				...props.componentChanges === void 0 ? {} : { componentChanges: props.componentChanges },
				sessionId: betterSidebar.scope.sessionId,
				...betterSidebar.scope.cwd === void 0 ? {} : { cwd: betterSidebar.scope.cwd },
				active: betterSidebar.visible,
				t: props.t,
				...props.renderSlot === void 0 ? {} : { renderSlot: props.renderSlot }
			}), betterSidebar.target);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				betterSidebarView,
				nativeSidebar?.target !== void 0 && nativeSidebar.available && (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
					"data-dsh-mnemon-view": true,
					className: MnemonWorkspace_module_css_default.nativeWorkspace,
					hidden: !state.open,
					"aria-label": props.t("tab.label"),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonWorkspaceHost, {
						...props,
						active: state.open
					})
				}), nativeSidebar.target),
				!nativeSidebar?.available && bounds !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
					"data-dsh-mnemon-view": true,
					hidden: !state.open,
					className: MnemonWorkspace_module_css_default.workspacePanel,
					style: {
						...bounds,
						display: state.open ? void 0 : "none"
					},
					"aria-label": props.t("tab.label"),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MnemonWorkspaceHost, {
						...props,
						active: state.open
					})
				})
			] });
		}
		/** Coordinate released peer panels; their DOM flags also cover lost events. */
		function coordinateSidebarPanels(controller, close = () => controller.close()) {
			let announcing = false;
			const applyActive = () => {
				const html = document.documentElement;
				if (!controller.getSnapshot().open) {
					html.removeAttribute(ACTIVE_ATTR);
					return;
				}
				announcing = true;
				try {
					document.dispatchEvent(new CustomEvent(ACTIVATE_EVENT, { detail: "ssh" }));
					document.dispatchEvent(new CustomEvent(ACTIVATE_EVENT, { detail: "taskboard" }));
				} finally {
					announcing = false;
				}
				html.removeAttribute(TASKBOARD_ACTIVE_ATTR);
				html.removeAttribute(SSH_ACTIVE_ATTR);
				html.setAttribute(ACTIVE_ATTR, "");
				document.dispatchEvent(new CustomEvent(ACTIVATE_EVENT, { detail: "mnemon" }));
			};
			const onActivate = (event) => {
				if (announcing || !controller.getSnapshot().open) return;
				const detail = event.detail;
				if (detail === "taskboard" || detail === "ssh") close();
			};
			const onContext = (event) => {
				if (controller.getSnapshot().open && event.target instanceof Element && event.target.closest(SIDEBAR_CONTEXT_SELECTOR) !== null) close();
			};
			const observer = new MutationObserver(() => {
				if (!controller.getSnapshot().open) return;
				const html = document.documentElement;
				if (!html.hasAttribute(ACTIVE_ATTR) || html.hasAttribute(TASKBOARD_ACTIVE_ATTR) || html.hasAttribute(SSH_ACTIVE_ATTR)) close();
			});
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: [
					ACTIVE_ATTR,
					TASKBOARD_ACTIVE_ATTR,
					SSH_ACTIVE_ATTR
				]
			});
			document.addEventListener("click", onContext, true);
			document.addEventListener(ACTIVATE_EVENT, onActivate);
			const unsubscribe = controller.subscribe(applyActive);
			applyActive();
			return () => {
				unsubscribe();
				observer.disconnect();
				document.removeEventListener("click", onContext, true);
				document.removeEventListener(ACTIVATE_EVENT, onActivate);
				document.documentElement.removeAttribute(ACTIVE_ATTR);
			};
		}
		//#endregion
		//#region src/client/native-sidebar-seat.ts
		/** Keep the shell-owned Source tree alive across native main-panel navigation. */
		var MnemonNativeSidebarSeat = class {
			snapshot = { available: false };
			listeners = /* @__PURE__ */ new Set();
			getSnapshot = () => this.snapshot;
			subscribe = (listener) => {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			};
			setAvailable(available) {
				if (this.snapshot.available === available) return;
				this.snapshot = {
					...this.snapshot,
					available
				};
				this.emit();
			}
			attach(parent) {
				let target = this.snapshot.target;
				if (target === void 0) {
					target = document.createElement("div");
					target.style.display = "contents";
					this.snapshot = {
						...this.snapshot,
						target
					};
					this.emit();
				}
				parent.append(target);
				return () => {
					if (target.parentElement === parent) target.remove();
				};
			}
			emit() {
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region src/client/native-sidebar.tsx
		const MNEMON_MAIN_PANEL_ID = "mnemon";
		const ICON_SELECTOR = "[data-dsh-plugin=\"dsh-mnemon\"][data-dsh-part=\"sidebar-icon\"]";
		/** The native Sidebar owns the surrounding button, label, tooltip and state. */
		function MnemonSidebarIcon({ size }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryIcon, {
				size,
				"data-dsh-plugin": "dsh-mnemon",
				"data-dsh-part": "sidebar-icon"
			});
		}
		/** DSH selects this seat; the shell registration retains Source render authority. */
		function MnemonMainPanel({ seat, controller }) {
			const parent = (0, react.useRef)(null);
			(0, react.useLayoutEffect)(() => {
				if (parent.current === null) return;
				const detach = seat.attach(parent.current);
				controller.open();
				return () => {
					controller.close();
					detach();
				};
			}, [seat, controller]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: parent,
				className: MnemonWorkspace_module_css_default.nativeWorkspace,
				"data-dsh-mnemon-main-seat": true
			});
		}
		/** Use the published panel contract, with a fallback for replacement layouts. */
		function mountMnemonSidebarNavigation(ctx, t, controller, seat) {
			let stopFallback;
			let disposed = false;
			const navigation = {
				open() {
					if (seat.getSnapshot().available) ctx.layout.selectPanel(MNEMON_MAIN_PANEL_ID);
					controller.open();
				},
				close() {
					if (seat.getSnapshot().available && controller.getSnapshot().open) ctx.layout.selectPanel(null);
					controller.close();
				}
			};
			const reconcileFallback = () => {
				if (disposed || seat.getSnapshot().available) {
					stopFallback?.();
					stopFallback = void 0;
				} else stopFallback ??= mountMnemonSidebarEntry(controller, t, (listener) => ctx.locale.subscribe(listener));
			};
			const stopPanels = coordinateSidebarPanels(controller, navigation.close);
			let stopNative;
			const reassert = (event) => {
				if (!seat.getSnapshot().available || !(event.target instanceof Element)) return;
				if (event.target.closest("button")?.querySelector(ICON_SELECTOR) != null) controller.open();
			};
			const dispose = () => {
				if (disposed) return;
				disposed = true;
				document.removeEventListener("click", reassert, true);
				stopPanels();
				stopNative?.();
				stopFallback?.();
				controller.close();
			};
			try {
				stopNative = ctx.slots.inject("main", () => ctx.slots.inject("sidebar.panellist", () => {
					const stopMain = ctx.slots.register({
						name: "main",
						key: MNEMON_MAIN_PANEL_ID,
						inject: () => ({
							seat,
							controller
						})
					}, MnemonMainPanel);
					let stopIcon;
					try {
						stopIcon = ctx.slots.register({
							name: "sidebar.panellist",
							id: MNEMON_MAIN_PANEL_ID,
							order: 30,
							label: () => t("tab.label"),
							locale: "mnemon"
						}, MnemonSidebarIcon);
						seat.setAvailable(true);
						reconcileFallback();
						if (controller.getSnapshot().open) navigation.open();
					} catch (error) {
						seat.setAvailable(false);
						stopIcon?.();
						stopMain();
						throw error;
					}
					return () => {
						controller.close();
						seat.setAvailable(false);
						stopIcon?.();
						stopMain();
						reconcileFallback();
					};
				}));
				document.addEventListener("click", reassert, true);
				reconcileFallback();
				return {
					...navigation,
					dispose
				};
			} catch (error) {
				dispose();
				throw error;
			}
		}
		//#endregion
		//#region src/client/better-sidebar.tsx
		/** Stable type id exposed to Better Sidebar and its persisted tab state. */
		const MNEMON_BETTER_SIDEBAR_TAB_ID = "dsh-mnemon:memory";
		/** Better Sidebar supplies a DOM seat; the DSH renderer remains the owner. */
		function BetterSidebarMemoryTab(props) {
			const target = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (target.current === null) return;
				return props.seat.attach(target.current, props.scope, props.visible);
			}, [
				props.scope.cwd,
				props.scope.sessionId,
				props.seat,
				props.visible
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				ref: target,
				className: MnemonWorkspace_module_css_default.betterSidebarSeat,
				"data-dsh-mnemon-better-sidebar-seat": true
			});
		}
		/**
		* Register Mnemon through Better Sidebar's documented optional service.
		*
		* The service is deliberately a soft dependency. Watching Cordis service
		* changes makes installation order and HMR irrelevant while preserving the
		* standalone Mnemon sidebar on profiles that do not install Better Sidebar.
		*/
		function mountBetterSidebarTab(ctx, t, seat) {
			let current;
			const reconcile = () => {
				const service = ctx.get("betterSidebar");
				if (current?.service === service) return;
				current?.dispose();
				current = void 0;
				if (service === void 0) return;
				current = {
					service,
					dispose: service.registerTab({
						id: MNEMON_BETTER_SIDEBAR_TAB_ID,
						title: () => t("tab.label"),
						icon: (size) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryIcon, { size }),
						order: 55,
						single: true,
						component: ({ scope, visible }) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BetterSidebarMemoryTab, {
							seat,
							scope,
							visible
						})
					})
				};
			};
			reconcile();
			const unsubscribe = ctx.on("internal/service", (name) => {
				if (name === "betterSidebar") reconcile();
			});
			return () => {
				unsubscribe();
				current?.dispose();
				current = void 0;
			};
		}
		//#endregion
		//#region src/client/subagent-token-usage.tsx
		/** Mnemon token-usage projection for DSH's fork-backed subagent token metric. */
		const MNEMON_SUBAGENT_TOKEN_USAGE_KEY = "mnemonSubagentTokenUsage";
		const SUBAGENT_LINEAGE_SLOT = "conversation.session.header.lineage";
		const SUBAGENT_LOCALE = "subagent";
		const MNEMON_SHADOW_PRIORITY = -100;
		const scopedSnapshots = /* @__PURE__ */ new WeakMap();
		function isTokenUsage(value) {
			if (!isRecord(value)) return false;
			const usage = value;
			return [
				"uncachedInputTokens",
				"outputTokens",
				"cacheReadTokens",
				"cacheWriteTokens"
			].every((key) => {
				const count = usage[key];
				return typeof count === "number" && Number.isSafeInteger(count) && count >= 0;
			});
		}
		/**
		* Present the child-local projection under the generic key expected by the
		* released official catalog component. All other consumers continue seeing
		* DSH's complete-log `tokenUsage` value.
		*/
		function scopeSubagentTokenUsage(state) {
			const cached = scopedSnapshots.get(state);
			if (cached !== void 0) return cached;
			let byId;
			for (const [id, summary] of Object.entries(state.byId)) {
				if (summary.origin !== "subagent") continue;
				const projections = summary.projectionValues;
				const scopedUsage = projections?.[MNEMON_SUBAGENT_TOKEN_USAGE_KEY];
				if (!isTokenUsage(scopedUsage)) continue;
				byId ??= { ...state.byId };
				byId[id] = {
					...summary,
					projectionValues: {
						...projections,
						tokenUsage: scopedUsage
					}
				};
			}
			const scoped = byId === void 0 ? state : {
				...state,
				byId
			};
			scopedSnapshots.set(state, scoped);
			return scoped;
		}
		/** Wrap the framework hook while preserving its selector/equality contract. */
		function createScopedUseSessions(useSessions) {
			return (selector, equal) => useSessions((state) => selector(scopeSubagentTokenUsage(state)), equal);
		}
		function lineageShadow(official) {
			return function MnemonSubagentHeaderLineage(props) {
				return (0, react.createElement)(official, {
					...props,
					useSessions: createScopedUseSessions(props.useSessions)
				});
			};
		}
		function officialLineage(entries) {
			return entries.find((entry) => (entry.options.priority ?? 0) === 0 && entry.locale === SUBAGENT_LOCALE && typeof entry.component === "function" && typeof entry.inject === "function");
		}
		/**
		* Shadow the released official single-slot entry at a lower priority. The
		* component and action factory are captured from the public slot ledger, so
		* Mnemon keeps the official UI, styles, locale, and navigation behavior.
		*/
		function mountSubagentTokenUsageOverride(ctx) {
			const slots = ctx.slots;
			let official;
			let disposeShadow;
			const reconcile = () => {
				const entries = slots.entries(SUBAGENT_LINEAGE_SLOT);
				if (official !== void 0 && entries.includes(official)) return;
				const disposePreviousShadow = disposeShadow;
				disposeShadow = void 0;
				official = void 0;
				disposePreviousShadow?.();
				official = officialLineage(entries);
				if (official === void 0) return;
				disposeShadow = slots.register({
					name: SUBAGENT_LINEAGE_SLOT,
					priority: MNEMON_SHADOW_PRIORITY,
					locale: official.locale,
					inject: official.inject,
					registrant: "dsh-mnemon/subagent-token-usage"
				}, lineageShadow(official.component));
			};
			const unsubscribe = slots.subscribe(SUBAGENT_LINEAGE_SLOT, reconcile);
			reconcile();
			return () => {
				unsubscribe();
				disposeShadow?.();
			};
		}
		//#endregion
		//#region src/client/page-client.tsx
		/** Optional default presentation kit; custom pages may use their own UI. */
		function MemorySourcePageFrame(props) {
			const translate = props.locale.startsWith("en") ? translateEn : translateZh;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(I18nContext.Provider, {
				value: translate,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(LocaleContext.Provider, {
					value: props.locale,
					children: props.children
				})
			});
		}
		/** Track revisions returned by reads as well as writes; never retry a conflict. */
		function createMemorySourcePageClient(management) {
			let revision = management.revision;
			let sequence = 0;
			let accepted = 0;
			async function request(mode, operation, input, confirmed = true) {
				const ticket = ++sequence;
				if (mode === "assist" && !management.assistance?.operations.includes(operation)) throw new Error("Host assistance is unavailable for this Source instance: " + operation);
				const result = mode === "assist" ? await management.assistance.execute(operation, input, {
					expectedRevision: revision,
					confirmed
				}) : mode === "read" ? await management.read(operation, input) : await management.mutate(operation, input, {
					confirmed: true,
					expectedRevision: revision
				});
				if (ticket >= accepted) {
					accepted = ticket;
					revision = result.revision;
				}
				return result.value;
			}
			return {
				canAssist: (operation) => management.assistance?.operations.includes(operation) === true,
				assist: (operation, input, confirmed) => request("assist", operation, input, confirmed),
				read: (operation, input = null) => request("read", operation, input),
				mutate: (operation, input, confirmed) => {
					if (confirmed !== true) return Promise.reject(/* @__PURE__ */ new Error("Source page mutation requires explicit confirmation"));
					return request("mutate", operation, input);
				}
			};
		}
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"sessions",
			"workspaces",
			"uiSession",
			"connection",
			"locale",
			"layout"
		];
		const INTERACTION_UNITS = {
			turnBar: {
				slot: "conversation.chat.turnTail",
				enabled: (value) => enabledOf(value, "turnBar"),
				register(ctx, namespace, translate) {
					return ctx.slots.register({
						name: "conversation.chat.turnTail",
						id: "dsh-mnemon/turn-tail",
						locale: namespace,
						inject: (sessionId) => ({
							...typeof sessionId === "string" && sessionId !== "" ? { sessionId } : {},
							connection: ctx.connection,
							localeRuntime: ctx.locale,
							t: translate
						})
					}, MnemonTurnTail);
				}
			},
			saveAction: {
				slot: "conversation.chat.assistant-actions",
				enabled: (value) => enabledOf(value, "saveAction"),
				register(ctx, namespace, translate, settings) {
					return ctx.slots.register({
						name: "conversation.chat.assistant-actions",
						id: "mnemon-save",
						order: 90,
						locale: namespace,
						inject: (sessionId) => ({
							...typeof sessionId === "string" && sessionId !== "" ? { sessionId } : {},
							connection: ctx.connection,
							settingsScope: settings,
							localeRuntime: ctx.locale,
							t: translate
						})
					}, MnemonSaveAction);
				}
			}
		};
		/** Ready snapshots default each interaction on; loading has no value and mounts nothing. */
		function enabledOf(value, key) {
			return isRecord(value) && value[key] !== false;
		}
		/**
		* Re-read Mnemon settings when DSH reports a newer revision of the `mnemon`
		* entry, such as a profile edit or another page's save. Pages without a Host
		* settings mirror (remote pages) never report one and keep their own reads.
		*/
		function followHostSettings(form, scopes) {
			let seen = form.getSnapshot().revision;
			return form.subscribe(() => {
				const revision = form.getSnapshot().revision;
				if (revision === void 0 || revision === seen) return;
				seen = revision;
				for (const scope of scopes) if (scope.getSnapshot().revision !== revision) scope.refresh();
			});
		}
		function mountSidebarMemoryView(ctx, settings, namespace, translate, seats) {
			const controller = new MnemonWorkspaceController();
			let launcher;
			const navigation = {
				open: () => {
					if (launcher === void 0) controller.open();
					else launcher.open();
				},
				close: () => {
					if (launcher === void 0) controller.close();
					else launcher.close();
				}
			};
			const sourcePageDirectory = createMemorySourcePageDirectory(ctx);
			const betterSidebarSeat = new MnemonBetterSidebarSeat();
			const nativeSidebarSeat = new MnemonNativeSidebarSeat();
			const slotName = "shell.overlay";
			const disposeView = ctx.slots.inject(slotName, () => ctx.slots.register({
				name: slotName,
				id: "mnemon",
				order: 30,
				label: () => translate("tab.label"),
				locale: namespace,
				children: {
					[MNEMON_SOURCE_PAGE_SLOT]: {
						kind: "list",
						scope: "root"
					},
					[MNEMON_COMPONENT_STATUS_SLOT]: {
						kind: "keyed",
						scope: "root"
					}
				},
				inject: () => ({
					connection: ctx.connection,
					settingsScope: settings,
					sessions: ctx.sessions,
					workspaces: ctx.workspaces,
					currentSession: ctx.uiSession.adapter.current,
					localeRuntime: ctx.locale,
					sourcePageDirectory,
					navigation,
					controller,
					betterSidebarSeat,
					nativeSidebarSeat,
					configuration: seats.configuration,
					componentChanges: seats.components,
					t: translate
				})
			}, MnemonSidebarWorkspaceHost));
			let disposeBetterSidebar;
			let withdrawWorkspace;
			let listening = false;
			let disposed = false;
			const openMemoryView = () => {
				navigation.open();
			};
			const dispose = () => {
				if (disposed) return;
				disposed = true;
				withdrawWorkspace?.();
				try {
					launcher?.dispose();
				} finally {
					if (listening) window.removeEventListener(MNEMON_ANCHOR_EVENT, openMemoryView);
					try {
						disposeBetterSidebar?.();
					} finally {
						disposeView();
					}
				}
			};
			try {
				disposeBetterSidebar = mountBetterSidebarTab(ctx, translate, betterSidebarSeat);
				if (typeof window !== "undefined" && typeof document !== "undefined") {
					window.addEventListener(MNEMON_ANCHOR_EVENT, openMemoryView);
					listening = true;
					launcher = mountMnemonSidebarNavigation(ctx, translate, controller, nativeSidebarSeat);
				}
				withdrawWorkspace = seats.workspace.provide(openMemoryView);
				return dispose;
			} catch (error) {
				dispose();
				throw error;
			}
		}
		/** DSH supplies the owning session; Source pages retain the same render contract. */
		function mountBuiltinMemoryView(ctx, settings, namespace, translate, seats) {
			const sourcePageDirectory = createMemorySourcePageDirectory(ctx);
			const disposeView = ctx.slots.inject("conversation.view", () => ctx.slots.register({
				name: "conversation.view",
				id: "mnemon",
				order: 30,
				label: () => translate("tab.label"),
				locale: namespace,
				children: {
					[MNEMON_SOURCE_PAGE_SLOT]: {
						kind: "list",
						scope: "root"
					},
					[MNEMON_COMPONENT_STATUS_SLOT]: {
						kind: "keyed",
						scope: "root"
					}
				},
				inject: (sessionId) => ({
					connection: ctx.connection,
					settingsScope: settings,
					sessionId,
					localeRuntime: ctx.locale,
					sourcePageDirectory,
					configuration: seats.configuration,
					componentChanges: seats.components,
					t: translate
				})
			}, MnemonBuiltinWorkspaceHost));
			if (typeof window === "undefined" || typeof document === "undefined") return disposeView;
			const selectMemoryTab = () => {
				const label = translate("tab.label").trim();
				const eligible = (candidate) => !candidate.hasAttribute("disabled") && candidate.getAttribute("aria-disabled") !== "true" && candidate.closest("[hidden], [aria-hidden=\"true\"]") === null;
				const conversations = [...document.querySelectorAll("[data-slot=\"main.conversation\"]")].filter(eligible);
				if (conversations.length !== 1) return false;
				const tabs = [...conversations[0].querySelectorAll("[role=\"tab\"]")].filter((candidate) => candidate.textContent?.trim() === label && eligible(candidate));
				if (tabs.length !== 1) return false;
				tabs[0].click();
				return true;
			};
			const openView = (event) => {
				const sessionId = event.detail?.sessionId;
				const mainSessionId = ctx.uiSession.adapter.current.getSnapshot().key;
				if (mainSessionId === void 0 || sessionId !== void 0 && sessionId !== mainSessionId) return;
				selectMemoryTab();
			};
			window.addEventListener(MNEMON_ANCHOR_EVENT, openView);
			let frame;
			const openFromPanel = () => {
				ctx.layout.selectPanel(null);
				let attempts = 0;
				const attempt = () => {
					frame = void 0;
					if (selectMemoryTab() || (attempts += 1) >= 30) return;
					frame = requestAnimationFrame(attempt);
				};
				if (frame !== void 0) cancelAnimationFrame(frame);
				frame = requestAnimationFrame(attempt);
			};
			const current = ctx.uiSession.adapter.current;
			const sessions = ctx.sessions.list;
			let withdrawWorkspace;
			const followSession = () => {
				const key = current.getSnapshot().key;
				const open = key !== void 0 && Object.hasOwn(sessions.getSnapshot().byId, key);
				if (open && withdrawWorkspace === void 0) withdrawWorkspace = seats.workspace.provide(openFromPanel);
				else if (!open && withdrawWorkspace !== void 0) {
					withdrawWorkspace();
					withdrawWorkspace = void 0;
				}
			};
			const unsubscribeSession = current.subscribe(followSession);
			const unsubscribeSessions = sessions.subscribe(followSession);
			followSession();
			return () => {
				unsubscribeSession();
				unsubscribeSessions();
				withdrawWorkspace?.();
				if (frame !== void 0) cancelAnimationFrame(frame);
				window.removeEventListener(MNEMON_ANCHOR_EVENT, openView);
				disposeView();
			};
		}
		/** Mount the memory workspace plus the optional in-conversation interaction surfaces. */
		function apply(rawContext) {
			const ctx = rawContext;
			const settings = new MnemonSettingsScope(ctx.connection, MNEMON_SETTINGS_NAMESPACE);
			const interactionSettings = new MnemonSettingsScope(ctx.connection, MNEMON_UI_SETTINGS_NAMESPACE);
			const seats = {
				configuration: new MnemonActionSeat(),
				workspace: new MnemonActionSeat(),
				components: new MnemonChangeSignal()
			};
			const namespace = "mnemon";
			ctx.effect(() => ctx.locale.register(namespace, {
				zh,
				en
			}), "dsh-mnemon: locale dictionaries");
			const translate = ctx.locale.bind(namespace);
			ctx.inject(["pluginNavigation"], (inner) => {
				inner.effect(() => seats.configuration.provide(() => {
					inner.pluginNavigation.openBundle(MNEMON_PACKAGE_NAME);
				}), "dsh-mnemon: configuration entry");
			});
			ctx.inject(["remote"], (inner) => {
				inner.effect(() => {
					const disposers = [inner.remote.$on("plugin-manager/changed", seats.components.bump), inner.on("connection/reset", seats.components.bump)];
					return () => {
						for (const dispose of disposers) dispose();
					};
				}, "dsh-mnemon: component changes");
			});
			ctx.inject(["configForms"], (inner) => {
				inner.effect(() => followHostSettings(inner.configForms.get(MNEMON_SETTINGS_NAMESPACE), [settings, interactionSettings]), "dsh-mnemon: DSH settings revisions");
			});
			ctx.slots.inject("conversation.session.header.lineage", () => mountSubagentTokenUsageOverride(ctx));
			let activeMemoryWorkspace;
			const reconcileMemoryWorkspace = () => {
				const snapshot = settings.getSnapshot();
				const mode = snapshot.status === "loading" || snapshot.value?.tabEnabled === false ? void 0 : normalizeDisplayMode(snapshot.value?.displayMode);
				if (activeMemoryWorkspace?.mode === mode) return;
				activeMemoryWorkspace?.dispose();
				activeMemoryWorkspace = mode === void 0 ? void 0 : {
					mode,
					dispose: mode === "builtin" ? mountBuiltinMemoryView(ctx, settings, namespace, translate, seats) : mountSidebarMemoryView(ctx, settings, namespace, translate, seats)
				};
			};
			ctx.effect(() => {
				const unsubscribe = settings.subscribe(reconcileMemoryWorkspace);
				reconcileMemoryWorkspace();
				return () => {
					unsubscribe();
					activeMemoryWorkspace?.dispose();
					activeMemoryWorkspace = void 0;
				};
			}, "dsh-mnemon: memory workspace entry");
			const componentSettingsDirectory = createComponentSettingsDirectory(ctx);
			const configurationServices = () => ({
				componentSettingsDirectory,
				scope: settings,
				interactionScope: interactionSettings,
				connection: ctx.connection,
				sessions: ctx.sessions,
				workspaces: ctx.workspaces,
				currentSession: ctx.uiSession.adapter.current,
				localeRuntime: ctx.locale,
				componentChanges: seats.components,
				t: translate
			});
			ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
				name: "plugins.bundle.config",
				key: MNEMON_PACKAGE_NAME,
				locale: namespace,
				children: { [MNEMON_COMPONENT_SETTINGS_SLOT]: {
					kind: "keyed",
					scope: "root"
				} },
				inject: configurationServices
			}, MnemonSettingsHost));
			const renderContributed = (packageName, owner) => renderComponentRegion(ctx, MNEMON_COMPONENT_SETTINGS_SLOT, packageName, owner);
			for (const { rowId, packageName } of STARTER_COMPONENT_ROWS) ctx.slots.inject("plugins.row.config", () => ctx.slots.register({
				name: "plugins.row.config",
				key: `${MNEMON_PACKAGE_NAME}#${rowId}`,
				locale: namespace,
				inject: () => ({
					...configurationServices(),
					component: packageName,
					renderContributed
				})
			}, MnemonComponentRowHost));
			ctx.effect(() => installShippedComponentSettings(ctx, {
				scope: settings,
				connection: ctx.connection,
				t: translate
			}), "dsh-mnemon: shipped component settings");
			ctx.effect(() => installShippedComponentStatus(ctx), "dsh-mnemon: shipped component status");
			ctx.slots.inject("plugins.detail.actions", () => ctx.slots.register({
				name: "plugins.detail.actions",
				id: "dsh-mnemon/open-workspace",
				locale: namespace,
				inject: () => ({
					workspace: seats.workspace,
					t: translate
				})
			}, MnemonPluginActions));
			const active = /* @__PURE__ */ new Map();
			const reconcile = () => {
				const value = interactionSettings.getSnapshot().value;
				for (const key of Object.keys(INTERACTION_UNITS)) {
					const unit = INTERACTION_UNITS[key];
					const enabled = unit.enabled(value);
					if (enabled && !active.has(key)) active.set(key, ctx.slots.inject(unit.slot, () => unit.register(ctx, namespace, translate, settings)));
					else if (!enabled && active.has(key)) {
						active.get(key)();
						active.delete(key);
					}
				}
			};
			ctx.effect(() => {
				const unsubscribe = interactionSettings.subscribe(reconcile);
				reconcile();
				return () => {
					unsubscribe();
					for (const dispose of [...active.values()].reverse()) dispose();
					active.clear();
				};
			}, "dsh-mnemon: interaction surfaces");
		}
		//#endregion
		exports.EmptyState = EmptyState;
		exports.I18nContext = I18nContext;
		exports.IconChevronLeftOutline14 = IconChevronLeftOutline14;
		exports.LocaleContext = LocaleContext;
		exports.MNEMON_COMPONENT_SETTINGS_SLOT = MNEMON_COMPONENT_SETTINGS_SLOT;
		exports.MNEMON_COMPONENT_STATUS_SLOT = MNEMON_COMPONENT_STATUS_SLOT;
		exports.MNEMON_SOURCE_CONFIGURATION_MUTATE = MNEMON_SOURCE_CONFIGURATION_MUTATE;
		exports.MNEMON_SOURCE_CONFIGURATION_READ = MNEMON_SOURCE_CONFIGURATION_READ;
		exports.MNEMON_SOURCE_PAGE_SLOT = MNEMON_SOURCE_PAGE_SLOT;
		exports.MemorySourcePageFrame = MemorySourcePageFrame;
		exports.MnemonDialog = MnemonDialog;
		exports.MnemonLogo = MnemonLogo;
		exports.PageHeader = PageHeader;
		exports.PageSpinner = PageSpinner;
		exports.ProgressiveFooter = ProgressiveFooter;
		exports.SearchField = SearchField;
		exports.SectionSpinner = SectionSpinner;
		exports.SelectField = SelectField;
		exports.SidebarModal = SidebarModal;
		exports.TaskAgentTag = TaskAgentTag;
		exports.WriteReceipt = WriteReceipt;
		exports.appearanceClass = appearanceClass;
		exports.apply = apply;
		exports.createMemorySourcePageClient = createMemorySourcePageClient;
		exports.humanBytes = humanBytes;
		exports.inject = inject;
		exports.installMemoryComponentUI = installMemoryComponentUI;
		exports.installMemorySourceUI = installMemorySourceUI;
		exports.memoryPageStyles = memoryPageStyles;
		exports.memorySidebarStyles = memorySidebarStyles;
		exports.memorySourcePageEntryId = memorySourcePageEntryId;
		exports.message = message;
		exports.parseBranchesInput = parseBranchesInput;
		exports.short = short;
		exports.translateEn = translateEn;
		exports.translateZh = translateZh;
		exports.useLocale = useLocale;
		exports.useRequestVersion = useRequestVersion;
		exports.useT = useT;
		exports.writeOutcome = writeOutcome;
		return module.exports;
	}
});
