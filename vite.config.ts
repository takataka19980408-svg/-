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
        background_color: '#0a0805',
        theme_color: '#0a0805',
        icons: [
          { src: '/-/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/-/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/-/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // OCR model/wasm assets are large and only needed once the user scans a
        // receipt — fetched and cached lazily via runtimeCaching below instead of
        // bloating the initial install precache.
        globIgnores: ['**/tesseract-assets/**'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/tesseract-assets\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tesseract-ocr-assets',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
