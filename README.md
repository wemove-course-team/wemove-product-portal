# WEMOVE 产品与内容管理平台

软件开发实践2七人课程项目，长期建设运动玩具品牌官网、内容运营和经销商业务门户。先交付真实的内容、产品、账户及后台闭环，再演进交易能力。

## 当前状态

截至 2026-09-05，`main` 的 Vue 3 页面和本地演示数据已存在；后端只有演示 SQL，尚无 API。角色切换、审核、购物车和订单均为 Mock，**不能视为真实鉴权、支付或履约**。`package.json` 的 `1.0.0` 也不代表已经发布课程交付版。

本规划分支提供开发准备文件，不修改业务页面、不执行数据库脚本。规划合并后作为团队基线；功能完成情况以 Issue 验收证据为准。

## 从这里开始

| 入口 | 用途 |
| --- | --- |
| [总体规划](docs/planning/README.md) | 目标、阶段、决策和启动顺序 |
| [范围与现状](docs/planning/scope-baseline.md) | 课程要求、重构远景、现有缺口及来源 |
| [前后端架构](docs/planning/architecture.md) | 当前到长期的架构演进 |
| [数据库设计](docs/planning/database.md) | 核心表、约束、关系及迁移策略 |
| [API 基线](docs/planning/api-contract.md) | 路由、鉴权、错误、状态机及模块接口 |
| [七人分工与路线图](docs/planning/team-roadmap.md) | 负责人、协作方式、估算和里程碑 |
| [质量与交付](docs/planning/quality-release.md) | 验收、测试、发布、课程材料 |
| [Docker与Linux部署](docs/planning/deployment.md) | Compose容器、环境、持久卷、迁移、备份及更新 |
| [任务索引](docs/planning/issue-index.md) | 已建立的 GitHub Issues、依赖及负责人 |
| [贡献规范](CONTRIBUTING.md) | 分支、PR、评审与变更管理 |
| [目录地图](PROJECT_MAP.md) | 已存在目录和未来按需创建的目录 |

## 部署目标与开发运行

正式课程交付采用 **Linux服务器 + Docker Engine + Docker Compose**，web（Nginx/Vue）、api（NestJS）、db（MySQL）分容器，迁移一次性执行。容器配置由B01/B03/Q04任务实现；目前尚未生成Dockerfile/Compose，也未部署服务器。

下面的npm命令仅用于开发现有前端，不能替代最终Linux容器验收。

准备 Node.js 24 LTS 与 npm 11；本地基线验证使用 Node 24.11.1 / npm 11.6.2。依赖版本以已有锁文件为准，不在环境准备时批量升级。

```powershell
cd frontend
npm ci
npm run dev
```

开发服务器默认端口 3000。若已被占用，请使用其他端口，不结束他人的服务。

```powershell
npm run build
```

目前只有构建命令；lint、类型检查、自动化业务测试由 M0/M1 任务补齐。新增 `Frontend build` 工作流验证已有构建；不执行不存在的后端命令。

## 数据与资源

`backend/sql/init_schema_and_data.sql` 包含 `DROP TABLE`，仅用于可丢弃的个人演示库，禁止用于共享库或生产库。真实后端改用增量迁移；课程只使用人工构造的测试数据。

原有图片继续保留。资源出处、授权及产品参数需逐项核对；课程演示素材不能自动作为品牌正式发布素材。桌面原始资料不直接上传公开仓库，引用定位见 [资料依据](docs/planning/source-evidence.md)。
