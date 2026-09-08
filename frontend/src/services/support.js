import http from './http'

/** 支持中心 API，沿用全站统一的会话、CSRF 和错误处理。 */
export const supportApi = {
  submitMessage(payload) {
    return http.post('/support/messages', payload)
  },
  listFaqs(params = {}) {
    return http.get('/faqs', { params })
  },
  listDownloads(params = {}) {
    return http.get('/downloads', { params })
  },
  accessDownload(id) {
    return http.get(`/downloads/${encodeURIComponent(id)}/access`)
  },
  adminMessages(params = {}) {
    return http.get('/admin/support/messages', { params })
  },
  updateMessageStatus(id, payload) {
    return http.patch(`/admin/support/messages/${encodeURIComponent(id)}/status`, payload)
  },
  adminFaqs(params = {}) {
    return http.get('/admin/support/faqs', { params })
  },
  createFaq(payload) {
    return http.post('/admin/support/faqs', payload)
  },
  updateFaq(id, payload) {
    return http.patch(`/admin/support/faqs/${encodeURIComponent(id)}`, payload)
  },
  deleteFaq(id) {
    return http.delete(`/admin/support/faqs/${encodeURIComponent(id)}`)
  },
  adminDownloads(params = {}) {
    return http.get('/admin/support/downloads', { params })
  },
  createDownload(payload) {
    return http.post('/admin/support/downloads', payload)
  },
  updateDownload(id, payload) {
    return http.patch(`/admin/support/downloads/${encodeURIComponent(id)}`, payload)
  },
  deleteDownload(id) {
    return http.delete(`/admin/support/downloads/${encodeURIComponent(id)}`)
  }
}

export default supportApi
