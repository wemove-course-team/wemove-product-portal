<template>
  <!-- 全局运行模式标识（#86：Mock 必须有显式开关与界面标识） -->
  <div v-if="shouldShow" class="mode-indicator">
    <span v-if="isMock" class="mode-tag mock">Mock 演示模式</span>
    <span v-if="userStore.isPreviewActive" class="mode-tag preview">
      开发预览角色：{{ userStore.currentRole }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { API_MODE, IS_DEV } from '../config/env'
import { useUserStore } from '../stores/user'

/**
 * 固定在左下角的模式徽标：
 * - VITE_API_MODE=mock 时显示「Mock 演示模式」，明确当前数据非真实后端；
 * - 开发构建中启用预览角色时显示「开发预览角色」，明确界面身份不代表真实会话。
 * 生产构建 + real 模式下不渲染任何内容。
 */
const userStore = useUserStore()

const isMock = computed(() => API_MODE === 'mock')
const shouldShow = computed(() => isMock.value || (IS_DEV && userStore.isPreviewActive))
</script>

<style scoped>
.mode-indicator {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 3000;
  display: flex;
  gap: 8px;
  pointer-events: none;
}

.mode-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff;
  box-shadow: var(--shadow-md);
}

.mode-tag.mock {
  background: #B25E29;
}

.mode-tag.preview {
  background: #5A6472;
}
</style>
