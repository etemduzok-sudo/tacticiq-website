// Mock Data Service - For development when API is not available
// TacticIQ

export const mockMatches = {
  live: [
    {
      id: 1,
      home_team: { id: 1, name: 'Galatasaray', logo: 'https://media.api-sports.io/football/teams/559.png' },
      away_team: { id: 2, name: 'Fenerbahçe', logo: 'https://media.api-sports.io/football/teams/610.png' },
      league: { id: 1, name: 'Süper Lig', country: 'Turkey', logo: 'https://media.api-sports.io/football/leagues/203.png' },
      date: new Date().toISOString(),
      status_short: 'LIVE',
      status_long: 'In Play',
      elapsed: 67,
      home_score: 2,
      away_score: 1,
    },
    {
      id: 2,
      home_team: { id: 3, name: 'Beşiktaş', logo: 'https://media.api-sports.io/football/teams/609.png' },
      away_team: { id: 4, name: 'Trabzonspor', logo: 'https://media.api-sports.io/football/teams/612.png' },
      league: { id: 1, name: 'Süper Lig', country: 'Turkey', logo: 'https://media.api-sports.io/football/leagues/203.png' },
      date: new Date().toISOString(),
      status_short: '2H',
      status_long: 'Second Half',
      elapsed: 78,
      home_score: 1,
      away_score: 1,
    },
  ],
  upcoming: [
    {
      id: 3,
      home_team: { id: 5, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png' },
      away_team: { id: 6, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
      league: { id: 2, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
      date: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      status_short: 'NS',
      status_long: 'Not Started',
      elapsed: 0,
      home_score: null,
      away_score: null,
    },
    {
      id: 4,
      home_team: { id: 7, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
      away_team: { id: 8, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
      league: { id: 3, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
      date: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      status_short: 'NS',
      status_long: 'Not Started',
      elapsed: 0,
      home_score: null,
      away_score: null,
    },
  ],
  finished: [
    {
      id: 5,
      home_team: { id: 9, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
      away_team: { id: 10, name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' },
      league: { id: 4, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
      date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      status_short: 'FT',
      status_long: 'Match Finished',
      elapsed: 90,
      home_score: 3,
      away_score: 2,
    },
  ],
};

export const mockTeams = [
  { id: 1, name: 'Galatasaray', logo: 'https://media.api-sports.io/football/teams/559.png', code: 'GAL' },
  { id: 2, name: 'Fenerbahçe', logo: 'https://media.api-sports.io/football/teams/610.png', code: 'FEN' },
  { id: 3, name: 'Beşiktaş', logo: 'https://media.api-sports.io/football/teams/609.png', code: 'BES' },
  { id: 4, name: 'Trabzonspor', logo: 'https://media.api-sports.io/football/teams/612.png', code: 'TRA' },
  { id: 5, name: 'Manchester City', logo: 'https://media.api-sports.io/football/teams/50.png', code: 'MCI' },
  { id: 6, name: 'Liverpool', logo: 'https://media.api-sports.io/football/teams/40.png', code: 'LIV' },
  { id: 7, name: 'Real Madrid', logo: 'https://media.api-sports.io/football/teams/541.png', code: 'RMA' },
  { id: 8, name: 'Barcelona', logo: 'https://media.api-sports.io/football/teams/529.png', code: 'BAR' },
  { id: 9, name: 'Bayern Munich', logo: 'https://media.api-sports.io/football/teams/157.png', code: 'BAY' },
  { id: 10, name: 'Borussia Dortmund', logo: 'https://media.api-sports.io/football/teams/165.png', code: 'BVB' },
];

export const mockLeagues = [
  { id: 1, name: 'Süper Lig', country: 'Turkey', logo: 'https://media.api-sports.io/football/leagues/203.png' },
  { id: 2, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 3, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 4, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 5, name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
];

/**
 * Transform mock match to API format
 */
function transformMockMatchToApiFormat(mockMatch: any): any {
  const timestamp = mockMatch.date ? new Date(mockMatch.date).getTime() / 1000 : Date.now() / 1000;
  
  return {
    id: mockMatch.id,
    fixture: {
      id: mockMatch.id,
      date: mockMatch.date || new Date().toISOString(),
      timestamp: timestamp,
      status: {
        short: mockMatch.status_short || 'NS',
        long: mockMatch.status_long || 'Not Started',
        elapsed: mockMatch.elapsed || null,
      },
      venue: {
        name: 'Stadium',
        city: null,
      },
    },
    league: mockMatch.league || {
      id: null,
      name: null,
      country: null,
      logo: null,
    },
    teams: {
      home: mockMatch.home_team || {
        id: null,
        name: null,
        logo: null,
      },
      away: mockMatch.away_team || {
        id: null,
        name: null,
        logo: null,
      },
    },
    goals: {
      home: mockMatch.home_score || null,
      away: mockMatch.away_score || null,
    },
    score: {
      halftime: {
        home: mockMatch.home_score ? Math.floor(mockMatch.home_score / 2) : null,
        away: mockMatch.away_score ? Math.floor(mockMatch.away_score / 2) : null,
      },
      fulltime: {
        home: mockMatch.home_score || null,
        away: mockMatch.away_score || null,
      },
    },
  };
}

/**
 * Get mock matches based on status
 */
export function getMockMatches(status: 'live' | 'upcoming' | 'finished' | 'all' = 'all') {
  let matches: any[];
  if (status === 'all') {
    matches = [...mockMatches.live, ...mockMatches.upcoming, ...mockMatches.finished];
  } else {
    matches = mockMatches[status];
  }
  
  // Transform to API format
  return matches.map(transformMockMatchToApiFormat);
}

/**
 * Get mock match by ID
 */
export function getMockMatchById(matchId: number) {
  const allMatches = [...mockMatches.live, ...mockMatches.upcoming, ...mockMatches.finished];
  const match = allMatches.find(m => m.id === matchId);
  return match ? transformMockMatchToApiFormat(match) : null;
}

/**
 * Get mock matches by date
 */
export function getMockMatchesByDate(date: string) {
  const targetDate = new Date(date);
  const allMatches = [...mockMatches.live, ...mockMatches.upcoming, ...mockMatches.finished];
  
  const filtered = allMatches.filter(match => {
    const matchDate = new Date(match.date);
    return matchDate.toDateString() === targetDate.toDateString();
  });
  
  // Transform to API format
  return filtered.map(transformMockMatchToApiFormat);
}

/**
 * Get mock team by ID
 */
export function getMockTeamById(teamId: number) {
  return mockTeams.find(t => t.id === teamId);
}

/**
 * Search mock teams
 */
export function searchMockTeams(query: string) {
  return mockTeams.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase())
  );
}

/**
 * Get mock league by ID
 */
export function getMockLeagueById(leagueId: number) {
  return mockLeagues.find(l => l.id === leagueId);
}

/**
 * Get all mock leagues
 */
export function getAllMockLeagues() {
  return mockLeagues;
}
