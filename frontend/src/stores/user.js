import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // Roles: GUEST | USER | DEALER | ADMIN
  const currentRole = ref(localStorage.getItem('wemove_role') || 'GUEST')
  const userInfo = ref(JSON.parse(localStorage.getItem('wemove_user') || 'null') || {
    id: 0,
    username: '游客访问者',
    email: '',
    role: 'GUEST',
    companyName: '',
    dealerTier: 'NONE',
    discountRate: 1.0
  })

  const isGuest = computed(() => currentRole.value === 'GUEST')
  const isRegularUser = computed(() => currentRole.value === 'USER')
  const isDealer = computed(() => currentRole.value === 'DEALER')
  const isAdmin = computed(() => currentRole.value === 'ADMIN')

  // Preset demo accounts for rapid testing & defense presentation
  const demoAccounts = {
    GUEST: {
      id: 0,
      username: '游客',
      email: '',
      role: 'GUEST',
      companyName: '',
      dealerTier: 'NONE',
      discountRate: 1.0
    },
    USER: {
      id: 101,
      username: '张明（普通会员）',
      email: 'zhangming@example.com',
      role: 'USER',
      companyName: '个人消费客户',
      dealerTier: 'RETAIL',
      discountRate: 1.0
    },
    DEALER: {
      id: 201,
      username: '李经理（认证经销商）',
      email: 'dealer@starwood.com',
      role: 'DEALER',
      companyName: '上海晨星益智玩具有限公司',
      dealerTier: 'TIER_1_VIP',
      tierName: '一级核心经销商',
      discountRate: 0.65 // 6.5折批发特惠
    },
    ADMIN: {
      id: 999,
      username: '系统管理员',
      email: 'admin@wemovetoy.com',
      role: 'ADMIN',
      companyName: 'WeMove 惟木匠心运营部',
      dealerTier: 'SUPER',
      discountRate: 0.5
    }
  }

  function switchRole(roleKey) {
    if (demoAccounts[roleKey]) {
      currentRole.value = roleKey
      userInfo.value = { ...demoAccounts[roleKey] }
      localStorage.setItem('wemove_role', roleKey)
      localStorage.setItem('wemove_user', JSON.stringify(userInfo.value))
    }
  }

  function login(email, password, asRole = 'USER') {
    switchRole(asRole)
  }

  function logout() {
    switchRole('GUEST')
  }

  return {
    currentRole,
    userInfo,
    isGuest,
    isRegularUser,
    isDealer,
    isAdmin,
    demoAccounts,
    switchRole,
    login,
    logout
  }
})

