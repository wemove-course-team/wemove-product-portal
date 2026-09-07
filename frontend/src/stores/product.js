import { defineStore } from 'pinia'
import { ref } from 'vue'
import { productApi } from '../services/product'
import { API_MODE } from '../config/env'

/**
 * 产品目录状态（#87 MVP-03 重写）
 *
 * - 数据唯一来源是真实 API（services/product.js → /api/v1），本地假数据与
 *   localStorage 持久化已全部移除（AI_DEVELOPMENT_RULES 规则 3）
 * - categories/products 在 store 首次实例化时后台预取，供占位页（#88 ContentPage、
 *   #90 DealerPortal）与产品页共用；失败保持空数组，由具体页面呈现错误状态
 * - getProductPrice 以“API 是否在当前会话下返回 dealerPrice”为唯一依据——
 *   经销商价由后端按角色裁剪（决策 D5），前端不做任何本地角色补算
 */
export const useProductStore = defineStore('product', () => {
  const categories = ref([])
  const products = ref([])
  const categoriesError = ref(null)
  const productsError = ref(null)
  const categoriesLoaded = ref(false)
  const productsLoaded = ref(false)
  let categoriesPromise = null

  async function loadCategories(force = false) {
    if (!force && categoriesLoaded.value) return categories.value
    if (!force && categoriesPromise) return categoriesPromise
    categoriesPromise = (async () => {
      try {
        const envelope = await productApi.fetchCategories()
        categories.value = envelope?.data ?? []
        categoriesLoaded.value = true
        categoriesError.value = null
      } catch (err) {
        categoriesLoaded.value = false
        categoriesError.value = err
      } finally {
        categoriesPromise = null
      }
      return categories.value
    })()
    return categoriesPromise
  }

  async function loadProducts(force = false) {
    if (!force && productsLoaded.value) return products.value
    try {
      // 预取一页最大数量（≤50），供占位页与对比等本地功能消费
      const envelope = await productApi.fetchProducts({ page: 1, pageSize: 50 })
      products.value = envelope?.data?.items ?? []
      productsLoaded.value = true
      productsError.value = null
    } catch (err) {
      productsError.value = err
    }
    return products.value
  }

  // 占位页兼容：ContentPage 相关产品位读取 p.images[0]/p.ageRange（#88 重构时移除）
  function toLegacyShape(item) {
    return {
      ...item,
      images: item.coverImage ? [item.coverImage] : [],
      ageRange: item.ageRange ?? ''
    }
  }

  if (API_MODE !== 'mock') {
    loadCategories().catch(() => {})
    loadProducts()
      .then((list) => {
        products.value = list.map(toLegacyShape)
      })
      .catch(() => {})
  }

  /**
   * 展示价：API 返回了 dealerPrice（当前会话被服务端判定为经销商/管理员）则展示
   * 协议结算价，否则展示零售指导价。
   */
  function getProductPrice(product) {
    if (!product) return 0
    if (product.dealerPrice != null) return Number(product.dealerPrice)
    return Number(product.price || 0)
  }

  return {
    categories,
    products,
    categoriesError,
    productsError,
    categoriesLoaded,
    productsLoaded,
    loadCategories,
    loadProducts,
    getProductPrice
  }
})
