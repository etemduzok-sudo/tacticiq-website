// =====================================================
// LİG KAPSAMI – Ürün tarafı: Domestic Top Tier,
// Continental Club, Continental National Team
// =====================================================
// API-Football league ID'leri (api-sports.io)
// Kaynak: top-tier-leagues-plan.json (tüm üst ligler tek yerde)
// =====================================================

// 1️⃣ ÜLKELERİN EN ÜST KLASMAN ERKEK FUTBOL LİGLERİ
// Her ülkenin 1. seviye profesyonel erkek ligi – eksiksiz liste
const DOMESTIC_TOP_TIER = [
  // —— Avrupa ——
  { id: 39, name: 'Premier League', country: 'England' },
  { id: 140, name: 'La Liga', country: 'Spain' },
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 135, name: 'Serie A', country: 'Italy' },
  { id: 61, name: 'Ligue 1', country: 'France' },
  { id: 88, name: 'Eredivisie', country: 'Netherlands' },
  { id: 94, name: 'Primeira Liga', country: 'Portugal' },
  { id: 144, name: 'Jupiler Pro League', country: 'Belgium' },
  { id: 203, name: 'Süper Lig', country: 'Turkey' },
  { id: 235, name: 'Premier League', country: 'Russia' },
  { id: 333, name: 'Premier League', country: 'Ukraine' },
  { id: 179, name: 'Premiership', country: 'Scotland' },
  { id: 218, name: 'Bundesliga', country: 'Austria' },
  { id: 207, name: 'Super League', country: 'Switzerland' },
  { id: 197, name: 'Super League', country: 'Greece' },
  { id: 119, name: 'Superliga', country: 'Denmark' },
  { id: 103, name: 'Eliteserien', country: 'Norway' },
  { id: 113, name: 'Allsvenskan', country: 'Sweden' },
  { id: 106, name: 'Ekstraklasa', country: 'Poland' },
  { id: 345, name: 'Czech Liga', country: 'Czech-Republic' },
  { id: 210, name: 'HNL', country: 'Croatia' },
  { id: 286, name: 'Super Liga', country: 'Serbia' },
  { id: 283, name: 'Liga I', country: 'Romania' },
  { id: 172, name: 'First League', country: 'Bulgaria' },
  { id: 271, name: 'NB I', country: 'Hungary' },
  { id: 318, name: 'First Division', country: 'Cyprus' },
  { id: 384, name: "Ligat Ha'al", country: 'Israel' },
  { id: 244, name: 'Veikkausliiga', country: 'Finland' },
  { id: 164, name: 'Úrvalsdeild', country: 'Iceland' },
  { id: 357, name: 'Premier Division', country: 'Ireland' },
  { id: 408, name: 'Premiership', country: 'Northern-Ireland' },
  { id: 110, name: 'Premier League', country: 'Wales' },
  { id: 332, name: 'Super Liga', country: 'Slovakia' },
  { id: 373, name: 'PrvaLiga', country: 'Slovenia' },
  { id: 116, name: 'Premier League', country: 'Belarus' },
  { id: 387, name: 'Premier League', country: 'Kazakhstan' },
  { id: 420, name: 'Premyer Liqa', country: 'Azerbaijan' },
  { id: 325, name: 'Erovnuli Liga', country: 'Georgia' },
  { id: 342, name: 'Premier League', country: 'Armenia' },
  { id: 441, name: 'Super Liga', country: 'Moldova' },
  { id: 155, name: 'Premijer Liga', country: 'Bosnia' },
  { id: 428, name: 'First League', country: 'North-Macedonia' },
  { id: 423, name: 'First League', country: 'Montenegro' },
  { id: 310, name: 'Superliga', country: 'Albania' },
  { id: 409, name: 'Superliga', country: 'Kosovo' },
  { id: 261, name: 'National Division', country: 'Luxembourg' },
  { id: 392, name: 'Premier League', country: 'Malta' },
  { id: 329, name: 'Meistriliiga', country: 'Estonia' },
  { id: 363, name: 'Virsliga', country: 'Latvia' },
  { id: 360, name: 'A Lyga', country: 'Lithuania' },
  { id: 370, name: 'Premier League', country: 'Faroe-Islands' },
  // —— Güney Amerika ——
  { id: 71, name: 'Serie A', country: 'Brazil' },
  { id: 128, name: 'Liga Profesional', country: 'Argentina' },
  { id: 239, name: 'Liga BetPlay', country: 'Colombia' },
  { id: 265, name: 'Primera División', country: 'Chile' },
  { id: 268, name: 'Primera División', country: 'Uruguay' },
  { id: 274, name: 'División Profesional', country: 'Paraguay' },
  { id: 281, name: 'Liga 1', country: 'Peru' },
  { id: 242, name: 'Liga Pro', country: 'Ecuador' },
  { id: 299, name: 'Primera División', country: 'Venezuela' },
  { id: 158, name: 'División Profesional', country: 'Bolivia' },
  // —— Kuzey / Orta Amerika ——
  { id: 262, name: 'Liga MX', country: 'Mexico' },
  { id: 253, name: 'MLS', country: 'USA' },
  { id: 162, name: 'Primera División', country: 'Costa-Rica' },
  { id: 247, name: 'Liga Nacional', country: 'Honduras' },
  { id: 240, name: 'Liga Nacional', country: 'Guatemala' },
  { id: 230, name: 'Primera División', country: 'El-Salvador' },
  { id: 277, name: 'Liga Panameña', country: 'Panama' },
  { id: 256, name: 'Premier League', country: 'Jamaica' },
  // —— Asya ——
  { id: 98, name: 'J1 League', country: 'Japan' },
  { id: 292, name: 'K League 1', country: 'South-Korea' },
  { id: 169, name: 'Super League', country: 'China' },
  { id: 307, name: 'Pro League', country: 'Saudi-Arabia' },
  { id: 301, name: 'Pro League', country: 'United-Arab-Emirates' },
  { id: 305, name: 'Stars League', country: 'Qatar' },
  { id: 252, name: 'Persian Gulf Pro League', country: 'Iran' },
  { id: 296, name: 'Thai League 1', country: 'Thailand' },
  { id: 188, name: 'A-League', country: 'Australia' },
  { id: 323, name: 'Indian Super League', country: 'India' },
  { id: 249, name: 'Liga 1', country: 'Indonesia' },
  { id: 378, name: 'Super League', country: 'Malaysia' },
  { id: 382, name: 'Premier League', country: 'Singapore' },
  { id: 340, name: 'V.League 1', country: 'Vietnam' },
  { id: 254, name: 'Stars League', country: 'Iraq' },
  { id: 258, name: 'Pro League', country: 'Jordan' },
  { id: 259, name: 'Premier League', country: 'Kuwait' },
  { id: 149, name: 'Premier League', country: 'Bahrain' },
  { id: 269, name: 'Professional League', country: 'Oman' },
  { id: 390, name: 'Premier League', country: 'Lebanon' },
  { id: 440, name: 'Premier League', country: 'Syria' },
  { id: 352, name: 'Super League', country: 'Uzbekistan' },
  { id: 365, name: 'Premier League', country: 'Hong-Kong' },
  // —— Afrika ——
  { id: 233, name: 'Premier League', country: 'Egypt' },
  { id: 200, name: 'Botola Pro', country: 'Morocco' },
  { id: 202, name: 'Ligue 1', country: 'Tunisia' },
  { id: 186, name: 'Ligue 1', country: 'Algeria' },
  { id: 288, name: 'Premier Soccer League', country: 'South-Africa' },
  { id: 267, name: 'NPFL', country: 'Nigeria' },
  { id: 237, name: 'Premier League', country: 'Ghana' },
  { id: 355, name: 'Ligue 1', country: 'Ivory-Coast' },
  { id: 368, name: 'Ligue 1', country: 'Senegal' },
  { id: 159, name: 'Elite One', country: 'Cameroon' },
  { id: 228, name: 'Linafoot', country: 'DR-Congo' },
  { id: 419, name: 'Premier League', country: 'Tanzania' },
  { id: 396, name: 'Premier League', country: 'Kenya' },
  { id: 412, name: 'Premier League', country: 'Uganda' },
  { id: 255, name: 'Super League', country: 'Zambia' },
  { id: 351, name: 'Premier Soccer League', country: 'Zimbabwe' },
  { id: 381, name: 'Girabola', country: 'Angola' },
  { id: 372, name: 'Moçambola', country: 'Mozambique' },
  { id: 358, name: 'Premier League', country: 'Ethiopia' },
  { id: 398, name: 'Premier League', country: 'Sudan' },
  { id: 374, name: 'Premier League', country: 'Libya' },
  { id: 375, name: 'Première Division', country: 'Mali' },
  { id: 324, name: 'Premier League', country: 'Burkina-Faso' },
  { id: 400, name: 'Ligue 1', country: 'Niger' },
  { id: 320, name: 'Ligue 1', country: 'Guinea' },
  { id: 316, name: 'Ligue Pro', country: 'Benin' },
  { id: 399, name: 'Championnat National', country: 'Togo' },
  { id: 385, name: 'Premier League', country: 'Rwanda' },
  { id: 354, name: 'Ligue A', country: 'Burundi' },
  { id: 376, name: 'Super League', country: 'Malawi' },
  { id: 359, name: 'Premier League', country: 'Botswana' },
  { id: 377, name: 'Premier League', country: 'Namibia' },
  { id: 397, name: 'Premier League', country: 'Mauritius' },
  // —— Okyanusya ——
  { id: 167, name: 'Premiership', country: 'New-Zealand' },
];

// 1.5️⃣ YEREL KUPALAR (Domestic Cups)
const DOMESTIC_CUP = [
  { id: 206, name: 'Türkiye Kupası', country: 'Turkey' },
  { id: 45, name: 'FA Cup', country: 'England' },
  { id: 48, name: 'EFL Cup', country: 'England' },
  { id: 143, name: 'Copa del Rey', country: 'Spain' },
  { id: 135, name: 'Coppa Italia', country: 'Italy' },
  { id: 81, name: 'DFB-Pokal', country: 'Germany' },
  { id: 66, name: 'Coupe de France', country: 'France' },
  { id: 99, name: 'Taça de Portugal', country: 'Portugal' },
  { id: 90, name: 'KNVB Beker', country: 'Netherlands' },
];

// 2️⃣ KITA KULÜP TURNUVALARI
// Not: 307=Saudi, 301=UAE, 384=Israel (domestic). CAF CL/Conf & CONCACAF doğru ID ile sonra eklenebilir.
const CONTINENTAL_CLUB = [
  { id: 2, name: 'UEFA Champions League', country: 'World' },
  { id: 3, name: 'UEFA Europa League', country: 'World' },
  { id: 848, name: 'UEFA Europa Conference League', country: 'World' },
  { id: 829, name: 'UEFA Super Cup', country: 'World' },
  { id: 13, name: 'Copa Libertadores', country: 'South America' },
  { id: 137, name: 'Copa Sudamericana', country: 'South America' },
  { id: 538, name: 'Recopa Sudamericana', country: 'South America' },
  { id: 15, name: 'AFC Champions League', country: 'Asia' },
  { id: 545, name: 'OFC Champions League', country: 'Oceania' },
];

// 3️⃣ KITA MİLLÎ TAKIM TURNUVALARI
const CONTINENTAL_NATIONAL = [
  { id: 4, name: 'UEFA European Championship', country: 'Europe' },
  { id: 9, name: 'Copa América', country: 'South America' },
  { id: 16, name: 'AFC Asian Cup', country: 'Asia' },
  { id: 17, name: 'Africa Cup of Nations', country: 'Africa' },
  { id: 22, name: 'CONCACAF Gold Cup', country: 'North America' },
  { id: 23, name: 'OFC Nations Cup', country: 'Oceania' },
];

const CONFEDERATION_LEAGUE_FORMAT = [
  { id: 5, name: 'UEFA Nations League', country: 'Europe' },
];

const GLOBAL_COMPETITIONS = [
  { id: 1, name: 'FIFA World Cup', country: 'World' },
  { id: 10, name: 'FIFA Club World Cup', country: 'World' },
];

// Tüm ligler (static teams sync için tek liste – aynı id ilk gelenle tutulur)
function getAllTrackedLeagues() {
  const byId = new Map();
  [
    ...DOMESTIC_TOP_TIER,
    ...DOMESTIC_CUP,
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
  DOMESTIC_CUP,
  CONTINENTAL_CLUB,
  CONTINENTAL_NATIONAL,
  CONFEDERATION_LEAGUE_FORMAT,
  GLOBAL_COMPETITIONS,
  getAllTrackedLeagues,
};
