"use client"

import * as React from "react"
import { Bell, AlertTriangle, WifiOff, Battery, Thermometer, CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alerts, type Alert, type AlertSeverity } from "@/lib/api"

const severityConfig: Record<AlertSeverity, { color: string; bg: string; icon: typeof AlertTriangle }> = {
  critical: { color: "text-red-400", bg: "bg-red-500/10", icon: AlertTriangle },
  warning: { color: "text-amber-400", bg: "bg-amber-500/10", icon: AlertTriangle },
  info: { color: "text-blue-400", bg: "bg-blue-500/10", icon: Bell },
  resolved: { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
}

const categoryIcons = {
  connectivity: WifiOff,
  battery: Battery,
  temperature: Thermometer,
  firmware: Bell,
  security: AlertTriangle,
}

function formatRelativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function AlertsPage() {
  const [alerts, setAlerts] = React.useState<Alert[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<AlertSeverity | "all">("all")
  const [unacknowledged, setUnacknowledged] = React.useState(0)

  const fetchAlerts = React.useCallback(async (sev: AlertSeverity | "all") => {
    setLoading(true)
    try {
      const d = await Alerts.get(sev)
      setAlerts(d.alerts)
      setUnacknowledged(d.unacknowledged)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load alerts")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchAlerts(filter) }, [filter, fetchAlerts])

  const acknowledgeAlert = async (id: string) => {
    try {
      const d = await Alerts.acknowledge(id)
      setAlerts(prev => prev.map(a => a._id === id ? d.alert : a))
      setUnacknowledged(prev => Math.max(0, prev - 1))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to acknowledge")
    }
  }

  const acknowledgeAllAlerts = async () => {
    try {
      await Alerts.acknowledgeAll()
      setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))
      setUnacknowledged(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to acknowledge all")
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Alerts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {unacknowledged > 0 ? `${unacknowledged} unread notifications` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={acknowledgeAllAlerts}
            className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Mark all read
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg w-fit">
        {(["all", "critical", "warning", "info", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
              filter === f
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
              <div className="w-10 h-10 rounded-lg skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton rounded w-1/3" />
                <div className="h-3 skeleton rounded w-2/3" />
                <div className="h-3 skeleton rounded w-1/4 mt-3" />
              </div>
            </div>
          ))
        ) : alerts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">No alerts</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {filter === "all"
                ? "When your devices report issues, they will appear here."
                : `No ${filter} alerts at this time.`}
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = severityConfig[alert.severity]
            const CategoryIcon = categoryIcons[alert.category]

            return (
              <div
                key={alert._id}
                className={cn(
                  "flex items-start gap-4 p-4 bg-card rounded-xl border transition-all",
                  alert.acknowledged
                    ? "border-border/50 opacity-60"
                    : "border-border"
                )}
              >
                <div className={cn("p-2 rounded-lg", config.bg)}>
                  <CategoryIcon className={cn("w-4 h-4", config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(alert.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-muted-foreground">
                      {alert.unit_id ?? "—"}
                    </span>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert._id)}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
