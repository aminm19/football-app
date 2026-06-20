function parseStandings(leagueBlock) {
  const tables = leagueBlock.standings; // array of arrays (one per group)

  const groups = tables.map((table) => ({
    name: table[0]?.group ?? leagueBlock.name,
    rows: table.map((row) => ({
      rank: row.rank,
      teamId: row.team.id,
      team: row.team.name,
      logo: row.team.logo,
      played: row.all.played,
      win: row.all.win,
      draw: row.all.draw,
      lose: row.all.lose,
      goalsFor: row.all.goals.for,
      goalsAgainst: row.all.goals.against,
      goalsDiff: row.goalsDiff,
      points: row.points,
      form: row.form,
      description: row.description,
    })),
  }));

  return {
    league: {
      id: leagueBlock.id,
      name: leagueBlock.name,
      logo: leagueBlock.logo,
      season: leagueBlock.season,
    },
    groups,
  };
}

module.exports = parseStandings;