const express = require('express');
const router = express.Router();
const { getMatch, saveMatch } = require('../db/queries');
const parseMatch = require('../utils/parseMatch');
const callApiFootball = require('../utils/apiFootball');

const MAJOR_LEAGUES = new Set([
  // top five football leagues plus major cup competitions
  1,   // World Cup
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  39,  // Premier League
  140, // La Liga
  135, // Serie A
  78,  // Bundesliga
  61,  // Ligue 1
]);

const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];

// GET /api/matches?date=YYYY-MM-DD  → matches on a given date (pass-through, no cache)
// modified to also return matches for a specific league and season
router.get('/', async (req, res) => {
  let { date, league, season, timezone } = req.query;

  try {
    let endpoint;

    if (league) {
      // league matches: API needs league + season
      if (!season) {
        // default to current season
        // API uses starting year as the season, which could be year before current year depending on time of check
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();   // 0-indexed: Jan=0, Aug=7
        season = month >= 7 ? year : year - 1;
      }
      endpoint = `/fixtures?league=${league}&season=${season}`;
    } else {
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }
      endpoint = `/fixtures?date=${date}`;
      if (timezone) {
        endpoint += `&timezone=${encodeURIComponent(timezone)}`;
      }
    }

    const data = await callApiFootball(endpoint);
    // filter matches by only the leagues we want
    const matches = data.response
    .map(parseMatch)
    .filter((m) => MAJOR_LEAGUES.has(m.league_id));

    return res.json(matches);

  } catch (err) {
    console.error('Error in GET /api/matches:', err);
    if (err.message.includes('plan')) {
      return res.status(503).json({
        // this catches free plan limitations for available matches
        error: 'Matches for this date are not available on the current plan.',
      });
    }
    return res.status(502).json({ error: 'Failed to fetch matches' });
  }
});

// GET /api/matches/:id
// Fetch a single match by ID, using cache or API-Football
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Check the cache (DB) first
    const cached = await getMatch(id);
    if (cached) {
      return res.json(cached);
    }

    // 2. Cache miss → fetch from API-Football
    const data = await callApiFootball(`/fixtures?id=${id}`);
    const fixture = data.response[0];

    // 3. No such match
    if (!fixture) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // 4. Parse the raw API response
    const match = parseMatch(fixture);

    // 5. Only cache FINISHED matches; live/upcoming will be API calls each time since their data will change
    if (FINISHED_STATUSES.includes(match.status_short)) {
      await saveMatch(match);
    }

    // 6. Return the match
    return res.json(match);

  } catch (err) {
    console.error('Error in GET /api/matches/:id:', err);
    return res.status(502).json({ error: 'Failed to fetch match data' });
  }
});

module.exports = router;