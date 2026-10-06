# Workflows

ECC V2 supports new products, changes to existing systems, bug fixes, refactors,
product/design-only work, research, release, and archive/delete. Router first
classifies intent and risk, then selects a full or shortened path.

Full new-product path:

`R -> A -> B1 -> B2 -> C -> development gate -> Planner -> Developer -> Reviewer -> Tester -> product acceptance -> release`

Small changes use a Change Brief, medium work uses a Delta PRD, and only large
work runs every product phase. See `harness-core/workflows/` and
`harness-core/gates/`.
