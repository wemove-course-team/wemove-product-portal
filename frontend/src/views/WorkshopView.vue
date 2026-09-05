<template>
  <div class="workshop-page">
    <div class="page-header">
      <div class="header-inner">
        <h1 class="page-title">玩具品类与产品中心</h1>
        <p class="page-subtitle">精选天然实木益智游戏、儿童保龄球、摇摆平衡板与重力滚珠轨道系统</p>
      </div>
    </div>

    <div class="workshop-body">
      <!-- Filter Sidebar & Toolbar -->
      <div class="catalog-layout">
        <aside class="filter-sidebar">
          <div class="filter-group">
            <div class="filter-heading">分类品类</div>
            <div class="filter-options">
              <label
                v-for="cat in categoryOptions"
                :key="cat.slug"
                class="filter-radio-item"
                :class="{ active: activeCategorySlug === cat.slug }"
                @click="setCategory(cat.slug)"
              >
                <span>{{ cat.name }}</span>
              </label>
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-heading">适用年龄</div>
            <div class="filter-options">
              <label
                v-for="age in AGE_OPTIONS"
                :key="age.value"
                class="filter-radio-item"
                :class="{ active: selectedAge === age.value }"
                @click="setAge(age.value)"
              >
                <span>{{ age.label }}</span>
              </label>
            </div>
          </div>

          <div class="filter-group">
            <div class="filter-heading">价格排序</div>
            <el-select v-model="sortBy" size="default" style="width: 100%;">
              <el-option label="默认推荐" value="default" />
              <el-option label="价格从低到高" value="price_asc" />
              <el-option label="价格从高到低" value="price_desc" />
            </el-select>
          </div>

          <!-- Compare Action Floating Hint -->
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
            <span class="count-tip">共找到 <strong>{{ filteredList.length }}</strong> 款实木益智玩具</span>
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
              <div v-if="userStore.isDealer" class="dealer-status-chip">
                <el-icon><CircleCheckFilled /></el-icon>
                <span>当前已按【{{ userStore.userInfo.companyName }}】核心经销商专享价结算</span>
              </div>
            </div>
          </div>

          <div v-if="!categoryExists" class="no-products">
            该产品分类不存在或已下架
            <el-button link type="primary" @click="setCategory('all')">查看全部产品</el-button>
          </div>

          <div v-else-if="filteredList.length === 0" class="no-products">
            暂无符合筛选条件的商品
            <el-button link type="primary" @click="resetFilters">重置筛选</el-button>
          </div>

          <div v-else class="products-grid">
            <div
              v-for="p in filteredList"
              :key="p.id"
              class="product-card"
            >
              <div class="product-thumb" @click="$router.push(`/products/${p.slug}`)">
                <img :src="p.images[0]" :alt="p.name" />
                <span v-if="p.tag" class="card-tag">{{ p.tag }}</span>
              </div>

              <div class="product-body">
                <div class="meta-row">
                  <span class="sku">{{ p.sku }}</span>
                  <span class="age">{{ p.ageRange }}</span>
                </div>
                <h3 class="prod-name" @click="$router.push(`/products/${p.slug}`)">
                  {{ p.name }}
                </h3>
                <p class="prod-desc">{{ p.summary }}</p>

                <div class="prod-bottom">
                  <div class="price-box">
                    <div class="price-val">
                      ¥{{ productStore.getProductPrice(p) }}
                      <span v-if="userStore.isDealer" class="badge-dealer-mini">批</span>
                    </div>
                    <div v-if="userStore.isDealer" class="retail-ref">
                      零售指导价: ¥{{ p.price }}
                    </div>
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
                    <el-button
                      size="small"
                      type="primary"
                      @click="handleAddToCart(p)"
                    >
                      加购
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Product Comparison Dialog -->
    <el-dialog v-model="compareDialogVisible" title="产品规格横向参数对比" width="800px" append-to-body>
      <el-table :data="compareTableData" border style="width: 100%">
        <el-table-column prop="field" label="参数项目" width="130" fixed />
        <el-table-column
          v-for="prod in compareList"
          :key="prod.id"
          :label="prod.name"
          min-width="180"
        >
          <template #default="{ row }">
            <span v-if="row.key === 'image'">
              <img :src="prod.images[0]" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
            </span>
            <span v-else-if="row.key === 'price'">
              <strong style="color: #B25E29;">¥{{ productStore.getProductPrice(prod) }}</strong>
              <small v-if="userStore.isDealer" style="display:block; color:#999">零售: ¥{{ prod.price }}</small>
            </span>
            <span v-else-if="row.key === 'moq'">
              {{ prod.moq || 10 }} 件起订
            </span>
            <span v-else>
              {{ row.getValue(prod) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useProductStore } from '../stores/product'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const userStore = useUserStore()
const cartStore = useCartStore()

/* ------------------- 筛选条件进 URL（#86） -------------------
 * 分类：/categories/:slug 路径寻址（?category= 兼容），'all' 为全部
 * 其余条件合并进查询参数：?q=关键词 &age=3-6|6-10|10-plus &sort=price_asc|price_desc
 * #87 接入真实 API 后，page 分页参数将沿用同一套 URL 约定。
 */
const categoryOptions = computed(() => [
  { slug: 'all', name: '全部品类' },
  ...productStore.categories
])

const activeCategorySlug = computed(() => String(route.params.slug || route.query.category || 'all'))

const selectedCat = computed(() => {
  if (activeCategorySlug.value === 'all') return 0
  const cat = productStore.categories.find(c => c.slug === activeCategorySlug.value)
  return cat ? cat.id : -1 // -1 表示未知分类，页面呈现“分类不存在”空态
})

const categoryExists = computed(() => selectedCat.value !== -1)

const AGE_OPTIONS = [
  { label: '全部年龄', value: '' },
  { label: '3-6岁', value: '3-6' },
  { label: '6-10岁', value: '6-10' },
  { label: '10岁及以上', value: '10-plus' }
]

const selectedAge = computed(() => String(route.query.age || ''))
const searchQ = computed(() => String(route.query.q || '').trim())

// 搜索框本地草稿：输入即时可编辑，提交（Enter/失焦/清空）时写入 URL
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

// 合并写入查询参数；处于分类路径时保持 /categories/:slug 形态
function setQuery(patch) {
  const query = cleanQuery({ ...route.query, ...patch })
  if (route.name === 'ProductCategory' && activeCategorySlug.value !== 'all') {
    router.push({ name: 'ProductCategory', params: { slug: activeCategorySlug.value }, query })
  } else {
    router.push({ name: 'Products', query })
  }
}

// 分类切换走路径寻址（canonical URL）
function setCategory(slug) {
  const { category: _stale, ...rest } = route.query
  const query = cleanQuery(rest)
  if (slug === 'all') {
    router.push({ name: 'Products', query })
  } else {
    router.push({ name: 'ProductCategory', params: { slug }, query })
  }
}

function setAge(value) {
  setQuery({ age: value })
}

function onSearch(keyword) {
  setQuery({ q: String(keyword || '').trim() })
}

function resetFilters() {
  router.push({ name: 'Products' })
}

const filteredList = computed(() => {
  let list = productStore.products.filter(p => p.published)

  if (selectedCat.value > 0) {
    list = list.filter(p => p.categoryId === selectedCat.value)
  }

  if (searchQ.value) {
    const q = searchQ.value.toLowerCase()
    list = list.filter(p =>
      [p.name, p.summary, p.sku, p.scene].some(text => String(text || '').toLowerCase().includes(q))
    )
  }

  if (selectedAge.value === '3-6') {
    list = list.filter(p => p.ageRange.includes('3') || p.ageRange.includes('4'))
  } else if (selectedAge.value === '6-10') {
    list = list.filter(p => p.ageRange.includes('6') || p.ageRange.includes('8') || p.ageRange.includes('10'))
  } else if (selectedAge.value === '10-plus') {
    list = list.filter(p => p.ageRange.includes('12') || p.ageRange.includes('14') || p.ageRange.includes('及以上'))
  }

  if (sortBy.value === 'price_asc') {
    list = [...list].sort((a, b) => productStore.getProductPrice(a) - productStore.getProductPrice(b))
  } else if (sortBy.value === 'price_desc') {
    list = [...list].sort((a, b) => productStore.getProductPrice(b) - productStore.getProductPrice(a))
  }

  return list
})

// Comparison
const compareList = ref([])
const compareDialogVisible = ref(false)

function handleAddToCart(p) {
  cartStore.addToCart(p, 1)
  ElMessage.success(`已加入购物车：${p.name}`)
}

function isInCompare(id) {
  return compareList.value.some(i => i.id === id)
}

function toggleCompare(p) {
  if (isInCompare(p.id)) {
    removeFromCompare(p.id)
  } else {
    if (compareList.value.length >= 4) {
      ElMessage.warning('最多只可同时对比4款产品')
      return
    }
    compareList.value.push(p)
  }
}

function removeFromCompare(id) {
  compareList.value = compareList.value.filter(i => i.id !== id)
}

function openCompareDialog() {
  if (compareList.value.length < 2) {
    ElMessage.info('请至少选择两款产品进行对比')
    return
  }
  compareDialogVisible.value = true
}

const compareTableData = [
  { field: '产品图片', key: 'image' },
  { field: '当前结算价', key: 'price' },
  { field: '建议起订量', key: 'moq' },
  { field: '适合年龄', key: 'age', getValue: p => p.ageRange },
  { field: '制作材质', key: 'mat', getValue: p => p.material },
  { field: '使用场景', key: 'scene', getValue: p => p.scene },
  { field: '产品规格', key: 'dim', getValue: p => p.specs?.dimensions || '-' },
  { field: '整箱装箱数', key: 'pack', getValue: p => p.specs?.casePack ? `${p.specs.casePack} 箱/件` : '-' }
]
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

.dealer-status-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #FDF9F2;
  border: 1px solid #EFE4D2;
  color: #9C7844;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
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
  position: relative;
  height: 220px;
  background: #f7f7f7;
  cursor: pointer;
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

.price-val {
  font-size: 20px;
  font-weight: 700;
  color: #B25E29;
}

.badge-dealer-mini {
  font-size: 10px;
  background: #B25E29;
  color: #fff;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 2px;
}

.retail-ref {
  font-size: 11px;
  color: var(--text-light);
  text-decoration: line-through;
}

.card-actions {
  display: flex;
  gap: 6px;
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
  }
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>

