import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { getTeam, getConfig, getStandings } from '../api.js';
import { Box, Flex, Image, Text, Heading, Spinner, Stack, Badge, Tabs } from '@chakra-ui/react';
import MatchRow from '../components/MatchRow.jsx';
import StandingsTable from '../components/StandingsTable.jsx';

function getPrimaryLeagueId(matches) {
  const counts = {};
  matches.forEach((m) => { counts[m.league_id] = (counts[m.league_id] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? Number(top[0]) : null;
}

function getResult(match, teamId) {
  const isHome = match.home_team_id === teamId;
  const scored = isHome ? match.home_goals : match.away_goals;
  const conceded = isHome ? match.away_goals : match.home_goals;
  if (scored > conceded) return 'W';
  if (scored < conceded) return 'L';
  return 'D';
}

function Team() {
  const { id } = useParams();
  const teamId = Number(id);
  const [searchParams] = useSearchParams();
  const season = searchParams.get('season');

  const [data, setData] = useState(null);
  const [standings, setStandings] = useState(null);
  const [standingsEnabled, setStandingsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setStandings(null);
    getConfig()
      .then((config) => {
        setStandingsEnabled(config.standingsEnabled);
        if (!config.standingsEnabled) return;
        return getTeam(id, season).then((teamData) => {
          setData(teamData);
          const leagueId = getPrimaryLeagueId([...teamData.recent, ...teamData.upcoming]);
          const resolvedSeason = season || teamData.recent[0]?.season || teamData.upcoming[0]?.season;
          if (leagueId && resolvedSeason) {
            return getStandings(leagueId, resolvedSeason).then(setStandings).catch(() => {});
          }
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, season]);

  if (loading) return <Spinner />;
  if (!standingsEnabled) return <Text color="gray.400">Team pages are not available on the free tier.</Text>;
  if (error) return <Text color="red.400">Error: {error}</Text>;
  if (!data) return <Text>Team not found.</Text>;

  const { team, recent, upcoming } = data;
  const nextMatch = upcoming[0] ?? null;
  const formMatches = [...recent].reverse(); // oldest → newest, left to right

  return (
    <Stack gap={4}>
      {/* header */}
      <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="xl" p={6}>
        <Flex align="center" gap={5}>
          {team.logo && <Image src={team.logo} alt={team.name} boxSize="80px" />}
          <Stack gap={1}>
            <Heading size="xl">{team.name}</Heading>
            <Text color="gray.400">
              {team.country}{team.founded ? ` · Est. ${team.founded}` : ''}
            </Text>
            {team.venue?.name && (
              <Text fontSize="sm" color="gray.400">
                {team.venue.name}, {team.venue.city}
                {team.venue.capacity ? ` · ${team.venue.capacity.toLocaleString()} cap.` : ''}
              </Text>
            )}
          </Stack>
        </Flex>
      </Box>

      {/* tabs */}
      <Tabs.Root defaultValue="overview" colorPalette="green">
        <Tabs.List css={{ '& [data-selected]': { '--indicator-color': 'transparent' } }}>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="tables">Tables</Tabs.Trigger>
          <Tabs.Trigger value="fixtures">Fixtures</Tabs.Trigger>
          <Tabs.Indicator
            css={{
              top: 'auto',
              bottom: '0',
              height: '3px',
              borderRadius: '9999px',
              background: 'var(--chakra-colors-green-400)',
              boxShadow: 'none',
              zIndex: 1,
            }}
          />
        </Tabs.List>

        {/* overview */}
        <Tabs.Content value="overview">
          <Stack gap={4} pt={4}>

            {/* team form + next/last match — side by side */}
            <Flex gap={4} align="stretch">
              {/* team form */}
              {formMatches.length > 0 && (
                <Box flex={1} bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="xl" p={4}>
                  <Text fontWeight="semibold" mb={4}>Team form</Text>
                  <Flex gap={4}>
                    {formMatches.map((m) => {
                      const result = getResult(m, teamId);
                      const isHome = m.home_team_id === teamId;
                      const opp = isHome
                        ? { name: m.away_team, logo: m.away_logo }
                        : { name: m.home_team, logo: m.home_logo };
                      const color = result === 'W' ? 'green' : result === 'L' ? 'red' : 'gray';
                      const score = `${m.home_goals ?? 0}–${m.away_goals ?? 0}`;
                      return (
                        <Flex
                          key={m.fixture_id}
                          as={RouterLink}
                          to={`/match/${m.fixture_id}`}
                          direction="column"
                          align="center"
                          gap={2}
                          p={2}
                          borderRadius="md"
                          _hover={{ bg: 'whiteAlpha.100' }}
                        >
                          <Badge colorPalette={color} fontSize="sm" px={2} py={1} borderRadius="md">
                            {score}
                          </Badge>
                          <Image src={opp.logo} alt={opp.name} boxSize="32px" />
                        </Flex>
                      );
                    })}
                  </Flex>
                </Box>
              )}

              {/* next match / last match fallback */}
              {(nextMatch || recent[0]) && (() => {
                const m = nextMatch ?? recent[0];
                const label = nextMatch ? 'Next match' : 'Last match';
                const notStarted = m.status_short === 'NS';
                const centerText = notStarted
                  ? new Date(m.match_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  : `${m.home_goals ?? 0} – ${m.away_goals ?? 0}`;
                const subText = notStarted
                  ? new Date(m.match_date).toLocaleDateString([], { month: 'short', day: 'numeric' })
                  : m.status_short;
                return (
                  <Box
                    flex={1}
                    as={RouterLink}
                    to={`/match/${m.fixture_id}`}
                    bg="gray.800"
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                    borderRadius="xl"
                    overflow="hidden"
                    _hover={{ bg: 'gray.700' }}
                  >
                    <Flex align="center" justify="space-between" px={3} py={2} bg="whiteAlpha.50">
                      <Text fontWeight="semibold" fontSize="sm">{label}</Text>
                      <Text fontSize="xs" color="gray.400">{m.league_name}</Text>
                    </Flex>
                    <Flex align="center" px={4} py={4}>
                      <Flex flex={1} direction="column" align="center" gap={2}>
                        <Image src={m.home_logo} alt={m.home_team} boxSize="48px" />
                        <Text fontSize="sm" fontWeight="medium" textAlign="center">{m.home_team}</Text>
                      </Flex>
                      <Stack align="center" gap={0} minW="80px">
                        <Text fontSize="xl" fontWeight="bold">{centerText}</Text>
                        <Text fontSize="xs" color="gray.400">{subText}</Text>
                      </Stack>
                      <Flex flex={1} direction="column" align="center" gap={2}>
                        <Image src={m.away_logo} alt={m.away_team} boxSize="48px" />
                        <Text fontSize="sm" fontWeight="medium" textAlign="center">{m.away_team}</Text>
                      </Flex>
                    </Flex>
                  </Box>
                );
              })()}
            </Flex>

            {/* standings */}
            {standings && (
              <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="xl" overflow="hidden" p={4}>
                <StandingsTable standings={standings} />
              </Box>
            )}
          </Stack>
        </Tabs.Content>

        {/* tables */}
        <Tabs.Content value="tables">
          {standings ? (
            <Box pt={4}>
              <StandingsTable standings={standings} />
            </Box>
          ) : (
            <Text pt={4} color="gray.400">Standings unavailable.</Text>
          )}
        </Tabs.Content>

        {/* fixtures */}
        <Tabs.Content value="fixtures">
          <Stack gap={4} pt={4}>
            {recent.length > 0 && (
              <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="xl" overflow="hidden">
                <Flex align="center" px={3} py={2} bg="whiteAlpha.50">
                  <Heading size="sm">Recent</Heading>
                </Flex>
                <Stack gap={0}>
                  {recent.map((m, i) => (
                    <Box key={m.fixture_id} borderTopWidth={i === 0 ? '0' : '1px'} borderColor="whiteAlpha.200">
                      <MatchRow match={m} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
            {upcoming.length > 0 && (
              <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="xl" overflow="hidden">
                <Flex align="center" px={3} py={2} bg="whiteAlpha.50">
                  <Heading size="sm">Upcoming</Heading>
                </Flex>
                <Stack gap={0}>
                  {upcoming.map((m, i) => (
                    <Box key={m.fixture_id} borderTopWidth={i === 0 ? '0' : '1px'} borderColor="whiteAlpha.200">
                      <MatchRow match={m} />
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}

export default Team;
