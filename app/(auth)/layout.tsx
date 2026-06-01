"use client"

import * as React from "react"
import { AuthProvider } from "@/components/providers/auth-provider"
import { SplashScreen } from "@/components/splash-screen"

const SPLASH_KEY = 'lumarok_splash_shown'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showSplash, setShowSplash] = React.useState(false)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    // Only show splash once per session
    const hasShown = sessionStorage.getItem(SPLASH_KEY)
    if (!hasShown) {
      setShowSplash(true)
    } else {
      setReady(true)
    }
  }, [])

  const handleSplashComplete = React.useCallback(() => {
    sessionStorage.setItem(SPLASH_KEY, 'true')
    setShowSplash(false)
    setReady(true)
  }, [])

  return (
    <AuthProvider>
      {showSplash && (
        <SplashScreen 
          onComplete={handleSplashComplete} 
          minDisplayTime={1600}
        />
      )}
      <div 
        className={
          ready 
            ? "opacity-100 transition-opacity duration-300 ease-out" 
            : "opacity-0"
        }
      >
        {children}
      </div>
    </AuthProvider>
  )
}
