import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/DeadlineApp/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeManifestIcons: false,
      manifest: {
        id: '/DeadlineApp/',
        name: '期限くん',
        short_name: '期限くん',
        description: '期限から逆算して、TODOと毎日の習慣を整えるアプリ',
        lang: 'ja',
        start_url: '/DeadlineApp/',
        scope: '/DeadlineApp/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#26A79A',
        background_color: '#F5F7F7',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
}))
