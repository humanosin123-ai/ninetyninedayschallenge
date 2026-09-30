'use strict';
/* YouTube Data API calls + cached sync. */

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
    const res = await ytFetch('videos', { part: 'contentDetails,snippet,liveStreamingDetails,statistics', id: ids.slice(i, i + 50).join(',') });
    for (const v of res.items) {
      const seconds = isoToSec(v.contentDetails.duration);
      if (!seconds) continue;                       // live / upcoming: no duration yet
      if(v.liveStreamingDetails) continue;
      out.push({
        id: 'yt_' + v.id,
        title: v.snippet.title,
        seconds,
        url: 'https://www.youtube.com/watch?v=' + v.id,
        date: v.snippet.publishedAt,
        views: +v.statistics?.viewCount || 0, likes: +v.statistics?.likeCount || 0, comments: +v.statistics?.commentCount || 0,
        thumb: v.snippet.thumbnails?.default?.url || '',
      });
    }
  }
  return out;
}

async function syncPerson(person, from) {
  const res = await ytFetch('channels', { part: 'contentDetails,statistics', ...parseChannelInput(person.channel) });
  if (!res.items?.length) throw new Error('channel not found');
  const st = res.items[0].statistics || {};
  S.chan = S.chan || {};
  S.chan[person.id] = { subs: st.hiddenSubscriberCount ? null : +st.subscriberCount, views: +st.viewCount, videos: +st.videoCount };
  const uploadsId = res.items[0].contentDetails.relatedPlaylists.uploads;
  return fetchVideos(await fetchUploadIds(uploadsId, from));
}

/* ---- cached sync: at most one round of API calls per CONFIG.cacheMs ---- */
const cacheFresh = from => S.ytFrom !== null && from >= S.ytFrom && Date.now() - S.ytAt < CONFIG.cacheMs;

let syncing = false;
async function syncAll() {
  const targets = S.people.filter(p => p.channel.trim());
  const from = Math.min(...IDS.map(ch).filter(c => c.status !== 'ended').map(c => c.s));
  if (!isFinite(from) || from > Date.now()) return;          // nothing running yet / everything ended
  if (!S.apiKey || !targets.length) {
    return showStatus('Open ⚙ Settings to add your YouTube API key and at least one channel.', 'info');
  }
  if (cacheFresh(from)) {                                    // no new request inside the 5-minute window
    const sec = Math.round((Date.now() - S.ytAt) / 1000);
    return showStatus(`Using cached data (synced ${sec < 60 ? sec + 's' : Math.round(sec / 60) + ' min'} ago). Refreshes after 5 minutes.`, 'info', 4000);
  }
  if (syncing) return;
  syncing = true;
  showStatus('Syncing YouTube…');
  if (S.ytFrom === null || from < S.ytFrom) S.yt = {};       // cache doesn't reach back far enough

  const results = await Promise.allSettled(targets.map(p => syncPerson(p, from)));
  const summary = [], errors = [];
  results.forEach((r, i) => {
    const p = targets[i];
    if (r.status === 'fulfilled') {
      S.yt[p.id] = r.value;
      summary.push(`${p.name}: ${r.value.length} video${r.value.length === 1 ? '' : 's'} (${mins(sumSeconds(r.value))} min)`);
    } else errors.push(`${p.name}: ${r.reason.message}`);
  });
  if (!errors.length) { S.ytFrom = from; S.ytAt = Date.now(); }   // only a fully successful sync starts the 5-min cache

  saveState();
  render();
  syncing = false;

  if (errors.length) showStatus(errors.join(' | '), 'err');
  else if (results.every(r => r.value.length === 0)) showStatus('Synced, but found 0 videos in the active window. Check channels in Settings.', 'err');
  else showStatus('Synced ✓ ' + summary.join(' · '), 'ok', 6000);
}
