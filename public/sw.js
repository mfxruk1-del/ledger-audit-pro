// 🚀 Service Worker for PWA
// Caches app shell, assets, and API responses
// Enables offline functionality

const CACHE_NAME = 'ledger-pro-v1'
const ASSETS_CACHE_NAME = 'ledger-pro-assets-v1'
const API_CACHE_NAME = 'ledger-pro-api-v1'

// Cache URLs to cache immediately
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico'
]

// URLs to never cache
const EXCLUDED_URLS = [
  '/api/backup',
  '/api/auth'
]

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell')
      return cache.addAll(PRECACHE_URLS)
    })
  )
})

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME &&
                   cacheName !== ASSETS_CACHE_NAME &&
                   cacheName !== API_CACHE_NAME
          })
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip excluded URLs (backup, auth APIs)
  if (EXCLUDED_URLS.some((excluded) => url.pathname.includes(excluded))) {
    return
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // API requests - cache with network fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
    return
  }

  // Static assets - cache first
  if (url.pathname.includes('/icons/') || 
      url.pathname.includes('/screenshots/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg')) {
    event.respondWith(handleAssetRequest(request))
    return
  }

  // Page requests - network first with cache fallback
  event.respondWith(handlePageRequest(request))
})

/**
 * Handle API requests with caching
 * Strategy: Network First with Cache Fallback
 */
async function handleAPIRequest(request: Request) {
  try {
    // Try network first
    const networkResponse = await fetch(request.clone())
    
    // Cache the response for offline use
    const cache = await caches.open(API_CACHE_NAME)
    cache.put(request, networkResponse.clone())
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(API_CACHE_NAME)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('[Service Worker] API from cache (offline mode)')
      return cachedResponse
    }
    
    // No cached response, return error
    throw error
  }
}

/**
 * Handle asset requests (images, icons)
 * Strategy: Cache First
 */
async function handleAssetRequest(request: Request) {
  const cache = await caches.open(ASSETS_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    console.log('[Service Worker] Asset from cache:', request.url)
    return cachedResponse
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request)
    cache.put(request, networkResponse.clone())
    return networkResponse
  } catch (error) {
    throw new Error('[Service Worker] Failed to fetch asset')
  }
}

/**
 * Handle page requests
 * Strategy: Network First with Cache Fallback (for offline)
 */
async function handlePageRequest(request: Request) {
  const cache = await caches.open(CACHE_NAME)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('[Service Worker] Page from cache (offline mode):', request.url)
      return cachedResponse
    }
    
    // No cached response, return offline page
    return new Response(
      JSON.stringify({
        offline: true,
        message: 'You are currently offline. Please check your internet connection.'
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Background sync for offline changes
 * Syncs pending API requests when back online
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered')
  // Handle offline-to-online synchronization
  // This would integrate with your optimistic updates
})

/**
 * Handle push notifications (future feature)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    console.log('[Service Worker] Push notification received:', event.data)
    // Show notification
    const options = {
      body: event.data.body || 'Ledger Audit Pro update',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: event.data.tag || 'default',
      data: event.data.data || {}
    }
    
    self.registration.showNotification(event.data.title || 'Ledger Pro', options)
  }
})

/**
 * Periodic cache cleanup
 * Runs every 24 hours to remove old cache entries
 */
setInterval(() => {
  caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      caches.open(cacheName).then((cache) => {
        cache.keys().then((keys) => {
          // Remove cache entries older than 24 hours
          const now = Date.now()
          keys.forEach((request) => {
            if (request && (now - Date.parse(request.headers.get('date') || now)) > 86400000) {
              cache.delete(request)
            }
          })
        })
      })
    })
  })
}, 86400000) // 24 hours

console.log('[Service Worker] Loaded and ready')
