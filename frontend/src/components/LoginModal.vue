<template>
  <el-dialog
    v-model="visible"
    title="用户登录 / 角色快速切换演示"
    width="500px"
    align-center
    append-to-body
    class="login-dialog"
    destroy-on-close
  >
    <!-- Rapid role switcher for presentation -->
    <div class="role-switcher-banner">
      <div class="banner-title">
        <el-icon><InfoFilled /></el-icon>
        <span>答辩与评测快捷通道（点击立即切换身份体验）：</span>
      </div>
      <div class="role-cards">
        <div
          class="role-card"
          :class="{ active: userStore.currentRole === 'GUEST' }"
          @click="selectRole('GUEST')"
        >
          <div class="role-icon">👤</div>
          <div class="role-name">游客身份</div>
          <div class="role-tip">浏览/指导价</div>
        </div>

        <div
          class="role-card"
          :class="{ active: userStore.currentRole === 'USER' }"
          @click="selectRole('USER')"
        >
          <div class="role-icon">🛍️</div>
          <div class="role-name">普通买家</div>
          <div class="role-tip">零售下单/地址</div>
        </div>

        <div
          class="role-card highlight-dealer"
          :class="{ active: userStore.currentRole === 'DEALER' }"
          @click="selectRole('DEALER')"
        >
          <div class="role-icon">💼</div>
          <div class="role-name">认证经销商</div>
          <div class="role-tip">享6.5折/批量下单</div>
        </div>

        <div
          class="role-card"
          :class="{ active: userStore.currentRole === 'ADMIN' }"
          @click="selectRole('ADMIN')"
        >
          <div class="role-icon">⚙️</div>
          <div class="role-name">平台管理员</div>
          <div class="role-tip">审核/订单履约</div>
        </div>
      </div>
    </div>

    <el-divider>或常规账号登录</el-divider>

    <el-form :model="form" label-position="top" class="login-form">
      <el-form-item label="登录账号 / 电子邮箱">
        <el-input v-model="form.email" placeholder="例如 dealer@starwood.com" size="large" />
      </el-form-item>
      <el-form-item label="登录密码">
        <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password />
      </el-form-item>

      <div class="form-actions">
        <el-button type="primary" size="large" class="submit-btn" @click="handleManualLogin">
          确认登录
        </el-button>
      </div>
    </el-form>

    <div class="dealer-recruit-hint">
      企业采购或意向代理尚未获得账号？
      <a href="javascript:void(0)" @click="goToApply">立即申请成为经销商</a>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const visible = ref(false)
const router = useRouter()
const userStore = useUserStore()

const form = ref({
  email: 'dealer@starwood.com',
  password: '••••••••'
})

function open() {
  visible.value = true
}

function close() {
  visible.value = false
}

function selectRole(roleKey) {
  userStore.switchRole(roleKey)
  ElMessage.success(`已成功切换为：${userStore.userInfo.username}`)
  close()
}

function handleManualLogin() {
  // If email matches dealer
  if (form.value.email.includes('dealer')) {
    selectRole('DEALER')
  } else if (form.value.email.includes('admin')) {
    selectRole('ADMIN')
  } else {
    selectRole('USER')
  }
}

function goToApply() {
  close()
  router.push('/dealers/apply')
}

defineExpose({ open, close })
</script>

<style scoped>
.role-switcher-banner {
  background: var(--bg-light);
  border: 1px solid var(--primary-border);
  border-radius: 10px;
  padding: 14px;
}

.banner-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.role-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.role-card {
  background: #ffffff;
  border: 1.5px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.role-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.role-card.active {
  border-color: var(--primary-color);
  background: var(--primary-light);
  box-shadow: 0 2px 8px rgba(168, 152, 128, 0.25);
}

.role-card.highlight-dealer.active {
  border-color: #A89880;
  background: #F2ECE1;
}

.role-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.role-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 2px;
}

.role-tip {
  font-size: 10px;
  color: var(--text-light);
}

.login-form {
  margin-top: 10px;
}

.submit-btn {
  width: 100%;
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.dealer-recruit-hint {
  margin-top: 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.dealer-recruit-hint a {
  color: var(--primary-color);
  font-weight: 600;
  margin-left: 4px;
}

.dealer-recruit-hint a:hover {
  text-decoration: underline;
}
</style>

