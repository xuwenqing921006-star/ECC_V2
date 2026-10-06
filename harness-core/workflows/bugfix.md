# Bugfix Workflow

1. Record expected behavior, actual behavior, environment, severity, and user
   impact under `.sdd/bug_fix/`.
2. Reproduce the defect or record why reproduction is blocked.
3. Trace the root cause; do not patch symptoms without explanation.
4. Add a failing regression test when technically possible.
5. Developer completes one RED/GREEN cycle by default: capture the failing test
   or other failure evidence, make the smallest safe fix, run the focused test
   and the task's declared technical checks, and record current evidence. When a
   failing automated test is not technically possible, record why.
6. An independent Reviewer completes one review pass based primarily on the
   actual code diff and current Developer test evidence. Check scope, security,
   test sufficiency, and adjacent failure modes; do not repeat the complete build
   or test suite by default.
7. An independent Tester completes one verification pass covering every required
   acceptance criterion, the regression test, the relevant suite, necessary
   quality gates, and the user-visible regression path. Developer evidence is an
   input that scopes the work, not a substitute for the Tester's own verdict.
8. Run an additional smallest relevant check only when code or tests changed, a
   check failed, a new risk was found, or a specific evidence gap remains. Record
   the trigger, reason, command, and result. "One" is the normal completed pass,
   not permission to omit coverage or leave a failed check unresolved.
9. PASS requires evidence. BLOCKED is valid when an external dependency prevents
   verification. Explicit `full_independent` or task-specific requirements are
   not reduced by this default.
10. When evidence is sufficient, promptly finish the bug and test reports,
    synchronize task/lifecycle state, run `guard completion`, and run the
    scope-matched Doctor. Do not broaden validation solely for repeated
    confirmation; if a closing check fails, resolve it and re-run the smallest
    affected scope.
11. Promote reusable lessons only when warranted by the experience protocol.

Never weaken an existing test merely to obtain green status.
