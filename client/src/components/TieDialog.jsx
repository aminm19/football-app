import { Dialog, Portal, Flex, Image, Text, Box } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

function LegRow({ leg, onNavigate }) {
  const date = new Date(leg.match_date).toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  return (
    <Box
      as={RouterLink}
      to={`/match/${leg.fixture_id}`}
      onClick={onNavigate}
      display="block"
      py={2}
      px={2}
      borderRadius="md"
      _hover={{ bg: 'whiteAlpha.100' }}
    >
      <Text fontSize="xs" color="gray.400" mb={1}>{date}</Text>
      <Flex align="center" justify="space-between">
        <Flex align="center" gap={2} flex={1}>
          <Image src={leg.home_logo} alt={leg.home_team} boxSize="18px" />
          <Text fontSize="sm">{leg.home_team}</Text>
        </Flex>
        <Text fontSize="sm" fontWeight="bold" px={3}>
          {leg.home_goals} – {leg.away_goals}
        </Text>
        <Flex align="center" gap={2} flex={1} justify="flex-end">
          <Text fontSize="sm">{leg.away_team}</Text>
          <Image src={leg.away_logo} alt={leg.away_team} boxSize="18px" />
        </Flex>
      </Flex>
    </Box>
  );
}
function TieDialog({ tie, open, onClose }) {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="gray.800">
            <Dialog.Header>
              <Dialog.Title>
                {tie?.legs.length > 1 ? 'Two-legged tie' : 'Match'}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {tie?.legs.map((leg) => (
                <LegRow key={leg.fixture_id} leg={leg} onNavigate={onClose} />
              ))}
            </Dialog.Body>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default TieDialog;