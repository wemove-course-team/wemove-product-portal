<template>
  <div class="news-detail-page">
    <div class="container">
      <div class="breadcrumb-bar">
        <router-link to="/">首页</router-link>
        <span class="sep">/</span>
        <router-link to="/news">新闻动态</router-link>
        <span class="sep">/</span>
        <span class="current">文章详情</span>
      </div>

      <AsyncState
        :loading="loading"
        loading-text="正在加载文章内容…"
        :error="error"
        :not-found="notFound"
        empty-text="文章不存在或已下架"
        @retry="loadArticle"
      >
        <article v-if="article" class="article-container">
          <header class="article-header">
            <div class="meta-row">
              <span v-if="article.category?.name" class="cat-badge">
                {{ article.category.name }}
              </span>
              <span v-if="article.publishedAt" class="date-text">
                发布时间：{{ formatDate(article.publishedAt) }}
              </span>
            </div>
            <h1 class="article-title">{{ article.title }}</h1>
            <p v-if="article.summary" class="article-summary-lead">
              {{ article.summary }}
            </p>
          </header>

          <div v-if="article.coverImage" class="cover-section">
            <img :src="article.coverImage" :alt="article.title" class="featured-img" />
          </div>

          <!-- 正文安全输出：纯文本格式化输出，不做裸 v-html -->
          <div class="article-content-body">
            <p
              v-for="(paragraph, idx) in formattedParagraphs"
              :key="idx"
              class="content-paragraph"
            >
              {{ paragraph }}
            </p>
          </div>

          <footer class="article-footer">
            <router-link to="/news" class="back-link">
              &larr; 返回新闻动态列表
            </router-link>
          </footer>
        </article>
      </AsyncState>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AsyncState from '../../components/AsyncState.vue'
import { contentApi } from '../../services/content'

const route = useRoute()

const loading = ref(false)
const error = ref(null)
const notFound = ref(false)
const article = ref(null)

const formattedParagraphs = computed(() => {
  if (!article.value?.content) return []
  return article.value.content
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
})

async function loadArticle() {
  const slug = route.params.slug
  if (!slug) {
    notFound.value = true
    return
  }

  loading.value = true
  error.value = null
  notFound.value = false

  try {
    const res = await contentApi.getArticle(slug)
    article.value = res.data
  } catch (err) {
    if (err.status === 404 || err.code === 'NOT_FOUND_404') {
      notFound.value = true
    } else {
      error.value = err
    }
  } finally {
    loading.value = false
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

watch(
  () => route.params.slug,
  () => {
    loadArticle()
  }
)

onMounted(() => {
  loadArticle()
})
</script>

<style scoped>
.news-detail-page {
  padding: 36px 0 80px;
  background-color: var(--bg-light, #F9FAFB);
  min-height: calc(100vh - 70px);
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px;
}

.breadcrumb-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 28px;
}

.breadcrumb-bar a {
  color: #4B5563;
  text-decoration: none;
}

.breadcrumb-bar a:hover {
  color: var(--primary, #D97706);
}

.breadcrumb-bar .sep {
  color: #D1D5DB;
}

.breadcrumb-bar .current {
  color: #9CA3AF;
}

.article-container {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

@media (max-width: 640px) {
  .article-container {
    padding: 24px;
  }
}

.article-header {
  margin-bottom: 32px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.cat-badge {
  background: #FEF3C7;
  color: #B45309;
  font-size: 13px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
}

.date-text {
  font-size: 13px;
  color: #9CA3AF;
}

.article-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  line-height: 1.35;
  margin: 0 0 16px;
}

.article-summary-lead {
  font-size: 16px;
  color: #4B5563;
  line-height: 1.6;
  background: #F3F4F6;
  padding: 16px 20px;
  border-left: 4px solid var(--primary, #D97706);
  border-radius: 0 8px 8px 0;
  margin: 0;
}

.cover-section {
  margin-bottom: 36px;
  border-radius: 12px;
  overflow: hidden;
  max-height: 440px;
  background: #E5E7EB;
}

.featured-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.article-content-body {
  font-size: 16px;
  line-height: 1.85;
  color: #374151;
}

.content-paragraph {
  margin: 0 0 20px;
  text-align: justify;
}

.article-footer {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid #E5E7EB;
}

.back-link {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary, #D97706);
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}
</style>
