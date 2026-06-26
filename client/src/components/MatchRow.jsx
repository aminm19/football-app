import { Link as RouterLink } from 'react-router-dom';
import { Flex, Image, Text, Badge, Box } from '@chakra-ui/react';
import { isRunning } from '../utils/liveClock.js';
import { LiveMinute } from './LiveClock.jsx';

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
      py={3}
      px={4}
      _hover={{ bg: 'whiteAlpha.100' }}
      borderRadius="md"
    >
      {/* home team */}
      <Flex align="center" gap={3} flex={1} minW={0}>
        <Image src={home_logo} alt={home_team} boxSize="28px" objectFit="contain" flexShrink={0} />
        <Text fontSize="md" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          {home_team}
        </Text>
      </Flex>

      {/* center: score or kickoff time */}
      <Box minW="72px" textAlign="center" fontWeight="bold" fontSize="lg" flexShrink={0}>
        {center}
      </Box>

      {/* away team */}
      <Flex align="center" gap={3} flex={1} minW={0} justify="flex-end">
        <Text fontSize="md" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" textAlign="right">
          {away_team}
        </Text>
        <Image src={away_logo} alt={away_team} boxSize="28px" objectFit="contain" flexShrink={0} />
      </Flex>

      {/* status — live matches show the ticking minute */}
      {isRunning(status_short) ? (
        <LiveMinute match={match} ml={4} />
      ) : (
        <Badge
          ml={4}
          colorPalette={isFinished ? 'gray' : notStarted ? 'blue' : 'green'}
        >
          {status_short}
        </Badge>
      )}
    </Flex>
  );
}

export default MatchRow;