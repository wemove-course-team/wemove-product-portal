<template>
    <div class="admin-support-container">
        <el-card shadow="never">
            <template #header>
                <div class="card-header">
                    <h3>工单管理后台</h3>
                    <el-tooltip content="自动化数据分析与导出功能暂未开放" placement="top">
                        <el-button type="primary" plain disabled>
                            导出分析报告 (暂未开放)
                        </el-button>
                    </el-tooltip>
                </div>
            </template>

            <!-- 筛选栏 -->
            <div class="filter-bar">
                <el-select v-model="filterStatus" placeholder="按状态筛选" clearable @change="fetchTickets">
                    <el-option label="待处理" value="pending" />
                    <el-option label="处理中" value="processing" />
                    <el-option label="已完成" value="resolved" />
                </el-select>
            </div>

            <el-table v-loading="loading" :data="ticketList" stripe style="width: 100%">
                <el-table-column prop="id" label="工单ID" width="100" />
                <el-table-column prop="name" label="提交人" width="120" />
                <el-table-column prop="email" label="邮箱" width="180" />
                <el-table-column prop="category" label="类型" width="120" />
                <el-table-column prop="message" label="问题描述" show-overflow-tooltip />
                <el-table-column prop="status" label="状态" width="110">
                    <template #default="scope">
                        <el-tag :type="getStatusTag(scope.row.status)">
                            {{ formatStatus(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                    <template #default="scope">
                        <el-button v-if="scope.row.status !== 'resolved'"
                                   size="small"
                                   type="success"
                                   link
                                   @click="handleResolve(scope.row)">
                            标记为已解决
                        </el-button>
                        <span v-else class="text-muted">已结案</span>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminTickets, updateTicketStatus } from '@/services/support'

const loading = ref(false)
const filterStatus = ref('')
const ticketList = ref([])

const fetchTickets = async () => {
  loading.value = true
  try {
    const res = await getAdminTickets({ status: filterStatus.value })
    ticketList.value = res.data || []
  } catch (error) {
    ElMessage.error('获取工单列表失败')
  } finally {
    loading.value = false
  }
}

const handleResolve = async (row) => {
  try {
    await updateTicketStatus(row.id, { status: 'resolved' })
    ElMessage.success('工单状态更新成功')
    fetchTickets()
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '更新状态失败')
  }
}

const getStatusTag = (status) => {
  switch (status) {
    case 'pending': return 'danger'
    case 'processing': return 'warning'
    case 'resolved': return 'success'
    default: return 'info'
  }
}

const formatStatus = (status) => {
  switch (status) {
    case 'pending': return '待处理'
    case 'processing': return '处理中'
    case 'resolved': return '已解决'
    default: return '未知'
  }
}

onMounted(() => {
  fetchTickets()
})
</script>

<style scoped>
    .admin-support-container {
        padding: 24px;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

        .card-header h3 {
            margin: 0;
        }

    .filter-bar {
        margin-bottom: 20px;
    }

    .text-muted {
        color: #c0c4cc;
        font-size: 12px;
    }
</style>