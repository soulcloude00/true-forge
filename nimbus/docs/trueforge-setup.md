# Nimbus on TrueForge: runbook

Nimbus is a local AWS review agent built to run inside TrueForge. The agent calls a real MCP server, can use TrueForge's sandbox tool to validate returned evidence, and pauses on one narrowly scoped AWS tag action. This folder began as a pre-event handoff prototype; the hackathon page says pre-built projects are not eligible. The event-day integration here does not establish eligibility. Do not claim otherwise; ask the organizers if the handoff code may be used.

## Requirements and local services

- Node.js 22.14 or newer, npm, and a model provider account supported by TrueForge.
- Optional AWS credentials in the local AWS credential chain. Never put keys in the app, repository, prompt, or screenshots.
- For live sandbox isolation, a configured TrueForge sandbox provider. The current official docs list Daytona; enabling the sandbox setting alone does not prove an isolated sandbox is available.
- For the optional tag action, a dedicated demo AWS account and narrowly scoped `ec2:CreateTags` permission. The agent cannot delete, stop, or snapshot resources.

Install dependencies and start Nimbus's MCP server:

```sh
npm ci
npm run mcp
```

The Streamable HTTP endpoint is `http://127.0.0.1:8792/mcp`. It exposes six tools: preferred `collect_cost_review_evidence`, read-only inventory/monthly/daily drill-downs, reversible `mark_volume_for_review`, and the destructive `delete_hackathon_demo_volume`. The latter is disabled by default and can delete only one exact operator-configured disposable target; it requires a dedicated 1 GiB encrypted gp3 volume tagged for the Agents That Act demo, and TrueForge approval. No demo resource is created automatically. The combined tool obtains STS identity, paginated inventory, daily Cost Explorer totals and deterministic comparisons in one structured response. Inventory and Cost Explorer calls paginate up to 20 pages and report truncation. Inventory also asks CloudWatch for hourly CPU, NetworkIn, and NetworkOut over 14 complete UTC days for up to 100 EC2 instances; missing metrics stay unknown. Cost Explorer results are account/service-level, not resource attribution; daily data can lag. AWS reads require STS identity, EC2/ELB describe, CloudWatch `GetMetricData`, and Cost Explorer read permissions. The optional tag call additionally requires EC2 `CreateTags`; the optional demo delete requires EC2 `DeleteVolume` and must be scoped to its single disposable target.

Start TrueForge in a second terminal, keeping its local no-login server on loopback:

```sh
OUTBOUND_URL_ALLOWED_HOSTS='["127.0.0.1"]' npx @truefoundry/trueforge@0.2.1
```

The outbound URL guard stays enabled; the local MCP address is the only added host. Open `http://localhost:8790`, configure a model provider under **Settings → Models**, and enter its key only in TrueForge's local UI. Then add `http://127.0.0.1:8792/mcp` under **Settings → Connectors** as `nimbus-aws-review`. Verify all six tools are present. Keep `NIMBUS_ENABLE_DISPOSABLE_VOLUME_DELETE` unset for normal operation. To enable the demo tool, set it to `true` and configure exactly one `NIMBUS_DISPOSABLE_VOLUME_ACCOUNT_ID`, `NIMBUS_DISPOSABLE_VOLUME_REGION`, and `NIMBUS_DISPOSABLE_VOLUME_ID` for the tagged demo volume. Restart Nimbus MCP after setting these variables. Do not configure a production resource.

## Configure and run the agent

The checked-in `trueforge-agent-spec.json` and installer configure `nimbus-cost-agent` for `openai/gpt-6-luna`. If the OpenAI provider is already configured but the installed TrueForge catalog is older, the installer adds the GPT-6 Luna API model ID to that provider while sending TrueForge's documented redacted-key sentinel, preserving the stored key. OpenAI documents `reasoning_effort: "none"` for GPT-6 Luna function calling through Chat Completions, so the installer sets it on this model. After changing the manifest instructions or tool boundary, use `npm run agent:update` to update and read back the saved agent without replacing its model, tools, or approval selector:

```sh
npm run agent:install -- openai/gpt-6-luna
npm run verify:setup
```

The saved agent enables the combined evidence tool, drill-downs, `mark_volume_for_review`, and `delete_hackathon_demo_volume`; both the Nimbus workflow skill and AWS billing skill are registered as Git-backed skills. In TrueForge's agent configuration, `Require approval` is on for both write tools; it is off for the read tools. The installer/update script reads the saved manifest back and verifies the model, tool allowlist, and approval selectors. The MCP smoke command checks only the MCP tool list; MCP annotations do not enforce or prove TrueForge's agent approval gate. Scheduled prompts prohibit both writes.

## Daily monitoring

The `nimbus-daily-cost-review` schedule is active for 09:00 Asia/Kolkata on the current local TrueForge instance. A read-only check on 2026-09-26 confirmed its next run for 2026-09-27 09:00 IST and no scheduled run history yet. It is configured to call the combined evidence tool once per run, create an inspectable TrueForge session, and record local baseline history by exact account and region. This local history update does not modify AWS resources. Each run may incur model/provider and Cost Explorer charges. The local scheduler and Nimbus MCP server must be running at execution time; there is no every-region sweep or external notification. Pause it with `npm run monitor:pause`.

```sh
npm run monitor:enable
```

This creates or activates `nimbus-daily-cost-review` at 09:00 in `Asia/Kolkata`. Each run uses `collect_cost_review_evidence` for the configured region and recent service costs. It stores a bounded local history snapshot and compares overlapping complete dates; it never changes AWS resources or calls the review-tag write. The baseline file defaults to `~/.nimbus-cost-agent/cost-baselines.json`; set `NIMBUS_COST_BASELINE_FILE` before starting the MCP process to choose a different private local path. Each run may incur model/provider and AWS Cost Explorer charges. This iteration does not inspect every AWS region or send external alerts; inspect the TrueForge sessions for each run.

In a genuine run, request a live evidence report and sandbox validation first. Only propose the fixed `nimbus:review-state=candidate-for-human-review` tag when specifically asked. The tool independently verifies the expected account, region, exact volume ID, and current available/unattached state; it refuses to overwrite a different tag value. TrueForge must show the exact tool call and wait for a person. Rejecting must stop the action. The tag marks a review candidate only; it does not authorize cleanup.

Run `npm run dev` for the Nimbus interface on the same laptop. The Agent view connects to the local TrueForge API with the official TypeScript SDK, streams harness events, and renders the pending approval for an explicit decision. The Live Evidence panel calls only the read tools. The separate scanner/report may use synthetic data or pasted local JSON; it is not a live AWS scan.

## Known limits

- `npm run verify:setup` checks the local TrueForge API, Nimbus MCP endpoint, configured model, connector, saved agent/tool approval gates, and sandbox provider. It exits nonzero while required setup is missing. Current local state was previously verified with GPT-6 Luna, connector, five-tool allowlist, approval selector, Daytona provider, and live sandbox execution; after adding the disposable-volume gate, rerun setup verification and update this status only when the six-tool manifest is confirmed.
- Nimbus's current local AWS credential identity is a root principal and differs from the separate AWS Core connection. The user chose to keep the current Nimbus profile. Reports must be described as scoped to that credential-selected account; use a least-privilege profile before production.
- Never expose local TrueForge without authentication to the public internet. A publicly hosted Nimbus preview cannot access a user's loopback TrueForge or MCP services.
- Sources: [TrueForge quickstart](https://trueforge.dev/quickstart), [SDK quickstart](https://trueforge.dev/api/quickstart), [SDK session and approval flow](https://trueforge.dev/api/use-agent), [sandbox requirements](https://trueforge.dev/sandbox), and [TrueForge API docs](http://localhost:8790/api/v1/docs) when the local server is running.

The Canvas run panel keeps TrueForge-required user actions in the workflow view. On `tool.approval_required` it displays requested tool names and arguments with explicit Allow and Deny controls; on `tool.response_required` it shows the question/options and a reply field. If both are pending together, it collects every response before resuming the paused TrueForge session with the complete input batch. The browser interaction remains for the operator to verify. The same workflow UI updates are in the companion TrueForge source checkout, documented in its `packages/trueforge-ui/docs/workflow-canvas.md`.
