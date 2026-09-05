<template>
  <el-drawer
    v-model="visible"
    title="购物车 / 采购清单"
    direction="rtl"
    size="400px"
    append-to-body
    class="cart-drawer"
  >
    <div class="cart-drawer-content">
      <div v-if="cartStore.items.length === 0" class="cart-empty">
        <div class="empty-icon">🛒</div>
        <div class="empty-text">您的购物车还是空的</div>
        <el-button type="primary" plain size="small" @click="goShopping">前往探索商品</el-button>
      </div>

      <div v-else class="cart-items-wrap">
        <!-- Role Pricing Banner -->
        <div v-if="userStore.isDealer" class="dealer-pricing-alert">
          <el-icon><Discount /></el-icon>
          <span>已生效【{{ userStore.userInfo.tierName }}】折扣 ({{ userStore.userInfo.discountRate * 10 }}折)</span>
        </div>

        <div v-for="item in cartStore.items" :key="item.productId" class="cart-item">
          <img :src="item.image" :alt="item.name" class="item-img" />
          <div class="item-details">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-sku">SKU: {{ item.sku }}</div>
            <div class="item-price-row">
              <span class="current-price">¥{{ item.unitPrice }}</span>
              <span v-if="item.isDealerPrice" class="orig-price">¥{{ item.originalPrice }}</span>
            </div>
            <div class="item-control-row">
              <el-input-number
                v-model="item.quantity"
                :min="1"
                :max="999"
                size="small"
                @change="(val) => cartStore.updateQuantity(item.productId, val)"
              />
              <el-button
                type="danger"
                link
                size="small"
                @click="cartStore.removeItem(item.productId)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Drawer Footer -->
      <div v-if="cartStore.items.length > 0" class="drawer-footer">
        <div class="summary-line">
          <span>商品件数：</span>
          <strong>{{ cartStore.totalCount }} 件</strong>
        </div>
        <div class="summary-line total">
          <span>总计金额：</span>
          <strong class="total-num">¥{{ cartStore.totalPrice }}</strong>
        </div>
        <div class="footer-actions">
          <el-button size="large" @click="viewFullCart">查看全页购物车</el-button>
          <el-button type="primary" size="large" class="checkout-btn" @click="handleCheckout">
            立即去结算
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useUserStore } from '../stores/user'

const visible = ref(false)
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

function open() {
  visible.value = true
}

function close() {
  visible.value = false
}

function goShopping() {
  close()
  router.push('/workshop')
}

function viewFullCart() {
  close()
  router.push('/cart')
}

function handleCheckout() {
  close()
  router.push('/cart')
}

defineExpose({ open, close })
</script>

<style scoped>
.cart-drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cart-items-wrap {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.dealer-pricing-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #FDF9F2;
  border: 1px solid #EFE4D2;
  color: #9C7844;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
}

.cart-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.item-img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  background: #f7f7f7;
}

.item-details {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.3;
  margin-bottom: 2px;
}

.item-sku {
  font-size: 11px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.item-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.current-price {
  font-size: 15px;
  font-weight: 700;
  color: #B25E29;
}

.orig-price {
  font-size: 12px;
  color: var(--text-light);
  text-decoration: line-through;
}

.item-control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-footer {
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
  margin-top: 12px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.summary-line.total {
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 16px;
}

.total-num {
  font-size: 20px;
  color: #B25E29;
}

.footer-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.checkout-btn {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.cart-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-light);
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}
</style>

