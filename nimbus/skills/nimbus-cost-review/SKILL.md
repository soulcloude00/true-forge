---
name: nimbus-cost-review
description: Use for evidence-first AWS cost reviews with Nimbus, deterministic service-cost comparisons, coverage checks, and safe recommendations.
---

# Nimbus cost review

1. Start with `collect_cost_review_evidence` for the configured account and region. It returns identity, inventory, CloudWatch coverage, daily Cost Explorer rows, deterministic comparisons, and records a bounded local history snapshot scoped to that exact account and region. This local history write does not change AWS resources. Make additional reads only for an explicit drill-down.
2. Check account ID, region, capture timestamp, pagination truncation, the 100-instance CloudWatch cap, expected versus observed datapoints, and Cost Explorer's exclusive end date before interpretation.
3. Use the returned deterministic totals and changes. Explain the baseline status: first run, insufficient overlap, compared overlapping complete dates, or local storage unavailable. Compare only the matching dates and state how many overlap. Cost Explorer amounts are account/service totals; never attribute them to a resource, call them savings, or label a change as an anomaly.
4. Treat missing, partial, and unavailable data as unknown. Low CPU or network activity is a review lead, not proof of idleness or deletion safety.
5. In the TrueForge sandbox, produce a Markdown report with scope, short evidence table, top service-level changes, baseline overlap, coverage/gaps, uncertainty, and concrete human follow-up questions. Use TrueForge native Generative UI/OpenUI in the same session for a compact scope/baseline/change/coverage panel; follow the required fenced OpenUI syntax and do not create a separate web page.
6. Scheduled runs make AWS reads and update local Nimbus history only. Never call either write tool during a scheduled run.
7. Call `mark_volume_for_review` only when a person explicitly requests that exact reversible marker; use the account, region, and volume ID from current evidence and wait for TrueForge approval.
8. `delete_hackathon_demo_volume` is disabled by default and can delete only the one operator-configured, encrypted 1 GiB gp3 volume tagged `nimbus:hackathon-demo=agents-that-act-disposable` and `nimbus:dispose-after-approval=true`. Call it only after the user explicitly asks to delete that exact disposable demo target, show the exact account/region/volume ID and irreversible effect, and wait for TrueForge approval. Stop if denied. Never use it for another resource or in a scheduled run. It does not authorize general cleanup.
9. Do not claim realized or projected savings from this evidence.
