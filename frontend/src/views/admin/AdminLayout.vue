<template>
  <div class="admin-layout">
    <!-- 顶栏：品牌、后台标识、身份与出口 -->
    <header class="admin-topbar">
      <div class="topbar-left">
        <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen" aria-label="切换菜单">
          <el-icon><Expand /></el-icon>
        </button>
        <router-link to="/" class="topbar-brand">
          <img src="/logo.svg" alt="WeMove Logo" />
          <span class="brand-name">WeMove 惟木匠心</span>
        </router-link>
        <span class="topbar-divider"></span>
        <span class="topbar-badge">运营管理后台</span>
      </div>
      <div class="topbar-right">
        <el-dropdown trigger="click" @command="handleUserCommand">
          <div class="user-badge-pill">
            <span class="user-name">{{ userStore.userInfo.username }}</span>
            <el-tag size="small" type="info" effect="plain">{{ roleText }}</el-tag>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="front">🌐 返回官网前台</el-dropdown-item>
              <el-dropdown-item command="account">👤 我的账户</el-dropdown-item>
              <el-dropdown-item divided command="logout">🚪 退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <div class="admin-body">
      <!-- 侧边导航：各领域任务在此接入自己的子页面（路由见 router/index.js /admin children） -->
      <aside class="admin-sidebar" :class="{ open: sidebarOpen }">
        <nav class="sidebar-nav">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="side-link"
            :class="{ disabled: item.pending }"
            @click="sidebarOpen = false"
          >
            <span class="side-icon">{{ item.icon }}</span>
            <span class="side-label">{{ item.label }}</span>
            <span v-if="item.pending" class="side-tag">待接入</span>
          </router-link>
        </nav>

        <div class="sidebar-note">
          <p class="note-title">接入说明</p>
          <p class="note-text">
            后台外壳与路由由 #86 维护；产品、内容、支持、经销商、用户管理页面
            分别由 #87 / #88 / #89 / #90 / #85 交付后挂载到对应子路由。
          </p>
        </div>
      </aside>
      <div v-if="sidebarOpen" class="sidebar-mask" @click="sidebarOpen = false"></div>

      <!-- 内容区：子路由视图 -->
      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'

/**
 * 运营后台外壳（#86 拆分自旧 AdminView.vue）
 *
 * - 外壳（布局/导航/身份栏）归 #86 维护；各领域后台页面挂载到 /admin 子路由
 * - 旧后台内的演示数据表格已移除：按规则 3 与 D9，未经真实接口的管理能力
 *   不再以本地假数据冒充，各领域页面接入前显示占位状态
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const sidebarOpen = ref(false)

const menuItems = [
  { path: '/admin', label: '概览', icon: '📊', pending: false },
  { path: '/admin/products', label: '产品与分类', icon: '🧸', pending: false },
  { path: '/admin/content', label: '内容与栏目', icon: '📝', pending: false },
  { path: '/admin/support', label: '留言 / FAQ / 下载', icon: '💬', pending: true },
  { path: '/admin/dealers', label: '经销商审核', icon: '🤝', pending: false },
  { path: '/admin/users', label: '用户管理', icon: '👥', pending: true }
]

const roleText = computed(() => {
  if (userStore.isPreviewActive) return `预览：${userStore.currentRole}`
  return { ADMIN: '管理员', DEALER: '经销商', USER: '用户' }[userStore.currentRole] || '游客'
})

function closeSidebar(pending) {
  if (!pending) sidebarOpen.value = false
}

function handleUserCommand(cmd) {
  if (cmd === 'front') {
    router.push('/')
  } else if (cmd === 'account') {
    router.push('/account')
  } else if (cmd === 'logout') {
    handleLogout()
  }
}

async function handleLogout() {
  const { ok, error } = await userStore.logout()
  if (ok) {
    ElMessage.success('已退出登录')
  } else {
    ElMessage.error(error?.message || '退出失败，请稍后重试')
  }
  router.push('/')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-light);
}

/* 顶栏 */
.admin-topbar {
  height: 60px;
  background: #1F2937;
  color: #F9FAFB;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.sidebar-toggle {
  display: none;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: #F9FAFB;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  align-items: center;
  justify-content: center;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.topbar-brand img {
  width: 30px;
  height: 30px;
  border-radius: 6px;
}

.topbar-brand .brand-name {
  font-size: 15px;
  font-weight: 700;
  color: #F9FAFB;
}

.topbar-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
}

.topbar-badge {
  font-size: 12px;
  color: #D1D5DB;
  letter-spacing: 1px;
}

.user-badge-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: #F9FAFB;
  cursor: pointer;
}

.user-name {
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主体 */
.admin-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.admin-sidebar {
  width: 232px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid var(--border-color);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.side-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.15s;
}

.side-link:hover {
  background: var(--bg-light);
  color: var(--text-color);
}

.side-link.router-link-exact-active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
}

.side-link.disabled {
  opacity: 0.75;
}

.side-icon {
  font-size: 16px;
}

.side-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-tag {
  font-size: 10px;
  color: var(--text-light);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.sidebar-note {
  margin-top: auto;
  background: var(--bg-light);
  border-radius: 10px;
  padding: 12px;
}

.note-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.note-text {
  font-size: 12px;
  color: var(--text-light);
  line-height: 1.6;
}

.sidebar-mask {
  display: none;
}

.admin-content {
  flex: 1;
  min-width: 0;
  padding: 24px;
}

@media (max-width: 768px) {
  .sidebar-toggle {
    display: flex;
  }

  .topbar-badge,
  .topbar-divider {
    display: none;
  }

  .admin-sidebar {
    position: fixed;
    top: 60px;
    bottom: 0;
    left: 0;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: var(--shadow-md);
  }

  .admin-sidebar.open {
    transform: translateX(0);
  }

  .sidebar-mask {
    display: block;
    position: fixed;
    inset: 60px 0 0 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 30;
  }

  .admin-content {
    padding: 16px;
  }
}
</style>
