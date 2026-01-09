// Match Types - Type Safety Improvement
// Replacing 'any' types with proper TypeScript interfaces

export interface Team {
  id: number;
  name: string;
  logo: string;
  code?: string;
  country?: string;
  founded?: number;
  national?: boolean;
}

export interface Venue {
  id: number | null;
  name: string;
  city: string | null;
  capacity?: number;
  surface?: string;
  image?: string;
}

export interface FixtureStatus {
  long: string;
  short: string;
  elapsed: number | null;
  extra: number | null;
}

export interface Fixture {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  venue: Venue;
  status: FixtureStatus;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface Goals {
  home: number | null;
  away: number | null;
}

export interface MatchScore {
  halftime: Score;
  fulltime: Score;
  extratime: Score;
  penalty: Score;
}

export interface MatchTeams {
  home: Team & { winner: boolean | null };
  away: Team & { winner: boolean | null };
}

export interface Player {
  id: number;
  name: string;
  photo?: string;
  age?: number;
  number?: number;
  position?: string;
  rating?: string;
}

export interface MatchEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: Team;
  player: Player;
  assist: Player | null;
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
  comments: string | null;
}

export interface Statistic {
  type: string;
  value: number | string | null;
}

export interface TeamStatistics {
  team: Team;
  statistics: Statistic[];
}

export interface LineupPlayer {
  player: Player;
  statistics: {
    games: {
      minutes: number | null;
      number: number;
      position: string;
      rating: string | null;
      captain: boolean;
      substitute: boolean;
    };
  };
}

export interface Lineup {
  team: Team;
  formation: string;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
  coach: {
    id: number;
    name: string;
    photo: string;
  };
}

export interface Match {
  fixture: Fixture;
  league: League;
  teams: MatchTeams;
  goals: Goals;
  score: MatchScore;
  events?: MatchEvent[];
}

export interface MatchDetails extends Match {
  statistics?: TeamStatistics[];
  lineups?: Lineup[];
  players?: any[]; // TODO: Define proper player statistics type
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cached?: boolean;
  error?: string;
}

// Match Status Helpers
export type MatchStatus = 'NS' | 'TBD' | 'PST' | '1H' | 'HT' | '2H' | 'ET' | 'P' | 'FT' | 'AET' | 'PEN' | 'BT' | 'SUSP' | 'INT' | 'ABD' | 'AWD' | 'WO' | 'LIVE' | 'CANC';

export const LIVE_STATUSES: MatchStatus[] = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'];
export const FINISHED_STATUSES: MatchStatus[] = ['FT', 'AET', 'PEN', 'AWD', 'WO'];
export const UPCOMING_STATUSES: MatchStatus[] = ['NS', 'TBD', 'PST'];
