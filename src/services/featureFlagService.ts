// Feature Flag Service - A/B Testing
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  variant?: string;
  rolloutPercentage?: number;
}

interface FeatureFlags {
  [key: string]: FeatureFlag;
}

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlags = {};
  private userId: string | null = null;

  // Default feature flags
  private defaultFlags: FeatureFlags = {
    // UI Features
    newDashboard: {
      key: 'newDashboard',
      enabled: false,
      rolloutPercentage: 50, // 50% rollout
    },
    darkModeDefault: {
      key: 'darkModeDefault',
      enabled: true,
    },
    animatedTransitions: {
      key: 'animatedTransitions',
      enabled: true,
    },

    // Match Features
    liveMatchNotifications: {
      key: 'liveMatchNotifications',
      enabled: true,
    },
    advancedStatistics: {
      key: 'advancedStatistics',
      enabled: false,
      rolloutPercentage: 30,
    },
    playerPredictions: {
      key: 'playerPredictions',
      enabled: true,
    },

    // Social Features
    leaderboard: {
      key: 'leaderboard',
      enabled: true,
    },
    socialSharing: {
      key: 'socialSharing',
      enabled: false,
      rolloutPercentage: 20,
    },

    // Pro Features
    proFeatures: {
      key: 'proFeatures',
      enabled: true,
    },
    multipleFavoriteTeams: {
      key: 'multipleFavoriteTeams',
      enabled: false, // Pro only
    },

    // Experimental
    experimentalUI: {
      key: 'experimentalUI',
      enabled: false,
      rolloutPercentage: 10,
    },
  };

  private constructor() {
    this.flags = { ...this.defaultFlags };
    this.loadFlags();
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  // Load flags from storage
  private async loadFlags() {
    try {
      const stored = await AsyncStorage.getItem('feature-flags');
      if (stored) {
        const storedFlags = JSON.parse(stored);
        this.flags = { ...this.defaultFlags, ...storedFlags };
      }
      console.log('🚩 Feature flags loaded');
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  }

  // Save flags to storage
  private async saveFlags() {
    try {
      await AsyncStorage.setItem('feature-flags', JSON.stringify(this.flags));
    } catch (error) {
      console.error('Error saving feature flags:', error);
    }
  }

  // Set user ID for consistent rollout
  setUserId(userId: string) {
    this.userId = userId;
    this.evaluateRollouts();
  }

  // Check if feature is enabled
  isEnabled(flagKey: string): boolean {
    const flag = this.flags[flagKey];
    if (!flag) {
      console.warn(`⚠️ Feature flag not found: ${flagKey}`);
      return false;
    }

    return flag.enabled;
  }

  // Get feature variant
  getVariant(flagKey: string): string | undefined {
    const flag = this.flags[flagKey];
    return flag?.variant;
  }

  // Enable feature
  enableFeature(flagKey: string) {
    if (this.flags[flagKey]) {
      this.flags[flagKey].enabled = true;
      this.saveFlags();
      console.log(`✅ Feature enabled: ${flagKey}`);
    }
  }

  // Disable feature
  disableFeature(flagKey: string) {
    if (this.flags[flagKey]) {
      this.flags[flagKey].enabled = false;
      this.saveFlags();
      console.log(`❌ Feature disabled: ${flagKey}`);
    }
  }

  // Set feature variant
  setVariant(flagKey: string, variant: string) {
    if (this.flags[flagKey]) {
      this.flags[flagKey].variant = variant;
      this.saveFlags();
      console.log(`🎨 Feature variant set: ${flagKey} = ${variant}`);
    }
  }

  // Evaluate rollout percentage
  private evaluateRollouts() {
    if (!this.userId) return;

    Object.keys(this.flags).forEach(key => {
      const flag = this.flags[key];
      if (flag.rolloutPercentage !== undefined) {
        // Simple hash-based rollout
        const hash = this.hashUserId(this.userId!);
        const percentage = hash % 100;
        flag.enabled = percentage < flag.rolloutPercentage;
      }
    });

    this.saveFlags();
  }

  // Simple hash function for consistent rollout
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Get all flags
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  // Reset to defaults
  resetToDefaults() {
    this.flags = { ...this.defaultFlags };
    this.saveFlags();
    console.log('🔄 Feature flags reset to defaults');
  }

  // Override flag (for testing)
  override(flagKey: string, enabled: boolean) {
    if (this.flags[flagKey]) {
      this.flags[flagKey].enabled = enabled;
      console.log(`🔧 Feature flag overridden: ${flagKey} = ${enabled}`);
    }
  }
}

export const featureFlagService = FeatureFlagService.getInstance();

// React Hook
import { useState, useEffect } from 'react';

export function useFeatureFlag(flagKey: string): boolean {
  const [enabled, setEnabled] = useState(featureFlagService.isEnabled(flagKey));

  useEffect(() => {
    // Re-evaluate when component mounts
    setEnabled(featureFlagService.isEnabled(flagKey));
  }, [flagKey]);

  return enabled;
}
