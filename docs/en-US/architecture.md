# Framework Architecture

`harness-core/router.md` is the only workflow entry. Claude Code, Codex, and
Cursor directories are thin adapters. Project identity, lifecycle phase, and
task execution have separate sources of truth protected by schemas, atomic
writes, audit logs, and Doctor checks.

ECC agents, skills, and language rules live under `harness-core/library/` and
`harness-core/language-packs/` and are loaded on demand.
