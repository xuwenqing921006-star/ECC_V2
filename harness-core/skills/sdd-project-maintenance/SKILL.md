---
name: sdd-project-maintenance
description: Modify an existing ECC V2 or SDD project through a risk-sized Delta flow.
---

# Existing Project Maintenance

1. Resolve managed or external project path.
2. Read identity, lifecycle state, tasks, product/architecture docs, relevant
   experience, and project conventions.
3. Establish current build/test baseline.
4. Classify UI/design, product behavior, API/data, bugfix, refactor/upgrade, or
   documentation.
5. Classify Small, Medium, or Large.
6. Produce:
   - Small: Change Brief and focused plan;
   - Medium: Delta PRD, affected design/ADR, Delta Plan;
   - Large: full R-A-B1-B2-C.
7. Record impact on users, data, APIs, permissions, external services, migration,
   rollback, tests, and docs.
8. Pass development readiness when code changes are requested.
9. Run Planner -> Developer -> Reviewer -> Tester.
10. Update canonical artifacts and three-level experience.

Never force React, FastAPI, PyCore, or a new architecture onto an existing
project. Detect and preserve its supported stack unless an approved migration
changes it.
