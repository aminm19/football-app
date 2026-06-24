import { useState, useEffect } from 'react';
import { getMatchesByDate } from '../api.js';
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // "America/Los_Angeles"
import { Button } from '@chakra-ui/react';
import { Container } from '@chakra-ui/react';
import MatchRow from '../components/MatchRow.jsx';
import { Stack, Box, Flex, Heading, Image } from '@chakra-ui/react';

function localToday() {
  const now = new Date(); // the browser's local time
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

function Home() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(localToday());

  function goToDay(delta) {
    setLoading(true);                    
    setError(null);                         
    setDate((d) => shiftDay(d, delta));     
  }


  useEffect(() => {
    getMatchesByDate(date, tz)
      .then((data) => setMatches(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  if (loading) return <p>Loading matches…</p>;
  if (error) return <p>Error: {error}</p>;
  if (matches.length === 0) return <p>No major matches on {date}.</p>;

  const grouped = matches.reduce((acc, m) => {
  (acc[m.league_id] ??= []).push(m);
  return acc;
}, {});

  return (
    <Container maxW="container.md" py={6}>
    <div>
      <h1>Matches</h1>
      <div>
        <Button onClick={() => goToDay(-1)}>← Yesterday</Button>
        <span>{date}</span>
        <Button onClick={() => goToDay(1)}>Tomorrow →</Button>
      </div>
            <Stack gap={4}>
  {Object.values(grouped).map((leagueMatches) => {
    const first = leagueMatches[0]; // any match carries the league info
    return (
      <Box
        key={first.league_id}
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        borderRadius="lg"
        overflow="hidden"
      >
        {/* league header */}
        <Flex align="center" gap={2} px={3} py={2} bg="whiteAlpha.50">
          {first.league_logo && (
            <Image
              src={first.league_logo}
              alt={first.league_name}
              boxSize="20px"
            />
          )}
          <Heading size="sm">{first.league_name}</Heading>
        </Flex>

        {/* matches, thin line between each */}
        <Stack gap={0}>
          {leagueMatches.map((m, i) => (
            <Box
              key={m.fixture_id}
              borderTopWidth={i === 0 ? '0' : '1px'}
              borderColor="whiteAlpha.200"
            >
              <MatchRow match={m} />
            </Box>
          ))}
        </Stack>
      </Box>
    );
  })}
</Stack>
        </div>
    </Container>
  );
}

export default Home;