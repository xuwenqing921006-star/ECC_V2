# User Flow

Status: Draft

Replace the example after requirements are approved. Show the happy path,
important alternatives, permission denial, validation failure, and recovery.

```mermaid
flowchart TD
    Start([User starts]) --> Intent[Primary intent]
    Intent --> Valid{Input valid?}
    Valid -->|Yes| Success([Visible success])
    Valid -->|No| Recovery[Explain problem and recovery]
    Recovery --> Intent
```

## Flow rules

- Entry conditions:
- Exit conditions:
- Permission rules:
- Failure and recovery:

