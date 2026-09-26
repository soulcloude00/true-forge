# TrueForge documentation and API coverage audit

Checked 26 September 2026 (Asia/Kolkata). This is a dated audit, not a claim that the changing docs are permanently complete.

## Source snapshots

- `snapshots/trueforge-docs-index-2026-09-26.txt`: complete `https://trueforge.dev/llms.txt` inventory captured on the check date. It contains 94 Markdown links (93 absolute page links plus the relative OpenAPI link); the snapshot is 101 physical lines including headings, blank lines, and metadata. It includes narrative guides and endpoint-reference pages.
- `snapshots/trueforge-openapi-0.2.1.json`: live OpenAPI emitted by the local TrueForge v0.2.1 server at `http://localhost:8790/api/v1/openapi.json`. This is the integration contract used by the running installation.
- `snapshots/trueforge-public-openapi-0.3.0-rc.0.json`: public OpenAPI fetched from `https://trueforge.dev/openapi.json` on 26 September 2026.
- The public docs schema is newer than local v0.2.1; do not silently apply it to local SDK calls.

## Version drift

| Snapshot | Operations | Schemas |
|---|---:|---:|
| Local TrueForge 0.2.1 | 65 | 253 |
| Public docs 0.3.0-rc.0 | 69 | 269 |

Public-docs-only operations: GET /api/v1/catalogs/web-search-providers; POST /api/v1/sessions/{session_id}/turns/{turn_id}/events; GET /api/v1/settings/web-search-providers; PUT /api/v1/settings/web-search-providers.

The public docs additionally describe web-search provider settings/catalog endpoints and turn-event creation that are absent in the local v0.2.1 server. The public schema has new inbound approval-policy/auth event shapes. The older local server exposes `TurnUpdateState*` types instead. The Nimbus app must target and verify local 0.2.1 until TrueForge is upgraded intentionally.

## Local v0.2.1 HTTP operations

### Auth

- `GET /api/v1/auth/login` — Start the login flow; params: return_to; request: none; success: not declared.
- `GET /api/v1/auth/callback` — Login callback; params: code, state*, error, error_description; request: none; success: not declared.
- `POST /api/v1/auth/logout` — Clear the local session; params: none; request: none; success: 204.
- `GET /api/v1/auth/me` — Current session; params: none; request: none; success: 200.

### Capabilities

- `GET /api/v1/capabilities` — Get server capabilities; params: none; request: none; success: 200.

### Models

- `GET /api/v1/models` — List models for chat; params: none; request: none; success: 200.
- `GET /api/v1/catalogs/model-providers` — Get the model catalog; params: none; request: none; success: 200.
- `GET /api/v1/settings/model-providers` — List configured model providers; params: none; request: none; success: 200.
- `POST /api/v1/settings/model-providers` — Create a model provider; params: none; request: CreateModelProviderRequest; success: 201.
- `PUT /api/v1/settings/model-providers` — Create or replace a model provider; params: none; request: UpdateModelProviderRequest; success: 200.

### MCP Servers

- `GET /api/v1/catalogs/mcp-servers` — Get the MCP catalog; params: none; request: none; success: 200.
- `GET /api/v1/mcp-servers/oauth/callback` — OAuth callback for MCP authorization; params: code, state*, error, error_description; request: none; success: 200.
- `GET /api/v1/mcp-servers` — List MCP servers for chat; params: none; request: none; success: 200.
- `GET /api/v1/mcp-servers/{name}/tools` — List tools of an MCP server; params: name*; request: none; success: 200.
- `GET /api/v1/mcp-servers/{name}/authorize` — Start (or short-circuit) the auth flow for an MCP server; params: name*, return_to; request: none; success: 200.
- `DELETE /api/v1/mcp-servers/{name}/authorize` — Disconnect OAuth for an MCP server; params: name*; request: none; success: 200.
- `GET /api/v1/mcp-servers/{name}` — Get an MCP server for chat; params: name*; request: none; success: 200.
- `GET /api/v1/settings/mcp-servers` — List MCP servers; params: none; request: none; success: 200.
- `POST /api/v1/settings/mcp-servers` — Create an MCP server; params: none; request: CreateMCPServerRequest; success: 201.
- `PUT /api/v1/settings/mcp-servers` — Create or replace an MCP server; params: none; request: UpdateMCPServerRequest; success: 200.
- `GET /api/v1/settings/mcp-servers/{name}` — Get a single MCP server by name; params: name*; request: none; success: 200.

### Skills

- `GET /api/v1/catalogs/skills` — Get the skill catalog; params: none; request: none; success: 200.
- `GET /api/v1/skills` — List skills for chat; params: none; request: none; success: 200.
- `GET /api/v1/skills/versions` — List skill versions; params: name*; request: none; success: 200.
- `GET /api/v1/settings/skills` — List configured skills; params: none; request: none; success: 200.
- `POST /api/v1/settings/skills` — Create a skill; params: none; request: CreateSkillRequest; success: 201.
- `PUT /api/v1/settings/skills` — Create or replace a skill; params: none; request: UpdateSkillRequest; success: 200.

### Sandboxes

- `GET /api/v1/catalogs/sandbox-providers` — Get the sandbox provider catalog; params: none; request: none; success: 200.
- `GET /api/v1/settings/sandbox-providers` — Get the configured sandbox provider; params: none; request: none; success: 200.
- `PUT /api/v1/settings/sandbox-providers` — Create or replace the sandbox provider; params: none; request: UpdateSandboxProviderRequest; success: 200.

### Agents

- `GET /api/v1/agents` — List agents; params: limit, page_token, agent_name; request: none; success: 200.
- `POST /api/v1/agents` — Create an agent; params: none; request: CreateAgentRequest; success: 201.
- `GET /api/v1/agents/{agent_id}/code-snippets` — Get agent SDK code snippets; params: agent_id*, base_url; request: none; success: 200.
- `GET /api/v1/agents/{agent_id}` — Get an agent; params: agent_id*; request: none; success: 200.
- `DELETE /api/v1/agents/{agent_id}` — Delete an agent; params: agent_id*; request: none; success: 200.
- `PUT /api/v1/agents/{agent_id}` — Update an agent; params: agent_id*; request: UpdateAgentRequest; success: 200.

### Internal

- `POST /api/internal/schedules/runs/execute` — Execute a schedule run; params: none; request: ExecuteScheduleRunRequest; success: 204.
- `POST /api/internal/import/agents` — Import agents in bulk (create); params: none; request: ImportAgentsRequest; success: 200.
- `POST /api/internal/import/sessions` — Import one historical session snapshot; params: none; request: ImportSessionRequest; success: 201.
- `GET /api/internal/import/checkpoint` — Session import checkpoint; params: tenant_id*; request: none; success: 200.
- `POST /api/internal/sessions/get-or-create-by-external-id` — Get or create a session by external id; params: none; request: GetOrCreateSessionByExternalIdRequest; success: 200, 201.
- `GET /api/internal/metrics/meters` — Get session metrics meters; params: agent_id*, start_timestamp*, end_timestamp*; request: none; success: 200.
- `GET /api/internal/metrics/charts` — Get session metrics charts; params: none; request: none; success: 200.
- `GET /api/internal/metrics/charts-data` — Get session metrics chart data; params: agent_id*, start_timestamp*, end_timestamp*, chart_name*; request: none; success: 200.
- `POST /api/internal/list-permissions` — List permissions for resources; params: none; request: ListPermissionsRequest; success: 200.

### Schedules

- `GET /api/v1/schedules` — List schedules; params: limit, page_token, agent_names, created_by_me; request: none; success: 200.
- `POST /api/v1/schedules` — Create a schedule; params: none; request: CreateScheduleRequest; success: 201.
- `GET /api/v1/schedules/{schedule_id}/runs` — List runs of a schedule; params: schedule_id*, limit, page_token; request: none; success: 200.
- `POST /api/v1/schedules/runs` — Trigger a schedule run; params: none; request: CreateScheduleRunRequest; success: 201.
- `GET /api/v1/schedules/{schedule_id}` — Get a schedule; params: schedule_id*; request: none; success: 200.
- `PUT /api/v1/schedules/{schedule_id}` — Update a schedule; params: schedule_id*; request: UpdateScheduleRequest; success: 200.
- `DELETE /api/v1/schedules/{schedule_id}` — Delete a schedule; params: schedule_id*; request: none; success: 200.

### Agent Sessions

- `POST /api/v1/sessions` — Create a session; params: none; request: CreateSessionRequest; success: 201.
- `GET /api/v1/sessions` — List sessions; params: limit, order, page_token, start_timestamp, end_timestamp, agent_id, created_by_me, metadata, source_type, source_id; request: none; success: 200.
- `GET /api/v1/sessions/{session_id}` — Get a session; params: session_id*; request: none; success: 200.
- `DELETE /api/v1/sessions/{session_id}` — Delete a session; params: session_id*; request: none; success: 204.
- `PATCH /api/v1/sessions/{session_id}` — Update a session; params: session_id*; request: UpdateSessionRequest; success: 200.
- `POST /api/v1/sessions/{session_id}/cancel` — Cancel a running turn in a session; params: session_id*; request: CancelSessionRequest; success: 200.
- `GET /api/v1/sessions/{session_id}/events` — List session events; params: session_id*, page_token, last_turn_id, limit; request: none; success: 200.
- `POST /api/v1/sessions/{session_id}/turns` — Create and execute a turn in a session; params: session_id*; request: CreateTurnRequest; success: 200.
- `GET /api/v1/sessions/{session_id}/turns` — List turns in a session; params: session_id*, limit, page_token; request: none; success: 200.
- `GET /api/v1/sessions/{session_id}/turns/{turn_id}` — Get a turn; params: session_id*, turn_id*; request: none; success: 200.
- `GET /api/v1/sessions/{session_id}/turns/{turn_id}/download-sandbox-file` — Download a file from the turn sandbox; params: session_id*, turn_id*, path*; request: none; success: 200.
- `GET /api/v1/sessions/{session_id}/turns/{turn_id}/events` — List turn events; params: session_id*, turn_id*, limit, page_token, order; request: none; success: 200.
- `GET /api/v1/sessions/{session_id}/turns/{turn_id}/subscribe` — Subscribe to a running turn; params: session_id*, turn_id*, after_sequence_number; request: none; success: 200.

## Local v0.2.1 schema inventory

Required properties are marked **required**; optional fields remain listed for exact version matching.

- **GetMeResponse**: data (required)
- **Me**: type (required); tenant_id (required): string; subject (required); roles (required): array
- **MeSessionType**: enum default | oidc-connected: (no direct properties)
- **GetMeSubject**: id (required): string; type (required): string; display_name (required): string
- **RequestErrorResponse**: error (required): object
- **GetCapabilitiesResponse**: data (required)
- **CapabilitiesData**: sandbox (required); skill (required); settings (required); web_search (required)
- **SandboxCapability**: enabled (required): boolean
- **SkillCapability**: enabled (required): boolean; reason: string
- **SettingsCapability**: enabled (required): boolean
- **WebSearchCapability**: enabled (required): boolean
- **ListAvailableModelsResponse**: data (required): array
- **AvailableModel**: name (required): string; model_id (required): string; provider (required); properties (required)
- **AvailableModelProvider**: name (required): string
- **ModelProperties**: context_length: integer; max_output_tokens: integer; reasoning_efforts: array
- **ReasoningEffort**: enum none | minimal | low | medium | high | xhigh | max: (no direct properties)
- **GetModelProviderCatalogResponse**: data (required): array
- **CatalogModelProvider**: (no direct properties)
- **CatalogWellKnownModelProvider**: type (required); logo: string; models (required): array
- **CatalogWellKnownModelProviderType**: enum openai | anthropic | google-gemini | fireworks | zai | moonshot | alibaba | together: (no direct properties)
- **CatalogModel**: model_id (required): string; name (required); properties (required)
- **ResourceName**: (no direct properties)
- **CatalogCustomModelProvider**: type (required): string; supported_reasoning_efforts (required): array
- **GetMCPServerCatalogResponse**: data (required): array
- **CatalogMCPServer**: type (required); name (required); logo: string; url (required): string; description (required): string; auth
- **CatalogMCPServerType**: enum remote: (no direct properties)
- **MCPServerManifestAuth**: (no direct properties)
- **MCPServerHeaderAuth**: type (required): string; headers (required): object
- **MCPServerDcrAuth**: type (required): string
- **GetSkillCatalogResponse**: data (required): array
- **CatalogSkill**: type (required); name (required); url (required): string; path: string; ref (required): string; description (required): string
- **CatalogSkillType**: enum git: (no direct properties)
- **GetSandboxProviderCatalogResponse**: data (required): array
- **CatalogSandboxProvider**: type (required): string; exec_timeout_ms (required): integer; auto_stop_interval_in_minutes (required): integer; auto_archive_interval_in_minutes (required): integer; auto_delete_interval_in_minutes (required): integer
- **ListAvailableMCPServersResponse**: data (required): array
- **AvailableMCPServer**: name (required); url (required): string; auth; auth_status (required)
- **MCPServerAuthPublic**: (no direct properties)
- **MCPAuthStatus**: status (required): string; authorization_url: string
- **ListMCPServerToolsResponse**: data (required): array
- **GetMCPServerResponse**: data (required)
- **ConfiguredMCPServer**: name (required); manifest (required); auth_status (required)
- **MCPServerManifest**: (no direct properties)
- **RemoteMCPServerManifest**: type (required): string; name (required); url (required): string; description (required): string; auth
- **TrueFoundryMCPServerManifest**: type (required): string; name (required); url (required): string; description (required): string; auth
- **GetAvailableMCPServerResponse**: data (required)
- **ListAvailableSkillsResponse**: data (required): array
- **AvailableSkill**: name (required): string; description (required): string; metadata: object
- **ListSkillVersionsResponse**: data (required): array
- **SkillVersion**: name (required): string; display_name (required): string; description (required): string; version (required): integer
- **ListAgentsResponse**: data (required): array; pagination (required)
- **Agent**: id (required): string; name (required); description (required): string; manifest (required); created_by_subject (required)
- **AgentSpec**: model (required); instructions: string; messages: array; mcp_servers: array; response_format; skills: array; config
- **Model**: name (required): string; params
- **ModelParams**: max_tokens: number; temperature: number; top_p: number; top_k: number; parallel_tool_calls: boolean; reasoning_effort: string
- **InitialUserMessage**: type (required): string; content (required): string
- **MCPServer**: name (required): string; enable_tools: array; disable_tools: array; preload_tools: array; require_approval_for_tools: array; preload: boolean
- **MCPServerToolSelector**: (no direct properties)
- **MCPServerApprovalToolSelector**: (no direct properties)
- **ResponseFormat**: (no direct properties)
- **ResponseFormatText**: type (required): string
- **ResponseFormatJsonObject**: type (required): string
- **ResponseFormatJsonSchema**: type (required): string; json_schema (required): object
- **Skill**: name (required): string; preload: boolean
- **RuntimeConfig**: iteration_limit: integer; sandbox; dynamic_sub_agents; context_management; generative_ui; ask_user_questions; web_search
- **SandboxConfig**: enabled (required): boolean; file_downloads: boolean
- **DynamicSubAgentsConfig**: enabled: boolean
- **ContextManagementConfig**: compaction; large_tool_response
- **CompactionConfig**: enabled: boolean; trigger
- **InputTokensCompactionTrigger**: type (required): string; value (required): integer
- **LargeToolResponseConfig**: enabled: boolean
- **GenerativeUIConfig**: enabled: boolean
- **AskUserQuestionsConfig**: enabled: boolean
- **WebSearchConfig**: enabled: boolean
- **CreatedBySubject**: subject_id (required): string; subject_type (required): string; subject_display_name (required): string
- **TokenPagination**: next_page_token: string; previous_page_token: string; limit (required): integer
- **GetAgentResponse**: data (required)
- **CreateAgentRequest**: name (required); description (required): string; manifest (required)
- **GetAgentCodeSnippetsResponse**: data (required)
- **AgentCodeSnippets**: base_url (required): string; snippets (required): array
- **AgentCodeSnippet**: label_name (required): string; language (required): string; icon (required): string; sample_code (required)
- **AgentCodeSnippetSampleCode**: stream (required): string; non_stream (required): string
- **DeleteAgentResponse**: (no direct properties)
- **UpdateAgentRequest**: description: string; manifest (required)
- **ExecuteScheduleRunRequest**: schedule_run_id (required): string
- **ListSchedulesResponse**: data (required): array; pagination (required)
- **Schedule**: id (required): string; agent_name (required); name (required); manifest (required); created_by_subject (required); created_at (required): string; updated_at (required): string
- **ScheduleManifest**: task (required): string; cron (required); timezone; status
- **CronExpression**: (no direct properties)
- **Timezone**: (no direct properties)
- **ScheduleStatus**: enum active | paused: (no direct properties)
- **ListScheduleRunsResponse**: data (required): array; pagination (required)
- **ScheduleRun**: id (required): string; schedule_id (required): string; name (required): string; scheduled_for (required): string; status (required); created_by_subject (required); triggered_at (required): string|null; reason (required): string|null; created_at (required): string; updated_at (required): string
- **ScheduleRunStatus**: enum scheduled | triggered | failed: (no direct properties)
- **CreateScheduleRunResponse**: data (required)
- **CreateScheduleRunRequest**: schedule_id (required): string
- **GetScheduleResponse**: data (required)
- **CreateScheduleRequest**: agent_name (required); name (required); manifest (required)
- **UpdateScheduleRequest**: name (required); manifest (required)
- **DeleteScheduleResponse**: (no direct properties)
- **ListModelProvidersResponse**: data (required): array
- **ConfiguredModelProvider**: name (required); manifest (required)
- **ModelProviderManifest**: (no direct properties)
- **OpenAIModelProvider**: auth (required); models (required): array; type (required): string; base_url: string
- **ModelProviderAuth**: api_key (required): string
- **ConfiguredModel**: model_id (required): string; name (required); properties (required)
- **AnthropicModelProvider**: auth (required); models (required): array; type (required): string; base_url: string
- **GoogleGeminiModelProvider**: auth (required); models (required): array; type (required): string; base_url: string
- **FireworksModelProvider**: auth (required); models (required): array; type (required): string; base_url: string
- **ZaiModelProvider**: auth (required); models (required): array; type (required): string; base_url: string
- **MoonshotModelProvider**: auth (required); models (required): array; type (required): string; base_url: string
- **TogetherAIModelProvider**: auth (required); models (required): array; type (required): string; base_url: string
- **AlibabaModelProvider**: auth (required); models (required): array; type (required): string; base_url: string
- **TrueFoundryModelProvider**: auth; models (required): array; type (required): string; base_url (required): string
- **CustomModelProvider**: auth; models (required): array; type (required): string; name (required); base_url (required): string
- **GetModelProviderResponse**: data (required)
- **CreateModelProviderRequest**: manifest (required)
- **UpdateModelProviderRequest**: manifest (required)
- **ListMCPServersResponse**: data (required): array
- **CreateMCPServerRequest**: manifest (required)
- **UpdateMCPServerRequest**: manifest (required)
- **ListSkillsResponse**: data (required): array
- **ConfiguredSkill**: name (required): string; manifest (required)
- **SkillManifest**: (no direct properties)
- **GitSkill**: type (required): string; name (required); url (required): string; path: string; ref (required): string; description (required): string
- **TrueFoundryRegistrySkill**: type (required): string; name (required): string; display_name (required): string; description (required): string; repository_name (required): string; version (required): integer
- **GetSkillResponse**: data (required)
- **CreateSkillRequest**: manifest (required)
- **UpdateSkillRequest**: manifest (required)
- **GetSandboxProviderResponse**: data (required)
- **ConfiguredSandboxProvider**: manifest (required); status (required); status_reason (required): string|null
- **SandboxProviderManifest**: type (required): string; auth (required); exec_timeout_ms (required): integer; auto_stop_interval_in_minutes (required): integer; auto_archive_interval_in_minutes (required): integer; auto_delete_interval_in_minutes (required): integer
- **DaytonaSandboxProviderAuth**: api_key (required): string
- **SandboxBuildStatus**: enum pending | ready | failed: (no direct properties)
- **UpdateSandboxProviderRequest**: manifest (required)
- **ImportAgentsResponse**: data (required)
- **ImportAgentsResult**: results (required): array
- **ImportAgentItemResult**: name (required): string; tenant_id (required): string; status (required): string; agent_id: string; error: string
- **ImportAgentsRequest**: agents (required): array
- **ImportAgentItem**: name (required); description: string; manifest (required); tenant_id (required): string; created_by_subject (required); truefoundry_managed_agent_id (required): string
- **ImportSessionResponse**: data (required)
- **ImportSessionResult**: imported (required): boolean; session_id (required): string
- **ImportSessionRequest**: session (required); turns (required): array
- **ImportSessionSnapshot**: session_id (required): string; tenant_id (required): string; created_by_subject (required); agent_name: string|null; agent_id: string|null; agent_spec: object|null; title (required): string|null; last_turn_id (required): string|null; custom (required): object|null; last_activity_timestamp_ms (required): number; created_at (required): string; updated_at (required): string
- **ImportSessionTurn**: turn_id (required): string; first_turn_id (required): string; previous_turn_id (required): string|null; ancestor_ids (required): array; input (required): array; state; checkpoint; custom (required): object|null; created_at (required): string; updated_at (required): string; threads (required): array; events (required): array
- **ImportSessionThread**: thread_id (required): string; context (required): array; current_context_usage; parent; completion; agent_info; capability_state (required): object|null
- **ImportSessionEvent**: id (required): string; created_at (required): string
- **ImportSessionsCheckpointResponse**: data (required): object
- **GetSessionResponse**: data (required)
- **Session**: id (required): string; agent (required); title (required): string|null; created_by_subject (required); created_at (required): string; updated_at (required): string; metrics (required); metadata (required); source (required)
- **SessionAgent**: (no direct properties)
- **SessionAgentReference**: type (required): string; id (required): string; name (required): string|null
- **SessionAgentInline**: type (required): string; spec (required)
- **SessionMetrics**: total_cost_in_usd: number; total_duration_ms (required): integer; total_turns (required): integer
- **SessionMetadata**: (no direct properties)
- **SessionSource**: type (required): string; id (required): string; run_id (required): string
- **GetOrCreateSessionByExternalIdRequest**: external_id (required): string; agent (required); source
- **CreateSessionAgent**: (no direct properties)
- **SessionAgentNameRef**: name (required)
- **SessionAgentSpecBody**: spec (required)
- **SessionSourceSchedule**: type (required): string; id (required): string; run_id (required): string
- **GetSessionMetricsMeterResponse**: data (required)
- **SessionMetricsMeterResponse**: meters (required): array
- **SessionMetricsMeter**: name (required): string; aggregate_value (required): number; description (required): string; unit (required)
- **MetricsUnit**: enum count | $ | ms: (no direct properties)
- **GetSessionMetricsChartResponse**: data (required)
- **SessionMetricsChartResponse**: charts (required): array
- **SessionMetricsChart**: name (required); display_name (required): string; description (required): string; chart_type (required): string
- **SessionMetricsChartName**: enum sessions_over_time | sessions_cost_over_time | turns_over_time: (no direct properties)
- **GetSessionMetricsChartDataResponse**: data (required)
- **SessionMetricsChartDataResponse**: step (required): string; graphs (required): array
- **SessionMetricsGraph**: name (required); display_name (required): string; description (required): string; unit (required); chart_type (required): string; graph_lines (required): array
- **SessionMetricsGraphLine**: name (required): string; values (required): array
- **SessionMetricsPoint**: timestamp (required): string; value (required): number
- **ListPermissionsResponse**: data (required)
- **ListPermissionsData**: type (required); permissions (required): object
- **PermissionResourceType**: enum agent | schedule | session | tenant: (no direct properties)
- **ResourcePermission**: enum USE | MANAGE | DELETE | CREATE: (no direct properties)
- **ListPermissionsRequest**: resource_type (required); resource_ids (required): array
- **CreateSessionRequest**: agent (required); metadata
- **UpdateSessionRequest**: agent; title: string; metadata
- **ListSessionsResponse**: data (required): array; pagination (required)
- **ListSessionsOrder**: enum asc | desc: (no direct properties)
- **SessionSourceType**: enum schedule: (no direct properties)
- **CancelSessionResponse**: (no direct properties)
- **CancelSessionRequest**: (no direct properties)
- **ListSessionEventsResponse**: data (required): array; pagination (required)
- **SessionEventItem**: turn_id (required): string; event (required)
- **SessionEvent**: (no direct properties)
- **TurnCreatedEvent**: type (required): string; id (required): string; turn_id (required): string; previous_turn_id (required): string|null; input: array; state (required); created_at (required): string; thread_id (required): string|null
- **TurnInputItem**: (no direct properties)
- **UserMessage**: type (required): string; content (required)
- **UserMessageContentItem**: (no direct properties)
- **TextContent**: type (required): string; text (required): string
- **FileContent**: type (required): string; name (required): string; data (required): string
- **UserToolApprovalEvent**: type (required): string; thread_id (required): string; tool_call_id (required): string; approval (required)
- **ApprovalDecision**: (no direct properties)
- **ApprovalAllow**: status (required): string
- **ApprovalDeny**: status (required): string; reason: string
- **UserToolResponseEvent**: type (required): string; thread_id (required): string; tool_call_id (required): string; content (required): string
- **TurnStateRunning**: status (required): string
- **TurnUpdateEvent**: type (required): string; id (required): string; state (required); created_at (required): string; thread_id (required): string|null
- **TurnUpdateState**: (no direct properties)
- **TurnUpdateStatePaused**: status (required): string; action_required_on_events (required): array
- **ActionRequired**: id (required): string
- **TurnUpdateStateRunning**: status (required): string
- **TurnDoneEvent**: type (required): string; id (required): string; state (required); created_at (required): string; thread_id (required): string|null
- **TurnStateDone**: status (required): string; output (required); required_actions (required): array; completed_at (required): string; metrics
- **ModelMessageEvent**: content; name: string; refusal: string|null; reasoning_content: string; tool_calls: array; type (required): string; id (required): string; thread_id (required): string; finish_reason; created_at (required): string; usage
- **ChatCompletionContentPartText**: type (required): string; text (required): string
- **ChatCompletionContentPartRefusal**: type (required): string; refusal (required): string
- **ToolCall**: (no direct properties)
- **ToolInfo**: (no direct properties)
- **TrueFoundrySystemToolInfo**: type (required): string; name (required): string
- **MCPToolInfo**: type (required): string; server_id (required): string; server_name (required): string; name (required): string
- **RawToolCall**: (no direct properties)
- **ChatCompletionMessageToolCall**: id (required): string; type (required): string; function (required): object
- **FinishReason**: enum stop | length | tool_calls | content_filter | function_call: (no direct properties)
- **ModelMessageUsage**: input_tokens (required): integer; output_tokens (required): integer; cache_read_tokens: integer; cache_write_tokens: integer; input_tokens_breakdown (required): object
- **ActionRequiredEvent**: (no direct properties)
- **ToolApprovalRequiredEvent**: type (required): string; id (required): string; created_at (required): string; thread_id (required): string; tool_calls (required): array
- **ToolCallRef**: id (required): string; source_event_id (required): string
- **ToolResponseRequiredEvent**: type (required): string; id (required): string; created_at (required): string; thread_id (required): string; tool_calls (required): array
- **MCPAuthRequiredEvent**: (no direct properties)
- **MCPServerAuthInfo**: id (required): string; name (required): string; auth_url (required): string
- **BaseMCPAuthRequiredEvent**: id (required): string; created_at (required): string; thread_id (required): string|null
- **TurnMetrics**: total_input_tokens: integer; total_output_tokens: integer; total_tokens: integer; total_cache_read_tokens: integer; total_cache_write_tokens: integer; total_reasoning_tokens: integer; total_cost_in_usd: number
- **TurnStateCancelled**: status (required): string; reason (required); completed_at (required): string; metrics
- **TurnStateCancelledReason**: enum server-execution-timeout | client-cancelled | cancelled-for-next-turn | abandoned: (no direct properties)
- **TurnStateError**: status (required): string; message (required): string; completed_at (required): string; metrics
- **ToolResponseEvent**: tool_call_id (required): string; content (required): string; type (required): string; id (required): string; thread_id (required): string; created_at (required): string
- **ThreadCreatedEvent**: type (required): string; id (required): string; agent_info (required); created_at (required): string; parent (required); thread_id (required): string; title (required): string
- **AgentInfo**: type (required): string; name (required): string; input (required): string; model: string
- **AgentParent**: thread_id (required): string; tool_call_id (required): string
- **ThreadDoneEvent**: (no direct properties)
- **ThreadState**: (no direct properties)
- **ThreadStateDone**: status (required): string; output (required)
- **ThreadStateError**: status (required): string; error (required): string; output
- **BaseThreadDoneEvent**: parent; thread_id (required): string; title (required): string
- **MCPInitializeEvent**: type (required): string; id (required): string; created_at (required): string; thread_id (required): string; mcp_servers (required): array
- **MCPServerInitInfo**: id (required): string; name (required): string; session_id: string; transport_type: string
- **SandboxCreatedEvent**: type (required): string; id (required): string; created_at (required): string; sandbox_id (required): string; thread_id (required): string|null
- **GetTurnResponse**: data (required)
- **Turn**: id (required): string; session_id (required): string; previous_turn_id (required): string|null; input: array; state (required); created_at (required): string
- **TurnState**: (no direct properties)
- **TurnStreamingEvent**: (no direct properties)
- **ModelMessageDeltaEvent**: content: string|null; refusal: string|null; tool_calls: array; reasoning_content: string; type (required): string; id (required): string; thread_id (required): string; created_at: string; finish_reason; usage
- **ExtendedChunkDeltaToolCall**: (no direct properties)
- **ChatCompletionChunkDeltaToolCall**: index (required): integer; id: string; type: string; function: object
- **CreateTurnRequest**: input: array; previous_turn_id; stream: boolean
- **PreviousTurnIdInput**: (no direct properties)
- **ListTurnsResponse**: data (required): array; pagination (required)
- **ListTurnEventsResponse**: data (required): array; pagination (required)
- **ListTurnEventsOrder**: enum asc | desc: (no direct properties)

## Nimbus-relevant implications

- Agent API specs are wire-level `snake_case`; TypeScript SDK request objects use SDK-normalized `camelCase`. The installer maps the checked-in spec accordingly.
- Tool approvals depend on MCP annotations or explicit literal names / `@all`; Nimbus explicitly names only `mark_volume_for_review`, and verifies that saved-agent selector.
- Sandbox provider configuration is a separate tenant setting from agent `config.sandbox.enabled`; actual use is on-demand and must be evidenced by a `sandbox.created` event and sandbox tool activity.
- Schedules run saved agents unattended; updates replace the manifest. Nimbus keeps the schedule inactive by default and its scheduled task forbids the tag-write tool.
- Sessions/turns stream SSE events. Approval requires correlating `tool.approval_required` call refs to source model messages and resuming with explicit `user.tool_approval` input; a UI-only approval flag is not equivalent.
- API schemas include internal endpoints too. Internal import, schedule-execution, metrics, and permissions APIs are not Nimbus dependencies and should not be called as public product flows.

## Coverage limits

This artifact fully inventories all operations and schemas in the locally served 0.2.1 OpenAPI JSON and compares top-level operation/schema counts with the public docs spec. It does not claim that every endpoint has been integration-tested. For endpoint-specific implementation, consult the stored schema and the matching installed SDK types. Narrative-guide coverage and current official event details remain summarized in `agents-that-act-trueforge-research.md`.
