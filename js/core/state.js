'use strict';
/* App state (localStorage-backed) and challenge lookup. */

/* STATE  S.yt: personId -> synced videos · S.manual: demo/imported items */
const freshState = () => ({ ...structuredClone(CONFIG.defaults), manual: [], yt: {}, chan: {}, ytFrom: null, ytAt: 0 });
let S = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '{}');
    const f = freshState(), st = { ...f, ...saved };
    st.cfg = { m500: { ...f.cfg.m500, ...saved.cfg?.m500 }, v30: { ...f.cfg.v30, ...saved.cfg?.v30 } };
    return st;
  } catch { return freshState(); }
}
function saveState() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(S)); } catch { /* storage unavailable */ }
}

/* Challenge = config + settings + computed window/status */
const stamp = (d, endOfDay) => new Date(`${d}T${endOfDay ? '23:59:59.999' : '00:00:00'}${CONFIG.tz}`).getTime();
function ch(id) {
  const c = { id, ...CONFIG.challenges[id], ...S.cfg[id] };
  c.s = c.start ? stamp(c.start) : 0;
  c.e = c.end ? stamp(c.end, true) : Infinity;
  c.status = Date.now() < c.s ? 'upcoming' : Date.now() > c.e ? 'ended' : 'live';
  return c;
}

const ROOT = document.body.dataset.root || '';   // '' on index.html, '../' inside pages/
const tab = document.body.dataset.page;      // 'hub' | 'm500' | 'v30' | 'm100'
let lastPhases = '';
