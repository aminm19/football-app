import { Link as RouterLink } from 'react-router-dom';
import { Flex, Image, Text, Box } from '@chakra-ui/react';
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
  // "live" here covers non-ticking in-progress states too (HT, break, penalties) —
  // anything that isn't finished and hasn't started yet.
  const isLiveState = !isFinished && !notStarted;

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
      _hover={{ bg: 'bg.raised' }}
      borderRadius="md"
    >
      {/* home team */}
      <Flex align="center" gap={3} flex={1} minW={0}>
        <Image src={home_logo} alt={home_team} boxSize="28px" objectFit="contain" flexShrink={0} />
        <Text fontSize="md" color="text.primary" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
          {home_team}
        </Text>
      </Flex>

      {/* center: score/time, with a muted status caption underneath so the
          row reads home | center | away without a trailing element throwing
          off the left/right symmetry */}
      <Flex direction="column" align="center" justify="center" gap="2px" minW="72px" minH="36px" flexShrink={0}>
        <Box fontWeight="bold" fontSize="lg" color="text.primary" lineHeight="1.1">
          {center}
        </Box>
        {isRunning(status_short) ? (
          <LiveMinute match={match} fontSize="2xs" px={1.5} py={0} />
        ) : (
          !notStarted && (
            <Text
              fontSize="2xs"
              fontWeight="medium"
              letterSpacing="wide"
              textTransform="uppercase"
              lineHeight="1.1"
              color={isLiveState ? 'accent.green' : 'text.secondary'}
            >
              {status_short}
            </Text>
          )
        )}
      </Flex>

      {/* away team */}
      <Flex align="center" gap={3} flex={1} minW={0} justify="flex-end">
        <Text fontSize="md" color="text.primary" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" textAlign="right">
          {away_team}
        </Text>
        <Image src={away_logo} alt={away_team} boxSize="28px" objectFit="contain" flexShrink={0} />
      </Flex>
    </Flex>
  );
}

export default MatchRow;