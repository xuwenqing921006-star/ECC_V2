---
name: sdd-product-design
description: ECC V2 product lifecycle preserving SDD phases R, A, B1, B2, and C.
---

# ECC V2 SDD Product Design

## Purpose

Transform an idea into approved product, design, architecture, and delivery
artifacts before production development.

## Entry

1. Read `harness-core/router.md`.
2. Resolve the active managed or external project path.
3. Require `.sdd/project.json`, `.sdd/status.json`, and
   `.sdd/tasks.json`.
4. Read existing artifacts and continue from the first incomplete phase.
5. Detect product type and existing stack; do not impose a stack.

## Phases

- R: `phase-R.md` — clarification, users, research, evidence.
- A: `phase-A.md` — pages, capabilities, boundaries, MVP, roadmap, PRD,
  business/data/external-dependency contracts.
- B1: `phase-B1.md` — Design Spec.
- B2: `phase-B2.md` — prototype and design verification.
- C: `phase-C.md` — final PRD, API/data contracts, architecture, Plan,
  test and release strategy.

Update `.sdd/status.json` after each approved phase. A phase may be waived
only with a decision record explaining why.

## ECC enhancements

Load only when needed:

- product definition: `library/ecc-skills/product-capability` and
  `product-lens`;
- research: `market-research`, `competitive-platform-analysis`, and
  `deep-research`;
- design: `frontend-design-direction`, `design-system`, and
  `accessibility`;
- architecture: `api-design`, `architecture-decision-records`, and
  `hexagonal-architecture` where relevant;
- delivery: `blueprint`, `tdd-workflow`, `verification-loop`,
  and `security-review`.

## Communication

Default to Product Manager mode. Recommend one option, explain product impact,
and ask no more than three related questions per round.

## Completion

Phase C does not start development automatically. Pass
`harness-core/gates/development.md` and wait for explicit instruction.
