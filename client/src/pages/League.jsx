import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getMatchesByLeague } from '../api.js';
import {
  Box, Stack, Heading, Text, Spinner, Button, ButtonGroup,
  Flex, IconButton, NativeSelect,
} from '@chakra-ui/react';
import MatchRow from '../components/MatchRow.jsx';
import Bracket from '../components/Bracket.jsx';
import TieDialog from '../components/TieDialog.jsx';
import { buildBracket, orderBracket } from '../utils/bracket.js';

const FINISHED = ['FT', 'AET', 'PEN'];

function League() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const season = searchParams.get('season');

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('date');        // date | round (within matches view)
  const [view, setView] = useState('matches');     // matches | bracket
  const [activeIndex, setActiveIndex] = useState(null);
  const [selectedTie, setSelectedTie] = useState(null); // for the legs dialog

  useEffect(() => {
    setLoading(true);
    setError(null);
    setActiveIndex(null);
    getMatchesByLeague(id, season)
      .then((data) => setMatches(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, season]);

  function changeMode(newMode) {
    setMode(newMode);
    setActiveIndex(null);
  }

  if (loading) return <Spinner />;
  if (error) return <Text color="red.400">Error: {error}</Text>;
  if (matches.length === 0) return <Text>No matches found.</Text>;

  const competitionName = matches[0]?.league_name ?? 'Competition';
  const bracket = orderBracket(buildBracket(matches));
  const hasBracket = bracket.rounds.length > 0;

  // ---- matches-list view data (only needed when view === 'matches') ----
  const sorted = [...matches].sort(
    (a, b) => new Date(a.match_date) - new Date(b.match_date)
  );
  const groupMap = new Map();
  for (const m of sorted) {
    const key =
      mode === 'round'
        ? m.round
        : new Date(m.match_date).toLocaleDateString([], {
            weekday: 'long', month: 'long', day: 'numeric',
          });
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(m);
  }
  const slices = [...groupMap.entries()];
  const allFinished = matches.every((m) => FINISHED.includes(m.status_short));
  const defaultIndex = allFinished ? slices.length - 1 : 0;
  const currentIndex =
    activeIndex === null
      ? defaultIndex
      : Math.min(Math.max(activeIndex, 0), slices.length - 1);
  const [label, sliceMatches] = slices[currentIndex];

  return (
    <Stack gap={4}>
      <Heading size="md">{competitionName}</Heading>

      {/* view toggle: Matches | Bracket (Bracket only if knockout rounds exist) */}
      <ButtonGroup size="sm" attached>
        <Button variant={view === 'matches' ? 'solid' : 'outline'} onClick={() => setView('matches')}>
          Matches
        </Button>
        {hasBracket && (
          <Button variant={view === 'bracket' ? 'solid' : 'outline'} onClick={() => setView('bracket')}>
            Bracket
          </Button>
        )}
      </ButtonGroup>

      {view === 'bracket' ? (
        <Bracket bracket={bracket} onTieClick={(tie) => setSelectedTie(tie)} />
      ) : (
        <>
          {/* date/round grouping toggle */}
          <ButtonGroup size="sm" attached>
            <Button variant={mode === 'date' ? 'solid' : 'outline'} onClick={() => changeMode('date')}>
              By date
            </Button>
            <Button variant={mode === 'round' ? 'solid' : 'outline'} onClick={() => changeMode('round')}>
              By round
            </Button>
          </ButtonGroup>

          {/* pager */}
          <Flex align="center" gap={2}>
            <IconButton aria-label="Previous" size="sm" variant="ghost"
              disabled={currentIndex === 0}
              onClick={() => setActiveIndex(currentIndex - 1)}>
              ‹
            </IconButton>
            <NativeSelect.Root size="sm" flex={1}>
              <NativeSelect.Field
                value={currentIndex}
                onChange={(e) => setActiveIndex(Number(e.target.value))}>
                {slices.map(([sliceLabel], i) => (
                  <option key={sliceLabel} value={i}>{sliceLabel}</option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <IconButton aria-label="Next" size="sm" variant="ghost"
              disabled={currentIndex === slices.length - 1}
              onClick={() => setActiveIndex(currentIndex + 1)}>
              ›
            </IconButton>
          </Flex>

          <Stack gap={0}>
            {sliceMatches.map((m) => (
              <MatchRow key={m.fixture_id} match={m} />
            ))}
          </Stack>
        </>
      )}

      {/* legs dialog — shared by the bracket tie clicks */}
      <TieDialog
        tie={selectedTie}
        open={selectedTie !== null}
        onClose={() => setSelectedTie(null)}
      />
    </Stack>
  );
}

export default League;