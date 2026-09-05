import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// 端口与代理基线（#84 决策 D1）：Vite(3000) 将 /api 同源代理到本地 NestJS API(3001)，
// 生产环境由 Nginx 承担同源转发，前端代码只请求相对路径 /api/v1，全程不开 CORS。
const API_TARGET = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        // 三方库拆为独立 vendor chunk：与业务代码分开缓存，避免主包超过告警阈值
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-element': ['element-plus', '@element-plus/icons-vue']
        }
      }
    }
  }
})
