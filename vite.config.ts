import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // The prerender (SSR) build only renders marketing HTML; it needs no service worker.
    !isSsrBuild &&
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        devOptions: { enabled: false },
        includeAssets: ['favicon.ico', 'favicon.png', 'apple-touch-icon.png', 'logo-96.webp', 'logo-96.png'],
        workbox: {
          // Pages are prerendered per route and must always come fresh from the network,
          // so the worker only caches hashed JS/CSS and never answers navigations.
          globPatterns: ['**/*.{js,css}'],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        },
        manifest: {
          id: '/',
          name: 'Gymmigo: gyms, runs and an AI coach',
          short_name: 'Gymmigo',
          description: 'Find gyms near you, check in with QR, follow training plans you approve and run with friends.',
          lang: 'en-IN',
          start_url: '/app/dashboard',
          scope: '/',
          theme_color: '#F1F1F3',
          background_color: '#F1F1F3',
          display: 'standalone',
          categories: ['health', 'fitness', 'lifestyle'],
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // Long-lived vendor chunks shared by every page, so app deploys don't bust them.
        // (Maps, QR scanning etc. stay in their lazy route chunks.)
        manualChunks: isSsrBuild
          ? undefined
          : (id: string) => {
              if (!id.includes('node_modules')) return undefined;
              if (/[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return 'react';
              if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion';
              if (id.includes('@tanstack')) return 'query';
              return undefined;
            },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
