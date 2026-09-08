/** 站点配置白名单，与后端 operation 契约保持一致。 */
export const SITE_CONFIG_KEYS = [
  'siteName',
  'logoUrl',
  'contactPhone',
  'contactEmail',
  'address',
  'footerText',
  'icpNo'
]

export const DEFAULT_SITE_CONFIG = Object.freeze({
  siteName: 'WeMove 惟木匠心',
  logoUrl: '/logo.svg',
  contactPhone: '',
  contactEmail: '',
  address: '',
  footerText: '© 2026 WeMove 惟木匠心',
  icpNo: ''
})

/** 丢弃服务端意外字段，并保证布局所需键始终存在。 */
export function normalizeSiteConfig(input = {}) {
  const normalized = { ...DEFAULT_SITE_CONFIG }
  for (const key of SITE_CONFIG_KEYS) {
    if (typeof input?.[key] === 'string') normalized[key] = input[key]
  }
  if (!normalized.logoUrl) normalized.logoUrl = DEFAULT_SITE_CONFIG.logoUrl
  return normalized
}

/** 生成稳定且无重复 ID 的批量排序请求。 */
export function toBannerSortItems(banners = []) {
  const ids = new Set()
  return banners.map((banner) => {
    const id = Number(banner.id)
    if (!Number.isInteger(id) || id <= 0 || ids.has(id)) throw new Error('Banner 排序数据无效')
    ids.add(id)
    return { id, sortOrder: Math.max(0, Number.parseInt(banner.sortOrder, 10) || 0) }
  })
}

/** 严格状态机下可选的当前/下一状态。 */
export function messageStatusOptions(status) {
  const label = { PENDING: '待处理', PROCESSING: '处理中', DONE: '已完成' }
  const next = { PENDING: 'PROCESSING', PROCESSING: 'DONE', DONE: null }[status]
  return [status, next]
    .filter(Boolean)
    .map((value) => ({ value, label: label[value] || value }))
}
