import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { IoCalendarOutline } from 'react-icons/io5';
import { MdStadium } from 'react-icons/md';
import { GiWhistle } from 'react-icons/gi';
import { getMatch, getConfig, getMatchesByLeague, getLeagueTeamCodes } from '../api.js';
import {
  Box, Flex, Image, Text, Heading, Spinner, Stack, Tabs,
} from '@chakra-ui/react';
import StandingsTab from '../components/StandingsTab.jsx';
import EventsTimeline from '../components/EventsTimeline.jsx';
import LineupsPitch from '../components/LineupsPitch.jsx';
import Bracket from '../components/Bracket.jsx';
import TieDialog from '../components/TieDialog.jsx';
import { LiveClock } from '../components/LiveClock.jsx';
import { isRunning, isLive, livePollMs } from '../utils/liveClock.js';
import { buildKnockoutBracket, isKnockoutRound } from '../utils/bracket.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// whole calendar days from today to the match day (local midnight to local midnight),
// so "days away" doesn't flip based on the current time of day
function calendarDaysUntil(target) {
  const now = new Date();
  const match = new Date(target);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMatch = new Date(match.getFullYear(), match.getMonth(), match.getDate());
  return Math.round((startMatch - startToday) / DAY_MS);
}

// under 24h: live HH:MM:SS countdown; 24h+: clean "in N days" (calendar-based)
function Countdown({ target }) {
  const [remaining, setRemaining] = useState(() => new Date(target) - Date.now());
  useEffect(() => {
    const tick = () => setRemaining(new Date(target) - Date.now());
    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [target]);

  if (remaining <= 0) return null;

  if (remaining >= DAY_MS) {
    const days = calendarDaysUntil(target);
    return <Text fontSize="sm" color="text.secondary">in {days} {days === 1 ? 'day' : 'days'}</Text>;
  }

  const totalSec = Math.floor(remaining / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return <Text fontSize="sm" color="text.secondary" fontVariantNumeric="tabular-nums">{h}:{m}:{s}</Text>;
}

function MetaItem({ icon: Icon, children }) {
  return (
    <Flex align="center" gap={1.5} color="text.secondary">
      <Box fontSize="14px" display="flex"><Icon /></Box>
      <Text fontSize="xs">{children}</Text>
    </Flex>
  );
}

function Match() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [standingsEnabled, setStandingsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bracketMatches, setBracketMatches] = useState(null); // null = loading, [] = none
  const [teamCodes, setTeamCodes] = useState({});
  const [selectedTie, setSelectedTie] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getMatch(id), getConfig()])
      .then(([matchData, config]) => {
        setMatch(matchData);
        setStandingsEnabled(config.standingsEnabled);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // while the match is live, re-fetch so the clock corrects at HT/FT and the
  // score/events stay fresh. cadence tightens near each half's end (see livePollMs).
  useEffect(() => {
    if (!match) return;
    const ms = livePollMs(match);
    if (!ms) return;
    const timer = setTimeout(() => {
      getMatch(id).then(setMatch).catch(() => {});
    }, ms);
    return () => clearTimeout(timer);
  }, [match, id]);

  // for a knockout match, pull the competition's fixtures to build its bracket.
  // keyed on stable fields so the live poll's match updates don't re-fetch.
  useEffect(() => {
    if (!match || !isKnockoutRound(match.round)) { setBracketMatches(null); setTeamCodes({}); return; }
    Promise.all([
      getMatchesByLeague(match.league_id, match.season),
      getLeagueTeamCodes(match.league_id, match.season).catch(() => ({})),
    ])
      .then(([ms, codes]) => { setBracketMatches(ms); setTeamCodes(codes); })
      .catch(() => { setBracketMatches([]); setTeamCodes({}); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.league_id, match?.season, match?.round]);

  if (loading) return <Spinner />;
  if (error) return <Text color="status.negative">Error: {error}</Text>;
  if (!match) return <Text>Match not found.</Text>;

  const {
    status_short, home_team, away_team, home_logo, away_logo,
    home_goals, away_goals, match_date, league_name, league_logo, round,
    venue_name, venue_city, referee,
    events, lineups, players,
  } = match;

  const notStarted = status_short === 'NS';
  const isFinished = ['FT', 'AET', 'PEN'].includes(status_short);

  const centerText = notStarted
    ? new Date(match_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : `${home_goals ?? 0} – ${away_goals ?? 0}`;

  const subLabel = notStarted
    ? new Date(match_date).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : status_short;

  const isKnockout = isKnockoutRound(round);
  const bracket = bracketMatches?.length
    ? buildKnockoutBracket(bracketMatches, match.league_id)
    : null;

  // build the available tab list, in order — only tabs with data/permission appear.
  // a knockout match shows the Bracket; a group match shows the group Standings.
  const tabs = [];
  if (events?.length) tabs.push({ key: 'events', label: 'Events' });
  if (lineups?.length) tabs.push({ key: 'lineups', label: 'Lineups' });
  if (isKnockout) tabs.push({ key: 'bracket', label: 'Bracket' });
  else if (standingsEnabled) tabs.push({ key: 'standings', label: 'Standings' });

  return (
    <Box bg="bg.surface" borderWidth="1px" borderColor="border.subtle" borderRadius="xl" overflow="hidden">
      {/* competition strip — aurora-gradient banner, the redesign's signature flourish */}
      <Box
        px={4}
        py={4}
        css={{
          background: `
            radial-gradient(120% 220% at 8% 10%, rgba(56, 132, 255, 0.45), transparent 55%),
            radial-gradient(120% 220% at 50% -20%, rgba(16, 185, 129, 0.35), transparent 50%),
            radial-gradient(120% 220% at 92% 15%, rgba(232, 65, 66, 0.32), transparent 55%),
            linear-gradient(180deg, rgba(10, 10, 12, 0.05) 0%, var(--chakra-colors-surface) 100%)
          `,
        }}
      >
        <Flex align="center" justify="center" gap={2}>
          {league_logo && (
            <Image
              src={league_logo}
              alt={league_name}
              boxSize="18px"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.6))"
            />
          )}
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="text.primary"
            textShadow="0 1px 3px rgba(0,0,0,0.5)"
          >
            {league_name}{round ? ` · ${round}` : ''}
          </Text>
        </Flex>
      </Box>

      <Box borderTopWidth="1px" borderColor="border.subtle" />

      {/* meta row */}
      <Flex align="center" justify="center" gap={4} wrap="wrap" px={4} py={3}>
        <MetaItem icon={IoCalendarOutline}>
          {new Date(match_date).toLocaleString([], {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })}
        </MetaItem>
        {venue_name && (
          <MetaItem icon={MdStadium}>
            {venue_city ? `${venue_name}, ${venue_city}` : venue_name}
          </MetaItem>
        )}
        {referee && <MetaItem icon={GiWhistle}>{referee}</MetaItem>}
      </Flex>

      {/* score row */}
      <Flex align="center" px={6} py={6}>
        <Flex flex={1} justify="flex-end">
          <Flex
            align="center"
            gap={3}
            as={RouterLink}
            to={`/team/${match.home_team_id}?season=${match.season}`}
            className="group"
            cursor="pointer"
          >
            <Text
              fontSize="md"
              fontWeight="semibold"
              color="text.primary"
              textAlign="right"
              _groupHover={{ textDecoration: 'underline' }}
            >
              {home_team}
            </Text>
            <Image
              src={home_logo}
              alt={home_team}
              boxSize="48px"
              transition="filter 0.15s"
              _groupHover={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))' }}
            />
          </Flex>
        </Flex>
        <Stack align="center" minW="140px" px={6} gap={1}>
          <Heading
            size="4xl"
            fontWeight="extrabold"
            letterSpacing="tight"
            fontVariantNumeric="tabular-nums"
            color="text.primary"
          >
            {centerText}
          </Heading>
          {notStarted ? (
            <Countdown target={match_date} />
          ) : isRunning(status_short) ? (
            <LiveClock match={match} fontSize="sm" fontWeight="semibold" color="accent.green" />
          ) : (
            <Text fontSize="sm" color="text.secondary">{subLabel}</Text>
          )}
        </Stack>
        <Flex flex={1} justify="flex-start">
          <Flex
            align="center"
            gap={3}
            as={RouterLink}
            to={`/team/${match.away_team_id}?season=${match.season}`}
            className="group"
            cursor="pointer"
          >
            <Image
              src={away_logo}
              alt={away_team}
              boxSize="48px"
              transition="filter 0.15s"
              _groupHover={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))' }}
            />
            <Text
              fontSize="md"
              fontWeight="semibold"
              color="text.primary"
              _groupHover={{ textDecoration: 'underline' }}
            >
              {away_team}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {/* tabs — only render if at least one tab is available */}
      {tabs.length > 0 && (
        <>
          <Box borderTopWidth="1px" borderColor="border.subtle" />
          <Tabs.Root defaultValue={tabs[0].key} colorPalette="green">
            <Tabs.List px={4} css={{ '& [data-selected]': { '--indicator-color': 'transparent' } }}>
              {tabs.map((t) => (
                <Tabs.Trigger
                  key={t.key}
                  value={t.key}
                  color="text.secondary"
                  fontWeight="medium"
                  _selected={{ color: 'text.primary' }}
                >
                  {t.label}
                </Tabs.Trigger>
              ))}
              <Tabs.Indicator
                css={{
                  top: 'auto',
                  bottom: '0',
                  height: '3px',
                  borderRadius: '9999px',
                  background: 'var(--chakra-colors-accent-green)',
                  boxShadow: 'none',
                  zIndex: 1,
                }}
              />
            </Tabs.List>

            {tabs.some((t) => t.key === 'events') && (
              <Tabs.Content value="events">
                <EventsTimeline events={events} homeTeamId={match.home_team_id} finished={isFinished} />
              </Tabs.Content>
            )}

            {tabs.some((t) => t.key === 'lineups') && (
              <Tabs.Content value="lineups">
                <LineupsPitch
                  lineups={lineups}
                  players={players}
                  events={events}
                  homeTeamId={match.home_team_id}
                />
              </Tabs.Content>
            )}

            {tabs.some((t) => t.key === 'standings') && (
                <Tabs.Content value="standings">
                    <Box p={4}>
                    <StandingsTab
                      league={match.league_id}
                      season={match.season}
                      highlightTeamIds={[match.home_team_id, match.away_team_id]}
                      liveMatches={isLive(status_short) ? [match] : []}
                    />
                    </Box>
                </Tabs.Content>
                )}

            {tabs.some((t) => t.key === 'bracket') && (
              <Tabs.Content value="bracket">
                {bracketMatches === null ? (
                  <Flex justify="center" py={8}><Spinner /></Flex>
                ) : (
                  <Box px={2}>
                    <Bracket
                      bracket={bracket ?? { rounds: [] }}
                      highlightTeamIds={[match.home_team_id, match.away_team_id]}
                      teamCodes={teamCodes}
                      onTieClick={(tie) => setSelectedTie(tie)}
                    />
                  </Box>
                )}
              </Tabs.Content>
            )}
          </Tabs.Root>
        </>
      )}

      <TieDialog
        tie={selectedTie}
        open={selectedTie !== null}
        onClose={() => setSelectedTie(null)}
      />
    </Box>
  );
}

export default Match;