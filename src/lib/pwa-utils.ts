/**
 * PWA Utility Functions
 * Service worker registration and management
 */

/**
 * Register service worker
 * @returns Promise that resolves when SW is registered
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })
    
    console.log('[PWA] Service worker registered:', registration.scope)
    
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      console.log('[PWA] Service worker update found')
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available, reload to activate
            window.location.reload()
          }
        })
      }
    })
    
    return registration
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error)
    return null
  }
}

/**
 * Check if PWA is installable
 * @returns True if PWA can be installed on device
 */
export function isPWAInstallable(): boolean {
  return !!('beforeinstallprompt' in window)
}

/**
 * Check if app is running as installed PWA
 * @returns True if running as standalone app
 */
export function isPWAInstalled(): boolean {
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  
  return isStandalone
}

/**
 * Check if iOS device
 * @returns True if iOS (iPhone/iPad)
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Check online status
 * @returns True if online, false if offline
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * Listen for online/offline changes
 * @param callback - Function called when online status changes
 * @returns Cleanup function to remove event listeners
 */
export function onOnlineChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * Request background sync (for pending changes when back online)
 * @returns void
 */
export function requestBackgroundSync(): void {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register('pending-changes')
    })
  }
}

/**
 * Cache offline data for sync
 * @param data - Data to cache for offline sync
 * @param key - Unique key for cached data
 */
export function cacheOfflineData(data: any, key: string): void {
  if ('localStorage' in window) {
    const offlineCache = JSON.parse(localStorage.getItem('pwa-offline-cache') || '{}')
    offlineCache[key] = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem('pwa-offline-cache', JSON.stringify(offlineCache))
    console.log('[PWA] Cached offline data:', key)
  }
}

/**
 * Get offline cached data
 * @param key - Key of cached data
 * @returns Cached data or null
 */
export function getOfflineData(key: string): any | null {
  if ('localStorage' in window) {
    const offlineCache = JSON.parse(localStorage.getItem('pwa-offline-cache') || '{}')
    if (offlineCache[key]) {
      console.log('[PWA] Retrieved offline data:', key)
      return offlineCache[key].data
    }
  }
  return null
}

/**
 * Clear offline cache
 * @returns void
 */
export function clearOfflineCache(): void {
  if ('localStorage' in window) {
    localStorage.removeItem('pwa-offline-cache')
    console.log('[PWA] Cleared offline cache')
  }
}

/**
 * Get PWA install prompt
 * @returns Promise that resolves with install prompt
 */
export function getPWAInstallPrompt(): Promise<any> {
  return new Promise((resolve) => {
    if (isPWAInstallable()) {
      const handler = (event: Event) => {
        event.preventDefault()
        resolve((event as any).prompt)
        window.removeEventListener('beforeinstallprompt', handler)
      }
      
      window.addEventListener('beforeinstallprompt', handler)
    } else {
      resolve(null)
    }
  })
}

/**
 * Show PWA installation prompt
 * @param deferredPrompt - Install prompt from beforeinstallprompt event
 */
export async function installPWA(deferredPrompt: any): Promise<boolean> {
  if (!deferredPrompt) return false
  
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  
  return outcome === 'accepted'
}
