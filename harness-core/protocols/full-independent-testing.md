# Full Independent Testing Protocol v2

## Purpose and rule ownership

Turn an explicit Product Owner request for full independent testing into a
project-specific brief, a complete applicability matrix, and an evidence-backed
Developer/Tester loop. This central protocol and its referenced domain catalog
are the only rule source. Project briefs adapt these rules to one task; project
entries and global Skills must link here instead of copying the protocol.

`full_independent` is an enhanced verification mode, not the default test path.
Existing focused tasks and v1 full-independent tasks remain valid.

## Exact trigger

Activate `full_independent` only when the user's current intent explicitly asks
to execute complete independent verification, for example:

- `请进行全流程独立测试`
- `进行全量独立验收`
- `交给独立 Tester 做完整验收`

Equivalent wording must contain both meanings: independent Tester ownership and
complete/systematic coverage. Do not activate it for `测试一下`, `跑测试`, smoke
testing, a focused regression, a local check, or a request that merely discusses,
documents, implements, disables, or quotes this capability. Negation such as
`不要/不用/暂不进行全流程独立测试` never activates it. Ambiguous test requests
stay on the focused Tester path.

## Project and task resolution

Resolve before writing:

1. If the working directory is inside an ECC_V2 project with `.sdd/project.json`,
   use that project after matching its real path and identity to the registry.
2. Otherwise use the project explicitly named or pathed by the user.
3. Otherwise use `project-registry.json.active_project_id`.
4. Select `status.current_task` when present. Otherwise select the single
   `in_progress` task, or the single non-terminal task when unambiguous.
5. If project or task selection is ambiguous, report `BLOCKED` and request only
   the missing choice. Never guess or create an unrelated task.

The task id must satisfy `^T-[0-9]{3,}$`. Preserve fixed brief/report paths and
real-path containment checks from the Doctor contract.

## Authority boundary

The trigger authorizes brief assembly and independent verification. In a
confirmed isolated test environment it also authorizes task-prefixed test
accounts, configuration and business data, plus necessary create/update/delete,
publish/unpublish, state-transition and controlled-concurrency operations.
Deletion is limited to data created by this test run.

The trigger does not authorize Git commit/push/merge. It also does not authorize
production mutation, real money, real SMS/email/external
notification, actual invoicing, paid resources, Git commit/push/merge, deployment,
WeChat review, formal release, clearing databases, broad table updates, deleting
pre-existing data, stopping unrelated services, or changing unrelated logging or
security settings. Those remain separate explicit gates.

Before any mutation the Tester must prove and record code/repository identity,
actual running artifact, processes/ports, database/cache/middleware destinations,
external-service destinations, and separation from production/shared data. When
isolation cannot be proved, continue safe read-only checks and mark the affected
domain `BLOCKED`; do not broaden authority.

## Orchestrator assembly

Read only relevant confirmed requirements, approved artifacts/decisions, task
state, Developer evidence, Reviewer findings, actual diff, runtime facts, and
protected scope. Precedence is:

1. latest explicit user confirmation;
2. approved product and technical artifacts;
3. approved task/plan;
4. current implementation and runtime facts;
5. Developer evidence and Reviewer findings.

Developer evidence is an input, never proof of PASS. Do not treat the current
implementation as the business rule when it conflicts with confirmed intent.

Read [the v2 universal domain catalog](references/full-independent-test-domains-v2.md),
then render `harness-core/templates/independent-full-test-brief.md` to:

`.sdd/test-briefs/full-test-<task-id>.md`

Replace every placeholder. Unknown facts are `待 Tester 核验`; unsafe unknowns
are explicit `BLOCKED`. Every catalog domain appears in the project-specific
matrix as applicable or `N/A + reason`; examples are prompts for further risk
derivation, not a scope ceiling. Scope is the requirement plus affected
regression surface, not an unbounded audit of the whole product.

After the brief exists, update the task atomically. New v2 tasks should use:

```json
{
  "verification_mode": "full_independent",
  "verification_protocol_version": "2.0",
  "verification_scope": {
    "summary": "project-specific scope",
    "domains": ["requirements", "environment_identity", "regression"]
  },
  "test_data_disposition": "retain_for_product_owner_retest",
  "test_brief": ".sdd/test-briefs/full-test-<task-id>.md"
}
```

These new fields are optional for backward compatibility. Do not retrofit old
tasks or copy the protocol into existing projects.

## Independent execution and defect loop

Dispatch a Tester that did not implement the version under test. The Tester must
derive traceable requirement, entry/role, function/action, state, data and domain
matrices before execution; then execute every applicable row through the actual
layers that exist. Developer tools, mocks, real browser/device, and real external
chains are distinct evidence classes and cannot substitute for one another.

For each domain, record only `PASS`, `FAIL`, `BLOCKED`, or `N/A + reason`.
Unexecuted applicable work is `BLOCKED`, never PASS. Preserve reproduction
evidence before handing a defect back. The Tester must not edit business code.

Developer performs the smallest authorized fix in an isolated copy and records
local evidence. A Tester that did not implement that fix re-resolves the new
version and re-tests the defect plus affected regression surface. Developer
self-test, isolated-fix checks, test-environment re-test, Product Owner business
acceptance, commit, push, deployment, review and formal release remain separate
states and must be reported separately.

When a separate agent is unavailable, disclose that limitation, keep a distinct
Tester context, and do not claim organizationally independent QA.

## Test-data disposition

The v2 default is `retain_for_product_owner_retest`: retain this run's accounts,
data and key intermediate states, and output a complete password-free index plus
manual re-test steps. Disable or neutralize anything that could continue charging,
notifying, scheduling, publishing, or affecting external systems.

Use `clean_created_data_only` only when the task or Product Owner explicitly
requires cleanup; delete only this run's indexed creations. Never delete
pre-existing data. Record the final disposition and residual-risk check.

## Report and verdict contract

Write `.sdd/test-reports/test-<task-id>.md` before changing task status. The v2
report contains coverage, defects/re-tests, evidence, untested/blocking items,
retained account/data index, and Product Owner manual re-test steps. It includes
one `ECC_TEST_DOMAIN` line for every domain in the central catalog, with a reason
after `|` for `N/A`:

```text
ECC_TEST_DOMAIN: ui PASS | evidence path
ECC_TEST_DOMAIN: external_real_chain N/A | no external chain exists in scope
```

It must contain exactly one task marker and one verdict marker:

```text
ECC_TEST_TASK: <task-id>
ECC_TEST_VERDICT: PASS
```

Use `FAIL` or `BLOCKED` when applicable. Any domain FAIL makes the final verdict
FAIL. Otherwise any applicable BLOCKED makes it BLOCKED. PASS requires every
domain to be PASS or justified N/A, all high/critical defects independently
re-tested, and retained/cleaned data made safe. The task status and unique
verdict must agree.

Technical PASS moves only to Product Manager/Product Owner business acceptance;
it does not imply or authorize commit, push, merge, deployment, review, or release.
