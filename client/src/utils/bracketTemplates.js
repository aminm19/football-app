// Hand-maintained knockout bracket orderings, used ONLY when the API can't tell us
// the tree yet — i.e. an in-progress tournament whose later rounds aren't drawn, so
// there's no advancement to trace. Each entry lists the first knockout round's ties in
// bracket order (left half top→bottom, then right half top→bottom), keyed by the sorted
// pair of team ids. Once real later-round results arrive, orderBracket derives the true
// tree from advancement and this is no longer consulted.
//
// Keyed by API-Football league id. Because the keys are team ids, a template only matches
// the specific season's draw it was built for; any other season falls through to the
// default ordering. Update these per tournament edition.
const BRACKET_TEMPLATES = {
  // 2026 World Cup — Round of 32 (official bracket order)
  1: [
    '25-2380',   // Germany / Paraguay
    '2-5',       // France / Sweden
    '1531-5529', // South Africa / Canada
    '31-1118',   // Netherlands / Morocco
    '3-27',      // Portugal / Croatia
    '9-775',     // Spain / Austria
    '1113-2384', // USA / Bosnia & Herzegovina
    '1-13',      // Belgium / Senegal
    '6-12',      // Brazil / Japan
    '1090-1501', // Ivory Coast / Norway
    '16-2382',   // Mexico / Ecuador
    '10-1508',   // England / Congo DR
    '26-1533',   // Argentina / Cape Verde Islands
    '20-32',     // Australia / Egypt
    '15-1532',   // Switzerland / Algeria
    '8-1504',    // Colombia / Ghana
  ],
};

function tieKey(tie) {
  if (!tie.teamA || !tie.teamB) return null;
  return [tie.teamA.id, tie.teamB.id].sort((a, b) => a - b).join('-');
}

// Reorder the first knockout round to its template order, when a template exists and the
// draw matches. No-op otherwise (no template, different season/competition, etc.). Apply
// before orderBracket so that, once real later rounds exist, advancement-based ordering wins.
export function applyBracketTemplate(bracket, leagueId) {
  const template = BRACKET_TEMPLATES[leagueId];
  if (!template || bracket.rounds.length === 0) return bracket;

  const firstRound = bracket.rounds[0];
  const byKey = new Map(firstRound.ties.map((t) => [tieKey(t), t]));

  const ordered = [];
  for (const key of template) {
    if (byKey.has(key)) ordered.push(byKey.get(key));
  }
  if (ordered.length !== firstRound.ties.length) return bracket; // draw doesn't match

  const rounds = [...bracket.rounds];
  rounds[0] = { ...firstRound, ties: ordered };
  return { rounds };
}
