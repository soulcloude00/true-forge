# Round 2 — local benchmark — 2026-09-26

The benchmark calls Nimbus's production `analyzeDailyCosts` function directly using 42 synthetic rows (14 dates × 3 services). Each run performs 100 warmups and 1,000 timed iterations. Values below are local Node measurements and exclude AWS, Cost Explorer charges, network, TrueForge, Daytona, and model latency.

| Run | Median (ms) | p95 (ms) | Max (ms) |
|---|---:|---:|---:|
| 1 | 0.0080 | 0.0343 | 0.4598 |
| 2 | 0.0059 | 0.0127 | 0.1999 |
| 3 | 0.0058 | 0.0064 | 0.0661 |

All three runs verified 14 daily totals and 3 service-change summaries. Median of run medians: **0.0059 ms**. The spread, especially in run 1's p95/max, shows local runtime noise. This establishes an initial local baseline only; there is no pre-change measurement of this implementation to support a speedup claim. The real Round 2 TrueForge session is still needed to measure tool-call count and end-to-end time.
