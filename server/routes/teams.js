const express = require('express');
const router = express.Router();
const callApiFootball = require('../utils/apiFootball');
const parseTeam = require('../utils/parseTeam');
const parseMatch = require('../utils/parseMatch');
const { getTeam, saveTeam } = require('../db/queries');

const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];
const SEASON_TTL_MS = 1000 * 60 * 60; // 1 hour, for current-season fixtures

// same immutable/volatile logic as standings
function isStale(cachedAt, season) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth();
  const seasonHasEnded =
    season < currentYear - 1 ||
    (season === currentYear - 1 && month >= 7);
  if (seasonHasEnded) return false;
  return Date.now() - new Date(cachedAt).getTime() > SEASON_TTL_MS;
}

function defaultSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 7 ? year : year - 1;
}

router.get('/:id', async (req, res) => {
  if (process.env.STANDINGS_ENABLED !== 'true') {
    // free tier has no team data
    // using same toggle as standings
    return res.status(404).json({ error: 'Team data not available' });
  }

  const teamId = Number(req.params.id);
  const season = Number(req.query.season) || defaultSeason();

  if (!teamId) {
    return res.status(400).json({ error: 'Invalid team id' });
  }

  try {
    const cached = await getTeam(teamId, season);
    if (cached && !isStale(cached.cached_at, season)) {
      console.log('Using cached team');
      return res.json(cached.data);
    }

    // two upstream calls: static header + this season's fixtures
    const [teamData, fixturesData] = await Promise.all([
      callApiFootball(`/teams?id=${teamId}`),
      callApiFootball(`/fixtures?team=${teamId}&season=${season}`),
    ]);

    const teamBlock = teamData.response[0];
    if (!teamBlock) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = parseTeam(teamBlock);

    // parse + sort all fixtures chronologically, then split by status
    const allFixtures = fixturesData.response
      .map(parseMatch)
      .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

    const finished = allFixtures.filter((m) =>
      FINISHED_STATUSES.includes(m.status_short)
    );
    const upcoming = allFixtures.filter(
      (m) => !FINISHED_STATUSES.includes(m.status_short)
    );

    const result = {
      team,
      recent: finished.slice(-5).reverse(), // last 5 finished, newest first
      upcoming: upcoming.slice(0, 5),        // next 5
    };

    await saveTeam(teamId, season, result);
    res.json(result);
  } catch (err) {
    console.error('Error in GET /api/teams/:id:', err);
    res.status(502).json({ error: 'Failed to fetch team data' });
  }
});

module.exports = router;