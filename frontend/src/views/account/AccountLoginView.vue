<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">登录 WEMOVE 账户</h1>
      <p class="login-sub">使用用户名或邮箱登录，会话由服务端 Cookie 管理</p>

      <el-alert
        v-if="formError"
        :title="formError.message"
        :type="formError.type"
        show-icon
        :closable="false"
        class="login-alert"
      />

      <el-form
        :model="form"
        label-position="top"
        class="login-form"
        :disabled="submitting"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名 / 邮箱" :error="fieldError('identifier')">
          <el-input
            v-model="form.identifier"
            placeholder="例如 admin@wemovetoy.com"
            size="large"
            name="username"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item label="密码" :error="fieldError('password')">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            name="current-password"
            autocomplete="current-password"
          />
        </el-form-item>

        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          native-type="submit"
          :loading="submitting"
        >
          {{ submitting ? '登录中…' : '登录' }}
        </el-button>
      </el-form>

      <div class="login-links">
        <router-link :to="{ name: 'AccountRegister', query: route.query.redirect ? { redirect: route.query.redirect } : {} }">
          注册新账户
        </router-link>
        <router-link :to="{ name: 'AccountResetPassword' }">忘记密码？</router-link>
        <router-link to="/dealers/apply">申请成为经销商</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 账户登录页（#86 账户区）：真实调用 POST /auth/login（#85 契约）。
 * 登录失败按统一错误映射呈现（400 字段错误 / 401 凭据错误 / 网络异常），
 * 不做任何本地成功兜底；资料修改与改密入口由账户页提供（#85 PATCH /users/me）。
 */
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const form = reactive({ identifier: '', password: '' })
const submitting = ref(false)
const formError = ref(null)

function fieldError(name) {
  const errs = formError.value?.fieldErrors?.[name]
  return Array.isArray(errs) && errs.length ? errs[0] : ''
}

async function handleLogin() {
  formError.value = null
  if (!form.identifier || !form.password) {
    formError.value = { type: 'warning', message: '请输入账号与密码', fieldErrors: null }
    return
  }
  submitting.value = true
  const { ok, error } = await userStore.login(form.identifier.trim(), form.password)
  submitting.value = false
  if (ok) {
    router.push(String(route.query.redirect || '/account'))
    return
  }
  formError.value = {
    type: 'error',
    message: error?.message || '登录失败，请稍后重试',
    fieldErrors: error?.fieldErrors || null
  }
}
</script>

<style scoped>
.login-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--bg-light);
}

.login-card {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 40px 36px;
  width: 100%;
  max-width: 460px;
}

.login-title {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 6px;
}

.login-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 22px;
}

.login-alert {
  margin-bottom: 16px;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}

.login-links {
  margin-top: 18px;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
}

.login-links a {
  color: var(--primary-color);
  font-weight: 600;
}
</style>
