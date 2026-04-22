-- Add refund token columns to user_credits
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS refund_token TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Updated deduct_credit: now accepts and stores a one-time refund token
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID, p_token TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits INTO current_credits
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL THEN
    INSERT INTO public.user_credits (user_id, credits)
    VALUES (p_user_id, 0);
    RETURN FALSE;
  END IF;

  IF current_credits <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_credits
  SET credits = credits - 1,
      updated_at = NOW(),
      refund_token = p_token,
      token_expires_at = CASE WHEN p_token IS NOT NULL THEN NOW() + INTERVAL '30 minutes' ELSE NULL END
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refund using a one-time token (validates ownership, expiry, and single-use)
CREATE OR REPLACE FUNCTION public.refund_with_token(p_user_id UUID, p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_token TEXT;
  expires_at TIMESTAMPTZ;
BEGIN
  SELECT refund_token, token_expires_at INTO stored_token, expires_at
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF stored_token IS NULL OR stored_token != p_token THEN
    RETURN FALSE;
  END IF;

  IF expires_at IS NOT NULL AND expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  UPDATE public.user_credits
  SET credits = credits + 1,
      updated_at = NOW(),
      refund_token = NULL,
      token_expires_at = NULL
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
