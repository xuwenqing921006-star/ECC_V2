# 框架架构

`harness-core/router.md` 是唯一流程入口。Claude Code、Codex 和 Cursor
目录只提供薄适配。项目状态分为身份、阶段和任务三个事实源，使用 Schema、
原子写入、审计日志和 Doctor 防止漂移。

ECC 的 Agents、Skills 和语言规则位于 `harness-core/library/` 与
`harness-core/language-packs/`，由 Router 按需加载，不整体注入上下文。
