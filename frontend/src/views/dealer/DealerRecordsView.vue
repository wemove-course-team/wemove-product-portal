<template>
  <div class="records-page">
    <header class="page-heading"><div><p class="eyebrow">{{ config.eyebrow }}</p><h1>{{ config.title }}</h1><p>{{ config.description }}</p></div><div class="heading-actions"><el-button :loading="loading" @click="load"><el-icon><Refresh /></el-icon>刷新</el-button><el-button v-if="mode === 'quotes'" type="primary" @click="$router.push('/dealer/catalog')">发起询价</el-button><el-button v-if="mode === 'orders'" type="primary" @click="$router.push('/dealer/quick-order')">快捷下单</el-button></div></header>

    <section class="records-card">
      <div class="toolbar"><el-select v-model="status" clearable placeholder="全部状态" @change="search"><el-option v-for="option in config.statuses" :key="option.value" :label="option.label" :value="option.value" /></el-select><span>共 {{ total }} 条记录</span></div>
      <AsyncState :loading="loading" :error="error" :empty="!loading && !items.length" :empty-text="config.empty" @retry="load">
        <el-table :data="items" stripe>
          <template v-if="mode === 'quotes'">
            <el-table-column prop="quoteNo" label="报价编号" min-width="190" />
            <el-table-column label="商品" width="90"><template #default="{ row }">{{ row.itemCount }} 项</template></el-table-column>
            <el-table-column label="期望交期" width="130"><template #default="{ row }">{{ formatBusinessDate(row.requestedDeliveryDate) }}</template></el-table-column>
            <el-table-column label="有效期" width="130"><template #default="{ row }">{{ formatBusinessDate(row.validUntil) }}</template></el-table-column>
            <el-table-column label="报价金额" width="140"><template #default="{ row }">{{ row.totalAmount == null ? '待平台报价' : formatCurrency(row.totalAmount) }}</template></el-table-column>
            <el-table-column prop="notes" label="备注" min-width="170" show-overflow-tooltip><template #default="{ row }">{{ row.notes || '-' }}</template></el-table-column>
          </template>
          <template v-else-if="mode === 'orders'">
            <el-table-column prop="orderNo" label="订单编号" min-width="190" />
            <el-table-column prop="poNumber" label="PO Number" min-width="150"><template #default="{ row }">{{ row.poNumber || '-' }}</template></el-table-column>
            <el-table-column label="商品" width="90"><template #default="{ row }">{{ row.itemCount }} 项</template></el-table-column>
            <el-table-column label="订单金额" width="145"><template #default="{ row }"><strong class="amount">{{ formatCurrency(row.totalAmount) }}</strong></template></el-table-column>
            <el-table-column prop="trackingNo" label="物流单号" min-width="150"><template #default="{ row }">{{ row.trackingNo || '待发货' }}</template></el-table-column>
          </template>
          <template v-else>
            <el-table-column prop="invoiceNo" label="发票编号" min-width="190" />
            <el-table-column prop="orderNo" label="关联订单" min-width="190" />
            <el-table-column label="金额" width="145"><template #default="{ row }"><strong class="amount">{{ formatCurrency(row.amount) }}</strong></template></el-table-column>
            <el-table-column label="开具时间" width="150"><template #default="{ row }">{{ formatBusinessDate(row.issuedAt) }}</template></el-table-column>
            <el-table-column label="到期时间" width="150"><template #default="{ row }">{{ formatBusinessDate(row.dueAt) }}</template></el-table-column>
            <el-table-column label="文件" width="100"><template #default="{ row }"><el-link v-if="row.fileUrl" :href="row.fileUrl" target="_blank" type="primary">下载</el-link><span v-else class="muted">待上传</span></template></el-table-column>
          </template>
          <el-table-column label="状态" width="125" fixed="right"><template #default="{ row }"><el-tag :type="dealerStatusType(row.status)" effect="plain">{{ dealerStatusText(row.status) }}</el-tag></template></el-table-column>
          <el-table-column label="创建时间" width="165"><template #default="{ row }">{{ formatBusinessDate(row.createdAt || row.issuedAt, true) }}</template></el-table-column>
        </el-table>
      </AsyncState>
      <el-pagination v-if="total > pageSize" v-model:current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next" @current-change="load" />
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AsyncState from '../../components/AsyncState.vue'
import { dealerApi } from '../../services/dealer'
import { dealerStatusText, dealerStatusType, formatBusinessDate, formatCurrency } from '../../utils/dealer'

/** 报价、订单、发票共用一致的筛选、状态、分页和空态交互。 */
const props = defineProps({ mode: { type: String, required: true } })
const items = ref([]); const total = ref(0); const page = ref(1); const pageSize = 10; const status = ref(''); const loading = ref(false); const error = ref(null)
const configs = {
  quotes: { eyebrow: 'QUOTATIONS', title: '报价单', description: '查看询价进度、平台报价、有效期和业务备注。', empty: '暂无报价，先从授权商品发起询价。', statuses: [{ label: '已提交', value: 'SUBMITTED' }, { label: '待确认', value: 'QUOTED' }, { label: '已接受', value: 'ACCEPTED' }, { label: '已拒绝', value: 'REJECTED' }, { label: '已过期', value: 'EXPIRED' }] },
  orders: { eyebrow: 'ORDERS & LOGISTICS', title: '订单与物流', description: '订单提交后由平台确认，成交价作为快照保留。', empty: '暂无订单，先创建一笔快捷采购。', statuses: [{ label: '待平台确认', value: 'PENDING_REVIEW' }, { label: '已确认', value: 'CONFIRMED' }, { label: '已发货', value: 'SHIPPED' }, { label: '已完成', value: 'COMPLETED' }, { label: '已取消', value: 'CANCELLED' }] },
  invoices: { eyebrow: 'INVOICES & SETTLEMENT', title: '发票与结算', description: '按企业边界查看订单发票与结算状态。', empty: '当前没有发票或结算单据。', statuses: [{ label: '待处理', value: 'ISSUED' }, { label: '已付款', value: 'PAID' }, { label: '已作废', value: 'VOID' }] }
}
const config = computed(() => configs[props.mode] || configs.orders)

async function load() { loading.value = true; error.value = null; try { const data = (await dealerApi[props.mode]({ status: status.value || undefined, page: page.value, pageSize })).data; items.value = data.items || []; total.value = data.total || 0 } catch (reason) { error.value = reason } finally { loading.value = false } }
function search() { page.value = 1; load() }
watch(() => props.mode, () => { page.value = 1; status.value = ''; load() })
onMounted(load)
</script>

<style scoped>
.records-page { min-width:0; }.page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:20px; }.eyebrow { margin:0 0 5px; color:var(--accent-color); font-size:10px; font-weight:800; letter-spacing:.15em; }.page-heading h1 { margin:0; font-size:25px; }.page-heading p:last-child { margin:5px 0 0; color:var(--text-muted); font-size:13px; }.heading-actions { display:flex; gap:9px; }.records-card { padding:20px; background:#fff; border:1px solid var(--border-color); border-radius:15px; box-shadow:var(--shadow-sm); }.toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:15px; }.toolbar .el-select { width:180px; }.toolbar span,.muted { color:var(--text-light); font-size:11px; }.amount { color:var(--accent-color); font-size:12px; }.el-pagination { justify-content:flex-end; margin-top:18px; }
@media(max-width:680px){.page-heading{align-items:flex-start;flex-direction:column}.heading-actions{width:100%}.heading-actions .el-button{flex:1}.records-card{padding:14px}.toolbar{align-items:flex-start;flex-direction:column}.el-pagination{justify-content:flex-start;overflow-x:auto}}
</style>
