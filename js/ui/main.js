'use strict';
/* Event wiring + startup. Loaded last. */
const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };   // each page only has some of these elements

function bindEvents() {
  on('settingsBtn', openSettings);
  on('closeSettings', () => $('settings').close());
  on('saveSettings', saveSettings);
  on('refreshBtn', () => syncAll());
  on('board', e => { const b = e.target.closest('[data-id]'); if (b) { selId = selId === b.dataset.id ? null : b.dataset.id; renderBoard(lastStats, lastC); renderFeed(lastC); } });
  on('people', e => { const b = e.target.closest('[data-id]'); if (b) { selId = b.dataset.id; renderStats(); } });
  on('skills', e => { const b = e.target.closest('[data-s]'); if (b) { selStat = b.dataset.s; renderStats(); } });

  on('feed', e => {
    const id = e.target.dataset.del;
    if (id && confirm('Delete this entry?')) { S.manual = S.manual.filter(m => m.id !== id); saveState(); render(); }
  });

  on('exportBtn', exportJson);
  if ($('importFile')) $('importFile').onchange = importJson;
  on('demoBtn', loadDemoData);
  on('clearDemoBtn', () => { S.manual = S.manual.filter(m => !m.demo); saveState(); render(); });
  on('resetBtn', () => {
    if (!confirm('Erase all saved settings and data?')) return;
    S = freshState(); saveState(); fillPersonFilter(); render(); $('settings').close(); syncAll();
  });
}

function init() {
  if (tab === 'hub') { render(); return; }
  fillPersonFilter();
  bindEvents();
  render();
  const live = () => tab === 'stats' || ch(tab).status !== 'ended';   // an ended challenge shows hard-coded data only
  if (live()) syncAll();
  // flip challenges to upcoming/live/ended automatically while the page stays open
  setInterval(() => { if (IDS.map(id => ch(id).status).join() !== lastPhases) { render(); if (live()) syncAll(); } }, 60000);
}

init();                    // script is loaded with `defer`, so the DOM is ready
