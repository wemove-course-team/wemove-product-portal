<template>
  <div class="operation-page">
    <div class="page-heading">
      <div>
        <p class="eyebrow">MVP-07</p>
        <h1>站点运营</h1>
        <p>统一维护官网品牌信息、联系信息与首页 Banner，保存后前台刷新即可生效。</p>
      </div>
      <el-button :loading="loading" @click="loadAll"><el-icon><Refresh /></el-icon>刷新</el-button>
    </div>

    <el-alert v-if="error" type="error" :closable="false" show-icon :title="error.message || '运营数据加载失败'" />

    <el-tabs v-model="activeTab" class="operation-card">
      <el-tab-pane label="站点配置" name="config">
        <el-form ref="configFormRef" :model="configForm" :rules="configRules" label-position="top" v-loading="loading">
          <div class="config-grid">
            <section class="config-section">
              <h2>品牌信息</h2>
              <el-form-item label="站点名称" prop="siteName">
                <el-input v-model="configForm.siteName" maxlength="255" show-word-limit />
              </el-form-item>
              <el-form-item label="Logo 地址" prop="logoUrl">
                <div class="logo-field">
                  <el-input v-model="configForm.logoUrl" placeholder="/logo.svg 或 https://..." />
                  <div class="logo-preview">
                    <img v-if="configForm.logoUrl" :src="configForm.logoUrl" alt="Logo 预览" />
                    <span v-else>暂无</span>
                  </div>
                </div>
              </el-form-item>
            </section>

            <section class="config-section">
              <h2>联系方式</h2>
              <div class="field-grid">
                <el-form-item label="联系电话" prop="contactPhone"><el-input v-model="configForm.contactPhone" maxlength="32" /></el-form-item>
                <el-form-item label="联系邮箱" prop="contactEmail"><el-input v-model="configForm.contactEmail" maxlength="128" /></el-form-item>
              </div>
              <el-form-item label="联系地址" prop="address"><el-input v-model="configForm.address" maxlength="255" /></el-form-item>
            </section>

            <section class="config-section config-section-wide">
              <h2>合规与页脚</h2>
              <div class="field-grid">
                <el-form-item label="页脚文案"><el-input v-model="configForm.footerText" maxlength="255" /></el-form-item>
                <el-form-item label="ICP备案号"><el-input v-model="configForm.icpNo" maxlength="255" /></el-form-item>
              </div>
            </section>
          </div>

          <div class="form-actions">
            <span class="save-hint">仅允许保存后端白名单中的 7 个配置键</span>
            <div>
              <el-button :disabled="saving" @click="resetConfig">重置</el-button>
              <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
            </div>
          </div>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="首页 Banner" name="banners">
        <div class="banner-toolbar">
          <p>共 {{ banners.length }} 条，修改排序值后点击“保存排序”。</p>
          <div>
            <el-button :disabled="!banners.length" :loading="sorting" @click="saveSort">保存排序</el-button>
            <el-button type="primary" @click="openBanner()"><el-icon><Plus /></el-icon>新增 Banner</el-button>
          </div>
        </div>

        <el-table v-loading="loading" :data="banners" empty-text="暂无 Banner，请先新增">
          <el-table-column label="预览" width="150">
            <template #default="{ row }"><img :src="row.imageUrl" :alt="row.title" class="banner-thumb" /></template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="linkUrl" label="跳转链接" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ row.linkUrl || '无' }}</template>
          </el-table-column>
          <el-table-column label="排序" width="110">
            <template #default="{ row }"><el-input-number v-model="row.sortOrder" :min="0" :max="9999" controls-position="right" /></template>
          </el-table-column>
          <el-table-column label="启用" width="90">
            <template #default="{ row }"><el-switch v-model="row.isActive" @change="toggleBanner(row)" /></template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openBanner(row)">编辑</el-button>
              <el-button link type="danger" @click="removeBanner(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="bannerDialog" :title="bannerForm.id ? '编辑 Banner' : '新增 Banner'" width="620px" append-to-body>
      <el-form ref="bannerFormRef" :model="bannerForm" :rules="bannerRules" label-position="top">
        <el-form-item label="标题" prop="title"><el-input v-model="bannerForm.title" maxlength="128" show-word-limit /></el-form-item>
        <el-form-item label="图片地址" prop="imageUrl"><el-input v-model="bannerForm.imageUrl" placeholder="/images/... 或 https://..." /></el-form-item>
        <div v-if="bannerForm.imageUrl" class="dialog-preview"><img :src="bannerForm.imageUrl" alt="Banner 图片预览" /></div>
        <el-form-item label="跳转链接" prop="linkUrl"><el-input v-model="bannerForm.linkUrl" maxlength="255" placeholder="可留空；/products 或 https://..." /></el-form-item>
        <div class="field-grid">
          <el-form-item label="排序值"><el-input-number v-model="bannerForm.sortOrder" :min="0" :max="9999" /></el-form-item>
          <el-form-item label="启用状态"><el-switch v-model="bannerForm.isActive" active-text="启用" inactive-text="停用" /></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="bannerDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveBanner">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { operationApi } from '../../services/operation'
import { useSiteStore } from '../../stores/site'
import { normalizeSiteConfig, toBannerSortItems } from '../../utils/operation'

const siteStore = useSiteStore()
const activeTab = ref('config')
const loading = ref(false)
const saving = ref(false)
const sorting = ref(false)
const error = ref(null)
const configFormRef = ref(null)
const bannerFormRef = ref(null)
const bannerDialog = ref(false)
const banners = ref([])
const configForm = reactive(normalizeSiteConfig())
let configSnapshot = normalizeSiteConfig()
let originalBannerActive = true

const bannerForm = reactive({ id: null, title: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true })
const bannerRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }, { min: 2, max: 128, message: '标题长度为 2–128 个字符', trigger: 'blur' }],
  imageUrl: [{ required: true, message: '请输入图片地址', trigger: 'blur' }, { validator: validateAssetUrl, trigger: 'blur' }],
  linkUrl: [{ validator: validateOptionalUrl, trigger: 'blur' }]
}
const configRules = {
  siteName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }, { min: 2, max: 255, message: '站点名称长度为 2–255 个字符', trigger: 'blur' }],
  logoUrl: [{ required: true, message: '请输入 Logo 地址', trigger: 'blur' }, { validator: validateAssetUrl, trigger: 'blur' }],
  contactPhone: [{ pattern: /^[0-9+\-()\s]{6,32}$/, message: '联系电话格式不正确', trigger: 'blur' }],
  contactEmail: [{ type: 'email', message: '联系邮箱格式不正确', trigger: 'blur' }],
  address: [{ max: 255, message: '联系地址不能超过 255 个字符', trigger: 'blur' }]
}

function isAllowedUrl(value) {
  const text = String(value || '').trim()
  return text.startsWith('/') || /^https:\/\/[^\s]+$/i.test(text)
}
function validateAssetUrl(_rule, value, done) { isAllowedUrl(value) ? done() : done(new Error('请使用站内绝对路径或 HTTPS 地址')) }
function validateOptionalUrl(_rule, value, done) { !String(value || '').trim() || isAllowedUrl(value) ? done() : done(new Error('请使用站内绝对路径或 HTTPS 地址')) }

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [configResponse, bannerResponse] = await Promise.all([
      operationApi.adminConfig(),
      operationApi.adminBanners()
    ])
    configSnapshot = normalizeSiteConfig(configResponse.data)
    Object.assign(configForm, configSnapshot)
    banners.value = Array.isArray(bannerResponse.data) ? bannerResponse.data : []
    siteStore.applyConfig(configResponse.data)
    siteStore.applyBanners(banners.value.filter((banner) => banner.isActive))
  } catch (reason) {
    error.value = reason
  } finally {
    loading.value = false
  }
}

function resetConfig() {
  Object.assign(configForm, configSnapshot)
}

async function saveConfig() {
  if (!(await configFormRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    const response = await operationApi.updateConfig({ ...configForm })
    configSnapshot = normalizeSiteConfig(response.data)
    Object.assign(configForm, configSnapshot)
    siteStore.applyConfig(response.data)
    ElMessage.success('站点配置已保存')
  } catch (reason) {
    ElMessage.error(reason.message || '站点配置保存失败')
  } finally {
    saving.value = false
  }
}

function openBanner(row = null) {
  const value = row || { id: null, title: '', imageUrl: '', linkUrl: '', sortOrder: 0, isActive: true }
  Object.assign(bannerForm, { ...value, linkUrl: value.linkUrl || '' })
  originalBannerActive = Boolean(value.isActive)
  bannerDialog.value = true
}

async function saveBanner() {
  if (!(await bannerFormRef.value?.validate().catch(() => false))) return
  saving.value = true
  try {
    const payload = {
      title: bannerForm.title.trim(),
      imageUrl: bannerForm.imageUrl.trim(),
      linkUrl: bannerForm.linkUrl.trim() || null,
      sortOrder: Number(bannerForm.sortOrder) || 0
    }
    if (bannerForm.id) {
      await operationApi.updateBanner(bannerForm.id, payload)
      if (Boolean(bannerForm.isActive) !== originalBannerActive) {
        await operationApi.updateBannerStatus(bannerForm.id, Boolean(bannerForm.isActive))
      }
    } else {
      await operationApi.createBanner({ ...payload, isActive: Boolean(bannerForm.isActive) })
    }
    ElMessage.success('Banner 已保存')
    bannerDialog.value = false
    await loadAll()
  } catch (reason) {
    ElMessage.error(reason.message || 'Banner 保存失败')
  } finally {
    saving.value = false
  }
}

async function toggleBanner(row) {
  const target = Boolean(row.isActive)
  try {
    await operationApi.updateBannerStatus(row.id, target)
    siteStore.applyBanners(banners.value.filter((banner) => banner.isActive))
    ElMessage.success(target ? 'Banner 已启用' : 'Banner 已停用')
  } catch (reason) {
    row.isActive = !target
    ElMessage.error(reason.message || 'Banner 状态更新失败')
  }
}

async function saveSort() {
  sorting.value = true
  try {
    const response = await operationApi.sortBanners(toBannerSortItems(banners.value))
    banners.value = response.data || []
    siteStore.applyBanners(banners.value.filter((banner) => banner.isActive))
    ElMessage.success('Banner 排序已保存')
  } catch (reason) {
    ElMessage.error(reason.message || 'Banner 排序保存失败')
  } finally {
    sorting.value = false
  }
}

async function removeBanner(row) {
  try {
    await ElMessageBox.confirm(`确定删除“${row.title}”吗？`, '删除 Banner', { type: 'warning' })
    await operationApi.deleteBanner(row.id)
    ElMessage.success('Banner 已删除')
    await loadAll()
  } catch (reason) {
    if (reason !== 'cancel' && reason !== 'close') ElMessage.error(reason.message || '删除失败')
  }
}

onMounted(loadAll)
</script>

<style scoped>
.operation-page { min-width: 0; }
.page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.eyebrow { margin: 0 0 5px; color: var(--primary-color); font-size: 11px; font-weight: 700; letter-spacing: 1.5px; }
.page-heading h1 { margin: 0; font-size: 24px; }
.page-heading p:last-child { margin: 6px 0 0; color: var(--text-muted); font-size: 13px; }
.operation-card { margin-top: 16px; padding: 0 22px 22px; background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.config-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
.config-section { padding: 18px; background: var(--bg-light); border: 1px solid var(--border-color); border-radius: var(--radius-md); }
.config-section-wide { grid-column: 1 / -1; }
.config-section h2 { margin: 0 0 16px; font-size: 16px; }
.field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.logo-field { display: flex; align-items: center; gap: 12px; width: 100%; }
.logo-preview { width: 54px; height: 54px; flex: 0 0 54px; display: grid; place-items: center; overflow: hidden; color: var(--text-light); font-size: 11px; background: #fff; border: 1px solid var(--border-color); border-radius: 10px; }
.logo-preview img { width: 40px; height: 40px; object-fit: contain; }
.form-actions { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border-color); }
.save-hint, .banner-toolbar p { color: var(--text-light); font-size: 12px; }
.banner-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.banner-thumb { display: block; width: 116px; height: 58px; object-fit: cover; border-radius: 8px; background: var(--bg-light); }
.dialog-preview { margin: -8px 0 18px; padding: 10px; background: var(--bg-light); border-radius: 10px; }
.dialog-preview img { display: block; width: 100%; max-height: 210px; object-fit: cover; border-radius: 8px; }
@media (max-width: 768px) {
  .page-heading, .banner-toolbar, .form-actions { align-items: flex-start; flex-direction: column; }
  .config-grid, .field-grid { grid-template-columns: 1fr; }
  .config-section-wide { grid-column: auto; }
  .operation-card { padding: 0 12px 16px; }
  .banner-toolbar > div { display: flex; flex-wrap: wrap; gap: 8px; }
}
</style>
