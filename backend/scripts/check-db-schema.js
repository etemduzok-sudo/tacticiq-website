#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

async function check() {
  // Get one row to see columns
  const { data, error } = await supabase
    .from('static_teams')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error);
    return;
  }
  
  if (data && data[0]) {
    console.log('static_teams columns:');
    console.log(Object.keys(data[0]).join('\n'));
  }
}

check();
