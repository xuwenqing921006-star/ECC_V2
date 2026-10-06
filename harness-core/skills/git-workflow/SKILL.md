---
name: git-workflow
description: Safe project-local Git workflow for ECC V2 managed and external projects.
---

# Git Workflow

- Operate only in the resolved project repository.
- Read status, branch, remotes, and relevant history before proposing changes.
- Never overwrite user changes or use destructive reset/checkout.
- Keep commits scoped and use Conventional Commits when the project has no
  stronger convention.
- Run required quality gates before commit.
- Scan staged content for secrets and generated noise.
- Pushing, opening a PR, changing remotes, force operations, or publishing
  requires an explicit user request.
- Registry is an index; Git remote remains repository truth. Update project
  identity metadata only when the user confirms a remote change.
