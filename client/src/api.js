const BASE = import.meta.env.VITE_API_URL;

// shared fetch wrapper: builds the URL, checks the response, returns JSON
async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
}

// matches
export function getMatchesByDate(date) {
  // omit date → backend defaults to today
  return get(date ? `/api/matches?date=${date}` : '/api/matches');
}

export function getMatchesByLeague(league, season) {
  const seasonParam = season ? `&season=${season}` : '';
  return get(`/api/matches?league=${league}${seasonParam}`);
}

export function getMatch(id) {
  return get(`/api/matches/${id}`);
}

// standings (toggle-gated)
export function getStandings(league, season) {
  return get(`/api/standings?league=${league}&season=${season}`);
}

// team (toggle-gated)
export function getTeam(id, season) {
  const seasonParam = season ? `?season=${season}` : '';
  return get(`/api/teams/${id}${seasonParam}`);
}

// config — feature flags (e.g. standingsEnabled)
export function getConfig() {
  return get('/api/config');
}