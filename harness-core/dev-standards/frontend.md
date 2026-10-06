# Frontend Development Standard

## Stack selection

- Existing projects keep their supported framework, package manager, component
  system, routing, state, data, testing, and build conventions.
- New projects use the stack approved in phase C. Architect recommends one
  option based on team skill, product shape, accessibility, performance,
  deployment, ecosystem, and long-term maintenance.
- Load only matching ECC language/framework packs.

## Product fidelity

- Implement approved journeys, content, navigation, permissions, and page states.
- Cover loading, empty, error, offline where relevant, permission, success, and
  destructive confirmation states.
- Follow Design Spec and prototype while treating the prototype as design
  evidence, not production source.
- Meet responsive and accessibility requirements.

## Engineering

- Keep view, state, data access, and domain logic boundaries consistent with the
  project.
- Validate external data at boundaries.
- Centralize API contracts and errors.
- Avoid hidden global state and unbounded side effects.
- Add component/unit tests and E2E coverage for critical journeys.
- Run the project's actual format, lint, type, test, and build commands.

## Mock to real

Mock data must follow approved contracts. Every mock task states replacement
criteria. Real-integration tasks prove requests hit the real configured service
and remove user-visible mock-only behavior.
