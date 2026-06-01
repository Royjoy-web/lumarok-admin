import { cn } from "@/lib/utils"

interface SignalBarProps {
  value: number | null | undefined
  className?: string
}

export function SignalBar({ value, className }: SignalBarProps) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground text-sm">-</span>
  }

  // Normalize: RSSI (-100 to -30) -> percentage, or raw 0-100
  const percentage = value < 0 
    ? Math.max(0, Math.min(100, ((value + 100) / 70) * 100)) 
    : Math.min(100, value)
  
  const bars = Math.ceil(percentage / 25)
  
  const getBarColor = (barIndex: number, activeCount: number) => {
    if (barIndex >= activeCount) return 'bg-border'
    if (percentage > 60) return 'bg-success'
    if (percentage > 30) return 'bg-warning'
    return 'bg-destructive'
  }

  return (
    <div 
      className={cn("flex items-end gap-0.5 h-4", className)}
      title={`Signal: ${Math.round(percentage)}%`}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-sm transition-all duration-200",
            getBarColor(i - 1, bars)
          )}
          style={{ height: `${i * 4}px` }}
        />
      ))}
    </div>
  )
}
