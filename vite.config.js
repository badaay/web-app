import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// Vercel deployment uses root path
const BASE_URL = '/';

function activityRewritePlugin() {
    return {
        name: 'activity-rewrite',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                // Match ${BASE_URL}:employeeid/activity  (pretty URL pattern)
                // e.g. /web-app/EMP001/activity  →  /web-app/activity.html?eid=EMP001
                // NOTE: 'code' is reserved by Supabase PKCE — we use 'eid' instead.
                const activityRegex = new RegExp('^' + BASE_URL.replace(/\//g, '\\/') + '([^\\/]+)\\/activity(\\?.*)?$');
                const match = req.url && req.url.match(activityRegex);
                if (match) {
                    const employeeId = match[1];
                    const existingQuery = match[2] || '';
                    const separator = existingQuery ? '&' : '?';
                    req.url = `${BASE_URL}activity.html${existingQuery}${separator}eid=${employeeId}`;
                }
                next();
            });
        }
    };
}

export default defineConfig({
    base: BASE_URL,
    server: {
        // Proxy /api/* requests to Vercel Edge Functions locally
        // For local development without Vercel CLI, set up a mock server
        // or use `vercel dev` to test actual Edge Functions
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path,
                configure: (proxy, options) => {
                    proxy.on('error', (err, req, res) => {
                        console.log('Proxy error:', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'API proxy error - ensure `vercel dev` or local API server is running' }));
                    });
                }
            }
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                admin: resolve(__dirname, 'admin/index.html'),
                login: resolve(__dirname, 'admin/login.html'),
                'add-psb': resolve(__dirname, 'admin/add-psb.html'),
                'enduser-login': resolve(__dirname, 'enduser/login.html'),
                'enduser-dashboard': resolve(__dirname, 'enduser/dashboard.html'),
                'activity': resolve(__dirname, 'activity.html'),
            },
        },
        build: {
            outDir: 'dist',
        }
    },
    plugins: [
        activityRewritePlugin(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                // This is a Multi-Page App (MPA). Disable the SPA navigation
                // fallback that vite-plugin-pwa adds by default. That fallback
                // intercepts every navigation whose URL isn't an exact cache
                // hit and returns index.html — which is wrong here because
                // activity.html?eid=X, dashboard.html?cid=X, etc. all get
                // their query params stripped by precache's exact-match logic
                // and then fall through to the NavigationRoute catch-all.
                navigateFallback: null,

                // Ignore custom app query params when looking up precached
                // HTML files so activity.html?eid=X → serves activity.html.
                ignoreURLParametersMatching: [/^eid$/, /^cid$/, /^customer$/, /^redirect$/, /^success$/, /^token$/],

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
