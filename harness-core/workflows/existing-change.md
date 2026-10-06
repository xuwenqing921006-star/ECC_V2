# Existing Product Change Workflow

## Outcome

Change an existing product without losing current behavior, architecture
knowledge, or delivery evidence.

## Flow

1. Resolve or import the repository.
2. Use ECC `codebase-onboarding`, then let the ECC_V2 Architect extract the
   current module, data, API, dependency, and deployment boundaries.
3. Establish the current build/test baseline.
4. Product Manager writes a Change Brief with goal, users, scope, non-scope,
   affected journeys, and acceptance criteria.
5. Classify Small, Medium, or Large.
6. Small: focused plan. Medium: Delta PRD and Delta Plan. Large: R-A-B1-B2-C.
7. Architect records compatibility, data, API, security, migration, and rollback
   impact when applicable.
8. Planner -> Developer -> Reviewer -> Tester.
9. Update canonical product and technical documents.
10. Record the change evidence and experience.

Never rewrite unrelated modules solely to make the new change cleaner.
