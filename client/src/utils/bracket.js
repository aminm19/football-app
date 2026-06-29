// Knockout rounds in bracket order, earliest to final.
// We only build the bracket from these — group stage and qualifying are excluded.
const KNOCKOUT_ORDER = [
  'Round of 32',
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  'Final',
];

const FINISHED = ['FT', 'AET', 'PEN'];

// is this round a knockout round (any competition, R32/R16 start both handled)?
export function isKnockoutRound(round) {
  return KNOCKOUT_ORDER.includes(round);
}

// Build a bracket structure from a flat list of competition matches.
// Returns { rounds: [{ name, ties: [...] }] } in bracket order.
export function buildBracket(matches) {
  // 1. Keep only knockout-round matches, bucket them by round name.
  const byRound = new Map();
  for (const m of matches) {
    if (!KNOCKOUT_ORDER.includes(m.round)) continue;
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round).push(m);
  }

  // 2. For each knockout round that exists, pair the legs into ties.
  //    Build in KNOCKOUT_ORDER so rounds come out earliest → final.
  const rounds = [];
  for (const roundName of KNOCKOUT_ORDER) {
    const roundMatches = byRound.get(roundName);
    if (!roundMatches || roundMatches.length === 0) continue;

    const isFinal = roundName === 'Final';
    const ties = isFinal
      ? roundMatches.map((m) => singleLegTie(m))
      : pairIntoTies(roundMatches);

    rounds.push({ name: roundName, ties });
  }

  // 3. Derive winners using "who appears in the next round".
  //    A tie's winner is whichever of its two teams shows up in the next round.
  for (let i = 0; i < rounds.length; i++) {
    const nextRound = rounds[i + 1];
    const nextRoundTeamIds = nextRound
      ? new Set(
          nextRound.ties.flatMap((t) => [t.teamA?.id, t.teamB?.id].filter(Boolean))
        )
      : null;

    for (const tie of rounds[i].ties) {
      tie.winnerId = resolveWinner(tie, nextRoundTeamIds);
    }
  }

  return { rounds };
}

// Reorder each round's ties so that the two ties feeding a given next-round
// tie are adjacent and vertically consistent. Works backward from the final.
export function orderBracket(bracket) {
  const { rounds } = bracket;
  if (rounds.length === 0) return bracket;

  // Helper: in a given round, find the tie that `teamId` won (i.e. is the
  // winner of). Returns the tie or undefined.
  function tieWonBy(round, teamId) {
    return round.ties.find((t) => t.winnerId === teamId);
  }

  // Start from the last round (Final) as the fixed anchor — its order is
  // whatever it is (usually one tie). Then walk backward: for each round,
  // produce a new tie order dictated by the NEXT round's already-fixed order.
  const orderedRounds = [...rounds]; // we'll replace .ties arrays as we go

  for (let i = rounds.length - 2; i >= 0; i--) {
    const round = orderedRounds[i];
    const nextRound = orderedRounds[i + 1];

    const newOrder = [];
    // For each next-round tie, in its current (fixed) order, find the two
    // previous-round ties that produced its teamA and teamB.
    for (const nextTie of nextRound.ties) {
      const feederA = tieWonBy(round, nextTie.teamA.id);
      const feederB = tieWonBy(round, nextTie.teamB.id);
      if (feederA) newOrder.push(feederA);
      if (feederB) newOrder.push(feederB);
    }

    // Safety: include any ties we somehow didn't place (shouldn't happen in a
    // clean bracket, but guards against missing/odd data) so none are dropped.
    for (const t of round.ties) {
      if (!newOrder.includes(t)) newOrder.push(t);
    }

    orderedRounds[i] = { ...round, ties: newOrder };
  }

  return { rounds: orderedRounds };
}

function placeholderTie() {
  return { teamA: null, teamB: null, aggA: null, aggB: null, legs: [], winnerId: null, placeholder: true };
}

// Pad an in-progress bracket with blank future rounds down to the final, so the
// tree always renders in full — e.g. a World Cup still in the Round of 32 shows
// R16/QF/SF/Final as TBD placeholders rather than a lone column.
export function padBracket(bracket) {
  if (bracket.rounds.length === 0) return bracket;
  const rounds = [...bracket.rounds];
  let idx = KNOCKOUT_ORDER.indexOf(rounds[rounds.length - 1].name);
  let count = rounds[rounds.length - 1].ties.length;
  while (count > 1 && idx >= 0 && idx < KNOCKOUT_ORDER.length - 1) {
    idx += 1;
    count = Math.ceil(count / 2);
    rounds.push({ name: KNOCKOUT_ORDER[idx], ties: Array.from({ length: count }, placeholderTie) });
  }
  return { rounds };
}

// Pair a round's fixtures into ties. Two legs share the same two team ids
// (regardless of which side was home). Key by the sorted id pair.
function pairIntoTies(roundMatches) {
  const tieMap = new Map();
  for (const m of roundMatches) {
    const key = [m.home_team_id, m.away_team_id].sort((a, b) => a - b).join('-');
    if (!tieMap.has(key)) tieMap.set(key, []);
    tieMap.get(key).push(m);
  }

  const ties = [];
  for (const legs of tieMap.values()) {
    // sort legs chronologically (first leg, second leg)
    legs.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
    ties.push(makeTie(legs));
  }
  return ties;
}

// Build a tie from one or two legs. Aggregate is summed across legs,
// attributed to each TEAM (not home/away, since sides flip between legs).
function makeTie(legs) {
  // establish the two teams from the first leg
  const first = legs[0];
  const teamA = { id: first.home_team_id, name: first.home_team, logo: first.home_logo };
  const teamB = { id: first.away_team_id, name: first.away_team, logo: first.away_logo };

  let aggA = 0;
  let aggB = 0;
  for (const leg of legs) {
    // figure out which side teamA was on in THIS leg, add goals accordingly
    if (leg.home_team_id === teamA.id) {
      aggA += leg.home_goals ?? 0;
      aggB += leg.away_goals ?? 0;
    } else {
      aggA += leg.away_goals ?? 0;
      aggB += leg.home_goals ?? 0;
    }
  }

  // a tie with no goals recorded yet hasn't kicked off — show blank, not "0 - 0"
  const played = legs.some((l) => l.home_goals != null || l.away_goals != null);

  return { teamA, teamB, aggA: played ? aggA : null, aggB: played ? aggB : null, legs, winnerId: null };
}

// The Final is a single match, but we wrap it in the same tie shape.
function singleLegTie(m) {
  return makeTie([m]);
}

// Decide the winner. Prefer "who advanced to the next round" (rule-free,
// bug-free for completed ties). Fall back to aggregate if no next round
// (e.g. the Final, or an unresolved in-progress tie).
function resolveWinner(tie, nextRoundTeamIds) {
  // If we have a next round, the team that appears there won.
  if (nextRoundTeamIds) {
    if (nextRoundTeamIds.has(tie.teamA.id)) return tie.teamA.id;
    if (nextRoundTeamIds.has(tie.teamB.id)) return tie.teamB.id;
  }

  // No next round (Final) or couldn't resolve: use aggregate.
  // Only declare a winner if the tie is actually decided.
  const decided = tie.legs.every((l) => FINISHED.includes(l.status_short));
  if (!decided) return null;

  if (tie.aggA > tie.aggB) return tie.teamA.id;
  if (tie.aggB > tie.aggA) return tie.teamB.id;

  // Level aggregate → check penalties on the last leg (shootout decider).
  const last = tie.legs[tie.legs.length - 1];
  if (last.penalty_home != null && last.penalty_away != null) {
    // penalties are recorded per home/away of that leg; map to teamA/teamB
    const aIsHome = last.home_team_id === tie.teamA.id;
    const penA = aIsHome ? last.penalty_home : last.penalty_away;
    const penB = aIsHome ? last.penalty_away : last.penalty_home;
    if (penA > penB) return tie.teamA.id;
    if (penB > penA) return tie.teamB.id;
  }

  return null; // genuinely undecided
}