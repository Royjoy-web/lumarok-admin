"use client"

import * as React from "react"
import { Admin, Factory } from "@/lib/api"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { 
  Settings as SettingsIcon, 
  Wifi, 
  WifiOff, 
  Sun, 
  Moon, 
  Monitor,
  Package,
  Download,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [mqttStatus, setMqttStatus] = React.useState<string | null>(null)
  const [batchInfo, setBatchInfo] = React.useState<{
    batch_id: string
    quantity: number
    remaining: number
    pool_alert?: boolean
  } | null>(null)
  const [batchQty, setBatchQty] = React.useState(10)
  const [loading, setLoading] = React.useState(false)

  // Handle client-side mounting for theme
  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const { status } = await Admin.mqttStatus()
        setMqttStatus(status)
      } catch {
        setMqttStatus(null)
      }

      try {
        const { active } = await Factory.status()
        setBatchInfo(active)
      } catch {
        // Non-critical
      }
    }
    loadSettings()
  }, [])

  const handleGenerateBatch = async () => {
    setLoading(true)
    try {
      const result = await Factory.newBatch(batchQty)
      setBatchInfo({
        batch_id: result.batch_id,
        quantity: result.quantity,
        remaining: result.quantity,
      })
    } catch (err) {
      console.error('Failed to generate batch:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPack = async () => {
    try {
      await Factory.downloadPack()
    } catch (err) {
      console.error('Failed to download pack:', err)
    }
  }

  const isConnected = mqttStatus === 'connected' || mqttStatus === 'CONNECTED'

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          System preferences and connectivity
        </p>
      </div>

      {/* System Status */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Wifi className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Connectivity</h3>
            <p className="text-xs text-muted-foreground">
              Backend services status
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-success" />
              ) : (
                <WifiOff className="w-5 h-5 text-destructive" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">MQTT Broker</p>
                <p className="text-xs text-muted-foreground">Message queue service</p>
              </div>
            </div>
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded",
              isConnected 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              {mqttStatus || 'Unknown'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">API Server</p>
                <p className="text-xs text-muted-foreground">Backend services</p>
              </div>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded bg-success/10 text-success">
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
            <Sun className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Appearance</h3>
            <p className="text-xs text-muted-foreground">
              Customize the look and feel
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Theme</Label>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'system', label: 'System', icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                  mounted && theme === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5",
                  mounted && theme === value ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  mounted && theme === value ? "text-primary" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Factory Management */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
            <Package className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Inventory Management</h3>
            <p className="text-xs text-muted-foreground">
              Generate and manage device batches
            </p>
          </div>
        </div>

        {batchInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Batch ID</p>
                <code className="text-sm font-mono">{batchInfo.batch_id}</code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Units Remaining</p>
                <p className="text-sm">
                  <span className={cn(
                    "font-semibold",
                    batchInfo.pool_alert ? "text-warning" : "text-success"
                  )}>
                    {batchInfo.remaining}
                  </span>
                  <span className="text-muted-foreground"> / {batchInfo.quantity}</span>
                  {batchInfo.pool_alert && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-warning/10 text-warning rounded">
                      Low
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 ease-out rounded-full",
                  batchInfo.pool_alert ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${(batchInfo.remaining / batchInfo.quantity) * 100}%` }}
              />
            </div>

            <Button variant="outline" onClick={handleDownloadPack} className="gap-2">
              <Download className="w-4 h-4" />
              Download Batch Pack (.lmrb)
            </Button>

            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-xs text-warning">
                  <strong>Backend Bug:</strong> <code className="bg-warning/20 px-1 rounded">backend_url</code> in batch pack uses{' '}
                  <code className="bg-warning/20 px-1 rounded">CLIENT_URL</code> instead of{' '}
                  <code className="bg-warning/20 px-1 rounded">BACKEND_URL</code>. Set{' '}
                  <code className="bg-warning/20 px-1 rounded">BACKEND_URL</code> in backend environment to fix.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No active batch. Generate one below.
            </p>
            <div className="flex items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="qty">Batch Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  max={100}
                  value={batchQty}
                  onChange={(e) => setBatchQty(Number(e.target.value))}
                  className="w-32"
                />
              </div>
              <Button onClick={handleGenerateBatch} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Batch'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* API Configuration */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">API Configuration</h3>
            <p className="text-xs text-muted-foreground">
              Backend connection settings
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">API Base URL</Label>
            <code className="block mt-1 text-sm font-mono p-2 bg-muted rounded">
              {process.env.NEXT_PUBLIC_API_URL || 'https://lumarok-backend.onrender.com'}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
