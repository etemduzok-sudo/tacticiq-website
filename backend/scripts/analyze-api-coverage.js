#!/usr/bin/env node
/**
 * API-Football'da desteklenen tüm 1. ligleri analiz et
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';
const headers = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

let requestCount = 0;

async function apiRequest(endpoint, params = {}) {
  requestCount++;
  console.log(`   📡 API Request #${requestCount}: ${endpoint}`);
  
  const response = await axios.get(`${BASE_URL}${endpoint}`, { headers, params });
  return response.data;
}

async function analyze() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   API-Football Kapsam Analizi                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // 1. Tüm ülkeleri çek
  console.log('🌍 Desteklenen ülkeler çekiliyor...');
  const countriesData = await apiRequest('/countries');
  const countries = countriesData.response || [];
  console.log(`   ✅ ${countries.length} ülke bulundu\n`);
  
  // 2. Tüm ligleri çek
  console.log('📋 Tüm ligler çekiliyor...');
  const leaguesData = await apiRequest('/leagues');
  const allLeagues = leaguesData.response || [];
  console.log(`   ✅ ${allLeagues.length} toplam lig/turnuva bulundu\n`);
  
  // 3. Sadece 1. lig (top tier domestic) filtrele
  const topTierLeagues = allLeagues.filter(l => {
    const league = l.league;
    const country = l.country;
    
    // Sadece lig türünde olanlar (kupa, süper kupa vs hariç)
    if (league.type !== 'League') return false;
    
    // Kadın ligleri hariç
    if (league.name.includes('Women') || league.name.includes('Feminin') || 
        league.name.includes(' W ') || league.name.endsWith(' W')) return false;
    
    // Gençlik/Rezerv ligleri hariç
    if (league.name.includes('U19') || league.name.includes('U21') || 
        league.name.includes('U23') || league.name.includes('Reserve') ||
        league.name.includes('Youth') || league.name.includes('Junior')) return false;
    
    // 2. lig ve altı hariç (isimde "2", "Second", "B" vs varsa)
    const lowerName = league.name.toLowerCase();
    if (lowerName.includes('division 2') || lowerName.includes('segunda') ||
        lowerName.includes('serie b') || lowerName.includes('2. liga') ||
        lowerName.includes('championship') || lowerName.includes('league one') ||
        lowerName.includes('league two') || lowerName.includes('third') ||
        lowerName.includes('national league') || lowerName.includes('regional')) return false;
    
    return true;
  });
  
  // 4. Ülke başına sadece 1 lig (en üst) seç
  const countryTopLeagues = {};
  for (const l of topTierLeagues) {
    const countryName = l.country.name;
    if (!countryTopLeagues[countryName]) {
      countryTopLeagues[countryName] = l;
    }
  }
  
  const finalLeagues = Object.values(countryTopLeagues);
  
  console.log('📊 ANALİZ SONUÇLARI:');
  console.log('═'.repeat(60));
  console.log(`   Toplam ülke: ${countries.length}`);
  console.log(`   Toplam lig/turnuva: ${allLeagues.length}`);
  console.log(`   1. Lig (filtrelenmiş): ${topTierLeagues.length}`);
  console.log(`   Ülke başına 1 lig: ${finalLeagues.length}`);
  
  // 5. Kıtalara göre grupla
  const byContinent = {
    'Europe': [],
    'South America': [],
    'North America': [],
    'Asia': [],
    'Africa': [],
    'Oceania': [],
    'Other': []
  };
  
  // Kıta mapping (basit)
  const europeanCountries = ['Albania', 'Andorra', 'Armenia', 'Austria', 'Azerbaijan', 'Belarus', 'Belgium', 'Bosnia', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech-Republic', 'Denmark', 'England', 'Estonia', 'Faroe-Islands', 'Finland', 'France', 'Georgia', 'Germany', 'Gibraltar', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Israel', 'Italy', 'Kazakhstan', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North-Macedonia', 'Northern-Ireland', 'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San-Marino', 'Scotland', 'Serbia', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'Wales'];
  const southAmericanCountries = ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Peru', 'Uruguay', 'Venezuela'];
  const northAmericanCountries = ['Canada', 'Costa-Rica', 'Cuba', 'Dominican-Republic', 'El-Salvador', 'Guatemala', 'Haiti', 'Honduras', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama', 'Trinidad-And-Tobago', 'USA'];
  const asianCountries = ['Afghanistan', 'Australia', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia', 'China', 'Chinese-Taipei', 'Guam', 'Hong-Kong', 'India', 'Indonesia', 'Iran', 'Iraq', 'Japan', 'Jordan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon', 'Macau', 'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North-Korea', 'Oman', 'Pakistan', 'Palestine', 'Philippines', 'Qatar', 'Saudi-Arabia', 'Singapore', 'South-Korea', 'Sri-Lanka', 'Syria', 'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkmenistan', 'United-Arab-Emirates', 'Uzbekistan', 'Vietnam', 'Yemen'];
  const africanCountries = ['Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina-Faso', 'Burundi', 'Cameroon', 'Cape-Verde', 'Central-African-Republic', 'Chad', 'Comoros', 'Congo', 'Congo-DR', 'Djibouti', 'Egypt', 'Equatorial-Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory-Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao-Tome-And-Principe', 'Senegal', 'Seychelles', 'Sierra-Leone', 'Somalia', 'South-Africa', 'South-Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'];
  const oceaniaCountries = ['Fiji', 'New-Caledonia', 'New-Zealand', 'Papua-New-Guinea', 'Samoa', 'Solomon-Islands', 'Tahiti', 'Tonga', 'Vanuatu'];
  
  for (const l of finalLeagues) {
    const country = l.country.name;
    if (europeanCountries.includes(country)) byContinent['Europe'].push(l);
    else if (southAmericanCountries.includes(country)) byContinent['South America'].push(l);
    else if (northAmericanCountries.includes(country)) byContinent['North America'].push(l);
    else if (asianCountries.includes(country)) byContinent['Asia'].push(l);
    else if (africanCountries.includes(country)) byContinent['Africa'].push(l);
    else if (oceaniaCountries.includes(country)) byContinent['Oceania'].push(l);
    else byContinent['Other'].push(l);
  }
  
  console.log('\n🌍 KITALARA GÖRE DAĞILIM:');
  for (const [continent, leagues] of Object.entries(byContinent)) {
    if (leagues.length > 0) {
      console.log(`   ${continent}: ${leagues.length} lig`);
    }
  }
  
  // 6. Tahmini takım sayısı
  const estimatedTeams = finalLeagues.length * 18; // Ortalama 18 takım/lig
  console.log(`\n📊 TAHMİNİ TOPLAM TAKIM: ~${estimatedTeams}`);
  
  // 7. API isteği hesabı
  console.log('\n📡 API İSTEK HESABI:');
  console.log('═'.repeat(60));
  console.log(`   Lig listesi: 1 istek (zaten yapıldı)`);
  console.log(`   Takım listesi (her lig için): ${finalLeagues.length} istek`);
  console.log(`   Kadro (her takım için): ~${estimatedTeams} istek`);
  console.log(`   ─────────────────────────────────`);
  console.log(`   TOPLAM: ~${finalLeagues.length + estimatedTeams + 1} istek`);
  console.log(`\n   Günlük limit: 7,500`);
  console.log(`   Gereken gün: ${Math.ceil((finalLeagues.length + estimatedTeams) / 7000)} gün`);
  
  // 8. Sonuçları dosyaya kaydet
  const output = {
    analyzedAt: new Date().toISOString(),
    summary: {
      totalCountries: countries.length,
      totalLeagues: allLeagues.length,
      topTierLeagues: finalLeagues.length,
      estimatedTeams: estimatedTeams,
      estimatedApiCalls: finalLeagues.length + estimatedTeams + 1,
      estimatedDays: Math.ceil((finalLeagues.length + estimatedTeams) / 7000)
    },
    byContinent: {},
    leagues: finalLeagues.map(l => ({
      id: l.league.id,
      name: l.league.name,
      country: l.country.name,
      logo: l.league.logo,
      flag: l.country.flag
    }))
  };
  
  for (const [continent, leagues] of Object.entries(byContinent)) {
    output.byContinent[continent] = leagues.map(l => ({
      id: l.league.id,
      name: l.league.name,
      country: l.country.name
    }));
  }
  
  const outputPath = path.join(__dirname, '..', 'data', 'world-leagues-analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Sonuçlar kaydedildi: ${outputPath}`);
  
  // 9. Örnek ligler
  console.log('\n📋 ÖRNEK LİGLER (ilk 30):');
  console.log('─'.repeat(60));
  for (const l of finalLeagues.slice(0, 30)) {
    console.log(`   ${l.league.id.toString().padStart(4)}: ${l.country.name.padEnd(20)} - ${l.league.name}`);
  }
  
  console.log(`\n   ... ve ${finalLeagues.length - 30} lig daha`);
}

analyze().then(() => {
  console.log(`\n✅ Analiz tamamlandı. Toplam API isteği: ${requestCount}`);
  process.exit(0);
}).catch(e => {
  console.error('❌ Hata:', e.message);
  process.exit(1);
});
