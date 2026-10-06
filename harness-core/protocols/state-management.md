# State Management Protocol

## Sources of truth

- Registry: project index and active pointer only.
- `.sdd/project.json`: identity and fixed configuration only.
- `.sdd/status.json`: lifecycle phase and gates only.
- `.sdd/tasks.json`: task execution state only.
- Test reports: evidence, not an independent status database.

## Write rules

1. Read and validate current JSON.
2. Write the complete new value to a same-directory temporary file.
3. Replace atomically.
4. Re-read and validate.
5. Append an audit event without secrets.

The registry must derive display status from project state; it must never store a
second writable copy of phase status.

Tester changes task status to passed/failed/blocked only after writing evidence.
If evidence and task status disagree, Doctor fails.
