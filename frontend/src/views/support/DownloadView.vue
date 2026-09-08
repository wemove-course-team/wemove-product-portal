<template>
  <div class="support-page">
    <section class="page-heading">
      <p class="eyebrow">DOWNLOADS</p>
      <h1>{{ title }}</h1>
      <p>公开资料无需登录；受限资料会根据当前账号权限显示。本轮资料使用公开静态文件路径，权限控制覆盖资料列表和打开接口。</p>
    </section>
    <el-skeleton v-if="loading" :rows="5" animated />
    <el-empty v-else-if="!items.length" description="暂无可用下载资料" />
    <div v-else class="download-list">
      <el-card v-for="item in items" :key="item.id" class="download-item" shadow="never">
        <img v-if="item.coverImage" :src="item.coverImage" :alt="item.title" class="download-cover" />
        <div class="download-copy"><h2>{{ item.title }}</h2><p>{{ item.description || '电子资料' }}</p><el-tag size="small" effect="plain">{{ visibilityText(item.visibility) }}</el-tag></div>
        <el-button type="primary" :loading="downloading === item.id" @click="download(item)">打开资料</el-button>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supportApi } from '../../services/support'

const props = defineProps({ category: { type: String, default: '' }, pageTitle: { type: String, default: '下载中心' } })
const route = useRoute()
const items = ref([])
const loading = ref(false)
const downloading = ref(null)
const title = computed(() => props.pageTitle)

async function load() {
  loading.value = true
  try {
    const category = props.category || route.query.category || ''
    const response = await supportApi.listDownloads(category ? { category } : {})
    items.value = response.data || []
  } catch (error) { ElMessage.error(error.message || '下载列表加载失败') } finally { loading.value = false }
}

async function download(item) {
  downloading.value = item.id
  // 用户点击时先同步创建窗口，避免接口返回后再 window.open 被浏览器拦截。
  const target = window.open('', '_blank')
  try {
    const response = await supportApi.accessDownload(item.id)
    if (target) {
      target.opener = null
      target.location.replace(response.data.fileUrl)
    } else {
      window.location.assign(response.data.fileUrl)
    }
  } catch (error) {
    target?.close()
    ElMessage.error(error.message || '当前账号无法访问该资料')
  } finally { downloading.value = null }
}

function visibilityText(value) { return { PUBLIC: '公开', USER: '登录可见', DEALER: '经销商可见' }[value] || value }

watch(
  [() => props.category, () => route.query.category],
  load,
  { immediate: true }
)
</script>

<style scoped>
.support-page { max-width: 960px; margin: 0 auto; padding: 56px 24px 80px; }
.page-heading { margin-bottom: 28px; }
.eyebrow { margin: 0 0 8px; color: var(--primary-color); font-size: 12px; letter-spacing: 2px; }
.page-heading h1 { margin: 0 0 10px; font-size: 32px; color: var(--text-color); }
.page-heading p:last-child { margin: 0; color: var(--text-muted); }
.download-list { display: grid; gap: 14px; }
.download-item { display: flex; align-items: center; gap: 18px; border: 1px solid var(--border-color); }
.download-cover { width: 72px; height: 72px; object-fit: cover; border-radius: 6px; background: var(--bg-light); }
.download-copy { flex: 1; min-width: 0; }.download-copy h2 { margin: 0 0 6px; font-size: 17px; }.download-copy p { margin: 0 0 10px; color: var(--text-muted); }
@media (max-width: 640px) { .support-page { padding: 32px 16px 56px; } .download-item { align-items: flex-start; flex-wrap: wrap; } .download-item .el-button { margin-left: 90px; } }
</style>
