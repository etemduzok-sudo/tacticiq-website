-- ============================================
-- Security Advisor Fixes (7+ issues)
-- ============================================
-- 1. Security Definer Views → security_invoker = true (4 views)
-- 2. RLS disabled → Enable RLS + policies (3–4 tables)
-- 3. RLS enabled but no policy → prediction_scores için politikalar
--
-- Nasıl çalıştırılır: Supabase Dashboard → SQL Editor → New query →
-- bu dosyanın içeriğini yapıştırıp Run (veya: supabase db push / migration)
-- ============================================

-- ============================================
-- PART 1: Security Definer Views → Security Invoker
-- ============================================
-- Views run as invoking user and respect RLS on base tables.

ALTER VIEW IF EXISTS public.v_active_static_teams SET (security_invoker = true);
ALTER VIEW IF EXISTS public.leaderboard SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_club_teams SET (security_invoker = true);
ALTER VIEW IF EXISTS public.v_national_teams SET (security_invoker = true);

-- ============================================
-- PART 2: Enable RLS on tables that had it disabled
-- ============================================

-- 2a. match_results (maç sonuçları – herkes okuyabilir, yazma service_role)
ALTER TABLE IF EXISTS public.match_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read match_results" ON public.match_results;
CREATE POLICY "Public can read match_results"
  ON public.match_results FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage match_results" ON public.match_results;
CREATE POLICY "Service role can manage match_results"
  ON public.match_results FOR ALL
  USING (auth.role() = 'service_role');

-- 2b. player_power_scores (oyuncu skorları – herkes okuyabilir, yazma service_role)
ALTER TABLE IF EXISTS public.player_power_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read player_power_scores" ON public.player_power_scores;
CREATE POLICY "Public can read player_power_scores"
  ON public.player_power_scores FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage player_power_scores" ON public.player_power_scores;
CREATE POLICY "Service role can manage player_power_scores"
  ON public.player_power_scores FOR ALL
  USING (auth.role() = 'service_role');

-- 2c. match_end_snapshots (maç bitiş snapshot – herkes okuyabilir, yazma service_role)
ALTER TABLE IF EXISTS public.match_end_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read match_end_snapshots" ON public.match_end_snapshots;
CREATE POLICY "Public can read match_end_snapshots"
  ON public.match_end_snapshots FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage match_end_snapshots" ON public.match_end_snapshots;
CREATE POLICY "Service role can manage match_end_snapshots"
  ON public.match_end_snapshots FOR ALL
  USING (auth.role() = 'service_role');

-- 2d. match_and_snapshots (eğer Supabase’de bu isimde tablo/view varsa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'match_and_snapshots'
  ) THEN
    EXECUTE 'ALTER TABLE public.match_and_snapshots ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Public can read match_and_snapshots" ON public.match_and_snapshots';
    EXECUTE 'CREATE POLICY "Public can read match_and_snapshots" ON public.match_and_snapshots FOR SELECT USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Service role can manage match_and_snapshots" ON public.match_and_snapshots';
    EXECUTE 'CREATE POLICY "Service role can manage match_and_snapshots" ON public.match_and_snapshots FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
END $$;

-- ============================================
-- PART 3: RLS enabled but no policy (prediction_scores)
-- ============================================
-- Tabloda RLS açık ama politika yok; kullanıcı kendi skorunu görsün, yazma service_role.

DROP POLICY IF EXISTS "Users can view own prediction_scores" ON public.prediction_scores;
CREATE POLICY "Users can view own prediction_scores"
  ON public.prediction_scores FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage prediction_scores" ON public.prediction_scores;
CREATE POLICY "Service role can manage prediction_scores"
  ON public.prediction_scores FOR ALL
  USING (auth.role() = 'service_role');
