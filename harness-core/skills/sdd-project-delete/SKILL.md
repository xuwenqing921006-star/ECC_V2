---
name: sdd-project-delete
description: Safely archive, unregister, or delete a precisely resolved project.
---

# Archive or Delete Project

Prefer archive. Before any deletion show:

- project id/name;
- managed or external mode;
- absolute path;
- Git status and remote;
- registry effect;
- exact files/directories affected;
- recovery options.

For an external project, default to unregister-only. Never delete an external
directory without explicit confirmation naming the path.

For a managed project, deletion still requires explicit confirmation naming the
project. Validate that the resolved target is a direct child of the configured
`Projects_Repo` root. Never delete the root, framework, or adapters.

Update registry atomically and report recovery status.
