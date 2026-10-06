# Product-to-Code Protocol

## Product Owner experience

The user may provide only a goal or problem. The framework is responsible for
turning it into structured artifacts and executable tasks.

Pause only for:

- product scope or user-experience tradeoffs;
- material cost or paid resources;
- external account/credential ownership;
- destructive or irreversible operations;
- production deployment;
- final business acceptance.

Proceed with documented recommended defaults for routine engineering decisions.

## Artifact chain

Every downstream artifact must trace to upstream intent:

Product Brief -> research/decisions -> PRD -> journeys/flows -> Design Spec and
prototype -> architecture/API/data contracts -> Plan -> tasks -> code/tests ->
test evidence -> user/release documentation.

When an upstream decision changes, identify and update affected downstream
artifacts before implementation continues.

## Status vocabulary

- draft: incomplete and not approved;
- proposed: ready for decision;
- approved: accepted for downstream work;
- in_progress: actively being produced;
- passed: independently verified;
- failed: evidence contradicts acceptance;
- blocked: external condition prevents meaningful progress;
- superseded: replaced by a newer identified artifact.
