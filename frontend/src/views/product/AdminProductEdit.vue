<template>
  <div class="admin-product-edit">
    <header class="page-head">
      <div>
        <h1 class="page-title">{{ isEdit ? '编辑产品' : '新增产品' }}</h1>
        <p class="page-sub">
          {{ isEdit ? `当前编辑：${form.sku || ''}` : '填写产品基础信息、图片与规格参数' }}
          · 图片路径引用 frontend/public/images/ 既有素材（决策 D10：本轮不做上传）
        </p>
      </div>
      <el-button @click="$router.push('/admin/products')">返回列表</el-button>
    </header>

    <!-- 编辑模式先加载详情（AsyncState 呈现 loading/404/error）；新建模式直接渲染表单 -->
    <AsyncState v-if="!formReady" :loading="loading" :error="loadError" @retry="loadProduct">
      <span></span>
    </AsyncState>

    <el-form v-else :model="form" label-width="110px" class="edit-form">
      <div class="form-grid">
        <section class="form-card">
          <h3 class="card-title">基础信息</h3>
          <el-form-item label="产品名称" required>
            <el-input v-model="form.name" maxlength="128" show-word-limit placeholder="例如：儿童实木保龄球套装" />
          </el-form-item>
          <el-form-item label="SKU" required>
            <el-input v-model="form.sku" maxlength="64" placeholder="例如：WM-BWL-01（全局唯一）" />
          </el-form-item>
          <el-form-item label="slug（URL 标识）">
            <el-input v-model="form.slug" maxlength="128" placeholder="留空则按 SKU 自动生成，仅字母/数字/中划线" />
          </el-form-item>
          <el-form-item label="所属分类" required>
            <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
              <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="Number(c.id)" />
            </el-select>
          </el-form-item>
          <el-form-item label="卖点摘要">
            <el-input v-model="form.summary" type="textarea" :rows="2" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="详细介绍">
            <el-input v-model="form.description" type="textarea" :rows="4" placeholder="产品详细介绍与玩法说明" />
          </el-form-item>
        </section>

        <section class="form-card">
          <h3 class="card-title">价格与起订</h3>
          <el-form-item label="零售指导价（¥）" required>
            <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 200px" />
          </el-form-item>
          <el-form-item label="经销商价（¥）" required>
            <el-input-number v-model="form.dealerPrice" :min="0" :precision="2" style="width: 200px" />
            <div class="field-hint">仅 DEALER/ADMIN 会话可在详情接口获取（服务端裁剪）</div>
          </el-form-item>
          <el-form-item label="起订量 MOQ">
            <el-input-number v-model="form.moq" :min="1" style="width: 200px" />
          </el-form-item>
          <el-form-item label="上架状态">
            <el-radio-group v-model="form.isPublished">
              <el-radio :value="1">发布</el-radio>
              <el-radio :value="0">草稿（不在官网展示）</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="首页精选">
            <el-switch v-model="form.featuredBool" active-text="精选展示" />
          </el-form-item>
          <el-form-item label="营销标签">
            <el-input v-model="form.tag" maxlength="32" placeholder="例如：热销爆款 / 新品推荐" />
          </el-form-item>

          <h3 class="card-title second">展示属性</h3>
          <el-form-item label="建议年龄">
            <el-input v-model="form.ageRange" maxlength="64" placeholder="例如：3-10岁" />
          </el-form-item>
          <el-form-item label="主要材质">
            <el-input v-model="form.material" maxlength="128" placeholder="例如：天然优质实木 / 水性环保漆" />
          </el-form-item>
          <el-form-item label="适用场景">
            <el-input v-model="form.scene" maxlength="255" placeholder="例如：室内亲子 / 幼儿园活动" />
          </el-form-item>
        </section>
      </div>

      <section class="form-card">
        <h3 class="card-title">产品图片（多图，第一张为主图）</h3>
        <div v-for="(img, index) in form.images" :key="index" class="image-row">
          <el-input v-model="form.images[index]" placeholder="/images/prod_20_1.jpg">
            <template #prepend>图 {{ index + 1 }}</template>
          </el-input>
          <img v-if="form.images[index]" :src="form.images[index]" class="image-preview" alt="预览" />
          <el-button link type="danger" @click="form.images.splice(index, 1)">移除</el-button>
        </div>
        <el-button plain @click="form.images.push('')">+ 添加图片路径</el-button>
      </section>

      <section class="form-card">
        <h3 class="card-title">规格与装箱参数（结构化 JSON）</h3>
        <div class="specs-grid">
          <el-form-item label="产品尺寸">
            <el-input v-model="specs.dimensions" placeholder="例如：83cm x 30cm x 1.8cm" />
          </el-form-item>
          <el-form-item label="产品净重">
            <el-input v-model="specs.netWeight" placeholder="例如：3.1 kg" />
          </el-form-item>
          <el-form-item label="包装尺寸">
            <el-input v-model="specs.packageDimensions" placeholder="例如：86 x 32 x 20 cm" />
          </el-form-item>
          <el-form-item label="装箱数（件/箱）">
            <el-input-number v-model="specs.casePack" :min="0" style="width: 160px" />
          </el-form-item>
          <el-form-item label="包装内含">
            <el-input v-model="specs.includedItems" placeholder="逗号分隔，例如：实木球瓶 x10, 保龄球 x2" />
          </el-form-item>
        </div>
      </section>

      <div class="form-actions">
        <el-button @click="$router.push('/admin/products')">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">
          {{ isEdit ? '保存修改' : '创建产品' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { productApi } from '../../services/product'
import AsyncState from '../../components/AsyncState.vue'

/**
 * 后台产品新增/编辑（#87 MVP-03）：/admin/products/new、/admin/products/:id/edit。
 * 编辑数据走 GET /admin/products/:id（草稿可编辑）；409 冲突（SKU/slug 重复）展示后端文案。
 */
const route = useRoute()
const router = useRouter()

const productId = computed(() => (route.params.id ? String(route.params.id) : null))
const isEdit = computed(() => Boolean(productId.value))

const loading = ref(false)
const loadError = ref(null)
const loaded = ref(false)
const saving = ref(false)
const categories = ref([])

const form = reactive({
  name: '',
  sku: '',
  slug: '',
  categoryId: null,
  summary: '',
  description: '',
  price: 0,
  dealerPrice: 0,
  moq: 10,
  isPublished: 1,
  featuredBool: false,
  tag: '',
  ageRange: '',
  material: '',
  scene: '',
  images: []
})

const specs = reactive({
  dimensions: '',
  netWeight: '',
  packageDimensions: '',
  casePack: 0,
  includedItems: ''
})

const formReady = computed(() => !isEdit.value || (loaded.value && !loadError.value))

async function loadCategories() {
  try {
    const envelope = await productApi.fetchAdminCategories()
    categories.value = envelope?.data ?? []
  } catch (err) {
    ElMessage.error(err?.message || '分类加载失败')
  }
}

async function loadProduct() {
  loading.value = true
  loadError.value = null
  try {
    const envelope = await productApi.fetchAdminProduct(productId.value)
    const p = envelope?.data
    if (p) {
      form.name = p.name ?? ''
      form.sku = p.sku ?? ''
      form.slug = p.slug ?? ''
      form.categoryId = p.categoryId ? Number(p.categoryId) : null
      form.summary = p.summary ?? ''
      form.description = p.description ?? ''
      form.price = Number(p.price ?? 0)
      form.dealerPrice = Number(p.dealerPrice ?? 0)
      form.moq = Number(p.moq ?? 10)
      form.isPublished = Number(p.isPublished ?? 1)
      form.featuredBool = Number(p.isFeatured) === 1
      form.tag = p.tag ?? ''
      form.ageRange = p.ageRange ?? ''
      form.material = p.material ?? ''
      form.scene = p.scene ?? ''
      form.images = Array.isArray(p.images) ? [...p.images] : []
      const s = p.specs || {}
      specs.dimensions = s.dimensions ?? ''
      specs.netWeight = s.netWeight ?? ''
      specs.packageDimensions = s.packageDimensions ?? ''
      specs.casePack = Number(s.casePack ?? 0)
      specs.includedItems = s.includedItems ?? ''
    }
    loaded.value = true
  } catch (err) {
    loadError.value = err
  } finally {
    loading.value = false
  }
}

function buildPayload() {
  const images = form.images.map((url) => String(url).trim()).filter(Boolean)
  const specObject = {}
  if (specs.dimensions) specObject.dimensions = specs.dimensions
  if (specs.netWeight) specObject.netWeight = specs.netWeight
  if (specs.packageDimensions) specObject.packageDimensions = specs.packageDimensions
  if (specs.casePack) specObject.casePack = Number(specs.casePack)
  if (specs.includedItems) specObject.includedItems = specs.includedItems

  const payload = {
    name: form.name.trim(),
    sku: form.sku.trim(),
    categoryId: form.categoryId,
    price: form.price,
    dealerPrice: form.dealerPrice,
    moq: form.moq,
    isPublished: form.isPublished,
    isFeatured: form.featuredBool ? 1 : 0,
    images,
    specs: specObject
  }
  if (form.slug.trim()) payload.slug = form.slug.trim()
  if (form.summary.trim()) payload.summary = form.summary.trim()
  if (form.description.trim()) payload.description = form.description.trim()
  if (form.tag.trim()) payload.tag = form.tag.trim()
  if (form.ageRange.trim()) payload.ageRange = form.ageRange.trim()
  if (form.material.trim()) payload.material = form.material.trim()
  if (form.scene.trim()) payload.scene = form.scene.trim()
  return payload
}

function validateLocal() {
  if (!form.name.trim()) return '请填写产品名称'
  if (!form.sku.trim()) return '请填写 SKU'
  if (!form.categoryId) return '请选择所属分类'
  if (form.price == null || form.dealerPrice == null) return '请填写零售价与经销商价'
  return null
}

async function save() {
  const problem = validateLocal()
  if (problem) {
    ElMessage.warning(problem)
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await productApi.updateProduct(productId.value, payload)
      ElMessage.success('产品已保存')
    } else {
      await productApi.createProduct(payload)
      ElMessage.success('产品已创建')
    }
    router.push('/admin/products')
  } catch (err) {
    const fieldErrors = err?.fieldErrors
    if (fieldErrors) {
      const firstField = Object.keys(fieldErrors)[0]
      const detail = fieldErrors[firstField]?.[0]
      ElMessage.error(detail ? `${firstField}：${detail}` : err.message)
    } else {
      ElMessage.error(err?.message || '保存失败，请稍后重试')
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCategories()
  if (isEdit.value) loadProduct()
})
</script>

<style scoped>
.admin-product-edit {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px 24px 32px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 4px;
}

.page-sub {
  font-size: 13px;
  color: var(--text-light);
}

.edit-form {
  max-width: 1080px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-card {
  background: var(--bg-light);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px 20px 8px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 14px;
}

.card-title.second {
  margin-top: 22px;
}

.field-hint {
  font-size: 12px;
  color: var(--text-light);
  line-height: 1.4;
}

.image-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.image-row .el-input {
  max-width: 520px;
}

.image-preview {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.specs-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1080px) {
  .form-grid,
  .specs-grid {
    grid-template-columns: 1fr;
  }
}
</style>
