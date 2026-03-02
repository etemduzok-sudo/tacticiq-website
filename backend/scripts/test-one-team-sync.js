#!/usr/bin/env node
/**
 * Tek takım sync testi: DB gerçekten güncelleniyor mu?
 * Kullanım: node scripts/test-one-team-sync.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const { syncOneTeamSquad } = require('../services/squadSyncService');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('1. Coach veya renk eksik bir takim bulunuyor...');
  const { data: rows } = await supabase
    .from('static_teams')
    .select('api_football_id, name, coach, colors_primary')
    .or('coach.is.null,colors_primary.is.null')
    .limit(1);
  if (!rows?.length) {
    console.log('   Eksik takim yok.');
    return;
  }
  const t = rows[0];
  const id = t.api_football_id;
  console.log('   Takim:', id, t.name, '| coach:', t.coach ?? 'null', '| colors_primary:', t.colors_primary ?? 'null');

  console.log('\n2. Hafif sync calistiriliyor (coachAndColorsOnly: true)...');
  const result = await syncOneTeamSquad(id, t.name, { syncCoach: true, syncTeamInfo: true, coachAndColorsOnly: true });
  console.log('   Sonuc:', JSON.stringify(result, null, 2));

  console.log('\n3. DB tekrar kontrol...');
  const { data: after } = await supabase.from('static_teams').select('api_football_id, name, coach, colors_primary').eq('api_football_id', id).single();
  console.log('   Sonra:', after?.coach ?? 'null', '|', after?.colors_primary ?? 'null');

  const coachOk = (t.coach == null && after?.coach != null) || (t.coach != null && after?.coach != null);
  const colorsOk = (t.colors_primary == null && after?.colors_primary != null) || (t.colors_primary != null && after?.colors_primary != null);
  if (coachOk || colorsOk) {
    console.log('\n   OK: DB guncellendi.');
  } else {
    console.log('\n   UYARI: DB guncellenmedi - sync yazmiyor veya eslesme yok.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
