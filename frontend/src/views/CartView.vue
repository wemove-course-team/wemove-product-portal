<template>
  <div class="cart-page">
    <div class="page-header">
      <div class="inner">
        <h1>购物车与结算中心</h1>
        <p>核对采购商品规格与数量，填写配送信息完成结算</p>
      </div>
    </div>

    <div class="cart-body">
      <!-- Empty State -->
      <div v-if="cartStore.items.length === 0 && !completedOrder" class="empty-wrap">
        <div class="empty-icon">🛒</div>
        <h2>购物车内暂无商品</h2>
        <p>您可以探索玩具品类中心挑选心仪的实木玩具或教具</p>
        <el-button type="primary" size="large" @click="$router.push('/workshop')">
          去逛逛玩具品类
        </el-button>
      </div>

      <!-- Order Completed State -->
      <div v-else-if="completedOrder" class="order-success-card">
        <div class="icon">✅</div>
        <h2>订单已成功创建！</h2>
        <div class="order-no-box">
          订单编号：<strong>{{ completedOrder.orderId }}</strong>
        </div>
        <p class="order-type-info">
          {{ completedOrder.orderType }} · 支付状态：
          <el-tag type="success">已支付 (模拟闭环)</el-tag>
        </p>

        <div class="order-details-box">
          <div class="detail-line">收货人：{{ completedOrder.customerName }} ({{ completedOrder.customerPhone }})</div>
          <div class="detail-line">企业主体：{{ completedOrder.customerCompany }}</div>
          <div class="detail-line">配送地址：{{ completedOrder.customerAddress }}</div>
          <div class="detail-line total">支付实付：<strong>¥{{ completedOrder.totalAmount }}</strong></div>
        </div>

        <div class="success-actions">
          <el-button size="large" @click="completedOrder = null">继续选购商品</el-button>
          <el-button type="primary" size="large" @click="$router.push('/dealer/portal')">
            查看历史订单
          </el-button>
        </div>
      </div>

      <!-- Cart & Checkout Layout -->
      <div v-else class="cart-checkout-grid">
        <!-- Left: Cart Items List -->
        <div class="cart-list-card">
          <div class="card-head">
            <h3>商品清单 ({{ cartStore.totalCount }} 件)</h3>
            <el-button type="danger" link size="small" @click="cartStore.clearCart">
              清空全部
            </el-button>
          </div>

          <div v-for="item in cartStore.items" :key="item.productId" class="cart-row">
            <img :src="item.image" class="cart-thumb" />
            <div class="cart-info">
              <div class="title-row">
                <span class="prod-title">{{ item.name }}</span>
                <span class="sku-tag">SKU: {{ item.sku }}</span>
              </div>
              <div class="price-row">
                <span class="price-current">¥{{ item.unitPrice }}</span>
                <span v-if="item.isDealerPrice" class="orig-price">¥{{ item.originalPrice }} (指导价)</span>
              </div>
            </div>

            <div class="cart-controls">
              <el-input-number
                v-model="item.quantity"
                :min="1"
                :max="999"
                size="default"
                @change="(val) => cartStore.updateQuantity(item.productId, val)"
              />
              <span class="row-sum">¥{{ item.unitPrice * item.quantity }}</span>
              <el-button
                type="danger"
                link
                @click="cartStore.removeItem(item.productId)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- Right: Checkout & Address Form -->
        <div class="checkout-card">
          <h3>结算与收货信息</h3>

          <el-form label-position="top" class="shipping-form">
            <el-form-item label="收货人姓名">
              <el-input v-model="shipping.name" placeholder="姓名" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="shipping.phone" placeholder="手机号" />
            </el-form-item>
            <el-form-item label="详细配送地址">
              <el-input v-model="shipping.address" type="textarea" :rows="2" placeholder="省市区、详细街道门牌号" />
            </el-form-item>

            <el-form-item label="结算结算方式">
              <el-radio-group v-model="shipping.paymentMethod">
                <el-radio label="SIMULATED_ONLINE">在线快捷支付 (微信/支付宝/银联)</el-radio>
                <el-radio v-if="userStore.isDealer" label="PO">企业对公转账 / 采购账期 (B2B专属)</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>

          <div class="order-summary-block">
            <div class="s-line">
              <span>商品件数：</span>
              <span>{{ cartStore.totalCount }} 件</span>
            </div>
            <div class="s-line">
              <span>运费：</span>
              <span>免运费 (实木包邮)</span>
            </div>
            <div class="s-line total">
              <span>应付金额：</span>
              <strong class="total-price">¥{{ cartStore.totalPrice }}</strong>
            </div>

            <el-button
              type="primary"
              size="large"
              class="pay-btn"
              :loading="isProcessing"
              @click="handlePay"
            >
              一键确认并提交订单
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useCartStore } from '../stores/cart'
import { useUserStore } from '../stores/user'

const cartStore = useCartStore()
const userStore = useUserStore()

const completedOrder = ref(null)
const isProcessing = ref(false)

const shipping = ref({
  name: userStore.userInfo.username || '李经理',
  phone: '13812345678',
  address: '上海市浦东新区张江高科博云路2号3幢5楼',
  paymentMethod: userStore.isDealer ? 'PO' : 'SIMULATED_ONLINE'
})

function handlePay() {
  if (cartStore.items.length === 0) return
  isProcessing.value = true
  setTimeout(() => {
    isProcessing.value = false
    completedOrder.value = cartStore.checkout(shipping.value, shipping.value.paymentMethod)
    ElMessage.success('订单支付与创建成功！')
  }, 700)
}
</script>

<style scoped>
.page-header {
  background: var(--bg-light);
  border-bottom: 1px solid var(--border-color);
  padding: 36px 24px;
}

.page-header .inner {
  max-width: 1280px;
  margin: 0 auto;
}

.page-header h1 {
  font-size: 26px;
  color: var(--text-color);
  margin-bottom: 6px;
}

.page-header p {
  font-size: 14px;
  color: var(--text-muted);
}

.cart-body {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 24px 80px;
}

.empty-wrap {
  text-align: center;
  padding: 80px 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.empty-icon {
  font-size: 56px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-wrap h2 {
  font-size: 20px;
  color: var(--text-color);
  margin-bottom: 8px;
}

.empty-wrap p {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.cart-checkout-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 32px;
}

.cart-list-card, .checkout-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 14px;
  margin-bottom: 18px;
}

.card-head h3 {
  font-size: 17px;
  color: var(--text-color);
}

.cart-row {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.cart-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  background: #f7f7f7;
}

.cart-info {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}

.prod-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.sku-tag {
  font-size: 11px;
  color: var(--text-light);
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price-current {
  font-size: 16px;
  font-weight: 700;
  color: #B25E29;
}

.orig-price {
  font-size: 11px;
  color: var(--text-light);
  text-decoration: line-through;
}

.cart-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.row-sum {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color);
  min-width: 80px;
  text-align: right;
}

.checkout-card h3 {
  font-size: 17px;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.order-summary-block {
  border-top: 1px solid var(--border-color);
  padding-top: 18px;
  margin-top: 18px;
}

.s-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.s-line.total {
  font-size: 16px;
  color: var(--text-color);
  margin-top: 12px;
  margin-bottom: 20px;
}

.total-price {
  font-size: 24px;
  color: #B25E29;
}

.pay-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.order-success-card {
  max-width: 680px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 50px 36px;
  text-align: center;
}

.order-success-card .icon {
  font-size: 54px;
  margin-bottom: 12px;
}

.order-no-box {
  display: inline-block;
  background: var(--bg-light);
  border: 1px solid var(--primary-border);
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 14px;
  margin: 14px 0 16px;
}

.order-details-box {
  background: var(--bg-light);
  border-radius: 10px;
  padding: 16px 20px;
  text-align: left;
  font-size: 13px;
  color: var(--text-muted);
  margin: 20px 0 30px;
}

.detail-line {
  margin-bottom: 6px;
}

.detail-line.total {
  font-size: 15px;
  color: var(--text-color);
  margin-top: 10px;
  border-top: 1px dashed var(--border-color);
  padding-top: 8px;
}

.detail-line.total strong {
  color: #B25E29;
}

.success-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

@media (max-width: 960px) {
  .cart-checkout-grid {
    grid-template-columns: 1fr;
  }
}
</style>

