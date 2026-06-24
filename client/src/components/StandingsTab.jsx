import { useState, useEffect } from 'react';
import { Spinner, Text } from '@chakra-ui/react';
import { getStandings } from '../api.js';
import StandingsTable from './StandingsTable.jsx';

function StandingsTab({ league, season }) {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getStandings(league, season)
      .then((data) => setStandings(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [league, season]);

  if (loading) return <Spinner />;
  if (error) return <Text color="gray.400">Standings unavailable.</Text>;
  return <StandingsTable standings={standings} />;
}

export default StandingsTab;