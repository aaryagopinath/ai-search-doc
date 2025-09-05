
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table (keep existing if not present)
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    filename TEXT,
    content_type TEXT,
    content_text TEXT,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Chunks table with pgvector embedding (nomic-embed-text has 768 dims)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY,
    document_id BIGINT REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);
