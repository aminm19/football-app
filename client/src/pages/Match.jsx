import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getMatch, getConfig } from '../api.js';
import {
  Box, Flex, Image, Text, Heading, Spinner, Stack, Tabs,
} from '@chakra-ui/react';
import StandingsTab from '../components/StandingsTab.jsx';

function Match() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [standingsEnabled, setStandingsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <Spinner />;
  if (error) return <Text color="red.400">Error: {error}</Text>;
  if (!match) return <Text>Match not found.</Text>;

  const {
    status_short, home_team, away_team, home_logo, away_logo,
    home_goals, away_goals, match_date, league_name, league_logo, round,
    events, lineups,
  } = match;

  const notStarted = status_short === 'NS';

  const centerText = notStarted
    ? new Date(match_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : `${home_goals ?? 0} – ${away_goals ?? 0}`;

  const subLabel = notStarted
    ? new Date(match_date).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : status_short;

  // build the available tab list, in order — only tabs with data/permission appear
  const tabs = [];
  if (events?.length) tabs.push({ key: 'events', label: 'Events' });
  if (lineups?.length) tabs.push({ key: 'lineups', label: 'Lineups' });
  if (standingsEnabled) tabs.push({ key: 'standings', label: 'Standings' });

  return (
    <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="xl" overflow="hidden">
      {/* competition strip */}
      <Flex align="center" justify="center" gap={2} px={4} py={3}>
        {league_logo && <Image src={league_logo} alt={league_name} boxSize="18px" />}
        <Text fontSize="sm" fontWeight="medium">
          {league_name}{round ? ` · ${round}` : ''}
        </Text>
      </Flex>

      <Box borderTopWidth="1px" borderColor="whiteAlpha.200" />

      {/* meta row */}
      <Flex align="center" justify="center" py={2}>
        <Text fontSize="xs" color="gray.400">
          {new Date(match_date).toLocaleString([], {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })}
        </Text>
      </Flex>

      {/* score row */}
      <Flex align="center" px={6} py={6}>
        <Flex flex={1} align="center" justify="flex-end" gap={3}>
          <Text fontSize="lg" fontWeight="semibold" textAlign="right">{home_team}</Text>
          <Image src={home_logo} alt={home_team} boxSize="48px" />
        </Flex>
        <Stack align="center" minW="90px" gap={0}>
          <Heading size="xl">{centerText}</Heading>
          <Text fontSize="sm" color="gray.400">{subLabel}</Text>
        </Stack>
        <Flex flex={1} align="center" justify="flex-start" gap={3}>
          <Image src={away_logo} alt={away_team} boxSize="48px" />
          <Text fontSize="lg" fontWeight="semibold">{away_team}</Text>
        </Flex>
      </Flex>

      {/* tabs — only render if at least one tab is available */}
      {tabs.length > 0 && (
        <>
          <Box borderTopWidth="1px" borderColor="whiteAlpha.200" />
          <Tabs.Root defaultValue={tabs[0].key}>
            <Tabs.List px={4}>
              {tabs.map((t) => (
                <Tabs.Trigger key={t.key} value={t.key}>
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            {tabs.some((t) => t.key === 'events') && (
              <Tabs.Content value="events">
                <Box p={4}>
                  <Text color="gray.400">Events panel — coming next.</Text>
                </Box>
              </Tabs.Content>
            )}

            {tabs.some((t) => t.key === 'lineups') && (
              <Tabs.Content value="lineups">
                <Box p={4}>
                  <Text color="gray.400">Lineups panel — coming next.</Text>
                </Box>
              </Tabs.Content>
            )}

            {tabs.some((t) => t.key === 'standings') && (
                <Tabs.Content value="standings">
                    <Box p={4}>
                    <StandingsTab league={match.league_id} season={match.season} />
                    </Box>
                </Tabs.Content>
                )}
          </Tabs.Root>
        </>
      )}
    </Box>
  );
}

export default Match;