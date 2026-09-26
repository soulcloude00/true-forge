# Nimbus - TrueForge cloud-cost review

Nimbus is an AWS cost review app with a local TrueForge agent integration. Its default collection is **on demand**: an operator asks the agent to inspect current AWS inventory, hourly EC2 CPU/network activity, and costs. An opt-in native TrueForge schedule can run that read-only review daily at 09:00 Asia/Kolkata; it is not activated in the current local instance. The scheduled run reads inventory in the configured AWS region and 14 days of account-level daily service costs, then creates a TrueForge session/report. It does not send external alerts or make AWS changes. The bundled React/TypeScript scanner runs over built-in **synthetic AWS-shaped inventory** or locally pasted JSON. Separately, a local MCP server reads live AWS inventory, CloudWatch EC2 metrics, and service-level costs. The TrueForge agent can add one fixed review tag to a currently unattached EBS volume after human approval; it has no delete, stop, or snapshot tool. Synthetic scanner output is not a connected account report.

## Start

Node.js 22.14 or later:

```bash
npm ci
npm run dev
npm test
npm run build
```

Open the local URL Vite prints. `?view=setup` and `?view=dashboard` open local QA views. The stable hosted preview is https://files.instinct.com/file-01M3D0SKBAK6B443293SPK6ME7; it is a separate published File, not a deployment from this archive.

## TrueForge live-agent path

The browser scanner and live agent are clearly distinguished: scanner estimates use synthetic or locally pasted data, while the local `nimbus-aws-review` MCP server reads live inventory, hourly EC2 CPU/network metrics, and service-level costs and exposes one fixed review-tag write. Start the MCP server with `npm run mcp`, then configure `http://127.0.0.1:8792/mcp` as a TrueForge connector. Start TrueForge with the outbound URL guard enabled and the loopback MCP host allowlisted; the exact command is in [`docs/trueforge-setup.md`](docs/trueforge-setup.md). Configure OpenAI in TrueForge Settings, then create `nimbus-cost-agent` with `npm run agent:install -- openai/gpt-6-luna`. The installer registers GPT-6 Luna on the existing OpenAI provider if needed while preserving its stored key, and sets `reasoning_effort=none` for Chat Completions tool calls. Nimbus’s Agent view uses the TrueForge TypeScript SDK to create a session, stream actual events, and let the user approve or reject the pending tool call; its Live Evidence panel calls only the read-only MCP tools.

## Monitoring plan

Cloud cost visibility should recur. Nimbus now has an opt-in TrueForge daily schedule definition and provisioning/pause commands, but the user's local TrueForge currently has no model provider or saved agent, so no schedule is active. Enable only after those prerequisites are configured with `npm run monitor:enable`; pause with `npm run monitor:pause`. Each scheduled run uses the configured default AWS region and reads recent account-level daily Cost Explorer data, then saves a TrueForge session. It does not keep a separate baseline database, deliver external alerts, inspect every AWS region, or perform cleanup. Later work can add persistent baselines and evidence-linked alerts. Keep optimization proposals separate from monitoring: any cloud change must be a specific, bounded action with a fresh state check and TrueForge human approval. Do not run unattended cleanup.

The agent can use three read-only AWS tools and one human-approved tag action. The daily-cost tool returns the prior 7–31 complete UTC days and warns that Cost Explorer data can lag. The tag action verifies the expected account and region, rechecks that the volume is available and unattached, refuses to overwrite a different review-state tag, and adds only `nimbus:review-state=candidate-for-human-review`. It cannot delete, stop, or snapshot a resource. The browser's “Approve for plan” remains local review state only. AWS credentials and `ec2:CreateTags` permission are required only for the live tag action.

Current local verification confirms the OpenAI provider and `openai/gpt-6-luna` are configured, and the saved agent uses that model with `reasoning_effort=none`. The TrueForge sandbox provider is still missing, so no real sandbox run has been verified. The Agent page now reports MCP, sandbox, and approval evidence only when matching events are observed in the actual TrueForge session.

## What you can actually do

- Run five conservative scanner rules: old unattached gp3 EBS, unassociated IPv4, low-use t3.medium EC2 with complete 14-day metrics and a matching input rate, unused ALB with complete 14-day requests, and old standard-tier snapshot without a current source volume.
- Choose four synthetic variants: baseline, active resources, incomplete metrics and no-candidate inventory. The latter two show why the scanner excludes questionable idle leads. Compare all four synthetic situations side-by-side and switch to inspect each scan. This is not a live before-and-after forecast.
- Paste a bounded AWS-shaped JSON inventory (up to 1 MB) into the setup field; it is parsed in browser memory, not sent to Nimbus. Download the example JSON on setup for the input shape. The pasted content must match the documented fixture shape including five rate assumptions and matching resource types and 14-day metrics where relevant. The importer rejects duplicate resource IDs and resource timestamps later than the capture time.
- Review each finding with resource ID, rate formula and pricing caveat, evidence, recommendation and risk. For EC2 and ALB leads, inspect the 14 supplied undated metric samples as small evidence strips; these are not live trends or anomaly detection. Approve or deny **for an in-browser plan only**; undo the last decision. The evidence drawer moves keyboard focus inside, closes with Escape, and returns focus to its Inspect control.
- Inspect which rules have enough input fields without treating field coverage as a safety or confidence score. Search, filter by rule-level caution, sort by cost or caution, and inspect the full eight-resource audit including excluded resources and why they were excluded, with search and status filters, next-evidence prompts, and a count of missing-input exclusions; export that complete audit as a formula-safe CSV.
- Explore estimates by resource type, annualized candidate estimates and approved plan estimates; set a sample monthly review target. These are not bills, forecasts, or account budget alerts.
- Add a private review note in the current page and download JSON or CSV reports. The note is included in export but disappears on reload. No decisions are synchronized to another device. A local review JSON can be downloaded and restored against the exact same inventory; keep it private because it includes the full input inventory and review notes.
- Open a review plan that separates approved, denied and open leads, lists manual safety checks, and downloads a Markdown handoff. This is still only a plan.
- Group candidate estimates by an exact imported tag key; missing tags remain in an untagged/unavailable bucket. This is not cloud bill allocation or verified ownership.
- Check input provenance, capture age, undated metrics and zero assumed rates; duplicate resource identifiers are rejected before import. These are local validation hints, not account verification.
- Open an advisory review queue sorted by rule caution and rough estimate, set a local threshold for extra checks on approved items, and self-mark per-finding review prompts. These marks are not verification or cloud-action approval. Set local investigation stages (new, investigating, on hold), with stage filters and counts, separately from approve or deny.
- Scale the five supplied input rates 50–150% in a separate what-if view; the underlying finding cards and decisions remain unchanged. This is not live pricing or a forecast. A separate one-rate what-if shows which individual lead estimates change without altering finding cards or approvals.
- Compare a second local AWS-shaped inventory with the same stated account and region. See newly flagged, no-longer-flagged and shared leads, reconcile estimate differences by category, and call out changed rates or nonchronological inputs. Export a summary JSON without the raw inventories. Different inputs and rate assumptions are not proof of bill changes or realized savings.

## Structure

- `web/Nimbus.tsx`, `web/style.css`, `web/landscape.jpg` - landing, setup, report and resource review UI. Art includes a painted landscape and Nimbus mascot.
- `web/scanner.ts`, `web/fixture.ts`, `web/scenarios.ts`, `web/audit.ts`, `web/plan.ts`, `web/import.ts`, `web/estimate.ts`, `web/coverage.ts` - pure read-only rules, synthetic fixture, variant builder and explanation audit. The site imports these modules directly; top-level `scanner.ts`/`fixture.ts` are the same algorithm and fixture for the CLI/tests.
- `scanner.test.ts` - scanner and scenario safety tests. `demo.ts` - CLI printout.
- `docs/research.md` and `docs/sources.md` - product patterns and primary-source URLs. `docs/safety.md` - limitations and future integration boundary.

## Caveats

The account ID is a synthetic `000000000000` and IPv4 address is a documentation-only address. The fixture's timestamps, resource IDs, rates and metrics are invented for this demo. Prices omit transfer, discounts, taxes and many AWS pricing dimensions; snapshot cost is especially simplistic because real snapshots store changed blocks. Potential waste is not realized savings. A snapshot with no matching current source volume may be a critical backup. A low-use EC2 instance might be intentionally idle. A zero-candidate result proves only that these five rules did not flag the supplied inventory; it does not prove zero waste. A user may paste an AWS-shaped JSON inventory locally; its data is unverified and is not sent to any server or imported from AWS directly. The separate local MCP connector reads live inventory, 14 days of hourly EC2 CPU/network metrics, and monthly/daily service-level costs, but does not feed those AWS records into the browser scanner or authorize any AWS change. Its inventory pagination is capped at 20 pages per service and reports truncation explicitly. There is no resource-level cost attribution, durable live billing baseline, time-series anomaly detection, Kubernetes allocation, IaC pull-request integration, automated remediation or multi-user persistence.

The TypeScript path is the working product. Rust experiments are reserved for a later separate PR and are not part of this handoff. The existing personal draft PR has not been merged or deployed; this zip can be committed by its owner separately.
