#!/usr/bin/env node
/**
 * API-Football'dan TÜM takımları çekip doğru ID'leri al
 * Bu script statik verileri API ile senkronize eder
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.FOOTBALL_API_KEY || process.env.API_FOOTBALL_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

if (!API_KEY) {
  console.error('❌ API key bulunamadı!');
  process.exit(1);
}

const headers = {
  'x-rapidapi-key': API_KEY,
  'x-rapidapi-host': 'v3.football.api-sports.io'
};

// Ligler ve ID'leri (API-Football league IDs)
const LEAGUES = {
  'Turkish Süper Lig': 203,
  'Premier League': 39,
  'La Liga': 140,
  'Bundesliga': 78,
  'Serie A': 135,
  'Ligue 1': 61,
  'Eredivisie': 88,
  'Primeira Liga': 94,
  'Argentine Primera': 128,
  'Brasileirão': 71,
  'Saudi Pro League': 307,
  'Azerbaijan Premier League': 197,
};

let requestCount = 0;

async function fetchTeamsByLeague(leagueName, leagueId) {
  try {
    console.log(`\n📥 ${leagueName} (League ID: ${leagueId})...`);
    
    const response = await axios.get(`${BASE_URL}/teams`, {
      headers,
      params: { league: leagueId, season: 2024 }
    });
    
    requestCount++;
    console.log(`   API Request #${requestCount}`);
    
    if (response.data?.response?.length > 0) {
      const teams = response.data.response.map(t => ({
        id: t.team.id,
        name: t.team.name,
        country: t.team.country,
        logo: t.team.logo,
        national: t.team.national || false
      }));
      
      console.log(`   ✅ ${teams.length} takım bulundu`);
      return { league: leagueName, leagueId, teams };
    }
    
    console.log('   ⚠️ Takım bulunamadı');
    return { league: leagueName, leagueId, teams: [] };
  } catch (error) {
    console.error(`   ❌ Hata: ${error.message}`);
    return { league: leagueName, leagueId, teams: [], error: error.message };
  }
}

async function fetchNationalTeams() {
  try {
    console.log('\n📥 Milli Takımlar...');
    
    // Önemli milli takımlar için arama
    const nationalTeamNames = [
      'Turkey', 'Germany', 'France', 'England', 'Spain', 'Italy',
      'Brazil', 'Argentina', 'Portugal', 'Netherlands', 'Belgium',
      'Croatia', 'Poland', 'Ukraine', 'Denmark', 'Switzerland'
    ];
    
    const teams = [];
    
    for (const name of nationalTeamNames) {
      const response = await axios.get(`${BASE_URL}/teams`, {
        headers,
        params: { search: name }
      });
      
      requestCount++;
      
      // Milli takımı bul (national: true olan)
      const nationalTeam = response.data?.response?.find(t => 
        t.team.national === true && 
        t.team.name.toLowerCase().includes(name.toLowerCase())
      );
      
      if (nationalTeam) {
        teams.push({
          id: nationalTeam.team.id,
          name: nationalTeam.team.name,
          country: nationalTeam.team.country,
          logo: nationalTeam.team.logo,
          national: true
        });
        console.log(`   ✅ ${nationalTeam.team.name}: ID ${nationalTeam.team.id}`);
      }
      
      // Rate limit - 10 req/min for free plan
      await new Promise(r => setTimeout(r, 200));
    }
    
    return { league: 'International', teams };
  } catch (error) {
    console.error(`   ❌ Hata: ${error.message}`);
    return { league: 'International', teams: [], error: error.message };
  }
}

async function searchSpecificTeams() {
  console.log('\n🔍 Kritik takımları doğruluyorum...');
  
  const criticalTeams = [
    'Konyaspor', 'Qarabag', 'Fenerbahce', 'Galatasaray', 'Besiktas',
    'Boca Juniors', 'River Plate', 'Las Palmas', 'Brighton', 
    'Atletico Mineiro', 'Freiburg', 'AZ Alkmaar'
  ];
  
  const results = [];
  
  for (const teamName of criticalTeams) {
    try {
      const response = await axios.get(`${BASE_URL}/teams`, {
        headers,
        params: { search: teamName }
      });
      
      requestCount++;
      
      if (response.data?.response?.length > 0) {
        // En alakalı sonucu al (isim eşleşmesi)
        const matches = response.data.response
          .filter(t => !t.team.national)
          .map(t => ({
            id: t.team.id,
            name: t.team.name,
            country: t.team.country,
            founded: t.team.founded
          }));
        
        if (matches.length > 0) {
          console.log(`   ${teamName}:`);
          matches.slice(0, 3).forEach(m => {
            console.log(`      - ID ${m.id}: ${m.name} (${m.country})`);
          });
          results.push({ search: teamName, matches: matches.slice(0, 5) });
        }
      }
      
      await new Promise(r => setTimeout(r, 200));
    } catch (error) {
      console.error(`   ❌ ${teamName}: ${error.message}`);
    }
  }
  
  return results;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   API-Football Takım ID Senkronizasyonu                ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n🔑 API Key: ***${API_KEY.slice(-8)}`);
  
  const allData = {
    fetchedAt: new Date().toISOString(),
    leagues: {},
    nationalTeams: [],
    criticalTeams: []
  };
  
  // 1. Kritik takımları ara (önce bunları yapalım - az API call)
  allData.criticalTeams = await searchSpecificTeams();
  
  // 2. Her lig için takımları çek
  for (const [leagueName, leagueId] of Object.entries(LEAGUES)) {
    const result = await fetchTeamsByLeague(leagueName, leagueId);
    allData.leagues[leagueName] = result;
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 300));
  }
  
  // 3. Milli takımları çek
  const nationalResult = await fetchNationalTeams();
  allData.nationalTeams = nationalResult.teams;
  
  // Sonuçları dosyaya kaydet
  const outputPath = path.join(__dirname, '..', 'data', 'api-football-teams.json');
  
  // data klasörü yoksa oluştur
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   SONUÇLAR                                             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Toplam API çağrısı: ${requestCount}`);
  console.log(`📁 Veri kaydedildi: ${outputPath}`);
  
  // Kritik takımların ID'lerini göster
  console.log('\n🎯 KRİTİK TAKIM ID\'LERİ:');
  for (const item of allData.criticalTeams) {
    const best = item.matches[0];
    if (best) {
      console.log(`   ${item.search}: ${best.id} (${best.name}, ${best.country})`);
    }
  }
  
  // Türk Süper Lig takımlarını göster
  console.log('\n🇹🇷 TÜRK SÜPER LİG:');
  const turkishTeams = allData.leagues['Turkish Süper Lig']?.teams || [];
  turkishTeams.forEach(t => {
    console.log(`   ${t.id}: ${t.name}`);
  });
}

main().catch(console.error);
