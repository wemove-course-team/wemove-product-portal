# backend/src/common —— 公共守卫与统一响应（MVP-03 临时最小实现）

> ⚠️ 本目录按 #85 MVP-01 冻结契约 v1 编写，供 #87 MVP-03 本地联调与测试使用。
> 正式实现以 #85 交付为准，合并时可直接替换/扩充本目录；业务模块只依赖
> 守卫类与 `@CurrentUser()`，不感知内部实现。

## 守卫用法

```ts
import { SessionGuard, RolesGuard, Roles, CurrentUser } from '../../common'

// 管理接口：必须登录 + ADMIN 角色（权限由后端裁决，决策 D5）
@UseGuards(SessionGuard, RolesGuard)
@Roles('ADMIN')

// 公开接口但需要“可选会话”（如经销商价裁剪）：
@UseGuards(OptionalSessionGuard)

// 全局写请求 CSRF 校验：CsrfGuard（main.ts 中 APP_GUARD 注册）
```

## 约定速查（#85 契约 v1）

- 成功信封：`{ code: 0, message: 'ok', data, requestId }`
- 错误：HTTP 状态码 + `{ code, message, errors?, requestId }`，错误码
  `VALIDATION_400 / AUTH_401 / FORBIDDEN_403 / NOT_FOUND_404 / CONFLICT_409 / SERVER_500`
- 会话：HttpOnly Cookie `wemove_session`（签名 JWT）；写请求带 `X-CSRF-Token`
  （`GET /api/v1/auth/csrf` 获取，双提交校验）
- 分页：`?page=1&pageSize=10` → `data = { items, total, page, pageSize }`，默认 10、上限 50
- SessionGuard 每请求查库校验 `sys_user.status`，停用用户会话即时失效
