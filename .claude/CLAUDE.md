# ECC V2 Claude Code Adapter

Read `../harness-core/router.md` before project work. Use the active project
from `../project-registry.json` unless the user supplies an external path.

This file is an adapter only. Product phases, gates, role contracts, safety, and
experience rules live under `harness-core/`.

Run the central Router's development and completion guards for the exact
project/worktree and task. A non-zero guard result blocks the transition.
