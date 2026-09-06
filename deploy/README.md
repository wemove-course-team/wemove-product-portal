# 部署说明（CI/CD 的 D）

## 流水线

- **CI**（`.github/workflows/ci.yml`）：对 PR 与 main 推送运行——
  后端单元测试 + **e2e 测试**（GitHub Actions `mysql:8` service 容器 + 自动建库建表 seed）+ 后端构建；前端构建。
- **CD**（`.github/workflows/cd.yml`）：main 合入后自动构建两个 Docker 镜像并发布到 GHCR
  （`ghcr.io/wemove-course-team/wemove-backend` / `wemove-frontend`，tag `latest` + 短 SHA）；
  打 `v*` tag 时额外把前端 dist 与后端 dist 打包挂到 GitHub Release。

## 服务器部署（手动触发，两个命令）

```bash
docker compose -f deploy/docker-compose.yml pull
docker compose -f deploy/docker-compose.yml up -d
```

首次部署先按 `docker-compose.yml` 头部注释初始化数据库（一次性执行基线 SQL + 增量迁移 + seed）。

## 归属说明（AI_DEVELOPMENT_RULES 规则 5）

Compose 与 CI 的公共目录归交付负责人（#91/#86）维护。本目录是 MVP-03 交付其
CD 流水线所需的最小实现：`docker-compose.yml` 只编排 CD 产出的镜像；若 #91 的
正式 Compose 落地，可整体迁移或替换本目录，工作流文件（workflows/）按路径
`backend/**`、`frontend/**` 触发，不影响其他领域任务。
