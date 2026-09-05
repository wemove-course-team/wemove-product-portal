<template>
  <div class="apply-page">
    <div class="apply-hero">
      <div class="hero-inner">
        <span class="sub-badge">JOIN OUR GLOBAL NETWORK</span>
        <h1 class="hero-title">成为 WeMove 惟木匠心合作伙伴与经销商</h1>
        <p class="hero-desc">
          开放全国重点城市与区域代理申请。我们提供专属出厂批发价格、灵活 MOQ、定制研发支持及全方位售后培训。
        </p>
      </div>
    </div>

    <div class="apply-container">
      <div class="apply-card" v-if="!submittedApp">
        <div class="card-header">
          <h2>填写经销商合作申请表</h2>
          <p>请准确填写贵司主体信息与联系方式，我们将在 1 个工作日内完成审核并联系您。</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="apply-form"
        >
          <div class="form-row">
            <el-form-item label="企业/机构法定全称" prop="companyName" class="form-col">
              <el-input v-model="form.companyName" placeholder="例如：杭州优木文化发展有限公司" size="large" />
            </el-form-item>

            <el-form-item label="统一社会信用代码 / 税号" prop="taxId" class="form-col">
              <el-input v-model="form.taxId" placeholder="91330100MA2XXXXXXX" size="large" />
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item label="主营业务类型" prop="businessType" class="form-col">
              <el-select v-model="form.businessType" placeholder="请选择机构性质" size="large" style="width: 100%;">
                <el-option label="母婴及连锁玩具专卖店" value="母婴及连锁玩具专卖店" />
                <el-option label="幼儿园 / 早教托育机构直采" value="幼儿园 / 早教托育机构直采" />
                <el-option label="STEM教育创客营地 / 研学基地" value="STEM教育创客营地 / 研学基地" />
                <el-option label="跨境电商 / 海外渠道代理" value="跨境电商 / 海外渠道代理" />
                <el-option label="文创家居生活馆 / 礼品采购" value="文创家居生活馆 / 礼品采购" />
              </el-select>
            </el-form-item>

            <el-form-item label="拟合作目标销售区域" prop="region" class="form-col">
              <el-input v-model="form.region" placeholder="例如：华东区（浙江/江苏/上海）" size="large" />
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item label="业务负责人姓名" prop="contactName" class="form-col">
              <el-input v-model="form.contactName" placeholder="联系人姓名" size="large" />
            </el-form-item>

            <el-form-item label="手机号码" prop="phone" class="form-col">
              <el-input v-model="form.phone" placeholder="接收审核通知短信" size="large" />
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item label="商务电子邮箱" prop="email" class="form-col">
              <el-input v-model="form.email" placeholder="接收经销商开户通知" size="large" />
            </el-form-item>

            <el-form-item label="预计首年采购额规模" prop="annualTarget" class="form-col">
              <el-select v-model="form.annualTarget" placeholder="选择预估规模" size="large" style="width: 100%;">
                <el-option label="20万 - 50万元人民币" value="20-50万" />
                <el-option label="50万 - 100万元人民币" value="50-100万" />
                <el-option label="100万 - 300万元人民币" value="100-300万" />
                <el-option label="300万元以上 (核心战略总代)" value="300万以上" />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="主要销售渠道与销售规划">
            <el-input
              v-model="form.salesChannels"
              type="textarea"
              :rows="3"
              placeholder="简述现有销售渠道（如线下自营门店数量、合作学校数量、线上网店等）"
            />
          </el-form-item>

          <div class="submit-action">
            <el-button type="primary" size="large" class="submit-btn" :loading="submitting" @click="handleSubmit">
              提交经销商合作申请
            </el-button>
          </div>
        </el-form>
      </div>

      <!-- Success Result Box -->
      <div class="success-card" v-else>
        <div class="success-icon">🎉</div>
        <h2>经销商合作申请已成功提交！</h2>
        <div class="app-id-banner">
          申请流水编号：<strong>{{ submittedApp.id }}</strong>
        </div>
        <p class="success-msg">
          我们已收到 <strong>{{ submittedApp.companyName }}</strong> 的代理申请，平台运营团队将在后台进行资质审核。
        </p>

        <div class="quick-demo-box">
          <div class="demo-tip">
            申请已实时保存至系统。您可以在账户中心查看审核状态；审核通过后将获得经销商门户访问权限。
          </div>
        </div>

        <div class="action-row">
          <el-button size="large" @click="resetForm">再填一份申请</el-button>
          <el-button type="primary" size="large" @click="$router.push('/account')">
            查看申请状态
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDealerStore } from '../stores/dealer'
import { useUserStore } from '../stores/user'

const dealerStore = useDealerStore()
const userStore = useUserStore()
const formRef = ref(null)
const submitting = ref(false)
const submittedApp = ref(null)

onMounted(() => userStore.ensureSession())

const form = ref({
  companyName: '', taxId: '', businessType: '', region: '', contactName: '', phone: '', email: '', annualTarget: '', salesChannels: ''
})

const rules = {
  companyName: [{ required: true, message: '请输入企业法定名称', trigger: 'blur' }],
  taxId: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
  businessType: [{ required: true, message: '请选择主营业务类型', trigger: 'change' }],
  region: [{ required: true, message: '请输入目标合作区域', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入有效手机号', trigger: 'blur' }],
  email: [{ required: true, message: '请输入企业邮箱', trigger: 'blur' }]
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!userStore.isAuthenticated) {
    ElMessage.warning('请先登录后提交经销商申请')
    return
  }
  submitting.value = true
  try {
    submittedApp.value = await dealerStore.submitApplication(form.value)
    ElMessage.success('经销商申请提交成功！')
  } catch (error) {
    ElMessage.error(error?.message || '提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  submittedApp.value = null
  form.value = {
    companyName: '',
    taxId: '',
    businessType: '',
    region: '',
    contactName: '',
    phone: '',
    email: '',
    annualTarget: '',
    salesChannels: ''
  }
}
</script>

<style scoped>
.apply-hero {
  background: linear-gradient(135deg, #FAF8F5 0%, #F1ECE3 100%);
  border-bottom: 1px solid var(--border-color);
  padding: 50px 24px;
  text-align: center;
}

.hero-inner {
  max-width: 800px;
  margin: 0 auto;
}

.sub-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: var(--primary-color);
  letter-spacing: 2px;
  margin-bottom: 10px;
}

.hero-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 12px;
}

.hero-desc {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.6;
}

.apply-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.apply-card, .success-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 40px;
  box-shadow: var(--shadow-sm);
}

.card-header {
  margin-bottom: 30px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 20px;
}

.card-header h2 {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 6px;
}

.card-header p {
  font-size: 14px;
  color: var(--text-muted);
}

.form-row {
  display: flex;
  gap: 24px;
}

.form-col {
  flex: 1;
}

.submit-action {
  margin-top: 30px;
  text-align: center;
}

.submit-btn {
  width: 240px;
  height: 48px;
  font-size: 16px;
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.success-card {
  text-align: center;
  padding: 60px 40px;
}

.success-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.app-id-banner {
  display: inline-block;
  background: var(--bg-light);
  border: 1px solid var(--primary-border);
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 15px;
  color: var(--text-color);
  margin: 16px 0 20px;
}

.success-msg {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto 30px;
}

.quick-demo-box {
  background: #FDF9F2;
  border: 1px solid #EFE4D2;
  border-radius: 10px;
  padding: 16px;
  max-width: 680px;
  margin: 0 auto 30px;
  text-align: left;
  font-size: 13px;
  color: #785A32;
  line-height: 1.6;
}

.admin-link, .portal-link {
  color: #B25E29;
  font-weight: 600;
  text-decoration: underline;
}

.action-row {
  display: flex;
  justify-content: center;
  gap: 16px;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>

