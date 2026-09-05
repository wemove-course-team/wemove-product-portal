<template>
  <div class="admin-overview">
    <h1 class="ov-title">运营概览</h1>
    <p class="ov-sub">
      当前登录身份与后台模块接入状态一览。各领域数据面板将在对应任务接入后展示，
      此页不做任何本地数据模拟。
    </p>

    <div class="ov-grid">
      <div class="ov-card">
        <div class="ov-label">当前会话</div>
        <div class="ov-value">{{ userStore.userInfo.username }}</div>
        <div class="ov-meta">{{ userStore.userInfo.email || '未绑定邮箱' }} · {{ roleText }}</div>
      </div>
      <div class="ov-card">
        <div class="ov-label">会话来源</div>
        <div class="ov-value">服务端 Cookie</div>
        <div class="ov-meta">HttpOnly wemove_session · GET /auth/me 校验（#85）</div>
      </div>
      <div class="ov-card">
        <div class="ov-label">已接入模块</div>
        <div class="ov-value">1 / 6</div>
        <div class="ov-meta">概览已就绪；产品/内容/支持/经销商/用户由各领域任务交付</div>
      </div>
    </div>

    <AsyncState
      v-if="userStore.sessionError"
      :error="userStore.sessionError"
      @retry="userStore.ensureSession()"
    >
      <span></span>
    </AsyncState>

    <div class="ov-links">
      <router-link to="/" class="ov-link">← 返回官网前台</router-link>
      <router-link to="/account" class="ov-link">我的账户 →</router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AsyncState from '../../components/AsyncState.vue'
import { useUserStore } from '../../stores/user'

/**
 * 后台概览（#86）：仅展示服务端会话摘要与模块接入状态。
 * 领域统计面板由各任务接入自己的管理接口后添加。
 */
const userStore = useUserStore()

const roleText = computed(() => {
  if (userStore.isPreviewActive) return `开发预览：${userStore.currentRole}`
  return { ADMIN: '管理员', DEALER: '经销商', USER: '用户' }[userStore.currentRole] || '游客'
})
</script>

<style scoped>
.admin-overview {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 28px;
  box-shadow: var(--shadow-sm);
}

.ov-title {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 6px;
}

.ov-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 22px;
  line-height: 1.6;
}

.ov-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.ov-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 18px;
  background: var(--bg-light);
}

.ov-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.ov-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 6px;
  word-break: break-all;
}

.ov-meta {
  font-size: 12px;
  color: var(--text-light);
  line-height: 1.5;
}

.ov-links {
  margin-top: 24px;
  display: flex;
  gap: 20px;
}

.ov-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
  text-decoration: none;
}

@media (max-width: 768px) {
  .ov-grid {
    grid-template-columns: 1fr;
  }
}
</style>
