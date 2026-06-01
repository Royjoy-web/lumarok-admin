"use client"

import * as React from "react"
import { Logs as LogsAPI, type LogEntry } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Search, Download, FileText, RefreshCw, Filter } from "lucide-react"

const LEVEL_OPTIONS = ['', 'info', 'warn', 'error', 'critical']
const CATEGORY_OPTIONS = ['', 'auth', 'device', 'system', 'security', 'installer', 'users', 'energy', 'safety']

export default function LogsPage() {
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [pagination, setPagination] = React.useState({ total: 0, page: 1 })
  
  // Filters
  const [unitId, setUnitId] = React.useState('')
  const [category, setCategory] = React.useState('')
  const [level, setLevel] = React.useState('')
  const [action, setAction] = React.useState('')

  const loadLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      const { data, pagination: pag } = await LogsAPI.get({
        unit_id: unitId || undefined,
        category: category || undefined,
        level: level || undefined,
        action: action || undefined,
      })
      setLogs(data || [])
      setPagination(pag)
    } catch (err) {
      console.error('Failed to load logs:', err)
    } finally {
      setLoading(false)
    }
  }, [unitId, category, level, action])

  React.useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleExport = () => {
    const csv = [
      'Time,Unit,Action,Category,Level',
      ...logs.map(l => [
        new Date(l.createdAt).toISOString(),
        l.unit_id || '',
        l.action || '',
        l.category || '',
        l.level || ''
      ].map(v => `"${v}"`).join(','))
    ].join('\n')

    const a = document.createElement('a')
    a.href = 'data:text/csv,' + encodeURIComponent(csv)
    a.download = `lumarok-logs-${Date.now()}.csv`
    a.click()
  }

  const getLevelBadge = (lvl?: string) => {
    const styles: Record<string, string> = {
      info: 'bg-success/10 text-success border-success/20',
      warn: 'bg-warning/10 text-warning border-warning/20',
      warning: 'bg-warning/10 text-warning border-warning/20',
      error: 'bg-destructive/10 text-destructive border-destructive/20',
      critical: 'bg-destructive/10 text-destructive border-destructive/20',
    }
    return (
      <span className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded border",
        styles[lvl || ''] || 'bg-muted text-muted-foreground border-border'
      )}>
        {lvl || '-'}
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Activity Logs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            System events and audit trail
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLogs} disabled={loading} className="gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Unit ID"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="pl-9"
            />
          </div>
          <Input
            placeholder="Action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border/30 bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.filter(Boolean).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border/30 bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
          >
            <option value="">All Levels</option>
            {LEVEL_OPTIONS.filter(Boolean).map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pagination Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {logs.length} of {pagination.total} entries
        </p>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Time</TableHead>
              <TableHead className="font-semibold">Unit ID</TableHead>
              <TableHead className="font-semibold">Action</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-5 skeleton rounded w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">No logs yet</p>
                      <p className="text-sm text-muted-foreground">
                        Events will appear here as your units come online.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-sm text-muted-foreground">
                    {timeAgo(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {log.unit_id ? (
                      <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                        {log.unit_id}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono">{log.action || '-'}</code>
                  </TableCell>
                  <TableCell className="text-sm">{log.category || '-'}</TableCell>
                  <TableCell>{getLevelBadge(log.level)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
