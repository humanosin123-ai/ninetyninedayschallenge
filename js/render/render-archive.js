'use strict';
/* Static, hard-coded results table for ended challenges. */
function renderArchive(c) {
  $('archive').innerHTML = `<div class="panel"><h2>Final Results</h2><table class="tbl"><thead><tr><th>#</th><th>Channel</th><th style="text-align:right">Videos</th><th style="text-align:right">Minutes</th></tr></thead><tbody>${c.archive.map((r, i) => `
    <tr class="${i === 0 ? 'gold' : ''}"><td>${MEDALS[i] ?? i + 1}</td>
    <td><b>${esc(r.name)}</b>${safeUrl(r.url) ? `<br><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a>` : ''}</td>
    <td style="text-align:right"><b>${esc(r.videos)}</b></td><td style="text-align:right"><b>${Number(r.minutes).toFixed(1)}</b></td></tr>`).join('')}</tbody></table></div>`;
}
