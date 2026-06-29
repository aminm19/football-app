const express = require('express');
const router = express.Router();
const callApiFootball = require('../utils/apiFootball');

// league metadata changes rarely — cache in-process to avoid repeat API calls
const cache = new Map(); // leagueId -> { data, cachedAt }
const teamCodeCache = new Map(); // `${leagueId}-${season}` -> { data, cachedAt }
const TTL_MS = 1000 * 60 * 60 * 24; // 24h

// label a season from its start/end years: same year -> "2026" (World Cup),
// spanning two years -> "2025/2026" (domestic leagues, European cups)
function seasonLabel(s) {
  const startYear = s.start ? new Date(s.start).getFullYear() : s.year;
  const endYear = s.end ? new Date(s.end).getFullYear() : s.year;
  return startYear === endYear ? `${startYear}` : `${startYear}/${endYear}`;
}

// teamId -> 3-letter code map for a competition+season (one upstream call for all)
router.get('/:id/teams', async (req, res) => {
  const id = Number(req.params.id);
  const season = Number(req.query.season);
  if (!id || !season) {
    return res.status(400).json({ error: 'league id and season are required' });
  }

  const key = `${id}-${season}`;
  const cached = teamCodeCache.get(key);
  if (cached && Date.now() - cached.cachedAt < TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const apiData = await callApiFootball(`/teams?league=${id}&season=${season}`);
    const codes = {};
    (apiData.response || []).forEach((t) => {
      if (t.team?.code) codes[t.team.id] = t.team.code;
    });
    teamCodeCache.set(key, { data: codes, cachedAt: Date.now() });
    res.json(codes);
  } catch (err) {
    console.error('Error in GET /api/leagues/:id/teams:', err);
    res.status(502).json({ error: 'Failed to fetch team codes' });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid league id' });

  const cached = cache.get(id);
  if (cached && Date.now() - cached.cachedAt < TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const apiData = await callApiFootball(`/leagues?id=${id}`);
    const block = apiData.response?.[0];
    if (!block) return res.status(404).json({ error: 'League not found' });

    const seasons = (block.seasons || [])
      .map((s) => ({ year: s.year, label: seasonLabel(s), current: !!s.current }))
      .sort((a, b) => b.year - a.year);

    const result = {
      id: block.league.id,
      name: block.league.name,
      type: block.league.type, // "League" | "Cup"
      logo: block.league.logo,
      country: block.country?.name ?? null,
      seasons,
      currentSeason: seasons.find((s) => s.current)?.year ?? seasons[0]?.year ?? null,
    };

    cache.set(id, { data: result, cachedAt: Date.now() });
    res.json(result);
  } catch (err) {
    console.error('Error in GET /api/leagues/:id:', err);
    res.status(502).json({ error: 'Failed to fetch league' });
  }
});

module.exports = router;
