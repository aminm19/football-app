import { Routes, Route, Outlet, Link as RouterLink } from 'react-router-dom';
import { Container, Flex, Link, Text } from '@chakra-ui/react';
import Home from './pages/Home.jsx';
import Match from './pages/Match.jsx';
import League from './pages/League.jsx';
import Team from './pages/Team.jsx';

function Layout() {
  return (
    <Container maxW="container.md" py={6}>
      <Flex as="nav" align="center" justify="space-between" mb={6}>
        <Link as={RouterLink} to="/" fontWeight="bold" fontSize="lg">
          Total Football
        </Link>
        <Link as={RouterLink} to="/">
          Home
        </Link>
      </Flex>
      <Outlet />
    </Container>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/match/:id" element={<Match />} />
        <Route path="/league/:id" element={<League />} />
        <Route path="/team/:id" element={<Team />} />
      </Route>
    </Routes>
  );
}

export default App;