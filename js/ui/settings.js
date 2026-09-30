'use strict';
/* Settings dialog, JSON export/import, demo data. */

/* =====================================================================
   SETTINGS
   ===================================================================== */
function openSettings() {
  ['m500', 'v30'].forEach(id => { $(`s_${id}_goal`).value = S.cfg[id].goal; $(`s_${id}_start`).value = S.cfg[id].start; });
  $('s_key').value = S.apiKey;
  $('s_people').innerHTML = S.people.map((p, i) => `
    <div class="prow">
      <span class="w-3 h-3 rounded-full" style="background:${CONFIG.colors[i]}"></span>
      <input data-name="${p.id}" value="${esc(p.name)}" placeholder="Name"
             class="in">
      <input data-chan="${p.id}" value="${esc(p.channel)}" placeholder="@handle or UC… (optional)"
             class="in">
    </div>`).join('');
  $('settings').showModal();
}

function saveSettings() {
  ['m500', 'v30'].forEach(id => {
    S.cfg[id] = { goal: Math.max(1, +$(`s_${id}_goal`).value || CONFIG.defaults.cfg[id].goal), start: $(`s_${id}_start`).value };
  });
  S.yt = {}; S.ytFrom = null; S.ytAt = 0;                                 // window may have changed: re-sync
  S.apiKey = $('s_key').value.trim();
  S.people.forEach(p => {
    p.name = document.querySelector(`[data-name="${p.id}"]`).value.trim() || p.name;
    p.channel = document.querySelector(`[data-chan="${p.id}"]`).value.trim();
  });
  saveState();
  fillPersonFilter();
  render();
  $('settings').close();
  syncAll();
}

/** Demo videos for the two live challenges (dated from their start date). */
function loadDemoData() {
  const base = Math.min(ch('m500').s, ch('v30').s), day = 864e5;
  S.people.forEach((p, pi) => {
    for (let k = 0; k < ([14, 9, 6][pi] || 5); k++) S.manual.push({
      id: 'demo_' + Math.random().toString(36).slice(2), demo: true, personId: p.id,
      title: `Demo: video ${k + 1}`, seconds: 120 + ((k * 97 + pi * 53) % 700), url: '',
      date: new Date(base + (k * 0.4 + pi * 0.1) * day + 36e5).toISOString(),
    });
  });
  saveState(); render(); $('settings').close();
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ ...S, apiKey: '' }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'content-race.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    S = { ...freshState(), ...imported, apiKey: S.apiKey };   // keep this browser's API key
    saveState();
    fillPersonFilter();
    render();
    $('settings').close();
    showStatus('Imported ✓', 'ok', 4000);
  } catch {
    showStatus('Invalid JSON file.', 'err');
  }
  e.target.value = '';
}
