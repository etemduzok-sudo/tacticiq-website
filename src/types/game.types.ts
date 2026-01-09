// Game Flow Types - Zaman, Event ve Oyun Sistemleri

// ======================
// TIME SYSTEM
// ======================

export interface TimeSystem {
  realTime: number;        // Gerçek saniye
  gameTime: number;        // Oyun dakikası
  speedMultiplier: number; // Hız çarpanı (1x, 2x, 3x)
  isPaused: boolean;
  startTime: number;
  elapsedTime: number;
}

export type TimeSpeed = 1 | 2 | 3;

// ======================
// EVENT SYSTEM
// ======================

export type EventType = 'training' | 'match' | 'season' | 'bootcamp';
export type EventChoiceType = 'safe' | 'smart' | 'risky';

export interface EventEffect {
  physical?: number;    // -100 to +100
  morale?: number;      // -100 to +100
  injury?: number;      // -100 to +100
  tactics?: number;     // -100 to +100
  fitness?: number;     // -100 to +100
  teamwork?: number;    // -100 to +100
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  type: EventChoiceType;
  effects: EventEffect;
  consequences: string[];
  icon?: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  timestamp: number;      // Game time when event occurs
  title: string;
  description: string;
  choices: EventChoice[];
  defaultChoice?: string; // Auto-select if no response
  timeout: number;        // Seconds before auto-select
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ======================
// MOMENTUM SYSTEM
// ======================

export type MomentumTrend = 'rising' | 'falling' | 'stable';

export interface MomentumSystem {
  current: number;        // -100 (opponent) to +100 (us)
  trend: MomentumTrend;
  history: number[];      // Last 10 values
}

// ======================
// TRAINING SYSTEM
// ======================

export type TrainingType = 'light' | 'standard' | 'intense' | 'tactical' | 'mental' | 'regeneration';
export type TrainingPhase = 'warmup' | 'main' | 'cooldown' | 'finished';

export interface TrainingSession {
  id: string;
  type: TrainingType;
  duration: number;       // Minutes
  intensity: number;      // 0-100
  phase: TrainingPhase;
  events: GameEvent[];
  feedItems: FeedItem[];
  effects: EventEffect;
}

export interface TrainingConfig {
  type: TrainingType;
  minDuration: number;
  maxDuration: number;
  intensity: number;
  eventCount: number;
  effects: EventEffect;
}

// ======================
// MATCH SYSTEM
// ======================

export type MatchPhase = 'pre' | 'first-half' | 'half-time' | 'second-half' | 'final-10' | 'finished';
export type MatchEventType = 'goal' | 'yellow-card' | 'red-card' | 'substitution' | 'injury' | 'chance' | 'pressure';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  minute: number;
  team: 'home' | 'away';
  player?: string;
  description: string;
  icon: string;
}

export interface MatchState {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  phase: MatchPhase;
  minute: number;
  momentum: MomentumSystem;
  events: MatchEvent[];
  feedItems: FeedItem[];
}

// ======================
// SEASON SYSTEM
// ======================

export type SeasonPhase = 'bootcamp' | 'early' | 'mid' | 'late' | 'final';
export type DayType = 'training' | 'match' | 'rest' | 'recovery' | 'travel' | 'event';

export interface SeasonDay {
  number: number;         // 1-34 (or more)
  date: Date;
  type: DayType;
  activity?: TrainingSession | MatchState;
  events: GameEvent[];
  risks: string[];
  opportunities: string[];
  isCompleted: boolean;
}

export interface SeasonState {
  id: string;
  name: string;
  currentDay: number;
  totalDays: number;
  phase: SeasonPhase;
  days: SeasonDay[];
  teamStats: TeamStats;
}

// ======================
// BOOTCAMP SYSTEM
// ======================

export type BootcampPhase = 'arrival' | 'training' | 'bonding' | 'friendly' | 'final';

export interface BootcampState {
  id: string;
  currentDay: number;
  totalDays: number;
  phase: BootcampPhase;
  teamCohesion: number;   // 0-100
  fitness: number;        // 0-100
  morale: number;         // 0-100
  managerStyle: ManagerStyle;
  events: GameEvent[];
}

export interface ManagerStyle {
  defensive: number;      // 0-100
  attacking: number;      // 0-100
  patient: number;        // 0-100
  aggressive: number;     // 0-100
  balanced: number;       // 0-100
}

// ======================
// FEED SYSTEM
// ======================

export type FeedItemType = 'info' | 'warning' | 'success' | 'error' | 'event';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  timestamp: number;      // Game time
  message: string;
  icon?: string;
  color?: string;
}

// ======================
// TEAM STATS
// ======================

export interface TeamStats {
  physical: number;       // 0-100
  morale: number;         // 0-100
  tactics: number;        // 0-100
  fitness: number;        // 0-100
  teamwork: number;       // 0-100
  injuryRisk: number;     // 0-100
  fatigue: number;        // 0-100
}

// ======================
// GAME STATE
// ======================

export type GameMode = 'bootcamp' | 'season' | 'training' | 'match';

export interface GameState {
  mode: GameMode;
  timeSystem: TimeSystem;
  bootcamp?: BootcampState;
  season?: SeasonState;
  currentTraining?: TrainingSession;
  currentMatch?: MatchState;
  teamStats: TeamStats;
}
