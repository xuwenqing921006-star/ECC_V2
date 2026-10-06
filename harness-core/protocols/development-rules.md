# ECC V2 Development Rules

## Before development

1. Resolve project and route.
2. Read approved PRD/Delta PRD, design, architecture, Plan, and relevant ADRs.
3. Read project conventions and only the matching language packs.
4. Retrieve relevant system, project, and task experience.
5. Detect the runtime, dependency manager, build, lint, type, and test commands.
6. Record a baseline.
7. Pass the development gate.
8. Record task-bound `development_readiness` and run the central
   `guard development` command before changing business source, configuration,
   or migrations. A project-level gate inherited from an earlier task is not
   sufficient.

## Planner

- Creates small tasks with dependencies.
- Separates user-visible acceptance from technical checks.
- Adds migration, rollback, external-service, and user-gate fields where needed.
- Does not implement.

## Developer

- Works only on the active task.
- Adds or updates tests before or with behavior changes.
- Preserves existing conventions unless an approved refactor changes them.
- Records commands and evidence.
- Never marks PASS.

## Reviewer

- Reviews scope, correctness, regression, compatibility, data integrity,
  security, maintainability, and test sufficiency.
- Sends actionable findings back to Developer.

## Tester

- Verifies every acceptance criterion independently.
- Runs appropriate build/type/lint/unit/integration/E2E checks.
- Writes PASS/FAIL/BLOCKED evidence.
- Synchronizes task status only after evidence exists.
- Does not fix implementation while acting as Tester.
- Adds `ECC_TEST_TASK`, `ECC_TEST_VERDICT`, and
  `ECC_TEST_INDEPENDENT: true` to the task report.

## Product acceptance

For `user_gate=true`, technical PASS waits for Product Manager or Product Owner
business acceptance before the task is considered delivered.

## Experience

Follow `protocols/experience.md` at task start and completion.

Before reporting completion, run the central `guard completion` command. A
non-zero result means the task remains incomplete or blocked.

## Safety

- Never install an unapproved paid service.
- Never expose secrets in output.
- Never modify production data without explicit approval and recovery planning.
- Never use disabled tests, reduced assertions, or broad ignores as a shortcut.
