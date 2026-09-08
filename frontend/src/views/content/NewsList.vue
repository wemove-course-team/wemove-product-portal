<template>
  <div class="news-list-page">
    <div class="container">
      <header class="news-header">
        <div class="header-text">
          <span class="sub-label">NEWS & STORIES</span>
          <h1 class="page-title">新闻与品牌动态</h1>
          <p class="page-sub">了解 WeMove 惟木匠心的最新产品发布、行业洞察、木作课程升级与线下工坊活动回顾。</p>
        </div>

        <div class="filter-bar">
          <el-select
            v-model="selectedCategory"
            placeholder="全部分类"
            clearable
            class="filter-select"
            @change="handleFilterChange"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>

          <el-input
            v-model="keyword"
            placeholder="搜索文章标题..."
            clearable
            class="filter-input"
            @keyup.enter="handleFilterChange"
            @clear="handleFilterChange"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleFilterChange">筛选</el-button>
        </div>
      </header>

      <AsyncState
        :loading="loading"
        loading-text="正在加载新闻动态…"
        :error="error"
        :empty="!loading && !error && articles.length === 0"
        empty-text="暂未找到符合条件的动态文章"
        @retry="loadArticles"
      >
        <div class="article-grid">
          <article
            v-for="article in articles"
            :key="article.id"
            class="article-card"
            @click="goToDetail(article.slug)"
          >
            <div class="cover-wrapper">
              <img v-if="article.coverImage" :src="article.coverImage" :alt="article.title" class="cover-img" />
              <div v-else class="cover-placeholder">📰</div>
              <span v-if="article.categoryName" class="cat-tag">{{ article.categoryName }}</span>
            </div>

            <div class="card-body">
              <div class="publish-time" v-if="article.publishedAt">
                {{ formatDate(article.publishedAt) }}
              </div>
              <h2 class="card-title">{{ article.title }}</h2>
              <p class="card-summary">{{ article.summary }}</p>
              <div class="read-more">阅读全文 &rarr;</div>
            </div>
          </article>
        </div>

        <div v-if="total > pageSize" class="pagination-container">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[6, 12, 24]"
            layout="total, prev, pager, next"
            background
            @size-change="loadArticles"
            @current-change="loadArticles"
          />
        </div>
      </AsyncState>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import AsyncState from '../../components/AsyncState.vue'
import { contentApi } from '../../services/content'

const router = useRouter()

const loading = ref(false)
const error = ref(null)
const articles = ref([])
const categories = ref([])

const page = ref(1)
const pageSize = ref(6)
const total = ref(0)
const selectedCategory = ref('')
const keyword = ref('')

async function loadCategories() {
  try {
    const res = await contentApi.getCategories()
    categories.value = res.data || []
  } catch (err) {
    console.error('Failed to load categories', err)
  }
}

async function loadArticles() {
  loading.value = true
  error.value = null
  try {
    const res = await contentApi.getArticles({
      page: page.value,
      pageSize: pageSize.value,
      categoryId: selectedCategory.value || undefined,
      keyword: keyword.value.trim() || undefined
    })
    const data = res.data || {}
    articles.value = data.items || []
    total.value = data.total || 0
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
}

function handleFilterChange() {
  page.value = 1
  loadArticles()
}

function goToDetail(slug) {
  if (slug) {
    router.push(`/news/${slug}`)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

onMounted(() => {
  loadCategories()
  loadArticles()
})
</script>

<style scoped>
.news-list-page {
  padding: 48px 0 80px;
  background-color: var(--bg-light, #F9FAFB);
  min-height: calc(100vh - 70px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.news-header {
  margin-bottom: 40px;
}

.sub-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--primary, #D97706);
  margin-bottom: 8px;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 12px;
}

.page-sub {
  font-size: 15px;
  color: #6B7280;
  max-width: 720px;
  line-height: 1.6;
  margin: 0 0 24px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  background: #FFFFFF;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-select {
  width: 180px;
}

.filter-input {
  width: 260px;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

@media (max-width: 960px) {
  .article-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .article-grid {
    grid-template-columns: 1fr;
  }
}

.article-card {
  background: #FFFFFF;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.cover-wrapper {
  position: relative;
  width: 100%;
  height: 210px;
  background: #E5E7EB;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.article-card:hover .cover-img {
  transform: scale(1.04);
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 48px;
  color: #9CA3AF;
}

.cat-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(17, 24, 39, 0.75);
  backdrop-filter: blur(4px);
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.publish-time {
  font-size: 13px;
  color: #9CA3AF;
  margin-bottom: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F2937;
  line-height: 1.4;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-summary {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
  margin: 0 0 16px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary, #D97706);
  display: inline-flex;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}
</style>
