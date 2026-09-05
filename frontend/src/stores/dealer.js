import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dealerApi } from '../services/dealer'

export const useDealerStore = defineStore('dealer', () => {
  const applications = ref([])
  const portalData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function submitApplication(payload) {
    loading.value = true; error.value = null
    try { const result = await dealerApi.createApplication(payload); const app = result?.data || null; if (app) applications.value.unshift(app); return app }
    catch (err) { error.value = err; throw err }
    finally { loading.value = false }
  }

  async function fetchMine() {
    loading.value = true; error.value = null
    try { const result = await dealerApi.myApplications(); applications.value = result?.data || []; return applications.value }
    catch (err) { error.value = err; throw err }
    finally { loading.value = false }
  }

  async function fetchPortal() {
    loading.value = true; error.value = null
    try { const result = await dealerApi.portal(); portalData.value = result?.data || null; applications.value = portalData.value?.applications || []; return portalData.value }
    catch (err) { error.value = err; throw err }
    finally { loading.value = false }
  }

  async function fetchAdminApplications(params) { const result = await dealerApi.adminApplications(params); return result?.data || { items: [], total: 0, page: 1, pageSize: 10 } }
  async function reviewApplication(id, payload) { const result = await dealerApi.reviewApplication(id, payload); return result?.data || null }

  return { applications, portalData, loading, error, submitApplication, fetchMine, fetchPortal, fetchAdminApplications, reviewApplication }
})

