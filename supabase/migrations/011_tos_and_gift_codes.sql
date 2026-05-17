-- TOS acceptance timestamp on user_credits
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- Update new-user trigger to capture TOS timestamp from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits, tos_accepted_at)
  VALUES (
    NEW.id,
    3,
    (NEW.raw_user_meta_data->>'tos_accepted_at')::TIMESTAMPTZ
  )
  ON CONFLICT (user_id) DO UPDATE
    SET tos_accepted_at = COALESCE(
      user_credits.tos_accepted_at,
      (NEW.raw_user_meta_data->>'tos_accepted_at')::TIMESTAMPTZ
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gift codes table
CREATE TABLE IF NOT EXISTS public.gift_codes (
  code    TEXT PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemption log (one per user per code)
CREATE TABLE IF NOT EXISTS public.code_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL REFERENCES public.gift_codes(code),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (code, user_id)
);

ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.code_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Atomic redeem function
CREATE OR REPLACE FUNCTION public.redeem_gift_code(p_user_id UUID, p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT credits INTO v_credits FROM public.gift_codes WHERE code = p_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_code');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.code_redemptions
    WHERE code = p_code AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_redeemed');
  END IF;

  UPDATE public.user_credits
    SET credits = credits + v_credits, updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.code_redemptions (code, user_id) VALUES (p_code, p_user_id);

  RETURN jsonb_build_object('success', true, 'credits_added', v_credits);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
