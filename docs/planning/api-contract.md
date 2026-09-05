# API 与业务契约基线

本文件是开发前约定，以下接口**尚未实现**。首日头2小时由cy0207kaw与各领域确认，lizhikeer按同一契约建立services；课程优先保证接口表与实际实现一致，OpenAPI从后端导出，避免手写两份长期漂移。

## 通用协议

- 前缀 `/api/v1`，JSON，字段camelCase；id为字符串，UTC ISO8601时间，金额为十进制字符串。
- 单项 `{ "data": { ... }, "requestId": "..." }`；列表 `{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0 }, "requestId": "..." }`。
- 错误 `{ "code": "VALIDATION_ERROR", "message": "请检查输入", "fieldErrors": { "email": ["格式不正确"] }, "requestId": "..." }`。与原需求snake_case字段语义等价，DTO统一camelCase。
- HTTP 201创建、200查询/更新、204删除/退出；400输入错误、401未登录、403无权限、404无对象/无权访问的私有对象、409状态/唯一键冲突、413上传超限、429限流、500内部错误。204无body，请求ID仍在header中。
- page>=1，pageSize默认20且上限100；排序字段白名单；公开列表只读已发布项，draft不能通过ID绕过列表限制。
- 业务错误码固定，message可读，不回传SQL、堆栈、密码摘要或内部路径。写入接受version做乐观锁；字段更新白名单，不使用全量对象mass assignment。

## 认证与安全边界

同源HttpOnly Cookie会话，生产Secure/SameSite=Lax；本地HTTP仅在明确development配置允许非Secure。登录轮换session，退出/改密/禁用/角色变化撤销相关会话。服务器每次验证用户状态，绝不信任前端role。

`GET /auth/csrf` 提供与会话绑定的CSRF token；写请求使用 `X-CSRF-Token` 并检查Origin，包括登录/注册；后端CORS仅白名单，不使用带凭证的通配源。密码用bcrypt等自适应哈希；找回token为随机单次值、30分钟过期，账户存在与否返回一致消息。登录、找回和表单按IP/账号限流。

课程角色USER/ADMIN/SUPER_ADMIN，后台至少需要ADMIN；创建/停用管理员及修改角色只有SUPER_ADMIN，禁止停用最后一个有效SUPER_ADMIN。用户资料接口不能修改role/status/companyId。

## 课程接口清单

| 方法与路径 | 输入/结果重点 | 权限 | 负责人 |
| --- | --- | --- | --- |
| GET `/health` | 服务是否存活；不泄漏配置 | 公开 | cy0207kaw |
| GET `/auth/csrf` | csrfToken | 公开/预登录会话 | cy0207kaw |
| POST `/auth/register` | username,email,password；输出公开账户 | 公开+限流 | cy0207kaw |
| POST `/auth/login` | identifier,password；会话Cookie | 公开+限流 | cy0207kaw |
| POST `/auth/logout` | 撤销当前会话 | 已登录 | cy0207kaw |
| POST `/auth/forgot-password` | email；统一响应 | 公开+限流 | cy0207kaw |
| POST `/auth/reset-password` | token,newPassword；原子消费 | 单次token+CSRF | cy0207kaw |
| GET/PATCH `/me` | 资料允许字段，禁止角色/状态 | 本人 | cy0207kaw |
| POST `/me/change-password` | currentPassword,newPassword | 本人，验证旧密码 | cy0207kaw |
| GET `/admin/users`；PATCH `/admin/users/:id/status` | 搜索分页、启停 | ADMIN；管理员对象需SUPER_ADMIN | cy0207kaw |
| POST `/admin/admins`；PATCH `/admin/admins/:id` | 管理员创建、角色/启停 | SUPER_ADMIN | cy0207kaw |
| GET `/products`；GET `/products/:slug` | q,category,page；显式ProductPublicDTO | 公开 | Snowed-night |
| GET `/product-categories` | 已发布产品所属分类 | 公开 | Snowed-night |
| GET/POST `/admin/products`；GET/PATCH/DELETE `/admin/products/:id` | 管理含草稿；删除改归档；version | ADMIN | Snowed-night |
| GET/POST `/admin/product-categories`；PATCH/DELETE `/admin/product-categories/:id` | 分类CRUD，引用与循环校验 | ADMIN | Snowed-night |
| GET `/news`；GET `/news/:slug`；GET `/pages/:slug` | 新闻分页/分类；固定品牌页 | 公开 | serein7758521 |
| GET/POST `/admin/content`；GET/PATCH/DELETE `/admin/content/:id` | type,title,slug,category,bodyHtml,status | ADMIN | serein7758521 |
| GET `/content-categories`；GET/POST `/admin/content-categories`；PATCH/DELETE `/admin/content-categories/:id` | 新闻分类公开读/后台管理 | 按端区分 | serein7758521 |
| POST `/inquiries` | name,email,subject,message,productId可空；ticketNo | 公开+限流/防重 | 22099yang |
| GET `/me/inquiries`；GET `/admin/inquiries`；PATCH `/admin/inquiries/:id` | 本人记录；后台status/内部备注 | 本人/ADMIN | 22099yang |
| GET `/site`；GET `/banners` | 仅公开配置白名单与启用Banner | 公开 | chenyi-c |
| GET/PATCH `/admin/settings`；GET/POST `/admin/banners`；PATCH/DELETE `/admin/banners/:id` | 设置和Banner CRUD/排序/启停 | ADMIN | chenyi-c |
| GET `/admin/overview` | 已有真实表count，标明定义/时间 | ADMIN | chenyi-c |
| GET `/admin/media`；POST `/admin/media`（P1） | 列出现有核对素材；受控上传 | ADMIN | 22099yang |
| POST `/dealer-applications`；GET `/me/dealer-application`（P1） | 简化申请，服务端确定applicant | 本人 | GLOCKDDD |
| GET `/admin/dealer-applications`；POST `/admin/dealer-applications/:id/review`（P1） | decision=APPROVED/REJECTED,reason,version | ADMIN | GLOCKDDD |

GET管理详情返回数据和version。软删除返回204但保留历史记录。新闻和产品已被引用时归档；分类有引用返回409。批量删除如时间不足，由UI逐项确认调用单项接口并报告成功/失败明细，不伪造全成功。

上传P1只接受JPEG/PNG/WebP，图片<=5MiB，检查文件头/像素上限，重编码移除元数据；拒绝SVG、可执行文件及任意HTML，随机file_key防路径穿越。暂不做上传时隐藏上传按钮，只提供已导入白名单资源选择。经销商私有PDF上传不在课程阶段开放。

## 关键流程与跨模块交接

产品公开DTO至少有id,slug,name,summary,description,category,images,规格与展示状态；**任何匿名产品接口、HTML、搜索响应都不返回dealer_price、discount_rate**。价格/折扣逻辑先从正式流程中关闭，交易模块按M5再实现。

新闻：DRAFT→PUBLISHED→ARCHIVED；发布需标题、slug、有效正文与主图，未达到则400。产品沿用is_published并新增归档区分，避免用户删除后旧链接跳转首页。留言：NEW→IN_PROGRESS→RESOLVED→CLOSED；内部备注不出现在本人接口。

经销商课程：PENDING→APPROVED或REJECTED；重复审核409，用户不能自行写decision。M4增加SUBMITTED/UNDER_REVIEW/NEEDS_INFO和成员激活，通过ADR与迁移做兼容，不混用当前三个状态。

前后端交接时，各负责人给出一次成功、一次验证错误、一次401/403响应样例。lizhikeer完成统一错误展示后，各领域自行联调；接口改动必须同步消费方和此表。

## 长期契约

M4按权限模块/动作细分RBAC，服务端每次根据成员资格校验企业作用域，URL中的企业ID不可信；加入审计、私有短时下载、发布缓存失效和SEO API。M5 `/dealer/quotes`、`/orders`、`/payments/webhooks/:provider`、`/inventory/reservations` 启动前分别冻结状态机及OpenAPI。

报价接受、下单、退款和Webhook必须幂等；同键同载荷复用结果，同键不同载荷409。Webhook签名在原始请求体上验证；最终金额、税费、库存由后端重算。鉴权失败与商业状态失败区分，前端不能通过切换角色绕开。
