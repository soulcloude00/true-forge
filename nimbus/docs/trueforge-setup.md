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

The Streamable HTTP endpoint is `http://127.0.0.1:8792/mcp`. It exposes three tools: `inspect_aws_inventory`, `read_monthly_service_cost`, and `mark_volume_for_review`. Inventory and Cost Explorer calls paginate up to 20 pages and report when that cap truncates coverage. Cost Explorer output is service-level billing data, not resource-level cost attribution. AWS reads require STS identity, EC2/ELB describe, and Cost Explorer read permissions. The optional tag call additionally requires EC2 `CreateTags`.

Start TrueForge in a second terminal, keeping its local no-login server on loopback:

```sh
OUTBOUND_URL_ALLOWED_HOSTS='["127.0.0.1"]' npx @truefoundry/trueforge@0.2.1
```

The outbound URL guard stays enabled; the local MCP address is the only added host. Open `http://localhost:8790`, configure a model provider under **Settings → Models**, and enter its key only in TrueForge's local UI. Then add `http://127.0.0.1:8792/mcp` under **Settings → Connectors** as `nimbus-aws-review`. Verify all three tools are present.

## Configure and run the agent

The checked-in `trueforge-agent-spec.json` and installer configure `nimbus-cost-agent`. After a provider/model is configured:

```sh
npm run agent:install -- provider/model-name
npm run verify:setup
```

The agent enables the two evidence tools and `mark_volume_for_review`. In TrueForge's agent configuration, `Require approval` must be on for `mark_volume_for_review`; leave it off for the two read tools. The installer reads the created agent back through the API and fails verification unless all three tools and the approval selector are present. Confirm the tool list and approval setting in the saved agent before a live turn. The MCP smoke command only checks the MCP tool list; MCP annotations do not enforce or prove TrueForge's agent approval gate.

In a genuine run, request a live evidence report and sandbox validation first. Only propose the fixed `nimbus:review-state=candidate-for-human-review` tag when specifically asked. The tool independently verifies the expected account, region, exact volume ID, and current available/unattached state; it refuses to overwrite a different tag value. TrueForge must show the exact tool call and wait for a person. Rejecting must stop the action. The tag marks a review candidate only; it does not authorize cleanup.

Run `npm run dev` for the Nimbus interface on the same laptop. The Agent view connects to the local TrueForge API with the official TypeScript SDK, streams harness events, and renders the pending approval for an explicit decision. The Live Evidence panel calls only the read tools. The separate scanner/report may use synthetic data or pasted local JSON; it is not a live AWS scan.

## Known limits

- Current local browser setup has the connector and three tools configured, and the approval checkbox is on for the tag tool. A model provider is not configured yet, so the agent has not been saved or run.
- Sandbox is enabled in the agent draft, but actual isolated execution remains unverified until a provider is configured and a live sandbox event is observed.
- Never expose local TrueForge without authentication to the public internet. A publicly hosted Nimbus preview cannot access a user's loopback TrueForge or MCP services.
- Sources: [TrueForge quickstart](https://trueforge.dev/quickstart), [SDK quickstart](https://trueforge.dev/api/quickstart), [SDK session and approval flow](https://trueforge.dev/api/use-agent), [sandbox requirements](https://trueforge.dev/sandbox), and [TrueForge API docs](http://localhost:8790/api/v1/docs) when the local server is running.
