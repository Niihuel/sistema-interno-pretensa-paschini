import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '192.168.0.219',
    port: 4350,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '192.168.0.219',
    port: 4350,
    strictPort: true,
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'robots.txt', 'apple-touch-icon-180x180.png'],
      injectRegister: 'inline',
      manifest: {
        id: '/',
        name: 'Sistema Pretensa & Paschini',
        short_name: 'Pretensa',
        description: 'Sistema interno de gestión para Pretensa & Paschini',
        lang: 'es-AR',
        dir: 'ltr',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen', 'minimal-ui'],
        orientation: 'portrait-primary',  // Forzar portrait como ChatGPT/Spotify
        scope: '/',
        start_url: '/?utm_source=pwa',
        categories: ['productivity', 'business'],
        prefer_related_applications: false,
        // Screenshots para iOS (mejora la experiencia de instalación)
        screenshots: [
          {
            src: 'screenshot-1.png',
            sizes: '1170x2532',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Dashboard principal'
          },
          {
            src: 'screenshot-2.png',
            sizes: '2048x2732',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Vista de escritorio'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Ver dashboard principal',
            url: '/dashboard',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Tickets',
            short_name: 'Tickets',
            description: 'Gestionar tickets',
            url: '/tickets',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Inventario',
            short_name: 'Inventario',
            description: 'Ver inventario',
            url: '/inventory',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          // Ícono adicional para mejor soporte iOS
          {
            src: 'apple-touch-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
})
