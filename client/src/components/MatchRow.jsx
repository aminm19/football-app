import { Link as RouterLink } from 'react-router-dom';
import { Flex, Image, Text, Badge, Box } from '@chakra-ui/react';

const FINISHED = ['FT', 'AET', 'PEN'];

function MatchRow({ match }) {
  const {
    fixture_id,
    status_short,
    home_team,
    away_team,
    home_logo,
    away_logo,
    home_goals,
    away_goals,
    match_date,
  } = match;

  const isFinished = FINISHED.includes(status_short);
  const notStarted = status_short === 'NS';

  // center column: score if played/live, kickoff time if not started
  const center = notStarted
    ? new Date(match_date).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : `${home_goals ?? 0} – ${away_goals ?? 0}`;

  return (
    <Flex
      as={RouterLink}
      to={`/match/${fixture_id}`}
      align="center"
      justify="space-between"
      py={2}
      px={3}
      _hover={{ bg: 'whiteAlpha.100' }}
      borderRadius="md"
    >
      {/* home team */}
      <Flex align="center" gap={2} flex={1}>
        <Image src={home_logo} alt={home_team} boxSize="20px" />
        <Text>{home_team}</Text>
      </Flex>

      {/* center: score or kickoff time */}
      <Box minW="60px" textAlign="center" fontWeight="bold">
        {center}
      </Box>

      {/* away team */}
      <Flex align="center" gap={2} flex={1} justify="flex-end">
        <Text>{away_team}</Text>
        <Image src={away_logo} alt={away_team} boxSize="20px" />
      </Flex>

      {/* status */}
      <Badge
        ml={3}
        colorPalette={isFinished ? 'gray' : notStarted ? 'blue' : 'green'}
      >
        {status_short}
      </Badge>
    </Flex>
  );
}

export default MatchRow;