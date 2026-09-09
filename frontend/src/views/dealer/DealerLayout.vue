<template>
  <div class="dealer-layout">
    <aside class="dealer-sidebar" :class="{ open: sidebarOpen }">
      <router-link to="/" class="dealer-brand" aria-label="返回 WEMOVE 官网">
        <img src="/logo.svg" alt="WEMOVE Logo" />
        <span><strong>WEMOVE</strong><small>合作伙伴中心</small></span>
      </router-link>

      <nav class="dealer-nav" aria-label="经销商中心导航">
        <template v-for="group in menuGroups" :key="group.title">
          <p class="nav-group-title">{{ group.title }}</p>
          <router-link v-for="item in group.items" :key="item.path" :to="item.path" class="dealer-nav-link" @click="sidebarOpen = false">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </router-link>
        </template>
      </nav>

      <div class="dealer-profile">
        <div class="profile-avatar">{{ avatarText }}</div>
        <div class="profile-copy"><strong>{{ userStore.userInfo.username }}</strong><span>{{ company?.tierName || '经销商成员' }}</span></div>
        <el-button text circle aria-label="退出登录" @click="logout"><el-icon><SwitchButton /></el-icon></el-button>
      </div>
    </aside>
    <div v-if="sidebarOpen" class="dealer-mask" @click="sidebarOpen = false"></div>

    <section class="dealer-main">
      <header class="dealer-topbar">
        <div class="topbar-left">
          <button class="menu-toggle" aria-label="打开经销商菜单" @click="sidebarOpen = !sidebarOpen"><el-icon><Menu /></el-icon></button>
          <div><span class="topbar-label">经销商中心</span><strong>{{ currentTitle }}</strong></div>
        </div>
        <div class="topbar-actions">
          <router-link to="/" class="front-link"><el-icon><House /></el-icon>官网首页</router-link>
          <div class="company-chip"><el-icon><OfficeBuilding /></el-icon><span>{{ company?.companyName || '加载企业信息…' }}</span></div>
        </div>
      </header>

      <main class="dealer-content"><router-view /></main>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useDealerStore } from '../../stores/dealer'
import { useUserStore } from '../../stores/user'

/** 经销商独立工作台外壳：不复用官网导航，防止采购任务与公开浏览入口混杂。 */
const route = useRoute()
const router = useRouter()
const dealerStore = useDealerStore()
const userStore = useUserStore()
const sidebarOpen = ref(false)
const company = computed(() => dealerStore.portalData?.company || null)
const avatarText = computed(() => (userStore.userInfo.username || '经').slice(0, 1).toUpperCase())

const menuGroups = [
  { title: '业务中心', items: [
    { path: '/dealer', label: '工作台', icon: 'DataBoard' },
    { path: '/dealer/catalog', label: '授权商品', icon: 'Goods' },
    { path: '/dealer/quick-order', label: '快捷下单', icon: 'ShoppingCartFull' },
    { path: '/dealer/quotes', label: '报价单', icon: 'Document' },
    { path: '/dealer/orders', label: '订单与物流', icon: 'Box' },
    { path: '/dealer/invoices', label: '发票与结算', icon: 'CreditCard' }
  ] },
  { title: '企业与支持', items: [
    { path: '/dealer/downloads', label: '资料下载', icon: 'Download' },
    { path: '/dealer/company', label: '企业 / 成员 / 地址', icon: 'OfficeBuilding' },
    { path: '/dealer/support', label: '客户支持', icon: 'Service' },
    { path: '/dealer/security', label: '安全设置', icon: 'Lock' }
  ] }
]

const titleMap = {
  DealerDashboard: '工作台', DealerCatalog: '授权商品', DealerQuickOrder: '快捷下单', DealerQuotes: '报价单',
  DealerOrders: '订单与物流', DealerInvoices: '发票与结算', DealerDownloads: '资料下载',
  DealerCompany: '企业与团队', DealerSupport: '客户支持', DealerSecurity: '安全设置'
}
const currentTitle = computed(() => titleMap[route.name] || '合作伙伴中心')

async function logout() {
  const result = await userStore.logout()
  if (!result.ok) ElMessage.error(result.error?.message || '退出失败')
  router.push('/')
}

onMounted(() => dealerStore.fetchPortal().catch(() => null))
</script>

<style scoped>
.dealer-layout { min-height: 100vh; display: flex; background: #f7f6f3; color: var(--text-color); }
.dealer-sidebar { position: sticky; top: 0; width: 244px; height: 100vh; flex: 0 0 244px; display: flex; flex-direction: column; background: #fff; border-right: 1px solid var(--border-color); z-index: 60; }
.dealer-brand { height: 72px; display: flex; align-items: center; gap: 11px; padding: 0 22px; border-bottom: 1px solid var(--border-color); }
.dealer-brand img { width: 36px; height: 36px; border-radius: 10px; }
.dealer-brand span { display: grid; line-height: 1.2; }
.dealer-brand strong { font-size: 16px; letter-spacing: .08em; }
.dealer-brand small { margin-top: 4px; color: var(--text-light); font-size: 11px; letter-spacing: .06em; }
.dealer-nav { flex: 1; overflow-y: auto; padding: 18px 12px; }
.nav-group-title { margin: 16px 12px 7px; color: var(--text-light); font-size: 10px; font-weight: 700; letter-spacing: .16em; }
.nav-group-title:first-child { margin-top: 0; }
.dealer-nav-link { display: flex; align-items: center; gap: 11px; min-height: 42px; margin: 3px 0; padding: 9px 12px; border-radius: 10px; color: var(--text-muted); font-size: 13px; font-weight: 500; transition: .18s ease; }
.dealer-nav-link:hover { color: var(--text-color); background: var(--bg-light); }
.dealer-nav-link.router-link-exact-active { color: var(--accent-color); background: #fbf1e9; font-weight: 700; box-shadow: inset 3px 0 var(--accent-color); }
.dealer-profile { display: flex; align-items: center; gap: 10px; padding: 16px; border-top: 1px solid var(--border-color); }
.profile-avatar { width: 34px; height: 34px; display: grid; place-items: center; flex: 0 0 34px; border-radius: 10px; color: #fff; background: linear-gradient(135deg, var(--primary-color), var(--primary-hover)); font-size: 13px; font-weight: 700; }
.profile-copy { min-width: 0; flex: 1; display: grid; line-height: 1.35; }
.profile-copy strong, .profile-copy span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-copy strong { font-size: 12px; }.profile-copy span { color: var(--text-light); font-size: 10px; }
.dealer-main { min-width: 0; flex: 1; }
.dealer-topbar { position: sticky; top: 0; z-index: 40; height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 0 24px; color: #fff; background: #252b2c; box-shadow: 0 2px 14px rgba(31, 41, 55, .15); }
.topbar-left, .topbar-actions, .company-chip, .front-link { display: flex; align-items: center; }
.topbar-left { gap: 12px; }.topbar-left > div { display: grid; line-height: 1.25; }.topbar-label { color: rgba(255,255,255,.48); font-size: 10px; letter-spacing: .12em; }.topbar-left strong { font-size: 15px; }
.topbar-actions { gap: 16px; }.front-link { gap: 6px; color: rgba(255,255,255,.72); font-size: 12px; }.front-link:hover { color: #fff; }
.company-chip { max-width: 300px; gap: 8px; padding: 7px 12px; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; background: rgba(255,255,255,.06); font-size: 12px; }
.company-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.menu-toggle { display: none; width: 34px; height: 34px; border: 0; border-radius: 8px; color: #fff; background: rgba(255,255,255,.08); }
.dealer-content { max-width: 1440px; min-height: calc(100vh - 64px); margin: 0 auto; padding: 28px; }
.dealer-mask { display: none; }
@media (max-width: 900px) {
  .dealer-sidebar { position: fixed; left: 0; transform: translateX(-100%); transition: transform .22s ease; }
  .dealer-sidebar.open { transform: translateX(0); }.dealer-mask { display: block; position: fixed; inset: 0; z-index: 50; background: rgba(31,41,55,.38); }
  .menu-toggle { display: grid; place-items: center; }.company-chip { max-width: 180px; }.front-link { display: none; }.dealer-content { padding: 20px 16px; }
}
@media (max-width: 520px) { .company-chip { max-width: 132px; padding: 7px 9px; }.dealer-topbar { padding: 0 14px; } }
</style>
