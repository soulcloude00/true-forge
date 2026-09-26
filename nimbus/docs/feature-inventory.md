# Nimbus working feature inventory (September 26, 2026)

This is a deliberately conservative count of distinct working user-facing capabilities in the hosted demo, not a claim of live AWS connection or bill savings. Every item is implemented in TypeScript and exercised by unit tests or the hosted preview. Closely related filter variants count together; safety disclaimers and decorative effects do not inflate the count.

1. Painterly landing page with Nimbus mascot.
2. Guided sample/local setup.
3. Four selectable synthetic sample situations.
4. Example inventory JSON download.
5. Bounded local JSON paste and validation.
6. Duplicate resource ID rejection.
7. Resource-after-capture timestamp rejection.
8. Unattached gp3 EBS lead rule.
9. Unassociated IPv4 lead rule.
10. Low-activity t3.medium compute lead rule.
11. Zero-request ALB lead rule.
12. Old standard-tier snapshot lead rule.
13. Resource-specific evidence drawer.
14. Per-finding input-rate formula and caveat.
15. Per-finding approve-for-plan decision.
16. Per-finding deny decision.
17. Undo last decision.
18. Private in-page review notes.
19. Search finding titles, IDs and evidence.
20. Filter findings by service.
21. Filter findings by review decision.
22. Filter findings by rule caution.
23. Sort findings by cost, title or caution.
24. No-candidate and no-filter-match states.
25. Review plan with open, approved and denied separation.
26. Advisory per-item threshold and critical-caution review gate.
27. Markdown review plan export.
28. Findings JSON export.
29. Formula-safe findings CSV export.
30. Full-inventory scan audit including exclusions.
31. Search and status-filter the scan audit.
32. Formula-safe full-audit CSV export.
33. Rule input coverage panel.
34. Input provenance and age warnings.
35. Candidate estimate breakdown by resource type.
36. Annualized candidate and plan estimates.
37. Monthly candidate review-target comparison.
38. Four-situation synthetic comparison.
39. Candidate estimate grouping by supplied tags.
40. Tag-presence quality audit with missing IDs.
41. Advisory open-lead review queue.
42. Supplied-rate sensitivity what-if panel.
43. Two-local-inventory lead comparison with stated account/region gate.
44. Compact two-input comparison JSON export.

45. Per-finding self-marked five-step review checklist, reset on a new scan.
46. Aggregate self-marked checklist progress in the review plan and JSON report.
47. Local investigation stage per finding (new, investigating, on hold), separate from approval.
48. Investigation stage counts and filters in the findings view.
49. Markdown handoff carries local investigation stage and self-marked checklist tally.
50. Formula-safe findings CSV carries local stage and self-marked checklist tally.
51. Download portable local review JSON, with scan identity.
52. Restore a review only when the complete local inventory and finding set match.
53. Reconcile two local scans into new, cleared and still-flagged estimate changes.
54. Call out changed input rates and nonchronological capture ordering in local comparison.

55. Per-resource next-evidence guidance in the complete scan audit.
56. Count excluded resource records with missing input or matching rate.
57. Fourteen-sample CPU and network strips in the EC2 evidence drawer.
58. Fourteen-sample request strip in the load-balancer evidence drawer.
59. One-rate local what-if input, separate from original findings and approvals.
60. Per-resource estimate deltas for the one-rate what-if.

Not counted: live AWS collector, billing ingestion, rate verification, automatic policy enforcement, CI integration, anomaly detection, Kubernetes allocation, multi-device persistence, or real resource remediation. Some of the 60 items are small UI controls; the requested 50–60 distinct *substantial* features remain unmet. The product is a credible hackathon demo, not a production cloud-cost platform.
