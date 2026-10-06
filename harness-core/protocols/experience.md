# Three-Level Experience Protocol

## Locations

1. Task: `<project>/.sdd/memory/tasks/<task-id>.md`
2. Project: `<project>/.sdd/memory/project/`
3. System: `%USERPROFILE%/.ecc-v2/memory/`

## Required fields

- title;
- observed context;
- root cause or decision;
- validated action;
- evidence;
- scope;
- source project/task;
- date;
- confidence from 0 to 1;
- secret/privacy review.

## Promotion

- Task -> Project: validated in the project and likely reusable there.
- Project -> System: validated across projects or explicitly approved by the
  Product Owner.
- Never promote a workaround whose cause is unknown.
- Never promote credentials, personal data, customer data, or project-confidential
  values.

## Retrieval

Rank by relevance, scope, confidence, recency, and evidence. Inject at most five
items by default. Include provenance and allow the active project to override a
system-level default.
