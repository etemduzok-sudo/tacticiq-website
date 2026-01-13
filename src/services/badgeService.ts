// Badge Service
// TacticIQ - Rozet Kazanma ve Yönetim Sistemi

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  Badge,
  BadgeCategory,
  BadgeTier,
  LEAGUE_EXPERT_BADGES,
  CLUSTER_MASTER_BADGES,
  STREAK_BADGES,
  PREDICTION_GOD_BADGES,
} from '../types/badges.types';
import { AnalysisCluster } from '../types/prediction.types';

const STORAGE_KEY = 'fan-manager-user-badges';
const SHOWN_BADGES_KEY = 'fan-manager-shown-badges'; // Track which badges have been shown in notifications

/**
 * User Stats Interface
 */
export interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  
  // League-specific stats
  leagueStats: {
    [leagueId: string]: {
      total: number;
      correct: number;
      accuracy: number;
    };
  };
  
  // Cluster-specific stats
  clusterStats: {
    [cluster in AnalysisCluster]: {
      total: number;
      correct: number;
      accuracy: number;
    };
  };
  
  // Perfect matches
  perfectMatches: number;
}

/**
 * Get user badges from storage
 */
export const getUserBadges = async (): Promise<Badge[]> => {
  try {
    const badgesJson = await AsyncStorage.getItem(STORAGE_KEY);
    if (!badgesJson) return [];
    return JSON.parse(badgesJson);
  } catch (error) {
    console.error('Error loading badges:', error);
    return [];
  }
};

/**
 * Save user badges to storage
 */
const saveBadges = async (badges: Badge[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(badges));
  } catch (error) {
    console.error('Error saving badges:', error);
  }
};

/**
 * Award a badge to the user (Internal - no popup)
 */
const awardBadge = async (badgeId: string, badgeData: Omit<Badge, 'id' | 'earned' | 'earnedAt'>): Promise<boolean> => {
  try {
    const existingBadges = await getUserBadges();
    
    // Check if badge already earned
    if (existingBadges.some(b => b.id === badgeId)) {
      return false; // Already has this badge
    }
    
    const newBadge: Badge = {
      ...badgeData,
      id: badgeId,
      earned: true,
      earnedAt: new Date().toISOString(),
    };
    
    const updatedBadges = [...existingBadges, newBadge];
    await saveBadges(updatedBadges);
    
    console.log('✅ Badge awarded:', badgeId, newBadge.name);
    
    return true;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
};

/**
 * Show badge earned popup
 */
const showBadgePopup = (badge: Badge): void => {
  Alert.alert(
    `🎉 Yeni Rozet Kazandın!`,
    `${badge.icon} ${badge.name}\n\n${badge.description}`,
    [
      { text: 'Paylaş', onPress: () => shareBadge(badge) },
      { text: 'Tamam', style: 'cancel' },
    ]
  );
};

/**
 * Share badge (placeholder)
 */
const shareBadge = (badge: Badge): void => {
  console.log('Sharing badge:', badge.name);
  // TODO: Implement social sharing
};

/**
 * Badge Award Result
 */
export interface BadgeAwardResult {
  badge: Badge;
  isNewBadge: boolean;
}

/**
 * Check and award badges based on user stats (IDEMPOTENT)
 * Returns only newly awarded badges with isNewBadge flag
 */
export const checkAndAwardBadges = async (userStats: UserStats): Promise<BadgeAwardResult[]> => {
  const newBadgeResults: BadgeAwardResult[] = [];
  const existingBadges = await getUserBadges();
  const existingBadgeIds = new Set(existingBadges.map(b => b.id));
  
  // Helper function to check and award
  const tryAwardBadge = async (
    badgeId: string, 
    badgeData: Omit<Badge, 'id' | 'earned' | 'earnedAt'>
  ): Promise<boolean> => {
    // IDEMPOTENT: Skip if already earned
    if (existingBadgeIds.has(badgeId)) {
      return false;
    }
    
    const awarded = await awardBadge(badgeId, badgeData);
    if (awarded) {
      const newBadge: Badge = {
        ...badgeData,
        id: badgeId,
        earned: true,
        earnedAt: new Date().toISOString(),
      };
      newBadgeResults.push({
        badge: newBadge,
        isNewBadge: true,
      });
      return true;
    }
    return false;
  };
  
  // 1. Check League Expert Badges
  for (const [leagueId, stats] of Object.entries(userStats.leagueStats)) {
    // Süper Lig (203)
    if (leagueId === '203') {
      if (stats.correct >= 10 && stats.accuracy < 70) {
        await tryAwardBadge('SUPER_LIG_BRONZE', LEAGUE_EXPERT_BADGES.SUPER_LIG_BRONZE);
      }
      if (stats.accuracy >= 85) {
        await tryAwardBadge('SUPER_LIG_GOLD', LEAGUE_EXPERT_BADGES.SUPER_LIG_GOLD);
      }
    }
    
    // Premier League (39)
    if (leagueId === '39') {
      if (stats.correct >= 10 && stats.accuracy < 70) {
        await tryAwardBadge('PREMIER_LEAGUE_BRONZE', LEAGUE_EXPERT_BADGES.PREMIER_LEAGUE_BRONZE);
      }
      if (stats.accuracy >= 70 && stats.accuracy < 85) {
        await tryAwardBadge('PREMIER_LEAGUE_SILVER', LEAGUE_EXPERT_BADGES.PREMIER_LEAGUE_SILVER);
      }
      if (stats.accuracy >= 85) {
        await tryAwardBadge('PREMIER_LEAGUE_GOLD', LEAGUE_EXPERT_BADGES.PREMIER_LEAGUE_GOLD);
      }
    }
    
    // La Liga (140)
    if (leagueId === '140') {
      if (stats.accuracy >= 85) {
        await tryAwardBadge('LA_LIGA_GOLD', LEAGUE_EXPERT_BADGES.LA_LIGA_GOLD);
      }
    }
  }
  
  // 2. Check Cluster Master Badges
  for (const [cluster, stats] of Object.entries(userStats.clusterStats)) {
    if (stats.accuracy >= 80) {
      switch (cluster) {
        case AnalysisCluster.TEMPO_FLOW:
          await tryAwardBadge('TEMPO_MASTER', CLUSTER_MASTER_BADGES.TEMPO_MASTER);
          break;
        case AnalysisCluster.DISCIPLINE:
          await tryAwardBadge('DISCIPLINE_MASTER', CLUSTER_MASTER_BADGES.DISCIPLINE_MASTER);
          break;
        case AnalysisCluster.PHYSICAL_WEAR:
          await tryAwardBadge('PHYSICAL_MASTER', CLUSTER_MASTER_BADGES.PHYSICAL_MASTER);
          break;
        case AnalysisCluster.INDIVIDUAL_PERFORMANCE:
          await tryAwardBadge('INDIVIDUAL_MASTER', CLUSTER_MASTER_BADGES.INDIVIDUAL_MASTER);
          break;
      }
    }
  }
  
  // 3. Check Streak Badges
  if (userStats.currentStreak >= 5 && userStats.currentStreak < 10) {
    await tryAwardBadge('STREAK_5', STREAK_BADGES.STREAK_5);
  }
  if (userStats.currentStreak >= 10 && userStats.currentStreak < 20) {
    await tryAwardBadge('STREAK_10', STREAK_BADGES.STREAK_10);
  }
  if (userStats.currentStreak >= 20 && userStats.currentStreak < 50) {
    await tryAwardBadge('STREAK_20', STREAK_BADGES.STREAK_20);
  }
  if (userStats.currentStreak >= 50) {
    await tryAwardBadge('STREAK_50', STREAK_BADGES.STREAK_50);
  }
  
  // 4. Check Prediction God Badges
  if (userStats.perfectMatches >= 1) {
    await tryAwardBadge('PERFECT_MATCH', PREDICTION_GOD_BADGES.PERFECT_MATCH);
  }
  if (userStats.correctPredictions >= 100 && userStats.correctPredictions < 500) {
    await tryAwardBadge('PREDICTION_MASTER', PREDICTION_GOD_BADGES.PREDICTION_MASTER);
  }
  if (userStats.correctPredictions >= 500) {
    await tryAwardBadge('PREDICTION_LEGEND', PREDICTION_GOD_BADGES.PREDICTION_LEGEND);
  }
  
  // 5. "Keskin Göz" Badge (Custom Rule)
  if (userStats.accuracy >= 80 && userStats.totalPredictions >= 10) {
    await tryAwardBadge('SHARP_EYE', {
      category: BadgeCategory.PREDICTION_GOD,
      tier: BadgeTier.GOLD,
      name: 'Keskin Göz',
      description: '%80+ doğruluk oranı ve 10+ tahmin',
      icon: '👁️',
      color: '#FFD700',
      requirement: '%80+ doğruluk, 10+ tahmin',
    });
  }
  
  return newBadgeResults;
};

/**
 * Get user's top badges (for leaderboard display)
 */
export const getTopBadges = async (limit: number = 3): Promise<string[]> => {
  try {
    const badges = await getUserBadges();
    
    // Sort by tier (Diamond > Platinum > Gold > Silver > Bronze)
    const tierOrder = {
      [BadgeTier.DIAMOND]: 5,
      [BadgeTier.PLATINUM]: 4,
      [BadgeTier.GOLD]: 3,
      [BadgeTier.SILVER]: 2,
      [BadgeTier.BRONZE]: 1,
    };
    
    const sortedBadges = badges.sort((a, b) => {
      return tierOrder[b.tier] - tierOrder[a.tier];
    });
    
    return sortedBadges.slice(0, limit).map(b => b.icon);
  } catch (error) {
    console.error('Error getting top badges:', error);
    return [];
  }
};

/**
 * Get all available badges (earned + locked)
 */
export const getAllAvailableBadges = async (): Promise<Badge[]> => {
  const earnedBadges = await getUserBadges();
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.id));
  
  const allBadges: Badge[] = [...earnedBadges];
  
  // Add locked badges
  const addLockedBadge = (id: string, badgeData: Omit<Badge, 'id' | 'earned' | 'earnedAt'>) => {
    if (!earnedBadgeIds.has(id)) {
      allBadges.push({
        ...badgeData,
        id,
        earned: false,
      });
    }
  };
  
  // League Expert Badges
  Object.entries(LEAGUE_EXPERT_BADGES).forEach(([id, badge]) => {
    addLockedBadge(id, badge);
  });
  
  // Cluster Master Badges
  Object.entries(CLUSTER_MASTER_BADGES).forEach(([id, badge]) => {
    addLockedBadge(id, badge);
  });
  
  // Streak Badges
  Object.entries(STREAK_BADGES).forEach(([id, badge]) => {
    addLockedBadge(id, badge);
  });
  
  // Prediction God Badges
  Object.entries(PREDICTION_GOD_BADGES).forEach(([id, badge]) => {
    addLockedBadge(id, badge);
  });
  
  // Custom Badges
  addLockedBadge('SHARP_EYE', {
    category: BadgeCategory.PREDICTION_GOD,
    tier: BadgeTier.GOLD,
    name: 'Keskin Göz',
    description: '%80+ doğruluk oranı ve 10+ tahmin',
    icon: '👁️',
    color: '#FFD700',
    requirement: '%80+ doğruluk, 10+ tahmin',
  });
  
  return allBadges;
};

/**
 * Get badge progress (for UI display)
 */
export const getBadgeProgress = async (badgeId: string): Promise<{ current: number; max: number } | null> => {
  // TODO: Implement badge progress tracking
  // This would track how close a user is to earning a specific badge
  return null;
};

/**
 * Get list of badge IDs that have been shown in notifications
 */
export const getShownBadgeIds = async (): Promise<Set<string>> => {
  try {
    const shownJson = await AsyncStorage.getItem(SHOWN_BADGES_KEY);
    if (!shownJson) return new Set();
    const shownArray = JSON.parse(shownJson);
    return new Set(shownArray);
  } catch (error) {
    console.error('Error loading shown badges:', error);
    return new Set();
  }
};

/**
 * Mark a badge as shown in notification
 */
export const markBadgeAsShown = async (badgeId: string): Promise<void> => {
  try {
    const shownIds = await getShownBadgeIds();
    shownIds.add(badgeId);
    await AsyncStorage.setItem(SHOWN_BADGES_KEY, JSON.stringify(Array.from(shownIds)));
    console.log('✅ Badge marked as shown:', badgeId);
  } catch (error) {
    console.error('Error marking badge as shown:', error);
  }
};

/**
 * Check if a badge has been shown in notification
 */
export const hasBadgeBeenShown = async (badgeId: string): Promise<boolean> => {
  const shownIds = await getShownBadgeIds();
  return shownIds.has(badgeId);
};

/**
 * Filter out badges that have already been shown
 * Returns only badges that should trigger a notification
 */
export const filterNewBadgesForNotification = async (
  badgeResults: BadgeAwardResult[]
): Promise<BadgeAwardResult[]> => {
  const shownIds = await getShownBadgeIds();
  return badgeResults.filter(result => !shownIds.has(result.badge.id));
};

/**
 * Initialize test badges (8 badges for testing)
 * This function adds 8 test badges to the user's badge collection
 */
export const initializeTestBadges = async (): Promise<void> => {
  try {
    const existingBadges = await getUserBadges();
    
    // Eğer zaten 8 veya daha fazla rozet varsa, tekrar ekleme
    if (existingBadges.length >= 8) {
      console.log('✅ Test badges already initialized');
      return;
    }
    
    const existingBadgeIds = new Set(existingBadges.map(b => b.id));
    
    // 8 test rozet ID'leri (ilk 8 rozet)
    const testBadgeIds = [
      'first-analysis',    // İlk Analiz
      'warm-up',           // Isınma Turu
      'strategist',         // Stratejist
      'punctual',           // Dakik
      'streak-starter',     // Seri Başı
      'card-master',        // Kart Hamili
      'squad-engineer',     // Kadro Mühendisi
      'local-hero',         // Yerel Kahraman
    ];
    
    // Import badge definitions - use dynamic import for web compatibility
    let ALL_BADGES: any[];
    try {
      // Try dynamic import first (works on web)
      const badgesModule = await import('../constants/badges');
      ALL_BADGES = badgesModule.ALL_BADGES || [];
    } catch (importError) {
      // Fallback to require for Node.js environments
      try {
        const badgesModule = require('../constants/badges');
        ALL_BADGES = badgesModule.ALL_BADGES || [];
      } catch (requireError) {
        console.error('Error importing ALL_BADGES:', requireError);
        return;
      }
    }
    
    if (!ALL_BADGES || ALL_BADGES.length === 0) {
      console.warn('ALL_BADGES not found or empty');
      return;
    }
    
    const newTestBadges: Badge[] = [];
    
    for (const badgeId of testBadgeIds) {
      // Skip if already exists
      if (existingBadgeIds.has(badgeId)) {
        continue;
      }
      
      // Find badge definition
      const badgeDef = ALL_BADGES.find((b: any) => b.id === badgeId);
      if (!badgeDef) {
        console.warn(`Badge definition not found: ${badgeId}`);
        continue;
      }
      
      // Map tier number to BadgeTier enum
      const tierMap: Record<1 | 2 | 3 | 4 | 5, BadgeTier> = {
        1: BadgeTier.BRONZE,
        2: BadgeTier.SILVER,
        3: BadgeTier.GOLD,
        4: BadgeTier.PLATINUM,
        5: BadgeTier.DIAMOND,
      };
      
      // Convert to Badge type
      const badge: Badge = {
        id: badgeId,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.emoji,
        tier: tierMap[badgeDef.tier] || BadgeTier.BRONZE,
        earned: true,
        earnedAt: new Date().toISOString(),
        requirement: badgeDef.howToEarn || '',
        category: BadgeCategory.PREDICTION_GOD,
        color: badgeDef.color || '#F59E0B',
      };
      
      newTestBadges.push(badge);
    }
    
    if (newTestBadges.length > 0) {
      const updatedBadges = [...existingBadges, ...newTestBadges];
      await saveBadges(updatedBadges);
      console.log(`✅ Initialized ${newTestBadges.length} test badges`);
    } else {
      console.log('✅ All test badges already exist');
    }
  } catch (error) {
    console.error('Error initializing test badges:', error);
    // Don't throw - just log the error
  }
};
