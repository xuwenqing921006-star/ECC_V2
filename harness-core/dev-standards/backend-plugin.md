# Plugin and Integration Standard

Use an explicit interface for replaceable external providers or plugins.

Define:

- capability and ownership;
- input/output schema;
- lifecycle and failure semantics;
- configuration names without real values;
- timeout, retry, idempotency, and rate limits;
- observability and cost;
- test double and real-integration criteria;
- version compatibility and fallback.

Do not add a plugin abstraction for a one-off internal function unless it
creates a real boundary or approved extension point.
