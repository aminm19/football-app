import { Routes, Route, Outlet, Link as RouterLink } from 'react-router-dom';
import { Container, Flex, Link } from '@chakra-ui/react';
import Home from './pages/Home.jsx';
import Match from './pages/Match.jsx';
import League from './pages/League.jsx';
import Team from './pages/Team.jsx';

function Layout() {
  return (
    <Container maxW="container.md" py={6}>
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        pb={4}
        mb={6}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Link
          as={RouterLink}
          to="/"
          fontFamily="heading"
          fontSize="3xl"
          letterSpacing="wider"
          lineHeight="1"
          color="text.primary"
          _hover={{ color: 'accent.green', textDecoration: 'none' }}
        >
          Total Football
        </Link>
        <Link
          as={RouterLink}
          to="/"
          fontFamily="body"
          fontSize="md"
          fontWeight="medium"
          letterSpacing="wide"
          lineHeight="1"
          color="text.secondary"
          _hover={{ color: 'text.primary', textDecoration: 'none' }}
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