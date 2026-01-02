import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAInstallPrompt, OfflineIndicator } from "@/components/pwa/PWAComponents";

export const viewport: Viewport = {
  width: "device-width",
  initialScale:1,
  maximumScale: 5,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Phase 1: iOS optimizations
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "Ledger Audit Pro - Professional Financial Tracking",
  // ... other metadata
  appleWebApp: { ... },
  icons: { ... },
  themeColor: "#059669",
  // ... other metadata
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <head>
        {/* Phase 1: PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Phase 1: Favicon and app icons */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="apple-touch-startup-image" href="/icon.svg" />
        
        {/* Phase 1: Theme color */}
        <meta name="theme-color" content="#059669" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-navbutton-color" content="#059669" />
        
        {/* Phase 1: iOS PWA specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ledger Pro" />
        <meta name="application-name" content="Ledger Pro" />
        
        {/* Phase 1: Mobile optimizations */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Phase 1: Viewport for iOS notch support */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, minimum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, safe-area-inset-top" />
        
        {/* Phase 1: Safe area support for iPhone notch */}
        <meta name="safe-area-inset-top" content="not-available" />
        <meta name="safe-area-inset-bottom" content="not-available" />
        <meta name="safe-area-inset-left" content="not-available" />
        <meta name="safe-area-inset-right" content="not-available" />
        
        {/* Phase 1: Apple touch optimizations */}
        <link rel="apple-touch-startup-image" href="/icon.svg" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <PWAInstallPrompt />
        <OfflineIndicator />
      </body>
    </html>
  );
}
