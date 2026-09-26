# Agents That Act × TrueForge: research and build direction

Research checked: 26 September 2026 (Asia/Kolkata). This file records the public event profile, TrueForge product/API findings, and how the current Nimbus implementation maps to them. The TrueForge docs site is an unversioned, current documentation set rather than a version-pinned manual; claims below describe the pages as served on the access date. Match behavior to the installed TrueForge server and SDK versions before release. Event details can change; confirm the official page before relying on logistics.

## Project direction: Nimbus Cloud Janitor

**Problem:** Cloud teams lack a reliable way to spot ongoing AWS waste and rising costs across their accounts, so they need timely, evidence-backed reviews before deciding what to change.

Nimbus is an AWS cost-review agent that gathers live inventory and service-level Cost Explorer evidence through a real MCP server, validates the evidence in TrueForge's sandbox, and prepares a review. Its default collector is operator-triggered; an opt-in daily read-only TrueForge schedule is implemented but is not active in the current local instance. The schedule creates reviewable sessions but does not keep a separate billing baseline, detect anomalies, scan every region, or deliver external alerts. Unattended cleanup is out of scope.

The current implementation exposes three read tools and one optional fixed review-tag write. The readers provide inventory in one configured region, monthly service totals, and recent daily service totals. The write can only add `nimbus:review-state=candidate-for-human-review` to one currently available, unattached EBS volume after a fresh account/region/volume check and TrueForge approval. It cannot delete, stop, snapshot, or change another AWS resource. The marker means “ask a human to review,” not “safe to delete.” Synthetic UI data is separately labeled and is not live account evidence.

An opt-in TrueForge schedule is implemented in `nimbus/scripts/manage-monitor.mjs`: daily at 09:00 Asia/Kolkata, it reads inventory for the configured AWS region and 14 complete UTC days of daily account/service costs, then creates a persistent TrueForge session/report. The schedule is not active in the current local instance because no model provider or saved agent is configured. Scheduled runs are explicitly instructed not to call the tag action. This first iteration does not traverse every AWS region, persist a separate baseline, or send external alerts; those should be built before calling the product a complete continuous monitor.

**Eligibility caveat:** the event page says projects must be built during the event and pre-built projects are not eligible. The user-provided handoff directory contained a substantial pre-event Nimbus prototype. Subsequent integration work does not establish eligibility. The team should ask the organizers whether the handoff may be extended for this event; do not represent the work as created from scratch during the event.

## Event profile: Agents That Act

The official event page describes a free, one-day, in-person event by TrueFoundry and Polaris at Polaris campus in Bengaluru on Saturday, 26 September 2026. Round 1 is online and individual; Round 2 is an invited in-person build day. Teams can have up to four members. The advertised event scale is 350–400 builders. OpenAI API and AWS credits are listed as partner support.

The theme is “Reach real systems. Run real code. Stop before it hurts.” Projects may target any domain, but must use TrueForge and show the harness doing real work: reach a real connected system, execute code in an isolated sandbox, and pause for a person before a consequential action.

### Judging rubric (100 points)

| Criterion | Points | What judges look for | Nimbus proof to demonstrate |
|---|---:|---|---|
| Harness is doing the work | 30 | TrueForge reaches a real tool, runs code in its sandbox, and holds for a person; prompt wrappers score poorly. | TrueForge session trace with actual AWS MCP reads, sandbox validation, and pending approval for the exact tag tool. |
| It actually runs | 25 | Working software a stranger can clone and run; narrow and complete beats broad and broken. | Reproducible README, configured model, live local MCP, saved agent, verified run, and honest limitations. |
| Where it stops | 20 | Clear boundaries, sandbox/gates, explained action, small blast radius. | Show only the fixed review tag, fresh identity/state checks, explicit TrueForge approval, reject path, no cleanup tools. |
| Job worth handing over | 15 | A real, useful repeated task. | Demonstrate the opt-in daily evidence-backed review and explain its configured-region scope, Cost Explorer data lag, and missing external alerts/baseline. |
| Demo clarity | 10 | Five-minute demonstration and understandable architecture. | Request → real AWS evidence → sandbox report → explicit approval gate → boundary/limits. |

### Logistics, eligibility, prizes

- In-person build day: 26 September 2026, Polaris campus, Bengaluru. The page lists 09:00 check-in, 10:00 kickoff, 10:30 TrueForge/gateway walkthrough, 12:00 build start, 16:00 mentor checkpoint, 19:00 submission close, 19:30 demos, and 21:00 results; hosts note times may shift.
- Build prizes: ₹1,00,000 first, ₹75,000 second, ₹50,000 third. Separate public build-story awards: ₹50,000 and ₹25,000. The community challenge is open to Round 1 registrants whether shortlisted or not; post on LinkedIn or X tagging `@truefoundry` and `@polariscodes`, with `#agentsthatact`.
- Eligibility: 18+, able to attend in Bengaluru, no prior TrueFoundry experience required. Free entry; travel is not covered. Round 1 is individual; teams may have up to four members. The page says seats are capped at 350–400.
- Round 1 closed 18 September; shortlist announced 21 September; build submissions close 19:00 on 26 September. Since this research was checked on the event date, registration/invitation and submission status must be confirmed directly.
- Build-on-the-day rule: pre-built projects are not eligible. Prior research and reading docs are encouraged. AI assistants are permitted; disclose their use in README and be ready to explain the architecture. Open domain/stack, but the agent must run on TrueForge. Entrants retain IP; hosts ask permission to showcase demos.
- Judges listed by the host: Rahul Bhattacharya (Adopt.AI CTO), Ramakant Yadav (Scalar Field founder), Abhishek (TrueFoundry CTO), Rivu Chakraborty (Sarvam), and Suhas Motwani (Product Folks).

## TrueForge product and open-source project

TrueForge is TrueFoundry's MIT-licensed, model-neutral agent harness. It supplies the runtime around a model: agent turn loop, tool routing, streaming events, session persistence, context management, sandbox execution, approval checkpoints, and a chat UI. It is not itself a model or hosted-only service. The official [introduction](https://trueforge.dev/introduction) defines the harness and its components; the [public source repository](https://github.com/truefoundry/trueforge) is the implementation authority for release-specific details.

### Documentation map and research coverage

The docs site publishes a [complete Mintlify page index](https://trueforge.dev/llms.txt) and a generated [API reference/OpenAPI entry](https://trueforge.dev/openapi.json). I surveyed the full page index on 26 September 2026, read the product/quickstart/sandbox/agent/SDK material in depth, and inspected the other listed guide pages and API endpoint inventory for scope. The index contains substantially more than the quickstart: it also links to a large endpoint-by-endpoint API reference. The index and source are moving targets, so this map is a coverage guide, not a claim that every request schema was independently exercised.

**Pages read in depth:** [Introduction](https://trueforge.dev/introduction), [Quickstart](https://trueforge.dev/quickstart), [Setup Sandbox](https://trueforge.dev/sandbox), [Create an Agent](https://trueforge.dev/create-agent/overview), [SDK Quickstart](https://trueforge.dev/api/quickstart), [SDK Concepts](https://trueforge.dev/api/overview), and the long [Use an agent cookbook/event reference](https://trueforge.dev/api/use-agent). The [complete index](https://trueforge.dev/llms.txt) was reviewed in full. The other guide pages in the map were sampled for their descriptions, sections, and feature claims; all endpoint groups and operation summaries were inventoried, but endpoint request/response schemas were not opened individually.

| Docs area | Page inventory (first-party) | What the documentation covers |
|---|---|---|
| Product and installation | [Introduction](https://trueforge.dev/introduction), [Quickstart](https://trueforge.dev/quickstart), [Initial Setup](https://trueforge.dev/harness/initial-setup) | Harness/server/UI architecture; local `npx` and hosted Compose/Helm/Railway modes; model, MCP, skill, and sandbox setup; build and save an agent. |
| Connectors and resources | [Models](https://trueforge.dev/models), [MCP servers](https://trueforge.dev/mcp-servers), [Skills](https://trueforge.dev/skills), [Sandbox](https://trueforge.dev/sandbox) | Provider and connector catalogs, user-supplied credentials, remote MCP auth, git-backed `SKILL.md` packs, sandbox configuration and lifecycle. |
| Agent lifecycle and runtime | [Create an Agent](https://trueforge.dev/create-agent/overview), [Agents](https://trueforge.dev/agent-library), [Sessions](https://trueforge.dev/sessions), [Schedules](https://trueforge.dev/schedules) | Agent spec fields and UI/API parity, saved-agent library, persisted sessions/turns/events, and recurring unattended tasks that create reviewable sessions. |
| Harness capabilities | [Overview](https://trueforge.dev/key-features/overview), [Subagents](https://trueforge.dev/key-features/subagents), [Deferred Tool Loading](https://trueforge.dev/key-features/deferred-tool-loading), [Code Mode](https://trueforge.dev/key-features/code-mode), [Large Tool Responses](https://trueforge.dev/key-features/large-tool-responses) | On-demand sandbox-as-tool; context management; approvals/questions/Generative UI; parallel subagents; deferred MCP tool discovery; code-mediated tool aggregation; large-result offloading. These rely on configuration and agent settings as documented; a feature toggle alone does not prove a live capability worked. |
| Identity and hosted operation | [Login / OIDC](https://trueforge.dev/authentication/overview), [Quickstart deployment notes](https://trueforge.dev/quickstart#run-trueforge) | Local no-login mode is for personal localhost use; hosted/shared use requires configuring OIDC and deployment infrastructure. Hosted options include Docker Compose, Kubernetes/Helm, and Railway. |
| Programmatic API | [SDK Quickstart](https://trueforge.dev/api/quickstart), [SDK Concepts](https://trueforge.dev/api/overview), [Use an agent cookbook](https://trueforge.dev/api/use-agent), [API Reference / OpenAPI](https://trueforge.dev/openapi.json) | Current official docs provide TypeScript `@truefoundry/trueforge-sdk` and Python `trueforge-sdk`; Agent → Session → Turn → Event → Delta; inline or saved agents; REST/SSE; approval/question/auth pause handling; reconnects, threads, schedules, and event schemas. The reference breaks out agent CRUD; identity/capabilities; MCP, model, sandbox, skill, and web-search settings; schedule and run operations; and session, turn, event, cancellation, and sandbox artifact endpoints. |
| User interface package | [Chat UI / UI SDK](https://trueforge.dev/chat-ui), [UI SDK docs](https://trueforge.dev/ui-sdk/get-started/quickstart) | Bundled React chat plus embeddable `@truefoundry/trueforge-ui`, agent modes, themes/layouts, custom servers, component references, hooks, events, and settings catalog. |
| Evidence and future direction | [Benchmarking](https://trueforge.dev/benchmarking), [Roadmap](https://trueforge.dev/roadmap) | Vendor-authored comparative benchmark method/results and reproducibility guidance; directional roadmap. Benchmarks are vendor-published, not independent guarantees; roadmap items are not current features or delivery promises. |

**API reference inventory:** the generated reference is organized into `agents`, `auth`, `capabilities`, `mcp-servers`, `models`, `sandboxes`, `schedules`, `skills`, `web-search-providers`, and `agent-sessions`. Within those groups it documents agent CRUD; session create/get/list/update/delete; turn create/get/list/cancel; SSE subscribe and persisted event operations; schedule CRUD/run listing/manual trigger; MCP catalog/configuration/tool listing/OAuth status; model and sandbox catalogs/configuration; skill catalogs/configuration/versions; and sandbox artifact download. Use the version-matched OpenAPI output as the final authority for payloads and endpoint availability.

**Access limits:** the published index and guide pages were accessible. The interactive API reference is generated and its raw schemas are linked from the docs; individual endpoint schemas were indexed but not exhaustively opened one-by-one in this research pass. The `llms.txt` fetch was accessible directly from the official site, though the web search/open connector did not render that plain-text URL; raw Markdown page URLs did work. The docs do not identify a single semver release for the whole site. The live local instance/version and installed package versions must therefore be recorded alongside any implementation-level API claim.

### Product capabilities

- **Models:** provider/model selection, with OpenAI, Anthropic, Google Gemini, Fireworks AI, and a custom OpenAI-compatible endpoint documented; catalog support may change. The provider key is configured separately from agent definitions in TrueForge settings or deployment secrets. ([Models guide](https://trueforge.dev/models))
- **MCP connectors:** connect remote MCP servers from the catalog or a custom URL, with header auth or OAuth as documented. Expose only tools the agent needs; tool descriptions/annotations do not replace the approval control. ([MCP guide](https://trueforge.dev/mcp-servers))
- **Skills:** git-backed `SKILL.md` packs that can be registered and attached by name; runtime access and code execution require the configured sandbox. ([Skills guide](https://trueforge.dev/skills))
- **Sandbox:** provisioned as a tool for code/file execution. Sandbox isolation depends on a configured provider; the sandbox toggle alone is not proof of an isolated run. The [sandbox docs](https://trueforge.dev/sandbox) currently describe Daytona as the supported provider.
- **Human controls:** per-tool approval, ask-user questions, and Generative UI. Exact approval configuration is part of the agent manifest; verify it in the saved agent and observe the approval event.
- **Context/runtime:** documented features include subagents, deferred MCP tool loading, Code Mode, large-result offloading, and compaction. Availability/configuration and actual use need to be shown in a run trace rather than inferred from product existence. ([Harness capability guide](https://trueforge.dev/key-features/overview))
- **Persistence/inspection:** sessions persist; UI/API expose turns, tool calls, subagents, events, and run metadata. Native schedules run a saved agent unattended and create sessions for later inspection; they do not by themselves supply product-specific baselines or alert delivery. ([Sessions](https://trueforge.dev/sessions), [Schedules](https://trueforge.dev/schedules))
- **Interfaces:** bundled chat UI; REST + Server-Sent Events with OpenAPI; current SDK docs name TypeScript `@truefoundry/trueforge-sdk` and Python `trueforge-sdk`; React UI SDK is `@truefoundry/trueforge-ui`. ([SDK Quickstart](https://trueforge.dev/api/quickstart), [UI SDK](https://trueforge.dev/chat-ui))
- **Deployment:** local single process with SQLite; hosted options documented include Docker Compose, Kubernetes/Helm, and Railway with Postgres/Redis. Local mode has no login by default and is intended to remain on localhost; shared hosted deployments should configure OIDC. ([Quickstart](https://trueforge.dev/quickstart), [Login](https://trueforge.dev/authentication/overview))
- **Optional gateway:** TrueFoundry AI Gateway can provide routing, rate limits, budgets, credentials, guardrails, and traces. The event says it may help but is not required.

### Install and local runtime

The [official quickstart](https://trueforge.dev/quickstart) requires Node.js 22.14+ and starts local mode with `npx @truefoundry/trueforge`. UI/API defaults to `http://localhost:8790`. Configure a model under Settings → Models, connect MCP under Settings → Connectors, configure a sandbox provider if code execution is required, then create/save the agent. Do not publicly expose the default unauthenticated local server.

### API and SDK details verified for Nimbus

- The [SDK quickstart](https://trueforge.dev/api/quickstart), [concepts](https://trueforge.dev/api/overview), and [agent-use guide](https://trueforge.dev/api/use-agent) document agent registration, sessions, turns, events, and schedules. A running server exposes interactive REST docs at `/api/v1/docs`; consult that server's OpenAPI schema for exact version-specific paths and payloads.
- Nimbus uses `TrueForge`/`TrueForgeApi` from `@truefoundry/trueforge-sdk`, creates a session, and streams turns with `createTurnStream(...).withMetadata()`. The iterator yields `{data: event}` records; stream processing handles model and tool events.
- For approval, capture `tool.approval_required`, use its pending call refs and `sourceEventId` to recover the matching model tool name/arguments, show those to the person, then resume in a new turn with `user.tool_approval` (`allow` or `deny`). A paused turn exposes required actions, and one turn may require resolving multiple pending actions. Do not silently treat UI planning state as an approval. ([Approval recipe and event reference](https://trueforge.dev/api/use-agent#tool-approvals))
- Explicit tool selection uses named MCP tools; `require_approval_for_tools` is the agent-spec setting documented for per-tool gates. Nimbus intends approval on `mark_volume_for_review` only. This is a real cloud mutation boundary and must be verified in the saved agent before use. ([Agent spec](https://trueforge.dev/create-agent/overview#whats-in-an-agent))
- Runtime API details can vary by version. The local server's OpenAPI schema and the installed SDK types are authoritative for the exact version under test; do not copy assumed payload shapes from a different release.

### Nimbus architecture and boundaries

```text
Operator
   ↓
TrueForge agent/session ─── TrueForge sandbox (validate evidence)
   │
   └── Nimbus MCP server ─── AWS STS / EC2 / ELB / Cost Explorer
                                └── fixed EBS review tag only, after approval
```

The live MCP inventory and service-cost readers paginate up to 20 pages per service and report truncation. Cost Explorer returns service-level totals, not per-resource attribution. The fixed tag action revalidates caller account, region, volume identity, and available/unattached status; it refuses to overwrite a different marker. No delete, stop, or snapshot tool exists. The browser scanner remains a separately labeled synthetic/local-input preview.

Nimbus defaults to an operator-triggered review. An opt-in daily TrueForge schedule is implemented, but it is not active in the current local instance because its model provider and saved agent are not configured. When enabled, it reviews the configured AWS region and recent account/service-level daily costs, then creates a TrueForge session. It does not scan every region, retain a separate historical baseline, detect anomalies, or deliver external alerts. Any resource change remains a separate, freshly checked, human-approved decision.

## Sources

Primary sources checked (all accessed 26 September 2026):

- [User-supplied HackCulture event page](https://hackculture.io/hackathons/agents-that-act) (not directly retrievable in the research browser; event terms checked against the host page).
- [Official TrueFoundry × Polaris event profile and rubric](https://www.truefoundry.com/es/truefoundry-hackathon)
- [TrueForge docs index](https://trueforge.dev/llms.txt) (entire page inventory), [introduction](https://trueforge.dev/introduction), [quickstart](https://trueforge.dev/quickstart), [initial setup](https://trueforge.dev/harness/initial-setup), [models](https://trueforge.dev/models), [MCP servers](https://trueforge.dev/mcp-servers), [skills](https://trueforge.dev/skills), [sandbox](https://trueforge.dev/sandbox), [agent spec](https://trueforge.dev/create-agent/overview), [agents](https://trueforge.dev/agent-library), [sessions](https://trueforge.dev/sessions), [schedules](https://trueforge.dev/schedules), [harness overview](https://trueforge.dev/key-features/overview), [subagents](https://trueforge.dev/key-features/subagents), [deferred tool loading](https://trueforge.dev/key-features/deferred-tool-loading), [Code Mode](https://trueforge.dev/key-features/code-mode), [large tool responses](https://trueforge.dev/key-features/large-tool-responses), [login/OIDC](https://trueforge.dev/authentication/overview), [SDK quickstart](https://trueforge.dev/api/quickstart), [SDK concepts](https://trueforge.dev/api/overview), [agent-use cookbook and event reference](https://trueforge.dev/api/use-agent), [chat UI SDK](https://trueforge.dev/chat-ui), [UI SDK quickstart](https://trueforge.dev/ui-sdk/get-started/quickstart), [benchmarking](https://trueforge.dev/benchmarking), and [roadmap](https://trueforge.dev/roadmap).
- [TrueForge GitHub repository](https://github.com/truefoundry/trueforge) (MIT license and source)

The event times and participant terms above reflect the published host page and should be checked for last-minute changes. TrueForge product claims above are linked to official documentation; vendor benchmark claims are not treated as independent guarantees.
