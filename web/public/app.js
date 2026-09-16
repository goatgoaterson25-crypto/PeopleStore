async function loadCatalog() {
  const q = document.getElementById('q')?.value || '';
  const category = document.getElementById('category')?.value || '';
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);

  const grid = document.getElementById('grid');
  if (!grid) return;

  try {
    const apps = await api('/apps?' + params.toString());
    if (!apps.length) {
      grid.innerHTML = '<p class="muted">No apps yet. Developers can upload from the Developer page.</p>';
      return;
    }
    grid.innerHTML = apps
      .map(
        (a) => `
      <article class="card">
        <span class="badge">${a.category}</span>
        <h3>${escapeHtml(a.name)}</h3>
        <p>${escapeHtml(a.description)}</p>
        <div class="meta">v${escapeHtml(a.version)} · ${a.downloads} downloads</div>
        <div class="row">
          <button onclick="downloadApp('${a.id}')">Download APK</button>
        </div>
      </article>`
      )
      .join('');
  } catch (e) {
    grid.innerHTML = `<p class="error">Failed to load catalog: ${escapeHtml(e.message)}</p>`;
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
