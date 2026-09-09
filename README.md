# WEMOVE 产品门户

WEMOVE 产品与内容管理平台是“软件开发实践 2”课程项目，使用 Vue 3、Element Plus、
NestJS、TypeORM 与 MySQL 实现官网、账户、运营后台和经销商门户。

## 已实现范围

- 身份与用户：注册、登录、资料/密码、找回密码、用户查询和启停。
- 产品目录：分类、搜索、分页、详情、发布状态、后台产品与分类维护。
- 内容 CMS：首页内容、栏目页、新闻、文章与页面管理。
- 支持中心：联系留言、FAQ、下载权限和后台处理。
- 经销商：申请、审核、角色升级、专属价格与门户。
- 站点运营：站点配置、首页 Banner、真实业务统计与部署交付。

## 本地开发

```bash
cd backend
npm ci
npm run start:dev
```

```bash
cd frontend
npm ci
npm run dev
```

前端默认运行在 `http://localhost:3000`，并把 `/api` 代理到 `http://localhost:3001`。
数据库结构使用 `backend/sql/` 下的基线、增量迁移和 seed，禁止依赖 TypeORM 自动建表。

## 验证

```bash
cd backend
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

```bash
cd frontend
npm test
npm run build
```

容器部署、升级、备份与恢复见 `deploy/README.md`；MVP07 冒烟步骤见
`docs/acceptance/mvp07-smoke.md`；课程测试报告与测试用例见
`docs/课程项目测试报告.md`。
