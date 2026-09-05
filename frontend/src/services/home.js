/**
 * 首页与全站搜索基线 API（#86 首页外壳维护）
 *
 * 只消费已冻结的公共契约与 #87/#88 已交接的公开 DTO：
 * - 精选产品：GET /products?featured=1&page=1&pageSize=6 → ProductListItem
 *   { id, sku, name, slug, categoryId, categoryName, price, tag, coverImage, summary, isFeatured }
 * - 最新动态：GET /articles?page=1&pageSize=3 → ArticleListItem
 *   { id, title, slug, categoryName, coverImage, summary, publishedAt }
 * - 全站搜索：GET /products?keyword=...&pageSize=5（公开字段，无经销商价格）
 *
 * 注意：#87/#88 落地各自 services（product/content）后，可把本文件调用迁移过去；
 * 迁移前本文件是首页与搜索弹窗的唯一数据入口，禁止页面绕过 services 直接请求。
 * 本层不做任何 Mock 兜底：失败由调用方呈现 error/empty 状态。
 */
import http from './http'

export const homeApi = {
  /** 精选产品（isFeatured），返回统一信封 { data: { items, total, page, pageSize }, requestId } */
  fetchFeaturedProducts(pageSize = 6) {
    return http.get('/products', { params: { featured: 1, page: 1, pageSize } })
  },

  /** 最新动态文章，返回统一信封 { data: { items, total, page, pageSize }, requestId } */
  fetchLatestArticles(pageSize = 3) {
    return http.get('/articles', { params: { page: 1, pageSize } })
  },

  /** 全站搜索：按关键词检索公开产品 */
  searchProducts(keyword, pageSize = 5) {
    return http.get('/products', { params: { keyword, page: 1, pageSize } })
  }
}
