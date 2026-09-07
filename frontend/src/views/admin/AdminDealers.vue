<template>
  <section class="dealer-admin">
    <div class="page-head"><div><h1>经销商申请审核</h1><p>查看申请、填写审核备注并更新申请状态。</p></div><el-button :loading="loading" @click="load">刷新</el-button></div>
    <el-alert v-if="error" :title="error" type="error" show-icon class="mb" />
    <el-table v-loading="loading" :data="items" border stripe><el-table-column prop="id" label="申请编号" width="165" /><el-table-column prop="companyName" label="企业名称" min-width="220" /><el-table-column prop="contactName" label="联系人" width="100" /><el-table-column prop="status" label="状态" width="110"><template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag></template></el-table-column><el-table-column prop="createdAt" label="提交时间" width="175" /><el-table-column label="操作" width="100" fixed="right"><template #default="{ row }"><el-button link type="primary" :disabled="row.status !== 'PENDING'" @click="openReview(row)">审核</el-button></template></el-table-column></el-table>
    <div class="pager"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" layout="prev, pager, next" @current-change="load" /></div>
    <el-dialog v-model="dialogVisible" title="审核经销商申请" width="520px"><el-descriptions v-if="selected" :column="1" border><el-descriptions-item label="申请编号">{{ selected.id }}</el-descriptions-item><el-descriptions-item label="企业名称">{{ selected.companyName }}</el-descriptions-item><el-descriptions-item label="联系人">{{ selected.contactName }} / {{ selected.phone }}</el-descriptions-item><el-descriptions-item label="目标区域">{{ selected.region }}</el-descriptions-item></el-descriptions><el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="review-form"><el-form-item label="审核结果" prop="action"><el-radio-group v-model="form.action"><el-radio label="APPROVED">通过</el-radio><el-radio label="REJECTED">拒绝</el-radio></el-radio-group></el-form-item><el-form-item v-if="form.action === 'APPROVED'" label="经销商等级"><el-input v-model="form.tierName" /></el-form-item><el-form-item v-if="form.action === 'APPROVED'" label="折扣率"><el-input-number v-model="form.discountRate" :min="0.01" :max="1" :step="0.01" /></el-form-item><el-form-item label="审核备注" prop="auditNote"><el-input v-model="form.auditNote" type="textarea" :rows="3" /></el-form-item></el-form><template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="reviewing" @click="submitReview">保存审核结果</el-button></template></el-dialog>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDealerStore } from '../../stores/dealer'

const dealerStore = useDealerStore()
const items = ref([]); const total = ref(0); const page = ref(1); const pageSize = ref(10); const loading = ref(false); const reviewing = ref(false); const error = ref(''); const dialogVisible = ref(false); const selected = ref(null); const formRef = ref(null)
const form = reactive({ action: 'APPROVED', tierName: '二级特约经销商', discountRate: 0.75, auditNote: '' })
const rules = { action: [{ required: true, message: '请选择审核结果', trigger: 'change' }], auditNote: [{ required: true, message: '请填写审核备注', trigger: 'blur' }] }
async function load() { loading.value = true; error.value = ''; try { const data = await dealerStore.fetchAdminApplications({ page: page.value, pageSize: pageSize.value }); items.value = data.items; total.value = data.total } catch (err) { error.value = err?.message || '加载失败' } finally { loading.value = false } }
function openReview(row) { selected.value = row; form.action = 'APPROVED'; form.tierName = row.tierName || '二级特约经销商'; form.discountRate = row.discountRate || 0.75; form.auditNote = ''; dialogVisible.value = true }
async function submitReview() { const valid = await formRef.value.validate().catch(() => false); if (!valid) return; reviewing.value = true; try { await dealerStore.reviewApplication(selected.value.id, { ...form }); ElMessage.success('审核结果已保存'); dialogVisible.value = false; await load() } catch (err) { ElMessage.error(err?.message || '审核失败') } finally { reviewing.value = false } }
function statusText(status) { return { PENDING: '待审核', APPROVED: '已通过', REJECTED: '已拒绝' }[status] || status }
function statusType(status) { return { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }[status] || 'info' }
onMounted(load)
</script>

<style scoped>
.dealer-admin { padding: 24px; background: #fff; border: 1px solid var(--border-color); border-radius: 10px; box-shadow: var(--shadow-sm); }
.page-head { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 22px; }
h1 { margin: 0 0 6px; color: var(--text-color); font-size: 23px; }
.page-head p { margin: 0; color: var(--text-muted); font-size: 13px; }
.mb { margin-bottom: 16px; }
.pager { display: flex; justify-content: flex-end; margin-top: 18px; }
.review-form { margin-top: 20px; }
@media (max-width: 768px) { .dealer-admin { padding: 16px; overflow: hidden; } }
</style>
