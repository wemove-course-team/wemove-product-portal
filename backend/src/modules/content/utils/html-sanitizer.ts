/**
 * 剥离危险 HTML 标签和伪协议/内联事件（如 onerror/onload 等）
 * 正文与单页 JSON 结构入库前双重清洗，阻断存储型 XSS
 */
const DANGEROUS_TAGS = /<\/?(script|iframe|object|embed|form|input|button|style|link|meta|applet|svg|base)[^>]*>/gi
const DANGEROUS_ATTRS = /[\s/](on\w+|href|src)\s*=\s*['"]?\s*(javascript|vbscript|data):[^>'"]*['"]?/gi
const INLINE_HANDLERS = /[\s/]on\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi
const JAVASCRIPT_PROTO = /(javascript|vbscript):/gi

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(DANGEROUS_TAGS, '')
    .replace(DANGEROUS_ATTRS, '')
    .replace(INLINE_HANDLERS, '')
    .replace(JAVASCRIPT_PROTO, '')
}

/**
 * 递归清洗对象/数组中的所有字符串，用于 sectionsJson 等复杂结构深度防 XSS
 */
export function sanitizeDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeHtml(value) as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item)) as unknown as T
  }
  if (value !== null && typeof value === 'object') {
    const result: any = {}
    for (const key of Object.keys(value)) {
      result[key] = sanitizeDeep((value as any)[key])
    }
    return result
  }
  return value
}
