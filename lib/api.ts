// LumaRoK Admin API Service

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://lumarok-backend.onrender.com'

// Types
export interface User {
  _id: string
  email: string
  name?: string
  role: 'admin' | 'installer' | 'user'
  disabled?: boolean
  last_login?: string
  invite_status?: string
  units?: Array<{ unit_id: string }>
}

export interface Unit {
  unit_id: string
  name?: string
  status: string
  firmware_version?: string
  last_seen?: string
  installer_name?: string
  installer_email?: string
  signal_strength?: number
  rssi?: number
  property_type?: string
  deployment_mode?: string
  location?: string
  emergency_stop_active?: boolean
  mqtt_username?: string
  device_secret?: string
}

export interface UnitStats {
  total: number
  active: number
  provisioned: number
  disabled: number
}

export interface Stats {
  units: UnitStats
  users: { total: number; installers?: number }
  devices: { total: number; bound: number }
}

export interface LogEntry {
  _id: string
  unit_id?: string
  action?: string
  category?: string
  level?: string
  createdAt: string
  timestamp?: string
  details?: Record<string, unknown>
}

export interface Device {
  _id: string
  type?: string
  kind?: string
  gpio_pin?: number
  status?: string
  power_state?: boolean
}

export interface Room {
  _id: string
  name: string
  devices?: Device[]
}

export interface DeviceGroup {
  _id: string
  name: string
  icon: 'building' | 'warehouse' | 'home' | 'folder'
  location?: string
  parent_group?: string | null
  unit_ids: string[]
  deviceCount: number
  onlineCount: number
  subgroups?: DeviceGroup[]
  createdAt: string
}

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'resolved'
export type AlertCategory = 'connectivity' | 'battery' | 'temperature' | 'firmware' | 'security'

export interface Alert {
  _id: string
  title: string
  message: string
  unit_id?: string
  severity: AlertSeverity
  category: AlertCategory
  acknowledged: boolean
  acknowledged_at?: string
  createdAt: string
}

// FIX: BatchInfo interface was missing its declaration — caused TypeScript build failure
export interface BatchInfo {
  batch_id: string
  quantity: number
  remaining: number
  pool_alert?: boolean
}

// Token management
let _accessToken = ''

export const getToken = (): string => _accessToken
export const setToken = (t: string): void => { _accessToken = t || '' }

export const clearAuth = (): void => {
  _accessToken = ''
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lmr_user')
    localStorage.removeItem('lmr_token')
    localStorage.removeItem('lmr_refresh_token')
  }
}

export const saveUser = (u: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lmr_user', JSON.stringify(u))
  }
}

export const loadUser = (): User | null => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('lmr_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

// Fetch with timeout
function fetchWT(url: string, opts: RequestInit = {}, ms = 60000): Promise<Response> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id))
}

// Silent refresh with mutex guard
let _refreshing = false
let _refreshQueue: Array<{ resolve: () => void; reject: (err: Error) => void }> = []

export async function silentRefresh(): Promise<void> {
  if (_refreshing) {
    return new Promise((resolve, reject) => _refreshQueue.push({ resolve, reject }))
  }
  _refreshing = true
  try {
    const r = await fetchWT(API_URL + '/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!r.ok) {
      clearAuth()
      throw new Error('refresh failed')
    }
    const d = await r.json()
    setToken(d.token)
    _refreshQueue.forEach(p => p.resolve())
  } catch (err) {
    _refreshQueue.forEach(p => p.reject(err as Error))
    throw err
  } finally {
    _refreshing = false
    _refreshQueue = []
  }
}

// Main API function
async function api<T>(
  method: string,
  path: string,
  body: Record<string, unknown> | null = null,
  opts: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken(),
  }

  let res: Response
  let data: T & { message?: string }

  try {
    res = await fetchWT(API_URL + path, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : null,
      ...opts,
    })
    data = await res.json()
  } catch {
    throw new Error('Backend unreachable — check your connection')
  }

  if (res.status === 401 && path !== '/api/auth/refresh' && path !== '/api/auth/login') {
    try {
      await silentRefresh()
      headers['Authorization'] = 'Bearer ' + getToken()
      res = await fetchWT(API_URL + path, {
        method,
        headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : null,
      })
      data = await res.json()
      if (res.ok) return data
    } catch {
      // fall through
    }
    clearAuth()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lmr:session-expired'))
    }
    throw new Error('Session expired — please log in again')
  }

  if (res.status >= 500) throw new Error('Server error — please try again')
  if (!res.ok) throw new Error(data?.message || 'Request failed')

  return data
}

// Binary download helper
async function apiBinary(path: string): Promise<Response> {
  const r = await fetchWT(API_URL + path, {
    headers: { 'Authorization': 'Bearer ' + getToken() },
    credentials: 'include',
  })
  if (!r.ok) {
    const d = await r.json()
    throw new Error(d.message || 'Download failed')
  }
  return r
}

// Auth API
export const Auth = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const d = await api<{ user: User; token: string }>('POST', '/api/auth/login', { email, password })
    if (d.user?.role !== 'admin') throw new Error('Admin access required')
    setToken(d.token)
    saveUser(d.user)
    return d
  },

  async me(): Promise<{ user: User }> {
    return api<{ user: User }>('GET', '/api/auth/me')
  },

  logout(): void {
    clearAuth()
  },
}

// Admin API
export const Admin = {
  stats: () => api<{ stats: Stats }>('GET', '/api/admin/stats'),

  getUnits: (page = 1, status = '') =>
    api<{ units: Unit[] }>('GET', `/api/admin/units?page=${page}&limit=50${status ? '&status=' + status : ''}`),

  createUnit: (body: { name: string; property_type?: string; deployment_mode?: string }) =>
    api<{ unit: Unit }>('POST', '/api/admin/units', body),

  setStatus: (unitId: string, status: string) =>
    api<{ unit: Unit }>('PATCH', `/api/admin/units/${unitId}/status`, { status }),

  triggerOTA: (unitId: string, body: { firmware_url: string; version: string; sha256: string }) =>
    api<{ success: boolean }>('POST', `/api/admin/units/${unitId}/ota`, body),

  genCode: (unitId: string, expiry: number) =>
    api<{ code: string }>('POST', `/api/admin/units/${unitId}/activation-code`, { expires_in_hours: expiry }),

  generateCredentials: (unitId: string, force = false) =>
    api<{ credentials: Record<string, unknown> }>('POST', `/api/admin/units/${unitId}/generate-credentials`, { force }),

  setFactoryRecord: (unitId: string, ver: string) =>
    api<{ success: boolean }>('POST', `/api/admin/units/${unitId}/factory-record`, { firmware_version: ver }),

  getUsers: (page = 1, role = '') =>
    api<{ users: User[] }>('GET', `/api/admin/users?page=${page}&limit=50${role ? '&role=' + role : ''}`),

  disableUser: (userId: string) =>
    api<{ user: User }>('PATCH', `/api/admin/users/${userId}/disable`),

  createInstaller: (body: { email: string; name?: string; unit_id?: string }) =>
    api<{ user: User }>('POST', '/api/admin/users/installer', body),

  mqttStatus: () => api<{ status: string }>('GET', '/api/admin/mqtt-status'),

  deleteUnit: (unitId: string) =>
    api<{ success: boolean }>('DELETE', `/api/admin/units/${unitId}`),

  deleteUser: (userId: string) =>
    api<{ success: boolean }>('DELETE', `/api/admin/users/${userId}`),
}

// Units API
export const Units = {
  getDetail: (unitId: string) =>
    api<{ unit: Unit; rooms: Room[]; devices: Device[] }>('GET', `/api/units/${unitId}`),

  update: (unitId: string, body: { name?: string; property_type?: string; location?: string }) =>
    api<{ unit: Unit }>('PATCH', `/api/units/${unitId}`, body),

  emergencyStop: (unitId: string) =>
    api<{ success: boolean }>('POST', `/api/units/${unitId}/emergency-stop`),

  resetEmergencyStop: (unitId: string) =>
    api<{ success: boolean }>('POST', `/api/units/${unitId}/reset-emergency-stop`, { confirmed: true }),
}

// Installer API
export const Installer = {
  sendInvite: (body: { email: string; name?: string; unit_id: string }) =>
    api<{ success: boolean }>('POST', '/api/installer/send-invite', body),

  resendInvite: (email: string, unitId: string) =>
    api<{ success: boolean }>('POST', '/api/installer/send-invite', { email, unit_id: unitId }),
}

// Firmware API
export const Firmware = {
  push: (body: { unit_id: string; firmware_url: string; version: string; sha256: string }) =>
    api<{ success: boolean }>('POST', '/api/firmware/push', body),

  status: (unitId: string) =>
    api<{ status: string; version?: string }>('GET', `/api/firmware/status/${unitId}`),

  latest: (unitId: string, currentVersion: string) =>
    api<{ has_update: boolean; latest_version?: string }>('GET', `/api/firmware/latest?unit_id=${unitId}&current_version=${currentVersion}`),
}

// Logs API
export const Logs = {
  get: (params: {
    page?: number
    limit?: number
    unit_id?: string
    category?: string
    level?: string
    action?: string
  } = {}) => {
    const q = new URLSearchParams({
      page: String(params.page || 1),
      limit: String(params.limit || 100),
    })
    if (params.unit_id) q.set('unit_id', params.unit_id)
    if (params.category) q.set('category', params.category)
    if (params.level) q.set('level', params.level)
    if (params.action) q.set('action', params.action)
    return api<{ data: LogEntry[]; pagination: { total: number; page: number } }>('GET', `/api/logs?${q.toString()}`)
  },
}

// Groups API
export const Groups = {
  get: () =>
    api<{ groups: DeviceGroup[] }>('GET', '/api/groups'),

  create: (body: { name: string; icon?: string; location?: string; parent_group?: string }) =>
    api<{ group: DeviceGroup }>('POST', '/api/groups', body),

  delete: (groupId: string) =>
    api<{ message: string }>('DELETE', `/api/groups/${groupId}`),

  addUnit: (groupId: string, unit_id: string) =>
    api<{ group: DeviceGroup }>('POST', `/api/groups/${groupId}/units`, { unit_id }),

  removeUnit: (groupId: string, unitId: string) =>
    api<{ group: DeviceGroup }>('DELETE', `/api/groups/${groupId}/units/${unitId}`),
}

// Alerts API
export const Alerts = {
  get: (severity?: string, page = 1, limit = 50) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (severity && severity !== 'all') q.set('severity', severity)
    return api<{ alerts: Alert[]; pagination: { total: number; page: number }; unacknowledged: number }>(
      'GET', `/api/alerts?${q.toString()}`
    )
  },

  acknowledge: (alertId: string) =>
    api<{ alert: Alert }>('PATCH', `/api/alerts/${alertId}/acknowledge`),

  acknowledgeAll: () =>
    api<{ message: string }>('PATCH', '/api/alerts/acknowledge-all'),
}

// FIX: Factory export was orphaned (missing `export const Factory = {` declaration)
export const Factory = {
  status: () =>
    api<{ active: BatchInfo | null; history: BatchInfo[] }>('GET', '/api/factory/batch-status'),

  newBatch: (qty: number) =>
    api<{ batch_id: string; quantity: number }>('POST', '/api/factory/generate-batch', { quantity: qty }),

  downloadPack: async (): Promise<void> => {
    const r = await apiBinary('/api/factory/offline-pack')
    const cd = r.headers.get('content-disposition') || ''
    const name = cd.match(/filename="([^"]+)"/)?.[1] || 'batch.lmrb'
    const blob = await r.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  },
}
