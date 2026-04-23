-- Beta: 3 credits per user, no top-up
ALTER TABLE public.user_credits ALTER COLUMN credits SET DEFAULT 3;

-- Update new user trigger to give 3 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 3)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cap existing users who still have the full 10 to 3
-- (only affects users who haven't used any credits yet)
UPDATE public.user_credits SET credits = 3 WHERE credits = 10;
