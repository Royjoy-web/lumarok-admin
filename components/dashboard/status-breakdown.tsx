"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StatusBreakdownProps {
  items: Array<{
    label: string
    value: number
    color: string
  }>
  loading?: boolean
  className?: string
}

export function StatusBreakdown({ items, loading, className }: StatusBreakdownProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className={cn("bg-card rounded-2xl border border-border/50 p-5", className)}>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
        Device Status
      </h3>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full skeleton" />
              <div className="flex-1 h-4 skeleton rounded" />
              <div className="w-8 h-4 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="flex-1 text-sm text-foreground">{item.label}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {item.value}
              </span>
            </div>
          ))}
          
          {/* Progress bar visualization */}
          {total > 0 && (
            <div className="flex h-2 rounded-full overflow-hidden bg-muted mt-4">
              {items.map((item, index) => {
                const percentage = (item.value / total) * 100
                if (percentage === 0) return null
                return (
                  <div
                    key={index}
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
