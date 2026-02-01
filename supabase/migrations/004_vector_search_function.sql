-- Migration: Vector Search Function for Style Chunks
-- Description: Create RPC function for semantic similarity search using pgvector
-- Author: Claude Opus 4.5
-- Date: 2026-02-01

-- ============================================
-- FUNCTION: search_style_chunks
-- Description: Search for similar style chunks using cosine similarity
-- ============================================
CREATE OR REPLACE FUNCTION search_style_chunks(
  query_embedding vector(1536),
  match_user_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  sample_id UUID,
  user_id UUID,
  chunk_text TEXT,
  chunk_index INT,
  distance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.sample_id,
    sc.user_id,
    sc.chunk_text,
    sc.chunk_index,
    (sc.embedding <=> query_embedding)::FLOAT AS distance
  FROM public.style_chunks sc
  WHERE sc.user_id = match_user_id
    AND sc.embedding IS NOT NULL
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_style_chunks TO authenticated;

-- Add comment
COMMENT ON FUNCTION search_style_chunks IS 'Search for similar style chunks using pgvector cosine similarity';
