# MVP-07 部署演示冒烟清单（#91）

> 本清单只覆盖 **API 层**验收（MVP-07 后端范围）。Header/Footer/首页/后台页面的
> UI 接入由 lizhikeer 负责（见文末「UI 验收」），未接入前**不得**声称本分支已完成页面验收。
>
> 前提：按 `deploy/README.md` 完成启动（`IMAGE_TAG` 指向已验证 SHA）。
> **定义 `BASE_URL=http://<host>:<WEMOVE_HTTP_PORT>`**（默认 Compose 映射为
> `http://<host>:8080`，`WEMOVE_HTTP_PORT` 在 `deploy/.env` 中配置），下述示例
> 均直接使用 `$BASE_URL`，可原样执行。演示口令账号仅限隔离验收环境
> 手动导入。所有"管理端"操作以 `admin / Wemove@123` 执行（仅演示环境）。
>
> **Support（MVP-05）现状**：仓库虽存在 Support 历史代码文件（随 #93 合入），但
> `SupportModule` **未在 app.module.ts 注册**、无可用 SQL 迁移、无真实 e2e，
> **不是可运行能力，也不属于任何验收项**；留言相关后台统计（pendingMessages）
> 依赖 MVP-05 真正合入后方可实现。
>
> 写请求约定（契约 D4）：
> - 未携带/错误 CSRF → **403** `FORBIDDEN_403`（全局 CsrfGuard 先行）；
> - 携带有效 CSRF 对（CSRF Cookie + `X-CSRF-Token`）但未登录 → **401** `AUTH_401`；
> - 已登录非管理员 → **403** `FORBIDDEN_403`。

## 步骤（curl / HTTP）

```bash
BASE_URL=http://<host>:8080   # 按实际 WEMOVE_HTTP_PORT 修改
```

| # | 步骤 | 预期 |
| --- | --- | --- |
| 1 | `curl -i $BASE_URL/api/v1/health`；前端容器 `curl -i $BASE_URL/healthz` | 200，容器 healthy |
| 2 | `curl $BASE_URL/api/v1/site/config` 与 `curl $BASE_URL/api/v1/banners` | code=0；配置含全部 7 个白名单键；banners 仅启用项、按 `sortOrder,id` 升序（seed 默认 2 条） |
| 3 | 取 CSRF：`curl -c jar.txt $BASE_URL/api/v1/auth/csrf`；登录 admin；再 `PUT $BASE_URL/api/v1/admin/site/config`（携带 Cookie+`X-CSRF-Token`）更新 `siteName` | 200；重复步骤 2 的 config 读取新值 |
| 4 | `POST $BASE_URL/api/v1/admin/banners` 新增 → `GET $BASE_URL/api/v1/banners` 可见；`PUT $BASE_URL/api/v1/admin/banners/:id/status` `{isActive:false}` → 公开列表消失；再启用恢复；`DELETE` 后不可见 | 每步实时一致 |
| 5 | `PUT $BASE_URL/api/v1/admin/banners/sort` 批量排序 | 200；`GET $BASE_URL/api/v1/banners` 顺序按新 sortOrder 稳定排列 |
| 6 | `PUT $BASE_URL/api/v1/admin/site/config` 提交非法值（`logoUrl:"javascript:alert(1)"`、含反斜杠的 `/\evil.example/path` 或未知键） | 400 `VALIDATION_400`，errors 含对应 field；重复步骤 2 确认数据不变 |
| 7 | `GET $BASE_URL/api/v1/admin/stats/overview` | 数字与数据库 `COUNT(*)` 一致（product/article/sys_user/PENDING 申请）；**不含** pendingMessages（Support/MVP-05 尚未真正接入、当前不可运行） |
| 8 | 权限矩阵：游客**携带有效 CSRF 对**访问任意 `/admin/*` → 401；游客写请求**不携带** CSRF → 403；`demo_user` → 403 | 均返回契约错误体 |
| 9 | 数据持久化：`docker compose restart backend mysql` 后重复步骤 2/7 | 配置与 Banner 数据不丢失 |
| 10 | 既有闭环回归（API 层）：产品列表/详情、文章列表/详情、经销商申请（`demo_user` 提交、`admin` 审核） | 与 MVP-03/04/06 验收一致 |
| 11 | 留言入口（**Support 不可运行，禁止作为验收项**） | 不得展示"留言处理完成"类假数据或任何留言统计；入口按「暂未开放」处理，待 MVP-05 合入并注册模块、提供迁移后再验收 |

## 数据卷升级冒烟（对旧数据卷部署时额外执行）

| # | 步骤 | 预期 |
| --- | --- | --- |
| U1 | 按 README「升级与回滚」手动应用缺失迁移（mvp04/06/07）与 MVP-07 幂等 seed | 命令退出码 0；重复执行同一 ALTER 迁移报 Duplicate 属预期；seed 可重复执行且不覆盖已有配置/Banner |
| U2 | 升级后执行上表 1–10 | 全部通过 |

## UI 验收（lizhikeer 前端接入 MVP-07 API 之后才可执行）

以下属于前端交付范围，**当前分支未实现，不得计入本分支完成事项**：

| # | 步骤 | 预期 |
| --- | --- | --- |
| UI1 | 前台 Header/Footer/首页经 `frontend/src/services/http.js` 读取 `GET /site/config`、`GET /banners` | 显示站点名、页脚与启用横幅 |
| UI2 | 管理后台页面：编辑配置 / Banner 增删改与排序 / 概览统计 | 操作经既有 CSRF 单例发起，400/401/403 错误有用户可见提示 |
| UI3 | 前端全部走 http.js 单例（无绕过直连、无 localStorage/Mock 配置） | 与 docs/operation-contract.md 冻结契约一致 |
