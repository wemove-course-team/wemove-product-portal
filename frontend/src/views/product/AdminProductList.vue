<template>
  <div class="admin-products">
    <header class="page-head">
      <div>
        <h1 class="page-title">产品与分类管理</h1>
        <p class="page-sub">新增、编辑、发布与下架产品目录（#87 MVP-03 · 数据来自 /api/v1/admin）</p>
      </div>
    </header>

    <el-tabs v-model="activeTab" class="admin-tabs">
      <!-- ============================== 产品管理 ============================== -->
      <el-tab-pane label="产品管理" name="products">
        <div class="toolbar">
          <div class="toolbar-filters">
            <el-input
              v-model="keyword"
              placeholder="搜索名称 / SKU / slug"
              clearable
              style="width: 220px"
              @keyup.enter="onSearch"
              @clear="onSearch"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select v-model="categoryFilter" placeholder="全部分类" clearable style="width: 150px" @change="onSearch">
              <el-option v-for="c in adminCategories" :key="c.id" :label="c.name" :value="Number(c.id)" />
            </el-select>
            <el-select v-model="statusFilter" style="width: 130px" @change="onSearch">
              <el-option label="全部状态" value="all" />
              <el-option label="已发布" value="published" />
              <el-option label="草稿/下架" value="draft" />
            </el-select>
          </div>
          <el-button type="primary" @click="$router.push('/admin/products/new')">
            <el-icon style="margin-right: 4px"><Plus /></el-icon>新增产品
          </el-button>
        </div>

        <AsyncState :loading="loading" :error="loadError" @retry="fetchProducts">
          <el-table :data="rows" style="width: 100%" v-loading="loading">
            <el-table-column prop="sku" label="SKU" width="120" />
            <el-table-column prop="name" label="产品名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="categoryName" label="分类" width="110" />
            <el-table-column label="零售价" width="100">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column label="经销商价" width="110">
              <template #default="{ row }">¥{{ row.dealerPrice }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.isPublished === 1" type="success" effect="light">已发布</el-tag>
                <el-tag v-else type="info" effect="light">草稿</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="精选" width="70">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.isFeatured === 1"
                  @change="(value) => toggleFeatured(row, value)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="最近修改" width="160">
              <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="$router.push(`/admin/products/${row.id}/edit`)">编辑</el-button>
                <el-button v-if="row.isPublished === 1" link type="warning" @click="setStatus(row, 0)">下架</el-button>
                <el-button v-else link type="success" @click="setStatus(row, 1)">发布</el-button>
                <el-button link type="danger" @click="removeProduct(row)">归档</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-row">
            <el-pagination
              background
              layout="prev, pager, next, total"
              :total="total"
              :page-size="pageSize"
              :current-page="page"
              @current-change="onPageChange"
            />
          </div>
        </AsyncState>
      </el-tab-pane>

      <!-- ============================== 分类管理 ============================== -->
      <el-tab-pane label="分类管理" name="categories">
        <div class="toolbar">
          <span class="count-tip">共 {{ adminCategories.length }} 个分类；分类下仍有产品时不可删除</span>
          <el-button type="primary" @click="openCategoryDialog(null)">
            <el-icon style="margin-right: 4px"><Plus /></el-icon>新增分类
          </el-button>
        </div>

        <AsyncState :loading="categoriesLoading" :error="categoriesError" @retry="fetchCategories">
          <el-table :data="adminCategories" style="width: 100%" v-loading="categoriesLoading">
            <el-table-column prop="name" label="分类名称" min-width="140" />
            <el-table-column prop="slug" label="slug" min-width="120" />
            <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip />
            <el-table-column prop="productCount" label="产品数" width="90" />
            <el-table-column label="操作" width="140">
              <template #default="{ row }">
                <el-button link type="primary" @click="openCategoryDialog(row)">编辑</el-button>
                <el-button link type="danger" @click="removeCategory(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </AsyncState>
      </el-tab-pane>
    </el-tabs>

    <!-- 分类新增/编辑对话框 -->
    <el-dialog v-model="categoryDialogVisible" :title="categoryForm.id ? '编辑分类' : '新增分类'" width="480px" append-to-body>
      <el-form label-position="top" :model="categoryForm">
        <el-form-item label="分类名称" required>
          <el-input v-model="categoryForm.name" maxlength="64" placeholder="例如：创意套件" />
        </el-form-item>
        <el-form-item label="slug（路由标识，字母/数字/中划线）" required>
          <el-input v-model="categoryForm.slug" maxlength="64" placeholder="例如：kits" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="categoryForm.description" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
        <el-form-item label="排序值（越小越靠前）">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingCategory" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { productApi } from '../../services/product'
import AsyncState from '../../components/AsyncState.vue'

/**
 * 后台产品/分类列表（#87 MVP-03）：挂载于 /admin 外壳（#86）。
 * 发布与下架走 PUT /admin/products/:id/status；草稿与下架产品不出现在公开接口（验收项）。
 */
const activeTab = ref('products')

const loading = ref(false)
const loadError = ref(null)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const keyword = ref('')
const categoryFilter = ref(null)
const statusFilter = ref('all')

const adminCategories = ref([])
const categoriesLoading = ref(false)
const categoriesError = ref(null)

async function fetchProducts() {
  loading.value = true
  loadError.value = null
  try {
    const envelope = await productApi.fetchAdminProducts({
      page: page.value,
      pageSize,
      keyword: keyword.value.trim() || undefined,
      categoryId: categoryFilter.value || undefined,
      status: statusFilter.value
    })
    rows.value = envelope?.data?.items || []
    total.value = envelope?.data?.total || 0
  } catch (err) {
    loadError.value = err
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  fetchProducts()
}

function onPageChange(nextPage) {
  page.value = nextPage
  fetchProducts()
}

async function fetchCategories() {
  categoriesLoading.value = true
  categoriesError.value = null
  try {
    const envelope = await productApi.fetchAdminCategories()
    adminCategories.value = envelope?.data ?? []
  } catch (err) {
    categoriesError.value = err
  } finally {
    categoriesLoading.value = false
  }
}

/** 发布/下架：body { isPublished: 0|1 } */
async function setStatus(row, isPublished) {
  try {
    await productApi.updateProductStatus(row.id, { isPublished })
    ElMessage.success(isPublished === 1 ? `已发布：${row.name}` : `已下架：${row.name}`)
    fetchProducts()
  } catch (err) {
    ElMessage.error(err?.message || '操作失败，请稍后重试')
  }
}

async function toggleFeatured(row, value) {
  try {
    await productApi.updateProductStatus(row.id, { isPublished: row.isPublished, isFeatured: value ? 1 : 0 })
    ElMessage.success(value ? '已设为精选' : '已取消精选')
    fetchProducts()
  } catch (err) {
    ElMessage.error(err?.message || '操作失败，请稍后重试')
  }
}

async function removeProduct(row) {
  try {
    await ElMessageBox.confirm(
      `确定归档「${row.name}」（${row.sku}）吗？归档后产品会从公开目录移除，但数据仍会保留。`,
      '归档确认',
      { type: 'warning', confirmButtonText: '归档', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await productApi.deleteProduct(row.id)
    ElMessage.success('产品已归档并从公开目录移除')
    fetchProducts()
  } catch (err) {
    ElMessage.error(err?.message || '归档失败，请稍后重试')
  }
}

const categoryDialogVisible = ref(false)
const savingCategory = ref(false)
const categoryForm = ref({ id: null, name: '', slug: '', description: '', sortOrder: 0 })

function openCategoryDialog(row) {
  categoryForm.value = row
    ? { id: row.id, name: row.name, slug: row.slug, description: row.description || '', sortOrder: Number(row.sortOrder || 0) }
    : { id: null, name: '', slug: '', description: '', sortOrder: adminCategories.value.length + 1 }
  categoryDialogVisible.value = true
}

async function saveCategory() {
  const form = categoryForm.value
  if (!form.name || !form.slug) {
    ElMessage.warning('请填写分类名称与 slug')
    return
  }
  savingCategory.value = true
  try {
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      sortOrder: form.sortOrder
    }
    if (form.id) {
      await productApi.updateCategory(form.id, payload)
    } else {
      await productApi.createCategory(payload)
    }
    ElMessage.success('分类已保存')
    categoryDialogVisible.value = false
    fetchCategories()
  } catch (err) {
    ElMessage.error(err?.message || '保存失败，请稍后重试')
  } finally {
    savingCategory.value = false
  }
}

async function removeCategory(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除分类「${row.name}」吗？分类下存在产品时将无法删除。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await productApi.deleteCategory(row.id)
    ElMessage.success('分类已删除')
    fetchCategories()
  } catch (err) {
    ElMessage.error(err?.message || '删除失败')
  }
}

function formatTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})
</script>

<style scoped>
.admin-products {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px 24px 32px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 12px;
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

.admin-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.count-tip {
  font-size: 13px;
  color: var(--text-light);
}

.pagination-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
