<template>
  <div class="workspace-page">
    <header class="page-heading">
      <div><p class="eyebrow">PARTNER WORKSPACE</p><h1>合作伙伴工作台</h1><p>{{ summary?.company?.companyName || '正在读取企业信息' }} · {{ summary?.company?.region || '授权区域待确认' }}</p></div>
      <div class="heading-actions"><el-button @click="load"><el-icon><Refresh /></el-icon>刷新</el-button><el-button type="primary" @click="$router.push('/dealer/catalog?action=order')"><el-icon><ShoppingCart /></el-icon>发起采购</el-button></div>
    </header>

    <AsyncState :loading="loading" loading-text="正在汇总经销商业务…" :error="error" @retry="load">
      <section class="welcome-card">
        <div><span class="tier-label">当前授权等级</span><h2>{{ summary?.company?.tierName || '未配置等级' }}</h2><p>结算币种 {{ summary?.company?.currency || 'CNY' }} · {{ summary?.company?.paymentTerms || '付款条款待配置' }}</p></div>
        <div class="welcome-meta"><span>专属客户经理</span><strong>{{ summary?.company?.accountManager || '暂未分配' }}</strong><small>企业内身份：{{ summary?.memberRole === 'OWNER' ? '企业管理员' : '采购成员' }}</small></div>
      </section>

      <section class="metric-grid" aria-label="业务摘要">
        <router-link v-for="item in metrics" :key="item.label" :to="item.to" class="metric-card">
          <div class="metric-head"><span>{{ item.label }}</span><el-icon><component :is="item.icon" /></el-icon></div>
          <strong>{{ item.value }}</strong><small>{{ item.hint }}</small>
        </router-link>
      </section>

      <div class="dashboard-grid">
        <section class="panel document-panel">
          <div class="panel-head"><div><p class="panel-kicker">RECENT ACTIVITY</p><h2>最近业务单据</h2></div><div class="panel-links"><router-link to="/dealer/quotes">全部报价</router-link><router-link to="/dealer/orders">全部订单</router-link></div></div>
          <div v-if="recentDocuments.length" class="document-list">
            <router-link v-for="doc in recentDocuments" :key="doc.number" :to="doc.to" class="document-row">
              <span class="document-icon" :class="doc.type"><el-icon><component :is="doc.icon" /></el-icon></span>
              <span class="document-main"><strong>{{ doc.number }}</strong><small>{{ doc.typeText }} · {{ formatBusinessDate(doc.createdAt, true) }}</small></span>
              <span class="document-amount">{{ doc.amount }}</span>
              <el-tag :type="dealerStatusType(doc.status)" effect="plain">{{ dealerStatusText(doc.status) }}</el-tag>
              <el-icon class="document-arrow"><ArrowRight /></el-icon>
            </router-link>
          </div>
          <el-empty v-else description="暂无报价或订单，先从授权商品发起询价或采购" :image-size="72"><el-button type="primary" @click="$router.push('/dealer/catalog')">浏览授权商品</el-button></el-empty>
        </section>

        <aside class="side-stack">
          <section class="panel task-panel">
            <div class="panel-head"><div><p class="panel-kicker">TO DO</p><h2>待办事项</h2></div><span class="count-pill">{{ summary?.tasks?.length || 0 }}</span></div>
            <div v-if="summary?.tasks?.length" class="task-list">
              <router-link v-for="task in summary.tasks" :key="task.type" :to="task.to" class="task-row"><span><strong>{{ task.title }}</strong><small>有 {{ task.count }} 项需要查看</small></span><el-icon><ArrowRight /></el-icon></router-link>
            </div>
            <div v-else class="all-clear"><el-icon><CircleCheck /></el-icon><span><strong>当前没有待办</strong><small>新的报价、订单和单据会显示在这里</small></span></div>
          </section>

          <section class="panel quick-panel"><p class="panel-kicker">QUICK ACTIONS</p><h2>常用入口</h2><div class="quick-grid"><router-link to="/dealer/catalog"><el-icon><Goods /></el-icon>授权目录</router-link><router-link to="/dealer/quick-order"><el-icon><ShoppingCartFull /></el-icon>快捷下单</router-link><router-link to="/dealer/downloads"><el-icon><Download /></el-icon>资料下载</router-link><router-link to="/dealer/company"><el-icon><OfficeBuilding /></el-icon>企业资料</router-link></div></section>
        </aside>
      </div>
    </AsyncState>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AsyncState from '../../components/AsyncState.vue'
import { dealerApi } from '../../services/dealer'
import { dealerStatusText, dealerStatusType, formatBusinessDate, formatCurrency } from '../../utils/dealer'

/** 经销商首页只呈现接口汇总的真实数据，不提供静态销售额、积分或余额。 */
const loading = ref(false)
const error = ref(null)
const summary = ref(null)

const metrics = computed(() => [
  { label: '授权商品', value: summary.value?.stats?.authorizedProducts ?? 0, hint: '当前可采购目录', to: '/dealer/catalog', icon: 'Goods' },
  { label: '待处理报价', value: summary.value?.stats?.pendingQuotes ?? 0, hint: '已提交或待确认', to: '/dealer/quotes', icon: 'Document' },
  { label: '进行中订单', value: summary.value?.stats?.activeOrders ?? 0, hint: '待确认、配货或运输', to: '/dealer/orders', icon: 'Box' },
  { label: '待处理发票', value: summary.value?.stats?.payableInvoices ?? 0, hint: '已开具待归档', to: '/dealer/invoices', icon: 'CreditCard' }
])

const recentDocuments = computed(() => {
  const currency = summary.value?.company?.currency || 'CNY'
  const quotes = (summary.value?.recentQuotes || []).map((item) => ({ type: 'quote', typeText: '报价单', icon: 'Document', number: item.quoteNo, status: item.status, createdAt: item.createdAt, amount: item.totalAmount == null ? '待平台报价' : formatCurrency(item.totalAmount, currency), to: '/dealer/quotes' }))
  const orders = (summary.value?.recentOrders || []).map((item) => ({ type: 'order', typeText: '订单', icon: 'Box', number: item.orderNo, status: item.status, createdAt: item.createdAt, amount: formatCurrency(item.totalAmount, currency), to: '/dealer/orders' }))
  return [...quotes, ...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6)
})

async function load() {
  loading.value = true; error.value = null
  try { summary.value = (await dealerApi.workspaceSummary()).data }
  catch (reason) { error.value = reason }
  finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.workspace-page { min-width: 0; }.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 22px; }.eyebrow,.panel-kicker { margin: 0 0 5px; color: var(--accent-color); font-size: 10px; font-weight: 800; letter-spacing: .15em; }.page-heading h1 { margin: 0; font-size: 25px; }.page-heading p:last-child { margin: 5px 0 0; color: var(--text-muted); font-size: 13px; }.heading-actions { display: flex; gap: 10px; }
.welcome-card { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 25px 28px; color: #fff; background: linear-gradient(118deg, #2b302f, #42443e 72%, #655d50); border-radius: 18px; box-shadow: 0 12px 30px rgba(45,48,43,.18); }.tier-label { color: rgba(255,255,255,.58); font-size: 11px; letter-spacing: .1em; }.welcome-card h2 { margin: 7px 0 3px; font-size: 24px; }.welcome-card p { margin: 0; color: rgba(255,255,255,.68); font-size: 12px; }.welcome-meta { display: grid; min-width: 210px; gap: 3px; padding-left: 24px; border-left: 1px solid rgba(255,255,255,.16); }.welcome-meta span,.welcome-meta small { color: rgba(255,255,255,.55); font-size: 11px; }.welcome-meta strong { font-size: 15px; }
.metric-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 14px; margin: 18px 0; }.metric-card { min-width: 0; padding: 18px 19px; background: #fff; border: 1px solid var(--border-color); border-radius: 14px; box-shadow: var(--shadow-sm); transition: .2s ease; }.metric-card:hover { transform: translateY(-2px); border-color: var(--primary-border); box-shadow: var(--shadow-md); }.metric-head { display: flex; align-items: center; justify-content: space-between; color: var(--text-muted); font-size: 12px; }.metric-head .el-icon { color: var(--primary-color); font-size: 19px; }.metric-card strong { display: block; margin: 12px 0 5px; font-size: 28px; line-height: 1; }.metric-card small { color: var(--text-light); font-size: 10px; }
.dashboard-grid { display: grid; grid-template-columns: minmax(0,2fr) minmax(280px,1fr); gap: 18px; }.panel { background: #fff; border: 1px solid var(--border-color); border-radius: 15px; box-shadow: var(--shadow-sm); }.document-panel,.task-panel,.quick-panel { padding: 21px; }.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 14px; }.panel-head h2,.quick-panel h2 { margin: 0; font-size: 17px; }.panel-links { display: flex; gap: 14px; }.panel-links a { color: var(--primary-hover); font-size: 11px; font-weight: 600; }.document-list { border-top: 1px solid var(--border-color); }.document-row { display: grid; grid-template-columns: 38px minmax(150px,1fr) minmax(100px,auto) 90px 20px; align-items: center; gap: 11px; min-height: 68px; border-bottom: 1px solid var(--border-color); }.document-row:last-child { border-bottom: 0; }.document-row:hover { background: var(--bg-light); }.document-icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 9px; color: var(--primary-hover); background: var(--primary-light); }.document-icon.order { color: var(--accent-color); background: #fbf1e9; }.document-main { min-width: 0; display: grid; }.document-main strong { overflow: hidden; text-overflow: ellipsis; font-size: 12px; }.document-main small { color: var(--text-light); font-size: 10px; }.document-amount { text-align: right; font-size: 12px; font-weight: 700; }.document-arrow { color: var(--text-light); }
.side-stack { display: grid; align-content: start; gap: 18px; }.count-pill { min-width: 25px; padding: 3px 8px; text-align: center; color: var(--accent-color); background: #fbf1e9; border-radius: 999px; font-size: 11px; font-weight: 700; }.task-list { display: grid; gap: 8px; }.task-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px; background: var(--bg-light); border-radius: 10px; }.task-row span { display: grid; }.task-row strong { font-size: 12px; }.task-row small { color: var(--text-light); font-size: 10px; }.all-clear { display: flex; align-items: center; gap: 12px; padding: 14px; color: #4c7a5b; background: #f1f7f2; border-radius: 11px; }.all-clear > .el-icon { font-size: 23px; }.all-clear span { display: grid; }.all-clear strong { font-size: 12px; }.all-clear small { color: #75937e; font-size: 10px; }.quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 14px; }.quick-grid a { display: grid; place-items: center; gap: 7px; min-height: 72px; color: var(--text-muted); background: var(--bg-light); border: 1px solid var(--border-color); border-radius: 11px; font-size: 11px; }.quick-grid a:hover { color: var(--accent-color); border-color: var(--primary-border); }.quick-grid .el-icon { font-size: 20px; }
@media (max-width: 1120px) { .metric-grid { grid-template-columns: 1fr 1fr; }.dashboard-grid { grid-template-columns: 1fr; }.side-stack { grid-template-columns: 1fr 1fr; } }
@media (max-width: 680px) { .page-heading,.welcome-card { align-items: flex-start; flex-direction: column; }.heading-actions { width: 100%; }.heading-actions .el-button { flex: 1; }.welcome-meta { width: 100%; padding: 16px 0 0; border-left: 0; border-top: 1px solid rgba(255,255,255,.16); }.metric-grid,.side-stack { grid-template-columns: 1fr; }.document-row { grid-template-columns: 34px minmax(0,1fr) 78px 18px; }.document-amount { display: none; }.document-row .el-tag { width: 78px; overflow: hidden; }.panel-links { display: none; } }
</style>
