"use client"

import * as React from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/alerts': 'Alerts',
  '/dashboard/units': 'Device Fleet',
  '/dashboard/groups': 'Device Groups',
  '/dashboard/installers': 'Team Access',
  '/dashboard/ota': 'Firmware',
  '/dashboard/logs': 'Activity',
  '/dashboard/settings': 'Settings',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const isLoading = auth.isLoading
  const isAuthenticated = auth.isAuthenticated

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const pageTitle = pageTitles[pathname] || 'Dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden bg-black/50 transition-opacity duration-200",
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-200 ease-out",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onNavClick={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title={pageTitle} 
          onMenuClick={() => setMobileMenuOpen(true)} 
        />
        <div className="flex-1 overflow-y-auto">
          <div 
            key={pathname}
            className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in"
          >
            {children}
          </div>
        </div>
      </main>

    </div>
  )
}
