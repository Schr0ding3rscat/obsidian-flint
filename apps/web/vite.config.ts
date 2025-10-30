import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const APP_NAME = process.env.VITE_APP_NAME ?? 'Flint2';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/app.svg'],
      manifest: {
        id: 'app.flint2',
        name: APP_NAME,
        short_name: 'Flint2',
        description: 'Privacy-first Markdown workspace',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#2563eb',
        background_color: '#111827',
        icons: [
          {
            src: '/icons/app.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/app.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: false
      }
    })
  ],
  build: {
    target: 'esnext',
    sourcemap: true
  },
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    host: true
  }
});
