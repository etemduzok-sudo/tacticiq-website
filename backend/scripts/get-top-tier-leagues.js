#!/usr/bin/env node
/**
 * API-Football'dan tüm 1. ligleri (top tier) doğru şekilde çek
 * Sadece her ülkenin en üst seviye erkek profesyonel ligi
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

// Bilinen 1. ligler (API ID'leri)
// Bu liste API-Football'un resmi top tier ligleri
const KNOWN_TOP_TIER_LEAGUES = {
  // Europe - Big 5
  'England': { id: 39, name: 'Premier League' },
  'Spain': { id: 140, name: 'La Liga' },
  'Germany': { id: 78, name: 'Bundesliga' },
  'Italy': { id: 135, name: 'Serie A' },
  'France': { id: 61, name: 'Ligue 1' },
  // Europe - Other
  'Netherlands': { id: 88, name: 'Eredivisie' },
  'Portugal': { id: 94, name: 'Primeira Liga' },
  'Belgium': { id: 144, name: 'Jupiler Pro League' },
  'Turkey': { id: 203, name: 'Süper Lig' },
  'Russia': { id: 235, name: 'Premier League' },
  'Ukraine': { id: 333, name: 'Premier League' },
  'Scotland': { id: 179, name: 'Premiership' },
  'Austria': { id: 218, name: 'Bundesliga' },
  'Switzerland': { id: 207, name: 'Super League' },
  'Greece': { id: 197, name: 'Super League' },
  'Denmark': { id: 119, name: 'Superliga' },
  'Norway': { id: 103, name: 'Eliteserien' },
  'Sweden': { id: 113, name: 'Allsvenskan' },
  'Poland': { id: 106, name: 'Ekstraklasa' },
  'Czech-Republic': { id: 345, name: 'Czech Liga' },
  'Croatia': { id: 210, name: 'HNL' },
  'Serbia': { id: 286, name: 'Super Liga' },
  'Romania': { id: 283, name: 'Liga I' },
  'Bulgaria': { id: 172, name: 'First League' },
  'Hungary': { id: 271, name: 'NB I' },
  'Cyprus': { id: 318, name: 'First Division' },
  'Israel': { id: 384, name: 'Ligat Ha\'al' },
  'Finland': { id: 244, name: 'Veikkausliiga' },
  'Iceland': { id: 164, name: 'Úrvalsdeild' },
  'Ireland': { id: 357, name: 'Premier Division' },
  'Northern-Ireland': { id: 408, name: 'Premiership' },
  'Wales': { id: 110, name: 'Premier League' },
  'Slovakia': { id: 332, name: 'Super Liga' },
  'Slovenia': { id: 373, name: 'PrvaLiga' },
  'Belarus': { id: 116, name: 'Premier League' },
  'Kazakhstan': { id: 387, name: 'Premier League' },
  'Azerbaijan': { id: 420, name: 'Premyer Liqa' },
  'Georgia': { id: 325, name: 'Erovnuli Liga' },
  'Armenia': { id: 342, name: 'Premier League' },
  'Moldova': { id: 441, name: 'Super Liga' },
  'Bosnia': { id: 155, name: 'Premijer Liga' },
  'North-Macedonia': { id: 428, name: 'First League' },
  'Montenegro': { id: 423, name: 'First League' },
  'Albania': { id: 310, name: 'Superliga' },
  'Kosovo': { id: 409, name: 'Superliga' },
  'Luxembourg': { id: 261, name: 'National Division' },
  'Malta': { id: 392, name: 'Premier League' },
  'Estonia': { id: 329, name: 'Meistriliiga' },
  'Latvia': { id: 363, name: 'Virsliga' },
  'Lithuania': { id: 360, name: 'A Lyga' },
  'Faroe-Islands': { id: 370, name: 'Premier League' },
  // South America
  'Brazil': { id: 71, name: 'Serie A' },
  'Argentina': { id: 128, name: 'Liga Profesional' },
  'Colombia': { id: 239, name: 'Liga BetPlay' },
  'Chile': { id: 265, name: 'Primera División' },
  'Uruguay': { id: 268, name: 'Primera División' },
  'Paraguay': { id: 274, name: 'División Profesional' },
  'Peru': { id: 281, name: 'Liga 1' },
  'Ecuador': { id: 242, name: 'Liga Pro' },
  'Venezuela': { id: 299, name: 'Primera División' },
  'Bolivia': { id: 158, name: 'División Profesional' },
  // North/Central America
  'Mexico': { id: 262, name: 'Liga MX' },
  'USA': { id: 253, name: 'MLS' },
  'Canada': { id: 253, name: 'MLS' }, // Aynı lig
  'Costa-Rica': { id: 162, name: 'Primera División' },
  'Honduras': { id: 247, name: 'Liga Nacional' },
  'Guatemala': { id: 240, name: 'Liga Nacional' },
  'El-Salvador': { id: 230, name: 'Primera División' },
  'Panama': { id: 277, name: 'Liga Panameña' },
  'Jamaica': { id: 256, name: 'Premier League' },
  // Asia
  'Japan': { id: 98, name: 'J1 League' },
  'South-Korea': { id: 292, name: 'K League 1' },
  'China': { id: 169, name: 'Super League' },
  'Saudi-Arabia': { id: 307, name: 'Pro League' },
  'United-Arab-Emirates': { id: 301, name: 'Pro League' },
  'Qatar': { id: 305, name: 'Stars League' },
  'Iran': { id: 252, name: 'Persian Gulf Pro League' },
  'Thailand': { id: 296, name: 'Thai League 1' },
  'Australia': { id: 188, name: 'A-League' },
  'India': { id: 323, name: 'Indian Super League' },
  'Indonesia': { id: 249, name: 'Liga 1' },
  'Malaysia': { id: 378, name: 'Super League' },
  'Singapore': { id: 382, name: 'Premier League' },
  'Vietnam': { id: 340, name: 'V.League 1' },
  'Iraq': { id: 254, name: 'Stars League' },
  'Jordan': { id: 258, name: 'Pro League' },
  'Kuwait': { id: 259, name: 'Premier League' },
  'Bahrain': { id: 149, name: 'Premier League' },
  'Oman': { id: 269, name: 'Professional League' },
  'Lebanon': { id: 390, name: 'Premier League' },
  'Syria': { id: 440, name: 'Premier League' },
  'Uzbekistan': { id: 352, name: 'Super League' },
  'Hong-Kong': { id: 365, name: 'Premier League' },
  // Africa
  'Egypt': { id: 233, name: 'Premier League' },
  'Morocco': { id: 200, name: 'Botola Pro' },
  'Tunisia': { id: 202, name: 'Ligue 1' },
  'Algeria': { id: 186, name: 'Ligue 1' },
  'South-Africa': { id: 288, name: 'Premier Soccer League' },
  'Nigeria': { id: 267, name: 'NPFL' },
  'Ghana': { id: 237, name: 'Premier League' },
  'Ivory-Coast': { id: 355, name: 'Ligue 1' },
  'Senegal': { id: 368, name: 'Ligue 1' },
  'Cameroon': { id: 159, name: 'Elite One' },
  'DR-Congo': { id: 228, name: 'Linafoot' },
  'Tanzania': { id: 419, name: 'Premier League' },
  'Kenya': { id: 396, name: 'Premier League' },
  'Uganda': { id: 412, name: 'Premier League' },
  'Zambia': { id: 255, name: 'Super League' },
  'Zimbabwe': { id: 351, name: 'Premier Soccer League' },
  'Angola': { id: 381, name: 'Girabola' },
  'Mozambique': { id: 372, name: 'Moçambola' },
  'Ethiopia': { id: 358, name: 'Premier League' },
  'Sudan': { id: 398, name: 'Premier League' },
  'Libya': { id: 374, name: 'Premier League' },
  'Mali': { id: 375, name: 'Première Division' },
  'Burkina-Faso': { id: 324, name: 'Premier League' },
  'Niger': { id: 400, name: 'Ligue 1' },
  'Guinea': { id: 320, name: 'Ligue 1' },
  'Benin': { id: 316, name: 'Ligue Pro' },
  'Togo': { id: 399, name: 'Championnat National' },
  'Rwanda': { id: 385, name: 'Premier League' },
  'Burundi': { id: 354, name: 'Ligue A' },
  'Malawi': { id: 376, name: 'Super League' },
  'Botswana': { id: 359, name: 'Premier League' },
  'Namibia': { id: 377, name: 'Premier League' },
  'Mauritius': { id: 397, name: 'Premier League' },
  // Oceania
  'New-Zealand': { id: 167, name: 'Premiership' },
};

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Dünya 1. Ligleri - Senkronizasyon Planı              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const leagues = Object.entries(KNOWN_TOP_TIER_LEAGUES);
  
  // Kıtalara göre grupla
  const byContinent = {
    'Europe': [],
    'South America': [],
    'North/Central America': [],
    'Asia': [],
    'Africa': [],
    'Oceania': []
  };
  
  const europeCountries = ['England', 'Spain', 'Germany', 'Italy', 'France', 'Netherlands', 'Portugal', 'Belgium', 'Turkey', 'Russia', 'Ukraine', 'Scotland', 'Austria', 'Switzerland', 'Greece', 'Denmark', 'Norway', 'Sweden', 'Poland', 'Czech-Republic', 'Croatia', 'Serbia', 'Romania', 'Bulgaria', 'Hungary', 'Cyprus', 'Israel', 'Finland', 'Iceland', 'Ireland', 'Northern-Ireland', 'Wales', 'Slovakia', 'Slovenia', 'Belarus', 'Kazakhstan', 'Azerbaijan', 'Georgia', 'Armenia', 'Moldova', 'Bosnia', 'North-Macedonia', 'Montenegro', 'Albania', 'Kosovo', 'Luxembourg', 'Malta', 'Estonia', 'Latvia', 'Lithuania', 'Faroe-Islands'];
  const southAmericaCountries = ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Uruguay', 'Paraguay', 'Peru', 'Ecuador', 'Venezuela', 'Bolivia'];
  const northAmericaCountries = ['Mexico', 'USA', 'Canada', 'Costa-Rica', 'Honduras', 'Guatemala', 'El-Salvador', 'Panama', 'Jamaica'];
  const asiaCountries = ['Japan', 'South-Korea', 'China', 'Saudi-Arabia', 'United-Arab-Emirates', 'Qatar', 'Iran', 'Thailand', 'Australia', 'India', 'Indonesia', 'Malaysia', 'Singapore', 'Vietnam', 'Iraq', 'Jordan', 'Kuwait', 'Bahrain', 'Oman', 'Lebanon', 'Syria', 'Uzbekistan', 'Hong-Kong'];
  const africaCountries = ['Egypt', 'Morocco', 'Tunisia', 'Algeria', 'South-Africa', 'Nigeria', 'Ghana', 'Ivory-Coast', 'Senegal', 'Cameroon', 'DR-Congo', 'Tanzania', 'Kenya', 'Uganda', 'Zambia', 'Zimbabwe', 'Angola', 'Mozambique', 'Ethiopia', 'Sudan', 'Libya', 'Mali', 'Burkina-Faso', 'Niger', 'Guinea', 'Benin', 'Togo', 'Rwanda', 'Burundi', 'Malawi', 'Botswana', 'Namibia', 'Mauritius'];
  const oceaniaCountries = ['New-Zealand'];
  
  for (const [country, league] of leagues) {
    const entry = { country, ...league };
    if (europeCountries.includes(country)) byContinent['Europe'].push(entry);
    else if (southAmericaCountries.includes(country)) byContinent['South America'].push(entry);
    else if (northAmericaCountries.includes(country)) byContinent['North/Central America'].push(entry);
    else if (asiaCountries.includes(country)) byContinent['Asia'].push(entry);
    else if (africaCountries.includes(country)) byContinent['Africa'].push(entry);
    else if (oceaniaCountries.includes(country)) byContinent['Oceania'].push(entry);
  }
  
  console.log('📊 1. LİG SAYILARI:');
  console.log('═'.repeat(60));
  let totalLeagues = 0;
  for (const [continent, leagueList] of Object.entries(byContinent)) {
    console.log(`   ${continent.padEnd(25)}: ${leagueList.length} lig`);
    totalLeagues += leagueList.length;
  }
  console.log('─'.repeat(60));
  console.log(`   TOPLAM                    : ${totalLeagues} lig`);
  
  // Tahmini takım sayısı (lig başına ortalama 18)
  const avgTeamsPerLeague = 18;
  const estimatedTeams = totalLeagues * avgTeamsPerLeague;
  
  console.log(`\n📊 TAHMİNİ RAKAMLAR:`);
  console.log('═'.repeat(60));
  console.log(`   Toplam lig               : ${totalLeagues}`);
  console.log(`   Tahmini takım (avg 18)   : ~${estimatedTeams}`);
  console.log(`   Tahmini oyuncu (avg 25)  : ~${estimatedTeams * 25}`);
  
  // API isteği hesabı
  console.log(`\n📡 API İSTEK HESABI:`);
  console.log('═'.repeat(60));
  console.log(`   1. Takım listesi çekme   : ${totalLeagues} istek (her lig için)`);
  console.log(`   2. Kadro çekme           : ~${estimatedTeams} istek (her takım için)`);
  console.log('─'.repeat(60));
  console.log(`   TOPLAM                   : ~${totalLeagues + estimatedTeams} istek`);
  console.log(`\n   Günlük limit             : 7,500 istek`);
  console.log(`   Güvenli günlük kullanım  : 6,000 istek (buffer)`);
  
  const daysNeeded = Math.ceil((totalLeagues + estimatedTeams) / 6000);
  console.log(`\n   ⏱️  Gereken süre          : ${daysNeeded} gün`);
  
  // Detaylı plan
  console.log(`\n\n📅 SENKRONİZASYON PLANI:`);
  console.log('═'.repeat(60));
  
  // Günlere böl
  const dailyLimit = 6000;
  let currentDay = 1;
  let currentDayRequests = 0;
  let dayPlan = { day: 1, leagues: [], estimatedRequests: 0 };
  const plan = [];
  
  for (const [continent, leagueList] of Object.entries(byContinent)) {
    for (const league of leagueList) {
      const requestsForLeague = 1 + avgTeamsPerLeague; // 1 takım listesi + N kadro
      
      if (currentDayRequests + requestsForLeague > dailyLimit) {
        plan.push({ ...dayPlan });
        currentDay++;
        currentDayRequests = 0;
        dayPlan = { day: currentDay, leagues: [], estimatedRequests: 0 };
      }
      
      dayPlan.leagues.push({
        country: league.country,
        name: league.name,
        id: league.id,
        requests: requestsForLeague
      });
      dayPlan.estimatedRequests += requestsForLeague;
      currentDayRequests += requestsForLeague;
    }
  }
  
  if (dayPlan.leagues.length > 0) {
    plan.push(dayPlan);
  }
  
  for (const day of plan) {
    console.log(`\n🗓️  GÜN ${day.day}: ~${day.estimatedRequests} istek`);
    console.log('─'.repeat(50));
    for (const league of day.leagues) {
      console.log(`   ${league.country.padEnd(20)} - ${league.name}`);
    }
  }
  
  // Özet
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log('📊 ÖZET:');
  console.log('═'.repeat(60));
  console.log(`   Toplam lig        : ${totalLeagues}`);
  console.log(`   Tahmini takım     : ~${estimatedTeams}`);
  console.log(`   Tahmini API çağrı : ~${totalLeagues + estimatedTeams}`);
  console.log(`   Gereken gün       : ${plan.length}`);
  console.log(`\n   ✅ LAZY LOADING ile kadro/maç isteğe bağlı çekilir`);
  console.log(`   ✅ Cache ile tekrar çekme önlenir (24-48 saat)`);
  console.log(`   ✅ Takım listesi tek seferde çekilir (~${totalLeagues} istek)`);
  
  // Veriyi kaydet
  const output = {
    createdAt: new Date().toISOString(),
    summary: {
      totalLeagues,
      estimatedTeams,
      estimatedApiCalls: totalLeagues + estimatedTeams,
      daysNeeded: plan.length
    },
    byContinent,
    syncPlan: plan,
    leagues: KNOWN_TOP_TIER_LEAGUES
  };
  
  const outputPath = path.join(__dirname, '..', 'data', 'top-tier-leagues-plan.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Plan kaydedildi: ${outputPath}`);
}

main().catch(console.error);
