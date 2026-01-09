# Fan Manager 2026 - Integration Guide

## 🔌 How to Integrate Advanced Features

This guide shows you how to integrate all the advanced features into your existing screens.

---

## 1️⃣ React Query Integration

### Step 1: Wrap App with QueryProvider

Already done in `App.tsx`:
```typescript
import { QueryProvider } from './src/providers/QueryProvider';

<QueryProvider>
  <App />
</QueryProvider>
```

### Step 2: Replace Custom Hooks

**Before:**
```typescript
import { useMatches } from './hooks/useMatches';

const { matches, loading, error } = useMatches();
```

**After:**
```typescript
import { useMatchesByDate, useLiveMatches } from './hooks/queries/useMatchesQuery';

const { data: matches, isLoading, error } = useMatchesByDate();
const { data: liveMatches } = useLiveMatches(true); // filter by favorites
```

### Step 3: Use Prefetching for Better UX

```typescript
import { usePrefetchMatchDetails } from './hooks/queries/useMatchesQuery';

const prefetch = usePrefetchMatchDetails();

<TouchableOpacity
  onPress={() => {
    prefetch(matchId); // Prefetch before navigation
    navigation.navigate('MatchDetail', { matchId });
  }}
>
  <Text>View Match</Text>
</TouchableOpacity>
```

---

## 2️⃣ Analytics Integration

### Step 1: Track Screen Views

Add to every screen component:
```typescript
import { analyticsService } from '../services/analyticsService';

useEffect(() => {
  analyticsService.logScreenView('ScreenName', 'ScreenClass');
}, []);
```

### Step 2: Track User Actions

```typescript
// Match view
analyticsService.logMatchView(matchId, leagueName);

// Prediction made
analyticsService.logPredictionMade(matchId, 'score', 85);

// Share
analyticsService.logShare('prediction', predictionId);
```

### Step 3: Set User Properties

After login:
```typescript
analyticsService.setUserId(user.id);
analyticsService.setUserProperties({
  isPro: user.isPro,
  level: user.level,
  favoriteTeam: user.favoriteTeam,
});
```

---

## 3️⃣ Performance Monitoring

### Step 1: Monitor Screen Load

Add to every screen:
```typescript
import { performanceService } from '../services/performanceService';

useEffect(() => {
  const stopMonitoring = performanceService.monitorScreenLoad('ScreenName');
  return stopMonitoring; // Stop when unmounted
}, []);
```

### Step 2: Track API Calls

```typescript
const data = await performanceService.measureApiCall('getMatches', async () => {
  return await api.matches.getMatchesByDate('2026-01-08');
});
```

### Step 3: Custom Traces

```typescript
performanceService.startTrace('complex_operation');
// ... do work
performanceService.stopTrace('complex_operation');
```

---

## 4️⃣ Feature Flags

### Step 1: Check Feature Availability

```typescript
import { useFeatureFlag } from '../services/featureFlagService';

function MyComponent() {
  const showNewFeature = useFeatureFlag('newDashboard');
  
  if (showNewFeature) {
    return <NewDashboard />;
  }
  
  return <OldDashboard />;
}
```

### Step 2: Conditional Rendering

```typescript
const showAdvancedStats = useFeatureFlag('advancedStatistics');

<MatchCard
  match={match}
  showAdvancedStats={showAdvancedStats}
/>
```

### Step 3: A/B Testing

```typescript
import { featureFlagService } from '../services/featureFlagService';

// Set user for consistent experience
featureFlagService.setUserId(user.id);

// Check variant
const variant = featureFlagService.getVariant('experimentalUI');

if (variant === 'A') {
  // Show variant A
} else if (variant === 'B') {
  // Show variant B
}
```

---

## 5️⃣ Complete Integration Example

Here's a complete screen with all features integrated:

```typescript
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// React Query
import { useMatchesByDate, usePrefetchMatchDetails } from '../hooks/queries/useMatchesQuery';

// Services
import { analyticsService } from '../services/analyticsService';
import { performanceService } from '../services/performanceService';
import { useFeatureFlag } from '../services/featureFlagService';

export function MyScreen({ navigation }) {
  // Feature flags
  const showNewUI = useFeatureFlag('newDashboard');
  const enableAnimations = useFeatureFlag('animatedTransitions');

  // React Query
  const { data: matches, isLoading, error, refetch } = useMatchesByDate();
  const prefetch = usePrefetchMatchDetails();

  // Analytics & Performance
  useEffect(() => {
    // Track screen view
    analyticsService.logScreenView('MyScreen');

    // Monitor performance
    const stopMonitoring = performanceService.monitorScreenLoad('MyScreen');

    return () => {
      stopMonitoring();
    };
  }, []);

  // Handle match click
  const handleMatchClick = (matchId: string) => {
    // Track analytics
    analyticsService.logMatchView(matchId, 'Süper Lig');

    // Prefetch data
    prefetch(matchId);

    // Navigate
    navigation.navigate('MatchDetail', { matchId });
  };

  // Handle refresh
  const handleRefresh = () => {
    analyticsService.logEvent({
      name: 'refresh',
      params: { screen: 'MyScreen' },
    });

    refetch();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView error={error} onRetry={handleRefresh} />;
  }

  return (
    <View>
      {showNewUI ? (
        <NewUIComponent matches={matches} />
      ) : (
        <OldUIComponent matches={matches} />
      )}

      {matches?.map(match => (
        <TouchableOpacity
          key={match.id}
          onPress={() => handleMatchClick(match.id)}
        >
          <MatchCard match={match} animated={enableAnimations} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## 6️⃣ Testing Integration

### Unit Tests with React Query

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMatchesByDate } from '../hooks/queries/useMatchesQuery';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('should fetch matches', async () => {
  const { result } = renderHook(() => useMatchesByDate(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

### E2E Tests with Detox

```typescript
describe('Match List Screen', () => {
  it('should load matches', async () => {
    await element(by.text('Maçlar')).tap();
    await waitFor(element(by.id('matches-list')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should track analytics on match click', async () => {
    await element(by.id('match-card-0')).tap();
    // Analytics event logged automatically
  });
});
```

---

## 7️⃣ Environment Setup

### Firebase Configuration

1. Create `.env` file:
```bash
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

2. Add to `app.json`:
```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": process.env.FIREBASE_API_KEY,
      "firebaseAuthDomain": process.env.FIREBASE_AUTH_DOMAIN,
      // ... other keys
    }
  }
}
```

### React Native Firebase (iOS/Android)

1. Add `google-services.json` (Android) to `android/app/`
2. Add `GoogleService-Info.plist` (iOS) to `ios/`
3. Follow [React Native Firebase setup](https://rnfirebase.io/)

---

## 8️⃣ Debugging

### React Query DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryProvider>
  <App />
  {__DEV__ && <ReactQueryDevtools />}
</QueryProvider>
```

### Feature Flag Dashboard

```typescript
import { featureFlagService } from './services/featureFlagService';

// In dev menu
const allFlags = featureFlagService.getAllFlags();
console.table(allFlags);
```

### Performance Metrics

```typescript
import { performanceService } from './services/performanceService';

// Get metrics
const metrics = performanceService.getMetrics();
console.log('Performance:', metrics);
```

---

## 9️⃣ Production Deployment

### Checklist:

1. **Environment Variables**
   - [ ] Firebase keys configured
   - [ ] API endpoints set
   - [ ] Feature flags configured

2. **Analytics**
   - [ ] Firebase project created
   - [ ] Analytics dashboard setup
   - [ ] Events verified

3. **Performance**
   - [ ] Performance monitoring active
   - [ ] Traces configured
   - [ ] Alerts setup

4. **Testing**
   - [ ] Unit tests passing
   - [ ] E2E tests passing
   - [ ] Manual QA completed

5. **Optimization**
   - [ ] Bundle size checked
   - [ ] Images optimized
   - [ ] API calls optimized

---

## 🎯 Quick Reference

### Import Statements:

```typescript
// React Query
import { useMatchesByDate, useLiveMatches, useMatchDetails } from './hooks/queries/useMatchesQuery';

// Services
import { analyticsService } from './services/analyticsService';
import { performanceService } from './services/performanceService';
import { featureFlagService, useFeatureFlag } from './services/featureFlagService';

// Utils
import { getStorageItem, setStorageItem } from './utils/storageUtils';
import { imageCache } from './utils/imageCache';
```

### Common Patterns:

```typescript
// Screen setup
useEffect(() => {
  analyticsService.logScreenView('ScreenName');
  const stop = performanceService.monitorScreenLoad('ScreenName');
  return stop;
}, []);

// Feature flag
const enabled = useFeatureFlag('featureName');

// Data fetching
const { data, isLoading, error, refetch } = useMatchesByDate();

// Analytics event
analyticsService.logEvent({ name: 'event_name', params: {} });
```

---

**Ready to integrate! 🚀**

See `ADVANCED_FEATURES.md` for detailed documentation.
See `EnhancedMatchListScreen.tsx` for a complete example.
