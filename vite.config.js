import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png'],
      manifest: {
        name: 'LR-考研独门秘籍（私人独享至尊版）',
        short_name: 'LR考研秘籍',
        description: '考研英语、408、315、415、政治、番茄钟、背单词与全能错题本私人学习工具',
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
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,json}'],
        maximumFileSizeToCacheInBytes: 16 * 1024 * 1024
      }
    })
  ],
  build: { target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 1800 }
})
