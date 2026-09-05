<template>
  <div class="home-container">
    <!-- 1. 品牌主张：场景化首屏 Hero -->
    <section class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-tag">WEMOVE SPORTS & LIVING</div>
        <h1 class="hero-title">惟木匠心 · 传承自然与造物之美</h1>
        <p class="hero-subtitle">
          专为家庭与教育机构打造的天然实木运动益智游戏、榫卯积木与全屋实木定制
        </p>
        <div class="hero-cta-group">
          <router-link to="/products" class="btn-primary">
            <span>探索玩具系列</span>
            <el-icon><Right /></el-icon>
          </router-link>
          <router-link to="/dealers/apply" class="btn-outline">
            <span>经销商与大宗采购</span>
            <el-icon><Tickets /></el-icon>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 2. 业务分类：三大黄金业务直通卡片（1秒建立业务认知） -->
    <section class="business-section">
      <div class="section-inner">
        <div class="biz-grid">
          <!-- Card 1 -->
          <div class="biz-card" @click="$router.push('/products')">
            <div class="biz-icon">🎳</div>
            <div class="biz-info">
              <h3 class="biz-title">益智运动玩具</h3>
              <p class="biz-desc">儿童木质保龄球、极简平衡板与重力滚珠轨道，启发体能与手脑协调。</p>
              <span class="biz-link">选购热销系列 &rarr;</span>
            </div>
          </div>

          <!-- Card 2 -->
          <div class="biz-card" @click="$router.push('/furniture')">
            <div class="biz-icon">🪑</div>
            <div class="biz-info">
              <h3 class="biz-title">实木家具定制</h3>
              <p class="biz-desc">纯天然全实木全屋定制，大师设计传承榫卯工艺，绿色环保零甲醛。</p>
              <span class="biz-link">预约定制方案 &rarr;</span>
            </div>
          </div>

          <!-- Card 3 -->
          <div class="biz-card" @click="$router.push('/woodlab')">
            <div class="biz-icon">🔬</div>
            <div class="biz-info">
              <h3 class="biz-title">科教实践与打样</h3>
              <p class="biz-desc">高校产学研合作、STEM教具研发生产、工坊创客课程与中试支持。</p>
              <span class="biz-link">了解中试打样 &rarr;</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. 精选产品（真实接口 GET /products?featured=1，#87 ProductListItem 字段） -->
    <section class="featured-products-section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <div class="section-label">FEATURED PRODUCTS</div>
            <h2 class="section-title">精选现货热销专区</h2>
          </div>
          <router-link to="/products" class="view-all-link">
            查看全部玩具品类 &rarr;
          </router-link>
        </div>

        <AsyncState
          :loading="featuredLoading"
          loading-text="正在加载精选产品…"
          :error="featuredError"
          :empty="!featuredLoading && !featuredError && featuredProducts.length === 0"
          empty-text="暂无精选产品，敬请期待"
          @retry="loadFeatured"
        >
          <div class="products-grid">
            <div
              v-for="p in featuredProducts"
              :key="p.id"
              class="product-card"
            >
              <div class="product-badge" v-if="p.tag">{{ p.tag }}</div>
              <div class="product-thumb" @click="$router.push(`/products/${p.slug || p.id}`)">
                <img v-if="p.coverImage" :src="p.coverImage" :alt="p.name" />
                <div v-else class="thumb-placeholder">🧸</div>
              </div>

              <div class="product-body">
                <div class="product-meta">
                  <span class="product-sku">{{ p.sku }}</span>
                  <span v-if="p.categoryName" class="product-age">{{ p.categoryName }}</span>
                </div>
                <h3 class="product-name" @click="$router.push(`/products/${p.slug || p.id}`)">
                  {{ p.name }}
                </h3>
                <p class="product-summary">{{ p.summary }}</p>

                <div class="product-footer">
                  <div class="price-wrap">
                    <div class="price-main">
                      <span class="currency">¥</span>
                      <span class="amount">{{ p.price }}</span>
                    </div>
                  </div>
                  <router-link :to="`/products/${p.slug || p.id}`" class="detail-link">
                    查看详情
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </AsyncState>
      </div>
    </section>

    <!-- 4. 经销商合作招募专区（B2B 核心能力与申请入口） -->
    <section class="dealer-banner-section">
      <div class="section-inner">
        <div class="dealer-banner-card">
          <div class="dealer-banner-text">
            <span class="dealer-tag">B2B PARTNERSHIP</span>
            <h2 class="dealer-title">成为 WeMove 城市合作伙伴与经销商</h2>
            <p class="dealer-desc">
              我们为幼教机构、早教中心、母婴连锁与玩具贸易商提供专属阶梯供货价、中试定制打样支持与一对一专属商务对接。
            </p>
            <div class="dealer-features">
              <div class="feat-item">✓ 一级/二级专属批发特惠折扣</div>
              <div class="feat-item">✓ 支持小批量混合起订 (MOQ)</div>
              <div class="feat-item">✓ 快速批量下单与企业账期支持</div>
            </div>
          </div>
          <div class="dealer-banner-action">
            <router-link to="/dealers/apply" class="btn-primary dealer-btn">
              立即申请办理经销商
            </router-link>
            <div class="dealer-contact-tip">
              已有合作账号？<router-link to="/dealer/portal">直接进入经销商工作台</router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. 品牌价值：天然实木 + 榫卯安全 -->
    <section class="values-section">
      <div class="section-inner">
        <div class="values-grid">
          <div class="value-item">
            <div class="value-icon">🌳</div>
            <h4>100% 天然环保实木</h4>
            <p>优选德国进口榉木与多层桦木，食品级环保水性漆涂装。</p>
          </div>
          <div class="value-item">
            <div class="value-icon">📐</div>
            <h4>匠心手工打磨</h4>
            <p>无棱角安全倒圆工艺，历经8道砂光，触感温润无倒刺。</p>
          </div>
          <div class="value-item">
            <div class="value-icon">⚡</div>
            <h4>运动与体能启发</h4>
            <p>融入动能守恒、重力加速度与平衡感统，让孩子在玩中动起来。</p>
          </div>
          <div class="value-item">
            <div class="value-icon">📦</div>
            <h4>现货极速仓配</h4>
            <p>标准款常备仓储现货，支持一件代发与大宗整箱物流。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. 最新动态（真实接口 GET /articles?pageSize=3，#88 ArticleListItem 字段） -->
    <section class="news-section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <div class="section-label">LATEST NEWS</div>
            <h2 class="section-title">最新动态</h2>
          </div>
        </div>

        <AsyncState
          :loading="newsLoading"
          loading-text="正在加载最新动态…"
          :error="newsError"
          :empty="!newsLoading && !newsError && newsList.length === 0"
          empty-text="暂无动态内容"
          @retry="loadNews"
        >
          <div class="news-grid">
            <div v-for="a in newsList" :key="a.id" class="news-card">
              <div class="news-cover">
                <img v-if="a.coverImage" :src="a.coverImage" :alt="a.title" />
                <div v-else class="news-cover-placeholder">📰</div>
              </div>
              <div class="news-body">
                <div class="news-meta">
                  <span v-if="a.categoryName" class="news-cat">{{ a.categoryName }}</span>
                  <span v-if="a.publishedAt" class="news-date">{{ formatDate(a.publishedAt) }}</span>
                </div>
                <h3 class="news-title">{{ a.title }}</h3>
                <p class="news-summary">{{ a.summary }}</p>
              </div>
            </div>
          </div>
          <p class="news-note">文章详情页与全文阅读将随内容任务 #88 一并上线。</p>
        </AsyncState>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AsyncState from '../components/AsyncState.vue'
import { homeApi } from '../services/home'

/**
 * 官网首页（#86 首页外壳）：品牌主张 / 业务分类 / 精选产品 / 经销商入口 / 品牌价值 / 最新动态。
 * - 精选产品与最新动态走真实公开接口（契约见 services/home.js），
 *   loading / error / empty 状态由 AsyncState 呈现，接口失败不回退本地假数据；
 * - 经销商价格等敏感字段不在公开 DTO 中，卡片只展示公开指导价；
 * - 决策 D9：加购入口未实现，全部以「查看详情」引导到产品页。
 */
const featuredLoading = ref(false)
const featuredError = ref(null)
const featuredProducts = ref([])

const newsLoading = ref(false)
const newsError = ref(null)
const newsList = ref([])

async function loadFeatured() {
  featuredLoading.value = true
  featuredError.value = null
  try {
    const envelope = await homeApi.fetchFeaturedProducts(6)
    featuredProducts.value = envelope?.data?.items || []
  } catch (err) {
    featuredError.value = err
  } finally {
    featuredLoading.value = false
  }
}

async function loadNews() {
  newsLoading.value = true
  newsError.value = null
  try {
    const envelope = await homeApi.fetchLatestArticles(3)
    newsList.value = envelope?.data?.items || []
  } catch (err) {
    newsError.value = err
  } finally {
    newsLoading.value = false
  }
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  loadFeatured()
  loadNews()
})
</script>

<style scoped>
.home-container {
  width: 100%;
}

/* 1. Hero */
.hero-section {
  position: relative;
  min-height: 540px;
  display: flex;
  align-items: center;
  background: url('/images/prod_20_1.jpg') center/cover no-repeat;
  padding: 88px 24px;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.34) 50%, rgba(255, 255, 255, 0.02) 100%);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 680px;
  margin: 0 auto;
  width: 100%;
}

.hero-tag {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-color);
  letter-spacing: 2.5px;
  margin-bottom: 14px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.hero-title {
  font-size: clamp(30px, 4.5vw, 44px);
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.22;
  margin-bottom: 18px;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.85);
}

.hero-subtitle {
  font-size: 17px;
  color: var(--text-muted);
  line-height: 1.65;
  margin-bottom: 34px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85);
  max-width: 560px;
}

.hero-cta-group {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

/* Section Common */
.section-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 2. Business Cards */
.business-section {
  margin-top: -40px;
  position: relative;
  z-index: 10;
  margin-bottom: 60px;
}

.biz-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.biz-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.biz-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-border);
}

.biz-icon {
  font-size: 30px;
  background: var(--bg-light);
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.biz-card:hover .biz-icon {
  transform: scale(1.08) rotate(-4deg);
}

.biz-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 6px;
}

.biz-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 12px;
}

.biz-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
}

/* 3. Featured Products */
.featured-products-section {
  padding: 40px 0 70px;
  background: #ffffff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 36px;
}

.section-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--accent-color);
  margin-bottom: 6px;
  text-transform: uppercase;
}

.section-title {
  font-size: 26px;
  font-weight: 600;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.view-all-link {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  transition: color 0.2s;
}

.view-all-link:hover {
  color: var(--primary-color);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.product-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-border);
}

.product-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  background: var(--text-color);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
}

.product-thumb {
  width: 100%;
  height: 240px;
  background: #f7f7f7;
  overflow: hidden;
  cursor: pointer;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.product-card:hover .product-thumb img {
  transform: scale(1.06);
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.product-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.product-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
  cursor: pointer;
  line-height: 1.35;
}

.product-name:hover {
  color: var(--primary-color);
}

.product-summary {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 18px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border-color);
  padding-top: 14px;
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.price-main .currency {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-color);
}

.price-main .amount {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent-color);
}

.detail-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  font-size: 13px;
  font-weight: 500;
  padding: 7px 16px;
  border-radius: var(--radius-full);
  text-decoration: none;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.detail-link::after {
  content: "→";
  font-size: 13px;
  transition: transform 0.2s ease;
}

.detail-link:hover::after {
  transform: translateX(3px);
}

.detail-link:hover {
  background: var(--primary-color);
  color: #ffffff;
  border-color: var(--primary-color);
}

/* 4. Dealer Banner */
.dealer-banner-section {
  padding: 30px 0 70px;
}

.dealer-banner-card {
  background: linear-gradient(135deg, #FAF8F5 0%, #F1ECE3 100%);
  border: 1px solid var(--primary-border);
  border-radius: var(--radius-xl);
  padding: 48px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  box-shadow: var(--shadow-sm);
}

.dealer-banner-text {
  max-width: 680px;
}

.dealer-tag {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--accent-color);
  display: inline-block;
  margin-bottom: 8px;
}

.dealer-title {
  font-size: 26px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.dealer-desc {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 20px;
}

.dealer-features {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.dealer-banner-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.dealer-btn {
  padding: 14px 30px;
  font-size: 16px;
}

.dealer-contact-tip {
  font-size: 12px;
  color: var(--text-light);
}

.dealer-contact-tip a {
  color: var(--accent-color);
  font-weight: 600;
}

.dealer-contact-tip a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 5. Values */
.values-section {
  padding: 60px 0 80px;
  border-top: 1px solid var(--border-color);
  background: #ffffff;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}

.value-item {
  text-align: center;
}

.value-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.value-item h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.value-item p {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
}

/* 6. News */
.news-section {
  padding: 0 0 80px;
  background: #ffffff;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.news-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.news-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-border);
}

.news-cover {
  width: 100%;
  height: 170px;
  background: #f7f7f7;
  overflow: hidden;
}

.news-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.news-card:hover .news-cover img {
  transform: scale(1.05);
}

.news-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.news-body {
  padding: 18px 20px 22px;
}

.news-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--text-light);
  margin-bottom: 8px;
}

.news-cat {
  color: var(--accent-color);
  font-weight: 600;
}

.news-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-summary {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-note {
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-light);
  text-align: center;
}

@media (max-width: 960px) {
  .hero-title {
    font-size: clamp(26px, 5.4vw, 32px);
  }
  .biz-grid {
    grid-template-columns: 1fr;
  }
  .products-grid {
    grid-template-columns: 1fr;
  }
  .news-grid {
    grid-template-columns: 1fr;
  }
  .dealer-banner-card {
    flex-direction: column;
    align-items: flex-start;
    padding: 36px 28px;
  }
  .values-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .hero-section {
    min-height: 460px;
    padding: 64px 20px;
  }
  .section-inner {
    padding: 0 20px;
  }
  .hero-cta-group .btn-primary,
  .hero-cta-group .btn-outline {
    width: 100%;
  }
  .dealer-banner-action {
    width: 100%;
  }
  .dealer-banner-action .btn-primary {
    width: 100%;
  }
  .values-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
