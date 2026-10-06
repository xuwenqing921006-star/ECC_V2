# Platform Adapter Protocol

Supported tools:

- Claude Code
- OpenAI Codex
- Cursor

`harness-core/` is canonical. Root adapters and project-local entries only
point to the canonical Router and role files.

Framework adapters:

- `.claude/`
- `.codex/`
- `.cursor/`

Imported or managed projects receive minimal `AGENTS.md`, `CLAUDE.md`,
and Cursor rule pointers containing the ECC V2 root path. These project entries
are generated pointers, not copies of workflow behavior.

Adapter tests must verify:

- a core reference exists;
- no adapter duplicates Router sections;
- no unsupported platform is required;
- project templates replace the harness path;
- role authority is consistent across tools.

Tool limitations may change execution mechanics but never state ownership or
quality gates.
