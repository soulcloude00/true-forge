# Safety and data boundaries

## Separate evidence paths

The bundled scanner is pure TypeScript over caller-provided or synthetic AWS-shaped inventory. It does not call AWS. Its rule fields and local “Approve for plan” state are not live authorization or proof that an AWS action is safe. The local MCP server is a separate path that calls AWS APIs using the operator's local credential chain. Do not treat scanner output as a connected-account report.

## Live AWS tools

The MCP server exposes three evidence readers and one narrowly scoped write:

- `inspect_aws_inventory` reads STS identity and paginated EC2/ELB inventory. It caps each service at 20 pages and reports truncation. For up to 100 EC2 instances, it also reads hourly CPUUtilization, NetworkIn, and NetworkOut from CloudWatch across the last 14 complete UTC days. Metric query coverage, missing datapoints, and the instance cap are reported. Low observed activity is only a review signal; it does not prove a resource is idle or safe to stop.
- `read_monthly_service_cost` reads Cost Explorer monthly totals grouped by service, with pagination and a truncation indicator. These are account/service totals, not resource attribution or savings estimates. A live read-only capability check found `GetCostAndUsageWithResources` unavailable because resource-level granularity is not enabled in the payer account; Nimbus must not assign account/service totals to a resource.
- `read_recent_daily_service_cost` reads 7–31 complete UTC days of service totals, with pagination and an explicit freshness warning. Cost Explorer may lag; recent amounts are not a real-time signal.
- `mark_volume_for_review` checks expected account ID, region, exact volume ID, and current EBS state. It adds only `nimbus:review-state=candidate-for-human-review` to a volume that is currently available and unattached. It refuses to overwrite a different value and returns without writing if the same marker already exists. The write requires `ec2:CreateTags` permission and must have TrueForge approval enabled for this exact tool.

No tool deletes, stops, snapshots, detaches, or otherwise modifies AWS resources. Never infer safe deletion or waste from an unattached volume, old snapshot, or limited period of low activity. A review tag is a prompt for a person to investigate, not cleanup permission.

## Human and sandbox controls

The approval boundary belongs to the saved TrueForge agent configuration. Verify `mark_volume_for_review` is listed under `requireApprovalForTools`, confirm the actual saved tool set, and inspect the exact account/region/resource/action shown in the approval event. Denial must end that action without selecting another target. The MCP server's annotations do not enforce the TrueForge gate by themselves.

Sandbox is enabled in the agent draft. That setting alone does not prove execution happened in an isolated environment. Configure a supported sandbox provider and show the actual TrueForge sandbox event before claiming isolated code execution. Do not put AWS credentials in generated sandbox files or reports.

## Credentials and deployment

AWS reads use the local AWS credential chain. Keep credentials out of source, prompts, browser screenshots, and exported evidence. Model provider keys belong in TrueForge's local settings/secrets, never in the repository or Nimbus UI. Keep the default local TrueForge server on localhost; it has no login by default. An internet-facing service needs authentication and deployment hardening before use.

## Known evidence limits

The inventory reader lacks owner, dependency, and backup confirmation. CloudWatch provides hourly CPU/network data for EC2 only; Nimbus does not collect memory utilization or per-resource billing. Resource-level Cost Explorer data requires payer opt-in and is unavailable in the currently connected account. Pagination and metric caps can make results incomplete, which must be surfaced. An opt-in TrueForge schedule can run daily for one configured AWS region and create session reports; it is not enabled in the current local instance, does not keep a separate baseline, and does not deliver external alerts. Keep the scheduled run read-only. Do not claim full multi-region continuous coverage or alerting.
