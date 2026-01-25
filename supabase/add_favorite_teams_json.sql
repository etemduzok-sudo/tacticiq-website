-- =====================================================
-- Migration: Add favorite_teams_json column
-- Favori takımları tam detaylarıyla (id, name, logo, colors, type) saklamak için
-- =====================================================

-- 1. Yeni sütun ekle (text olarak - JSON string saklayacak)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS favorite_teams_json TEXT;

-- 2. Mevcut favorite_teams array'inden migration (opsiyonel)
-- NOT: Mevcut favorite_teams sadece takım isimleri içeriyordu,
-- yeni format tam obje içerecek. Manuel migration gerekebilir.

-- 3. Index ekle (arama performansı için)
CREATE INDEX IF NOT EXISTS idx_user_profiles_favorite_teams_json 
ON user_profiles USING GIN ((favorite_teams_json::jsonb));

-- =====================================================
-- Bu SQL'i Supabase SQL Editor'da çalıştırın:
-- 1. Supabase Dashboard'a gidin
-- 2. SQL Editor'ı açın
-- 3. Bu dosyanın içeriğini yapıştırın
-- 4. "Run" butonuna tıklayın
-- =====================================================
