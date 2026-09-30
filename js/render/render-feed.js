'use strict';
/* AREA MAP: video feed and person filter. */
function feedRowHTML(item) {
  const person = personById(item.personId);
  if (!person) return '';
  const href = safeUrl(item.url), color = colorOf(person.id);
  const title = href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(item.title)}</a>` : esc(item.title);
  const st = item.source === 'api' ? `<span>👁 ${nf(item.views)}</span><span>❤️ ${nf(item.likes)}</span><span>💬 ${nf(item.comments)}</span>` : '<span>manual</span>';
  return `<div class="v" style="--c:${color}">
    ${item.thumb ? `<img src="${esc(item.thumb)}" alt="" loading="lazy">` : '<div class="nothumb">🍃</div>'}
    <div style="min-width:0;flex:1"><div class="vt">${title}</div>
      <div class="vm"><b style="color:${color}">${esc(person.name)}</b> · ${fmtDate(item.date)} · ⏱ ${fmtDur(item.seconds)}</div>
      <div class="vm vs">${st}</div></div>
    ${item.source === 'manual' ? `<button class="btn sm" data-del="${esc(item.id)}">delete</button>` : ''}</div>`;
}
function renderFeed(c = ch(tab)) {
  const items = allItems(c).filter(i => i.personId === selId);
  $('feed').innerHTML = !selId ? '<div class="empty">Tap a quest card to see their videos.</div>'
    : items.length ? items.map(feedRowHTML).join('') : '<div class="empty">No videos counted yet for this quest.</div>';
}
function fillPersonFilter() {
  const select = $('flt_person');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Everyone</option>' + S.people.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  select.value = current;
}
