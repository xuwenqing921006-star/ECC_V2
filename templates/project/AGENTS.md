# ECC V2 Project Entry

This project is managed by ECC V2.

1. Read `__HARNESS_ROOT__/harness-core/router.md`.
2. Read `.sdd/project.json` and `.sdd/status.json`.
3. Use `.sdd/tasks.json` as the only task-state source.
4. Keep all business changes inside this project.
5. For an explicit `请进行全流程独立测试` request, follow the central Router;
   never copy the full-independent protocol into this project.
6. Before business implementation and before declaring completion, run the
   central Router's `guard development` or `guard completion` checkpoint for
   this exact project/worktree and task. A non-zero result is a hard stop.

Default locale: Simplified Chinese.
