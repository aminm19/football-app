import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container, Flex, Box, Stack, Heading, Image, Text, Spinner, IconButton,
} from '@chakra-ui/react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';
import { getMatchesByDate, getConfig } from '../api.js';
import MatchRow from '../components/MatchRow.jsx';

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // "America/Los_Angeles"

// major competitions for the sidebar (logo URLs are free, don't count against quota)
const TOP_LEAGUES = [
  { id: 1, name: 'World Cup' },
  { id: 2, name: 'Champions League' },
  { id: 3, name: 'Europa League' },
  { id: 39, name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 78, name: 'Bundesliga' },
  { id: 61, name: 'Ligue 1' },
];

const leagueLogo = (id) => `https://media.api-sports.io/football/leagues/${id}.png`;

function localToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDay(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dayLabel(dateStr) {
  const today = localToday();
  if (dateStr === today) return 'Today';
  if (dateStr === shiftDay(today, -1)) return 'Yesterday';
  if (dateStr === shiftDay(today, 1)) return 'Tomorrow';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString([], {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function TopLeaguesSidebar() {
  return (
    <Box
      w="320px"
      flexShrink={0}
      bg="gray.800"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="xl"
      overflow="hidden"
      display={{ base: 'none', md: 'block' }}
    >
      <Heading size="md" px={5} pt={5} pb={3}>Top leagues</Heading>
      <Stack gap={0} pb={2}>
        {TOP_LEAGUES.map((league) => (
          <Flex
            key={league.id}
            as={RouterLink}
            to={`/league/${league.id}`}
            align="center"
            gap={3.5}
            px={5}
            py={3}
            cursor="pointer"
            transition="background 0.15s"
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            <Image src={leagueLogo(league.id)} alt={league.name} boxSize="28px" objectFit="contain" />
            <Text fontSize="md" fontWeight="medium" color="gray.100">{league.name}</Text>
          </Flex>
        ))}
      </Stack>
    </Box>
  );
}

function MatchList({ loading, error, matches, date }) {
  if (loading) {
    return (
      <Flex justify="center" py={10}>
        <Spinner />
      </Flex>
    );
  }
  if (error) {
    return <Text color="gray.400" py={6} textAlign="center">{error}</Text>;
  }
  if (matches.length === 0) {
    return <Text color="gray.400" py={6} textAlign="center">No major matches {dayLabel(date).toLowerCase()}.</Text>;
  }

  const grouped = matches.reduce((acc, m) => {
    (acc[m.league_id] ??= []).push(m);
    return acc;
  }, {});

  return (
    <Stack gap={3}>
      {Object.values(grouped).map((leagueMatches) => {
        const first = leagueMatches[0];
        return (
          <Box
            key={first.league_id}
            bg="gray.800"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="xl"
            overflow="hidden"
          >
            <Flex
              as={RouterLink}
              to={`/league/${first.league_id}`}
              align="center"
              gap={3}
              px={4}
              py={3.5}
              bg="whiteAlpha.50"
              transition="background 0.15s"
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              {first.league_logo && (
                <Image src={first.league_logo} alt={first.league_name} boxSize="26px" objectFit="contain" />
              )}
              <Text fontSize="md" fontWeight="semibold">{first.league_name}</Text>
            </Flex>
            <Box borderTopWidth="1px" borderColor="whiteAlpha.200" />
            <Stack gap={0} py={1}>
              {leagueMatches.map((m, i) => (
                <Box
                  key={m.fixture_id}
                  borderTopWidth={i === 0 ? '0' : '1px'}
                  borderColor="whiteAlpha.100"
                >
                  <MatchRow match={m} />
                </Box>
              ))}
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

function Home() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(localToday());
  const [standingsEnabled, setStandingsEnabled] = useState(false);

  useEffect(() => {
    getConfig()
      .then((c) => setStandingsEnabled(c.standingsEnabled))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMatchesByDate(date, tz)
      .then((data) => setMatches(data))
      .catch((err) => {
        setError(err.message);
        setMatches([]);
      })
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <Container maxW="6xl" py={8}>
      <Flex gap={6} align="flex-start">
        {standingsEnabled && <TopLeaguesSidebar />}

        <Box flex={1} minW={0}>
          {/* date nav */}
          <Flex
            align="center"
            justify="space-between"
            bg="gray.800"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="xl"
            px={3}
            py={2}
            mb={3}
          >
            <IconButton
              aria-label="Previous day"
              variant="ghost"
              onClick={() => setDate((d) => shiftDay(d, -1))}
            >
              <HiChevronLeft />
            </IconButton>
            <Text fontSize="lg" fontWeight="semibold">{dayLabel(date)}</Text>
            <IconButton
              aria-label="Next day"
              variant="ghost"
              onClick={() => setDate((d) => shiftDay(d, 1))}
            >
              <HiChevronRight />
            </IconButton>
          </Flex>

          <MatchList loading={loading} error={error} matches={matches} date={date} />
        </Box>
      </Flex>
    </Container>
  );
}

export default Home;
