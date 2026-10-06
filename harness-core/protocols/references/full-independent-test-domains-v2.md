# Full Independent Testing v2 — Universal Domain Catalog

Read this catalog only after `full_independent` is explicitly activated. Apply
it to the actual project; it is technology-neutral. Every domain must finish as
`PASS`, `FAIL`, `BLOCKED`, or `N/A + reason`.

| Domain id | Coverage to derive for the project |
|---|---|
| `requirements` | Confirmed rules, acceptance criteria, non-scope, conflicts between intent and implementation. |
| `environment_identity` | Project/repository, branch/HEAD or non-Git baseline, running artifact/hash, processes/ports, data and external destinations, isolation. |
| `build_static` | Applicable build, type, lint, static/security checks and reproducible artifacts. |
| `unit_component` | Unit/component checks for rules, calculations, validation, boundaries and failure behavior. |
| `api_integration` | Contracts, normal/invalid/boundary input, auth, error codes, hidden-field tampering, retries and partial failure. |
| `database_consistency` | Constraints, relationships, tenant/ownership fields, transactions, rollback, idempotency, cache and historical integrity. |
| `ui` | Every actual page/function/action, visible states, navigation, validation, layout, accessibility and real browser/device behavior. |
| `permissions_security` | Roles, functions, data scope, direct route/API/file access, stale sessions, cross-user/org/tenant attacks and secret leakage. |
| `state_workflow` | Legal/illegal transitions, ordering, repeat operations, delete/disable interactions and cross-function combinations. |
| `time_scheduled` | Time zones, boundaries, expiry, scheduled jobs, callbacks, delayed work and retry timing. |
| `concurrency_idempotency` | Competing sessions/roles, repeat submission, lost update, payment/inventory/amount races and controlled concurrency. |
| `resilience_recovery` | Network interruption, timeout, partial success, dependency failure, retry, rollback and restart recovery. |
| `multi_client_cache` | Cross-entry/client consistency, independent sessions, refresh/re-login, cache invalidation and eventual consistency. |
| `history_audit_logs` | Audit/history retention, attribution, log increments, sensitive-data handling and absence of new unexplained errors. |
| `external_real_chain` | Actual external service/device/payment/notification/invoice chain, distinctly labeled from mocks and blocked without authority/access. |
| `regression` | Affected legacy behavior, compatibility, migrations, rollback readiness and protected-scope checks. |

For each applicable business rule or action, cross the relevant domains with:

- normal, minimum/maximum, empty, invalid, duplicate and adversarial inputs;
- each actual role, organization/tenant/data scope, enabled/disabled state and
  independent session;
- each legal and illegal state, operation order and related-object change;
- persistence across refresh, re-login, restart, cache invalidation and history;
- concurrent, repeated, interrupted, partially failed and recovered execution.

Build risk combinations from the project's object relationships and state model.
Examples such as ranking then deletion, disabling a parent after publishing a
child, changing an object after downstream creation, or overlapping refund and
invoice are reasoning patterns only; never assume those objects exist.
