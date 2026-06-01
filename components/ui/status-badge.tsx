import { cn } from "@/lib/utils"

type StatusType = 
  | 'ACTIVE' 
  | 'ONLINE' 
  | 'PROVISIONED' 
  | 'FACTORY_READY' 
  | 'BATCH_QUEUED'
  | 'DISABLED' 
  | 'EXPIRED' 
  | 'OFFLINE' 
  | 'OTA_PENDING'

interface StatusBadgeProps {
  status: string
  showPulse?: boolean
  className?: string
}

const statusConfig: Record<StatusType, { label: string; className: string; pulse: boolean }> = {
  ACTIVE: { label: 'Active', className: 'bg-success/10 text-success border-success/20', pulse: true },
  ONLINE: { label: 'Online', className: 'bg-success/10 text-success border-success/20', pulse: true },
  PROVISIONED: { label: 'Provisioned', className: 'bg-primary/10 text-primary border-primary/20', pulse: false },
  FACTORY_READY: { label: 'Factory Ready', className: 'bg-muted text-muted-foreground border-border', pulse: false },
  BATCH_QUEUED: { label: 'Batch Queued', className: 'bg-muted text-muted-foreground border-border', pulse: false },
  DISABLED: { label: 'Disabled', className: 'bg-destructive/10 text-destructive border-destructive/20', pulse: false },
  EXPIRED: { label: 'Expired', className: 'bg-destructive/10 text-destructive border-destructive/20', pulse: false },
  OFFLINE: { label: 'Offline', className: 'bg-muted/50 text-muted-foreground/70 border-border', pulse: false },
  OTA_PENDING: { label: 'OTA Pending', className: 'bg-warning/10 text-warning border-warning/20', pulse: false },
}

export function StatusBadge({ status, showPulse = true, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status || 'Unknown',
    className: 'bg-muted/50 text-muted-foreground/70 border-border',
    pulse: false,
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded border",
        config.className,
        className
      )}
    >
      {config.pulse && showPulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </span>
  )
}
