import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box, Stack, Heading, Text, Spinner, Button,
  Flex, Image, IconButton, NativeSelect, Tabs,
} from '@chakra-ui/react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { getMatchesByLeague, getLeague, getStandings, getConfig, getLeagueTeamCodes } from '../api.js';
import { isLive } from '../utils/liveClock.js';
import MatchRow from '../components/MatchRow.jsx';
import Bracket from '../components/Bracket.jsx';
import TieDialog from '../components/TieDialog.jsx';
import StandingsTable from '../components/StandingsTable.jsx';
import { buildKnockoutBracket } from '../utils/bracket.js';

const FINISHED = ['FT', 'AET', 'PEN'];

const INDICATOR_CSS = {
  top: 'auto', bottom: '0', height: '3px', borderRadius: '9999px',
  background: 'var(--chakra-colors-accent-green)', boxShadow: 'none', zIndex: 1,
};

// same aurora-gradient recipe as Match.jsx's competition strip, reused here
// for the League header card for visual consistency between the two.
const GRADIENT_BANNER_CSS = {
  background: `
    radial-gradient(120% 220% at 8% 10%, rgba(56, 132, 255, 0.45), transparent 55%),
    radial-gradient(120% 220% at 50% -20%, rgba(16, 185, 129, 0.35), transparent 50%),
    radial-gradient(120% 220% at 92% 15%, rgba(232, 65, 66, 0.32), transparent 55%),
    linear-gradient(180deg, rgba(10, 10, 12, 0.05) 0%, var(--chakra-colors-surface) 100%)
  `,
};

function dateKey(match) {
  return new Date(match.match_date).toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function groupByDate(matches) {
  const map = new Map();
  for (const m of matches) {
    if (!map.has(dateKey(m))) map.set(dateKey(m), []);
    map.get(dateKey(m)).push(m);
  }
  return [...map.entries()];
}

// group matches by their standings group (e.g. World Cup Group A/B/C)
function groupByGroup(matches, teamToGroup) {
  const map = new Map();
  for (const m of matches) {
    const g = teamToGroup[m.home_team_id] ?? teamToGroup[m.away_team_id] ?? 'Other';
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(m);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
}

// the most relevant round: first round with an unfinished match, else the last round
function featuredRound(sortedMatches) {
  const byRound = new Map();
  for (const m of sortedMatches) {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round).push(m);
  }
  const entries = [...byRound.entries()];
  const upcoming = entries.find(([, ms]) => ms.some((m) => !FINISHED.includes(m.status_short)));
  return upcoming ?? entries[entries.length - 1] ?? [null, []];
}

function PillToggle({ active, onClick, children }) {
  return (
    <Button
      size="sm"
      borderRadius="full"
      px={4}
      fontWeight="medium"
      bg={active ? 'white' : 'transparent'}
      color={active ? 'bg.canvas' : 'text.secondary'}
      _hover={{ bg: active ? 'white' : 'bg.raised' }}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

// inset rows with thin separators that span the row width (stop short of the box edge)
function MatchList({ matches }) {
  return (
    <Stack gap={0} px={3} py={1}>
      {matches.map((m, i) => (
        <Box key={m.fixture_id} borderTopWidth={i === 0 ? '0' : '1px'} borderColor="border.muted">
          <MatchRow match={m} />
        </Box>
      ))}
    </Stack>
  );
}

function MatchSection({ label, matches }) {
  return (
    <Box>
      <Box px={4} py={2} bg="bg.raised">
        <Text fontSize="sm" fontWeight="medium" color="text.primary">{label}</Text>
      </Box>
      <MatchList matches={matches} />
    </Box>
  );
}

function League() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSeason = searchParams.get('season');

  const [matches, setMatches] = useState([]);
  const [league, setLeague] = useState(null);
  const [standings, setStandings] = useState(null);
  const [standingsEnabled, setStandingsEnabled] = useState(false);
  const [seasonInUse, setSeasonInUse] = useState(null);
  const [teamCodes, setTeamCodes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState('overview');
  const [mode, setMode] = useState('date');   // date | round (fixtures tab)
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedTie, setSelectedTie] = useState(null);

  // league metadata (header + season dropdown) + config
  useEffect(() => {
    getLeague(id).then(setLeague).catch(() => setLeague(null));
    getConfig().then((c) => setStandingsEnabled(c.standingsEnabled)).catch(() => {});
  }, [id]);

  // matches — season defaults server-side when not in the URL
  useEffect(() => {
    setLoading(true);
    setError(null);
    setActiveIndex(null);
    getMatchesByLeague(id, urlSeason)
      .then((data) => {
        setMatches(data);
        setSeasonInUse(urlSeason ? Number(urlSeason) : data[0]?.season ?? null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, urlSeason]);

  // standings for the season in use
  useEffect(() => {
    if (!standingsEnabled || !seasonInUse) { setStandings(null); return; }
    getStandings(id, seasonInUse).then(setStandings).catch(() => setStandings(null));
  }, [id, seasonInUse, standingsEnabled]);

  // 3-letter team codes for compact bracket labels
  useEffect(() => {
    if (!seasonInUse) { setTeamCodes({}); return; }
    getLeagueTeamCodes(id, seasonInUse).then(setTeamCodes).catch(() => setTeamCodes({}));
  }, [id, seasonInUse]);

  if (loading) return <Flex justify="center" py={10}><Spinner /></Flex>;
  if (error) return <Text color="status.negative">Error: {error}</Text>;

  const name = league?.name ?? matches[0]?.league_name ?? 'Competition';
  const logo = league?.logo ?? matches[0]?.league_logo;
  const country = league?.country;

  const sorted = [...matches].sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
  const liveMatches = matches.filter((m) => isLive(m.status_short));
  const bracket = buildKnockoutBracket(matches, Number(id));
  const hasBracket = bracket.rounds.length > 0;
  const [featuredLabel, featuredMatches] = featuredRound(sorted);

  // tournaments with multiple standings groups (e.g. World Cup): map team -> group
  // so the overview fixtures can be split by Group A/B/C on group-stage rounds
  const teamToGroup = {};
  if (standings?.groups?.length > 1) {
    for (const g of standings.groups) {
      for (const row of g.rows) teamToGroup[row.teamId] = g.name;
    }
  }
  const groupableOverview = standings?.groups?.length > 1 && /group/i.test(featuredLabel ?? '');

  // fixtures tab: group by mode, with a pager
  const groupMap = new Map();
  for (const m of sorted) {
    const key = mode === 'round'
      ? m.round
      : new Date(m.match_date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(m);
  }
  const slices = [...groupMap.entries()];
  const allFinished = matches.length > 0 && matches.every((m) => FINISHED.includes(m.status_short));
  const defaultIndex = allFinished ? slices.length - 1 : 0;
  const currentIndex = activeIndex === null
    ? defaultIndex
    : Math.min(Math.max(activeIndex, 0), Math.max(slices.length - 1, 0));
  const sliceMatches = slices[currentIndex]?.[1] ?? [];

  return (
    <Stack gap={4}>
      {/* header card */}
      <Box bg="bg.surface" borderWidth="1px" borderColor="border.subtle" borderRadius="xl" shadow="card" overflow="hidden">
        {/* aurora-gradient banner — same recipe as Match.jsx's competition strip */}
        <Box px={5} py={5} css={GRADIENT_BANNER_CSS}>
          <Flex align="center" justify="space-between" gap={4} wrap="wrap">
            <Flex align="center" gap={4}>
              {logo && (
                <Image
                  src={logo}
                  alt={name}
                  boxSize="52px"
                  objectFit="contain"
                  filter="drop-shadow(0 1px 3px rgba(0,0,0,0.6))"
                />
              )}
              <Stack gap={0}>
                <Heading size="lg" color="text.primary" textShadow="0 1px 3px rgba(0,0,0,0.5)">
                  {name}
                </Heading>
                {country && (
                  <Text fontSize="sm" color="text.secondary" textShadow="0 1px 3px rgba(0,0,0,0.5)">
                    {country}
                  </Text>
                )}
              </Stack>
            </Flex>

            {league?.seasons?.length > 0 && (
              <NativeSelect.Root
                size="sm"
                w="auto"
                bg="whiteAlpha.200"
                borderWidth="1px"
                borderColor="whiteAlpha.300"
                borderRadius="full"
              >
                <NativeSelect.Field
                  value={seasonInUse ?? ''}
                  onChange={(e) => setSearchParams({ season: e.target.value })}
                  fontWeight="semibold"
                  color="text.primary"
                  ps={4}
                >
                  {league.seasons.map((s) => (
                    <option key={s.year} value={s.year}>{s.label}</option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator color="text.primary" />
              </NativeSelect.Root>
            )}
          </Flex>
        </Box>

        {/* tabs */}
        <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)} colorPalette="green">
          <Tabs.List px={5} css={{ '& [data-selected]': { '--indicator-color': 'transparent' } }}>
            <Tabs.Trigger value="overview" color="text.secondary" fontWeight="medium" _selected={{ color: 'text.primary' }}>
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger value="table" color="text.secondary" fontWeight="medium" _selected={{ color: 'text.primary' }}>
              Table
            </Tabs.Trigger>
            {hasBracket && (
              <Tabs.Trigger value="knockout" color="text.secondary" fontWeight="medium" _selected={{ color: 'text.primary' }}>
                Knockout
              </Tabs.Trigger>
            )}
            <Tabs.Trigger value="fixtures" color="text.secondary" fontWeight="medium" _selected={{ color: 'text.primary' }}>
              Fixtures
            </Tabs.Trigger>
            <Tabs.Indicator css={INDICATOR_CSS} />
          </Tabs.List>
        </Tabs.Root>
      </Box>

      {/* overview: standings + featured round */}
      {tab === 'overview' && (
        <Flex gap={4} align="flex-start" wrap="wrap">
          {standings && (
            <Box flex="1.6" minW="320px">
              <StandingsTable standings={standings} liveMatches={liveMatches} />
            </Box>
          )}
          <Box flex="1" minW="300px">
            <Box bg="bg.surface" borderWidth="1px" borderColor="border.subtle" borderRadius="lg" shadow="card" overflow="hidden">
              {featuredLabel && (
                <Flex align="center" px={4} py={3} bg="bg.raised">
                  <Text fontWeight="semibold" fontSize="sm" color="text.primary">{featuredLabel}</Text>
                </Flex>
              )}
              {featuredMatches.length === 0 ? (
                <Text color="text.secondary" px={4} py={3}>No fixtures.</Text>
              ) : groupableOverview ? (
                groupByGroup(featuredMatches, teamToGroup).map(([gName, gMatches]) => (
                  <MatchSection key={gName} label={gName} matches={gMatches} />
                ))
              ) : (
                <MatchList matches={featuredMatches} />
              )}
            </Box>
          </Box>
        </Flex>
      )}

      {/* table */}
      {tab === 'table' && (
        standings
          ? <StandingsTable standings={standings} liveMatches={liveMatches} />
          : <Text color="text.secondary">Standings unavailable for this competition.</Text>
      )}

      {/* knockout */}
      {tab === 'knockout' && hasBracket && (
        <Bracket bracket={bracket} teamCodes={teamCodes} onTieClick={(tie) => setSelectedTie(tie)} />
      )}

      {/* fixtures */}
      {tab === 'fixtures' && (
        <Box bg="bg.surface" borderWidth="1px" borderColor="border.subtle" borderRadius="xl" shadow="card" overflow="hidden">
          {/* grouping toggle — segmented pill control */}
          <Flex gap={1} bg="bg.canvas" borderRadius="full" p={1} w="fit-content" mx={4} mt={4} mb={3}>
            <PillToggle active={mode === 'date'} onClick={() => { setMode('date'); setActiveIndex(null); }}>
              By date
            </PillToggle>
            <PillToggle active={mode === 'round'} onClick={() => { setMode('round'); setActiveIndex(null); }}>
              By round
            </PillToggle>
          </Flex>

          {/* pager — pill bar, consistent with Home's date-nav */}
          <Flex
            align="center"
            justify="space-between"
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="full"
            px={2}
            py={1}
            mx={4}
            mb={4}
          >
            <IconButton aria-label="Previous" size="sm" variant="ghost" borderRadius="full"
              _hover={{ bg: 'bg.raised' }}
              disabled={currentIndex === 0}
              onClick={() => setActiveIndex(currentIndex - 1)}>
              <HiChevronLeft />
            </IconButton>
            <NativeSelect.Root size="sm" w="auto">
              <NativeSelect.Field
                value={currentIndex}
                onChange={(e) => setActiveIndex(Number(e.target.value))}
                textAlign="center"
                fontWeight="semibold"
                color="text.primary"
                bg="transparent"
                borderWidth="0"
              >
                {slices.map(([sliceLabel], i) => (
                  <option key={sliceLabel} value={i}>{sliceLabel}</option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator color="text.secondary" />
            </NativeSelect.Root>
            <IconButton aria-label="Next" size="sm" variant="ghost" borderRadius="full"
              _hover={{ bg: 'bg.raised' }}
              disabled={currentIndex >= slices.length - 1}
              onClick={() => setActiveIndex(currentIndex + 1)}>
              <HiChevronRight />
            </IconButton>
          </Flex>

          <Box borderTopWidth="1px" borderColor="border.subtle" />

          {/* matches — both modes show dated headers (with year) */}
          {sliceMatches.length === 0 ? (
            <Text color="text.secondary" px={4} py={3}>No matches found.</Text>
          ) : (
            groupByDate(sliceMatches).map(([dLabel, dMatches]) => (
              <MatchSection key={dLabel} label={dLabel} matches={dMatches} />
            ))
          )}
        </Box>
      )}

      <TieDialog tie={selectedTie} open={selectedTie !== null} onClose={() => setSelectedTie(null)} />
    </Stack>
  );
}

export default League;
