window.__ModuleLoader__.load({
	id: "dsh-mnemon-source-memory-spaces",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let dsh_mnemon_client = require("dsh-mnemon/client");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region presentation/locales.json
		var zh = {
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
		var en = {
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
		//#region \0source-css:/home/runner/work/dsh-mnemon/dsh-mnemon/plugins/dsh-mnemon-source-memory-spaces/presentation/page.module.css.mjs
		const css$2 = ".IIa07q_entityHeading>span,.IIa07q_inspectorHeading>span{color:var(--mn-faint);font-size:12px;font-weight:500;line-height:18px}.IIa07q_memoryHeaderActions{align-items:center;gap:8px;display:flex}.IIa07q_memoryHeaderActions>button{white-space:nowrap}.IIa07q_asyncRegion{min-width:0;position:relative}.IIa07q_asyncResults{min-width:0;min-height:120px;position:relative}.IIa07q_asyncPlaceholder{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);min-height:220px;color:var(--mn-faint);place-items:center;display:grid;position:relative}.IIa07q_muted{color:var(--mn-faint);padding:16px 0;font-size:13px}.IIa07q_readSources{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);gap:8px;margin:0 0 16px;padding:12px 14px;display:grid}.IIa07q_readSources>header{justify-content:space-between;align-items:flex-start;gap:16px;display:flex}.IIa07q_readSources>header>div{gap:2px;display:grid}.IIa07q_readSources>header strong{font-size:13px;font-weight:500;line-height:20px}.IIa07q_readSources>header p{max-width:92ch;color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_readSources>header>button{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-sm);min-height:28px;color:var(--mn-text);cursor:pointer;background:0 0;flex:none;padding:0 10px;font-size:12px;line-height:18px}.IIa07q_readSources>header>button:hover{background:var(--mn-hover)}.IIa07q_readSources>header>button[data-selected]{background:var(--mn-fill);border-color:#0000}.IIa07q_readSources>div{grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:8px;display:grid}.IIa07q_readSourceCard,.IIa07q_bodyCard,.IIa07q_metadataList>label{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-md);color:var(--mn-text);background:0 0}.IIa07q_readSourceCard{text-align:left;grid-template-columns:6px minmax(0,1fr) auto;align-items:center;gap:10px;min-width:0;min-height:56px;padding:8px 10px 8px 12px;display:grid}button.IIa07q_readSourceCard{cursor:pointer}button.IIa07q_readSourceCard:hover{background:var(--mn-hover)}.IIa07q_readSourceCard[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_readSourceSignal{background:var(--mn-success);border-radius:50%;width:6px;height:6px}.IIa07q_readSourceCard[data-mode=projection] .IIa07q_readSourceSignal,.IIa07q_readSourceCard[data-mode=enumerable] .IIa07q_readSourceSignal{background:var(--mn-success)}.IIa07q_readSourceCard[data-mode=query-only] .IIa07q_readSourceSignal{background:var(--mn-warn)}.IIa07q_readSourceCard[data-status=unavailable] .IIa07q_readSourceSignal{background:var(--mn-danger)}.IIa07q_readSourceCard[data-status=unsupported] .IIa07q_readSourceSignal,.IIa07q_readSourceCard[data-status=empty] .IIa07q_readSourceSignal{background:var(--mn-idle)}.IIa07q_readSourceCard[data-status=unsupported]{color:var(--mn-faint)}.IIa07q_readSourceIdentity,.IIa07q_readSourceState{gap:2px;min-width:0;display:grid}.IIa07q_readSourceIdentity strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}.IIa07q_readSourceMeta{align-items:center;gap:6px;min-width:0;display:flex}.IIa07q_readSourceMeta>small{color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_readSourceState{text-align:right;justify-items:end}.IIa07q_readSourceState em{width:fit-content;color:var(--mn-muted);background:var(--mn-fill);white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:11px;font-style:normal;font-weight:500;line-height:17px}.IIa07q_readSourceCard[data-status=unsupported] .IIa07q_readSourceState em{border:.5px solid var(--mn-field-line);color:var(--mn-faint);background:0 0}.IIa07q_readSourceState small{color:var(--mn-faint);white-space:nowrap;font-size:11px;line-height:14px}.IIa07q_bodyDirectory{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:12px;padding:16px;position:relative}.IIa07q_bodyDirectoryHeader{flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px;display:flex}.IIa07q_bodyDirectoryHeader>div:first-child{flex:260px;min-width:0}.IIa07q_bodyDirectoryHeader h3{margin:0;font-size:13px;font-weight:500;line-height:20px}.IIa07q_bodyDirectoryHeader p{color:var(--mn-faint);margin:2px 0 0;font-size:12px;line-height:18px}.IIa07q_bodyDirectoryPath{max-width:100%;color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;margin-top:4px;font-size:11px;line-height:16px;display:block;overflow:hidden}.IIa07q_bodyDirectoryControls{flex:none;justify-content:flex-end;align-items:center;gap:8px;padding-right:28px;display:flex}.IIa07q_bodyDirectoryControls>strong{color:var(--mn-muted);background:var(--mn-fill);font-variant-numeric:tabular-nums;border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_bodyGrid{grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:8px;display:grid}.IIa07q_bodyDirectoryEmpty{border-radius:var(--dsw-radius-md);min-height:96px;color:var(--mn-muted);background:var(--mn-fill);grid-column:1/-1;justify-content:center;align-items:center;gap:12px;display:flex}.IIa07q_bodyDirectoryEmpty>span{color:var(--mn-faint);font-size:24px}.IIa07q_bodyDirectoryEmpty strong{color:var(--mn-text);font-weight:500;display:block}.IIa07q_bodyDirectoryEmpty p{color:var(--mn-faint);margin:2px 0 0;font-size:12px}.IIa07q_bodyCard{--mn-body-accent:var(--mn-success);min-width:0;padding:12px 14px;transition:border-color .16s,background-color .16s}.IIa07q_bodyCard:not([data-active]){background:var(--mn-fill);border-color:#0000}.IIa07q_bodyCard[data-reconnectable]{cursor:pointer}.IIa07q_bodyCard[data-reconnectable]:hover{border-color:var(--mn-field-line)}.IIa07q_bodyCard[data-reconnectable]:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--mn-focus);outline-offset:2px}.IIa07q_bodySignal{background:var(--mn-idle);border-radius:50%;width:6px;height:6px}.IIa07q_bodyCard[data-active] .IIa07q_bodySignal{background:var(--mn-body-accent)}.IIa07q_bodyCard:not([data-healthy]) .IIa07q_bodySignal{background:var(--mn-danger)}.IIa07q_bodyCard[data-status-loading] .IIa07q_bodySignal{background:var(--mn-idle)}.IIa07q_bodyCard[data-reconnecting] .IIa07q_bodySignal{box-sizing:border-box;border:1.5px solid color-mix(in srgb, var(--mn-faint) 25%, transparent);border-top-color:var(--mn-faint);background:0 0;width:8px;height:8px;animation:.9s linear infinite IIa07q_mnemon-spin}.IIa07q_bodyHealth{color:var(--mn-success);font-size:12px;line-height:18px}.IIa07q_bodyCard:not([data-healthy]) .IIa07q_bodyHealth{color:var(--mn-danger)}.IIa07q_bodyCard[data-status-loading] .IIa07q_bodyHealth{color:var(--mn-faint)}.IIa07q_mnemonDefaultBadge{width:fit-content;color:var(--mn-accent);background:color-mix(in srgb, var(--mn-accent) 10%, transparent);white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_providerBadge{width:fit-content;max-width:100%;color:var(--mn-muted);background:var(--mn-fill);text-align:center;text-overflow:ellipsis;vertical-align:middle;white-space:nowrap;border-radius:999px;flex:none;justify-content:center;align-items:center;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;display:inline-flex;overflow:hidden}.IIa07q_providerBadge,.IIa07q_readSourceCard,.IIa07q_bodyCard,.IIa07q_metadataList>label,.IIa07q_graphNode,.IIa07q_providerBadge[data-provider=mnemon-native],.IIa07q_readSourceCard[data-provider=mnemon-native],.IIa07q_bodyCard[data-provider=mnemon-native],.IIa07q_metadataList>label[data-provider=mnemon-native],.IIa07q_graphNode[data-provider=mnemon-native]{--mn-provider-color:#64748b}.IIa07q_providerBadge[data-provider=openviking],.IIa07q_readSourceCard[data-provider=openviking],.IIa07q_bodyCard[data-provider=openviking],.IIa07q_metadataList>label[data-provider=openviking],.IIa07q_graphNode[data-provider=openviking]{--mn-provider-color:#3b82d0}.IIa07q_providerBadge[data-provider=honcho],.IIa07q_readSourceCard[data-provider=honcho],.IIa07q_bodyCard[data-provider=honcho],.IIa07q_metadataList>label[data-provider=honcho],.IIa07q_graphNode[data-provider=honcho]{--mn-provider-color:#c44fcf}.IIa07q_providerBadge[data-provider=mem0],.IIa07q_readSourceCard[data-provider=mem0],.IIa07q_bodyCard[data-provider=mem0],.IIa07q_metadataList>label[data-provider=mem0],.IIa07q_graphNode[data-provider=mem0]{--mn-provider-color:#8b5cf6}.IIa07q_providerBadge[data-provider=hindsight],.IIa07q_readSourceCard[data-provider=hindsight],.IIa07q_bodyCard[data-provider=hindsight],.IIa07q_metadataList>label[data-provider=hindsight],.IIa07q_graphNode[data-provider=hindsight]{--mn-provider-color:#0891b2}.IIa07q_providerBadge[data-provider=holographic],.IIa07q_readSourceCard[data-provider=holographic],.IIa07q_bodyCard[data-provider=holographic],.IIa07q_metadataList>label[data-provider=holographic],.IIa07q_graphNode[data-provider=holographic]{--mn-provider-color:#6366d9}.IIa07q_providerBadge[data-provider=retaindb],.IIa07q_readSourceCard[data-provider=retaindb],.IIa07q_bodyCard[data-provider=retaindb],.IIa07q_metadataList>label[data-provider=retaindb],.IIa07q_graphNode[data-provider=retaindb]{--mn-provider-color:#d08a28}.IIa07q_providerBadge[data-provider=byterover],.IIa07q_readSourceCard[data-provider=byterover],.IIa07q_bodyCard[data-provider=byterover],.IIa07q_metadataList>label[data-provider=byterover],.IIa07q_graphNode[data-provider=byterover]{--mn-provider-color:#0f9a83}.IIa07q_providerBadge[data-provider=supermemory],.IIa07q_readSourceCard[data-provider=supermemory],.IIa07q_bodyCard[data-provider=supermemory],.IIa07q_metadataList>label[data-provider=supermemory],.IIa07q_graphNode[data-provider=supermemory]{--mn-provider-color:#df4d72}.IIa07q_bodySwitch{min-height:28px;color:var(--mn-faint);cursor:pointer;background:0 0;border:0;align-items:center;gap:8px;padding:0;font-size:12px;line-height:18px;display:flex}.IIa07q_bodySwitchTrack{box-sizing:border-box;background:var(--mn-line-strong);border-radius:999px;flex:none;width:36px;height:20px;padding:2px;transition:background-color .12s;position:relative}.IIa07q_bodySwitchTrack i{background:var(--dsw-alias-label-primary-foreground);border-radius:50%;width:16px;height:16px;transition:transform .12s;display:block}.IIa07q_bodySwitch:hover,.IIa07q_bodySwitch[aria-checked=true]{color:var(--mn-muted)}.IIa07q_bodySwitch[aria-checked=true] .IIa07q_bodySwitchTrack{background:var(--dsw-alias-brand-primary)}.IIa07q_bodySwitch[aria-checked=true] .IIa07q_bodySwitchTrack i{transform:translate(16px)}.IIa07q_bodyCardActions{align-items:center;gap:8px;display:flex}.IIa07q_bodyCreateForm{gap:16px;padding-top:0}.IIa07q_createSection{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);gap:12px;padding:14px 16px;display:grid}.IIa07q_createSectionHeading{align-items:flex-start;gap:10px;display:flex}.IIa07q_createSectionHeading>span{min-width:22px;height:22px;color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;flex:none;place-items:center;padding:0 6px;font-size:11px;font-weight:500;line-height:1;display:grid}.IIa07q_createSectionHeading>div{gap:2px;min-width:0;display:grid}.IIa07q_createSectionHeading strong{color:var(--mn-text);font-size:14px;font-weight:500;line-height:22px}.IIa07q_createSectionHeading small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_createIdentityGrid{grid-template-columns:minmax(0,1fr);align-items:stretch;gap:12px;display:grid}.IIa07q_createIdentityGrid>label{align-content:start}.IIa07q_createIdentityGrid textarea{min-height:72px}.IIa07q_strategyForm{gap:16px;padding-top:0}.IIa07q_strategyLoading{border-radius:var(--dsw-radius-md);min-height:88px;color:var(--mn-faint);background:var(--mn-fill);justify-content:center;align-items:center;font-size:12px;display:flex;position:relative}.IIa07q_strategyLoading .IIa07q_sectionSpinner{top:10px;right:10px}.IIa07q_placementMode{border:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0;padding:0;display:grid}.IIa07q_placementMode legend{color:var(--mn-muted);margin-bottom:6px;font-size:12px;font-weight:500;line-height:18px}.IIa07q_placementMode label{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-md);cursor:pointer;grid-template-columns:16px minmax(0,1fr);align-items:center;gap:10px;min-width:0;padding:12px;display:grid;position:relative}.IIa07q_placementMode label:hover{background:var(--mn-hover)}.IIa07q_placementMode label[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_placementMode label[data-disabled]{cursor:not-allowed;opacity:.5}.IIa07q_placementMode input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_placementMode span{gap:2px;display:grid}.IIa07q_placementMode strong{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_placementMode strong em{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;margin-left:6px;padding:1px 8px;font-size:11px;font-style:normal;font-weight:500;line-height:17px}.IIa07q_placementMode small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_placementPolicy{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-md);gap:10px;margin:0;padding:12px 14px;display:grid}.IIa07q_placementPolicyHeading{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.IIa07q_placementPolicyHeading>div{gap:2px;display:grid}.IIa07q_placementPolicyHeading strong{font-size:13px;font-weight:500;line-height:20px}.IIa07q_placementPolicyHeading small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_placementPolicyHeading>span{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_placementRuleGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;display:grid}.IIa07q_capabilityRules{border:0;flex-wrap:wrap;gap:6px;margin:0;padding:0;display:flex}.IIa07q_capabilityRules legend{width:100%;color:var(--mn-faint);margin-bottom:4px;font-size:12px;line-height:18px}.IIa07q_capabilityRules label{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-sm);width:fit-content;min-height:28px;color:var(--mn-muted);cursor:pointer;align-items:center;gap:6px;padding:0 10px;font-size:12px;display:flex;position:relative}.IIa07q_capabilityRules label:hover{background:var(--mn-hover)}.IIa07q_capabilityRules label[data-selected]{border-color:var(--mn-field-line);color:var(--mn-text);background:var(--mn-fill)}.IIa07q_capabilityRules input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_placementCandidates{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;display:grid}.IIa07q_placementCandidates>span,.IIa07q_placementCandidates>label{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-md);grid-template-columns:28px minmax(0,1fr) 16px;align-items:center;gap:10px;min-width:0;padding:8px 10px;display:grid;position:relative}.IIa07q_placementCandidates>label{cursor:pointer}.IIa07q_placementCandidates>label:hover{background:var(--mn-hover)}.IIa07q_placementCandidates>[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_placementCandidates>label[data-disabled]{cursor:not-allowed;opacity:.5}.IIa07q_placementCandidates input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_placementCandidates>span>span:not(.IIa07q_candidateIcon),.IIa07q_placementCandidates>label>span:not(.IIa07q_candidateIcon){gap:2px;min-width:0;display:grid}.IIa07q_placementCandidates strong{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_placementCandidates small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_providerChoice{border:0;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0;padding:0;display:grid}.IIa07q_providerChoice legend{color:var(--mn-muted);margin-bottom:6px;font-size:12px;font-weight:500;line-height:18px}.IIa07q_providerChoice label{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-md);cursor:pointer;grid-template-columns:32px minmax(0,1fr) 16px;align-items:center;gap:10px;min-width:0;padding:10px 12px;display:grid;position:relative}.IIa07q_providerChoice label:hover{background:var(--mn-hover)}.IIa07q_providerChoice label[data-native]{grid-column:1/-1}.IIa07q_providerChoice label[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_providerChoice label[data-disabled]{cursor:not-allowed;opacity:.5}.IIa07q_providerChoice input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_providerChoice span{gap:2px;display:grid}.IIa07q_providerChoice strong{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_providerChoice strong em{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;margin-left:6px;padding:1px 8px;font-size:11px;font-style:normal;font-weight:500;line-height:17px}.IIa07q_providerChoice label[data-selected] strong em{background:var(--mn-layer-1)}.IIa07q_providerChoice small{color:var(--mn-faint);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:12px;line-height:18px;display:-webkit-box;overflow:hidden}.IIa07q_providerChoiceIcon,.IIa07q_candidateIcon,.IIa07q_providerFieldIcon{box-sizing:border-box;border:.5px solid var(--mn-line-strong);background:var(--mn-layer-1);place-items:center;display:grid;overflow:hidden}.IIa07q_providerChoiceIcon{border-radius:var(--dsw-radius-sm);width:32px;height:32px;padding:4px}.IIa07q_candidateIcon{border-radius:var(--dsw-radius-sm);width:28px;height:28px;padding:4px}.IIa07q_providerFieldIcon{border-radius:var(--dsw-radius-sm);flex:none;width:32px;height:32px;padding:4px}.IIa07q_providerChoiceIcon>img,.IIa07q_providerChoiceIcon>svg,.IIa07q_candidateIcon>img,.IIa07q_candidateIcon>svg,.IIa07q_providerFieldIcon>img,.IIa07q_providerFieldIcon>svg{object-fit:contain;border-radius:4px;width:100%;height:100%;display:block}.IIa07q_choiceControl{box-sizing:border-box;border:1px solid var(--mn-field-line);background:var(--mn-layer-1);border-radius:4px;flex:none;place-items:center;width:16px;height:16px;display:grid;position:relative}.IIa07q_choiceControl[data-kind=radio]{border-radius:50%}[data-selected]>.IIa07q_choiceControl{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary)}[data-selected]>.IIa07q_choiceControl[data-kind=check]:after{border-bottom:1.5px solid var(--dsw-alias-label-primary-foreground);border-left:1.5px solid var(--dsw-alias-label-primary-foreground);content:\"\";width:7px;height:4px;transform:translateY(-1px)rotate(-45deg)}[data-selected]>.IIa07q_choiceControl[data-kind=radio]:after{content:\"\";background:var(--dsw-alias-label-primary-foreground);border-radius:50%;width:6px;height:6px}.IIa07q_placementMode label:has(input:focus-visible),.IIa07q_providerChoice label:has(input:focus-visible),.IIa07q_capabilityRules label:has(input:focus-visible),.IIa07q_placementCandidates label:has(input:focus-visible){outline:var(--dsw-focus-ring-width,2px) solid var(--mn-focus);outline-offset:1px}.IIa07q_providerFields{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-md);gap:10px;padding:12px 14px;display:grid}.IIa07q_providerFieldHeading{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.IIa07q_providerFieldIdentity{align-items:center;gap:10px;min-width:0;display:flex}.IIa07q_providerFieldIdentity>div{gap:2px;min-width:0;display:grid}.IIa07q_providerFieldHeading strong{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_providerFieldHeading small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_providerFieldHeading>span{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_providerFields details{min-width:0}.IIa07q_providerFields summary{width:fit-content;color:var(--mn-muted);cursor:pointer;font-size:12px;line-height:18px}.IIa07q_providerFields summary:hover{color:var(--mn-text)}.IIa07q_providerEnableHint{color:var(--mn-faint);margin-top:8px;font-size:12px;line-height:18px;display:block}.IIa07q_providerAdvancedGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:8px;display:grid}.IIa07q_providerFieldControl .IIa07q_providerSecretClear{color:var(--mn-muted);cursor:pointer;align-items:center;gap:6px;font-size:12px;font-weight:400;display:flex}.IIa07q_providerWriteHint{color:var(--mn-faint);margin-top:4px;font-size:12px;line-height:18px;display:block}.IIa07q_placementReceipt{border-radius:var(--dsw-radius-sm);min-width:0;color:var(--mn-muted);background:var(--mn-fill);align-items:flex-start;gap:8px;margin:8px 0;padding:8px 10px;display:flex}.IIa07q_placementReceipt>span{flex:none;font-size:12px}.IIa07q_placementReceipt>div{grid-template-columns:minmax(0,1fr) auto;gap:2px 8px;min-width:0;display:grid}.IIa07q_placementReceipt strong,.IIa07q_placementReceipt small{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.IIa07q_placementReceipt strong{color:var(--mn-text);font-size:12px;font-weight:500;line-height:18px}.IIa07q_placementReceipt small{color:var(--mn-faint);font-size:11px;line-height:18px}.IIa07q_placementReceipt p{color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;grid-column:1/-1;margin:0;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_bodyCard>p{min-height:18px;color:var(--mn-muted);margin:8px 0;font-size:13px;line-height:20px}.IIa07q_bodyCard footer{border-top:.5px solid var(--mn-line);min-width:0;color:var(--mn-faint);flex-wrap:nowrap;gap:4px 12px;padding-top:8px;font-size:12px;line-height:18px;display:flex;overflow:hidden}.IIa07q_bodyFooterBlock{text-overflow:ellipsis;white-space:nowrap;flex:0 auto;min-width:0;display:block;overflow:hidden}.IIa07q_bodyFooterGrow{flex:auto}.IIa07q_graphLayout{grid-template-columns:minmax(0,1fr) minmax(240px,280px);gap:12px;display:grid}.IIa07q_graphPanel,.IIa07q_graphInspector{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg)}.IIa07q_graphPanel{min-width:0;position:relative;overflow:hidden}.IIa07q_graphToolbar,.IIa07q_graphFooter{min-height:44px;color:var(--mn-faint);justify-content:space-between;align-items:center;gap:16px;padding:0 14px;font-size:12px;line-height:18px;display:flex}.IIa07q_graphToolbar{border-bottom:.5px solid var(--mn-line)}.IIa07q_graphToolbar>div:first-child{align-items:center;gap:8px;display:flex}.IIa07q_graphToolbar small{color:var(--mn-faint)}.IIa07q_liveDot{background:var(--mn-success);border-radius:50%;width:6px;height:6px}.IIa07q_graphLegend{flex-wrap:wrap;justify-content:flex-end;gap:4px 12px;display:flex}.IIa07q_graphLegend span{align-items:center;gap:6px;display:flex}.IIa07q_graphLegend span:before{content:\"\";background:var(--edge-color);border-radius:2px;width:14px;height:2px}.IIa07q_graphLegend [data-edge=temporal]{--edge-color:#87909f}.IIa07q_graphLegend [data-edge=scope]{--edge-color:#708199}.IIa07q_graphLegend [data-edge=scope]:before{background:repeating-linear-gradient(90deg, var(--edge-color) 0 4px, transparent 4px 7px)}.IIa07q_graphLegend [data-edge=semantic]{--edge-color:#4d7cfe}.IIa07q_graphLegend [data-edge=causal]{--edge-color:#ef6b5b}.IIa07q_graphLegend [data-edge=entity]{--edge-color:#22a879}.IIa07q_graphViewport{min-height:clamp(390px,42vw,560px);position:relative;overflow:hidden}.IIa07q_graphCanvasControls{z-index:2;border-radius:var(--dsw-radius-md);background:var(--dsw-specific-menu,var(--mn-layer-2));box-shadow:var(--dsw-elevation-soft);backdrop-filter:var(--dsw-menu-backdrop-filter);align-items:center;gap:4px;padding:4px;display:flex;position:absolute;top:10px;right:10px}.IIa07q_graphCanvasControls span{color:var(--mn-faint);align-items:center;gap:6px;padding:0 6px;font-size:12px;display:flex}.IIa07q_graphCanvasControls span i{background:var(--mn-accent);border-radius:50%;width:6px;height:6px}.IIa07q_graphCanvasControls button{border-radius:var(--dsw-radius-sm);min-height:28px;color:var(--mn-muted);cursor:pointer;background:0 0;border:0;padding:0 10px;font-size:12px}.IIa07q_graphCanvasControls button:hover{color:var(--mn-text);background:var(--mn-hover)}.IIa07q_graphCanvasControls button[data-active]{color:var(--mn-text);background:var(--mn-fill)}.IIa07q_graphSvg{touch-action:pan-y pinch-zoom;user-select:none;width:100%;height:clamp(390px,42vw,560px);display:block}.IIa07q_graphBackdrop{fill:var(--mn-layer-1)}.IIa07q_graphGridLine{stroke:var(--mn-line);stroke-width:.6px;opacity:.5}.IIa07q_graphEdge{fill:none;stroke:#87909f;stroke-width:1px;opacity:.32;vector-effect:non-scaling-stroke}.IIa07q_graphEdge[data-edge=scope]{stroke:#708199;stroke-dasharray:4 5;opacity:.28}.IIa07q_graphEdge[data-edge=semantic]{stroke:#4d7cfe;opacity:.48}.IIa07q_graphEdge[data-edge=causal]{stroke:#ef6b5b;opacity:.52}.IIa07q_graphEdge[data-edge=entity]{stroke:#22a879;stroke-width:1.45px;opacity:.78}.IIa07q_graphNode{--node:#8290a8;cursor:grab;touch-action:none;outline:none}.IIa07q_graphNode[data-dragging]{cursor:grabbing}.IIa07q_graphNode[data-category=decision]{--node:#ef8354}.IIa07q_graphNode[data-category=preference]{--node:#a879e1}.IIa07q_graphNode[data-category=fact]{--node:#4d7cfe}.IIa07q_graphNode[data-category=insight]{--node:#19a77d}.IIa07q_graphNode[data-category=context]{--node:#d8a624}.IIa07q_graphNode[data-kind=space]{--node:var(--mn-provider-color)}.IIa07q_graphNode[data-kind=entity]{--node:#2b9db9}.IIa07q_nodeHalo{fill:color-mix(in srgb, var(--node) 18%, var(--mn-layer-1));stroke:color-mix(in srgb, var(--node) 60%, var(--mn-layer-1));stroke-width:1.5px;transition:r .16s}.IIa07q_nodeCore{fill:var(--node)}.IIa07q_nodeLabel{fill:var(--mn-muted);font:11px var(--mn-sans);pointer-events:auto}.IIa07q_nodeBodyLabel{fill:var(--mn-faint);font:500 11px var(--mn-sans);pointer-events:auto}.IIa07q_graphSvg[data-density=sparse] .IIa07q_nodeLabel{font-size:12px}.IIa07q_graphNode:hover .IIa07q_nodeHalo,.IIa07q_graphNode:focus .IIa07q_nodeHalo,.IIa07q_graphNode[data-selected] .IIa07q_nodeHalo{fill:color-mix(in srgb, var(--node) 28%, var(--mn-layer-1));stroke:var(--node)}.IIa07q_graphNode[data-selected] .IIa07q_nodeLabel{fill:var(--mn-text);font-weight:500}.IIa07q_graphFooter{border-top:.5px solid var(--mn-line);min-height:40px;color:var(--mn-faint)}.IIa07q_graphInspector{min-width:0;min-height:calc(clamp(390px,42vw,560px) + 84px);padding:16px;overflow:hidden}.IIa07q_inspectorEmpty{text-align:center;flex-direction:column;justify-content:center;align-items:center;height:100%;display:flex}.IIa07q_inspectorLogo{border-radius:var(--dsw-radius-lg);opacity:.72;width:48px;height:48px;margin-bottom:12px}.IIa07q_inspectorEmpty h3{margin:6px 0 2px;font-size:14px;font-weight:500;line-height:22px}.IIa07q_inspectorEmpty p{color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_inspectorHeading{justify-content:space-between;align-items:center;display:flex}.IIa07q_inspectorHeading button{border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--mn-muted);cursor:pointer;background:0 0;border:0;place-items:center;display:grid}.IIa07q_inspectorHeading button:hover{background:var(--mn-hover)}.IIa07q_inspectorChips{flex-wrap:wrap;align-items:center;gap:6px;margin-top:20px;display:flex}.IIa07q_categoryChip{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;display:inline-flex}.IIa07q_inspectorTitleRow{align-items:flex-start;gap:8px;min-width:0;margin:12px 0 20px;display:flex}.IIa07q_inspectorTitle{overflow-wrap:anywhere;white-space:pre-wrap;-webkit-line-clamp:6;-webkit-box-orient:vertical;flex:1;min-width:0;margin:0;font-size:14px;font-weight:400;line-height:22px;display:-webkit-box;overflow:hidden}.IIa07q_inspectorEye{border:.5px solid var(--mn-line-strong);border-radius:var(--dsw-radius-sm);width:28px;height:28px;color:var(--mn-muted);cursor:pointer;background:0 0;flex:none;place-items:center;transition:color .15s,background-color .15s;display:grid}.IIa07q_inspectorEye:hover{color:var(--mn-text);background:var(--mn-hover)}.IIa07q_inspectorMeta{margin:0}.IIa07q_inspectorMeta>div{border-top:.5px solid var(--mn-line);gap:2px;padding:10px 0;display:grid}.IIa07q_inspectorMeta dt{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_inspectorMeta dd{overflow-wrap:anywhere;color:var(--mn-muted);margin:0;font-size:13px;line-height:20px}.IIa07q_inspectorActions{gap:8px;margin-top:20px;display:grid}.IIa07q_previewContent{white-space:pre-wrap;overflow-wrap:anywhere;color:var(--mn-text);margin:0;font-size:14px;line-height:22px}.IIa07q_searchBar{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:16px;padding:14px}.IIa07q_queryField{width:100%;height:40px}.IIa07q_searchChoice{min-width:160px}.IIa07q_searchControls{justify-content:flex-end;align-items:flex-end;gap:12px;padding-top:12px;display:flex}.IIa07q_searchActions{align-items:center;gap:8px;display:flex}.IIa07q_agentAnswer{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);margin-bottom:16px;padding:16px}.IIa07q_agentAnswerHeading{justify-content:space-between;align-items:flex-start;gap:16px;display:flex}.IIa07q_agentAnswerHeading span{color:var(--mn-faint);font-size:12px;font-weight:500;line-height:18px}.IIa07q_agentAnswerHeading h3{margin:2px 0 0;font-size:14px;font-weight:500;line-height:22px}.IIa07q_agentAnswerHeading>code{color:var(--mn-faint);font-size:11px}.IIa07q_agentAnswer>p{white-space:pre-wrap;color:var(--mn-text);margin:12px 0;font-size:14px;line-height:22px}.IIa07q_agentCitations{border-top:.5px solid var(--mn-line);flex-wrap:wrap;align-items:center;gap:6px;padding-top:10px;display:flex}.IIa07q_agentCitations small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_agentCitations span{max-width:100%;color:var(--mn-muted);background:var(--mn-fill);text-overflow:ellipsis;white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_fieldWide{color:var(--mn-muted);gap:6px;font-size:12px;font-weight:500;line-height:18px;display:grid}.IIa07q_supervisedForm textarea:focus{border-color:var(--mn-accent)}.IIa07q_singleColumn{max-width:830px}.IIa07q_resultLayout{grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);align-items:start;gap:16px;display:grid}.IIa07q_results,.IIa07q_relatedPane,.IIa07q_entityResults{min-width:0}.IIa07q_relatedPane{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);-webkit-overflow-scrolling:touch;max-height:calc(100dvh - 230px);padding:14px;scroll-margin-top:14px;position:sticky;top:12px;overflow:auto}.IIa07q_relatedSource{border-radius:var(--dsw-radius-sm);color:var(--mn-muted);background:var(--mn-fill);margin:0 0 12px;padding:10px 12px;font-size:13px;line-height:20px}.IIa07q_insightCard{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);min-width:0;margin-bottom:8px;padding:14px 16px;transition:background-color .15s}.IIa07q_insightCard:hover{background:color-mix(in srgb, var(--mn-hover) 50%, transparent)}.IIa07q_cardTop{justify-content:space-between;align-items:center;gap:12px;display:flex}.IIa07q_badges,.IIa07q_tags,.IIa07q_entities{flex-wrap:wrap;gap:6px;display:flex}.IIa07q_badge{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_id{color:var(--mn-faint);font-size:11px}.IIa07q_content{white-space:pre-wrap;overflow-wrap:anywhere;margin:10px 0;font-size:14px;line-height:22px}.IIa07q_tags{color:var(--mn-accent);font-size:12px;line-height:18px}.IIa07q_entities{margin-top:8px}.IIa07q_entities span{border:.5px solid var(--mn-field-line);color:var(--mn-faint);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_cardActions{border-top:.5px solid var(--mn-line);justify-content:flex-end;align-items:center;gap:4px;min-height:32px;margin-top:10px;padding-top:8px;display:flex}.IIa07q_entityLayout{grid-template-columns:264px minmax(0,1fr);align-items:start;gap:16px;display:grid}.IIa07q_entityRail{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);padding:12px;position:sticky;top:0}.IIa07q_entitySearch{grid-template-columns:minmax(0,1fr) auto;gap:8px;display:grid}.IIa07q_entitySearch input{min-width:0}.IIa07q_entityHeading{justify-content:space-between;align-items:center;margin:16px 4px 6px;display:flex}.IIa07q_entityHeading small{color:var(--mn-faint);font-size:12px}.IIa07q_entityList{gap:2px;display:grid}.IIa07q_entityList button{border-radius:var(--dsw-radius-sm);min-height:32px;color:var(--mn-muted);cursor:pointer;text-align:left;background:0 0;border:0;justify-content:space-between;align-items:center;gap:10px;padding:0 10px;display:flex}.IIa07q_entityList button:hover,.IIa07q_entityList button[aria-pressed=true]{color:var(--mn-text);background:var(--mn-hover)}.IIa07q_entityList button[aria-pressed=true]{background:var(--mn-fill)}.IIa07q_entityList button>span{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.IIa07q_entityList strong{color:var(--mn-faint);font-variant-numeric:tabular-nums;flex:none;font-size:12px;font-weight:400}.IIa07q_entityResults>.IIa07q_emptyState{min-height:360px}.IIa07q_supervisedComposer{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);overflow:hidden}.IIa07q_supervisedForm{padding:16px}.IIa07q_candidateHeading{justify-content:space-between;align-items:center;gap:8px;min-width:0;margin-bottom:8px;display:flex}.IIa07q_candidateHeading>label{color:var(--mn-text);font-size:13px;font-weight:500;line-height:20px}.IIa07q_supervisedForm textarea{resize:vertical;border:.5px solid var(--mn-field-line);border-radius:var(--dsw-radius-md);width:100%;color:var(--mn-text);background:var(--mn-input);outline:0;padding:10px 12px;font-size:14px;line-height:22px}.IIa07q_sessionHint{color:var(--mn-danger);margin:8px 0 0;font-size:12px;line-height:18px}.IIa07q_fieldWide{grid-column:1/-1}.IIa07q_advancedWrite{border-top:.5px solid var(--mn-line)}.IIa07q_advancedWrite summary{cursor:pointer;justify-content:space-between;align-items:center;gap:16px;min-height:56px;padding:10px 16px;list-style:none;display:flex}.IIa07q_advancedWrite summary:hover{background:var(--mn-hover)}.IIa07q_advancedWrite summary::-webkit-details-marker{display:none}.IIa07q_advancedWrite summary>span:first-child{gap:2px;display:grid}.IIa07q_advancedWrite summary strong{font-size:13px;font-weight:500;line-height:20px}.IIa07q_advancedWrite summary small{color:var(--mn-faint);font-size:12px;line-height:18px}.IIa07q_advancedWrite summary>span:last-child{color:var(--mn-faint);font-size:16px;line-height:1}.IIa07q_advancedWrite[open] summary{border-bottom:.5px solid var(--mn-line)}.IIa07q_advancedWrite[open] summary>span:last-child{font-size:0}.IIa07q_advancedWrite[open] summary>span:last-child:after{content:\"−\";font-size:16px}.IIa07q_manualForm{padding:4px 16px 16px}.IIa07q_manualActions{justify-content:space-between;align-items:center;gap:16px;margin-top:16px;display:flex}.IIa07q_manualActions p{max-width:520px;color:var(--mn-faint);margin:0;font-size:12px;line-height:18px}.IIa07q_listToolbar{border:.5px solid var(--mn-card-line);border-radius:var(--dsw-radius-lg);grid-template-columns:minmax(0,1fr) 180px auto;gap:8px;padding:12px;display:grid}.IIa07q_listToolbar>*{min-width:0}.IIa07q_listNotice{color:var(--mn-faint);margin:10px 2px 16px;font-size:12px;line-height:18px}.IIa07q_listNotice span{color:var(--mn-success);background:color-mix(in srgb, var(--mn-success) 10%, transparent);border-radius:999px;margin-right:8px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.IIa07q_memoryList{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:8px;display:grid}.IIa07q_memoryList .IIa07q_insightCard{height:100%;margin:0}.IIa07q_modalFooterNote{max-width:54ch;color:var(--mn-faint);margin:0 auto 0 0;font-size:12px;line-height:18px}.IIa07q_modalInlineStatus{color:var(--mn-muted);overflow-wrap:anywhere;margin:12px 0 0;font-size:12px;line-height:18px}.IIa07q_metadataDialog{gap:12px;display:grid}.IIa07q_metadataToolbar{color:var(--mn-faint);justify-content:space-between;align-items:center;gap:12px;font-size:12px;line-height:18px;display:flex}.IIa07q_metadataToolbar>span{align-items:center;gap:8px;min-width:0;display:flex}.IIa07q_metadataToolbar em{color:var(--mn-muted);background:var(--mn-fill);border-radius:999px;padding:1px 8px;font-size:11px;font-style:normal;font-weight:500;line-height:17px}.IIa07q_metadataList{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;display:grid}.IIa07q_metadataEmpty{border-radius:var(--dsw-radius-md);color:var(--mn-faint);background:var(--mn-fill);text-align:center;grid-column:1/-1;padding:20px;font-size:12px}.IIa07q_metadataList>label{cursor:pointer;grid-template-columns:16px minmax(0,1fr);align-items:start;gap:10px;min-width:0;min-height:76px;padding:12px;display:grid;position:relative}.IIa07q_metadataList>label:hover{background:var(--mn-hover)}.IIa07q_metadataList>label[data-selected]{border-color:var(--mn-field-line);background:var(--mn-fill)}.IIa07q_metadataList>label[data-refreshing]{overflow:hidden}.IIa07q_metadataList>label[data-refreshing]:after{content:\"\";background:linear-gradient(105deg, transparent 20%, color-mix(in srgb, var(--mn-accent) 10%, transparent) 45%, transparent 70%);pointer-events:none;animation:.9s ease-in-out infinite IIa07q_mnemon-metadata-sweep;position:absolute;inset:0;transform:translate(-120%)}.IIa07q_metadataList>label[data-refreshed]{animation:.9s ease-out IIa07q_mnemon-metadata-refreshed}.IIa07q_metadataList>label[data-failed]{border-color:color-mix(in srgb, var(--mn-danger) 40%, transparent)}.IIa07q_metadataList>label>input{opacity:0;pointer-events:none;width:1px;height:1px;position:absolute}.IIa07q_metadataList>label>span{gap:4px;min-width:0;display:grid}.IIa07q_metadataList strong{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:500;line-height:20px;overflow:hidden}.IIa07q_metadataList small{color:var(--mn-faint);-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:12px;line-height:18px;display:-webkit-box;overflow:hidden}.IIa07q_metadataList>label>span>span{align-items:center;gap:6px;min-width:0;display:flex}.IIa07q_metadataList code{color:var(--mn-faint);text-overflow:ellipsis;white-space:nowrap;font-size:11px;overflow:hidden}.IIa07q_metadataTaskStatus{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:12px;line-height:18px;overflow:hidden}.IIa07q_metadataTaskStatus[data-status=running]{color:var(--mn-faint)}.IIa07q_metadataTaskStatus[data-status=success]{color:var(--mn-success)}.IIa07q_metadataTaskStatus[data-status=error]{color:var(--mn-danger)}@media (prefers-reduced-motion:reduce){.IIa07q_metadataList>label[data-refreshing]:after,.IIa07q_metadataList>label[data-refreshed]{animation:none}}@media (width<=1000px){.IIa07q_graphLayout{display:block;position:relative}.IIa07q_graphInspector{width:auto;min-height:0;box-shadow:none;margin-top:12px;position:static;overflow:visible}.IIa07q_graphInspector[data-empty]{display:none}.IIa07q_resultLayout{grid-template-columns:1fr}.IIa07q_relatedPane{grid-row:1;max-height:none;position:static}.IIa07q_memoryList{grid-template-columns:1fr}}@media (width<=760px){.IIa07q_metadataList{grid-template-columns:1fr}.IIa07q_modalFooterNote{max-width:none;margin:0}.IIa07q_modal .IIa07q_supervisedForm textarea{min-height:clamp(130px,30vh,210px)}.IIa07q_entityLayout{grid-template-columns:1fr}.IIa07q_manualActions{flex-direction:column;align-items:stretch}.IIa07q_entityRail{position:static}.IIa07q_searchControls{grid-template-columns:repeat(2,minmax(0,1fr));display:grid}.IIa07q_searchActions{grid-column:1/-1}.IIa07q_searchActions>button{flex:1}.IIa07q_listToolbar{grid-template-columns:1fr}.IIa07q_bodyDirectoryHeader{grid-template-columns:minmax(0,1fr);display:grid}.IIa07q_bodyDirectoryHeader>div{min-width:0}.IIa07q_bodyDirectoryPath{max-width:100%}.IIa07q_bodyDirectoryControls{flex-wrap:wrap;justify-content:flex-start;padding-right:0}.IIa07q_createIdentityGrid,.IIa07q_placementMode,.IIa07q_placementRuleGrid,.IIa07q_placementCandidates,.IIa07q_providerChoice,.IIa07q_providerAdvancedGrid{grid-template-columns:1fr}.IIa07q_graphViewport{min-height:360px}.IIa07q_graphSvg{height:390px}.IIa07q_graphCanvasControls{top:8px;right:8px}.IIa07q_graphCanvasControls span{display:none}}@media (width<=520px){.IIa07q_memoryHeaderActions{width:100%}.IIa07q_memoryHeaderActions>button{flex:1}.IIa07q_cardTop{flex-direction:column;align-items:flex-start}.IIa07q_cardActions{flex-wrap:wrap;align-items:stretch}.IIa07q_cardActions button{flex:1}.IIa07q_searchControls{grid-template-columns:1fr}}@supports (height:100dvh){@media (width<=760px){.IIa07q_modal .IIa07q_supervisedForm textarea{min-height:clamp(130px,30dvh,210px)}}}@media (width<=1000px) and (height<=760px){.IIa07q_graphViewport{min-height:300px}.IIa07q_graphSvg{height:300px}}";
		const id$1 = "dsh-mnemon-source-memory-spaces/presentation/page.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(id$1) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = id$1;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$2) tag.textContent = css$2;
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
		//#region \0source-css:/home/runner/work/dsh-mnemon/dsh-mnemon/plugins/dsh-mnemon-source-memory-spaces/presentation/sidebar.module.css.mjs
		const css$1 = "._Bh55G_shell ._Bh55G_memoryWorkspace{z-index:12;border-bottom:.5px solid var(--dsw-alias-border-l2);background:var(--mn-surface);flex:none;margin:-20px -24px 16px;padding:20px 24px 0;position:sticky;top:0}._Bh55G_shell ._Bh55G_memoryWorkspace>[class*=pageHeader],._Bh55G_shell ._Bh55G_memoryWorkspace~[class*=page]>[class*=pageHeader]{margin-bottom:12px}._Bh55G_shell ._Bh55G_memoryWorkspace~[class*=page]>[class*=pageHeader] h2{font-size:14px;line-height:22px}._Bh55G_shell ._Bh55G_memoryWorkspace~[class*=page]>[class*=pageHeader] p{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}._Bh55G_shell [class*=relatedPane],._Bh55G_shell [class*=entityRail]{position:static}._Bh55G_shell ._Bh55G_memoryNavigation{flex:none;align-items:flex-end;gap:12px;min-width:0;padding:0;display:flex}._Bh55G_shell ._Bh55G_memoryTabs{scrollbar-width:none;flex:1;gap:22px;min-width:0;display:flex;overflow-x:auto}._Bh55G_shell ._Bh55G_memoryTabs::-webkit-scrollbar{display:none}._Bh55G_shell ._Bh55G_memoryTabs button{min-width:max-content;min-height:0;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-bottom:2px solid #0000;margin-bottom:-.5px;padding:6px 1px 9px;font-size:13px;line-height:20px;position:relative}._Bh55G_shell ._Bh55G_memoryTabs button:hover{color:var(--dsw-alias-label-primary)}._Bh55G_shell ._Bh55G_memoryTabs button[data-active]{border-bottom-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-label-primary)}._Bh55G_shell ._Bh55G_memoryWriteButton{flex:none}._Bh55G_shell ._Bh55G_modal section[class*=supervisedComposer]{border:0;overflow:visible}._Bh55G_shell ._Bh55G_modal form[class*=supervisedForm]{padding:0}._Bh55G_shell ._Bh55G_modal [class*=supervisedHeading]{margin-bottom:12px}._Bh55G_shell ._Bh55G_modal [class*=supervisedHeading] h3{display:none}._Bh55G_shell ._Bh55G_modal details[class*=advancedWrite]{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-md);margin-top:16px;overflow:hidden}._Bh55G_shell [class*=inspectorEye],._Bh55G_shell [class*=inspectorHeading] button{border-radius:var(--dsw-radius-sm);width:28px;height:28px;min-height:0;color:var(--dsw-alias-label-caption);cursor:pointer;background:0 0;border:0;justify-content:center;align-items:center;padding:0;font-size:13px;transition:background-color .12s,color .12s;display:inline-flex}._Bh55G_shell [class*=inspectorEye]:hover:not(:disabled),._Bh55G_shell [class*=inspectorHeading] button:hover:not(:disabled){color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-interactive-bg-hover)}._Bh55G_shell [class*=inspectorEye]:disabled{cursor:default;opacity:.4}._Bh55G_shell [class*=bodyGrid]{grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))}._Bh55G_shell article[class*=bodyCard]{flex-direction:column;height:100%;display:flex}._Bh55G_shell ._Bh55G_bodyCardHeader{justify-content:space-between;align-items:flex-start;gap:12px;min-width:0;display:flex}._Bh55G_shell ._Bh55G_bodyDirectoryActions{flex:none;align-items:center;gap:8px;display:flex}._Bh55G_shell ._Bh55G_bodyCardIdentity{flex:1;align-items:flex-start;gap:8px;min-width:0;display:flex}._Bh55G_shell ._Bh55G_bodyCardIdentity>[class*=bodySignal]{flex:none;width:6px;height:6px;margin-top:7px}._Bh55G_shell article[class*=bodyCard][data-reconnecting] ._Bh55G_bodyCardIdentity>[class*=bodySignal]{width:8px;height:8px;margin-top:6px}._Bh55G_shell ._Bh55G_bodyCardIdentity>div{flex:1;gap:2px;min-width:0;display:grid}._Bh55G_shell ._Bh55G_bodyCardIdentity strong{text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;overflow:hidden}._Bh55G_shell ._Bh55G_bodyCardMeta{flex-wrap:wrap;align-items:center;gap:4px 8px;min-width:0;display:flex}._Bh55G_shell ._Bh55G_bodyCardMeta code{min-width:0;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;overflow:hidden}._Bh55G_shell ._Bh55G_bodyCardMeta [class*=bodyHealth],._Bh55G_shell ._Bh55G_bodyCardHeader>[class*=bodySwitch]{flex:none}._Bh55G_shell article[class*=bodyCard]>p{-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:40px;max-height:40px;margin:10px 0;display:-webkit-box;overflow:hidden}._Bh55G_shell ._Bh55G_bodyCardFooter{white-space:nowrap;grid-template-columns:minmax(0,1fr) max-content;align-items:center;gap:12px;min-width:0;margin-top:auto;padding-top:10px;display:grid}._Bh55G_shell ._Bh55G_bodyCardStats{flex-wrap:nowrap;align-items:center;gap:12px;min-width:0;display:flex;overflow:hidden}._Bh55G_shell ._Bh55G_bodyCardFooter [class*=bodyCardActions]{flex-wrap:nowrap;flex:none;align-items:center;gap:8px;display:flex}._Bh55G_shell [class*=cardActions]{gap:8px}._Bh55G_shell ._Bh55G_inspectorGlyph{border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-lg);width:48px;height:48px;color:var(--dsw-alias-label-tertiary);place-items:center;margin-bottom:12px;font-size:20px;line-height:1;display:grid}@media (width<=760px){._Bh55G_shell ._Bh55G_memoryWorkspace{margin:-16px -16px 16px;padding:16px 16px 0}}@media (width<=520px){._Bh55G_shell ._Bh55G_memoryTabs{gap:18px}}@media (prefers-reduced-motion:reduce){._Bh55G_shell [class*=inspectorEye],._Bh55G_shell [class*=inspectorHeading] button{transition:none}}";
		const id = "dsh-mnemon-source-memory-spaces/presentation/sidebar.module.css";
		if (typeof document !== "undefined") {
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(id) + "]");
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.pluginCss = id;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css$1) tag.textContent = css$1;
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
		//#region src/client/presentation.ts
		const css = {
			...dsh_mnemon_client.memoryPageStyles,
			...page_module_css_default
		};
		const sidebarCss = {
			...dsh_mnemon_client.memorySidebarStyles,
			...sidebar_module_css_default
		};
		function useT() {
			const fallback = (0, dsh_mnemon_client.useT)();
			const locale = (0, dsh_mnemon_client.useLocale)();
			return (0, react.useMemo)(() => (key, params) => {
				const dictionary = locale.startsWith("en") ? en : zh;
				if (!Object.hasOwn(dictionary, key)) return fallback(key, params);
				const text = dictionary[key];
				return params === void 0 ? text : text.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match);
			}, [locale, fallback]);
		}
		//#endregion
		//#region src/contracts.ts
		const CATEGORIES = [
			"preference",
			"decision",
			"fact",
			"insight",
			"context",
			"general"
		];
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
				children: icon?.kind === "brand" && icon.value === "mnemon" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.MnemonLogo, {}) : icon?.kind === "glyph" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					"aria-hidden": "true",
					children: icon.value
				}) : icon?.kind === "data-url" && /^data:image\/(?:png|jpeg|webp|svg\+xml);/u.test(icon.value) ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
					src: icon.value,
					alt: ""
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GenericProviderMark, {})
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
		//#region src/client/pages.tsx
		function memoryProviderFields(provider) {
			return provider.fields.filter((field) => field.scope !== "service");
		}
		function providerDefaults(provider) {
			return Object.fromEntries(memoryProviderFields(provider).flatMap((field) => field.defaultValue === void 0 ? [] : [[field.key, field.defaultValue]]));
		}
		function mergeProviderDefaults(providers, current) {
			return Object.fromEntries(providers.map((provider) => [provider.id, {
				...providerDefaults(provider),
				...current[provider.id] ?? {}
			}]));
		}
		function providerDraftComplete(provider, connection) {
			if (provider === void 0 || provider.serviceConfigured === false) return false;
			return provider.origin === "native" || memoryProviderFields(provider).every((field) => !field.required || String(connection?.[field.key] ?? "").trim() !== "");
		}
		/** Keep a ready provider; otherwise Mnemon Native while its CLI is available, then the first other ready one. */
		function readyProviderId(providers, current) {
			const ready = providers.filter((provider) => provider.serviceConfigured !== false);
			return ready.find((provider) => provider.id === current)?.id ?? (ready.find((provider) => provider.origin === "native") ?? ready[0])?.id;
		}
		/** Ready Providers first, in catalog order, so the choices that work lead the list. */
		function readyFirst(providers) {
			return [...providers].sort((left, right) => Number(left.serviceConfigured === false) - Number(right.serviceConfigured === false));
		}
		/** Why a provider cannot be chosen: Mnemon Native needs its CLI, the others a service configured on the dsh-mnemon page under Plugins. */
		function providerUnavailableKey(provider) {
			return provider.origin === "native" ? "overview.nativeCliRequired" : "overview.providerServiceRequired";
		}
		function nativeSpaceProvider(provider) {
			return provider.origin === "native";
		}
		/** Shared memory-level Provider form used by manual creation, editing, and distillation policy. */
		function ProviderMemoryFields(props) {
			const t = useT();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.providerFields,
				"data-provider": props.provider.id,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.providerFieldHeading,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.providerFieldIdentity,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
								providerId: props.provider.id,
								icon: props.provider.icon,
								className: css.providerFieldIcon
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.provider.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: providerSummary(t, props.provider) })] })]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
							props.provider.kind === "local" ? t("overview.providerKindLocal") : t("overview.providerKindRemote"),
							" · ",
							t(`overview.workspaceBinding.${props.provider.workspaceBinding}`)
						] })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.providerAdvancedGrid,
						children: memoryProviderFields(props.provider).map((field) => {
							const label = providerFieldLabel(t, field);
							const value = props.connection[field.key] ?? "";
							const savedSecret = props.body?.provider.configuredSecrets.includes(field.key) === true;
							const clearingSecret = props.clearSecrets?.includes(field.key) === true;
							const required = field.required && (!savedSecret || clearingSecret);
							const input = field.input === "boolean" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								"aria-label": label,
								type: "checkbox",
								checked: Boolean(value),
								onChange: (event) => props.onChange(field.key, event.target.checked)
							}) : field.input === "select" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SelectField, {
								hideLabel: true,
								label,
								value: String(value),
								options: (field.options ?? []).map((option) => ({
									value: option.value,
									label: providerOptionLabel(t, option)
								})),
								onChange: (next) => props.onChange(field.key, next)
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								"aria-label": label,
								type: field.input === "secret" ? "password" : field.input === "number" ? "number" : field.input === "url" ? "url" : "text",
								value: String(value),
								required,
								autoComplete: field.input === "secret" ? "new-password" : void 0,
								placeholder: savedSecret ? t("overview.providerApiKeyKeep") : field.placeholder ?? (field.input === "secret" ? t("overview.providerApiKeyOptional") : void 0),
								maxLength: field.maxLength ?? (field.input === "secret" ? 8e3 : 2e3),
								min: field.min,
								max: field.max,
								pattern: field.pattern,
								step: field.input === "number" ? "any" : void 0,
								onChange: (event) => props.onChange(field.key, event.target.value)
							});
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.providerFieldControl,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [label, input] }), props.body !== void 0 && field.input === "secret" && savedSecret && props.onClearSecretsChange !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: css.providerSecretClear,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: clearingSecret,
										onChange: (event) => props.onClearSecretsChange(event.target.checked ? [.../* @__PURE__ */ new Set([...props.clearSecrets ?? [], field.key])] : (props.clearSecrets ?? []).filter((key) => key !== field.key))
									}), t("overview.providerSecretClear")]
								})]
							}, field.key);
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", {
						className: css.providerWriteHint,
						children: [
							props.provider.capabilities.writeMode === "exact" ? t("overview.providerWriteExact") : t("overview.providerWriteAsync"),
							" · ",
							props.provider.capabilities.graph ? t("overview.providerGraphReady") : t("overview.providerSearchReady")
						]
					})
				]
			});
		}
		const CATEGORY_KEYS = {
			decision: "category.decision",
			preference: "category.preference",
			fact: "category.fact",
			insight: "category.insight",
			context: "category.context",
			general: "category.general"
		};
		function categoryLabel(t, category) {
			return CATEGORY_KEYS[category] === void 0 ? category : t(CATEGORY_KEYS[category]);
		}
		function insightKey(insight) {
			return `${insight.memoryBodyId ?? "memory"}:${insight.id}`;
		}
		function MemoryProviderBadge(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: css.providerBadge,
				"data-provider": props.providerId,
				title: props.label,
				children: props.label
			});
		}
		function ReadSourcePanel(props) {
			const t = useT();
			if (props.sources.length === 0) return null;
			const content = (source) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: css.readSourceSignal,
					"aria-hidden": "true"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: css.readSourceIdentity,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: source.memoryBodyName }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: css.readSourceMeta,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryProviderBadge, {
							providerId: source.providerId,
							label: source.providerLabel
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t(`readSources.model.${source.providerId}`) })]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
					className: css.readSourceState,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t(`readSources.mode.${source.mode}`) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", { children: [t(`readSources.status.${source.status}`, { count: source.itemCount }), source.edgeCount === void 0 || source.edgeCount === 0 ? "" : ` · ${t("readSources.edges", { count: source.edgeCount })}`] })]
				})
			] });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: css.readSources,
				"aria-label": props.title,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: props.title }), props.hint !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: props.hint })] }), props.onSelect !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": props.selectedBodyId === void 0,
					"data-selected": props.selectedBodyId === void 0 ? "" : void 0,
					onClick: () => props.onSelect?.(void 0),
					children: t("readSources.all")
				})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: props.sources.map((source) => props.onSelect === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("article", {
					className: css.readSourceCard,
					"data-provider": source.providerId,
					"data-mode": source.mode,
					"data-status": source.status,
					title: source.hint,
					children: content(source)
				}, source.memoryBodyId) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: css.readSourceCard,
					"data-provider": source.providerId,
					"data-mode": source.mode,
					"data-status": source.status,
					"aria-pressed": props.selectedBodyId === source.memoryBodyId,
					"data-selected": props.selectedBodyId === source.memoryBodyId || void 0,
					title: source.hint,
					onClick: () => props.onSelect?.(props.selectedBodyId === source.memoryBodyId ? void 0 : source.memoryBodyId),
					children: content(source)
				}, source.memoryBodyId)) })]
			});
		}
		/** Full-text popup for a selected graph node whose inspector preview is clamped. */
		function ContentPreview(props) {
			const t = useT();
			const meta = [
				props.kind,
				props.node.id,
				props.node.memoryBodyName
			].filter((entry) => entry !== void 0).join(" · ");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SidebarModal, {
				title: t("overview.previewTitle"),
				description: meta,
				onClose: props.onClose,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: css.previewContent,
					children: props.node.content
				})
			});
		}
		function InsightCard(props) {
			const t = useT();
			const [confirming, setConfirming] = (0, react.useState)(false);
			const [forgetting, setForgetting] = (0, react.useState)(false);
			const { insight } = props;
			const neutralActionClass = (0, dsh_mnemon_client.appearanceClass)(css.ghostButton, (0, dsh_mnemon_client.appearanceClass)(sidebarCss.itemActionButton, sidebarCss.itemEditAction));
			const forgetActionClass = (0, dsh_mnemon_client.appearanceClass)(css.dangerButton, (0, dsh_mnemon_client.appearanceClass)(sidebarCss.itemActionButton, sidebarCss.itemDangerAction));
			const providerLabel = insight.memoryProviderLabel ?? insight.memoryProviderId;
			const supportsRelated = insight.memoryCapabilities?.related === true;
			const supportsForget = insight.memoryCapabilities?.forget === true;
			const meta = [
				insight.memoryBodyName,
				providerLabel,
				insight.category !== void 0 ? categoryLabel(t, insight.category) : void 0,
				insight.importance !== void 0 ? t("common.importance", { value: insight.importance }) : void 0,
				insight.score !== void 0 ? t("common.score", { value: insight.score.toFixed(2) }) : void 0,
				insight.depth !== void 0 ? t("common.hops", { count: insight.depth }) : void 0
			].filter((entry) => entry !== void 0);
			const forget = async () => {
				setForgetting(true);
				try {
					await props.onForget(insight);
				} finally {
					setForgetting(false);
					setConfirming(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
				className: css.insightCard,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.cardTop,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.badges,
							children: meta.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: css.badge,
								children: entry
							}, entry))
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: css.content,
						children: insight.content
					}),
					(insight.tags?.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.tags,
						children: insight.tags.map((tag) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["#", tag] }, tag))
					}),
					(insight.entities?.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.entities,
						children: insight.entities.map((entity) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: entity }, entity))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.cardActions,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							props.onRelated !== void 0 && supportsRelated && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: neutralActionClass,
								onClick: () => props.onRelated?.(insight),
								children: t("card.related")
							}),
							props.onClone !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: neutralActionClass,
								onClick: () => props.onClone?.(insight),
								children: t("card.clone")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: neutralActionClass,
								onClick: () => void (0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(insight.id),
								children: t("common.copyId")
							}),
							props.writeEnabled && supportsForget && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: forgetActionClass,
								onClick: () => setConfirming(true),
								children: t("card.forget")
							})
						] })
					})
				]
			}), confirming && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SidebarModal, {
				title: t("card.confirmText"),
				description: `${insight.memoryBodyName ?? insight.memoryBodyId ?? ""}${insight.memoryBodyName === void 0 && insight.memoryBodyId === void 0 ? "" : " · "}${insight.id}`,
				busy: forgetting,
				onClose: () => setConfirming(false),
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: css.modalFooterActions,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"data-dialog-close": true,
						"data-autofocus": true,
						className: css.secondaryButton,
						disabled: forgetting,
						onClick: () => setConfirming(false),
						children: t("common.cancel")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: css.dangerSolidButton,
						disabled: forgetting,
						onClick: () => void forget(),
						children: forgetting ? t("card.processing") : t("card.confirmForget")
					})]
				}),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: css.bodyDeleteConfirm,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.bodyDeleteSummary,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: css.bodyDeleteContent,
							children: insight.content
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: meta.join(" · ") })]
					})
				})
			})] });
		}
		const GRAPH_WIDTH = 930;
		const GRAPH_HEIGHT = 520;
		const GRAPH_MARGIN_X = 58;
		const GRAPH_MARGIN_Y = 58;
		const CATEGORY_ORDER = [
			"space",
			"entity",
			"preference",
			"decision",
			"fact",
			"insight",
			"context",
			"general"
		];
		function hash(value) {
			let result = 2166136261;
			for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
			return result >>> 0;
		}
		function graphNodeKey(node) {
			return node.graphId ?? node.id;
		}
		function graphNodeKind(node) {
			return node.kind ?? "memory";
		}
		function spaceGraphId(id) {
			return `space:${id}`;
		}
		function entityGraphId(entity) {
			return `entity:${encodeURIComponent(normalizeEntity(entity))}`;
		}
		function normalizeEntity(entity) {
			return entity.normalize("NFKC").trim().toLocaleLowerCase();
		}
		/** Add routing scopes and entity indexes without issuing another recall. */
		function enrichMultiSpaceGraph(graph, bodies) {
			if (graph.nodes.length === 0) return graph;
			const memories = graph.nodes.map((node) => ({
				...node,
				kind: "memory"
			}));
			const memoriesBySpace = /* @__PURE__ */ new Map();
			for (const node of memories) {
				if (node.memoryBodyId === void 0) continue;
				memoriesBySpace.set(node.memoryBodyId, [...memoriesBySpace.get(node.memoryBodyId) ?? [], node]);
			}
			const activeSpaces = bodies.filter((body) => body.active && ((memoriesBySpace.get(body.id)?.length ?? 0) > 0 || (body.stats?.topEntities.length ?? 0) > 0));
			const spaceNodes = activeSpaces.map((body) => ({
				id: body.id,
				graphId: spaceGraphId(body.id),
				kind: "space",
				category: "space",
				content: body.name,
				color: "#22a879",
				memoryBodyId: body.id,
				memoryBodyName: body.name,
				memoryProviderId: body.provider.id,
				occurrenceCount: body.stats?.totalInsights ?? memoriesBySpace.get(body.id)?.length ?? 0
			}));
			const edges = graph.edges.filter((edge) => edge.type !== "entity");
			for (const body of activeSpaces) for (const memory of memoriesBySpace.get(body.id) ?? []) edges.push({
				sourceId: spaceGraphId(body.id),
				targetId: graphNodeKey(memory),
				label: "scope",
				color: "#708199",
				type: "scope"
			});
			const spacesById = new Map(activeSpaces.map((body) => [body.id, body]));
			const indexedEntities = /* @__PURE__ */ new Map();
			for (const memory of memories) {
				const body = memory.memoryBodyId === void 0 ? void 0 : spacesById.get(memory.memoryBodyId);
				if (body === void 0) continue;
				const seen = /* @__PURE__ */ new Set();
				for (const rawEntity of memory.entities ?? []) {
					const entity = rawEntity.trim();
					const key = normalizeEntity(entity);
					if (key === "" || seen.has(key)) continue;
					seen.add(key);
					const current = indexedEntities.get(key);
					if (current === void 0) indexedEntities.set(key, {
						entity,
						memories: [memory],
						bodies: [body]
					});
					else {
						current.memories.push(memory);
						if (!current.bodies.some((candidate) => candidate.id === body.id)) current.bodies.push(body);
					}
				}
			}
			const entities = [...indexedEntities.values()].sort((left, right) => right.memories.length - left.memories.length || left.entity.localeCompare(right.entity)).slice(0, 24);
			const entityNodes = entities.map((item) => ({
				id: item.entity,
				graphId: entityGraphId(item.entity),
				kind: "entity",
				category: "entity",
				content: item.entity,
				color: "#2b9db9",
				occurrenceCount: item.memories.length,
				memoryBodyIds: item.bodies.map((body) => body.id),
				memoryBodyNames: item.bodies.map((body) => body.name)
			}));
			for (const item of entities) {
				const key = entityGraphId(item.entity);
				for (const memory of item.memories) edges.push({
					sourceId: key,
					targetId: graphNodeKey(memory),
					label: item.entity,
					color: "#22a879",
					type: "entity"
				});
			}
			return {
				...graph,
				nodes: [
					...spaceNodes,
					...entityNodes,
					...memories
				],
				edges
			};
		}
		function graphKindLabel(t, node) {
			const kind = graphNodeKind(node);
			return kind === "space" ? t("graph.kindSpace") : kind === "entity" ? t("graph.kindEntity") : categoryLabel(t, node.category ?? "general");
		}
		function activeCategoryAnchors(grouped) {
			const categories = [...grouped.keys()].sort((left, right) => {
				const leftIndex = CATEGORY_ORDER.indexOf(left);
				const rightIndex = CATEGORY_ORDER.indexOf(right);
				return (leftIndex < 0 ? CATEGORY_ORDER.length : leftIndex) - (rightIndex < 0 ? CATEGORY_ORDER.length : rightIndex);
			});
			const anchors = /* @__PURE__ */ new Map();
			if (categories.length === 1) {
				anchors.set(categories[0], {
					x: GRAPH_WIDTH / 2,
					y: GRAPH_HEIGHT / 2
				});
				return anchors;
			}
			categories.forEach((category, index) => {
				const angle = -Math.PI / 2 + index / categories.length * Math.PI * 2;
				anchors.set(category, {
					x: GRAPH_WIDTH / 2 + Math.cos(angle) * Math.min(250, 115 + categories.length * 23),
					y: GRAPH_HEIGHT / 2 + Math.sin(angle) * Math.min(165, 78 + categories.length * 15)
				});
			});
			return anchors;
		}
		function clampGraphPosition(position) {
			return {
				x: Math.min(872, Math.max(GRAPH_MARGIN_X, position.x)),
				y: Math.min(462, Math.max(GRAPH_MARGIN_Y, position.y))
			};
		}
		function naturalGraphPositions(nodes, edges) {
			const positions = /* @__PURE__ */ new Map();
			const grouped = /* @__PURE__ */ new Map();
			for (const node of nodes) {
				const category = node.category ?? "general";
				grouped.set(category, [...grouped.get(category) ?? [], node]);
			}
			const anchors = activeCategoryAnchors(grouped);
			for (const [category, items] of grouped) {
				const anchor = anchors.get(category) ?? {
					x: GRAPH_WIDTH / 2,
					y: GRAPH_HEIGHT / 2
				};
				items.forEach((node, index) => {
					const seed = hash(graphNodeKey(node));
					const angle = index * 2.399963 + seed % 37 / 37 * .4;
					const radius = items.length === 1 ? 0 : 24 + Math.sqrt(index + 1) * 35;
					positions.set(graphNodeKey(node), clampGraphPosition({
						x: anchor.x + Math.cos(angle) * radius,
						y: anchor.y + Math.sin(angle) * radius
					}));
				});
			}
			const velocities = new Map(nodes.map((node) => [graphNodeKey(node), {
				x: 0,
				y: 0
			}]));
			const visibleIds = new Set(nodes.map(graphNodeKey));
			const visibleEdges = edges.filter((edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId));
			for (let iteration = 0; iteration < 150; iteration += 1) {
				const cooling = 1 - iteration / 180;
				for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
					const left = nodes[leftIndex];
					const leftPosition = positions.get(graphNodeKey(left));
					const leftVelocity = velocities.get(graphNodeKey(left));
					for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
						const right = nodes[rightIndex];
						const rightPosition = positions.get(graphNodeKey(right));
						const rightVelocity = velocities.get(graphNodeKey(right));
						let dx = leftPosition.x - rightPosition.x;
						let dy = leftPosition.y - rightPosition.y;
						if (dx === 0 && dy === 0) {
							dx = hash(graphNodeKey(left)) % 13 - 6 || 1;
							dy = hash(graphNodeKey(right)) % 11 - 5 || -1;
						}
						const distanceSquared = Math.max(100, dx * dx + dy * dy);
						const distance = Math.sqrt(distanceSquared);
						const force = Math.min(9, 18e3 / distanceSquared) * cooling + (distance < 66 ? (66 - distance) * .08 : 0);
						const forceX = dx / distance * force;
						const forceY = dy / distance * force;
						leftVelocity.x += forceX;
						leftVelocity.y += forceY;
						rightVelocity.x -= forceX;
						rightVelocity.y -= forceY;
					}
				}
				for (const edge of visibleEdges) {
					const source = positions.get(edge.sourceId);
					const target = positions.get(edge.targetId);
					const sourceVelocity = velocities.get(edge.sourceId);
					const targetVelocity = velocities.get(edge.targetId);
					const dx = target.x - source.x;
					const dy = target.y - source.y;
					const distance = Math.max(1, Math.hypot(dx, dy));
					const sparseScale = nodes.length <= 3 ? 2 : nodes.length <= 8 ? 1.45 : 1;
					const spring = (distance - (edge.type === "scope" ? 138 : edge.type === "entity" ? 94 : edge.type === "semantic" ? 118 : 106) * sparseScale) * .018 * cooling;
					const forceX = dx / distance * spring;
					const forceY = dy / distance * spring;
					sourceVelocity.x += forceX;
					sourceVelocity.y += forceY;
					targetVelocity.x -= forceX;
					targetVelocity.y -= forceY;
				}
				for (const node of nodes) {
					const key = graphNodeKey(node);
					const position = positions.get(key);
					const velocity = velocities.get(key);
					const anchor = anchors.get(node.category ?? "general") ?? {
						x: GRAPH_WIDTH / 2,
						y: GRAPH_HEIGHT / 2
					};
					velocity.x += (anchor.x - position.x) * .0035 * cooling + (GRAPH_WIDTH / 2 - position.x) * 8e-4;
					velocity.y += (anchor.y - position.y) * .0035 * cooling + (GRAPH_HEIGHT / 2 - position.y) * 8e-4;
					velocity.x = Math.max(-12, Math.min(12, velocity.x * .76));
					velocity.y = Math.max(-12, Math.min(12, velocity.y * .76));
					positions.set(key, clampGraphPosition({
						x: position.x + velocity.x,
						y: position.y + velocity.y
					}));
				}
			}
			return positions;
		}
		function uniformGraphPositions(nodes) {
			const positions = /* @__PURE__ */ new Map();
			const ordered = [...nodes].sort((left, right) => {
				const categoryDifference = CATEGORY_ORDER.indexOf(left.category ?? "general") - CATEGORY_ORDER.indexOf(right.category ?? "general");
				return categoryDifference === 0 ? left.id.localeCompare(right.id) : categoryDifference;
			});
			const columns = Math.max(1, Math.ceil(Math.sqrt(ordered.length * 1.65)));
			const rows = Math.max(1, Math.ceil(ordered.length / columns));
			const cellWidth = 814 / columns;
			const cellHeight = 404 / rows;
			ordered.forEach((node, index) => {
				const row = Math.floor(index / columns);
				const column = index % columns;
				const rowLength = Math.min(columns, ordered.length - row * columns);
				const rowOffset = (columns - rowLength) * cellWidth / 2;
				positions.set(graphNodeKey(node), {
					x: GRAPH_MARGIN_X + rowOffset + cellWidth * (column + .5),
					y: GRAPH_MARGIN_Y + cellHeight * (row + .5)
				});
			});
			return positions;
		}
		function graphPoint(svg, clientX, clientY) {
			const matrix = svg.getScreenCTM?.();
			if (matrix !== null && matrix !== void 0 && typeof svg.createSVGPoint === "function") {
				const point = svg.createSVGPoint();
				point.x = clientX;
				point.y = clientY;
				return clampGraphPosition(point.matrixTransform(matrix.inverse()));
			}
			const bounds = svg.getBoundingClientRect();
			const width = bounds.width || GRAPH_WIDTH;
			const height = bounds.height || GRAPH_HEIGHT;
			return clampGraphPosition({
				x: (clientX - bounds.left) * GRAPH_WIDTH / width,
				y: (clientY - bounds.top) * GRAPH_HEIGHT / height
			});
		}
		function MemoryGraph(props) {
			const t = useT();
			const visibleNodes = (0, react.useMemo)(() => {
				const spaces = props.graph.nodes.filter((node) => graphNodeKind(node) === "space");
				const entities = props.graph.nodes.filter((node) => graphNodeKind(node) === "entity").slice(0, 20);
				const memories = props.graph.nodes.filter((node) => graphNodeKind(node) === "memory").slice(0, Math.max(0, 60 - spaces.length - entities.length));
				return [
					...spaces,
					...entities,
					...memories
				].slice(0, 60);
			}, [props.graph.nodes]);
			const visibleIds = (0, react.useMemo)(() => new Set(visibleNodes.map(graphNodeKey)), [visibleNodes]);
			const visibleKinds = (0, react.useMemo)(() => new Map(visibleNodes.map((node) => [graphNodeKey(node), graphNodeKind(node)])), [visibleNodes]);
			const edges = (0, react.useMemo)(() => {
				const priority = /* @__PURE__ */ new Map([
					["entity", 0],
					["scope", 1],
					["causal", 2],
					["semantic", 3],
					["temporal", 4]
				]);
				return props.graph.edges.filter((edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId)).map((edge, index) => ({
					edge,
					index
				})).sort((left, right) => (priority.get(left.edge.type ?? "temporal") ?? 5) - (priority.get(right.edge.type ?? "temporal") ?? 5) || left.index - right.index).slice(0, 180).map(({ edge }) => edge);
			}, [props.graph.edges, visibleIds]);
			const curvedEdges = (0, react.useMemo)(() => {
				const groups = /* @__PURE__ */ new Map();
				edges.forEach((edge, index) => {
					const key = [edge.sourceId, edge.targetId].sort().join("::");
					groups.set(key, [...groups.get(key) ?? [], index]);
				});
				return edges.map((edge, index) => {
					const key = [edge.sourceId, edge.targetId].sort().join("::");
					const group = groups.get(key) ?? [index];
					return {
						edge,
						offset: (group.indexOf(index) - (group.length - 1) / 2) * 12
					};
				});
			}, [edges]);
			const layoutKey = `${visibleNodes.map((node) => `${graphNodeKey(node)}:${graphNodeKind(node)}:${node.category ?? "general"}`).join("|")}::${edges.map((edge) => `${edge.sourceId}>${edge.targetId}:${edge.type ?? "temporal"}`).join("|")}`;
			const naturalLayout = (0, react.useMemo)(() => naturalGraphPositions(visibleNodes, edges), [layoutKey]);
			const [positions, setPositions] = (0, react.useState)(() => naturalLayout);
			const [layoutMode, setLayoutMode] = (0, react.useState)("natural");
			const positionsRef = (0, react.useRef)(positions);
			const animationRef = (0, react.useRef)(null);
			const dragRef = (0, react.useRef)(null);
			const commitPositions = (0, react.useCallback)((next) => {
				positionsRef.current = next;
				setPositions(next);
			}, []);
			const cancelAnimation = (0, react.useCallback)(() => {
				if (animationRef.current !== null && typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}, []);
			const animateTo = (0, react.useCallback)((target, mode) => {
				cancelAnimation();
				setLayoutMode(mode);
				if (typeof window.requestAnimationFrame !== "function") {
					commitPositions(target);
					return;
				}
				const start = new Map(positionsRef.current);
				const startedAt = performance.now();
				const tick = (time) => {
					const progress = Math.min(1, (time - startedAt) / 620);
					const eased = 1 - Math.pow(1 - progress, 3);
					const next = /* @__PURE__ */ new Map();
					for (const [id, destination] of target) {
						const origin = start.get(id) ?? {
							x: GRAPH_WIDTH / 2,
							y: GRAPH_HEIGHT / 2
						};
						next.set(id, {
							x: origin.x + (destination.x - origin.x) * eased,
							y: origin.y + (destination.y - origin.y) * eased
						});
					}
					commitPositions(next);
					if (progress < 1) animationRef.current = window.requestAnimationFrame(tick);
					else animationRef.current = null;
				};
				animationRef.current = window.requestAnimationFrame(tick);
			}, [cancelAnimation, commitPositions]);
			(0, react.useEffect)(() => {
				animateTo(naturalLayout, "natural");
			}, [layoutKey]);
			(0, react.useEffect)(() => () => cancelAnimation(), [cancelAnimation]);
			const beginDrag = (event, nodeId) => {
				cancelAnimation();
				dragRef.current = {
					nodeId,
					pointerId: event.pointerId,
					startX: event.clientX,
					startY: event.clientY,
					moved: false
				};
				event.currentTarget.setPointerCapture?.(event.pointerId);
			};
			const moveDrag = (event) => {
				const drag = dragRef.current;
				const svg = event.currentTarget.ownerSVGElement;
				if (drag === null || svg === null || drag.pointerId !== event.pointerId) return;
				if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) return;
				drag.moved = true;
				const point = graphPoint(svg, event.clientX, event.clientY);
				const next = new Map(positionsRef.current);
				next.set(drag.nodeId, point);
				commitPositions(next);
				setLayoutMode("custom");
			};
			const endDrag = (event) => {
				const drag = dragRef.current;
				if (drag === null || drag.pointerId !== event.pointerId) return;
				const svg = event.currentTarget.ownerSVGElement;
				if (drag.moved && svg !== null) {
					const next = new Map(positionsRef.current);
					next.set(drag.nodeId, graphPoint(svg, event.clientX, event.clientY));
					commitPositions(next);
				}
				dragRef.current = null;
				event.currentTarget.releasePointerCapture?.(event.pointerId);
				if (!drag.moved) {
					const node = visibleNodes.find((candidate) => graphNodeKey(candidate) === drag.nodeId);
					if (node !== void 0) props.onSelect(node);
				}
			};
			const cancelDrag = (event) => {
				if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
			};
			const nudge = (nodeId, dx, dy) => {
				cancelAnimation();
				const current = positionsRef.current.get(nodeId);
				if (current === void 0) return;
				const next = new Map(positionsRef.current);
				next.set(nodeId, clampGraphPosition({
					x: current.x + dx,
					y: current.y + dy
				}));
				commitPositions(next);
				setLayoutMode("custom");
			};
			const layoutLabel = t(layoutMode === "natural" ? "graph.layoutNatural" : layoutMode === "uniform" ? "graph.layoutUniform" : "graph.layoutCustom");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.graphCanvasControls,
				role: "toolbar",
				"aria-label": t("graph.layoutAria"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						role: "status",
						"aria-label": t("graph.layoutStatus", { layout: layoutLabel }),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {}), t("graph.draggable", { layout: layoutLabel })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"data-active": layoutMode === "natural" || void 0,
						onClick: () => animateTo(naturalGraphPositions(visibleNodes, edges), "natural"),
						children: t("graph.naturalAction")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"data-active": layoutMode === "uniform" || void 0,
						onClick: () => animateTo(uniformGraphPositions(visibleNodes), "uniform"),
						children: t("graph.uniformAction")
					})
				]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className: css.graphSvg,
				viewBox: `0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`,
				role: "img",
				"data-layout": layoutMode,
				"data-density": visibleNodes.length <= 12 ? "sparse" : "dense",
				"aria-label": t("graph.aria", {
					nodes: props.graph.nodes.length,
					edges: props.graph.edges.length
				}),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pattern", {
						id: "mnemon-grid",
						width: "26",
						height: "26",
						patternUnits: "userSpaceOnUse",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M 26 0 L 0 0 0 26",
							className: css.graphGridLine,
							fill: "none"
						})
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("filter", {
						id: "mnemon-glow",
						x: "-100%",
						y: "-100%",
						width: "300%",
						height: "300%",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("feGaussianBlur", {
							stdDeviation: "4",
							result: "blur"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("feMerge", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("feMergeNode", { in: "blur" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("feMergeNode", { in: "SourceGraphic" })] })]
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						width: GRAPH_WIDTH,
						height: GRAPH_HEIGHT,
						className: css.graphBackdrop
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
						width: GRAPH_WIDTH,
						height: GRAPH_HEIGHT,
						fill: "url(#mnemon-grid)"
					}),
					curvedEdges.map(({ edge, offset }, index) => {
						const source = positions.get(edge.sourceId) ?? naturalLayout.get(edge.sourceId) ?? {
							x: GRAPH_WIDTH / 2,
							y: GRAPH_HEIGHT / 2
						};
						const target = positions.get(edge.targetId) ?? naturalLayout.get(edge.targetId) ?? {
							x: GRAPH_WIDTH / 2,
							y: GRAPH_HEIGHT / 2
						};
						const dx = target.x - source.x;
						const dy = target.y - source.y;
						const distance = Math.max(1, Math.hypot(dx, dy));
						const direction = edge.sourceId.localeCompare(edge.targetId) <= 0 ? 1 : -1;
						const controlX = (source.x + target.x) / 2 - dy / distance * offset * direction;
						const controlY = (source.y + target.y) / 2 + dx / distance * offset * direction;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`,
							className: css.graphEdge,
							"data-edge": edge.type ?? "temporal",
							"data-source-id": edge.sourceId,
							"data-target-id": edge.targetId,
							"data-source-kind": visibleKinds.get(edge.sourceId),
							"data-target-kind": visibleKinds.get(edge.targetId)
						}, `${edge.sourceId}-${edge.targetId}-${index}`);
					}),
					visibleNodes.map((node, index) => {
						const nodeKey = graphNodeKey(node);
						const position = positions.get(nodeKey) ?? naturalLayout.get(nodeKey) ?? {
							x: GRAPH_WIDTH / 2,
							y: GRAPH_HEIGHT / 2
						};
						const selected = props.selectedId === nodeKey;
						const showLabel = selected || visibleNodes.length < 22 || index % 3 === 0;
						return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("g", {
							className: css.graphNode,
							"data-node-id": nodeKey,
							"data-provider": node.memoryProviderId,
							"data-category": node.category ?? "general",
							"data-kind": graphNodeKind(node),
							"data-selected": selected || void 0,
							transform: `translate(${position.x} ${position.y})`,
							role: "button",
							tabIndex: 0,
							"aria-label": `${graphKindLabel(t, node)}: ${(0, dsh_mnemon_client.short)(node.content, 80)}`,
							"data-dragging": dragRef.current?.nodeId === nodeKey || void 0,
							onPointerDown: (event) => beginDrag(event, nodeKey),
							onPointerMove: moveDrag,
							onPointerUp: endDrag,
							onPointerCancel: cancelDrag,
							onLostPointerCapture: cancelDrag,
							onClick: () => props.onSelect(node),
							onKeyDown: (event) => {
								if (event.key === "Enter" || event.key === " ") props.onSelect(node);
								else if (event.key === "ArrowLeft") {
									event.preventDefault();
									nudge(nodeKey, -12, 0);
								} else if (event.key === "ArrowRight") {
									event.preventDefault();
									nudge(nodeKey, 12, 0);
								} else if (event.key === "ArrowUp") {
									event.preventDefault();
									nudge(nodeKey, 0, -12);
								} else if (event.key === "ArrowDown") {
									event.preventDefault();
									nudge(nodeKey, 0, 12);
								}
							},
							children: [
								graphNodeKind(node) === "space" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
									x: selected ? -20 : -17,
									y: selected ? -15 : -13,
									width: selected ? 40 : 34,
									height: selected ? 30 : 26,
									rx: "9",
									className: css.nodeHalo,
									filter: selected ? "url(#mnemon-glow)" : void 0
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									r: selected ? 6 : 5,
									className: css.nodeCore
								})] }) : graphNodeKind(node) === "entity" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
									d: selected ? "M 0 -18 L 18 0 L 0 18 L -18 0 Z" : "M 0 -14 L 14 0 L 0 14 L -14 0 Z",
									className: css.nodeHalo,
									filter: selected ? "url(#mnemon-glow)" : void 0
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									r: selected ? 5 : 4,
									className: css.nodeCore
								})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									r: selected ? 17 : visibleNodes.length <= 12 ? 14 : 11,
									className: css.nodeHalo,
									filter: selected ? "url(#mnemon-glow)" : void 0
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
									r: selected ? 7 : visibleNodes.length <= 12 ? 6 : 4.5,
									className: css.nodeCore
								})] }),
								(selected || visibleNodes.length <= 12) && graphNodeKind(node) === "memory" && node.memoryBodyName !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
									x: "0",
									y: "-18",
									textAnchor: "middle",
									className: css.nodeBodyLabel,
									children: (0, dsh_mnemon_client.short)(node.memoryBodyName, 12)
								}),
								showLabel && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("text", {
									x: visibleNodes.length <= 12 ? 19 : 15,
									y: "4",
									className: css.nodeLabel,
									children: (0, dsh_mnemon_client.short)(node.content.replace(/\s+/gu, " "), selected ? 34 : visibleNodes.length <= 12 ? 26 : 19)
								})
							]
						}, nodeKey);
					})
				]
			})] });
		}
		function OverviewPage(props) {
			const t = useT();
			const locale = (0, dsh_mnemon_client.useLocale)();
			const spaceCreateFormId = (0, react.useId)();
			const spaceEditFormId = (0, react.useId)();
			const [graph, setGraph] = (0, react.useState)(null);
			const [catalog, setCatalog] = (0, react.useState)(null);
			const [selected, setSelected] = (0, react.useState)(null);
			const [catalogLoading, setCatalogLoading] = (0, react.useState)(true);
			const [healthLoading, setHealthLoading] = (0, react.useState)(true);
			const [graphLoading, setGraphLoading] = (0, react.useState)(true);
			const [error, setError] = (0, react.useState)(null);
			const [changing, setChanging] = (0, react.useState)(null);
			const [reconnectingSpace, setReconnectingSpace] = (0, react.useState)(null);
			const [creating, setCreating] = (0, react.useState)(false);
			const [creatingSpaceOpen, setCreatingSpaceOpen] = (0, react.useState)(false);
			const [spaceName, setSpaceName] = (0, react.useState)("");
			const [spaceDescription, setSpaceDescription] = (0, react.useState)("");
			const [spaceProviderId, setSpaceProviderId] = (0, react.useState)("mnemon-native");
			const [providerDrafts, setProviderDrafts] = (0, react.useState)({});
			const [catalogUnavailable, setCatalogUnavailable] = (0, react.useState)(false);
			const [editingSpace, setEditingSpace] = (0, react.useState)(null);
			const [editName, setEditName] = (0, react.useState)("");
			const [editDescription, setEditDescription] = (0, react.useState)("");
			const [editConnection, setEditConnection] = (0, react.useState)({});
			const [editClearSecrets, setEditClearSecrets] = (0, react.useState)([]);
			const [savingSpace, setSavingSpace] = (0, react.useState)(null);
			const [confirmingDeleteSpace, setConfirmingDeleteSpace] = (0, react.useState)(null);
			const [deletingSpace, setDeletingSpace] = (0, react.useState)(null);
			const [preview, setPreview] = (0, react.useState)(null);
			const [metadataOpen, setMetadataOpen] = (0, react.useState)(false);
			const [metadataSelection, setMetadataSelection] = (0, react.useState)([]);
			const [metadataTasks, setMetadataTasks] = (0, react.useState)({});
			const [lastFullSyncAt, setLastFullSyncAt] = (0, react.useState)(null);
			const [syncClock, setSyncClock] = (0, react.useState)(() => Date.now());
			const loadRequest = (0, react.useRef)(0);
			const initialSyncStarted = (0, react.useRef)(false);
			const directoryRetryStarted = (0, react.useRef)(false);
			const fullSyncObserved = (0, react.useRef)(true);
			const load = (0, react.useCallback)(async (quiet = false) => {
				const request = ++loadRequest.current;
				setCatalogLoading(true);
				setHealthLoading(true);
				setGraphLoading(true);
				setError(null);
				let directoryUnavailable = false;
				try {
					const nextCatalog = await props.client.bodyDirectory().then((next) => {
						setCatalogUnavailable(false);
						return next;
					}).catch(() => {
						directoryUnavailable = true;
						setCatalogUnavailable(!props.catalogKnown);
						return {
							items: props.fallbackBodies,
							providers: [],
							total: props.fallbackBodies.length,
							activeCount: props.fallbackBodies.filter((body) => body.active).length,
							directory: props.fallbackDirectory ?? "",
							generatedAt: (/* @__PURE__ */ new Date()).toISOString()
						};
					});
					if (request !== loadRequest.current) return;
					setProviderDrafts((current) => mergeProviderDefaults(nextCatalog.providers, current));
					setCatalog(nextCatalog);
					setCatalogLoading(false);
					props.client.bodies().then((next) => {
						if (request !== loadRequest.current) return;
						setCatalog(next);
					}).catch((reason) => {
						if (request === loadRequest.current && !quiet && !directoryUnavailable) setError((0, dsh_mnemon_client.message)(reason));
					}).finally(() => {
						if (request === loadRequest.current) setHealthLoading(false);
					});
					props.client.graph().then((next) => {
						if (request !== loadRequest.current) return;
						const enriched = enrichMultiSpaceGraph(next, nextCatalog.items);
						setGraph(enriched);
						setSelected((current) => current === null ? null : enriched.nodes.find((node) => graphNodeKey(node) === graphNodeKey(current)) ?? null);
					}).catch((reason) => {
						if (request === loadRequest.current && !directoryUnavailable) setError((0, dsh_mnemon_client.message)(reason));
					}).finally(() => {
						if (request === loadRequest.current) setGraphLoading(false);
					});
				} catch (reason) {
					if (request === loadRequest.current) {
						setError((0, dsh_mnemon_client.message)(reason));
						setCatalogLoading(false);
						setHealthLoading(false);
						setGraphLoading(false);
					}
				}
			}, [
				props.catalogKnown,
				props.client,
				props.fallbackBodies,
				props.fallbackDirectory
			]);
			(0, react.useEffect)(() => {
				if (initialSyncStarted.current) return;
				initialSyncStarted.current = true;
				load();
			}, [load]);
			const seenReload = (0, react.useRef)(props.reloadKey);
			(0, react.useEffect)(() => {
				if (seenReload.current === props.reloadKey) return;
				seenReload.current = props.reloadKey;
				load(true);
			}, [load, props.reloadKey]);
			(0, react.useEffect)(() => {
				if (!catalogUnavailable || !props.catalogKnown || directoryRetryStarted.current) return;
				directoryRetryStarted.current = true;
				load(true);
			}, [
				catalogUnavailable,
				load,
				props.catalogKnown
			]);
			(0, react.useEffect)(() => {
				const timer = window.setInterval(() => setSyncClock(Date.now()), 1e3);
				return () => window.clearInterval(timer);
			}, []);
			(0, react.useEffect)(() => {
				setSpaceProviderId((current) => readyProviderId(catalog?.providers ?? [], current) ?? current);
			}, [catalog]);
			const toggle = async (body) => {
				setChanging(body.id);
				setError(null);
				try {
					await props.client.updateBody(body.id, { active: !body.active });
					await load(true);
					props.onMutate();
				} catch (reason) {
					setError((0, dsh_mnemon_client.message)(reason));
				} finally {
					setChanging(null);
				}
			};
			const reconnect = async (body) => {
				if (reconnectingSpace !== null || editingSpace !== null || deletingSpace !== null) return;
				setReconnectingSpace(body.id);
				setError(null);
				setCatalog((current) => current === null ? current : {
					...current,
					items: current.items.map((item) => item.id === body.id ? {
						...item,
						statusLoading: true
					} : item)
				});
				try {
					const next = await props.client.reconnectBody(body.id);
					setCatalog((current) => current === null ? current : {
						...current,
						items: current.items.map((item) => item.id === next.id ? next : item)
					});
					props.onBodyReconnect(next);
				} catch (reason) {
					const failure = (0, dsh_mnemon_client.message)(reason);
					setCatalog((current) => current === null ? current : {
						...current,
						items: current.items.map((item) => item.id === body.id ? {
							...item,
							healthy: false,
							statusLoading: false,
							error: failure
						} : item)
					});
					setError(failure);
				} finally {
					setReconnectingSpace(null);
				}
			};
			const beginEdit = (body) => {
				setEditingSpace(body.id);
				setEditName(body.name);
				setEditDescription(body.description ?? "");
				setError(null);
				setEditConnection(nativeSpaceProvider(body.provider) ? {} : { ...body.provider.settings });
				setEditClearSecrets([]);
			};
			const saveEdit = async (event, body) => {
				event.preventDefault();
				if (editName.trim() === "") return;
				setSavingSpace(body.id);
				setError(null);
				try {
					const descriptor = catalog?.providers.find((provider) => provider.id === body.provider.id);
					const connection = descriptor === void 0 ? {} : Object.fromEntries(Object.entries(editConnection).filter(([key, value]) => {
						return descriptor.fields.find((candidate) => candidate.key === key)?.input !== "secret" || String(value) !== "";
					}));
					await props.client.updateBody(body.id, {
						name: editName,
						description: editDescription,
						...nativeSpaceProvider(body.provider) ? {} : {
							connection,
							...editClearSecrets.length === 0 ? {} : { clearSecrets: editClearSecrets }
						}
					});
					setEditingSpace(null);
					await load(true);
					props.onMutate();
				} catch (reason) {
					setError((0, dsh_mnemon_client.message)(reason));
				} finally {
					setSavingSpace(null);
				}
			};
			const create = async (event) => {
				event.preventDefault();
				const providers = catalog?.providers ?? [];
				const manualProvider = providers.find((provider) => provider.id === spaceProviderId);
				if (spaceName.trim() === "" || spaceDescription.trim() === "" || !providerDraftComplete(manualProvider, providerDrafts[spaceProviderId])) return;
				setCreating(true);
				setError(null);
				try {
					await props.client.createBody({
						name: spaceName,
						description: spaceDescription,
						providerId: spaceProviderId,
						...manualProvider?.origin === "native" ? {} : { connection: providerDrafts[spaceProviderId] ?? {} }
					});
					setSpaceName("");
					setSpaceDescription("");
					setSpaceProviderId((current) => readyProviderId(providers) ?? current);
					setProviderDrafts((current) => Object.fromEntries(providers.map((provider) => [provider.id, Object.fromEntries(Object.entries(current[provider.id] ?? {}).map(([key, value]) => [key, provider.fields.some((field) => field.key === key && field.input === "secret") ? "" : value]))])));
					setCreatingSpaceOpen(false);
					await load(true);
					props.onMutate();
				} catch (reason) {
					setError((0, dsh_mnemon_client.message)(reason));
				} finally {
					setCreating(false);
				}
			};
			const deleteBody = async (body) => {
				setDeletingSpace(body.id);
				setError(null);
				try {
					await props.client.deleteBody(body.id);
					setConfirmingDeleteSpace(null);
					await load(true);
					props.onMutate();
				} catch (reason) {
					setError((0, dsh_mnemon_client.message)(reason));
				} finally {
					setDeletingSpace(null);
				}
			};
			const maintainMetadata = () => {
				if (metadataSelection.length === 0) return;
				const selectedIds = metadataSelection.filter((id) => metadataTasks[id]?.status !== "running");
				if (selectedIds.length === 0) return;
				setError(null);
				setMetadataSelection([]);
				setMetadataTasks((current) => ({
					...current,
					...Object.fromEntries(selectedIds.map((id) => [id, { status: "running" }]))
				}));
				for (const id of selectedIds) props.metadataClient.maintainBodyMetadata([id]).then((result) => {
					const update = result.updates.find((candidate) => candidate.memoryBodyId === id);
					if (update === void 0) throw new Error(`metadata task Agent omitted Memory Space ${id}`);
					setCatalog((current) => current === null ? current : {
						...current,
						items: current.items.map((body) => body.id === id ? {
							...body,
							name: update.title,
							description: update.description
						} : body)
					});
					props.onBodyMetadata([update]);
					setMetadataTasks((current) => ({
						...current,
						[id]: { status: "success" }
					}));
				}).catch((reason) => {
					setMetadataTasks((current) => ({
						...current,
						[id]: {
							status: "error",
							error: (0, dsh_mnemon_client.message)(reason)
						}
					}));
				});
			};
			const generated = graph === null ? t("overview.waitingSnapshot") : t("overview.updatedAt", { time: new Date(graph.generatedAt).toLocaleTimeString(locale, {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit"
			}) });
			const graphSpaces = graph?.nodes.filter((node) => graphNodeKind(node) === "space").length ?? 0;
			const graphEntities = graph?.nodes.filter((node) => graphNodeKind(node) === "entity").length ?? 0;
			const graphMemories = graph?.nodes.filter((node) => graphNodeKind(node) === "memory").length ?? 0;
			const graphSources = graph?.sources ?? [];
			const onlyQueryOrUnsupported = graphSources.length > 0 && graphSources.every((source) => source.mode === "query-only" || source.mode === "unsupported" || source.status === "unavailable");
			const selectedKind = selected === null ? null : graphNodeKind(selected);
			const editingSpaceView = editingSpace === null ? void 0 : catalog?.items.find((body) => body.id === editingSpace);
			const deletingSpaceView = confirmingDeleteSpace === null ? void 0 : catalog?.items.find((body) => body.id === confirmingDeleteSpace);
			const providers = catalog?.providers ?? [];
			const metadataCandidates = (catalog?.items ?? props.fallbackBodies).filter((body) => body.active && body.providerEnabled !== false);
			const metadataRunningCount = Object.values(metadataTasks).filter((task) => task.status === "running").length;
			const metadataBusy = metadataRunningCount > 0;
			const metadataSelectable = metadataCandidates.filter((body) => metadataTasks[body.id]?.status !== "running");
			const metadataAllSelected = metadataSelectable.length > 0 && metadataSelectable.every((body) => metadataSelection.includes(body.id));
			const loading = catalogLoading || healthLoading || graphLoading;
			(0, react.useEffect)(() => {
				if (loading) {
					fullSyncObserved.current = true;
					return;
				}
				if (!fullSyncObserved.current) return;
				fullSyncObserved.current = false;
				if (error !== null) return;
				const completedAt = Date.now();
				setLastFullSyncAt(completedAt);
				setSyncClock(completedAt);
			}, [error, loading]);
			const fullSyncAge = lastFullSyncAt === null ? t("overview.fullSyncPending") : (() => {
				const seconds = Math.max(0, Math.floor((syncClock - lastFullSyncAt) / 1e3));
				if (seconds < 5) return t("overview.fullSyncJustNow");
				if (seconds < 60) return t("overview.fullSyncSeconds", { count: seconds });
				const minutes = Math.floor(seconds / 60);
				if (minutes < 60) return t("overview.fullSyncMinutes", { count: minutes });
				const hours = Math.floor(minutes / 60);
				if (hours < 24) return t("overview.fullSyncHours", { count: hours });
				return t("overview.fullSyncDays", { count: Math.floor(hours / 24) });
			})();
			const selectedProvider = providers.find((provider) => provider.id === spaceProviderId);
			const nativeSpaceCount = catalog?.items.filter((body) => nativeSpaceProvider(body.provider)).length ?? 0;
			const canDeleteSpace = (body) => !nativeSpaceProvider(body.provider) || nativeSpaceCount > 1;
			const updateProviderDraft = (providerId, key, value) => setProviderDrafts((current) => ({
				...current,
				[providerId]: {
					...current[providerId] ?? {},
					[key]: value
				}
			}));
			const placementReceipt = (body) => body.placement === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.placementReceipt,
				title: body.placement.reason,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					"aria-hidden": "true",
					children: "✦"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(body.placement.decidedBy === "llm" ? "overview.placementByLlm" : "overview.placementByRules") }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("overview.placementConfidence", { confidence: t(`overview.confidence.${body.placement.confidence}`) }) }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: body.placement.reason })
				] })]
			});
			const spaceEditForm = (body) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
				id: spaceEditFormId,
				className: css.bodyEdit,
				onSubmit: (event) => void saveEdit(event, body),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [t("overview.editName"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						"aria-label": t("overview.editName"),
						value: editName,
						onChange: (event) => setEditName(event.target.value),
						maxLength: 100,
						required: true
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [t("overview.editDescription"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
						"aria-label": t("overview.editDescription"),
						value: editDescription,
						onChange: (event) => setEditDescription(event.target.value),
						rows: 4,
						maxLength: 1e3
					})] }),
					!nativeSpaceProvider(body.provider) && (() => {
						const descriptor = providers.find((provider) => provider.id === body.provider.id);
						return descriptor === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderMemoryFields, {
							provider: descriptor,
							connection: editConnection,
							onChange: (key, value) => setEditConnection((current) => ({
								...current,
								[key]: value
							})),
							body,
							clearSecrets: editClearSecrets,
							onClearSecretsChange: setEditClearSecrets
						});
					})()
				]
			});
			const spaceCreateForm = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
				id: spaceCreateFormId,
				className: (0, dsh_mnemon_client.appearanceClass)(css.bodyEdit, css.bodyCreateForm),
				onSubmit: (event) => void create(event),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: css.createSection,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.createSectionHeading,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "01" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("overview.createIdentityTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("overview.createIdentityHint") })] })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.createIdentityGrid,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [t("overview.createName"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							"data-autofocus": true,
							"aria-label": t("overview.createName"),
							value: spaceName,
							onChange: (event) => setSpaceName(event.target.value),
							placeholder: t("overview.createNamePlaceholder"),
							maxLength: 100,
							required: true
						})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [t("overview.createDescription"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							"aria-label": t("overview.createDescription"),
							value: spaceDescription,
							onChange: (event) => setSpaceDescription(event.target.value),
							placeholder: t("overview.createDescriptionPlaceholder"),
							rows: 3,
							maxLength: 1e3,
							required: true
						})] })]
					})]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: css.createSection,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.createSectionHeading,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "02" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("overview.createPlacementTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("overview.createPlacementHint") })] })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
							className: css.providerChoice,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("overview.providerLabel") }), readyFirst(providers).map((provider) => {
								const serviceMissing = provider.serviceConfigured === false;
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									"data-selected": spaceProviderId === provider.id || void 0,
									"data-native": provider.origin === "native" || void 0,
									"data-disabled": serviceMissing || void 0,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "radio",
											name: "memory-provider",
											value: provider.id,
											checked: spaceProviderId === provider.id,
											disabled: serviceMissing,
											onChange: () => setSpaceProviderId(provider.id)
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
											providerId: provider.id,
											icon: provider.icon,
											className: css.providerChoiceIcon
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [provider.label, provider.origin === "native" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("overview.nativeOfficial") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: serviceMissing ? t(providerUnavailableKey(provider)) : `${t(`overview.workspaceBinding.${provider.workspaceBinding}`)} · ${providerSummary(t, provider)}` })] }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {
											className: css.choiceControl,
											"data-kind": "radio",
											"aria-hidden": "true"
										})
									]
								}, provider.id);
							})]
						}),
						providers.some((provider) => provider.serviceConfigured === false) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
							className: css.providerEnableHint,
							children: t("overview.providerEnableHint")
						}),
						selectedProvider !== void 0 && selectedProvider.origin !== "native" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderMemoryFields, {
							provider: selectedProvider,
							connection: providerDrafts[selectedProvider.id] ?? {},
							onChange: (key, value) => updateProviderDraft(selectedProvider.id, key, value)
						})
					]
				})]
			});
			const spaceToggle = (body) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: css.bodySwitch,
				role: "switch",
				"aria-checked": body.active,
				"aria-label": t("overview.toggleAria", { name: body.name }),
				disabled: !props.activationEnabled || changing === body.id || deletingSpace === body.id,
				onClick: () => void toggle(body),
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: css.bodySwitchTrack,
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {})
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: changing === body.id ? t("overview.toggling") : body.active ? t("common.active") : t("common.inactive") })]
			});
			const spaceEditActionClass = (0, dsh_mnemon_client.appearanceClass)(css.ghostButton, (0, dsh_mnemon_client.appearanceClass)(sidebarCss.itemActionButton, sidebarCss.itemEditAction));
			const spaceDeleteActionClass = (0, dsh_mnemon_client.appearanceClass)(css.dangerButton, (0, dsh_mnemon_client.appearanceClass)(sidebarCss.itemActionButton, sidebarCss.itemDangerAction));
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.page,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.PageHeader, {
						title: t("nav.overview"),
						description: t("overview.pageDescription"),
						meta: fullSyncAge,
						...loading ? { loadingLabel: catalogLoading ? t("overview.directoryLoading") : graphLoading ? t("overview.snapshotLoading") : t("overview.healthLoading") } : {}
					}),
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.inlineError,
						role: "alert",
						children: error
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: css.bodyDirectory,
						"aria-label": t("overview.directory"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.bodyDirectoryHeader,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("overview.directory") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("overview.directory.description") }),
								catalogUnavailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
									className: css.bodyDirectoryPath,
									children: t("overview.directory.unsynced")
								})
							] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: (0, dsh_mnemon_client.appearanceClass)(css.bodyDirectoryControls, sidebarCss.bodyDirectoryActions),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: catalogUnavailable ? t("overview.directory.unsyncedBadge") : `${catalog?.activeCount ?? "—"} / ${catalog?.total ?? "—"} ${t("common.active")}` }),
									props.writeEnabled && !catalogUnavailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: spaceEditActionClass,
										title: !props.agentAvailable ? t("overview.metadataUnavailable") : void 0,
										onClick: () => {
											setMetadataSelection([]);
											setMetadataTasks({});
											setMetadataOpen(true);
											if (!props.agentAvailable) props.onAgentRefresh();
										},
										children: t("overview.metadataAction")
									}),
									props.writeEnabled && !catalogUnavailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: spaceEditActionClass,
										onClick: () => setCreatingSpaceOpen(true),
										children: t("overview.createTitle")
									})
								]
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.bodyGrid,
							children: [catalog?.items.map((body) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("article", {
								className: css.bodyCard,
								"data-provider": body.provider.id,
								"data-active": body.active || void 0,
								"data-healthy": !body.statusLoading && body.healthy || void 0,
								"data-status-loading": body.statusLoading || void 0,
								"data-reconnectable": "",
								"data-reconnecting": reconnectingSpace === body.id || void 0,
								"data-mnemon-default": body.mnemonDefault || void 0,
								"data-editing": void 0,
								tabIndex: 0,
								"aria-label": t("overview.reconnectAria", { name: body.name }),
								title: reconnectingSpace === body.id ? t("overview.reconnecting") : body.error ?? t("overview.reconnectHint"),
								onClick: (event) => {
									if (event.target instanceof Element && event.target.closest("button, input, textarea, select, label, a, [role=\"switch\"]") !== null) return;
									reconnect(body);
								},
								onKeyDown: (event) => {
									if (event.target !== event.currentTarget || event.key !== "Enter" && event.key !== " ") return;
									event.preventDefault();
									reconnect(body);
								},
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: sidebarCss.bodyCardHeader,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: sidebarCss.bodyCardIdentity,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: css.bodySignal }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
												title: body.id,
												children: body.name
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: sidebarCss.bodyCardMeta,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryProviderBadge, {
														providerId: body.provider.id,
														label: body.provider.label
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
														className: css.bodyHealth,
														children: reconnectingSpace === body.id ? t("overview.reconnecting") : body.statusLoading ? t("overview.storageChecking") : body.healthy ? t("overview.storageHealthy") : t("overview.storageUnhealthy")
													}),
													body.mnemonDefault && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
														className: css.mnemonDefaultBadge,
														children: t("overview.mnemonDefault")
													})
												]
											})] })]
										}), spaceToggle(body)]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										title: body.description || t("overview.noDescription"),
										children: body.description || t("overview.noDescription")
									}),
									placementReceipt(body),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
										className: sidebarCss.bodyCardFooter,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: sidebarCss.bodyCardStats,
											children: !nativeSpaceProvider(body.provider) ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: css.bodyFooterBlock,
												title: t(body.provider.kind === "remote" ? "overview.providerRemote" : "overview.providerLocal"),
												children: t(body.provider.kind === "remote" ? "overview.providerRemote" : "overview.providerLocal")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: `${css.bodyFooterBlock} ${css.bodyFooterGrow}`,
												title: body.provider.location || body.provider.label,
												children: body.provider.location || body.provider.label
											})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: css.bodyFooterBlock,
													title: t("common.memories", { count: body.stats?.totalInsights ?? 0 }),
													children: t("common.memories", { count: body.stats?.totalInsights ?? 0 })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: css.bodyFooterBlock,
													title: t("common.edges", { count: body.stats?.edgeCount ?? 0 }),
													children: t("common.edges", { count: body.stats?.edgeCount ?? 0 })
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: css.bodyFooterBlock,
													title: (0, dsh_mnemon_client.humanBytes)(body.stats?.dbSizeBytes ?? 0),
													children: (0, dsh_mnemon_client.humanBytes)(body.stats?.dbSizeBytes ?? 0)
												})
											] })
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: css.bodyCardActions,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: spaceEditActionClass,
												"aria-label": t("overview.editSpaceAria", { name: body.name }),
												disabled: !props.writeEnabled || deletingSpace === body.id,
												onClick: () => beginEdit(body),
												children: t("overview.editSpace")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: spaceDeleteActionClass,
												"aria-label": t(!nativeSpaceProvider(body.provider) ? "overview.disconnectSpaceAria" : "overview.deleteSpaceAria", { name: body.name }),
												title: canDeleteSpace(body) ? void 0 : t("overview.lastStoreDeleteHint"),
												disabled: !props.writeEnabled || deletingSpace === body.id || !canDeleteSpace(body),
												onClick: () => setConfirmingDeleteSpace(body.id),
												children: !nativeSpaceProvider(body.provider) ? t("overview.disconnectSpace") : t("overview.deleteSpace")
											})]
										})]
									})
								] })
							}, body.id)), catalog?.total === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.bodyDirectoryEmpty,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "◇" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: catalogUnavailable ? t("overview.unsyncedTitle") : t("overview.emptyTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: catalogUnavailable ? t("overview.unsyncedShort") : t("overview.emptyShort") })] })]
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.asyncRegion,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ReadSourcePanel, {
							title: t("overview.snapshotSources"),
							hint: t("overview.snapshotSourcesHint"),
							sources: graphSources
						})
					}),
					creatingSpaceOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SidebarModal, {
						title: t("overview.createTitle"),
						description: t("overview.createDialogHint"),
						busy: creating,
						wide: true,
						onClose: () => setCreatingSpaceOpen(false),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.modalFooterActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"data-dialog-close": true,
								className: css.secondaryButton,
								disabled: creating,
								onClick: () => setCreatingSpaceOpen(false),
								children: t("common.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "submit",
								form: spaceCreateFormId,
								className: css.primaryButton,
								disabled: creating || spaceName.trim() === "" || spaceDescription.trim() === "" || !providerDraftComplete(selectedProvider, providerDrafts[spaceProviderId]),
								children: creating ? t("overview.creating") : t("overview.createAction")
							})]
						}),
						children: spaceCreateForm
					}),
					metadataOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SidebarModal, {
						title: t("overview.metadataTitle"),
						description: t("overview.metadataDescription"),
						busy: metadataBusy,
						wide: true,
						onClose: () => setMetadataOpen(false),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: css.modalFooterNote,
							children: t("overview.metadataSafety")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.modalFooterActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"data-dialog-close": true,
								className: css.secondaryButton,
								disabled: metadataBusy,
								onClick: () => setMetadataOpen(false),
								children: t("common.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: css.primaryButton,
								disabled: !props.agentAvailable || metadataSelection.length === 0,
								title: !props.agentAvailable ? t("overview.metadataUnavailable") : void 0,
								onClick: maintainMetadata,
								children: t("overview.metadataGenerate", { count: metadataSelection.length })
							})]
						})] }),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.metadataDialog,
							children: [
								!props.agentAvailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: css.inlineError,
									role: "status",
									children: t("overview.metadataUnavailable")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.metadataToolbar,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [t("overview.metadataSelected", { count: metadataSelection.length }), metadataRunningCount > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("overview.metadataRunningCount", { count: metadataRunningCount }) })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: css.ghostButton,
										disabled: metadataSelectable.length === 0,
										onClick: () => setMetadataSelection(metadataAllSelected ? [] : metadataSelectable.map((body) => body.id)),
										children: metadataAllSelected ? t("overview.metadataClear") : t("overview.metadataSelectAll")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.metadataList,
									"aria-live": "polite",
									children: [metadataCandidates.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: css.metadataEmpty,
										children: catalogLoading ? t("overview.metadataLoading") : t("overview.metadataEmpty")
									}), metadataCandidates.map((body) => {
										const selected = metadataSelection.includes(body.id);
										const task = metadataTasks[body.id];
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											"data-provider": body.provider.id,
											"data-selected": selected || void 0,
											"data-refreshing": task?.status === "running" || void 0,
											"data-refreshed": task?.status === "success" || void 0,
											"data-failed": task?.status === "error" || void 0,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: selected,
													disabled: task?.status === "running",
													onChange: (event) => setMetadataSelection((current) => event.target.checked ? [.../* @__PURE__ */ new Set([...current, body.id])] : current.filter((id) => id !== body.id))
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {
													className: css.choiceControl,
													"data-kind": "check",
													"aria-hidden": "true"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: body.name }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: body.description || t("overview.noDescription") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryProviderBadge, {
														providerId: body.provider.id,
														label: body.provider.label
													}), task === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: body.id }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
														className: css.metadataTaskStatus,
														"data-status": task.status,
														title: task.error,
														children: task.status === "running" ? t("overview.metadataTaskRunning") : task.status === "success" ? t("overview.metadataTaskSuccess") : t("overview.metadataTaskError", { error: task.error ?? t("overview.metadataTaskUnknown") })
													})] })
												] })
											]
										}, body.id);
									})]
								})
							]
						})
					}),
					editingSpaceView !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SidebarModal, {
						title: t("overview.editSpaceAria", { name: editingSpaceView.name }),
						description: editingSpaceView.id,
						busy: savingSpace === editingSpaceView.id,
						onClose: () => setEditingSpace(null),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.modalFooterActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"data-dialog-close": true,
								className: css.secondaryButton,
								disabled: savingSpace === editingSpaceView.id,
								onClick: () => setEditingSpace(null),
								children: t("common.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "submit",
								form: spaceEditFormId,
								className: css.primaryButton,
								disabled: savingSpace === editingSpaceView.id || editName.trim() === "",
								children: savingSpace === editingSpaceView.id ? t("overview.savingSpace") : t("overview.saveSpace")
							})]
						}),
						children: spaceEditForm(editingSpaceView)
					}),
					deletingSpaceView !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SidebarModal, {
						title: t(!nativeSpaceProvider(deletingSpaceView.provider) ? "overview.disconnectTitle" : "overview.deleteTitle", { name: deletingSpaceView.name }),
						description: deletingSpaceView.id,
						busy: deletingSpace === deletingSpaceView.id,
						onClose: () => setConfirmingDeleteSpace(null),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.modalFooterActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								"data-dialog-close": true,
								"data-autofocus": true,
								className: css.secondaryButton,
								disabled: deletingSpace === deletingSpaceView.id,
								onClick: () => setConfirmingDeleteSpace(null),
								children: t("common.cancel")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: css.dangerSolidButton,
								title: canDeleteSpace(deletingSpaceView) ? void 0 : t("overview.lastStoreDeleteHint"),
								disabled: deletingSpace === deletingSpaceView.id || !canDeleteSpace(deletingSpaceView),
								onClick: () => void deleteBody(deletingSpaceView),
								children: deletingSpace === deletingSpaceView.id ? t("overview.deletingSpace") : t(!nativeSpaceProvider(deletingSpaceView.provider) ? "overview.disconnectAction" : "overview.deleteAction")
							})]
						}),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.bodyDeleteConfirm,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t(!nativeSpaceProvider(deletingSpaceView.provider) ? "overview.disconnectWarning" : "overview.deleteWarning", { provider: deletingSpaceView.provider.label }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.bodyDeleteSummary,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: deletingSpaceView.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
									deletingSpaceView.provider.label,
									" · ",
									deletingSpaceView.provider.location || t("common.memories", { count: deletingSpaceView.stats?.totalInsights ?? 0 })
								] })]
							})]
						})
					}),
					!catalogUnavailable && graph !== null && graph.nodes.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.graphLayout,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: css.graphPanel,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.graphToolbar,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: css.liveDot }),
										t("overview.snapshot"),
										" ",
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: generated })
									] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: css.graphLegend,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"data-edge": "scope",
												children: t("overview.edgeScope")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"data-edge": "temporal",
												children: t("overview.edgeTemporal")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"data-edge": "semantic",
												children: t("overview.edgeSemantic")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"data-edge": "causal",
												children: t("overview.edgeCausal")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"data-edge": "entity",
												children: t("overview.edgeEntity")
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: css.graphViewport,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryGraph, {
										graph,
										selectedId: selected === null ? void 0 : graphNodeKey(selected),
										onSelect: setSelected
									})
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.graphFooter,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("overview.graphComposition", {
										spaces: graphSpaces,
										memories: graphMemories,
										entities: graphEntities
									}) }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
										t("overview.graphCount", {
											visible: Math.min(graph.nodes.length, 60),
											total: graph.nodes.length
										}),
										" · ",
										t("overview.graphEdges", { count: graph.edges.length })
									] })]
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("aside", {
							className: css.graphInspector,
							"data-empty": selected === null || void 0,
							children: selected === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.inspectorEmpty,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: (0, dsh_mnemon_client.appearanceClass)(css.inspectorLogo, sidebarCss.inspectorGlyph),
										"aria-hidden": "true",
										children: "◇"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("overview.selectNode") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("overview.selectNodeText") })
								]
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.inspectorHeading,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(selectedKind === "space" ? "overview.inspectorSpace" : selectedKind === "entity" ? "overview.inspectorEntity" : "overview.inspector") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setSelected(null),
										"aria-label": t("overview.closeInspector"),
										children: "×"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.inspectorChips,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: css.categoryChip,
										children: graphKindLabel(t, selected)
									}), selected.memoryProviderId !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryProviderBadge, {
										providerId: selected.memoryProviderId,
										label: selected.memoryProviderLabel ?? selected.memoryProviderId
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.inspectorTitleRow,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
										className: css.inspectorTitle,
										children: selected.content
									}), selectedKind === "memory" && selected.content.length > 140 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: css.inspectorEye,
										onClick: () => setPreview(selected),
										"aria-label": t("overview.previewAria"),
										title: t("overview.previewAria"),
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
											viewBox: "0 0 16 16",
											width: "13",
											height: "13",
											"aria-hidden": "true",
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
												d: "M1 8s2.6-4.4 7-4.4S15 8 15 8s-2.6 4.4-7 4.4S1 8 1 8z",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: "1.5"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
												cx: "8",
												cy: "8",
												r: "2.1",
												fill: "currentColor"
											})]
										})
									})]
								}),
								selectedKind === "space" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
									className: css.inspectorMeta,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("overview.spaceId") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: selected.memoryBodyId ?? selected.id }) })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("overview.containedMemories") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: selected.occurrenceCount ?? 0 })] })]
								}) : selectedKind === "entity" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
									className: css.inspectorMeta,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("overview.entityMentions") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: selected.occurrenceCount ?? 0 })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("term.spaces") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: selected.memoryBodyNames?.join(" · ") || "—" })] })]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
									className: css.inspectorMeta,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("term.space") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", { children: [
											selected.memoryBodyName ?? "—",
											" ",
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: selected.memoryBodyId ?? "" })
										] })] }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("overview.memoryId") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: selected.id }) })] }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("common.category") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: categoryLabel(t, selected.category ?? "general") })] })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.inspectorActions,
									children: [selectedKind !== "space" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: css.primaryButton,
										onClick: () => props.onExplore(selected.content),
										children: t("overview.exploreNode")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: css.secondaryButton,
										onClick: () => void (0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(selected.id),
										children: t("common.copyId")
									})]
								})
							] })
						})]
					}) : !graphLoading && error === null ? catalogUnavailable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
						glyph: "◇",
						title: t("overview.unsyncedTitle"),
						children: t("overview.unsyncedLong")
					}) : catalog?.total === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
						glyph: "◇",
						title: t("overview.emptyTitle"),
						children: t("overview.emptyLong")
					}) : catalog?.activeCount === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
						glyph: "◇",
						title: t("overview.noActiveTitle"),
						children: t("overview.noActiveText")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
						glyph: "◇",
						title: t(onlyQueryOrUnsupported ? "overview.noVisualTitle" : "overview.noContentTitle"),
						children: t(onlyQueryOrUnsupported ? "overview.noVisualText" : "overview.noContentText")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.asyncPlaceholder,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("overview.loading") })
					}),
					preview !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ContentPreview, {
						node: preview,
						kind: graphKindLabel(t, preview),
						onClose: () => setPreview(null)
					})
				]
			});
		}
		function ExplorePage(props) {
			const t = useT();
			const pageSize = 6;
			const [query, setQuery] = (0, react.useState)(props.seed);
			const [mode, setMode] = (0, react.useState)("smart");
			const [category, setCategory] = (0, react.useState)("");
			const [results, setResults] = (0, react.useState)([]);
			const [sources, setSources] = (0, react.useState)([]);
			const [searchKind, setSearchKind] = (0, react.useState)(null);
			const [agentAnswer, setAgentAnswer] = (0, react.useState)(null);
			/** A citation names the recalled memory it points at, not its identifiers. */
			const citationLabel = (citation) => {
				const cited = results.find((result) => `${result.memoryBodyId}/${result.id}` === citation || result.id === citation);
				return cited === void 0 ? (0, dsh_mnemon_client.short)(citation.split("/").at(-1) ?? citation, 12) : (0, dsh_mnemon_client.short)(cited.content, 40);
			};
			const [searched, setSearched] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [relatedTo, setRelatedTo] = (0, react.useState)(null);
			const relatedPaneRef = (0, react.useRef)(null);
			const [related, setRelated] = (0, react.useState)([]);
			const [relatedLoading, setRelatedLoading] = (0, react.useState)(false);
			const [visibleResultLimit, setVisibleResultLimit] = (0, react.useState)(pageSize);
			const [visibleRelatedLimit, setVisibleRelatedLimit] = (0, react.useState)(pageSize);
			const relatedRequests = (0, dsh_mnemon_client.useRequestVersion)();
			(0, react.useEffect)(() => {
				if (props.seed !== "") setQuery(props.seed);
			}, [props.seed]);
			const ranSeed = (0, react.useRef)("");
			(0, react.useEffect)(() => {
				if (props.seed === "" || props.status === null || ranSeed.current === props.seed) return;
				ranSeed.current = props.seed;
				runSearch(false, props.seed);
			}, [props.seed, props.status]);
			(0, react.useEffect)(() => {
				if (relatedTo === null || props.onRevealElement === void 0) return;
				const reveal = () => {
					if (relatedPaneRef.current !== null && relatedRequests.isCurrent(relatedTo.request)) props.onRevealElement?.(relatedPaneRef.current);
				};
				if (typeof window.requestAnimationFrame !== "function") {
					reveal();
					return;
				}
				const frame = window.requestAnimationFrame(reveal);
				return () => {
					if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(frame);
				};
			}, [
				relatedTo,
				relatedRequests,
				props.onRevealElement
			]);
			const runSearch = async (withAgent, text = query) => {
				if (text.trim() === "") return;
				relatedRequests.begin();
				setSearchKind(withAgent ? "agent" : "direct");
				setSearched(true);
				setError(null);
				setRelatedTo(null);
				setAgentAnswer(null);
				setVisibleResultLimit(pageSize);
				setVisibleRelatedLimit(pageSize);
				try {
					const request = {
						query: text,
						mode,
						...category === "" ? {} : { category },
						limit: props.status?.defaultRecallLimit ?? 10
					};
					if (withAgent) {
						const response = await props.agentClient.agentSearch(request);
						setResults(response.results);
						setSources(response.sources ?? []);
						setAgentAnswer({
							answer: response.answer,
							citations: response.citations,
							runId: response.delegation.runId
						});
					} else {
						const response = await props.client.search(request);
						setResults(response.results);
						setSources(response.sources ?? []);
					}
				} catch (reason) {
					setError((0, dsh_mnemon_client.message)(reason));
					setResults([]);
					setSources([]);
					setAgentAnswer(null);
				} finally {
					setSearchKind(null);
				}
			};
			const search = (event) => {
				event.preventDefault();
				runSearch(false);
			};
			const searching = searchKind !== null;
			const showRelated = async (insight) => {
				const request = relatedRequests.begin();
				setRelatedTo({
					insight,
					request
				});
				setRelated([]);
				setRelatedLoading(true);
				setError(null);
				setVisibleRelatedLimit(pageSize);
				try {
					const response = await props.client.related(insight.id, insight.memoryBodyId);
					if (relatedRequests.isCurrent(request)) setRelated(response);
				} catch (reason) {
					if (relatedRequests.isCurrent(request)) setError((0, dsh_mnemon_client.message)(reason));
				} finally {
					if (relatedRequests.isCurrent(request)) setRelatedLoading(false);
				}
			};
			const forget = async (insight) => {
				await props.onForget(insight);
				setResults((items) => items.filter((item) => insightKey(item) !== insightKey(insight)));
				setRelated((items) => items.filter((item) => insightKey(item) !== insightKey(insight)));
				if (relatedTo !== null && insightKey(relatedTo.insight) === insightKey(insight)) setRelatedTo(null);
			};
			const visibleResults = results.slice(0, visibleResultLimit);
			const visibleRelated = related.slice(0, visibleRelatedLimit);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.page,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.PageHeader, {
						title: t("search.title"),
						description: t("search.description"),
						meta: t("search.maxResults", { count: props.status?.defaultRecallLimit ?? "—" })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
						className: css.searchBar,
						onSubmit: (event) => void search(event),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SearchField, {
							className: css.queryField,
							label: t("search.queryAria"),
							value: query,
							onChange: (event) => setQuery(event.target.value),
							placeholder: t("search.placeholder")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.searchControls,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SelectField, {
									className: css.searchChoice,
									label: t("common.category"),
									ariaLabel: t("search.categoryAria"),
									value: category,
									options: [{
										value: "",
										label: t("common.allCategories")
									}, ...CATEGORIES.map((value) => ({
										value,
										label: categoryLabel(t, value)
									}))],
									onChange: setCategory
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SelectField, {
									className: css.searchChoice,
									label: t("search.strategy"),
									ariaLabel: t("search.modeAria"),
									value: mode,
									options: [
										{
											value: "smart",
											label: t("search.modeSmart")
										},
										{
											value: "keyword",
											label: t("search.modeKeyword")
										},
										{
											value: "basic",
											label: t("search.modeBasic")
										}
									],
									onChange: setMode
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.searchActions,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "submit",
										className: css.secondaryButton,
										disabled: searching || query.trim() === "",
										children: searchKind === "direct" ? t("search.searching") : t("search.action")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: css.primaryButton,
										disabled: searching || query.trim() === "" || !props.agentAvailable,
										onClick: () => void runSearch(true),
										children: searchKind === "agent" ? t("search.agentSearching") : t("search.agentAction")
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ReadSourcePanel, {
						title: t("search.sourcesTitle"),
						sources
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.asyncResults,
						children: [
							searching && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SectionSpinner, { label: searchKind === "agent" ? t("search.agentSearching") : t("search.searching") }),
							agentAnswer !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: css.agentAnswer,
								"aria-label": t("search.agentAnswer"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: css.agentAnswerHeading,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("search.agentAnswerHint") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("search.agentAnswer") })] })
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: agentAnswer.answer }),
									agentAnswer.citations.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: css.agentCitations,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("search.citations") }), agentAnswer.citations.map((citation, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											title: citation,
											children: [
												index + 1,
												". ",
												citationLabel(citation)
											]
										}, citation))]
									})
								]
							}),
							error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: css.inlineError,
								role: "alert",
								children: error
							}),
							!searched && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
								glyph: "⌕",
								title: t("search.startTitle"),
								children: t("search.startText")
							}),
							searched && !searching && results.length === 0 && error === null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
								glyph: "0",
								title: t("search.emptyTitle"),
								children: t("search.emptyText")
							}),
							results.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: relatedTo === null ? css.singleColumn : css.resultLayout,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: css.results,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: css.sectionHeading,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("search.results") }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: results.length })]
										}),
										visibleResults.map((insight) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InsightCard, {
											insight,
											writeEnabled: props.writeEnabled,
											onForget: forget,
											onRelated: (item) => void showRelated(item)
										}, insightKey(insight))),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.ProgressiveFooter, {
											visible: visibleResults.length,
											total: results.length,
											pageSize,
											onMore: () => setVisibleResultLimit((value) => value + pageSize)
										})
									]
								}), relatedTo !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
									ref: relatedPaneRef,
									className: css.relatedPane,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: css.sectionHeading,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("search.related") }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => {
													relatedRequests.begin();
													setRelatedTo(null);
													setRelatedLoading(false);
												},
												"aria-label": t("search.closeRelated"),
												children: "×"
											})]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: css.relatedSource,
											children: relatedTo.insight.content
										}),
										relatedLoading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.loading,
											children: t("search.traversing")
										}),
										!relatedLoading && related.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: css.muted,
											children: t("search.noRelated")
										}),
										visibleRelated.map((insight) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InsightCard, {
											insight,
											writeEnabled: props.writeEnabled,
											onForget: forget,
											onRelated: (item) => void showRelated(item)
										}, insightKey(insight))),
										!relatedLoading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.ProgressiveFooter, {
											visible: visibleRelated.length,
											total: related.length,
											pageSize,
											onMore: () => setVisibleRelatedLimit((value) => value + pageSize)
										})
									]
								})]
							})
						]
					})
				]
			});
		}
		function EntitiesPage(props) {
			const t = useT();
			const entityPageSize = 10;
			const insightPageSize = 6;
			const [view, setView] = (0, react.useState)({
				items: [],
				insights: []
			});
			const [entity, setEntity] = (0, react.useState)("");
			const [entityFilter, setEntityFilter] = (0, react.useState)("");
			const [loading, setLoading] = (0, react.useState)(true);
			const [error, setError] = (0, react.useState)(null);
			const [visibleEntityLimit, setVisibleEntityLimit] = (0, react.useState)(entityPageSize);
			const [visibleInsightLimit, setVisibleInsightLimit] = (0, react.useState)(insightPageSize);
			const entityRequests = (0, dsh_mnemon_client.useRequestVersion)();
			const load = (0, react.useCallback)(async (selected) => {
				const request = entityRequests.begin();
				setLoading(true);
				setError(null);
				setVisibleInsightLimit(insightPageSize);
				if (selected === void 0) setVisibleEntityLimit(entityPageSize);
				try {
					const response = await props.client.entities(selected, 20);
					if (entityRequests.isCurrent(request)) setView(response);
				} catch (reason) {
					if (entityRequests.isCurrent(request)) setError((0, dsh_mnemon_client.message)(reason));
				} finally {
					if (entityRequests.isCurrent(request)) setLoading(false);
				}
			}, [
				entityPageSize,
				entityRequests,
				insightPageSize,
				props.client
			]);
			(0, react.useEffect)(() => {
				load();
			}, [load, props.revision]);
			const submit = (event) => {
				event.preventDefault();
				if (entity.trim() !== "") load(entity);
			};
			const visibleEntities = (0, react.useMemo)(() => {
				const query = entityFilter.trim().toLocaleLowerCase();
				return (query === "" ? view.items : view.items.filter((item) => item.entity.toLocaleLowerCase().includes(query))).slice(0, visibleEntityLimit);
			}, [
				view.items,
				visibleEntityLimit,
				entityFilter
			]);
			const filteredTotal = (0, react.useMemo)(() => {
				const query = entityFilter.trim().toLocaleLowerCase();
				return query === "" ? view.items.length : view.items.filter((item) => item.entity.toLocaleLowerCase().includes(query)).length;
			}, [view.items, entityFilter]);
			const visibleInsights = view.insights.slice(0, visibleInsightLimit);
			const sources = view.sources ?? [];
			const hasEntityProvider = sources.length === 0 || sources.some((source) => source.mode === "entities" && source.status !== "unavailable");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.page,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.PageHeader, {
						title: t("entities.title"),
						description: t("entities.description"),
						meta: t("entities.count", { count: view.items.length })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ReadSourcePanel, {
						title: t("entities.sourcesTitle"),
						sources
					}),
					!loading && !hasEntityProvider ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
						glyph: "◎",
						title: t("entities.unsupportedTitle"),
						children: t("entities.unsupportedText")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.entityLayout,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("aside", {
							className: css.entityRail,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
									className: css.entitySearch,
									onSubmit: submit,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SearchField, {
										label: t("entities.nameAria"),
										value: entity,
										onChange: (event) => {
											setEntity(event.target.value);
											setEntityFilter(event.target.value);
										},
										onKeyDown: (event) => {
											if (event.key === "Escape" && entityFilter !== "") {
												event.preventDefault();
												setEntityFilter("");
											}
										},
										placeholder: t("entities.placeholder")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "submit",
										className: css.secondaryButton,
										disabled: loading || entity.trim() === "",
										children: t("entities.action")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.entityHeading,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("entities.top") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: entityFilter === "" ? t("entities.frequency") : t("entities.filterHint") })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: css.entityList,
									children: visibleEntities.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										"aria-pressed": view.selected === item.entity,
										onClick: () => {
											setEntity(item.entity);
											load(item.entity);
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: item.entity }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: item.count })]
									}, item.entity))
								}),
								visibleEntities.length > 0 && filteredTotal > visibleEntityLimit && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.ProgressiveFooter, {
									compact: true,
									visible: visibleEntities.length,
									total: filteredTotal,
									pageSize: entityPageSize,
									onMore: () => setVisibleEntityLimit((value) => value + entityPageSize)
								}),
								!loading && view.items.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: css.muted,
									children: t("entities.emptyRail")
								}),
								!loading && view.items.length > 0 && visibleEntities.length === 0 && entityFilter !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: css.muted,
									children: t("entities.filterEmpty")
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: (0, dsh_mnemon_client.appearanceClass)(css.entityResults, css.asyncResults),
							children: [
								loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SectionSpinner, { label: t("entities.loading") }),
								error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: css.inlineError,
									role: "alert",
									children: error
								}),
								!loading && view.selected === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
									glyph: "◎",
									title: t("entities.selectTitle"),
									children: t("entities.selectText")
								}),
								view.selected !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.sectionHeading,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: view.selected }) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: view.insights.length })]
								}), !loading && view.insights.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
									glyph: "0",
									title: t("entities.emptyTitle"),
									children: t("entities.emptyText")
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [visibleInsights.map((insight) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InsightCard, {
									insight,
									writeEnabled: props.writeEnabled,
									onForget: props.onForget,
									onRelated: () => props.onExplore(insight.content)
								}, insightKey(insight))), !loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.ProgressiveFooter, {
									visible: visibleInsights.length,
									total: view.insights.length,
									pageSize: insightPageSize,
									onMore: () => setVisibleInsightLimit((value) => value + insightPageSize)
								})] })] })
							]
						})]
					})
				]
			});
		}
		function PersistenceStrategyDialog(props) {
			const t = useT();
			const strategyFormId = (0, react.useId)();
			const configured = props.config?.persistenceStrategy;
			const [mode, setMode] = (0, react.useState)(configured?.mode ?? "manual");
			const [providerId, setProviderId] = (0, react.useState)(configured?.providerId ?? "mnemon-native");
			const [prompt, setPrompt] = (0, react.useState)(configured?.prompt ?? "");
			const [dataBoundary, setDataBoundary] = (0, react.useState)(configured?.rules?.dataBoundary ?? "allow-remote");
			const [preference, setPreference] = (0, react.useState)(configured?.rules?.preference ?? "balanced");
			const [requiredCapabilities, setRequiredCapabilities] = (0, react.useState)(configured?.rules?.requiredCapabilities ?? []);
			const [automaticProviderIds, setAutomaticProviderIds] = (0, react.useState)(configured?.rules?.allowedProviderIds ?? ["mnemon-native"]);
			const [providerDrafts, setProviderDrafts] = (0, react.useState)(configured?.providerConnections ?? {});
			const [providers, setProviders] = (0, react.useState)([]);
			const [loading, setLoading] = (0, react.useState)(true);
			const [saving, setSaving] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let current = true;
				props.client.bodyDirectory().then((catalog) => {
					if (!current) return;
					const next = catalog.providers;
					setProviders(next);
					setProviderDrafts((previous) => mergeProviderDefaults(next, previous));
					setProviderId((currentProviderId) => readyProviderId(next, currentProviderId) ?? currentProviderId);
					if (configured?.rules?.allowedProviderIds === void 0) setAutomaticProviderIds((current) => {
						const ready = current.filter((id) => next.some((provider) => provider.id === id && provider.serviceConfigured !== false));
						const first = readyProviderId(next);
						return ready.length > 0 || first === void 0 ? ready : [first];
					});
				}).catch((reason) => {
					if (current) setError((0, dsh_mnemon_client.message)(reason));
				}).finally(() => {
					if (current) setLoading(false);
				});
				return () => {
					current = false;
				};
			}, [props.client]);
			const selectedProvider = providers.find((provider) => provider.id === providerId);
			const selectedAutomaticProviders = automaticProviderIds.map((id) => providers.find((provider) => provider.id === id)).filter((provider) => provider !== void 0);
			const selectedProvidersValid = mode === "manual" ? providerDraftComplete(selectedProvider, providerDrafts[providerId]) : automaticProviderIds.length > 0 && selectedAutomaticProviders.length === automaticProviderIds.length && selectedAutomaticProviders.every((provider) => providerDraftComplete(provider, providerDrafts[provider.id]));
			const updateDraft = (id, key, value) => setProviderDrafts((current) => ({
				...current,
				[id]: {
					...current[id] ?? {},
					[key]: value
				}
			}));
			const toggleCapability = (capability) => setRequiredCapabilities((current) => current.includes(capability) ? current.filter((value) => value !== capability) : [...current, capability]);
			const toggleProvider = (id, selected) => setAutomaticProviderIds((current) => selected ? [.../* @__PURE__ */ new Set([...current, id])] : current.filter((value) => value !== id));
			const save = async (event) => {
				event.preventDefault();
				if (loading || saving || !props.writable || !selectedProvidersValid) return;
				const connections = Object.fromEntries((mode === "manual" ? [providerId] : automaticProviderIds).filter((id) => providers.find((provider) => provider.id === id)?.origin !== "native").map((id) => [id, providerDrafts[id] ?? {}]));
				setSaving(true);
				setError(null);
				try {
					await props.settingsScope.setPath(["persistenceStrategy"], {
						mode,
						providerId,
						prompt,
						rules: {
							allowedProviderIds: automaticProviderIds,
							dataBoundary,
							requiredCapabilities,
							preference
						},
						providerConnections: connections
					});
					props.onClose();
				} catch (reason) {
					setError((0, dsh_mnemon_client.message)(reason));
				} finally {
					setSaving(false);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SidebarModal, {
				title: t("strategy.title"),
				description: t("strategy.description"),
				busy: saving,
				contentReady: !loading,
				wide: true,
				onClose: props.onClose,
				footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: css.modalFooterActions,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"data-dialog-close": true,
						className: css.secondaryButton,
						disabled: saving,
						onClick: props.onClose,
						children: t("common.cancel")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "submit",
						form: strategyFormId,
						className: css.primaryButton,
						disabled: loading || saving || !props.writable || !selectedProvidersValid,
						children: saving ? t("strategy.saving") : t("strategy.save")
					})]
				}),
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
					id: strategyFormId,
					className: (0, dsh_mnemon_client.appearanceClass)(css.bodyEdit, css.strategyForm),
					onSubmit: (event) => void save(event),
					children: [
						loading && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.strategyLoading,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SectionSpinner, { label: t("strategy.loading") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("strategy.loading") })]
						}),
						error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: css.inlineError,
							role: "alert",
							children: error
						}),
						!loading && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: css.createSection,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.createSectionHeading,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "01" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("strategy.modeTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("strategy.modeHint") })] })]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
								className: css.placementMode,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("overview.placementMode") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										"data-selected": mode === "manual" || void 0,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "radio",
												name: "persistence-mode",
												value: "manual",
												checked: mode === "manual",
												"data-autofocus": mode === "manual" || void 0,
												onChange: () => setMode("manual")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {
												className: css.choiceControl,
												"data-kind": "radio",
												"aria-hidden": "true"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("overview.placementManual") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("strategy.manualHint") })] })
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										"data-selected": mode === "automatic" || void 0,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "radio",
												name: "persistence-mode",
												value: "automatic",
												checked: mode === "automatic",
												"data-autofocus": mode === "automatic" || void 0,
												onChange: () => setMode("automatic")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {
												className: css.choiceControl,
												"data-kind": "radio",
												"aria-hidden": "true"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [
												t("overview.placementAutomatic"),
												" ",
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("overview.recommended") })
											] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("strategy.automaticHint") })] })
										]
									})
								]
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: css.createSection,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: css.createSectionHeading,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "02" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(mode === "manual" ? "strategy.manualTitle" : "strategy.automaticTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t(mode === "manual" ? "strategy.manualDescription" : "strategy.automaticDescription") })] })]
							}), mode === "manual" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
								className: css.providerChoice,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("overview.providerLabel") }), readyFirst(providers).map((provider) => {
									const disabled = provider.serviceConfigured === false;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										"data-selected": providerId === provider.id || void 0,
										"data-native": provider.origin === "native" || void 0,
										"data-disabled": disabled || void 0,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "radio",
												name: "strategy-provider",
												value: provider.id,
												checked: providerId === provider.id,
												disabled,
												onChange: () => setProviderId(provider.id)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
												providerId: provider.id,
												icon: provider.icon,
												className: css.providerChoiceIcon
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [provider.label, provider.origin === "native" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("overview.nativeOfficial") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: disabled ? t(providerUnavailableKey(provider)) : `${t(`overview.workspaceBinding.${provider.workspaceBinding}`)} · ${providerSummary(t, provider)}` })] }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {
												className: css.choiceControl,
												"data-kind": "radio",
												"aria-hidden": "true"
											})
										]
									}, provider.id);
								})]
							}), selectedProvider !== void 0 && selectedProvider.origin !== "native" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderMemoryFields, {
								provider: selectedProvider,
								connection: providerDrafts[selectedProvider.id] ?? {},
								onChange: (key, value) => updateDraft(selectedProvider.id, key, value)
							})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: css.placementPolicy,
								"aria-label": t("overview.placementPolicy"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: css.placementPolicyHeading,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("overview.placementPolicy") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("overview.placementPolicyHint") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.TaskAgentTag, { available: props.agentAvailable })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [t("overview.placementPrompt"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										"aria-label": t("overview.placementPrompt"),
										value: prompt,
										onChange: (event) => setPrompt(event.target.value),
										placeholder: t("overview.placementPromptPlaceholder"),
										rows: 3,
										maxLength: 4e3
									})] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: css.placementRuleGrid,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SelectField, {
											label: t("overview.dataBoundary"),
											value: dataBoundary,
											options: [{
												value: "allow-remote",
												label: t("overview.dataBoundaryRemote")
											}, {
												value: "local-only",
												label: t("overview.dataBoundaryLocal")
											}],
											onChange: (value) => {
												setDataBoundary(value);
												if (value === "local-only") setAutomaticProviderIds((current) => current.filter((id) => providers.find((provider) => provider.id === id)?.kind === "local"));
											}
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SelectField, {
											label: t("overview.preference"),
											value: preference,
											options: [
												{
													value: "balanced",
													label: t("overview.preferenceBalanced")
												},
												{
													value: "local-first",
													label: t("overview.preferenceLocal")
												},
												{
													value: "shared-first",
													label: t("overview.preferenceShared")
												}
											],
											onChange: setPreference
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
										className: css.capabilityRules,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("overview.requiredCapabilities") }), [
											"graph",
											"exact-write",
											"forget"
										].map((capability) => {
											const selected = requiredCapabilities.includes(capability);
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												"data-selected": selected || void 0,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked: selected,
														onChange: () => toggleCapability(capability)
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {
														className: css.choiceControl,
														"data-kind": "check",
														"aria-hidden": "true"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(`overview.capability.${capability}`) })
												]
											}, capability);
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: css.placementCandidates,
										children: readyFirst(providers).map((provider) => {
											const selected = automaticProviderIds.includes(provider.id);
											const disabled = provider.serviceConfigured === false && !selected || dataBoundary === "local-only" && provider.kind === "remote";
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
												"data-selected": selected || void 0,
												"data-disabled": disabled || void 0,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked: selected,
														disabled,
														onChange: (event) => toggleProvider(provider.id, event.target.checked)
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
														providerId: provider.id,
														icon: provider.icon,
														className: css.candidateIcon
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: provider.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: provider.serviceConfigured === false ? t(providerUnavailableKey(provider)) : provider.origin === "native" ? t("overview.candidateNativeReady") : provider.kind === "local" ? t("overview.candidateLocal") : t("overview.candidateRemote") })] }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("i", {
														className: css.choiceControl,
														"data-kind": "check",
														"aria-hidden": "true"
													})
												]
											}, provider.id);
										})
									}),
									automaticProviderIds.map((id) => {
										const provider = providers.find((candidate) => candidate.id === id);
										return provider === void 0 || provider.origin === "native" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderMemoryFields, {
											provider,
											connection: providerDrafts[id] ?? {},
											onChange: (key, value) => updateDraft(id, key, value)
										}, id);
									})
								]
							})]
						})] })
					]
				})
			});
		}
		function RememberPage(props) {
			const t = useT();
			const rememberFormId = (0, react.useId)();
			const candidateId = (0, react.useId)();
			const [content, setContent] = (0, react.useState)(props.seed);
			const [category, setCategory] = (0, react.useState)("general");
			const [importance, setImportance] = (0, react.useState)(3);
			const [tags, setTags] = (0, react.useState)("");
			const [entities, setEntities] = (0, react.useState)("");
			const [memoryBodyId, setMemoryBodyId] = (0, react.useState)("");
			const [supervising, setSupervising] = (0, react.useState)(false);
			const [saving, setSaving] = (0, react.useState)(false);
			const [outcome, setOutcome] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (props.seed !== "") setContent(props.seed);
			}, [props.seed]);
			(0, react.useEffect)(() => {
				if (memoryBodyId === "" && props.memoryBodies.length > 0) setMemoryBodyId((props.memoryBodies.find((body) => body.active) ?? props.memoryBodies[0]).id);
			}, [memoryBodyId, props.memoryBodies]);
			const selectedMemoryBody = props.memoryBodies.find((body) => body.id === memoryBodyId);
			const candidate = content.trim();
			const answered = outcome !== null && outcome.content === candidate;
			const busy = supervising || saving;
			const supervise = async (event) => {
				event.preventDefault();
				if (candidate === "" || !props.agentAvailable || answered || busy) return;
				setSupervising(true);
				setOutcome(null);
				try {
					const response = await props.client.supervise(candidate);
					setOutcome({
						content: candidate,
						action: response.action,
						summary: response.summary
					});
					props.onMutate();
				} catch (reason) {
					setOutcome({
						content: candidate,
						error: (0, dsh_mnemon_client.message)(reason)
					});
				} finally {
					setSupervising(false);
				}
			};
			const manualSave = async (event) => {
				event.preventDefault();
				if (candidate === "" || busy) return;
				setSaving(true);
				setOutcome(null);
				try {
					const response = await props.client.remember({
						content: candidate,
						category,
						importance,
						tags: tags.split(",").map((value) => value.trim()).filter(Boolean),
						entities: entities.split(",").map((value) => value.trim()).filter(Boolean),
						source: "user",
						...memoryBodyId === "" ? {} : { memoryBodyId }
					});
					setOutcome({
						content: candidate,
						action: typeof response.action === "string" ? response.action : "stored",
						summary: typeof response.summary === "string" ? response.summary : ""
					});
					props.onMutate();
				} catch (reason) {
					setOutcome({
						content: candidate,
						error: (0, dsh_mnemon_client.message)(reason)
					});
				} finally {
					setSaving(false);
				}
			};
			const composer = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: css.supervisedComposer,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
					id: rememberFormId,
					className: css.supervisedForm,
					onSubmit: (event) => void supervise(event),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.candidateHeading,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								htmlFor: candidateId,
								children: t("remember.candidate")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.TaskAgentTag, { available: props.agentAvailable })]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
							id: candidateId,
							value: content,
							onChange: (event) => setContent(event.target.value),
							maxLength: 8e3,
							rows: 8,
							placeholder: t("remember.placeholder")
						}),
						!props.agentAvailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: css.sessionHint,
							children: t("remember.taskAgentHint")
						}),
						outcome !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.WriteReceipt, {
							action: outcome.action,
							summary: outcome.summary,
							error: outcome.error,
							onView: props.onView
						})
					]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
					className: css.advancedWrite,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("remember.advanced") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("remember.advancedHint") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("remember.expand") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
						className: css.manualForm,
						onSubmit: (event) => void manualSave(event),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.formGrid,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: css.fieldWide,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SelectField, {
										label: t("remember.target"),
										value: memoryBodyId,
										options: props.memoryBodies.map((body) => ({
											value: body.id,
											label: `${body.name} · ${body.provider.label}${body.active ? ` · ${t("common.active")}` : ""}`
										})),
										onChange: setMemoryBodyId
									}), selectedMemoryBody?.provider.capabilities.writeMode === "async-extracting" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", {
										className: css.providerWriteHint,
										children: t("remember.asyncProviderHint")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SelectField, {
									label: t("common.category"),
									value: category,
									options: CATEGORIES.map((value) => ({
										value,
										label: categoryLabel(t, value)
									})),
									onChange: setCategory
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SelectField, {
									label: t("common.importanceLabel"),
									value: String(importance),
									options: [
										1,
										2,
										3,
										4,
										5
									].map((value) => ({
										value: String(value),
										label: `${value} / 5`
									})),
									onChange: (value) => setImportance(Number(value))
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: css.fieldWide,
									children: [t("remember.entities"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: entities,
										onChange: (event) => setEntities(event.target.value),
										placeholder: "SQLite, DSH"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: css.fieldWide,
									children: [t("remember.tags"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: tags,
										onChange: (event) => setTags(event.target.value),
										placeholder: "architecture, local-first"
									})]
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.manualActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("remember.advancedText") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "submit",
								className: css.secondaryButton,
								disabled: busy || candidate === "" || memoryBodyId === "" || answered,
								children: saving ? t("remember.saving") : t("remember.advancedAction")
							})]
						})]
					})]
				})]
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SidebarModal, {
				title: t("remember.title"),
				description: t("remember.description"),
				busy,
				onClose: props.onClose,
				footer: props.writeEnabled ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: css.modalFooterActions,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						"data-dialog-close": true,
						className: css.secondaryButton,
						disabled: busy,
						onClick: props.onClose,
						children: t(outcome === null ? "common.cancel" : "common.close")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "submit",
						form: rememberFormId,
						className: css.primaryButton,
						disabled: busy || candidate === "" || !props.agentAvailable || answered,
						children: supervising ? t("remember.processing") : t("remember.action")
					})]
				}) : void 0,
				children: props.writeEnabled ? composer : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
					glyph: "⊘",
					title: t("remember.readOnlyTitle"),
					children: t("remember.readOnlyText")
				})
			});
		}
		function ListPage(props) {
			const t = useT();
			const pageSize = 12;
			const [query, setQuery] = (0, react.useState)("");
			const [category, setCategory] = (0, react.useState)("");
			const [view, setView] = (0, react.useState)(null);
			const [loading, setLoading] = (0, react.useState)(true);
			const [error, setError] = (0, react.useState)(null);
			const [visibleLimit, setVisibleLimit] = (0, react.useState)(pageSize);
			const [selectedBodyId, setSelectedBodyId] = (0, react.useState)();
			const load = (0, react.useCallback)(async () => {
				setLoading(true);
				setError(null);
				try {
					setView(await props.client.list({
						...query.trim() === "" ? {} : { query },
						...category === "" ? {} : { category },
						limit: 1e3
					}));
				} catch (reason) {
					setError((0, dsh_mnemon_client.message)(reason));
				} finally {
					setLoading(false);
				}
			}, [
				category,
				props.client,
				query
			]);
			(0, react.useEffect)(() => {
				setVisibleLimit(pageSize);
				load();
			}, [pageSize, props.revision]);
			const submit = (event) => {
				event.preventDefault();
				setVisibleLimit(pageSize);
				load();
			};
			const forget = async (insight) => {
				await props.onForget(insight);
				setView((current) => current === null ? current : {
					...current,
					total: Math.max(0, current.total - 1),
					items: current.items.filter((item) => insightKey(item) !== insightKey(insight))
				});
			};
			const filteredItems = view?.items.filter((item) => selectedBodyId === void 0 || item.memoryBodyId === selectedBodyId) ?? [];
			const visibleItems = filteredItems.slice(0, visibleLimit);
			const sources = view?.sources ?? [];
			const waitingForQuery = query.trim() === "" && sources.some((source) => source.status === "query-required" && (selectedBodyId === void 0 || source.memoryBodyId === selectedBodyId));
			const selectBody = (memoryBodyId) => {
				setSelectedBodyId(memoryBodyId);
				setVisibleLimit(pageSize);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: css.page,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.PageHeader, {
						title: t("content.title"),
						description: t("content.description"),
						meta: t("content.count", { count: view === null ? "—" : selectedBodyId === void 0 ? view.total : filteredItems.length })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("form", {
						className: css.listToolbar,
						onSubmit: submit,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SearchField, {
								label: t("content.filterAria"),
								value: query,
								onChange: (event) => setQuery(event.target.value),
								placeholder: t("content.filterPlaceholder")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SelectField, {
								hideLabel: true,
								label: t("content.categoryAria"),
								value: category,
								options: [{
									value: "",
									label: t("common.allCategories")
								}, ...CATEGORIES.map((value) => ({
									value,
									label: categoryLabel(t, value)
								}))],
								onChange: setCategory
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "submit",
								className: css.secondaryButton,
								disabled: loading,
								children: loading ? t("common.loading") : t("content.apply")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.listNotice,
						children: t("content.notice")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ReadSourcePanel, {
						title: t("content.sourcesTitle"),
						sources,
						selectedBodyId,
						onSelect: selectBody
					}),
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: css.inlineError,
						role: "alert",
						children: error
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: css.asyncResults,
						children: [
							loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.SectionSpinner, { label: t("common.loading") }),
							!loading && filteredItems.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.EmptyState, {
								glyph: "≡",
								title: t(waitingForQuery ? "content.queryRequiredTitle" : "content.emptyTitle"),
								children: t(waitingForQuery ? "content.queryRequiredText" : "content.emptyText")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: css.memoryList,
								children: visibleItems.map((insight) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(InsightCard, {
									insight,
									writeEnabled: props.writeEnabled,
									onForget: forget,
									onClone: props.onClone,
									onRelated: () => props.onExplore(insight.content)
								}, insightKey(insight)))
							}),
							view !== null && !loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.ProgressiveFooter, {
								visible: visibleItems.length,
								total: filteredItems.length,
								pageSize,
								onMore: () => setVisibleLimit((value) => value + pageSize)
							})
						]
					})
				]
			});
		}
		/** @deprecated Use nativeSpaceProvider. */
		const nativeBodyProvider = nativeSpaceProvider;
		//#endregion
		//#region src/client/ui.tsx
		/** The adapter never gets a transport or chooses another Source instance. */
		function memorySpacesPageClient(management) {
			const client = (0, dsh_mnemon_client.createMemorySourcePageClient)(management);
			const input = (value) => JSON.parse(JSON.stringify(value));
			return {
				canAssist: client.canAssist,
				status: () => client.read("status-summary"),
				bodies: () => client.read("bodies"),
				bodyDirectory: () => client.read("body-directory"),
				graph: (memoryBodyIds) => client.read("graph", input({ memoryBodyIds })),
				list: (request) => client.read("list", input(request ?? {})),
				entities: (entity, limit) => client.read("entities", input({
					entity,
					limit
				})),
				search: (request) => client.read("search", input(request)),
				related: (id, memoryBodyId) => client.read("related", input({
					id,
					memoryBodyId
				})),
				reconnectBody: (memoryBodyId) => client.read("body-reconnect", { memoryBodyId }),
				remember: (request) => client.mutate("remember", input(request), true),
				forget: (id, memoryBodyId) => client.mutate("forget", input({
					id,
					memoryBodyId
				}), true),
				createBody: (request) => request.placement !== void 0 && client.canAssist("body-create") ? client.assist("body-create", input(request), true) : client.mutate("body-create", input(request), true),
				updateBody: (memoryBodyId, request) => typeof request.active === "boolean" && Object.keys(request).every((key) => key === "active") && client.canAssist("activation") ? client.assist("activation", {
					memoryBodyId,
					active: request.active
				}, true) : client.mutate("body-update", input({
					memoryBodyId,
					...request
				}), true),
				deleteBody: (memoryBodyId) => client.mutate("body-delete", { memoryBodyId }, true),
				agentSearch: (request) => client.assist("agent-search", input(request), false),
				supervise: (content, idempotencyKey) => client.assist("supervise", input({
					content,
					idempotencyKey
				}), true),
				maintainBodyMetadata: (memoryBodyIds) => client.assist("body-metadata-maintain", { memoryBodyIds }, true)
			};
		}
		const rememberedPages = /* @__PURE__ */ new WeakMap();
		const TABS = [
			{
				id: "spaces",
				key: "nav.overview"
			},
			{
				id: "explore",
				key: "nav.search"
			},
			{
				id: "content",
				key: "nav.content"
			},
			{
				id: "entities",
				key: "nav.entities"
			}
		];
		function MemorySpacesSourceView(props) {
			const t = useT();
			const client = (0, react.useMemo)(() => props.management === void 0 ? void 0 : memorySpacesPageClient(props.management), [props.management]);
			const [revision, setRevision] = (0, react.useState)(0);
			const [status, setStatus] = (0, react.useState)(null);
			const [page, setPage] = (0, react.useState)(() => props.management !== void 0 ? rememberedPages.get(props.management) ?? (props.page === "remember" ? "spaces" : props.page) : props.page);
			const [seed, setSeed] = (0, react.useState)("");
			const [rememberOpen, setRememberOpen] = (0, react.useState)(props.page === "remember");
			const [strategyOpen, setStrategyOpen] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const headerRef = (0, react.useRef)(null);
			const revealElement = (0, react.useCallback)((element) => {
				props.onRevealElement?.(element, (headerRef.current?.getBoundingClientRect().height ?? 0) + 14);
			}, [props.onRevealElement]);
			const refresh = (0, react.useCallback)(() => {
				setRevision((value) => value + 1);
				props.onRefresh?.();
			}, [props.onRefresh]);
			const refreshKey = (0, react.useRef)(props.refreshKey);
			const [reloads, setReloads] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				if (refreshKey.current === props.refreshKey) return;
				refreshKey.current = props.refreshKey;
				setRevision((value) => value + 1);
				setReloads((value) => value + 1);
			}, [props.refreshKey]);
			(0, react.useEffect)(() => {
				setPage(props.management !== void 0 && props.navigationInput === void 0 ? rememberedPages.get(props.management) ?? (props.page === "remember" ? "spaces" : props.page) : props.page === "remember" ? "spaces" : props.page);
				setRememberOpen(props.page === "remember");
				const value = props.navigationInput;
				setSeed(typeof value === "object" && value !== null && !Array.isArray(value) && typeof value.seed === "string" ? value.seed : "");
			}, [props.page, props.navigationInput]);
			(0, react.useEffect)(() => {
				if (props.management !== void 0) rememberedPages.set(props.management, page);
			}, [props.management, page]);
			(0, react.useLayoutEffect)(() => {
				props.onResetScroll?.();
			}, [page, props.onResetScroll]);
			(0, react.useEffect)(() => {
				let active = true;
				setError(null);
				client?.status().then((value) => {
					if (active) setStatus(value);
				}).catch((reason) => {
					if (active) setError((0, dsh_mnemon_client.message)(reason));
				});
				return () => {
					active = false;
				};
			}, [client, revision]);
			if (client === void 0) return null;
			const writable = props.writable === true && status?.writeEnabled === true;
			const activationEnabled = status?.writeEnabled === true && (writable || client.canAssist("activation"));
			const agentAvailable = client.canAssist("supervise");
			const explore = (query) => {
				setSeed(query);
				setPage("explore");
			};
			const remember = (content = "") => {
				setSeed(content);
				setRememberOpen(true);
			};
			const forget = async (insight) => {
				await client.forget(insight.id, insight.memoryBodyId);
				refresh();
			};
			const bodies = status?.memoryBodies ?? [];
			const preferences = props.preferences;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: css.inlineError,
					role: "alert",
					children: error
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: sidebarCss.memoryWorkspace,
					ref: headerRef,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.PageHeader, {
						title: t("nav.spaces"),
						description: t("overview.description"),
						...writable ? {} : { meta: activationEnabled ? t("common.activationOnly") : t("common.readOnly") },
						action: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: css.memoryHeaderActions,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: (0, dsh_mnemon_client.appearanceClass)(css.primaryButton, sidebarCss.memoryWriteButton),
								disabled: !writable,
								onClick: () => remember(),
								children: t("nav.rememberAction")
							}), preferences !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: css.secondaryButton,
								onClick: () => setStrategyOpen(true),
								children: t("strategy.action")
							})]
						})
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: sidebarCss.memoryNavigation,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: sidebarCss.memoryTabs,
							role: "tablist",
							"aria-label": t("nav.memory.aria"),
							children: TABS.map((tab) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								role: "tab",
								"aria-selected": page === tab.id,
								"data-active": page === tab.id ? "" : void 0,
								onClick: () => setPage(tab.id),
								children: t(tab.key)
							}, tab.id))
						})
					})]
				}),
				page === "spaces" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(OverviewPage, {
					client,
					metadataClient: client,
					revision,
					reloadKey: reloads,
					activationEnabled,
					writeEnabled: writable,
					agentAvailable,
					fallbackBodies: bodies,
					fallbackDirectory: status?.memoryBodyDirectory,
					catalogKnown: status?.memoryBodies !== void 0,
					onMutate: refresh,
					onAgentRefresh: refresh,
					onBodyReconnect: refresh,
					onBodyMetadata: refresh,
					onExplore: explore
				}),
				page === "explore" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ExplorePage, {
					client,
					agentClient: client,
					agentAvailable: client.canAssist("agent-search"),
					status,
					seed,
					writeEnabled: writable,
					onForget: forget,
					onRevealElement: revealElement
				}),
				page === "entities" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EntitiesPage, {
					client,
					revision,
					writeEnabled: writable,
					onForget: forget,
					onExplore: explore
				}),
				page === "content" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ListPage, {
					client,
					revision,
					writeEnabled: writable,
					onForget: forget,
					onClone: (insight) => remember(insight.content),
					onExplore: explore
				}),
				rememberOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RememberPage, {
					client,
					agentAvailable,
					memoryBodies: bodies,
					writeEnabled: writable,
					seed,
					onMutate: refresh,
					onClose: () => setRememberOpen(false),
					onView: () => {
						setRememberOpen(false);
						setPage("content");
					}
				}),
				strategyOpen && preferences !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PersistenceStrategyDialog, {
					client,
					settingsScope: { setPath: async (path, value) => {
						if (path.length !== 1 || path[0] !== "persistenceStrategy") throw new Error("Preference path is outside this Source");
						await preferences.replace(JSON.parse(JSON.stringify({ persistenceStrategy: value })));
					} },
					config: preferences.value,
					writable: preferences.writable,
					agentAvailable,
					onClose: () => setStrategyOpen(false)
				})
			] });
		}
		function MemorySpacesSourcePage(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(dsh_mnemon_client.MemorySourcePageFrame, {
				locale: props.locale,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemorySpacesSourceView, { ...props }, props.sourceInstanceKey)
			});
		}
		function installMemorySpacesUI(ctx, t = dsh_mnemon_client.translateEn) {
			return (0, dsh_mnemon_client.installMemorySourceUI)(ctx, {
				sourceTypeId: "memory-spaces",
				pages: [
					{
						id: "spaces",
						key: "nav.spaces",
						order: 300,
						glyph: "◇"
					},
					{
						id: "remember",
						key: "nav.rememberAction",
						order: 400,
						glyph: "+"
					},
					{
						id: "explore",
						key: "nav.search",
						order: 500,
						glyph: "⌕"
					},
					{
						id: "entities",
						key: "nav.entities",
						order: 600,
						glyph: "◎"
					},
					{
						id: "content",
						key: "nav.content",
						order: 700,
						glyph: "≡"
					}
				].map((page) => ({
					id: page.id,
					order: page.order,
					label: () => t(page.key),
					navigation: {
						stickyHeader: false,
						group: page.id === "spaces" ? "storage" : "tools",
						primary: page.id === "spaces",
						glyph: page.glyph
					},
					component: (props) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemorySpacesSourcePage, {
						...props,
						page: page.id
					})
				}))
			});
		}
		const inject = ["slots", "locale"];
		function apply(ctx) {
			installMemorySpacesUI(ctx, ctx.locale.bind("mnemon"));
		}
		//#endregion
		exports.EntitiesPage = EntitiesPage;
		exports.ExplorePage = ExplorePage;
		exports.ListPage = ListPage;
		exports.MemorySpacesSourcePage = MemorySpacesSourcePage;
		exports.OverviewPage = OverviewPage;
		exports.PersistenceStrategyDialog = PersistenceStrategyDialog;
		exports.RememberPage = RememberPage;
		exports.apply = apply;
		exports.inject = inject;
		exports.installMemorySpacesUI = installMemorySpacesUI;
		exports.memorySpacesPageClient = memorySpacesPageClient;
		exports.nativeBodyProvider = nativeBodyProvider;
		exports.nativeSpaceProvider = nativeSpaceProvider;
		return module.exports;
	}
});
