# Nimbus + TrueForge demo script

Target length: 5 minutes. The demo must use a team-authorized AWS account and a configured local TrueForge instance. Do not show or record credential values.

## Before the demo

1. Start the local AWS read-only MCP server with `npm run mcp`.
2. Start TrueForge locally and configure a model, the `nimbus-aws-readonly` MCP connector, and a sandbox provider. Keep TrueForge bound to localhost.
3. Register `nimbus-cost-agent` from the documented agent manifest/installer, then inspect the saved tool list and approval settings in TrueForge.
4. Prepare a known safe account/region with a small inventory. Confirm pagination coverage/truncation and metric limitations are visible. Do not use synthetic fixture findings as evidence of live account conditions.
5. Keep the web app available as a separate, clearly labeled offline product walkthrough.

## Walkthrough

### 0:00–0:30 — The job

“Cloud cost review is a repeated operational chore. Nimbus gathers evidence and prepares a review, but it does not decide that a resource is waste or delete anything.”

### 0:30–1:30 — Reach a real system from the harness

In the TrueForge chat, ask the saved agent to inspect the selected AWS region and read one month of service-level costs. Show both MCP calls in the TrueForge event/steps trace. Then run the same MCP calls in Nimbus’s Live Evidence panel and compare account, region, capture time, and returned counts. Call out any 20-page cap/truncated services and the distinction between service-level spend and per-resource cost. The app panel itself is a local client; the judge-visible harness proof is the TrueForge trace.

### 1:30–2:30 — Run code in the harness sandbox

Ask the agent to normalize the returned resource inventory and run a deterministic validation/report script in the configured sandbox. Show the sandbox execution step and its output. For example, ask it to parse the exact JSON returned by `inspect_aws_inventory`, count records by resource category, validate the account/region/capture metadata, and print a Markdown evidence table to a sandbox file. Have it explicitly label all costs as service-level and report pagination truncation. The script must handle partial input explicitly and must not produce deletion authorization or savings claims.

### 2:30–3:30 — Make a reviewable decision packet

Ask for a short list of follow-up evidence needed before any optimization: owner, utilization history, backup/restore dependency, tags, and price source. Require citations to resource IDs and the live tool output. If any input is missing, make the agent report that instead of filling it in.

### 3:30–4:20 — Show the human boundary

Use TrueForge's ask-user-questions capability to require a person to choose whether to continue with the proposed follow-up investigation. Explain that Nimbus's web “Approve for plan” only changes local review state and has no AWS effect. The configured agent has only read tools and therefore has no cloud-mutation approval gate to demonstrate.

### 4:20–5:00 — Explain architecture and limits

Show the separation: Nimbus UI/local scanner; local AWS read-only MCP server; TrueForge orchestration/session/sandbox; AWS APIs. Name the largest limits: a 20-page-per-service cap with explicit truncation, no resource utilization metrics in live MCP response, account/service totals not per-resource cost, no cloud mutation, local mode is localhost-only.

## Evidence judges should be able to see

- TrueForge itself is running the agent loop and calling the real MCP tools.
- A TrueForge sandbox event shows actual code execution and output.
- Any required approval is a TrueForge chat checkpoint, with the tool and arguments visible.
- The app labels fixture data as synthetic and distinguishes it from live AWS results.
