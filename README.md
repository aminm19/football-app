# Football App

A full-stack football tracker — live scores, news, lineups, and AI-generated match summaries.
Joga bonito.

**Status:** In active development. Backend foundation in place; frontend and live data integration in progress.

## Stack
- **Frontend:** React, Vite, React Router (in progress)
- **Backend:** Node.js, Express
- **Database:** PostgreSQL (hosted on Neon)
- **External APIs:** [sports data API — TBD], OpenAI/Anthropic for match summaries
- **Deployment:** Vercel (frontend), Railway (backend) — pending

## Architecture
The backend acts as an aggregation layer between the frontend and external services. It pulls match data from a sports API, caches results in Postgres to avoid redundant requests, and uses an LLM to generate post-match analysis on demand.

## Progress
- [x] Database schema designed and deployed
- [x] Postgres connection set up
- [ ] Connection pooling
- [ ] Sports API integration and caching
