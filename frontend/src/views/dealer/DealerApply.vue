<template>
  <div class="apply-page">
    <section class="apply-hero">
      <span class="sub-badge">JOIN OUR NETWORK</span>
      <h1>成为 WeMove 合作伙伴</h1>
      <p>提交企业资料，申请经销商合作资格。</p>
    </section>

    <main class="apply-container">
      <section v-if="dealerStore.applications.length" ref="statusCardRef" class="status-card">
        <h2>我的申请记录</h2>
        <div v-for="item in dealerStore.applications" :key="item.id" class="status-row">
          <span>{{ item.id }} · {{ item.companyName }}</span>
          <el-tag :type="statusType(item.status)">{{ statusText(item.status) }}</el-tag>
        </div>
      </section>

      <section v-if="!submittedApp" class="apply-card">
        <h2>填写合作申请</h2>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <div class="form-row">
            <el-form-item label="企业名称" prop="companyName"><el-input v-model="form.companyName" /></el-form-item>
            <el-form-item label="统一社会信用代码 / 税号" prop="taxId"><el-input v-model="form.taxId" /></el-form-item>
          </div>
          <div class="form-row">
            <el-form-item label="主营业务类型" prop="businessType"><el-input v-model="form.businessType" /></el-form-item>
            <el-form-item label="目标合作区域" prop="region"><el-input v-model="form.region" /></el-form-item>
          </div>
          <div class="form-row">
            <el-form-item label="联系人" prop="contactName"><el-input v-model="form.contactName" /></el-form-item>
            <el-form-item label="联系电话" prop="phone"><el-input v-model="form.phone" /></el-form-item>
          </div>
          <div class="form-row">
            <el-form-item label="商务邮箱" prop="email"><el-input v-model="form.email" /></el-form-item>
            <el-form-item label="预计首年采购额" prop="annualTarget"><el-input v-model="form.annualTarget" /></el-form-item>
          </div>
          <el-form-item label="销售渠道与规划"><el-input v-model="form.salesChannels" type="textarea" :rows="3" /></el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交申请</el-button>
        </el-form>
      </section>

      <section v-else class="success-card">
        <h2>申请已提交</h2>
        <p>申请编号：<strong>{{ submittedApp.id }}</strong></p>
        <el-button type="primary" :loading="viewingStatus" @click="viewApplicationStatus">查看申请状态</el-button>
      </section>
    </main>
  </div>
</template>

<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDealerStore } from '../../stores/dealer'
import { useUserStore } from '../../stores/user'

const dealerStore = useDealerStore()
const userStore = useUserStore()
const formRef = ref(null)
const submitting = ref(false)
const viewingStatus = ref(false)
const submittedApp = ref(null)
const statusCardRef = ref(null)
const form = reactive({ companyName: '', taxId: '', businessType: '', region: '', contactName: '', phone: '', email: '', annualTarget: '', salesChannels: '' })
const rules = Object.fromEntries(['companyName', 'taxId', 'businessType', 'region', 'contactName', 'phone', 'email', 'annualTarget'].map((field) => [field, [{ required: true, message: '请填写此项', trigger: 'blur' }]]))

onMounted(async () => {
  await userStore.ensureSession()
  if (userStore.isAuthenticated) await dealerStore.fetchMine().catch(() => null)
})

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    return
  }
  submitting.value = true
  try {
    submittedApp.value = await dealerStore.submitApplication({ ...form })
    ElMessage.success('申请已提交')
  } catch (err) {
    ElMessage.error(err?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

async function viewApplicationStatus() {
  viewingStatus.value = true
  try {
    await dealerStore.fetchMine()
    submittedApp.value = null
    await nextTick()
    statusCardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (err) {
    ElMessage.error(err?.message || '申请状态加载失败')
  } finally {
    viewingStatus.value = false
  }
}

function statusText(status) { return { PENDING: '审核中', APPROVED: '已通过', REJECTED: '未通过' }[status] || status }
function statusType(status) { return { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }[status] || 'info' }
</script>

<style scoped>
.apply-hero { padding: 50px 24px; text-align: center; background: var(--bg-light); border-bottom: 1px solid var(--border-color); }
.sub-badge { color: var(--primary-color); font-size: 12px; font-weight: 700; letter-spacing: 1.5px; }
h1 { margin: 10px 0; color: var(--text-color); }
.apply-hero p { margin: 0; color: var(--text-muted); }
.apply-container { max-width: 980px; margin: 0 auto; padding: 32px 24px 72px; }
.apply-card, .status-card, .success-card { padding: 24px; background: #fff; border: 1px solid var(--border-color); border-radius: 10px; box-shadow: var(--shadow-sm); }
.status-card, .success-card { margin-bottom: 24px; }
h2 { margin: 0 0 20px; color: var(--text-color); font-size: 20px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.status-row { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-top: 1px solid var(--border-color); color: var(--text-muted); }
@media (max-width: 700px) { .form-row { grid-template-columns: 1fr; gap: 0; } .apply-container { padding: 24px 16px 56px; } }
</style>
