import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// Ground of the light theme (DESIGN.md «frosted-ground»), same as theme-color in index.html.
const GROUND = '#f2f5f9'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable app that opens offline (docs/roadmap/11-pwa.md). A new version waits for
    // «Обновить» (src/app/UpdatePrompt.tsx): a silent reload could drop what is being typed.
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Порции',
        short_name: 'Порции',
        description: 'Пересчёт веса еды «сырой ↔ готовый» с учётом тары и деление блюда на порции для калорийного трекера.',
        lang: 'ru',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: GROUND,
        background_color: GROUND,
        // Written by `pnpm icons` (pwa-assets.config.ts).
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The whole build, the Rubik font included: the app has to open with no network at all.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Rubik ships Arabic and Hebrew too; the browser never asks for them in a Russian UI.
        globIgnores: ['**/rubik-arabic-*', '**/rubik-hebrew-*'],
        navigateFallback: 'index.html',
        // The API (stage 12) always goes to the network.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
