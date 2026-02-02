// =====================================================
// LİG KAPSAMI – Ürün tarafı: Domestic Top Tier,
// Continental Club, Continental National Team
// =====================================================
// API-Football league ID'leri (api-sports.io)
// =====================================================

// 1️⃣ ÜLKELERİN EN ÜST KLASMAN ERKEK FUTBOL LİGLERİ
// Her ülkenin 1. seviye profesyonel erkek ligi
const DOMESTIC_TOP_TIER = [
  // Avrupa
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 61, name: 'Ligue 1', country: 'France' },
  { id: 203, name: 'Süper Lig', country: 'Turkey' },
  { id: 94, name: 'Primeira Liga', country: 'Portugal' },
  { id: 88, name: 'Eredivisie', country: 'Netherlands' },
  { id: 144, name: 'Jupiler Pro League', country: 'Belgium' },
  { id: 179, name: 'Premiership', country: 'Scotland' },
  { id: 235, name: 'Premier League', country: 'Russia' },
  { id: 307, name: 'Super League', country: 'Greece' },
  { id: 253, name: 'MLS', country: 'USA' },
  { id: 283, name: 'J1 League', country: 'Japan' },
  { id: 169, name: 'Super League', country: 'India' },
  { id: 207, name: 'Professional League', country: 'Saudi Arabia' },
  { id: 197, name: 'UAE Pro League', country: 'UAE' },
  { id: 271, name: 'Primera Division', country: 'Peru' },
  { id: 305, name: 'A-League', country: 'Australia' },
  { id: 271, name: 'Primera Division', country: 'Peru' },
  // Güney / Orta Amerika
  { id: 128, name: 'Liga Profesional', country: 'Argentina' },
  { id: 71, name: 'Serie A', country: 'Brazil' },
  { id: 262, name: 'Liga MX', country: 'Mexico' },
  { id: 239, name: 'Primera A', country: 'Colombia' },
  { id: 269, name: 'Primera Division', country: 'Chile' },
  { id: 268, name: 'Primera Division', country: 'Uruguay' },
  { id: 273, name: 'Serie A', country: 'Ecuador' },
  { id: 319, name: 'Premier League', country: 'South Africa' },
  { id: 174, name: 'Pro League', country: 'Egypt' },
];

// 2️⃣ KITA KULÜP TURNUVALARI (CL – Libertadores mantığı)
const CONTINENTAL_CLUB = [
  // Avrupa
  { id: 2, name: 'UEFA Champions League', country: 'World' },
  { id: 3, name: 'UEFA Europa League', country: 'World' },
  { id: 848, name: 'UEFA Europa Conference League', country: 'World' },
  { id: 829, name: 'UEFA Super Cup', country: 'World' },
  // Güney Amerika
  { id: 13, name: 'Copa Libertadores', country: 'South America' },
  { id: 137, name: 'Copa Sudamericana', country: 'South America' },
  { id: 538, name: 'Recopa Sudamericana', country: 'South America' },
  // Asya
  { id: 15, name: 'AFC Champions League', country: 'Asia' },
  // Afrika
  { id: 307, name: 'CAF Champions League', country: 'Africa' },
  { id: 301, name: 'CAF Confederation Cup', country: 'Africa' },
  // Kuzey & Orta Amerika
  { id: 384, name: 'CONCACAF Champions Cup', country: 'North America' },
  // Okyanusya
  { id: 545, name: 'OFC Champions League', country: 'Oceania' },
];

// 3️⃣ KITA MİLLÎ TAKIM TURNUVALARI (+ hazırlık maçları için takımlar zaten static_teams'de)
const CONTINENTAL_NATIONAL = [
  { id: 4, name: 'UEFA European Championship', country: 'Europe' },
  { id: 9, name: 'Copa América', country: 'South America' },
  { id: 16, name: 'AFC Asian Cup', country: 'Asia' },
  { id: 17, name: 'Africa Cup of Nations', country: 'Africa' },
  { id: 22, name: 'CONCACAF Gold Cup', country: 'North America' },
  { id: 23, name: 'OFC Nations Cup', country: 'Oceania' },
];

// 4️⃣ KITA ORGANİZASYONLARININ LİG / FORMAT BAZLI ORGANİZASYONLARI
// Lig sistemi gibi işleyen veya periyodik resmi organizasyonlar
const CONFEDERATION_LEAGUE_FORMAT = [
  // UEFA
  { id: 5, name: 'UEFA Nations League', country: 'Europe' },
  // Not: UEFA kulüp ön eleme turları ve play-off formatları genellikle ana turnuvaların parçası
  // CONMEBOL
  // Not: CONMEBOL Nations League benzeri formatlar varsa eklenebilir
  // AFC
  // Not: AFC eleme & lig benzeri turnuvalar varsa eklenebilir
  // CAF
  // Not: CAF eleme ve grup ligleri varsa eklenebilir
];

// 5️⃣ DÜNYA ÇAPINDA ORGANİZE EDİLEN TURNUVALAR
// Kıta üstü – global organizasyonlar
const GLOBAL_COMPETITIONS = [
  { id: 1, name: 'FIFA World Cup', country: 'World' },
  { id: 10, name: 'FIFA Club World Cup', country: 'World' },
  // Not: FIFA kıtalar arası play-off'lar ve eleme turnuvaları genellikle World Cup'ın parçası
];

// Tüm ligler (static teams sync için tek liste)
function getAllTrackedLeagues() {
  const byId = new Map();
  [
    ...DOMESTIC_TOP_TIER,
    ...CONTINENTAL_CLUB,
    ...CONTINENTAL_NATIONAL,
    ...CONFEDERATION_LEAGUE_FORMAT,
    ...GLOBAL_COMPETITIONS,
  ].forEach((l) => {
    if (!byId.has(l.id)) byId.set(l.id, l);
  });
  return Array.from(byId.values());
}

module.exports = {
  DOMESTIC_TOP_TIER,
  CONTINENTAL_CLUB,
  CONTINENTAL_NATIONAL,
  CONFEDERATION_LEAGUE_FORMAT,
  GLOBAL_COMPETITIONS,
  getAllTrackedLeagues,
};
