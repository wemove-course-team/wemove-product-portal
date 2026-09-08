<template>
  <div class="workshop-page">
    <div class="page-header">
      <div class="header-inner">
        <h1 class="page-title">WEMOVE SPORTS 产品中心</h1>
        <p class="page-subtitle">探索儿童保龄球、平衡协调、亲子运动与开放式游戏产品</p>
      </div>
    </div>

    <div class="workshop-body">
      <div class="catalog-layout">
        <!-- Filter Sidebar -->
        <aside class="filter-sidebar">
          <div class="filter-group">
            <div class="filter-heading">分类品类</div>
            <div class="filter-options">
              <button
                v-for="cat in categoryOptions"
                :key="cat.slug"
                type="button"
                class="filter-radio-item"
                :class="{ active: activeCategorySlug === cat.slug }"
                @click="setCategory(cat.slug)"
              >
                <span>{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-heading">适用年龄</div>
            <div class="filter-options">
              <button
                v-for="age in AGE_OPTIONS"
                :key="age.value"
                type="button"
                class="filter-radio-item"
                :class="{ active: selectedAge === age.value }"
                @click="setAge(age.value)"
              >
                <span>{{ age.label }}</span>
              </button>
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-heading">价格排序</div>
            <el-select v-model="sortBy" size="default" style="width: 100%;">
              <el-option label="默认推荐" value="default" />
              <el-option label="价格从低到高" value="price_asc" />
              <el-option label="价格从高到低" value="price_desc" />
              <el-option label="最新上架" value="newest" />
              <el-option label="名称 A-Z" value="name_asc" />
            </el-select>
          </div>

          <!-- Compare Floating Hint -->
          <div v-if="compareList.length > 0" class="compare-box">
            <div class="compare-title">已选对比 ({{ compareList.length }}/4)</div>
            <div class="compare-chips">
              <el-tag
                v-for="item in compareList"
                :key="item.id"
                closable
                size="small"
                @close="removeFromCompare(item.id)"
              >
                {{ item.name.slice(0, 8) }}...
              </el-tag>
            </div>
            <el-button type="primary" size="small" style="width: 100%; margin-top: 8px;" @click="openCompareDialog">
              开始对比参数
            </el-button>
          </div>
        </aside>

        <!-- Product Grid -->
        <main class="products-main">
          <div class="toolbar">
            <span class="count-tip">共找到 <strong>{{ total }}</strong> 款产品</span>
            <div class="toolbar-right">
              <el-input
                v-model="searchInput"
                class="toolbar-search"
                placeholder="搜索产品名称 / SKU"
                clearable
                size="default"
                @keyup.enter="onSearch(searchInput)"
                @blur="onSearch(searchInput)"
                @clear="onSearch('')"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>

          <AsyncState
            :loading="loading || (!categoriesLoaded && !categoryLoadError)"
            :error="loadError || categoryLoadError"
            :empty="!loading && !loadError && categoriesLoaded && !categoryExists"
            empty-text="该产品分类不存在或已下架"
            @retry="retryPage"
          >
            <template #empty-extra>
              <el-button link type="primary" @click="setCategory('all')">查看全部产品</el-button>
            </template>

            <div v-if="products.length === 0" class="no-products">
              暂无符合筛选条件的商品
              <el-button link type="primary" @click="resetFilters">重置筛选</el-button>
            </div>

            <template v-else>
              <div class="products-grid">
                <div
                  v-for="p in products"
                  :key="p.id"
                  class="product-card"
                >
                  <router-link class="product-thumb" :to="`/products/${p.slug}`" :aria-label="`查看 ${p.name} 详情`">
                    <img v-if="p.coverImage" :src="p.coverImage" :alt="p.name" loading="lazy" />
                    <span v-else class="product-image-empty" aria-hidden="true">暂无图片</span>
                    <span v-if="p.tag" class="card-tag">{{ p.tag }}</span>
                  </router-link>

                  <div class="product-body">
                    <div class="meta-row">
                      <span class="sku">{{ p.sku }}</span>
                      <span class="age">{{ p.ageRange }}</span>
                    </div>
                    <h3 class="prod-name">
                      <router-link :to="`/products/${p.slug}`">{{ p.name }}</router-link>
                    </h3>
                    <p class="prod-desc">{{ p.summary }}</p>

                    <div class="prod-bottom">
                      <div class="price-box">
                        <div class="price-val">¥{{ p.price }}</div>
                        <span class="category-chip">{{ p.categoryName }}</span>
                      </div>

                      <div class="card-actions">
                        <el-button
                          size="small"
                          :type="isInCompare(p.id) ? 'primary' : 'default'"
                          plain
                          @click="toggleCompare(p)"
                        >
                          {{ isInCompare(p.id) ? '已对比' : '对比' }}
                        </el-button>
                        <el-button size="small" type="primary" @click="$router.push(`/products/${p.slug}`)">
                          查看详情
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="pagination-row">
                <el-pagination
                  background
                  layout="prev, pager, next, total"
                  :total="total"
                  :page-size="PAGE_SIZE"
                  :current-page="currentPage"
                  @current-change="onPageChange"
                />
              </div>
            </template>
          </AsyncState>
        </main>
      </div>
    </div>

    <!-- Product Comparison Dialog（对比需要详情级字段，打开时按 id 拉取详情） -->
    <el-dialog v-model="compareDialogVisible" title="产品规格横向参数对比" width="800px" append-to-body>
      <AsyncState :loading="compareLoading" :error="compareError" @retry="openCompareDialog">
        <el-table :data="compareTableData" border style="width: 100%">
          <el-table-column prop="field" label="参数项目" width="130" fixed />
          <el-table-column
            v-for="prod in compareDetails"
            :key="prod.id"
            :label="prod.name"
            min-width="180"
          >
            <template #default="{ row }">
              <span v-if="row.key === 'image'">
                <img :src="prod.coverImage" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
              </span>
              <span v-else-if="row.key === 'price'">
                <strong style="color: #B25E29;">¥{{ prod.price }}</strong>
                <small v-if="prod.dealerPrice != null" style="display:block; color:#999">
                  经销价: ¥{{ prod.dealerPrice }}
                </small>
              </span>
              <span v-else-if="row.key === 'moq'">
                {{ prod.moq != null ? `${prod.moq} 件起订` : '登录经销商账户后查看' }}
              </span>
              <span v-else>
                {{ row.getValue(prod) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </AsyncState>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productApi } from '../../services/product'
import { useProductStore } from '../../stores/product'
import AsyncState from '../../components/AsyncState.vue'

/**
 * 产品列表/分类页（#87 MVP-03）：数据全部来自 /api/v1/products，
 * 筛选条件写入 URL（#86 约定），分页 ?page= 服务端分页（PLP-005）。
 */
const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const PAGE_SIZE = 12

const loading = ref(false)
const loadError = ref(null)
const products = ref([])
const total = ref(0)
let listRequestSerial = 0

productStore.loadCategories()
const categoriesLoaded = computed(() => productStore.categoriesLoaded)
const categoryLoadError = computed(() => productStore.categoriesError)

const categoryOptions = computed(() => [
  { slug: 'all', name: '全部品类', id: 0 },
  ...productStore.categories
])

const activeCategorySlug = computed(() => String(route.params.slug || route.query.category || 'all'))

const activeCategory = computed(() =>
  categoryOptions.value.find((c) => c.slug === activeCategorySlug.value)
)
const categoryExists = computed(() => activeCategorySlug.value === 'all' || Boolean(activeCategory.value))

const AGE_OPTIONS = [
  { label: '全部年龄', value: '' },
  { label: '3-6岁', value: '3-6' },
  { label: '6-10岁', value: '6-10' },
  { label: '10岁及以上', value: '10-plus' }
]

const selectedAge = computed(() => String(route.query.age || ''))
const searchQ = computed(() => String(route.query.q || '').trim())
const currentPage = computed(() => Math.max(1, Number(route.query.page) || 1))

const searchInput = ref(searchQ.value)
watch(searchQ, (value) => {
  searchInput.value = value
})

const sortBy = computed({
  get: () => String(route.query.sort || 'default'),
  set: (value) => setQuery({ sort: value })
})

function cleanQuery(raw) {
  const query = {}
  for (const [key, value] of Object.entries(raw)) {
    if (value !== '' && value !== null && value !== undefined) query[key] = value
  }
  return query
}

function setQuery(patch) {
  const query = cleanQuery({ ...route.query, ...patch })
  if (route.name === 'ProductCategory' && activeCategorySlug.value !== 'all') {
    router.push({ name: 'ProductCategory', params: { slug: activeCategorySlug.value }, query })
  } else {
    router.push({ name: 'Products', query })
  }
}

function setCategory(slug) {
  const { category: _stale, page: _page, ...rest } = route.query
  const query = cleanQuery(rest)
  if (slug === 'all') {
    router.push({ name: 'Products', query })
  } else {
    router.push({ name: 'ProductCategory', params: { slug }, query })
  }
}

function setAge(value) {
  setQuery({ age: value, page: undefined })
}

function onSearch(keyword) {
  setQuery({ q: String(keyword || '').trim(), page: undefined })
}

function onPageChange(page) {
  setQuery({ page: page > 1 ? String(page) : undefined })
  window.scrollTo({ top: 0 })
}

function resetFilters() {
  router.push({ name: 'Products' })
}

async function retryPage() {
  if (!categoriesLoaded.value) await productStore.loadCategories(true)
  if (categoryExists.value) await fetchList()
}

async function fetchList() {
  const requestSerial = ++listRequestSerial
  loading.value = true
  loadError.value = null
  try {
    const envelope = await productApi.fetchProducts({
      page: currentPage.value,
      pageSize: PAGE_SIZE,
      keyword: searchQ.value,
      // “全部品类”约定 id=0，不作为筛选条件下发（后端校验 categoryId ≥ 1）
      categoryId: activeCategory.value && activeCategory.value.id > 0 ? activeCategory.value.id : undefined,
      age: selectedAge.value || undefined,
      sort: sortBy.value === 'default' ? undefined : sortBy.value
    })
    if (requestSerial === listRequestSerial) {
      products.value = envelope?.data?.items || []
      total.value = envelope?.data?.total || 0
      loadError.value = null
    }
  } catch (err) {
    if (requestSerial === listRequestSerial) loadError.value = err
  } finally {
    if (requestSerial === listRequestSerial) loading.value = false
  }
}

watch(
  () => [
    route.name,
    route.params.slug,
    route.query.q,
    route.query.age,
    route.query.sort,
    route.query.page,
    categoryExists.value
  ],
  () => {
    if (categoryExists.value || activeCategorySlug.value === 'all') fetchList()
  },
  { immediate: true }
)

/* ------------------------------ 产品对比（PLP-008） ------------------------------ */

const compareList = ref([])
const compareDialogVisible = ref(false)
const compareLoading = ref(false)
const compareError = ref(null)
const compareDetails = ref([])

function isInCompare(id) {
  return compareList.value.some((i) => i.id === id)
}

function toggleCompare(p) {
  if (isInCompare(p.id)) {
    removeFromCompare(p.id)
    return
  }
  if (compareList.value.length >= 4) {
    compareError.value = '最多只可同时对比4款产品'
    return
  }
  // 保存 slug，避免数字 id 与纯数字 slug 同时存在时详情寻址到错误产品。
  compareList.value.push({ id: p.id, slug: p.slug, name: p.name })
}

function removeFromCompare(id) {
  compareList.value = compareList.value.filter((i) => i.id !== id)
}

async function openCompareDialog() {
  if (compareList.value.length < 2) {
    compareError.value = '请至少选择两款产品进行对比'
    return
  }
  compareDialogVisible.value = true
  compareLoading.value = true
  compareError.value = null
  try {
    const details = await Promise.all(
      compareList.value.map((item) => productApi.fetchProduct(item.slug || item.id))
    )
    compareDetails.value = details.map((envelope) => envelope?.data).filter(Boolean)
    compareLoading.value = false
  } catch (err) {
    compareDetails.value = []
    compareError.value = err
    compareLoading.value = false
  }
}

const baseCompareTableData = [
  { field: '产品图片', key: 'image' },
  { field: '零售指导价', key: 'price' },
  { field: '适合年龄', key: 'age', getValue: (p) => p.ageRange },
  { field: '制作材质', key: 'mat', getValue: (p) => p.material },
  { field: '使用场景', key: 'scene', getValue: (p) => p.scene },
  { field: '产品规格', key: 'dim', getValue: (p) => p.specs?.dimensions || '-' },
  { field: '整箱装箱数', key: 'pack', getValue: (p) => (p.specs?.casePack ? `${p.specs.casePack} 件/箱` : '-') }
]

// MOQ 属经销商私有字段：只有详情 API 实际返回该字段时才展示这一行，禁止前端猜测默认值。
const compareTableData = computed(() => {
  if (!compareDetails.value.some((product) => product.moq != null)) return baseCompareTableData
  return [
    ...baseCompareTableData.slice(0, 2),
    { field: '建议起订量', key: 'moq' },
    ...baseCompareTableData.slice(2)
  ]
})
</script>

<style scoped>
.page-header {
  background: var(--bg-light);
  border-bottom: 1px solid var(--border-color);
  padding: 40px 24px;
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
}

.page-title {
  font-size: 30px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 15px;
  color: var(--text-muted);
}

.workshop-body {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 24px 80px;
}

.catalog-layout {
  display: flex;
  gap: 32px;
}

.filter-sidebar {
  width: 240px;
  flex-shrink: 0;
}

.filter-group {
  margin-bottom: 24px;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
}

.filter-heading {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-radio-item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-muted);
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-radio-item:hover {
  background: var(--bg-light);
  color: var(--text-color);
}

.filter-radio-item.active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
}

.compare-box {
  background: #FBF9F6;
  border: 1px solid var(--primary-border);
  border-radius: 10px;
  padding: 14px;
}

.compare-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.compare-chips {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.products-main {
  flex: 1;
  min-width: 0;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-search {
  width: 220px;
}

.count-tip {
  font-size: 14px;
  color: var(--text-muted);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.product-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.25s ease;
}

.product-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--primary-border);
}

.product-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 220px;
  background: #f7f7f7;
  cursor: pointer;
}

.product-image-empty {
  color: var(--text-light);
  font-size: 13px;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(61, 50, 38, 0.85);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.product-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.prod-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 6px;
  line-height: 1.35;
  cursor: pointer;
}

.prod-name:hover {
  color: var(--primary-color);
}

.prod-desc {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 14px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-line-break: anywhere;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prod-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-top: 1px solid var(--border-color);
  padding-top: 12px;
}

.price-box {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-val {
  font-size: 20px;
  font-weight: 700;
  color: #B25E29;
}

.category-chip {
  font-size: 10px;
  color: var(--text-light);
}

.card-actions {
  display: flex;
  gap: 6px;
}

.pagination-row {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.no-products {
  padding: 60px 0;
  text-align: center;
  color: var(--text-light);
  font-size: 15px;
}

@media (max-width: 960px) {
  .catalog-layout {
    flex-direction: column;
  }
  .filter-sidebar {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .filter-group {
    margin-bottom: 0;
  }
  .filter-options {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .filter-radio-item {
    width: auto;
    flex: 1 1 90px;
    text-align: center;
  }
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-header {
    padding: 28px 18px;
  }
  .workshop-body {
    padding: 24px 16px 56px;
  }
  .filter-sidebar {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    padding-bottom: 4px;
  }
  .filter-sidebar::-webkit-scrollbar {
    display: none;
  }
  .filter-group {
    min-width: 220px;
    scroll-snap-align: start;
  }
  .filter-options {
    flex-direction: column;
    flex-wrap: nowrap;
  }
  .filter-radio-item {
    width: 100%;
    flex: none;
    text-align: left;
  }
  .toolbar,
  .toolbar-right,
  .toolbar-search {
    width: 100%;
  }
  .products-grid {
    grid-template-columns: 1fr;
  }
  .card-actions {
    flex-wrap: wrap;
  }
}
</style>
