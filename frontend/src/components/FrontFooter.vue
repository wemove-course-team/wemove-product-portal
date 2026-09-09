<template>
  <footer class="site-footer">
    <div class="footer-content">
      <router-link to="/" class="footer-logo">
        {{ siteStore.siteName }}
      </router-link>

      <nav class="footer-nav">
        <router-link to="/">品牌首页</router-link>
        <router-link to="/products">益智玩具</router-link>
        <router-link to="/furniture">家具定制</router-link>
        <router-link to="/woodlab">中试打样</router-link>
        <router-link to="/stem">STEM课程</router-link>
        <router-link to="/dealers/apply">成为经销商</router-link>
        <router-link to="/electronic">电子说明书</router-link>
        <router-link to="/support">联系我们</router-link>
        <router-link to="/faq">常见问题</router-link>
        <router-link to="/downloads">下载中心</router-link>
      </nav>

      <div class="footer-slogan">
        专注自然实木游戏玩具与全屋定制 · 传承榫卯智慧 · 激发运动与创造力
      </div>

      <div v-if="hasContact" class="footer-contact">
        <a v-if="siteStore.config.contactPhone" :href="`tel:${siteStore.config.contactPhone}`">{{ siteStore.config.contactPhone }}</a>
        <a v-if="siteStore.config.contactEmail" :href="`mailto:${siteStore.config.contactEmail}`">{{ siteStore.config.contactEmail }}</a>
        <span v-if="siteStore.config.address">{{ siteStore.config.address }}</span>
      </div>

      <p class="footer-copy">
        {{ siteStore.config.footerText }}<template v-if="siteStore.config.icpNo"> · {{ siteStore.config.icpNo }}</template>
      </p>
    </div>
  </footer>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useSiteStore } from '../stores/site'

const siteStore = useSiteStore()
const hasContact = computed(() => Boolean(
  siteStore.config.contactPhone || siteStore.config.contactEmail || siteStore.config.address
))

onMounted(() => {
  siteStore.loadPublic().catch(() => undefined)
})
</script>

<style scoped>
.footer-logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: 1px;
}

.footer-slogan {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.footer-contact {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-bottom: 14px;
  color: var(--text-muted);
  font-size: 13px;
}

.footer-contact a:hover {
  color: var(--primary-hover);
}
</style>

