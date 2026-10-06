# Backend and Service Development Standard

## Stack

Detect and preserve existing architecture. For new projects use only the phase C
decision. Do not require PyCore, FastAPI, Node, Java, .NET, Go, Rust, or another
stack unless selected for that project.

## Boundaries

- Separate transport, application/domain behavior, and infrastructure according
  to the project's architecture.
- Validate input and external responses.
- Enforce authentication and authorization explicitly.
- Use parameterized data access and transactions where needed.
- Keep configuration outside source and never hardcode secrets.
- Return stable, documented errors without sensitive details.

## Reliability

- Define timeouts, retry/idempotency behavior, concurrency, and failure modes for
  external operations.
- Add structured logs without private data, health checks, and observability
  appropriate to risk.
- Design migrations for forward application, compatibility window, and rollback.

## Verification

Use the project-selected build, type/static analysis, lint, unit, integration,
contract, security, and performance checks. Scope commands to owned code rather
than unrelated vendored dependencies.
