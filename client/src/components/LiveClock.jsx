import { useState, useEffect } from 'react';
import { Badge, Text } from '@chakra-ui/react';
import { minuteLabel, clockLabel } from '../utils/liveClock.js';

// pin the API minute to the moment we got it, then re-render every second so the
// seconds tick locally. re-anchors whenever the match (or its reported minute) changes.
function useLiveAnchor(match) {
  // total minute = regulation elapsed + stoppage (extra), so 1H stoppage reads 45+3 not 45
  const minute = match.elapsed == null ? null : match.elapsed + (match.extra ?? 0);
  const [anchor, setAnchor] = useState(() => ({ elapsed: minute, at: Date.now() }));

  // re-anchor on a different match or a phase change (1H→2H), NOT on every minute
  // update — the seconds tick locally, so re-anchoring each poll would snap them.
  useEffect(() => {
    setAnchor({ elapsed: minute, at: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.fixture_id, match.status_short]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return anchor;
}

// "67'" badge for match rows (Home / League / Team)
export function LiveMinute({ match, ...props }) {
  const anchor = useLiveAnchor(match);
  const label = minuteLabel(anchor, match.status_short) ?? match.status_short;
  return <Badge colorPalette="green" {...props}>{label}</Badge>;
}

// "67:23" running clock for the match page header
export function LiveClock({ match, ...props }) {
  const anchor = useLiveAnchor(match);
  const label = clockLabel(anchor);
  if (!label) return null;
  return <Text fontVariantNumeric="tabular-nums" {...props}>{label}</Text>;
}
