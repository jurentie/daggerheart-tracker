import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      workbox: {
        cleanupOutdatedCaches: true,
        globIgnores: ['icons/*-source.svg'],
        globPatterns: ['**/*.{html,js,css,png,svg,woff,woff2,webmanifest}'],
        navigateFallback: 'index.html',
      },
      manifest: {
        id: '/',
        name: 'Daggerheart Stat Tracker',
        short_name: 'Daggerheart',
        description: 'Track Daggerheart character resources at the table or on the go.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#10152f',
        theme_color: '#17131f',
        categories: ['games', 'utilities'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
