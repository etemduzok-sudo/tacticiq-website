/**
 * Static Teams Data - API-Football ID'leri ile senkronize
 * Son güncelleme: 2026-02-02
 * Kaynak: API-Football v3 (https://v3.football.api-sports.io)
 */

export interface StaticTeam {
  id: number;
  name: string;
  country: string;
  league: string;
  type: 'club' | 'national';
  colors: string[];
}

// ==========================================
// TURKISH SÜPER LİG - API-Football IDs
// ==========================================
const SUPER_LIG: StaticTeam[] = [
  { id: 611, name: 'Fenerbahçe', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FFED00', '#00205B'] },
  { id: 645, name: 'Galatasaray', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FF0000', '#FFD700'] },
  { id: 549, name: 'Beşiktaş', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 998, name: 'Trabzonspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#632134', '#00BFFF'] },
  { id: 564, name: 'Başakşehir', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#F37021', '#000000'] },
  { id: 3563, name: 'Adana Demirspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#0000FF', '#FFFFFF'] },
  { id: 1005, name: 'Antalyaspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 607, name: 'Konyaspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 1002, name: 'Sivasspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 1004, name: 'Kasımpaşa', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#000066', '#FFFFFF'] },
  { id: 994, name: 'Göztepe', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FFD700', '#C8102E'] },
  { id: 1001, name: 'Kayserispor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FF0000', '#FFD700'] },
  { id: 1007, name: 'Rizespor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#006633', '#0000FF'] },
  { id: 3575, name: 'Hatayspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#006633', '#C8102E'] },
  { id: 3603, name: 'Samsunspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#C8102E', '#FFFFFF'] },
  { id: 3573, name: 'Gaziantep FK', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#C8102E', '#000000'] },
  { id: 996, name: 'Alanyaspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FF6600', '#006633'] },
  { id: 3588, name: 'Eyüpspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FFD700', '#000000'] },
  { id: 3583, name: 'BB Bodrumspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#1E90FF', '#FFFFFF'] },
];

// ==========================================
// PREMIER LEAGUE - API-Football IDs
// ==========================================
const PREMIER_LEAGUE: StaticTeam[] = [
  { id: 50, name: 'Manchester City', country: 'England', league: 'Premier League', type: 'club', colors: ['#6CABDD', '#1C2C5B'] },
  { id: 33, name: 'Manchester United', country: 'England', league: 'Premier League', type: 'club', colors: ['#DA291C', '#FBE122'] },
  { id: 40, name: 'Liverpool', country: 'England', league: 'Premier League', type: 'club', colors: ['#C8102E', '#00B2A9'] },
  { id: 42, name: 'Arsenal', country: 'England', league: 'Premier League', type: 'club', colors: ['#EF0107', '#FFFFFF'] },
  { id: 49, name: 'Chelsea', country: 'England', league: 'Premier League', type: 'club', colors: ['#034694', '#FFFFFF'] },
  { id: 47, name: 'Tottenham', country: 'England', league: 'Premier League', type: 'club', colors: ['#132257', '#FFFFFF'] },
  { id: 66, name: 'Aston Villa', country: 'England', league: 'Premier League', type: 'club', colors: ['#670E36', '#95BFE5'] },
  { id: 34, name: 'Newcastle', country: 'England', league: 'Premier League', type: 'club', colors: ['#241F20', '#FFFFFF'] },
  { id: 48, name: 'West Ham', country: 'England', league: 'Premier League', type: 'club', colors: ['#7A263A', '#1BB1E7'] },
  { id: 51, name: 'Brighton', country: 'England', league: 'Premier League', type: 'club', colors: ['#0057B8', '#FFFFFF'] },
  { id: 52, name: 'Crystal Palace', country: 'England', league: 'Premier League', type: 'club', colors: ['#1B458F', '#C4122E'] },
  { id: 55, name: 'Brentford', country: 'England', league: 'Premier League', type: 'club', colors: ['#E30613', '#FFB81C'] },
  { id: 36, name: 'Fulham', country: 'England', league: 'Premier League', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 39, name: 'Wolves', country: 'England', league: 'Premier League', type: 'club', colors: ['#FDB913', '#231F20'] },
  { id: 35, name: 'Bournemouth', country: 'England', league: 'Premier League', type: 'club', colors: ['#DA291C', '#000000'] },
  { id: 65, name: 'Nottingham Forest', country: 'England', league: 'Premier League', type: 'club', colors: ['#DD0000', '#FFFFFF'] },
  { id: 45, name: 'Everton', country: 'England', league: 'Premier League', type: 'club', colors: ['#003399', '#FFFFFF'] },
  { id: 46, name: 'Leicester', country: 'England', league: 'Premier League', type: 'club', colors: ['#003090', '#FDBE11'] },
  { id: 41, name: 'Southampton', country: 'England', league: 'Premier League', type: 'club', colors: ['#D71920', '#FFFFFF'] },
  { id: 57, name: 'Ipswich', country: 'England', league: 'Premier League', type: 'club', colors: ['#0000FF', '#FFFFFF'] },
];

// ==========================================
// LA LIGA - API-Football IDs
// ==========================================
const LA_LIGA: StaticTeam[] = [
  { id: 541, name: 'Real Madrid', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFFFFF', '#00529F'] },
  { id: 529, name: 'Barcelona', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#004D98', '#A50044'] },
  { id: 530, name: 'Atletico Madrid', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#CB3524', '#FFFFFF'] },
  { id: 536, name: 'Sevilla', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#F43333', '#FFFFFF'] },
  { id: 533, name: 'Villarreal', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFE667', '#005487'] },
  { id: 548, name: 'Real Sociedad', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#143C8B', '#FFFFFF'] },
  { id: 543, name: 'Real Betis', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#00954C', '#FFFFFF'] },
  { id: 531, name: 'Athletic Bilbao', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#EE2523', '#FFFFFF'] },
  { id: 532, name: 'Valencia', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFFFFF', '#EE7D00'] },
  { id: 534, name: 'Las Palmas', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFD700', '#0000FF'] },
  { id: 547, name: 'Girona', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#CD2534', '#FFFFFF'] },
  { id: 727, name: 'Osasuna', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#D91A21', '#000066'] },
  { id: 538, name: 'Celta Vigo', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#8AC3EE', '#FFFFFF'] },
  { id: 798, name: 'Mallorca', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#E20E17', '#000000'] },
  { id: 728, name: 'Rayo Vallecano', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFFFFF', '#E30613'] },
  { id: 546, name: 'Getafe', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#005999', '#FFFFFF'] },
  { id: 542, name: 'Alaves', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#0039A6', '#FFFFFF'] },
  { id: 540, name: 'Espanyol', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#007FC8', '#FFFFFF'] },
  { id: 537, name: 'Leganes', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#0055A5', '#FFFFFF'] },
  { id: 720, name: 'Valladolid', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#6F2C91', '#FFFFFF'] },
];

// ==========================================
// BUNDESLIGA - API-Football IDs
// ==========================================
const BUNDESLIGA: StaticTeam[] = [
  { id: 157, name: 'Bayern Munich', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#DC052D', '#FFFFFF'] },
  { id: 165, name: 'Borussia Dortmund', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#FDE100', '#000000'] },
  { id: 168, name: 'Bayer Leverkusen', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#E32221', '#000000'] },
  { id: 173, name: 'RB Leipzig', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#DD0741', '#FFFFFF'] },
  { id: 169, name: 'Eintracht Frankfurt', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#E1000F', '#000000'] },
  { id: 172, name: 'VfB Stuttgart', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#E32219', '#FFFFFF'] },
  { id: 161, name: 'VfL Wolfsburg', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#65B32E', '#FFFFFF'] },
  { id: 163, name: 'Borussia Mönchengladbach', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 160, name: 'SC Freiburg', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#E2001A', '#000000'] },
  { id: 167, name: '1899 Hoffenheim', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#1961B5', '#FFFFFF'] },
  { id: 182, name: 'Union Berlin', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#EB1923', '#FFFFFF'] },
  { id: 162, name: 'Werder Bremen', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#1D9053', '#FFFFFF'] },
  { id: 170, name: 'FC Augsburg', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#BA3733', '#FFFFFF'] },
  { id: 164, name: 'FSV Mainz 05', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#C3141E', '#FFFFFF'] },
  { id: 176, name: 'VfL Bochum', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#005BA1', '#FFFFFF'] },
  { id: 180, name: '1. FC Heidenheim', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#E30613', '#0046AA'] },
  { id: 186, name: 'FC St. Pauli', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#6D4C2F', '#FFFFFF'] },
  { id: 191, name: 'Holstein Kiel', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#003DA5', '#FFFFFF'] },
];

// ==========================================
// SERIE A - API-Football IDs
// ==========================================
const SERIE_A: StaticTeam[] = [
  { id: 489, name: 'AC Milan', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#AC1818', '#000000'] },
  { id: 505, name: 'Inter', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#010E80', '#000000'] },
  { id: 496, name: 'Juventus', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 492, name: 'Napoli', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#12A0D7', '#FFFFFF'] },
  { id: 497, name: 'AS Roma', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#8E1F2F', '#F0BC42'] },
  { id: 487, name: 'Lazio', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#87D8F7', '#FFFFFF'] },
  { id: 499, name: 'Atalanta', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#1E71B8', '#000000'] },
  { id: 502, name: 'Fiorentina', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#482E92', '#FFFFFF'] },
  { id: 500, name: 'Bologna', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#A11E22', '#1A2F4E'] },
  { id: 503, name: 'Torino', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#8B0000', '#FFFFFF'] },
  { id: 494, name: 'Udinese', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 495, name: 'Genoa', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#A52A2A', '#00205B'] },
  { id: 1579, name: 'Monza', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#CE2029', '#FFFFFF'] },
  { id: 867, name: 'Lecce', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#FFD700', '#C8102E'] },
  { id: 511, name: 'Empoli', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#004B93', '#FFFFFF'] },
  { id: 504, name: 'Verona', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#003DA5', '#FFD700'] },
  { id: 490, name: 'Cagliari', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#A52A2A', '#0033A0'] },
  { id: 523, name: 'Parma', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#FFFF00', '#0000FF'] },
  { id: 517, name: 'Venezia', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#FF6600', '#000000'] },
  { id: 895, name: 'Como', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#0047AB', '#FFFFFF'] },
];

// ==========================================
// LIGUE 1 - API-Football IDs
// ==========================================
const LIGUE_1: StaticTeam[] = [
  { id: 85, name: 'Paris Saint Germain', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#004170', '#DA291C'] },
  { id: 81, name: 'Marseille', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#2FAEE0', '#FFFFFF'] },
  { id: 80, name: 'Lyon', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#0046A0', '#E10000'] },
  { id: 91, name: 'Monaco', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#C8102E', '#FFFFFF'] },
  { id: 79, name: 'Lille', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#C8102E', '#FFFFFF'] },
  { id: 94, name: 'Rennes', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#D4111E', '#000000'] },
  { id: 84, name: 'Nice', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#C8102E', '#000000'] },
  { id: 116, name: 'Lens', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#FFD100', '#C8102E'] },
  { id: 95, name: 'Strasbourg', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#0055A4', '#FFFFFF'] },
  { id: 106, name: 'Stade Brestois 29', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#E2001A', '#FFFFFF'] },
  { id: 83, name: 'Nantes', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#009E60', '#FFD700'] },
  { id: 96, name: 'Toulouse', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#5B2E86', '#FFFFFF'] },
  { id: 93, name: 'Reims', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#C8102E', '#FFFFFF'] },
  { id: 82, name: 'Montpellier', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#FF6600', '#003DA5'] },
  { id: 77, name: 'Angers', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 1063, name: 'Saint Etienne', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 111, name: 'Le Havre', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#00A0E3', '#FFFFFF'] },
  { id: 108, name: 'Auxerre', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#0055A4', '#FFFFFF'] },
];

// ==========================================
// PRIMEIRA LIGA (PORTUGAL) - API-Football IDs
// ==========================================
const PRIMEIRA_LIGA: StaticTeam[] = [
  { id: 211, name: 'Benfica', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 212, name: 'FC Porto', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#003DA5', '#FFFFFF'] },
  { id: 228, name: 'Sporting CP', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 217, name: 'SC Braga', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 224, name: 'Guimarães', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 226, name: 'Rio Ave', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 222, name: 'Boavista', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 227, name: 'Santa Clara', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 242, name: 'Famalicão', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#0000FF', '#FFFFFF'] },
  { id: 215, name: 'Moreirense', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 230, name: 'Estoril', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FFD700', '#0000FF'] },
  { id: 762, name: 'Gil Vicente', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 240, name: 'Arouca', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FFD700', '#000000'] },
  { id: 4716, name: 'Casa Pia', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#000080', '#FFFFFF'] },
];

// ==========================================
// BRASILEIRÃO - API-Football IDs
// ==========================================
const BRASILEIRAO: StaticTeam[] = [
  { id: 131, name: 'Corinthians', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 127, name: 'Flamengo', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#C8102E', '#000000'] },
  { id: 121, name: 'Palmeiras', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#006437', '#FFFFFF'] },
  { id: 126, name: 'São Paulo', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#FFFFFF', '#E30613'] },
  { id: 119, name: 'Internacional', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 130, name: 'Grêmio', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#003366', '#FFFFFF'] },
  { id: 1062, name: 'Atlético-MG', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 135, name: 'Cruzeiro', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#0033A0', '#FFFFFF'] },
  { id: 120, name: 'Botafogo', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 124, name: 'Fluminense', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#7F1734', '#00843D', '#FFFFFF'] },
  { id: 133, name: 'Vasco da Gama', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 118, name: 'Bahia', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#003366', '#FFFFFF'] },
  { id: 134, name: 'Athletico Paranaense', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#E30613', '#000000'] },
  { id: 154, name: 'Fortaleza', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#003366', '#FFFFFF'] },
  { id: 152, name: 'Juventude', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 1193, name: 'Cuiabá', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#FFD700', '#006633'] },
  { id: 136, name: 'Vitória', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#E30613', '#000000'] },
  { id: 794, name: 'RB Bragantino', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#E30613', '#FFFFFF'] },
];

// ==========================================
// EREDIVISIE - API-Football IDs
// ==========================================
const EREDIVISIE: StaticTeam[] = [
  { id: 194, name: 'Ajax', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#D2122E', '#FFFFFF'] },
  { id: 197, name: 'PSV Eindhoven', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 209, name: 'Feyenoord', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 201, name: 'AZ Alkmaar', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 415, name: 'Twente', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 207, name: 'Utrecht', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#CC0000', '#FFFFFF'] },
  { id: 426, name: 'Sparta Rotterdam', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 210, name: 'Heerenveen', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#003399', '#FFFFFF'] },
  { id: 202, name: 'Groningen', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 410, name: 'Go Ahead Eagles', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#FFD700', '#FF0000'] },
  { id: 413, name: 'NEC Nijmegen', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#FF0000', '#006633'] },
  { id: 205, name: 'Fortuna Sittard', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#FFD700', '#006633'] },
  { id: 193, name: 'PEC Zwolle', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#0000FF', '#FFFFFF'] },
  { id: 195, name: 'Willem II', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
];

// ==========================================
// ARGENTINE PRIMERA - API-Football IDs
// ==========================================
const ARGENTINE_PRIMERA: StaticTeam[] = [
  { id: 435, name: 'River Plate', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFFFFF', '#E30613'] },
  { id: 451, name: 'Boca Juniors', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#0066B3', '#FFFF00'] },
  { id: 460, name: 'San Lorenzo', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#E30613', '#0000FF'] },
  { id: 436, name: 'Racing Club', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFFFFF', '#0066B3'] },
  { id: 453, name: 'Independiente', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 450, name: 'Estudiantes L.P.', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFFFFF', '#E30613'] },
  { id: 438, name: 'Vélez Sarsfield', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 457, name: 'Newells Old Boys', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#CC0000', '#000000'] },
  { id: 437, name: 'Rosario Central', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFD700', '#0000FF'] },
  { id: 456, name: 'Talleres Córdoba', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#002D62', '#FFFFFF'] },
  { id: 455, name: 'Atlético Tucumán', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#0066B3', '#FFFFFF'] },
  { id: 439, name: 'Godoy Cruz', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#0000FF', '#FFFFFF'] },
  { id: 442, name: 'Defensa y Justicia', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFD700', '#006633'] },
  { id: 446, name: 'Lanús', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#800020', '#FFFFFF'] },
  { id: 441, name: 'Unión Santa Fe', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 445, name: 'Huracán', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFFFFF', '#C8102E'] },
];

// ==========================================
// SAUDI PRO LEAGUE - API-Football IDs
// ==========================================
const SAUDI_PRO_LEAGUE: StaticTeam[] = [
  { id: 2932, name: 'Al-Hilal', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#0066B3', '#FFFFFF'] },
  { id: 2939, name: 'Al-Nassr', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#FFD700', '#0000FF'] },
  { id: 2938, name: 'Al-Ittihad', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#000000', '#FFD700'] },
  { id: 2929, name: 'Al-Ahli Jeddah', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 2934, name: 'Al-Ettifaq', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 2940, name: 'Al Shabab', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#FFFFFF', '#000000'] },
  { id: 2936, name: 'Al Taawon', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#FFD700', '#006633'] },
  { id: 2931, name: 'Al-Fateh', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 2935, name: 'Al-Raed', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#C8102E', '#FFFFFF'] },
  { id: 2944, name: 'Al-Fayha', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#800020', '#FFFFFF'] },
  { id: 2956, name: 'Damac', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#800020', '#FFD700'] },
  { id: 10511, name: 'Al Riyadh', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#006633', '#FFFFFF'] },
];

// ==========================================
// OTHER CLUBS (Champions League etc.)
// ==========================================
const OTHER_CLUBS: StaticTeam[] = [
  { id: 556, name: 'Qarabag', country: 'Azerbaijan', league: 'Premyer Liqa', type: 'club', colors: ['#00AA00', '#FFFFFF'] },
];

// ==========================================
// NATIONAL TEAMS - API-Football IDs
// ==========================================
const NATIONAL_TEAMS: StaticTeam[] = [
  { id: 777, name: 'Turkey', country: 'Turkey', league: 'International', type: 'national', colors: ['#E30A17', '#FFFFFF'] },
  { id: 25, name: 'Germany', country: 'Germany', league: 'International', type: 'national', colors: ['#000000', '#DD0000', '#FFCC00'] },
  { id: 2, name: 'France', country: 'France', league: 'International', type: 'national', colors: ['#002395', '#FFFFFF', '#ED2939'] },
  { id: 10, name: 'England', country: 'England', league: 'International', type: 'national', colors: ['#FFFFFF', '#CF081F'] },
  { id: 9, name: 'Spain', country: 'Spain', league: 'International', type: 'national', colors: ['#AA151B', '#F1BF00'] },
  { id: 768, name: 'Italy', country: 'Italy', league: 'International', type: 'national', colors: ['#009246', '#FFFFFF', '#CE2B37'] },
  { id: 6, name: 'Brazil', country: 'Brazil', league: 'International', type: 'national', colors: ['#009C3B', '#FFDF00'] },
  { id: 26, name: 'Argentina', country: 'Argentina', league: 'International', type: 'national', colors: ['#74ACDF', '#FFFFFF'] },
  { id: 27, name: 'Portugal', country: 'Portugal', league: 'International', type: 'national', colors: ['#006600', '#FF0000'] },
  { id: 1118, name: 'Netherlands', country: 'Netherlands', league: 'International', type: 'national', colors: ['#FF6600', '#FFFFFF'] },
  { id: 1, name: 'Belgium', country: 'Belgium', league: 'International', type: 'national', colors: ['#000000', '#FDDA25'] },
  { id: 3, name: 'Croatia', country: 'Croatia', league: 'International', type: 'national', colors: ['#FF0000', '#FFFFFF'] },
  { id: 24, name: 'Poland', country: 'Poland', league: 'International', type: 'national', colors: ['#FFFFFF', '#DC143C'] },
  { id: 772, name: 'Ukraine', country: 'Ukraine', league: 'International', type: 'national', colors: ['#005BBB', '#FFD500'] },
  { id: 21, name: 'Denmark', country: 'Denmark', league: 'International', type: 'national', colors: ['#C60C30', '#FFFFFF'] },
  { id: 15, name: 'Switzerland', country: 'Switzerland', league: 'International', type: 'national', colors: ['#FF0000', '#FFFFFF'] },
];

// ==========================================
// EXPORTS
// ==========================================

// Tüm kulüp takımları birleştir
export const ALL_CLUB_TEAMS: StaticTeam[] = [
  ...SUPER_LIG,
  ...PREMIER_LEAGUE,
  ...LA_LIGA,
  ...BUNDESLIGA,
  ...SERIE_A,
  ...LIGUE_1,
  ...PRIMEIRA_LIGA,
  ...BRASILEIRAO,
  ...EREDIVISIE,
  ...ARGENTINE_PRIMERA,
  ...SAUDI_PRO_LEAGUE,
  ...OTHER_CLUBS,
];

// Tüm milli takımlar
export const ALL_NATIONAL_TEAMS: StaticTeam[] = NATIONAL_TEAMS;

// Tüm takımlar
export const ALL_TEAMS: StaticTeam[] = [...ALL_CLUB_TEAMS, ...ALL_NATIONAL_TEAMS];

// ID'ye göre takım bul
export function getTeamById(id: number): StaticTeam | undefined {
  return ALL_TEAMS.find(team => team.id === id);
}

// İsme göre takım ara
export function searchTeams(query: string): StaticTeam[] {
  const lowerQuery = query.toLowerCase();
  return ALL_TEAMS.filter(team => 
    team.name.toLowerCase().includes(lowerQuery) ||
    team.country.toLowerCase().includes(lowerQuery)
  );
}

// Ülkeye göre takımları getir
export function getTeamsByCountry(country: string): StaticTeam[] {
  return ALL_CLUB_TEAMS.filter(team => 
    team.country.toLowerCase() === country.toLowerCase()
  );
}

// Liga'ya göre takımları getir
export function getTeamsByLeague(league: string): StaticTeam[] {
  return ALL_CLUB_TEAMS.filter(team => 
    team.league.toLowerCase() === league.toLowerCase()
  );
}

// ID'ye göre takım renklerini döndür
export function getTeamColorsById(id: number): string[] | null {
  const team = getTeamById(id);
  return team?.colors ?? null;
}

// İsme göre takım renklerini döndür (exact match, sonra contains)
export function getTeamColorsByName(name: string): string[] | null {
  const lowerName = name.toLowerCase().trim();
  // 1. Exact match
  const exact = ALL_TEAMS.find(t => t.name.toLowerCase() === lowerName);
  if (exact) return exact.colors;
  // 2. Contains match (team name contains search or vice versa)
  const contains = ALL_TEAMS.find(t => 
    t.name.toLowerCase().includes(lowerName) || lowerName.includes(t.name.toLowerCase())
  );
  return contains?.colors ?? null;
}

// Profil ekranı için fallback kulüp takımları listesi (API yokken/arama için)
export function getFallbackClubTeamsForProfile(): StaticTeam[] {
  return ALL_CLUB_TEAMS;
}

export default {
  ALL_CLUB_TEAMS,
  ALL_NATIONAL_TEAMS,
  ALL_TEAMS,
  getTeamById,
  getTeamColorsById,
  getTeamColorsByName,
  getFallbackClubTeamsForProfile,
  searchTeams,
  getTeamsByCountry,
  getTeamsByLeague,
};
