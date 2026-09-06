# wemove-portal-backend

NestJS 10 + TypeORM + MySQL 8 后端。当前主线包含平台 Identity（#85）和产品目录（#87）能力。

> 归属说明：`src/modules/identity/`、`src/common/` 和根工程入口由 #85 维护；
> `src/modules/catalog/`（#87）为产品目录域。业务模块复用统一的会话、角色和响应契约。

## 本地启动

```bash
# 1) 初始化基线数据库（全新数据库执行一次）
mysql -h127.0.0.1 -uroot -p wemove_portal < sql/init_schema_and_data.sql

# 2) 执行身份与产品目录增量迁移（各执行一次）
mysql -h127.0.0.1 -uroot -p wemove_portal < sql/migrations/mvp01_identity_password_reset.sql
mysql -h127.0.0.1 -uroot -p wemove_portal < sql/migrations/mvp03_catalog_incremental.sql

# 3) 导入演示账号与产品 seed
mysql -h127.0.0.1 -uroot -p wemove_portal < sql/seed/seed_identity_demo_accounts.sql
mysql -h127.0.0.1 -uroot -p wemove_portal < sql/seed/seed_catalog_mvp03.sql

# 4) 启动后端（3001）
copy .env.example .env   # 按需改数据库口令
npm install
npm run start:dev
```

前端 `npm run dev`（3000）已配置 `/api` 代理到 3001，全程同源，无需开 CORS。

## 本地演示账号（仅演示环境）

| 账号 | 口令 | 角色 | 用途 |
| --- | --- | --- | --- |
| `admin` | `Wemove@123` | ADMIN | 后台产品/分类管理 |
| `demo_user` | `Wemove@123` | USER | 普通用户（公开价） |
| `dealer_demo` | `Wemove@123` | DEALER | 经销商价裁剪验证（对应 dealer_company id=1） |

## Identity 接口（统一前缀 /api/v1）

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/products?page&pageSize&keyword&categoryId&featured&age&sort` | 公开 | 分页列表（pageSize 上限 50），仅已发布 |
| GET | `/products/:slug` | 公开 | 详情；DEALER/ADMIN 会话附加 dealerPrice/moq |
| GET | `/categories` | 公开 | 分类（productCount 只统计已发布） |
| GET/POST/PUT/DELETE | `/admin/products*` | ADMIN | 产品管理；`PUT /admin/products/:id/status` 发布/下架 |
| GET/POST/PUT/DELETE | `/admin/categories*` | ADMIN | 分类管理；分类下有产品时删除返回 409 |
| POST | `/auth/register` | 公开 | 注册普通用户 |
| POST | `/auth/login` | 公开 | 用户名或邮箱登录 |
| POST | `/auth/logout` | 登录 | 清除会话 Cookie |
| GET | `/auth/csrf` | 公开 | 获取 CSRF token |
| GET | `/auth/me` | 登录 | 当前用户 |
| PATCH | `/users/me` | 登录 | 修改资料 |
| PUT | `/users/me/password` | 登录 | 修改密码 |
| POST | `/auth/password-reset/request` | 公开 | 开发环境输出 token 到日志 |
| POST | `/auth/password-reset/confirm` | 公开 | 使用 token 重置密码 |
| GET | `/admin/users` | ADMIN | 分页查询用户 |
| PATCH | `/admin/users/:id/status` | ADMIN | 启用/停用用户 |

写请求需要先获取 CSRF token，并通过 `X-CSRF-Token` 请求头提交。会话由 HttpOnly Cookie
`wemove_session` 承载；角色和账号状态由服务端判断。

## 测试

```bash
npm test -- --runInBand
npx tsc --noEmit
npm run build
```

Identity 的找回密码流程在开发环境把一次性 token 写入后端日志，不接入邮件供应商。
