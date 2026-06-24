import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMatchesByDate } from '../api.js';
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // "America/Los_Angeles"

function localToday() {
  const now = new Date(); // the browser's local time
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDay(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function Home() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(localToday());

  function goToDay(delta) {
    setLoading(true);                    
    setError(null);                         
    setDate((d) => shiftDay(d, delta));     
  }


  useEffect(() => {
    getMatchesByDate(date, tz)
      .then((data) => setMatches(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  if (loading) return <p>Loading matches…</p>;
  if (error) return <p>Error: {error}</p>;
  if (matches.length === 0) return <p>No major matches on {date}.</p>;

  return (
    <div>
      <h1>Matches</h1>
      <div>
        <button onClick={() => goToDay(-1)}>← Yesterday</button>
        <span>{date}</span>
        <button onClick={() => goToDay(1)}>Tomorrow →</button>
      </div>
      <ul>
        {matches.map((m) => (
          <li key={m.fixture_id}>
            <Link to={`/match/${m.fixture_id}`}>
              {m.home_team} {m.home_goals ?? ''} – {m.away_goals ?? ''}{' '}
              {m.away_team}
              {' '}({m.status_short})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Home;