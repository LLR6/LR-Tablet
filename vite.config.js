import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png'],
      manifest: {
        name: 'LR 拼豆',
        short_name: 'LR拼豆',
        description: '图片转拼豆网格、手动点豆、颜色统计与图纸导出的离线拼豆工具',
        lang: 'zh-CN',
        theme_color: '#ff8fbe',
        background_color: '#fff8fb',
        display: 'standalone',
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
