<template>
  <div class="reset-page">
    <div class="reset-card">
      <template v-if="step === 'request'">
        <h1 class="reset-title">找回密码</h1>
        <p class="reset-sub">输入注册邮箱申请重置；开发环境由后端日志输出重置 token（决策 D4）</p>

        <el-alert
          v-if="requestError"
          :title="requestError.message || '申请失败，请稍后重试'"
          type="error"
          show-icon
          :closable="false"
          class="reset-alert"
        />

        <el-form label-position="top" :disabled="requesting" @submit.prevent="handleRequest">
          <el-form-item label="注册邮箱" :error="fieldError('email')">
            <el-input
              v-model="email"
              type="email"
              placeholder="例如 admin@wemovetoy.com"
              size="large"
              name="email"
              autocomplete="email"
            />
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            native-type="submit"
            :loading="requesting"
          >
            {{ requesting ? '提交中…' : '申请重置' }}
          </el-button>
        </el-form>

        <el-alert
          v-if="requestOk"
          :title="requestOk"
          type="success"
          show-icon
          :closable="false"
          class="reset-alert"
        />
      </template>

      <template v-else>
        <h1 class="reset-title">设置新密码</h1>
        <p class="reset-sub">粘贴后端日志中的重置 token，并输入新密码完成重置</p>

        <el-alert
          v-if="confirmError"
          :title="confirmError.message || '重置失败，请稍后重试'"
          type="error"
          show-icon
          :closable="false"
          class="reset-alert"
        />

        <el-form label-position="top" :disabled="confirming" @submit.prevent="handleConfirm">
          <el-form-item label="重置 Token" :error="fieldError('token')">
            <el-input
              v-model="token"
              placeholder="dev 日志中的 password reset token"
              size="large"
            />
          </el-form-item>
          <el-form-item label="新密码" :error="fieldError('newPassword')">
            <el-input
              v-model="newPassword"
              type="password"
              placeholder="至少 8 位，建议包含字母与数字"
              size="large"
              show-password
              name="new-password"
              autocomplete="new-password"
            />
          </el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            native-type="submit"
            :loading="confirming"
          >
            {{ confirming ? '提交中…' : '确认重置' }}
          </el-button>
        </el-form>
      </template>

      <div class="reset-links">
        <a href="javascript:void(0)" @click="switchStep">
          {{ step === 'request' ? '已有 token？去设置新密码' : '还没有 token？返回申请' }}
        </a>
        <router-link :to="{ name: 'AccountLogin' }">返回登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '../../services/auth'

/**
 * 找回密码页（#86 账户区，对接 #85 token 流程，决策 D4）：
 * - 第一步 POST /auth/password-reset/request { email }：dev 环境重置 token 打入后端日志；
 * - 第二步 POST /auth/password-reset/confirm { token, newPassword }：token 置 used。
 * 本轮不接邮件服务，页面明确提示 token 获取方式，不做任何本地重置兜底。
 */
const step = ref('request')
const email = ref('')
const token = ref('')
const newPassword = ref('')

const requesting = ref(false)
const requestError = ref(null)
const requestOk = ref('')

const confirming = ref(false)
const confirmError = ref(null)

const fieldErrorsByStep = reactive({ request: null, confirm: null })

function fieldError(name) {
  const errs = fieldErrorsByStep[step.value]?.[name]
  return Array.isArray(errs) && errs.length ? errs[0] : ''
}

function switchStep() {
  step.value = step.value === 'request' ? 'confirm' : 'request'
  requestError.value = null
  confirmError.value = null
  fieldErrorsByStep.request = null
  fieldErrorsByStep.confirm = null
}

async function handleRequest() {
  requestError.value = null
  requestOk.value = ''
  fieldErrorsByStep.request = null
  if (!email.value.trim()) {
    requestError.value = { message: '请输入注册邮箱' }
    return
  }
  requesting.value = true
  try {
    await authApi.requestPasswordReset(email.value.trim())
    requestOk.value = '申请已提交：开发环境请从后端日志获取重置 token（生产环境将支持邮件发送）'
    ElMessage.success('重置申请已提交')
  } catch (error) {
    requestError.value = error
    fieldErrorsByStep.request = error?.fieldErrors || null
  } finally {
    requesting.value = false
  }
}

async function handleConfirm() {
  confirmError.value = null
  fieldErrorsByStep.confirm = null
  if (!token.value.trim() || !newPassword.value) {
    confirmError.value = { message: '请输入重置 token 与新密码' }
    return
  }
  confirming.value = true
  try {
    await authApi.confirmPasswordReset({ token: token.value.trim(), newPassword: newPassword.value })
    ElMessage.success('密码已重置，请使用新密码登录')
    step.value = 'request'
    email.value = ''
    token.value = ''
    newPassword.value = ''
  } catch (error) {
    confirmError.value = error
    fieldErrorsByStep.confirm = error?.fieldErrors || null
  } finally {
    confirming.value = false
  }
}
</script>

<style scoped>
.reset-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--bg-light);
}

.reset-card {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 40px 36px;
  width: 100%;
  max-width: 460px;
}

.reset-title {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 6px;
}

.reset-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 22px;
  line-height: 1.6;
}

.reset-alert {
  margin-bottom: 16px;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}

.reset-links {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 13px;
}

.reset-links a {
  color: var(--primary-color);
  font-weight: 600;
}
</style>
