-- Migration: Enable pgvector Extension
-- Description: Enable PostgreSQL vector extension for semantic search
-- Author: Claude Sonnet 4.5
-- Date: 2026-01-27
-- Prerequisites: Run 001_initial_schema.sql first

-- ============================================
-- ENABLE EXTENSION: pgvector
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- CREATE VECTOR INDEX
-- Description: Create IVFFlat index for fast approximate nearest neighbor search
-- Note: IVFFlat is efficient for datasets with 1000+ vectors
-- ============================================
-- Create index on style_chunks.embedding for cosine similarity search
-- Using ivfflat index with lists = total_rows / 1000 (approximately)
-- Will be optimized as data grows
CREATE INDEX IF NOT EXISTS idx_style_chunks_embedding
ON public.style_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================
-- HELPER FUNCTION: Cosine Similarity Search
-- ============================================
CREATE OR REPLACE FUNCTION match_style_chunks(
  query_embedding vector(1536),
  match_user_id UUID,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  sample_id UUID,
  chunk_text TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    style_chunks.id,
    style_chunks.sample_id,
    style_chunks.chunk_text,
    1 - (style_chunks.embedding <=> query_embedding) AS similarity
  FROM public.style_chunks
  WHERE style_chunks.user_id = match_user_id
    AND 1 - (style_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY style_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_style_chunks IS 'Find similar style chunks using cosine similarity for a specific user';
