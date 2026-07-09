import { Box, Flex, Image, Text } from '@chakra-ui/react';
import { IoTrophyOutline } from 'react-icons/io5';
import TieBox from './TieBox.jsx';

// a tie is highlighted when both its teams are the subject (e.g. the current match)
function isTieHighlighted(tie, highlight) {
  return (
    highlight.size > 0 &&
    tie.teamA?.id != null && tie.teamB?.id != null &&
    highlight.has(tie.teamA.id) && highlight.has(tie.teamB.id)
  );
}

// One vertical column of tie boxes for a single round (one side of the bracket).
function RoundColumn({ ties, onTieClick, highlight, teamCodes }) {
  return (
    <Flex direction="column" justify="space-around" flexShrink={0}>
      {ties.map((tie, i) => (
        <TieBox
          key={i}
          tie={tie}
          onClick={() => onTieClick(tie)}
          highlighted={isTieHighlighted(tie, highlight)}
          teamCodes={teamCodes}
        />
      ))}
    </Flex>
  );
}

function Bracket({ bracket, onTieClick, highlightTeamIds, teamCodes }) {
  const { rounds } = bracket;
  if (!rounds || rounds.length === 0) {
    return <Text color="text.secondary">No bracket available.</Text>;
  }

  const highlight = new Set(highlightTeamIds ?? []);

  // the center-out tree assumes the last round is a single-tie final. for an
  // in-progress or single-round bracket (e.g. a World Cup still in the Round of 32),
  // fall back to a simple left-to-right column layout with round labels.
  const lastRound = rounds[rounds.length - 1];
  if (lastRound.ties.length !== 1) {
    return (
      <Box overflowX="auto" py={4}>
        <Flex align="flex-start" gap={10}>
          {rounds.map((r) => (
            <Flex key={r.name} direction="column" gap={3} flexShrink={0}>
              <Text fontSize="xs" color="text.secondary" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide" mb={1}>
                {r.name}
              </Text>
              {r.ties.map((tie, i) => (
                <TieBox
                  key={i}
                  tie={tie}
                  onClick={() => onTieClick(tie)}
                  highlighted={isTieHighlighted(tie, highlight)}
                  teamCodes={teamCodes}
                />
              ))}
            </Flex>
          ))}
        </Flex>
      </Box>
    );
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

  // height scales with the tallest column (the first round's half) so the ties aren't cramped
  const tallestColumn = leftRounds[0]?.ties.length ?? 1;
  const minHeight = Math.max(tallestColumn * 74, 360);

  return (
    <Box overflowX="auto" py={6}>
      <Flex align="stretch" gap={10} minH={`${minHeight}px`} w="fit-content" mx="auto">
        {/* LEFT half: rounds in normal order (R16 → QF → SF), flowing right */}
        {leftRounds.map((r) => (
          <RoundColumn key={`L-${r.name}`} ties={r.ties} onTieClick={onTieClick} highlight={highlight} teamCodes={teamCodes} />
        ))}

        {/* CENTER: champion + final */}
        <Flex direction="column" justify="center" align="center" gap={3} flexShrink={0} px={4}>
          {champion ? (
            <Flex
              direction="column"
              align="center"
              gap={1}
              mb={3}
              px={4}
              py={3}
              borderWidth="1px"
              borderColor="#f6c453"
              borderRadius="lg"
              bg="bg.raised"
            >
              <Box fontSize="18px" color="#f6c453" display="flex"><IoTrophyOutline /></Box>
              <Image src={champion.logo} alt={champion.name} boxSize="40px" />
              <Text fontSize="sm" fontWeight="bold" color="text.primary" textAlign="center">
                {champion.name}
              </Text>
              <Text fontSize="2xs" fontWeight="bold" color="#f6c453" textTransform="uppercase" letterSpacing="wide">
                Champion
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" align="center" gap={1} mb={3}>
              <Box fontSize="40px" color="border.subtle" display="flex"><IoTrophyOutline /></Box>
              <Text fontSize="xs" color="text.secondary">Champion</Text>
            </Flex>
          )}
          {finalTie && (
            <TieBox
              tie={finalTie}
              onClick={() => onTieClick(finalTie)}
              highlighted={isTieHighlighted(finalTie, highlight)}
              teamCodes={teamCodes}
            />
          )}
        </Flex>

        {/* RIGHT half: rounds in REVERSE order (SF → QF → R16), flowing left toward center */}
        {[...rightRounds].reverse().map((r) => (
          <RoundColumn key={`R-${r.name}`} ties={r.ties} onTieClick={onTieClick} highlight={highlight} teamCodes={teamCodes} />
        ))}
      </Flex>
    </Box>
  );
}

export default Bracket;