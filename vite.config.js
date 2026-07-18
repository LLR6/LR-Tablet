import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'LR 学习工作台',
        short_name: 'LR',
        description: '适配荣耀平板的本地学习、视频讲义与阅读工作台',
        lang: 'zh-CN',
        theme_color: '#10182a',
        background_color: '#f3f6fb',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024
      }
    })
  ],
  build: { target: 'es2022', sourcemap: false }
})
