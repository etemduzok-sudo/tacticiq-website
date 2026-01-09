// Fan Manager 2026 - Supabase Configuration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase credentials from .env
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('⚠️  WARNING: Supabase credentials not found in .env');
  console.warn('   Database features will be disabled.');
  console.warn('   Add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env file.');
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Health check function
async function checkConnection() {
  if (!supabase) {
    return { connected: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('leagues')
      .select('count')
      .limit(1);

    if (error) throw error;

    return { connected: true, message: 'Supabase connection successful' };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

module.exports = {
  supabase,
  checkConnection,
  isConfigured: !!supabase,
};
