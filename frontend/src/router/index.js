import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WorkshopView from '../views/WorkshopView.vue'
import ProductDetail from '../views/ProductDetail.vue'
import ContentPage from '../views/ContentPage.vue'
import DealerApply from '../views/DealerApply.vue'
import DealerPortal from '../views/DealerPortal.vue'
import CartView from '../views/CartView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/workshop',
    name: 'Workshop',
    component: WorkshopView
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetail
  },
  // Content pages
  {
    path: '/furniture',
    name: 'Furniture',
    component: ContentPage
  },
  {
    path: '/woodlab',
    name: 'WoodLab',
    component: ContentPage
  },
  {
    path: '/stem',
    name: 'Stem',
    component: ContentPage
  },
  {
    path: '/library',
    name: 'Library',
    component: ContentPage
  },
  {
    path: '/charity',
    name: 'Charity',
    component: ContentPage
  },
  {
    path: '/dream',
    name: 'Dream',
    component: ContentPage
  },
  {
    path: '/electronic',
    name: 'Electronic',
    component: ContentPage
  },
  // B2B & Dealer
  {
    path: '/dealers/apply',
    name: 'DealerApply',
    component: DealerApply
  },
  {
    path: '/dealer/portal',
    name: 'DealerPortal',
    component: DealerPortal
  },
  // Commerce
  {
    path: '/cart',
    name: 'Cart',
    component: CartView
  },
  // Admin
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router

