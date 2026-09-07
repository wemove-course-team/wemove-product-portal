# WEMOVE 部署说明

## 流水线

- **CI**（`.github/workflows/ci.yml`）：PR 与 `main` 推送运行后端单元测试、真实 MySQL e2e、前后端构建和两个 Docker 镜像构建验证。
- **CD**（`.github/workflows/cd.yml`）：仅在 `main` 的 CI 成功后发布后端与前端镜像到 GHCR，标签为 `latest` 和完整 Git SHA。`v*` 标签额外创建 GitHub Release 构建包。

## 首次部署

1. 复制配置并填写强随机密码：

   ```bash
   cp deploy/.env.example deploy/.env
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

新数据卷首次启动时，MySQL 会自动按“基线 → MVP03 迁移 → catalog seed → 演示账号”顺序初始化。已有数据卷不会重新执行初始化脚本，后续数据库变更必须使用新的增量迁移。

默认访问地址为 `http://localhost:8080`，可通过 `WEMOVE_HTTP_PORT` 修改。上线到公网前还需要在反向代理或负载均衡器配置正式域名、HTTPS 和备份策略。

## 更新与回滚

部署特定提交时，将 `IMAGE_TAG` 设为 CD 发布的完整 Git SHA，然后执行 `pull` 与 `up -d`。回滚时恢复上一个已验证 SHA 并重复相同命令，不要依赖可变的 `latest` 标签。

## 安全要求

- `deploy/.env` 已加入 `.gitignore`，不得提交真实密码、令牌或服务器地址。
- `MYSQL_ROOT_PASSWORD`、`MYSQL_PASSWORD` 和 `JWT_SECRET` 均为必填项；Compose 缺少它们时会直接拒绝启动。
- 应用使用独立 MySQL 用户，不再使用 root 账户连接数据库。
- 演示账号只适用于课程验收，公开部署前必须禁用或更换口令。
