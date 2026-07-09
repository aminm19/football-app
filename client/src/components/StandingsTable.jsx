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
  ucl: { bar: 'zone.ucl', label: 'Champions League' },
  uel: { bar: 'zone.uel', label: 'Europa League' },
  uecl: { bar: 'zone.uecl', label: 'Conference League' },
  releg: { bar: 'zone.relegation', label: 'Relegation' },
};

const FORM_COLORS = {
  W: 'status.positive',
  D: 'gray.500',
  L: 'status.negative',
};

// map each team in an in-progress match to its provisional result + score (team's view)
function buildLiveByTeam(liveMatches) {
  const map = {};
  (liveMatches ?? []).forEach((m) => {
    const sides = [
      { id: m.home_team_id, gf: m.home_goals ?? 0, ga: m.away_goals ?? 0 },
      { id: m.away_team_id, gf: m.away_goals ?? 0, ga: m.home_goals ?? 0 },
    ];
    sides.forEach(({ id, gf, ga }) => {
      const result = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
      map[id] = { gf, ga, result };
    });
  });
  return map;
}

// colored live score chip — green winning / gray drawing / red losing (matches form pills)
function LiveChip({ gf, ga, result }) {
  return (
    <Box bg={FORM_COLORS[result]} borderRadius="sm" px="6px" py="1px" flexShrink={0}>
      <Text fontSize="11px" fontWeight="bold" color="white" lineHeight="1.5">
        {gf}-{ga}
      </Text>
    </Box>
  );
}

function FormPills({ form }) {
  if (!form) return null;
  return (
    <Flex gap="3px">
      {form.split('').map((r, i) => (
        <Flex
          key={i}
          align="center"
          justify="center"
          boxSize="22px"
          borderRadius="sm"
          bg={FORM_COLORS[r] ?? 'gray.600'}
          fontSize="11px"
          fontWeight="bold"
          color="white"
        >
          {r}
        </Flex>
      ))}
    </Flex>
  );
}

function StandingsTable({ standings, highlightTeamIds, liveMatches }) {
  const navigate = useNavigate();
  if (!standings?.groups?.length) {
    return <Text color="text.secondary">No standings available.</Text>;
  }

  // provisional live result per team (not added to the official points — shown as a chip)
  const liveByTeam = buildLiveByTeam(liveMatches);

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
    <Box bg="bg.surface" borderWidth="1px" borderColor="border.subtle" borderRadius="xl" overflow="hidden" p={4}>
      <Stack gap={4}>
        {standings.league && (
            <Flex align="center" gap={2} px={2}>
                {standings.league.logo && (
                <Image src={standings.league.logo} alt={standings.league.name} boxSize="20px" />
                )}
                <Text fontWeight="medium" color="text.primary">
                {standings.league.name}
                </Text>
                <Text fontSize="sm" color="text.secondary">
                {standings.league.season}/{standings.league.season + 1}
                </Text>
            </Flex>
            )}
      {groups.map((group) => (
        <Box key={group.name}>
          {/* group name — only show if more than one group exists in the source data */}
          {standings.groups.length > 1 && (
            <Text fontWeight="medium" color="text.primary" mb={2} px={2}>
              {group.name}
            </Text>
          )}

          <Table.Root
            size="sm"
            tableLayout="fixed"
            width="full"
            css={{ '& th, & td': { borderColor: 'border.muted' } }}
          >
            <Table.Header>
              <Table.Row bg="transparent">
                <Table.ColumnHeader w="52px" fontSize="2xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" color="text.secondary">#</Table.ColumnHeader>
                <Table.ColumnHeader fontSize="2xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" color="text.secondary">Team</Table.ColumnHeader>
                <Table.ColumnHeader w="40px" textAlign="center" fontSize="2xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" color="text.secondary">P</Table.ColumnHeader>
                <Table.ColumnHeader w="40px" textAlign="center" fontSize="2xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" color="text.secondary">W</Table.ColumnHeader>
                <Table.ColumnHeader w="40px" textAlign="center" fontSize="2xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" color="text.secondary">D</Table.ColumnHeader>
                <Table.ColumnHeader w="40px" textAlign="center" fontSize="2xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" color="text.secondary">L</Table.ColumnHeader>
                <Table.ColumnHeader w="52px" textAlign="center" fontSize="2xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" color="text.secondary">GD</Table.ColumnHeader>
                <Table.ColumnHeader w="48px" textAlign="center" fontSize="2xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" color="text.secondary">Pts</Table.ColumnHeader>
                <Table.ColumnHeader w="132px" fontSize="2xs" fontWeight="medium" textTransform="uppercase" letterSpacing="wide" color="text.secondary">Form</Table.ColumnHeader>
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
                    bg={isSubject ? 'bg.raised' : 'transparent'}
                    _hover={{ bg: 'bg.raised' }}
                  >
                    <Table.Cell>
                      <Flex align="center">
                        {/* zone color bar */}
                        <Box w="3px" h="20px" bg={barColor} mr={2} borderRadius="full" />
                        <Text color="text.secondary">{row.rank}</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap={2} minW={0}>
                        <Image src={row.logo} alt={row.team} boxSize="20px" flexShrink={0} />
                        <Text color="text.primary" fontWeight="medium" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
                          {row.team}
                        </Text>
                        {liveByTeam[row.teamId] && <LiveChip {...liveByTeam[row.teamId]} />}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell textAlign="center" color="text.secondary">{row.played}</Table.Cell>
                    <Table.Cell textAlign="center" color="text.secondary">{row.win}</Table.Cell>
                    <Table.Cell textAlign="center" color="text.secondary">{row.draw}</Table.Cell>
                    <Table.Cell textAlign="center" color="text.secondary">{row.lose}</Table.Cell>
                    <Table.Cell textAlign="center" color="text.secondary">
                      {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                    </Table.Cell>
                    <Table.Cell textAlign="center" fontWeight="bold" color="text.primary">
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
              <Text fontSize="xs" color="text.secondary">
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