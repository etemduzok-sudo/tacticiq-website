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
  // Türk takımlarını sorgula
  const { data: teams, error } = await supabase
    .from('static_teams')
    .select('api_football_id, name, country, league')
    .in('api_football_id', [549, 564, 607, 611, 645, 994, 996, 998, 1001, 1002, 1004, 1005, 1007, 3563, 3573, 3575, 3583, 3588, 3603]);
  
  if (error) {
    console.log('Error:', error);
    return;
  }
  
  console.log('Türk takımları DB\'de:');
  console.log(JSON.stringify(teams, null, 2));
  console.log('\nToplam:', teams?.length || 0);
  
  // Kadrolar
  const { data: squads } = await supabase
    .from('team_squads')
    .select('team_id, team_name')
    .in('team_id', [549, 564, 607, 611, 645, 994, 996, 998, 1001, 1002, 1004, 1005, 1007, 3563, 3573, 3575, 3583, 3588, 3603]);
  
  console.log('\nKadrosu olan Türk takımları:', squads?.length || 0);
}

check();
