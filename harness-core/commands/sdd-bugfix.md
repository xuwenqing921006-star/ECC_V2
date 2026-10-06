# /sdd-bugfix - BUG 修复

## 用法

`/sdd-bugfix <用户看到的问题、预期结果和实际结果>`

该命令保留原 SDD 使用习惯，但由 ECC_V2 Router 调度，并执行
`harness-core/workflows/bugfix.md` 与
`harness-core/skills/sdd-bugfix/SKILL.md`。

## 闭环

1. 保存用户原话，补齐复现环境、步骤、预期结果和实际结果。
2. 先读任务级、项目级、系统级经验；系统级经验位于
   `%USERPROFILE%/.ecc-v2/memory/`。
3. 复现并保留失败证据，不凭猜测修改代码。
4. 定位根因，规划最小安全修复及回归范围。
5. Developer 实施修复；Reviewer 检查风险；Tester 独立复现并回归。
6. Tester 有真实证据后才可把任务标记为 `passed`。
7. 修复报告写入 `.sdd/bug_fix/`，测试证据写入 `.sdd/evidence/`。
8. 新经验先写任务级；稳定、可复用且已验证的经验才晋升到项目级或系统级。

## 完成报告

向用户说明问题、根因、修复、验证结果、修改文件、证据位置和经验晋升情况。
如果无法复现或验证，状态必须为 `blocked` 或 `failed`，不得宣称已修复。
