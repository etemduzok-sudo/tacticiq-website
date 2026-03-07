#!/usr/bin/env node
/**
 * Başlangıç rating'leri: team_squads'taki TÜM oyuncular için
 * API-Football istatistiklerinden rating + 6 öznitelik hesaplayıp players tablosuna yazar.
 *
 * Bugünkü tüm API hakkı (7500/gün) kullanılır; limit dolunca ilerleme kaydedilir, yarın devam.
 * Kullanım: node scripts/seed-initial-player-ratings.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const footballApi = require('../services/footballApi');
const { calculatePlayerAttributesFromStats } = require('../utils/playerRatingFromStats');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const SEASON = 2025;
const RATE_MS = 200;
const PROGRESS_FILE = path.join(__dirname, '..', 'data', 'seed-ratings-progress.json');
const API_DAILY_LIMIT = 75000;
const MAX_API_THIS_RUN = 40000; // Günün geri kalanı için 35K rezerv bırak

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_KEY gerekli');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

/** team_squads.players JSONB'den tüm benzersiz oyuncu id'lerini topla */
async function getAllPlayerIdsFromSquads() {
  const { data: rows, error } = await supabase
    .from('team_squads')
    .select('players');
  if (error) {
    console.error('❌ team_squads okunamadı:', error.message);
    return [];
  }
  const ids = new Set();
  for (const row of rows || []) {
    const players = row.players;
    if (Array.isArray(players)) {
      players.forEach((p) => {
        const id = p.id ?? p.player?.id;
        if (id) ids.add(Number(id));
      });
    }
  }
  return Array.from(ids);
}

/** players tablosunda rating'i dolu olan id'ler */
async function getPlayerIdsWithRating() {
  const { data, error } = await supabase
    .from('players')
    .select('id')
    .not('rating', 'is', null);
  if (error) return new Set();
  return new Set((data || []).map((r) => r.id));
}

/** Tek oyuncu: API'den istatistik al, hesapla, DB'ye yaz */
async function seedOnePlayer(playerId) {
  const res = await footballApi.getPlayerInfo(playerId, SEASON);
  const raw = res?.response?.[0];
  if (!raw?.statistics?.length) return { ok: false, reason: 'no_stats' };

  const latestStats = raw.statistics[0];
  const playerData = raw.player || {};
  const attrs = calculatePlayerAttributesFromStats(latestStats, playerData);

  const { error } = await supabase
    .from('players')
    .upsert({
      id: playerId,
      name: playerData.name || `Player ${playerId}`,
      firstname: playerData.firstname || null,
      lastname: playerData.lastname || null,
      age: playerData.age || null,
      nationality: playerData.nationality || null,
      position: playerData.position || null,
      rating: attrs.rating,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) return { ok: false, reason: error.message };
  return { ok: true, rating: attrs.rating };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   BAŞLANGIÇ RATING SEED – team_squads → API → players          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const allIds = await getAllPlayerIdsFromSquads();
  const withRating = await getPlayerIdsWithRating();
  const toProcess = allIds.filter((id) => !withRating.has(id));

  console.log(`📋 Kadrolardan oyuncu: ${allIds.length}`);
  console.log(`✅ Zaten rating’i olan: ${withRating.size}`);
  console.log(`⏳ İşlenecek: ${toProcess.length}`);
  console.log(`📡 API: Günlük ${API_DAILY_LIMIT} hak, bu oturumda en fazla ${MAX_API_THIS_RUN} kullanılacak.\n`);

  let startIndex = 0;
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      startIndex = Math.min(p.lastIndex + 1, toProcess.length);
      if (startIndex > 0) console.log(`🔄 Kaldığı yerden: ${startIndex}/${toProcess.length}\n`);
    } catch (e) {}
  }

  const dataDir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  let apiCount = 0;
  let saved = 0;
  let noStats = 0;
  let errors = 0;

  for (let i = startIndex; i < toProcess.length; i++) {
    if (apiCount >= MAX_API_THIS_RUN) {
      console.log(`\n⚠️ Günlük API kotasına yaklaşıldı (${apiCount} kullanıldı). Yarın tekrar çalıştırınca kaldığı yerden devam eder.`);
      break;
    }

    const playerId = toProcess[i];
    try {
      const result = await seedOnePlayer(playerId);
      apiCount++;
      if (result.ok) {
        saved++;
        if (saved % 50 === 0) console.log(`   ✅ ${saved} oyuncu kaydedildi (rating: ${result.rating}) | API: ${apiCount}/${MAX_API_THIS_RUN}`);
      } else {
        if (result.reason === 'no_stats') noStats++;
        else errors++;
      }
    } catch (err) {
      if (err.message && (err.message.includes('7500') || err.message.includes('rate limit'))) {
        console.log(`\n⚠️ Günlük API limiti doldu. İlerleme kaydedildi. Yarın devam edin.`);
        break;
      }
      errors++;
    }

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
      lastIndex: i,
      total: toProcess.length,
      saved,
      noStats,
      errors,
      apiCount,
      updatedAt: new Date().toISOString(),
    }, null, 2));

    await new Promise((r) => setTimeout(r, RATE_MS));
  }

  if (saved + noStats + errors >= toProcess.length - startIndex || apiCount >= MAX_API_THIS_RUN) {
    try {
      if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
    } catch (e) {}
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`✅ Bitti: ${saved} güncellendi, ${noStats} istatistik yok, ${errors} hata`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
