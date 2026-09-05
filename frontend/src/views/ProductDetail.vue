<template>
  <div class="pdp-container" v-if="product">
    <div class="breadcrumb-bar">
      <div class="inner">
        <router-link to="/">首页</router-link>
        <span>/</span>
        <router-link to="/workshop">玩具品类</router-link>
        <span>/</span>
        <span class="curr">{{ product.name }}</span>
      </div>
    </div>

    <div class="pdp-main">
      <div class="pdp-grid">
        <!-- Gallery -->
        <div class="gallery-col">
          <div class="main-image-wrap">
            <img :src="currentImage" :alt="product.name" class="main-image" />
          </div>
          <div class="thumbs-row" v-if="product.images.length > 1">
            <img
              v-for="(img, idx) in product.images"
              :key="idx"
              :src="img"
              class="thumb-item"
              :class="{ active: currentImage === img }"
              @click="currentImage = img"
            />
          </div>
        </div>

        <!-- Product Purchase Information -->
        <div class="info-col">
          <div class="meta-tags">
            <span class="sku-tag">SKU: {{ product.sku }}</span>
            <span class="age-tag">{{ product.ageRange }}</span>
            <span v-if="product.tag" class="status-tag">{{ product.tag }}</span>
          </div>

          <h1 class="pdp-title">{{ product.name }}</h1>
          <p class="pdp-summary">{{ product.summary }}</p>

          <!-- Price Engine Box -->
          <div class="pricing-card">
            <div class="pricing-row">
              <span class="price-type-label">
                {{ userStore.isDealer ? '经销商协议结算价' : '官方零售指导价' }}
              </span>
              <div class="price-val">
                <span class="curr">¥</span>
                <span class="num">{{ currentPrice }}</span>
              </div>
            </div>

            <div v-if="userStore.isDealer" class="dealer-pricing-meta">
              <div class="dealer-pill">
                <el-icon><Check /></el-icon>
                <span>已应用【{{ userStore.userInfo.tierName }}】专属折扣 ({{ userStore.userInfo.discountRate * 10 }}折)</span>
              </div>
              <div class="orig-ref">官方指导价：¥{{ product.price }}</div>
              <div class="moq-tip">建议起订量 (MOQ)：{{ product.moq || 10 }} 件</div>
            </div>
            <div v-else class="retail-dealer-lead">
              <span>批量采购 / 经销合作？</span>
              <router-link to="/dealers/apply">申请办理经销商享特惠批发价 &rarr;</router-link>
            </div>
          </div>

          <!-- Quick Parameters Table -->
          <div class="quick-params">
            <div class="param-row">
              <span class="param-label">主要材质：</span>
              <span class="param-val">{{ product.material }}</span>
            </div>
            <div class="param-row">
              <span class="param-label">适用场景：</span>
              <span class="param-val">{{ product.scene }}</span>
            </div>
            <div class="param-row">
              <span class="param-label">外箱包装：</span>
              <span class="param-val">{{ product.specs?.dimensions || '精美原木彩盒包装' }}</span>
            </div>
          </div>

          <!-- Quantity and Action Buttons -->
          <div class="action-block">
            <div class="qty-row">
              <span class="qty-label">选购数量：</span>
              <el-input-number
                v-model="quantity"
                :min="userStore.isDealer ? (product.moq || 5) : 1"
                :max="999"
                size="large"
              />
              <span v-if="userStore.isDealer" class="moq-hint">（已预设起订量）</span>
            </div>

            <div class="cta-buttons">
              <button class="btn-primary buy-btn" @click="handleBuyNow">
                <el-icon><ShoppingBag /></el-icon>
                <span>立即选购下单</span>
              </button>
              <button class="btn-outline add-btn" @click="handleAddToCart">
                <el-icon><ShoppingCart /></el-icon>
                <span>加入购物车</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Detail Tabs (Specifications, Instructions, Certifications) -->
      <div class="pdp-tabs-section">
        <el-tabs v-model="activeTab" class="custom-tabs">
          <el-tab-pane label="产品详细介绍与玩法" name="desc">
            <div class="tab-body">
              <h3>设计理念与玩法指南</h3>
              <p>{{ product.description }}</p>
              <div class="highlights-box">
                <h4>核心特点：</h4>
                <ul>
                  <li>选用天然无异味原木材料，手感扎实细腻。</li>
                  <li>边缘经多道手工倒圆打磨，无尖锐棱角，守护儿童玩耍安全。</li>
                  <li>支持开放式建构与探索，兼容多种木制积木与扩展模块。</li>
                </ul>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="规格与装箱参数" name="specs">
            <div class="tab-body">
              <table class="specs-table">
                <tbody>
                  <tr>
                    <td class="td-key">SKU 编号</td>
                    <td class="td-val">{{ product.sku }}</td>
                    <td class="td-key">建议年龄</td>
                    <td class="td-val">{{ product.ageRange }}</td>
                  </tr>
                  <tr>
                    <td class="td-key">产品尺寸</td>
                    <td class="td-val">{{ product.specs?.dimensions || '-' }}</td>
                    <td class="td-key">产品净重</td>
                    <td class="td-val">{{ product.specs?.netWeight || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="td-key">装箱规格</td>
                    <td class="td-val">{{ product.specs?.casePack ? `${product.specs.casePack} 件/箱` : '-' }}</td>
                    <td class="td-key">包装尺寸</td>
                    <td class="td-val">{{ product.specs?.packageDimensions || '-' }}</td>
                  </tr>
                  <tr>
                    <td class="td-key">包装内含</td>
                    <td class="td-val" colspan="3">{{ product.specs?.includedItems || '完整产品组件, 规则说明' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </el-tab-pane>

          <el-tab-pane label="安全与检测认证" name="cert">
            <div class="tab-body">
              <p>WeMove 惟木匠心全系列产品均符合严格的国家玩具安全标准 (GB 6675) 及欧盟 EN71 玩具安全指令检测：</p>
              <ul class="cert-list">
                <li>✓ 物理机械性能安全合格（无窒息小零件危险、无危险锐利边缘）</li>
                <li>✓ 重金属溶出量低于欧盟指令限制阈值</li>
                <li>✓ 环保无毒水性涂层，无刺激性气味</li>
              </ul>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
  <div v-else class="not-found">
    <h2>未找到相关商品</h2>
    <router-link to="/workshop">返回玩具列表</router-link>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProductStore } from '../stores/product'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()
const cartStore = useCartStore()

const product = ref(null)
const currentImage = ref('')
const quantity = ref(1)
const activeTab = ref('desc')

function loadProduct() {
  const id = Number(route.params.id)
  const found = productStore.products.find(p => p.id === id)
  if (found) {
    product.value = found
    currentImage.value = found.images[0]
    quantity.value = userStore.isDealer ? (found.moq || 5) : 1
  }
}

onMounted(loadProduct)
watch(() => route.params.id, loadProduct)

const currentPrice = computed(() => {
  if (!product.value) return 0
  return productStore.getProductPrice(product.value)
})

function handleAddToCart() {
  if (!product.value) return
  cartStore.addToCart(product.value, quantity.value)
  ElMessage.success(`已成功添加 ${quantity.value} 件至购物车！`)
}

function handleBuyNow() {
  handleAddToCart()
  router.push('/cart')
}
</script>

<style scoped>
.breadcrumb-bar {
  background: var(--bg-light);
  border-bottom: 1px solid var(--border-color);
  padding: 14px 24px;
  font-size: 13px;
}

.breadcrumb-bar .inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--text-light);
}

.breadcrumb-bar a {
  color: var(--text-muted);
}

.breadcrumb-bar a:hover {
  color: var(--primary-color);
}

.breadcrumb-bar .curr {
  color: var(--text-color);
  font-weight: 500;
}

.pdp-main {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.pdp-grid {
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 48px;
  margin-bottom: 60px;
}

.gallery-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image-wrap {
  width: 100%;
  height: 460px;
  background: #f7f7f7;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbs-row {
  display: flex;
  gap: 12px;
}

.thumb-item {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  background: #f0f0f0;
  transition: all 0.2s;
}

.thumb-item:hover, .thumb-item.active {
  border-color: var(--primary-color);
}

.info-col {
  display: flex;
  flex-direction: column;
}

.meta-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.sku-tag {
  background: var(--bg-light);
  color: var(--text-muted);
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.age-tag {
  background: #EFF6FF;
  color: #1D4ED8;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
}

.status-tag {
  background: #FEF3C7;
  color: #92400E;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
}

.pdp-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
  margin-bottom: 12px;
}

.pdp-summary {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 24px;
}

.pricing-card {
  background: var(--bg-light);
  border: 1px solid var(--primary-border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 28px;
}

.pricing-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.price-type-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
}

.price-val {
  display: flex;
  align-items: baseline;
}

.price-val .curr {
  font-size: 18px;
  font-weight: 600;
  color: #B25E29;
}

.price-val .num {
  font-size: 34px;
  font-weight: 700;
  color: #B25E29;
}

.dealer-pricing-meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
  font-size: 13px;
}

.dealer-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #8E7E67;
  font-weight: 600;
  margin-bottom: 4px;
}

.orig-ref {
  color: var(--text-light);
  text-decoration: line-through;
}

.moq-tip {
  color: var(--text-color);
  font-weight: 600;
  margin-top: 4px;
}

.retail-dealer-lead {
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-muted);
}

.retail-dealer-lead a {
  color: var(--primary-color);
  font-weight: 600;
  margin-left: 6px;
}

.quick-params {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.param-row {
  display: flex;
}

.param-label {
  width: 90px;
  color: var(--text-light);
}

.param-val {
  color: var(--text-color);
  font-weight: 500;
}

.action-block {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qty-label {
  font-size: 14px;
  color: var(--text-muted);
}

.moq-hint {
  font-size: 12px;
  color: #8E7E67;
}

.cta-buttons {
  display: flex;
  gap: 16px;
}

.buy-btn, .add-btn {
  flex: 1;
  padding: 14px 20px;
  font-size: 16px;
  border-radius: 10px;
}

.pdp-tabs-section {
  border-top: 1px solid var(--border-color);
  padding-top: 30px;
}

.tab-body {
  padding: 24px 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-muted);
}

.tab-body h3, .tab-body h4 {
  color: var(--text-color);
  margin-bottom: 12px;
}

.highlights-box {
  margin-top: 20px;
  background: var(--bg-light);
  padding: 20px;
  border-radius: 10px;
}

.highlights-box ul, .cert-list {
  padding-left: 20px;
  margin-top: 8px;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table td {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  font-size: 14px;
}

.td-key {
  background: var(--bg-light);
  width: 140px;
  color: var(--text-muted);
  font-weight: 500;
}

.td-val {
  color: var(--text-color);
}

.not-found {
  padding: 80px 24px;
  text-align: center;
}

@media (max-width: 960px) {
  .pdp-grid {
    grid-template-columns: 1fr;
  }
}
</style>

