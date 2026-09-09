<template>
  <div class="home-container">
    <!-- 1. 核心 Hero 舞台：品牌主张 / 轮播切换 / 底层环境弥散光晕视差 -->
    <section class="hero-section" ref="heroSectionRef">
          <!-- 底层高清实木大图视差背景 (清晰无重度模糊，随鼠标大范围平滑移动) -->
          <div class="hero-ambient-glow">
            <div class="ambient-img-wrapper" ref="ambientGlowRef">
              <transition name="ambient-fade">
                <img
                  :key="currentHeroImage"
                  :src="currentHeroImage"
                  class="ambient-img"
                  alt=""
                  aria-hidden="true"
                />
              </transition>
            </div>
          </div>

          <!-- 视差背景网格层 -->
          <div class="hero-bg-wrapper">
            <div class="hero-bg-mesh"></div>
          </div>

          <div class="hero-stage-container">
            <!-- 左侧：品牌叙事与 Banner 导流 -->
            <div class="hero-left-content" ref="heroLeftContentRef">
              <div class="hero-tag-badge" ref="heroTagBadgeRef">
                <span class="tag-sparkle">✦</span>
                <span>{{ currentBanner?.title ? 'FEATURED ARTISAN PIECE' : 'WEMOVE SPORTS & CRAFT' }}</span>
              </div>

              <h1 class="hero-title" ref="heroTitleRef">
                {{ currentBanner?.title ? currentBanner.title : '惟木匠心 · 传承自然与造物之美' }}
              </h1>

              <p class="hero-subtitle" ref="heroSubtitleRef">
                专为家庭与教育机构打造的天然实木运动益智游戏、榫卯积木与全屋实木定制。融汇物理力学探索与手工温润触感，让每一件天然木作陪伴成长。
              </p>

              <div class="hero-cta-group" ref="heroCtaGroupRef">
                <router-link :to="currentBanner?.linkUrl || '/products'" class="btn-primary hero-btn">
                  <span>探索玩具系列</span>
                  <el-icon><Right /></el-icon>
                </router-link>
                <router-link to="/dealers/apply" class="btn-outline hero-btn">
                  <span>经销商与商务合作</span>
                  <el-icon><Tickets /></el-icon>
                </router-link>
              </div>

              <!-- 轮播控制器：精选产品切换药丸 -->
              <div v-if="effectiveBanners.length > 1" class="hero-banner-controls" ref="heroBannerControlsRef">
                <button
                  v-for="(b, idx) in effectiveBanners"
                  :key="b.id"
                  type="button"
                  class="banner-pill"
                  :class="{ 'is-active': activeBannerIndex === idx }"
                  @click="selectBanner(idx)"
                >
                  <span class="pill-num">0{{ idx + 1 }}</span>
                  <span class="pill-title">{{ b.title }}</span>
                </button>
              </div>
            </div>

        <!-- 右侧：扎实克制的实木展品画板 -->
        <div class="hero-right-stage" ref="heroStageRef">
          <!-- 核心展品画板 (稳重微浮动，取消夸张 3D Tilt) -->
          <div
            class="hero-art-card"
            ref="heroCardRef"
            @click="navigateToHeroTarget"
            title="点击查看详情"
          >
            <div class="art-card-inner">
              <img
                :src="currentHeroImage"
                :alt="currentBanner?.title || 'WEMOVE 实木玩具'"
                class="art-card-img"
              />
              <div class="art-card-shine"></div>
            </div>

            <!-- 浮动微标 1 (限制在 ±8px 以内微浮动) -->
            <div class="floating-badge badge-top" ref="badgeTopRef">
              <span class="badge-icon">★</span>
              <span class="badge-text">2026 匠心力作</span>
            </div>

            <!-- 浮动微标 2 (限制在 ±8px 以内微浮动) -->
            <div class="floating-badge badge-bottom" ref="badgeBottomRef">
              <span class="badge-icon">📐</span>
              <span class="badge-text">精工榫卯 · 0甲醛环保</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <el-alert
      v-if="siteStore.error"
      class="site-data-error"
      type="warning"
      :closable="false"
      show-icon
      title="站点配置或首页横幅暂时无法加载，当前显示基础品牌内容"
    />

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
          <router-link to="/news" class="view-all-link">
            查看全部动态 &rarr;
          </router-link>
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
            <div
              v-for="a in newsList"
              :key="a.id"
              class="news-card"
              @click="$router.push(`/news/${a.slug || a.id}`)"
            >
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
        </AsyncState>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import SplitType from 'split-type'
import AsyncState from '../components/AsyncState.vue'
import { homeApi } from '../services/home'
import { useSiteStore } from '../stores/site'

/**
 * 官网门户首页：品牌主张 / 展品轮播与微视差 / 业务分类 / 精选产品 / 经销商入口 / 品牌价值 / 最新动态。
 */
const router = useRouter()
const siteStore = useSiteStore()

const featuredLoading = ref(false)
const featuredError = ref(null)
const featuredProducts = ref([])

const newsLoading = ref(false)
const newsError = ref(null)
const newsList = ref([])

// Hero 舞台 DOM 引用
const heroSectionRef = ref(null)
const heroStageRef = ref(null)
const heroCardRef = ref(null)
const ambientGlowRef = ref(null)
const badgeTopRef = ref(null)
const badgeBottomRef = ref(null)

// 左侧品牌叙事 DOM 引用
const heroLeftContentRef = ref(null)
const heroTagBadgeRef = ref(null)
const heroTitleRef = ref(null)
const heroSubtitleRef = ref(null)
const heroCtaGroupRef = ref(null)
const heroBannerControlsRef = ref(null)

let splitTitleInstance = null
let splitSubInstance = null
let textEntranceTl = null

// 默认双展品（儿童实木保龄球套装 / 极简弧形摇摆平衡板），护航首屏即刻展示与自动轮播
const defaultBanners = [
  {
    id: 1,
    title: '儿童实木保龄球套装',
    imageUrl: '/images/prod_20_1.jpg',
    linkUrl: '/products'
  },
  {
    id: 2,
    title: '极简弧形摇摆平衡板',
    imageUrl: '/images/prod_19_1.jpg',
    linkUrl: '/products'
  }
]

// Banner 与展品轮播控制
const activeBannerIndex = ref(0)
let bannerTimer = null

const effectiveBanners = computed(() => {
  if (siteStore.banners && siteStore.banners.length > 1) {
    return siteStore.banners
  }
  return defaultBanners
})

const currentBanner = computed(() => {
  if (effectiveBanners.value && effectiveBanners.value.length > 0) {
    return effectiveBanners.value[activeBannerIndex.value % effectiveBanners.value.length]
  }
  return defaultBanners[0]
})

const currentHeroImage = computed(() => {
  return currentBanner.value?.imageUrl || '/images/prod_20_1.jpg'
})

function startBannerAutoPlay() {
  if (bannerTimer) clearInterval(bannerTimer)
  if (effectiveBanners.value && effectiveBanners.value.length > 1) {
    bannerTimer = setInterval(() => {
      activeBannerIndex.value = (activeBannerIndex.value + 1) % effectiveBanners.value.length
      nextTick(() => {
        playLeftContentEntrance()
      })
    }, 6000)
  }
}

function selectBanner(idx) {
  activeBannerIndex.value = idx
  startBannerAutoPlay()
  nextTick(() => {
    playLeftContentEntrance()
  })
}

function navigateToHeroTarget() {
  const url = currentBanner.value?.linkUrl || '/products'
  if (url.startsWith('/')) {
    router.push(url)
  } else {
    window.location.href = url
  }
}

let cleanupPointerListener = null

/**
 * 双重指针驱动交互（纯原生高性能 DOM 驱动）：
 * 1. 底层大图视差：随全屏鼠标平滑位移（折半克制幅度：X: ±65px, Y: ±38px）。
 * 2. 商品高清图模块 3D 倾斜：实时计算相对坐标与 rotateX/rotateY（折半幅度：maxTilt = 6deg）。
 */
function initPointerMovement() {
  const maxTilt = 6

  // 1. 全局鼠标移动：驱动底层大图与浮动徽标
  const handleGlobalMouseMove = (e) => {
    const glow = ambientGlowRef.value
    if (glow) {
      const normX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)
      const normY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)
      glow.style.transform = `translate3d(${(normX * 65).toFixed(1)}px, ${(normY * 38).toFixed(1)}px, 0)`
    }

    const bTop = badgeTopRef.value
    const bBottom = badgeBottomRef.value
    if (bTop || bBottom) {
      const normX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)
      const normY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)
      if (bTop) {
        bTop.style.transform = `translateZ(28px) translate3d(${(normX * 8).toFixed(1)}px, ${(normY * 6).toFixed(1)}px, 0)`
      }
      if (bBottom) {
        bBottom.style.transform = `translateZ(28px) translate3d(${(normX * 6).toFixed(1)}px, ${(normY * 4).toFixed(1)}px, 0)`
      }
    }
  }

  const handleGlobalMouseLeave = () => {
    const glow = ambientGlowRef.value
    if (glow) {
      glow.style.transform = 'translate3d(0px, 0px, 0px)'
    }
    const bTop = badgeTopRef.value
    const bBottom = badgeBottomRef.value
    if (bTop) bTop.style.transform = 'translateZ(28px) translate3d(0, 0, 0)'
    if (bBottom) bBottom.style.transform = 'translateZ(28px) translate3d(0, 0, 0)'
  }

  // 2. 商品高清图模块 3D 倾斜（参考图二规范实现）：
  const handleCardMouseMove = (e) => {
    const card = heroCardRef.value
    if (!card) return
    const rect = card.getBoundingClientRect()
    const xPos = (e.clientX - rect.left) / rect.width
    const yPos = (e.clientY - rect.top) / rect.height

    const tiltX = ((yPos - 0.5) * -maxTilt).toFixed(2)
    const tiltY = ((xPos - 0.5) * -maxTilt).toFixed(2)

    card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
  }

  const handleCardMouseLeave = () => {
    const card = heroCardRef.value
    if (!card) return
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
  }

  window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true })
  document.addEventListener('mouseleave', handleGlobalMouseLeave)

  const card = heroCardRef.value
  if (card) {
    card.addEventListener('mousemove', handleCardMouseMove, { passive: true })
    card.addEventListener('mouseleave', handleCardMouseLeave)
  }

  cleanupPointerListener = () => {
    window.removeEventListener('mousemove', handleGlobalMouseMove)
    document.removeEventListener('mouseleave', handleGlobalMouseLeave)
    if (card) {
      card.removeEventListener('mousemove', handleCardMouseMove)
      card.removeEventListener('mouseleave', handleCardMouseLeave)
    }
  }
}

/**
 * 左侧叙事文本延迟半秒逐字错峰入场（OpenAI 风格流光错峰）
 * 包含：✦ FEATURED ARTISAN PIECE、主标题、副标描述、CTA 按钮、01/02 药丸指示器
 */
function playLeftContentEntrance() {
  if (textEntranceTl) {
    textEntranceTl.kill()
    textEntranceTl = null
  }

  // 针对当前 DOM 重新拆分字符
  try {
    if (splitTitleInstance) splitTitleInstance.revert()
    if (heroTitleRef.value) {
      splitTitleInstance = new SplitType(heroTitleRef.value, { types: 'chars' })
    }
  } catch (e) {
    console.warn('SplitType title warning:', e)
  }

  try {
    if (splitSubInstance) splitSubInstance.revert()
    if (heroSubtitleRef.value) {
      splitSubInstance = new SplitType(heroSubtitleRef.value, { types: 'chars' })
    }
  } catch (e) {
    console.warn('SplitType subtitle warning:', e)
  }

  // 延迟半秒后逐字错峰入场 (delay: 0.5s)
  textEntranceTl = gsap.timeline({ delay: 0.5 })

  // 1. 顶部小标：✦ FEATURED ARTISAN PIECE
  if (heroTagBadgeRef.value) {
    textEntranceTl.fromTo(
      heroTagBadgeRef.value,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    )
  }

  // 2. 主标题逐字错峰榫卯咬合入场：儿童实木保龄球套装 / 惟木匠心
  if (splitTitleInstance && splitTitleInstance.chars && splitTitleInstance.chars.length > 0) {
    textEntranceTl.fromTo(
      splitTitleInstance.chars,
      {
        opacity: 0,
        y: 35,
        rotateX: -25,
        transformOrigin: '0% 50% -40px'
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.65,
        stagger: 0.038,
        ease: 'power3.out'
      },
      '-=0.25'
    )
  } else if (heroTitleRef.value) {
    textEntranceTl.fromTo(
      heroTitleRef.value,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.25'
    )
  }

  // 3. 副标逐字错峰流水入场：专为家庭与教育机构打造的天然实木运动益智游戏...
  if (splitSubInstance && splitSubInstance.chars && splitSubInstance.chars.length > 0) {
    textEntranceTl.fromTo(
      splitSubInstance.chars,
      {
        opacity: 0,
        y: 16
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.012,
        ease: 'power2.out'
      },
      '-=0.35'
    )
  } else if (heroSubtitleRef.value) {
    textEntranceTl.fromTo(
      heroSubtitleRef.value,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' },
      '-=0.35'
    )
  }

  // 4. CTA 按钮组入场：[探索玩具系列] [经销商与商务合作]
  const ctaButtons = heroCtaGroupRef.value ? heroCtaGroupRef.value.querySelectorAll('.hero-btn') : []
  if (ctaButtons.length > 0) {
    textEntranceTl.fromTo(
      ctaButtons,
      { opacity: 0, y: 24, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.12, ease: 'back.out(1.4)' },
      '-=0.25'
    )
  }

  // 5. 轮播指示药丸入场：01儿童实木保龄球套装 02极简弧形摇摆平衡板
  const pills = heroBannerControlsRef.value ? heroBannerControlsRef.value.querySelectorAll('.banner-pill') : []
  if (pills.length > 0) {
    textEntranceTl.fromTo(
      pills,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' },
      '-=0.2'
    )
  }
}

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

// 向上滚动返回品牌封面控制
let isNavigatingToCover = false
let topWheelAccumulator = 0
let wheelResetTimer = null

function handleWheelToCover(e) {
  // 仅在页面最顶部（window.scrollY <= 2）时，继续向上滚动滚轮触发平滑返回品牌封面
  if (window.scrollY <= 2 && e.deltaY < -20) {
    topWheelAccumulator += Math.abs(e.deltaY)
    if (wheelResetTimer) clearTimeout(wheelResetTimer)
    wheelResetTimer = setTimeout(() => {
      topWheelAccumulator = 0
    }, 300)

    if (topWheelAccumulator > 30) {
      if (isNavigatingToCover) return
      isNavigatingToCover = true

      // 优雅下拉幕布动效，平滑过渡至封面
      if (heroSectionRef.value) {
        gsap.to(heroSectionRef.value, {
          y: 60,
          opacity: 0.85,
          duration: 0.35,
          ease: 'power2.out',
          onComplete: () => {
            router.push('/cover')
          }
        })
      } else {
        router.push('/cover')
      }
    }
  } else {
    topWheelAccumulator = 0
  }
}

let touchStartY = 0
function handleTouchStartToCover(e) {
  if (e.touches && e.touches.length > 0) {
    touchStartY = e.touches[0].clientY
  }
}

function handleTouchEndToCover(e) {
  if (window.scrollY <= 2 && e.changedTouches && e.changedTouches.length > 0) {
    const diffY = e.changedTouches[0].clientY - touchStartY
    if (diffY > 60) {
      if (isNavigatingToCover) return
      isNavigatingToCover = true
      router.push('/cover')
    }
  }
}

onMounted(() => {
  // 首屏立即启动默认双展品轮播与顶部上滑手势
  startBannerAutoPlay()
  window.addEventListener('wheel', handleWheelToCover, { passive: true })
  window.addEventListener('touchstart', handleTouchStartToCover, { passive: true })
  window.addEventListener('touchend', handleTouchEndToCover, { passive: true })

  siteStore.loadPublic()
    .then(() => {
      startBannerAutoPlay()
      nextTick(() => {
        playLeftContentEntrance()
      })
    })
    .catch(() => undefined)

  loadFeatured()
  loadNews()

  nextTick(() => {
    initPointerMovement()
    playLeftContentEntrance()
  })
})

onUnmounted(() => {
  window.removeEventListener('wheel', handleWheelToCover)
  window.removeEventListener('touchstart', handleTouchStartToCover)
  window.removeEventListener('touchend', handleTouchEndToCover)
  if (wheelResetTimer) clearTimeout(wheelResetTimer)
  if (bannerTimer) clearInterval(bannerTimer)
  if (cleanupPointerListener) cleanupPointerListener()
  if (textEntranceTl) textEntranceTl.kill()
  if (splitTitleInstance) splitTitleInstance.revert()
  if (splitSubInstance) splitSubInstance.revert()
})
</script>

<style scoped>
.home-container {
  width: 100%;
}

/* 标题字符立体咬合与副标流水错峰入场 */
:deep(.hero-title .char) {
  display: inline-block;
  will-change: transform, opacity;
  transform-style: preserve-3d;
}

:deep(.hero-subtitle .char) {
  display: inline-block;
  will-change: transform, opacity;
}

.hero-tag-badge,
.hero-title,
.hero-subtitle,
.hero-cta-group,
.hero-banner-controls {
  opacity: 1; /* 基础可见，杜绝未触发空白 */
  will-change: transform, opacity;
}

/* 1. Hero 舞台 */
.hero-section {
  position: relative;
  min-height: 600px;
  display: flex;
  align-items: center;
  padding: 56px 24px 76px;
  overflow: hidden;
  background: var(--bg-body, #FAF7F2);
}

/* 底层环境高清大图视差背景 (Ambient Parallax) - 彻底去除模糊，高清质感呈现，大幅放大位移空间 */
.hero-ambient-glow {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 0.82;
  mask-image: linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 36%, rgba(0,0,0,0.92) 80%);
  -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 36%, rgba(0,0,0,0.92) 80%);
}

.ambient-img-wrapper {
  position: absolute;
  inset: -20%;
  width: 140%;
  height: 140%;
  will-change: transform;
  transform-origin: center center;
  transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1);
}

.ambient-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: blur(10px) saturate(130%) brightness(1.02); /* 比上次 18px 更低更清晰，兼具柔和自然光晕与器物辨识度 */
  transform: scale(1.15);
}

.ambient-fade-enter-active,
.ambient-fade-leave-active {
  transition: opacity 0.8s ease;
}

.ambient-fade-enter-from,
.ambient-fade-leave-to {
  opacity: 0;
}

.hero-bg-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.hero-bg-mesh {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(166, 124, 82, 0.1) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.45;
}

.hero-stage-container {
  position: relative;
  z-index: 2;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 50px;
  align-items: center;
}

.hero-left-content {
  max-width: 640px;
}

.hero-tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #A67C52;
  letter-spacing: 2px;
  margin-bottom: 22px;
  background: rgba(166, 124, 82, 0.08);
  border: 1px solid rgba(166, 124, 82, 0.18);
  padding: 6px 16px;
  border-radius: 9999px;
  text-transform: uppercase;
}

.tag-sparkle {
  font-size: 13px;
  color: #C86446;
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 700;
  color: #1F1E1B;
  line-height: 1.25;
  margin-bottom: 22px;
  letter-spacing: 0.015em;
  transition: opacity 0.3s ease;
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(31, 30, 27, 0.72);
  line-height: 1.8;
  margin-bottom: 48px; /* 增加呼吸留白，端庄素雅 */
  font-weight: 400;
}

.hero-cta-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #C86446;
  color: #ffffff;
  padding: 12px 28px;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(200, 100, 70, 0.25);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.btn-primary:hover {
  background: #b05337;
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(200, 100, 70, 0.35);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1.5px solid rgba(31, 30, 27, 0.2);
  color: #1F1E1B;
  padding: 12px 28px;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  text-decoration: none;
}

.btn-outline:hover {
  background: #ffffff;
  border-color: #1F1E1B;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(61, 50, 38, 0.08);
}

.hero-banner-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.banner-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(166, 124, 82, 0.2);
  padding: 6px 14px;
  border-radius: 9999px;
  cursor: pointer;
  font-size: 12.5px;
  color: rgba(31, 30, 27, 0.65);
  transition: all 0.25s ease;
}

.banner-pill:hover {
  background: #ffffff;
  color: #1F1E1B;
  border-color: #C86446;
}

.banner-pill.is-active {
  background: #C86446;
  border-color: #C86446;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(200, 100, 70, 0.28);
}

.pill-num {
  font-size: 10px;
  font-weight: 700;
  opacity: 0.85;
}

/* 右侧 3D 展品画板 */
.hero-right-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  perspective: 1000px; /* 3D 透视视距，赋予指针倾斜真实立体深度 */
}

.hero-art-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 480px;
  aspect-ratio: 4 / 3.3;
  border-radius: 28px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(166, 124, 82, 0.22);
  box-shadow: 0 20px 50px -12px rgba(61, 45, 30, 0.16),
              0 8px 20px -8px rgba(166, 124, 82, 0.08);
  cursor: pointer;
  will-change: transform;
  transform-style: preserve-3d; /* 保留子元素真实 3D 空间 */
  transition: transform 0.12s ease-out, box-shadow 0.35s ease, border-color 0.35s ease;
}

.hero-art-card:hover {
  border-color: #C86446;
  box-shadow: 0 28px 65px -12px rgba(200, 100, 70, 0.28),
              0 12px 24px -8px rgba(166, 124, 82, 0.12);
}

.art-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  background: #f0ebe4;
  transform-style: preserve-3d;
}

.art-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
  transform: translateZ(8px);
}

.hero-art-card:hover .art-card-img {
  transform: scale(1.025) translateZ(14px);
}

.art-card-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, transparent 55%);
  pointer-events: none;
  transform: translateZ(18px);
}

/* 浮动微标 (3D 真实悬浮) */
.floating-badge {
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(166, 124, 82, 0.2);
  box-shadow: 0 10px 24px rgba(61, 45, 30, 0.12);
  pointer-events: none;
  transform: translateZ(28px); /* 3D 浮出画板表面 */
  transition: box-shadow 0.3s ease;
  will-change: transform;
}

.badge-top {
  top: -14px;
  left: -14px;
}

.badge-bottom {
  bottom: -14px;
  right: -14px;
}

.badge-icon {
  font-size: 15px;
  color: #C86446;
}

.badge-text {
  font-size: 13px;
  font-weight: 600;
  color: #1F1E1B;
}

@media (max-width: 991px) {
  .hero-stage-container {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .hero-left-content {
    max-width: 100%;
    text-align: center;
  }
  .hero-tag-badge {
    margin-left: auto;
    margin-right: auto;
  }
  .hero-cta-group {
    justify-content: center;
  }
  .hero-banner-controls {
    justify-content: center;
  }
  .badge-top {
    left: 0;
  }
  .badge-bottom {
    right: 0;
  }
}

/* Section Common */
.section-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 2. Business Cards */
.business-section {
  margin-top: -36px;
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
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(166, 124, 82, 0.14);
  border-radius: 22px;
  padding: 30px 26px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  box-shadow: 0 8px 30px rgba(166, 124, 82, 0.06);
  cursor: pointer;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease;
}

.biz-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 45px rgba(166, 124, 82, 0.14);
  border-color: #C86446;
}

.biz-icon {
  font-size: 32px;
  background: #FAF7F2;
  border: 1px solid rgba(166, 124, 82, 0.12);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.biz-card:hover .biz-icon {
  transform: scale(1.08) rotate(-4deg);
}

.biz-title {
  font-family: var(--font-serif);
  font-size: 19px;
  font-weight: 700;
  color: #1F1E1B;
  margin-bottom: 8px;
}

.biz-desc {
  font-size: 13.5px;
  color: rgba(31, 30, 27, 0.68);
  line-height: 1.6;
  margin-bottom: 12px;
}

.biz-link {
  font-size: 13px;
  font-weight: 600;
  color: #C86446;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: transform 0.2s ease;
}

.biz-card:hover .biz-link {
  transform: translateX(3px);
}

/* 3. Featured Products */
.featured-products-section {
  padding: 40px 0 80px;
  background: transparent;
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
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  color: #1F1E1B;
  letter-spacing: -0.01em;
}

.view-all-link {
  font-size: 14px;
  font-weight: 600;
  color: #A67C52;
  transition: color 0.2s, transform 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.view-all-link:hover {
  color: #C86446;
  transform: translateX(2px);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.product-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(166, 124, 82, 0.12);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(166, 124, 82, 0.06);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 45px rgba(166, 124, 82, 0.14);
}

.product-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  background: #1F1E1B;
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  letter-spacing: 0.5px;
}

.product-thumb {
  width: 100%;
  height: 240px;
  background: #F5EFE6;
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
  padding: 22px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(31, 30, 27, 0.5);
  margin-bottom: 6px;
  font-family: monospace;
}

.product-name {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: #1F1E1B;
  margin-bottom: 8px;
  cursor: pointer;
  line-height: 1.35;
  transition: color 0.2s;
}

.product-name:hover {
  color: #C86446;
}

.product-summary {
  font-size: 13px;
  color: rgba(31, 30, 27, 0.68);
  line-height: 1.55;
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
  border-top: 1px solid rgba(166, 124, 82, 0.1);
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
  color: #C86446;
}

.price-main .amount {
  font-size: 22px;
  font-weight: 700;
  color: #C86446;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FAF7F2;
  border: 1px solid rgba(166, 124, 82, 0.16);
  color: #1F1E1B;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 9999px;
  text-decoration: none;
  transition: all 0.2s ease;
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
  background: #C86446;
  color: #ffffff;
  border-color: #C86446;
}

/* 4. Dealer Banner */
.dealer-banner-section {
  padding: 30px 0 80px;
  background: transparent;
}

.dealer-banner-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(166, 124, 82, 0.16);
  border-radius: 28px;
  padding: 48px 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 40px;
  box-shadow: 0 12px 40px rgba(166, 124, 82, 0.08);
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
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  color: #1F1E1B;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.dealer-desc {
  font-size: 15px;
  color: rgba(31, 30, 27, 0.7);
  line-height: 1.6;
  margin-bottom: 20px;
}

.dealer-features {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  font-weight: 600;
  color: #A67C52;
}

.dealer-banner-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.dealer-btn {
  padding: 14px 32px;
  font-size: 16px;
  background: #C86446;
  border-radius: 9999px;
  box-shadow: 0 8px 24px rgba(200, 100, 70, 0.25);
  transition: all 0.3s ease;
}

.dealer-btn:hover {
  background: #b05337;
  box-shadow: 0 12px 30px rgba(200, 100, 70, 0.35);
  transform: translateY(-2px);
}

.dealer-contact-tip {
  font-size: 12px;
  color: rgba(31, 30, 27, 0.5);
}

.dealer-contact-tip a {
  color: #A67C52;
  font-weight: 600;
}

.dealer-contact-tip a:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 5. Values */
.values-section {
  padding: 60px 0 80px;
  border-top: 1px solid rgba(166, 124, 82, 0.1);
  background: transparent;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.value-item {
  text-align: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(166, 124, 82, 0.1);
  border-radius: 22px;
  padding: 32px 20px;
  box-shadow: 0 6px 20px rgba(166, 124, 82, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.value-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(166, 124, 82, 0.1);
}

.value-icon {
  font-size: 36px;
  margin-bottom: 14px;
}

.value-item h4 {
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 700;
  color: #1F1E1B;
  margin-bottom: 8px;
}

.value-item p {
  font-size: 13px;
  color: rgba(31, 30, 27, 0.65);
  line-height: 1.55;
}

/* 6. News */
.news-section {
  padding: 20px 0 80px;
  background: transparent;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}

.news-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(166, 124, 82, 0.12);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(166, 124, 82, 0.05);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.news-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 45px rgba(166, 124, 82, 0.12);
}

.news-cover {
  width: 100%;
  height: 180px;
  background: #F5EFE6;
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
  padding: 20px 22px 24px;
}

.news-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: rgba(31, 30, 27, 0.5);
  margin-bottom: 8px;
}

.news-cat {
  color: var(--accent-color);
  font-weight: 600;
}

.news-title {
  font-family: var(--font-serif);
  font-size: 16.5px;
  font-weight: 700;
  color: #1F1E1B;
  line-height: 1.45;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-summary {
  font-size: 13px;
  color: rgba(31, 30, 27, 0.65);
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
