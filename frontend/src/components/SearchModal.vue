<template>
  <el-dialog
    v-model="visible"
    title="全站搜索"
    width="560px"
    align-center
    append-to-body
    :show-close="true"
    class="search-dialog"
    destroy-on-close
  >
    <div class="search-box">
      <el-input
        v-model="keyword"
        placeholder="搜索玩具、家具定制、STEM教具、说明书..."
        prefix-icon="Search"
        clearable
        size="large"
        autofocus
      />
    </div>

    <!-- Quick search tags -->
    <div class="quick-tags">
      <span class="tag-label">热搜推荐：</span>
      <span
        v-for="tag in ['保龄球', '平衡板', '50块积木', '滚珠轨道', '全屋定制', 'STEM打样']"
        :key="tag"
        class="quick-tag"
        @click="keyword = tag"
      >
        {{ tag }}
      </span>
    </div>

    <!-- 状态反馈：loading / error / empty（数据来自公开产品接口，无本地兜底） -->
    <div v-if="searching" class="search-state">
      <el-icon class="spin"><Loading /></el-icon>
      <span>正在搜索…</span>
    </div>
    <el-alert
      v-else-if="searchError"
      :title="searchError.message || '搜索失败，请稍后重试'"
      type="error"
      show-icon
      :closable="false"
    />
    <div v-else-if="keyword.trim() && !results.length" class="search-empty">
      未找到包含 “{{ keyword }}” 的相关内容，请尝试更换关键词
    </div>

    <!-- Search Results Preview -->
    <div v-else-if="results.length" class="search-results">
      <div class="results-header">找到相关商品 ({{ results.length }})：</div>
      <div
        v-for="p in results"
        :key="p.id"
        class="result-item"
        @click="goToDetail(p)"
      >
        <img v-if="p.coverImage" :src="p.coverImage" :alt="p.name" class="result-img" />
        <div v-else class="result-img result-img-placeholder">🧸</div>
        <div class="result-info">
          <div class="result-title">{{ p.name }}</div>
          <div class="result-desc">{{ p.summary }}</div>
        </div>
        <div class="result-price">¥{{ p.price }}</div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { homeApi } from '../services/home'

/**
 * 全站搜索弹窗（#86）：调用公开产品列表接口（GET /products?keyword=...），
 * 只消费 #87 已交接的 ProductListItem 公开字段（id/name/slug/coverImage/price/summary），
 * 输入 350ms 防抖；失败/为空给出明确状态，不做本地假数据兜底。
 */
const visible = ref(false)
const keyword = ref('')
const router = useRouter()

const searching = ref(false)
const searchError = ref(null)
const results = ref([])

let debounceTimer = null

watch(keyword, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  const q = String(value || '').trim()
  if (!q) {
    searching.value = false
    searchError.value = null
    results.value = []
    return
  }
  searching.value = true
  debounceTimer = setTimeout(() => runSearch(q), 350)
})

async function runSearch(q) {
  searching.value = true
  searchError.value = null
  try {
    const envelope = await homeApi.searchProducts(q)
    // 仅展示仍等于当前关键词的结果，避免乱序响应覆盖
    if (String(keyword.value || '').trim() === q) {
      results.value = envelope?.data?.items || []
    }
  } catch (err) {
    if (String(keyword.value || '').trim() === q) {
      searchError.value = err
      results.value = []
    }
  } finally {
    if (String(keyword.value || '').trim() === q) {
      searching.value = false
    }
  }
}

function open() {
  keyword.value = ''
  visible.value = true
}

function close() {
  visible.value = false
}

function goToDetail(p) {
  close()
  // 产品路由以 slug 寻址（/products/:slug）
  router.push(`/products/${p.slug || p.id}`)
}

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})

defineExpose({ open, close })
</script>

<style scoped>
.search-box {
  margin-bottom: 16px;
}

.quick-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 20px;
}

.tag-label {
  color: var(--text-light);
}

.quick-tag {
  background: var(--bg-light);
  color: var(--text-muted);
  padding: 3px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border-color);
}

.quick-tag:hover {
  background: var(--primary-light);
  color: var(--primary-color);
  border-color: var(--primary-border);
}

.search-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.search-state .spin {
  color: var(--primary-color);
  animation: search-spin 1s linear infinite;
}

@keyframes search-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.search-results {
  max-height: 360px;
  overflow-y: auto;
}

.results-header {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 10px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.result-item:hover {
  background: var(--bg-light);
}

.result-img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  background: #f0f0f0;
  flex-shrink: 0;
}

.result-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-desc {
  font-size: 12px;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-price {
  font-size: 15px;
  font-weight: 700;
  color: #B25E29;
  flex-shrink: 0;
}

.search-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--text-light);
  font-size: 14px;
}
</style>
