CREATE TABLE matches (
  fixture_id     INTEGER PRIMARY KEY,
  match_date     TIMESTAMPTZ NOT NULL,
  status_short   VARCHAR(10) NOT NULL,

  league_id      INTEGER NOT NULL,
  league_name    VARCHAR(100) NOT NULL,
  season         INTEGER NOT NULL,
  round          VARCHAR(100),

  home_team_id   INTEGER NOT NULL,
  home_team      VARCHAR(100) NOT NULL,
  home_logo      TEXT,
  away_team_id   INTEGER NOT NULL,
  away_team      VARCHAR(100) NOT NULL,
  away_logo      TEXT,

  home_goals     INTEGER,
  away_goals     INTEGER,
  penalty_home   INTEGER,
  penalty_away   INTEGER,

  summary        TEXT,

  events         JSONB,
  lineups        JSONB,
  statistics     JSONB,
  players        JSONB,

  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE standings (
  league_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (league_id, season)
);

CREATE TABLE teams (
  team_id INTEGER NOT NULL,
  season INTEGER NOT NULL,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, season)
);