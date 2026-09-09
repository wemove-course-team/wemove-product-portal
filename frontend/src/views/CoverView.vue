<template>
  <div
    class="cinematic-cover-page"
    ref="coverPageRef"
    @click="enterHome"
    tabindex="0"
    @keydown.enter="enterHome"
    @keydown.space.prevent="enterHome"
    @keydown.down.prevent="enterHome"
  >
    <!-- 背景大图层（带暗角遮罩与极轻微鼠标视差） -->
    <div class="cover-bg-wrap">
      <img
        :src="coverImage"
        ref="coverImgRef"
        class="cover-bg-img"
        alt="WEMOVE 惟木匠心"
      />
      <div class="cover-vignette-overlay"></div>
    </div>

    <!-- 居中典雅大标排版 -->
    <div class="cover-content" @click.stop>
      <div class="cover-badge">
        <span class="cover-sparkle">✦</span>
        <span>ARTISAN WOODWORK & CRAFT</span>
        <span class="cover-sparkle">✦</span>
      </div>

      <h1 class="cover-title">WEMOVE 惟木匠心</h1>
      <p class="cover-sub">SPORTS & LIVING</p>
      <p class="cover-statement">自然之质 · 物理之趣 · 匠心致远</p>

      <div class="cover-actions">
        <button type="button" class="btn-enter-home" @click="enterHome">
          <span>进入官网探索</span>
          <span class="btn-arrow">&rarr;</span>
        </button>
      </div>
    </div>

    <!-- 底部滚动探索胶囊提示 -->
    <div class="cover-scroll-hint" @click.stop="enterHome">
      <div class="hint-pill">
        <span>向下滚动或点击探索</span>
        <span class="hint-arrow">&darr;</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'

const router = useRouter()
const coverPageRef = ref(null)
const coverImgRef = ref(null)
const coverImage = '/images/furniture_s0_f9590908-a1a.png'

let isTransitioning = false
let removePointerListener = null
let removeWheelListener = null

function enterHome() {
  if (isTransitioning) return
  isTransitioning = true

  if (coverPageRef.value) {
    // 优雅幕布上滑收起动效（Curtain Slide-Up），平滑衔接官网首页
    gsap.to(coverPageRef.value, {
      yPercent: -100,
      opacity: 0.95,
      duration: 0.65,
      ease: 'power3.inOut',
      onComplete: () => {
        router.push('/home')
      }
    })
  } else {
    router.push('/home')
  }
}

function handleWheel(e) {
  // 鼠标滚轮向下滚动，或触控板双指上滑
  if (e.deltaY > 20) {
    enterHome()
  }
}

let touchStartY = 0
function handleTouchStart(e) {
  if (e.touches && e.touches.length > 0) {
    touchStartY = e.touches[0].clientY
  }
}

function handleTouchEnd(e) {
  if (e.changedTouches && e.changedTouches.length > 0) {
    const diffY = touchStartY - e.changedTouches[0].clientY
    if (diffY > 40) { // 上滑手势
      enterHome()
    }
  }
}

function handleMouseMove(e) {
  if (!coverImgRef.value || isTransitioning) return
  const normX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)
  const normY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)
  coverImgRef.value.style.transform = `scale(1.05) translate3d(${(normX * 18).toFixed(1)}px, ${(normY * 12).toFixed(1)}px, 0)`
}

onMounted(() => {
  window.addEventListener('wheel', handleWheel, { passive: true })
  window.addEventListener('touchstart', handleTouchStart, { passive: true })
  window.addEventListener('touchend', handleTouchEnd, { passive: true })
  window.addEventListener('mousemove', handleMouseMove, { passive: true })

  removeWheelListener = () => {
    window.removeEventListener('wheel', handleWheel)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchend', handleTouchEnd)
  }
  removePointerListener = () => {
    window.removeEventListener('mousemove', handleMouseMove)
  }

  // 封面入场微动效：大标与按钮舒展展开
  if (coverPageRef.value) {
    coverPageRef.value.focus()
    const content = coverPageRef.value.querySelector('.cover-content')
    if (content) {
      gsap.fromTo(content, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out', delay: 0.1 }
      )
    }
  }
})

onUnmounted(() => {
  if (removeWheelListener) removeWheelListener()
  if (removePointerListener) removePointerListener()
})
</script>

<style scoped>
.cinematic-cover-page {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #141311;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  outline: none;
}

.cover-bg-wrap {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.cover-bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: brightness(0.65) contrast(1.08);
  transform: scale(1.05);
  transition: transform 0.25s ease-out;
  will-change: transform;
}

.cover-vignette-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(16, 14, 12, 0.24) 0%, rgba(12, 10, 8, 0.72) 75%, rgba(8, 7, 6, 0.90) 100%),
              linear-gradient(to bottom, rgba(12, 11, 10, 0.45) 0%, transparent 40%, rgba(10, 9, 8, 0.80) 100%);
  pointer-events: none;
}

.cover-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #FAF7F2;
  padding: 0 24px;
  max-width: 960px;
}

.cover-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 700;
  color: #E2B276;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 24px;
  background: rgba(226, 178, 118, 0.12);
  border: 1px solid rgba(226, 178, 118, 0.3);
  padding: 6px 18px;
  border-radius: 9999px;
  backdrop-filter: blur(8px);
}

.cover-sparkle {
  color: #E2B276;
  font-size: 12px;
}

.cover-title {
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: clamp(38px, 6vw, 76px);
  font-weight: 700;
  letter-spacing: 6px;
  line-height: 1.15;
  color: #FAF7F2;
  text-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  margin-bottom: 16px;
}

.cover-sub {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(14px, 2vw, 20px);
  font-weight: 600;
  letter-spacing: 8px;
  color: rgba(250, 247, 242, 0.82);
  margin-bottom: 22px;
}

.cover-statement {
  font-family: 'Noto Serif SC', serif;
  font-size: 15px;
  letter-spacing: 4px;
  color: rgba(250, 247, 242, 0.65);
  margin-bottom: 36px;
}

.cover-actions {
  display: flex;
  justify-content: center;
}

.btn-enter-home {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 13px 34px;
  border-radius: 9999px;
  background: #C86446;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(200, 100, 70, 0.35);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-enter-home:hover {
  background: #b05337;
  transform: translateY(-2px);
  box-shadow: 0 14px 36px rgba(200, 100, 70, 0.45);
}

.btn-arrow {
  font-size: 18px;
  transition: transform 0.25s ease;
}

.btn-enter-home:hover .btn-arrow {
  transform: translateX(4px);
}

/* 底部探索胶囊提示 */
.cover-scroll-hint {
  position: absolute;
  bottom: 42px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  cursor: pointer;
}

.hint-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 22px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #FAF7F2;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1.5px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  animation: hint-float 2.4s ease-in-out infinite;
  transition: all 0.3s ease;
}

.hint-pill:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.45);
  transform: translateY(-2px);
}

.hint-arrow {
  font-size: 15px;
  animation: arrow-bounce 1.5s ease-in-out infinite;
}

@keyframes hint-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes arrow-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}
</style>
