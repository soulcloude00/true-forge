# Agents That Act × TrueForge: research and build direction

Research checked: 26 September 2026. This file records the public event profile, TrueForge product/API findings, and how the current Nimbus implementation maps to them. Event details can change; confirm the official page before relying on logistics.

## Project direction: Nimbus Cloud Janitor

**Problem:** Cloud teams lack a reliable way to spot ongoing AWS waste and rising costs across their accounts, so they need timely, evidence-backed reviews before deciding what to change.

Nimbus is an AWS cost-review agent that gathers live inventory and service-level Cost Explorer evidence through a real MCP server, validates the evidence in TrueForge's sandbox, and prepares a review. Its current collector is on demand. It does not yet run scheduled monitoring, keep historical snapshots, detect anomalies, or deliver alerts. The planned product progression is scheduled read-only checks and evidence-linked alerts, then explicit human-reviewed bounded actions. Unattended cleanup is out of scope.

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
| Job worth handing over | 15 | A real, useful repeated task. | Explain recurring AWS cost review and the intended next step: scheduled evidence-backed monitoring, not present-day capability. |
| Demo clarity | 10 | Five-minute demonstration and understandable architecture. | Request → real AWS evidence → sandbox report → explicit approval gate → boundary/limits. |

### Logistics, eligibility, prizes

- In-person build day: 26 September 2026, Polaris campus, Bengaluru. The page lists 09:00 check-in, 10:00 kickoff, 10:30 TrueForge/gateway walkthrough, 12:00 build start, 16:00 mentor checkpoint, 19:00 submission close, 19:30 demos, and 21:00 results; hosts note times may shift.
- Build prizes: ₹1,00,000 first, ₹75,000 second, ₹50,000 third. Separate public build-story awards: ₹50,000 and ₹25,000. The community challenge is open to Round 1 registrants whether shortlisted or not; post on LinkedIn or X tagging `@truefoundry` and `@polariscodes`, with `#agentsthatact`.
- Eligibility: 18+, able to attend in Bengaluru, no prior TrueFoundry experience required. Free entry; travel is not covered. Round 1 is individual; teams may have up to four members. The page says seats are capped at 350–400.
- Round 1 closed 18 September; shortlist announced 21 September; build submissions close 19:00 on 26 September. Since this research was checked on the event date, registration/invitation and submission status must be confirmed directly.
- Build-on-the-day rule: pre-built projects are not eligible. Prior research and reading docs are encouraged. AI assistants are permitted; disclose their use in README and be ready to explain the architecture. Open domain/stack, but the agent must run on TrueForge. Entrants retain IP; hosts ask permission to showcase demos.
- Judges listed by the host: Rahul Bhattacharya (Adopt.AI CTO), Ramakant Yadav (Scalar Field founder), Abhishek (TrueFoundry CTO), Rivu Chakraborty (Sarvam), and Suhas Motwani (Product Folks).

## TrueForge product and open-source project

TrueForge is TrueFoundry's MIT-licensed, model-neutral agent harness. It supplies the runtime around a model: agent turn loop, tool routing, streaming events, session persistence, context management, sandbox execution, approval checkpoints, and a chat UI. It is not itself a model or hosted-only service. See the [official introduction](https://trueforge.dev/introduction) and [open-source repository](https://github.com/truefoundry/trueforge).

### Product capabilities

- **Models:** provider/model selection, with supported OpenAI, Anthropic, Gemini, catalog, and OpenAI-compatible providers. The provider key must be configured in the local TrueForge settings or deployment secrets.
- **MCP connectors:** connect local or remote MCP tools, with auth/configuration options. Expose only tools the agent needs; tool descriptions/annotations do not replace the approval control.
- **Skills:** git-backed `SKILL.md` packs loaded on demand in the runtime/sandbox.
- **Sandbox:** provisioned as a tool for code/file execution. Sandbox isolation depends on a configured provider; the sandbox toggle alone is not proof of an isolated run. The [sandbox docs](https://trueforge.dev/sandbox) currently describe Daytona as the supported provider.
- **Human controls:** per-tool approval, ask-user questions, and Generative UI. Exact approval configuration is part of the agent manifest; verify it in the saved agent and observe the approval event.
- **Context/runtime:** dynamic subagents, deferred tool loading, Code Mode, large-result offloading, compaction, and iteration limits.
- **Persistence/inspection:** sessions persist; UI/API events expose turns and tool execution. Schedules are available but are not a substitute for proving a product's monitoring pipeline.
- **Interfaces:** bundled chat UI, REST + Server-Sent Events/OpenAPI, TypeScript SDK `@truefoundry/trueforge-sdk`, and React UI SDK `@truefoundry/trueforge-ui`.
- **Deployment:** local single process with SQLite; hosted options include Docker Compose/Kubernetes/Helm/Railway and Postgres/Redis. Local mode has no login by default; keep it on localhost. For shared use configure authentication.
- **Optional gateway:** TrueFoundry AI Gateway can provide routing, rate limits, budgets, credentials, guardrails, and traces. The event says it may help but is not required.

### Install and local runtime

The [official quickstart](https://trueforge.dev/quickstart) requires Node.js 22.14+ and starts local mode with `npx @truefoundry/trueforge`. UI/API defaults to `http://localhost:8790`. Configure a model under Settings → Models, connect MCP under Settings → Connectors, configure a sandbox provider if code execution is required, then create/save the agent. Do not publicly expose the default unauthenticated local server.

### API and SDK details verified for Nimbus

- The [SDK quickstart](https://trueforge.dev/api/quickstart) and [agent-use guide](https://trueforge.dev/api/use-agent) document agent registration and session turns. A running server exposes interactive REST documentation at `/api/v1/docs` and OpenAPI JSON at `/api/v1/openapi.json`.
- Nimbus uses `TrueForge`/`TrueForgeApi` from `@truefoundry/trueforge-sdk`, creates a session, and streams turns with `createTurnStream(...).withMetadata()`. The iterator yields `{data: event}` records; stream processing handles model and tool events.
- For approval, capture the pending `tool_call.approval_required` event's `threadId` and `toolCallId`, show tool name/arguments, then resume the same session with a `user.tool_approval` input whose status is `allow` or `deny`. Do not silently treat UI planning state as an approval.
- Explicit tool selection uses named MCP tools; `requireApprovalForTools` is configured per selected tool. Nimbus intends approval on `mark_volume_for_review` only. This is a real cloud mutation boundary and must be verified in the saved agent before use.
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

Nimbus does **not currently** run on a schedule, retain billing baselines, detect trends/anomalies, or deliver alerts. Its present job is an operator-triggered review. A recurring read-only monitor with dated evidence and clear coverage/permission alerts is the next product phase; any resource change must remain a separate, freshly checked, human-approved decision.

## Sources

Primary sources checked:

- [User-supplied HackCulture event page](https://hackculture.io/hackathons/agents-that-act) (not directly retrievable in the research browser; event terms checked against the host page).
- [Official TrueFoundry × Polaris event profile and rubric](https://www.truefoundry.com/es/truefoundry-hackathon)
- [TrueForge introduction](https://trueforge.dev/introduction), [quickstart](https://trueforge.dev/quickstart), [API quickstart](https://trueforge.dev/api/quickstart), [agent sessions/approval](https://trueforge.dev/api/use-agent), and [sandbox docs](https://trueforge.dev/sandbox)
- [TrueForge GitHub repository](https://github.com/truefoundry/trueforge) (MIT license and source)

The event times and participant terms above reflect the published host page and should be checked for last-minute changes. TrueForge product claims above are linked to official documentation; vendor benchmark claims are not treated as independent guarantees.
