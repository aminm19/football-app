const express = require('express');
const router = express.Router();
const callApiFootball = require('../utils/apiFootball');
const parseStandings = require('../utils/parseStandings');
const { getStandings, saveStandings } = require('../db/queries');

// if data in database was updated more than 1 hour ago, it's stale for current seasons
const SEASON_TTL_MS = 1000 * 60 * 60; // 1 hour, for current-season tables

function isStale(cachedAt, season) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: 0 = Jan, 6 = July

  // A season labeled Y runs into ~May of Y+1. It's definitely over once we're
  // past that following summer. Treat it as finished (immutable) only then.
  const seasonHasEnded =
    season < currentYear - 1 ||
    (season === currentYear - 1 && month >= 7); // Aug of Y+1 onward

  if (seasonHasEnded) return false; // immutable, never stale
  return Date.now() - new Date(cachedAt).getTime() > SEASON_TTL_MS;
}

router.get('/', async (req, res) => {
  if (process.env.STANDINGS_ENABLED !== 'true') {
    // this check is for when we are on the free tier of the API
    // standings information will not be available
    return res.status(404).json({ error: 'Standings not available' });
  }

  const league = Number(req.query.league);
  const season = Number(req.query.season);

  if (!league || !season) {
    return res
      .status(400)
      .json({ error: 'league and season query params are required' });
  }

  try {
    const cached = await getStandings(league, season);
    if (cached && !isStale(cached.cached_at, season)) {
      console.log('Using cached standings');
      return res.json(cached.data);
    }

    const data = await callApiFootball(
      `/standings?league=${league}&season=${season}`
    );
    const leagueBlock = data.response[0]?.league;
    if (!leagueBlock) {
      return res.status(404).json({ error: 'No standings found' });
    }

    const parsed = parseStandings(leagueBlock);
    await saveStandings(league, season, parsed);
    res.json(parsed);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch standings' });
  }
});

module.exports = router;