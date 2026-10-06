# 快速开始

## 1. 环境

安装 Node.js 20 或更高版本，然后在 PowerShell 中进入 ECC_V2：

```powershell
if (-not (Test-Path -LiteralPath '.\project-registry.json')) {
    Copy-Item -LiteralPath '.\project-registry.example.json' -Destination '.\project-registry.json'
}
.\\install.ps1
.\\ECC_V2.cmd doctor
```

项目登记表 `project-registry.json` 仅保存在本机，Git 只跟踪空白示例。首次使用时执行上面的复制步骤；已有登记表不会被覆盖。业务项目应单独进行版本管理和备份。

## 2. 新建托管项目

```powershell
.\\ECC_V2.cmd init inventory --name "库存管理系统" --type web
```

项目创建在 `Projects_Repo/inventory/`，并自动成为活动项目。

## 3. 导入已有项目

```powershell
.\\ECC_V2.cmd import "D:\\Work\\Inventory" --id inventory --name "库存管理系统"
```

导入不会移动或覆盖业务代码，只补充缺失的 ECC V2/SDD 状态和入口。

## 4. 开始对话

在 Claude Code、Codex 或 Cursor 中打开 ECC_V2 或业务项目，直接描述：

> 我想做一个库存管理系统，先帮我完善需求，不要开始编码。

Router 会进入产品经理模式，并选择合适的 SDD 阶段。

## 5. 常用命令

```powershell
.\\ECC_V2.cmd list
.\\ECC_V2.cmd current
.\\ECC_V2.cmd use inventory
.\\ECC_V2.cmd status
.\\ECC_V2.cmd doctor
.\\ECC_V2.cmd dashboard
```

## 6. 开发与收尾检查门禁

新任务先创建 ECC_V2 任务合同和本任务专属的开发就绪证据，再进入业务代码：

```powershell
.\\ECC_V2.cmd guard development --project-path "D:\\Work\\Inventory" --task T-001
```

退出码非零时不得修改业务源码、配置或迁移文件。完成独立 Tester 报告并同步
任务状态后，再执行：

```powershell
.\\ECC_V2.cmd guard completion --project-path "D:\\Work\\Inventory" --task T-001
```

门禁只检查状态和证据，不授权提交、推送、部署、外部副作用或清理。

完成检查只接受 PASS，FAIL/BLOCKED 是未完成结果。完成时会再次检查开发就绪
证据、前置阶段和阻塞项；真实的纯文档任务按中央合同记录 documentation_plan，
development 标为 not_applicable，不补造代码开发许可。

当前实现是必须执行的 CLI 检查约定，尚未接入编辑工具拦截或 CI；跳过命令的
写文件行为不会被程序自动阻止。报告标记也不能认证 Tester 身份或证明批准的
历史时间。若需要不可跳过的技术约束，仍需单独接入受保护执行入口/CI。

ECC_V2.cmd 使用当前 PATH 中的 Node，不会自动切换版本。中央工具需 Node 20+
（本次验证为 Node 24.14.0），业务项目仍使用其指定工具链；不要在切换到旧版
业务 Node 的进程中直接运行中央命令。
