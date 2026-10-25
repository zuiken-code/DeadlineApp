import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Cloudflare Workers serves from /; GitHub Pages passes /DeadlineApp/ at build time.
const base = process.env.DEPLOY_BASE_PATH || '/'
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }
const commit = (() => {
  const commitFromEnvironment = process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA
  if (commitFromEnvironment) return commitFromEnvironment.slice(0, 7)
  try {
    return execFileSync('git', ['-c', `safe.directory=${process.cwd()}`, 'rev-parse', '--short=7', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
})()

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeManifestIcons: false,
      manifest: {
        id: base,
        name: '期限くん',
        short_name: '期限くん',
        description: '期限から逆算して、TODOの進捗を管理するアプリ',
        lang: 'ja',
        start_url: base,
        scope: base,
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
        importScripts: ['push-sw.js'],
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
      devOptions: { enabled: false },
    }),
  ],
})
