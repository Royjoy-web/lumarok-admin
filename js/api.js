// LUMAROK — Admin App api.js  (Phase 7 — unified token key)
const API_URL = 'https://lumarok-backend.onrender.com'; // PLACEHOLDER: update if Render service name changes

const getToken        = () => localStorage.getItem('lmr_token') || '';
const getRefreshToken = () => localStorage.getItem('lmr_refresh_token') || '';
const setToken  = (t, r) => {
  localStorage.setItem('lmr_token', t);
  if (r) localStorage.setItem('lmr_refresh_token', r);
};
const clearAuth = () => {
  localStorage.removeItem('lmr_token');
  localStorage.removeItem('lmr_refresh_token');
  localStorage.removeItem('lmr_user');
};

// Auto-refresh on 401
async function _refreshAccessToken() {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(API_URL + '/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) { clearAuth(); return false; }
    const data = await res.json();
    setToken(data.token, data.refresh_token);
    return true;
  } catch { return false; }
}
const saveUser  = u  => localStorage.setItem('lmr_user', JSON.stringify(u));
const loadUser  = () => { try { return JSON.parse(localStorage.getItem('lmr_user')); } catch { return null; } };

// ── Silent token refresh ─────────────────────
let _refreshing = false;
let _refreshQueue = [];

async function silentRefresh() {
  if (_refreshing) {
    return new Promise((resolve, reject) => _refreshQueue.push({ resolve, reject }));
  }
  _refreshing = true;
  try {
    const rt = getRefreshToken();
    if (!rt) throw new Error('No refresh token');
    const res = await fetchWithTimeout(API_URL + '/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) throw new Error('refresh failed');
    const data = await res.json();
    setToken(data.token, data.refresh_token);
    _refreshQueue.forEach(p => p.resolve());
  } catch (err) {
    _refreshQueue.forEach(p => p.reject(err));
    throw err;
  } finally {
    _refreshing = false;
    _refreshQueue = [];
  }
}

function fetchWithTimeout(url, opts, ms = 10000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

async function api(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
  let res, data;
  try {
    res  = await fetchWithTimeout(API_URL + path, { method, headers, body: body ? JSON.stringify(body) : null });
    data = await res.json();
  } catch (networkErr) {
    throw new Error('Backend unreachable — check connection');
  }
  if (res.status === 401) {
    if (path !== '/api/auth/refresh' && path !== '/api/auth/login') {
      try {
        await silentRefresh();
        headers['Authorization'] = 'Bearer ' + getToken();
        res  = await fetchWithTimeout(API_URL + path, { method, headers, body: body ? JSON.stringify(body) : null });
        data = await res.json();
        if (res.ok) return data;
      } catch { /* fall through */ }
      Auth.logout(); showScreen('login-screen'); throw new Error('Session expired');
    }
    throw new Error(data?.message || 'Invalid email or password');
  }
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const Auth = {
  async login(email, password) {
    const data = await api('POST', '/api/auth/login', { email, password });
    if (data.user?.role !== 'admin') throw new Error('Admin access required');
    setToken(data.token, data.refresh_token); saveUser(data.user); return data;
  },
  async me() {
    return await api('GET', '/api/auth/me');
  },
  logout() { clearAuth(); },
};

const Admin = {
  stats:              ()                => api('GET',   '/api/admin/stats'),
  getUnits:           (p=1)             => api('GET',   `/api/admin/units?page=${p}&limit=20`),
  createUnit:         (body)            => api('POST',  '/api/admin/units', body),
  genCode:            (unitId, expiry)  => api('POST',  `/api/admin/units/${unitId}/activation-code`, { expires_in_hours: expiry }),
  setStatus:          (unitId, s)       => api('PATCH', `/api/admin/units/${unitId}/status`, { status: s }),
  getUsers:           (p=1, role='')    => api('GET',   `/api/admin/users?page=${p}&limit=20${role ? '&role='+role : ''}`),
  disableUser:        (userId)          => api('PATCH', `/api/admin/users/${userId}/disable`),
  createInstaller:    (body)            => api('POST',  '/api/admin/users/installer', body),
  mqttStatus:         ()                => api('GET',   '/api/admin/mqtt-status'),
  getLogs:            (p=1)             => api('GET',   `/api/logs?page=${p}&limit=50`),
};

const Firmware = {
  push:   (body)    => api('POST', '/api/firmware/push', body),
  status: (unitId)  => api('GET',  `/api/firmware/status/${unitId}`),
  latest: (uid, v)  => api('GET',  `/api/firmware/latest?unit_id=${uid}&current_version=${v}`),
};
