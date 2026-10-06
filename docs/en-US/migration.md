# Migrating from SDD V7.1

Migration is a dry run by default:

```powershell
.\\ECC_V2.cmd migrate "D:\\Project"
```

Apply only after review:

```powershell
.\\ECC_V2.cmd migrate "D:\\Project" --apply
```

Backups are created beside original state files. Legacy tasks marked passed
without test evidence are reported by Doctor; ECC V2 never invents evidence.
