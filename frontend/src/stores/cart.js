import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import { useProductStore } from './product'

export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore()
  const productStore = useProductStore()

  const items = ref(JSON.parse(localStorage.getItem('wemove_cart_items') || '[]'))
  const orders = ref(JSON.parse(localStorage.getItem('wemove_orders') || '[]'))

  function saveCart() {
    localStorage.setItem('wemove_cart_items', JSON.stringify(items.value))
  }

  function saveOrders() {
    localStorage.setItem('wemove_orders', JSON.stringify(orders.value))
  }

  const totalCount = computed(() => {
    return items.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  })

  function addToCart(product, quantity = 1) {
    const unitPrice = productStore.getProductPrice(product)
    const existing = items.value.find(item => item.productId === product.id)
    if (existing) {
      existing.quantity += quantity
      existing.unitPrice = unitPrice // Update to current role's price
    } else {
      items.value.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        image: product.images[0] || '/images/prod_20_1.jpg',
        unitPrice,
        originalPrice: product.price,
        isDealerPrice: userStore.isDealer,
        quantity
      })
    }
    saveCart()
  }

  // B2B Quick Order batch addition
  function batchAddQuickOrder(quickItems) {
    // quickItems: [{ product, qty }]
    for (const entry of quickItems) {
      if (entry.qty > 0) {
        addToCart(entry.product, entry.qty)
      }
    }
  }

  function updateQuantity(productId, qty) {
    const item = items.value.find(i => i.productId === productId)
    if (item) {
      if (qty <= 0) {
        removeItem(productId)
      } else {
        item.quantity = qty
        saveCart()
      }
    }
  }

  function removeItem(productId) {
    items.value = items.value.filter(i => i.productId !== productId)
    saveCart()
  }

  function clearCart() {
    items.value = []
    saveCart()
  }

  // Create Order (Simulated Checkout)
  function checkout(shippingInfo, paymentMethod = 'SIMULATED_ONLINE') {
    if (items.value.length === 0) return null

    const orderId = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(10000 + Math.random() * 90000)}`
    const isB2B = userStore.isDealer

    const newOrder = {
      orderId,
      createdAt: new Date().toLocaleString(),
      customerName: shippingInfo.name || userStore.userInfo.username,
      customerCompany: userStore.userInfo.companyName || '个人买家',
      customerPhone: shippingInfo.phone || '138****8888',
      customerAddress: shippingInfo.address || '浙江省杭州市西湖区文三路88号',
      orderType: isB2B ? 'B2B 经销商批量采购' : 'B2C 零售订单',
      items: JSON.parse(JSON.stringify(items.value)),
      totalAmount: totalPrice.value,
      totalCount: totalCount.value,
      paymentMethod: isB2B ? (paymentMethod === 'PO' ? '企业账期/对公转账' : '在线快捷支付') : '在线模拟支付',
      status: isB2B ? 'CONFIRMED' : 'PAID', // B2B direct Confirmed, B2C Paid
      trackingNo: null
    }

    orders.value.unshift(newOrder)
    saveOrders()
    clearCart()
    return newOrder
  }

  // Admin order status update
  function updateOrderStatus(orderId, newStatus, trackingNo = null) {
    const o = orders.value.find(item => item.orderId === orderId)
    if (o) {
      o.status = newStatus
      if (trackingNo) o.trackingNo = trackingNo
      saveOrders()
    }
  }

  // Seed default orders if empty for demo presentation
  if (orders.value.length === 0) {
    orders.value = [
      {
        orderId: 'ORD-202609-88102',
        createdAt: '2026-09-04 15:30:12',
        customerName: '李经理',
        customerCompany: '上海晨星益智玩具有限公司',
        customerPhone: '13812345678',
        customerAddress: '上海市浦东新区张江高科技园区博云路2号3幢',
        orderType: 'B2B 经销商批量采购',
        items: [
          {
            productId: 101,
            sku: 'WM-BWL-01',
            name: '儿童实木保龄球套装 (Mini Bowling Set)',
            image: '/images/prod_20_1.jpg',
            unitPrice: 118,
            quantity: 30
          },
          {
            productId: 102,
            sku: 'WM-BLC-02',
            name: '极简弧形摇摆平衡板 (Wobble Balance Board)',
            image: '/images/prod_19_1.jpg',
            unitPrice: 160,
            quantity: 20
          }
        ],
        totalAmount: 6740,
        totalCount: 50,
        paymentMethod: '企业对公转账',
        status: 'CONFIRMED',
        trackingNo: 'SF14285789230'
      }
    ]
    saveOrders()
  }

  return {
    items,
    orders,
    totalCount,
    totalPrice,
    addToCart,
    batchAddQuickOrder,
    updateQuantity,
    removeItem,
    clearCart,
    checkout,
    updateOrderStatus
  }
})

