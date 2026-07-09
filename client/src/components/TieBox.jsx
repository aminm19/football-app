import { Box, Flex, Image, Text } from '@chakra-ui/react';

function TeamLine({ team, code, score, isWinner, isDecided }) {
  // blank slot for a future (not-yet-determined) tie
  if (!team) {
    return (
      <Flex align="center" gap={2} px={3} py="6px">
        <Box
          boxSize="20px"
          borderRadius="full"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.subtle"
          flexShrink={0}
        />
        <Text fontSize="xs" color="text.secondary">TBD</Text>
      </Flex>
    );
  }

  const muted = isDecided && !isWinner;
  return (
    <Flex align="center" justify="space-between" gap={2} px={3} py="6px">
      <Flex align="center" gap={2} minW={0}>
        <Image src={team.logo} alt={code} boxSize="20px" flexShrink={0} />
        <Text
          fontSize="sm"
          fontWeight={muted ? 'medium' : 'bold'}
          color={muted ? 'text.secondary' : 'text.primary'}
          textDecoration={muted ? 'line-through' : 'none'}
        >
          {code}
        </Text>
      </Flex>
      <Text
        fontSize="sm"
        fontWeight={muted ? 'medium' : 'bold'}
        color={muted ? 'text.secondary' : 'text.primary'}
        flexShrink={0}
        minW="14px"
        textAlign="right"
      >
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
      bg={placeholder ? 'transparent' : 'bg.surface'}
      opacity={placeholder ? 0.6 : 1}
      borderWidth={highlighted ? '2px' : '1px'}
      borderStyle={placeholder ? 'dashed' : 'solid'}
      borderColor={highlighted ? 'accent.green' : 'border.subtle'}
      borderRadius="lg"
      _hover={placeholder ? undefined : { bg: 'bg.raised' }}
      w="104px"
      overflow="hidden"
      transition="background-color 0.15s ease"
    >
      <TeamLine
        team={teamA}
        code={codeFor(teamA, teamCodes)}
        score={aggA}
        isWinner={winnerId === teamA?.id}
        isDecided={decided}
      />
      <Box borderTopWidth="1px" borderColor="border.muted" />
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
