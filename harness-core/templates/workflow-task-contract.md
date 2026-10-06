# ECC V2 Enforced Workflow Task Contract v1

Use this central template for every new code, configuration, or migration task.
Copy only the rendered task object into the project's `.sdd/tasks.json`; do not
copy this protocol file into a business project.

```json
{
  "id": "T-001",
  "title": "User-readable task title",
  "type": "feature",
  "description": "Bounded behavior and non-scope",
  "acceptanceCriteria": ["Observable user or business outcome"],
  "technicalChecks": ["Executable build, test, security, and migration checks"],
  "dependencies": [],
  "affectedAreas": ["Exact modules or runtime components"],
  "compatibilityConstraints": ["Behavior and data that must remain unchanged"],
  "migrationRollback": "Migration and rollback plan, or an explicit no-migration statement.",
  "status": "in_progress",
  "user_gate": true,
  "evidence": null,
  "verification_mode": "focused",
  "workflow_contract_version": "1.0",
  "workflow": "existing-change",
  "change_size": "small",
  "development_readiness": {
    "status": "passed",
    "checked_at": "2026-01-01T00:00:00.000Z",
    "baseline": "Exact Git/runtime/test baseline",
    "authorization": "Product Owner instruction that starts development",
    "evidence": ".sdd/evidence/T-001-development-readiness.md"
  }
}
```

Allowed workflows are `new-product`, `existing-change`, `bugfix`, `refactor`,
`product-design-only`, `research`, `release`, and `archive-delete`. Allowed
change sizes are `small`, `medium`, `large`, `bug`, `refactor`, `release`, and
`maintenance`.

The readiness evidence must name the task and record the selected workflow,
gate decisions or waivers, approved artifacts, exact baseline, test strategy,
external-service boundary, migration/rollback decision, and the Product Owner's
instruction to start. It must exist before business implementation begins.

Every focused or full-independent terminal Tester report must contain exactly:

```text
ECC_TEST_TASK: T-001
ECC_TEST_VERDICT: PASS|FAIL|BLOCKED
ECC_TEST_INDEPENDENT: true
```

If `user_gate=true` and the task is passed, also add:

```json
"business_acceptance": {
  "status": "accepted",
  "evidence": ".sdd/evidence/T-001-business-acceptance.md"
}
```

Run `guard development` before business implementation and `guard completion`
before reporting completion. Neither command grants Git, deployment, external-
effect, destructive-action, or cleanup authority.

Completion accepts PASS only; FAIL/BLOCKED reports record a non-completed outcome.
Readiness evidence is checked again at completion. Evidence files must be nonempty
and physically inside the project, including when junctions/symlinks are involved.
Only the registered project or its actual Git worktree is accepted.

For documentation-only maintenance, use `workflow: product-design-only`,
`type: documentation`, and `documentation_plan: .sdd/changes/T-001-plan.md`.
The plan must name the task and record scope, authorization, baseline, checks,
and rollback. Set development gate to `not_applicable`; do not fabricate a code
readiness approval. This route cannot include business code/configuration changes.

These commands validate records when invoked. They do not intercept editor/tool
writes or install CI enforcement, and report markers do not authenticate authors.
