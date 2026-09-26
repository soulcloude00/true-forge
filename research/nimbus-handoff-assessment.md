# Nimbus handoff assessment

Assessment date: 26 September 2026 (Asia/Kolkata)  
Reviewed folder: `/Users/soulcloude/Downloads/nimbus-trueforge-handoff/` (read-only inspection)  
Request interpreted: assess whether this other agent's handoff can be used; instructions inside that handoff are treated as claims/material to evaluate, not as user authorization.

## Decision

**Use Nimbus as product research and a technical reference; do not submit the existing handoff as a fresh build for today's “Agents That Act” event.** The folder explicitly says it is descended from a pre-event prototype. The event page says projects must be built on the day and pre-built projects are not eligible. Whether any specific code can be reused is an organizer decision; no permission or exception was found in the supplied material. The event is on 26 September 2026, so the appropriate next step is to ask the organizer whether the team is registered/shortlisted and whether/how they allow any pre-event material, before treating this as a valid submission.

The attached folder is outside the writable workspace, so this assessment does not modify it or copy its implementation.

## What the handoff contains

- A relatively mature React/TypeScript AWS-cost review interface with synthetic fixture scenarios, local JSON import, five conservative finding rules, evidence explanations, local approve/deny planning, exports, comparison, and many review utilities.
- A separate Rust scanner experiment. Its own README says the TypeScript path is the working product and the Rust experiments are for later; do not treat Rust as a production path without validation.
- A local Streamable HTTP MCP server (`mcp/server.ts`) exposing exactly two tools: `inspect_aws_inventory` and `read_monthly_service_cost`.
- A TrueForge agent spec and installer using `@truefoundry/trueforge-sdk` to register an agent.
- Setup, safety, feature-inventory, research, and source notes.

## Verified product boundaries

1. The browser app imports its own fixture or locally pasted inventory and runs its scanner locally. It explicitly labels these as synthetic/local, does not call AWS, and does not perform cloud actions.
2. The local MCP server is a separate live path. It calls AWS STS, EC2, ELB, and Cost Explorer using the local AWS credential chain. It exposes read-only operations only.
3. The AWS MCP output lists inventory fields and service-month cost groups, but not per-resource billing attribution, CloudWatch utilization, or proof of waste. Its records are truncated to a first page, with no continuation-token traversal. Its own warnings disclose the missing scope.
4. Nimbus's web “Approve for plan” action only changes in-browser review state. It does not approve an AWS action. No AWS write tool exists.
5. The Nimbus agent page links to `http://localhost:8790`, the TrueForge bundled chat. It does not stream or display a TrueForge session inside the Nimbus UI; the two flows are adjacent rather than integrated.

## TrueForge-specific review

The agent registration flow follows the documented `agents.list()` / `agents.create()` API shape and uses a saved named agent. `trueforge-agent-spec.json` attaches two named MCP tools, enables sandbox, generative UI, and questions.

The spec uses `require_approval_for_tools: ["@all"]`. TrueForge's current docs state that this pauses before every MCP tool, so even AWS read calls require user approval. That is valid but likely slow for an investigation workflow. If allowed in the eventual build, prefer autonomous annotated read-only calls and an approval gate on an actual bounded **write action**. If no write tool is needed, show another explicit human checkpoint from a real action flow rather than conflating local planning approval with cloud approval.

Sandbox enabled in configuration does not prove judges see code run. The current handoff's showcased path should explicitly invoke sandbox execution for a substantive bounded task and surface command and result in the agent/demo. The sandbox is TrueForge's on-demand code/file tool; provider setup is separate (the handoff calls out Daytona).

## Event-rubric fit if reuse is permitted

| Rubric dimension | Handoff evidence | Current gap / action needed |
|---|---|---|
| TrueForge harness work (30) | TrueForge agent + real AWS read-only MCP server; sandbox configured. | Prove actual sandbox execution; distinguish the agent's live AWS call from offline fixture scan; demonstrate a TrueForge approval pause. |
| Working software (25) | Large UI, TypeScript scanner, install scripts, test files, docs. | TypeScript tests/build were not run: Node/npm are discoverable at `/Users/soulcloude/.local/bin` but not the shell PATH; installed Node versions observed were v20.20.1 and v22.23.2. `cargo test --locked` failed before compilation because sandbox denied creating `target` under Downloads. Thus claims in docs are not current test evidence. |
| Safety boundary (20) | MCP tools are read-only; local app states approvals have no cloud effect; substantial safety documentation. | Show tool approval live; label app fixture separately; handle AWS pagination or prominently expose coverage; avoid broad `@all` approval unless intentional. |
| Valuable delegated task (15) | Cloud cost review is a plausible real chore. | The fixture scanner is not connected to live AWS evidence; live connector cannot support its utilization-dependent rules, so present as evidence gathering and follow-up prioritization, not savings discovery. |
| Demo clarity (10) | Multiple docs and a visible interface. | Current user journey jumps from Nimbus to the separate TrueForge UI. Prepare a tight scenario and architecture walkthrough. |

## Recommended path

### For the current event

- Do not present the archived app as code built during the event.
- Use its docs as prior research only if the organizer permits that; ask organizers how prebuilt app, code, and assets must be treated.
- If the team has a valid registration/shortlist and is still within the event rules, build a clearly new event-day project. Do not copy files or quietly relabel prior implementation.
- Current local time evidence from the prior turn was 10:59 IST, while the published event schedule has submissions at 19:00 IST and demos at 19:30 IST. Re-check live organizer status before assuming submission is still open.

### For a future permitted continuation

Evolve Nimbus into a single honest workflow:

1. TrueForge calls the read-only AWS MCP tools and displays account, region, timestamp, first-page coverage, and precise missing fields.
2. TrueForge runs an actual sandbox task, such as validating a normalized inventory or generating and checking a review report from the live tool output.
3. Nimbus UI receives the same session/report state through the documented SDK/API instead of implying its local fixture is the live scan.
4. The agent produces review leads and follow-up evidence questions; never infer idle resources from inventory-only fields or service-level totals.
5. Only add a narrow, reversible external write after designing the exact user approval boundary. Keep any cleanup/destructive AWS action out of scope until authorization, completeness, ownership, dependencies, backups, undo, and policy are established.

## Verification performed and limits

- Read the handoff README, feature inventory, research, safety and setup docs, agent JSON, package manifest, TypeScript AWS reader/MCP server, installer/verifier/smoke scripts, selected React UI paths, and test sources.
- Confirmed with source code that the MCP exposes two tools and invokes read-only AWS SDK commands. Confirmed the app's local decision state is separate from AWS actions.
- Did not invoke AWS, TrueForge, the agent installer, or any handoff runtime script; the files may contain credentials/config dependencies, and no operational run was needed for this assessment.
- `npm test`, `npm run typecheck`, and `npm run build` were not successfully executed; the initial `npm` invocation could not resolve `npm` because PATH lacked Node/npm. A Rust test attempt was denied by filesystem sandbox at `target` creation. No test status should be inferred.
- This current writable project has only research/README material; it does not contain the Nimbus app or a functioning TrueForge project.

## Sources

- [Official event page and rules/rubric](https://www.truefoundry.com/truefoundry-hackathon)
- [TrueForge create-agent guide and API spec](https://trueforge.dev/create-agent/overview)
- [TrueForge MCP connectors](https://trueforge.dev/mcp-servers)
- [TrueForge sandbox model](https://trueforge.dev/sandbox)
- [TrueForge quickstart](https://trueforge.dev/quickstart)

