import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/-/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/-/',
      scope: '/-/',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'レシート家計簿',
        short_name: '家計簿',
        description: 'レシートを読み取って記録する家計簿アプリ。店舗・企業別のランキングやグラフで支出を可視化。',
        start_url: '/-/',
        scope: '/-/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f9f9f7',
        theme_color: '#2a78d6',
        icons: [
          { src: '/-/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/-/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/-/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
})
