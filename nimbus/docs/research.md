# Nimbus feature research - September 26, 2026

The strongest cost products combine attributed spend, context-rich recommendations, guardrails, budgets, anomaly detection and review workflows. A fixture-only hackathon product cannot truthfully imitate a live bill, Kubernetes allocation, anomaly monitoring or automatic cloud optimization. The useful near-term path is a credible read-only sample scanner, explainable resource-level findings, cost segmentation, explicit review decisions, scoped exports and a safe handoff to future live integration.

| Priority | Pattern | Nimbus implementation boundary |
| --- | --- | --- |
| 1 | Reviewable recommendations | Existing five conservative TS rules, resource evidence, risks and Approve/Deny planning. |
| 2 | Allocation/segmentation | Fixture resource-type breakdown, filtering and searching. Not business-unit or Kubernetes spend allocation. |
| 3 | Budgets/thresholds | Compare candidate waste to a user-entered sample review target. Not an account budget or alert. |
| 4 | Pre-deploy guardrails | Future work; no IaC parsing or CI hookup now. |
| 5 | Anomaly detection | Future work requiring time-series billing history. No synthetic anomaly claim. |
| 6 | Optimization automation | Future work requiring authenticated live scope, safeguards and per-action approval. No deletion or account calls. |

Sources: IBM/Kubecost https://www.ibm.com/docs/en/kubecost/self-hosted/3.x?topic=ui-allocations-dashboard ; Infracost https://www.infracost.io/docs/infracost_cloud/finops_policies/ and https://www.infracost.io/docs/infracost_cloud/guardrails/ ; Vantage https://docs.vantage.sh/budgets ; CloudZero https://docs.cloudzero.com/docs/anomaly-detection ; CAST AI https://cast.ai/kubernetes-cost-optimization/ ; AWS https://docs.aws.amazon.com/cost-management/latest/userguide/ce-rightsizing.html and https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html ; Spot https://spot.io/product/eco-reports/ . These vendor/primary sources establish product patterns, not Nimbus implementation claims. Independent comparison material in search results was thin and not relied on for feature facts.
