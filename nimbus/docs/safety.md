# Safety and data boundary

The bundled scanner is pure, synchronous TypeScript over a caller-provided inventory object. It does not import an AWS SDK, call any endpoint, delete anything or execute a proposed action. The `eligibleForAction` field on the synthetic unassociated IPv4 is a rule hint, not user approval or live authorization. `janitor:managed=true` is an additional future safeguard, never permission.

A future live AWS collector should use least-privilege read-only credentials; validate account, region, resource and billing scope; handle pagination, throttling, missing metrics, retention and price-source freshness; and avoid transferring secret values into reports. Before any eventual write, re-check dependencies, ownership, backups, cost and undo feasibility and require an explicit human review of the specific action. Do not infer safe deletion from an old snapshot, unattached volume, or 14 days of low activity alone.

This site hosts static assets and in-memory choices only. It has no data store or cross-user synchronization. JSON/CSV exports are local downloads. No external service is configured in the hosted File.
