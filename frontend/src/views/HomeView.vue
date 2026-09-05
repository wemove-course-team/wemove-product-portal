<template>
  <div class="home-container">
    <!-- 1. 场景化首屏 Hero Section -->
    <section class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-tag">WEMOVE SPORTS & LIVING</div>
        <h1 class="hero-title">惟木匠心 · 传承自然与造物之美</h1>
        <p class="hero-subtitle">
          专为家庭与教育机构打造的天然实木运动益智游戏、榫卯积木与全屋实木定制
        </p>
        <div class="hero-cta-group">
          <router-link to="/workshop" class="btn-primary">
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

    <!-- 2. 三大黄金业务直通卡片（1秒建立业务认知） -->
    <section class="business-section">
      <div class="section-inner">
        <div class="biz-grid">
          <!-- Card 1 -->
          <div class="biz-card" @click="$router.push('/workshop')">
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

    <!-- 3. 精选现货产品专区 (展示系统核心真实商品与双轨价格) -->
    <section class="featured-products-section">
      <div class="section-inner">
        <div class="section-header">
          <div>
            <div class="section-label">FEATURED PRODUCTS</div>
            <h2 class="section-title">精选现货热销专区</h2>
          </div>
          <router-link to="/workshop" class="view-all-link">
            查看全部玩具品类 &rarr;
          </router-link>
        </div>

        <div class="products-grid">
          <div
            v-for="p in featuredProducts"
            :key="p.id"
            class="product-card"
          >
            <div class="product-badge" v-if="p.tag">{{ p.tag }}</div>
            <div class="product-thumb" @click="$router.push(`/product/${p.id}`)">
              <img :src="p.images[0]" :alt="p.name" />
            </div>

            <div class="product-body">
              <div class="product-meta">
                <span class="product-sku">{{ p.sku }}</span>
                <span class="product-age">{{ p.ageRange }}</span>
              </div>
              <h3 class="product-name" @click="$router.push(`/product/${p.id}`)">
                {{ p.name }}
              </h3>
              <p class="product-summary">{{ p.summary }}</p>

              <div class="product-footer">
                <div class="price-wrap">
                  <div class="price-main">
                    <span class="currency">¥</span>
                    <span class="amount">{{ productStore.getProductPrice(p) }}</span>
                    <span v-if="userStore.isDealer" class="dealer-label">批</span>
                  </div>
                  <div v-if="userStore.isDealer" class="retail-ref">
                    指导零售价: ¥{{ p.price }}
                  </div>
                </div>

                <button class="add-cart-btn" @click="handleAddToCart(p)">
                  <el-icon><Plus /></el-icon>
                  <span>加购</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. 经销商合作招募专区 (突出 B2B 核心能力) -->
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
              已有合作账号？<a href="javascript:void(0)" @click="$router.push('/dealer/portal')">直接进入经销商工作台</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. 品牌信任背书 (天然实木 + 榫卯安全) -->
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
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useProductStore } from '../stores/product'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'

const productStore = useProductStore()
const userStore = useUserStore()
const cartStore = useCartStore()

const featuredProducts = computed(() => {
  return productStore.products.filter(p => p.published).slice(0, 6)
})

function handleAddToCart(product) {
  cartStore.addToCart(product, 1)
  ElMessage.success(`已加入购物车：${product.name}`)
}
</script>

<style scoped>
.home-container {
  width: 100%;
}

/* 1. Hero */
.hero-section {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  background: url('/images/prod_20_1.jpg') center/cover no-repeat;
  padding: 80px 24px;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.30) 50%, rgba(255, 255, 255, 0.02) 100%);
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
  color: var(--primary-color);
  letter-spacing: 2px;
  margin-bottom: 12px;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

.hero-title {
  font-size: 40px;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.25;
  margin-bottom: 18px;
  letter-spacing: -0.5px;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.85);
}

.hero-subtitle {
  font-size: 17px;
  color: var(--text-color);
  line-height: 1.6;
  margin-bottom: 32px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.85);
}

.hero-cta-group {
  display: flex;
  gap: 16px;
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
  border-radius: 14px;
  padding: 28px 24px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.3s ease;
}

.biz-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-border);
}

.biz-icon {
  font-size: 34px;
  background: var(--bg-light);
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
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
  letter-spacing: 1.5px;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.section-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
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
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.product-card:hover {
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
  transition: transform 0.4s ease;
}

.product-card:hover .product-thumb img {
  transform: scale(1.04);
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
  color: #B25E29;
}

.price-main .amount {
  font-size: 22px;
  font-weight: 700;
  color: #B25E29;
}

.dealer-label {
  background: #B25E29;
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 4px;
}

.retail-ref {
  font-size: 11px;
  color: var(--text-light);
  text-decoration: line-through;
}

.add-cart-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-cart-btn:hover {
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
  border-radius: 20px;
  padding: 48px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
}

.dealer-banner-text {
  max-width: 680px;
}

.dealer-tag {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #8E7E67;
  display: inline-block;
  margin-bottom: 8px;
}

.dealer-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 12px;
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
  padding: 14px 28px;
  font-size: 16px;
  border-radius: 10px;
}

.dealer-contact-tip {
  font-size: 12px;
  color: var(--text-light);
}

.dealer-contact-tip a {
  color: var(--primary-color);
  font-weight: 600;
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

@media (max-width: 960px) {
  .hero-title {
    font-size: 28px;
  }
  .biz-grid {
    grid-template-columns: 1fr;
  }
  .products-grid {
    grid-template-columns: 1fr;
  }
  .dealer-banner-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .values-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

