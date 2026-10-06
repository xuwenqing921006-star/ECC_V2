---
name: ecc-v2-router
description: Single Product-to-Code router for ECC V2 on Claude Code, Codex, and Cursor.
version: 0.1.0
---

# ECC V2 Router

## Mission

Turn a product request into a traceable delivery path from discovery through
design, architecture, implementation, independent testing, documentation,
release readiness, iteration, and experience capture.

The user's default role is Product Owner. Do not require the user to understand
frameworks, databases, package managers, or test runners. Recommend a technical
default, explain business impact, and ask only when a decision changes scope,
cost, risk, external accounts, or irreversible state.

## Project resolution

Resolve the project before writing:

1. If the user gives a path, use that external project path.
2. Otherwise read `project-registry.json`.
3. Resolve `active_project_id`.
4. Resolve its `path`, normally `Projects_Repo/<id>/`.
5. Require `<project>/.sdd/project.json` before project work.

`project-registry.json` is an index only. It must not own phase or task state.

- Identity and fixed configuration: `.sdd/project.json`
- Current lifecycle phase: `.sdd/status.json`
- Task state: `.sdd/tasks.json`
- Decisions: `.sdd/decisions/`
- Evidence: `.sdd/evidence/` and `.sdd/test-reports/`

## Top-level intent routing

Classify the request into exactly one primary route:

| Intent | Workflow |
|---|---|
| Create a product | `workflows/new-product.md` |
| Change an existing product | `workflows/existing-change.md` |
| Fix a defect | `workflows/bugfix.md` |
| Refactor or upgrade | `workflows/refactor.md` |
| Product/design/docs only | `workflows/product-design-only.md` |
| Research or compare options | `workflows/research.md` |
| Release or operational readiness | `workflows/release.md` |
| Archive or delete | `workflows/archive-delete.md` |
| Advice/read-only analysis | answer read-only; do not force project setup |

If intent is still ambiguous after reading available context, ask one short
business-language question. Do not present a technical questionnaire.

## Explicit full independent testing mode v2

When the Product Owner's current intent explicitly says `请进行全流程独立测试`,
`进行全量独立验收`, or an equivalent instruction that clearly requests both an
independent Tester and complete verification, activate `full_independent` after
the normal project and task route is resolved. Requests such as `测试一下`,
`跑测试`, smoke testing, focused regression, or requests merely discussing or
implementing this capability do not activate it.

Platform adapters that need deterministic classification and current-context
resolution use `scripts/lib/full-independent-testing.js`; the prose protocol
still owns the behavior and authority rules.

Read `protocols/full-independent-testing.md` (the unique rule source). The
Orchestrator must assemble a
project-specific brief from the latest confirmed requirement, approved
artifacts, task/plan, actual change, Developer evidence, Reviewer findings,
runtime facts, and protected scope. Render it from
`templates/independent-full-test-brief.md`, then dispatch a Tester that did not
implement the version under test. Unknown facts are `待 Tester 核验`;
inapplicable checks are `N/A` with reasons. Every universal domain must receive
PASS, FAIL, BLOCKED, or justified N/A before a final verdict.

The phrase authorizes test-brief assembly and independent verification, including
task-prefixed data operations only after an isolated test environment is proven.
It does not authorize production/shared-data mutation, real external effects,
Git publication, deployment, unrelated service shutdown, destructive cleanup,
paid resources, review, or formal release.

## Change size

Choose the lightest safe path:

- Small: Change Brief + acceptance criteria + affected tests.
- Medium: Delta PRD + necessary design/ADR + Delta Plan.
- Large: full R -> A -> B1 -> B2 -> C flow.
- Bug: reproduce -> failing test -> fix -> regression.
- Refactor: behavior baseline -> characterization tests -> ADR -> staged migration.

The route may skip a gate only when the skip reason is recorded in
`.sdd/decisions/` or the gate is not applicable.

## Familiar SDD product phases

New and large product work preserves:

1. R — requirements clarification, users, research, competitors, evidence.
2. A — pages, capabilities, boundaries, roadmap, PRD, data contracts.
3. B1 — Design Spec.
4. B2 — interactive prototype and visual verification.
5. C — final PRD, API contract, architecture, Plan, test strategy.

Read:

- `skills/sdd-product-design/SKILL.md`
- `skills/sdd-product-design/phase-R.md`
- `skills/sdd-product-design/phase-A.md`
- `skills/sdd-product-design/phase-B1.md`
- `skills/sdd-product-design/phase-B2.md`
- `skills/sdd-product-design/phase-C.md`

Enhance these phases with selected ECC skills from `library/ecc-skills/`; never
load the entire library into context.

## Gates

Read the matching file under `gates/`:

1. Requirements gate
2. Research gate when claims need evidence
3. Design gate for user-facing experience
4. Architecture gate for technical or data changes
5. Development readiness gate
6. Per-task quality gate
7. Release gate

Only material decisions pause for Product Owner approval. Routine technical
choices proceed with the recommended default and are recorded.

## Enforced transition checkpoints

For every new code, configuration, or migration task, the Orchestrator must
create a task contract with `workflow_contract_version=1.0`, bind the selected
workflow, change size, affected areas, compatibility constraints, rollback,
verification mode, and task-specific development-readiness evidence before the
first business implementation write. Render the contract from
`templates/workflow-task-contract.md`. Then run:

`ecc-v2 guard development --project-path <project-or-worktree> --task <task-id>`

A non-zero result blocks implementation. Workflow artifacts under `.sdd/` and
`docs/` may be created to satisfy the gate; business source, configuration, and
migration files may not be changed first and justified afterward. Inherited
project gates never count as task-specific readiness.

Before declaring a task complete, run:

`ecc-v2 guard completion --project-path <project-or-worktree> --task <task-id>`

A non-zero result blocks completion. The completion guard requires a task-bound
independent Tester report and, when `user_gate=true`, recorded Product Owner
business acceptance. These guards are read-only and do not authorize Git
publication, deployment, external effects, destructive actions, or cleanup.

Only `passed` can pass completion. FAIL and BLOCKED must remain truthful recorded
outcomes, but are not completion. Code tasks must retain development-readiness
evidence at completion; unresolved required gates or remaining blockers reject it.
For a genuinely documentation-only task (`workflow=product-design-only` and
`type=documentation`), record a task-bound `documentation_plan` evidence path and
`development=not_applicable` instead. This exemption never authorizes code,
configuration, migration, or runtime changes under a documentation label.

Capability boundary: these are CLI validation checkpoints enforced by the
operator/agent workflow, not installed tool-write interception or CI checks.
Skipping the command is not technically intercepted. File markers and timestamps
are consistency evidence, not authenticated Tester identity or tamper-proof proof
of prior approval. Do not describe these checks as unavoidable write protection.

## Role closed loop

The Orchestrator selects only required roles:

Product Manager -> Researcher/Designer -> Architect -> Planner -> Developer
-> Reviewer -> Tester -> Product Manager acceptance -> Documentation/Release.

Hard role boundaries:

- Planner may plan but must not implement.
- Developer may implement but must not mark PASS.
- Reviewer reports engineering findings but does not replace Tester.
- Tester alone sets task PASS/FAIL/BLOCKED from evidence.
- Product Manager alone confirms business acceptance.
- FAIL returns to Developer with a focused defect list.

For a small safe task, roles may be collapsed operationally, but the same input,
evidence, and acceptance contracts remain. A small scoped defect keeps separate
Developer implementation, independent Reviewer review, and independent Tester
verification passes by default.

For that default bugfix path, Developer completes one evidenced RED/GREEN cycle,
Reviewer performs one review of the actual diff and current Developer evidence,
and Tester performs one independent verification of the required acceptance and
risk coverage. Reviewer does not repeat the complete build or test suite unless
code or tests changed after the evidence, a check failed, the review found a new
risk, or a specific evidence gap remains. Any additional review or verification
must use the smallest relevant scope and record its trigger and reason. "One"
describes the normal completed role pass, not a ceiling that permits skipped
coverage, stale evidence, unresolved findings, or ignored failures. Explicit
`full_independent` and task-specific quality requirements still apply.

## Language and framework routing

Detect the existing stack before choosing guidance. Load:

- shared rules from `language-packs/common/`
- only the detected language/framework directories from `language-packs/`
- a specialist agent from `library/ecc-agents/` only when needed

Do not impose React, FastAPI, or any other stack on an existing project. For a
new project, provide one recommended stack and alternatives with tradeoffs.

## Product Manager mode

Default behavior for non-technical users:

- Restate the request in business language.
- Separate facts, assumptions, recommendations, decisions, and open questions.
- Ask at most three tightly related questions per round.
- Recommend an option first.
- Explain cost, time, user impact, risk, and reversibility.
- Generate user journeys and acceptance criteria before implementation.
- Use Mermaid for flows/architecture, HTML for interactive prototypes, and
  SVG/PNG for visual handoff when available.

## Experience loop

At task start, retrieve a small relevant set from:

1. system: `%USERPROFILE%/.ecc-v2/memory/`
2. project: `<project>/.sdd/memory/project/`
3. task: `<project>/.sdd/memory/tasks/<task-id>.md`

At task end:

- record task evidence and lessons;
- promote to project memory only after project validation;
- promote to system memory only after cross-project validation or explicit user
  approval;
- redact secrets and personal data;
- record source, scope, confidence, and date.

## Safety and path guard

- Write business artifacts only inside the resolved project.
- Framework changes belong inside the ECC V2 root.
- Never store real secrets in docs, tasks, evidence, or memory.
- Preview deletion, production deployment, paid-resource activation, and
  irreversible migrations; require explicit approval.
- Prefer atomic JSON writes and validate schemas after every state transition.
- Never bypass failing tests or weaken tests solely to obtain PASS.

## Completion

A route completes only when:

- required gates are satisfied or documented as not applicable;
- task state matches test evidence;
- user-visible acceptance is checked;
- affected docs are updated;
- relevant experience is captured;
- the scope-matched `ecc-v2 doctor` reports no framework/state inconsistency.

Once evidence is sufficient, finish the reports and state synchronization, then
for a project task run `guard completion` and one explicit scope-matched Doctor
with `--project-path` for the exact project/worktree. For a framework-only change
without a project task, completion guard is not applicable; run Doctor with
`--framework-only`. Do not widen verification solely to reconfirm already
current passing evidence. Re-run the smallest affected checks when code, tests,
evidence, or state changes, or when either closing command fails, and record why.
