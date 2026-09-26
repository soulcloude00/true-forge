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
