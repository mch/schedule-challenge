import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import wasm from 'vite-plugin-wasm'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Craft 2026 Schedule',
        short_name: 'Craft 2026',
        description: 'Personal schedule app for Craft Conference 2026, Budapest',
        theme_color: '#ff4d00',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cache schedule data and WASM module alongside static assets.
        // maximumFileSizeToCacheInBytes raised to 4 MiB to cover automerge.wasm (~2.75 MiB).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,wasm}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/sw\.js$/, /^\/workbox-.*\.js$/],
      },
    }),
  ],
})
