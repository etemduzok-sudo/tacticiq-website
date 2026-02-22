#!/usr/bin/env node
/**
 * Tek takım: Koçu null olan bir takımı bul, API'den koç al (veya test string yaz), DB'ye yaz, select ile doğrula.
 * Çalıştır: node scripts/test-one-coach-update.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('HATA: SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY .env içinde yok.');
    process.exit(1);
  }

  // 1) Koçu null olan ilk takım
  const { data: teams, error: e1 } = await supabase
    .from('static_teams')
    .select('api_football_id, name')
    .is('coach', null)
    .not('api_football_id', 'is', null)
    .limit(1);

  if (e1) {
    console.error('Sorgu hatası:', e1.message);
    process.exit(1);
  }
  if (!teams || teams.length === 0) {
    console.log('Koçu eksik takım kalmadı.');
    process.exit(0);
  }

  const t = teams[0];
  const tid = Number(t.api_football_id) || t.api_football_id;
  console.log('Takım:', tid, t.name);

  // 2) API'den koç dene
  let coachName = null;
  try {
    const footballApi = require('../services/footballApi');
    const coachData = await footballApi.getTeamCoach(tid);
    if (coachData?.response?.length > 0) {
      const coaches = coachData.response;
      const active = coaches.find(c => c.career?.some(car => car.team?.id == tid && !car.end)) || coaches[0];
      coachName = active?.name || null;
      if (coachName) console.log('API koç:', coachName);
    }
  } catch (apiErr) {
    console.warn('API hatası (test yazısı yazılacak):', apiErr.message);
  }

  if (!coachName) coachName = 'TestCoach_' + Date.now();

  // 3) DB'ye yaz
  const { data: updated, error: e2 } = await supabase
    .from('static_teams')
    .update({
      coach: coachName,
      last_updated: new Date().toISOString(),
    })
    .eq('api_football_id', tid)
    .select('api_football_id, coach, last_updated');

  if (e2) {
    console.error('DB yazma hatası:', e2.message, e2.code);
    process.exit(1);
  }

  console.log('DB güncellendi (select ile doğrulama):', updated);
  if (updated && updated[0] && updated[0].coach === coachName) {
    console.log('OK: DB güncelleme çalışıyor. Rapor bir sonraki 5 dk\'da Coach +1 gösterebilir.');
  } else {
    console.log('UYARI: Select sonucu beklenti ile uyuşmuyor.');
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
