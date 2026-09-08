# WEMOVE 部署说明

## 流水线

- **CI**（`.github/workflows/ci.yml`）：PR 与 `main` 推送运行后端单元测试、真实 MySQL e2e、前后端构建和两个 Docker 镜像构建验证。
- **CD**（`.github/workflows/cd.yml`）：仅在 `main` 的 CI 成功后发布后端与前端镜像到 GHCR，标签为 `latest` 和完整 Git SHA。`v*` 标签额外创建 GitHub Release 构建包。

## 首次部署

1. 复制配置，填写强随机密码，并将 `IMAGE_TAG` 替换为 CD 已发布、已通过 CI 的完整
   40 位 Git SHA（禁止 `latest` 或其他可变标签）：

   ```bash
   cp deploy/.env.example deploy/.env
   # 编辑 deploy/.env：IMAGE_TAG=<已验证的 40 位完整 SHA>
   grep -Eq '^IMAGE_TAG=[0-9a-f]{40}$' deploy/.env || {
     echo 'IMAGE_TAG 必须是 CI/CD 已验证的 40 位小写 Git SHA' >&2; exit 1;
   }
   ```

2. 如果 GHCR 镜像尚未设为公开，先登录：

   ```bash
   echo "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
   ```

3. 拉取并启动：

   ```bash
   docker compose --env-file deploy/.env -f deploy/docker-compose.yml pull
   docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d
   docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
   ```

新数据卷首次启动时，MySQL 会自动按“基线 → MVP-01 迁移 → MVP-03 迁移 → MVP-04 迁移 →
MVP-06 迁移 → MVP-07 迁移 → catalog seed → content seed → operation seed”顺序初始化
（与 `backend/test/setup-db.ts` 的测试库初始化顺序一致）。已有数据卷不会重新执行
初始化脚本，后续数据库变更必须使用新的增量迁移，升级方式见下文「升级与回滚」。

课程验收环境如需演示账号，可在首次启动完成后手动导入：

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T mysql sh -c \
  'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" wemove_portal < /opt/wemove/seed/identity-demo.sql'
```

该命令会创建文档中列出的已知口令账号，禁止在公网生产环境执行。

默认访问地址为 `http://localhost:8080`，可通过 `WEMOVE_HTTP_PORT` 修改。上线到公网前还需要在反向代理或负载均衡器配置正式域名、HTTPS 和备份策略。

## 升级与回滚

**`IMAGE_TAG` 为必填项，且只能填 CI/CD 已验证的完整 Git 提交 SHA**（40 位十六进制，
取自 CD 发布记录），禁止使用 `latest` 或任何可变标签——Compose 中该变量缺失会直接报错，
不提供默认值。部署前确认该 SHA 的镜像已通过 CI（单元测试、构建、真实 MySQL e2e）
并完成 CD 发布，然后执行 `pull` 与 `up -d`。回滚时恢复上一个已验证 SHA 并重复相同命令。

**重要：已有数据卷不会自动执行新迁移。** MySQL 官方镜像只在数据卷首次初始化时运行
`docker-entrypoint-initdb.d` 脚本；对已存在的旧数据卷升级时，必须手动应用新增的增量
迁移（Compose 已把 MVP-04/06/07 迁移挂载到容器 `/opt/wemove/migrations/`）：

```bash
# 示例：为旧数据卷补充 MVP-07 运营域迁移（按缺什么补什么，顺序执行）
docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T mysql sh -c \
  'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" wemove_portal < /opt/wemove/migrations/mvp07_operation_tables.sql'
```

迁移完成后，旧数据卷还需导入 MVP-07 运营 seed（幂等，可重复执行：站点配置用
`ON DUPLICATE KEY UPDATE` 保留已有值，演示 Banner 仅在空表时插入，不会覆盖已有数据）：

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T mysql sh -c \
  'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" wemove_portal < /opt/wemove/seed/seed_operation_mvp07.sql'
```

> 注意：升级路径不会自动执行任何初始化脚本。若跳过 seed，旧卷站点配置/Banner 表为空，
> 公开接口将返回空配置与空列表，需管理员手动创建；验收脚本按已导入 seed 的状态编写。

可重复执行性：MVP-07 迁移使用 `CREATE TABLE IF NOT EXISTS`；MVP-04 迁移同理。
MVP-01/03/06 迁移含 `ALTER TABLE`，重复执行会报 Duplicate 错误——
判断旧卷是否已应用过：只执行缺的，不确定时先在测试库演练。

## 本地容器验证（override）

合并前需要用容器验证未发布代码时，使用本地构建 override，**不得**把未验证代码
当成 `latest` 镜像部署到生产：

```bash
docker-compose --env-file deploy/.env \
  -f deploy/docker-compose.yml -f deploy/docker-compose.local.yml up -d --build
```

生产部署永远只使用 `deploy/docker-compose.yml` 单文件，`IMAGE_TAG` 指向已验证 SHA。

## 备份与恢复

```bash
# 备份（每日定时建议加 --single-transaction）
docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T mysql sh -c \
  'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction wemove_portal' \
  > backup-wemove-$(date +%F).sql

# 恢复（先停 backend 避免写入竞争）
docker compose --env-file deploy/.env -f deploy/docker-compose.yml stop backend
docker compose --env-file deploy/.env -f deploy/docker-compose.yml exec -T mysql sh -c \
  'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" wemove_portal' < backup-wemove-YYYY-MM-DD.sql
docker compose --env-file deploy/.env -f deploy/docker-compose.yml start backend
```

备份文件包含全部业务数据，须妥善保存到部署机之外，不得提交入库。

## 演示冒烟清单

每次部署或数据卷重建后，按 `docs/acceptance/mvp07-smoke.md` 执行最小冒烟：
站点配置生效、Banner 增删改与启停、后台概览数字与数据库一致、身份权限（游客 401 /
普通用户 403 / 管理员可写）、产品/内容/经销商既有闭环不被回归。

## 安全要求

- `deploy/.env` 已加入 `.gitignore`，不得提交真实密码、令牌或服务器地址。
- `MYSQL_ROOT_PASSWORD`、`MYSQL_PASSWORD` 和 `JWT_SECRET` 均为必填项；Compose 缺少它们时会直接拒绝启动。
- 本地 HTTP 验收使用 `COOKIE_SECURE=false`；正式域名启用 HTTPS 后必须改为 `COOKIE_SECURE=true`。
- 应用使用独立 MySQL 用户，不再使用 root 账户连接数据库。
- 演示账号不会自动导入，只允许在隔离的课程验收环境手动创建。
