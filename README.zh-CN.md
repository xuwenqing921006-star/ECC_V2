# ECC V2

ECC V2 是一套面向 Windows、产品经理和编程初学者的 Product-to-Code SDD
框架。它保留 SDD 的 R、A、B1、B2、C 产品阶段和
Planner -> Developer -> Tester 主循环，并使用 ECC 增强调研、设计、架构、
编码、测试、安全、文档和多语言开发能力。

## 支持范围

- Windows
- Claude Code
- OpenAI Codex
- Cursor
- 简体中文（默认）
- 英语

项目可以使用 `Projects_Repo/` 托管，也可以保留在任意外部路径。

## 快速开始

要求 Node.js 20 或更高版本。

```powershell
if (-not (Test-Path -LiteralPath '.\project-registry.json')) {
    Copy-Item -LiteralPath '.\project-registry.example.json' -Destination '.\project-registry.json'
}
.\\install.ps1
.\\ECC_V2.cmd doctor
.\\ECC_V2.cmd init demo --name "演示项目" --type web
.\\ECC_V2.cmd current
.\\ECC_V2.cmd dashboard
```

项目登记表 `project-registry.json` 仅保存在本机，Git 只跟踪空白示例。首次使用时执行上面的复制步骤；已有登记表不会被覆盖。业务项目应单独进行版本管理和备份。

已有项目：

```powershell
.\\ECC_V2.cmd import "D:\\Work\\ExistingSystem" --id existing-system --name "已有系统"
```

迁移旧 SDD 项目默认只预览：

```powershell
.\\ECC_V2.cmd migrate "D:\\Work\\OldSddProject"
.\\ECC_V2.cmd migrate "D:\\Work\\OldSddProject" --apply
```

## 产品主流程

`R -> A -> B1 -> B2 -> C -> Planner -> Developer -> Reviewer -> Tester -> 产品验收`

- R：需求澄清、用户与调研
- A：页面、功能、MVP、Roadmap、PRD、数据契约
- B1：Design Spec
- B2：交互原型
- C：最终 PRD、架构、API、Plan、测试策略

系统会根据任务大小缩短流程。小改动不强制重走完整产品阶段。

## 主要入口

- `harness-core/router.md`：唯一 Router
- `project-registry.json`：项目索引和活动项目
- `harness-core/workflows/`：新建、修改、Bugfix、重构、调研和发布
- `harness-core/gates/`：需求到发布门禁
- `harness-core/agents/`：产品与开发角色
- `harness-core/library/`：ECC Agents 和精选 Skills
- `harness-core/language-packs/`：按项目加载的语言规则

详细说明见 `docs/zh-CN/getting-started.md`。
