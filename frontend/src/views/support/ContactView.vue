<template>
    <div class="contact-container">
        <el-row :gutter="24">
            <!-- 左侧：提交工单 -->
            <el-col :xs="24" :md="16">
                <el-card class="box-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <h3>提交技术支持工单</h3>
                        </div>
                    </template>

                    <el-form ref="formRef"
                             :model="form"
                             :rules="rules"
                             label-width="100px"
                             status-icon>
                        <el-form-item label="姓名" prop="name">
                            <el-input v-model="form.name" placeholder="请输入您的姓名" />
                        </el-form-item>

                        <el-form-item label="联系邮箱" prop="email">
                            <el-input v-model="form.email" placeholder="请输入有效的电子邮箱" />
                        </el-form-item>

                        <el-form-item label="问题分类" prop="category">
                            <el-select v-model="form.category" placeholder="请选择问题类型" style="width: 100%">
                                <el-option label="账号与权限" value="account" />
                                <el-option label="系统 Bug 反馈" value="bug" />
                                <el-option label="功能建议" value="feature" />
                                <el-option label="其他" value="other" />
                            </el-select>
                        </el-form-item>

                        <el-form-item label="详细描述" prop="message">
                            <el-input v-model="form.message"
                                      type="textarea"
                                      :rows="5"
                                      placeholder="请详细描述您遇到的问题或建议..." />
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" :loading="submitting" @click="handleSubmit(formRef)">
                                提交工单
                            </el-button>
                            <el-button @click="resetForm(formRef)">重置</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-col>

            <!-- 右侧：其他支持通道 -->
            <el-col :xs="24" :md="8">
                <el-card class="box-card" shadow="never">
                    <template #header>
                        <div class="card-header">
                            <h3>其他支持方式</h3>
                        </div>
                    </template>

                    <div class="support-channels">
                        <div class="channel-item disabled">
                            <div class="channel-info">
                                <h4>在线即时客服</h4>
                                <p>一对一实时解答系统使用疑问</p>
                            </div>
                            <el-tag type="info" size="small">暂未开放</el-tag>
                        </div>

                        <el-divider />

                        <div class="channel-item disabled">
                            <div class="channel-info">
                                <h4>电话技术专线</h4>
                                <p>工作日 9:00 - 18:00</p>
                            </div>
                            <el-tag type="info" size="small">暂未开放</el-tag>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { submitSupportTicket } from '@/services/support'

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  name: '',
  email: '',
  category: '',
  message: ''
})

const rules = reactive({
  name: [
    { required: true, message: '请输入您的姓名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入联系邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入格式正确的电子邮箱', trigger: ['blur', 'change'] }
  ],
  category: [
    { required: true, message: '请选择问题分类', trigger: 'change' }
  ],
  message: [
    { required: true, message: '请输入详细描述内容', trigger: 'blur' },
    { min: 10, message: '描述内容不得少于 10 个字符', trigger: 'blur' }
  ]
})

const handleSubmit = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await submitSupportTicket({ ...form })
        ElMessage.success('工单提交成功，我们会尽快处理！')
        resetForm(formEl)
      } catch (error) {
        ElMessage.error(error?.response?.data?.message || '提交失败，请稍后重试')
      } finally {
        submitting.value = false
      }
    }
  })
}

const resetForm = (formEl) => {
  if (!formEl) return
  formEl.resetFields()
}
</script>

<style scoped>
    .contact-container {
        padding: 24px;
    }

    .channel-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

        .channel-item.disabled {
            opacity: 0.6;
        }

    .channel-info h4 {
        margin: 0 0 6px 0;
        font-size: 15px;
    }

    .channel-info p {
        margin: 0;
        font-size: 12px;
        color: #909399;
    }
</style>