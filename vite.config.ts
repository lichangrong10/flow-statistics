import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5273,
    strictPort: true,
    proxy: {
      // 真实后端（内网）：前端同源请求 /api，由 Vite 转发，避免 CORS
      '/api': {
        target: 'http://192.168.9.224:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1800,
  },
})
