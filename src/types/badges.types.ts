// Badge Types
// TacticIQ - Uzmanlık Rozetleri Sistemi

/**
 * Badge Categories
 */
export enum BadgeCategory {
  LEAGUE_EXPERT = 'league_expert',      // Lig Uzmanı
  CLUSTER_MASTER = 'cluster_master',    // Küme Ustası
  STREAK_KING = 'streak_king',          // Seri Kralı
  PREDICTION_GOD = 'prediction_god',    // Tahmin Tanrısı
  EARLY_BIRD = 'early_bird',            // Erken Kuş
  COMEBACK_KING = 'comeback_king',      // Geri Dönüş Kralı
}

/**
 * Badge Tiers
 */
export enum BadgeTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

/**
 * Badge Interface
 */
export interface Badge {
  id: string;
  category: BadgeCategory;
  tier: BadgeTier;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement: string;
  progress?: number;
  maxProgress?: number;
  earned: boolean;
  earnedAt?: string;
}

/**
 * League Expert Badges
 */
export const LEAGUE_EXPERT_BADGES: Record<string, Omit<Badge, 'id' | 'earned' | 'earnedAt' | 'progress' | 'maxProgress'>> = {
  PREMIER_LEAGUE_BRONZE: {
    category: BadgeCategory.LEAGUE_EXPERT,
    tier: BadgeTier.BRONZE,
    name: 'Premier Lig Tanıdık',
    description: 'Premier Lig\'de 10 doğru tahmin',
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    color: '#CD7F32',
    requirement: '10 doğru tahmin',
  },
  PREMIER_LEAGUE_SILVER: {
    category: BadgeCategory.LEAGUE_EXPERT,
    tier: BadgeTier.SILVER,
    name: 'Premier Lig Bilgini',
    description: 'Premier Lig\'de %70+ doğruluk',
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    color: '#C0C0C0',
    requirement: '%70+ doğruluk',
  },
  PREMIER_LEAGUE_GOLD: {
    category: BadgeCategory.LEAGUE_EXPERT,
    tier: BadgeTier.GOLD,
    name: 'Premier Lig Gurusu',
    description: 'Premier Lig\'de %85+ doğruluk',
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    color: '#FFD700',
    requirement: '%85+ doğruluk',
  },
  
  SUPER_LIG_BRONZE: {
    category: BadgeCategory.LEAGUE_EXPERT,
    tier: BadgeTier.BRONZE,
    name: 'Süper Lig Tanıdık',
    description: 'Süper Lig\'de 10 doğru tahmin',
    icon: '🇹🇷',
    color: '#CD7F32',
    requirement: '10 doğru tahmin',
  },
  SUPER_LIG_GOLD: {
    category: BadgeCategory.LEAGUE_EXPERT,
    tier: BadgeTier.GOLD,
    name: 'Süper Lig Gurusu',
    description: 'Süper Lig\'de %85+ doğruluk',
    icon: '🇹🇷',
    color: '#FFD700',
    requirement: '%85+ doğruluk',
  },
  
  LA_LIGA_GOLD: {
    category: BadgeCategory.LEAGUE_EXPERT,
    tier: BadgeTier.GOLD,
    name: 'La Liga Gurusu',
    description: 'La Liga\'da %85+ doğruluk',
    icon: '🇪🇸',
    color: '#FFD700',
    requirement: '%85+ doğruluk',
  },
};

/**
 * Cluster Master Badges
 */
export const CLUSTER_MASTER_BADGES: Record<string, Omit<Badge, 'id' | 'earned' | 'earnedAt' | 'progress' | 'maxProgress'>> = {
  TEMPO_MASTER: {
    category: BadgeCategory.CLUSTER_MASTER,
    tier: BadgeTier.GOLD,
    name: 'Tempo Ustası',
    description: 'Tempo & Akış kümesinde %80+ doğruluk',
    icon: '⚡',
    color: '#F59E0B',
    requirement: '%80+ doğruluk',
  },
  DISCIPLINE_MASTER: {
    category: BadgeCategory.CLUSTER_MASTER,
    tier: BadgeTier.GOLD,
    name: 'Disiplin Ustası',
    description: 'Disiplin kümesinde %80+ doğruluk',
    icon: '🟨',
    color: '#EAB308',
    requirement: '%80+ doğruluk',
  },
  PHYSICAL_MASTER: {
    category: BadgeCategory.CLUSTER_MASTER,
    tier: BadgeTier.GOLD,
    name: 'Fiziksel Analiz Ustası',
    description: 'Fiziksel & Yıpranma kümesinde %80+ doğruluk',
    icon: '💪',
    color: '#059669',
    requirement: '%80+ doğruluk',
  },
  INDIVIDUAL_MASTER: {
    category: BadgeCategory.CLUSTER_MASTER,
    tier: BadgeTier.GOLD,
    name: 'Bireysel Performans Ustası',
    description: 'Bireysel Performans kümesinde %80+ doğruluk',
    icon: '⭐',
    color: '#3B82F6',
    requirement: '%80+ doğruluk',
  },
};

/**
 * Streak King Badges
 */
export const STREAK_BADGES: Record<string, Omit<Badge, 'id' | 'earned' | 'earnedAt' | 'progress' | 'maxProgress'>> = {
  STREAK_5: {
    category: BadgeCategory.STREAK_KING,
    tier: BadgeTier.BRONZE,
    name: 'Seri Başlangıcı',
    description: '5 ardışık doğru tahmin',
    icon: '🔥',
    color: '#CD7F32',
    requirement: '5 seri',
  },
  STREAK_10: {
    category: BadgeCategory.STREAK_KING,
    tier: BadgeTier.SILVER,
    name: 'Seri Ustası',
    description: '10 ardışık doğru tahmin',
    icon: '🔥',
    color: '#C0C0C0',
    requirement: '10 seri',
  },
  STREAK_20: {
    category: BadgeCategory.STREAK_KING,
    tier: BadgeTier.GOLD,
    name: 'Seri Kralı',
    description: '20 ardışık doğru tahmin',
    icon: '🔥',
    color: '#FFD700',
    requirement: '20 seri',
  },
  STREAK_50: {
    category: BadgeCategory.STREAK_KING,
    tier: BadgeTier.DIAMOND,
    name: 'Seri Efsanesi',
    description: '50 ardışık doğru tahmin',
    icon: '🔥',
    color: '#B9F2FF',
    requirement: '50 seri',
  },
};

/**
 * Prediction God Badges
 */
export const PREDICTION_GOD_BADGES: Record<string, Omit<Badge, 'id' | 'earned' | 'earnedAt' | 'progress' | 'maxProgress'>> = {
  PERFECT_MATCH: {
    category: BadgeCategory.PREDICTION_GOD,
    tier: BadgeTier.PLATINUM,
    name: 'Mükemmel Maç',
    description: 'Bir maçta tüm tahminleri doğru yap',
    icon: '💯',
    color: '#E5E4E2',
    requirement: '%100 doğruluk',
  },
  PREDICTION_MASTER: {
    category: BadgeCategory.PREDICTION_GOD,
    tier: BadgeTier.GOLD,
    name: 'Tahmin Ustası',
    description: '100 doğru tahmin',
    icon: '🎯',
    color: '#FFD700',
    requirement: '100 tahmin',
  },
  PREDICTION_LEGEND: {
    category: BadgeCategory.PREDICTION_GOD,
    tier: BadgeTier.DIAMOND,
    name: 'Tahmin Efsanesi',
    description: '500 doğru tahmin',
    icon: '🎯',
    color: '#B9F2FF',
    requirement: '500 tahmin',
  },
};

/**
 * Get badge color by tier
 */
export function getBadgeColor(tier: BadgeTier): string {
  switch (tier) {
    case BadgeTier.BRONZE:
      return '#CD7F32';
    case BadgeTier.SILVER:
      return '#C0C0C0';
    case BadgeTier.GOLD:
      return '#FFD700';
    case BadgeTier.PLATINUM:
      return '#E5E4E2';
    case BadgeTier.DIAMOND:
      return '#B9F2FF';
    default:
      return '#9CA3AF';
  }
}

/**
 * Get badge tier name
 */
export function getBadgeTierName(tier: BadgeTier): string {
  switch (tier) {
    case BadgeTier.BRONZE:
      return 'Bronz';
    case BadgeTier.SILVER:
      return 'Gümüş';
    case BadgeTier.GOLD:
      return 'Altın';
    case BadgeTier.PLATINUM:
      return 'Platin';
    case BadgeTier.DIAMOND:
      return 'Elmas';
    default:
      return '';
  }
}
