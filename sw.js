// SiFatih Work Order PWA Service Worker (Simplified)
// Basic caching for offline functionality

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `sifatih-workorder-${CACHE_VERSION}`;

// Files to cache for offline functionality
const CACHE_ASSETS = [
  '/',
  '/activity.html',
  '/admin/index.html',
  '/manifest.json',
  '/src/activity.js',
  '/src/admin/modules/main/work-orders/index.js',
  '/src/admin/modules/main/work-orders/list.js',
  '/src/admin/modules/main/work-orders/form.js',
  '/src/admin/modules/main/work-orders/monitoring.js',
  '/src/styles.css',
  '/src/technician-premium.css',
  '/src/api/supabase.js'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential files');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Essential files cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle different request types
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first, fallback to cache
    event.respondWith(networkFirst(request));
  } else {
    // Static assets - cache first
    event.respondWith(cacheFirst(request));
  }
});

// Network-first strategy for API requests
async function networkFirst(request) {
  try {
    console.log('Network-first for:', request.url);
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      
      // Notify clients about connection status
      notifyConnectionStatus(true);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache for:', request.url);
    
    // Notify clients about connection status
    notifyConnectionStatus(false);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/activity.html') || 
             new Response('Offline - No cached version available', { status: 503 });
    }
    
    return new Response('Offline - Network unavailable', { status: 503 });
  }
}

// Notify clients about connection status
function notifyConnectionStatus(isOnline) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'connection-status',
        isOnline: isOnline,
        timestamp: Date.now()
      });
    });
  });
}

// Cache-first strategy for static assets
async function cacheFirst(request) {
  console.log('Cache-first for:', request.url);
  
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed for cache-first:', request.url);
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

console.log('Service Worker: Loaded and ready');
