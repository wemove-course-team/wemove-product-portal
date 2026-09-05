<template>
  <div class="placeholder-page">
    <div class="ph-card">
      <span class="ph-icon">🚧</span>
      <h1 class="ph-title">{{ featureTitle }}</h1>
      <p class="ph-desc">
        该模块由 <strong>{{ ownerTask }}</strong> 领域任务交付，当前先挂载占位页保证路由与导航可用。
        功能接入后此页面将被对应领域组件替换。
      </p>
      <div class="ph-actions">
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
        <el-button v-if="isAdminZone" @click="$router.push({ name: 'AdminOverview' })">返回后台概览</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 通用功能占位页（#86 骨架用）
 *
 * 用于三类场景：
 * 1. 公开区尚未交付的页面（/support、/faq、/downloads，#89）；
 * 2. 后台区尚未接入的领域子页（产品/内容/支持/经销商/用户管理）；
 * 3. 其他领域任务交付前的路由占位。
 * 交付范围与负责人由路由 meta（featureTitle / ownerTask）声明，见 router/index.js。
 * 按「未实现就关闭入口」原则，占位页明确标注建设状态，不伪造任何功能数据。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const featureTitle = computed(() => route.meta?.featureTitle || '功能建设中')
const ownerTask = computed(() => route.meta?.ownerTask || '对应领域任务')
const isAdminZone = computed(() => route.meta?.zone === 'admin')
</script>

<style scoped>
.placeholder-page {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--bg-light);
}

.ph-card {
  text-align: center;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 48px 40px;
  max-width: 520px;
  width: 100%;
}

.ph-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.ph-title {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 10px;
}

.ph-desc {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 26px;
}

.ph-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
