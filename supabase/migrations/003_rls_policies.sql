-- Migration: Row Level Security Policies
-- Description: Ensure users can only access their own data
-- Author: Claude Sonnet 4.5
-- Date: 2026-01-27

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.style_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.writing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_versions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: style_samples
-- ============================================
-- Users can view their own samples
CREATE POLICY "Users can view own style samples"
ON public.style_samples
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own samples
CREATE POLICY "Users can insert own style samples"
ON public.style_samples
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own samples
CREATE POLICY "Users can update own style samples"
ON public.style_samples
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own samples
CREATE POLICY "Users can delete own style samples"
ON public.style_samples
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES: style_chunks
-- ============================================
CREATE POLICY "Users can view own style chunks"
ON public.style_chunks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style chunks"
ON public.style_chunks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own style chunks"
ON public.style_chunks
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES: style_profiles
-- ============================================
CREATE POLICY "Users can view own style profile"
ON public.style_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style profile"
ON public.style_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own style profile"
ON public.style_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own style profile"
ON public.style_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES: writing_tasks
-- ============================================
CREATE POLICY "Users can view own writing tasks"
ON public.writing_tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own writing tasks"
ON public.writing_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own writing tasks"
ON public.writing_tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own writing tasks"
ON public.writing_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- POLICIES: task_versions
-- ============================================
-- Note: task_versions doesn't have user_id directly, so we join through writing_tasks
CREATE POLICY "Users can view own task versions"
ON public.task_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.writing_tasks
    WHERE writing_tasks.id = task_versions.task_id
    AND writing_tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own task versions"
ON public.task_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.writing_tasks
    WHERE writing_tasks.id = task_versions.task_id
    AND writing_tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own task versions"
ON public.task_versions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.writing_tasks
    WHERE writing_tasks.id = task_versions.task_id
    AND writing_tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own task versions"
ON public.task_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.writing_tasks
    WHERE writing_tasks.id = task_versions.task_id
    AND writing_tasks.user_id = auth.uid()
  )
);
