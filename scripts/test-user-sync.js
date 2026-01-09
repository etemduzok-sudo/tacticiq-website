// Test User Sync Script
// Tests if user changes are being saved to database

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jxdgiskusjljlpzvrzau.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FBjrFxJXCZYGW6UXWueORQ_8WZf8W9H';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUserSync() {
  console.log('\n========================================');
  console.log('USER SYNC TEST');
  console.log('========================================\n');
  
  // Test user data
  const testUserId = 'pro-test-user-id-' + Date.now();
  const testUser = {
    id: testUserId,
    username: 'pro',
    email: 'pro@test.com',
    total_points: 1000,
    accuracy: 75.5,
    current_streak: 5,
  };
  
  console.log('1. Creating test user in DB...');
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') {
        console.log('⚠️ User already exists, fetching...');
        const { data: existing } = await supabase
          .from('users')
          .select('*')
          .eq('username', 'pro')
          .single();
        console.log('✅ Existing user:', existing);
        return;
      }
      throw error;
    }
    
    console.log('✅ User created:', data.username);
    console.log('   ID:', data.id);
    console.log('   Points:', data.total_points);
    
    // Test update
    console.log('\n2. Testing user update...');
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ total_points: 2000, current_streak: 10 })
      .eq('id', testUserId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    console.log('✅ User updated:');
    console.log('   New Points:', updated.total_points);
    console.log('   New Streak:', updated.current_streak);
    
    // Test fetch
    console.log('\n3. Testing user fetch...');
    const { data: fetched, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (fetchError) throw fetchError;
    
    console.log('✅ User fetched:');
    console.log('   Username:', fetched.username);
    console.log('   Points:', fetched.total_points);
    console.log('   Streak:', fetched.current_streak);
    console.log('   Is Pro:', fetched.is_pro);
    
    console.log('\n========================================');
    console.log('✅ USER SYNC TEST PASSED!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
  }
}

testUserSync();
