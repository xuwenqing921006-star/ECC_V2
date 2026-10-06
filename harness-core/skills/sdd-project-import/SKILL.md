---
name: sdd-project-import
description: Non-destructively onboard an existing repository in place.
---

# Existing Repository Import

Use:

```powershell
.\\ECC_V2.cmd import "D:\\Path\\Repository" --id project-id --name "Project Name"
```

Import keeps the repository in place and creates only missing ECC V2 entry,
`.sdd/`, and document scaffold files. Existing business files are never
overwritten.

After import:

1. run Doctor;
2. detect stack, runtime, build, test, Git, and external services;
3. use codebase onboarding/spec mining;
4. reconstruct current product and architecture facts;
5. mark generated facts as Draft until verified;
6. route changes through maintenance.

Legacy SDD state uses `ECC_V2.cmd migrate <path>` as a dry run before
`--apply`.
