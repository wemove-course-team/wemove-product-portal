/**
 * 剥离危险 HTML 标签和伪协议/内联事件
 * 本轮后台为纯文本 textarea，正文入库前清洗，防止 XSS
 */
const DANGEROUS_TAGS = /<\/?(script|iframe|object|embed|form|input|button|style|link|meta|applet)[^>]*>/gi
const DANGEROUS_ATTRS = /\s(on\w+|href|src)\s*=\s*['"]?\s*(javascript|vbscript|data):[^>'"]*['"]?/gi
const INLINE_HANDLERS = /\son\w+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi
const JAVASCRIPT_PROTO = /(javascript|vbscript):/gi

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(DANGEROUS_TAGS, '')
    .replace(DANGEROUS_ATTRS, '')
    .replace(INLINE_HANDLERS, '')
    .replace(JAVASCRIPT_PROTO, '')
}
