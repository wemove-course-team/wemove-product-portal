# WeMove 素材登记表

本表记录支持中心和其他页面可复用的静态资源。Issue #89 本轮不做文件上传，下载资源的 `file_url` 只引用 `frontend/public/` 文件或经过核对的外链。

## 电子说明书与下载资源

| 资源 | 路径 | 来源/用途 | 访问级别 |
| --- | --- | --- | --- |
| 电子说明书示例 | `/images/electronic_grid0_0_1c281559-002.png` | `frontend/public/images/`，manual 下载演示 | PUBLIC |
| 经销商资料示例 | `/images/electronic_grid1_0_c4ebc66c-1c4.png` | `frontend/public/images/`，dealer 权限演示 | DEALER |

## 产品和栏目图片

| 资源组 | 路径示例 | 来源/用途 | 访问级别 |
| --- | --- | --- | --- |
| 产品图 | `/images/prod_14_1.jpg`、`/images/prod_20_1.jpg` | `frontend/public/images/`，产品详情和列表 | PUBLIC |
| Electronic 栏目图 | `/images/electronic_grid0_0_1c281559-002.png` | `frontend/public/images/`，电子说明书入口 | PUBLIC |
| Furniture / WoodLab / STEM | `/images/furniture_s0_f9590908-a1a.png`、`/images/woodlab_s0_6337d9b4-4fa.png`、`/images/stem_s0_3eea7200-6ed.jpg` | `frontend/public/images/`，栏目展示 | PUBLIC |
| Charity / Dream / Library | `/images/charity_s0_0d9d67d1-bde.png`、`/images/dream_s0_8cbf0a99-297.png`、`/images/library_s0_f1f5d796-c1f.png` | `frontend/public/images/`，栏目展示 | PUBLIC |

## 使用约定

- 新增下载记录前先确认路径在 `frontend/public/` 下，或确认外链可访问。
- 公开页面通过 `/api/v1/downloads` 获取列表；打开资料前调用 `/api/v1/downloads/:id/access` 做权限校验并记录下载次数。
- `PUBLIC/USER/DEALER` 是下载列表和接口访问级别；本轮文件仍位于公开静态目录，因此它保护的是资源发现、访问接口和下载计数，不是静态 URL 本身。需要真正的文件级权限时，应迁移到受保护的后端流式下载或私有对象存储。
- 不提交上传组件、multipart 接口、私有对象存储或未核对的个人资料。
