# WEMOVE 协作规则

1. 先读 `README.md`、`PROJECT_MAP.md`、`CONTRIBUTING.md` 和对应 Issue；检查 `git status`，保留他人改动。
2. 本项目规划见 `docs/planning/`；未来目录与未来能力不代表已经实现。未经任务授权不提前实现后续里程碑。
3. 前端沿用 `frontend/src/views`、`components`、`stores`，通过 `services` 接 API；不另搭第二套前端。共享样式由 lizhikeer 协调。
4. 领域负责人负责自己的前台、后台页面、API、迁移和测试；operation 不承接全站业务 CRUD。
5. 权限、价格、企业边界、订单状态由服务端判断；不信任 localStorage 角色和客户端金额。
6. `backend/sql/init_schema_and_data.sql` 会删表。不得在共享库/生产库执行，不得为清理仓库删除原始资源或重写 Git 历史。
7. 先定位和读取相关文件，做最小变更。代码通过 PR 合并；公共契约或结构变化需同步文档和消费方。
8. 当前可运行验证是 `cd frontend; npm ci; npm run build`。新增脚本后按实际命令验证；不得把未运行的测试、Mock 或计划中的门禁写成已通过。
9. 不提交密钥、个人数据、node_modules、dist、数据库数据目录及未经核对的商业宣传。原始课程材料留在本地。
10. 七人分工、任务依赖和交付证据以 `docs/planning/team-roadmap.md`、`issue-index.md` 为入口；不要凭代码行数编造实际工作量。
