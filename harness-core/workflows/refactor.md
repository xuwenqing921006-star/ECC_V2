# Refactor and Upgrade Workflow

1. Define the measurable reason: reliability, maintainability, performance,
   security, cost, or supported-version upgrade.
2. Map current architecture and dependencies.
3. Lock existing user behavior with characterization tests.
4. Define compatibility contracts for APIs, data, events, and files.
5. Architect writes an ADR with alternatives and consequences.
6. Produce a staged migration and rollback plan.
7. Planner creates small reversible batches.
8. Every batch follows Developer -> Reviewer -> Tester.
9. Remove the legacy path only after replacement evidence and Product Owner
   approval when behavior or data may change.
10. Update architecture, operations, and experience records.

Avoid big-bang rewrites unless incremental migration is demonstrably impossible.
