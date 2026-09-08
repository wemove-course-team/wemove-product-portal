<template>
  <div class="support-page">
    <section class="page-heading">
      <p class="eyebrow">FAQ</p>
      <h1>常见问题</h1>
      <p>按分类或关键词查找产品、售后和合作信息。</p>
    </section>
    <div class="faq-toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索问题或答案" @keyup.enter="loadFaqs" @clear="loadFaqs" />
      <el-select v-model="category" clearable placeholder="全部分类" @change="loadFaqs">
        <el-option v-for="item in categories" :key="item" :label="item" :value="item" />
      </el-select>
      <el-button type="primary" :loading="loading" @click="loadFaqs">搜索</el-button>
    </div>
    <el-skeleton v-if="loading && !items.length" :rows="5" animated />
    <el-empty v-else-if="!items.length" description="暂时没有匹配的问题" />
    <el-collapse v-else v-model="activeNames" class="faq-list">
      <el-collapse-item v-for="item in items" :key="item.id" :name="String(item.id)">
        <template #title><span class="faq-title">{{ item.question }}</span><el-tag v-if="item.category" size="small" effect="plain">{{ item.category }}</el-tag></template>
        <p class="faq-answer">{{ item.answer }}</p>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { supportApi } from '../../services/support'

const items = ref([])
const keyword = ref('')
const category = ref('')
const loading = ref(false)
const activeNames = ref([])
const categories = computed(() => [...new Set(items.value.map((item) => item.category).filter(Boolean))])

async function loadFaqs() {
  loading.value = true
  try {
    const response = await supportApi.listFaqs({ keyword: keyword.value || undefined, category: category.value || undefined })
    items.value = response.data || []
  } catch (error) {
    ElMessage.error(error.message || 'FAQ 加载失败')
  } finally { loading.value = false }
}

onMounted(loadFaqs)
</script>

<style scoped>
.support-page { max-width: 960px; margin: 0 auto; padding: 56px 24px 80px; }
.page-heading { margin-bottom: 28px; }
.eyebrow { margin: 0 0 8px; color: var(--primary-color); font-size: 12px; letter-spacing: 2px; }
.page-heading h1 { margin: 0 0 10px; font-size: 32px; color: var(--text-color); }
.page-heading p:last-child { margin: 0; color: var(--text-muted); }
.faq-toolbar { display: grid; grid-template-columns: 1fr 180px auto; gap: 12px; margin-bottom: 24px; }
.faq-list { border-top: 1px solid var(--border-color); }
.faq-title { flex: 1; font-weight: 600; }
.faq-answer { margin: 0; color: var(--text-muted); line-height: 1.8; white-space: pre-wrap; }
@media (max-width: 640px) { .support-page { padding: 32px 16px 56px; } .faq-toolbar { grid-template-columns: 1fr; } }
</style>
