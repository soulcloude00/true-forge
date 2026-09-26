# Nimbus — AWS cost review on TrueForge

Nimbus is a cautious AWS evidence-review agent built to run inside TrueForge. It calls a real AWS MCP server, validates the bounded response in a configured TrueForge Daytona sandbox, and returns a dated report with explicit scope and uncertainty. It does not infer savings from billing totals or automatically clean up resources.

## Current verified status — 2026-09-26

- TrueForge v0.2.1 is configured locally with OpenAI GPT-6 Luna (`reasoning_effort=none`), the `nimbus-aws-review` connector, the saved `nimbus-cost-agent`, and Daytona.
- Two successful live TrueForge runs are recorded. Round 1 used three separate AWS evidence reads and produced 11 trace calls. Round 2 used one combined evidence call and produced 3 trace calls. That is one run per version, so the difference is directional, not a stable speed or quality claim.
- A third live rehearsal completed in TrueForge at 11:33:54 UTC on 2026-09-26 (session `01m3eqvw6ant11xnf3081k926f`): one combined AWS evidence call, sandbox provisioned, three sandbox `exec` responses, no AWS writes, and a final report. The full trace also contained discovery/OpenUI/system calls; this one run is not a stable benchmark.
- Nimbus and the separate AWS Core connection resolve to different AWS accounts. The user chose to keep Nimbus on its current local AWS profile. Nimbus results apply only to that credential-selected account; they do not represent the AWS Core account.
- The active TrueForge schedule is configured for 09:00 Asia/Kolkata. Read-only inspection found the next run at 2026-09-27 09:00 IST and no completed scheduled session yet. It needs local TrueForge and the Nimbus MCP server available at run time, and can incur model and Cost Explorer charges.
- The combined evidence tool records a private local baseline, capped at 90 snapshots per account/region and 1,000 globally. The first scheduled cross-run comparison is still unverified.
- The currently running TrueForge endpoint still exposes five tools. Its only configured AWS write is a reversible review tag on one exact eligible EBS volume, gated by TrueForge approval. New local source adds a second, destructive action scoped to one operator-configured, tagged disposable volume, but the running MCP server and saved agent have not loaded that change; it is disabled by default and has not been demonstrated. There is no demonstrated approval-before-irreversible-cleanup flow.
- The TrueForge Workflow Canvas source now supports in-panel approval and question prompts that resume the same session. Its UI package builds and typechecks; browser interaction is left for the operator to verify.
- Nimbus test suite: 54 passing. Typecheck and production build pass. Round 4 repeats local synthetic microbenchmarks in five fresh processes; none of these measurements include AWS, the model, or TrueForge end-to-end latency.

## What Nimbus does

The preferred `collect_cost_review_evidence` MCP tool returns identity, paginated EC2/ELB inventory, hourly CPU/network coverage for at most 100 EC2 instances over 14 complete UTC days, daily Cost Explorer service totals, deterministic summaries, and a local same-account/region baseline comparison. Cost Explorer service totals are not resource-level costs and can be revised or delayed. Missing metrics remain unknown. The local fixture scanner is a separate synthetic or pasted-data preview, not a live account scan.

The other tools provide read-only inventory, monthly service costs, and recent daily service costs. In the live five-tool setup, `mark_volume_for_review` is the only AWS write and requires explicit TrueForge approval. The source tree also contains `delete_hackathon_demo_volume`, but the current live MCP process and saved agent have not been updated to expose it. Scheduled tasks are configured never to call either write.

## Run locally

Use Node.js 22.14 or newer. Keep the local TrueForge and MCP services on loopback; standalone TrueForge has no login by default.

```sh
cp .env.example .env
# Optionally set AWS_PROFILE in .env, then load the values into this shell.
set -a
. ./.env
set +a
cd nimbus
npm ci
npm run mcp
```

In a second terminal:

```sh
cd nimbus
NETWORK_POLICY_ENABLED=true OUTBOUND_URL_ALLOWED_HOSTS='["127.0.0.1"]' npx @truefoundry/trueforge@0.2.1
```

Open `http://localhost:8790`. Configure the model under **Settings → Models** and add `http://127.0.0.1:8792/mcp` under **Settings → Connectors** as `nimbus-aws-review`. The saved agent uses `openai/gpt-6-luna` and the combined evidence call. AWS credentials stay in the local AWS credential chain; model keys stay in TrueForge settings.

Verify the setup and start the local interface as needed:

```sh
npm run verify:setup
npm run dev
```

The schedule is currently active. Pause it with `npm run monitor:pause`; the schedule setup command is `npm run monitor:enable`. Scheduled AWS reads use the current local credential profile, cover one configured region, and may incur charges.

## Research, benchmarks, and demo

- [`research/agents-that-act-trueforge-research.md`](research/agents-that-act-trueforge-research.md): event profile, rules, scoring rubric, and TrueForge product survey.
- [`research/trueforge-docs-api-audit-2026-09-26.md`](research/trueforge-docs-api-audit-2026-09-26.md): full docs index review and versioned API/schema inventory.
- [`research/aws-agent-toolkit-reuse-and-trueforge-fit-2026-09-26.md`](research/aws-agent-toolkit-reuse-and-trueforge-fit-2026-09-26.md): open-source toolkit reuse and compatibility boundaries.
- [`nimbus/benchmarks/README.md`](nimbus/benchmarks/README.md): benchmark protocol and four visuals.
- [`nimbus/docs/recording-run-sheet.md`](nimbus/docs/recording-run-sheet.md): time-coded plan for the required three-minute recording, matched to current live state.
- [`nimbus/docs/demo-script.md`](nimbus/docs/demo-script.md): longer five-minute walkthrough and proof to capture.
- [`nimbus/docs/safety.md`](nimbus/docs/safety.md): AWS, local history, approval, and sandbox boundaries.

The handoff folder contained a substantial pre-event prototype. The hackathon rules say pre-built projects are not eligible; the later TrueForge integration does not establish eligibility. Ask organizers whether this reuse is allowed before submitting. Disclose AI assistance and explain the implementation. No claim is made that Nimbus is eligible, submitted, or a winner.

## AI-assistance disclosure

OpenAI Codex and Zed's assistant were used to research, review, and modify this repository. Confirm the complete team disclosure before submitting.

## Solution write-up (submission, 293 words)

Cloud teams need a trustworthy way to spot cost changes and investigate possible waste without letting an agent delete the wrong resource. Nimbus runs inside TrueForge and reaches the operator’s credential-selected AWS account and configured region through a local MCP server. It reads caller identity, paginated EC2/ELB inventory, hourly EC2 CPU and network metrics, and daily Cost Explorer service totals. One combined evidence tool returns the data, compares complete dates against a private local baseline, and reports gaps rather than guessing.

We also extended the TrueForge harness with a visual workflow canvas: users can arrange and connect Chat, Agent, and MCP nodes, select saved agents and configured connectors, run a prompt, and see execution status. Approval requests and agent questions appear in the workflow view. This makes the orchestration visible and editable inside TrueForge rather than requiring a separate workflow product. The [canvas implementation](https://github.com/soulcloude00/trueforge/tree/codex/workflow-canvas) is in our public TrueForge fork.

TrueForge manages the model session, tool routing, Daytona sandbox, and human approval checkpoint. Nimbus validates evidence in the sandbox and returns a dated report. Scheduled review is read-only; the live agent can add one reversible review tag after approval. A destructive demo tool exists in source but is disabled and not active. Approval before irreversible cleanup has not been demonstrated.

Connected AWS reads are real. Browser-scanner examples and local microbenchmarks are synthetic. In recorded runs, the evidence workflow went from three separate evidence-tool calls to one combined call; one run per version is directional trace evidence, not a stable speed or quality benchmark. Cost Explorer is delayed and service-level; coverage is one region. No resource-level cost, realized savings, or general cleanup safety is claimed. The project extends a pre-event handoff, so eligibility remains unresolved.
