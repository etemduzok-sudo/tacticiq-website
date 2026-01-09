-- ============================================
-- CREATE TEST USER
-- ============================================

-- Test user oluştur
INSERT INTO users (id, email, username, full_name, avatar)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@fanmanager.com',
  'testuser',
  'Test User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  avatar = EXCLUDED.avatar;

-- user_stats otomatik oluşturulacak (trigger sayesinde)

SELECT 'Test user created successfully!' AS status;
