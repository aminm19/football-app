const BASE = import.meta.env.VITE_API_URL;

// shared fetch wrapper: builds the URL, checks the response, returns JSON
async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    // try to read the backend's { error: "..." } message; fall back to status
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body && body.error) message = body.error;
    } catch {
      // response had no JSON body — keep the status-based message
    }
    throw new Error(message);
  }
  return res.json();
}

// matches
export function getMatchesByDate(date, timezone) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (timezone) params.set('timezone', timezone);
  const qs = params.toString();
  return get(`/api/matches${qs ? `?${qs}` : ''}`);
}

export function getMatchesByLeague(league, season) {
  const seasonParam = season ? `&season=${season}` : '';
  return get(`/api/matches?league=${league}${seasonParam}`);
}

export function getMatch(id) {
  return get(`/api/matches/${id}`);
}

// league metadata (name, country, logo, available seasons)
export function getLeague(id) {
  return get(`/api/leagues/${id}`);
}

// { teamId: 3-letter code } for a competition+season (for compact bracket labels)
export function getLeagueTeamCodes(id, season) {
  return get(`/api/leagues/${id}/teams?season=${season}`);
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