CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own rate limit records (read-only, server manages writes)
CREATE POLICY "Users can view own rate limits"
ON public.rate_limits FOR SELECT
USING (auth.uid() = user_id);

-- Atomic check-and-increment. Returns TRUE if request is allowed, FALSE if rate limited.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  rec RECORD;
  window_cutoff TIMESTAMPTZ;
BEGIN
  window_cutoff := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  SELECT * INTO rec
  FROM public.rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint
  FOR UPDATE;

  IF rec IS NULL THEN
    -- First request ever for this user+endpoint
    INSERT INTO public.rate_limits (user_id, endpoint, count, window_start)
    VALUES (p_user_id, p_endpoint, 1, NOW());
    RETURN TRUE;
  END IF;

  IF rec.window_start < window_cutoff THEN
    -- Window expired — reset
    UPDATE public.rate_limits
    SET count = 1, window_start = NOW()
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN TRUE;
  END IF;

  IF rec.count >= p_max_requests THEN
    -- Rate limited
    RETURN FALSE;
  END IF;

  -- Increment within current window
  UPDATE public.rate_limits
  SET count = count + 1
  WHERE user_id = p_user_id AND endpoint = p_endpoint;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
