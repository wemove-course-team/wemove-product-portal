<template>
  <div class="notfound-page">
    <div class="nf-card">
      <p class="nf-code">404</p>
      <h1 class="nf-title">页面不存在</h1>
      <p class="nf-desc">
        您访问的页面不存在、已被移除，或链接地址有误。
        <span v-if="attemptedPath" class="nf-path">（{{ attemptedPath }}）</span>
      </p>
      <div class="nf-actions">
        <el-button type="primary" size="large" @click="$router.push('/')">返回首页</el-button>
        <el-button size="large" @click="$router.push('/products')">浏览产品</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 全局 404 页面（#86）：未知路由不再静默跳回首页，而是给出明确状态。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const attemptedPath = computed(() => (route.fullPath === '/' ? '' : decodeURI(route.fullPath)))
</script>

<style scoped>
.notfound-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--bg-light);
}

.nf-card {
  text-align: center;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 56px 48px;
  max-width: 520px;
  width: 100%;
}

.nf-code {
  font-size: 72px;
  font-weight: 800;
  line-height: 1;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.nf-title {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 10px;
}

.nf-desc {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 28px;
  word-break: break-all;
}

.nf-path {
  color: var(--text-light);
}

.nf-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
