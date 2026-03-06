// Check Real Data Flow Script
// Tests if real data is coming from Supabase, Backend, or Mock

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';
const SUPABASE_URL = 'https://tacticiq.supabase.co';

async function checkBackend() {
  try {
    console.log('🔍 Checking Backend...');
    const response = await fetch(`${API_BASE_URL}/matches/live`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is running!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Data count: ${data.data?.length || 0}`);
      return true;
    } else {
      console.log('❌ Backend returned error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is not reachable:', error.message);
    return false;
  }
}

async function checkSupabase() {
  try {
    console.log('🔍 Checking Supabase...');
    const SUPABASE_ANON_KEY = 'sb_publishable_FBjrFxJXCZYGW6UXWueORQ_8WZf8W9H';
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/matches?select=*&status_short=in.(1H,2H,HT,ET,BT,P,LIVE)&limit=5`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Supabase is accessible!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Data count: ${data.length || 0}`);
      return true;
    } else {
      console.log('❌ Supabase returned error:', response.status);
      const text = await response.text();
      console.log('   Error:', text.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase is not reachable:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n========================================');
  console.log('REAL DATA CHECK');
  console.log('========================================\n');
  
  const backendOk = await checkBackend();
  console.log('');
  const supabaseOk = await checkSupabase();
  
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Backend: ${backendOk ? '✅ OK' : '❌ FAIL'}`);
  console.log(`Supabase: ${supabaseOk ? '✅ OK' : '❌ FAIL'}`);
  
  if (backendOk && supabaseOk) {
    console.log('\n✅ Real data sources are available!');
    console.log('   App will use: Supabase → Backend → Mock');
  } else if (backendOk) {
    console.log('\n⚠️ Only Backend is available');
    console.log('   App will use: Backend → Mock');
  } else if (supabaseOk) {
    console.log('\n⚠️ Only Supabase is available');
    console.log('   App will use: Supabase → Mock');
  } else {
    console.log('\n❌ No real data sources available');
    console.log('   App will use: Mock data only');
  }
  console.log('\n');
}

main().catch(console.error);
