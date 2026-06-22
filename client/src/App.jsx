import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Match from './pages/Match.jsx';
import League from './pages/League.jsx';
import Team from './pages/Team.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/match/:id" element={<Match />} />
      <Route path="/league/:id" element={<League />} />
      <Route path="/team/:id" element={<Team />} />
    </Routes>
  );
}

export default App;