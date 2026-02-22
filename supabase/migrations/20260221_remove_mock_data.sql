-- Mock/test verileri kaldır: test_matches tablosunu boşalt (gerçek canlı maçlar API'den gelir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_matches') THEN
    TRUNCATE test_matches;
  END IF;
END $$;
