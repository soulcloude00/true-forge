# Nimbus + TrueForge demo script

Target: five minutes. Local TrueForge v0.2.1 is configured with GPT-6 Luna, the Nimbus connector and saved agent, Git-backed skills, and Daytona; two successful TrueForge sessions have already been recorded. Use a team-authorized demo AWS account, never display credentials, and verify the live session trace before claiming that any step happened during the presentation. Nimbus remains on its separate local AWS profile, not the AWS Core account.

## Before the demo

1. Confirm the local Nimbus MCP server and TrueForge are available with the outbound guard on and only the loopback MCP host allowlisted.
2. Configure the model privately in TrueForge Settings. Verify the `nimbus-aws-review` connector exposes all six tools, including the combined evidence call and both approval-gated AWS writes.
3. In the saved agent, enable `Require approval` for both `mark_volume_for_review` and `delete_hackathon_demo_volume`; verify the evidence tools are un-gated. Keep disposable-volume deletion disabled unless you have a separately provisioned demo target.
4. For the destructive gate demo, use a dedicated encrypted 1 GiB gp3 EBS volume created specifically for this run, in the credential-selected account and region. Tag it `nimbus:hackathon-demo=agents-that-act-disposable` and `nimbus:dispose-after-approval=true`; configure the server's exact account, region, and volume ID allowlist and enable the opt-in. Do not use AWS Core credentials from inside Nimbus or touch existing EC2/volume resources.
5. Confirm Daytona is the selected sandbox provider. A prior Nimbus session showed sandbox creation/use; capture the sandbox event from the actual demo run before claiming it ran in that run.

## Walkthrough

### 0:00–0:30 — The job

“Nimbus helps an operator gather AWS inventory and service-level billing evidence, validate it, and prepare a review. It does not infer waste from one signal or delete resources.”

### 0:30–1:30 — TrueForge reaches AWS

In the TrueForge session, request one `collect_cost_review_evidence` call for the configured region and 14-day window. The tool returns STS identity, paginated inventory, hourly EC2 CPU/network coverage, daily service-level costs, deterministic summaries, and the local same-account/region baseline result. Show the structured output, account, capture time, overlap status, and any pagination or metric cap. Explain that service totals are not per-resource costs and can lag. Avoid a second live read solely to measure latency; Cost Explorer calls may incur charges.

### 1:30–2:30 — Run an evidence check in the sandbox

Ask Nimbus to validate the returned evidence in the TrueForge sandbox: count records by service, verify account/region/capture metadata, report pagination status, and produce a short Markdown evidence table. Show the sandbox tool event and output. Do not claim sandbox isolation unless the configured provider and actual execution event are visible.

### 2:30–3:20 — Explain uncertainty

Ask for owner, backup/restore dependency, memory, and resource-level pricing evidence before making an optimization recommendation. Require references to the returned resource IDs and identify unknowns. Low CPU/network activity is only a review signal. Do not present an unattached volume as waste or claim savings from service-level billing totals.

### 3:20–4:20 — Show the approval boundary

Name the demo account, region, exact volume ID, encrypted 1 GiB gp3 shape, disposable tags, and irreversible deletion effect. Ask Nimbus to delete only this operator-configured target. Show the pause in the TrueForge workflow panel with exact arguments. Choose one outcome: deny and confirm the target remains, or approve and confirm deletion through fresh evidence. Never switch to another resource after denial. The reversible review tag remains separate from deletion authorization.

### 4:20–5:00 — Architecture and limits

Show the path: operator → TrueForge agent/session → Nimbus combined evidence MCP → AWS APIs; the TrueForge sandbox validates returned evidence, while Canvas keeps approval and agent questions in the workflow panel. Nimbus's static scanner is a synthetic/local-input preview. State limits plainly: selected-account/region scope, inventory and metric caps, missing utilization/ownership evidence, service-level rather than resource-level spend, and the optional single-target demo deletion. Do not claim generalized cleanup safety, calibrated anomaly detection, or external alerts.

## Proof to capture

- Saved TrueForge agent and actual streamed session, not only the Nimbus UI.
- Real AWS MCP response with account/region, metric-window, and coverage metadata.
- A TrueForge sandbox execution event from a configured provider.
- TrueForge's approval pause showing the exact `delete_hackathon_demo_volume` call and arguments; if denied, capture proof the disposable target remains. Show deletion only if the dedicated demo target was explicitly approved.
- A clean-clone README path and a clear statement that synthetic data is not live account evidence.

The optional daily schedule is product follow-through, not a substitute for the five-minute live demo. If shown, identify its 09:00 IST cadence, configured-region scope, Cost Explorer freshness limits, persistent TrueForge run sessions, and the absence of external alert delivery.
