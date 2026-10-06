# Language and framework packs

These packs are imported from ECC and are read on demand after ECC_V2 detects the
project stack. They are guidance, not mandatory technology choices. Existing
projects keep their current stack unless the approved plan explicitly changes it.

ECC_V2 supports execution on Windows only. Claude Code, Codex, and Cursor must:

1. Read `common/` plus only the detected language/framework directories.
2. Translate any inherited Unix-flavoured example into an equivalent safe
   PowerShell or Windows command before execution.
3. Never require `bash`, WSL, `chmod`, `install.sh`, macOS, or Linux tooling.
4. Prefer commands already declared by the project, such as npm scripts, .NET
   commands, Gradle tasks, Maven goals, or Python test commands.
5. Treat examples as advisory. The project's own configuration and approved
   architecture take precedence.

Commonly detected directories include `typescript`, `python`, `java`, `golang`,
`rust`, `dotnet`, `web`, `angular`, `vue`, `nuxt`, `react-native`, `swift`,
`kotlin`, `php`, `ruby`, `arkts`, and `common`. A pack is loaded by reading its
Markdown files; no installation script is needed.

