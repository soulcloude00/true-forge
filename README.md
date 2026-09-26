# Nimbus — AWS cost review on TrueForge

Nimbus is an AWS cost-review agent designed to gather inventory and service-level cost evidence, validate a bounded report in TrueForge's sandbox, and prepare a human review. Its local OpenAI model, agent, connector, tools, and approval selector are configured, but no TrueForge sandbox provider is configured yet, so a live sandbox run is not verified. If explicitly asked, it can add one fixed review tag to an unattached EBS volume after TrueForge presents the exact tool call and receives human approval. It cannot delete or stop resources.

## Project provenance and event rules

This repository contains a pre-event Nimbus prototype copied from the supplied handoff, plus TrueForge/AWS integration work made on September 26, 2026. The official Agents That Act rules say pre-built projects are not eligible and code must be built on the day. This repo does not claim eligibility or conceal the prototype's origin; ask the organizers whether this degree of reuse is permitted before submitting. AI assistants are allowed, but the team must disclose them and explain the architecture.

## What is implemented

- The React app's original scanner uses synthetic or locally pasted JSON and labels those results as estimates, not live account findings.
- A separate local MCP server reads AWS STS, EC2, ELB, and Cost Explorer data. Inventory pagination is capped at 20 pages per service and reports truncation. Cost Explorer is also paginated with an explicit cap.
- TrueForge's saved `nimbus-cost-agent` uses `openai/gpt-6-luna`, enables three read tools and the bounded `mark_volume_for_review` tool, and requires approval for that exact write. An opt-in TrueForge schedule can run a read-only review daily at 09:00 Asia/Kolkata; it is not active by default. The tag tool checks the current AWS account, region, volume ID, and unattached/available state, then adds only `nimbus:review-state=candidate-for-human-review`. A pre-existing different value is not overwritten. The agent has no delete, stop, or snapshot tool.
- The Nimbus Agent panel is wired to start a session with the saved TrueForge agent through the TypeScript SDK, render streamed harness events, and let a person allow or reject a pending approval. Its evidence checklist only marks MCP and sandbox work observed when matching session events arrive. No completed model session or sandbox event has been verified yet. The Live Evidence panel calls the read-only MCP tools for direct review.

The OpenAI provider and `gpt-6-luna` model are configured in the current local TrueForge instance. The saved agent uses `reasoning_effort=none`, which OpenAI documents as required for GPT-6 Luna function calls through Chat Completions. This proves the saved configuration, not a successful model/API turn. The sandbox provider is still missing, so actual isolated code execution has not yet been demonstrated. Add provider credentials only in TrueForge's local UI; never put them in this repository or the Nimbus app.

## Local setup

Requirements: Node.js 22.14 or newer. Keep both local services on loopback. TrueForge standalone mode has no login by default. Its outbound URL guard blocks loopback MCP targets unless you explicitly allow the Nimbus MCP host; the command below keeps the guard enabled and allowlists only `127.0.0.1`.

Terminal 1, start Nimbus's local MCP service:

```sh
cd nimbus
npm ci
npm run mcp
```

Terminal 2, start TrueForge with its outbound guard enabled and loopback MCP exception:

```sh
cd nimbus
NETWORK_POLICY_ENABLED=true OUTBOUND_URL_ALLOWED_HOSTS='["127.0.0.1"]' npx @truefoundry/trueforge@0.2.1
```

Open <http://localhost:8790>. Under **Settings → Models**, configure a provider and select a model. Under **Settings → Connectors**, connect the local Nimbus server at `http://127.0.0.1:8792/mcp` as `nimbus-aws-review`. When building the agent, enable the three read tools; enable `mark_volume_for_review` only with **Require approval** on. The checked-in manifest and installer preserve and read back those settings:

```sh
npm run agent:install -- openai/gpt-6-luna
npm run verify:setup
```

After verifying the agent and connector, `npm run monitor:enable` opts into a daily scheduled TrueForge run at 09:00 Asia/Kolkata. Each run reads inventory from the configured AWS region plus the last 14 complete UTC days of account-level service costs and creates a TrueForge session/report. It does not send external alerts or mutate AWS; pause it with `npm run monitor:pause`. Runs make model calls and AWS reads and may incur provider charges.

Use the actual configured provider/model name in the installer command. AWS credentials stay in the local AWS credential chain. The read tools need STS identity, EC2 describe, ELB describe, and Cost Explorer read permissions. The optional review-tag tool additionally needs `ec2:CreateTags`. Use a dedicated demo account with no production resources.

Terminal 3, run the Nimbus web app:

```sh
cd nimbus
npm run dev
```

Open the Vite URL printed by the command. In **Agent**, start `nimbus-cost-agent`; the direct SDK event stream shows TrueForge's MCP and sandbox activity. A tag proposal pauses in Nimbus for an explicit TrueForge approval decision. **Account evidence** is a separate direct read-only display. Neither path treats the synthetic scanner fixture as current AWS evidence.

## Demo, limitations, and research

Use [`nimbus/docs/demo-script.md`](nimbus/docs/demo-script.md) for the five-minute walkthrough and [`nimbus/docs/safety.md`](nimbus/docs/safety.md) for tool boundaries. The live inventory does not contain utilization history, ownership, dependencies, or per-resource costs. Unattached does not mean idle or safe to delete; the tag only requests human review and does not realize savings.

The researched event profile, scoring rubric, eligibility, TrueForge feature survey, API/SDK notes, and source links are in [`research/agents-that-act-trueforge-research.md`](research/agents-that-act-trueforge-research.md). The full docs index and version-matched API operation/schema inventory are captured in [`research/trueforge-docs-api-audit-2026-09-26.md`](research/trueforge-docs-api-audit-2026-09-26.md), with source snapshots in `research/snapshots/`. The original handoff audit is in [`research/nimbus-handoff-assessment.md`](research/nimbus-handoff-assessment.md).

## AI-assistance disclosure

OpenAI Codex and Zed's assistant were used to research, review, and modify this repository. Confirm the complete team disclosure before submitting.
