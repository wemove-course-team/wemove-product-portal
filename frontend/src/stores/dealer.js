import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dealerApi } from '../services/dealer'

export const useDealerStore = defineStore('dealer', () => {
  const applications = ref([])
  const portalData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function submitApplication(payload) {
    return run(async () => {
      const result = await dealerApi.createApplication(payload)
      const application = result?.data || null
      if (application) applications.value.unshift(application)
      return application
    })
  }

  async function fetchMine() {
    return run(async () => {
      const result = await dealerApi.myApplications()
      applications.value = result?.data || []
      return applications.value
    })
  }

  async function fetchPortal() {
    return run(async () => {
      const result = await dealerApi.portal()
      portalData.value = result?.data || null
      applications.value = portalData.value?.applications || []
      return portalData.value
    })
  }

  async function fetchAdminApplications(params) {
    const result = await dealerApi.adminApplications(params)
    return result?.data || { items: [], total: 0, page: 1, pageSize: 10 }
  }

  async function reviewApplication(id, payload) {
    const result = await dealerApi.reviewApplication(id, payload)
    return result?.data || null
  }

  async function run(action) {
    loading.value = true
    error.value = null
    try {
      return await action()
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    applications,
    portalData,
    loading,
    error,
    submitApplication,
    fetchMine,
    fetchPortal,
    fetchAdminApplications,
    reviewApplication
  }
})
