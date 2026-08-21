import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Configuration Vite : React + PWA installable avec mise en cache du
// catalogue pour une consultation possible même en connexion faible/hors-ligne.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Ma Boutique — Gestion & Commandes',
        short_name: 'Ma Boutique',
        description: 'Catalogue, commandes et gestion de stock pour la boutique.',
        lang: 'fr',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Précache des assets de l'app (JS/CSS/HTML)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            // Catalogue public : cache "network first" pour rester à jour en
            // ligne, mais consultable hors-ligne si la connexion coupe.
            urlPattern: ({ url, sameOrigin }) => !sameOrigin && url.pathname.startsWith('/api/public/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'catalogue-api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }, // 24h
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images produits uploadées
            urlPattern: ({ url, sameOrigin }) => !sameOrigin && url.pathname.startsWith('/uploads/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-produits',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 jours
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    // En dev, on proxifie /api et /uploads vers le backend PHP pour éviter
    // tout souci de CORS (voir .env VITE_API_URL pour la config en prod).
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
