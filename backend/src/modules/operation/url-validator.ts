/**
 * URL 校验（决策 D10）：允许相对路径（以单个 / 开头）或 http(s) 外链。
 * 空字符串视为“未设置”，允许；其余协议（javascript:、ftp:、data: 等）一律拒绝。
 * 含反斜杠的值一律拒绝：部分浏览器会把 `/\\evil.example/path` 按跨域 URL 解析。
 */
export function isValidUrlOrPath(value: string): boolean {
  if (value === '') return true
  if (value.includes('\\')) return false
  if (/^\/(?!\/)/.test(value)) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
