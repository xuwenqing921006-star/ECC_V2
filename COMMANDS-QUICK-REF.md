# ECC V2 Windows Command Reference

```powershell
.\\ECC_V2.cmd help
.\\ECC_V2.cmd doctor
.\\ECC_V2.cmd init <id> --name "<name>" --type <type>
.\\ECC_V2.cmd import "<path>" --id <id> --name "<name>" --type <type>
.\\ECC_V2.cmd list
.\\ECC_V2.cmd current
.\\ECC_V2.cmd use <id>
.\\ECC_V2.cmd status
.\\ECC_V2.cmd set-status <phase> <state>
.\\ECC_V2.cmd set-gate <gate> <pending|passed|waived|not_applicable|failed|blocked>
.\\ECC_V2.cmd migrate "<legacy-sdd-path>"
.\\ECC_V2.cmd migrate "<legacy-sdd-path>" --apply
.\\ECC_V2.cmd dashboard
```

Natural-language project requests are routed by `harness-core/router.md`.
