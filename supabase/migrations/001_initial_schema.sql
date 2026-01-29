-- Migration: Initial Schema for DontGetCaught.AI
-- Description: Create core tables for style samples, chunks, profiles, and writing tasks
-- Author: Claude Sonnet 4.5
-- Date: 2026-01-27

-- ============================================
-- TABLE: style_samples
-- Description: Stores user uploaded writing samples
-- ============================================
CREATE TABLE IF NOT EXISTS public.style_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('docx', 'pdf', 'paste')),
  storage_path TEXT, -- Path in Supabase Storage (null for paste)
  raw_text TEXT,
  cleaned_text TEXT,
  detected_language TEXT CHECK (detected_language IN ('en', 'non_en', 'mixed', 'unknown')),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'parsing', 'lang_failed', 'indexed', 'error')),
  word_count_en INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_style_samples_user ON public.style_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_style_samples_status ON public.style_samples(status);
CREATE INDEX IF NOT EXISTS idx_style_samples_created ON public.style_samples(created_at DESC);

-- ============================================
-- TABLE: style_chunks
-- Description: Text chunks with vector embeddings for similarity search
-- Note: Requires pgvector extension (see 002_enable_pgvector.sql)
-- ============================================
CREATE TABLE IF NOT EXISTS public.style_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID NOT NULL REFERENCES public.style_samples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-ada-002 or text-embedding-3-small (1536 dimensions)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_style_chunks_sample ON public.style_chunks(sample_id);
CREATE INDEX IF NOT EXISTS idx_style_chunks_user ON public.style_chunks(user_id);
-- Vector index will be created after pgvector is enabled

-- ============================================
-- TABLE: style_profiles
-- Description: Aggregated user writing style metrics
-- ============================================
CREATE TABLE IF NOT EXISTS public.style_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- metrics_json structure example:
  -- {
  --   "sentence_length_hist": {"short": 0.3, "medium": 0.5, "long": 0.2},
  --   "punctuation_usage": {"comma_density": 0.05, "semicolon": 0.01, "em_dash": 0.02},
  --   "transition_phrases_top": ["However", "I think", "Honestly"],
  --   "tone_markers": {"casual": 0.7, "formal": 0.3},
  --   "quirks_summary": ["fragments", "contractions"]
  -- }
  is_ready BOOLEAN DEFAULT FALSE,
  total_english_words INTEGER DEFAULT 0,
  recommended_threshold_words INTEGER DEFAULT 2000,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: writing_tasks
-- Description: User's writing generation tasks
-- ============================================
CREATE TABLE IF NOT EXISTS public.writing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_language TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  task_type TEXT CHECK (task_type IN ('personal_narrative', 'argumentative', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_writing_tasks_user ON public.writing_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_tasks_created ON public.writing_tasks(created_at DESC);

-- ============================================
-- TABLE: task_versions
-- Description: Generated text versions for each task (supports revisions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.task_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.writing_tasks(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  generated_text TEXT NOT NULL,
  revision_instruction TEXT, -- Natural language instruction for this revision (null for v1)
  exported_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_versions_task ON public.task_versions(task_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_versions_unique ON public.task_versions(task_id, version_number);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_style_samples_updated_at ON public.style_samples;
CREATE TRIGGER update_style_samples_updated_at
  BEFORE UPDATE ON public.style_samples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_writing_tasks_updated_at ON public.writing_tasks;
CREATE TRIGGER update_writing_tasks_updated_at
  BEFORE UPDATE ON public.writing_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.style_samples IS 'User uploaded writing samples for style learning';
COMMENT ON TABLE public.style_chunks IS 'Text chunks with vector embeddings for semantic search';
COMMENT ON TABLE public.style_profiles IS 'Aggregated user writing style metrics and readiness status';
COMMENT ON TABLE public.writing_tasks IS 'User writing generation tasks';
COMMENT ON TABLE public.task_versions IS 'Generated text versions with revision history';
