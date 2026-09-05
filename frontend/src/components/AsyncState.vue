<template>
  <div class="async-state">
    <!-- 加载中 -->
    <div v-if="loading" class="state-block state-loading">
      <el-icon class="spin"><Loading /></el-icon>
      <p class="state-text">{{ loadingText }}</p>
    </div>

    <!-- 无权限 403 -->
    <el-result
      v-else-if="forbidden"
      icon="warning"
      title="403"
      sub-title="您没有权限访问该内容"
      class="state-result"
    >
      <template #extra>
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <slot name="forbidden-extra" />
      </template>
    </el-result>

    <!-- 不存在 404 -->
    <el-result
      v-else-if="notFound"
      icon="info"
      title="404"
      sub-title="请求的内容不存在或已被移除"
      class="state-result"
    >
      <template #extra>
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <slot name="notfound-extra" />
      </template>
    </el-result>

    <!-- 请求失败（error 可为 ApiError 对象或字符串） -->
    <el-result
      v-else-if="error"
      icon="error"
      :title="errorTitle"
      :sub-title="errorText"
      class="state-result"
    >
      <template #extra>
        <el-button v-if="showRetry" type="primary" @click="$emit('retry')">重试</el-button>
        <slot name="error-extra" />
      </template>
      <template v-if="errorRequestId" #default>
        <p class="request-id">追踪编号：{{ errorRequestId }}</p>
      </template>
    </el-result>

    <!-- 空数据 -->
    <el-result v-else-if="empty" icon="info" title="" :sub-title="emptyText" class="state-result">
      <template #extra>
        <slot name="empty-extra" />
      </template>
    </el-result>

    <!-- 正常内容 -->
    <slot v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

/**
 * 统一异步状态反馈块（loading / empty / error / 403 / 404）
 *
 * #86 验收：页面需提供明确的 404/403/loading/empty/error 状态。
 * error 传 services/http.js 抛出的 ApiError（含 message/requestId）或纯字符串；
 * 各状态按 loading > forbidden > notFound > error > empty 的优先级判定，
 * 全部为假时渲染默认插槽（正常内容）。
 */
const props = defineProps({
  loading: { type: Boolean, default: false },
  loadingText: { type: String, default: '正在加载…' },
  empty: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无数据' },
  error: { type: [Object, String], default: null },
  errorTitle: { type: String, default: '加载失败' },
  forbidden: { type: Boolean, default: false },
  notFound: { type: Boolean, default: false },
  showRetry: { type: Boolean, default: true }
})

defineEmits(['retry'])

const router = useRouter()

const errorText = computed(() => {
  if (!props.error) return ''
  if (typeof props.error === 'string') return props.error
  return props.error.message || '请求失败，请稍后重试'
})

const errorRequestId = computed(() => {
  if (props.error && typeof props.error === 'object') return props.error.requestId || null
  return null
})

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.async-state {
  width: 100%;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 24px;
  color: var(--text-muted);
}

.state-loading .el-icon {
  font-size: 32px;
  color: var(--primary-color);
}

.spin {
  animation: async-state-spin 1s linear infinite;
}

@keyframes async-state-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.state-text {
  font-size: 14px;
}

.state-result {
  padding: 48px 24px;
}

.request-id {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-light);
  text-align: center;
}
</style>
