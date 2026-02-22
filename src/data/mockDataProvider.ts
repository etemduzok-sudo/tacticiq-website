/**
 * TacticIQ - Merkezi Mock Veri Sağlayıcı
 * 
 * Bu dosya iki ana bölümden oluşur:
 * 1. API-Football Verileri: Takımlar, kadrolar, koçlar, renkler, maçlar
 * 2. Topluluk Verileri: Tahminler, reytingler, sinyaller, oylar
 * 
 * Tüm veriler API'den gelen formatla aynıdır.
 * Gerçeğe geçişte sadece veri kaynağı değişir, interface'ler aynı kalır.
 */

// ============================================================
// MOCK MOD KONTROLÜ
// ============================================================

export const MOCK_MODE = __DEV__ || false;

export function isMockMode(): boolean {
  return MOCK_MODE;
}

// ============================================================
// BÖLÜM 1: API-FOOTBALL VERİLERİ
// ============================================================

export const MOCK_API_FOOTBALL = {

  teams: [
    { id: 559, name: 'Galatasaray', code: 'GAL', country: 'Turkey', logo: 'https://media.api-sports.io/football/teams/559.png' },
    { id: 610, name: 'Fenerbahçe', code: 'FEN', country: 'Turkey', logo: 'https://media.api-sports.io/football/teams/610.png' },
    { id: 609, name: 'Beşiktaş', code: 'BES', country: 'Turkey', logo: 'https://media.api-sports.io/football/teams/609.png' },
    { id: 612, name: 'Trabzonspor', code: 'TRA', country: 'Turkey', logo: 'https://media.api-sports.io/football/teams/612.png' },
    { id: 50,  name: 'Manchester City', code: 'MCI', country: 'England', logo: 'https://media.api-sports.io/football/teams/50.png' },
    { id: 40,  name: 'Liverpool', code: 'LIV', country: 'England', logo: 'https://media.api-sports.io/football/teams/40.png' },
    { id: 541, name: 'Real Madrid', code: 'RMA', country: 'Spain', logo: 'https://media.api-sports.io/football/teams/541.png' },
    { id: 529, name: 'Barcelona', code: 'BAR', country: 'Spain', logo: 'https://media.api-sports.io/football/teams/529.png' },
    { id: 157, name: 'Bayern Munich', code: 'BAY', country: 'Germany', logo: 'https://media.api-sports.io/football/teams/157.png' },
    { id: 165, name: 'Borussia Dortmund', code: 'BVB', country: 'Germany', logo: 'https://media.api-sports.io/football/teams/165.png' },
  ],

  leagues: [
    { id: 203, name: 'Süper Lig', country: 'Turkey', logo: 'https://media.api-sports.io/football/leagues/203.png', season: 2025 },
    { id: 39,  name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png', season: 2025 },
    { id: 140, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png', season: 2025 },
    { id: 78,  name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png', season: 2025 },
    { id: 135, name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png', season: 2025 },
  ],

  teamColors: {
    559: { primary: '#FFD700', secondary: '#C8102E', text: '#FFFFFF' },
    610: { primary: '#003087', secondary: '#FFD700', text: '#FFFFFF' },
    609: { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' },
    612: { primary: '#6C1D45', secondary: '#00AEEF', text: '#FFFFFF' },
    50:  { primary: '#6CABDD', secondary: '#1C2C5B', text: '#FFFFFF' },
    40:  { primary: '#C8102E', secondary: '#00B2A9', text: '#FFFFFF' },
    541: { primary: '#FEBE10', secondary: '#00529F', text: '#FFFFFF' },
    529: { primary: '#A50044', secondary: '#004D98', text: '#FFFFFF' },
    157: { primary: '#DC052D', secondary: '#0066B2', text: '#FFFFFF' },
    165: { primary: '#FDE100', secondary: '#000000', text: '#000000' },
  } as Record<number, { primary: string; secondary: string; text: string }>,

  coaches: {
    559: { id: 1, name: 'Okan Buruk', nationality: 'Turkey', photo: null },
    610: { id: 2, name: 'José Mourinho', nationality: 'Portugal', photo: null },
    609: { id: 3, name: 'Giovanni van Bronckhorst', nationality: 'Netherlands', photo: null },
    612: { id: 4, name: 'Şenol Güneş', nationality: 'Turkey', photo: null },
    50:  { id: 5, name: 'Pep Guardiola', nationality: 'Spain', photo: null },
    40:  { id: 6, name: 'Arne Slot', nationality: 'Netherlands', photo: null },
    541: { id: 7, name: 'Carlo Ancelotti', nationality: 'Italy', photo: null },
    529: { id: 8, name: 'Hansi Flick', nationality: 'Germany', photo: null },
  } as Record<number, { id: number; name: string; nationality: string; photo: string | null }>,

  squads: {
    559: [
      { id: 101, name: 'Muslera', number: 1, position: 'GK', rating: 78, photo: null },
      { id: 102, name: 'Nelsson', number: 4, position: 'CB', rating: 82, photo: null },
      { id: 103, name: 'Sanchez', number: 5, position: 'CB', rating: 80, photo: null },
      { id: 104, name: 'Jelert', number: 2, position: 'RB', rating: 76, photo: null },
      { id: 105, name: 'Angeliño', number: 12, position: 'LB', rating: 79, photo: null },
      { id: 106, name: 'Torreira', number: 14, position: 'CDM', rating: 83, photo: null },
      { id: 107, name: 'Mertens', number: 10, position: 'CAM', rating: 84, photo: null },
      { id: 108, name: 'Ziyech', number: 22, position: 'RW', rating: 81, photo: null },
      { id: 109, name: 'Barış Alper', number: 7, position: 'LW', rating: 77, photo: null },
      { id: 110, name: 'Icardi', number: 9, position: 'ST', rating: 85, photo: null },
      { id: 111, name: 'Osimhen', number: 45, position: 'ST', rating: 87, photo: null },
    ],
    610: [
      { id: 201, name: 'Livakovic', number: 1, position: 'GK', rating: 80, photo: null },
      { id: 202, name: 'Djiku', number: 4, position: 'CB', rating: 79, photo: null },
      { id: 203, name: 'Becao', number: 3, position: 'CB', rating: 78, photo: null },
      { id: 204, name: 'Osayi-Samuel', number: 18, position: 'RB', rating: 77, photo: null },
      { id: 205, name: 'Oosterwolde', number: 5, position: 'LB', rating: 76, photo: null },
      { id: 206, name: 'İsmail Yüksek', number: 25, position: 'CDM', rating: 78, photo: null },
      { id: 207, name: 'Fred', number: 17, position: 'CM', rating: 82, photo: null },
      { id: 208, name: 'Szymanski', number: 10, position: 'CAM', rating: 81, photo: null },
      { id: 209, name: 'Tadic', number: 11, position: 'LW', rating: 83, photo: null },
      { id: 210, name: 'Saint-Maximin', number: 7, position: 'RW', rating: 80, photo: null },
      { id: 211, name: 'Dzeko', number: 9, position: 'ST', rating: 82, photo: null },
    ],
  } as Record<number, Array<{ id: number; name: string; number: number; position: string; rating: number; photo: string | null }>>,

  matches: {
    live: [
      {
        fixture: { id: 900001, date: new Date().toISOString(), timestamp: Math.floor(Date.now() / 1000), status: { short: 'LIVE', long: 'In Play', elapsed: 67 }, venue: { name: 'Rams Park', city: 'İstanbul' } },
        league: { id: 203, name: 'Süper Lig', country: 'Turkey', logo: 'https://media.api-sports.io/football/leagues/203.png', season: 2025 },
        teams: { home: { id: 559, name: 'Galatasaray', logo: 'https://media.api-sports.io/football/teams/559.png' }, away: { id: 610, name: 'Fenerbahçe', logo: 'https://media.api-sports.io/football/teams/610.png' } },
        goals: { home: 2, away: 1 },
        score: { halftime: { home: 1, away: 0 }, fulltime: { home: null, away: null } },
      },
    ],
    upcoming: [
      {
        fixture: { id: 900002, date: new Date(Date.now() + 3600000).toISOString(), timestamp: Math.floor((Date.now() + 3600000) / 1000), status: { short: 'NS', long: 'Not Started', elapsed: null }, venue: { name: 'Etihad Stadium', city: 'Manchester' } },
        league: { id: 39, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png', season: 2025 },
        teams: { home: { id: 50, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' }, away: { id: 40, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' } },
        goals: { home: null, away: null },
        score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null } },
      },
    ],
    finished: [
      {
        fixture: { id: 900003, date: new Date(Date.now() - 7200000).toISOString(), timestamp: Math.floor((Date.now() - 7200000) / 1000), status: { short: 'FT', long: 'Match Finished', elapsed: 90 }, venue: { name: 'Allianz Arena', city: 'München' } },
        league: { id: 78, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png', season: 2025 },
        teams: { home: { id: 157, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' }, away: { id: 165, name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' } },
        goals: { home: 3, away: 2 },
        score: { halftime: { home: 1, away: 1 }, fulltime: { home: 3, away: 2 } },
      },
    ],
  },
};


// ============================================================
// BÖLÜM 2: TOPLULUK VERİLERİ
// ============================================================

export const MOCK_COMMUNITY = {

  matchPredictions: {
    900001: {
      totalPredictions: 0,
      homeWinPercentage: 0,
      drawPercentage: 0,
      awayWinPercentage: 0,
      averageHomeGoals: 0,
      averageAwayGoals: 0,
      averageTotalGoals: 0,
      averageYellowCards: 0,
      averageRedCards: 0,
      averageCorners: 0,
      hasSufficientData: false,
    },
  } as Record<number, {
    totalPredictions: number;
    homeWinPercentage: number;
    drawPercentage: number;
    awayWinPercentage: number;
    averageHomeGoals: number;
    averageAwayGoals: number;
    averageTotalGoals: number;
    averageYellowCards: number;
    averageRedCards: number;
    averageCorners: number;
    hasSufficientData: boolean;
  }>,

  coachRatings: {
    totalVoters: 0,
    hasSufficientData: false,
    categories: {} as Record<number, number>,
  },

  playerRatings: {
    totalVoters: 0,
    hasSufficientData: false,
    players: {} as Record<number, {
      averageRating: number;
      totalVotes: number;
      categories: Record<string, number>;
    }>,
  },

  squadPredictions: {
    totalPredictions: 0,
    hasSufficientData: false,
    formationPopularity: {} as Record<string, number>,
    playerPositionStats: {} as Record<number, {
      mostAssignedPosition: string;
      percentage: number;
      totalAssignments: number;
    }>,
  },

  substitutionVotes: {
    totalVotes: 0,
    hasSufficientData: false,
    suggestions: [] as Array<{
      playerOut: { id: number; name: string; position: string };
      playerIn: { id: number; name: string; position: string };
      voteCount: number;
      percentage: number;
    }>,
  },

  communitySignals: {
    hasSufficientData: false,
    sampleSize: 0,
    signals: {} as Record<number, {
      compatibilityScore: number;
      replacementPercentage: number;
      topReplacements: Array<{
        player: { id: number; name: string; position: string };
        percentage: number;
        count: number;
      }>;
    }>,
  },
};


// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

const MIN_COMMUNITY_SAMPLE = 10;

/**
 * Topluluk verisi yeterli mi kontrol et
 */
export function hasSufficientCommunityData(sampleSize: number): boolean {
  return sampleSize >= MIN_COMMUNITY_SAMPLE;
}

/**
 * Boş topluluk yanıtı (veri yetersiz durumu)
 */
export function getEmptyCommunityResponse() {
  return {
    hasSufficientData: false,
    message: 'Henüz yeterli topluluk verisi yok',
    sampleSize: 0,
  };
}

/**
 * Mock maç verilerini al (API formatında)
 */
export function getMockMatches(status: 'live' | 'upcoming' | 'finished' | 'all' = 'all') {
  if (status === 'all') {
    return [
      ...MOCK_API_FOOTBALL.matches.live,
      ...MOCK_API_FOOTBALL.matches.upcoming,
      ...MOCK_API_FOOTBALL.matches.finished,
    ];
  }
  return MOCK_API_FOOTBALL.matches[status];
}

/**
 * Mock maç bul (fixture ID ile)
 */
export function getMockMatchById(fixtureId: number) {
  const all = getMockMatches('all');
  return all.find(m => m.fixture.id === fixtureId) || null;
}

/**
 * Mock takım bul
 */
export function getMockTeamById(teamId: number) {
  return MOCK_API_FOOTBALL.teams.find(t => t.id === teamId) || null;
}

/**
 * Mock takım ara
 */
export function searchMockTeams(query: string) {
  return MOCK_API_FOOTBALL.teams.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Mock takım renkleri
 */
export function getMockTeamColors(teamId: number) {
  return MOCK_API_FOOTBALL.teamColors[teamId] || { primary: '#666', secondary: '#999', text: '#FFF' };
}

/**
 * Mock koç bilgisi
 */
export function getMockCoach(teamId: number) {
  return MOCK_API_FOOTBALL.coaches[teamId] || null;
}

/**
 * Mock kadro
 */
export function getMockSquad(teamId: number) {
  return MOCK_API_FOOTBALL.squads[teamId] || [];
}

/**
 * Topluluk tahmin verisi al - veri yoksa boş döner
 */
export function getCommunityPredictions(matchId: number) {
  const data = MOCK_COMMUNITY.matchPredictions[matchId];
  if (!data || !data.hasSufficientData) {
    return getEmptyCommunityResponse();
  }
  return data;
}

/**
 * Topluluk koç reytingleri - veri yoksa boş döner
 */
export function getCommunityCoachRatings() {
  if (!MOCK_COMMUNITY.coachRatings.hasSufficientData) {
    return getEmptyCommunityResponse();
  }
  return MOCK_COMMUNITY.coachRatings;
}

/**
 * Topluluk oyuncu reytingleri - veri yoksa boş döner
 */
export function getCommunityPlayerRatings(playerId?: number) {
  if (!MOCK_COMMUNITY.playerRatings.hasSufficientData) {
    return getEmptyCommunityResponse();
  }
  if (playerId) {
    return MOCK_COMMUNITY.playerRatings.players[playerId] || getEmptyCommunityResponse();
  }
  return MOCK_COMMUNITY.playerRatings;
}

/**
 * Topluluk kadro tahmini - veri yoksa boş döner
 */
export function getCommunitySquadPredictions(matchId: number) {
  if (!MOCK_COMMUNITY.squadPredictions.hasSufficientData) {
    return getEmptyCommunityResponse();
  }
  return MOCK_COMMUNITY.squadPredictions;
}

/**
 * Topluluk sinyalleri - veri yoksa boş döner
 */
export function getCommunitySignals(playerId: number) {
  if (!MOCK_COMMUNITY.communitySignals.hasSufficientData) {
    return getEmptyCommunityResponse();
  }
  return MOCK_COMMUNITY.communitySignals.signals[playerId] || getEmptyCommunityResponse();
}

/**
 * Değişiklik oyları - veri yoksa boş döner
 */
export function getSubstitutionVotes(matchId: number) {
  if (!MOCK_COMMUNITY.substitutionVotes.hasSufficientData) {
    return getEmptyCommunityResponse();
  }
  return MOCK_COMMUNITY.substitutionVotes;
}
