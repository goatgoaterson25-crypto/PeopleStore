// Point this at your Railway API
const API_URL =
  window.NEXT_PUBLIC_API_URL ||
  'https://peoplestore-production.up.railway.app';

function getToken() {
  return localStorage.getItem('ps_token');
}

function setAuth(token, user) {
  localStorage.setItem('ps_token', token);
  localStorage.setItem('ps_user', JSON.stringify(user));
  updateAuthStatus();
}

function clearAuth() {
  localStorage.removeItem('ps_token');
  localStorage.removeItem('ps_user');
  updateAuthStatus();
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('ps_user') || 'null');
  } catch {
    return null;
  }
}

function updateAuthStatus() {
  const el = document.getElementById('auth-label');
  if (!el) return;
  const user = getUser();
  el.textContent = user
    ? `${user.email} · ${user.role}`
    : 'SYSTEM READY';
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

document.addEventListener('DOMContentLoaded', updateAuthStatus);
