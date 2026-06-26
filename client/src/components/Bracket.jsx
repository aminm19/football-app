import { Box, Flex, Image, Text } from '@chakra-ui/react';
import TieBox from './TieBox.jsx';

// One vertical column of tie boxes for a single round (one side of the bracket).
function RoundColumn({ ties, onTieClick }) {
  return (
    <Flex direction="column" justify="space-around" flexShrink={0}>
      {ties.map((tie, i) => (
        <TieBox key={i} tie={tie} onClick={() => onTieClick(tie)} />
      ))}
    </Flex>
  );
}

function Bracket({ bracket, onTieClick }) {
  const { rounds } = bracket;
  if (!rounds || rounds.length === 0) {
    return <Text color="gray.400">No bracket available.</Text>;
  }

  // The final is the last round; everything before it splits into two halves.
  const finalRound = rounds[rounds.length - 1];
  const earlierRounds = rounds.slice(0, -1); // R16, QF, SF

  // For each earlier round, split its ties: first half = left, second half = right.
  const leftRounds = earlierRounds.map((r) => ({
    name: r.name,
    ties: r.ties.slice(0, Math.ceil(r.ties.length / 2)),
  }));
  const rightRounds = earlierRounds.map((r) => ({
    name: r.name,
    ties: r.ties.slice(Math.ceil(r.ties.length / 2)),
  }));

  const finalTie = finalRound.ties[0];
  const champion =
    finalTie && finalTie.winnerId != null
      ? finalTie.winnerId === finalTie.teamA.id
        ? finalTie.teamA
        : finalTie.teamB
      : null;

  return (
    <Box overflowX="auto" py={4}>
      <Flex align="stretch" gap={6} minH="400px">
        {/* LEFT half: rounds in normal order (R16 → QF → SF), flowing right */}
        {leftRounds.map((r) => (
          <RoundColumn key={`L-${r.name}`} ties={r.ties} onTieClick={onTieClick} />
        ))}

        {/* CENTER: champion + final */}
        <Flex direction="column" justify="center" align="center" gap={3} flexShrink={0} px={2}>
          {champion && (
            <Flex direction="column" align="center" gap={1} mb={2}>
              <Image src={champion.logo} alt={champion.name} boxSize="40px" />
              <Text fontSize="sm" fontWeight="bold" textAlign="center">
                {champion.name}
              </Text>
              <Text fontSize="xs" color="gray.400">
                Champion
              </Text>
            </Flex>
          )}
          {finalTie && <TieBox tie={finalTie} onClick={() => onTieClick(finalTie)} />}
        </Flex>

        {/* RIGHT half: rounds in REVERSE order (SF → QF → R16), flowing left toward center */}
        {[...rightRounds].reverse().map((r) => (
          <RoundColumn key={`R-${r.name}`} ties={r.ties} onTieClick={onTieClick} />
        ))}
      </Flex>
    </Box>
  );
}

export default Bracket;