# Round 4 — safety-gate verification and microbenchmark rerun — 2026-09-26

## Verification

- `npm test`: 54 passed, including exact-target, tag, attachment, encryption, volume-type, and size checks for the disposable demo volume gate.
- `npm run typecheck`: passed.
- `npm run build`: passed (Vite retained the existing warning that the main JS chunk exceeds 500 kB).
- No AWS resources were created or deleted. The deletion tool is disabled unless an operator configures one exact disposable demo volume.
- The currently running MCP server still serves five tools; source changes have not been activated in TrueForge.

## Local microbenchmark rerun

Five sequential fresh Node processes each ran `npm run bench`, using 42 synthetic service rows, 100 warmups, and 1,000 iterations per analysis function. Every run passed the existing correctness assertions.

| Function | Median of process medians (ms) | Median of process p95s (ms) |
|---|---:|---:|
| `analyzeDailyCosts` | 0.0128 | 0.0215 |
| `compareCostBaselines` | 0.0278 | 0.0553 |

Per-process medians for daily analysis: 0.0131, 0.0127, 0.0128, 0.0100, 0.0130 ms. Per-process medians for baseline comparison: 0.0287, 0.0287, 0.0278, 0.0230, 0.0262 ms. The functions and fixture did not change in this round; this is a regression-monitoring rerun, not a speedup claim. Occasional maxima varied into multi-millisecond outliers, so the results describe only synthetic local function performance, not TrueForge, sandbox, model, filesystem, or AWS latency.
