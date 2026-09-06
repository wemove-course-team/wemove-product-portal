# wemove-portal-backend

NestJS + TypeORM + MySQL 8 后端。本轮（MVP-03）提供可运行的最小骨架与完整的产品目录域。

> 归属说明（AI_DEVELOPMENT_RULES 规则 5）：`src/modules/catalog/`（#87 MVP-03）为本次交付；
> `src/common/` 与根工程文件（package.json / main.ts / app.module.ts）是按 #85 冻结契约 v1
> 编写的**最小脚手架**，#85 MVP-01 合并时以其正式实现为准；`src/modules/dev-auth/` 为
> 联调用临时登录（login / me / csrf），#85 的 identity 模块就绪后删除并替换
> （AppModule 内已标注替换点）。

## 本地启动

```bash
# 0) 准备数据库（任选）：本地 MySQL 8 或 Docker
docker run -d --name wemove-mysql -e MYSQL_ROOT_PASSWORD=wemove123 -p 3306:3306 mysql:8.0

# 1) 初始化：基线建表 + 种子（一次性，基线冻结决策 D6）
mysql -h127.0.0.1 -uroot -pwemove123 < sql/init_schema_and_data.sql

# 2) 增量迁移（一次性）：updated_at / product.uk_slug / product_category.uk_slug
mysql -h127.0.0.1 -uroot -pwemove123 wemove_portal < sql/migrations/mvp03_catalog_incremental.sql

# 3) seed（可重复执行，幂等 upsert）
mysql -h127.0.0.1 -uroot -pwemove123 wemove_portal < sql/seed/seed_catalog_mvp03.sql
mysql -h127.0.0.1 -uroot -pwemove123 wemove_portal < sql/seed/seed_identity_demo_accounts.sql

# 4) 启动后端（3001）
cp .env.example .env   # 按需改数据库口令
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

## 接口速览（统一前缀 /api/v1）

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/products?page&pageSize&keyword&categoryId&featured&age&sort` | 公开 | 分页列表（pageSize 上限 50），仅已发布 |
| GET | `/products/:slug` | 公开 | 详情；DEALER/ADMIN 会话附加 dealerPrice/moq |
| GET | `/categories` | 公开 | 分类（productCount 只统计已发布） |
| GET/POST/PUT/DELETE | `/admin/products*` | ADMIN | 产品管理；`PUT /admin/products/:id/status` 发布/下架 |
| GET/POST/PUT/DELETE | `/admin/categories*` | ADMIN | 分类管理；分类下有产品时删除返回 409 |
| GET | `/auth/csrf` · POST `/auth/login` `/auth/logout` · GET `/auth/me` | 公开/登录 | 临时联调登录（dev-auth，#85 交付后替换） |

## 测试

```bash
npm test    # 产品域单元测试（角色裁剪 / 唯一性 / 分页 / 下架不可见 / 分类删除校验）
```
