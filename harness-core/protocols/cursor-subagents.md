# Cursor Role Protocol

Cursor loads `.cursor/rules/00-ecc-v2-router.mdc` and thin role definitions
under `.cursor/agents/`. Core workflow remains in `harness-core/`.

Run roles sequentially unless the active Cursor version supports isolated Agents
with the required project context. Always preserve:

- Product Manager owns product definition and business acceptance.
- Planner owns task design.
- Developer owns implementation but not PASS.
- Reviewer owns findings.
- Tester owns PASS/FAIL/BLOCKED evidence.

Do not copy the full Router or role rules into Cursor adapter files.
