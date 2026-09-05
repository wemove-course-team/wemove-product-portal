# 资料依据与边界

## 本地资料

资料目录为用户提供的桌面“短学期”，原件保持不变，不直接复制到公开仓库。DOCX定位P编号按 `word/document.xml` 顺序的段落计数，包含表格段落；PDF按物理页码。

| 资料 | 定位 | 本次使用 |
| --- | --- | --- |
| 软件开发实践2.pdf | 第2页 | 开发语言与数据库不限 |
| 软件开发实践2.pdf | 第3–4页 | 评分与八项交付材料，个人技术报告、组内讨论记录要求 |
| 软件开发实践2.pdf | 第5页 | 提交命名为示例，实际班次/组号/实名仍需补录 |
| 选题1 公司主页系统需求文档.docx | P37–P105、P268–P274 | 新闻/产品/账户/管理/设置、密码找回及验收 |
| 选题1 公司主页系统需求文档.docx | P112–P125、P278–P282 | 性能、响应式、安全、交付物 |
| 网站重构需求.docx | V1.0，2026-09-04，P11–P37 | 完整商业产品愿景、数据维护、成年访问者范围 |
| 网站重构需求.docx | P145–P164、P483–P633 | RBAC、用户中心、经销商、支持与内容 |
| 网站重构需求.docx | P983–P1072 | 经销商/订单/报价状态机、SKU与价格库存规则 |
| 网站重构需求.docx | P1250–P1296、P1484–P1490 | 核心实体和API要求 |
| 网站重构需求.docx | P1491–P1568、P1694–P1784 | 安全、性能、完整验收及建议架构 |

用户在本次对话补充：项目是2–3天完成的课程作业，尚无具体成员职责，lizhikeer可多承担前端内容，并负责最终UI。时间与分工以此为本次规划约束。

## 仓库证据

基点 `c92b0ec8`，2026-09-05克隆并核查：

- `frontend/package.json` / `package-lock.json`：Vue3/Vite/Pinia/Element Plus，只有dev/build/preview。
- `frontend/src/stores/user.js`：login调用switchRole，无服务器密码验证。
- `frontend/src/stores/cart.js`：本地订单，B2C直接标为PAID。
- `frontend/src/router/index.js`：无真正后端权限边界，未知路由重定向首页。
- `backend/sql/init_schema_and_data.sql`：7张MySQL演示表、DROP TABLE、seed，未有服务应用。
- `.github/CODEOWNERS`：原文件含字面量反引号r/n，需恢复合法换行。
- GitHub协作者API返回七人；main保护有1位审批且enforce_admins=true。
- PR #1开放、#2/#3已合并；本轮保留历史和现有开放PR。

本轮构建成功，业务能力仍需后续实现与验收。公共网站资料未用于证明已有素材的品牌授权；产品材质、年龄、安全认证及成交价需业务方核对。

## 规划采用的外部说明

- [NestJS模块](https://docs.nestjs.com/modules)：模块化单体边界参考。
- [MySQL发布模型](https://dev.mysql.com/doc/refman/8.4/en/mysql-releases.html)：LTS系列选择参考。
- [Nuxt渲染模式](https://nuxt.com/docs/3.x/guide/concepts/rendering)：未来SSR/混合渲染方案参考，不将旧版文档当成未来精确依赖版本。
- [Node发布说明](https://nodejs.org/en/about/previous-releases)：运行时选择背景；实际本轮用24.11.1验证。

性能、可用性、工作小时和长期时间均为目标/估算。框架官方能力、公开资料、已有Mock、计划功能、团队完成结果分开记录。
