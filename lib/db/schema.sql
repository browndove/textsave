CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'You',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faq_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faq_entries (
  id UUID PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES faq_documents(id) ON DELETE CASCADE,
  question TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS faq_entries_document_id_idx ON faq_entries(document_id);
