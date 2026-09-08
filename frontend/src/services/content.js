/**
 * 内容与 CMS 领域 API（#88 MVP-04 维护）
 *
 * 契约基线：#88 issue 评论冻结稿 + #85 统一契约 v1（信封由 services/http.js 解包）
 * - 公开接口：
 *   - GET /pages/:slug (furniture, woodlab, stem, library, charity, dream, electronic)
 *   - GET /articles (分页/分类/关键词检索)
 *   - GET /articles/:slug (公开文章详情)
 *   - GET /article-categories (文章分类列表)
 * - 管理接口：/admin/articles*、/admin/article-categories*、/admin/pages* (需 ADMIN 会话与 CSRF)
 *
 * 本层不做任何 Mock 兜底：失败抛出 ApiError，由调用方呈现 loading/empty/error 状态。
 */
import http from './http'

/** 清理空值查询参数 */
function cleanParams(params = {}) {
  const query = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) query[key] = value
  }
  return query
}

export const contentApi = {
  // ============================== 公开接口 ==============================

  /** 获取栏目单页内容 */
  getPage(slug) {
    return http.get(`/pages/${encodeURIComponent(slug)}`)
  },

  /** 获取文章列表（公开已发布） */
  getArticles(params = {}) {
    return http.get('/articles', { params: cleanParams(params) })
  },

  /** 获取文章详情 */
  getArticle(slug) {
    return http.get(`/articles/${encodeURIComponent(slug)}`)
  },

  /** 获取所有文章分类 */
  getCategories() {
    return http.get('/article-categories')
  },

  // ============================== 管理接口（需 ADMIN 权限） ==============================

  /** 管理端获取文章列表 */
  adminGetArticles(params = {}) {
    return http.get('/admin/articles', { params: cleanParams(params) })
  },

  /** 管理端获取文章详情 */
  adminGetArticle(id) {
    return http.get(`/admin/articles/${id}`)
  },

  /** 管理端新增文章 */
  adminCreateArticle(payload) {
    return http.post('/admin/articles', payload)
  },

  /** 管理端编辑文章 */
  adminUpdateArticle(id, payload) {
    return http.put(`/admin/articles/${id}`, payload)
  },

  /** 管理端切换文章发布状态 */
  adminUpdateArticleStatus(id, status) {
    return http.put(`/admin/articles/${id}/status`, { status })
  },

  /** 管理端删除文章 */
  adminDeleteArticle(id) {
    return http.delete(`/admin/articles/${id}`)
  },

  /** 管理端获取分类列表 */
  adminGetCategories() {
    return http.get('/admin/article-categories')
  },

  /** 管理端获取分类详情 */
  adminGetCategory(id) {
    return http.get(`/admin/article-categories/${id}`)
  },

  /** 管理端新增分类 */
  adminCreateCategory(payload) {
    return http.post('/admin/article-categories', payload)
  },

  /** 管理端编辑分类 */
  adminUpdateCategory(id, payload) {
    return http.put(`/admin/article-categories/${id}`, payload)
  },

  /** 管理端删除分类 */
  adminDeleteCategory(id) {
    return http.delete(`/admin/article-categories/${id}`)
  },

  /** 管理端获取所有单页列表 */
  adminGetPages() {
    return http.get('/admin/pages')
  },

  /** 管理端获取单页详情 */
  adminGetPage(id) {
    return http.get(`/admin/pages/${id}`)
  },

  /** 管理端更新单页配置 */
  adminUpdatePage(id, payload) {
    return http.put(`/admin/pages/${id}`, payload)
  }
}

// 导出别名函数以保持多方式引用的便捷性
export const {
  getPage,
  getArticles,
  getArticle,
  getCategories,
  adminGetArticles,
  adminGetArticle,
  adminCreateArticle,
  adminUpdateArticle,
  adminUpdateArticleStatus,
  adminDeleteArticle,
  adminGetCategories,
  adminGetCategory,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminGetPages,
  adminGetPage,
  adminUpdatePage
} = contentApi

export default contentApi
