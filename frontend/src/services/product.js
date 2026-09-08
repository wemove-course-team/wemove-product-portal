/**
 * 产品目录领域 API（#87 MVP-03 维护）
 *
 * 契约基线：#87 issue 评论冻结稿 + #85 统一契约 v1（信封由 services/http.js 解包）
 * - 公开：GET /products（分页/关键词/分类/精选/年龄/排序）、GET /products/:slug、GET /categories
 * - 管理：/admin/products*、/admin/categories*（需 ADMIN 会话，后端裁决权限）
 * - 角色裁剪：dealerPrice/moq 仅在 DEALER/ADMIN 会话下由后端返回，前端只渲染 API 字段，
 *   不得根据本地角色伪造或补算经销商价（决策 D5）
 *
 * 本层不做任何 Mock 兜底：失败抛出 ApiError，由调用方呈现 loading/empty/error 状态。
 */
import http from './http'

/** 列表/搜索共用查询参数 → 清理空值，避免发送 &keyword=undefined 之类的脏参数 */
function cleanParams(params = {}) {
  const query = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) query[key] = value
  }
  return query
}

export const productApi = {
  /**
   * 公开产品列表。
   * @param {object} params { page, pageSize, keyword, categoryId, featured, age, sort }
   * @returns {Promise<{data: {items: ProductListItem[], total, page, pageSize}, requestId}>}
   */
  fetchProducts(params = {}) {
    return http.get('/products', { params: cleanParams(params) })
  },

  /** 公开详情：slug 寻址，纯数字 key 兼容旧 /product/:id 外链（后端兼容解析） */
  fetchProduct(key) {
    return http.get(`/products/${encodeURIComponent(key)}`)
  },

  /** 公开分类列表（含 productCount，只统计已发布产品） */
  fetchCategories() {
    return http.get('/categories')
  },

  /** 管理端产品列表（含草稿/下架，返回完整字段） */
  fetchAdminProducts(params = {}) {
    return http.get('/admin/products', { params: cleanParams(params) })
  },

  /** 管理端产品详情（草稿可取，供编辑页回填） */
  fetchAdminProduct(id) {
    return http.get(`/admin/products/${id}`)
  },

  /** 管理端新增产品（body 见 AdminProductEdit 表单，images 为 URL 数组） */
  createProduct(payload) {
    return http.post('/admin/products', payload)
  },

  /** 管理端编辑产品（partial 更新，仅提交有值字段） */
  updateProduct(id, payload) {
    return http.put(`/admin/products/${id}`, payload)
  },

  /** 发布/下架/精选开关：body { isPublished: 0|1, isFeatured?: 0|1 } */
  updateProductStatus(id, body) {
    return http.put(`/admin/products/${id}/status`, body)
  },

  /** 兼容 DELETE 路由的可恢复归档：后端保留记录，仅从公开目录移除。 */
  deleteProduct(id) {
    return http.delete(`/admin/products/${id}`)
  },

  /** 管理端分类列表（productCount 统计全部产品，含草稿） */
  fetchAdminCategories() {
    return http.get('/admin/categories')
  },

  createCategory(payload) {
    return http.post('/admin/categories', payload)
  },

  updateCategory(id, payload) {
    return http.put(`/admin/categories/${id}`, payload)
  },

  /** 分类删除：分类下仍有产品时后端返回 409，由调用方提示 */
  deleteCategory(id) {
    return http.delete(`/admin/categories/${id}`)
  }
}
