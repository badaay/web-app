import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
    base: '/web-app/',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                admin: resolve(__dirname, 'admin/index.html'),
                login: resolve(__dirname, 'admin/login.html'),
            },
        },
        build: {
            outDir: 'dist',
        }
    },
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'supabase-api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 24 * 60 * 60 // 24 hours
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'map-tiles-cache',
                            expiration: {
                                maxEntries: 500,
                                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                            }
                        }
                    }
                ]
            },
            manifest: {
                name: 'Lightweight Multi-Role Web App',
                short_name: 'WebApp',
                description: 'Offline-capable PWA for managing operations.',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ]
});
