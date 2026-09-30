'use strict';
/* Challenge definitions + defaults. Edit dates, goals and the hard-coded 100-minute results here. */

const CONFIG = {
  storageKey: 'content_race_v4',
  colors: ['#f43f5e', '#38bdf8', '#a3e635'],
  ytApi: 'https://www.googleapis.com/youtube/v3',
  cacheMs: 5 * 60 * 1000,                        // YouTube data is reused for 5 minutes
  tz: '+05:30',                                  // dates below are IST (India)
  challenges: {
    m500: { type: 'minutes', label: '500 Minutes', icon: '⏱', page: 'pages/500-minutes.html' },
    v30:  { type: 'videos',  label: '30 Videos',   icon: '🎬', page: 'pages/30-videos.html' },
    m100: {
      type: 'minutes', label: '100 Minutes', icon: '🏛', page: 'pages/100-minutes.html',
      goal: 100, start: '2026-09-12',
      end: '2026-10-03',                         // auto-stops at 23:59:59 IST on this day
      // HARD-CODED final leaderboard (shown once the challenge has ended, never fetched).
      // The order here is the ranking. Fill in the real numbers.
      archive: [
        { name: 'Arnav',  url: 'https://www.youtube.com/@HumanOS-s8h',  videos: 0, minutes: 0 },
        { name: 'Yuvraj', url: 'https://www.youtube.com/@Yuvraj19119',  videos: 0, minutes: 0 },
        { name: 'Ayaan',  url: 'https://www.youtube.com/@Triqutra9',    videos: 0, minutes: 0 },
      ],
    },
  },
  defaults: {
    apiKey: 'AIzaSyAL814gQzmSGRIc4vhBT3cUl0a9sj6qTp4',
    cfg: {                                       // editable in ⚙ Settings
      m500: { goal: 500, start: '2026-09-12' },  // same start as the 100-min race, so its videos carry over
      v30:  { goal: 30,  start: '2026-09-12' },
    },
    people: [
      { id: 'p1', name: 'Arnav',  channel: 'HumanOS-s8h' },
      { id: 'p2', name: 'Yuvraj', channel: 'Yuvraj19119' },
      { id: 'p3', name: 'Ayaan',  channel: 'Triqutra9' },
    ],
  },
};
const IDS = ['m500', 'v30', 'm100'];
