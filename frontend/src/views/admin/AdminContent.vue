<template>
  <div class="admin-content-view">
    <header class="page-head">
      <div>
        <h1 class="page-title">内容与栏目管理</h1>
        <p class="page-sub">发布与管理新闻动态、分类以及7个品牌栏目单页内容（#88 MVP-04）</p>
      </div>
    </header>

    <el-tabs v-model="activeTab" class="admin-tabs">
      <!-- ============================== Tab 1: 文章管理 ============================== -->
      <el-tab-pane label="文章管理" name="articles">
        <div class="toolbar">
          <div class="toolbar-filters">
            <el-input
              v-model="articleKeyword"
              placeholder="搜索文章标题 / Slug"
              clearable
              style="width: 240px"
              @keyup.enter="loadArticles"
              @clear="loadArticles"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>

            <el-select
              v-model="articleCategoryFilter"
              placeholder="全部分类"
              clearable
              style="width: 160px"
              @change="loadArticles"
            >
              <el-option
                v-for="cat in categories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>

            <el-select
              v-model="articleStatusFilter"
              placeholder="全部状态"
              clearable
              style="width: 130px"
              @change="loadArticles"
            >
              <el-option label="全部状态" value="" />
              <el-option label="已发布" value="PUBLISHED" />
              <el-option label="草稿" value="DRAFT" />
              <el-option label="已下架" value="OFFLINE" />
            </el-select>

            <el-button @click="loadArticles">查询</el-button>
          </div>

          <el-button type="primary" @click="openCreateArticleModal">
            <el-icon style="margin-right: 4px"><Plus /></el-icon>新建文章
          </el-button>
        </div>

        <AsyncState :loading="articlesLoading" :error="articlesError" @retry="loadArticles">
          <el-table :data="articles" style="width: 100%" stripe>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="封面" width="80">
              <template #default="{ row }">
                <img v-if="row.coverImage" :src="row.coverImage" class="table-thumb" />
                <div v-else class="table-thumb-placeholder">📰</div>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
            <el-table-column prop="slug" label="Slug" min-width="150" show-overflow-tooltip />
            <el-table-column label="分类" width="120">
              <template #default="{ row }">
                {{ row.category?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" effect="light">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" width="160">
              <template #default="{ row }">
                {{ row.publishedAt ? formatDateTime(row.publishedAt) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="openEditArticleModal(row)">编辑</el-button>
                <el-button
                  v-if="row.status !== 'PUBLISHED'"
                  size="small"
                  type="success"
                  @click="toggleArticleStatus(row, 'PUBLISHED')"
                >
                  发布
                </el-button>
                <el-button
                  v-if="row.status === 'PUBLISHED'"
                  size="small"
                  type="warning"
                  @click="toggleArticleStatus(row, 'OFFLINE')"
                >
                  下架
                </el-button>
                <el-button size="small" type="danger" @click="deleteArticleItem(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="articlesTotal > 0" class="pagination-bar">
            <el-pagination
              v-model:current-page="articlePage"
              v-model:page-size="articlePageSize"
              :total="articlesTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @size-change="loadArticles"
              @current-change="loadArticles"
            />
          </div>
        </AsyncState>
      </el-tab-pane>

      <!-- ============================== Tab 2: 分类管理 ============================== -->
      <el-tab-pane label="分类管理" name="categories">
        <div class="toolbar">
          <div></div>
          <el-button type="primary" @click="openCreateCategoryModal">
            <el-icon style="margin-right: 4px"><Plus /></el-icon>新建分类
          </el-button>
        </div>

        <el-table :data="categories" style="width: 100%" v-loading="categoriesLoading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="分类名称" min-width="160" />
          <el-table-column prop="slug" label="Slug" min-width="160" />
          <el-table-column prop="sortOrder" label="排序权重" width="120" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openEditCategoryModal(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteCategoryItem(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ============================== Tab 3: 栏目单页管理 ============================== -->
      <el-tab-pane label="栏目单页管理" name="pages">
        <el-table :data="pages" style="width: 100%" v-loading="pagesLoading" stripe>
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="slug" label="栏目路由 (Slug)" width="150">
            <template #default="{ row }">
              <code>/{{ row.slug }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="栏目名称" min-width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'">
                {{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最近更新" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.updatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="openEditPageModal(row)">编辑配置</el-button>
              <el-button size="small" @click="$router.push(`/${row.slug}`)">前台查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 文章编辑 / 新增弹窗 -->
    <el-dialog
      v-model="articleDialogVisible"
      :title="isEditArticle ? '编辑文章' : '新建文章'"
      width="780px"
      destroy-on-close
    >
      <el-form
        ref="articleFormRef"
        :model="articleForm"
        :rules="articleRules"
        label-width="90px"
        style="padding: 10px 20px 0;"
      >
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="articleForm.title" maxlength="128" show-word-limit placeholder="请输入文章标题" />
        </el-form-item>

        <el-form-item label="Slug" prop="slug">
          <el-input
            v-model="articleForm.slug"
            maxlength="128"
            show-word-limit
            placeholder="英文字母、数字和横线，例如：company-news-01"
          />
        </el-form-item>

        <el-form-item label="所属分类" prop="categoryId">
          <el-select v-model="articleForm.categoryId" placeholder="请选择文章分类" clearable style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="String(cat.id)"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="封面图片" prop="coverImage">
          <el-input
            v-model="articleForm.coverImage"
            placeholder="请输入图片路径，例如 /images/stem_s0_3eea7200-6ed.jpg"
          />
        </el-form-item>

        <el-form-item label="文章摘要" prop="summary">
          <el-input
            v-model="articleForm.summary"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="简要概括文章主旨"
          />
        </el-form-item>

        <el-form-item label="文章正文" prop="content">
          <el-input
            v-model="articleForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入纯文本文章正文，系统会自动进行 XSS 安全清洗"
          />
          <div class="form-tip">提示：正文使用纯文本安全输出，不支持注入 HTML 标签。</div>
        </el-form-item>

        <el-form-item label="发布状态" prop="status">
          <el-radio-group v-model="articleForm.status">
            <el-radio value="DRAFT">草稿</el-radio>
            <el-radio value="PUBLISHED">立即发布</el-radio>
            <el-radio value="OFFLINE">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="articleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="articleSubmitting" @click="saveArticle">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 分类编辑 / 新增弹窗 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="isEditCategory ? '编辑分类' : '新建分类'"
      width="480px"
      destroy-on-close
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="categoryForm.name" maxlength="64" placeholder="例如：行业资讯" />
        </el-form-item>
        <el-form-item label="Slug" prop="slug">
          <el-input v-model="categoryForm.slug" maxlength="64" placeholder="例如：industry-news" />
        </el-form-item>
        <el-form-item label="排序权重" prop="sortOrder">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="categorySubmitting" @click="saveCategory">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 单页编辑弹窗 -->
    <el-dialog
      v-model="pageDialogVisible"
      :title="`编辑栏目页：/${currentPage?.slug}`"
      width="780px"
      destroy-on-close
    >
      <el-form label-width="90px">
        <el-form-item label="栏目名称">
          <el-input v-model="pageForm.title" maxlength="128" />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-radio-group v-model="pageForm.status">
            <el-radio value="PUBLISHED">已发布</el-radio>
            <el-radio value="DRAFT">草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分块内容">
          <el-input
            v-model="pageForm.sectionsJson"
            type="textarea"
            :rows="14"
            placeholder="请输入 JSON 格式的 sections 数组"
          />
          <div class="form-tip">必须是合法的 JSON 数组结构（对应 pageSections.json 中的分块）。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pageDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pageSubmitting" @click="savePage">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import AsyncState from '../../components/AsyncState.vue'
import { contentApi } from '../../services/content'

const activeTab = ref('articles')

// --- 文章管理状态 ---
const articles = ref([])
const articlesTotal = ref(0)
const articlesLoading = ref(false)
const articlesError = ref(null)
const articlePage = ref(1)
const articlePageSize = ref(10)
const articleKeyword = ref('')
const articleCategoryFilter = ref('')
const articleStatusFilter = ref('')

// --- 文章表单弹窗 ---
const articleDialogVisible = ref(false)
const isEditArticle = ref(false)
const editingArticleId = ref(null)
const articleSubmitting = ref(false)
const articleFormRef = ref()
const articleForm = reactive({
  title: '',
  slug: '',
  categoryId: '',
  coverImage: '',
  summary: '',
  content: '',
  status: 'DRAFT'
})

const articleRules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  slug: [
    { required: true, message: '请输入 Slug', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: 'Slug 只能包含小写字母、数字与横线', trigger: 'blur' }
  ]
}

// --- 分类管理状态 ---
const categories = ref([])
const categoriesLoading = ref(false)
const categoryDialogVisible = ref(false)
const isEditCategory = ref(false)
const editingCategoryId = ref(null)
const categorySubmitting = ref(false)
const categoryFormRef = ref()
const categoryForm = reactive({
  name: '',
  slug: '',
  sortOrder: 0
})

const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  slug: [
    { required: true, message: '请输入分类 Slug', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: 'Slug 只能包含小写字母、数字与横线', trigger: 'blur' }
  ]
}

// --- 栏目单页状态 ---
const pages = ref([])
const pagesLoading = ref(false)
const pageDialogVisible = ref(false)
const currentPage = ref(null)
const pageSubmitting = ref(false)
const pageForm = reactive({
  title: '',
  status: 'PUBLISHED',
  sectionsJson: ''
})

// ============================== 方法实现 ==============================

function statusTagType(status) {
  if (status === 'PUBLISHED') return 'success'
  if (status === 'OFFLINE') return 'danger'
  return 'info'
}

function statusText(status) {
  if (status === 'PUBLISHED') return '已发布'
  if (status === 'OFFLINE') return '已下架'
  return '草稿'
}

function formatDateTime(str) {
  if (!str) return '-'
  const d = new Date(str)
  return d.toLocaleString('zh-CN', { hour12: false })
}

async function loadArticles() {
  articlesLoading.value = true
  articlesError.value = null
  try {
    const res = await contentApi.adminGetArticles({
      page: articlePage.value,
      pageSize: articlePageSize.value,
      keyword: articleKeyword.value.trim() || undefined,
      categoryId: articleCategoryFilter.value || undefined,
      status: articleStatusFilter.value || undefined
    })
    const data = res.data || {}
    articles.value = data.items || []
    articlesTotal.value = data.total || 0
  } catch (err) {
    articlesError.value = err
  } finally {
    articlesLoading.value = false
  }
}

async function loadCategories() {
  categoriesLoading.value = true
  try {
    const res = await contentApi.adminGetCategories()
    categories.value = res.data || []
  } catch (err) {
    ElMessage.error(err?.message || '获取文章分类失败')
  } finally {
    categoriesLoading.value = false
  }
}

async function loadPages() {
  pagesLoading.value = true
  try {
    const res = await contentApi.adminGetPages()
    pages.value = res.data || []
  } catch (err) {
    ElMessage.error(err?.message || '获取栏目单页失败')
  } finally {
    pagesLoading.value = false
  }
}

// --- 文章操作 ---

function openCreateArticleModal() {
  isEditArticle.value = false
  editingArticleId.value = null
  Object.assign(articleForm, {
    title: '',
    slug: '',
    categoryId: '',
    coverImage: '',
    summary: '',
    content: '',
    status: 'DRAFT'
  })
  articleDialogVisible.value = true
}

function openEditArticleModal(row) {
  isEditArticle.value = true
  editingArticleId.value = row.id
  Object.assign(articleForm, {
    title: row.title,
    slug: row.slug,
    categoryId: row.categoryId ? String(row.categoryId) : '',
    coverImage: row.coverImage || '',
    summary: row.summary || '',
    content: row.content || '',
    status: row.status
  })
  articleDialogVisible.value = true
}

async function saveArticle() {
  await articleFormRef.value.validate()
  articleSubmitting.value = true
  try {
    const payload = {
      title: articleForm.title.trim(),
      slug: articleForm.slug.trim(),
      categoryId: articleForm.categoryId || undefined,
      coverImage: articleForm.coverImage.trim() || undefined,
      summary: articleForm.summary.trim() || undefined,
      content: articleForm.content,
      status: articleForm.status
    }

    if (isEditArticle.value) {
      await contentApi.adminUpdateArticle(editingArticleId.value, payload)
      ElMessage.success('文章已更新')
    } else {
      await contentApi.adminCreateArticle(payload)
      ElMessage.success('文章创建成功')
    }
    articleDialogVisible.value = false
    loadArticles()
  } catch (err) {
    ElMessage.error(err?.message || '操作失败')
  } finally {
    articleSubmitting.value = false
  }
}

async function toggleArticleStatus(row, newStatus) {
  try {
    await contentApi.adminUpdateArticleStatus(row.id, newStatus)
    ElMessage.success(`文章已${newStatus === 'PUBLISHED' ? '发布' : '下架'}`)
    loadArticles()
  } catch (err) {
    ElMessage.error(err?.message || '状态切换失败')
  }
}

async function deleteArticleItem(row) {
  try {
    await ElMessageBox.confirm(`确认删除文章《${row.title}》吗？此操作不可逆。`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await contentApi.adminDeleteArticle(row.id)
    ElMessage.success('文章已删除')
    loadArticles()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err?.message || '删除失败')
    }
  }
}

// --- 分类操作 ---

function openCreateCategoryModal() {
  isEditCategory.value = false
  editingCategoryId.value = null
  Object.assign(categoryForm, { name: '', slug: '', sortOrder: 0 })
  categoryDialogVisible.value = true
}

function openEditCategoryModal(row) {
  isEditCategory.value = true
  editingCategoryId.value = row.id
  Object.assign(categoryForm, { name: row.name, slug: row.slug, sortOrder: row.sortOrder })
  categoryDialogVisible.value = true
}

async function saveCategory() {
  await categoryFormRef.value.validate()
  categorySubmitting.value = true
  try {
    const payload = {
      name: categoryForm.name.trim(),
      slug: categoryForm.slug.trim(),
      sortOrder: Number(categoryForm.sortOrder)
    }
    if (isEditCategory.value) {
      await contentApi.adminUpdateCategory(editingCategoryId.value, payload)
      ElMessage.success('分类已更新')
    } else {
      await contentApi.adminCreateCategory(payload)
      ElMessage.success('分类创建成功')
    }
    categoryDialogVisible.value = false
    loadCategories()
  } catch (err) {
    ElMessage.error(err?.message || '操作失败')
  } finally {
    categorySubmitting.value = false
  }
}

async function deleteCategoryItem(row) {
  try {
    await ElMessageBox.confirm(`确认删除分类「${row.name}」吗？`, '删除确认', {
      type: 'warning'
    })
    await contentApi.adminDeleteCategory(row.id)
    ElMessage.success('分类已删除')
    loadCategories()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err?.message || '删除失败')
    }
  }
}

// --- 栏目页面操作 ---

function openEditPageModal(row) {
  currentPage.value = row
  pageForm.title = row.title
  pageForm.status = row.status
  pageForm.sectionsJson = row.sectionsJson || '[]'
  pageDialogVisible.value = true
}

async function savePage() {
  try {
    JSON.parse(pageForm.sectionsJson)
  } catch (e) {
    ElMessage.error('分块内容 JSON 格式有误，请核对后再保存')
    return
  }

  pageSubmitting.value = true
  try {
    await contentApi.adminUpdatePage(currentPage.value.id, {
      title: pageForm.title.trim(),
      status: pageForm.status,
      sectionsJson: pageForm.sectionsJson
    })
    ElMessage.success('栏目单页配置已更新')
    pageDialogVisible.value = false
    loadPages()
  } catch (err) {
    ElMessage.error(err?.message || '更新失败')
  } finally {
    pageSubmitting.value = false
  }
}

onMounted(() => {
  loadArticles()
  loadCategories()
  loadPages()
})
</script>

<style scoped>
.admin-content-view {
  padding: 24px;
}

.page-head {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
}

.page-sub {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
}

.admin-tabs {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.table-thumb {
  width: 50px;
  height: 38px;
  object-fit: cover;
  border-radius: 4px;
}

.table-thumb-placeholder {
  width: 50px;
  height: 38px;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border-radius: 4px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
  line-height: 1.4;
}
</style>
