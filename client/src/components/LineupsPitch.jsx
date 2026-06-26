import { Box, Flex, Text, Stack, Image } from '@chakra-ui/react';
import { HiArrowDown, HiArrowUp } from 'react-icons/hi2';

const FALLBACK_KIT = { primary: '1f2937', number: 'ffffff', border: '4b5563' };

function kit(teamColors, isGK) {
  const c = teamColors?.[isGK ? 'goalkeeper' : 'player'];
  return c || FALLBACK_KIT;
}

function eventMinute(time) {
  return time.extra ? `${time.elapsed}+${time.extra}'` : `${time.elapsed}'`;
}

function ratingColor(rating) {
  const n = parseFloat(rating);
  if (n >= 7.0) return 'green.500';
  if (n >= 6.0) return 'orange.400';
  return 'red.500';
}

// group startXI into formation rows. prefer API grid ("row:col"); fall back to position lines.
function groupByRow(startXI) {
  const hasGrid = startXI.some((i) => i.player.grid);

  if (hasGrid) {
    const rows = {};
    for (const { player } of startXI) {
      if (!player.grid) continue;
      const [row, col] = player.grid.split(':').map(Number);
      (rows[row] ??= []).push({ ...player, col });
    }
    return Object.entries(rows)
      .map(([row, players]) => ({
        row: Number(row),
        players: players.sort((a, b) => a.col - b.col),
      }))
      .sort((a, b) => a.row - b.row);
  }

  const order = ['G', 'D', 'M', 'F'];
  const groups = {};
  startXI.forEach(({ player }) => (groups[player.pos] ??= []).push({ ...player, col: 0 }));
  return order
    .filter((pos) => groups[pos])
    .map((pos, idx) => ({ row: idx + 1, players: groups[pos] }));
}

function RatingBadge({ rating }) {
  return (
    <Box
      position="absolute"
      top="-6px"
      right="-8px"
      bg={ratingColor(rating)}
      borderRadius="md"
      px="4px"
      minW="24px"
      textAlign="center"
    >
      <Text fontSize="10px" fontWeight="bold" color="white">{rating}</Text>
    </Box>
  );
}

function SubOffBadge({ minute }) {
  return (
    <Flex
      position="absolute"
      top="-6px"
      left="-12px"
      align="center"
      gap="1px"
      bg="red.500"
      borderRadius="full"
      px="3px"
      h="16px"
    >
      <Box fontSize="9px" color="white" display="flex"><HiArrowDown /></Box>
      <Text fontSize="9px" fontWeight="bold" color="white">{minute}</Text>
    </Flex>
  );
}

function SubOnBadge({ minute }) {
  return (
    <Flex align="center" gap="1px" bg="green.500" borderRadius="full" px="3px" h="15px" flexShrink={0}>
      <Box fontSize="8px" color="white" display="flex"><HiArrowUp /></Box>
      <Text fontSize="9px" fontWeight="bold" color="white">{minute}</Text>
    </Flex>
  );
}

function CaptainBadge() {
  return (
    <Flex
      boxSize="15px"
      borderRadius="full"
      bg="white"
      align="center"
      justify="center"
      flexShrink={0}
    >
      <Text fontSize="10px" fontWeight="bold" color="gray.900" lineHeight={1}>C</Text>
    </Flex>
  );
}

function PlayerToken({ player, colors, rating, subOffMin, photo, isCaptain }) {
  const k = kit(colors, player.pos === 'G');
  return (
    <Flex direction="column" align="center" gap={1.5} w="72px" py={1}>
      <Box position="relative">
        {photo ? (
          <Image
            src={photo}
            alt={player.name}
            boxSize="42px"
            borderRadius="full"
            objectFit="cover"
            bg="gray.700"
            borderWidth="2px"
            borderColor={`#${k.primary}`}
          />
        ) : (
          <Flex
            boxSize="42px"
            borderRadius="full"
            bg={`#${k.primary}`}
            color={`#${k.number}`}
            borderWidth="2px"
            borderColor={`#${k.border}`}
            align="center"
            justify="center"
            fontSize="md"
            fontWeight="bold"
          >
            {player.number}
          </Flex>
        )}
        {rating && <RatingBadge rating={rating} />}
        {subOffMin && <SubOffBadge minute={subOffMin} />}
      </Box>

      <Flex align="center" gap="3px" justify="center" maxW="78px">
        {isCaptain && <CaptainBadge />}
        <Text fontSize="11px" fontWeight="bold" color="whiteAlpha.700" flexShrink={0}>
          {player.number}
        </Text>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="white"
          css={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
          whiteSpace="nowrap"
        >
          {player.name}
        </Text>
      </Flex>
    </Flex>
  );
}

// one team occupies half the pitch; columns are formation lines (GK → attack toward center)
function TeamSide({ lineup, ratings, subOff, photos, captains, mirrored }) {
  const rows = groupByRow(lineup.startXI);
  const ordered = mirrored ? [...rows].reverse() : rows;
  return (
    <Flex flex={1} direction="row" justify="space-around">
      {ordered.map(({ row, players }) => (
        <Flex key={row} direction="column" justify="space-around" align="center" py={5}>
          {players.map((p) => (
            <PlayerToken
              key={p.id}
              player={p}
              colors={lineup.team.colors}
              rating={ratings[p.id]}
              subOffMin={subOff[p.id]}
              photo={photos[p.id]}
              isCaptain={captains.has(p.id)}
            />
          ))}
        </Flex>
      ))}
    </Flex>
  );
}

function SubsColumn({ lineup, ratings, photos, captains, subOn, align }) {
  const isRight = align === 'right';
  return (
    <Box flex={1}>
      <Stack gap={2}>
        {lineup.substitutes.map(({ player }) => {
          const k = kit(lineup.team.colors, player.pos === 'G');
          const rating = ratings[player.id];
          const photo = photos[player.id];
          const onMin = subOn[player.id];
          return (
            <Flex key={player.id} align="center" gap={2} flexDirection={isRight ? 'row-reverse' : 'row'}>
              {photo ? (
                <Image src={photo} alt={player.name} boxSize="26px" borderRadius="full" objectFit="cover" bg="gray.700" flexShrink={0} />
              ) : (
                <Flex
                  boxSize="26px"
                  borderRadius="full"
                  bg={`#${k.primary}`}
                  color={`#${k.number}`}
                  align="center"
                  justify="center"
                  fontSize="10px"
                  fontWeight="bold"
                  flexShrink={0}
                >
                  {player.number}
                </Flex>
              )}
              <Flex align="center" gap="3px" flexDirection={isRight ? 'row-reverse' : 'row'}>
                {captains.has(player.id) && <CaptainBadge />}
                <Text fontSize="11px" fontWeight="bold" color="whiteAlpha.600">{player.number}</Text>
                <Text fontSize="sm" fontWeight="medium">{player.name}</Text>
              </Flex>
              {onMin && <SubOnBadge minute={onMin} />}
              {rating && (
                <Box bg={ratingColor(rating)} borderRadius="sm" px="4px" flexShrink={0}>
                  <Text fontSize="10px" fontWeight="bold" color="white">{rating}</Text>
                </Box>
              )}
            </Flex>
          );
        })}
      </Stack>
    </Box>
  );
}

// penalty box + six-yard box + goal at one end of the horizontal pitch
function PitchEnd({ side }) {
  const edge = side === 'left' ? { left: 0 } : { right: 0 };
  const openInner = side === 'left' ? { borderLeftWidth: '0' } : { borderRightWidth: '0' };
  const goalEdge = side === 'left' ? { left: '-1px' } : { right: '-1px' };
  return (
    <>
      {/* 18-yard box */}
      <Box
        position="absolute"
        {...edge}
        top="50%"
        transform="translateY(-50%)"
        w="88px"
        h="62%"
        borderWidth="1px"
        borderColor="whiteAlpha.400"
        {...openInner}
      />
      {/* six-yard box */}
      <Box
        position="absolute"
        {...edge}
        top="50%"
        transform="translateY(-50%)"
        w="38px"
        h="30%"
        borderWidth="1px"
        borderColor="whiteAlpha.400"
        {...openInner}
      />
      {/* goal */}
      <Box
        position="absolute"
        {...goalEdge}
        top="50%"
        transform="translateY(-50%)"
        w="6px"
        h="13%"
        borderWidth="1px"
        borderColor="whiteAlpha.500"
        bg="whiteAlpha.200"
        {...openInner}
      />
    </>
  );
}

function LineupsPitch({ lineups, players, events, homeTeamId }) {
  if (!lineups?.length) return <Text color="gray.400" p={4}>No lineups.</Text>;

  const home = lineups.find((l) => l.team.id === homeTeamId) ?? lineups[0];
  const away = lineups.find((l) => l.team.id !== homeTeamId) ?? lineups[1];

  // from the players block: ratings, photos, captains (all keyed by player id)
  const ratings = {};
  const photos = {};
  const captains = new Set();
  (players || []).forEach((team) => {
    (team.players || []).forEach((p) => {
      const games = p.statistics?.[0]?.games;
      const r = games?.rating;
      if (r && !Number.isNaN(parseFloat(r))) ratings[p.player.id] = r;
      if (p.player.photo) photos[p.player.id] = p.player.photo;
      if (games?.captain) captains.add(p.player.id);
    });
  });

  // from subst events: starter going off (red) and substitute coming on (green)
  const starterIds = new Set();
  const subIds = new Set();
  lineups.forEach((l) => {
    l.startXI.forEach(({ player }) => starterIds.add(player.id));
    l.substitutes.forEach(({ player }) => subIds.add(player.id));
  });
  const subOff = {};
  const subOn = {};
  (events || []).forEach((e) => {
    if (e.type !== 'subst') return;
    const min = eventMinute(e.time);
    // whichever side of the event is a starter went off; whichever is a sub came on
    [e.player?.id, e.assist?.id].forEach((id) => {
      if (id == null) return;
      if (starterIds.has(id)) subOff[id] = min;
      else if (subIds.has(id)) subOn[id] = min;
    });
  });

  return (
    <Box p={4}>
      <Stack gap={4}>
        {/* header: home left, away right */}
        <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg">
          <Flex align="center" justify="space-between" px={3} py={2}>
            <Flex align="center" gap={2}>
              <Image src={home.team.logo} alt={home.team.name} boxSize="22px" />
              <Text fontWeight="bold" fontSize="md">{home.team.name}</Text>
              <Text fontSize="sm" color="gray.400" fontWeight="semibold">{home.formation}</Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Text fontSize="sm" color="gray.400" fontWeight="semibold">{away.formation}</Text>
              <Text fontWeight="bold" fontSize="md">{away.team.name}</Text>
              <Image src={away.team.logo} alt={away.team.name} boxSize="22px" />
            </Flex>
          </Flex>
        </Box>

        {/* horizontal pitch */}
        <Box
          position="relative"
          borderRadius="lg"
          overflow="hidden"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          minH="460px"
          css={{
            backgroundColor: '#2d6a3e',
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 60px, transparent 60px, transparent 120px)',
          }}
        >
          {/* halfway line + center circle */}
          <Box position="absolute" top={0} bottom={0} left="50%" w="1px" bg="whiteAlpha.400" />
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            boxSize="110px"
            borderRadius="full"
            borderWidth="1px"
            borderColor="whiteAlpha.400"
          />

          {/* goal boxes at both ends */}
          <PitchEnd side="left" />
          <PitchEnd side="right" />

          <Flex direction="row" position="relative" minH="460px">
            <TeamSide lineup={home} ratings={ratings} subOff={subOff} photos={photos} captains={captains} mirrored={false} />
            <TeamSide lineup={away} ratings={ratings} subOff={subOff} photos={photos} captains={captains} mirrored />
          </Flex>
        </Box>

        {/* coaches */}
        <Flex align="center" justify="space-between" px={2}>
          <Text fontSize="sm" fontWeight="medium">{home.coach?.name}</Text>
          <Text fontSize="xs" color="gray.400" fontWeight="semibold">Coach</Text>
          <Text fontSize="sm" fontWeight="medium">{away.coach?.name}</Text>
        </Flex>

        {/* substitutes */}
        <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg" p={4}>
          <Text fontWeight="semibold" fontSize="sm" mb={3} textAlign="center">Substitutes</Text>
          <Flex gap={6} align="flex-start">
            <SubsColumn lineup={home} ratings={ratings} photos={photos} captains={captains} subOn={subOn} align="left" />
            <SubsColumn lineup={away} ratings={ratings} photos={photos} captains={captains} subOn={subOn} align="right" />
          </Flex>
        </Box>
      </Stack>
    </Box>
  );
}

export default LineupsPitch;
