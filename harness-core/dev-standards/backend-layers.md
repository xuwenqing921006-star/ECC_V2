# Service Layering Standard

Layering is a means, not a mandatory folder template.

- Transport adapters parse protocol input and map output.
- Application/domain code owns business rules and use cases.
- Repositories/gateways isolate storage and external providers.
- Configuration and runtime wiring stay at composition boundaries.
- Domain behavior must not depend directly on UI or transport details.
- Existing project conventions win unless an approved ADR changes them.

Avoid pass-through layers with no boundary value. Refactors must preserve public
contracts and be protected by characterization tests.
