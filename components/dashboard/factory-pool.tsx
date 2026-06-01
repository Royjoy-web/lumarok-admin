"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FactoryPoolProps {
  remaining: number
  total: number
  isAlert?: boolean
  loading?: boolean
  className?: string
}

export function FactoryPool({
  remaining,
  total,
  isAlert,
  loading,
  className
}: FactoryPoolProps) {
  const percentage = total > 0 ? Math.round((remaining / total) * 100) : 0

  return (
    <div className={cn("bg-card rounded-2xl border border-border/50 p-5", className)}>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
        Inventory Pool
      </h3>
      
      {loading ? (
        <div className="space-y-3">
          <div className="h-6 skeleton rounded w-32" />
          <div className="h-2 skeleton rounded-full" />
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2 mb-3">
            <span className={cn(
              "text-2xl font-bold",
              isAlert ? "text-warning" : "text-success"
            )}>
              {remaining}
            </span>
            <span className="text-muted-foreground">/ {total} units</span>
            {isAlert && (
              <span className="ml-auto px-2 py-0.5 text-[10px] font-medium rounded-full bg-warning/10 text-warning">
                Low Stock
              </span>
            )}
            {!isAlert && remaining > 0 && (
              <span className="ml-auto px-2 py-0.5 text-[10px] font-medium rounded-full bg-success/10 text-success">
                In Stock
              </span>
            )}
          </div>
          
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-out rounded-full",
                isAlert ? "bg-warning" : "bg-success"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            {percentage}% capacity remaining
          </p>
        </>
      )}
    </div>
  )
}
