'use client'

import { useState, useEffect } from 'react'
import { X, Download, Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * PWA Install Prompt Component
 * Detects if app can be installed as PWA
 * Shows install button for mobile devices
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if PWA is installable
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt((event as any).prompt)
      setShowPrompt(true)
    }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Check if running as standalone app (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    
    setIsInstalled(isStandalone)

    // Check if iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOS)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  /**
   * Handle PWA installation
   */
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('[PWA] App installed successfully')
        setIsInstalled(true)
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  /**
   * Don't show prompt again (dismiss)
   */
  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true')
    setShowPrompt(false)
  }

  // Check if user dismissed before
  const wasDismissed = localStorage.getItem('pwa-install-dismissed') === 'true'

  // Don't show if already installed, no prompt available, or dismissed
  if (!deferredPrompt || isInstalled || wasDismissed) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 z-50">
      <Card className="shadow-2xl border-emerald-200 bg-white animate-in slide-in-from-bottom-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Install App
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {isIOS ? (
                    <>Install on your iPhone/iPad</>
                  ) : (
                    <>Add to home screen for quick access</>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span>Works offline - Access your ledgers anytime</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Fast app-like experience</span>
          </div>
          
          {isIOS ? (
            <div className="bg-amber-50 border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2 text-sm text-amber-900">
                <Smartphone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">How to install:</p>
                  <ol className="mt-1.5 space-y-1 text-amber-800 list-decimal list-inside">
                    <li>Tap Share button</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Confirm installation</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleInstall}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Offline Detection Component
 * Shows when user is offline
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Initial status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('[PWA] Back online')
      setIsOnline(true)
      // Sync any pending changes
    }

    const handleOffline = () => {
      console.log('[PWA] Gone offline')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Don't show if online
  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-amber-100 border-b-2 border-amber-400 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-amber-900">
            <WifiOff className="w-5 h-5" />
            <div>
              <p className="font-semibold">You're offline</p>
              <p className="text-sm">Cached data available. Changes will sync when online.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
            className="bg-amber-200 hover:bg-amber-300 border-amber-400 text-amber-900"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reconnect
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * PWA Status Component
 * Shows online/offline status and install status
 */
export function PWAStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Online/offline status
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check if installed as PWA
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone
    
    setIsInstalled(isStandalone)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isInstalled) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
      {isOnline ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-slate-700">
            Online · PWA Installed
          </span>
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-700">
            Offline · Using cached data
          </span>
          <WifiOff className="w-3.5 h-3.5 text-amber-600" />
        </>
      )}
    </div>
  )
}
