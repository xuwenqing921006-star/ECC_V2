# ECC V2 Harness

ECC V2 keeps the SDD product lifecycle and uses ECC as its engineering engine.

Canonical entry: `harness-core/router.md`

Project modes:

- managed: `Projects_Repo/<project-id>/`
- external: repository stays at its existing path

Canonical project state:

- identity: `.sdd/project.json`
- lifecycle: `.sdd/status.json`
- tasks: `.sdd/tasks.json`

Platform adapters never own workflow logic.
