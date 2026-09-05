<template>
  <div class="site-root">
    <!-- Render FrontHeader on all regular pages -->
    <FrontHeader v-if="!isAdminRoute" />

    <main class="site-main">
      <router-view />
    </main>

    <FrontFooter v-if="!isAdminRoute" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FrontHeader from './components/FrontHeader.vue'
import FrontFooter from './components/FrontFooter.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
</script>

<style>
/* Global resets & root */
</style>

