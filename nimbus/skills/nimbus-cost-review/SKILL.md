---
name: nimbus-cost-review
description: Use for evidence-first AWS cost reviews with Nimbus, deterministic service-cost comparisons, coverage checks, and safe recommendations.
---

# Nimbus cost review

1. Start with `collect_cost_review_evidence` for the configured account and region. It returns identity, inventory, CloudWatch coverage, daily Cost Explorer rows, and deterministic comparisons. Make additional reads only for an explicit drill-down.
2. Check account ID, region, capture timestamp, pagination truncation, the 100-instance CloudWatch cap, expected versus observed datapoints, and Cost Explorer's exclusive end date before interpretation.
3. Use the returned deterministic totals and changes. Cost Explorer amounts are account/service totals; never attribute them to a resource, call them savings, or treat a change as an anomaly without a baseline and a threshold.
4. Treat missing, partial, and unavailable data as unknown. Low CPU or network activity is a review lead, not proof of idleness or deletion safety.
5. In the TrueForge sandbox, produce a Markdown report with scope, short evidence table, top service-level changes, coverage/gaps, uncertainty, and concrete human follow-up questions. Do not repeat raw data unnecessarily.
6. Scheduled runs are read-only. Never call `mark_volume_for_review` unless a person explicitly requests that exact reversible review marker; then use the exact account, region, and volume ID from current evidence and wait for TrueForge approval.
7. Never stop, delete, snapshot, or otherwise modify an AWS resource. Do not claim realized or projected savings from this evidence.
