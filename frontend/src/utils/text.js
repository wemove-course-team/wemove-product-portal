/**
 * 纯文本安全排版与换行格式化工具
 * 将旧数据或富文本输入中的 <br> 标签规范化为换行符 \n，配合 CSS white-space: pre-line 进行安全渲染
 * 杜绝使用 v-html，防止 XSS 攻击
 */
export function formatSafeText(text) {
  if (!text) return ''
  return String(text).replace(/<br\s*\/?>/gi, '\n')
}
