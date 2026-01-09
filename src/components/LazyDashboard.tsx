// Lazy Loading Dashboard - Performance Optimization
import React, { Suspense, lazy } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Lazy load heavy components
const Dashboard = lazy(() => import('./Dashboard').then(module => ({ default: module.Dashboard })));
const Leaderboard = lazy(() => import('./Leaderboard').then(module => ({ default: module.Leaderboard })));

interface LazyDashboardProps {
  onNavigate: (screen: string, params?: any) => void;
}

const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#059669" />
  </View>
);

export function LazyDashboard({ onNavigate }: LazyDashboardProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Dashboard onNavigate={onNavigate} />
    </Suspense>
  );
}

interface LazyLeaderboardProps {
  onBack: () => void;
}

export function LazyLeaderboard({ onBack }: LazyLeaderboardProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Leaderboard onBack={onBack} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
