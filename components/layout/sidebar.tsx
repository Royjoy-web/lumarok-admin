"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Radio,
  Users,
  Upload,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  Shield,
  Terminal,
  Activity,
  Bell,
  FolderTree,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  section?: string
}

const navItems: NavItem[] = [
  { title: "Command Center", href: "/dashboard", icon: LayoutDashboard, section: "overview" },
  { title: "Alerts", href: "/dashboard/alerts", icon: Bell, badge: 3, section: "overview" },
  { title: "Device Fleet", href: "/dashboard/units", icon: Radio, section: "management" },
  { title: "Device Groups", href: "/dashboard/groups", icon: FolderTree, section: "management" },
  { title: "Team Access", href: "/dashboard/installers", icon: Users, section: "management" },
  { title: "Firmware Updates", href: "/dashboard/ota", icon: Upload, section: "operations" },
  { title: "Activity Logs", href: "/dashboard/logs", icon: Terminal, section: "operations" },
  { title: "Configuration", href: "/dashboard/settings", icon: Settings, section: "system" },
]

const sections = [
  { id: "overview", label: "Overview" },
  { id: "management", label: "Management" },
  { id: "operations", label: "Operations" },
  { id: "system", label: "System" },
]

export function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ease-out h-full",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <Image
          src="/lumarok/inapp/logo-icon-sidebar.png"
          alt="LumaRoK"
          width={40}
          height={40}
          className="flex-shrink-0"
        />
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-foreground">
            LumaRoK
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {sections.map((section) => {
          const sectionItems = navItems.filter((item) => item.section === section.id)
          if (sectionItems.length === 0) return null

          return (
            <div key={section.id} className="mb-4">
              {!collapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold text-sidebar-muted uppercase tracking-widest">
                  {section.label}
                </p>
              )}
              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== "/dashboard" && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavClick}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                        collapsed && "justify-center px-2",
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/20 shadow-sm"
                          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "relative flex items-center justify-center",
                        isActive && "text-primary"
                      )}>
                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                        {isActive && (
                          <span className="absolute inset-0 bg-primary/20 rounded-full blur-md -z-10" />
                        )}
                      </div>
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.title}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 h-5">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* System Status (mini) */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
            <Activity className="w-3.5 h-3.5 text-success" />
            <span className="text-[11px] font-medium text-sidebar-muted">All Systems Operational</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="px-2 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent justify-center",
            !collapsed && "justify-start"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* User Section */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/30",
            collapsed && "justify-center px-1"
          )}
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent text-[12px] font-bold text-primary-foreground flex-shrink-0 shadow-md">
            {user?.email?.[0]?.toUpperCase() || "A"}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-sidebar" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {user?.name || "Administrator"}
              </p>
              <p className="text-[10px] text-sidebar-muted truncate flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-primary" />
                {user?.role === 'admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "w-full mt-2 text-sidebar-muted hover:text-destructive hover:bg-destructive/10 justify-center",
            !collapsed && "justify-start"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2 text-xs">Sign Out</span>}
        </Button>
      </div>

      {/* Version Footer */}
      {!collapsed && (
        <div className="px-4 py-2 border-t border-sidebar-border">
          <p className="text-[9px] text-sidebar-muted/60 font-mono text-center">
            LumaRoK Admin v4.0.0
          </p>
        </div>
      )}
    </aside>
  )
}
