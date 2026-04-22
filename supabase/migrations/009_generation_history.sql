CREATE TABLE IF NOT EXISTS public.generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  draft TEXT NOT NULL,
  score INTEGER,
  word_count INTEGER,
  text_type TEXT,
  writing_mode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own history"
ON public.generation_history
USING (auth.uid() = user_id);

-- Keep only 10 most recent entries per user after insert
CREATE OR REPLACE FUNCTION public.trim_generation_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.generation_history
  WHERE user_id = NEW.user_id
    AND id NOT IN (
      SELECT id FROM public.generation_history
      WHERE user_id = NEW.user_id
      ORDER BY created_at DESC
      LIMIT 10
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trim_history_after_insert
AFTER INSERT ON public.generation_history
FOR EACH ROW EXECUTE FUNCTION public.trim_generation_history();
