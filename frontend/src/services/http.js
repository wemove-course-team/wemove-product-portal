/**
 * 统一 HTTP 请求层（全站唯一 axios 实例，#86 维护）
 *
 * 契约基线：#84 公共决策 D2/D3 + #85 统一契约 v1（MVP-01 冻结稿）
 * - 前缀 /api/v1，JSON，字段 camelCase，全程同源（dev 走 vite proxy，生产走 nginx）
 * - 成功：{ code: 0, message: 'ok', data, requestId }；列表分页 data = { items, total, page, pageSize }
 * - 失败：HTTP 状态码 + { code: 'VALIDATION_400 | AUTH_401 | FORBIDDEN_403 | NOT_FOUND_404
 *   | CONFLICT_409 | SERVER_500', message: 中文文案, errors?: [{field, message}], requestId }
 * - 鉴权：同源 HttpOnly Cookie 会话（wemove_session）；写请求携带 X-CSRF-Token
 *   （由 GET /api/v1/auth/csrf 获取，双提交方案，决策 D4）
 *
 * 使用约定：
 * - 页面/组件禁止直接 import axios 或使用 fetch，必须经由 services 层调用
 * - 本层不做任何数据兜底：请求失败时抛出 normalize 后的 ApiError，
 *   由调用方呈现 loading/empty/error 状态；网络失败不得回退到本地假数据
 * - 会话令牌由 HttpOnly Cookie 管理，本层不读取、不存储任何令牌
 */
import axios from 'axios'
import { API_BASE_URL, HTTP_TIMEOUT_MS } from '../config/env'

/** 写方法需要 CSRF 头 */
const CSRF_METHODS = new Set(['post', 'put', 'patch', 'delete'])

/**
 * HTTP 状态码 → #85 契约错误码（仅在响应体缺失 code 或响应体不可解析时兜底）。
 * 4xx 一律按 VALIDATION_400 兜底、5xx 按 SERVER_500 兜底；后端 body 的 code 永远优先。
 */
const STATUS_CODES = {
  400: 'VALIDATION_400',
  401: 'AUTH_401',
  403: 'FORBIDDEN_403',
  404: 'NOT_FOUND_404',
  409: 'CONFLICT_409'
}

/** 错误码 → 用户可读文案（后端 message 缺失时的兜底） */
const FALLBACK_MESSAGES = {
  VALIDATION_400: '请检查输入内容',
  AUTH_401: '请先登录',
  FORBIDDEN_403: '您没有权限执行此操作',
  NOT_FOUND_404: '请求的内容不存在或已被移除',
  CONFLICT_409: '操作冲突，请刷新后重试',
  SERVER_500: '服务暂时不可用，请稍后再试'
}

function fallbackCode(status) {
  if (STATUS_CODES[status]) return STATUS_CODES[status]
  if (status >= 500) return 'SERVER_500'
  if (status >= 400) return 'VALIDATION_400'
  return 'UNKNOWN'
}

/**
 * 归一化后的接口错误。
 * 页面只需捕获该对象并读取 message/fieldErrors 呈现状态，无需理解 axios 细节。
 */
export class ApiError extends Error {
  constructor({ status = 0, code = 'UNKNOWN', message = '请求失败', fieldErrors = null, requestId = null, cause = null }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.requestId = requestId
    this.cause = cause
  }
}

/** 401（会话失效）回调，由 stores/user.js 注册，避免 services → stores 循环依赖 */
let unauthorizedHandler = null
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null
}

function notifyUnauthorized() {
  if (unauthorizedHandler) unauthorizedHandler()
}

/**
 * 契约 errors: [{field, message}] → 表单易用的 fieldErrors 映射 { field: [message, ...] }。
 * 后端若返回其他形态（对象/缺省），做容错处理。
 */
function normalizeFieldErrors(body) {
  const errors = body?.errors
  if (!Array.isArray(errors) || errors.length === 0) return null
  const map = {}
  for (const item of errors) {
    if (!item || !item.field) continue
    const field = String(item.field)
    const message = String(item.message ?? '')
    if (!map[field]) map[field] = []
    if (message) map[field].push(message)
  }
  return Object.keys(map).length ? map : null
}

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: HTTP_TIMEOUT_MS,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

/* ---------------------------------- CSRF ---------------------------------- */

let csrfToken = null
let csrfPromise = null

/**
 * 获取（带缓存的）CSRF token。token 只保存在内存中，
 * 与预登录会话 Cookie 绑定；页面刷新后由下一次写请求重新获取。
 */
export function ensureCsrfToken(force = false) {
  if (!force && csrfToken) return Promise.resolve(csrfToken)
  if (!csrfPromise) {
    csrfPromise = axios
      .get('/auth/csrf', { baseURL: API_BASE_URL, withCredentials: true, timeout: HTTP_TIMEOUT_MS })
      .then((res) => {
        csrfToken = res.data?.data?.csrfToken || res.data?.data?.token || null
        return csrfToken
      })
      .finally(() => {
        csrfPromise = null
      })
  }
  return csrfPromise
}

http.interceptors.request.use(async (config) => {
  if (CSRF_METHODS.has((config.method || '').toLowerCase())) {
    try {
      const token = await ensureCsrfToken()
      if (token) config.headers['X-CSRF-Token'] = token
    } catch (err) {
      // CSRF 预取失败不阻断请求：后端会以 403 拒绝并给出可读错误
      // （例如本地无网络时，登录会直接呈现“网络异常”而不是静默成功）
    }
  }
  return config
})

/* ------------------------------ 响应与错误归一 ------------------------------ */

function extractRequestId(error) {
  return (
    error?.response?.headers?.['x-request-id'] ||
    error?.config?.headers?.['X-Request-Id'] ||
    null
  )
}

http.interceptors.response.use(
  (response) => {
    // 204 无 body：返回空数据信封
    if (response.status === 204 || response.data == null) {
      return { data: null, requestId: response.headers?.['x-request-id'] || null }
    }
    const body = response.data
    // 统一信封 { code, message, data, requestId }：2xx 且 code !== 0 视为业务失败
    if (typeof body === 'object' && 'code' in body) {
      if (body.code !== 0) {
        return Promise.reject(
          new ApiError({
            status: response.status,
            code: typeof body.code === 'string' ? body.code : 'UNKNOWN',
            message: body.message || FALLBACK_MESSAGES.SERVER_500,
            requestId: body.requestId || response.headers?.['x-request-id'] || null
          })
        )
      }
      return { data: body.data ?? null, requestId: body.requestId || null }
    }
    // 非信封结构（理论不应出现）：原样透传，交由调用方判断
    return body
  },
  (error) => {
    const status = error.response?.status || 0

    if (status === 401) notifyUnauthorized()

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError({
        status: 0,
        code: 'TIMEOUT',
        message: '请求超时，请检查网络后重试',
        requestId: extractRequestId(error),
        cause: error
      }))
    }
    if (!error.response) {
      return Promise.reject(new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: '网络异常，无法连接服务器',
        requestId: null,
        cause: error
      }))
    }

    const body = error.response?.data || {}
    const code = body.code || fallbackCode(status)
    const message = body.message || FALLBACK_MESSAGES[code] || `请求失败（HTTP ${status}）`

    return Promise.reject(new ApiError({
      status,
      code,
      message,
      fieldErrors: normalizeFieldErrors(body),
      requestId: body.requestId || extractRequestId(error),
      cause: error
    }))
  }
)

export default http
