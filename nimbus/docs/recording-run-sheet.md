# Final 3-minute recording run sheet — 2026-09-26

Organizer page lists the submission close at 19:00 IST. This run sheet matches the currently running Nimbus MCP endpoint and saved five-tool agent. It does not rely on the unactivated disposable-delete change in the working tree.

## 2:45 target (3:00 hard cap)

1. **0:00–0:15 — Problem:** “Nimbus helps cloud operators review AWS costs with live evidence, clear gaps, and a human decision before any change.”
2. **0:15–1:10 — TrueForge in use (55 seconds):** Open the [fresh rehearsal session](http://localhost:8790/sessions/01m3eqvw6ant11xnf3081k926f). Show the `collect_cost_review_evidence` event, scope, coverage, and final report. Keep this TrueForge UI segment visible for at least 30 seconds. Hide credentials and unredacted account/resource identifiers.
3. **1:10–1:45 — Sandbox:** Show the TrueForge sandbox-created event and the `exec` results that validated the evidence and produced the report. Narrate that the AWS read was real and costs remain service-level.
4. **1:45–2:15 — Human boundary:** Show the saved-agent approval setting for `mark_volume_for_review`. Explain it adds only a fixed reversible review tag. Do not approve it unless you have an eligible non-production volume and intend that exact write. Say clearly that irreversible cleanup approval has not been demonstrated.
5. **2:15–2:45 — Limits and close:** “This run covers the credential-selected account and one configured region. Cost Explorer totals are service-level and can lag. No savings or safe-deletion claim is inferred from low activity.” End by 2:45 to leave encoding/upload time.

Suggested prompt for the evidence and sandbox portion:

> Run one Nimbus review for the configured AWS account and region. Call `collect_cost_review_evidence` once. In the TrueForge Daytona sandbox, validate the returned identity, coverage, pagination, and record counts, then create a concise dated Markdown report. Show a compact summary in this TrueForge session. Do not call any AWS write tool. Clearly state Cost Explorer freshness and that costs are service-level, not resource-level.

## Current proof limits

- Two earlier successful TrueForge sessions are documented, including a combined evidence call and sandbox use. Capture the actual tool and sandbox events in this video before claiming those steps happened in this run.
- The running MCP endpoint currently exposes five tools; the six-tool local source change has not been activated or read back from TrueForge.
- The approval-gated review tag is reversible. The rubric's stop-before-irreversible-action demonstration remains unproven; do not present it as completed.
- One live run per round supports only directional trace counts, not a stable speed or quality win. The local microbenchmark is synthetic and excludes AWS, model, and sandbox time.
- The pre-event handoff contains a substantial prototype and the organizer page says pre-built projects are ineligible. Do not claim this eligibility question is resolved.

## Submission checklist

- Record at 1080p with narration or captions; export MP4 and keep the video under 3:00.
- Upload the MP4 to Google Drive, enable public link access, and paste that link in the submission form.
- Confirm the required public repository URL opens without authentication and the README explains setup and AI-assistant use.
- Submit the video and repository through the hackathon's actual submission form before its deadline.
- If time allows, ask the organizer whether extending the pre-event Nimbus handoff is eligible; don't claim approval unless received.
