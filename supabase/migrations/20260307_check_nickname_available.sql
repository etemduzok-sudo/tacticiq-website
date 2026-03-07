-- Kullanıcı adı (nickname) müsaitlik kontrolü – RLS bypass (sadece true/false döner)
-- Profil ekranında anlık uygunluk + yeşil tik için kullanılır

CREATE OR REPLACE FUNCTION public.check_nickname_available(
  p_nickname text,
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_nickname IS NULL OR length(trim(p_nickname)) < 3 THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE lower(trim(nickname)) = lower(trim(p_nickname))
      AND (p_user_id IS NULL OR id != p_user_id)
      AND nickname IS NOT NULL
      AND trim(nickname) != ''
  );
END;
$$;

COMMENT ON FUNCTION public.check_nickname_available IS 'Nickname müsait mi? (current user hariç). Sadece boolean döner, veri sızmaz.';

GRANT EXECUTE ON FUNCTION public.check_nickname_available TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_nickname_available TO anon;
