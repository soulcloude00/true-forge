# Round 3 — bounded baseline and operations — 2026-09-26

## Product changes

- Added persistent same-account/region comparison over overlapping complete dates to the combined evidence tool.
- Bounded retention to 90 snapshots per exact account/region and 1,000 total snapshots, keeping the newest records.
- Atomic baseline writes now set mode `0600` on the private file.
- Added regression checks for the global cap, newest-record retention, and restrictive file permissions.
- Added TrueForge Canvas support for pausing the workflow at a tool approval or agent question, showing the request in the workflow execution panel, and resuming the same session after an explicit decision/answer.

## Local microbenchmark

Command: `npm run bench` in `nimbus/` on 2026-09-26. 42 synthetic service rows (14 dates × 3 services), 100 warmups, and 1,000 timed iterations for each production function. The same run validated daily totals and 14-day/three-service baseline deltas.

| Function | Median (ms) | p95 (ms) | Max (ms) |
|---|---:|---:|---:|
| `analyzeDailyCosts` | 0.0145 | 0.0398 | 0.7255 |
| `compareCostBaselines` | 0.0306 | 0.0699 | 0.3773 |

These are local synthetic function timings. They exclude AWS, filesystem persistence, network, TrueForge event/runtime overhead, Daytona, and model latency. They are not comparable to Round 2's earlier aggregation-only run for a speedup claim; fixture, functions, and runtime conditions differ. The variation and observed sub-millisecond maxima reinforce that this is a microbenchmark only.

To check process-to-process noise, the benchmark was then run in five fresh Node processes, each with 1,000 iterations per function. The per-process medians (aggregation / baseline comparison) were 0.0113 / 0.0266, 0.0114 / 0.0268, 0.0114 / 0.0265, 0.0126 / 0.0257, and 0.0115 / 0.0256 ms. The median of those process medians is 0.0114 / 0.0265 ms. The median of the five within-process p95 values is 0.0239 / 0.0526 ms. Every process passed the same correctness checks. These repeated local runs improve timing stability evidence for the deterministic functions; they still say nothing about model or AWS end-to-end speed.

## Verification

- `npm test`: 51 tests passed, including baseline-retention and file-mode cases.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- TrueForge UI package `pnpm --filter @truefoundry/trueforge-ui typecheck`: passed after in-panel approval/question changes.
- TrueForge UI package build: passed.
- The user will verify the Canvas interaction in their browser; no browser interaction was performed for this round.
- Read-only schedule inspection confirmed the schedule is active and next due 2026-09-27 09:00 IST. It had no completed scheduled run/session at inspection time.

## Limits

No new live AWS/LLM benchmark was run. Round 1 and Round 2 remain one live run each; 11-to-3 observed trace events is directional only. Nimbus still uses the selected local AWS profile, which differs from AWS Core. No irreversible AWS action or denial/revalidation demo was conducted. The schedule's first comparison, repeated alert quality, and recurring uptime remain unverified.
