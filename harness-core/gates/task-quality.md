# Per-Task Quality Gate

PASS requires:

- for a small scoped defect, one current evidenced Developer RED/GREEN cycle and
  one independent Reviewer pass over the actual diff and that evidence;
- acceptance criteria verified individually;
- build/type/lint/test commands appropriate to the project;
- changed behavior covered by tests;
- diff and scope review;
- security review proportional to risk;
- no real secret in code, docs, logs, evidence, or memory;
- Tester report with reproducible evidence;
- task status synchronized with that report;
- every failed check and required finding resolved or truthfully reported as
  FAIL/BLOCKED;
- any additional check caused by code/test changes, failure, new risk, or an
  evidence gap limited to the smallest relevant scope with its reason recorded.

One completed pass is the small-defect default, not a waiver for required
coverage, failed checks, Tester independence, `full_independent`, or any
task-specific quality requirement. Current passing evidence should not be
repeated or broadened solely for confirmation.
