import http from './http'

/** MVP07 站点配置、Banner 与后台概览接口。 */
export const operationApi = {
  publicConfig() {
    return http.get('/site/config')
  },
  publicBanners() {
    return http.get('/banners')
  },
  adminConfig() {
    return http.get('/admin/site/config')
  },
  updateConfig(payload) {
    return http.put('/admin/site/config', payload)
  },
  adminBanners() {
    return http.get('/admin/banners')
  },
  createBanner(payload) {
    return http.post('/admin/banners', payload)
  },
  updateBanner(id, payload) {
    return http.put(`/admin/banners/${encodeURIComponent(id)}`, payload)
  },
  updateBannerStatus(id, isActive) {
    return http.put(`/admin/banners/${encodeURIComponent(id)}/status`, { isActive })
  },
  sortBanners(items) {
    return http.put('/admin/banners/sort', { items })
  },
  deleteBanner(id) {
    return http.delete(`/admin/banners/${encodeURIComponent(id)}`)
  },
  overview() {
    return http.get('/admin/stats/overview')
  }
}

export default operationApi
