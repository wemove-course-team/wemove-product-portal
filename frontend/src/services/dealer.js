import http from './http'

/** 经销商申请、工作台与管理端审核接口。 */
export const dealerApi = {
  createApplication(payload) {
    return http.post('/dealer/applications', payload)
  },
  myApplications() {
    return http.get('/dealer/applications/mine')
  },
  portal() {
    return http.get('/dealer/portal/me')
  },
  adminApplications(params = {}) {
    return http.get('/admin/dealer/applications', { params })
  },
  reviewApplication(id, payload) {
    return http.patch(`/admin/dealer/applications/${encodeURIComponent(id)}/review`, payload)
  },
  workspaceSummary() {
    return http.get('/dealer/workspace/summary')
  },
  catalog(params = {}) {
    return http.get('/dealer/workspace/catalog', { params })
  },
  quotes(params = {}) {
    return http.get('/dealer/workspace/quotes', { params })
  },
  createQuote(payload) {
    return http.post('/dealer/workspace/quotes', payload)
  },
  orders(params = {}) {
    return http.get('/dealer/workspace/orders', { params })
  },
  createOrder(payload) {
    return http.post('/dealer/workspace/orders', payload)
  },
  invoices(params = {}) {
    return http.get('/dealer/workspace/invoices', { params })
  },
  company() {
    return http.get('/dealer/workspace/company')
  },
  updateCompany(payload) {
    return http.put('/dealer/workspace/company', payload)
  },
  createAddress(payload) {
    return http.post('/dealer/workspace/addresses', payload)
  },
  adminCompanies(params = {}) {
    return http.get('/admin/dealer/companies', { params })
  },
  updateCompanyStatus(id, status) {
    return http.patch(`/admin/dealer/companies/${encodeURIComponent(id)}/status`, { status })
  },
  adminQuotes(params = {}) {
    return http.get('/admin/dealer/quotes', { params })
  },
  decideQuote(quoteNo, payload) {
    return http.patch(`/admin/dealer/quotes/${encodeURIComponent(quoteNo)}/decision`, payload)
  },
  adminOrders(params = {}) {
    return http.get('/admin/dealer/orders', { params })
  },
  updateOrderStatus(orderNo, payload) {
    return http.patch(`/admin/dealer/orders/${encodeURIComponent(orderNo)}/status`, payload)
  },
  adminInvoices(params = {}) {
    return http.get('/admin/dealer/invoices', { params })
  },
  updateInvoiceStatus(invoiceNo, status) {
    return http.patch(`/admin/dealer/invoices/${encodeURIComponent(invoiceNo)}/status`, { status })
  }
}
