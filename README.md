# Football App

A full-stack football tracker — live scores, live match clock, standings, lineups, team profiles, and knockout brackets.

Joga bonito.

**[Live demo →](https://football-app-ebon.vercel.app)**

## Stack

- **Frontend:** React, Vite, React Router, Chakra UI
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (Neon)
- **External API:** API-Football
- **Deployment:** Vercel (frontend), Render (backend)

## Architecture

The backend acts as an aggregation layer between the frontend and external services. It pulls data from a sports API and caches results in Postgres to avoid redundant requests against a rate-limited tier.

Caching is tuned to each data type's volatility: finished matches and historical standings are immutable and cached permanently, while current-season standings and team fixtures use a time-based TTL so live data stays fresh. Resource-based routers (matches, standings, teams) keep concerns separated, with shared parsers flattening the API's nested responses into the app's own schema.

Standings and team data depend on the API's paid tier; these features sit behind a single environment-variable toggle (`STANDINGS_ENABLED`), enforced authoritatively on the backend and reflected on the frontend, so the app degrades cleanly to its free-tier core if the paid plan lapses.

The knockout bracket is derived entirely from raw fixture data: it pairs the two legs of each tie, computes aggregate scores accounting for home/away reversal, derives winners by tracing which team advances to the next round, and orders the tree so each tie sits adjacent to the two it feeds — producing a clean bracket without crossed connectors.

## API

- `GET /api/matches?date=YYYY-MM-DD` — matches for a date (defaults to today), filtered to major leagues
- `GET /api/matches?league=:id&season=:year` — matches for a league season
- `GET /api/matches/:id` — single match, cached when finished
- `GET /api/standings?league=:id&season=:year` — league table (toggle-gated)
- `GET /api/teams/:id?season=:year` — team profile + recent/upcoming fixtures (toggle-gated)
- `GET /api/config` — exposes feature flags to the frontend

## Running locally

Requires Node.js and a Postgres database (or a Neon connection string).

```bash
# backend
cd server
npm install
# create server/.env with DATABASE_URL, API_FOOTBALL_KEY, STANDINGS_ENABLED
npm run dev

# frontend (separate terminal)
cd client
npm install
# client/.env.development sets VITE_API_URL=http://localhost:3000
npm run dev
```
