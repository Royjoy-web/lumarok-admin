"use client"

import * as React from "react"
import { Admin, Factory, Logs, type Stats, type BatchInfo, type LogEntry } from "@/lib/api"
import { KPICard } from "@/components/dashboard/kpi-card"
import { StatusBreakdown } from "@/components/dashboard/status-breakdown"
import { FactoryPool } from "@/components/dashboard/factory-pool"
import { Radio, Activity, Users, Cpu, ArrowRight, Zap, Shield, Package } from "lucide-react"

export default function DashboardPage() {
  const [stats, setStats] = React.useState<Stats | null>(null)
  const [batchInfo, setBatchInfo] = React.useState<BatchInfo | null>(null)
  const [recentLogs, setRecentLogs] = React.useState<LogEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    try {
      setError(null)
      
      const [statsResponse, factoryResponse, logsResponse] = await Promise.all([
        Admin.stats(),
        Factory.status().catch(() => ({ active: null })),
        Logs.get({ limit: 4 }).catch(() => ({ data: [] })),
      ])
      setStats(statsResponse.stats)
      setBatchInfo(factoryResponse.active)
      setRecentLogs(logsResponse.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const unitBreakdown = React.useMemo(() => {
    if (!stats) return []
    const u = stats.units
    return [
      { label: 'Active', value: u.active || 0, color: 'hsl(var(--chart-1))' },
      { label: 'Provisioned', value: u.provisioned || 0, color: 'hsl(var(--chart-2))' },
      { label: 'Standby', value: Math.max(0, (u.total - (u.active || 0) - (u.provisioned || 0) - (u.disabled || 0))), color: 'hsl(var(--chart-3))' },
      { label: 'Offline', value: u.disabled || 0, color: 'hsl(var(--chart-4))' },
    ]
  }, [stats])

  const getActivityIcon = (category: string) => {
    switch (category) {
      case 'ota': return <Zap className="w-3.5 h-3.5" />
      case 'device': return <Radio className="w-3.5 h-3.5" />
      case 'auth': return <Users className="w-3.5 h-3.5" />
      case 'system': return <Shield className="w-3.5 h-3.5" />
      default: return <Activity className="w-3.5 h-3.5" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Radio className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Unable to Load</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-4">{error}</p>
        <button
          onClick={() => { setLoading(true); loadData() }}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">Command Center</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Fleet overview and system health</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Fleet"
          value={stats?.units.total ?? '-'}
          subtitle="Total devices"
          icon={<Radio className="w-4 h-4" />}
          loading={loading}
          variant="highlight"
        />
        <KPICard
          label="Online"
          value={stats?.units.active ?? '-'}
          subtitle={stats && stats.units.total > 0 ? `${Math.round((stats.units.active / stats.units.total) * 100)}% uptime` : undefined}
          icon={<Activity className="w-4 h-4" />}
          loading={loading}
        />
        <KPICard
          label="Team"
          value={stats?.users.total ?? '-'}
          subtitle={stats ? `${stats.users.installers} technicians` : undefined}
          icon={<Users className="w-4 h-4" />}
          loading={loading}
        />
        <KPICard
          label="Paired"
          value={stats && stats.devices.total > 0 ? `${Math.round((stats.devices.bound / stats.devices.total) * 100)}%` : '-'}
          subtitle={stats ? `${stats.devices.bound} of ${stats.devices.total}` : undefined}
          icon={<Cpu className="w-4 h-4" />}
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status + Pool */}
        <div className="lg:col-span-2 space-y-4">
          <StatusBreakdown items={unitBreakdown} loading={loading} />
          <FactoryPool
            remaining={batchInfo?.remaining ?? 0}
            total={batchInfo?.quantity ?? 0}
            isAlert={batchInfo?.pool_alert}
            loading={loading}
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Recent Activity
            </h3>
            <a href="/dashboard/logs" className="text-xs text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="space-y-3">
            {recentLogs.length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
            {recentLogs.map((log) => (
              <div key={log._id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/50 text-muted-foreground flex-shrink-0">
                  {getActivityIcon(log.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{log.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{log.unit_id || log.category}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTimeAgo(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/dashboard/units"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover:scale-[1.02]"
        >
          <Radio className="w-4 h-4" />
          Manage Fleet
          <ArrowRight className="w-3.5 h-3.5 opacity-60" />
        </a>
        <a
          href="/dashboard/installers"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card text-foreground rounded-xl hover:bg-muted/50 transition-all border border-border/50"
        >
          <Users className="w-4 h-4" />
          Team
        </a>
        <a
          href="/dashboard/ota"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-card text-foreground rounded-xl hover:bg-muted/50 transition-all border border-border/50"
        >
          <Package className="w-4 h-4" />
          Deploy Update
        </a>
      </div>
    </div>
  )
}
