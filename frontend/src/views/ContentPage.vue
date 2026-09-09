<template>
  <div class="content-page-root">
    <AsyncState
      :loading="loading"
      loading-text="正在加载栏目内容…"
      :error="error"
      :not-found="notFound"
      :empty="!loading && !error && !notFound && sections.length === 0"
      empty-text="该栏目暂无内容"
      @retry="fetchPage"
    >
      <!-- Dynamic Sections from Original Website Structure -->
      <div v-if="sections && sections.length > 0" class="sections-stream">
        <!-- Optional Document Header for pages without Cover, e.g. 电子说明书 -->
        <section v-if="pageKey === 'electronic'" class="doc-page-header">
          <div class="section-container" style="max-width: 960px; text-align: center;">
            <div class="doc-badge">
              <span class="badge-sparkle">✦</span>
              <span>WEMOVE MANUAL</span>
              <span class="badge-sparkle">✦</span>
            </div>
            <h1 class="doc-title">{{ pageData?.title || '产品电子说明书' }}</h1>
            <p class="doc-subtitle">官方实木积木轨道结构图解与拼装指南 · 支持文末直接下载完整 PDF 手册</p>
          </div>
        </section>

        <template v-for="(sec, idx) in sections" :key="idx">
        <!-- 1. COVER / BANNER -->
        <section
          v-if="sec.type === 'Cover'"
          class="sec-cover"
          :style="{
            backgroundImage: `url(${sec.config.imageUrl})`,
            minHeight: (sec.config.height || 460) + 'px'
          }"
        >
          <div class="cover-overlay"></div>
          <div class="cover-content">
            <h1 class="cover-title">{{ sec.config.title }}</h1>
            <p v-if="sec.config.subtitle" class="cover-subtitle">{{ sec.config.subtitle }}</p>
          </div>
        </section>

        <!-- 2. TEXT + IMAGE (左右混排) -->
        <section
          v-else-if="sec.type === 'TextImage'"
          class="sec-text-image"
          :style="{ backgroundColor: sec.config.bgColor || 'transparent' }"
        >
          <div class="section-container">
            <div
              class="text-image-grid"
              :class="{ 'image-left': sec.config.imageLeft }"
            >
              <div class="ti-media">
                <img :src="sec.config.imageUrl" :alt="sec.config.title" />
              </div>
              <div class="ti-text">
                <h2 v-if="sec.config.title" class="ti-title">{{ sec.config.title }}</h2>
                <div
                  v-if="sec.config.text"
                  class="ti-body formatted-text"
                >{{ formatSafeText(sec.config.text) }}</div>
                <div v-if="sec.config.btnText" class="ti-btn-wrap">
                  <el-button type="primary" size="large" @click="handleAction(sec.config.btnLink)">
                    {{ sec.config.btnText }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. IMAGE GRID (多图精美画廊 / 电子说明书页面) -->
        <section
          v-else-if="sec.type === 'ImageGrid'"
          class="sec-image-grid"
          :class="{ 'is-single-col': (sec.config?.columns || 3) === 1 }"
        >
          <div class="section-container">
            <div
              class="img-grid-wrap"
              :class="`cols-${sec.config?.columns || 3}`"
              :style="{
                gridTemplateColumns: `repeat(${sec.config?.columns || 3}, 1fr)`,
                gap: (sec.config?.gap || 16) + 'px'
              }"
            >
              <div
                v-for="(imgItem, imgIdx) in sec.config.images"
                :key="imgIdx"
                class="img-card"
                :style="{ borderRadius: (sec.config?.borderRadius || 10) + 'px' }"
              >
                <img
                  :src="getImageUrl(imgItem)"
                  :alt="sec.title || '说明书与画廊实拍'"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- 4. HEADING (标题) -->
        <section v-else-if="sec.type === 'Heading'" class="sec-heading">
          <div class="section-container">
            <h2
              class="heading-title"
              :style="{
                textAlign: sec.config.align || 'center',
                color: sec.config.color || 'var(--text-color)',
                fontSize: sec.config.fontSize || '28px'
              }"
            >
              {{ sec.config.text }}
            </h2>
          </div>
        </section>

        <!-- 5. PARAGRAPH (文字段落卡片) -->
        <section
          v-else-if="sec.type === 'Paragraph'"
          class="sec-paragraph"
          :style="{ backgroundColor: sec.config.bgColor || 'transparent' }"
        >
          <div class="section-container">
            <div
              class="paragraph-box"
              :style="{
                textAlign: sec.config.align || 'center',
                color: sec.config.color || 'var(--text-color)',
                fontSize: sec.config.fontSize || '15px'
              }"
            >
              <template v-if="sec.config.segments && sec.config.segments.length > 0">
                <div
                  v-for="(seg, sIdx) in sec.config.segments"
                  :key="sIdx"
                  class="seg-line formatted-text"
                  :class="{ 'seg-bold': seg.bold }"
                >
                  {{ formatSafeText(seg.text) }}
                </div>
              </template>
              <template v-else>
                <div class="plain-text formatted-text">{{ formatSafeText(sec.config.text) }}</div>
              </template>
            </div>
          </div>
        </section>

        <!-- 6. FILE DOWNLOAD (电子手册/文件下载) -->
        <section v-else-if="sec.type === 'FileDownload'" class="sec-download">
          <div class="section-container" style="text-align: center;">
            <el-button
              type="primary"
              size="large"
              class="download-btn"
              @click="handleDownload(sec.config)"
            >
              <el-icon><Download /></el-icon>
              <span>{{ sec.config?.btnText || '下载电子说明书 PDF' }}</span>
            </el-button>
          </div>
        </section>
      </template>
    </div>

    <!-- Special Furniture Appointment Callout (if on /furniture) -->
    <div v-if="route.path === '/furniture'" class="furniture-cta-section">
      <div class="section-container">
        <div class="furniture-cta-card">
          <div class="cta-info">
            <h2>预约专属全屋实木定制方案</h2>
            <p>全国主要城市提供专业设计师上门量尺、实木榫卯打样与3D全景方案呈现。</p>
          </div>
          <el-button type="primary" size="large" @click="appointmentDialog = true">
            立即预约设计师
          </el-button>
        </div>
      </div>
    </div>
    </AsyncState>

    <!-- User Explicitly Requested: "最底下的相关实木产品与套件支持可以保留" -->
    <section class="related-support-section">
      <div class="section-container">
        <div class="related-header">
          <div>
            <span class="sub-label">WEMOVE PRODUCTS & KITS</span>
            <h3 class="title">相关实木产品与套件支持</h3>
          </div>
          <router-link to="/workshop" class="link-more">
            浏览全部玩具与套件 &rarr;
          </router-link>
        </div>

        <div class="related-grid">
          <div
            v-for="p in relatedProducts"
            :key="p.id"
            class="rel-card"
            @click="$router.push(`/product/${p.id}`)"
          >
            <div class="rel-thumb">
              <img :src="p.images[0]" :alt="p.name" />
              <span v-if="p.tag" class="rel-tag">{{ p.tag }}</span>
            </div>
            <div class="rel-body">
              <div class="rel-sku">{{ p.sku }} · {{ p.ageRange }}</div>
              <h4 class="rel-title">{{ p.name }}</h4>
              <div class="rel-price-row">
                <span class="curr">¥</span>
                <span class="num">{{ productStore.getProductPrice(p) }}</span>
                <span v-if="userStore.isDealer" class="badge-dealer-mini">批</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Appointment Dialog for Furniture -->
    <el-dialog v-model="appointmentDialog" title="预约实木家具全屋定制" width="480px" append-to-body>
      <el-form label-position="top">
        <el-form-item label="您的姓名">
          <el-input v-model="appointment.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="appointment.phone" placeholder="接收方案通知" />
        </el-form-item>
        <el-form-item label="房屋城市与户型">
          <el-input v-model="appointment.city" placeholder="例如：上海市浦东新区 3室2厅" />
        </el-form-item>
        <el-form-item label="意向定制需求">
          <el-input
            v-model="appointment.demand"
            type="textarea"
            :rows="3"
            placeholder="例如：儿童房环保实木床、榫卯书柜、开放式积木玩具收纳柜"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appointmentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAppointment">提交预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AsyncState from '../components/AsyncState.vue'
import { contentApi } from '../services/content'
import { formatSafeText } from '../utils/text'
import { useProductStore } from '../stores/product'
import { useUserStore } from '../stores/user'
import defaultPageSections from '../data/pageSections.json'

const PAGE_TITLES = {
  furniture: '原木家具',
  woodlab: '中试打样',
  stem: 'STEM教育',
  library: '科研研发',
  charity: '公益项目',
  dream: '匠心筑梦',
  electronic: '电子制作'
}

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()

const pageKey = computed(() => route.path.replace('/', '') || 'furniture')

const loading = ref(false)
const error = ref(null)
const notFound = ref(false)
const pageData = ref(null)

const sections = computed(() => {
  return pageData.value?.sections || []
})

async function fetchPage() {
  loading.value = true
  error.value = null
  notFound.value = false
  try {
    const res = await contentApi.getPage(pageKey.value)
    pageData.value = res.data
  } catch (err) {
    if (defaultPageSections && defaultPageSections[pageKey.value]) {
      pageData.value = {
        slug: pageKey.value,
        title: PAGE_TITLES[pageKey.value] || '',
        sections: defaultPageSections[pageKey.value]
      }
      notFound.value = false
    } else if (err.status === 404 || err.code === 'NOT_FOUND_404') {
      notFound.value = true
    } else {
      error.value = err
    }
  } finally {
    loading.value = false
  }
}

watch(() => route.path, () => {
  fetchPage()
})

onMounted(() => {
  fetchPage()
})

const relatedProducts = computed(() => {
  return productStore.products.slice(0, 4)
})

const appointmentDialog = ref(false)
const appointment = ref({ name: '', phone: '', city: '', demand: '' })

function getImageUrl(item) {
  if (typeof item === 'string') return item
  return item?.url || ''
}

function handleAction(link) {
  if (!link) {
    router.push('/workshop')
  } else if (link.startsWith('http')) {
    window.open(link, '_blank')
  } else {
    router.push(link)
  }
}

function handleDownload(config) {
  const url = (config?.fileUrl || config?.url || '').trim()
  const filename = config?.fileName || 'WeMove实木产品电子手册.pdf'
  if (!url) {
    ElMessage.error('该文件暂不可用或下载链接不存在')
    return
  }
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    ElMessage.success(`已开始下载：${filename}`)
  } catch (err) {
    ElMessage.error('触发文件下载失败，请稍后重试')
  }
}

function submitAppointment() {
  if (!appointment.value.name || !appointment.value.phone) {
    ElMessage.warning('请填写姓名与联系电话')
    return
  }
  ElMessage.success('预约申请已提交，专属设计师将在1个工作日内与您联络！')
  appointmentDialog.value = false
  appointment.value = { name: '', phone: '', city: '', demand: '' }
}
</script>

<style scoped>
.content-page-root {
  width: 100%;
}

.section-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 1. COVER */
.sec-cover {
  position: relative;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}

.cover-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  color: #ffffff;
}

.cover-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 1px;
  color: #ffffff;
}

.cover-subtitle {
  font-size: 18px;
  opacity: 0.95;
  line-height: 1.6;
  font-weight: 300;
}

/* 2. TEXT + IMAGE (左右混排) */
.sec-text-image {
  padding: 60px 0;
}

.text-image-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
}

.text-image-grid.image-left {
  direction: rtl;
}

.text-image-grid.image-left > * {
  direction: ltr;
}

.ti-media {
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background: #f7f7f7;
}

.ti-media img {
  width: 100%;
  height: 100%;
  max-height: 440px;
  object-fit: cover;
  display: block;
}

.ti-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 18px;
  line-height: 1.35;
}

.ti-body {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.8;
}

.formatted-text {
  white-space: pre-line;
  word-break: break-word;
}

.ti-btn-wrap {
  margin-top: 24px;
}

/* 3. IMAGE GRID (画廊与说明书图解) */
.sec-image-grid {
  padding: 30px 0 40px;
}

.sec-image-grid.is-single-col {
  padding: 10px 0;
}

.img-grid-wrap {
  display: grid;
  width: 100%;
}

.img-grid-wrap.cols-1 {
  max-width: 960px;
  margin: 0 auto;
}

.img-card {
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  background: #ffffff;
  border-radius: 10px;
}

.sec-image-grid.is-single-col .img-card {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* 多列画廊网格图片：保持整齐卡片高度与微交互 */
.img-grid-wrap:not(.cols-1) .img-card img {
  width: 100%;
  height: 280px;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.img-grid-wrap:not(.cols-1) .img-card:hover img {
  transform: scale(1.03);
}

/* 单列模式（如电子说明书全幅图解）：100% 完整显示整张图，绝对不裁剪任何上下边缘！ */
.img-grid-wrap.cols-1 .img-card img,
.sec-image-grid.is-single-col .img-card img {
  width: 100%;
  height: auto !important;
  min-height: unset !important;
  max-height: none !important;
  object-fit: contain !important;
  display: block;
  transition: none !important;
}

.img-grid-wrap.cols-1 .img-card:hover img,
.sec-image-grid.is-single-col .img-card:hover img {
  transform: none !important;
}

/* 说明书文档顶部排版 */
.doc-page-header {
  padding: 42px 24px 24px;
  text-align: center;
}

.doc-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 16px;
  background: rgba(166, 124, 82, 0.08);
  border: 1px solid rgba(166, 124, 82, 0.2);
  border-radius: 9999px;
  font-size: 12px;
  letter-spacing: 1.5px;
  color: #a67c52;
  margin-bottom: 14px;
  font-weight: 600;
}

.doc-title {
  font-size: 34px;
  font-weight: 700;
  color: #2c2520;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
  font-family: var(--font-serif, "Noto Serif SC", serif);
}

.doc-subtitle {
  font-size: 15px;
  color: #796e65;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 4. HEADING */
.sec-heading {
  padding: 48px 0 20px;
}

.heading-title {
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* 5. PARAGRAPH */
.sec-paragraph {
  padding: 40px 0;
}

.paragraph-box {
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.9;
  padding: 24px 32px;
  border-radius: 12px;
}

.seg-line {
  margin-bottom: 8px;
}

.seg-bold {
  font-weight: 700;
  font-size: 17px;
  color: var(--text-color);
  margin-top: 14px;
  margin-bottom: 6px;
}

/* 6. DOWNLOAD */
.sec-download {
  padding: 30px 0 60px;
}

.download-btn {
  padding: 14px 32px;
  font-size: 16px;
  border-radius: 10px;
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

/* Furniture Callout */
.furniture-cta-section {
  padding: 30px 0 60px;
}

.furniture-cta-card {
  background: linear-gradient(135deg, #FAF8F5 0%, #F1ECE3 100%);
  border: 1px solid var(--primary-border);
  border-radius: 16px;
  padding: 36px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.cta-info h2 {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 6px;
}

.cta-info p {
  font-size: 14px;
  color: var(--text-muted);
}

/* User Explicit Requirement: Related Products & Kits Support */
.related-support-section {
  padding: 60px 0 80px;
  border-top: 1px solid var(--border-color);
  background: #ffffff;
}

.related-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
}

.sub-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--primary-color);
}

.related-header .title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
  margin-top: 4px;
}

.link-more {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 500;
}

.link-more:hover {
  color: var(--primary-color);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.rel-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
}

.rel-card:hover {
  border-color: var(--primary-border);
  transform: translateY(-3px);
  box-shadow: var(--shadow-sm);
}

.rel-thumb {
  position: relative;
  height: 180px;
  background: #f7f7f7;
}

.rel-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rel-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(61, 50, 38, 0.85);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
}

.rel-body {
  padding: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.rel-sku {
  font-size: 11px;
  color: var(--text-light);
  margin-bottom: 4px;
}

.rel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 10px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rel-price-row {
  display: flex;
  align-items: baseline;
  margin-top: auto;
}

.rel-price-row .curr {
  font-size: 12px;
  font-weight: 600;
  color: #B25E29;
}

.rel-price-row .num {
  font-size: 18px;
  font-weight: 700;
  color: #B25E29;
}

.badge-dealer-mini {
  font-size: 9px;
  background: #B25E29;
  color: #fff;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 4px;
}

@media (max-width: 960px) {
  .text-image-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .text-image-grid.image-left {
    direction: ltr;
  }
  .related-grid {
    grid-template-columns: 1fr 1fr;
  }
  .furniture-cta-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
