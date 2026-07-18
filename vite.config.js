import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png'],
      manifest: {
        name: 'LR-考研英语真题特训（独家私人版）',
        short_name: 'LR英语特训',
        description: '为荣耀平板横屏优化的考研英语真题阅读训练、复盘与统计工具',
        lang: 'zh-CN',
        theme_color: '#7665d8',
        background_color: '#fffaf4',
        display: 'standalone',
        orientation: 'landscape',
        start_url: './',
        icons: [
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024
      }
    })
  ],
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 1600 }
})
