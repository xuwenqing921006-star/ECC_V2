# ECC reference library

This directory preserves selected ECC agents and skills as an on-demand expert
library. It does not replace `harness-core/router.md`, the ECC_V2 roles, gates,
or project-specific instructions.

Precedence is:

1. User-approved requirements and decisions
2. Project-local instructions and detected stack
3. ECC_V2 Router, gates, roles, and Windows safety rules
4. The reference agent or skill in this directory

ECC_V2 runs on Windows only. Commands copied in an upstream reference may use
Unix syntax for illustration; an adapter must convert them to safe PowerShell or
native Windows commands before execution. References must never introduce WSL,
bash, macOS, or Linux as a project requirement.

