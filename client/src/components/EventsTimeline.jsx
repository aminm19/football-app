import { Box, Flex, Text } from '@chakra-ui/react';
import { IoFootball } from 'react-icons/io5';
import { HiArrowUp, HiArrowDown } from 'react-icons/hi2';

function minute(time) {
  return time.extra ? `${time.elapsed}+${time.extra}'` : `${time.elapsed}'`;
}

// center: dark circular minute badge
function MinuteBadge({ time }) {
  return (
    <Flex
      boxSize="34px"
      borderRadius="full"
      bg="gray.900"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      align="center"
      justify="center"
      flexShrink={0}
      mx={3}
    >
      <Text fontSize="11px" fontWeight="bold" color="gray.300">
        {minute(time)}
      </Text>
    </Flex>
  );
}

// substitution swap arrows (green in / red out)
function SubIcon() {
  return (
    <Flex
      boxSize="24px"
      borderRadius="full"
      bg="whiteAlpha.200"
      align="center"
      justify="center"
      flexShrink={0}
    >
      <Box color="green.400" fontSize="11px" display="flex">
        <HiArrowUp />
      </Box>
      <Box color="red.400" fontSize="11px" display="flex">
        <HiArrowDown />
      </Box>
    </Flex>
  );
}

function GoalIcon() {
  return (
    <Flex
      boxSize="24px"
      borderRadius="full"
      bg="white"
      align="center"
      justify="center"
      flexShrink={0}
      color="black"
      fontSize="20px"
    >
      <IoFootball />
    </Flex>
  );
}

function CardIcon({ detail }) {
  const isRed = detail === 'Red Card' || detail === 'Second Yellow card';
  return (
    <Box w="11px" h="15px" bg={isRed ? 'red.500' : 'yellow.400'} borderRadius="2px" flexShrink={0} />
  );
}

function VarIcon() {
  return (
    <Box
      px={1}
      py="1px"
      borderRadius="sm"
      borderWidth="1px"
      borderColor="gray.500"
      fontSize="9px"
      fontWeight="bold"
      color="gray.400"
      flexShrink={0}
    >
      VAR
    </Box>
  );
}

function EventIcon({ event }) {
  if (event.type === 'Goal') {
    return event.detail === 'Goal cancelled' ? <VarIcon /> : <GoalIcon />;
  }
  if (event.type === 'subst') return <SubIcon />;
  if (event.type === 'Card') return <CardIcon detail={event.detail} />;
  if (event.type === 'Var') return <VarIcon />;
  return null;
}

function EventContent({ event, isHome, score }) {
  const align = isHome ? 'flex-end' : 'flex-start';

  if (event.type === 'Goal') {
    const cancelled = event.detail === 'Goal cancelled';
    return (
      <Flex direction="column" align={align} gap="1px">
        <Flex align="baseline" gap={1}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color={cancelled ? 'gray.500' : 'white'}
            textDecoration={cancelled ? 'line-through' : 'none'}
          >
            {event.player.name}
          </Text>
          {!cancelled && (
            <Text fontSize="sm" color="gray.400">({score.home} - {score.away})</Text>
          )}
        </Flex>
        {event.assist?.name && !cancelled && (
          <Text fontSize="xs" color="gray.500">assist by {event.assist.name}</Text>
        )}
      </Flex>
    );
  }

  if (event.type === 'subst') {
    // API-Football: player = coming on, assist = going off
    return (
      <Flex direction="column" align={align} gap="1px">
        <Text fontSize="sm" color="green.400">{event.player.name}</Text>
        {event.assist?.name && <Text fontSize="sm" color="red.400">{event.assist.name}</Text>}
      </Flex>
    );
  }

  if (event.type === 'Card') {
    return (
      <Flex direction="column" align={align} gap="1px">
        <Text fontSize="sm">{event.player.name}</Text>
        <Text fontSize="xs" color="gray.500">{event.detail}</Text>
      </Flex>
    );
  }

  if (event.type === 'Var') {
    return (
      <Flex direction="column" align={align} gap="1px">
        <Text fontSize="sm" color="gray.300">{event.player?.name || 'VAR'}</Text>
        <Text fontSize="xs" color="gray.500">{event.detail}</Text>
      </Flex>
    );
  }
  return null;
}

function Divider({ label, home, away }) {
  return (
    <Flex align="center" gap={3} py={3}>
      <Box flex={1} h="1px" bg="whiteAlpha.200" />
      <Text fontSize="xs" fontWeight="bold" color="gray.300" whiteSpace="nowrap">
        {label} {home} - {away}
      </Text>
      <Box flex={1} h="1px" bg="whiteAlpha.200" />
    </Flex>
  );
}

function EventsTimeline({ events, homeTeamId }) {
  if (!events?.length) return <Text color="gray.400" p={4}>No events.</Text>;

  // build the render list: running score + HT/FT dividers injected
  const items = [];
  let home = 0;
  let away = 0;
  let htDone = false;

  for (const event of events) {
    if (!htDone && event.time.elapsed > 45) {
      items.push({ kind: 'divider', label: 'HT', home, away });
      htDone = true;
    }
    if (event.type === 'Goal' && event.detail !== 'Goal cancelled') {
      if (event.team.id === homeTeamId) home++;
      else away++;
    }
    items.push({ kind: 'event', event, home, away });
  }
  items.push({ kind: 'divider', label: 'FT', home, away });

  return (
    <Box px={4} py={2}>
      {items.map((item, i) => {
        if (item.kind === 'divider') {
          return <Divider key={`d-${i}`} label={item.label} home={item.home} away={item.away} />;
        }

        const { event } = item;
        const isHome = event.team.id === homeTeamId;
        const isGoal = event.type === 'Goal' && event.detail !== 'Goal cancelled';
        const score = { home: item.home, away: item.away };

        return (
          <Flex
            key={i}
            align="center"
            py={isGoal ? 3 : 2}
            borderRadius="md"
            bg={isGoal ? 'whiteAlpha.50' : 'transparent'}
          >
            {/* home side */}
            <Flex flex={1} justify="flex-end" align="center" gap={2}>
              {isHome && (
                <>
                  <EventContent event={event} isHome score={score} />
                  <EventIcon event={event} />
                </>
              )}
            </Flex>

            <MinuteBadge time={event.time} />

            {/* away side */}
            <Flex flex={1} justify="flex-start" align="center" gap={2}>
              {!isHome && (
                <>
                  <EventIcon event={event} />
                  <EventContent event={event} isHome={false} score={score} />
                </>
              )}
            </Flex>
          </Flex>
        );
      })}
    </Box>
  );
}

export default EventsTimeline;
