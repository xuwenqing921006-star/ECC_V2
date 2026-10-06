# Product State Model

Status: Draft

Delete this file only when the product has no meaningful lifecycle state. Every
transition should name its trigger, permissions, side effects, and failure rule.

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted: submit
    Submitted --> Approved: approve
    Submitted --> Rejected: reject
    Rejected --> Draft: revise
    Approved --> [*]
```

## Transition rules

| From | Trigger | To | Who | Preconditions | Side effects | Failure behavior |
|---|---|---|---|---|---|---|

