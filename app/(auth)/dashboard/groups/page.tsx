"use client"

import * as React from "react"
import { Folder, FolderPlus, Trash2, MapPin, Building2, Warehouse, Home, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Groups, type DeviceGroup } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"

const iconMap = {
  building: Building2,
  warehouse: Warehouse,
  home: Home,
  folder: Folder,
}

export default function GroupsPage() {
  const [groups, setGroups] = React.useState<DeviceGroup[]>([])
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())
  const [search, setSearch] = React.useState("")
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)
  const [createModalOpen, setCreateModalOpen] = React.useState(false)
  const [targetGroup, setTargetGroup] = React.useState<DeviceGroup | null>(null)
  const [deleteLoading, setDeleteLoading] = React.useState(false)
  const [createLoading, setCreateLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [newGroup, setNewGroup] = React.useState({ name: "", icon: "folder" as DeviceGroup["icon"], location: "" })

  React.useEffect(() => {
    Groups.get()
      .then(d => setGroups(d.groups))
      .catch(e => setError(e.message))
  }, [])

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteClick = (group: DeviceGroup) => {
    setTargetGroup(group)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!targetGroup) return
    setDeleteLoading(true)
    try {
      await Groups.delete(targetGroup._id)
      setGroups(prev => prev.filter(g => g._id !== targetGroup._id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeleteLoading(false)
      setDeleteModalOpen(false)
      setTargetGroup(null)
    }
  }

  const handleCreateConfirm = async () => {
    if (!newGroup.name.trim()) return
    setCreateLoading(true)
    try {
      const d = await Groups.create({ name: newGroup.name, icon: newGroup.icon, location: newGroup.location || undefined })
      setGroups(prev => [...prev, d.group])
      setNewGroup({ name: "", icon: "folder", location: "" })
      setCreateModalOpen(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create failed")
    } finally {
      setCreateLoading(false)
    }
  }

  const totalDevices = groups.reduce((sum, g) => sum + g.deviceCount, 0)
  const totalOnline = groups.reduce((sum, g) => sum + g.onlineCount, 0)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Device Groups</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {groups.length > 0 
              ? `${totalDevices.toLocaleString()} devices across ${groups.length} locations`
              : "Organize devices by location"
            }
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          New Group
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Devices</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{totalDevices.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Online Now</p>
          <p className="text-2xl font-semibold text-emerald-400 mt-1">{totalOnline.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Locations</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{groups.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Uptime</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{totalDevices > 0 ? Math.round((totalOnline / totalDevices) * 100) : 0}%</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Group Tree */}
      <div className="space-y-2">
        {groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border/50">
            <Folder className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No device groups configured</p>
            <p className="text-xs mt-1">Create groups to organize your devices by location</p>
          </div>
        ) : groups.filter(g =>
          search === "" || g.name.toLowerCase().includes(search.toLowerCase())
        ).map((group) => {
          const Icon = iconMap[group.icon]
          const isExpanded = expandedGroups.has(group._id)
          const healthPercent = group.deviceCount > 0
            ? Math.round((group.onlineCount / group.deviceCount) * 100)
            : 0

          return (
            <div key={group._id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
              {/* Parent Group */}
              <button
                onClick={() => toggleGroup(group._id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{group.name}</h3>
                    {group.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {group.location}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {group.deviceCount} devices
                    </span>
                    <span className="text-xs text-emerald-400">
                      {group.onlineCount} online
                    </span>
                    <span className={cn(
                      "text-xs",
                      healthPercent >= 95 ? "text-emerald-400" : healthPercent >= 80 ? "text-amber-400" : "text-red-400"
                    )}>
                      {healthPercent}% healthy
                    </span>
                  </div>
                </div>

                <ChevronRight className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  isExpanded && "rotate-90"
                )} />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(group) }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </button>

              {/* Subgroups */}
              {isExpanded && group.subgroups && (
                <div className="border-t border-border/50 bg-secondary/20">
                  {group.subgroups && group.subgroups.map((sub) => {
                    const SubIcon = iconMap[sub.icon]
                    const subHealth = sub.deviceCount > 0
                      ? Math.round((sub.onlineCount / sub.deviceCount) * 100)
                      : 0

                    return (
                      <div
                        key={sub._id}
                        className="flex items-center gap-4 px-4 py-3 pl-14 hover:bg-secondary/30 transition-colors border-b border-border/30 last:border-b-0"
                      >
                        <SubIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 text-sm text-foreground">{sub.name}</span>
                        <span className="text-xs text-muted-foreground">{sub.deviceCount} devices</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          subHealth >= 95 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        )}>
                          {subHealth}%
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Group Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Device Group</DialogTitle>
            <DialogDescription>Create a group to organize units by location or type.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input
              placeholder="Group name *"
              value={newGroup.name}
              onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              placeholder="Location (optional)"
              value={newGroup.location}
              onChange={e => setNewGroup(p => ({ ...p, location: e.target.value }))}
              className="w-full px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              value={newGroup.icon}
              onChange={e => setNewGroup(p => ({ ...p, icon: e.target.value as DeviceGroup["icon"] }))}
              className="w-full px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="folder">Folder</option>
              <option value="building">Building</option>
              <option value="warehouse">Warehouse</option>
              <option value="home">Home</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateConfirm} disabled={createLoading || !newGroup.name.trim()}>
              {createLoading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{targetGroup?.name}&quot;? This will ungroup {targetGroup?.deviceCount || 0} devices. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
