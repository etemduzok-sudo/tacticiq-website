-- =====================================================
-- Topluluk oyuncu rating oyları
-- =====================================================
-- Kullanıcılar oyuncu kartında rating verebilir.
-- n >= 2 oy toplandığında gösterilen rating: (10*R_api + n*R_user_avg)/(10+n)
-- =====================================================

CREATE TABLE IF NOT EXISTS player_community_ratings (
    id BIGSERIAL PRIMARY KEY,
    player_id BIGINT NOT NULL,
    user_id TEXT NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_player_community_ratings_player_id ON player_community_ratings(player_id);
CREATE INDEX IF NOT EXISTS idx_player_community_ratings_user_id ON player_community_ratings(user_id);

COMMENT ON TABLE player_community_ratings IS 'Topluluk oyuncu rating oyları. n>=2 olunca display rating = (10*R_api + n*avg)/(10+n).';
