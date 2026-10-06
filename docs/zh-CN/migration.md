# 从 SDD V7.1 迁移

迁移命令默认只展示变更：

```powershell
.\\ECC_V2.cmd migrate "D:\\Project"
```

确认后执行：

```powershell
.\\ECC_V2.cmd migrate "D:\\Project" --apply
```

执行前会在原状态文件旁创建备份。旧项目中标记为 passed 但没有测试证据的任务会被
Doctor 报告，不会自动伪造证据。
