# Safety and data boundaries

## Separate evidence paths

The bundled scanner is pure TypeScript over caller-provided or synthetic AWS-shaped inventory. It does not call AWS. Its rule fields and local “Approve for plan” state are not live authorization or proof that an AWS action is safe. The local MCP server is a separate path that calls AWS APIs using the operator's local credential chain. Do not treat scanner output as a connected-account report.

## Live AWS tools

The MCP server exposes three evidence readers, one combined evidence-and-local-history tool, and one narrowly scoped AWS write:

- `inspect_aws_inventory` reads STS identity and paginated EC2/ELB inventory. It caps each service at 20 pages and reports truncation. For up to 100 EC2 instances, it also reads hourly CPUUtilization, NetworkIn, and NetworkOut from CloudWatch across the last 14 complete UTC days. Metric query coverage, missing datapoints, and the instance cap are reported. Low observed activity is only a review signal; it does not prove a resource is idle or safe to stop.
- `read_monthly_service_cost` reads Cost Explorer monthly totals grouped by service, with pagination and a truncation indicator. These are account/service totals, not resource attribution or savings estimates. A live read-only capability check found `GetCostAndUsageWithResources` unavailable because resource-level granularity is not enabled in the payer account; Nimbus must not assign account/service totals to a resource.
- `read_recent_daily_service_cost` reads 7–31 complete UTC days of service totals, with pagination and an explicit freshness warning. Cost Explorer may lag; recent amounts are not a real-time signal.
- `collect_cost_review_evidence` gathers identity, paginated inventory, hourly utilization coverage, and daily service totals in one call. It stores up to 90 snapshots per exact account/region and 1,000 snapshots total in local Nimbus history, retaining the newest records first, and compares at least seven overlapping complete dates with the prior snapshot. This local filesystem write does not change AWS resources. The baseline is not a backup, is not shared across machines, and is not an anomaly detector. The file is written with mode `0600` and defaults to `~/.nimbus-cost-agent/cost-baselines.json`; keep it out of source control.
- `mark_volume_for_review` checks expected account ID, region, exact volume ID, and current EBS state. It adds only `nimbus:review-state=candidate-for-human-review` to a volume that is currently available and unattached. It refuses to overwrite a different value and returns without writing if the same marker already exists. The write requires `ec2:CreateTags` permission and must have TrueForge approval enabled for this exact tool.
- `delete_hackathon_demo_volume` is a separate destructive demonstration tool. It is disabled by default and accepts only one volume ID, account, and region configured by the operator. Before deletion it rechecks caller identity and requires the exact tags `nimbus:hackathon-demo=agents-that-act-disposable` and `nimbus:dispose-after-approval=true`, an available state, zero attachments, encryption, `gp3`, and size `1 GiB`. Configure it only for a separately created disposable hackathon volume and require TrueForge approval. It must never be enabled in scheduled runs; no AWS target is created automatically.

No tool stops, snapshots, detaches, or otherwise modifies arbitrary AWS resources. `delete_hackathon_demo_volume` can delete only its one operator-configured, exactly tagged disposable target after explicit user request and TrueForge approval. Never infer safe deletion or waste from an unattached volume, old snapshot, or limited period of low activity. A review tag is a prompt for a person to investigate, not cleanup permission.

## Human and sandbox controls

The approval boundary belongs to the saved TrueForge agent configuration. Verify both `mark_volume_for_review` and `delete_hackathon_demo_volume` are listed under `requireApprovalForTools`, confirm the actual saved tool set, and inspect the exact account/region/resource/action shown in the approval event. Denial must end that action without selecting another target. The MCP server's annotations do not enforce the TrueForge gate by themselves. The combined evidence tool writes only its local history file; it does not change AWS resources.

Sandbox is enabled in the agent draft. That setting alone does not prove execution happened in an isolated environment. Configure a supported sandbox provider and show the actual TrueForge sandbox event before claiming isolated code execution. Do not put AWS credentials in generated sandbox files or reports.

## Credentials and deployment

AWS reads use the local AWS credential chain. Keep credentials out of source, prompts, browser screenshots, and exported evidence. Model provider keys belong in TrueForge's local settings/secrets, never in the repository or Nimbus UI. Keep the default local TrueForge server on localhost; it has no login by default. An internet-facing service needs authentication and deployment hardening before use.

## Known evidence limits

The inventory reader lacks owner, dependency, and backup confirmation. CloudWatch provides hourly CPU/network data for EC2 only; Nimbus does not collect memory utilization or per-resource billing. Resource-level Cost Explorer data requires payer opt-in and is unavailable in the currently connected account. Pagination and metric caps can make results incomplete, which must be surfaced. The active TrueForge schedule runs daily for one configured AWS region, updates local baseline history, and creates session reports. It does not deliver external alerts. Keep AWS resource actions out of scheduled runs. Do not claim full multi-region continuous coverage or alerting.
