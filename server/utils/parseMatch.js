function parseMatch(fixture) {
  return {
    // set to match db column names
    fixture_id:   fixture.fixture.id,
    match_date:   fixture.fixture.date,
    status_short: fixture.fixture.status.short,
    // authoritative live match minute, plus stoppage time held in a separate field
    // (e.g. during first-half stoppage: elapsed=45, extra=3 → "45+3")
    elapsed:      fixture.fixture.status?.elapsed ?? null,
    extra:        fixture.fixture.status?.extra ?? null,

    league_id:    fixture.league.id,
    league_name:  fixture.league.name,
    league_logo:  fixture.league.logo,
    season:       fixture.league.season,
    round:        fixture.league.round,

    venue_name:   fixture.fixture.venue?.name ?? null,
    venue_city:   fixture.fixture.venue?.city ?? null,
    referee:      fixture.fixture.referee ?? null,

    home_team_id: fixture.teams.home.id,
    home_team:    fixture.teams.home.name,
    home_logo:    fixture.teams.home.logo,
    away_team_id: fixture.teams.away.id,
    away_team:    fixture.teams.away.name,
    away_logo:    fixture.teams.away.logo,

    home_goals:   fixture.goals.home,
    away_goals:   fixture.goals.away,
    // matches that dont go to penalties may not have this data
    penalty_home: fixture.score?.penalty?.home ?? null,
    penalty_away: fixture.score?.penalty?.away ?? null,

    events:       fixture.events,
    lineups:      fixture.lineups,
    statistics:   fixture.statistics,
    players:      fixture.players,
  };
}

module.exports = parseMatch;