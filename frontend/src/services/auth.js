/** 身份和会话接口，凭据由服务端 Cookie 保存。 */
import http from './http'
import { SESSION_TIMEOUT_MS } from '../config/env'

export const authApi = {
  /** 获取当前登录用户。 */
  me() {
    return http.get('/auth/me', { timeout: SESSION_TIMEOUT_MS })
  },

  /** 使用用户名或邮箱登录，服务端通过 Cookie 建立会话。 */
  login(identifier, password) {
    return http.post('/auth/login', { identifier, password })
  },

  /** 注册普通用户。 */
  register({ username, email, password }) {
    return http.post('/auth/register', { username, email, password })
  },

  /** 退出当前会话。 */
  logout() {
    return http.post('/auth/logout', {})
  },

  /** 申请密码重置 token。 */
  requestPasswordReset(email) {
    return http.post('/auth/password-reset/request', { email })
  },

  /** 使用 token 设置新密码。 */
  confirmPasswordReset({ token, newPassword }) {
    return http.post('/auth/password-reset/confirm', { token, newPassword })
  },

  /** 修改当前用户资料。 */
  updateProfile(payload) {
    return http.patch('/users/me', payload)
  },

  /** 修改当前用户密码。 */
  changePassword({ oldPassword, newPassword }) {
    return http.put('/users/me/password', { oldPassword, newPassword })
  }
}
