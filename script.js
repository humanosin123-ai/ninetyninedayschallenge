'use strict';

/* =====================================================================
   CONFIG
   Defaults used on first load. Anything saved through ⚙ Settings is
   stored in localStorage and takes priority over these values.
   ===================================================================== */
const CONFIG = {
  storageKey: 'content_race_v1',
  colors: ['#f43f5e', '#38bdf8', '#a3e635'],
  ytApi: 'https://www.googleapis.com/youtube/v3',
  defaults: {
    goal: 100,
    start: '2026-09-12',            // YYYY-MM-DD, or '' to count everything
    apiKey: 'AIzaSyAL814gQzmSGRIc4vhBT3cUl0a9sj6qTp4',
    people: [
      { id: 'p1', name: 'Arnav',    channel: 'HumanOS-s8h' },   // @handle, channel URL or UC… id
      { id: 'p2', name: 'Yuvraj', channel: 'Yuvraj19119' },
      { id: 'p3', name: 'Ayaan', channel: '' },
    ],
  },
};

/* =====================================================================
   STATE
   S.yt     : personId -> synced YouTube items (cache)
   S.manual : manually added items (demo data / imported JSON)
   Item shape: { id, personId, title, seconds, url, date (ISO), thumb? }
   ===================================================================== */
const freshState = () => ({ ...structuredClone(CONFIG.defaults), manual: [], yt: {} });
let S = loadState();

function loadState() {
  try {
    const state = { ...freshState(), ...JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}') };
    state.manual = state.manual.filter(m => m.platform !== 'instagram');   // drop old Instagram entries
    return state;
  } catch {
    return freshState();
  }
}
function saveState() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(S)); } catch { /* storage unavailable */ }
}

/* =====================================================================
   HELPERS
   ===================================================================== */
const $ = id => document.getElementById(id);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => (/^https?:\/\//i.test(u) ? u : '');

const personById = id => S.people.find(p => p.id === id);
const colorOf = id => CONFIG.colors[Math.max(0, S.people.findIndex(p => p.id === id))];
const startTs = () => (S.start ? new Date(S.start + 'T00:00:00').getTime() : 0);

const mins = sec => (sec / 60).toFixed(1);
const sumSeconds = items => items.reduce((total, i) => total + i.seconds, 0);
const fmtDate = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function fmtDur(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const pad = n => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** ISO-8601 duration (PT1H2M3S) -> seconds */
function isoToSec(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return 0;
  return (+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0);
}

let statusTimer;
function showStatus(msg, kind = 'info', autoHideMs = 0) {
  const styles = {
    info: 'bg-sky-900/50 text-sky-200',
    ok:   'bg-emerald-900/50 text-emerald-200',
    err:  'bg-red-900/50 text-red-200',
  };
  clearTimeout(statusTimer);
  const el = $('status');
  el.className = `text-sm rounded-lg px-4 py-2 mb-4 ${styles[kind]}`;
  el.textContent = msg;
  if (autoHideMs) statusTimer = setTimeout(hideStatus, autoHideMs);
}
const hideStatus = () => $('status').classList.add('hidden');

/* =====================================================================
   DATA
   ===================================================================== */
/** Every counted item (synced + manual) since the start date, newest first. */
function allItems() {
  const from = startTs();
  const synced = S.people.flatMap(p => (S.yt[p.id] || []).map(v => ({ ...v, personId: p.id, source: 'api' })));
  const manual = S.manual.map(m => ({ ...m, source: 'manual' }));
  return [...synced, ...manual]
    .filter(i => new Date(i.date).getTime() >= from)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/** Per-person totals, ranked: finishers by finish time first, then by minutes. */
function computeStats() {
  const goalSec = S.goal * 60;
  const items = allItems();

  return S.people.map(p => {
    const mine = items.filter(i => i.personId === p.id);
    // Finish time = date of the piece that pushed the running total past the goal
    let finish = null, running = 0;
    for (const i of [...mine].sort((a, b) => new Date(a.date) - new Date(b.date))) {
      running += i.seconds;
      if (running >= goalSec) { finish = new Date(i.date); break; }
    }
    return { person: p, total: sumSeconds(mine), count: mine.length, finish };
  }).sort((a, b) => {
    if (a.finish && b.finish) return a.finish - b.finish;
    if (a.finish) return -1;
    if (b.finish) return 1;
    return b.total - a.total;
  });
}

/* =====================================================================
   RENDER
   ===================================================================== */
function render() {
  $('goalTitle').textContent = S.goal;
  $('subtitle').textContent = `First to ${S.goal} minutes of content wins · ` +
    (S.start ? `counting since ${fmtDate(S.start + 'T00:00:00')}` : 'counting all content');

  const stats = computeStats();
  renderBoard(stats);
  renderWinner(stats);
  renderFeed();
}

function renderBoard(stats) {
  const goalSec = S.goal * 60;
  const medals = ['🥇', '🥈', '🥉'];

  $('board').innerHTML = stats.map((s, i) => {
    const color = colorOf(s.person.id);
    const pct = Math.min(100, (s.total / goalSec) * 100);
    const remaining = Math.max(0, goalSec - s.total);
    return `
    <div class="rounded-2xl p-5 bg-slate-900/70 border ${i === 0 ? 'border-amber-400/60' : 'border-slate-800'} relative overflow-hidden">
      <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl" style="background:${color}"></div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${medals[i] ?? ''}</span>
          <span class="font-bold text-lg" style="color:${color}">${esc(s.person.name)}</span>
        </div>
        ${s.finish ? '<span class="text-xs bg-amber-400 text-black font-bold px-2 py-0.5 rounded-full">FINISHED</span>' : ''}
      </div>
      <div class="mt-4 flex items-baseline gap-1">
        <span class="text-4xl font-extrabold tabular-nums">${mins(s.total)}</span>
        <span class="text-slate-400 text-sm">/ ${S.goal} min</span>
      </div>
      <div class="h-3 bg-slate-800 rounded-full mt-3 overflow-hidden">
        <div class="bar h-full rounded-full" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="mt-3 text-xs text-slate-400">
        ▶ <b class="text-slate-200">${s.count}</b> video${s.count === 1 ? '' : 's'}
      </div>
      <div class="mt-2 text-xs text-slate-500">
        ${s.finish ? `Crossed the line on ${fmtDate(s.finish)}` : `${mins(remaining)} min to go`}
      </div>
    </div>`;
  }).join('');
}

function renderWinner(stats) {
  const el = $('winner');
  const w = stats.find(s => s.finish);
  if (!w) { el.className = 'hidden'; return; }
  el.className = 'mb-6 rounded-2xl p-5 bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-400/40 text-center';
  el.innerHTML = `
    <div class="text-3xl">🏆</div>
    <div class="text-xl font-extrabold mt-1">${esc(w.person.name)} wins the race!</div>
    <div class="text-sm text-slate-300">Hit ${S.goal} minutes on ${fmtDate(w.finish)} with ${w.count} video${w.count === 1 ? '' : 's'}</div>`;
}

function feedRowHTML(item) {
  const person = personById(item.personId);
  if (!person) return '';
  const color = colorOf(person.id);
  const href = safeUrl(item.url);
  const title = href
    ? `<a href="${esc(href)}" target="_blank" rel="noopener" class="hover:underline">${esc(item.title)}</a>`
    : esc(item.title);

  return `
    <div class="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
      ${item.thumb ? `<img src="${esc(item.thumb)}" alt="" class="w-20 h-12 object-cover rounded-md hidden sm:block" loading="lazy">` : ''}
      <div class="w-1 self-stretch rounded" style="background:${color}"></div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-medium">${title}</div>
        <div class="text-xs text-slate-500 mt-0.5">
          <span style="color:${color}">${esc(person.name)}</span> · ${fmtDate(item.date)}
          ${item.source === 'manual' ? '· manual' : ''}
        </div>
      </div>
      <div class="text-right">
        <div class="font-bold tabular-nums">${fmtDur(item.seconds)}</div>
        ${item.source === 'manual' ? `<button data-del="${esc(item.id)}" class="text-xs text-slate-500 hover:text-red-400">delete</button>` : ''}
      </div>
    </div>`;
}

function renderFeed() {
  const person = $('flt_person').value;
  const items = allItems().filter(i => !person || i.personId === person);

  $('feed').innerHTML = items.length
    ? items.map(feedRowHTML).join('')
    : `<div class="text-slate-500 text-sm py-8 text-center border border-dashed border-slate-800 rounded-xl">
         No content found yet. Check the channels and start date in ⚙ Settings.</div>`;
}

function fillPersonFilter() {
  const select = $('flt_person');
  const current = select.value;
  select.innerHTML = '<option value="">Everyone</option>' +
    S.people.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  select.value = current;
}

/* =====================================================================
   YOUTUBE API
   ===================================================================== */
async function ytFetch(path, params) {
  const qs = new URLSearchParams({ ...params, key: S.apiKey });
  const res = await fetch(`${CONFIG.ytApi}/${path}?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `YouTube API error ${res.status}`);
  return data;
}

function parseChannelInput(input) {
  input = input.trim();
  const handle = input.match(/youtube\.com\/(@[\w.\-]+)/i);
  if (handle) return { forHandle: handle[1] };
  const channel = input.match(/youtube\.com\/channel\/(UC[\w\-]+)/i);
  if (channel) return { id: channel[1] };
  if (/^UC[\w\-]{20,}$/.test(input)) return { id: input };
  return { forHandle: input.startsWith('@') ? input : '@' + input };
}

/** Walk the uploads playlist (newest first) and stop once we pass `from`. */
async function fetchUploadIds(playlistId, from) {
  const ids = [];
  let pageToken;
  for (let page = 0; page < 20; page++) {
    const params = { part: 'contentDetails', playlistId, maxResults: 50 };
    if (pageToken) params.pageToken = pageToken;
    const res = await ytFetch('playlistItems', params);

    for (const it of res.items) {
      if (new Date(it.contentDetails.videoPublishedAt).getTime() < from) return ids;
      ids.push(it.contentDetails.videoId);
    }
    pageToken = res.nextPageToken;
    if (!pageToken) break;
  }
  return ids;
}

/** Fetch durations/titles for video ids, 50 per request. */
async function fetchVideos(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const res = await ytFetch('videos', { part: 'contentDetails,snippet', id: ids.slice(i, i + 50).join(',') });
    for (const v of res.items) {
      const seconds = isoToSec(v.contentDetails.duration);
      if (!seconds) continue;                       // live / upcoming: no duration yet
      out.push({
        id: 'yt_' + v.id,
        title: v.snippet.title,
        seconds,
        url: 'https://www.youtube.com/watch?v=' + v.id,
        date: v.snippet.publishedAt,
        thumb: v.snippet.thumbnails?.default?.url || '',
      });
    }
  }
  return out;
}

async function syncPerson(person, from) {
  const res = await ytFetch('channels', { part: 'contentDetails', ...parseChannelInput(person.channel) });
  if (!res.items?.length) throw new Error('channel not found');
  const uploadsId = res.items[0].contentDetails.relatedPlaylists.uploads;
  return fetchVideos(await fetchUploadIds(uploadsId, from));
}

let syncing = false;
async function syncAll() {
  const targets = S.people.filter(p => p.channel.trim());
  if (!S.apiKey || !targets.length) {
    return showStatus('Open ⚙ Settings to add your YouTube API key and at least one channel.', 'info');
  }
  if (syncing) return;
  syncing = true;
  showStatus('Syncing YouTube…');

  const from = startTs();
  const results = await Promise.allSettled(targets.map(p => syncPerson(p, from)));

  const summary = [], errors = [];
  results.forEach((r, i) => {
    const p = targets[i];
    if (r.status === 'fulfilled') {
      S.yt[p.id] = r.value;
      summary.push(`${p.name}: ${r.value.length} video${r.value.length === 1 ? '' : 's'} (${mins(sumSeconds(r.value))} min)`);
    } else {
      errors.push(`${p.name}: ${r.reason.message}`);
    }
  });

  saveState();
  render();
  syncing = false;

  if (errors.length) showStatus(errors.join(' | '), 'err');
  else if (results.every(r => r.value.length === 0)) {
    showStatus(`Synced, but found 0 videos since ${S.start || 'the beginning'}. Check the start date and channel in Settings.`, 'err');
  } else showStatus('Synced ✓ ' + summary.join(' · '), 'ok', 6000);
}

/* =====================================================================
   SETTINGS
   ===================================================================== */
function openSettings() {
  $('s_goal').value = S.goal;
  $('s_start').value = S.start;
  $('s_key').value = S.apiKey;
  $('s_people').innerHTML = S.people.map((p, i) => `
    <div class="grid grid-cols-5 gap-2 items-center">
      <span class="w-3 h-3 rounded-full" style="background:${CONFIG.colors[i]}"></span>
      <input data-name="${p.id}" value="${esc(p.name)}" placeholder="Name"
             class="col-span-2 bg-slate-800 rounded-lg px-3 py-2 text-sm">
      <input data-chan="${p.id}" value="${esc(p.channel)}" placeholder="@handle or UC… (optional)"
             class="col-span-2 bg-slate-800 rounded-lg px-3 py-2 text-sm">
    </div>`).join('');
  $('settings').showModal();
}

function saveSettings() {
  const newStart = $('s_start').value;
  if (newStart !== S.start) S.yt = {};              // cache was cut off at the old start date

  S.goal = Math.max(1, +$('s_goal').value || 100);
  S.start = newStart;
  S.apiKey = $('s_key').value.trim();

  S.people.forEach(p => {
    p.name = document.querySelector(`[data-name="${p.id}"]`).value.trim() || p.name;
    const channel = document.querySelector(`[data-chan="${p.id}"]`).value.trim();
    if (channel !== p.channel) delete S.yt[p.id];
    p.channel = channel;
  });

  saveState();
  fillPersonFilter();
  render();
  $('settings').close();
  syncAll();
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

function loadDemoData() {
  const day = 864e5;
  const mk = (personId, title, seconds, daysAgo) => ({
    id: 'demo_' + Math.random().toString(36).slice(2), demo: true,
    personId, title, seconds, url: '',
    date: new Date(Date.now() - daysAgo * day).toISOString(),
  });
  S.manual.push(
    mk('p1', 'Demo: Studio tour', 612, 6), mk('p1', 'Demo: Vlog',     1140, 2),
    mk('p2', 'Demo: Tutorial',   1380, 3), mk('p2', 'Demo: Shorts recap', 58, 4),
    mk('p3', 'Demo: Q&A',        2100, 5), mk('p3', 'Demo: Behind the scenes', 320, 1),
  );
  saveState();
  render();
  $('settings').close();
}

/* =====================================================================
   EVENTS + INIT
   ===================================================================== */
function bindEvents() {
  $('settingsBtn').onclick = openSettings;
  $('closeSettings').onclick = () => $('settings').close();
  $('saveSettings').onclick = saveSettings;

  $('flt_person').onchange = renderFeed;

  $('feed').onclick = e => {
    const id = e.target.dataset.del;
    if (id && confirm('Delete this entry?')) {
      S.manual = S.manual.filter(m => m.id !== id);
      saveState();
      render();
    }
  };

  $('exportBtn').onclick = exportJson;
  $('importFile').onchange = importJson;
  $('demoBtn').onclick = loadDemoData;
  $('clearDemoBtn').onclick = () => { S.manual = S.manual.filter(m => !m.demo); saveState(); render(); };
  $('resetBtn').onclick = () => {
    if (!confirm('Erase all saved settings and data?')) return;
    S = freshState();
    saveState();
    fillPersonFilter();
    render();
    $('settings').close();
    syncAll();
  };
}

function init() {
  fillPersonFilter();
  bindEvents();
  render();
  syncAll();               // auto-sync on every page load
}

init();                    // script is loaded with `defer`, so the DOM is ready
