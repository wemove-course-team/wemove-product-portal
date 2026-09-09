import { createRouter, createWebHistory } from 'vue-router'
import CoverView from '../views/CoverView.vue'
import HomeView from '../views/HomeView.vue'
import { useUserStore } from '../stores/user'

/**
 * 路由基线（#86 MVP-02，按 issue「开发补充」评论的三分组约定）
 *
 * - 三区划分：public 公开浏览 / account 账户区 / admin 运营后台区（meta.zone，App.vue 按区渲染布局）
 * - 页面全部懒加载（首屏 Home 除外），主要路由完成代码分割
 * - 受保护路由使用 meta.roles 预检（['ADMIN'] / ['DEALER','ADMIN']）；真正的权限
 *   由后端在每个接口上裁决（决策 D5），守卫只做会话预检以改善体验；
 *   会话预检请求带 6s 短超时，后端不可用时快速降级而不是长时间白屏
 * - 决策 D9：购物车/订单本轮不启用，/cart 路由与顶栏入口关闭（组件文件保留）
 * - 未知路由进入独立 404 页面（不再静默跳回首页）；旧 /product/:id、/workshop
 *   保留重定向兼容，不破坏既有外链
 */

const routes = [
  // ---------------------------------- 公开区 ----------------------------------
  // 品牌画册级独立全屏封面（无 Header / 无 Footer，纯净全屏沉浸画幅）
  {
    path: '/',
    name: 'Cover',
    component: CoverView,
    meta: { zone: 'public', hideHeader: true, hideFooter: true }
  },
  {
    path: '/cover',
    name: 'CoverDirect',
    component: CoverView,
    meta: { zone: 'public', hideHeader: true, hideFooter: true }
  },
  // 官网门户首页（自然文档流排版，无黑条，优雅磨砂悬浮顶栏）
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: { zone: 'public' }
  },
  // 产品列表（关键词/年龄/排序条件在 ?q/?age/?sort 查询参数中，#87 接入 API 分页 ?page=）
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/product/ProductListView.vue'),
    meta: { zone: 'public' }
  },
  // 产品分类列表（#87 契约：/categories/:slug）
  {
    path: '/categories/:slug',
    name: 'ProductCategory',
    component: () => import('../views/product/ProductListView.vue'),
    meta: { zone: 'public' }
  },
  // 产品详情（#87 契约：/products/:slug；旧 /product/:id 在文末重定向兼容）
  {
    path: '/products/:slug',
    name: 'ProductDetail',
    component: () => import('../views/product/ProductDetailView.vue'),
    meta: { zone: 'public' }
  },
  // 内容栏目页（7 个栏目 slug 与原站保持一致，#88 接入内容 API 后 URL 不变）
  {
    path: '/furniture',
    name: 'Furniture',
    component: () => import('../views/ContentPage.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/woodlab',
    name: 'WoodLab',
    component: () => import('../views/ContentPage.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/stem',
    name: 'Stem',
    component: () => import('../views/ContentPage.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/library',
    name: 'Library',
    component: () => import('../views/ContentPage.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/charity',
    name: 'Charity',
    component: () => import('../views/ContentPage.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/dream',
    name: 'Dream',
    component: () => import('../views/ContentPage.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/electronic',
    name: 'Electronic',
    component: () => import('../views/ContentPage.vue'),
    meta: { zone: 'public' }
  },
  // 新闻动态列表与详情（#88 MVP-04）
  {
    path: '/news',
    name: 'NewsList',
    component: () => import('../views/content/NewsList.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/news/:slug',
    name: 'NewsDetail',
    component: () => import('../views/content/NewsDetail.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/dealers/apply',
    name: 'DealerApply',
    component: () => import('../views/dealer/DealerApply.vue'),
    meta: { zone: 'public' }
  },
  // 支持中心三页（#89 交付 ContactForm / FaqList / DownloadList 前先挂占位页）
  {
    path: '/support',
    name: 'Support',
    component: () => import('../views/support/ContactView.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/faq',
    name: 'Faq',
    component: () => import('../views/support/FaqView.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/downloads',
    name: 'Downloads',
    component: () => import('../views/support/DownloadView.vue'),
    meta: { zone: 'public' }
  },

  // 决策 D9：订单/购物车本轮不启用，路由与入口一并关闭（CartView.vue 文件保留）
  // {
  //   path: '/cart',
  //   name: 'Cart',
  //   component: () => import('../views/CartView.vue'),
  //   meta: { zone: 'public' }
  // },

  // ---------------------------------- 账户区 ----------------------------------
  {
    path: '/login',
    name: 'AccountLogin',
    component: () => import('../views/account/AccountLoginView.vue'),
    meta: { zone: 'account' }
  },
  {
    path: '/register',
    name: 'AccountRegister',
    component: () => import('../views/account/AccountRegisterView.vue'),
    meta: { zone: 'account' }
  },
  // 找回密码（#85 token 流程：申请 → dev 日志 token → 确认重置）
  {
    path: '/reset-password',
    name: 'AccountResetPassword',
    component: () => import('../views/account/AccountResetPasswordView.vue'),
    meta: { zone: 'account' }
  },
  {
    path: '/account',
    name: 'AccountHome',
    component: () => import('../views/account/AccountHomeView.vue'),
    meta: { zone: 'account', roles: ['USER', 'DEALER', 'ADMIN'] }
  },
  // 经销商中心：独立于公开官网和管理后台，所有子路由按企业边界鉴权。
  {
    path: '/dealer',
    component: () => import('../views/dealer/DealerLayout.vue'),
    meta: { zone: 'dealer', roles: ['DEALER'] },
    children: [
      { path: '', name: 'DealerDashboard', component: () => import('../views/dealer/DealerPortal.vue'), meta: { zone: 'dealer', roles: ['DEALER'] } },
      { path: 'catalog', name: 'DealerCatalog', component: () => import('../views/dealer/DealerCatalogView.vue'), meta: { zone: 'dealer', roles: ['DEALER'] } },
      { path: 'quick-order', name: 'DealerQuickOrder', component: () => import('../views/dealer/DealerCatalogView.vue'), props: { quickOrder: true }, meta: { zone: 'dealer', roles: ['DEALER'] } },
      { path: 'quotes', name: 'DealerQuotes', component: () => import('../views/dealer/DealerRecordsView.vue'), props: { mode: 'quotes' }, meta: { zone: 'dealer', roles: ['DEALER'] } },
      { path: 'orders', name: 'DealerOrders', component: () => import('../views/dealer/DealerRecordsView.vue'), props: { mode: 'orders' }, meta: { zone: 'dealer', roles: ['DEALER'] } },
      { path: 'invoices', name: 'DealerInvoices', component: () => import('../views/dealer/DealerRecordsView.vue'), props: { mode: 'invoices' }, meta: { zone: 'dealer', roles: ['DEALER'] } },
      { path: 'downloads', name: 'DealerDownloads', component: () => import('../views/support/DownloadView.vue'), props: { pageTitle: '经销商资料下载' }, meta: { zone: 'dealer', roles: ['DEALER'] } },
      { path: 'company', name: 'DealerCompany', component: () => import('../views/dealer/DealerCompanyView.vue'), meta: { zone: 'dealer', roles: ['DEALER'] } },
      { path: 'support', name: 'DealerSupport', component: () => import('../views/dealer/DealerSupportView.vue'), meta: { zone: 'dealer', roles: ['DEALER'] } },
      { path: 'security', name: 'DealerSecurity', component: () => import('../views/dealer/DealerSecurityView.vue'), meta: { zone: 'dealer', roles: ['DEALER'] } }
    ]
  },
  { path: '/dealer/portal', redirect: { name: 'DealerDashboard' }, meta: { zone: 'dealer', roles: ['DEALER'] } },

  // ---------------------------------- 后台区 ----------------------------------
  // /admin 外壳（AdminLayout.vue）归 #86 维护；子页面由各领域任务接入
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { zone: 'admin', roles: ['ADMIN'] },
    children: [
      {
        path: '',
        name: 'AdminOverview',
        component: () => import('../views/admin/AdminOverviewPanel.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      },
      {
        path: 'operation',
        name: 'AdminOperation',
        component: () => import('../views/admin/AdminOperationView.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      },
      {
        // #87 MVP-03：产品/分类管理列表（含分类管理 Tab）
        path: 'products',
        name: 'AdminProducts',
        component: () => import('../views/product/AdminProductList.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      },
      {
        path: 'products/new',
        name: 'AdminProductCreate',
        component: () => import('../views/product/AdminProductEdit.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      },
      {
        path: 'products/:id/edit',
        name: 'AdminProductEdit',
        component: () => import('../views/product/AdminProductEdit.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      },
      {
        path: 'content',
        name: 'AdminContent',
        component: () => import('../views/admin/AdminContent.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      },
      {
        path: 'support',
        name: 'AdminSupport',
        component: () => import('../views/support/AdminSupportView.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      },
      {
        path: 'dealers',
        name: 'AdminDealers',
        component: () => import('../views/admin/AdminDealers.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      },
      {
        path: 'dealer-business',
        name: 'AdminDealerBusiness',
        component: () => import('../views/admin/AdminDealerBusiness.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/AdminUsers.vue'),
        meta: { zone: 'admin', roles: ['ADMIN'] }
      }
    ]
  },

  // ---------------------------------- 错误状态 ----------------------------------
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('../views/error/ForbiddenView.vue'),
    meta: { zone: 'public' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/error/NotFoundView.vue'),
    meta: { zone: 'public' }
  },

  // --------------------------------- 旧路由兼容 ---------------------------------
  // 旧产品详情 /product/:id → 新 slug 路由；slug 可能是历史数字 id，详情页做兼容解析
  {
    path: '/product/:id',
    redirect: (to) => ({ name: 'ProductDetail', params: { slug: to.params.id } }),
    meta: { zone: 'public' }
  },
  // 旧产品列表入口 → 新产品列表（筛选条件由 URL 查询参数承载）
  {
    path: '/workshop',
    redirect: (to) => ({ name: 'Products', query: to.query }),
    meta: { zone: 'public' }
  },
  // 中间态兼容：上一版骨架曾使用 /account/login，统一收敛到 /login
  {
    path: '/account/login',
    redirect: { name: 'AccountLogin' },
    meta: { zone: 'account' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  // 登录/注册/找回密码页对已登录用户直接进入账户页
  if (to.name === 'AccountLogin' || to.name === 'AccountRegister' || to.name === 'AccountResetPassword') {
    // 开发预览态无需服务端会话即可判定（仅 DEV 构建存在预览态）
    if (!userStore.isPreviewActive) {
      await userStore.ensureSession()
    }
    if (userStore.isAuthenticated || userStore.isPreviewActive) {
      return { name: 'AccountHome' }
    }
    return true
  }

  const requiredRoles = to.matched.reduce(
    (roles, record) => (record.meta?.roles ? record.meta.roles : roles),
    null
  )
  if (!requiredRoles) return true

  // 开发预览不需要服务端会话，直接放行（仅 DEV 构建存在预览态）
  if (userStore.isPreviewActive) {
    return requiredRoles.includes(userStore.currentRole) ? true : { name: 'Forbidden', query: { from: to.fullPath } }
  }

  await userStore.ensureSession()

  const hasSession = userStore.isAuthenticated
  if (!hasSession) {
    return { name: 'AccountLogin', query: { redirect: to.fullPath } }
  }
  if (!requiredRoles.includes(userStore.currentRole)) {
    return { name: 'Forbidden', query: { from: to.fullPath } }
  }
  return true
})

export default router
