-- ============================================
-- TACTICIQ - BASE TABLES
-- ============================================
-- Temel kullanıcı tabloları (önce bunları çalıştırın)
-- ============================================

-- 1. USERS TABLE
-- Kullanıcı bilgileri
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  avatar VARCHAR(500),
  is_pro BOOLEAN DEFAULT false,
  pro_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================

-- 2. USER_STATS TABLE
-- Kullanıcı istatistikleri
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Badges
  badges JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- ============================================

-- 3. FAVORITE_TEAMS TABLE
-- Kullanıcının favori takımları
CREATE TABLE IF NOT EXISTS favorite_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL,
  team_name VARCHAR(100) NOT NULL,
  team_logo VARCHAR(500),
  added_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, team_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_favorite_teams_user_id ON favorite_teams(user_id);

-- ============================================

-- 4. RLS POLICIES

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_teams ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can view their own stats
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own favorite teams
CREATE POLICY "Users can view own favorite teams"
  ON favorite_teams FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own favorite teams
CREATE POLICY "Users can insert own favorite teams"
  ON favorite_teams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorite teams
CREATE POLICY "Users can delete own favorite teams"
  ON favorite_teams FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 5. TRIGGERS

-- Update users.updated_at on change
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Update user_stats.updated_at on change
CREATE OR REPLACE FUNCTION update_user_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_updated_at();

-- Auto-create user_stats when user is created
CREATE OR REPLACE FUNCTION create_user_stats_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_stats_on_signup
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats_on_signup();

-- ============================================

-- 6. SAMPLE DATA (for testing)

-- Insert test user
INSERT INTO users (id, email, username, full_name, avatar)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@tacticiq.com',
  'testuser',
  'Test User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser'
)
ON CONFLICT (id) DO NOTHING;

-- user_stats will be auto-created by trigger

-- ============================================

COMMENT ON TABLE users IS 'Kullanıcı bilgileri';
COMMENT ON TABLE user_stats IS 'Kullanıcı istatistikleri';
COMMENT ON TABLE favorite_teams IS 'Kullanıcının favori takımları';

-- ============================================
-- BASE TABLES CREATION COMPLETE
-- ============================================

SELECT 'Base tables created successfully!' AS status;
