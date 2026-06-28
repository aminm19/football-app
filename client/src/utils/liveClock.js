// statuses where a running clock should tick (not HT / FT / NS / penalties)
export const RUNNING_STATUSES = ['1H', '2H', 'ET'];

export function isRunning(status) {
  return RUNNING_STATUSES.includes(status);
}

// any in-progress status (broader than isRunning — includes halftime/breaks)
const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P'];
export function isLive(status) {
  return LIVE_STATUSES.includes(status);
}

// how often to re-fetch a live match so the clock corrects at HT/FT/half-changes.
// relaxed during clean play, tighter near/after each half's end and during breaks.
// returns null when the match isn't live (no polling needed).
export function livePollMs(match) {
  switch (match.status_short) {
    case '1H': return match.elapsed >= 44 ? 60_000 : 120_000;
    case '2H': return match.elapsed >= 89 ? 60_000 : 120_000;
    case 'ET':
    case 'BT': // break before extra time
    case 'P':  // penalties
    case 'HT': return 60_000; // watching for the next phase to start
    default: return null;
  }
}

// An "anchor" pins the API's authoritative minute to the moment we received it:
//   { elapsed: <API minute>, at: <client time, ms> }
// Elapsed seconds = anchored minute + real time since we captured it. The minute
// is always the API's value (never derived from the scheduled kickoff), so a late
// start / halftime / stoppage is already baked in and the clock can't run ahead.
function elapsedSeconds(anchor) {
  if (anchor.elapsed == null) return null;
  // the API minute is 1-indexed (the minute being played): minute 30 spans the
  // clock from 29:00 to 29:59, so the real clock starts at (elapsed - 1) minutes.
  return (anchor.elapsed - 1) * 60 + (Date.now() - anchor.at) / 1000;
}

// "67'" — with stoppage time as "45+2'" / "90+3'"
export function minuteLabel(anchor, status) {
  const secs = elapsedSeconds(anchor);
  if (secs == null) return null;
  const min = Math.floor(Math.max(0, secs) / 60) + 1; // back to the 1-indexed minute
  if (status === '1H') return min > 45 ? `45+${min - 45}'` : `${min}'`;
  if (status === '2H') return min > 90 ? `90+${min - 90}'` : `${min}'`;
  return `${min}'`;
}

// "67:23" — running mm:ss for the match page
export function clockLabel(anchor) {
  const secs = elapsedSeconds(anchor);
  if (secs == null) return null;
  const total = Math.max(0, Math.floor(secs));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
