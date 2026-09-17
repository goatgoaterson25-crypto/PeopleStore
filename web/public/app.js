async function loadCatalog() {
  const q = document.getElementById('q')?.value || '';
  const category = document.getElementById('category')?.value || '';
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);

  const grid = document.getElementById('grid');
  const meta = document.getElementById('count-meta');
  if (!grid) return;

  try {
    const apps = await api('/apps?' + params.toString());
    if (meta) {
      meta.textContent = apps.length
        ? `${String(apps.length).padStart(2, '0')} ASSETS ONLINE`
        : 'ZERO MATCHES';
    }
    if (!apps.length) {
      grid.innerHTML =
        '<div class="empty">NO APPROVED PAYLOADS IN THIS SECTOR.<br/>Developers: stage builds via DEVELOPER console.</div>';
      return;
    }
    grid.innerHTML = apps
      .map(
        (a) => `
      <article class="card">
        <div class="card-top">
          <span class="badge">${escapeHtml(a.category || 'GEN')}</span>
          <span class="muted">v${escapeHtml(a.version)}</span>
        </div>
        <h3>${escapeHtml(a.name)}</h3>
        <p class="desc">${escapeHtml(a.description)}</p>
        <div class="card-foot">
          <span>${a.downloads || 0} DL · ${(a.developer && a.developer.name) || 'UNKNOWN'}</span>
          <button class="btn" type="button" onclick="downloadApp('${a.id}')">Acquire</button>
        </div>
      </article>`
      )
      .join('');
  } catch (e) {
    if (meta) meta.textContent = 'LINK FAULT';
    grid.innerHTML = `<div class="error-box">UPLINK FAILED — ${escapeHtml(e.message)}</div>`;
  }
}

function downloadApp(id) {
  window.open(`\( {API_URL}/apps/ \){id}/download`, '_blank');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
