/**
 * Static Teams Data - Tüm liglerdeki takımlar, forma renkleri
 * TEK KAYNAK: ProfileScreen, teamColors, backend static_teams bu dosyayı kullanır
 * API-Football team ID'leri ile uyumlu
 */

export interface StaticTeam {
  id: number;
  name: string;
  country: string;
  league: string;
  type: 'club' | 'national';
  colors: string[];
}

// Süper Lig - Tüm takımlar
const SUPER_LIG: StaticTeam[] = [
  { id: 611, name: 'Fenerbahçe', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FFED00', '#00205B'] },
  { id: 645, name: 'Galatasaray', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FF0000', '#FFD700'] },
  { id: 549, name: 'Beşiktaş', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 551, name: 'Trabzonspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#632134', '#00BFFF'] },
  { id: 607, name: 'Başakşehir', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#F26522', '#1E3A5F'] },
  { id: 3570, name: 'Adana Demirspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#0000FF', '#FFFFFF'] },
  { id: 556, name: 'Konyaspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 562, name: 'Antalyaspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#ED1C24', '#FFFFFF'] },
  { id: 564, name: 'Sivasspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 1005, name: 'Kasımpaşa', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#1E4D78', '#FFFFFF'] },
  { id: 3682, name: 'Göztepe', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FFD700', '#C8102E'] },
  { id: 359, name: 'Alanyaspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#FF6600', '#006633'] },
  { id: 367, name: 'Hatayspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#006633', '#C8102E'] },
  { id: 368, name: 'Gaziantep', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#C8102E', '#000000'] },
  { id: 358, name: 'Rizespor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#006633', '#0000FF'] },
  { id: 356, name: 'Samsunspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#C8102E', '#FFFFFF'] },
  { id: 360, name: 'Fatih Karagümrük', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#8B0000', '#FFD700'] },
  { id: 363, name: 'Kocaelispor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 364, name: 'Gençlerbirliği', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#E30613', '#000000'] },
  { id: 365, name: 'Eyüpspor', country: 'Turkey', league: 'Süper Lig', type: 'club', colors: ['#8B0000', '#FFD700'] },
];

// Premier League
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
  { id: 45, name: 'Everton', country: 'England', league: 'Premier League', type: 'club', colors: ['#003399', '#FFFFFF'] },
  { id: 35, name: 'Brighton', country: 'England', league: 'Premier League', type: 'club', colors: ['#0057B8', '#FFFFFF'] },
  { id: 39, name: 'Wolves', country: 'England', league: 'Premier League', type: 'club', colors: ['#FDB913', '#000000'] },
  { id: 63, name: 'Nottingham Forest', country: 'England', league: 'Premier League', type: 'club', colors: ['#DD0000', '#FFFFFF'] },
  { id: 52, name: 'Crystal Palace', country: 'England', league: 'Premier League', type: 'club', colors: ['#1B458F', '#C4122E'] },
  { id: 55, name: 'Brentford', country: 'England', league: 'Premier League', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 36, name: 'Fulham', country: 'England', league: 'Premier League', type: 'club', colors: ['#FFFFFF', '#000000'] },
  { id: 35, name: 'Bournemouth', country: 'England', league: 'Premier League', type: 'club', colors: ['#DA291C', '#000000'] },
  { id: 102, name: 'Ipswich', country: 'England', league: 'Premier League', type: 'club', colors: ['#0000FF', '#FFFFFF'] },
  { id: 46, name: 'Leicester', country: 'England', league: 'Premier League', type: 'club', colors: ['#003090', '#FDBE11'] },
  { id: 41, name: 'Southampton', country: 'England', league: 'Premier League', type: 'club', colors: ['#D71920', '#FFFFFF'] },
];

// La Liga
const LA_LIGA: StaticTeam[] = [
  { id: 541, name: 'Real Madrid', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFFFFF', '#00529F'] },
  { id: 529, name: 'Barcelona', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#004D98', '#A50044'] },
  { id: 530, name: 'Atletico Madrid', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#CB3524', '#FFFFFF'] },
  { id: 536, name: 'Sevilla', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 533, name: 'Villarreal', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFFF00', '#004F9E'] },
  { id: 548, name: 'Real Sociedad', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#0067B1', '#FFFFFF'] },
  { id: 531, name: 'Athletic Bilbao', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#EE2523', '#FFFFFF'] },
  { id: 727, name: 'Real Betis', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#00954C', '#FFFFFF'] },
  { id: 532, name: 'Valencia', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#EE7500', '#000000'] },
  { id: 798, name: 'Girona', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#CD2E34', '#FFFFFF'] },
  { id: 728, name: 'Rayo Vallecano', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFFFFF', '#E30613'] },
  { id: 547, name: 'Getafe', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#0048BA', '#FFFFFF'] },
  { id: 727, name: 'Osasuna', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#D91A21', '#00529F'] }, // CA Osasuna
  { id: 538, name: 'Celta Vigo', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#8FBCE5', '#FFFFFF'] },
  { id: 720, name: 'Mallorca', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#E30613', '#000000'] },
  { id: 723, name: 'Almería', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 724, name: 'Cádiz', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFCC00', '#003399'] },
  { id: 534, name: 'Las Palmas', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#FFCC00', '#003399'] },
  { id: 263, name: 'Alavés', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#003DA5', '#FFFFFF'] },
  { id: 715, name: 'Granada', country: 'Spain', league: 'La Liga', type: 'club', colors: ['#CF1027', '#FFFFFF'] },
];

// Bundesliga
const BUNDESLIGA: StaticTeam[] = [
  { id: 157, name: 'Bayern Munich', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#DC052D', '#FFFFFF'] },
  { id: 165, name: 'Borussia Dortmund', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#FDE100', '#000000'] },
  { id: 173, name: 'RB Leipzig', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#DD0741', '#FFFFFF'] },
  { id: 168, name: 'Bayer Leverkusen', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#E32221', '#000000'] },
  { id: 169, name: 'Eintracht Frankfurt', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#E1000F', '#000000'] },
  { id: 172, name: 'VfB Stuttgart', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#E32219', '#FFFFFF'] },
  { id: 170, name: 'Union Berlin', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#EB1923', '#FFFFFF'] },
  { id: 192, name: 'Freiburg', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#E2001A', '#FFFFFF'] },
  { id: 168, name: 'Wolfsburg', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#65B32E', '#FFFFFF'] },
  { id: 174, name: 'Borussia Mönchengladbach', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 167, name: 'Hoffenheim', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#1961B5', '#FFFFFF'] },
  { id: 175, name: 'FC Köln', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#ED1C24', '#FFFFFF'] },
  { id: 164, name: 'Mainz', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#ED1C24', '#FFFFFF'] },
  { id: 161, name: 'Werder Bremen', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#1D9053', '#FFFFFF'] },
  { id: 171, name: 'Augsburg', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#BA3733', '#006633'] },
  { id: 178, name: 'Heidenheim', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#C8102E', '#1E3A6E'] },
  { id: 187, name: 'Darmstadt', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#004DA0', '#FFFFFF'] },
  { id: 176, name: 'Bochum', country: 'Germany', league: 'Bundesliga', type: 'club', colors: ['#005CA9', '#FFFFFF'] },
];

// Serie A
const SERIE_A: StaticTeam[] = [
  { id: 489, name: 'AC Milan', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#AC1F2E', '#000000'] },
  { id: 505, name: 'Inter Milan', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#010E80', '#000000'] },
  { id: 496, name: 'Juventus', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#FFFFFF', '#000000'] },
  { id: 492, name: 'Napoli', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#12A0D7', '#FFFFFF'] },
  { id: 497, name: 'Roma', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#8E1F2F', '#F0BC42'] },
  { id: 487, name: 'Lazio', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#87D8F7', '#FFFFFF'] },
  { id: 499, name: 'Atalanta', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#1B478D', '#000000'] },
  { id: 502, name: 'Fiorentina', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#472C84', '#FFFFFF'] },
  { id: 488, name: 'Torino', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#8B0000', '#FFFFFF'] },
  { id: 500, name: 'Bologna', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#1A2F5B', '#A11923'] },
  { id: 504, name: 'Genoa', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#990000', '#00247D'] },
  { id: 1579, name: 'Monza', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 866, name: 'Lecce', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#FFE600', '#E42217'] },
  { id: 503, name: 'Udinese', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 490, name: 'Cagliari', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#00247D', '#A11923'] },
  { id: 502, name: 'Hellas Verona', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#FFCC00', '#003399'] },
  { id: 495, name: 'Empoli', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#00529B', '#FFFFFF'] },
  { id: 512, name: 'Frosinone', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#FFFF00', '#003399'] },
  { id: 511, name: 'Salernitana', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#8B0000', '#FFFFFF'] },
  { id: 867, name: 'Venezia', country: 'Italy', league: 'Serie A', type: 'club', colors: ['#0066B3', '#FFCC00'] },
];

// Ligue 1
const LIGUE_1: StaticTeam[] = [
  { id: 85, name: 'Paris Saint-Germain', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#004170', '#DA291C'] },
  { id: 81, name: 'Marseille', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#2FAEE0', '#FFFFFF'] },
  { id: 80, name: 'Lyon', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#0046A0', '#E10000'] },
  { id: 91, name: 'Monaco', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#DA291C', '#FFFFFF'] },
  { id: 79, name: 'Lille', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 84, name: 'Nice', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#000000', '#E30613'] },
  { id: 116, name: 'Lens', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#FFE500', '#E30613'] },
  { id: 106, name: 'Rennes', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#000000', '#E30613'] },
  { id: 93, name: 'Reims', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 82, name: 'Montpellier', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#1E2A45', '#FF6B00'] },
  { id: 95, name: 'Strasbourg', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#0066B3', '#FFFFFF'] },
  { id: 83, name: 'Nantes', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#FFD800', '#009933'] },
  { id: 97, name: 'Toulouse', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#663399', '#FFFFFF'] },
  { id: 106, name: 'Brest', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 96, name: 'Le Havre', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#0066B3', '#FFFFFF'] },
  { id: 112, name: 'Clermont', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 112, name: 'Metz', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#8B0000', '#FFFFFF'] },
  { id: 97, name: 'Lorient', country: 'France', league: 'Ligue 1', type: 'club', colors: ['#FF6600', '#000000'] },
];

// Primeira Liga
const PRIMEIRA_LIGA: StaticTeam[] = [
  { id: 211, name: 'Benfica', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FF0000', '#FFFFFF'] },
  { id: 212, name: 'Porto', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#003893', '#FFFFFF'] },
  { id: 228, name: 'Sporting CP', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#008754', '#FFFFFF'] },
  { id: 234, name: 'Braga', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#CC0000', '#FFFFFF'] },
  { id: 240, name: 'Vitória Guimarães', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FFFFFF', '#8B0000'] },
  { id: 239, name: 'Rio Ave', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 240, name: 'Famalicão', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FFFFFF', '#006633'] },
  { id: 233, name: 'Casa Pia', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FFD700', '#000000'] },
  { id: 234, name: 'Gil Vicente', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#CC0000', '#FFFFFF'] },
  { id: 235, name: 'Estoril', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#FFD700', '#000000'] },
  { id: 229, name: 'Boavista', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 230, name: 'Vizela', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 231, name: 'Arouca', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#0000FF', '#FFFFFF'] },
  { id: 232, name: 'Chaves', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#CC0000', '#FFFFFF'] },
  { id: 233, name: 'Estrela Amadora', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 236, name: 'Farense', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 237, name: 'Moreirense', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 238, name: 'Portimonense', country: 'Portugal', league: 'Primeira Liga', type: 'club', colors: ['#CC0000', '#000000'] },
];

// Brasileirão - Tüm takımlar
const BRASILEIRAO: StaticTeam[] = [
  { id: 131, name: 'Corinthians', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 127, name: 'Flamengo', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#C8102E', '#000000'] },
  { id: 126, name: 'Palmeiras', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#006437', '#FFFFFF'] },
  { id: 124, name: 'Santos', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#FFFFFF', '#000000'] },
  { id: 121, name: 'São Paulo', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#FFFFFF', '#E30613'] },
  { id: 119, name: 'Internacional', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 123, name: 'Grêmio', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#003366', '#FFFFFF'] },
  { id: 106, name: 'Atlético Mineiro', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 113, name: 'Cruzeiro', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#0033A0', '#FFFFFF'] },
  { id: 120, name: 'Botafogo', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 118, name: 'Fluminense', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#7F1734', '#00843D', '#FFFFFF'] },
  { id: 128, name: 'Vasco da Gama', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 95, name: 'Bahia', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#003366', '#FFFFFF'] },
  { id: 99, name: 'Athletico Paranaense', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#E30613', '#000000'] },
  { id: 1279, name: 'Fortaleza', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#003366', '#FFFFFF'] },
  { id: 98, name: 'Ceará', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 100, name: 'Coritiba', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 137, name: 'Goiás', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 134, name: 'Cuiabá', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#FFD700', '#006633'] },
  { id: 135, name: 'Juventude', country: 'Brazil', league: 'Brasileirão', type: 'club', colors: ['#006633', '#FFFFFF'] },
];

// Eredivisie
const EREDIVISIE: StaticTeam[] = [
  { id: 194, name: 'Ajax', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#D2122E', '#FFFFFF'] },
  { id: 197, name: 'PSV Eindhoven', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 195, name: 'Feyenoord', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 192, name: 'AZ Alkmaar', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 193, name: 'Twente', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 196, name: 'Utrecht', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#CC0000', '#FFFFFF'] },
  { id: 198, name: 'Sparta Rotterdam', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 199, name: 'Heerenveen', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#003399', '#FFFFFF'] },
  { id: 200, name: 'Vitesse', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#000000', '#FFFF00'] },
  { id: 201, name: 'Groningen', country: 'Netherlands', league: 'Eredivisie', type: 'club', colors: ['#006633', '#FFFFFF'] },
];

// Argentine Primera
const ARGENTINE_PRIMERA: StaticTeam[] = [
  { id: 435, name: 'River Plate', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFFFFF', '#E30613'] },
  { id: 436, name: 'Boca Juniors', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#0066B3', '#FFFF00'] },
  { id: 437, name: 'San Lorenzo', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#E30613', '#0000FF'] },
  { id: 438, name: 'Racing Club', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFFFFF', '#0066B3'] },
  { id: 439, name: 'Independiente', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 440, name: 'Estudiantes', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFFFFF', '#E30613'] },
  { id: 441, name: 'Vélez Sarsfield', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 442, name: 'Lanús', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 443, name: 'Newell\'s Old Boys', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#E30613', '#000000'] },
  { id: 444, name: 'Rosario Central', country: 'Argentina', league: 'Liga Profesional', type: 'club', colors: ['#FFFF00', '#0066B3'] },
];

// Liga MX
const LIGA_MX: StaticTeam[] = [
  { id: 2287, name: 'America', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#FFFF00', '#E30613'] },
  { id: 2288, name: 'Chivas Guadalajara', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 2289, name: 'Cruz Azul', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#0066B3', '#FFFFFF'] },
  { id: 2290, name: 'Monterrey', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#FFFFFF', '#006633'] },
  { id: 2291, name: 'Tigres', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#FFFF00', '#006633'] },
  { id: 2292, name: 'Pachuca', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#003366', '#FFFFFF'] },
  { id: 2293, name: 'Toluca', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 2294, name: 'Pumas UNAM', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#FFD700', '#006633'] },
  { id: 2295, name: 'Atlas', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#E30613', '#000000'] },
  { id: 2296, name: 'Leon', country: 'Mexico', league: 'Liga MX', type: 'club', colors: ['#006633', '#FFFFFF'] },
];

// Saudi Pro League (API-Football IDs)
const SAUDI_PRO_LEAGUE: StaticTeam[] = [
  { id: 929, name: 'Al Hilal', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 331, name: 'Al Nassr', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#FFD700', '#003399'] },
  { id: 930, name: 'Al Ahli', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 931, name: 'Al Ittihad', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#FFFF00', '#000000'] },
  { id: 932, name: 'Al Shabab', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#000000', '#FFFFFF'] },
  { id: 933, name: 'Al Ettifaq', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 934, name: 'Al Fateh', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#006633', '#FFFFFF'] },
  { id: 935, name: 'Al Taawoun', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#E30613', '#FFFFFF'] },
  { id: 936, name: 'Al Khaleej', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#003399', '#FFFFFF'] },
  { id: 937, name: 'Al Riyadh', country: 'Saudi Arabia', league: 'Saudi Pro League', type: 'club', colors: ['#006633', '#FFFFFF'] },
];

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
  ...LIGA_MX,
  ...SAUDI_PRO_LEAGUE,
];

// Takım isminden renk bul (teamColors.ts için)
export const getTeamColorsByName = (teamName: string): string[] => {
  const name = teamName.toLowerCase().trim();
  for (const team of ALL_CLUB_TEAMS) {
    if (team.name.toLowerCase().includes(name) || name.includes(team.name.toLowerCase())) {
      return team.colors;
    }
  }
  return ['#1E40AF', '#FFFFFF'];
};

// Takım ID'sinden renk bul
export const getTeamColorsById = (teamId: number): string[] | null => {
  const team = ALL_CLUB_TEAMS.find(t => t.id === teamId);
  return team ? team.colors : null;
};

// ProfileScreen FALLBACK için format
export const getFallbackClubTeamsForProfile = () =>
  ALL_CLUB_TEAMS.map(t => ({
    id: t.id,
    name: t.name,
    country: t.country,
    league: t.league,
    type: 'club' as const,
    colors: t.colors,
  }));
