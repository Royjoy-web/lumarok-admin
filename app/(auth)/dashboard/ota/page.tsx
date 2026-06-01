"use client"

import * as React from "react"
import { Admin, Firmware, type Unit } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Upload, Radio, AlertCircle, CheckCircle2 } from "lucide-react"

export default function OTAPage() {
  const [units, setUnits] = React.useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = React.useState('')
  const [version, setVersion] = React.useState('')
  const [firmwareUrl, setFirmwareUrl] = React.useState('')
  const [sha256, setSha256] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [unitsLoading, setUnitsLoading] = React.useState(true)
  const [result, setResult] = React.useState<{ success: boolean; message: string } | null>(null)

  React.useEffect(() => {
    const loadUnits = async () => {
      try {
        const { units: loadedUnits } = await Admin.getUnits()
        setUnits(loadedUnits || [])
      } catch (err) {
        console.error('Failed to load units:', err)
      } finally {
        setUnitsLoading(false)
      }
    }
    loadUnits()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    if (!selectedUnit || !version || !firmwareUrl || !sha256) {
      setResult({ success: false, message: 'All fields are required' })
      return
    }

    if (!/^[a-f0-9]{64}$/i.test(sha256)) {
      setResult({ success: false, message: 'SHA256 must be 64 hex characters' })
      return
    }

    setLoading(true)

    try {
      await Admin.triggerOTA(selectedUnit, {
        firmware_url: firmwareUrl,
        version,
        sha256,
      })
      setResult({ success: true, message: `OTA ${version} queued for ${selectedUnit}` })
      // Reset form
      setVersion('')
      setFirmwareUrl('')
      setSha256('')
    } catch (err) {
      setResult({ 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to push OTA update' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Firmware Updates</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Deploy over-the-air updates to your devices
        </p>
      </div>

      {/* OTA Push Form */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Deploy Update</h3>
            <p className="text-xs text-muted-foreground">
              Select a device and provide firmware details
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="unit">Target Device</Label>
            <select
              id="unit"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border/30 bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-colors"
              disabled={unitsLoading}
            >
              <option value="">Select device...</option>
              {units.map((unit) => (
                <option key={unit.unit_id} value={unit.unit_id}>
                  {unit.unit_id} - {unit.name || 'Unnamed'}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Firmware Version</Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.2.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Firmware URL</Label>
            <Input
              id="url"
              value={firmwareUrl}
              onChange={(e) => setFirmwareUrl(e.target.value)}
              placeholder="https://storage.example.com/firmware/v1.2.0.bin"
            />
            <p className="text-xs text-muted-foreground">
              Direct download URL for the firmware binary
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sha256">SHA256 Checksum</Label>
            <Input
              id="sha256"
              value={sha256}
              onChange={(e) => setSha256(e.target.value)}
              placeholder="64-character hex hash"
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Integrity hash of the firmware file
            </p>
          </div>

          {result && (
            <div className={cn(
              "flex items-start gap-3 p-4 rounded-lg border",
              result.success 
                ? "bg-success/10 border-success/20" 
                : "bg-destructive/10 border-destructive/20"
            )}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <p className={cn(
                "text-sm",
                result.success ? "text-success" : "text-destructive"
              )}>
                {result.message}
              </p>
            </div>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="gap-2">
              <Upload className="w-4 h-4" />
              {loading ? 'Pushing Update...' : 'Push OTA Update'}
            </Button>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 max-w-2xl">
        <h3 className="font-semibold text-foreground mb-4">Deployment Guide</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">1. Prepare the firmware:</strong> Build and sign your
            firmware binary. Ensure it passes all quality checks.
          </p>
          <p>
            <strong className="text-foreground">2. Upload to CDN:</strong> Host the firmware file on a
            reliable CDN with direct download support.
          </p>
          <p>
            <strong className="text-foreground">3. Calculate hash:</strong> Generate SHA256 checksum
            using <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">sha256sum firmware.bin</code>
          </p>
          <p>
            <strong className="text-foreground">4. Push update:</strong> The unit will download and
            verify the firmware, then reboot to apply.
          </p>
        </div>
      </div>
    </div>
  )
}
