'use strict';
/* QUESTS (leaderboard) + panel. */
let selId = null, lastStats = null, lastC = null;
const nf = n => (n == null || isNaN(n)) ? '—' : Number(n).toLocaleString();
const QICONS = ['💪', '🧠', '🌊'], MEDALS = ['🥇', '🥈', '🥉'];

function renderBoard(stats, c) {
  lastStats = stats; lastC = c;
  const isMin = c.type === 'minutes', unit = isMin ? 'min' : 'videos';
  $('board').innerHTML = stats.map((s, i) => {
    const cur = isMin ? s.total / 60 : s.count, pct = Math.min(100, cur / c.goal * 100);
    return `<button class="q ${s.person.id === selId ? 'on' : ''}" data-id="${s.person.id}" style="--c:${colorOf(s.person.id)}">
      <span class="ico">${QICONS[i] ?? '🌿'}</span>
      <span style="flex:1;min-width:0"><b>${MEDALS[i] ?? ''} ${esc(s.person.name)}</b>
        <small>${isMin ? mins(s.total) : s.count} / ${c.goal} ${unit}${s.finish ? ' · ✦ Complete' : ''}</small>
        <div class="pb"><i style="width:${pct}%"></i></div></span>
      <span class="r">${Math.floor(pct)}%</span></button>`;
  }).join('');
}

function renderWinner(stats, c) {
  const el = $('winner'), w = stats.find(s => s.finish);
  if (!w) { el.className = 'hidden'; return; }
  const isMin = c.type === 'minutes';
  el.className = 'win';
  el.innerHTML = `<div style="font-size:30px">🏆</div><div class="sc" style="font-size:22px;font-weight:700">${esc(w.person.name)} completed the quest!</div>
    <div>Reached ${c.goal} ${isMin ? 'minutes' : 'videos'} on ${fmtDate(w.finish)}${isMin ? ` with ${w.count} video${w.count === 1 ? '' : 's'}` : ` (${mins(w.total)} min total)`}</div>`;
}
