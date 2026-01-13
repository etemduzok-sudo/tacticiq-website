// User Limits & Subscription Types
// TacticIQ

export enum UserType {
  FREE = 'free',
  PRO = 'pro',
}

export interface UserLimits {
  maxClubTeams: number;
  maxNationalTeams: number;
  totalTeams: number;
  canSelectClubs: boolean;
}

export const USER_LIMITS: Record<UserType, UserLimits> = {
  [UserType.FREE]: {
    maxClubTeams: 0,
    maxNationalTeams: 1,
    totalTeams: 1,
    canSelectClubs: false,
  },
  [UserType.PRO]: {
    maxClubTeams: 5,
    maxNationalTeams: 1,
    totalTeams: 6,
    canSelectClubs: true,
  },
};

// Helper: Check if team is national team
export function isNationalTeam(teamName: string): boolean {
  const nationalTeamKeywords = [
    'National',
    'Turkey',
    'Brazil',
    'Argentina',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'England',
    'Portugal',
    'Netherlands',
    'Belgium',
    'Croatia',
    'Uruguay',
    'Colombia',
    'Mexico',
    'USA',
    'Japan',
    'South Korea',
    'Saudi Arabia',
    'Morocco',
    'Senegal',
    'Ghana',
    'Nigeria',
    'Egypt',
    'Algeria',
    'Cameroon',
    'Tunisia',
    'Australia',
    'Denmark',
    'Sweden',
    'Norway',
    'Poland',
    'Switzerland',
    'Austria',
    'Czech Republic',
    'Serbia',
    'Ukraine',
    'Wales',
    'Scotland',
    'Ireland',
    'Greece',
    'Romania',
    'Hungary',
    'Chile',
    'Peru',
    'Ecuador',
    'Paraguay',
    'Venezuela',
    'Costa Rica',
    'Panama',
    'Canada',
    'Iran',
    'Qatar',
    'UAE',
    'Iraq',
    'China',
    'India',
    'Thailand',
    'Vietnam',
    'Indonesia',
    'Malaysia',
    'Philippines',
    'New Zealand',
  ];

  return nationalTeamKeywords.some(keyword =>
    teamName.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Helper: Get user limits
export function getUserLimits(isPro: boolean): UserLimits {
  return USER_LIMITS[isPro ? UserType.PRO : UserType.FREE];
}

// Helper: Check if user can add more teams
export function canAddTeam(
  currentTeams: any[],
  isPro: boolean,
  isNational: boolean
): { canAdd: boolean; reason?: string } {
  const limits = getUserLimits(isPro);
  
  // Count current teams
  const clubCount = currentTeams.filter(t => !isNationalTeam(t.name)).length;
  const nationalCount = currentTeams.filter(t => isNationalTeam(t.name)).length;

  // Check if trying to add club team as free user
  if (!isPro && !isNational) {
    return {
      canAdd: false,
      reason: 'Kulüp takımı seçmek için PRO üyelik gerekli',
    };
  }

  // Check national team limit
  if (isNational && nationalCount >= limits.maxNationalTeams) {
    return {
      canAdd: false,
      reason: `Maksimum ${limits.maxNationalTeams} milli takım seçebilirsiniz`,
    };
  }

  // Check club team limit
  if (!isNational && clubCount >= limits.maxClubTeams) {
    return {
      canAdd: false,
      reason: `Maksimum ${limits.maxClubTeams} kulüp takımı seçebilirsiniz`,
    };
  }

  // Check total limit
  if (currentTeams.length >= limits.totalTeams) {
    return {
      canAdd: false,
      reason: `Maksimum ${limits.totalTeams} takım seçebilirsiniz`,
    };
  }

  return { canAdd: true };
}
