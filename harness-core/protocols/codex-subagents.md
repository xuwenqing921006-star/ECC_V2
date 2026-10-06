# Codex Role Protocol

Codex reads root/project `AGENTS.md` and uses `.codex/config.toml` role
definitions. Every role file is a thin pointer to `harness-core/agents/`.

The Orchestrator:

1. resolves project, route, phase, gates, and task;
2. dispatches only roles needed for the current step;
3. passes explicit inputs and output contract;
4. preserves Product Manager, Planner, Developer, Reviewer, and Tester boundaries;
5. writes state only through the role authorized to own that state.

If custom Codex roles are unavailable, simulate roles sequentially while keeping
their artifacts and authority boundaries. Developer still cannot mark PASS.

When the user explicitly requests full independent testing, the Orchestrator
must use `protocols/full-independent-testing.md`, create the rendered test brief,
and dispatch the configured `tester` role in a separate agent/context that did
not implement the version under test. A defect returns to a Developer working in
an isolated copy; a Tester not involved in that fix then re-tests the new version.
If the platform cannot provide that separation, state
the limitation and do not claim organizational independence.
