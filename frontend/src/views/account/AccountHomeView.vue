<template>
  <div class="account-page">
    <div class="account-body">
      <h1 class="page-title">我的账户</h1>

      <AsyncState
        :loading="userStore.sessionStatus === 'loading'"
        :error="userStore.sessionError"
        @retry="refresh"
      >
        <div class="session-card">
          <div class="avatar">{{ avatarText }}</div>
          <div class="session-info">
            <div class="username">{{ userStore.userInfo.username }}</div>
            <div class="email">{{ userStore.userInfo.email || '未绑定邮箱' }}</div>
            <div class="role-row">
              <span class="role-tag" :class="{ admin: userStore.isAdmin }">{{ roleText }}</span>
              <span class="user-id">ID: {{ userStore.userInfo.id }}</span>
            </div>
          </div>
          <div class="session-actions">
            <el-button type="primary" plain @click="handleLogout">退出登录</el-button>
          </div>
        </div>

        <el-alert
          class="todo-alert"
          type="info"
          :closable="false"
          show-icon
          title="账户中心建设中"
          description="资料修改与密码管理对接 #85 的 PATCH /users/me、PUT /users/me/password 接口；订单功能按决策 D9 本轮不开放。当前页面用于验证统一会话与会话摘要展示。"
        />
      </AsyncState>
    </div>
  </div>
</template>

<script setup>
/**
 * 账户区首页（#86 基线）：展示服务端会话摘要并演示
 * loading / error（含重试）状态。资料/密码管理对接 #85 契约接口。
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AsyncState from '../../components/AsyncState.vue'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const avatarText = computed(() => (userStore.userInfo.username || '游').slice(0, 1).toUpperCase())

const roleText = computed(() => {
  if (userStore.isPreviewActive) return `开发预览：${userStore.currentRole}`
  const role = userStore.sessionUser?.role
  if (role === 'SUPER_ADMIN') return '超级管理员'
  if (role === 'ADMIN') return '管理员'
  if (role === 'USER') return '普通用户'
  return '游客'
})

function refresh() {
  userStore.ensureSession()
}

async function handleLogout() {
  const { ok, error } = await userStore.logout()
  if (ok) {
    ElMessage.success('已退出登录')
  } else {
    ElMessage.error(error?.message || '退出失败，请稍后重试')
  }
  router.push('/')
}
</script>

<style scoped>
.account-page {
  background: var(--bg-light);
  min-height: 60vh;
}

.account-body {
  max-width: 860px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.page-title {
  font-size: 26px;
  color: var(--text-color);
  margin-bottom: 24px;
}

.session-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 28px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  flex-shrink: 0;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.username {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.email {
  font-size: 13px;
  color: var(--text-muted);
  margin: 2px 0 8px;
}

.role-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: var(--primary-light);
  color: var(--primary-color);
  border: 1px solid var(--primary-border);
}

.role-tag.admin {
  background: #5A6472;
  border-color: #5A6472;
  color: #ffffff;
}

.user-id {
  font-size: 12px;
  color: var(--text-light);
}

.session-actions {
  flex-shrink: 0;
}

.todo-alert {
  margin-top: 20px;
}
</style>
