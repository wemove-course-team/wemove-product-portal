# services —— 统一请求层（#86 MVP-02）

全站唯一 axios 实例与领域 API 的归属地。**页面与组件禁止直接 import axios、fetch 或
再建第二个请求实例**；所有后端访问必须经由本目录。

## 文件

| 文件 | 职责 | 归属 |
| --- | --- | --- |
| `http.js` | 统一实例：`baseURL=/api/v1`、超时 15s、`withCredentials`（同源 Cookie 会话 `wemove_session`）、写请求自动附带 `X-CSRF-Token`（`GET /auth/csrf` 获取，仅存内存）、统一信封解包、错误归一化为 `ApiError`（requestId 透出） | #86 |
| `auth.js` | identity 领域 API：`/auth/me`、`/auth/login`、`/auth/register`、`/auth/logout`、`/auth/password-reset/*`、`PATCH /users/me`、`PUT /users/me/password`（#85 接口清单） | #86 |
| `home.js` | 首页与全站搜索基线：精选产品（`/products?featured=1`）、最新动态（`/articles?pageSize=3`）、关键词搜索；#87/#88 落地各自 service 后可迁移 | #86 |
| `contract-samples/` | 与后端（cy0207kaw，#85）对齐用的响应样例：一次成功、一次 400、一次 401、一次 403、一次分页列表（按 #85 契约 v1 编写） | #86 |

其余领域 service（product / content / support / dealer / operation）由各领域任务
（#87 / #88 / #89 / #90 / #91）基于 `http.js` 单例在各自目录/文件中新增。

## 使用方式

```js
import { authApi } from '@/services/auth'

const envelope = await authApi.me()   // { data, requestId }（统一信封已解包）
const me = envelope.data

try {
  await authApi.login(identifier, password)
} catch (error) {
  // error 是 services/http.js 归一化的 ApiError
  error.message      // 已映射为用户可读文案（优先后端 message）
  error.status       // HTTP 状态码；网络失败/超时为 0
  error.code         // VALIDATION_400 / AUTH_401 / FORBIDDEN_403 / NOT_FOUND_404 / CONFLICT_409 / SERVER_500
  error.fieldErrors  // 契约 errors:[{field,message}] 归一化后的映射 { field: [message, ...] }
  error.requestId    // 追踪编号，界面展示便于联调排查
}
```

## 状态码 → 界面状态（#86 验收：401/403/404/loading/empty/error 全覆盖）

| 契约语义 | ApiError | 界面呈现 |
| --- | --- | --- |
| 200/201 成功 | — | 正常内容（信封解包为 `{ data, requestId }`） |
| 204 | `{ data: null }` | 成功无内容 |
| 400 输入错误 | `code=VALIDATION_400` + `fieldErrors` | 表单项错误提示 / 全局错误条 |
| 401 未登录 | `code=AUTH_401` | 清空本地会话摘要；受保护路由跳转 `/login?redirect=…` |
| 403 无权限 | `code=FORBIDDEN_403` | 403 页面 / AsyncState 403 态（前端守卫仅预检，权限由后端裁决） |
| 404 无对象 | `code=NOT_FOUND_404` | 404 页面（未知路由）或页内「不存在」态 |
| 409/5xx | `CONFLICT_409` / `SERVER_500` | 可读错误条 + 重试按钮 + requestId |
| 网络失败/超时 | `status=0`, `code=NETWORK_ERROR/TIMEOUT` | 错误态；**禁止回退 localStorage 假数据** |

## 契约样例（与 cy0207kaw 对齐，按 #85 契约 v1）

- `contract-samples/auth.login.success.json` — 登录成功（200，Set-Cookie `wemove_session`，响应体无令牌）
- `contract-samples/auth.login.validation-error.json` — 输入校验失败（400 + errors 数组）
- `contract-samples/me.unauthorized.json` — 未登录（401）
- `contract-samples/admin.users.forbidden.json` — 已登录无权限（403）
- `contract-samples/products.list.success.json` — 公开产品列表（200 + `data = { items, total, page, pageSize }`，无经销商价格字段）

样例若与后端实际实现不一致，以 #85 issue 中双方确认后的结论为准，并同步更新
本目录样例与 `http.js` 的归一化逻辑（在 #85/#86 issue 留言同步）。

## Mock 与真实模式

- `VITE_API_MODE=real`（默认）：所有请求走真实后端，任何失败都呈现错误状态，
  绝不回退 localStorage 假数据。课程验收使用该模式。
- `VITE_API_MODE=mock`：显式演示开关，界面左下角显示「Mock 演示模式」标识
  （`components/ModeIndicator.vue`）。该模式仅用于后端未就绪时的界面演示，
  不构成任何功能验收证据。
- 会话在任何模式下都不使用本地角色：生产构建中旧「本地 role 切换」（demoAccounts）已删除；
  开发构建保留预览开关（`/login` 页的“开发预览”区域）用于界面联调，
  全局显示「开发预览角色」标识。
