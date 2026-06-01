"use client"

import * as React from "react"
import { Admin, Installer, type User } from "@/lib/api"
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
import { cn } from "@/lib/utils"
import { 
  Plus, 
  Users, 
  Mail, 
  Pause, 
  Trash2, 
  AlertTriangle 
} from "lucide-react"

export default function InstallersPage() {
  const [installers, setInstallers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [targetInstaller, setTargetInstaller] = React.useState<User | null>(null)

  const loadInstallers = React.useCallback(async () => {
    try {
      const { users } = await Admin.getUsers(1, 'installer')
      setInstallers(users || [])
    } catch (err) {
      console.error('Failed to load installers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadInstallers()
  }, [loadInstallers])

  const getInstallerStatus = (user: User) => {
    if (user.disabled) return { label: 'Suspended', className: 'bg-destructive/10 text-destructive border-destructive/20' }
    if (!user.last_login) return { label: 'Invited', className: 'bg-primary/10 text-primary border-primary/20' }
    return { label: 'Active', className: 'bg-success/10 text-success border-success/20' }
  }

  const handleResendInvite = async (user: User) => {
    const unitId = user.units?.[0]?.unit_id || ''
    try {
      await Installer.resendInvite(user.email, unitId)
    } catch (err) {
      console.error('Failed to resend invite:', err)
    }
  }

  const handleSuspend = async (user: User) => {
    try {
      await Admin.disableUser(user._id)
      loadInstallers()
    } catch (err) {
      console.error('Failed to suspend installer:', err)
    }
  }

  const handleOpenDelete = (user: User) => {
    setTargetInstaller(user)
    setDeleteModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Team Access</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage technician accounts and permissions
          </p>
        </div>
        <Button onClick={() => setInviteModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Team Member
        </Button>
      </div>

      {/* Stats Cards - Clean Tile Design */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-5 hover:bg-card/80 transition-colors">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Team Size
          </p>
          <p className="text-3xl font-bold text-foreground mt-2">{installers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">registered members</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-5 hover:bg-card/80 transition-colors">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Active
          </p>
          <p className="text-3xl font-bold text-success mt-2">
            {installers.filter(u => !u.disabled && u.last_login).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">currently active</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-5 hover:bg-card/80 transition-colors">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Pending
          </p>
          <p className="text-3xl font-bold text-warning mt-2">
            {installers.filter(u => !u.last_login).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">awaiting activation</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Last Active</TableHead>
              <TableHead className="font-semibold">Units</TableHead>
              <TableHead className="font-semibold w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-5 skeleton rounded w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : installers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">No installers yet</p>
                      <p className="text-sm text-muted-foreground">
                        Invite an installer to start deploying units.
                      </p>
                    </div>
                    <Button onClick={() => setInviteModalOpen(true)} size="sm" className="mt-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Invite Installer
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              installers.map((user) => {
                const status = getInstallerStatus(user)
                return (
                  <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{user.name || '-'}</TableCell>
                    <TableCell>
                      <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                        {user.email}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border",
                        status.className
                      )}>
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.last_login ? timeAgo(user.last_login) : 'Never'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.units?.length || 0} unit{(user.units?.length || 0) !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!user.last_login && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleResendInvite(user)}
                            title="Resend Invite"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {!user.disabled && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleSuspend(user)}
                            title="Suspend"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleOpenDelete(user)}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Modal */}
      <InviteInstallerModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={loadInstallers}
      />

      {/* Delete Modal */}
      <DeleteInstallerModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        installer={targetInstaller}
        onSuccess={loadInstallers}
      />
    </div>
  )
}

function InviteInstallerModal({ 
  open, 
  onOpenChange, 
  onSuccess 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void 
}) {
  const [email, setEmail] = React.useState('')
  const [name, setName] = React.useState('')
  const [unitId, setUnitId] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !unitId.trim()) {
      setError('Email and Unit ID are required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await Installer.sendInvite({ 
        email: email.trim(), 
        name: name.trim() || undefined, 
        unit_id: unitId.trim() 
      })
      onOpenChange(false)
      onSuccess()
      setEmail('')
      setName('')
      setUnitId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Installer</DialogTitle>
          <DialogDescription>
            Send an invitation to a new installer to join the platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="installer@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitId">Assigned Unit ID</Label>
              <Input
                id="unitId"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                placeholder="e.g., LMR-001"
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
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteInstallerModal({ 
  open, 
  onOpenChange, 
  installer, 
  onSuccess 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  installer: User | null
  onSuccess: () => void 
}) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleDelete = async () => {
    if (!installer) return

    setLoading(true)
    setError('')

    try {
      await Admin.deleteUser(installer._id)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete installer')
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
            Delete Installer?
          </DialogTitle>
          <DialogDescription>
            Permanently delete <strong>{installer?.name || installer?.email}</strong>? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
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
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Installer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
