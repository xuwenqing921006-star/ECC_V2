# 微信小程序开发规范

## 1. 适用范围

本规范适用于 SDD 原生微信小程序前端任务：

```text
project_type = mobile
target_platform = wechat-miniprogram
client_path = mobile/miniprogram/
```

不适用于手机浏览器 H5、微信内 H5、PWA、React Native、Flutter、Taro 或 uni-app。后端任务继续读取 `dev-standards/backend-dev.md` 与 `dev-standards/backend-layers.md`。

## 2. 默认技术栈

| 层级 | 默认选择 | 说明 |
|------|----------|------|
| 框架 | 原生微信小程序 | 以微信官方能力和审核要求为准 |
| 语言 | TypeScript | 页面、组件、service、DTO 必须类型化 |
| 组件库 | TDesign Miniprogram 或 WeUI | 项目二选一，缺省优先 TDesign Miniprogram |
| 网络请求 | 封装 `wx.request` | 禁止页面内散落请求 |
| 状态管理 | 轻量 store / event bus | MVP 不引入复杂状态库 |
| 构建验收 | 微信开发者工具 CLI / miniprogram-ci | 能自动验证则自动执行 |

不得把普通 Web/H5 客户端规范套到小程序任务上；`frontend.md` 仅提供通用产品一致性和工程边界。

## 3. 目录结构

小程序前端代码放在：

```text
mobile/miniprogram/
├── app.json
├── app.ts
├── app.wxss
├── project.config.json
├── sitemap.json
├── pages/
├── components/
├── services/
├── stores/
├── types/
├── mocks/
├── utils/
└── assets/
```

规则：

- 页面放 `pages/<page-name>/`，每页包含 `.json`、`.wxml`、`.wxss`、`.ts`。
- 通用组件放 `components/`。
- 接口封装放 `services/`，禁止页面直接调用 `wx.request`。
- DTO 类型放 `types/`，以 `docs/api-contracts.md` 为准。
- Mock 数据放 `mocks/`，禁止散落在页面文件中。

## 4. 配置与密钥

小程序前端只保存公开配置，例如 AppID。AppSecret、支付 APIv3 Key、JWT Secret、第三方 API Key 等真实敏感值必须只放在后端 `.env` 或用户指定 secret 文件中。

文档、测试报告和 `.sdd/**` 只能记录字段名与配置状态：

```text
WECHAT_APP_ID：已配置于 project.config.json
WECHAT_APP_SECRET：后端 .env 字段，未打印值
WECHAT_PAY_MCH_ID：待用户确认
```

## 5. API 调用封装

必须有单一请求入口，例如：

```text
mobile/miniprogram/services/request.ts
```

要求：

- 统一 base URL、timeout、header、token 注入。
- 统一解析 `code / message / data` 响应格式。
- 统一处理 401、403、网络失败和超时。
- 所有 endpoint 方法写在 `services/*.ts`。
- Mock 与真实 API 的响应 DTO 必须与 `docs/api-contracts.md` 一致。

小程序不能使用 Vite 代理规则；不得要求配置 `VITE_API_BASE_URL`、`vite.config.ts` 或 React Router。

## 6. 页面与组件实现

- 页面结构必须与 `docs/prototypes/` 已确认原型一致，文案、布局、间距、状态不得凭感觉改。
- 自定义导航栏必须避让右上角胶囊按钮。
- 底部固定按钮、TabBar、弹层必须处理安全区。
- 所有关键操作必须有 loading、success、error、empty 状态。
- 授权能力必须按用户触发时机请求，不在首屏一次性索取无关权限。
- 拒绝授权后必须有降级路径或清晰说明。

## 7. 微信开放能力

涉及以下能力时，任务必须引用 `docs/Plan.md` 的「外部服务与测试权限清单」：

| 能力 | 常见配置字段 |
|------|--------------|
| 登录 | `WECHAT_APP_ID`, `WECHAT_APP_SECRET` |
| 手机号授权 | `WECHAT_APP_ID`, 后端解密配置 |
| 支付 | `WECHAT_PAY_MCH_ID`, `WECHAT_PAY_API_V3_KEY`, `WECHAT_PAY_NOTIFY_URL` |
| 订阅消息 | `WECHAT_SUBSCRIBE_TEMPLATE_ID_*` |
| 位置 | 位置用途声明、用户授权 |
| 文件上传 | 对象存储配置、后端上传接口 |

配置缺失时只能标记 Mock/fallback 验收，不得宣称真实微信能力联调通过。

## 8. Mock 与契约

- Mock 响应必须显式构造 endpoint DTO，不能直接返回内部实体。
- Mock 字段必须是 `docs/api-contracts.md` 中定义字段的子集。
- 新增字段必须先更新 `docs/api-contracts.md`，再改 Mock、service、页面类型。
- 页面可显示 `[Mock]` 标识；切到真实接口后必须移除相关 Mock-only 文案。

## 9. 验证

优先执行项目内已有脚本。常见检查：

```text
npm run type-check
npm run lint
npm run build
npm run ci
```

如果项目使用 `miniprogram-ci`，Tester 应优先验证：

- 配置文件可读取。
- 代码可构建或上传预览包。
- `app.json` pages / tabBar / 分包路径存在。
- 页面引用的组件、图片、样式路径存在。

如果本地缺少微信开发者工具、CLI 登录态或上传密钥，报告应标记 BLOCKED 或 Mock/fallback，写明缺失项，不要求用户手动补跑项目内依赖安装。

## 10. 禁止项

- 禁止把小程序任务实现到 `frontend/`。
- 禁止使用 React Router、Zustand、Vite 代理作为小程序前端规范。
- 禁止页面内散落 `wx.request`。
- 禁止在文档、报告、Mock、日志中写真实 AppSecret、支付密钥或 Token。
- 禁止把 H5 浏览器返回、地址栏、安全区规则直接当作小程序规则。
