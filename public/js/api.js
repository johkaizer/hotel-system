// ── API Wrapper ──────────────────────────────────────────────────────────
const API_BASE = '/api';

function getToken() { return localStorage.getItem('hotel_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('hotel_user')); } catch { return null; } }
function setAuth(token, user) { localStorage.setItem('hotel_token', token); localStorage.setItem('hotel_user', JSON.stringify(user)); }
function clearAuth() { localStorage.removeItem('hotel_token'); localStorage.removeItem('hotel_user'); }

function requireAuth() {
  if (!getToken()) { window.location.href = '/index.html'; return false; }
  return true;
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(API_BASE + endpoint, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (res.status === 401 || res.status === 403) { clearAuth(); window.location.href = '/index.html'; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

// ── Toast ────────────────────────────────────────────────────────────────
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div'); el.id = 'toast-container'; document.body.appendChild(el); return el;
  })();
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ── Sidebar init ─────────────────────────────────────────────────────────
function initSidebar() {
  const user = getUser();
  if (user) {
    const nameEls = document.querySelectorAll('.user-name');
    const roleEls = document.querySelectorAll('.user-role');
    const initEls = document.querySelectorAll('.user-initial');
    nameEls.forEach(el => el.textContent = user.name);
    roleEls.forEach(el => el.textContent = user.role === 'admin' ? 'Administrador' : 'Recepcionista');
    initEls.forEach(el => el.textContent = user.name[0]);
  }
  const path = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href && path === href.replace('./', '')) item.classList.add('active');
  });
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { clearAuth(); window.location.href = '/index.html'; });
}

// ── Modal Helpers ────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function setupModalClose(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(id); });
}

// ── Format helpers ───────────────────────────────────────────────────────
function formatCurrency(n) { return 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); }
function formatDate(d) { if (!d) return '—'; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('pt-BR'); }
function formatDateTime(d) { if (!d) return '—'; return new Date(d).toLocaleString('pt-BR'); }
function daysDiff(d1, d2) { return Math.max(1, Math.round((new Date(d2) - new Date(d1)) / 86400000)); }
function statusLabel(s) {
  const map = { available:'Livre', occupied:'Ocupado', cleaning:'Limpeza', maintenance:'Manutenção', confirmed:'Confirmada', checked_in:'Check-in', checked_out:'Check-out', cancelled:'Cancelada' };
  return map[s] || s;
}
