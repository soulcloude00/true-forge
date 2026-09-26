# Nimbus cost-review product research — September 26, 2026

Cloud cost work is recurring: teams need cost allocation, context-rich recommendations, budgets, anomaly detection, review workflows, and safe action boundaries. Nimbus's live path gathers paginated AWS inventory, hourly EC2 CPU/network metrics, and service-level Cost Explorer totals on demand through TrueForge. It does **not** continuously monitor, retain an independent baseline, detect anomalies, or alert; the synthetic scanner cannot stand in for a bill or connected-account telemetry. Resource-level Cost Explorer access is currently disabled for the connected payer account, so per-resource costs cannot be attributed from those service totals.

## Product direction

The immediate product is a **human-operated evidence review**. A reviewer requests live evidence; the agent labels scope and gaps, validates the response, and prioritizes what to investigate. It may add one fixed review marker to an exact unattached EBS volume after rechecking account/state and pausing for TrueForge approval. It must not claim savings or safe deletion from inventory state or service totals.

The implemented next phase is an opt-in native TrueForge schedule: run read-only collection daily, retain each dated run as a TrueForge session, compare recent daily service totals, and surface identity/coverage/freshness limits. Future work should add a durable baseline store and evidence-linked alert delivery. Establish baseline and anomaly quality before recommending actions. Keep writes separate, explicitly requested, freshly revalidated, and individually approved; never run unattended cleanup.

| Priority | Capability | Current status / boundary |
|---|---|---|
| 1 | Evidence gathering | Implemented on demand via AWS STS, EC2, ELB, CloudWatch, and Cost Explorer MCP tools; paginated up to 20 pages with truncation reported. CloudWatch activity is available for up to 100 EC2 instances over 14 complete UTC days. |
| 2 | Review leads | Existing local TypeScript rules still run on synthetic or pasted AWS-shaped data. Live CPU/network evidence is shown in the separate account report and is not yet wired into the scanner's candidate rules. |
| 3 | Service cost comparison | One-month service-grouped Cost Explorer read; account/service totals are not per-resource attribution. |
| 4 | Approval-gated marker | One fixed EBS review tag after exact account/region/resource/state checks and TrueForge approval. No destructive tool. |
| 5 | Recurring monitoring | Opt-in native TrueForge schedule is implemented: daily agent session, configured-region inventory, and trailing daily account/service cost review. No independent baseline store, every-region sweep, or external alert delivery yet; the schedule is inactive until explicitly enabled in TrueForge. |
| 6 | Remediation | No automatic optimization. Any later write needs a separate action-specific safety case and person approval. |

## External product-pattern sources

These sources show category patterns, not Nimbus features or independent endorsements: IBM/Kubecost allocation dashboards (<https://www.ibm.com/docs/en/kubecost/self-hosted/3.x?topic=ui-allocations-dashboard>), Infracost policies and guardrails (<https://www.infracost.io/docs/infracost_cloud/finops_policies/> and <https://www.infracost.io/docs/infracost_cloud/guardrails/>), Vantage budgets (<https://docs.vantage.sh/budgets>), CloudZero anomaly detection (<https://docs.cloudzero.com/docs/anomaly-detection>), AWS Cost Management rightsizing and anomaly detection (<https://docs.aws.amazon.com/cost-management/latest/userguide/ce-rightsizing.html> and <https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html>), and Spot ECO reports (<https://spot.io/product/eco-reports/>).

## TrueForge hackathon iteration — 2026-09-26

Round 1 established a real TrueForge run baseline and uncovered an unresolved identity mismatch: Nimbus saw zero EC2 instances while the prior AWS Core inspection found one instance in `us-east-1`. The Round 2 live run reduced observed TrueForge trace calls from 11 to 3 and Nimbus AWS reads from 3 to 1. AWS Core and local Nimbus are authenticated to different AWS accounts, so Nimbus must not make account-complete claims until its identity is aligned. See the [Round 1 baseline](../benchmarks/rounds/2026-09-26-round-1.md) and [Round 2 live evaluation](../benchmarks/rounds/2026-09-26-round-2-live.md).

The first improvement round reuses the Apache-2.0 AWS Agent Toolkit for AWS billing skill by reference and adds Nimbus's own reusable TrueForge Git skill, structured MCP output contracts, a single-call evidence bundle, and deterministic service/day aggregation. The upstream implementation details, compatibility limits, auth boundary, and citations are documented in [`research/aws-agent-toolkit-reuse-and-trueforge-fit-2026-09-26.md`](../../research/aws-agent-toolkit-reuse-and-trueforge-fit-2026-09-26.md). The AWS toolkit plugin is source-available; its AWS MCP Server target is managed, not itself the open-source implementation.

Benchmarks are mandatory for each iteration: [`benchmarks/README.md`](../benchmarks/README.md) defines the repeatable live-run and local microbenchmark protocol. The current local microbenchmark measures only deterministic aggregation, not end-to-end model/AWS performance. A real Round 2 TrueForge run is still required before claiming reduced runtime/tool calls. We will compare repeated runs and keep data source, model, identity, and date window fixed.

Beyond MCP access, Nimbus contributes identity/scope reconciliation, bounded evidence collection, deterministic analysis, a dated evidence report in the TrueForge sandbox, freshness/coverage qualification, repeatable evaluation, and human follow-up. Future rounds should add a persistent baseline and calibrated anomaly triage only after current identity parity and evaluation quality are resolved; leave external notifications and AWS remediation off until their permissions and reliability are measured.

Round 2 local benchmark result: the exact production aggregation routine passed three 1,000-iteration runs; median-of-medians was 0.0059 ms on the 42-row fixture. See [`benchmarks/rounds/2026-09-26-round-2-local.md`](../benchmarks/rounds/2026-09-26-round-2-local.md). This is not an end-to-end comparison and does not establish a speedup.
