# 工作流

ECC V2 支持新产品、已有系统修改、Bugfix、重构、产品设计、调研、发布以及
归档/删除。Router 会先判断意图和风险，再选择完整或精简流程。

完整新产品流程：

`R -> A -> B1 -> B2 -> C -> 开发门禁 -> Planner -> Developer -> Reviewer -> Tester -> 产品验收 -> 发布`

小改动使用 Change Brief；中型需求使用 Delta PRD；大型需求才走完整产品阶段。
详细规则位于 `harness-core/workflows/` 和 `harness-core/gates/`。
