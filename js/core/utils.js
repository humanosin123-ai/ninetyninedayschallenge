'use strict';
/* Small shared helpers: DOM, escaping, formatting, status banner. */

const $ = id => document.getElementById(id);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => (/^https?:\/\//i.test(u) ? u : '');

const personById = id => S.people.find(p => p.id === id);
const colorOf = id => CONFIG.colors[Math.max(0, S.people.findIndex(p => p.id === id))];
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
  clearTimeout(statusTimer);
  const el = $('status');
  el.className = `msg ${kind}`;
  el.textContent = msg;
  if (autoHideMs) statusTimer = setTimeout(hideStatus, autoHideMs);
}
const hideStatus = () => $('status').classList.add('hidden');


const fmtDay = d => fmtDate(d + 'T12:00:00');
