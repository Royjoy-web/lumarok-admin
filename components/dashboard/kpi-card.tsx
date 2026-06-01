"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  subtitle?: string
  loading?: boolean
  className?: string
  variant?: 'default' | 'highlight' | 'muted'
}

export function KPICard({
  label,
  value,
  icon,
  subtitle,
  loading,
  className,
  variant = 'default'
}: KPICardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl p-5 transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-xl hover:shadow-black/10",
        variant === 'default' && "bg-card border border-border/50",
        variant === 'highlight' && "bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20",
        variant === 'muted' && "bg-muted/30 border border-border/30",
        className
      )}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
            {label}
          </p>
          {loading ? (
            <div className="h-8 w-20 rounded-lg bg-muted/50 animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold text-foreground tracking-tight">
              {value}
            </p>
          )}
          {subtitle && !loading && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-foreground/5 text-foreground/60 group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
