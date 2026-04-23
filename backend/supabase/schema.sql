-- Ejecutar en Supabase → SQL Editor (una vez).
-- Persistencia de la app ResearchGraph (proyectos, papers, edges, groups).

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year INTEGER,
  authors TEXT DEFAULT '[]',
  labels TEXT DEFAULT '[]',
  "paperTags" TEXT DEFAULT '[]',
  metrics TEXT DEFAULT '',
  dataset TEXT DEFAULT '',
  core TEXT DEFAULT '',
  observations TEXT DEFAULT '',
  "group" TEXT DEFAULT 'Ungrouped',
  relevance INTEGER DEFAULT 0,
  importance INTEGER DEFAULT 0,
  "canvasData" TEXT,
  "pdfPath" TEXT,
  "pdfHighlights" TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  source TEXT NOT NULL REFERENCES papers (id) ON DELETE CASCADE,
  target TEXT NOT NULL REFERENCES papers (id) ON DELETE CASCADE,
  label TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_papers_project ON papers ("projectId");
CREATE INDEX IF NOT EXISTS idx_edges_project ON edges ("projectId");
CREATE INDEX IF NOT EXISTS idx_groups_project ON groups ("projectId");
