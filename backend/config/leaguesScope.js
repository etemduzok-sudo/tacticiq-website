// =====================================================
// LİG KAPSAMI – TacticIQ
// =====================================================
// API-Football league ID'leri (api-sports.io)
//
// Kapsamdaki kategoriler:
// 1. Üst lig (her ülkenin 1. erkek profesyonel ligi)
// 2. 2. lig (büyük ülkeler – kupa eşleşmeleri + küme düşme/çıkma)
// 3. Yerel kupalar (Ziraat Kupası, FA Cup, Copa del Rey vb.)
// 4. Süper kupalar (Community Shield, Supercopa vb.)
// 5. Kıta kulüp turnuvaları (CL, EL, Libertadores vb.)
// 6. Kıta milli takım turnuvaları (EURO, Copa América vb.)
// 7. Konfederasyon formatı (UEFA Nations League)
// 8. Global (FIFA World Cup, Club World Cup)
// =====================================================

// 1️⃣ ÜLKELERİN EN ÜST KLASMAN ERKEK FUTBOL LİGLERİ
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

// 1.5️⃣ BÜYÜK ÜLKELERİN 2. LİGLERİ (kupa eşleşmeleri + küme düşme/çıkma takibi)
const DOMESTIC_SECOND_TIER = [
  { id: 204, name: '1. Lig', country: 'Turkey' },
  { id: 40, name: 'Championship', country: 'England' },
  { id: 141, name: 'Segunda División', country: 'Spain' },
  { id: 136, name: 'Serie B', country: 'Italy' },
  { id: 79, name: '2. Bundesliga', country: 'Germany' },
  { id: 62, name: 'Ligue 2', country: 'France' },
  { id: 95, name: 'Segunda Liga', country: 'Portugal' },
  { id: 89, name: 'Eerste Divisie', country: 'Netherlands' },
  { id: 145, name: 'Challenger Pro League', country: 'Belgium' },
  { id: 180, name: 'Championship', country: 'Scotland' },
  { id: 72, name: 'Serie B', country: 'Brazil' },
  { id: 129, name: 'Primera Nacional', country: 'Argentina' },
];

// 2️⃣ YEREL KUPALAR (Domestic Cups) — erkek profesyonel
const DOMESTIC_CUP = [
  // Türkiye
  { id: 206, name: 'Türkiye Kupası', country: 'Turkey' },
  // İngiltere
  { id: 45, name: 'FA Cup', country: 'England' },
  { id: 48, name: 'League Cup', country: 'England' },
  { id: 46, name: 'EFL Trophy', country: 'England' },
  // İspanya
  { id: 143, name: 'Copa del Rey', country: 'Spain' },
  // İtalya
  { id: 137, name: 'Coppa Italia', country: 'Italy' },
  // Almanya
  { id: 81, name: 'DFB Pokal', country: 'Germany' },
  // Fransa
  { id: 66, name: 'Coupe de France', country: 'France' },
  { id: 65, name: 'Coupe de la Ligue', country: 'France' },
  // Portekiz
  { id: 96, name: 'Taça de Portugal', country: 'Portugal' },
  { id: 97, name: 'Taça da Liga', country: 'Portugal' },
  // Hollanda
  { id: 90, name: 'KNVB Beker', country: 'Netherlands' },
  // Belçika
  { id: 147, name: 'Cup', country: 'Belgium' },
  // İskoçya
  { id: 181, name: 'FA Cup', country: 'Scotland' },
  { id: 185, name: 'League Cup', country: 'Scotland' },
  // Brezilya
  { id: 73, name: 'Copa Do Brasil', country: 'Brazil' },
  { id: 612, name: 'Copa do Nordeste', country: 'Brazil' },
  // Arjantin
  { id: 130, name: 'Copa Argentina', country: 'Argentina' },
  { id: 1032, name: 'Copa de la Liga Profesional', country: 'Argentina' },
  // Meksika
  { id: 264, name: 'Copa MX', country: 'Mexico' },
  // ABD
  { id: 257, name: 'US Open Cup', country: 'USA' },
  // Japonya
  { id: 101, name: 'J-League Cup', country: 'Japan' },
  { id: 102, name: 'Emperor Cup', country: 'Japan' },
  // Güney Kore
  { id: 294, name: 'FA Cup', country: 'South-Korea' },
  // Suudi Arabistan
  { id: 504, name: "King's Cup", country: 'Saudi-Arabia' },
  { id: 827, name: 'Crown Prince Cup', country: 'Saudi-Arabia' },
  // Çin
  { id: 171, name: 'FA Cup', country: 'China' },
  // Avustralya
  { id: 874, name: 'Australia Cup', country: 'Australia' },
];

// 2.5️⃣ SÜPER KUPALAR (Sezon başı/sonu şampiyon vs kupa galibi)
const DOMESTIC_SUPER_CUP = [
  { id: 551, name: 'Super Cup', country: 'Turkey' },
  { id: 528, name: 'Community Shield', country: 'England' },
  { id: 556, name: 'Super Cup', country: 'Spain' },
  { id: 547, name: 'Super Cup', country: 'Italy' },
  { id: 529, name: 'Super Cup', country: 'Germany' },
  { id: 526, name: 'Trophée des Champions', country: 'France' },
  { id: 550, name: 'Super Cup', country: 'Portugal' },
  { id: 543, name: 'Super Cup', country: 'Netherlands' },
  { id: 519, name: 'Super Cup', country: 'Belgium' },
  { id: 632, name: 'Supercopa do Brasil', country: 'Brazil' },
  { id: 810, name: 'Super Copa', country: 'Argentina' },
  { id: 517, name: 'Trofeo de Campeones', country: 'Argentina' },
  { id: 857, name: 'Campeón de Campeones', country: 'Mexico' },
  { id: 548, name: 'Super Cup', country: 'Japan' },
  { id: 826, name: 'Super Cup', country: 'Saudi-Arabia' },
  { id: 972, name: 'Super Cup', country: 'China' },
  { id: 896, name: 'Super Cup', country: 'United-Arab-Emirates' },
  { id: 905, name: 'Super Cup', country: 'Iran' },
  { id: 539, name: 'Super Cup', country: 'Egypt' },
  { id: 516, name: 'Super Cup', country: 'Algeria' },
  { id: 678, name: 'Super Cup', country: 'Ukraine' },
  { id: 663, name: 'Super Cup', country: 'Russia' },
  { id: 925, name: 'Super Cup', country: 'Czech-Republic' },
  { id: 727, name: 'Super Cup', country: 'Poland' },
  { id: 555, name: 'Supercupa', country: 'Romania' },
  { id: 656, name: 'Super Cup', country: 'Bulgaria' },
  { id: 659, name: 'Super Cup', country: 'Israel' },
  { id: 1021, name: 'Super Cup', country: 'Croatia' },
  { id: 557, name: 'Super Cup', country: 'Norway' },
  { id: 530, name: 'Super Cup', country: 'Georgia' },
  { id: 812, name: 'Super Cup', country: 'Belarus' },
  { id: 654, name: 'Super Cup', country: 'Armenia' },
  { id: 818, name: 'Super Cup', country: 'Kazakhstan' },
  { id: 852, name: 'Super Cup', country: 'Cyprus' },
  { id: 639, name: 'Super Cup', country: 'Iceland' },
  { id: 839, name: 'Super Cup', country: 'Lithuania' },
  { id: 1176, name: 'Super Cup', country: 'Latvia' },
  { id: 1177, name: 'Super Cup', country: 'Faroe-Islands' },
  { id: 527, name: 'Super Cup', country: 'Chile' },
  { id: 853, name: 'Supercopa de Ecuador', country: 'Ecuador' },
  { id: 558, name: 'Supercopa', country: 'Peru' },
  { id: 961, name: 'Supercopa', country: 'Paraguay' },
  { id: 1181, name: 'Supercopa', country: 'Venezuela' },
  { id: 864, name: 'Supercopa', country: 'Costa-Rica' },
  { id: 838, name: 'Super Cup', country: 'Jordan' },
  { id: 944, name: 'Super Cup', country: 'Oman' },
  { id: 719, name: 'Super Cup', country: 'Kuwait' },
  { id: 1109, name: 'Super Cup', country: 'Bahrain' },
  { id: 830, name: 'Super Cup', country: 'Uzbekistan' },
  { id: 831, name: 'Super Cup', country: 'Vietnam' },
  { id: 545, name: 'AIFF Super Cup', country: 'India' },
  { id: 1194, name: 'Super Cup', country: 'Tunisia' },
  { id: 1144, name: 'Super Cup', country: 'Ghana' },
  { id: 1166, name: 'Super Cup', country: 'Cameroon' },
  { id: 1193, name: 'Super Cup', country: 'Kenya' },
  { id: 1192, name: 'Super Cup', country: 'Angola' },
  { id: 1210, name: 'Super Cup', country: 'Greece' },
  { id: 708, name: 'Super Cup', country: 'Albania' },
  { id: 819, name: 'Super Cup', country: 'Kosovo' },
  { id: 1050, name: 'Super Cup', country: 'Malta' },
  { id: 1019, name: 'Charity Shield', country: 'Northern-Ireland' },
];

// 3️⃣ KITA KULÜP TURNUVALARI
const CONTINENTAL_CLUB = [
  { id: 2, name: 'UEFA Champions League', country: 'World' },
  { id: 3, name: 'UEFA Europa League', country: 'World' },
  { id: 848, name: 'UEFA Europa Conference League', country: 'World' },
  { id: 531, name: 'UEFA Super Cup', country: 'World' },
  { id: 13, name: 'Copa Libertadores', country: 'South America' },
  { id: 137, name: 'Copa Sudamericana', country: 'South America' },
  { id: 538, name: 'Recopa Sudamericana', country: 'South America' },
  { id: 15, name: 'AFC Champions League', country: 'Asia' },
  { id: 545, name: 'OFC Champions League', country: 'Oceania' },
  { id: 533, name: 'CAF Super Cup', country: 'Africa' },
];

// 4️⃣ KITA MİLLÎ TAKIM TURNUVALARI
const CONTINENTAL_NATIONAL = [
  { id: 4, name: 'UEFA European Championship', country: 'Europe' },
  { id: 9, name: 'Copa América', country: 'South America' },
  { id: 16, name: 'AFC Asian Cup', country: 'Asia' },
  { id: 17, name: 'Africa Cup of Nations', country: 'Africa' },
  { id: 22, name: 'CONCACAF Gold Cup', country: 'North America' },
  { id: 23, name: 'OFC Nations Cup', country: 'Oceania' },
];

// 5️⃣ KONFEDERASYON LİG FORMATI
const CONFEDERATION_LEAGUE_FORMAT = [
  { id: 5, name: 'UEFA Nations League', country: 'Europe' },
];

// 6️⃣ GLOBAL TURNUVALAR
const GLOBAL_COMPETITIONS = [
  { id: 1, name: 'FIFA World Cup', country: 'World' },
  { id: 10, name: 'FIFA Club World Cup', country: 'World' },
];

// Tüm izlenen lig/kupa/turnuva (static teams sync için tek liste – aynı id ilk gelenle tutulur)
function getAllTrackedLeagues() {
  const byId = new Map();
  [
    ...DOMESTIC_TOP_TIER,
    ...DOMESTIC_SECOND_TIER,
    ...DOMESTIC_CUP,
    ...DOMESTIC_SUPER_CUP,
    ...CONTINENTAL_CLUB,
    ...CONTINENTAL_NATIONAL,
    ...CONFEDERATION_LEAGUE_FORMAT,
    ...GLOBAL_COMPETITIONS,
  ].forEach((l) => {
    if (!byId.has(l.id)) byId.set(l.id, l);
  });
  return Array.from(byId.values());
}

// Sadece lig ID seti (hızlı lookup için)
function getAllTrackedLeagueIds() {
  return new Set(getAllTrackedLeagues().map(l => l.id));
}

module.exports = {
  DOMESTIC_TOP_TIER,
  DOMESTIC_SECOND_TIER,
  DOMESTIC_CUP,
  DOMESTIC_SUPER_CUP,
  CONTINENTAL_CLUB,
  CONTINENTAL_NATIONAL,
  CONFEDERATION_LEAGUE_FORMAT,
  GLOBAL_COMPETITIONS,
  getAllTrackedLeagues,
  getAllTrackedLeagueIds,
};
