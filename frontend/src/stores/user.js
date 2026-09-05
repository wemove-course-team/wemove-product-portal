import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../services/auth'
import { setUnauthorizedHandler } from '../services/http'
import { API_MODE, IS_DEV } from '../config/env'

/**
 * 会话与用户状态 store（#86 维护）
 *
 * 规则（AI_DEVELOPMENT_RULES 规则 3 / #85 契约）：
 * - 会话唯一来源是服务端：HttpOnly Cookie（wemove_session）+ GET /auth/me。
 *   本 store 只保存会话摘要（id/username/email/role/companyId），demoAccounts 等
 *   本地假登录已移除，不存储、不信任任何本地令牌或角色。
 * - 权限只在服务端裁决：这里的 isAdmin/isDealer 仅用于界面呈现与路由预检，
 *   不能也不应作为真正的授权依据（路由隐藏 ≠ 后端授权）。
 * - 历史的「本地 role 快速切换」已降级为开发预览开关（IS_DEV 限定）：
 *   生产构建中 switchRole 是空操作，界面上任何角色/权限均来自真实会话。
 */

/** 开发预览角色在 localStorage 中的键名（仅存角色名，不含任何凭据；仅 DEV 生效） */
const DEV_PREVIEW_KEY = 'wemove_dev_preview_role'

/** 服务端角色口径（决策 D5：GUEST | USER | DEALER | ADMIN）；真实经销商状态由 #90 接入 */
const UI_ROLES = ['GUEST', 'USER', 'DEALER', 'ADMIN']

/** 开发预览用的演示档案（仅 DEV 可见，正式构建不参与任何逻辑） */
const PREVIEW_PROFILES = {
  USER: { id: '101', username: '张明（普通会员）', email: 'zhangming@example.com', companyName: '个人消费客户', tierName: '', discountRate: 1.0 },
  DEALER: { id: '201', username: '李经理（认证经销商）', email: 'dealer@starwood.com', companyName: '上海晨星益智玩具有限公司', tierName: '一级核心经销商', discountRate: 0.65 },
  ADMIN: { id: '999', username: '系统管理员', email: 'admin@wemovetoy.com', companyName: 'WeMove 惟木匠心运营部', tierName: 'SUPER', discountRate: 0.5 }
}

export const useUserStore = defineStore('user', () => {
  /* ------------------------------ 服务端会话状态 ------------------------------ */

  /** 会话摘要：null 表示未登录；字段来自 GET /me */
  const sessionUser = ref(null)
  /** 'idle' 未初始化 | 'loading' 初始化中 | 'ready' 已完成（无论结果） */
  const sessionStatus = ref('idle')
  /** 会话初始化失败的非 401 错误（如网络异常），供账户页呈现 */
  const sessionError = ref(null)

  let sessionPromise = null

  /**
   * 拉取服务端会话并缓存。首次调用会真实请求 /me；
   * 401 属正常未登录（按游客处理），其余错误记录到 sessionError。
   */
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
          // 未登录(401)是常态；其他失败（网络/500）记录供界面呈现，不伪造登录态
          sessionError.value = err
        }
      })
  }

  /**
   * 确保会话已初始化（router 守卫在进入受保护路由前 await）。
   * 并发调用共享同一 Promise；初始化完成后结果被缓存。
   */
  function ensureSession() {
    if (sessionStatus.value === 'ready') return Promise.resolve()
    if (!sessionPromise) {
      if (API_MODE === 'mock') {
        // Mock 模式不连接真实后端：会话保持游客，不做任何伪造
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

  // 会话被服务端判定失效（任一请求 401）时立即清空本地摘要
  setUnauthorizedHandler(() => {
    sessionUser.value = null
  })

  /* --------------------------- 开发预览开关（仅 DEV） --------------------------- */

  const previewRole = ref(
    IS_DEV && UI_ROLES.includes(localStorage.getItem(DEV_PREVIEW_KEY)) ? localStorage.getItem(DEV_PREVIEW_KEY) : null
  )

  /** 是否处于开发预览（界面需显示明显标识） */
  const isPreviewActive = computed(() => IS_DEV && previewRole.value !== null)

  /**
   * 开发预览角色切换。仅开发构建生效：用于答辩/联调时预览各身份的界面样式，
   * 不产生任何真实权限；生产构建为空操作并给出警告。
   */
  function switchRole(roleKey) {
    if (!IS_DEV) {
      // 生产构建：本地角色切换已被移除，权限以服务端会话为准
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

  /* -------------------------------- 派生会话摘要 -------------------------------- */

  // 有效角色：开发预览 > 服务端会话 > 游客
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

  /** 会话摘要（含兼容字段）。开发预览时返回演示档案并标记 isPreview */
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
  const isRegularUser = computed(() => currentRole.value === 'USER')
  const isDealer = computed(() => currentRole.value === 'DEALER')
  const isAdmin = computed(() => currentRole.value === 'ADMIN')

  /* ---------------------------------- 登录/退出 ---------------------------------- */

  /**
   * 真实登录：POST /auth/login 成功后立即拉取 /me 会话摘要。
   * 返回 { ok, error }；失败时 error 为归一化 ApiError（含可读 message/fieldErrors），
   * 调用方负责呈现，本 store 不做任何本地成功兜底。
   */
  async function login(identifier, password) {
    try {
      await authApi.login(identifier, password)
      await ensureSession() // 登录已轮换会话，重新拉取摘要
      // 预览开关若残留会覆盖真实会话显示，登录成功后清除
      if (IS_DEV) switchRole(null)
      return { ok: true, error: null }
    } catch (error) {
      return { ok: false, error }
    }
  }

  /** 退出登录：调用服务端撤销会话；无论接口结果如何都清空本地摘要（Cookie 由服务端管理） */
  async function logout() {
    let error = null
    try {
      await authApi.logout()
    } catch (err) {
      // 会话本就失效（401）视为退出成功；其他失败保留错误供调用方提示
      if (err?.status !== 401) error = err
    }
    sessionUser.value = null
    if (IS_DEV) switchRole(null)
    return error ? { ok: false, error } : { ok: true, error: null }
  }

  return {
    // 会话状态
    sessionUser,
    sessionStatus,
    sessionError,
    isAuthenticated,
    ensureSession,
    // 派生摘要（兼容既有消费方）
    currentRole,
    userInfo,
    isGuest,
    isRegularUser,
    isDealer,
    isAdmin,
    // 开发预览
    isPreviewActive,
    switchRole,
    // 动作
    login,
    logout
  }
})
