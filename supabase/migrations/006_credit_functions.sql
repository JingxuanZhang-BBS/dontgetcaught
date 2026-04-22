-- Atomic credit deduction (prevents race conditions with concurrent requests)
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID)
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
  SET credits = credits - 1, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refund one credit (called when generation fails or scores below threshold)
CREATE OR REPLACE FUNCTION public.refund_credit(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_credits
  SET credits = credits + 1, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
