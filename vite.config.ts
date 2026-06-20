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
        name: 'ゼニ帳',
        short_name: 'ゼニ帳',
        description: '賭け事の戦績管理アプリ',
        start_url: '/-/',
        scope: '/-/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0A0905',
        theme_color: '#0A0905',
        icons: [
          { src: '/-/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/-/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/-/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Google Fonts stylesheet
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
