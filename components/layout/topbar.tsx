"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Menu, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Bell,
  ShieldCheck,
  Activity
} from "lucide-react"
import { Admin } from "@/lib/api"
import { cn } from "@/lib/utils"

interface TopbarProps {
  title: string
  onMenuClick?: () => void
}

type HealthStatus = 'healthy' | 'degraded' | 'offline'

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const [healthStatus, setHealthStatus] = React.useState<HealthStatus>('offline')
  const [healthLabel, setHealthLabel] = React.useState('Checking...')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const { status } = await Admin.mqttStatus()
        const ok = status === 'connected' || status === 'CONNECTED'
        setHealthStatus(ok ? 'healthy' : 'degraded')
        setHealthLabel(ok ? 'Connected' : 'Limited Connectivity')
      } catch {
        setHealthStatus('offline')
        setHealthLabel('Reconnecting...')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-6 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground"
      >
        <Menu className="w-5 h-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Page Title with Admin Badge */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-foreground tracking-tight">{title}</h1>
        <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary border-primary/30 bg-primary/5">
          <ShieldCheck className="w-3 h-3" />
          Admin
        </Badge>
      </div>

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-2">
        {/* System Status Indicator */}
        <div 
          className={cn(
            "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
            healthStatus === 'healthy' && "bg-success/10 text-success border-success/20",
            healthStatus === 'degraded' && "bg-warning/10 text-warning border-warning/20",
            healthStatus === 'offline' && "bg-destructive/10 text-destructive border-destructive/20"
          )}
        >
          <div className="relative flex items-center">
            {healthStatus === 'healthy' && (
              <>
                <Activity className="w-3.5 h-3.5" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-success rounded-full animate-ping" />
              </>
            )}
            {healthStatus === 'degraded' && (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
            {healthStatus === 'offline' && (
              <WifiOff className="w-3.5 h-3.5" />
            )}
          </div>
          <span>{healthLabel}</span>
        </div>

        {/* Mobile Status Indicator */}
        <div className="md:hidden relative">
          {healthStatus === 'healthy' && (
            <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          )}
          {healthStatus === 'degraded' && (
            <div className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
          )}
          {healthStatus === 'offline' && (
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
          )}
        </div>

        {/* Notifications (placeholder for future) */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      </div>
    </header>
  )
}
