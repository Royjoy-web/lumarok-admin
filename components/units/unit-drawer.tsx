"use client"

import * as React from "react"
import { Units, Firmware, Logs, Admin, type Unit, type Device, type Room, type LogEntry } from "@/lib/api"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { timeAgo, formatDate } from "@/lib/format"
import { X, AlertTriangle, Download, RefreshCw, Power, Loader2 } from "lucide-react"

interface UnitDrawerProps {
  unitId: string | null
  onClose: () => void
  onRefresh: () => void
}

type TabType = 'overview' | 'devices' | 'credentials' | 'logs'

export function UnitDrawer({ unitId, onClose, onRefresh }: UnitDrawerProps) {
  const [unit, setUnit] = React.useState<Unit | null>(null)
  const [devices, setDevices] = React.useState<Device[]>([])
  const [rooms, setRooms] = React.useState<Room[]>([])
  const [logs, setLogs] = React.useState<LogEntry[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<TabType>('overview')
  const [otaInfo, setOtaInfo] = React.useState<{ has_update: boolean; latest_version?: string } | null>(null)

  React.useEffect(() => {
    if (!unitId) {
      setUnit(null)
      setError(null)
      return
    }

    const loadUnit = async () => {
      setLoading(true)
      setError(null)
      try {
        const { unit: loadedUnit, devices: loadedDevices, rooms: loadedRooms } = await Units.getDetail(unitId)
        setUnit(loadedUnit)
        setDevices(loadedDevices || [])
        setRooms(loadedRooms || [])

        // Load OTA info
        if (loadedUnit.firmware_version) {
          try {
            const ota = await Firmware.latest(unitId, loadedUnit.firmware_version)
            setOtaInfo(ota)
          } catch {
            // Non-critical
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load unit')
      } finally {
        setLoading(false)
      }
    }

    loadUnit()
  }, [unitId])

  // Load logs when tab is selected
  React.useEffect(() => {
    if (activeTab === 'logs' && unitId) {
      Logs.get({ unit_id: unitId, limit: 50 })
        .then(({ data }) => setLogs(data || []))
        .catch(() => setLogs([]))
    }
  }, [activeTab, unitId])

  const handleRegenerateCredentials = async () => {
    if (!unit) return
    try {
      const { credentials } = await Admin.generateCredentials(unit.unit_id, true)
      // Re-fetch unit to reflect updated mqtt_username
      const { unit: refreshed } = await Units.getDetail(unit.unit_id)
      setUnit(refreshed)
      // Surface credentials briefly — future: copy-to-clipboard flow
      alert(`New MQTT password: ${credentials.mqtt_password}\nStore this now — it cannot be retrieved again.`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownloadCredentials = () => {
    if (!unit) return
    const payload = {
      unit_id: unit.unit_id,
      mqtt_username: unit.mqtt_username,
      note: 'MQTT password and device_secret are not exposed here for security. Regenerate credentials to obtain a new plaintext password.',
    }
    const a = document.createElement('a')
    a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    a.download = `${unit.unit_id}-credentials.json`
    a.click()
  }

  const handleDeleteUnit = async () => {
    if (!unit) return
    if (!confirm(`Delete ${unit.unit_id}? This cannot be undone.`)) return
    try {
      await Admin.deleteUnit(unit.unit_id)
      onClose()
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }
    if (!unit) return
    try {
      await Units.emergencyStop(unit.unit_id)
      // Refresh
      const { unit: refreshed } = await Units.getDetail(unit.unit_id)
      setUnit(refreshed)
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleResetEmergencyStop = async () => {
    if (!unit) return
    try {
      await Units.resetEmergencyStop(unit.unit_id)
      const { unit: refreshed } = await Units.getDetail(unit.unit_id)
      setUnit(refreshed)
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  const isOpen = !!unitId

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6">
            <Button variant="ghost" size="icon" onClick={onClose} className="mb-4">
              <X className="w-5 h-5" />
            </Button>
            <div className="flex flex-col items-center gap-3 py-12">
              <AlertTriangle className="w-12 h-12 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : unit ? (
          <>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                      {unit.unit_id}
                    </code>
                    <StatusBadge status={unit.status} />
                  </div>
                  <p className="text-lg font-semibold text-foreground mt-1">
                    {unit.name || 'Unnamed Unit'}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/units?edit=${unit.unit_id}`}>
                  Edit
                </Button>
                <Button size="sm" onClick={() => window.location.href = `/dashboard/ota?unit=${unit.unit_id}`}>
                  Push OTA
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteUnit}>
                  Delete
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border px-6">
              <nav className="flex gap-0 -mb-px">
                {(['overview', 'devices', 'credentials', 'logs'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize",
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                    {tab === 'devices' && ` (${devices.length})`}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Firmware" value={unit.firmware_version || '-'} mono />
                    <DetailItem 
                      label="Last Seen" 
                      value={unit.last_seen ? formatDate(unit.last_seen) : '-'} 
                    />
                    <DetailItem label="Property Type" value={unit.property_type || '-'} />
                    <DetailItem label="Deploy Mode" value={unit.deployment_mode || '-'} />
                    <DetailItem label="Location" value={unit.location || '-'} />
                    <DetailItem label="Rooms" value={String(rooms.length)} />
                  </div>

                  {/* OTA Update Available */}
                  {otaInfo?.has_update && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm font-medium text-primary">
                        Firmware update available: {otaInfo.latest_version}
                      </p>
                    </div>
                  )}

                  {/* Emergency Stop */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Emergency Stop:</span>
                      {unit.emergency_stop_active ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-sm text-success">Clear</span>
                      )}
                    </div>
                    
                    {unit.emergency_stop_active ? (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-foreground">
                          Emergency stop is active. All outputs are cut.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={handleResetEmergencyStop}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="mt-3"
                        onClick={handleEmergencyStop}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        Force Offline / Emergency Stop
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'devices' && (
                <div>
                  {devices.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Power className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No devices bound</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {devices.map((device) => (
                        <div
                          key={device._id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div>
                            <code className="text-xs font-mono text-muted-foreground">
                              {device._id?.slice(-8) || '-'}
                            </code>
                            <p className="text-sm font-medium mt-0.5">
                              {device.type || device.kind || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              GPIO: {device.gpio_pin ?? '-'}
                            </span>
                            <StatusBadge status={device.status || 'OFFLINE'} />
                            {device.power_state ? (
                              <span className="text-xs text-success font-medium">On</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Off</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'credentials' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <DetailItem label="MQTT Username" value={unit.mqtt_username || '-'} mono />
                    <DetailItem label="MQTT Password" value="************" />
                    <DetailItem label="Device Secret" value={unit.device_secret ? '************' : '-'} />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" onClick={handleDownloadCredentials}>
                      <Download className="w-4 h-4 mr-2" />
                      Download JSON
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleRegenerateCredentials}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Credentials
                    </Button>
                  </div>

                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <p className="text-sm text-warning">
                      Regenerated credentials require the unit to be reflashed to function.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'logs' && (
                <div>
                  {logs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <p className="text-sm text-muted-foreground">No logs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log) => (
                        <div
                          key={log._id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                        >
                          <div>
                            <code className="text-xs font-mono">{log.action || '-'}</code>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {log.category || '-'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <LevelBadge level={log.level} />
                            <span className="text-xs text-muted-foreground">
                              {timeAgo(log.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}

function DetailItem({ 
  label, 
  value, 
  mono 
}: { 
  label: string
  value: string
  mono?: boolean 
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  )
}

function LevelBadge({ level }: { level?: string }) {
  const config: Record<string, string> = {
    info: 'bg-success/10 text-success',
    warn: 'bg-warning/10 text-warning',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-destructive/10 text-destructive',
    critical: 'bg-destructive/10 text-destructive',
  }

  return (
    <span className={cn(
      "px-1.5 py-0.5 text-[10px] font-medium uppercase rounded",
      config[level || ''] || 'bg-muted text-muted-foreground'
    )}>
      {level || '-'}
    </span>
  )
}
