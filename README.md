# Football App

A full-stack football tracker — live scores, live match clock, standings, lineups, team profiles, and knockout brackets.
Joga bonito.

**Status:** In active development. Backend and frontend feature-complete and tested against live data; deployment pending.

## Stack
- **Frontend:** React, Vite, React Router, Chakra UI
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (hosted on Neon)
- **External APIs:** API-Football
- **Deployment:** Vercel (frontend), Railway/Render (backend) — pending

## Architecture
The backend acts as an aggregation layer between the frontend and external services. It pulls data from a sports API and caches results in Postgres to avoid redundant requests against a rate-limited tier.

Caching is tuned to each data type's volatility: finished matches and historical standings are immutable and cached permanently, while current-season standings and team fixtures use a time-based TTL so live data stays fresh. Resource-based routers (matches, standings, teams) keep concerns separated, with shared parsers flattening the API's nested responses into the app's own schema.

Standings and team data depend on the API's paid tier; these features sit behind a single environment-variable toggle (`STANDINGS_ENABLED`), enforced authoritatively on the backend and reflected on the frontend, so the app degrades cleanly to its free-tier core if the paid plan lapses.

## API
- `GET /api/matches?date=YYYY-MM-DD` — matches for a date (defaults to today), filtered to major leagues
- `GET /api/matches?league=:id&season=:year` — matches for a league season
- `GET /api/matches/:id` — single match, cached when finished
- `GET /api/standings?league=:id&season=:year` — league table (toggle-gated)
- `GET /api/teams/:id?season=:year` — team profile + recent/upcoming fixtures (toggle-gated)
- `GET /api/leagues/:id` — league metadata + available seasons (for the season selector)
- `GET /api/config` — exposes feature flags to the frontend

## Progress
- [x] Database schema designed and deployed
- [x] Postgres connection + pooling
- [x] Sports API integration with three-layer error handling
- [x] Matches routes (by date, by league/season, by id) with caching
- [x] Standings route with season-aware caching
- [x] Team route (profile + fixtures) with caching
- [x] League metadata route (available seasons)
- [x] Paid-feature toggle with graceful degradation
- [x] React frontend (home, match, league, team pages)
- [x] Live match clock with stoppage-time handling
- [ ] Deployment