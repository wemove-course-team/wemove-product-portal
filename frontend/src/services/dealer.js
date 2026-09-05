import http from './http'

export const dealerApi = {
  createApplication(payload) { return http.post('/dealer/applications', payload) },
  myApplications() { return http.get('/dealer/applications/mine') },
  portal() { return http.get('/dealer/portal/me') },
  adminApplications(params = {}) { return http.get('/admin/dealer/applications', { params }) },
  reviewApplication(id, payload) { return http.patch(`/admin/dealer/applications/${encodeURIComponent(id)}/review`, payload) }
}
