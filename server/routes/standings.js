const express = require('express');
const router = express.Router();
const callApiFootball = require('../utils/apiFootball');
const parseStandings = require('../utils/parseStandings');
const { getStandings, saveStandings } = require('../db/queries');

// if data in database was updated more than 1 hour ago, it's stale for current seasons
const SEASON_TTL_MS = 1000 * 60 * 60; // 1 hour, for current-season tables

// knockout rounds don't count toward a group/league table — exclude them from form
const KNOCKOUT_ROUNDS = new Set([
  'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final',
]);
const FINISHED = ['FT', 'AET', 'PEN'];

// The API's standings `form` is the team's current rolling form, which leaks
// matches from later stages (e.g. a knockout game after the group stage). Recompute
// each team's form from finished, non-knockout fixtures so it reflects this stage only.
function computeForms(fixtures) {
  const byTeam = new Map(); // teamId -> [{ date, result }]
  for (const f of fixtures) {
    if (KNOCKOUT_ROUNDS.has(f.league.round)) continue;
    if (!FINISHED.includes(f.fixture.status.short)) continue;

    const hg = f.goals.home;
    const ag = f.goals.away;
    const home = f.teams.home.id;
    const away = f.teams.away.id;
    const homeResult = hg > ag ? 'W' : hg < ag ? 'L' : 'D';
    const awayResult = hg > ag ? 'L' : hg < ag ? 'W' : 'D';

    if (!byTeam.has(home)) byTeam.set(home, []);
    if (!byTeam.has(away)) byTeam.set(away, []);
    byTeam.get(home).push({ date: f.fixture.date, result: homeResult });
    byTeam.get(away).push({ date: f.fixture.date, result: awayResult });
  }

  const forms = {};
  for (const [teamId, results] of byTeam) {
    results.sort((a, b) => new Date(a.date) - new Date(b.date));
    forms[teamId] = results.slice(-5).map((r) => r.result).join(''); // last 5, oldest→newest
  }
  return forms;
}

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

    // override the API's rolling form with stage-only (non-knockout) form
    try {
      const fixturesData = await callApiFootball(
        `/fixtures?league=${league}&season=${season}`
      );
      const forms = computeForms(fixturesData.response || []);
      parsed.groups.forEach((g) =>
        g.rows.forEach((row) => {
          if (forms[row.teamId] != null) row.form = forms[row.teamId];
        })
      );
    } catch (formErr) {
      console.error('Could not recompute standings form:', formErr.message);
      // fall back to the API's form (better than failing the whole request)
    }

    await saveStandings(league, season, parsed);
    res.json(parsed);
  } catch (err) {
    console.error('Error in GET /api/standings:', err);
    res.status(502).json({ error: 'Failed to fetch standings' });
  }
});

module.exports = router;