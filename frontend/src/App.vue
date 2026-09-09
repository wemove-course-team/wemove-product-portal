<template>
  <div class="site-root">
    <!-- 全局路由切换 loading（懒加载 + 守卫预检期间） -->
    <RouteProgress />

    <!-- 全局模式标识：Mock 演示模式 / 开发预览角色（#86 界面标识要求） -->
    <ModeIndicator />

    <!-- 官网、经销商中心与管理后台使用相互独立的导航外壳，避免角色入口混用。 -->
    <FrontHeader v-if="zone !== 'admin' && zone !== 'dealer'" />

    <main class="site-main">
      <router-view />
    </main>

    <FrontFooter v-if="zone !== 'admin' && zone !== 'dealer'" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FrontHeader from './components/FrontHeader.vue'
import FrontFooter from './components/FrontFooter.vue'
import ModeIndicator from './components/ModeIndicator.vue'
import RouteProgress from './components/RouteProgress.vue'

const route = useRoute()
// 路由 meta.zone: 'public' | 'account' | 'dealer' | 'admin'（见 router/index.js）
const zone = computed(() => route.meta.zone || 'public')
</script>

<style>
/* Global resets & root */
</style>
