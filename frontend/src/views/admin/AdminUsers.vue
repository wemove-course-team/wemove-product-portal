<template>
  <div class="users-page">
    <div class="page-heading">
      <div><p class="eyebrow">MVP-01</p><h1>用户管理</h1><p>查询平台账号并控制登录状态；当前管理员和最后一个有效管理员受服务端保护。</p></div>
      <el-button :loading="loading" @click="loadUsers"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <div class="toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索用户名、邮箱或姓名" @keyup.enter="search" @clear="search" />
      <el-select v-model="status" clearable placeholder="全部状态" @change="search">
        <el-option label="已启用" value="1" />
        <el-option label="已停用" value="0" />
      </el-select>
      <el-button type="primary" @click="search">查询</el-button>
    </div>

    <el-alert v-if="error" type="error" :closable="false" show-icon :title="error.message || '用户列表加载失败'" />
    <el-table v-loading="loading" :data="users" stripe empty-text="暂无符合条件的用户">
      <el-table-column prop="username" label="用户名" min-width="150" />
      <el-table-column prop="realName" label="姓名" min-width="110"><template #default="{ row }">{{ row.realName || '未填写' }}</template></el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="210" show-overflow-tooltip />
      <el-table-column prop="role" label="角色" width="110"><template #default="{ row }"><el-tag effect="plain" :type="roleType(row.role)">{{ roleText(row.role) }}</el-tag></template></el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="170"><template #default="{ row }">{{ formatDate(row.createdAt) }}</template></el-table-column>
      <el-table-column label="账号状态" width="120" fixed="right">
        <template #default="{ row }"><el-switch v-model="row.status" :active-value="1" :inactive-value="0" :loading="updatingId === row.id" @change="updateStatus(row)" /></template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @current-change="loadUsers"
      @size-change="search"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '../../services/auth'

const users = ref([])
const keyword = ref('')
const status = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const updatingId = ref(null)
const error = ref(null)

async function loadUsers() {
  loading.value = true
  error.value = null
  try {
    const response = await authApi.adminUsers({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      status: status.value || undefined
    })
    users.value = response.data?.items || []
    total.value = response.data?.total || 0
  } catch (reason) {
    error.value = reason
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  return loadUsers()
}

async function updateStatus(row) {
  const target = Number(row.status)
  updatingId.value = row.id
  try {
    const response = await authApi.updateUserStatus(row.id, target)
    row.status = response.data.status
    ElMessage.success(target === 1 ? '账号已启用' : '账号已停用')
  } catch (reason) {
    row.status = target === 1 ? 0 : 1
    ElMessage.error(reason.message || '账号状态更新失败')
  } finally {
    updatingId.value = null
  }
}

function roleText(role) { return { ADMIN: '管理员', DEALER: '经销商', USER: '普通用户' }[role] || role }
function roleType(role) { return { ADMIN: 'danger', DEALER: 'warning', USER: 'info' }[role] || 'info' }
function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN', { hour12: false })
}

onMounted(loadUsers)
</script>

<style scoped>
.users-page { min-width: 0; padding: 22px; background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.page-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 20px; }
.eyebrow { margin: 0 0 5px; color: var(--primary-color); font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
.page-heading h1 { margin: 0; font-size: 24px; }
.page-heading p:last-child { margin: 6px 0 0; color: var(--text-muted); font-size: 13px; }
.toolbar { display: grid; grid-template-columns: minmax(220px, 1fr) 160px auto; gap: 10px; margin-bottom: 16px; }
.el-pagination { justify-content: flex-end; margin-top: 18px; }
@media (max-width: 768px) { .page-heading { align-items: flex-start; flex-direction: column; } .toolbar { grid-template-columns: 1fr; } .el-pagination { justify-content: flex-start; overflow-x: auto; } }
</style>
