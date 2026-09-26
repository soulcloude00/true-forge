# Nimbus + TrueForge demo script

Target: five minutes. Run this only after a model provider, connector, agent, and sandbox provider have been configured and verified. Use a team-authorized demo AWS account. Never show credential values. This script describes the intended demonstration; it is not evidence that the current environment has completed one.

## Before the demo

1. Start `npm run mcp` and local TrueForge with the outbound guard on and loopback MCP host allowlisted.
2. Configure the model privately in TrueForge Settings. Verify the `nimbus-aws-review` connector exposes all three tools.
3. In the saved agent, enable `Require approval` specifically for `mark_volume_for_review`; verify both evidence tools are un-gated.
4. Configure a supported TrueForge sandbox provider and run a harmless sandbox check before presenting sandbox execution as available.
5. Confirm AWS account/region and pagination coverage. Use only a dedicated demo account with a known available, unattached volume if demonstrating the optional tag. Keep the synthetic UI report clearly labeled.

## Walkthrough

### 0:00–0:30 — The job

“Nimbus helps an operator gather AWS inventory and service-level billing evidence, validate it, and prepare a review. It does not infer waste from one signal or delete resources.”

### 0:30–1:30 — TrueForge reaches AWS

In the TrueForge session, request inventory and one month of service-level cost evidence for the authorized account and region. Show the real MCP calls and returned account, capture time, counts, and coverage. Call out any page-cap truncation, and explain that monthly service totals are not per-resource costs.

### 1:30–2:30 — Run an evidence check in the sandbox

Ask Nimbus to validate the returned evidence in the TrueForge sandbox: count records by service, verify account/region/capture metadata, report pagination status, and produce a short Markdown evidence table. Show the sandbox tool event and output. Do not claim sandbox isolation unless the configured provider and actual execution event are visible.

### 2:30–3:20 — Explain uncertainty

Ask for missing utilization history, owner, backup/restore dependency, and pricing evidence before making an optimization recommendation. Require references to the returned resource IDs and identify unknowns. Do not present an unattached volume as waste or claim savings from service-level billing totals.

### 3:20–4:20 — Show the approval boundary

Only if the operator explicitly requested a review marker, have Nimbus propose the exact fixed tag for one eligible volume. Show the account, region, volume ID, and tool arguments in the TrueForge approval event. Approve only in a dedicated demo account, or reject and show that the action stops. Verify the resulting tag through a fresh read if approved. Explain that this reversible marker requests human review; it grants no cleanup permission.

### 4:20–5:00 — Architecture and limits

Show the path: operator → TrueForge agent/session → AWS review MCP → AWS APIs; separately, TrueForge sandbox validates returned evidence. Nimbus's static scanner is a synthetic/local-input preview. State limits plainly: inventory page cap, missing utilization metrics, service-level rather than resource-level spend, AWS permissions needed for live reads, and the single optional tag write.

## Proof to capture

- Saved TrueForge agent and actual streamed session, not only the Nimbus UI.
- Real AWS MCP response with account/region and coverage metadata.
- A TrueForge sandbox execution event from a configured provider.
- TrueForge's approval pause showing the exact `mark_volume_for_review` call and arguments; show the resulting tag only if explicitly approved in the demo account.
- A clean-clone README path and a clear statement that synthetic data is not live account evidence.
