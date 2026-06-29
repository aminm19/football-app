import { Box, Flex, Image, Text } from '@chakra-ui/react';

function TeamLine({ team, code, score, isWinner, isDecided }) {
  // blank slot for a future (not-yet-determined) tie
  if (!team) {
    return (
      <Flex align="center" gap={2} px={2} py="5px">
        <Box boxSize="22px" borderRadius="full" bg="whiteAlpha.200" flexShrink={0} />
        <Text fontSize="sm" color="gray.500">TBD</Text>
      </Flex>
    );
  }

  const muted = isDecided && !isWinner;
  return (
    <Flex align="center" justify="space-between" gap={2} px={2} py="5px">
      <Flex align="center" gap={2} minW={0}>
        <Image src={team.logo} alt={code} boxSize="22px" flexShrink={0} />
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color={muted ? 'gray.500' : 'white'}
          textDecoration={muted ? 'line-through' : 'none'}
        >
          {code}
        </Text>
      </Flex>
      <Text fontSize="sm" fontWeight="bold" color={muted ? 'gray.500' : 'white'} flexShrink={0}>
        {score}
      </Text>
    </Flex>
  );
}

// short label for a team: API 3-letter code, else first 3 letters of the name
function codeFor(team, teamCodes) {
  if (!team) return null;
  return teamCodes?.[team.id] ?? team.name?.slice(0, 3).toUpperCase();
}

function TieBox({ tie, onClick, highlighted, teamCodes }) {
  const { teamA, teamB, aggA, aggB, winnerId, placeholder } = tie;
  const decided = winnerId != null;

  return (
    <Box
      onClick={placeholder ? undefined : onClick}
      cursor={placeholder ? 'default' : 'pointer'}
      bg="gray.900"
      borderWidth={highlighted ? '2px' : '1px'}
      borderColor={highlighted ? 'green.400' : 'whiteAlpha.200'}
      borderRadius="md"
      _hover={{ borderColor: highlighted ? 'green.300' : 'whiteAlpha.400', bg: 'gray.750' }}
      w="104px"
      overflow="hidden"
    >
      <TeamLine
        team={teamA}
        code={codeFor(teamA, teamCodes)}
        score={aggA}
        isWinner={winnerId === teamA?.id}
        isDecided={decided}
      />
      <Box borderTopWidth="1px" borderColor="whiteAlpha.100" />
      <TeamLine
        team={teamB}
        code={codeFor(teamB, teamCodes)}
        score={aggB}
        isWinner={winnerId === teamB?.id}
        isDecided={decided}
      />
    </Box>
  );
}

export default TieBox;
