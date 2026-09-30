'use strict';
/* STATS page: pick a person card -> see all their stats (skills tiles) and every video. */
const STATS = [
  { k: 'views',    icon: '👁', name: 'Views',       desc: 'Total views on videos published since the quests began.', get: s => s.views },
  { k: 'count',    icon: '🎬', name: 'Videos',      desc: 'Videos uploaded since the quests began.',                 get: s => s.count },
  { k: 'minutes',  icon: '⏱', name: 'Minutes',     desc: 'Minutes of content produced.',                            get: s => mins(s.secs) },
  { k: 'subs',     icon: '👥', name: 'Subscribers', desc: 'Current channel subscribers (whole channel).',            get: s => s.subs },
  { k: 'likes',    icon: '❤️', name: 'Likes',       desc: 'Likes gathered by these videos.',                         get: s => s.likes },
  { k: 'comments', icon: '💬', name: 'Comments',    desc: 'Comments left on these videos.',                          get: s => s.comments },
];
let selStat = 'views';

function personStats(items) {
  return S.people.map(p => {
    const mine = items.filter(i => i.personId === p.id), sum = k => mine.reduce((t, i) => t + (i[k] || 0), 0);
    return { p, count: mine.length, secs: sumSeconds(mine), views: sum('views'), likes: sum('likes'), comments: sum('comments'), subs: S.chan?.[p.id]?.subs ?? null };
  });
}

function renderStats() {
  lastPhases = IDS.map(id => ch(id).status).join();
  const s0 = Math.min(...IDS.map(id => ch(id).s)), items = allItems({ s: s0, e: Infinity }), st = personStats(items);
  if (!st.some(s => s.p.id === selId)) selId = st[0]?.p.id;
  $('title').textContent = '📊 Stats';
  $('subtitle').textContent = `Tap an adventurer to see their numbers · counting since ${fmtDate(s0)}`;

  $('people').innerHTML = st.map((s, i) => `<button class="q ${s.p.id === selId ? 'on' : ''}" data-id="${s.p.id}" style="--c:${colorOf(s.p.id)}">
    <span class="ico">${QICONS[i] ?? '🌿'}</span>
    <span style="flex:1;min-width:0"><b>${esc(s.p.name)}</b><small>${s.count} video${s.count === 1 ? '' : 's'} · ${mins(s.secs)} min</small></span></button>`).join('');

  const x = STATS.find(z => z.k === selStat), me = st.find(s => s.p.id === selId) || st[0];
  const vals = st.map(s => +x.get(s) || 0), max = Math.max(1, ...vals), rank = vals.filter(v => v > (+x.get(me) || 0)).length + 1;
  $('skills').innerHTML = STATS.map(t => `<button class="t ${t.k === selStat ? 'on' : ''}" data-s="${t.k}"><span>${t.icon}</span><em>${t.name}</em></button>`).join('');
  $('skillInfo').innerHTML = `<div class="top"><span class="sc"><b>${x.icon} ${x.name}</b></span><span class="tag">RANK #${rank}</span></div>
    <p style="margin:4px 0 2px">${x.desc}</p><div class="big">${esc(me.p.name)}: ${nf(x.get(me))}</div>` +
    st.map((s, i) => `<div class="row" style="--c:${colorOf(s.p.id)}"><b>${esc(s.p.name)}</b><div class="pb"><i style="width:${vals[i] / max * 100}%"></i></div><span>${nf(x.get(s))}</span></div>`).join('');

  const mine = items.filter(i => i.personId === me.p.id);
  $('feed').innerHTML = mine.length ? mine.map(feedRowHTML).join('') : '<div class="empty">No videos counted yet.</div>';
}
