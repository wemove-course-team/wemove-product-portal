# MVP-07 运营域接口契约（operation）

> 冻结范围：Issue #91 Phase A。前端接入统一走 `frontend/src/services/http.js` 单例
>（自动附带 CSRF 头并解包信封），禁止另建 axios 实例。
> 公共契约沿用 #84 决策 D1–D11：前缀 `/api/v1`、camelCase、成功
> `{ code: 0, message: 'ok', data, requestId }`、错误 `HTTP 状态码 +
> { code, message, errors?, requestId }`、写请求 CSRF 双提交。

## 1. 站点配置（site_config）

白名单配置键（即数据库 `site_config.config_key` 的全部合法取值，camelCase 存储）：

| 键 | 含义 | 值约束 |
| --- | --- | --- |
| `siteName` | 站点名称 | 字符串，≤255 |
| `logoUrl` | Logo 图片 | 相对路径（`/` 开头）或 http(s) URL，≤255 |
| `contactPhone` | 联系电话 | 字符串，≤255 |
| `contactEmail` | 联系邮箱 | 字符串，≤255 |
| `address` | 地址 | 字符串，≤255 |
| `footerText` | 页脚文案 | 字符串，≤255 |
| `icpNo` | ICP 备案号 | 字符串，≤255 |

未设置的键公开返回空字符串；**除以上 7 键外的任何键都会被拒绝（400）**。

### GET /api/v1/site/config（公开）

```json
{ "code": 0, "message": "ok", "data": {
  "siteName": "WEMOVE 惟木匠心", "logoUrl": "", "contactPhone": "",
  "contactEmail": "", "address": "", "footerText": "© 2026 WEMOVE 惟木匠心",
  "icpNo": "" }, "requestId": "..." }
```

### GET /api/v1/admin/site/config（ADMIN）

data 结构同上。

### PUT /api/v1/admin/site/config（ADMIN，写请求带 CSRF）

请求体为上述键的任意子集；**未知键 → 400 `VALIDATION_400`，`errors:[{field:"<键名>",
message:"未知的配置键，仅允许白名单键"}]`，且不做任何部分写入**。非法 URL（非相对路径/
非 http(s)，如 `javascript:`、`ftp:`；含反斜杠如 `/\evil.example/path`）、非字符串、超 255 字符同样 400。

```json
// 请求
{ "siteName": "新站名", "contactPhone": "13800000000" }
// 响应 data：更新后的完整 7 键配置（结构同 GET）
```

## 2. Banner（banner）

字段：`id`(number)、`title`、`imageUrl`、`linkUrl`(可空)、`sortOrder`(≥0 整数)、
`isActive`(boolean)、`createdAt`、`updatedAt`。
图片与链接仅允许相对路径（`/` 开头）或 http(s) URL（决策 D10，不做文件上传）；
**任何含反斜杠 `\` 的值一律 400**（部分浏览器会把 `/\evil.example/path` 按跨域 URL 解析）；
静态资源可用 `docs/assets-registry.md` 登记路径。

### GET /api/v1/banners（公开）

仅返回启用项，按 `sortOrder ASC, id ASC` 稳定排序。data 为数组（不分页）：

```json
{ "code": 0, "message": "ok", "data": [
  { "id": 1, "title": "…", "imageUrl": "/images/prod_20_1.jpg",
    "linkUrl": "/products", "sortOrder": 10, "isActive": true,
    "createdAt": "2026-09-08T…", "updatedAt": "2026-09-08T…" } ], "requestId": "..." }
```

### 管理接口（全部 ADMIN，写请求带 CSRF）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/admin/banners` | 全部 Banner（含停用），同稳定排序 |
| POST | `/api/v1/admin/banners` | 新增。body：`{ title, imageUrl, linkUrl?, sortOrder?(默认0), isActive?(默认true) }` → 201 |
| PUT | `/api/v1/admin/banners/sort` | 批量排序。body：`{ items: [{ id, sortOrder }, …] }`；任一 id 不存在 → 404 且整体不写入；返回全部列表 |
| PUT | `/api/v1/admin/banners/:id` | 编辑（部分更新，仅 `title/imageUrl/linkUrl/sortOrder`，全部可选；**不接受 `isActive`**，携带即 400，启停只能走 `/status`）；不存在 → 404 |
| PUT | `/api/v1/admin/banners/:id/status` | 启停。body：`{ isActive: boolean }` |
| DELETE | `/api/v1/admin/banners/:id` | 删除；不存在 → 404 |

非法输入统一 400 `VALIDATION_400`（如 `sortOrder=-3`、`imageUrl="ftp://…"`）。

## 3. 后台概览

### GET /api/v1/admin/stats/overview（ADMIN）

```json
{ "code": 0, "message": "ok", "data": {
  "productCount": 5, "articleCount": 3, "userCount": 8, "pendingApplications": 1 },
  "requestId": "..." }
```

统计口径（对真实表只读 COUNT，不跨模块调用 Service）：

| 字段 | 来源 |
| --- | --- |
| `productCount` | `COUNT(*) FROM product` |
| `articleCount` | `COUNT(*) FROM article` |
| `userCount` | `COUNT(*) FROM sys_user` |
| `pendingApplications` | `COUNT(*) FROM dealer_application WHERE status='PENDING'` |

**⚠️ `pendingMessages`（留言待处理数）本轮不提供、不冻结。**
它依赖 Support 模块真实合入（PR #103，含：SupportModule 注册进 AppModule、实体接
TypeORM、AdminSupportController 挂 SessionGuard+RolesGuard+@Roles('ADMIN')、
`support_messages` 真实 SQL 增量迁移、真实 MySQL e2e）。上述条件全部满足前，
任何实现/展示都属伪造，后台概览不得出现该字段。

## 4. 数据库

- 迁移：`backend/sql/migrations/mvp07_operation_tables.sql`
  （`site_config`、`banner` 两表，`CREATE TABLE IF NOT EXISTS`，可重复执行）
- Seed：`backend/sql/seed/seed_operation_mvp07.sql`（默认配置 + 2 条演示 Banner，幂等）
- 测试库初始化顺序见 `backend/test/setup-db.ts`，与 `deploy/docker-compose.yml`
  新数据卷初始化一致。

## 5. 错误与权限速查

| 场景 | 结果 |
| --- | --- |
| 游客访问管理接口（携有效 CSRF 对的写请求 / 任意 GET） | 401 `AUTH_401` |
| 普通用户（USER/DEALER）访问管理接口 | 403 `FORBIDDEN_403` |
| 写请求缺/错 CSRF Token | 403 `FORBIDDEN_403`（全局 CsrfGuard） |
| 非白名单配置键 / 非法 URL / 非法排序 | 400 `VALIDATION_400` + `errors` |
| Banner 不存在 | 404 `NOT_FOUND_404` |
