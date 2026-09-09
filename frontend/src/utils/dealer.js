/** 经销商业务状态中文映射与安全日期格式化。 */
const STATUS_TEXT = {
  SUBMITTED: '已提交', QUOTED: '待确认', ACCEPTED: '已接受', REJECTED: '已拒绝', EXPIRED: '已过期',
  PENDING_REVIEW: '待平台确认', PENDING_PAYMENT: '待付款', PAID: '已付款', CONFIRMED: '已确认',
  SHIPPED: '已发货', COMPLETED: '已完成', CANCELLED: '已取消',
  ISSUED: '待处理', VOID: '已作废', ACTIVE: '已启用', SUSPENDED: '已停用'
}

export function dealerStatusText(status) {
  return STATUS_TEXT[status] || status || '-'
}

export function dealerStatusType(status) {
  if (['ACCEPTED', 'PAID', 'SHIPPED', 'COMPLETED', 'ACTIVE'].includes(status)) return 'success'
  if (['REJECTED', 'EXPIRED', 'CANCELLED', 'VOID', 'SUSPENDED'].includes(status)) return 'danger'
  if (['SUBMITTED', 'QUOTED', 'PENDING_REVIEW', 'PENDING_PAYMENT', 'ISSUED'].includes(status)) return 'warning'
  return 'info'
}

export function formatBusinessDate(value, withTime = false) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {})
  }).format(date)
}

export function formatCurrency(value, currency = 'CNY') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '-'
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}
