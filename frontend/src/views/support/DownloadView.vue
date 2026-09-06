<template>
    <div class="download-container">
        <el-card shadow="never">
            <template #header>
                <div class="card-header">
                    <h3>相关资源与文档下载</h3>
                    <el-button type="info" plain disabled>
                        批量导出历史归档 (暂未开放)
                    </el-button>
                </div>
            </template>

            <el-table v-loading="loading" :data="downloadList" stripe style="width: 100%">
                <el-table-column prop="title" label="文件名称" min-width="200" />
                <el-table-column prop="category" label="分类" width="120" />
                <el-table-column prop="fileSize" label="大小" width="100" />
                <el-table-column prop="updatedAt" label="更新时间" width="160" />
                <el-table-column label="操作" width="120" fixed="right">
                    <template #default="scope">
                        <el-button size="small"
                                   type="primary"
                                   link
                                   @click="handleDownload(scope.row)">
                            下载
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDownloadResources, downloadFile } from '@/services/support'

const loading = ref(false)
const downloadList = ref([])

const fetchResources = async () => {
  loading.value = true
  try {
    const res = await getDownloadResources()
    downloadList.value = res.data || []
  } catch (error) {
    ElMessage.error('获取下载列表失败，请刷新重试')
  } finally {
    loading.value = false
  }
}

const handleDownload = async (row) => {
  try {
    await downloadFile(row.id)
    ElMessage.success(`开始下载: ${row.title}`)
  } catch (error) {
    ElMessage.error(error?.response?.data?.message || '文件下载失败')
  }
}

onMounted(() => {
  fetchResources()
})
</script>

<style scoped>
    .download-container {
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
</style>