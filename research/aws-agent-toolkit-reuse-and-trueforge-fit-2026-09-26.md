# AWS Agent Toolkit reuse and TrueForge integration assessment

**Checked:** 26 September 2026 (Asia/Kolkata)
**Scope:** First-party AWS repositories/docs plus this project's checked-in TrueForge 0.2.1 OpenAPI snapshot. This is a technical fit assessment, not an executed integration or legal opinion.

## Decision

Reuse selected **AWS Agent Toolkit for AWS** source materials—especially `aws-core`'s billing/cost-management skill and its linked references—as guidance for Nimbus. Do not describe the toolkit's plugin as an AWS API implementation: the toolkit plugin/configuration and skills are open-source, while the AWS MCP Server it configures is a managed AWS service. Keep Nimbus's own domain tools, evidence model, safety checks, and benchmark harness as the product contribution.

For AWS access from TrueForge, first assess whether TrueForge's existing OAuth Dynamic Client Registration (DCR) connector can complete the AWS MCP Server OAuth 2.1 flow. The checked local TrueForge API advertises DCR and static-header auth for remote MCP connectors. AWS advertises OAuth 2.1 with MCP discovery, PKCE for interactive clients, and a client-credentials flow for agent applications. **Protocol overlap makes direct connection plausible, not proven.** Verify discovery, browser callback, scopes/permissions, token renewal, and actual tool invocation with read-only credentials before replacing Nimbus's current connection. If TrueForge cannot do this flow, its checked-in remote connector API does not show a local stdio/process transport for running AWS's SigV4 proxy; a separately hosted, authenticated HTTP bridge would be needed and must be designed before use.

## What is open source, and what is managed

| Component | What AWS publishes | License / operating model | Nimbus use |
|---|---|---|---|
| Agent Toolkit for AWS (`aws/agent-toolkit-for-aws`) | Plugins including `aws-core`, skills, rules, setup instructions, and MCP client configuration | Repository states Apache-2.0. Open-source files can be reused subject to that license and notices. | Adopt selectively: billing/cost-management skill and relevant deterministic-calculation/cost-audit references. Keep provenance and license notices if copying files. Prefer a small, reviewed subset over importing a whole broad plugin. |
| `aws-core` plugin | A plugin package that bundles AWS MCP Server connection configuration and core AWS skills (billing, IAM, SDKs, observability, infrastructure, etc.) | Included in the Apache-2.0 toolkit repo. Plugins are listed by AWS as currently supported on Claude Code, Codex, and Cursor. | TrueForge does not appear in the listed first-party plugin-install targets. Reuse compatible skill content; do not assume Codex's plugin loader or plugin manifest runs in TrueForge. |
| AWS MCP Server | AWS-hosted MCP endpoint for AWS API calls, script execution, and documentation lookup | Managed service, not the source code in the Agent Toolkit repo. AWS controls its operations; calls use caller IAM authorization. | Candidate AWS access path if TrueForge's remote OAuth client is compatible. AWS says every request is subject to the existing IAM permissions. |
| MCP Proxy for AWS (`aws/mcp-proxy-for-aws`) | Open-source Python proxy/library that signs calls to AWS IAM-protected MCP endpoints with SigV4 credentials | Repository identifies Apache-2.0. It runs client-side and uses local AWS credentials. | Useful only if Nimbus/TrueForge can launch a local stdio MCP process or we deliberately run a hardened HTTP bridge. Checked TrueForge remote connector schema is URL-based and offers no process command field. |
| Older AWS Labs MCP servers | Separate open-source server implementations | Multiple repositories/licenses and lifecycle states; inspect each repo individually before copying. AWS identifies the Agent Toolkit as the successor and recommends migrating to the managed AWS MCP Server. | Do not default to `core-mcp-server` or legacy Cost Explorer MCP just because they are source-available. They add maintenance/tool surface and are not AWS's recommended successor path. |

## Cost-management guidance worth adapting

AWS's published billing skill routes common questions to authoritative data sources: Cost Explorer for spend/trends, Price List API for service pricing, Cost Optimization Hub for opportunities, Compute Optimizer for specific rightsizing recommendations, Budgets for alerts, Free Tier API for free-tier tracking, and CUR 2.0 plus Athena for detailed billing analysis. It explicitly recommends deterministic calculations and, where available, sandboxed `run_script` for multi-step analysis.

For Nimbus, this suggests an evidence-first workflow beyond “call MCP”:

1. Establish identity, account, region, time window, and data freshness before interpreting values.
2. Use bounded, purpose-built read operations and record coverage, pagination, missing metrics, and access errors.
3. Keep account/service costs separate from resource-level attribution. Do not infer per-instance cost from service totals.
4. Run aggregation and comparisons deterministically in the configured isolated sandbox; ask the model to explain the computed evidence, not invent the arithmetic.
5. Present recommendations as investigation leads with missing evidence and confidence. Require a person for any action that changes AWS.

The current Nimbus reads (inventory/EC2 plus CloudWatch utilization and Cost Explorer service totals) complement AWS's sources but do not implement its full set of data sources. In particular, do not claim rightsizing recommendations without Compute Optimizer evidence, per-resource costs without enabled and authorized resource-level data, or continuous anomaly detection without a defined baseline/monitor and schedule.

Cost Explorer is a billable read surface: AWS's current documentation says each paginated API request costs $0.01, with current-month data taking about 24 hours to prepare and updates at least daily. Keep date ranges and page counts constrained, and disclose this cost when relevant. This may be experience-specific; validate against the connected account's billing experience before encoding as a universal promise.

## TrueForge connector and auth fit (local v0.2.1 snapshot)

The checked-in TrueForge OpenAPI snapshot at `research/snapshots/trueforge-openapi-0.2.1.json` declares:

- Remote MCP connector manifest: `type`, `name`, `url`, description, and optional auth.
- Auth variants: static HTTP headers (`header`) or OAuth Dynamic Client Registration (`dcr`). It does not declare a generic client-credentials secret/token configuration or a local command/stdio server transport.
- Per-connector `enable_tools` supports literal names and `@read-only`; `disable_tools` can subtract tools; `preload_tools` controls eager loading; `require_approval_for_tools` can require approval by literal tool name or classes such as `@write`/`@destructive`.
- TrueForge's current live API version was audited as 0.2.1; do not assume fields from newer public docs apply until the installed server is upgraded.

AWS MCP Server docs list a regional HTTPS Streamable HTTP endpoint and support two auth paths:

- **OAuth 2.1:** interactive authorization-code/PKCE for desktop clients; AWS docs also describe client credentials for automated agents that can obtain a short-lived OAuth token using their AWS credentials. Human OAuth tokens expire after an hour and AWS Sign-In refreshes for up to 12 hours; client-credentials access tokens expire after an hour and have no refresh token. Whether TrueForge's DCR auth implements the specific discovery/callback/token lifecycle AWS expects must be tested.
- **SigV4:** AWS's MCP Proxy signs calls on the client side and is the documented option for CLI/IDE workflows and multi-profile switching. The published `aws-core` plugin config invokes a local `uvx` command, which is not the same thing as a remote URL connector. The checked TrueForge 0.2.1 remote schema cannot express that command.

### Integration decision sequence

1. Inspect the AWS MCP Server's current tool catalog and auth discovery metadata without making AWS writes.
2. In a disposable/test connector configuration, attempt TrueForge DCR against the AWS endpoint. Confirm that TrueForge completes the actual consent/callback flow, retains/refreshes tokens, and can make an authenticated read call. Do not place bearer tokens in saved static headers or prompts.
3. If direct OAuth is incompatible, stop and choose between (a) extending TrueForge's supported connector/auth implementation, (b) running the AWS proxy behind a deliberately designed, authenticated HTTP-to-stdio bridge, or (c) keeping the existing narrow Nimbus MCP service. Do not expose a local unauthenticated bridge to the internet.
4. Only after transport/auth works, test least-privilege policy behavior and compare the resulting evidence against AWS Core's established read path.

## Read-only least-privilege design

AWS documents that the managed AWS MCP Server does not create a separate authorization model: downstream services authorize requests using the caller's IAM permissions. AWS adds `aws:ViaAWSMCPService` and `aws:CalledViaAWSMCP` condition context keys. Its official examples show using them to constrain or deny MCP-initiated actions. For Nimbus:

- Prefer a dedicated read-only role/profile for the review. Scope it to required reads only (for the current paths: STS identity, EC2/ELB describe, CloudWatch `GetMetricData`, and Cost Explorer read actions); do not grant tag/stop/delete permissions to the scheduled reviewer.
- Where the identity's normal use needs broader permissions, consider an explicit deny for writes when `aws:ViaAWSMCPService` is true or narrowly constrain actions for the AWS MCP principal. Validate service/action coverage; one sample policy should not be copied as a complete production policy.
- Keep write-capable tools disabled for a read-only agent, as a second layer. Tool filtering is not a substitute for IAM denial.
- Keep TrueForge's human approval for any separately enabled write tool. Approval is a product/runtime gate; IAM remains the enforcement boundary.
- Audit CloudTrail and AWS MCP CloudWatch signals where available, but do not claim their configuration/retention without verifying it in the account.

## Reuse and attribution checklist

- Record the upstream repository, source path, checked revision, retrieval date, and Apache-2.0 license/NOTICE when vendoring or materially adapting source files.
- Preserve copyright, license, and NOTICE text required by Apache-2.0. Mark changed files as modified.
- Distinguish copied AWS-authored guidance from Nimbus-authored prompts, tool code, and evaluation cases.
- Re-check the upstream files periodically; skills and operational AWS APIs change.
- Avoid representing Nimbus as an AWS product or claiming AWS endorsement.

## First-party sources

1. AWS, [Agent Toolkit for AWS repository](https://github.com/aws/agent-toolkit-for-aws) — component inventory, supported plugin targets, Apache-2.0 statement, and toolkit/AWS Labs relationship.
2. AWS, [`aws-core` MCP configuration](https://github.com/aws/agent-toolkit-for-aws/blob/main/plugins/aws-core/.mcp.json) — published plugin uses `uvx` plus MCP Proxy for AWS to connect to the managed service.
3. AWS, [AWS billing and cost-management skill](https://github.com/aws/agent-toolkit-for-aws/blob/main/skills/core-skills/aws-billing-and-cost-management/SKILL.md) — cost-data-source routing and workflow.
4. AWS, [Agent Toolkit setup for AWS MCP Server](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/getting-started-aws-mcp-server.html) — endpoint, OAuth and SigV4 setup.
5. AWS, [OAuth 2.1 authentication for AWS MCP Server](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/oauth-authentication.html) — PKCE and programmatic client-credentials flow/token properties.
6. AWS, [How AWS MCP Server works with IAM](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/security_iam_service-with-iam.html) — forwarding model and IAM context keys.
7. AWS, [identity-based policy examples for AWS MCP Server](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/security_iam_id-based-policy-examples.html) — MCP-scoped restrictions and denials.
8. AWS, [MCP Proxy for AWS repository](https://github.com/aws/mcp-proxy-for-aws) — SigV4 proxy/library purpose, use, and setup.
9. AWS, [AWS MCP Server quotas and authentication requirements](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/aws-mcp-limits.html) — authenticated versus unauthenticated tool access.
10. AWS, [Using the AWS Cost Explorer API](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-api.html) and [Cost Explorer considerations](https://docs.aws.amazon.com/cost-management/latest/userguide/bcm-lite-cost-explorer.html) — API use, charges, preparation/freshness.
11. Project snapshot, [`trueforge-openapi-0.2.1.json`](snapshots/trueforge-openapi-0.2.1.json) — installed connector auth/transport/tool-filter schema inspected 26 September 2026.
