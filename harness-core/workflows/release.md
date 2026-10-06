# Release and Operational Readiness Workflow

1. Freeze the intended release scope.
2. Run the release gate.
3. Verify migration, backup, rollback, environment variables, and external
   accounts.
4. Generate release notes, deployment guide, user guide, and known limitations.
5. Run a smoke test in the target-like environment.
6. Require explicit approval before production deployment.
7. Record release evidence, version, date, and rollback point.
8. Feed production lessons into project memory.
