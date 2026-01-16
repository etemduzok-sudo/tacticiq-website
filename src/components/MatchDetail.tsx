// src/components/MatchDetail.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useMatchDetails } from '../hooks/useMatches';
import api from '../services/api';
import { MatchSquad } from './match/MatchSquad';
import { MatchPrediction } from './match/MatchPrediction';
import { MatchLive } from './match/MatchLive';
import { MatchStats } from './match/MatchStats';
import { MatchRatings } from './match/MatchRatings';
import { MatchSummary } from './match/MatchSummary';

const { width } = Dimensions.get('window');

interface MatchDetailProps {
  matchId: string;
  onBack: () => void;
}

// Mock match data
const matchData = {
  id: '1',
  homeTeam: {
    name: 'Galatasaray',
    logo: '🦁',
    color: ['#FDB913', '#E30613'],
    manager: 'Okan Buruk',
  },
  awayTeam: {
    name: 'Fenerbahçe',
    logo: '🐤',
    color: ['#FCCF1E', '#001A70'],
    manager: 'İsmail Kartal',
  },
  league: 'Süper Lig',
  stadium: 'Ali Sami Yen',
  date: '2 Oca 2026',
  time: '20:00',
};

const tabs = [
  { id: 'squad', label: 'Kadro', icon: 'people' },
  { id: 'prediction', label: 'Tahmin', icon: 'analytics' },
  { id: 'live', label: 'Canlı', icon: 'pulse' },
  { id: 'stats', label: 'İstatistik', icon: 'bar-chart' },
  { id: 'ratings', label: 'Reyting', icon: 'star' },
  { id: 'summary', label: 'Özet', icon: 'document-text' },
];

export function MatchDetail({ matchId, onBack, initialTab = 'squad' }: MatchDetailProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Fetch match details from API
  const { match, statistics, events, lineups, loading, error } = useMatchDetails(Number(matchId));

  // Helper function to get team colors from API or generate from team name
  const getTeamColors = (team: any): [string, string] => {
    // Try to get colors from API
    if (team.colors?.player?.primary) {
      const primary = team.colors.player.primary;
      const secondary = team.colors.player.number || primary;
      return [primary, secondary];
    }
    
    // Fallback: Generate colors based on team name
    const teamName = team.name.toLowerCase();
    
    // Known team colors (Turkish Super Lig + Popular teams)
    const knownColors: { [key: string]: [string, string] } = {
      'galatasaray': ['#FDB913', '#E30613'],
      'fenerbahçe': ['#FCCF1E', '#001A70'],
      'fenerbahce': ['#FCCF1E', '#001A70'],
      'beşiktaş': ['#000000', '#FFFFFF'],
      'besiktas': ['#000000', '#FFFFFF'],
      'trabzonspor': ['#781132', '#7C9ECC'],
      'başakşehir': ['#FF6600', '#003366'],
      'basaksehir': ['#FF6600', '#003366'],
      'real madrid': ['#FFFFFF', '#FFD700'],
      'barcelona': ['#A50044', '#004D98'],
      'manchester united': ['#DA291C', '#000000'],
      'liverpool': ['#C8102E', '#00B2A9'],
      'chelsea': ['#034694', '#034694'],
      'arsenal': ['#EF0107', '#FFFFFF'],
      'juventus': ['#000000', '#FFFFFF'],
      'bayern': ['#DC052D', '#0066B2'],
      'psg': ['#004170', '#DA291C'],
    };
    
    // Check if team name matches known colors
    for (const [key, colors] of Object.entries(knownColors)) {
      if (teamName.includes(key)) {
        return colors;
      }
    }
    
    // Default colors based on home/away
    return team.home ? ['#059669', '#047857'] : ['#F59E0B', '#D97706'];
  };

  // Transform API data to component format
  const matchData = match ? {
    id: match.fixture.id.toString(),
    homeTeam: {
      name: match.teams.home.name,
      logo: match.teams.home.logo || '⚽',
      color: getTeamColors(match.teams.home),
      manager: 'TBA',
    },
    awayTeam: {
      name: match.teams.away.name,
      logo: match.teams.away.logo || '⚽',
      color: getTeamColors(match.teams.away),
      manager: 'TBA',
    },
    league: match.league.name,
    stadium: match.fixture.venue?.name || 'TBA',
    date: new Date(match.fixture.date).toLocaleDateString('tr-TR'),
    time: api.utils.formatMatchTime(new Date(match.fixture.date).getTime() / 1000),
  } : null;

  // Loading state
  if (loading || !matchData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Maç detayları yükleniyor...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Veriler yüklenemedi</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity onPress={onBack} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'squad':
        return (
          <MatchSquad 
            matchData={matchData}
            matchId={matchId}
            lineups={lineups}
            onComplete={() => setActiveTab('prediction')} 
          />
        );
      
      case 'prediction':
        return (
          <MatchPrediction matchData={matchData} matchId={matchId} />
        );
      
      case 'live':
        return <MatchLive matchData={matchData} matchId={matchId} events={events} />;
      
      case 'stats':
        return <MatchStats matchData={matchData} />;
      
      case 'ratings':
        return <MatchRatings matchData={matchData} />;
      
      case 'summary':
        return <MatchSummary matchData={matchData} />;
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Sticky Match Card Header - ProfileCard overlay gibi */}
      <View style={styles.matchCardOverlay}>
        <View style={styles.matchCard}>
        {/* Home Team Color Bar - Left */}
        <LinearGradient
          colors={matchData.homeTeam.color}
          style={[styles.colorBar, styles.colorBarLeft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Away Team Color Bar - Right */}
        <LinearGradient
          colors={matchData.awayTeam.color}
          style={[styles.colorBar, styles.colorBarRight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* League Header with Back Button */}
        <View style={styles.leagueHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color="#F8FAFB" />
          </TouchableOpacity>

          <View style={styles.leagueBadge}>
            <Ionicons name="trophy" size={14} color="#059669" />
            <Text style={styles.leagueText}>{matchData.league}</Text>
          </View>

          <View style={{ width: 32 }} />
        </View>

        {/* Match Info */}
        <View style={styles.matchInfo}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{matchData.homeTeam.name}</Text>
            <Text style={styles.managerName}>{matchData.homeTeam.manager}</Text>
          </View>

          {/* VS & Time */}
          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
            <Text style={styles.matchTime}>{matchData.time}</Text>
            <Text style={styles.matchDate}>{matchData.date}</Text>
            <View style={styles.stadiumBadge}>
              <Ionicons name="location" size={10} color="#64748B" />
              <Text style={styles.stadiumText}>{matchData.stadium}</Text>
            </View>
          </View>

          {/* Away Team */}
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{matchData.awayTeam.name}</Text>
            <Text style={styles.managerName}>{matchData.awayTeam.manager}</Text>
          </View>
        </View>
        </View>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Bottom Navigation - 6 Tabs - BottomNavigation gibi */}
      <View style={styles.bottomNavOverlay}>
        <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, isActive && styles.activeTab]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={isActive ? '#059669' : '#64748B'}
              />
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // ✅ iOS: Status bar için alan
  },
  
  // Match Card Overlay - ProfileCard overlay gibi
  matchCardOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    backgroundColor: '#1E293B', // ✅ Profil kartı ile aynı renk
    borderBottomLeftRadius: 25, // ✅ Profil kartı gibi yuvarlatılmış alt köşeler
    borderBottomRightRadius: 25,
    borderTopWidth: 1, // ✅ İnce üst çizgi
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 2, // ✅ Kalın alt çizgi
    borderBottomColor: '#334155',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 0,
    pointerEvents: 'box-none',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  
  // Match Card Header
  matchCard: {
    backgroundColor: 'transparent',
    paddingTop: 0,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
  },
  colorBarLeft: {
    left: 0,
  },
  colorBarRight: {
    right: 0,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  leagueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  
  // Match Info
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFB',
    textAlign: 'center',
    marginBottom: 4,
  },
  managerName: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  matchTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFB',
    marginBottom: 2,
  },
  matchDate: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  stadiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stadiumText: {
    fontSize: 9,
    color: '#64748B',
  },
  
  // Content
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 200 : 156, // ✅ Match card overlay yüksekliği için padding (iOS: 44 status + ~156 card, Android: ~156 card)
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // ✅ Bottom nav için padding (iOS: 80 nav + 20 safe area, Android: 80 nav)
  },
  
  // Placeholder
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderCard: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFB',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  
  // Bottom Navigation Overlay - BottomNavigation gibi
  bottomNavOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    backgroundColor: '#0F172A', // ✅ BottomNavigation ile aynı renk
    borderTopLeftRadius: 25, // ✅ Yuvarlatılmış üst köşeler
    borderTopRightRadius: 25,
    borderTopWidth: 2, // ✅ Üst çizgi
    borderTopColor: '#334155',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    pointerEvents: 'box-none',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 }, // ✅ Yukarı doğru gölge
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 -4px 8px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#059669',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#059669',
    fontWeight: '600',
  },
  
  // Loading & Error
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
