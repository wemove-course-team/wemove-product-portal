<template>
  <div class="dealer-portal">
    <div class="portal-header">
      <div class="inner">
        <div class="dealer-meta">
          <span class="badge-dealer">DEALER PORTAL</span>
          <h1>经销商专属采购工作台</h1>
          <div class="company-detail">
            <strong>企业：{{ userStore.userInfo.companyName || '上海晨星益智玩具有限公司' }}</strong>
            <span>| 等级：{{ userStore.userInfo.tierName || '一级核心经销商' }} (全系享 {{ userStore.userInfo.discountRate * 10 }} 折)</span>
            <span>| 状态：<el-tag type="success" size="small">合作授权有效</el-tag></span>
          </div>
        </div>

        <div class="header-tools">
          <el-button @click="$router.push('/cart')">
            查看采购清单 ({{ cartStore.totalCount }})
          </el-button>
          <el-button type="primary" @click="$router.push('/workshop')">
            浏览商品画册
          </el-button>
        </div>
      </div>
    </div>

    <div class="portal-body">
      <!-- Quick Order Section (Key B2B Highlight) -->
      <div class="portal-card">
        <div class="card-title-row">
          <div>
            <h2>Quick Order 快速批量订货单</h2>
            <p class="subtitle">针对常规订货，直接输入多项 SKU 订货数量，一键快速生成大宗订单。</p>
          </div>
          <div class="quick-summary">
            <span class="batch-count">已选：<strong>{{ totalBatchQty }}</strong> 件</span>
            <span class="batch-total">预计总额：<strong>¥{{ totalBatchAmount }}</strong></span>
            <el-button
              type="primary"
              size="large"
              :disabled="totalBatchQty === 0"
              class="batch-add-btn"
              @click="handleBatchAddToCart"
            >
              <el-icon><Plus /></el-icon>
              <span>批量加入采购清单</span>
            </el-button>
          </div>
        </div>

        <!-- Quick Order Table -->
        <el-table :data="quickOrderRows" border stripe style="width: 100%">
          <el-table-column label="商品图片" width="90">
            <template #default="{ row }">
              <img :src="row.product.images[0]" class="prod-table-thumb" />
            </template>
          </el-table-column>

          <el-table-column prop="product.sku" label="SKU 编号" width="130">
            <template #default="{ row }">
              <span class="sku-code">{{ row.product.sku }}</span>
            </template>
          </el-table-column>

          <el-table-column label="产品名称与规格" min-width="220">
            <template #default="{ row }">
              <div class="prod-table-title">{{ row.product.name }}</div>
              <div class="prod-table-meta">{{ row.product.material }} | 箱规: {{ row.product.specs?.casePack || 12 }}件/箱</div>
            </template>
          </el-table-column>

          <el-table-column label="起订量 (MOQ)" width="120">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ row.product.moq || 10 }} 件起订</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="建议零售价" width="120">
            <template #default="{ row }">
              <span class="retail-strike">¥{{ row.product.price }}</span>
            </template>
          </el-table-column>

          <el-table-column label="经销商协议价" width="140">
            <template #default="{ row }">
              <div class="dealer-price-val">¥{{ getRowPrice(row.product) }}</div>
              <div class="discount-pill">立省 ¥{{ row.product.price - getRowPrice(row.product) }}</div>
            </template>
          </el-table-column>

          <el-table-column label="订购数量 (件)" width="180">
            <template #default="{ row }">
              <el-input-number
                v-model="row.qty"
                :min="0"
                :step="row.product.specs?.casePack || 5"
                :max="999"
                size="default"
              />
            </template>
          </el-table-column>

          <el-table-column label="行小计" width="140">
            <template #default="{ row }">
              <span class="row-subtotal">¥{{ getRowPrice(row.product) * row.qty }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Recent Orders for Dealer -->
      <div class="portal-card" style="margin-top: 36px;">
        <div class="card-title-row">
          <div>
            <h2>本企业历史采购订单</h2>
            <p class="subtitle">跟踪订单支付、发货与物流履约状态</p>
          </div>
        </div>

        <el-table :data="cartStore.orders" border style="width: 100%">
          <el-table-column prop="orderId" label="订单号" width="180" />
          <el-table-column prop="createdAt" label="下单时间" width="160" />
          <el-table-column prop="orderType" label="类型" width="150" />
          <el-table-column label="采购明细" min-width="240">
            <template #default="{ row }">
              <div v-for="item in row.items" :key="item.productId" class="order-item-chip">
                {{ item.name }} x {{ item.quantity }}件
              </div>
            </template>
          </el-table-column>
          <el-table-column label="订单金额" width="130">
            <template #default="{ row }">
              <strong style="color: #B25E29;">¥{{ row.totalAmount }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="当前状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'SHIPPED' ? 'success' : 'warning'">
                {{ row.status === 'SHIPPED' ? '已发货' : '待履约/已确认' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="物流单号" width="160">
            <template #default="{ row }">
              <span>{{ row.trackingNo || '暂未派单' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import { useProductStore } from '../stores/product'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()
const cartStore = useCartStore()

// 访问控制由路由守卫完成（/dealer/portal 要求登录）；页面内不再本地切换角色。
// 真实经销商状态（申请/审核/等级）由任务 #90 接入服务端后在此展示。

// Quick order rows
const quickOrderRows = ref(
  productStore.products.map(p => ({
    product: p,
    qty: 0
  }))
)

function getRowPrice(product) {
  return productStore.getProductPrice(product)
}

const totalBatchQty = computed(() => {
  return quickOrderRows.value.reduce((sum, r) => sum + r.qty, 0)
})

const totalBatchAmount = computed(() => {
  return quickOrderRows.value.reduce((sum, r) => sum + r.qty * getRowPrice(r.product), 0)
})

function handleBatchAddToCart() {
  const selected = quickOrderRows.value.filter(r => r.qty > 0)
  if (selected.length === 0) return

  cartStore.batchAddQuickOrder(selected)
  ElMessage.success(`成功批量添加 ${totalBatchQty.value} 件商品至采购清单！`)
  // Reset
  quickOrderRows.value.forEach(r => (r.qty = 0))
  router.push('/cart')
}
</script>

<style scoped>
.portal-header {
  background: linear-gradient(135deg, #FAF8F5 0%, #F1ECE3 100%);
  border-bottom: 1px solid var(--border-color);
  padding: 36px 24px;
}

.portal-header .inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dealer-meta h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-color);
  margin: 8px 0 6px;
}

.company-detail {
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  gap: 8px;
  align-items: center;
}

.portal-body {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 24px 80px;
}

.portal-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 28px;
  box-shadow: var(--shadow-sm);
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-title-row h2 {
  font-size: 20px;
  color: var(--text-color);
  margin-bottom: 4px;
}

.subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.quick-summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.batch-count, .batch-total {
  font-size: 14px;
  color: var(--text-color);
}

.batch-total strong {
  font-size: 20px;
  color: #B25E29;
}

.batch-add-btn {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.prod-table-thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  background: #f7f7f7;
}

.sku-code {
  font-family: monospace;
  font-weight: 600;
  color: var(--text-muted);
}

.prod-table-title {
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.3;
}

.prod-table-meta {
  font-size: 11px;
  color: var(--text-light);
  margin-top: 3px;
}

.retail-strike {
  color: var(--text-light);
  text-decoration: line-through;
  font-size: 13px;
}

.dealer-price-val {
  font-size: 16px;
  font-weight: 700;
  color: #B25E29;
}

.discount-pill {
  font-size: 10px;
  color: #8E7E67;
}

.row-subtotal {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-color);
}

.order-item-chip {
  font-size: 12px;
  color: var(--text-muted);
}
</style>

