<template>
  <div class="forbidden-page">
    <div class="fb-card">
      <p class="fb-code">403</p>
      <h1 class="fb-title">没有访问权限</h1>
      <p class="fb-desc">
        当前登录身份无权访问该区域。后台访问权限由服务端裁决，
        如需操作请联系管理员开通对应角色。
        <span v-if="fromPath" class="fb-path">（{{ fromPath }}）</span>
      </p>
      <div class="fb-actions">
        <el-button type="primary" size="large" @click="$router.push('/')">返回首页</el-button>
        <el-button size="large" @click="relogin">切换账号</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 全局 403 页面（#86）：已登录但无权限时由路由守卫引导至此。
 * 权限以服务端会话为准，此处仅提供出口，不做任何本地授权。
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const fromPath = computed(() => route.query.from || '')

async function relogin() {
  await userStore.logout()
  router.push({ name: 'AccountLogin', query: { redirect: fromPath.value || undefined } })
}
</script>

<style scoped>
.forbidden-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--bg-light);
}

.fb-card {
  text-align: center;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 56px 48px;
  max-width: 560px;
  width: 100%;
}

.fb-code {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  color: #B25E29;
  margin-bottom: 12px;
}

.fb-title {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 10px;
}

.fb-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 28px;
  word-break: break-all;
}

.fb-path {
  color: var(--text-light);
}

.fb-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
