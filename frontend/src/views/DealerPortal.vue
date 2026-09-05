<template>
  <div class="dealer-portal">
    <section class="portal-header">
      <div class="portal-inner">
        <div>
          <span class="badge-dealer">DEALER PORTAL</span>
          <h1>经销商门户</h1>
          <p v-if="portalData?.company">{{ portalData.company.companyName }} · {{ portalData.company.region }}</p>
          <p v-else>经销商身份已审核通过，以下是你的企业资料。</p>
        </div>
        <el-button @click="$router.push('/products')">浏览产品</el-button>
      </div>
    </section>

    <main class="portal-body">
      <AsyncState v-if="dealerStore.error" :error="dealerStore.error" @retry="load" />
      <el-skeleton v-else-if="dealerStore.loading" :rows="5" animated />
      <template v-else>
        <section v-if="portalData?.company" class="portal-card">
          <div class="card-title-row"><h2>企业资料</h2><el-tag type="success">{{ portalData.company.status }}</el-tag></div>
          <div class="info-grid">
            <div><span>企业名称</span><strong>{{ portalData.company.companyName }}</strong></div>
            <div><span>授权区域</span><strong>{{ portalData.company.region }}</strong></div>
            <div><span>经销商等级</span><strong>{{ portalData.company.tierName }}</strong></div>
            <div><span>价格信息</span><strong>已授权，产品详情页显示专属价格</strong></div>
            <div><span>联系人</span><strong>{{ portalData.company.contactName }}</strong></div>
            <div><span>联系电话</span><strong>{{ portalData.company.contactPhone }}</strong></div>
          </div>
        </section>
        <section class="portal-card">
          <div class="card-title-row"><div><h2>申请记录</h2><p>你的申请状态由平台审核后更新。</p></div></div>
          <el-empty v-if="!applications.length" description="暂无申请记录" />
          <el-table v-else :data="applications" border stripe>
            <el-table-column prop="id" label="申请编号" min-width="160" />
            <el-table-column prop="companyName" label="企业名称" min-width="220" />
            <el-table-column prop="createdAt" label="提交时间" min-width="180" />
            <el-table-column label="状态" width="130">
              <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="auditNote" label="审核备注" min-width="260" />
          </el-table>
        </section>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import AsyncState from '../components/AsyncState.vue'
import { useDealerStore } from '../stores/dealer'

const dealerStore = useDealerStore()
const portalData = computed(() => dealerStore.portalData)
const applications = computed(() => dealerStore.applications)

function load() { return dealerStore.fetchPortal().catch(() => null) }
function statusText(status) { return { PENDING: '审核中', APPROVED: '已通过', REJECTED: '未通过' }[status] || status }
function statusType(status) { return { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }[status] || 'info' }
onMounted(load)
</script>

<style scoped>
.portal-header { background: linear-gradient(135deg, #faf8f5, #f1ece3); border-bottom: 1px solid var(--border-color); padding: 42px 24px; }
.portal-inner, .portal-body { max-width: 1180px; margin: 0 auto; }
.portal-inner { display: flex; justify-content: space-between; align-items: center; gap: 24px; }
.badge-dealer { color: var(--primary-color); font-size: 12px; font-weight: 700; letter-spacing: 1.4px; }
h1 { margin: 9px 0 5px; color: var(--text-color); font-size: 30px; }
.portal-header p { margin: 0; color: var(--text-muted); }
.portal-body { padding: 32px 24px 80px; display: grid; gap: 24px; }
.portal-card { background: #fff; border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; box-shadow: var(--shadow-sm); }
.card-title-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
h2 { margin: 0; font-size: 20px; color: var(--text-color); }
.card-title-row p { margin: 5px 0 0; color: var(--text-muted); font-size: 13px; }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.info-grid div { display: grid; gap: 5px; padding: 14px; background: var(--bg-light); border-radius: 8px; }
.info-grid span { color: var(--text-light); font-size: 12px; }
.info-grid strong { color: var(--text-color); font-size: 14px; }
@media (max-width: 768px) { .portal-inner { align-items: flex-start; flex-direction: column; } .portal-body { padding: 24px 16px 56px; } .portal-card { padding: 18px; overflow: hidden; } .info-grid { grid-template-columns: 1fr; } }
</style>
