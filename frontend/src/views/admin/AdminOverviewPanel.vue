<template>
  <div class="admin-overview">
    <div class="overview-heading">
      <div><p class="eyebrow">OPERATIONS</p><h1>运营概览</h1><p>核心业务数量均来自当前数据库，待处理项可直接进入对应工作台。</p></div>
      <el-button :loading="loading" @click="loadOverview"><el-icon><Refresh /></el-icon>刷新数据</el-button>
    </div>

    <AsyncState :loading="loading" loading-text="正在统计业务数据…" :error="error" @retry="loadOverview">
      <div class="metrics-grid">
        <router-link v-for="metric in metrics" :key="metric.key" :to="metric.to" class="metric-card" :class="metric.tone">
          <div class="metric-top"><span class="metric-label">{{ metric.label }}</span><span class="metric-icon">{{ metric.icon }}</span></div>
          <strong>{{ metric.value }}</strong>
          <span class="metric-meta">{{ metric.meta }} →</span>
        </router-link>
      </div>
    </AsyncState>

    <section class="session-card">
      <div><span class="session-label">当前会话</span><strong>{{ userStore.userInfo.username }}</strong><span>{{ userStore.userInfo.email || '未绑定邮箱' }} · {{ roleText }}</span></div>
      <div class="session-actions"><router-link to="/admin/operation">管理站点配置</router-link><router-link to="/">返回官网前台</router-link></div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AsyncState from '../../components/AsyncState.vue'
import { operationApi } from '../../services/operation'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const loading = ref(false)
const error = ref(null)
const stats = ref({ productCount: 0, articleCount: 0, userCount: 0, pendingApplications: 0, pendingMessages: 0 })

const roleText = computed(() => {
  if (userStore.isPreviewActive) return `开发预览：${userStore.currentRole}`
  return { ADMIN: '管理员', DEALER: '经销商', USER: '用户' }[userStore.currentRole] || '游客'
})

const metrics = computed(() => [
  { key: 'products', label: '产品总数', value: stats.value.productCount, meta: '进入产品管理', to: '/admin/products', icon: '🧸', tone: '' },
  { key: 'articles', label: '内容总数', value: stats.value.articleCount, meta: '进入内容管理', to: '/admin/content', icon: '📝', tone: '' },
  { key: 'users', label: '用户总数', value: stats.value.userCount, meta: '进入用户管理', to: '/admin/users', icon: '👥', tone: '' },
  { key: 'applications', label: '待审核申请', value: stats.value.pendingApplications, meta: '处理经销商申请', to: '/admin/dealers', icon: '🤝', tone: 'attention' },
  { key: 'messages', label: '待处理留言', value: stats.value.pendingMessages, meta: '进入支持中心', to: '/admin/support', icon: '💬', tone: 'attention' }
])

async function loadOverview() {
  loading.value = true
  error.value = null
  try {
    const response = await operationApi.overview()
    stats.value = { ...stats.value, ...(response.data || {}) }
  } catch (reason) {
    error.value = reason
  } finally {
    loading.value = false
  }
}

onMounted(loadOverview)
</script>

<style scoped>
.admin-overview { min-width: 0; }
.overview-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
.eyebrow { margin: 0 0 5px; color: var(--primary-color); font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
.overview-heading h1 { margin: 0; font-size: 24px; }
.overview-heading p:last-child { margin: 6px 0 0; color: var(--text-muted); font-size: 13px; }
.metrics-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
.metric-card { min-width: 0; padding: 18px; background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); transition: transform .2s, box-shadow .2s, border-color .2s; }
.metric-card:hover { transform: translateY(-2px); border-color: var(--primary-border); box-shadow: var(--shadow-md); }
.metric-card.attention { background: linear-gradient(160deg, #fff 60%, #F6F3EE); }
.metric-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.metric-label { color: var(--text-muted); font-size: 12px; font-weight: 600; }
.metric-icon { font-size: 19px; }
.metric-card strong { display: block; margin: 14px 0 8px; color: var(--text-color); font-size: 30px; line-height: 1; }
.metric-card.attention strong { color: var(--accent-color); }
.metric-meta { color: var(--text-light); font-size: 11px; }
.session-card { display: flex; justify-content: space-between; align-items: center; gap: 24px; margin-top: 20px; padding: 18px 20px; background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md); }
.session-card > div:first-child { display: grid; gap: 3px; }
.session-label, .session-card span:last-child { color: var(--text-light); font-size: 12px; }
.session-actions { display: flex; flex-wrap: wrap; gap: 16px; }
.session-actions a { color: var(--primary-hover); font-size: 13px; font-weight: 600; }
@media (max-width: 1180px) { .metrics-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 768px) { .overview-heading, .session-card { align-items: flex-start; flex-direction: column; } .metrics-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .metrics-grid { grid-template-columns: 1fr; } }
</style>
