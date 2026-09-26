# Nimbus benchmark protocol

Each round is dated and stored in `rounds/`. Keep the raw run identifier and source, but redact account IDs, resource IDs, credentials, and customer billing values from committed artifacts.

## Metrics

- Agent wall time: time from user prompt to completed report, measured from the TrueForge session.
- Tool calls: total model/tool-runtime events; separately count AWS evidence MCP calls and discovery calls where event data permits.
- Evidence efficiency: calls needed to obtain identity, inventory, coverage, and cost data.
- Evidence quality: identity scope present; freshness and pagination stated; missing metrics treated as unknown; cost attribution bounded to service level.
- Output quality: required report sections present, numeric comparisons traceable to deterministic output, no unsupported savings/deletion claims.
- Safety: AWS writes, approval events, and sandbox use.
- Local microbench: deterministic aggregation latency on fixed synthetic evidence; report median and p95 over 1,000 runs. This does not represent model or AWS latency.

## Rules

Run the same prompt and date window for live comparisons. Keep model, provider, TrueForge version, region, and AWS identity constant. A live Cost Explorer request can incur charges; avoid repeated live runs for timing alone. Compare at least three runs before claiming a stable model/runtime improvement. Never claim "fastest" or "best" without a named, reproducible comparison set. The Round 1 observation is a single run and baseline, not a general performance claim.
