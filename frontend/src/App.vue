<template>
  <div class="site-root" :class="{ 'is-cover-page': isCoverPage }">
    <!-- 全局路由切换 loading（懒加载 + 守卫预检期间） -->
    <RouteProgress />

    <!-- 全局模式标识：Mock 演示模式 / 开发预览角色（#86 界面标识要求） -->
    <ModeIndicator />

    <!-- 官网、经销商中心与管理后台使用相互独立的导航外壳；独立全屏画册封面不显示。 -->
    <FrontHeader v-if="zone !== 'admin' && zone !== 'dealer' && !isCoverPage" />

    <main class="site-main">
      <router-view />
    </main>

    <FrontFooter v-if="zone !== 'admin' && zone !== 'dealer' && !isCoverPage" />
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
const isCoverPage = computed(() => route.meta.hideHeader || route.path === '/' || route.path === '/cover')
</script>

<style>
/* Global resets & root */
</style>
