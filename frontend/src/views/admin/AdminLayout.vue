<template>
  <div class="admin-layout">
    <aside class="admin-sidebar" :class="{ open: sidebarOpen }">
      <router-link to="/" class="admin-brand"><img src="/logo.svg" alt="WEMOVE Logo" /><span><strong>WEMOVE</strong><small>运营管理后台</small></span></router-link>
      <nav class="sidebar-nav" aria-label="管理后台导航">
        <template v-for="group in menuGroups" :key="group.title">
          <p class="nav-title">{{ group.title }}</p>
          <router-link v-for="item in group.items" :key="item.path" :to="item.path" class="side-link" @click="sidebarOpen=false">
            <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span>
          </router-link>
        </template>
      </nav>
      <div class="sidebar-footer"><p>当前版本</p><strong>课程验收版</strong><span>所有管理数据来自真实 API</span></div>
    </aside>
    <div v-if="sidebarOpen" class="sidebar-mask" @click="sidebarOpen=false"></div>

    <section class="admin-main">
      <header class="admin-topbar">
        <div class="topbar-left"><button class="sidebar-toggle" aria-label="打开后台菜单" @click="sidebarOpen=!sidebarOpen"><el-icon><Menu /></el-icon></button><div><span>运营管理后台</span><strong>{{ currentTitle }}</strong></div></div>
        <div class="topbar-right"><router-link to="/" class="front-link"><el-icon><House /></el-icon>官网首页</router-link><el-dropdown trigger="click" @command="handleUserCommand"><button class="account-button"><span class="account-avatar">{{ avatarText }}</span><span class="account-copy"><strong>{{ userStore.userInfo.username }}</strong><small>{{ roleText }}</small></span><el-icon><ArrowDown /></el-icon></button><template #dropdown><el-dropdown-menu><el-dropdown-item command="account">账户与安全</el-dropdown-item><el-dropdown-item command="front">返回官网</el-dropdown-item><el-dropdown-item divided command="logout">退出登录</el-dropdown-item></el-dropdown-menu></template></el-dropdown></div>
      </header>
      <main class="admin-content"><router-view /></main>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'

/** 管理后台统一外壳：只展示已接入真实接口的模块，不保留“待接入”假导航。 */
const route=useRoute();const router=useRouter();const userStore=useUserStore();const sidebarOpen=ref(false)
const menuGroups=[
  {title:'工作台',items:[{path:'/admin',label:'运营概览',icon:'DataAnalysis'},{path:'/admin/operation',label:'站点运营',icon:'SetUp'}]},
  {title:'商品与渠道',items:[{path:'/admin/products',label:'产品与分类',icon:'Goods'},{path:'/admin/dealers',label:'经销商管理',icon:'OfficeBuilding'},{path:'/admin/dealer-business',label:'报价 / 订单 / 发票',icon:'Tickets'}]},
  {title:'内容与服务',items:[{path:'/admin/content',label:'内容与栏目',icon:'Document'},{path:'/admin/support',label:'留言 / FAQ / 下载',icon:'Service'}]},
  {title:'账号与权限',items:[{path:'/admin/users',label:'用户管理',icon:'UserFilled'}]}
]
const titleMap={AdminOverview:'运营概览',AdminOperation:'站点运营',AdminProducts:'产品与分类',AdminProductCreate:'新增产品',AdminProductEdit:'编辑产品',AdminDealers:'经销商管理',AdminDealerBusiness:'报价 / 订单 / 发票',AdminContent:'内容与栏目',AdminSupport:'支持中心',AdminUsers:'用户管理'}
const currentTitle=computed(()=>titleMap[route.name]||'运营管理后台');const avatarText=computed(()=>(userStore.userInfo.username||'管').slice(0,1).toUpperCase());const roleText=computed(()=>userStore.isPreviewActive?`预览：${userStore.currentRole}`:'管理员')
function handleUserCommand(command){if(command==='front')router.push('/');else if(command==='account')router.push('/account');else if(command==='logout')logout()}
async function logout(){const result=await userStore.logout();if(!result.ok)ElMessage.error(result.error?.message||'退出失败');router.push('/')}
</script>

<style scoped>
.admin-layout{min-height:100vh;display:flex;background:#f5f5f2;color:var(--text-color)}.admin-sidebar{position:sticky;top:0;width:236px;height:100vh;flex:0 0 236px;display:flex;flex-direction:column;background:#fff;border-right:1px solid var(--border-color);z-index:60}.admin-brand{height:68px;display:flex;align-items:center;gap:11px;padding:0 21px;border-bottom:1px solid var(--border-color)}.admin-brand img{width:35px;height:35px;border-radius:9px}.admin-brand span{display:grid;line-height:1.2}.admin-brand strong{font-size:15px;letter-spacing:.08em}.admin-brand small{margin-top:4px;color:var(--text-light);font-size:10px;letter-spacing:.05em}.sidebar-nav{flex:1;overflow-y:auto;padding:16px 11px}.nav-title{margin:16px 11px 6px;color:var(--text-light);font-size:9px;font-weight:800;letter-spacing:.17em}.nav-title:first-child{margin-top:0}.side-link{display:flex;align-items:center;gap:11px;min-height:40px;margin:3px 0;padding:8px 12px;border-radius:9px;color:var(--text-muted);font-size:12px;font-weight:500;transition:.18s ease}.side-link:hover{color:var(--text-color);background:var(--bg-light)}.side-link.router-link-exact-active,.side-link.router-link-active:not([href="/admin"]){color:var(--accent-color);background:#fbf1e9;font-weight:700;box-shadow:inset 3px 0 var(--accent-color)}.sidebar-footer{display:grid;gap:2px;margin:12px;padding:13px;background:var(--bg-light);border-radius:10px}.sidebar-footer p,.sidebar-footer span{margin:0;color:var(--text-light);font-size:9px}.sidebar-footer strong{font-size:11px}.admin-main{min-width:0;flex:1}.admin-topbar{position:sticky;top:0;z-index:40;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;color:#fff;background:#252b2c;box-shadow:0 2px 14px rgba(31,41,55,.16)}.topbar-left,.topbar-right,.front-link,.account-button{display:flex;align-items:center}.topbar-left{gap:12px}.topbar-left>div{display:grid;line-height:1.22}.topbar-left span{color:rgba(255,255,255,.45);font-size:9px;letter-spacing:.12em}.topbar-left strong{font-size:14px}.topbar-right{gap:16px}.front-link{gap:6px;color:rgba(255,255,255,.68);font-size:11px}.front-link:hover{color:#fff}.account-button{gap:9px;padding:5px 8px;border:1px solid rgba(255,255,255,.12);border-radius:999px;color:#fff;background:rgba(255,255,255,.06);cursor:pointer}.account-avatar{width:28px;height:28px;display:grid!important;place-items:center;color:#fff!important;background:var(--primary-hover);border-radius:50%;font-size:10px!important}.account-copy{display:grid!important;min-width:80px;text-align:left;line-height:1.25}.account-copy strong{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}.account-copy small{color:rgba(255,255,255,.45);font-size:8px}.sidebar-toggle{display:none;width:33px;height:33px;border:0;border-radius:8px;color:#fff;background:rgba(255,255,255,.08)}.admin-content{max-width:1500px;min-height:calc(100vh - 64px);margin:0 auto;padding:26px}.sidebar-mask{display:none}
@media(max-width:800px){.admin-sidebar{position:fixed;left:0;transform:translateX(-100%);transition:transform .22s ease}.admin-sidebar.open{transform:translateX(0)}.sidebar-mask{display:block;position:fixed;inset:0;z-index:50;background:rgba(31,41,55,.4)}.sidebar-toggle{display:grid;place-items:center}.front-link{display:none}.admin-content{padding:18px 14px}.account-copy{display:none!important}}
</style>
