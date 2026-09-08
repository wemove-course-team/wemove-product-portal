import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { operationApi } from '../services/operation'
import { DEFAULT_SITE_CONFIG, normalizeSiteConfig } from '../utils/operation'

/** 官网公开站点信息；同一轮加载由 Promise 复用，避免 Header、Footer、首页重复请求。 */
export const useSiteStore = defineStore('site', () => {
  const config = ref({ ...DEFAULT_SITE_CONFIG })
  const banners = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref(null)
  let requestPromise = null

  async function loadPublic(force = false) {
    if (loaded.value && !force) return
    if (requestPromise && !force) return requestPromise
    loading.value = true
    error.value = null
    requestPromise = Promise.all([operationApi.publicConfig(), operationApi.publicBanners()])
      .then(([configResponse, bannerResponse]) => {
        config.value = normalizeSiteConfig(configResponse?.data)
        banners.value = Array.isArray(bannerResponse?.data) ? bannerResponse.data : []
        loaded.value = true
      })
      .catch((reason) => {
        error.value = reason
        throw reason
      })
      .finally(() => {
        loading.value = false
        requestPromise = null
      })
    return requestPromise
  }

  function applyConfig(value) {
    config.value = normalizeSiteConfig(value)
    loaded.value = true
  }

  function applyBanners(value) {
    banners.value = Array.isArray(value) ? value : []
    loaded.value = true
  }

  const siteName = computed(() => config.value.siteName || DEFAULT_SITE_CONFIG.siteName)
  const logoUrl = computed(() => config.value.logoUrl || DEFAULT_SITE_CONFIG.logoUrl)

  return {
    config,
    banners,
    loading,
    loaded,
    error,
    siteName,
    logoUrl,
    loadPublic,
    applyConfig,
    applyBanners
  }
})
