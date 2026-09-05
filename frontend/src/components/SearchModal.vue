<template>
  <el-dialog
    v-model="visible"
    title="全站搜索"
    width="560px"
    align-center
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

    <!-- Search Results Preview -->
    <div v-if="filteredProducts.length > 0" class="search-results">
      <div class="results-header">找到相关商品 ({{ filteredProducts.length }})：</div>
      <div
        v-for="p in filteredProducts.slice(0, 5)"
        :key="p.id"
        class="result-item"
        @click="goToDetail(p.id)"
      >
        <img :src="p.images[0]" :alt="p.name" class="result-img" />
        <div class="result-info">
          <div class="result-title">{{ p.name }}</div>
          <div class="result-desc">{{ p.summary }}</div>
        </div>
        <div class="result-price">¥{{ productStore.getProductPrice(p) }}</div>
      </div>
    </div>
    <div v-else-if="keyword" class="search-empty">
      未找到包含 “{{ keyword }}” 的相关内容，请尝试更换关键词
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../stores/product'

const visible = ref(false)
const keyword = ref('')
const router = useRouter()
const productStore = useProductStore()

const filteredProducts = computed(() => {
  if (!keyword.value.trim()) return []
  const q = keyword.value.toLowerCase().trim()
  return productStore.products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.summary.toLowerCase().includes(q) ||
    p.scene.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q)
  )
})

function open() {
  keyword.value = ''
  visible.value = true
}

function close() {
  visible.value = false
}

function goToDetail(id) {
  close()
  router.push(`/product/${id}`)
}

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
}

.search-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--text-light);
  font-size: 14px;
}
</style>

