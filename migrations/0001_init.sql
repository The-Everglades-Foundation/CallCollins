CREATE TABLE IF NOT EXISTS executives (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  executive_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  executive_id TEXT NOT NULL,
  audience TEXT NOT NULL,
  occasion TEXT NOT NULL,
  point TEXT NOT NULL,
  file_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  role TEXT NOT NULL,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS voice_samples (
  id TEXT PRIMARY KEY,
  executive_id TEXT,
  scope TEXT NOT NULL,
  title TEXT NOT NULL,
  speaker TEXT,
  audience TEXT,
  occasion TEXT,
  spoken_on TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS style_cards (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS drafts_executive ON drafts (executive_id, created_at);
CREATE INDEX IF NOT EXISTS messages_draft ON messages (draft_id, created_at);
CREATE INDEX IF NOT EXISTS voice_scope ON voice_samples (scope, created_at);
