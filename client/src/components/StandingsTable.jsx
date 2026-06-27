import { Box, Flex, Image, Text, Table, Stack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

// map a description string to a zone key via keyword matching
function zoneOf(description) {
  if (!description) return null;
  const d = description.toLowerCase();
  if (d.includes('champions league')) return 'ucl';
  if (d.includes('europa league')) return 'uel';
  if (d.includes('conference')) return 'uecl';
  if (d.includes('relegation')) return 'releg';
  return null;
}

const ZONE_COLORS = {
  ucl: { bar: 'blue.400', label: 'Champions League' },
  uel: { bar: 'orange.400', label: 'Europa League' },
  uecl: { bar: 'green.400', label: 'Conference League' },
  releg: { bar: 'red.500', label: 'Relegation' },
};

const FORM_COLORS = {
  W: 'green.500',
  D: 'gray.500',
  L: 'red.500',
};

function FormPills({ form }) {
  if (!form) return null;
  return (
    <Flex gap="2px">
      {form.split('').map((r, i) => (
        <Flex
          key={i}
          align="center"
          justify="center"
          boxSize="16px"
          borderRadius="sm"
          bg={FORM_COLORS[r] ?? 'gray.600'}
          fontSize="9px"
          fontWeight="bold"
          color="white"
        >
          {r}
        </Flex>
      ))}
    </Flex>
  );
}

function StandingsTable({ standings, highlightTeamIds }) {
  const navigate = useNavigate();
  if (!standings?.groups?.length) {
    return <Text color="gray.400">No standings available.</Text>;
  }

  // subject teams (match: both sides; team page: one). when present, show only the
  // group(s) those teams are in and shade their rows.
  const highlight = new Set(highlightTeamIds ?? []);
  const relevant = highlight.size > 0
    ? standings.groups.filter((g) => g.rows.some((row) => highlight.has(row.teamId)))
    : standings.groups;
  // fall back to the full table if the subject teams aren't found (e.g. data mismatch)
  const groups = relevant.length > 0 ? relevant : standings.groups;

  // collect which zones actually appear (in the shown groups), for the legend
  const presentZones = new Set();
  groups.forEach((g) =>
    g.rows.forEach((row) => {
      const z = zoneOf(row.description);
      if (z) presentZones.add(z);
    })
  );

  return (
    <Box bg="blackAlpha.300" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg" overflow="hidden" p={4}>
      <Stack gap={4}>
        {standings.league && (
            <Flex align="center" gap={2} px={2}>
                {standings.league.logo && (
                <Image src={standings.league.logo} alt={standings.league.name} boxSize="20px" />
                )}
                <Text fontWeight="medium">
                {standings.league.name}
                </Text>
                <Text fontSize="sm" color="gray.400">
                {standings.league.season}/{standings.league.season + 1}
                </Text>
            </Flex>
            )}
      {groups.map((group) => (
        <Box key={group.name}>
          {/* group name — only show if more than one group exists in the source data */}
          {standings.groups.length > 1 && (
            <Text fontWeight="medium" mb={2} px={2}>
              {group.name}
            </Text>
          )}

          <Table.Root size="sm" tableLayout="fixed" width="full">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader w="52px">#</Table.ColumnHeader>
                <Table.ColumnHeader>Team</Table.ColumnHeader>
                <Table.ColumnHeader w="48px" textAlign="center">P</Table.ColumnHeader>
                <Table.ColumnHeader w="48px" textAlign="center">W</Table.ColumnHeader>
                <Table.ColumnHeader w="48px" textAlign="center">D</Table.ColumnHeader>
                <Table.ColumnHeader w="48px" textAlign="center">L</Table.ColumnHeader>
                <Table.ColumnHeader w="56px" textAlign="center">GD</Table.ColumnHeader>
                <Table.ColumnHeader w="52px" textAlign="center">Pts</Table.ColumnHeader>
                <Table.ColumnHeader w="110px">Form</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {group.rows.map((row) => {
                const zone = zoneOf(row.description);
                const barColor = zone ? ZONE_COLORS[zone].bar : 'transparent';
                const isSubject = highlight.has(row.teamId);
                return (
                  <Table.Row
                    key={row.teamId}
                    onClick={() => navigate(`/team/${row.teamId}?season=${standings.league.season}`)}
                    cursor="pointer"
                    bg={isSubject ? 'whiteAlpha.100' : undefined}
                    _hover={{ bg: isSubject ? 'whiteAlpha.200' : 'whiteAlpha.100' }}
                  >
                    <Table.Cell>
                      <Flex align="center">
                        {/* zone color bar */}
                        <Box w="3px" h="20px" bg={barColor} mr={2} borderRadius="full" />
                        {row.rank}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap={2} minW={0}>
                        <Image src={row.logo} alt={row.team} boxSize="18px" flexShrink={0} />
                        <Text whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                          {row.team}
                        </Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell textAlign="center">{row.played}</Table.Cell>
                    <Table.Cell textAlign="center">{row.win}</Table.Cell>
                    <Table.Cell textAlign="center">{row.draw}</Table.Cell>
                    <Table.Cell textAlign="center">{row.lose}</Table.Cell>
                    <Table.Cell textAlign="center">
                      {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                    </Table.Cell>
                    <Table.Cell textAlign="center" fontWeight="bold">
                      {row.points}
                    </Table.Cell>
                    <Table.Cell>
                      <FormPills form={row.form} />
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      ))}

      {/* legend — only zones actually present */}
      {presentZones.size > 0 && (
        <Flex gap={4} wrap="wrap" px={2}>
          {[...presentZones].map((z) => (
            <Flex key={z} align="center" gap={2}>
              <Box w="10px" h="10px" bg={ZONE_COLORS[z].bar} borderRadius="full" />
              <Text fontSize="xs" color="gray.400">
                {ZONE_COLORS[z].label}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </Stack>
    </Box>
  );
}

export default StandingsTable;