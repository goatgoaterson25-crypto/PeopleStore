// PeopleStore — API bridge
const API_URL =
  window.NEXT_PUBLIC_API_URL ||
  'https://peoplestore-production.up.railway.app';

const SAVED_KEY = 'ps_saved_apps';

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
  const user = getUser();
  document.querySelectorAll('[data-auth-label]').forEach((el) => {
    el.textContent = user ? `${user.email} · ${user.role}` : 'GUEST';
  });
  document.querySelectorAll('[data-auth-dot]').forEach((el) => {
    el.classList.toggle('online', !!user);
  });
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (e) {
    throw new Error('Network error — is the API up?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed');
  return data;
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function getSaved() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

function setSaved(list) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
}

function saveApp(app) {
  const list = getSaved().filter((a) => a.id !== app.id);
  list.unshift({
    id: app.id,
    name: app.name,
    category: app.category,
    version: app.version,
    description: app.description,
  });
  setSaved(list.slice(0, 24));
}

function unsaveApp(id) {
  setSaved(getSaved().filter((a) => a.id !== id));
}

document.addEventListener('DOMContentLoaded', updateAuthStatus);
