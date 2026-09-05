<template>
  <transition name="route-progress-fade">
    <div v-if="visible" class="route-progress" aria-hidden="true">
      <div class="route-progress-bar" :class="{ indeterminate: !done }"></div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * 全局路由切换 loading（#86 状态反馈基线）：
 * 懒加载组件下载 + 守卫会话预检期间在页面顶部显示细进度条，
 * 避免“点击无反应”的空白体验。数据请求级 loading 由 AsyncState 负责。
 */
const router = useRouter()

const visible = ref(false)
const done = ref(false)
let hideTimer = null
let doneTimer = null

function onStart() {
  if (hideTimer) clearTimeout(hideTimer)
  if (doneTimer) clearTimeout(doneTimer)
  done.value = false
  visible.value = true
}

function onEnd() {
  done.value = true
  doneTimer = setTimeout(() => {
    visible.value = false
    hideTimer = setTimeout(() => {
      done.value = false
    }, 300)
  }, 200)
}

onMounted(() => {
  router.beforeEach(onStart)
  router.afterEach(onEnd)
  router.onError(onEnd)
})

onUnmounted(() => {
  if (hideTimer) clearTimeout(hideTimer)
  if (doneTimer) clearTimeout(doneTimer)
})
</script>

<style scoped>
.route-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 4000;
  pointer-events: none;
  background: transparent;
}

.route-progress-bar {
  height: 100%;
  width: 100%;
  background: var(--primary-color, #A89880);
  transform-origin: left center;
  transition: transform 0.2s ease, opacity 0.3s ease;
}

.route-progress-bar.indeterminate {
  animation: route-progress-slide 1s ease-in-out infinite;
}

@keyframes route-progress-slide {
  0% {
    transform: translateX(-100%) scaleX(0.4);
  }
  50% {
    transform: translateX(30%) scaleX(0.6);
  }
  100% {
    transform: translateX(100%) scaleX(0.4);
  }
}

.route-progress-fade-leave-active {
  transition: opacity 0.3s ease;
}

.route-progress-fade-leave-to {
  opacity: 0;
}
</style>
