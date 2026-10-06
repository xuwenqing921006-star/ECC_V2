# ECC_V2 中央门禁独立审查与复验（2026-09-09）

> 框架归档报告（分享脱敏版）：保留当时的框架测试结果和能力边界，移除无关业务背景及机器路径。历史测试结果不代表本次重新执行测试。

## 身份、范围与方法

执行者：独立 Tester/Reviewer 子代理 `guard_independent_review`，未参与中央门禁实现，只维护独立测试与此报告。本报告仅覆盖 ECC V2 中央门禁，不代表任何业务项目验收。

审阅文件：`scripts/lib/workflow-guard.js`、`scripts/lib/doctor.js`、`scripts/ecc-v2.js`、中央 `AGENTS.md`、`harness-core/router.md`、开发及质量门禁、`workflow-task-contract.md`、现有门禁测试。

已核验运行时：Node `v24.14.0`，符合框架 Node >=20。独立测试只在 OS 临时目录创建有固定前缀的最小沙箱，逐个复制 Doctor 明确要求的文件和 CLI 依赖；不递归复制 ECC 根、不读取业务数据、不调用网络、不部署。测试终止时核验沙箱父路径与前缀，先解除本测试创建的 Junction，再删除本测试沙箱。

复现命令（在 ECC V2 仓库根目录运行，确保 PATH 中的 Node 版本符合要求）：

```powershell
node --test ./tests/workflow-guard-independent.test.js
```

## 首轮独立结论：FAIL

首轮共 10 项：1 项正向控制通过，9 项安全断言失败，进程退出码 1。失败断言全部是预期拒绝却实际放行，并非环境失败。对应反例保存在 `tests/workflow-guard-independent.test.js`。

| 编号 | 严重度 | 具体复现 | 首轮实际结果及影响 |
|---|---|---|---|
| G-01 | P1 | Tester verdict 分别为 FAIL/BLOCKED，任务和生命周期同步该状态，执行 completion | 两项均 `passed=true`。把失败或阻塞状态一致误当成完成放行。 |
| G-02 | P1 | 合法 PASS 报告、passed 状态，删除 `development_readiness` | `passed=true`，没有开工准备记录仍可完成，不保证先准备后开发。 |
| G-03 | P1 | 将 `user_gate` 改为字符串 `"true"`，不提供业务验收 | `passed=true`，类型错误绕过 `=== true` 分支。 |
| G-04 | P1 | readiness 指向项目内 Junction，实际目标是项目外沙箱文件 | `passed=true`，词法 containment 未验证真实路径。 |
| G-05 | P1 | business acceptance 指向项目内 Junction，实际目标在项目外 | `passed=true`，项目外验收证据被信任。 |
| G-06 | P1 | 复制 `.sdd` 和必需文档到未注册且无 Git 关联的目录，保留已有 project.id | `passed=true`。当前只比较 ID，不能证明该目录是已注册项目或其真实 Worktree。不能简单禁止所有异路径，应允许 Git common-dir 可验证的 Worktree。 |
| G-07 | P1 | CLI 使用 `--projectpath <不存在的路径>`（拼错 `--project-path`），注册表活动项目准备完毕 | 输出 `PASS: ECC V2 development guard passed for guarded/T-001`，退出 0。错误参数被忽略并静默切到活动项目。 |
| G-08 | P2 | `affectedAreas=[""]`，`compatibilityConstraints=[false]` | `passed=true`，空项和非字符串混入合同数组。 |
| G-09 | P1 | PASS 任务与报告，`status.gates.requirements=pending` | `passed=true`，完成不复查需求门禁。 |
| G-10 | P1 | PASS 任务与报告，`status.blocked=false` 但 `status.blockers` 非空 | `passed=true`，仍有阻塞原因却允许完成。 |
| G-11 | P2 | CLI 重复传 `--project-path`，前值不存在、后值为准备好的项目 | 后值覆盖且退出 0，未拒绝歧义参数。 |

扩展首轮覆盖后为 15 项，3 PASS / 12 FAIL。额外正向控制创建了真实 Git 注册项目与其 detached Worktree，确认真实 Worktree 能通过；CLI 缺少 task 参数值和非法 stage 已正确返回非零。以上新增失败仍是误放行。

建议修复应保持失败关闭：完成只允许 PASS；completion 复查任务相关准备；校验 Boolean 和数组元素类型；对所有证据做 realpath containment；校验注册目录/Git Worktree 关系；拒绝未知、重复、缺值 CLI 参数。

文档治理任务可以按中央 `product-design-only` 路由记录适用门禁和维护方案，无需谎称做过业务开发准备；这项例外不能成为 code/configuration/migration 任务绕过 readiness 的通道。

## 必须准确披露的执行边界

当前 `guard` 是显式运行的只读 CLI 校验器。CLI 的非零退出可以使遵循入口规则的代理停止，也可由调用它的脚本/CI 阻断后续步骤。中央代码没有接管本会话的 `apply_patch`、`exec_command` 或编辑器写入权限，因此不能声称已实现“工具层禁止一切业务文件写入”。这属于实现边界，不能用新增文档代替实际工具集成证明。

`ECC_TEST_INDEPENDENT: true` 是报告自述；三个文本 marker 不能单独验证写报告者没有参与实现。baseline/authorization 字符串也不提供不可伪造的历史时间顺序。代理仍必须实际执行角色隔离，并由编排/审查核对证据来源；当前范围没有提供可信身份或不可改写审计服务。

## 修复后独立复验

最终独立结论：**PASS（中央 CLI 校验器本轮修复范围）**。首轮 FAIL 记录保留，全部原红例未删除、未放宽断言；这些错误放行现已被拒绝。

实现者交付本地修复后，独立 Tester 重新审查了最终实现、CLI 严格参数、Router、合同、schema、双语说明和入口文件。补充 6 组测试：文档计划合法通过、缺失/空文件拒绝、其他任务计划拒绝、feature 不得套用文档豁免、development 必须明确 not_applicable、Doctor CLI 六种非法参数拒绝且正确显式路径通过。

独立 Tester 实际执行结果：

- `scripts/check-consistency.js`：PASS，框架结构与双语文档对应一致。
- `node --test --test-reporter=spec <tests目录全部*.test.js绝对路径>`：**51/51 PASS**，0 FAIL / 0 SKIP，退出码 0，耗时约 4.83 秒。
- 其中 `workflow-guard-independent.test.js`：**21/21 PASS**；原 15 项均保留，新增 6 项。
- 真实 Git Worktree 和正常开发、完成状态仍可通过；伪造复制目录被拒绝。
- 原 full-independent 选择、领域、状态、证据/brief Junction 检查保持通过；本轮没有对业务项目启动 full_independent 模式。

环境说明：测试内临时 Git fixture 出现 LF/CRLF 提示，不影响断言，未修改机器 Git 配置。测试后的脚本返回码与断言均确认成功。

上述 PASS 不代表业务验收、Git 集成、部署或不可跳过的工具写入保护；也不认证文本标记中的身份或历史批准时点。文档豁免依赖真实分类与范围审查，CLI 没有认证 Git diff 中是否完全不存在业务变更。该范围和限制已在中央 Router、合同、AGENTS 和双语入门文档准确披露。

### 最终受验文件 SHA-256

以下路径相对于 ECC V2 仓库根目录。哈希在最终独立 51 项通过后从磁盘读取；后续改变应重新确认受影响证据。

| 文件 | SHA-256 |
|---|---|
| scripts/lib/workflow-guard.js | E48CDDE82F31A7ABD3AAB8062EDAC3CBAD0D14F654A84BD56C78821A3DAE2EC8 |
| scripts/lib/doctor.js | A36D122C6062158662DFD08EA4E8C3D09799716B890DE4A3042BFEFD2D11282B |
| scripts/ecc-v2.js | E795164F112632D2C855222793EC341755C9BEC795861A0C9565A63623858A7B |
| harness-core/router.md | 302B4009F6141BA1A647534F5B0B953C034744ED1F674B00FE501895C1FE41E4 |
| harness-core/templates/workflow-task-contract.md | F6D713DB0AEEB3F75C865C04033E89BCF5E168EC77B41AD301021F8B4504BFCE |
| harness-core/schemas/tasks.schema.json | 07F363D17C0AB23C1E1319D6A270100C5A1CDBF53C2B1025479C4E8151E4AD2A |
| AGENTS.md | 031F981CB528D915CB10E273CC7085E6C507454A17EC9D9105D7C02C741D12E6 |
| docs/zh-CN/getting-started.md | 11ED89F791EBF0501759542F5423150D6AE652D989FA4CEC9C9BF41A26D0C44F |
| docs/en-US/getting-started.md | B97F5F0D11D9149045ADAB8EECF1A3B85FC86B81D9330A1A946837B38EFD5FE4 |
| tests/workflow-guard.test.js | 98C4EACF1DA374C17D93D285C4C8CF7CA6BED80993253200B22978EC57620932 |
| tests/workflow-guard-independent.test.js | F86543824BB8E931FEC4BDE686141ADDAA177A8EAB79A39460C81DC80A98F903 |

独立 Tester 仅写入 `tests/workflow-guard-independent.test.js` 和本报告；没有修改中央实现、业务文件或业务任务状态。
