# Agents That Act × TrueForge: research and build direction

Research date: 26 September 2026  
Workspace status: empty repository; no existing application or team requirements were present.

## Executive recommendation

Build **SafeShip: a release captain that turns a real GitHub issue or release request into a tested draft release**. It reads the selected repository and its changes through GitHub, inspects the diff, writes or updates release notes in an isolated TrueForge sandbox, and runs the repository's declared validation command there. It then presents a compact evidence-backed release plan and pauses at a TrueForge human approval checkpoint before opening/updating the release PR or publishing anything. For the hackathon, keep the final external mutation to **creating a draft GitHub PR**; do not publish packages or deploy.

This is a stronger fit than a generic assistant because it has a valuable real job, a live system integration, actual code execution, a reversible artifact, and a clearly demonstrated stopping point. It maps directly to the event's own “Release captain” example while adding a tangible test-and-evidence loop.

## Event profile: Agents That Act

The official event page describes a free, one-day, in-person event by TrueFoundry and Polaris at Polaris campus in Bengaluru on Saturday, 26 September 2026. Round 1 is online and individual; Round 2 is an invited in-person build day. Teams can have up to four members. The advertised event scale is 350–400 builders. OpenAI API and AWS cloud credits are listed as partner support.

The theme is “Reach real systems. Run real code. Stop before it hurts.” Projects can target any domain, but must use TrueForge and show the harness doing real work. The page calls for a real connected system rather than a mocked tool, code actually executed in an isolated sandbox, and an explicit human pause before a consequential/irreversible action.

### Judging rubric (100 points)

| Criterion | Points | What judges explicitly want | SafeShip proof |
|---|---:|---|---|
| Harness is doing the work | 30 | TrueForge reaches a real tool, runs generated code in its sandbox, and holds for a person. A prompt wrapper scores near zero. | Live GitHub MCP/API read; actual sandbox test run; visible approval event before draft PR creation. |
| It actually runs | 25 | Working software that a stranger can clone and run from the README; narrow working scope beats broad incomplete scope. | One repo, one release path, fixture-free demo setup, exact install/config/run steps and fallback demo repo. |
| Where it stops | 20 | Defensible boundaries, sandbox/gates, clear explanation of proposed action, low blast radius on errors. | Read-only by default; sandboxed local work; no merge/publish/deploy; approval payload shows files, checks, diff, target branch. |
| Job worth handing over | 15 | A real chore people would delegate. | Release preparation is routine, multi-step, and costly to do carelessly. |
| Demo clarity | 10 | Five-minute demonstration and ability to explain the architecture. | Scripted five-minute story and visible sequence: request → GitHub → sandbox → checks → approval → draft PR. |

### Event logistics, eligibility, and prizes

- In-person build day: 26 September 2026, Polaris campus, Bengaluru. The page lists a provisional 09:00 check-in, 10:00 kickoff, 10:30 TrueForge/gateway walkthrough, 12:00 build start, 16:00 mentor checkpoint, 19:00 submission close, 19:30 demos, and 21:00 results; the hosts say times may shift.
- Build prizes: ₹1,00,000 first, ₹75,000 second, ₹50,000 third. Separate public build-story awards: ₹50,000 and ₹25,000. Community prizes are open to Round 1 registrants whether shortlisted or not; post on LinkedIn or X tagging `@truefoundry` and `@polariscodes`, with `#agentsthatact`.
- Eligibility: 18+, can attend in Bengaluru, no prior TrueFoundry experience required. Free entry; travel is not covered. Registration is individual; teams up to four.
- Build-on-the-day rule: pre-built projects are not eligible. Prior research and reading docs are encouraged. Use AI assistants if desired, disclose them in README, and be ready to explain the architecture. Open domain/stack except the agent must run on TrueForge. Entrants keep their IP; hosts ask permission to showcase demos.
- Shortlisting emphasizes a specific, technically plausible idea and motivation rather than résumé credentials. The event page says seats are capped at 350–400.

**Date caveat:** the page currently says Round 1 closed 18 September, shortlist 21 September, and build day 26 September. Since the research date is the build-day date, confirm registration/invitation and on-site status before treating this as still actionable.

## TrueForge product and open-source project

TrueForge is TrueFoundry's MIT-licensed, open-source, model-neutral agent harness. It supplies the runtime around a model: agent turn loop, tool routing, streamed events, session persistence, context management, sandbox execution, approval checkpoints, and a chat UI. It is not itself a model or a hosted-only agent service.

### Capabilities relevant to the build

- **Providers:** OpenAI, Anthropic, Google Gemini, catalog models, and OpenAI-compatible endpoints. The agent configuration chooses a model and reasoning effort.
- **MCP/connectors:** remote MCP servers with header auth or OAuth; configurable catalogs and custom MCP URLs. The docs quickstart demonstrates connecting Exa.
- **Skills:** git-backed `SKILL.md` packs loaded on demand in the sandbox.
- **Sandbox:** execution is provisioned as a tool when needed (Daytona is documented currently). Use for generated code, file work, and enabled skills; keep external credentials in TrueForge/config, not inside generated code.
- **Human checkpoints:** tool approval, ask-user questions, and Generative UI; configure approval for every consequential write.
- **Context controls:** dynamic subagents, deferred tool loading, Code Mode, large-result offloading, and compaction.
- **Persistence/inspection:** sessions persist; the UI exposes turns, tools, subagents, token use, and timing. Schedules exist for recurring unattended runs, but are unnecessary for the hackathon demo.
- **Interfaces:** bundled chat UI, REST + Server-Sent Events/OpenAPI, TypeScript SDK `@truefoundry/trueforge-sdk`, and React UI SDK `@truefoundry/trueforge-ui`.
- **Deployment:** local single-process + SQLite; hosted Docker Compose/Kubernetes/Helm/Railway + Postgres/Redis. Local mode has no login by default and is explicitly for localhost/personal use, not public production exposure.
- **Gateway:** optional TrueFoundry AI Gateway can add routing, rate limits, budgets, credentials, guardrails, and traces without changing the agent. Event says it is useful but not required to win.

### Getting started / runtime expectations

Official quickstart requires Node.js 22.14+ and starts local mode with:

```sh
npx @truefoundry/trueforge@latest
```

The UI/API is then at `http://localhost:8790`. Configure a model in Settings → Models; add a real MCP server in Settings → Connectors; configure Daytona in Sandbox providers if sandbox code is needed; create and save the agent with its model, instructions, MCP tools, skills, and runtime settings. For team/shared use, docs recommend hosted mode with login enabled, not public local mode.

### API / SDK research

The docs describe the server as HTTP API + TypeScript SDK. REST and Server-Sent Events are exposed with OpenAPI and interactive documentation at `/api/v1/docs` on a running server. The SDK is documented for sessions, turns, events, and agent specifications. The API reference is generated from the server OpenAPI schema; the live endpoint is the authoritative schema to inspect after launching the matching version. This workspace is currently empty and has no TrueForge checkout, server, credentials, or installed SDK, so endpoint names/payloads should be copied from the running server's `/api/v1/docs` or its repo's `docs/openapi.json`, not guessed here.

For this project, use the TrueForge bundled UI for the demo and its native agent configuration. If a custom front end is needed, call the documented API/SDK for session creation and turn streaming, and preserve streamed approval events. Avoid building a parallel orchestration loop: judges need to see TrueForge drive the work.

### Open-source repository and contribution notes

- Repository: [`truefoundry/trueforge`](https://github.com/truefoundry/trueforge), MIT licensed, with server, frontend, TypeScript SDK, Python SDK, docs, OpenAPI artifacts, deployment charts, and benchmark material.
- README’s core product claim: one harness runs model calls, MCP tools, skills, sandboxing, approvals, context management, and session state through UI/API/SDK.
- The project says it benchmarks against Claude Managed Agents and deepagents; treat percentage savings as vendor-reported benchmark claims, not independent guarantees.
- Contribution guide says generated SDKs/OpenAPI artifacts are not hand-edited; source route handlers are. It asks maintainers to approve non-trivial contribution issues before coding. That policy is relevant only if contributing to TrueForge itself, not building a separate hackathon app.

## Recommended build: SafeShip release captain

### User job

“Prepare this release from issue(s) X: inspect the actual repository changes, run the project's checks in isolation, draft accurate release notes, and open a draft PR only after I review exactly what will change.”

### Narrow hackathon scope

1. User selects one public or personally authorized GitHub repository and names an issue or release request.
2. Agent uses a real GitHub MCP connector to read repository metadata, recent commits, PRs/issues, and relevant files (read-only permissions for the demo).
3. Agent produces a bounded release plan and changelog draft grounded in those source items.
4. Agent stages only the proposed changelog/release-note file into a disposable sandbox, runs the repository's safe declared validation command, and reports command/output. No production code is executed on the host.
5. Agent presents a review card with source references, exact diff, checks run, target branch, and side effects.
6. TrueForge pauses at a human checkpoint. On approval, a separately scoped GitHub write action creates a **draft PR**. On rejection, nothing is written. The agent never merges, tags, publishes, deploys, or deletes.

### Why this concept is a good bet

- It is directly analogous to an official event example (release captain) but concretely proves the sandbox/test and approval mechanics.
- It keeps the external write reversible and easy to explain; no publishing/deploying live product artifacts.
- Its demo naturally visualizes the chain of responsibility and evidence. It can be trimmed to one feature branch, one Markdown file, and one check if time runs short.
- It has a clear fallback: run against a team-owned public demo repository with a deliberately small issue. A fixture can illustrate error handling, but the scored run should still visibly connect to a real GitHub system.

## Architecture and permission boundaries

```text
User request
    ↓
TrueForge session + configured release-captain agent
    ├── GitHub MCP (read tools; narrowly scoped write tool only for approved draft PR)
    ├── TrueForge sandbox (proposed file + declared validation command)
    └── Human approval checkpoint (exact action and diff shown)
             ↓ approve only
        Create draft PR
```

Default deny: no merge, release publish, package registry, deployment, branch protection change, secret access, destructive git command, or arbitrary shell command. Validate repository/branch paths, cap changed files and output size, set timeouts, and ensure the sandbox has no write credentials. Keep GitHub write credential inaccessible to the sandbox; only the harness-side, post-approval tool receives it. Use the least-privilege token and a throwaway repository for judging.

## Rubric-to-demo checklist

- [ ] TrueForge UI shows configured agent; actual GitHub connector call visible in session.
- [ ] Run a real repository validation command inside sandbox; show its result.
- [ ] Show approval tool configured and event pending; explain why draft PR is the boundary.
- [ ] Approve once and show a draft PR; demonstrate reject path on a second run if possible.
- [ ] README from a clean clone explains prerequisites, setup, environment variables, exact run steps, safe demo repository, permission scopes, AI assistants used, architecture, and known limitations.
- [ ] Five-minute demo: 30s real-world pain → 60s request and real tool reach → 60s sandbox/test → 60s approval boundary and draft PR → 60s architecture/safety/failure handling → 30s takeaway.
- [ ] Build story post: tell the specific release chore, show the harness steps, include one surprising failure/learning, tag both accounts and hashtag.

## Sources

Primary sources consulted:

- [HackCulture event URL supplied by user](https://hackculture.io/hackathons/agents-that-act) (could not be fetched by the browser tool directly; resolved through the linked official event page).
- [Official TrueFoundry × Polaris event page and full rubric](https://www.truefoundry.com/es/truefoundry-hackathon)
- [TrueForge documentation home / introduction](https://trueforge.dev/introduction)
- [TrueForge quickstart](https://trueforge.dev/quickstart)
- [TrueForge GitHub repository and README](https://github.com/truefoundry/trueforge)
- [TrueForge API docs discovery](https://trueforge.dev/api-reference) (per docs, running server exposes interactive API docs at `/api/v1/docs`)
- [TrueForge SDK docs](https://trueforge.dev/sdk)

Marketing claims, especially benchmark savings, have been labelled as vendor claims above. Event logistics and criteria are transcribed from the official host page, which should be rechecked for late changes.
