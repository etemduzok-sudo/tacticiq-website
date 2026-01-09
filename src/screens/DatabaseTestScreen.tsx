// Database Test Screen
// Test Supabase connection and show database stats

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND } from '../theme/theme';
import {
  checkDatabaseConnection,
  getDatabaseStats,
  matchesDb,
  teamsDb,
  leaguesDb,
} from '../services/databaseService';

interface DatabaseTestScreenProps {
  onBack: () => void;
}

export const DatabaseTestScreen: React.FC<DatabaseTestScreenProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({ matches: 0, teams: 0, leagues: 0, users: 0 });
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    runTests();
  }, []);

  const addLog = (message: string) => {
    setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Database connection
      addLog('🔍 Testing database connection...');
      const isConnected = await checkDatabaseConnection();
      setConnected(isConnected);
      addLog(isConnected ? '✅ Database connected!' : '❌ Database connection failed');

      if (!isConnected) {
        setLoading(false);
        return;
      }

      // Test 2: Get database stats
      addLog('📊 Fetching database statistics...');
      const dbStats = await getDatabaseStats();
      setStats(dbStats);
      addLog(`✅ Stats: ${dbStats.matches} matches, ${dbStats.teams} teams, ${dbStats.leagues} leagues`);

      // Test 3: Fetch leagues
      addLog('🏆 Fetching leagues...');
      const leaguesResult = await leaguesDb.getAllLeagues();
      addLog(leaguesResult.success ? `✅ Found ${leaguesResult.data?.length || 0} leagues` : '❌ Failed to fetch leagues');

      // Test 4: Fetch teams
      addLog('⚽ Searching teams...');
      const teamsResult = await teamsDb.searchTeams('');
      addLog(teamsResult.success ? `✅ Found ${teamsResult.data?.length || 0} teams` : '❌ Failed to fetch teams');

      // Test 5: Fetch live matches
      addLog('🔴 Fetching live matches...');
      const liveMatchesResult = await matchesDb.getLiveMatches();
      addLog(liveMatchesResult.success ? `✅ Found ${liveMatchesResult.data?.length || 0} live matches` : '❌ Failed to fetch live matches');

      // Test 6: Fetch matches by date
      const today = new Date().toISOString().split('T')[0];
      addLog(`📅 Fetching matches for ${today}...`);
      const matchesByDateResult = await matchesDb.getMatchesByDate(today);
      addLog(matchesByDateResult.success ? `✅ Found ${matchesByDateResult.data?.length || 0} matches for today` : '❌ Failed to fetch matches by date');

      addLog('🎉 All tests completed!');
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Database Test</Text>
        <TouchableOpacity onPress={runTests} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Connection Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connection Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Supabase:</Text>
            <Text style={[styles.statusValue, connected ? styles.statusConnected : styles.statusDisconnected]}>
              {connected ? '✅ Connected' : '❌ Disconnected'}
            </Text>
          </View>
        </View>

        {/* Database Stats */}
        {connected && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Database Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.matches}</Text>
                <Text style={styles.statLabel}>Matches</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.teams}</Text>
                <Text style={styles.statLabel}>Teams</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.leagues}</Text>
                <Text style={styles.statLabel}>Leagues</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.users}</Text>
                <Text style={styles.statLabel}>Users</Text>
              </View>
            </View>
          </View>
        )}

        {/* Test Results */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Test Results</Text>
          {loading ? (
            <ActivityIndicator size="large" color={BRAND.emerald} style={styles.loader} />
          ) : (
            <View style={styles.logContainer}>
              {testResults.map((log, index) => (
                <Text key={index} style={styles.logText}>
                  {log}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: BRAND.emerald,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fafafa',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fafafa',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#b3b3b3',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusConnected: {
    color: BRAND.emerald,
  },
  statusDisconnected: {
    color: '#9e3a3a',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: BRAND.emerald,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#b3b3b3',
  },
  logContainer: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 8,
    maxHeight: 400,
  },
  logText: {
    fontSize: 14,
    color: '#b3b3b3',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  loader: {
    marginVertical: 24,
  },
});
