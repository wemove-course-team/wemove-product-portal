# 项目目录地图

## 已有目录

```text
.github/                  协作规则、模板和前端构建工作流
frontend/
  public/images/          现有静态素材，保留原路径
  src/views/             路由页面，后续按领域分子目录
  src/components/        公共 UI
  src/stores/            Pinia，目前含本地 Mock
  src/router/            路由定义
  src/data/              静态演示内容
  src/styles/            全局主题与布局
backend/sql/             仅有破坏性演示初始化脚本
docs/planning/           总体规划、架构、数据、任务和验收
docs/decisions/          架构决策记录
```

## 启动对应任务后才创建

| 路径 | 职责 | 负责人 |
| --- | --- | --- |
| `frontend/src/services/` | 单一 HTTP 客户端和各领域 API | lizhikeer 建基线，各领域维护 |
| `frontend/src/views/{content,product,support,dealer,account,operation}/` | 页面及私有组件，逐页迁移 | 各领域负责人 |
| `frontend/src/composables/` | 已出现复用需求的组合逻辑 | 对应作者 |
| `frontend/src/types/` | 生成的 API 类型与必要前端类型 | lizhikeer |
| `backend/src/modules/{identity,catalog,content,support,dealer,operation,media}/` | 按领域组织后端模块 | 各领域负责人 |
| `backend/src/common/` | 鉴权守卫、错误和请求上下文 | cy0207kaw |
| `backend/migrations/` | 有序、已执行后不可修改的迁移 | Snowed-night 协调，各领域编写 |
| `backend/test/`、`frontend/tests/`、`tests/e2e/` | 模块、契约和真实流程测试 | 各领域与轮值测试成员 |
| `contracts/openapi.yaml` | 从后端导出的机器契约，课程先用 API 基线表 | cy0207kaw，lizhikeer 对接消费方 |
| `infra/`、`docs/delivery/` | 部署、运行手册和课程交付证据 | chenyi-c 协调、全员提交 |
| `compose.yaml`、`compose.prod.yaml`、`infra/nginx/default.conf` | Linux正式部署、网络、卷、健康检查和同源代理 | chenyi-c |
| `frontend/Dockerfile`、`frontend/.dockerignore` | Linux多阶段构建与Nginx静态镜像 | chenyi-c，lizhikeer确认 |
| `backend/Dockerfile`、`backend/.dockerignore` | 后端及一次性迁移镜像 | cy0207kaw |

不创建空占位目录，不新建平行的第二套前端工程。Nuxt 演进先做单页验证，再沿当前 `frontend/` 演进；只有独立部署收益明确时才另立管理端应用并记录 ADR。
