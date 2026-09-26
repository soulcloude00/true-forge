# Nimbus - TrueForge cloud-cost review

Nimbus is an AWS cost-review agent running inside TrueForge. One structured MCP call gathers inventory, hourly EC2 activity, service-level Cost Explorer data, deterministic comparisons, and a persistent local baseline keyed to the credential-selected account and region. The evidence tool records local history but makes no AWS resource changes. TrueForge's Daytona sandbox loads the Nimbus workflow and AWS billing skills and produces a dated report. The daily native TrueForge schedule uses that same harness tool, so recurring runs appear in TrueForge sessions and advance the baseline. The local Nimbus identity is separate from AWS Core. The manual write tools are a reversible human-review tag and an opt-in destructive action scoped in code to one operator-configured, tagged 1 GiB encrypted gp3 demo volume. The destructive tool is disabled by default, requires TrueForge approval, and is never available to scheduled-task instructions. It is not a general cloud cleanup action. Service totals are not resource costs. The bundled scanner remains a separate local tool over **synthetic AWS-shaped inventory** or locally pasted JSON.

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

TrueForge is the primary agent and demo UI. The separate Nimbus scanner is local synthetic/pasted-data UX. The `nimbus-aws-review` MCP connector exposes one preferred combined evidence tool, three read-only drill-down tools, and one approval-gated review-tag write. See [`docs/trueforge-setup.md`](docs/trueforge-setup.md) for setup. The saved `nimbus-cost-agent` is configured for `openai/gpt-6-luna` with reasoning effort `none`; its Git-backed Nimbus and AWS billing skills are registered in TrueForge, and a Daytona sandbox has been verified in a live TrueForge session. Use `npm run agent:update` to apply checked-in instructions/tool selections to the existing saved agent.

## Monitoring plan

Cloud cost visibility is configured through the active `nimbus-daily-cost-review` TrueForge schedule at 09:00 Asia/Kolkata. Its next run is scheduled for 2026-09-27 09:00 IST; no scheduled run has completed yet. Each run uses the selected local AWS profile and one harness evidence call, creating an inspectable TrueForge session and updating a local account/region baseline. It may incur model/provider and Cost Explorer charges. Pause it with `npm run monitor:pause`. It runs only while the local TrueForge scheduler and Nimbus MCP server are available; it does not inspect every region, send external alerts, or perform AWS cleanup. Local history is stored at `~/.nimbus-cost-agent/cost-baselines.json` by default (override with `NIMBUS_COST_BASELINE_FILE`); each exact account/region scope retains up to 90 snapshots and the file retains at most 1,000 snapshots globally, whichever limit is reached first.

The MCP server exposes six tools: three AWS evidence readers, one combined AWS evidence/local-baseline tool, the human-approved review-tag action, and the optional demo-volume deletion tool. The combined tool returns STS identity, paginated inventory, 14-day utilization coverage, recent daily service rows, deterministic comparisons, and changes over overlapping complete dates from the prior local snapshot. Cost Explorer data can lag and its totals are not per-resource attribution. The review tag only adds `nimbus:review-state=candidate-for-human-review`; it is reversible. The separate deletion tool requires a fixed target allowlist and exact disposable tags, rechecks account/region/ID/state/encryption/type/size immediately before `DeleteVolume`, and has a TrueForge approval requirement. It has not been live-enabled or demonstrated; keep the browser's “Approve for plan” understood as local review state only.

Previously verified local setup included OpenAI/GPT-6 Luna, the MCP connector and five-tool allowlist, both Git skills, Daytona, and a successful live TrueForge report after one combined evidence call. The current source now adds a sixth tool and a second approval selector; the saved TrueForge agent and connector must be updated and read back before claiming the new gate is live. AWS Core and the local Nimbus profile point at different AWS accounts; the user chose to keep Nimbus on the current local profile. The prior verified session applies only to that credential-selected account. The schedule was active for 09:00 Asia/Kolkata; a read-only inspection on 2026-09-26 confirmed the next run for 2026-09-27 09:00 IST, with no scheduled run/session history at inspection time.

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

The account ID is a synthetic `000000000000` and IPv4 address is a documentation-only address. The fixture's timestamps, resource IDs, rates and metrics are invented for this demo. Prices omit transfer, discounts, taxes and many AWS pricing dimensions; snapshot cost is especially simplistic because real snapshots store changed blocks. Potential waste is not realized savings. A snapshot with no matching current source volume may be a critical backup. A low-use EC2 instance might be intentionally idle. A zero-candidate result proves only that these five rules did not flag the supplied inventory; it does not prove zero waste. A user may paste an AWS-shaped JSON inventory locally; its data is unverified and is not sent to any server or imported from AWS directly. The separate local MCP connector reads live inventory, 14 days of hourly EC2 CPU/network metrics, and monthly/daily service-level costs, but does not feed those AWS records into the browser scanner or authorize any AWS resource change. Its inventory pagination is capped at 20 pages per service and reports truncation explicitly. Live history is bounded local JSON, not a backup or shared database. There is no resource-level cost attribution, calibrated anomaly detection, Kubernetes allocation, IaC pull-request integration, automated remediation or multi-user persistence.

The TypeScript path is the working product. Rust experiments are reserved for a later separate PR and are not part of this handoff. The existing personal draft PR has not been merged or deployed; this zip can be committed by its owner separately.
