import { Box, Flex, Image, Text } from '@chakra-ui/react';

function TeamLine({ team, score, isWinner, isDecided }) {
  return (
    <Flex align="center" justify="space-between" gap={2} px={2} py={1}>
      <Flex align="center" gap={2} minW={0}>
        <Image src={team.logo} alt={team.name} boxSize="16px" flexShrink={0} />
        <Text
          fontSize="xs"
          truncate
          color={isDecided && !isWinner ? 'gray.500' : 'white'}
          textDecoration={isDecided && !isWinner ? 'line-through' : 'none'}
        >
          {team.name}
        </Text>
      </Flex>
      <Text
        fontSize="xs"
        fontWeight="bold"
        color={isDecided && !isWinner ? 'gray.500' : 'white'}
        flexShrink={0}
      >
        {score}
      </Text>
    </Flex>
  );
}

function TieBox({ tie, onClick }) {
  const { teamA, teamB, aggA, aggB, winnerId } = tie;
  const decided = winnerId != null;

  return (
    <Box
      onClick={onClick}
      cursor="pointer"
      bg="gray.900"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="md"
      _hover={{ borderColor: 'whiteAlpha.400', bg: 'gray.750' }}
      w="160px"
      overflow="hidden"
    >
      <TeamLine
        team={teamA}
        score={aggA}
        isWinner={winnerId === teamA.id}
        isDecided={decided}
      />
      <Box borderTopWidth="1px" borderColor="whiteAlpha.100" />
      <TeamLine
        team={teamB}
        score={aggB}
        isWinner={winnerId === teamB.id}
        isDecided={decided}
      />
    </Box>
  );
}

export default TieBox;