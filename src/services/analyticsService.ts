// Analytics Service - User Behavior Tracking
import { Platform } from 'react-native';

interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private enabled: boolean = true;
  private userId: string | null = null;

  private constructor() {
    console.log('📊 Analytics Service initialized');
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Set user ID
  setUserId(userId: string) {
    this.userId = userId;
    
    if (Platform.OS === 'web') {
      // Firebase Analytics (Web)
      import('../config/firebase').then(({ analytics }) => {
        if (analytics) {
          import('firebase/analytics').then(({ setUserId }) => {
            setUserId(analytics, userId);
          });
        }
      });
    } else {
      // React Native Firebase
      // analytics().setUserId(userId);
    }
    
    console.log('👤 User ID set:', userId);
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>) {
    if (Platform.OS === 'web') {
      import('../config/firebase').then(({ analytics }) => {
        if (analytics) {
          import('firebase/analytics').then(({ setUserProperties }) => {
            setUserProperties(analytics, properties);
          });
        }
      });
    } else {
      // React Native Firebase
      // analytics().setUserProperties(properties);
    }
    
    console.log('📝 User properties set:', properties);
  }

  // Log event
  logEvent(event: AnalyticsEvent) {
    if (!this.enabled) return;

    if (Platform.OS === 'web') {
      import('../config/firebase').then(({ analytics }) => {
        if (analytics) {
          import('firebase/analytics').then(({ logEvent }) => {
            logEvent(analytics, event.name, event.params);
          });
        }
      });
    } else {
      // React Native Firebase
      // analytics().logEvent(event.name, event.params);
    }

    if (__DEV__) {
      console.log('📊 Analytics Event:', event);
    }
  }

  // Screen view
  logScreenView(screenName: string, screenClass?: string) {
    this.logEvent({
      name: 'screen_view',
      params: {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      },
    });
  }

  // Match events
  logMatchView(matchId: string, league: string) {
    this.logEvent({
      name: 'match_view',
      params: {
        match_id: matchId,
        league,
      },
    });
  }

  logPredictionMade(matchId: string, predictionType: string, confidence: number) {
    this.logEvent({
      name: 'prediction_made',
      params: {
        match_id: matchId,
        prediction_type: predictionType,
        confidence,
      },
    });
  }

  logMatchResult(matchId: string, isCorrect: boolean, points: number) {
    this.logEvent({
      name: 'prediction_result',
      params: {
        match_id: matchId,
        is_correct: isCorrect,
        points_earned: points,
      },
    });
  }

  // User engagement
  logLogin(method: string) {
    this.logEvent({
      name: 'login',
      params: {
        method,
      },
    });
  }

  logSignUp(method: string) {
    this.logEvent({
      name: 'sign_up',
      params: {
        method,
      },
    });
  }

  logShare(contentType: string, itemId: string) {
    this.logEvent({
      name: 'share',
      params: {
        content_type: contentType,
        item_id: itemId,
      },
    });
  }

  // Pro features
  logProUpgradeView() {
    this.logEvent({
      name: 'pro_upgrade_view',
      params: {},
    });
  }

  logProPurchase(price: number, currency: string) {
    this.logEvent({
      name: 'purchase',
      params: {
        value: price,
        currency,
        items: [{ item_name: 'pro_subscription' }],
      },
    });
  }

  // Enable/Disable analytics
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    console.log(`📊 Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }
}

export const analyticsService = AnalyticsService.getInstance();
