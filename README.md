# ECC V2

ECC V2 is a Windows-first Product-to-Code SDD harness for Product Owners and
non-expert programmers. It preserves the familiar SDD R/A/B1/B2/C product
phases and Planner -> Developer -> Tester loop, while using ECC capabilities
for research, design, architecture, implementation, verification, security,
documentation, and language-specific engineering.

## Supported surface

- Windows
- Claude Code
- OpenAI Codex
- Cursor
- Simplified Chinese (default)
- English

## Quick start

Node.js 20 or later is required.

```powershell
if (-not (Test-Path -LiteralPath '.\project-registry.json')) {
    Copy-Item -LiteralPath '.\project-registry.example.json' -Destination '.\project-registry.json'
}
.\\install.ps1
.\\ECC_V2.cmd doctor
.\\ECC_V2.cmd init demo --name "Demo Product" --type web
.\\ECC_V2.cmd dashboard
```

The machine-local `project-registry.json` is ignored by Git; only the blank example is tracked. Run the copy step above on first use. Existing registrations are preserved. Version and back up business projects separately.

Import an existing repository:

```powershell
.\\ECC_V2.cmd import "D:\\Work\\ExistingSystem" --id existing-system --name "Existing System"
```

The single workflow entry is `harness-core/router.md`. See
`docs/en-US/getting-started.md` for details.
