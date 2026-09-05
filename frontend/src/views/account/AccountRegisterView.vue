<template>
  <div class="register-page">
    <div class="register-card">
      <h1 class="register-title">注册 WEMOVE 账户</h1>
      <p class="register-sub">注册后默认为普通用户角色；经销商合作请走「申请成为经销商」</p>

      <el-alert
        v-if="formError"
        :title="formError.message"
        :type="formError.type"
        show-icon
        :closable="false"
        class="register-alert"
      />

      <el-form
        :model="form"
        label-position="top"
        class="register-form"
        :disabled="submitting"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="用户名" :error="fieldError('username')">
          <el-input
            v-model="form.username"
            placeholder="3-32 位字母、数字或下划线"
            size="large"
            name="username"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item label="邮箱" :error="fieldError('email')">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="用于登录与找回密码"
            size="large"
            name="email"
            autocomplete="email"
          />
        </el-form-item>
        <el-form-item label="密码" :error="fieldError('password')">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="至少 8 位，建议包含字母与数字"
            size="large"
            show-password
            name="new-password"
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="确认密码" :error="confirmError">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            show-password
            name="new-password-confirm"
            autocomplete="new-password"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          native-type="submit"
          :loading="submitting"
        >
          {{ submitting ? '注册中…' : '注册' }}
        </el-button>
      </el-form>

      <div class="register-links">
        <router-link :to="{ name: 'AccountLogin', query: route.query.redirect ? { redirect: route.query.redirect } : {} }">
          已有账户？直接登录
        </router-link>
        <router-link to="/dealers/apply">申请成为经销商</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '../../services/auth'

/**
 * 注册页（#86 账户区）：POST /auth/register（#85 契约）。
 * 后端校验失败（400 + errors）映射到对应表单项；注册成功后引导用户登录，
 * 是否自动建立会话以 #85 实现为准，前端不做本地登录态兜底。
 */
const route = useRoute()
const router = useRouter()

const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const submitting = ref(false)
const formError = ref(null)
const confirmError = ref('')

function fieldError(name) {
  const errs = formError.value?.fieldErrors?.[name]
  return Array.isArray(errs) && errs.length ? errs[0] : ''
}

function validateLocal() {
  if (!form.username.trim() || !form.email.trim() || !form.password) {
    formError.value = { type: 'warning', message: '请完整填写用户名、邮箱和密码', fieldErrors: null }
    return false
  }
  if (form.password !== form.confirmPassword) {
    confirmError.value = '两次输入的密码不一致'
    return false
  }
  confirmError.value = ''
  return true
}

async function handleRegister() {
  formError.value = null
  if (!validateLocal()) return

  submitting.value = true
  try {
    await authApi.register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password
    })
    ElMessage.success('注册成功，请使用新账户登录')
    router.push({ name: 'AccountLogin', query: route.query.redirect ? { redirect: route.query.redirect } : {} })
  } catch (error) {
    formError.value = {
      type: 'error',
      message: error?.message || '注册失败，请稍后重试',
      fieldErrors: error?.fieldErrors || null
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--bg-light);
}

.register-card {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 40px 36px;
  width: 100%;
  max-width: 460px;
}

.register-title {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 6px;
}

.register-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 22px;
}

.register-alert {
  margin-bottom: 16px;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}

.register-links {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--text-muted);
}

.register-links a {
  color: var(--primary-color);
  font-weight: 600;
}
</style>
