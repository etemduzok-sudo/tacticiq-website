# Fan Manager 2026 - Advanced Features Documentation

## 🚀 Advanced Features Implementation

### 1. React Query Integration ✅

#### Migration from Custom Hooks

**Before (Custom Hook):**
```typescript
const { matches, loading, error } = useMatches();
```

**After (React Query):**
```typescript
const { data: matches, isLoading, error } = useMatchesByDate();
```

#### Benefits:
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Optimistic updates
- ✅ Reduced boilerplate

#### Usage Examples:

```typescript
import { useMatchesByDate, useLiveMatches, useMatchDetails } from './hooks/queries/useMatchesQuery';

// Get matches by date
const { data, isLoading, error, refetch } = useMatchesByDate('2026-01-08');

// Get live matches with auto-refresh
const { data: liveMatches } = useLiveMatches(true); // filters by favorites

// Get match details
const { data: matchDetails } = useMatchDetails(12345);

// Prefetch for better UX
const prefetch = usePrefetchMatchDetails();
prefetch(12345); // Prefetch before navigation
```

---

### 2. Firebase Analytics & Performance ✅

#### Analytics Service

**Track User Behavior:**
```typescript
import { analyticsService } from './services/analyticsService';

// Set user
analyticsService.setUserId('user123');
analyticsService.setUserProperties({ isPro: true, level: 12 });

// Log events
analyticsService.logScreenView('MatchDetail');
analyticsService.logMatchView('12345', 'Süper Lig');
analyticsService.logPredictionMade('12345', 'score', 85);
analyticsService.logMatchResult('12345', true, 50);

// User engagement
analyticsService.logLogin('email');
analyticsService.logSignUp('google');
analyticsService.logShare('prediction', '12345');

// Pro features
analyticsService.logProUpgradeView();
analyticsService.logProPurchase(9.99, 'USD');
```

#### Performance Monitoring

**Track Performance:**
```typescript
import { performanceService } from './services/performanceService';

// Manual traces
performanceService.startTrace('match_load');
// ... do work
performanceService.stopTrace('match_load');

// API calls
const data = await performanceService.measureApiCall('getMatches', async () => {
  return await api.matches.getMatchesByDate('2026-01-08');
});

// Component renders
performanceService.measureRender('MatchCard', () => {
  // render logic
});

// Screen loads
const stopMonitoring = performanceService.monitorScreenLoad('MatchDetail');
// ... screen loaded
stopMonitoring();
```

---

### 3. Feature Flags & A/B Testing ✅

#### Feature Flag Service

**Define Features:**
```typescript
import { featureFlagService, useFeatureFlag } from './services/featureFlagService';

// Set user for consistent rollout
featureFlagService.setUserId('user123');

// Check if feature is enabled
if (featureFlagService.isEnabled('newDashboard')) {
  // Show new dashboard
} else {
  // Show old dashboard
}

// Get variant
const variant = featureFlagService.getVariant('experimentalUI');
if (variant === 'A') {
  // Show variant A
} else if (variant === 'B') {
  // Show variant B
}

// Enable/Disable features
featureFlagService.enableFeature('socialSharing');
featureFlagService.disableFeature('experimentalUI');

// Override for testing
featureFlagService.override('advancedStatistics', true);
```

#### React Hook Usage:

```typescript
function MyComponent() {
  const isEnabled = useFeatureFlag('newDashboard');
  
  if (isEnabled) {
    return <NewDashboard />;
  }
  
  return <OldDashboard />;
}
```

#### Available Feature Flags:

| Flag | Description | Default | Rollout % |
|------|-------------|---------|-----------|
| `newDashboard` | New dashboard UI | false | 50% |
| `darkModeDefault` | Dark mode by default | true | 100% |
| `animatedTransitions` | Animated screen transitions | true | 100% |
| `liveMatchNotifications` | Live match push notifications | true | 100% |
| `advancedStatistics` | Advanced match statistics | false | 30% |
| `playerPredictions` | Player-level predictions | true | 100% |
| `leaderboard` | Global leaderboard | true | 100% |
| `socialSharing` | Share predictions | false | 20% |
| `proFeatures` | Pro subscription features | true | 100% |
| `multipleFavoriteTeams` | Multiple favorite teams (Pro) | false | 0% |
| `experimentalUI` | Experimental UI features | false | 10% |

---

### 4. E2E Testing with Detox ✅

#### Setup:

```bash
# Install dependencies
npm install --save-dev detox detox-expo-helpers jest-circus

# Build app for testing
npm run detox:build:ios
npm run detox:build:android

# Run tests
npm run detox:test:ios
npm run detox:test:android
```

#### Test Structure:

```typescript
describe('Feature Name', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should do something', async () => {
    await element(by.text('Button')).tap();
    await expect(element(by.text('Result'))).toBeVisible();
  });
});
```

#### Test Coverage:
- ✅ Authentication flow
- ✅ Favorite teams selection
- ✅ Match list navigation
- ✅ Match detail views
- ✅ Prediction flow
- ✅ Profile management
- ✅ Settings

---

### 5. Integration Examples

#### Complete Component with All Features:

```typescript
import React, { useEffect } from 'react';
import { useMatchesByDate } from './hooks/queries/useMatchesQuery';
import { analyticsService } from './services/analyticsService';
import { performanceService } from './services/performanceService';
import { useFeatureFlag } from './services/featureFlagService';

export function MatchesScreen() {
  const showAdvancedStats = useFeatureFlag('advancedStatistics');
  const { data: matches, isLoading } = useMatchesByDate(undefined, true);

  useEffect(() => {
    // Track screen view
    analyticsService.logScreenView('Matches');

    // Monitor performance
    const stopMonitoring = performanceService.monitorScreenLoad('Matches');
    return stopMonitoring;
  }, []);

  const handleMatchClick = (matchId: string) => {
    // Track user action
    analyticsService.logMatchView(matchId, 'Süper Lig');
    
    // Navigate
    navigation.navigate('MatchDetail', { matchId });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      {matches?.map(match => (
        <MatchCard
          key={match.id}
          match={match}
          showAdvancedStats={showAdvancedStats}
          onPress={() => handleMatchClick(match.id)}
        />
      ))}
    </View>
  );
}
```

---

### 6. Performance Best Practices

#### Image Optimization:
```typescript
import { CachedImage } from './components/atoms/CachedImage';

<CachedImage
  uri={team.logo}
  style={styles.logo}
  showLoader={true}
/>
```

#### Code Splitting:
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

#### Query Optimization:
```typescript
// Prefetch data before navigation
const prefetch = usePrefetchMatchDetails();

<TouchableOpacity
  onPress={() => {
    prefetch(matchId); // Prefetch
    navigation.navigate('MatchDetail', { matchId });
  }}
>
  <Text>View Match</Text>
</TouchableOpacity>
```

---

### 7. Monitoring & Debugging

#### Development Tools:

**React Query DevTools:**
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryProvider>
  <App />
  {__DEV__ && <ReactQueryDevtools />}
</QueryProvider>
```

**Performance Metrics:**
```typescript
const metrics = performanceService.getMetrics();
console.log('Load Time:', metrics.loadTime);
console.log('First Paint:', metrics.firstPaint);
```

**Feature Flag Dashboard:**
```typescript
const allFlags = featureFlagService.getAllFlags();
console.table(allFlags);
```

---

### 8. Production Checklist

Before deploying to production:

- [ ] Firebase project configured
- [ ] Analytics tracking verified
- [ ] Performance monitoring active
- [ ] Feature flags configured
- [ ] E2E tests passing
- [ ] Error tracking enabled (Sentry)
- [ ] API rate limiting configured
- [ ] Image CDN configured
- [ ] Bundle size optimized
- [ ] Security audit completed

---

### 9. Useful Commands

```bash
# Development
npm start
npm run web
npm run android
npm run ios

# Testing
npm test
npm run test:watch
npm run test:coverage
npm run detox:test:ios
npm run detox:test:android

# Code Quality
npm run lint
npm run type-check

# Performance
npm run analyze-bundle
npm run lighthouse

# Deployment
npm run build:web
npm run build:android
npm run build:ios
```

---

**Last Updated:** 8 Ocak 2026
**Version:** 2.0.0
**Status:** Production Ready with Advanced Features ✅
