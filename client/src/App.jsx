import { Routes, Route, Outlet, Link as RouterLink } from 'react-router-dom';
import { Container, Flex, Link } from '@chakra-ui/react';
import Home from './pages/Home.jsx';
import Match from './pages/Match.jsx';
import League from './pages/League.jsx';
import Team from './pages/Team.jsx';

function Layout() {
  return (
    <Container maxW="container.md" py={6}>
      <Flex as="nav" align="center" justify="space-between" mb={6}>
        <Link
          as={RouterLink}
          to="/"
          fontFamily="'Bebas Neue', sans-serif"
          fontSize="4xl"
          letterSpacing="wider"
          lineHeight={1}
          color="white"
          _hover={{ color: 'green.300', textDecoration: 'none' }}
        >
          Total Football
        </Link>
        <Link
          as={RouterLink}
          to="/"
          fontFamily="'Bebas Neue', sans-serif"
          fontSize="2xl"
          letterSpacing="wide"
          color="gray.300"
          _hover={{ color: 'white', textDecoration: 'none' }}
        >
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