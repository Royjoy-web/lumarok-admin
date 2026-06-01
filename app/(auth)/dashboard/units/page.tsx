"use client"

import * as React from "react"
import { Admin, Units, type Unit } from "@/lib/api"
import { StatusBadge } from "@/components/ui/status-badge"
import { SignalBar } from "@/components/ui/signal-bar"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { timeAgo } from "@/lib/format"
import { 
  Plus, 
  Search, 
  Upload, 
  Key, 
  Trash2, 
  Radio, 
  X, 
  AlertTriangle,
  Eye
} from "lucide-react"
import { cn } from "@/lib/utils"
import { UnitDrawer } from "@/components/units/unit-drawer"

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PROVISIONED', label: 'Provisioned' },
  { value: 'FACTORY_READY', label: 'Factory' },
  { value: 'DISABLED', label: 'Disabled' },
]

export default function UnitsPage() {
  const [units, setUnits] = React.useState<Unit[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')
  const [selectedUnit, setSelectedUnit] = React.useState<string | null>(null)
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [otaModalOpen, setOtaModalOpen] = React.useState(false)
  const [genCodeModalOpen, setGenCodeModalOpen] = React.useState(false)
  const [targetUnit, setTargetUnit] = React.useState<Unit | null>(null)

  const loadUnits = React.useCallback(async () => {
    try {
      const { units: loadedUnits } = await Admin.getUnits(1, statusFilter)
      setUnits(loadedUnits || [])
    } catch (err) {
      console.error('Failed to load units:', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  React.useEffect(() => {
    loadUnits()
  }, [loadUnits])

  const filteredUnits = React.useMemo(() => {
    if (!searchQuery) return units
    const q = searchQuery.toLowerCase()
    return units.filter(u => 
      u.unit_id?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.status?.toLowerCase().includes(q)
    )
  }, [units, searchQuery])

  const handleOpenOTA = (unit: Unit) => {
    setTargetUnit(unit)
    setOtaModalOpen(true)
  }

  const handleOpenGenCode = (unit: Unit) => {
    setTargetUnit(unit)
    setGenCodeModalOpen(true)
  }

  const handleOpenDelete = (unit: Unit) => {
    setTargetUnit(unit)
    setDeleteModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Device Fleet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage your connected devices
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Device
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => { setStatusFilter(filter.value); setLoading(true) }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                statusFilter === filter.value
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Unit ID</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Firmware</TableHead>
              <TableHead className="font-semibold">Last Seen</TableHead>
              <TableHead className="font-semibold">Installer</TableHead>
              <TableHead className="font-semibold">Signal</TableHead>
              <TableHead className="font-semibold w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-5 skeleton rounded w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredUnits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Radio className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {searchQuery ? 'No matching units' : 'No units registered yet'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? 'Try a different search' : 'Create your first unit to start deploying LumaRoK.'}
                      </p>
                    </div>
                    {!searchQuery && (
                      <Button onClick={() => setCreateModalOpen(true)} size="sm" className="mt-2">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Unit
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUnits.map((unit) => (
                <TableRow 
                  key={unit.unit_id} 
                  className="group cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedUnit(unit.unit_id)}
                >
                  <TableCell>
                    <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                      {unit.unit_id}
                    </code>
                  </TableCell>
                  <TableCell className="text-sm">{unit.name || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge status={unit.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">
                      {unit.firmware_version || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {unit.last_seen ? timeAgo(unit.last_seen) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {unit.installer_name || unit.installer_email || '-'}
                  </TableCell>
                  <TableCell>
                    <SignalBar value={unit.signal_strength || unit.rssi} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setSelectedUnit(unit.unit_id)}
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => handleOpenOTA(unit)}
                        title="Push OTA"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => handleOpenGenCode(unit)}
                        title="Generate Code"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleOpenDelete(unit)}
                        title="Delete Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Unit Detail Drawer */}
      <UnitDrawer
        unitId={selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onRefresh={loadUnits}
      />

      {/* Create Unit Modal */}
      <CreateUnitModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadUnits}
      />

      {/* Delete Unit Modal */}
      <DeleteUnitModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        unit={targetUnit}
        onSuccess={loadUnits}
      />

      {/* OTA Push Modal */}
      <OTAPushModal
        open={otaModalOpen}
        onOpenChange={setOtaModalOpen}
        unit={targetUnit}
      />

      {/* Gen Code Modal */}
      <GenCodeModal
        open={genCodeModalOpen}
        onOpenChange={setGenCodeModalOpen}
        unit={targetUnit}
      />
    </div>
  )
}

// Create Unit Modal
function CreateUnitModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void 
}) {
  const [name, setName] = React.useState('')
  const [propertyType, setPropertyType] = React.useState('house')
  const [deploymentMode, setDeploymentMode] = React.useState('MASTER_ONLY')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Unit name is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await Admin.createUnit({ 
        name: name.trim(), 
        property_type: propertyType, 
        deployment_mode: deploymentMode 
      })
      onOpenChange(false)
      onSuccess()
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create unit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Unit</DialogTitle>
          <DialogDescription>
            Add a new LumaRoK unit to your fleet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Unit Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Building A - Floor 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Property Type</Label>
              <select
                id="type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">Deployment Mode</Label>
              <select
                id="mode"
                value={deploymentMode}
                onChange={(e) => setDeploymentMode(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="MASTER_ONLY">Master Only</option>
                <option value="MASTER_WITH_NODES">Master With Nodes</option>
              </select>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Delete Unit Modal
function DeleteUnitModal({ 
  open, 
  onOpenChange, 
  unit, 
  onSuccess 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null
  onSuccess: () => void 
}) {
  const [confirmText, setConfirmText] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const canDelete = confirmText === unit?.unit_id

  const handleDelete = async () => {
    if (!unit || !canDelete) return
    
    setLoading(true)
    setError('')
    
    try {
      await Admin.deleteUnit(unit.unit_id)
      onOpenChange(false)
      onSuccess()
      setConfirmText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete unit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Unit?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the unit
            and all associated data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-foreground font-medium mb-2">This will:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
              <li>Remove all device bindings</li>
              <li>Invalidate all credentials</li>
              <li>Delete all room configurations</li>
              <li>Remove from installer assignments</li>
            </ul>
          </div>
          <div className="space-y-2">
            <Label>
              Type <code className="text-destructive font-mono">{unit?.unit_id}</code> to confirm
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter unit ID"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={!canDelete || loading}
          >
            {loading ? 'Deleting...' : 'Delete Unit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// OTA Push Modal
function OTAPushModal({ 
  open, 
  onOpenChange, 
  unit 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null 
}) {
  const [version, setVersion] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [sha256, setSha256] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unit || !version || !url || !sha256) {
      setError('All fields are required')
      return
    }
    if (!/^[a-f0-9]{64}$/i.test(sha256)) {
      setError('SHA256 must be 64 hex characters')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await Admin.triggerOTA(unit.unit_id, { 
        firmware_url: url, 
        version, 
        sha256 
      })
      onOpenChange(false)
      setVersion('')
      setUrl('')
      setSha256('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push OTA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Push OTA Update</DialogTitle>
          <DialogDescription>
            Push a firmware update to {unit?.name || unit?.unit_id}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Version</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g., 1.2.0"
              />
            </div>
            <div className="space-y-2">
              <Label>Firmware URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>SHA256 Hash</Label>
              <Input
                value={sha256}
                onChange={(e) => setSha256(e.target.value)}
                placeholder="64-character hex hash"
                className="font-mono text-xs"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Pushing...' : 'Push OTA'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Gen Code Modal
function GenCodeModal({ 
  open, 
  onOpenChange, 
  unit 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  unit: Unit | null 
}) {
  const [expiry, setExpiry] = React.useState(48)
  const [code, setCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleGenerate = async () => {
    if (!unit) return
    
    setLoading(true)
    setError('')
    
    try {
      const { code: generatedCode } = await Admin.genCode(unit.unit_id, expiry)
      setCode(generatedCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setCode('') }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Activation Code</DialogTitle>
          <DialogDescription>
            Generate a time-limited activation code for {unit?.name || unit?.unit_id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Expiry (hours)</Label>
            <select
              value={expiry}
              onChange={(e) => setExpiry(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours</option>
              <option value={168}>1 week</option>
            </select>
          </div>
          {code && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Activation Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-mono font-bold tracking-wider">
                  {code}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  Copy
                </Button>
              </div>
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Code'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
