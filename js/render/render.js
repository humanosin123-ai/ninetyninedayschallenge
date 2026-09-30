'use strict';
/* Top-level render(): picks live dashboard vs archive vs hub. */

function render() {
  renderTabs();
  if (tab === 'hub') return renderHub();
  if (tab === 'stats') return renderStats();
  const c = ch(tab), isMin = c.type === 'minutes', unit = isMin ? 'minutes' : 'videos';
  lastPhases = IDS.map(id => ch(id).status).join();

  $('title').textContent = isMin ? `🏁 ${c.goal}-Minute Content Race` : `🎬 First to ${c.goal} Videos`;
  $('subtitle').textContent = `First to ${isMin ? c.goal + ' minutes of content' : 'publish ' + c.goal + ' videos'} wins · ` +
    (c.start ? `counting since ${fmtDay(c.start)}` : 'counting all content') + (c.end ? ` until ${fmtDay(c.end)}` : '');

  const phase = $('phase'), days = Math.ceil((c.s - Date.now()) / 864e5);
  const msg = c.status === 'upcoming' ? `⏳ Starts ${fmtDay(c.start)} (in ${days} day${days === 1 ? '' : 's'}). Only content published from then counts.`
    : c.status === 'ended' ? `🏁 This challenge ended on ${fmtDay(c.end)}.`
    : c.end ? `🟢 Live — ends ${fmtDay(c.end)}. Content published after that won't count.`
    : `🟢 Live — counts everything published since ${fmtDay(c.start)}, including the 100-minute challenge period.`;
  phase.textContent = msg;
  phase.className = msg ? 'msg' : 'hidden';

  const archived = c.status === 'ended' && c.archive;
  $('live').classList.toggle('hidden', !!archived);
  $('archive').classList.toggle('hidden', !archived);
  if (archived) return renderArchive(c);

  const stats = computeStats(c);
  renderBoard(stats, c);
  renderWinner(stats, c);
  renderFeed(c);
}

/** Static, hard-coded final results — no fetching, no stats. */
