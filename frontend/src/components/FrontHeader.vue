<template>
  <header class="site-header" :class="{ 'is-scrolled': isScrolled }">
    <div class="header-bar">
      <!-- Brand Logo -->
      <router-link to="/" class="header-logo">
        <img src="/logo.svg" alt="WeMove Logo" />
        <div class="brand-text">
          <span class="brand-name">WeMove 惟木匠心</span>
          <span class="brand-sub">SPORTS & LIVING</span>
        </div>
      </router-link>

      <!-- Central Main Navigation -->
      <nav class="header-nav">
        <router-link to="/" class="hn-link">首页</router-link>
        <router-link to="/workshop" class="hn-link">玩具品类</router-link>
        <router-link to="/furniture" class="hn-link">家具定制</router-link>
        <router-link to="/woodlab" class="hn-link">中试打样</router-link>

        <!-- 【科教实践】折叠下拉菜单 -->
        <div class="hn-item dropdown-wrap" @mouseenter="showDrop = true" @mouseleave="showDrop = false">
          <span class="hn-link" :class="{ 'router-link-active': isSubActive }">
            科教实践
            <el-icon class="hn-chevron"><ArrowDown /></el-icon>
          </span>
          <transition name="el-zoom-in-top">
            <div v-show="showDrop" class="hn-drop">
              <router-link to="/stem" class="hn-drop-link" @click="showDrop = false">
                🌱 STEM教育
              </router-link>
              <router-link to="/library" class="hn-drop-link" @click="showDrop = false">
                📚 科研研发
              </router-link>
              <router-link to="/charity" class="hn-drop-link" @click="showDrop = false">
                🤝 公益项目
              </router-link>
              <router-link to="/dream" class="hn-drop-link" @click="showDrop = false">
                ✨ 匠心筑梦
              </router-link>
            </div>
          </transition>
        </div>

        <!-- 【加入我们】作为经销商申请一级入口 -->
        <router-link to="/dealers/apply" class="hn-link highlight">
          加入我们
        </router-link>
      </nav>

      <!-- Right Action Tools -->
      <div class="header-actions">
        <!-- Search Button -->
        <button class="action-btn" title="全站搜索" @click="openSearch">
          <el-icon><Search /></el-icon>
        </button>

        <!-- User Role Switcher / Profile -->
        <div v-if="userStore.isGuest" class="user-action-wrap">
          <button class="action-btn" title="登录 / 切换身份" @click="openLogin">
            <el-icon><User /></el-icon>
          </button>
        </div>
        <div v-else class="user-logged-wrap">
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="user-badge-pill">
              <span v-if="userStore.isDealer" class="badge-dealer">经销商</span>
              <span v-else-if="userStore.isAdmin" class="badge-dealer" style="background:#5A6472">管理员</span>
              <span class="user-name">{{ userStore.userInfo.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <div class="dropdown-company-title">
                  {{ userStore.userInfo.companyName }}
                </div>
                <el-dropdown-item v-if="userStore.isDealer" command="dealerPortal">
                  💼 经销商专属工作台 (批量下单)
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin">
                  ⚙️ 运营管理后台
                </el-dropdown-item>
                <el-dropdown-item command="switchDemoRole">
                  🔄 快速切换演示角色...
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  🚪 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- Cart Trigger with Badge -->
        <button class="action-btn" title="购物车" @click="openCart">
          <el-icon><ShoppingCart /></el-icon>
          <span v-if="cartStore.totalCount > 0" class="action-badge">
            {{ cartStore.totalCount > 99 ? '99+' : cartStore.totalCount }}
          </span>
        </button>

        <!-- Mobile Burger Menu -->
        <button class="header-burger" @click="mobileMenuOpen = !mobileMenuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer Nav -->
    <el-drawer v-model="mobileMenuOpen" title="网站导航" direction="ltr" size="280px" append-to-body>
      <div class="mobile-nav-links">
        <router-link to="/" class="m-link" @click="mobileMenuOpen = false">首页</router-link>
        <router-link to="/workshop" class="m-link" @click="mobileMenuOpen = false">玩具品类</router-link>
        <router-link to="/furniture" class="m-link" @click="mobileMenuOpen = false">家具定制</router-link>
        <router-link to="/woodlab" class="m-link" @click="mobileMenuOpen = false">中试打样</router-link>
        <div class="m-section-title">科教实践专区</div>
        <router-link to="/stem" class="m-sub-link" @click="mobileMenuOpen = false">STEM教育</router-link>
        <router-link to="/library" class="m-sub-link" @click="mobileMenuOpen = false">科研研发</router-link>
        <router-link to="/charity" class="m-sub-link" @click="mobileMenuOpen = false">公益项目</router-link>
        <router-link to="/dream" class="m-sub-link" @click="mobileMenuOpen = false">匠心筑梦</router-link>
        <el-divider />
        <router-link to="/dealers/apply" class="m-link highlight" @click="mobileMenuOpen = false">
          加入我们（申请经销商）
        </router-link>
      </div>
    </el-drawer>

    <!-- Modals & Drawers -->
    <SearchModal ref="searchModalRef" />
    <LoginModal ref="loginModalRef" />
    <CartDrawer ref="cartDrawerRef" />
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'
import SearchModal from './SearchModal.vue'
import LoginModal from './LoginModal.vue'
import CartDrawer from './CartDrawer.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const showDrop = ref(false)
const isScrolled = ref(false)
const mobileMenuOpen = ref(false)

const searchModalRef = ref(null)
const loginModalRef = ref(null)
const cartDrawerRef = ref(null)

const isSubActive = computed(() => {
  return ['/stem', '/library', '/charity', '/dream'].includes(route.path)
})

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

function openSearch() {
  searchModalRef.value?.open()
}

function openLogin() {
  loginModalRef.value?.open()
}

function openCart() {
  cartDrawerRef.value?.open()
}

function handleUserCommand(cmd) {
  if (cmd === 'dealerPortal') {
    router.push('/dealer/portal')
  } else if (cmd === 'admin') {
    router.push('/admin')
  } else if (cmd === 'switchDemoRole') {
    openLogin()
  } else if (cmd === 'logout') {
    userStore.logout()
  }
}
</script>

<style scoped>
.dropdown-company-title {
  padding: 8px 16px;
  font-size: 11px;
  color: var(--text-light);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 4px;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.m-link {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  padding: 8px 12px;
  border-radius: 6px;
}

.m-link:hover {
  background: var(--bg-light);
}

.m-link.highlight {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
}

.m-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light);
  margin-top: 10px;
  padding-left: 12px;
}

.m-sub-link {
  font-size: 14px;
  color: var(--text-muted);
  padding: 6px 12px 6px 24px;
}
</style>

