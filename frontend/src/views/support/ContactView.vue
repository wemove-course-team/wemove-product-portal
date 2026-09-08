<template>
  <div class="support-page">
    <section class="page-heading">
      <p class="eyebrow">SUPPORT</p>
      <h1>联系我们</h1>
      <p>留下你的问题或合作需求，我们会尽快与您联系。</p>
    </section>

    <el-card class="support-card" shadow="never">
      <el-alert v-if="submitted" type="success" :closable="false" class="result-alert">
        留言已提交，编号为 <strong>{{ submitted.code }}</strong>，请保留编号以便后续查询。
      </el-alert>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
        <div class="form-grid">
          <el-form-item label="姓名" prop="name"><el-input v-model="form.name" placeholder="请输入姓名" /></el-form-item>
          <el-form-item label="邮箱" prop="email"><el-input v-model="form.email" placeholder="name@example.com" /></el-form-item>
          <el-form-item label="电话" prop="phone"><el-input v-model="form.phone" placeholder="可选" /></el-form-item>
          <el-form-item label="主题" prop="subject"><el-input v-model="form.subject" placeholder="例如：产品咨询" /></el-form-item>
        </div>
        <el-form-item label="留言内容" prop="content"><el-input v-model="form.content" type="textarea" :rows="7" maxlength="5000" show-word-limit placeholder="请描述你的问题或需求" /></el-form-item>
        <div class="form-actions">
          <el-button type="primary" :loading="submitting" @click="submit">提交留言</el-button>
          <el-button @click="reset">清空</el-button>
          <router-link to="/faq" class="secondary-link">先看看常见问题</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { supportApi } from '../../services/support'

const formRef = ref(null)
const submitting = ref(false)
const submitted = ref(null)
const form = reactive({ name: '', email: '', phone: '', subject: '', content: '' })
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] }],
  subject: [{ required: true, message: '请输入主题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入留言内容', trigger: 'blur' }, { min: 10, message: '留言至少 10 个字符', trigger: 'blur' }]
}

async function submit() {
  if (!(await formRef.value?.validate())) return
  submitting.value = true
  try {
    const response = await supportApi.submitMessage({ ...form })
    submitted.value = response.data
    reset()
  } catch (error) {
    ElMessage.error(error.message || '留言提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

function reset() {
  formRef.value?.resetFields()
}
</script>

<style scoped>
.support-page { max-width: 960px; margin: 0 auto; padding: 56px 24px 80px; }
.page-heading { margin-bottom: 28px; }
.eyebrow { margin: 0 0 8px; color: var(--primary-color); font-size: 12px; letter-spacing: 2px; }
.page-heading h1 { margin: 0 0 10px; font-size: 32px; color: var(--text-color); }
.page-heading p:last-child { margin: 0; color: var(--text-muted); }
.support-card { border: 1px solid var(--border-color); }
.result-alert { margin-bottom: 24px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
.form-actions { display: flex; align-items: center; gap: 12px; }
.secondary-link { color: var(--primary-color); font-size: 14px; text-decoration: none; margin-left: auto; }
@media (max-width: 640px) { .support-page { padding: 32px 16px 56px; } .form-grid { grid-template-columns: 1fr; } .secondary-link { margin-left: 0; } }
</style>
