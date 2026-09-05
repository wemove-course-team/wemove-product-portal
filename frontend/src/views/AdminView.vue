<template>
  <div class="admin-page">
    <div class="admin-header">
      <div class="inner">
        <div class="admin-title-box">
          <span class="badge-dealer" style="background: #4B5563;">MANAGEMENT CONSOLE</span>
          <h1>WeMove 惟木匠心 · 商业运营管理后台</h1>
          <p>涵盖 B2B 经销商资格审核、订单履约调度与商品价格管理</p>
        </div>
        <el-button @click="$router.push('/')">
          返回官网前台
        </el-button>
      </div>
    </div>

    <div class="admin-body">
      <el-tabs v-model="activeTab" type="border-card" class="admin-tabs">
        <!-- TAB 1: 经销商合作申请审核 (核心 B2B 闭环) -->
        <el-tab-pane label="经销商合作审核" name="dealers">
          <div class="tab-inner">
            <div class="toolbar-row">
              <h3>经销商入驻申请列表</h3>
              <el-tag type="info">共 {{ dealerStore.applications.length }} 条记录</el-tag>
            </div>

            <el-table :data="dealerStore.applications" border stripe style="width: 100%">
              <el-table-column prop="id" label="申请编号" width="160" />
              <el-table-column prop="companyName" label="企业主体名称" min-width="180" />
              <el-table-column prop="contactName" label="联系人" width="100" />
              <el-table-column prop="phone" label="联系电话" width="130" />
              <el-table-column prop="businessType" label="机构性质" width="160" />
              <el-table-column prop="annualTarget" label="预估采购规模" width="130" />
              <el-table-column label="当前状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'">
                    {{ row.status === 'APPROVED' ? '已授权通过' : row.status === 'REJECTED' ? '已驳回' : '待审核' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作处理" width="180" fixed="right">
                <template #default="{ row }">
                  <div v-if="row.status === 'PENDING'" class="table-actions">
                    <el-button type="success" size="small" @click="openApproveModal(row)">
                      审核通过
                    </el-button>
                    <el-button type="danger" size="small" plain @click="handleReject(row)">
                      驳回
                    </el-button>
                  </div>
                  <span v-else class="done-note">
                    {{ row.tierName }} ({{ row.discountRate * 10 }}折)
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- TAB 2: 订单履约与物流管理 -->
        <el-tab-pane label="订单调度与履约" name="orders">
          <div class="tab-inner">
            <div class="toolbar-row">
              <h3>全渠道销售订单</h3>
              <el-tag type="info">共 {{ cartStore.orders.length }} 笔订单</el-tag>
            </div>

            <el-table :data="cartStore.orders" border stripe style="width: 100%">
              <el-table-column prop="orderId" label="订单号" width="180" />
              <el-table-column prop="orderType" label="业务类型" width="160" />
              <el-table-column prop="customerCompany" label="客户/企业" width="160" />
              <el-table-column prop="customerName" label="收货人" width="100" />
              <el-table-column prop="customerAddress" label="配送地址" min-width="200" />
              <el-table-column label="订单金额" width="120">
                <template #default="{ row }">
                  <strong style="color: #B25E29;">¥{{ row.totalAmount }}</strong>
                </template>
              </el-table-column>
              <el-table-column label="履约状态" width="110">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'SHIPPED' ? 'success' : 'warning'">
                    {{ row.status === 'SHIPPED' ? '已发货' : '待发货' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="物流单号" width="150">
                <template #default="{ row }">
                  <span>{{ row.trackingNo || '未发货' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button
                    v-if="row.status !== 'SHIPPED'"
                    type="primary"
                    size="small"
                    @click="openShipModal(row)"
                  >
                    录单发货
                  </el-button>
                  <span v-else style="color: #67C23A; font-size: 13px;">✓ 已出库</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- TAB 3: 商品 PIM 与上下架价格配置 -->
        <el-tab-pane label="商品目录与价格管理" name="products">
          <div class="tab-inner">
            <div class="toolbar-row">
              <h3>实木玩具与套件主数据</h3>
              <el-button type="primary" size="small" @click="openAddProductModal">
                + 新建商品
              </el-button>
            </div>

            <el-table :data="productStore.products" border stripe style="width: 100%">
              <el-table-column label="缩略图" width="75">
                <template #default="{ row }">
                  <img :src="row.images[0]" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;" />
                </template>
              </el-table-column>
              <el-table-column prop="sku" label="SKU" width="120" />
              <el-table-column prop="name" label="商品名称" min-width="180" />
              <el-table-column prop="ageRange" label="适合年龄" width="100" />
              <el-table-column prop="price" label="零售指导价" width="110">
                <template #default="{ row }">¥{{ row.price }}</template>
              </el-table-column>
              <el-table-column prop="dealerPrice" label="基准批发价" width="110">
                <template #default="{ row }">
                  <span style="color: #B25E29; font-weight: 600;">¥{{ row.dealerPrice }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="moq" label="起订量" width="80" />
              <el-table-column label="发布状态" width="100">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.published"
                    @change="productStore.togglePublish(row.id)"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Approve Modal -->
    <el-dialog v-model="approveModalVisible" title="审核通过经销商申请" width="480px">
      <div v-if="selectedApp">
        <p style="margin-bottom: 16px;">
          企业主体：<strong>{{ selectedApp.companyName }}</strong> ({{ selectedApp.contactName }})
        </p>

        <el-form label-position="top">
          <el-form-item label="指定经销商授权等级">
            <el-select v-model="approveTier" style="width: 100%;">
              <el-option label="一级核心经销商 (享 6.5 折出厂价)" value="一级核心经销商" />
              <el-option label="二级特约经销商 (享 7.5 折出厂价)" value="二级特约经销商" />
              <el-option label="三级普通分销商 (享 8.5 折出厂价)" value="三级普通分销商" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="approveModalVisible = false">取消</el-button>
        <el-button type="success" @click="confirmApprove">确认通过并生效</el-button>
      </template>
    </el-dialog>

    <!-- Ship Modal -->
    <el-dialog v-model="shipModalVisible" title="录入物流运单并出库发货" width="450px">
      <el-form label-position="top">
        <el-form-item label="承运物流公司">
          <el-select v-model="shipCompany" style="width: 100%;">
            <el-option label="顺丰冷运/特快 (SF Express)" value="顺丰速运" />
            <el-option label="德邦大件物流 (适用于托盘与整箱)" value="德邦物流" />
            <el-option label="中通快运" value="中通快运" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流快递运单号">
          <el-input v-model="shipTrackingNo" placeholder="例如 SF1688992019" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipModalVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmShip">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useDealerStore } from '../stores/dealer'
import { useCartStore } from '../stores/cart'
import { useProductStore } from '../stores/product'
import { useUserStore } from '../stores/user'

const dealerStore = useDealerStore()
const cartStore = useCartStore()
const productStore = useProductStore()
const userStore = useUserStore()

// If not admin, temporarily switch role for convenience
if (!userStore.isAdmin) {
  userStore.switchRole('ADMIN')
}

const activeTab = ref('dealers')

// Approve modal
const approveModalVisible = ref(false)
const selectedApp = ref(null)
const approveTier = ref('一级核心经销商')

function openApproveModal(app) {
  selectedApp.value = app
  approveModalVisible.value = true
}

function confirmApprove() {
  if (!selectedApp.value) return
  const rate = approveTier.value.includes('6.5') ? 0.65 : approveTier.value.includes('7.5') ? 0.75 : 0.85
  dealerStore.approveApplication(selectedApp.value.id, approveTier.value, rate)
  ElMessage.success(`已成功通过【${selectedApp.value.companyName}】的经销商授权！`)
  approveModalVisible.value = false
}

function handleReject(app) {
  dealerStore.rejectApplication(app.id, '资质暂不符合区域代理门槛')
  ElMessage.info('已驳回该申请')
}

// Ship modal
const shipModalVisible = ref(false)
const selectedOrder = ref(null)
const shipCompany = ref('顺丰速运')
const shipTrackingNo = ref(`SF${Math.floor(1000000000 + Math.random() * 9000000000)}`)

function openShipModal(order) {
  selectedOrder.value = order
  shipTrackingNo.value = `SF${Math.floor(1000000000 + Math.random() * 9000000000)}`
  shipModalVisible.value = true
}

function confirmShip() {
  if (!selectedOrder.value) return
  cartStore.updateOrderStatus(selectedOrder.value.orderId, 'SHIPPED', shipTrackingNo.value)
  ElMessage.success(`订单 ${selectedOrder.value.orderId} 已发货完成！`)
  shipModalVisible.value = false
}

function openAddProductModal() {
  ElMessage.info('此为演示系统，已预装 9 款真实商品数据')
}
</script>

<style scoped>
.admin-header {
  background: #1F2937;
  color: #F9FAFB;
  padding: 30px 24px;
}

.admin-header .inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-title-box h1 {
  font-size: 24px;
  margin: 8px 0 4px;
}

.admin-title-box p {
  font-size: 13px;
  color: #9CA3AF;
}

.admin-body {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.admin-tabs {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.tab-inner {
  padding: 16px 8px;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.table-actions {
  display: flex;
  gap: 6px;
}

.done-note {
  font-size: 12px;
  color: #67C23A;
  font-weight: 500;
}
</style>

