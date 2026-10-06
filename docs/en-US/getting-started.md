# Getting Started

## 1. Environment

Install Node.js 20 or later and open PowerShell in ECC_V2:

```powershell
if (-not (Test-Path -LiteralPath '.\project-registry.json')) {
    Copy-Item -LiteralPath '.\project-registry.example.json' -Destination '.\project-registry.json'
}
.\\install.ps1
.\\ECC_V2.cmd doctor
```

The machine-local `project-registry.json` is ignored by Git; only the blank example is tracked. Run the copy step above on first use. Existing registrations are preserved. Version and back up business projects separately.

## 2. Create a managed project

```powershell
.\\ECC_V2.cmd init inventory --name "Inventory System" --type web
```

The project is created under `Projects_Repo/inventory/` and becomes active.

## 3. Import an existing repository

```powershell
.\\ECC_V2.cmd import "D:\\Work\\Inventory" --id inventory --name "Inventory System"
```

Import does not move or overwrite business code. It adds only missing ECC V2/SDD
state and entry files.

## 4. Start a conversation

Open ECC_V2 or the project in Claude Code, Codex, or Cursor and describe the
product goal. Router selects the lightest safe SDD path.

## 5. Common commands

```powershell
.\\ECC_V2.cmd list
.\\ECC_V2.cmd current
.\\ECC_V2.cmd use inventory
.\\ECC_V2.cmd status
.\\ECC_V2.cmd doctor
.\\ECC_V2.cmd dashboard
```

## 6. Development and completion guards

Create the ECC V2 task contract and task-bound development-readiness evidence
before business implementation, then run:

```powershell
.\\ECC_V2.cmd guard development --project-path "D:\\Work\\Inventory" --task T-001
```

A non-zero exit blocks business source, configuration, and migration changes.
After the independent Tester report and task state are synchronized, run:

```powershell
.\\ECC_V2.cmd guard completion --project-path "D:\\Work\\Inventory" --task T-001
```

The guards are read-only. They do not authorize commit, push, deployment,
external effects, or cleanup.

Completion accepts PASS only. FAIL/BLOCKED remain non-completed outcomes. It
rechecks readiness evidence, prerequisite gates and blockers. Genuine docs-only
tasks record documentation_plan under the central contract with development set
to not_applicable, without inventing a code-development approval.

These are mandatory CLI checkpoints in the operator workflow, not installed
editor/tool interception or CI protection. Skipped commands do not prevent file
writes. Report markers cannot authenticate Tester identity or prove historical
approval timing. Non-bypassable enforcement needs a separate protected runner/CI.

ECC_V2.cmd uses Node from the current PATH; it does not switch versions. The
central CLI needs Node 20+ (verified here with 24.14.0). Keep the business
project's toolchain separate; do not invoke the central CLI after switching the
same process to an older business Node runtime.
