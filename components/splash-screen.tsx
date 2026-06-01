"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { useTheme } from 'next-themes'

interface SplashScreenProps {
  onComplete?: () => void
  minDisplayTime?: number
}

export function SplashScreen({ onComplete, minDisplayTime = 1500 }: SplashScreenProps) {
  const [visible, setVisible] = React.useState(true)
  const [fadeOut, setFadeOut] = React.useState(false)
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 400)
    }, minDisplayTime)

    return () => clearTimeout(timer)
  }, [minDisplayTime, onComplete])

  if (!visible) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500",
        fadeOut && "opacity-0 pointer-events-none"
      )}
    >
      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <Image
          src={resolvedTheme === 'dark'
            ? '/lumarok/inapp/logo-splash-dark.png'
            : '/lumarok/inapp/logo-splash-light.png'}
          alt="LumaRoK Admin"
          width={600}
          height={375}
          priority
          className="object-contain"
        />
      </div>

      {/* Elegant circular spinner */}
      <div className="relative z-10 mt-10">
        <div className="w-8 h-8 rounded-full border-2 border-border/40 border-t-primary animate-spin" />
      </div>

      {/* Version */}
      <p className="absolute bottom-8 text-[10px] text-muted-foreground/40 font-medium tracking-wider uppercase">
        v4.0.0
      </p>
    </div>
  )
}
