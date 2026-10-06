---
name: sdd-wechat-miniprogram-product-design
description: Use when an SDD project targets a native WeChat Mini Program, including product design, prototype planning, WeChat capability scoping, or mobile client handoff.
---

# SDD WeChat Mini Program Product Design

本 Skill 只处理 **原生微信小程序**。它不适用于手机浏览器 H5、微信内 H5、PWA、React Native、Flutter、uni-app 或 Taro 跨端项目。

默认前端目标：

```text
project_type = mobile
target_platform = wechat-miniprogram
client_path = mobile/miniprogram/
```

后端使用阶段 C 批准的项目技术栈；接口契约仍以 `docs/api-contracts.md` 为唯一对齐依据。

## 触发规则

在以下任一阶段，只要目标平台是微信小程序，就必须加载本 Skill：

1. 阶段 R：需求澄清与竞品调研。
2. 阶段 A：页面、功能、版本规划、外部依赖确认。
3. 阶段 B1：Design Spec。
4. 阶段 B2：原型设计。
5. 阶段 C：PRD 定稿、接口契约、开发计划。
6. 开发前：Planner / Developer / Tester 生成或执行小程序前端任务。

如果同一项目同时包含 Web 后台和微信小程序，必须拆分设计口径：Web 后台继续使用 Web 规范，小程序端使用本 Skill。

## R 阶段补充澄清

在通用产品四问之外，小程序必须补齐：

1. **入口来源**：扫码、分享卡片、群分享、公众号菜单、搜索、附近小程序、线下物料或客服消息。
2. **登录身份**：匿名可用、`wx.login` 静默登录、手机号授权、企业/内部账号绑定、后台账号同步。
3. **微信开放能力**：手机号、支付、订阅消息、位置、相机/相册、文件上传、蓝牙、客服消息、分享。
4. **授权策略**：哪些能力首屏就要授权，哪些等用户触发时再授权；拒绝授权后的降级路径。
5. **核心路径**：用户从入口进入后，首屏要完成什么任务，是否需要 TabBar 常驻导航。
6. **审核约束**：是否涉及支付、医疗、金融、社交、用户生成内容、定位或敏感行业资质。
7. **弱网与失败反馈**：加载、重试、离线提示、表单暂存、支付失败、上传失败。

## 页面与信息架构

- 小程序页面以任务闭环为中心，不照搬桌面 Web 后台的信息密度。
- 常用结构：TabBar 首页 / 列表页 / 详情页 / 表单页 / 授权页 / 结果页 / 个人中心。
- 页面栈必须明确：从哪里进入、返回哪里、何时回首页、何时关闭流程。
- TabBar 页面建议不超过 5 个；MVP 优先 2-4 个。
- 复杂功能优先拆成多步流程，避免单页表单过长。
- 大型小程序需要在 PRD 中标注是否需要分包，以及哪些页面进入主包。

## 微信能力清单

PRD 阶段必须新增或补充「微信小程序能力清单」：

```markdown
## 微信小程序能力清单

| 能力 | 使用场景 | 触发页面 | 配置项 | 用户授权 | 缺失/拒绝时策略 | MVP 必需 |
|------|----------|----------|--------|----------|------------------|----------|
| wx.login | 建立会话 | 启动/登录页 | AppID, AppSecret | 否 | 游客态/登录失败提示 | 是 |
| 手机号授权 | 绑定手机号 | 登录页 | phoneNumber 授权 | 是 | 账号密码/跳过 | 否 |
| 微信支付 | 下单支付 | 支付页 | 商户号, APIv3 Key, 回调地址 | 是 | 订单待支付 | 视项目 |
| 订阅消息 | 状态通知 | 结果页 | 模板 ID | 是 | 站内消息 | 视项目 |
```

真实 AppID、AppSecret、商户密钥、API Key 只能进入 `.env` 或用户指定 secret 文件；`docs/**` 和 `.sdd/**` 只写字段名和配置状态。

## Design Spec 补充

当项目包含微信小程序端，`.sdd/tmp/ui-design-spec.md` 必须增加：

```markdown
## 微信小程序页面设计规则
- 目标平台：原生微信小程序
- 目标视口：375×812 / 390×844，必要时补充 360×780 / 430×932
- 导航模式：原生导航栏 / 自定义导航栏 / TabBar
- TabBar：页面、图标、选中态、是否固定
- 胶囊按钮避让：自定义导航栏必须预留右上角胶囊区域
- 安全区：底部固定按钮、TabBar、弹层必须处理 safe-area
- 微信能力入口：登录、授权、支付、订阅消息、分享等触发位置
- 组件基底：原生组件 / WeUI / TDesign Miniprogram（择一）
- 空/错/加载：列表空态、授权拒绝、网络失败、支付失败、上传失败
- 不适用范围：不套用 H5 浏览器地址栏、浏览器返回、Ant Design Mobile 规则
```

## B2 原型规则

- 默认可用 HTML 原型模拟小程序界面，但必须标注「原型用于设计验证，不是生产小程序源码」。
- 原型视口默认 `390×844`，也可使用 `375×812`；不使用浏览器地址栏或 H5 顶栏。
- 需要体现小程序特有结构：原生导航栏、胶囊按钮避让、TabBar、安全区、授权弹窗、支付/订阅消息结果态。
- 可点击 flow demo 至少覆盖一条核心路径和一条授权拒绝或失败路径。
- 如果使用 Pencil，每个页面 Frame 独立绘制，命名为 `NN-页面名`。

## C 阶段交付要求

`docs/Plan.md` 的前端部分必须写成「小程序前端开发清单」，不得套用 React + Vite 前端模板。

必须包含：

- 小程序技术选型：原生微信小程序 + TypeScript + WeUI/TDesign/原生组件。
- 前端目录：`mobile/miniprogram/`。
- 页面清单：对应 `app.json` pages / tabBar / 分包。
- 微信能力配置：AppID、AppSecret、商户号、模板 ID、回调地址等字段名与状态。
- Mock 策略：接口返回格式必须对齐 `docs/api-contracts.md`。
- 验证方式：微信开发者工具 / `miniprogram-ci` / 构建检查 / 真机预览（如需要用户参与则标注门禁）。

## 常见错误

| 错误 | 正确做法 |
|------|----------|
| 把小程序当微信内 H5 | 小程序按原生页面栈、TabBar、胶囊、安全区和微信能力设计 |
| 默认套 React/Vite/Ant Design Mobile | 小程序前端读取 `dev-standards/wechat-miniprogram.md` |
| 首屏强制索取所有授权 | 按功能触发授权，提供拒绝后的降级路径 |
| 文档写真实 AppSecret/支付密钥 | 文档只写字段名与状态，真实值只进 secret 配置 |
| 原型没有失败态 | 至少覆盖授权拒绝、网络失败、支付/上传失败等关键失败态 |
