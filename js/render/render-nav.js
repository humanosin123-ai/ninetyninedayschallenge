'use strict';
/* Menu tabs and the home-page quest list. */
const BADGE = { live: 'LIVE', upcoming: 'SOON', ended: 'ENDED' };
function renderTabs() {
  $('tabs').innerHTML = `<a href="${ROOT}index.html" class="tab ${tab === 'hub' ? 'on' : ''}">🏠 Home</a>` + IDS.map(id => {
    const t = ch(id);
    return `<a href="${ROOT}${t.page}" class="tab ${id === tab ? 'on' : ''}">${t.icon} ${esc(t.label)} <small>${BADGE[t.status]}</small></a>`;
  }).join('') + `<a href="${ROOT}pages/stats.html" class="tab ${tab === 'stats' ? 'on' : ''}">📊 Stats</a>`;
}
function renderHub() {
  $('title').textContent = '🏁 Content Race';
  $('subtitle').textContent = 'Pick a quest to see who is winning.';
  $('hub').innerHTML = IDS.map(id => {
    const c = ch(id);
    return `<a href="${ROOT}${c.page}" class="q" style="text-decoration:none;color:inherit"><span class="ico">${c.icon}</span>
      <span style="flex:1"><b>${esc(c.label)}</b><small>First to ${c.goal} ${c.type === 'minutes' ? 'minutes' : 'videos'}</small></span><span class="tag">${BADGE[c.status]}</span></a>`;
  }).join('') + `<a href="${ROOT}pages/stats.html" class="q" style="text-decoration:none;color:inherit"><span class="ico">📊</span>
      <span style="flex:1"><b>Stats</b><small>Views, subs, growth and top videos</small></span><span class="tag">ALL QUESTS</span></a>`;
}
