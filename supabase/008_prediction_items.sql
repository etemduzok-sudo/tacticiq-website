-- ============================================
-- TACTICIQ - PREDICTION_ITEMS (type/value per row)
-- ============================================
-- Tahminler kaydedilirken prediction_type / prediction_value ile
-- satır bazlı kayıt için kullanılır. predictions tablosunda bu
-- sütunlar yoksa bu migration'ı çalıştırın.
-- Supabase SQL Editor'da çalıştırın.
-- ============================================

CREATE TABLE IF NOT EXISTS public.prediction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  match_id TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  prediction_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prediction_items_user_id ON public.prediction_items(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_items_match_id ON public.prediction_items(match_id);
CREATE INDEX IF NOT EXISTS idx_prediction_items_created_at ON public.prediction_items(created_at DESC);

ALTER TABLE public.prediction_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own prediction_items" ON public.prediction_items;
CREATE POLICY "Users can view own prediction_items" ON public.prediction_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prediction_items" ON public.prediction_items;
CREATE POLICY "Users can insert own prediction_items" ON public.prediction_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prediction_items" ON public.prediction_items;
CREATE POLICY "Users can delete own prediction_items" ON public.prediction_items
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.prediction_items IS 'TacticIQ maç/oyuncu tahminleri (satır bazlı type/value)';
