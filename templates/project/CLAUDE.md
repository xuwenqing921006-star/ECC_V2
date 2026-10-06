# ECC V2 Project Entry

Read `__HARNESS_ROOT__/harness-core/router.md`, then resolve this project's
`.sdd` state. Platform instructions are adapters; the external Router owns the
workflow.

Explicit full-independent testing is resolved by that central Router. Do not
copy its protocol into this project.

For code, configuration, or migration work, use the central Router's read-only
development and completion guards for this exact project/worktree and task. A
non-zero guard result blocks the transition.
