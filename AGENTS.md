# ECC V2 — Codex Entry

ECC V2 is a Windows-first Product-to-Code SDD harness. It preserves the familiar
SDD product phases and uses ECC capabilities for implementation, verification,
security, documentation, and language-specific work.

Before project work:

1. Read `harness-core/router.md`.
2. Resolve the active project through `project-registry.json`, unless the user
   explicitly supplies an external project path.
3. Read only the workflow, gates, roles, and language packs selected by Router.
4. Keep business files inside the selected project.

Default user language is Simplified Chinese. Explain technical decisions in
plain product language and provide a recommended option.

Never let Developer mark its own task as passed. Tester owns task verification.
Product Manager owns business acceptance. Destructive actions, paid services,
production deployment, and irreversible migrations require explicit approval.

For a small scoped defect, default to one complete Developer RED/GREEN cycle,
one independent Reviewer pass, and one independent Tester verification pass.
Reviewer works from the actual diff and current Developer test evidence and does
not repeat the whole build or test suite by default. Re-run only the smallest
relevant checks when code or tests changed, a check failed, a new risk appeared,
or evidence is missing, and record the reason. "One" never permits missing
required coverage or ignoring a failed check.

For business code, configuration, or migration work, the central Router's
`guard development` must pass for the exact project/worktree and task before
implementation. `guard completion` must pass before reporting completion. Do
not replace either checkpoint with prose or post-hoc documentation.

These CLI checkpoints are workflow requirements, not installed tool-write or CI
interception. Report their actual validation scope; do not claim that arbitrary
file writes are technically blocked or that report markers authenticate authors.
