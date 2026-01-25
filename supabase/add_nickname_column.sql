-- =====================================================
-- TacticIQ - Add nickname column to user_profiles
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add nickname column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'nickname'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN nickname TEXT;
        RAISE NOTICE 'nickname column added successfully';
    ELSE
        RAISE NOTICE 'nickname column already exists';
    END IF;
END $$;

-- 2. Add unique constraint for nickname (optional but recommended)
-- This ensures no two users can have the same nickname
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_nickname_unique'
    ) THEN
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_nickname_unique UNIQUE (nickname);
        RAISE NOTICE 'nickname unique constraint added';
    ELSE
        RAISE NOTICE 'nickname unique constraint already exists';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add unique constraint (may have duplicate values): %', SQLERRM;
END $$;

-- 3. Create index for faster nickname lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname ON user_profiles(nickname);

-- 4. Update RLS policies if needed (already should be covered by existing policies)
-- No changes needed if you already have SELECT/UPDATE policies on user_profiles

-- 5. Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'nickname';
