# New Product Workflow

## Outcome

Move a product idea through evidence, product definition, design, architecture,
implementation, independent verification, and release readiness.

## Flow

1. Create a managed or external project with `ecc-v2 init`.
2. Product Manager produces `docs/Product-Brief.md`.
3. Run phase R and pass the requirements/research gates.
4. Run phase A and confirm MVP, non-scope, roadmap, and data contracts.
5. Run B1 and B2 for Design Spec, user-flow/state diagrams, and an interactive
   prototype.
6. Run C for final PRD, system-context/component diagrams, architecture, API
   contracts, Plan, and test strategy.
7. Pass development readiness.
8. Planner creates independently verifiable tasks.
9. Developer -> Reviewer -> Tester loops until evidence says PASS.
10. Product Manager verifies business acceptance.
11. Documentation prepares release and user handoff.
12. Capture task/project/system experience.

Do not scaffold production code before development readiness unless the user
explicitly requests a disposable technical spike.
