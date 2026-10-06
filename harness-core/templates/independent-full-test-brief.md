# 独立 Tester 全流程测试任务书

> 本文件由 Orchestrator 根据需求、计划、实际修改、运行环境和保护边界生成。
> Tester 必须独立核验事实，不得把 Developer 结论当作 PASS 证据。

## 1. 任务身份与独立验收原则

- 项目名称：`{{PROJECT_NAME}}`
- 项目绝对路径：`{{PROJECT_ROOT}}`
- 任务编号：`{{TASK_ID}}`
- 任务名称：`{{TASK_TITLE}}`
- 测试模式：`full_independent`
- 全局协议版本：`2.0`
- 中央覆盖域：`harness-core/protocols/references/full-independent-test-domains-v2.md`
- Tester：`{{TESTER_IDENTITY}}`
- Developer：`{{DEVELOPER_IDENTITY}}`
- 测试任务书生成时间：`{{GENERATED_AT}}`

硬性原则：

1. Tester 必须独立执行，不得只复用 Developer 的结论和证据。
2. 不得只做源码检查、单元测试或 API 测试。
3. Developer 不得标记 PASS；最终 PASS、FAIL、BLOCKED 只能由 Tester 给出。
4. Tester 发现问题后不得修改业务实现，应保存证据并交回 Developer。
5. 修复后必须由独立 Tester 在新版本上重新验证。
6. Tester PASS 只允许进入产品负责人业务验收，不授权提交、推送、合并、部署或发布。

## 2. 项目、仓库和保护范围

### 涉及仓库

| 仓库 | 绝对路径 | 目标分支 | 预期 HEAD/基线 | 预期远程 |
|---|---|---|---|---|
| `{{REPOSITORY_NAME}}` | `{{REPOSITORY_PATH}}` | `{{TARGET_BRANCH}}` | `{{EXPECTED_HEAD_OR_BASELINE}}` | `{{EXPECTED_REMOTE}}` |

### 涉及模块

{{AFFECTED_MODULES}}

### 明确不在范围内

{{OUT_OF_SCOPE}}

### 禁止操作

{{PROHIBITED_OPERATIONS_AND_TARGETS}}

Tester 开始前必须核对并记录：仓库绝对路径、分支、HEAD、远程、Git
状态、已暂存/未暂存/未跟踪文件、端口与进程归属、实际运行工件及
SHA256、数据库/缓存/中间件目标、测试与生产隔离状态。目标不符时停止
有风险的操作并报告 BLOCKED。

## 3. 环境与操作授权

- 允许使用的测试环境：`{{AUTHORIZED_TEST_ENVIRONMENT}}`
- 允许启动或部署的本地目标：`{{AUTHORIZED_LOCAL_RUNTIME}}`
- 端口与进程：`{{EXPECTED_PORTS_AND_PROCESSES}}`
- 数据库：`{{EXPECTED_DATABASE}}`
- 缓存与中间件：`{{EXPECTED_CACHE_AND_MIDDLEWARE}}`
- 外部服务、账号、额度或硬件：`{{EXTERNAL_DEPENDENCIES}}`
- 环境隔离核验结论：`{{ENVIRONMENT_ISOLATION_RESULT}}`
- 测试数据写入授权：`{{TEST_DATA_MUTATION_AUTHORITY}}`
- 停服授权：`{{SERVICE_STOP_AUTHORITY}}`

未经单独明确授权，Tester 不得提交、推送、合并、删除或回退用户代码、
清理整个工作区、部署生产、修改生产或共享数据库、操作生产账号、停止
其他项目进程，或修改无关业务、安全、日志与配置逻辑。

## 4. 需求和实现基线

### 用户最后确认的业务口径

{{LATEST_CONFIRMED_REQUIREMENT}}

### 验收标准

{{ACCEPTANCE_CRITERIA}}

### 计划、设计、架构、接口和数据依据

{{APPROVED_ARTIFACTS_AND_DECISIONS}}

### Developer 实际修改

{{IMPLEMENTATION_CHANGE_SUMMARY}}

### Reviewer 发现与待复核风险

{{REVIEWER_FINDINGS_AND_RISKS}}

### 已知差异、假设和待确认项

{{KNOWN_GAPS_ASSUMPTIONS_AND_OPEN_ITEMS}}

需求冲突时，以用户最后确认的口径为准。Tester 首先整理业务对象、用户
角色、权限模型、状态流程、输入条件、正常/异常/边界流程、计算规则、
页面交互、API、数据库约束、历史兼容和明确非范围，形成可追踪覆盖矩阵。

## 5. 测试数据与账号矩阵

### 数据准备规则

只有第 3 节明确授权且隔离环境已经核验后，才可准备测试数据。优先使用
正式页面，其次正式 API；只有前两者不能完成准备时，才可执行最小化、
可追踪的测试数据库操作。

- 唯一数据前缀：`tester_{{TASK_ID}}_` 或 `codex_tester_{{TASK_ID}}_`
- 操作前基线：`{{DATA_BASELINE_METHOD}}`
- 允许的数据类型：`{{AUTHORIZED_TEST_DATA_TYPES}}`
- 本轮数据最终处置：`{{TEST_DATA_DISPOSITION}}`
- 保留数据的安全化方法：`{{DATA_SAFETY_METHOD}}`
- 如明确要求清理时的方法：`{{DATA_RECOVERY_METHOD}}`

不得覆盖真实业务数据；记录每条新增/修改数据的 ID；禁止清库、全表
删除、模糊条件删除或删除整个目录。

### 账号与场景矩阵

Tester 按需求选择并记录：系统管理员、业务管理员、普通/只读/无权限
用户、单角色/多角色、不同组织部门或业务归属、停用/锁定/失效用户、
权限变更前后用户、双会话用户、跨范围攻击用户及需求中的特殊身份。

| 账号代号 | 真实归属 | 角色 | 功能/数据权限 | 状态 | 测试用途 | 预期可见/可访问 | 恢复方式 |
|---|---|---|---|---|---|---|---|
| `{{ACCOUNT_ALIAS}}` | `{{ACCOUNT_SCOPE}}` | `{{ACCOUNT_ROLE}}` | `{{ACCOUNT_PERMISSIONS}}` | `{{ACCOUNT_STATUS}}` | `{{ACCOUNT_PURPOSE}}` | `{{ACCOUNT_EXPECTATION}}` | `{{ACCOUNT_RECOVERY}}` |

密码不得写入报告、Git、业务文档或证据。

## 6. 功能与业务场景

对本次需求及受影响回归面，覆盖适用的：

- 正常主流程，以及新增、编辑、删除/作废、详情、查询、筛选、排序、分页；
- 批量、导入、导出、上传、下载、审批/状态流转、撤销、退回、重试；
- 空/最小/最大合理/重复/非法数据、缺失必填、超长文本、特殊字符；
- 中英文数字混合、日期时区及跨月跨年、金额精度百分比及舍入；
- 状态变化后的页面与数据、刷新和重登持久化、相关老功能回归。

每条业务规则至少考虑正常、异常、边界、权限、数据隔离、刷新或重登。
不适用项必须写 `N/A + 原因`。

## 7. API 测试

覆盖适用的正常请求，以及缺失/空/类型错误/超长/重复参数、非法枚举、
不存在/停用/删除 ID、跨用户组织数据 ID、批量混入非法 ID、过期版本、
重复提交、并发修改、未登录、无功能或数据权限、隐藏字段篡改、绕过 UI、
导出下载文件接口、HTTP 状态与业务错误码、敏感错误泄露、失败后的部分
数据、数据库与缓存一致性。前端隐藏不能代替后端鉴权。

## 8. 数据库与一致性

检查新增完整性、更新准确性、逻辑删除、主从关系、唯一/业务约束、状态与
审计字段、组织用户租户字段、空值默认值、事务原子性、失败回滚、幂等、
并发丢失更新、列表详情报表与数据库一致、缓存一致、软删隔离及活动残留。

## 9. 真实浏览器 UI

必须使用真实浏览器实际操作关键 UI，不得用 API 或源码断言代替。覆盖
适用的登录退出、首页菜单、列表详情、表单、弹窗抽屉、选择控件、树与
日期控件、上传下载、查询重置、分页排序、保存取消关闭、二次确认、成功/
错误/加载/空/禁用/无权限状态、403/404/异常页、刷新、后退、前进、直接
URL、重新登录、独立双会话、权限和状态变化回显、缩放及常用分辨率。

同时检查既有 UI 风格、按钮位置/颜色/尺寸/图标、字段对齐、弹窗和遮罩、
滚动区、长文本、菜单层级、不可点击状态、提示文案、重复点击、错位溢出
遮挡空白、关闭后的状态清理、重新打开回显、失败后输入保留和错误跳转。

关键场景截图必须关联账号、步骤、URL、可见菜单/按钮、输入、提示、实际
与预期结果。

## 10. 权限与安全边界

需求涉及权限、组织、租户或数据范围时，分别验证登录、菜单、按钮、路由、
API、数据、文件下载、导出、详情 ID、修改删除、批量操作，以及跨用户、
角色、部门、组织、租户/客户访问；还要验证停用/删除/未知对象、直接 URL、
直接 API、参数篡改、旧会话、权限撤销、缓存旧权限、多会话隔离和失败
原子性。不能把“菜单不可见”当成数据安全通过。

## 11. 状态、失败原子性与并发

所有失败场景检查页面、URL、页签、菜单、会话、缓存、数据库、版本号和
表单是否保持，是否产生部分成功、错误跳转/刷新、重复记录或无效中间态。

状态流转覆盖正常、非法逆向、重复、完成后再操作、并发、无权限、失败
恢复、刷新和重登。双会话使用真正独立 Cookie，覆盖同账号双会话、不同
对象、权限变化、单会话退出、不同账号/角色并行、同数据并发修改、重复
点击/提交及版本或权限变化后的旧请求。

## 12. 自动化、构建、制品与日志

### 记录的工具链与命令

{{TOOLCHAIN_AND_COMMANDS}}

独立执行适用的单元、集成、Controller/API 契约、权限、数据隔离、前端
组件、静态类型、Lint、前后端完整测试与构建。构建候选制品后检查内容、
SHA256、关键类/资源，并核对实际运行工件。旧栈无法执行的项目必须写明
限制或 BLOCKED，不能直接记 PASS。

日志只读检查：测试前记录 server/web/编译/浏览器控制台/网络/数据库/
缓存基线，测试后检查新增 ERROR、FATAL、未处理异常、SQL 错误、空指针、
敏感泄露及无关错误。不得擅自修改日志配置或日志业务逻辑。

## 13. 测试数据保留、恢复与残留复核

默认保留本轮账号、业务数据、关系和关键中间状态，输出不含密码的完整
索引与产品负责人复测步骤。对可能继续扣费、通知、调度、发布或影响外部
系统的活动状态必须停用或安全化，并复核数据库、缓存、会话与外部队列。

如任务或产品负责人明确要求清理，只能按索引精确删除本轮创建的数据；
恢复本轮曾修改的用户、角色、权限、组织关系和授权配置，并重新核验基线。

记录所有保留或软删除记录的 ID、原因、状态和不会继续生效的证据。禁止
清库、全表删除、模糊前缀误删、删除非本轮数据或删除整个目录。

## 14. 缺陷记录与回流

发现 FAIL 后，在不扩大破坏范围且不绕过安全缺陷的前提下继续其他独立
场景。每个缺陷记录：标题、严重级别、账号、前置数据、步骤、参数、URL、
实际/预期、HTTP 状态、业务错误码、数据库/日志/截图证据、稳定性、影响
范围和数据恢复状态。交回 Developer 修复后，由独立 Tester 对新版本复验。

## 15. 最终报告合同

写入 `.sdd/test-reports/test-{{TASK_ID}}.md`，至少包含：

```text
ECC_TEST_TASK: {{TASK_ID}}
ECC_TEST_VERDICT: PASS
```

`ECC_TEST_VERDICT` 必须根据唯一实际结论填写 `PASS`、`FAIL` 或 `BLOCKED`，
不能保留选项列表，并且必须与 `.sdd/tasks.json` 状态一致。

1. 项目、任务、测试版本、范围和非范围；
2. 仓库路径、分支、HEAD、远程及测试前后 Git 状态；
3. 环境、端口进程、数据库、缓存、中间件和工件 SHA256；
4. 需求覆盖矩阵、账号矩阵和测试数据清单；
5. 自动化、构建、API、数据库、UI/浏览器、权限越权、双会话并发和回归结果；
6. 日志增量、数据处置、缺陷、BLOCKED、限制和遗留风险；
7. 保留账号/数据/中间状态索引及产品负责人亲自操作的复测步骤；
8. 开发者工具/模拟、真实浏览器或设备、真实外部链路分别标注；
9. 唯一最终结论：PASS、FAIL 或 BLOCKED。

只有所有范围内验收标准通过、阻断和高风险缺陷已修复并独立复验、没有
数据泄露或失败污染、关键实际入口通过、技术门禁满足、保留/清理的数据
均已安全处置且证据完整可复现时，Tester 才能给出 PASS。

## 16. 本轮适用性矩阵

| Domain id / 测试域 | 规划适用性 | 依据或 N/A/BLOCKED 原因 | 证据位置 |
|---|---|---|---|
| `requirements` / 需求一致性 | `{{REQUIREMENTS_APPLICABILITY}}` | `{{REQUIREMENTS_REASON}}` | `{{REQUIREMENTS_EVIDENCE}}` |
| `environment_identity` / 环境与版本身份 | `{{ENVIRONMENT_IDENTITY_APPLICABILITY}}` | `{{ENVIRONMENT_IDENTITY_REASON}}` | `{{ENVIRONMENT_IDENTITY_EVIDENCE}}` |
| `build_static` / 构建与静态检查 | `{{BUILD_STATIC_APPLICABILITY}}` | `{{BUILD_STATIC_REASON}}` | `{{BUILD_STATIC_EVIDENCE}}` |
| `unit_component` / 单元与组件 | `{{UNIT_COMPONENT_APPLICABILITY}}` | `{{UNIT_COMPONENT_REASON}}` | `{{UNIT_COMPONENT_EVIDENCE}}` |
| `api_integration` / API 与集成 | `{{API_INTEGRATION_APPLICABILITY}}` | `{{API_INTEGRATION_REASON}}` | `{{API_INTEGRATION_EVIDENCE}}` |
| `database_consistency` / 数据库与一致性 | `{{DATABASE_CONSISTENCY_APPLICABILITY}}` | `{{DATABASE_CONSISTENCY_REASON}}` | `{{DATABASE_CONSISTENCY_EVIDENCE}}` |
| `ui` / 实际 UI 入口 | `{{UI_APPLICABILITY}}` | `{{UI_REASON}}` | `{{UI_EVIDENCE}}` |
| `permissions_security` / 权限与安全 | `{{PERMISSIONS_SECURITY_APPLICABILITY}}` | `{{PERMISSIONS_SECURITY_REASON}}` | `{{PERMISSIONS_SECURITY_EVIDENCE}}` |
| `state_workflow` / 状态与跨功能流程 | `{{STATE_WORKFLOW_APPLICABILITY}}` | `{{STATE_WORKFLOW_REASON}}` | `{{STATE_WORKFLOW_EVIDENCE}}` |
| `time_scheduled` / 时间与定时任务 | `{{TIME_SCHEDULED_APPLICABILITY}}` | `{{TIME_SCHEDULED_REASON}}` | `{{TIME_SCHEDULED_EVIDENCE}}` |
| `concurrency_idempotency` / 并发与幂等 | `{{CONCURRENCY_IDEMPOTENCY_APPLICABILITY}}` | `{{CONCURRENCY_IDEMPOTENCY_REASON}}` | `{{CONCURRENCY_IDEMPOTENCY_EVIDENCE}}` |
| `resilience_recovery` / 中断与恢复 | `{{RESILIENCE_RECOVERY_APPLICABILITY}}` | `{{RESILIENCE_RECOVERY_REASON}}` | `{{RESILIENCE_RECOVERY_EVIDENCE}}` |
| `multi_client_cache` / 多端会话与缓存 | `{{MULTI_CLIENT_CACHE_APPLICABILITY}}` | `{{MULTI_CLIENT_CACHE_REASON}}` | `{{MULTI_CLIENT_CACHE_EVIDENCE}}` |
| `history_audit_logs` / 历史审计与日志 | `{{HISTORY_AUDIT_LOGS_APPLICABILITY}}` | `{{HISTORY_AUDIT_LOGS_REASON}}` | `{{HISTORY_AUDIT_LOGS_EVIDENCE}}` |
| `external_real_chain` / 真实外部链路 | `{{EXTERNAL_REAL_CHAIN_APPLICABILITY}}` | `{{EXTERNAL_REAL_CHAIN_REASON}}` | `{{EXTERNAL_REAL_CHAIN_EVIDENCE}}` |
| `regression` / 受影响回归 | `{{REGRESSION_APPLICABILITY}}` | `{{REGRESSION_REASON}}` | `{{REGRESSION_EVIDENCE}}` |

最终报告须为上述每个 domain id 写一行
`ECC_TEST_DOMAIN: <domain-id> PASS|FAIL|BLOCKED|N/A | <证据或原因>`；`N/A`
必须有原因。Tester 开始后持续汇报阶段进度，但在完成全部适用矩阵前不得
提前给出 PASS。
