#!/usr/bin/env node
/**
 * Önümüzdeki 6 saat içinde başlayacak maçları listeler.
 * Canlı maç testleri için kullanılır (25K API kotası).
 * Kullanım: node backend/scripts/list-matches-next-6h.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const axios = require('axios');
const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

function toYYYYMMDD(d) {
  return d.toISOString().split('T')[0];
}

async function listMatchesNext6Hours() {
  const now = new Date();
  const end6h = new Date(now.getTime() + SIX_HOURS_MS);

  const fromDate = toYYYYMMDD(now);
  // Yarını da ekle (6 saat gece yarısını geçebilir)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const toDate = toYYYYMMDD(end6h.getTime() > tomorrow.getTime() ? tomorrow : end6h);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ÖNÜMÜZDEKİ 6 SAAT İÇİNDE OYNANACAK MAÇLAR');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Şu an (UTC):     ${now.toISOString()}`);
  console.log(`6 saat sonra:    ${end6h.toISOString()}`);
  console.log(`Tarih aralığı:   ${fromDate} → ${toDate}\n`);

  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('Hata: FOOTBALL_API_KEY .env içinde tanımlı değil.');
    process.exit(1);
  }

  let rawResponse;
  try {
    const res = await axios.get(`${BASE_URL}/fixtures`, {
      headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' },
      params: { from: fromDate, to: toDate },
    });
    rawResponse = res.data?.response || [];
  } catch (err) {
    console.error('API hatası:', err.message, err.response?.data ? err.response.data : '');
    process.exit(1);
  }

  console.log(`📡 API'den ham: ${rawResponse.length} maç\n`);

  if (rawResponse.length === 0) {
    console.log('Bu tarih aralığında API maç döndürmedi. Tarih veya lig kapsamını kontrol edin.\n');
    return;
  }

  const all = rawResponse;
  const inNext6h = all.filter((m) => {
    const fd = new Date(m.fixture.date);
    return fd >= now && fd <= end6h;
  });

  inNext6h.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

  if (inNext6h.length === 0) {
    console.log('6 saat içinde maç yok; bugün/yarın gelen ilk 10 maç (saat UTC):\n');
    const sorted = [...all].sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
    sorted.slice(0, 10).forEach((m, i) => {
      const fd = new Date(m.fixture.date);
      const home = m.teams?.home?.name || '?';
      const away = m.teams?.away?.name || '?';
      const league = m.league?.name || '?';
      console.log(`   ${i + 1}. ${fd.toISOString()}  ${home} – ${away}  (${league})`);
    });
    console.log('\nYukarıdaki saatler 6 saat pencerenin dışında; maç saati yaklaşınca tekrar çalıştırın.\n');
    return;
  }

  console.log(`Toplam ${inNext6h.length} maç bulundu:\n`);
  inNext6h.forEach((m, i) => {
    const fd = new Date(m.fixture.date);
    const timeStr = fd.toLocaleString('tr-TR', {
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false,
    });
    const league = m.league?.name || '?';
    const home = m.teams?.home?.name || '?';
    const away = m.teams?.away?.name || '?';
    const id = m.fixture?.id ?? '?';
    console.log(`${(i + 1).toString().padStart(2)}. [${id}] ${home} – ${away}`);
    console.log(`    Lig: ${league}  |  Başlangıç: ${timeStr}\n`);
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Canlı test için yukarıdaki maç ID’lerini kullanabilirsiniz.');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

listMatchesNext6Hours().catch((err) => {
  console.error(err);
  process.exit(1);
});
