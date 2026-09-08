<template>
  <div class="pdp-container" v-if="product">
    <div class="breadcrumb-bar">
      <div class="inner">
        <router-link to="/">首页</router-link>
        <span>/</span>
        <router-link to="/products">玩具品类</router-link>
        <span>/</span>
        <span class="curr">{{ product.name }}</span>
      </div>
    </div>

    <div class="pdp-main">
      <div class="pdp-grid">
        <!-- Gallery -->
        <div class="gallery-col">
          <div class="main-image-wrap">
            <img v-if="currentImage" :src="currentImage" :alt="product.name" class="main-image" />
            <span v-else class="main-image-empty">产品图片待发布</span>
          </div>
          <div class="thumbs-row" v-if="product.images.length > 1">
            <button
              v-for="(img, idx) in product.images"
              :key="idx"
              type="button"
              class="thumb-item"
              :class="{ active: currentImage === img }"
              :aria-label="`查看 ${product.name} 的第 ${idx + 1} 张图片`"
              :aria-pressed="currentImage === img"
              @click="currentImage = img"
            >
              <img :src="img" :alt="`${product.name} - 图片 ${idx + 1}`" />
            </button>
          </div>
        </div>

        <!-- Product Information -->
        <div class="info-col">
          <div class="meta-tags">
            <span class="sku-tag">SKU: {{ product.sku }}</span>
            <span v-if="product.ageRange" class="age-tag">{{ product.ageRange }}</span>
            <span v-if="product.tag" class="status-tag">{{ product.tag }}</span>
          </div>

          <h1 class="pdp-title">{{ product.name }}</h1>
          <p class="pdp-summary">{{ product.summary }}</p>

          <!-- Pricing：价格口径唯一来自 API（DEALER/ADMIN 会话下返回 dealerPrice） -->
          <div class="pricing-card">
            <div class="pricing-row">
              <span class="price-type-label">
                {{ hasDealerPrice ? '经销商协议结算价' : '官方零售指导价' }}
              </span>
              <div class="price-val">
                <span class="curr">¥</span>
                <span class="num">{{ hasDealerPrice ? product.dealerPrice : product.price }}</span>
              </div>
            </div>

            <div v-if="hasDealerPrice" class="dealer-pricing-meta">
              <div class="dealer-pill">
                <el-icon><Check /></el-icon>
                <span>已按经销商协议价结算，批发采购请直接联系商务对接</span>
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
              <span class="param-val">{{ product.material || '待补充' }}</span>
            </div>
            <div class="param-row">
              <span class="param-label">适用场景：</span>
              <span class="param-val">{{ product.scene || '待补充' }}</span>
            </div>
            <div class="param-row">
              <span class="param-label">所属品类：</span>
              <span class="param-val">{{ product.categoryName || '-' }}</span>
            </div>
          </div>

          <!-- CTA（决策 D9：本轮不启用购物，展示询购与合作入口） -->
          <div class="action-block">
            <div class="cta-buttons">
              <button class="btn-primary buy-btn" @click="handleContact">
                <el-icon><ChatDotRound /></el-icon>
                <span>咨询与订购</span>
              </button>
              <button v-if="!hasDealerPrice" class="btn-outline add-btn" @click="handleDealerApply">
                <el-icon><OfficeBuilding /></el-icon>
                <span>经销合作</span>
              </button>
            </div>
            <p class="cta-note">提交产品咨询后，品牌团队将根据您提供的联系方式回复。</p>
          </div>
        </div>
      </div>

      <!-- Detail Tabs -->
      <div class="pdp-tabs-section">
        <el-tabs v-model="activeTab" class="custom-tabs">
          <el-tab-pane label="产品详细介绍与玩法" name="desc">
            <div class="tab-body">
              <h3>设计理念与玩法指南</h3>
              <p>{{ product.description || product.summary || '详细内容待运营人员发布。' }}</p>
              <div v-if="highlights.length" class="highlights-box">
                <h4>核心特点：</h4>
                <ul>
                  <li v-for="item in highlights" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div v-if="product.specs?.setup || product.specs?.howToPlay || product.specs?.care" class="instruction-grid">
                <section v-if="product.specs?.setup">
                  <h4>安装与准备</h4>
                  <p>{{ product.specs.setup }}</p>
                </section>
                <section v-if="product.specs?.howToPlay">
                  <h4>玩法说明</h4>
                  <p>{{ product.specs.howToPlay }}</p>
                </section>
                <section v-if="product.specs?.care">
                  <h4>保养方式</h4>
                  <p>{{ product.specs.care }}</p>
                </section>
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
                    <td class="td-val">{{ product.ageRange || '-' }}</td>
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
              <p v-if="product.specs?.safetyNotes">{{ product.specs.safetyNotes }}</p>
              <ul v-if="certifications.length" class="cert-list">
                <li v-for="item in certifications" :key="item">{{ item }}</li>
              </ul>
              <p v-if="!product.specs?.safetyNotes && !certifications.length" class="content-pending">
                安全提示与检测文件尚未发布，请在使用前联系品牌方索取该产品的正式资料。
              </p>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>

  <div v-else class="detail-state">
    <AsyncState
      :loading="loading"
      :error="loadError"
      :not-found="notFound"
      :show-retry="!notFound"
      @retry="loadProduct"
    >
      <span></span>
    </AsyncState>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productApi } from '../../services/product'
import AsyncState from '../../components/AsyncState.vue'

/**
 * 产品详情页（#87 MVP-03）：GET /products/:slug（旧 /product/:id 由后端兼容解析）。
 * 经销商价仅在 DEALER/ADMIN 会话下由 API 返回（服务端裁剪），页面按字段是否出现渲染。
 */
const route = useRoute()
const router = useRouter()

const product = ref(null)
const currentImage = ref('')
const activeTab = ref('desc')
const loading = ref(false)
const loadError = ref(null)
const notFound = ref(false)
let detailRequestSerial = 0

const hasDealerPrice = computed(
  () => product.value && product.value.dealerPrice != null && product.value.moq != null
)

/** JSON 字段兼容数组或换行文本，页面只展示后台真实维护的内容。 */
function normalizeContentList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  return []
}

const highlights = computed(() => normalizeContentList(product.value?.specs?.highlights))
const certifications = computed(() => normalizeContentList(product.value?.specs?.certifications))

async function loadProduct() {
  const requestSerial = ++detailRequestSerial
  loading.value = true
  loadError.value = null
  notFound.value = false
  product.value = null
  try {
    const key = String(route.params.slug ?? '')
    const envelope = await productApi.fetchProduct(key)
    const detail = envelope?.data
    if (!detail) {
      if (requestSerial === detailRequestSerial) notFound.value = true
    } else {
      if (requestSerial === detailRequestSerial) {
        product.value = detail
        currentImage.value = detail.images?.[0] || ''
      }
    }
  } catch (err) {
    if (requestSerial !== detailRequestSerial) return
    if (err?.status === 404) {
      notFound.value = true
    } else {
      loadError.value = err
    }
  } finally {
    if (requestSerial === detailRequestSerial) loading.value = false
  }
}

onMounted(loadProduct)
watch(() => route.params.slug, loadProduct)

function handleContact() {
  router.push('/support')
}

function handleDealerApply() {
  router.push('/dealers/apply')
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
  min-width: 0;
}

.main-image-wrap {
  width: 100%;
  height: 460px;
  background: #f7f7f7;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-image-empty {
  color: var(--text-light);
  font-size: 14px;
}

.thumbs-row {
  display: flex;
  gap: 12px;
}

.thumb-item {
  width: 72px;
  height: 72px;
  padding: 0;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  background: #f0f0f0;
  transition: all 0.2s;
}

.thumb-item img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.thumb-item:hover, .thumb-item.active {
  border-color: var(--primary-color);
}

.info-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.meta-tags {
  display: flex;
  flex-wrap: wrap;
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
  overflow-wrap: anywhere;
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
  gap: 12px;
}

.cta-buttons {
  display: flex;
  gap: 16px;
}

.cta-note {
  font-size: 12px;
  color: var(--text-light);
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

.instruction-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.instruction-grid section {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-light);
}

.content-pending {
  padding: 16px;
  border: 1px dashed var(--border-color);
  border-radius: 10px;
  background: var(--bg-light);
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

.detail-state {
  max-width: 1280px;
  margin: 0 auto;
  padding: 60px 24px;
}

@media (max-width: 960px) {
  .pdp-grid {
    grid-template-columns: 1fr;
    min-width: 0;
  }
  .instruction-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .breadcrumb-bar {
    padding: 12px 16px;
  }
  .breadcrumb-bar .inner {
    flex-wrap: nowrap;
  }
  .breadcrumb-bar a,
  .breadcrumb-bar .inner > span:not(.curr) {
    flex: 0 0 auto;
    white-space: nowrap;
  }
  .breadcrumb-bar .curr {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pdp-main {
    padding: 24px 16px 56px;
  }
  .main-image-wrap {
    height: min(82vw, 420px);
  }
  .thumbs-row {
    overflow-x: auto;
    padding-bottom: 4px;
  }
  .thumb-item {
    flex: 0 0 64px;
    width: 64px;
    height: 64px;
  }
  .pricing-row,
  .cta-buttons {
    align-items: stretch;
    flex-direction: column;
  }
  .price-val .num {
    font-size: 30px;
  }
  .specs-table,
  .specs-table tbody,
  .specs-table tr,
  .specs-table td {
    display: block;
    width: 100%;
  }
  .specs-table .td-key {
    border-bottom: 0;
  }
  .custom-tabs :deep(.el-tabs__nav-scroll) {
    overflow-x: auto;
    scrollbar-width: none;
  }
  .custom-tabs :deep(.el-tabs__nav-scroll::-webkit-scrollbar) {
    display: none;
  }
  .custom-tabs :deep(.el-tabs__nav) {
    width: max-content;
    transform: none !important;
  }
}
</style>
