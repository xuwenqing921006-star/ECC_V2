# Start ECC V2

On Windows PowerShell:

```powershell
if (-not (Test-Path -LiteralPath '.\project-registry.json')) {
    Copy-Item -LiteralPath '.\project-registry.example.json' -Destination '.\project-registry.json'
}
.\\install.ps1
.\\ECC_V2.cmd doctor
.\\ECC_V2.cmd init my-product --name "My Product"
.\\ECC_V2.cmd dashboard
```

The machine-local `project-registry.json` is ignored by Git; only the blank example is tracked. Run the copy step above on first use. Existing registrations are preserved. Version and back up business projects separately.

Then open ECC V2 or the project in Claude Code, Codex, or Cursor and describe the
product need in natural language.

Examples:

- “我想做一个库存系统，先帮我完善需求，不要编码。”
- “修改当前系统的审批流程，先分析影响范围。”
- “这个页面报错，按 Bugfix 流程处理。”
- “先评估能否重构权限模块，给我分阶段方案。”
