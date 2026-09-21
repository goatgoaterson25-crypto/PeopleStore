let catalogCache = [];
let dragApp = null;

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadCatalog() {
  const q = document.getElementById('q')?.value?.trim() || '';
  const category = document.getElementById('category')?.value || '';
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);

  const grid = document.getElementById('grid');
  const meta = document.getElementById('count-meta');
  if (!grid) return;

  try {
    const apps = await api('/apps?' + params.toString());
    catalogCache = apps;
    if (meta) {
      meta.textContent = apps.length
        ? `${String(apps.length).padStart(2, '0')} ONLINE`
        : 'EMPTY';
    }
    if (!apps.length) {
      grid.innerHTML =
        '<div class="empty">No payloads in this sector.<br/>Try another query or publish from Developer.</div>';
      return;
    }
    grid.innerHTML = apps.map(cardHtml).join('');
    bindCardDrag();
  } catch (e) {
    if (meta) meta.textContent = 'FAULT';
    grid.innerHTML = `<div class="error-box">Uplink failed — ${escapeHtml(e.message)}</div>`;
  }
}

function cardHtml(a) {
  return `
    <article class="card glass" draggable="true" data-id="${escapeHtml(a.id)}" data-name="${escapeHtml(a.name)}">
      <div class="card-sheen"></div>
      <div class="card-top">
        <span class="badge">${escapeHtml(a.category || 'GEN')}</span>
        <span class="ver">v${escapeHtml(a.version)}</span>
      </div>
      <h3>${escapeHtml(a.name)}</h3>
      <p class="desc">${escapeHtml(a.description)}</p>
      <div class="card-foot">
        <span class="meta-line">${a.downloads || 0} DL · ${escapeHtml((a.developer && a.developer.name) || 'UNKNOWN')}</span>
        <button type="button" class="btn acquire" data-acquire="${escapeHtml(a.id)}">
          <span class="btn-label">Acquire</span>
          <span class="charge"><i></i></span>
        </button>
      </div>
    </article>`;
}

function bindCardDrag() {
  document.querySelectorAll('.card[draggable]').forEach((card) => {
    card.addEventListener('dragstart', (e) => {
      const id = card.dataset.id;
      dragApp = catalogCache.find((a) => a.id === id) || {
        id,
        name: card.dataset.name,
      };
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', id);
      document.getElementById('singularity')?.classList.add('hungry');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.getElementById('singularity')?.classList.remove('hungry');
      dragApp = null;
    });
  });

  document.querySelectorAll('[data-acquire]').forEach((btn) => {
    btn.addEventListener('click', () => runAcquire(btn));
  });
}

function runAcquire(btn) {
  if (btn.classList.contains('charging') || btn.classList.contains('done')) return;
  const id = btn.getAttribute('data-acquire');
  btn.classList.add('charging');
  const bar = btn.querySelector('.charge i');
  let p = 0;
  const t = setInterval(() => {
    p += 4 + Math.random() * 8;
    if (p >= 100) {
      p = 100;
      clearInterval(t);
      btn.classList.remove('charging');
      btn.classList.add('done');
      btn.querySelector('.btn-label').textContent = 'Ready';
      setTimeout(() => {
        window.open(`${API_URL}/apps/${id}/download`, '_blank');
        btn.classList.remove('done');
        btn.querySelector('.btn-label').textContent = 'Acquire';
        if (bar) bar.style.width = '0%';
      }, 400);
    }
    if (bar) bar.style.width = p + '%';
  }, 40);
}

function initSingularity() {
  const hole = document.getElementById('singularity');
  if (!hole) return;

  hole.addEventListener('dragover', (e) => {
    e.preventDefault();
    hole.classList.add('active');
  });
  hole.addEventListener('dragleave', () => hole.classList.remove('active'));
  hole.addEventListener('drop', (e) => {
    e.preventDefault();
    hole.classList.remove('active', 'hungry');
    const id = e.dataTransfer.getData('text/plain');
    const app = dragApp || catalogCache.find((a) => a.id === id);
    if (app) {
      saveApp(app);
      renderSavedTray();
      hole.classList.add('pulse');
      setTimeout(() => hole.classList.remove('pulse'), 600);
    }
  });
}

function renderSavedTray() {
  const tray = document.getElementById('saved-tray');
  const track = document.getElementById('saved-track');
  if (!tray || !track) return;
  const list = getSaved();
  if (!list.length) {
    tray.classList.add('empty-tray');
    track.innerHTML = '<div class="tray-hint">Drag a card into the singularity to save</div>';
    return;
  }
  tray.classList.remove('empty-tray');
  const mid = (list.length - 1) / 2;
  track.innerHTML = list
    .map((a, i) => {
      const dist = i - mid;
      const rot = dist * 0.08;
      const z = 100 - Math.abs(dist);
      return `
        <button type="button" class="tray-card glass" style="--rot:${rot}; --z:${z}" data-open="${escapeHtml(a.id)}" title="${escapeHtml(a.name)}">
          <span class="tray-name">${escapeHtml(a.name)}</span>
          <span class="tray-cat">${escapeHtml(a.category || '')}</span>
        </button>`;
    })
    .join('');

  track.querySelectorAll('[data-open]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-open');
      const app = catalogCache.find((a) => a.id === id) || list.find((a) => a.id === id);
      if (app) {
        document.getElementById('q').value = app.name;
        loadCatalog();
      }
    });
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      unsaveApp(el.getAttribute('data-open'));
      renderSavedTray();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadCatalog();
  initSingularity();
  renderSavedTray();
  document.getElementById('q')?.addEventListener('input', debounce(loadCatalog, 200));
  document.getElementById('category')?.addEventListener('change', loadCatalog);
});
