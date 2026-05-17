-- Permanent analytics table (never trimmed, admin-only read)
CREATE TABLE IF NOT EXISTS public.generation_analytics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Content metadata
  prompt_preview       TEXT,        -- first 300 chars only
  text_type            TEXT,
  writing_mode         TEXT,        -- research | best_effort | humanize
  citations            BOOLEAN,

  -- Word count
  word_count_target    INTEGER,     -- what user asked for
  word_count_actual    INTEGER,     -- what was delivered

  -- Quality scores (0–100, human %)
  initial_score        INTEGER,     -- score before humanize loop
  final_score          INTEGER,     -- score after full pipeline
  score_delta          INTEGER,     -- final - initial (generated column)

  -- Pipeline behaviour
  humanize_rounds      INTEGER,     -- how many humanize calls were needed
  pipeline_duration_ms INTEGER,     -- total ms from start to result
  completed            BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.generation_analytics ENABLE ROW LEVEL SECURITY;
-- No user-facing policy — only service_role can insert/read

-- Beta dashboard: one view to rule them all
CREATE OR REPLACE VIEW public.beta_dashboard AS
SELECT
  ga.id,
  ga.created_at,
  u.email,
  u.created_at                                  AS user_joined,
  ga.text_type,
  ga.writing_mode,
  ga.citations,
  ga.word_count_target,
  ga.word_count_actual,
  ga.initial_score,
  ga.final_score,
  (ga.final_score - ga.initial_score)           AS score_delta,
  ga.humanize_rounds,
  ROUND(ga.pipeline_duration_ms / 1000.0, 1)   AS duration_seconds,
  ga.completed,
  uc.credits                                    AS credits_remaining,
  uc.tos_accepted_at,
  ga.prompt_preview
FROM public.generation_analytics ga
JOIN auth.users u ON u.id = ga.user_id
LEFT JOIN public.user_credits uc ON uc.user_id = ga.user_id
ORDER BY ga.created_at DESC;
