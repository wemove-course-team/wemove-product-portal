/**
 * 身份与会话 API（identity 模块，后端负责人 cy0207kaw；前端侧由 #86 维护）
 *
 * 契约：#85 接口清单（MVP-01 契约 v1）
 * - 会话由同源 HttpOnly Cookie（wemove_session）承载，前端只保存会话摘要（id/username/email/role）
 * - 登录、注册等写请求经 http.js 自动附带 X-CSRF-Token（GET /auth/csrf 双提交，决策 D4）
 * - 角色 GUEST | USER | DEALER | ADMIN 由服务端裁决（决策 D5），前端绝不写入或篡改
 * - 找回密码本轮走 dev 日志 token（决策 D4），不接邮件服务
 */
import http from './http'
import { SESSION_TIMEOUT_MS } from '../config/env'

export const authApi = {
  /** 当前会话摘要；未登录返回 401（由调用方按游客处理）。路由守卫依赖此请求，超时收紧避免长时间白屏 */
  me() {
    return http.get('/auth/me', { timeout: SESSION_TIMEOUT_MS })
  },

  /**
   * 登录：identifier 为用户名或邮箱。成功时服务端 Set-Cookie wemove_session，
   * 响应体不携带任何令牌。
   */
  login(identifier, password) {
    return http.post('/auth/login', { identifier, password })
  },

  /** 注册：用户名 + 邮箱 + 密码，成功后默认 role=USER（是否自动登录以 #85 实现为准，前端注册成功后引导登录） */
  register({ username, email, password }) {
    return http.post('/auth/register', { username, email, password })
  },

  /** 退出登录：撤销当前会话（204） */
  logout() {
    return http.post('/auth/logout', {})
  },

  /** 找回密码第一步：按邮箱申请重置 token（dev 环境由后端日志输出 token） */
  requestPasswordReset(email) {
    return http.post('/auth/password-reset/request', { email })
  },

  /** 找回密码第二步：token + 新密码，token 置 used */
  confirmPasswordReset({ token, newPassword }) {
    return http.post('/auth/password-reset/confirm', { token, newPassword })
  },

  /** 资料修改：realName / phone 等（登录后） */
  updateProfile(payload) {
    return http.patch('/users/me', payload)
  },

  /** 修改密码：旧密码 + 新密码（登录后） */
  changePassword({ oldPassword, newPassword }) {
    return http.put('/users/me/password', { oldPassword, newPassword })
  }
}
