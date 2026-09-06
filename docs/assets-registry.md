# WEMOVE 静态资源与文件登记表 (Assets Registry)

本文档记录 `frontend/public/images/` 目录下经过核对的公共访问路径及分类。供产品、内容与 Banner 模块直接引用。

## 1. 电子与数码产品类 (Electronic)
| 资源名称 | 相对访问路径 | 来源/用途 | 访问级别 |
| :--- | :--- | :--- | :--- |
| 电子类网格展示图 (Grid 0) | `/images/electronic_grid0_0_1c281559-002.png` | 电子产品模块 | 公开 (Public) |
| 电子类网格展示图 (Grid 0-1) | `/images/electronic_grid0_1_566948c5-d12.png` | 电子产品模块 | 公开 (Public) |
| 电子类网格展示图 (Grid 0-2) | `/images/electronic_grid0_2_d8d2bc61-702.png` | 电子产品模块 | 公开 (Public) |
| 电子类网格展示图 (Grid 0-3) | `/images/electronic_grid0_3_df5039d9-0bc.png` | 电子产品模块 | 公开 (Public) |
| 电子类网格展示图 (Grid 1-15 集合) | `/images/electronic_grid[1-15]_[0-3]_*.png` | 电子产品矩阵资源 (共 50 张) | 公开 (Public) |

## 2. 核心产品列表 (Products)
| 资源名称 | 相对访问路径 | 来源/用途 | 访问级别 |
| :--- | :--- | :--- | :--- |
| 产品 14 主图/副图 | `/images/prod_14_1.jpg`, `/images/prod_14_2.jpg` | 产品详情展示 | 公开 (Public) |
| 产品 15 主图/副图 | `/images/prod_15_1.jpg`, `/images/prod_15_2.jpg` | 产品详情展示 | 公开 (Public) |
| 产品 16 主图/副图 | `/images/prod_16_1.jpg`, `/images/prod_16_2.jpg` | 产品详情展示 | 公开 (Public) |
| 产品 17 主图/副图 | `/images/prod_17_1.jpg`, `/images/prod_17_2.jpg` | 产品详情展示 | 公开 (Public) |
| 产品 18 主图/副图 | `/images/prod_18_1.jpg`, `/images/prod_18_2.jpg` | 产品详情展示 | 公开 (Public) |
| 产品 19 主图/副图 | `/images/prod_19_1.jpg`, `/images/prod_19_2.jpg` | 产品详情展示 | 公开 (Public) |
| 产品 20 主图 | `/images/prod_20_1.jpg` | 产品详情展示 | 公开 (Public) |

## 3. 主题与特定板块素材
| 资源板块 | 代表路径示例 | 资源总量 | 访问级别 |
| :--- | :--- | :--- | :--- |
| 公益/慈善 (Charity) | `/images/charity_grid6_0_818521ff-ad1.jpg`, `/images/charity_s0_0d9d67d1-bde.png` | 8 张 | 公开 (Public) |
| 梦想/专题 (Dream) | `/images/dream_grid5_0_e3486465-542.jpeg`, `/images/dream_s0_8cbf0a99-297.png` | 7 张 | 公开 (Public) |
| 家具与家居 (Furniture) | `/images/furniture_s0_f9590908-a1a.png` ~ `furniture_s4_b7120359-b98.png` | 5 张 | 公开 (Public) |
| 图书与借阅 (Library) | `/images/library_s0_f1f5d796-c1f.png` | 1 张 | 公开 (Public) |
| STEM 教育 (STEM) | `/images/stem_grid7_0_c93bc32b-a75.jpg`, `/images/stem_s0_3eea7200-6ed.jpg` | 6 张 | 公开 (Public) |
| 木工实验室 (Woodlab) | `/images/woodlab_grid3_0_13f6b934-510.png`, `/images/woodlab_s0_6337d9b4-4fa.png` | 7 张 | 公开 (Public) |

## 4. 说明与下载接口对接
* **电子说明书/文件下载路径**：默认存放在 `frontend/public/downloads/` 下，通过后端接口 `/api/v1/support/downloads` 进行鉴权与路由分发。
* **访问权限规则**：本表格所列资源均为 `Public` 级别，前台可以直接静态引用。