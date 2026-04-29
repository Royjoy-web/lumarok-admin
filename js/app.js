// ============================================
// LUMAROK — Admin App  js/app.js  v2.0
// ============================================

const APP = { user: null, statsInterval: null, theme: localStorage.getItem('lmr_theme') || 'dark' };

function applyTheme(theme) {
  APP.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('lmr_theme', theme);
  const btn = document.querySelector('.btn-theme-tog');
  if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
}

function toggleTheme() {
  applyTheme(APP.theme === 'dark' ? 'light' : 'dark');
}

// ── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(APP.theme);
  const splash = document.getElementById('splash-screen');
  const hint = document.getElementById('sp-hint');
  const hints = ['Authenticating session…','Loading configuration…','Checking permissions…'];
  let hi = 0; const hInt = setInterval(()=>{ hint.textContent = hints[++hi % hints.length]; }, 700);

  const user = loadUser();
  const token = getToken();
  if (user?.role === 'admin' && token) {
    try {
      const data = await Auth.me();
      if (data.user?.role !== 'admin') throw new Error('Not admin');
      APP.user = data.user;
      saveUser(data.user);
      clearInterval(hInt);
      splash.classList.add('fade-out');
      setTimeout(()=>{ splash.style.display='none'; showDashboard(); }, 500);
    } catch {
      clearAuth();
      clearInterval(hInt);
      splash.classList.add('fade-out');
      setTimeout(()=>{ splash.style.display='none'; showScreen('login-screen'); }, 300);
    }
  } else {
    // Ensure splash shows for at least 2s even when not logged in
    setTimeout(() => {
      clearInterval(hInt);
      splash.classList.add('fade-out');
      setTimeout(()=>{ splash.style.display='none'; showScreen('login-screen'); }, 300);
    }, 3500);
  }
});

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

function showDashboard() {
  showScreen('dashboard-screen');
  document.getElementById('admin-email').textContent = APP.user?.email || 'Admin';
  loadStats();
  APP.statsInterval = setInterval(loadStats, 30000);
}

// ── AUTH ─────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  setLoading(btn, true);
  try {
    const data = await Auth.login(
      document.getElementById('email').value.trim(),
      document.getElementById('password').value
    );
    APP.user = data.user;
    if (typeof initBiometric === 'function') initBiometric();
    showDashboard();
  } catch(err) { showToast(err.message, 'error'); }
  finally { setLoading(btn, false); }
}

function handleLogout() {
  clearInterval(APP.statsInterval);
  Auth.logout(); APP.user = null;
  showScreen('login-screen');
}

// ── TABS ─────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.remove('hidden');
  if (tab === 'overview')    loadStats();
  if (tab === 'units')       loadUnits();
  if (tab === 'users')       loadUsers();
  if (tab === 'installers')  loadInstallers();
  if (tab === 'mqtt')        loadMqtt();
  if (tab === 'logs')        loadLogs();
  if (tab === 'workorders')  loadWorkOrders();
}

// ── STATS ─────────────────────────────────────
async function loadStats() {
  try {
    const { stats, recent_units } = await Admin.stats();
    document.getElementById('stat-units-total').textContent  = stats.units.total;
    document.getElementById('stat-units-active').textContent = stats.units.active;
    document.getElementById('stat-users').textContent        = stats.users.total;
    document.getElementById('stat-devices').textContent      = stats.devices.bound + '/' + stats.devices.total;

    document.getElementById('recent-units-list').innerHTML =
      recent_units.map(u => `
        <div class="list-item">
          <div class="unit-info">
            <strong>${esc(u.name)}</strong>
            <span class="unit-id">${esc(u.unit_id)}</span>
          </div>
          <div class="unit-actions">
            <span class="badge badge-${u.status.toLowerCase()}">${u.status}</span>
            <button class="btn-sm btn-primary" onclick="openGenCode('${esc(u.unit_id)}')">Gen Code</button>
          </div>
        </div>`).join('') || '<p class="text-muted">No recent units.</p>';
  } catch(err) { showToast('Stats error: ' + err.message, 'error'); }
}

// ── UNITS ─────────────────────────────────────
async function loadUnits(page = 1) {
  const el = document.getElementById('units-list');
  el.innerHTML = '<p class="loading">Loading…</p>';
  try {
    const { units } = await Admin.getUnits(page);
    el.innerHTML = units.length ? units.map(u => `
      <div class="list-item">
        <div class="unit-info">
          <strong>${esc(u.unit_id)}</strong>
          <span class="text-muted">${esc(u.name)} · ${u.property_type || 'house'}</span>
          <span class="text-muted">${u.owner_id ? '👤 Owner linked' : '⏳ Awaiting activation'}</span>
        </div>
        <div class="unit-actions">
          <span class="badge badge-${u.status.toLowerCase()}">${u.status}</span>
          <button class="btn-sm btn-primary" onclick="openGenCode('${esc(u.unit_id)}')">Gen Code</button>
          <button class="btn-sm btn-secondary" onclick="openGenCreds('${esc(u.unit_id)}', ${!!u.mqtt_username})">Creds${u.mqtt_username ? ' ✓' : ''}</button>
          <button class="btn-sm" onclick="openPushCodeModal('${esc(u.unit_id)}')">Push</button>
          <button class="btn-sm btn-warn"    onclick="openOTA('${esc(u.unit_id)}')">OTA</button>
          <select class="select-sm" onchange="changeUnitStatus('${esc(u.unit_id)}', this.value)">
            <option value="">Status…</option>
            <option value="ACTIVE">Activate</option>
            <option value="DISABLED">Disable</option>
          </select>
        </div>
      </div>`).join('')
    : '<p class="text-muted">No units found.</p>';
  } catch(err) { el.innerHTML = `<p class="error">${err.message}</p>`; }
}

function openCreateUnit() {
  document.getElementById('cu-name').value = '';
  document.getElementById('cu-type').value = 'house';
  showModal('modal-create-unit');
}

async function submitCreateUnit() {
  const name = document.getElementById('cu-name').value.trim() || 'LumaRoK Hub';
  const property_type = document.getElementById('cu-type').value;
  const btn = document.getElementById('cu-submit');
  setLoading(btn, true);
  try {
    const { unit } = await Admin.createUnit({ name, property_type });
    closeModal('modal-create-unit');
    loadUnits();
    // Immediately offer to set up the new unit
    openPostCreateFlow(unit.unit_id, name);
  } catch(err) { showToast(err.message, 'error'); }
  finally { setLoading(btn, false); }
}

// Post-create flow: generate creds then push to installer
let _postCreateUnitId = null;
async function openPostCreateFlow(unitId, unitName) {
  _postCreateUnitId = unitId;
  document.getElementById('pc-unit-label').textContent = `${unitName} · ${unitId}`;
  document.getElementById('pc-creds-result').style.display = 'none';
  document.getElementById('pc-step2').style.display = 'none';
  document.getElementById('post-create-modal').classList.add('show');
}

async function pcGenerateCreds() {
  const btn = document.getElementById('pc-gen-btn');
  setLoading(btn, true);
  try {
    const data = await Admin.generateCredentials(_postCreateUnitId, false);
    const r = document.getElementById('pc-creds-result');
    r.innerHTML = `
      <div class="creds-box" style="margin-top:10px">
        <p class="creds-warning">⚠ Copy these now — the password is shown once.</p>
        <div class="creds-row"><span class="creds-label">MQTT User</span><code class="creds-val" id="pc-u">${esc(data.mqtt_username)}</code><button class="code-copy" data-action="copyText__pc_u">📋</button></div>
        <div class="creds-row"><span class="creds-label">MQTT Pass</span><code class="creds-val" id="pc-p">${esc(data.mqtt_password)}</code><button class="code-copy" data-action="copyText__pc_p">📋</button></div>
        <div class="creds-row"><span class="creds-label">Dev Secret</span><code class="creds-val" id="pc-s">${esc(data.device_secret)}</code><button class="code-copy" data-action="copyText__pc_s">📋</button></div>
      </div>`;
    r.style.display = 'block';
    document.getElementById('pc-step2').style.display = 'block';
    document.getElementById('pc-gen-btn').textContent = 'Regenerate';
    loadUnits(); // refresh ✓ badge
    showToast('Credentials generated ✓', 'success');
  } catch(err) { showToast(err.message, 'error'); }
  finally { setLoading(btn, false); }
}

async function pcPushToInstaller() {
  // Pre-fill the main push modal with this unit ID and open it
  document.getElementById('post-create-modal').classList.remove('show');
  await openPushCodeModal(_postCreateUnitId);
}

function closePostCreateModal() {
  document.getElementById('post-create-modal').classList.remove('show');
  _postCreateUnitId = null;
}

function openGenCode(unitId) {
  document.getElementById('gc-unit-id').textContent = unitId;
  document.getElementById('gc-result').style.display = 'none';
  document.getElementById('gc-expiry').value = '48';
  showModal('modal-gen-code');
  document.getElementById('gc-unit-hidden').value = unitId;
}

async function submitGenCode() {
  const unitId  = document.getElementById('gc-unit-hidden').value;
  const expiry  = parseInt(document.getElementById('gc-expiry').value) || 48;
  const btn = document.getElementById('gc-submit');
  setLoading(btn, true);
  try {
    const { code, expires_in_hours } = await Admin.genCode(unitId, expiry);
    const res = document.getElementById('gc-result');
    document.getElementById('gc-code-val').textContent  = code;
    document.getElementById('gc-expiry-val').textContent = `Expires in ${expires_in_hours}h`;
    res.style.display = '';
    showToast('Code generated: ' + code, 'success');
  } catch(err) { showToast(err.message, 'error'); }
  finally { setLoading(btn, false); }
}

function copyCode() {
  const code = document.getElementById('gc-code-val').textContent;
  navigator.clipboard?.writeText(code).then(() => showToast('Code copied', 'success'));
}

async function changeUnitStatus(unitId, status) {
  if (!status) return;
  if (!confirm(`Set ${unitId} to ${status}?`)) return;
  try {
    await Admin.setStatus(unitId, status);
    showToast(`${unitId} → ${status}`, 'success');
    loadUnits();
  } catch(err) { showToast(err.message, 'error'); }
}

// ── GENERATE CREDENTIALS ──────────────────────
function openGenCreds(unitId, hasCredentials = false) {
  document.getElementById('gencreds-unit-id').textContent = unitId;
  document.getElementById('gencreds-unit-hidden').value   = unitId;
  document.getElementById('gencreds-force').checked       = false;
  document.getElementById('gencreds-result').style.display = 'none';
  document.getElementById('gencreds-result').innerHTML    = '';

  const warning = document.getElementById('gencreds-existing-warn');
  warning.style.display = hasCredentials ? 'block' : 'none';

  // reset submit button
  const btn = document.getElementById('gencreds-submit');
  btn.textContent = 'Generate';
  btn.disabled = false;

  showModal('modal-gen-creds');
}

async function submitGenCreds() {
  const unitId = document.getElementById('gencreds-unit-hidden').value;
  const force  = document.getElementById('gencreds-force').checked;
  const btn    = document.getElementById('gencreds-submit');
  setLoading(btn, true);
  try {
    const data = await Admin.generateCredentials(unitId, force);
    const resultEl = document.getElementById('gencreds-result');
    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div class="creds-box">
        <p class="creds-warning">⚠ Save these now — the password is shown once and never stored in plaintext.</p>
        <div class="creds-row"><span class="creds-label">MQTT User</span><code class="creds-val" id="creds-user">${esc(data.mqtt_username)}</code><button class="code-copy" onclick="copyText('creds-user')">📋</button></div>
        <div class="creds-row"><span class="creds-label">MQTT Pass</span><code class="creds-val" id="creds-pass">${esc(data.mqtt_password)}</code><button class="code-copy" onclick="copyText('creds-pass')">📋</button></div>
        <div class="creds-row"><span class="creds-label">Dev Secret</span><code class="creds-val" id="creds-secret">${esc(data.device_secret)}</code><button class="code-copy" onclick="copyText('creds-secret')">📋</button></div>
      </div>`;
    showToast(`Credentials generated for ${unitId}`, 'success');
    loadUnits(); // refresh list so ✓ appears
  } catch(err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(btn, false);
  }
}

function copyText(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => showToast('Copied!', 'success'));
}

// ── OTA ───────────────────────────────────────
function openOTA(unitId = '') {
  document.getElementById('ota-unit').value   = unitId;
  document.getElementById('ota-url').value    = '';
  document.getElementById('ota-version').value = '';
  document.getElementById('ota-result').innerHTML = '';
  showModal('modal-ota');
}

async function pushOTA() {
  const url      = document.getElementById('ota-url').value.trim();
  const version  = document.getElementById('ota-version').value.trim();
  const sha256   = document.getElementById('ota-sha256').value.trim();
  const unit_id  = document.getElementById('ota-unit').value.trim();
  const btn      = document.getElementById('ota-btn');
  if (!url || !version) { showToast('URL and version required', 'error'); return; }
  if (sha256 && !/^[a-f0-9]{64}$/i.test(sha256)) { showToast('SHA256 must be 64 hex characters', 'error'); return; }
  if (!unit_id && !confirm(`Broadcast OTA v${version} to ALL active units?`)) return;
  setLoading(btn, true);
  try {
    const payload = { url, version, unit_id: unit_id || undefined, broadcast: !unit_id };
    if (sha256) payload.sha256 = sha256;
    const data = await Firmware.push(payload);
    document.getElementById('ota-result').innerHTML = `
      <div class="ota-result-card">
        <p class="ota-ok">✓ OTA v${esc(version)} pushed to ${data.pushed_to} unit(s)</p>
        ${data.results.map(r => `<p class="text-muted">${esc(r.unit_id)} — ${r.sent ? 'sent ✓' : '⚠ MQTT offline'}</p>`).join('')}
      </div>`;
    showToast(`OTA v${version} sent to ${data.pushed_to} unit(s)`, 'success');
  } catch(err) { showToast(err.message, 'error'); }
  finally { setLoading(btn, false); }
}

// ── USERS ─────────────────────────────────────
async function loadUsers(page = 1) {
  const el = document.getElementById('users-list');
  el.innerHTML = '<p class="loading">Loading…</p>';
  try {
    const { users } = await Admin.getUsers(page);
    el.innerHTML = users.length ? users.map(u => `
      <div class="list-item">
        <div class="unit-info">
          <strong>${esc(u.name)}</strong>
          <span class="text-muted">${esc(u.email)}</span>
          <span class="text-muted">${u.units?.length || 0} unit(s)</span>
        </div>
        <div class="unit-actions">
          <span class="badge badge-${u.role}">${u.role}</span>
          <span class="badge ${u.is_active ? 'badge-active' : 'badge-disabled'}">${u.is_active ? 'Active' : 'Disabled'}</span>
          ${u.is_active ? `<button class="btn-sm btn-danger" onclick="disableUser('${u._id}','${esc(u.email)}')">Disable</button>` : ''}
        </div>
      </div>`).join('')
    : '<p class="text-muted">No users found.</p>';
  } catch(err) { el.innerHTML = `<p class="error">${err.message}</p>`; }
}

async function disableUser(userId, email) {
  if (!confirm(`Disable user: ${email}?`)) return;
  try {
    await Admin.disableUser(userId);
    showToast(`User ${email} disabled`, 'success');
    loadUsers();
  } catch(err) { showToast(err.message, 'error'); }
}

// ── INSTALLERS ────────────────────────────────
async function loadInstallers() {
  const el = document.getElementById('installers-list');
  el.innerHTML = '<p class="loading">Loading…</p>';
  try {
    const { users } = await Admin.getUsers(1, 'installer');
    el.innerHTML = users.length ? users.map(u => `
      <div class="list-item">
        <div class="unit-info">
          <strong>${esc(u.name)}</strong>
          <span class="text-muted">${esc(u.email)}</span>
        </div>
        <div class="unit-actions">
          <span class="badge badge-installer">installer</span>
          <span class="badge ${u.is_active ? 'badge-active' : 'badge-disabled'}">${u.is_active ? 'Active' : 'Disabled'}</span>
          ${u.is_active ? `<button class="btn-sm btn-danger" onclick="disableUser('${u._id}','${esc(u.email)}')">Revoke</button>` : ''}
        </div>
      </div>`).join('')
    : '<p class="text-muted">No installers.</p>';
  } catch(err) { el.innerHTML = `<p class="error">${err.message}</p>`; }
}

function openCreateInstaller() {
  document.getElementById('ci-name').value  = '';
  document.getElementById('ci-email').value = '';
  showModal('modal-create-installer');
}

async function submitCreateInstaller() {
  const name  = document.getElementById('ci-name').value.trim();
  const email = document.getElementById('ci-email').value.trim();
  if (!name || !email) { showToast('Name and email required', 'error'); return; }
  const btn = document.getElementById('ci-submit');
  setLoading(btn, true);
  try {
    await Admin.createInstaller({ name, email });
    showToast(`Invite sent to ${email}`, 'success');
    closeModal('modal-create-installer');
    loadInstallers();
  } catch(err) { showToast(err.message, 'error'); }
  finally { setLoading(btn, false); }
}

// ── MQTT ──────────────────────────────────────
async function loadMqtt() {
  const el = document.getElementById('mqtt-status');
  try {
    const { mqtt } = await Admin.mqttStatus();
    el.innerHTML = `
      <div class="status-card ${mqtt.connected ? 'status-ok' : 'status-err'}">
        <strong>MQTT Broker</strong>
        <span>${mqtt.connected ? '🟢 Connected' : '🔴 Disconnected'}</span>
        <span class="text-muted">${esc(mqtt.broker || '—')}</span>
        ${mqtt.connected ? `<span class="text-muted">Messages in/out: ${mqtt.messages_in || 0} / ${mqtt.messages_out || 0}</span>` : ''}
      </div>`;
  } catch(err) { el.innerHTML = `<p class="error">${err.message}</p>`; }
}

// ── LOGS ──────────────────────────────────────
async function loadLogs(page = 1) {
  const el = document.getElementById('logs-list');
  el.innerHTML = '<p class="loading">Loading…</p>';
  try {
    const { logs } = await Admin.getLogs(page);
    el.innerHTML = logs.length ? logs.map(l => `
      <div class="log-row level-${l.level}">
        <span class="log-time">${new Date(l.createdAt).toLocaleString()}</span>
        <span class="log-action">${esc(l.action)}</span>
        <span class="text-muted">${esc(l.unit_id || '')} ${esc(l.user_name || '')}</span>
      </div>`).join('')
    : '<p class="text-muted">No logs.</p>';
  } catch(err) { el.innerHTML = `<p class="error">${err.message}</p>`; }
}

// ── MODALS ────────────────────────────────────
function showModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
  document.getElementById('modal-backdrop')?.classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
  document.getElementById('modal-backdrop')?.classList.add('hidden');
}

// ── HELPERS ───────────────────────────────────
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setLoading(btn, loading) {
  btn.disabled    = loading;
  btn.textContent = loading ? 'Connecting… (may take ~30s)' : (btn.dataset.label || btn.textContent);
}
function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-dot"></span><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── WORK ORDERS ────────────────────────────────
let _currentWOId = null;

async function loadWorkOrders() {
  const list = document.getElementById('workorders-list');
  list.innerHTML = '<p class="loading">Loading…</p>';
  const statusF   = document.getElementById('wo-filter-status')?.value || '';
  const priorityF = document.getElementById('wo-filter-priority')?.value || '';
  try {
    const d = await api('GET', '/api/work-orders');
    let orders = d.orders || [];
    if (statusF)   orders = orders.filter(o => o.status === statusF);
    if (priorityF) orders = orders.filter(o => o.priority === priorityF);
    if (!orders.length) { list.innerHTML = '<p class="empty">No work orders found.</p>'; return; }
    const priorityColor = { critical:'#ef4444', high:'#f97316', medium:'#eab308', low:'#22c55e' };
    list.innerHTML = orders.map(o => `
      <div class="unit-row" style="cursor:pointer;border-left:3px solid ${priorityColor[o.priority]||'#555'}" onclick="openWODetail('${o._id}')">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.title)}</div>
          <div style="font-size:.75rem;color:var(--t3);margin-top:2px">
            👷 ${esc(o.assigned_to?.name||'?')} · ${o.priority} priority · due ${o.due_date ? new Date(o.due_date).toLocaleDateString() : '—'}
          </div>
        </div>
        <span style="font-size:.72rem;padding:3px 8px;border-radius:20px;background:var(--surface);border:1px solid var(--border);white-space:nowrap">${o.status.replace('_',' ')}</span>
      </div>`).join('');
  } catch(e) { list.innerHTML = `<p class="error">${e.message}</p>`; }
}

async function openCreateWO() {
  // Fetch installers list
  const sel = document.getElementById('wo-installer');
  sel.innerHTML = '<option value="">Loading…</option>';
  try {
    const d = await api('GET', '/api/work-orders/installers');
    sel.innerHTML = d.installers.map(i => `<option value="${i._id}">${esc(i.name)} (${esc(i.email)})</option>`).join('');
    if (!d.installers.length) sel.innerHTML = '<option value="">No installers found</option>';
  } catch { sel.innerHTML = '<option value="">Error loading installers</option>'; }
  document.getElementById('wo-title').value = '';
  document.getElementById('wo-desc').value  = '';
  document.getElementById('wo-due').value   = '';
  document.getElementById('wo-unit').value  = '';
  document.getElementById('wo-priority').value = 'medium';
  showModal('modal-create-wo');
}

async function submitCreateWO() {
  const btn = document.getElementById('wo-submit');
  const title = document.getElementById('wo-title').value.trim();
  const assigned_to = document.getElementById('wo-installer').value;
  if (!title || !assigned_to) { showToast('Title and installer required', 'error'); return; }
  setLoading(btn, true);
  try {
    await api('POST', '/api/work-orders', {
      title,
      assigned_to,
      description: document.getElementById('wo-desc').value,
      priority:    document.getElementById('wo-priority').value,
      due_date:    document.getElementById('wo-due').value || null,
      unit_id:     document.getElementById('wo-unit').value || null,
    });
    closeModal('modal-create-wo');
    showToast('Work order assigned ✓', 'success');
    loadWorkOrders();
  } catch(e) { showToast(e.message, 'error'); }
  finally { setLoading(btn, false); }
}

async function openWODetail(id) {
  _currentWOId = id;
  const list = document.getElementById('workorders-list');
  const rows = list.querySelectorAll('.unit-row');
  let order;
  try {
    const d = await api('GET', '/api/work-orders');
    order = d.orders.find(o => o._id === id);
  } catch(e) { showToast(e.message, 'error'); return; }
  if (!order) return;
  document.getElementById('wod-title').textContent = order.title;
  document.getElementById('wod-meta').textContent  =
    `Assigned to: ${order.assigned_to?.name||'?'} · Priority: ${order.priority} · Created: ${new Date(order.createdAt).toLocaleDateString()}` +
    (order.due_date ? ` · Due: ${new Date(order.due_date).toLocaleDateString()}` : '');
  document.getElementById('wod-desc').textContent  = order.description || '(no description)';
  document.getElementById('wod-status').value      = order.status;
  document.getElementById('wod-notes').textContent = order.notes || '(no notes yet)';
  showModal('modal-wo-detail');
}

async function submitWOStatusUpdate() {
  if (!_currentWOId) return;
  try {
    await api('PATCH', `/api/work-orders/${_currentWOId}`, { status: document.getElementById('wod-status').value });
    closeModal('modal-wo-detail');
    showToast('Status updated ✓', 'success');
    loadWorkOrders();
  } catch(e) { showToast(e.message, 'error'); }
}

async function deleteWO() {
  if (!_currentWOId || !confirm('Delete this work order?')) return;
  try {
    await api('DELETE', `/api/work-orders/${_currentWOId}`);
    closeModal('modal-wo-detail');
    showToast('Deleted', 'info');
    loadWorkOrders();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── FORGOT PASSWORD ──────────────────────────────────────────
function doForgotPassword() {
  const overlay = document.createElement('div');
  overlay.id = 'fp-overlay';
  overlay.innerHTML = `
<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1100;display:flex;align-items:center;justify-content:center;padding:20px">
<div style="background:#1e2535;border-radius:16px;padding:24px;width:100%;max-width:360px;color:#e2e8f0">
  <div style="font-size:17px;font-weight:600;margin-bottom:6px">Reset Password</div>
  <div id="fp-step1">
    <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Enter your admin email to receive a reset code.</p>
    <input id="fp-email" type="email" placeholder="admin1@lumarok.com" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;font-size:14px;box-sizing:border-box;margin-bottom:12px"/>
    <button onclick="_fpRequestCode()" style="width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Send Code</button>
  </div>
  <div id="fp-step2" style="display:none">
    <p style="font-size:13px;color:#94a3b8;margin-bottom:16px">Enter the 6-digit code and your new password.</p>
    <input id="fp-code" type="text" placeholder="6-digit code" maxlength="6" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;font-size:14px;box-sizing:border-box;margin-bottom:8px"/>
    <input id="fp-newpass" type="password" placeholder="New password (8+ chars)" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;font-size:14px;box-sizing:border-box;margin-bottom:12px"/>
    <button onclick="_fpResetPass()" style="width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer">Reset Password</button>
  </div>
  <button onclick="document.getElementById('fp-overlay').remove()" style="width:100%;padding:10px;background:none;color:#64748b;border:none;font-size:13px;cursor:pointer;margin-top:8px">Cancel</button>
</div></div>`;
  document.body.appendChild(overlay);
}

async function _fpRequestCode() {
  const email = document.getElementById('fp-email')?.value.trim();
  if (!email) { showToast('Enter your email', 'error'); return; }
  try {
    const res = await fetch(API_URL + '/api/auth/forgot-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const d = await res.json();
    if (!d.success) { showToast(d.message || 'Request failed', 'error'); return; }
    document.getElementById('fp-step1').style.display = 'none';
    document.getElementById('fp-step2').style.display = '';
    showToast(d.dev_code ? `Dev code: ${d.dev_code}` : 'Code sent to your email', 'info');
  } catch { showToast('Network error', 'error'); }
}

async function _fpResetPass() {
  const email   = document.getElementById('fp-email')?.value.trim();
  const code    = document.getElementById('fp-code')?.value.trim();
  const newpass = document.getElementById('fp-newpass')?.value;
  if (!code || !newpass) { showToast('Fill all fields', 'error'); return; }
  try {
    const res = await fetch(API_URL + '/api/auth/reset-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password: newpass })
    });
    const d = await res.json();
    if (!d.success) { showToast(d.message || 'Reset failed', 'error'); return; }
    document.getElementById('fp-overlay')?.remove();
    showToast('Password reset! Please sign in.', 'success');
  } catch { showToast('Network error', 'error'); }
}

// ══════════════════════════════════════════
// ACTIVATION CODE PUSH TO INSTALLER
// ══════════════════════════════════════════
async function openPushCodeModal(unitId = '') {
  // Load installers list
  try {
    const res = await fetch(API_URL + '/api/activation/installers', { headers: authHeaders() });
    const data = await res.json();
    const sel = document.getElementById('push-installer-select');
    if (sel) {
      sel.innerHTML = '<option value="">— Select installer —</option>' +
        (data.installers || []).map(i => `<option value="${i._id}">${i.name} (${i.email})</option>`).join('');
    }
  } catch { toast('Could not load installers', 'error'); return; }
  const puInput = document.getElementById('push-unit-id');
  if (puInput) puInput.value = unitId;
  document.getElementById('push-code-modal')?.classList.add('show');
}

function closePushCodeModal() {
  document.getElementById('push-code-modal')?.classList.remove('show');
}

async function doPushCode() {
  const installer_id = document.getElementById('push-installer-select')?.value;
  const unit_id      = document.getElementById('push-unit-id')?.value.trim();
  const note         = document.getElementById('push-note')?.value.trim();
  if (!installer_id || !unit_id) { toast('Select installer and enter unit ID', 'error'); return; }
  setLoading('push-code-btn', true);
  try {
    const res  = await fetch(API_URL + '/api/activation/push-to-installer', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ installer_id, unit_id, note }),
    });
    const data = await res.json();
    if (data.success) {
      toast(`✅ Code pushed to ${data.installer_name}`, 'success');
      closePushCodeModal();
    } else { toast(data.message || 'Push failed', 'error'); }
  } catch { toast('Push failed', 'error'); }
  finally { setLoading('push-code-btn', false); }
}

// ── CSP-safe event delegation (admin) ─────────────────────────────
(function() {
  const _actions = {
  "submitCreateInstaller": (el) => { submitCreateInstaller() },
  "submitWOStatusUpdate": (el) => { submitWOStatusUpdate() },
  "deleteWO": (el) => { deleteWO() },
  "handleLogout": (el) => { handleLogout() },
  "openCreateWO": (el) => { openCreateWO() },
  "switchTab__units": (el) => { switchTab('units') },
  "openOTA": (el) => { openOTA() },
  "switchTab__mqtt": (el) => { switchTab('mqtt') },
  "closeModal__modal_create_wo": (el) => { closeModal('modal-create-wo') },
  "doPushCode": (el) => { doPushCode() },
  "toggleTheme": (el) => { toggleTheme() },
  "closeModal__modal_wo_detail": (el) => { closeModal('modal-wo-detail') },
  "submitGenCode": (el) => { submitGenCode() },
  "closeModal__modal_create_unit": (el) => { closeModal('modal-create-unit') },
  "copyCode": (el) => { copyCode() },
  "closeModal__modal_ota": (el) => { closeModal('modal-ota') },
  "submitCreateUnit": (el) => { submitCreateUnit() },
  "switchTab__users": (el) => { switchTab('users') },
  "doForgotPassword": (el) => { doForgotPassword() },
  "pushOTA": (el) => { pushOTA() },
  "submitGenCreds": (el) => { submitGenCreds() },
  "loadMqtt": (el) => { loadMqtt() },
  "loadLogs": (el) => { loadLogs() },
  "switchTab__overview": (el) => { switchTab('overview') },
  "closePushCodeModal": (el) => { closePushCodeModal() },
  "pcGenerateCreds":    (el) => { pcGenerateCreds() },
  "pcPushToInstaller":  (el) => { pcPushToInstaller() },
  "closePostCreateModal": (el) => { closePostCreateModal() },
  "copyText__pc_u":     (el) => { copyText('pc-u') },
  "copyText__pc_p":     (el) => { copyText('pc-p') },
  "copyText__pc_s":     (el) => { copyText('pc-s') },
  "switchTab__logs": (el) => { switchTab('logs') },
  "doBiometricLogin": (el) => { doBiometricLogin() },
  "closeModal__modal_gen_code": (el) => { closeModal('modal-gen-code') },
  "openCreateUnit": (el) => { openCreateUnit() },
  "closeModal__modal_create_installer": (el) => { closeModal('modal-create-installer') },
  "switchTab__workorders": (el) => { switchTab('workorders') },
  "closeModal_document_querySelector___modal_not__hidden_____id": (el) => { closeModal(document.querySelector('.modal:not(.hidden)')?.id) },
  "switchTab__ota": (el) => { switchTab('ota') },
  "closeModal__modal_gen_creds": (el) => { closeModal('modal-gen-creds') },
  "submitCreateWO": (el) => { submitCreateWO() },
  "switchTab__installers": (el) => { switchTab('installers') },
  "openCreateInstaller": (el) => { openCreateInstaller() }
  };
  document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', e => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const fn = _actions[el.dataset.action];
      if (fn) { e.preventDefault(); fn(el); }
    });
  });
})();

// ── login form submit + wo filters ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-form')?.addEventListener('submit', e => {
    e.preventDefault(); handleLogin(e);
  });
  document.getElementById('wo-filter-status')?.addEventListener('change', loadWorkOrders);
  document.getElementById('wo-filter-priority')?.addEventListener('change', loadWorkOrders);
});
