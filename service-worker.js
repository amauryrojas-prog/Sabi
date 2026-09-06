// Bump when the app shell changes so clients discard stale HTML/CSS/JS.
const CACHE_NAME = 'sabi-cache-v999';
const ASSETS_TO_CACHE = [
  './index.html',
  './app.js',
  './app_v3.js',
  './sabi_data_v3.js',
  './sabi_data_v2.js',
  './sabi_data.js',
  './draws_data.js',
  './zodiac_data.js',
  './style_v3.css',
  './style_v2.css',
  './style.css',
  './logo.png'
];

// Install Event: Cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('⚡ [Service Worker] Caching App Shell Assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('⚡ [Service Worker] Removing Old Cache:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first falling back to cache offline
self.addEventListener('fetch', event => {
  // Only handle GET requests and local assets
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If response is valid, clone it and put it in cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: Serve from cache
        console.log('⚡ [Service Worker] App is Offline. Serving from cache:', event.request.url);
        return caches.match(event.request);
      })
  );
});
