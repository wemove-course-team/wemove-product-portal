import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../services/auth'
import { setUnauthorizedHandler } from '../services/http'
import { API_MODE, IS_DEV } from '../config/env'

/** 用户会话状态。真实身份始终来自服务端，预览角色仅用于开发环境。 */

/** 开发预览角色的本地存储键，只保存角色名。 */
const DEV_PREVIEW_KEY = 'wemove_dev_preview_role'

/** 服务端角色。 */
const UI_ROLES = ['GUEST', 'USER', 'DEALER', 'ADMIN']

/** 开发预览使用的演示资料，不参与真实权限判断。 */
const PREVIEW_PROFILES = {
  USER: { id: '101', username: '张明（普通会员）', email: 'zhangming@example.com', companyName: '个人消费客户', tierName: '', discountRate: 1.0 },
  DEALER: { id: '201', username: '李经理（认证经销商）', email: 'dealer@starwood.com', companyName: '上海晨星益智玩具有限公司', tierName: '一级核心经销商', discountRate: 0.65 },
  ADMIN: { id: '999', username: '系统管理员', email: 'admin@wemovetoy.com', companyName: 'WeMove 惟木匠心运营部', tierName: 'SUPER', discountRate: 0.5 }
}

export const useUserStore = defineStore('user', () => {
  /** 服务端返回的会话摘要，未登录时为 null。 */
  const sessionUser = ref(null)
  /** 会话初始化状态。 */
  const sessionStatus = ref('idle')
  /** 初始化时的网络或服务端错误。 */
  const sessionError = ref(null)

  let sessionPromise = null

  /** 拉取当前会话；401 按未登录处理，其他错误留给页面显示。 */
  function fetchSession() {
    sessionUser.value = null
    sessionError.value = null
    return authApi
      .me()
      .then((envelope) => {
        const me = envelope?.data || null
        sessionUser.value = me
          ? {
              id: String(me.id ?? ''),
              username: me.username ?? '',
              email: me.email ?? '',
              role: me.role ?? 'USER',
              companyId: me.companyId == null ? null : String(me.companyId)
            }
          : null
      })
      .catch((err) => {
        if (err?.status !== 401) {
          // 未登录是正常状态，其他错误交给页面提示。
          sessionError.value = err
        }
      })
  }

  /** 初始化会话，并复用并发请求。 */
  function ensureSession() {
    if (sessionStatus.value === 'ready') return Promise.resolve()
    if (!sessionPromise) {
      if (API_MODE === 'mock') {
        // Mock 模式不连接后端，保持游客状态。
        sessionStatus.value = 'ready'
        return Promise.resolve()
      }
      sessionStatus.value = 'loading'
      sessionPromise = fetchSession().finally(() => {
        sessionStatus.value = 'ready'
        sessionPromise = null
      })
    }
    return sessionPromise
  }

  // 任意请求返回 401 时清除本地会话摘要。
  setUnauthorizedHandler(() => {
    sessionUser.value = null
  })

  const previewRole = ref(
    IS_DEV && UI_ROLES.includes(localStorage.getItem(DEV_PREVIEW_KEY)) ? localStorage.getItem(DEV_PREVIEW_KEY) : null
  )

  /** 是否处于开发预览。 */
  const isPreviewActive = computed(() => IS_DEV && previewRole.value !== null)

  /** 切换开发预览角色，不改变服务端权限。 */
  function switchRole(roleKey) {
    if (!IS_DEV) {
      // 生产环境不允许本地切换角色。
      console.warn('[user] switchRole 仅在开发构建可用，真实身份由服务端会话决定')
      return
    }
    if (roleKey && !UI_ROLES.includes(roleKey)) return
    previewRole.value = roleKey || null
    if (previewRole.value) {
      localStorage.setItem(DEV_PREVIEW_KEY, previewRole.value)
    } else {
      localStorage.removeItem(DEV_PREVIEW_KEY)
    }
  }

  // 预览角色优先，其次使用服务端角色，最后按游客处理。
  const currentRole = computed(() => {
    if (isPreviewActive.value) return previewRole.value
    if (sessionUser.value) {
      const r = sessionUser.value.role
      if (r === 'ADMIN' || r === 'SUPER_ADMIN') return 'ADMIN'
      if (r === 'DEALER') return 'DEALER'
      return 'USER'
    }
    return 'GUEST'
  })

  const isAuthenticated = computed(() => Boolean(sessionUser.value))

  /** 提供页面使用的用户摘要。 */
  const userInfo = computed(() => {
    if (isPreviewActive.value) {
      return {
        ...(PREVIEW_PROFILES[currentRole.value] || PREVIEW_PROFILES.USER),
        role: currentRole.value,
        isPreview: true
      }
    }
    if (sessionUser.value) {
      return {
        id: sessionUser.value.id,
        username: sessionUser.value.username,
        email: sessionUser.value.email,
        role: currentRole.value,
        companyName: '',
        tierName: '',
        discountRate: 1.0,
        isPreview: false
      }
    }
    return { id: '0', username: '游客访问者', email: '', role: 'GUEST', companyName: '', tierName: '', discountRate: 1.0, isPreview: false }
  })

  const isGuest = computed(() => currentRole.value === 'GUEST')
  const isDealer = computed(() => currentRole.value === 'DEALER')
  const isAdmin = computed(() => currentRole.value === 'ADMIN')

  /** 登录后重新读取服务端会话。 */
  async function login(identifier, password) {
    try {
      await authApi.login(identifier, password)
      // 登录会轮换服务端 Cookie；清除登录页路由守卫缓存的游客态，再拉取真实会话。
      sessionStatus.value = 'idle'
      sessionUser.value = null
      sessionError.value = null
      await ensureSession()
      // 登录成功后清除残留的预览角色。
      if (IS_DEV) switchRole(null)
      return { ok: true, error: null }
    } catch (error) {
      return { ok: false, error }
    }
  }

  /** 退出登录并清除本地摘要。 */
  async function logout() {
    let error = null
    try {
      await authApi.logout()
    } catch (err) {
      // 会话已失效时仍视为退出成功。
      if (err?.status !== 401) error = err
    }
    sessionUser.value = null
    if (IS_DEV) switchRole(null)
    return error ? { ok: false, error } : { ok: true, error: null }
  }

  return {
    sessionUser,
    sessionStatus,
    sessionError,
    isAuthenticated,
    ensureSession,
    currentRole,
    userInfo,
    isGuest,
    isDealer,
    isAdmin,
    isPreviewActive,
    switchRole,
    login,
    logout
  }
})
