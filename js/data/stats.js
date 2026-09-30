'use strict';
/* Which items count for a challenge, and who is ahead. */

function allItems(c) {
  const synced = S.people.flatMap(p => (S.yt[p.id] || []).map(v => ({ ...v, personId: p.id, source: 'api' })));
  const manual = S.manual.map(m => ({ ...m, source: 'manual' }));
  return [...synced, ...manual]
    .filter(i => { const t = new Date(i.date).getTime(); return t >= c.s && t <= c.e; })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/** Ranked: finishers by finish time, then by progress on the challenge's own metric. */
function computeStats(c) {
  const items = allItems(c);
  return S.people.map(p => {
    const mine = items.filter(i => i.personId === p.id);
    const asc = [...mine].sort((a, b) => new Date(a.date) - new Date(b.date));
    let finish = null, run = 0;
    if (c.type === 'videos') {
      if (asc.length >= c.goal) finish = new Date(asc[c.goal - 1].date);   // date of the Nth video
    } else {
      for (const i of asc) { run += i.seconds; if (run >= c.goal * 60) { finish = new Date(i.date); break; } }
    }
    const sum = k => mine.reduce((t, i) => t + (i[k] || 0), 0);
    return { person: p, total: sumSeconds(mine), count: mine.length, finish, views: sum('views'), likes: sum('likes'), comments: sum('comments'), subs: S.chan?.[p.id]?.subs ?? null };
  }).sort((a, b) => {
    if (a.finish && b.finish) return a.finish - b.finish;
    if (a.finish) return -1;
    if (b.finish) return 1;
    return c.type === 'videos' ? (b.count - a.count || b.total - a.total) : (b.total - a.total || b.count - a.count);
  });
}
