const pool = require('./pool');

async function getMatch(fixtureID){
    const result = await pool.query(
        //use a parameterized query to prevent SQL injection
        'SELECT * FROM matches WHERE fixture_id = $1',
        // array of values to be substituted for the placeholders in the query
        // here we only have one value being inserted for $1
        [fixtureID]
    );
    // each match id is unique, so should return one match or undefined if match not in db
    return result.rows[0];
}

async function saveMatch(m){
    await pool.query(
        `INSERT INTO matches (
            fixture_id, match_date, status_short,
            league_id, league_name, league_logo, season, round,
            home_team_id, home_team, home_logo,
            away_team_id, away_team, away_logo,
            home_goals, away_goals, penalty_home, penalty_away,
            summary,
            events, lineups, statistics, players,
            venue_name, venue_city, referee
        )
        VALUES (
            $1, $2, $3,
            $4, $5, $6, $7, $8,
            $9, $10, $11,
            $12, $13, $14,
            $15, $16, $17, $18,
            $19,
            $20, $21, $22, $23,
            $24, $25, $26
        )
        ON CONFLICT (fixture_id) DO UPDATE SET
            status_short = EXCLUDED.status_short,
            home_goals   = EXCLUDED.home_goals,
            away_goals   = EXCLUDED.away_goals,
            penalty_home = EXCLUDED.penalty_home,
            penalty_away = EXCLUDED.penalty_away,
            summary      = EXCLUDED.summary,
            events       = EXCLUDED.events,
            lineups      = EXCLUDED.lineups,
            statistics   = EXCLUDED.statistics,
            players      = EXCLUDED.players,
            venue_name   = EXCLUDED.venue_name,
            venue_city   = EXCLUDED.venue_city,
            referee      = EXCLUDED.referee`,
        [
            m.fixture_id, m.match_date, m.status_short,
            m.league_id, m.league_name,  m.league_logo, m.season, m.round,
            m.home_team_id, m.home_team, m.home_logo,
            m.away_team_id, m.away_team, m.away_logo,
            m.home_goals, m.away_goals, m.penalty_home, m.penalty_away,
            m.summary,
            JSON.stringify(m.events),
            JSON.stringify(m.lineups),
            JSON.stringify(m.statistics),
            JSON.stringify(m.players),
            m.venue_name, m.venue_city, m.referee,
        ]
    );
}

async function getStandings(leagueId, season) {
  const result = await pool.query(
    'SELECT data, cached_at FROM standings WHERE league_id = $1 AND season = $2',
    [leagueId, season]
  );
  return result.rows[0]; // { data, cached_at } or undefined
}

async function saveStandings(leagueId, season, data) {
  await pool.query(
    `INSERT INTO standings (league_id, season, data, cached_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (league_id, season)
     DO UPDATE SET data = $3, cached_at = NOW()`,
    [leagueId, season, JSON.stringify(data)]
  );
}

async function getTeam(teamId, season) {
  const result = await pool.query(
    'SELECT data, cached_at FROM teams WHERE team_id = $1 AND season = $2',
    [teamId, season]
  );
  return result.rows[0];
}

async function saveTeam(teamId, season, data) {
  await pool.query(
    `INSERT INTO teams (team_id, season, data, cached_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (team_id, season)
     DO UPDATE SET data = $3, cached_at = NOW()`,
    [teamId, season, JSON.stringify(data)]
  );
}

module.exports = { getMatch, saveMatch, getStandings, saveStandings, getTeam, saveTeam };