// components/BottomNavigation.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS } from '../theme/theme';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabConfig = [
  { id: 'home', labelKey: 'navigation.home', icon: 'home-outline', activeIcon: 'home' },
  { id: 'scoring', labelKey: 'navigation.scoring', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { id: 'leaderboard', labelKey: 'navigation.leaderboard', icon: 'trophy-outline', activeIcon: 'trophy' },
  { id: 'chat', labelKey: 'navigation.chat', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
  { id: 'profile', labelKey: 'navigation.profile', icon: 'person-outline', activeIcon: 'person' },
];

const activeColor = '#059669';

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;

  return (
    <View style={[
      styles.container,
      isLight && {
        backgroundColor: themeColors.muted,
        borderTopWidth: 1,
        borderTopColor: themeColors.border,
      },
    ]}>
      <View style={styles.tabContainer}>
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          const iconColor = isActive ? activeColor : (isLight ? themeColors.mutedForeground : '#64748B');
          const labelColor = isActive ? activeColor : (isLight ? themeColors.mutedForeground : '#64748B');

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={[
                styles.tab,
                isActive && styles.activeTab,
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={20}
                color={iconColor}
              />
              <Text style={[styles.label, isActive && styles.activeLabel, { color: labelColor }]}>
                {t(tab.labelKey)}
              </Text>
              {isActive && <View style={[styles.activeIndicator, { pointerEvents: 'none' }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F2A24', // Profil kartı ile aynı koyu yeşil zemin
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(31, 162, 166, 0.2)', // Turkuaz ince border
    ...Platform.select({
      ios: {
        // ✅ Profil kartının alt çizgisindeki gölge efekti (aynısı)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, // ✅ Aşağı doğru gölge (profil kartı ile aynı)
        shadowOpacity: 0.3, // ✅ Aynı opaklık
        shadowRadius: 8, // ✅ Aynı bulanıklık
      },
      android: {
        elevation: 10, // ✅ Profil kartı ile aynı elevation
      },
    }),
  },
  tabContainer: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  activeTab: {
    // ✅ Arka taraftaki dikdörtgen seçim alanı kaldırıldı
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0, // ✅ Yazının altında (top: 0 → bottom: 0)
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#059669',
    borderTopLeftRadius: 2, // ✅ Alt köşeler yuvarlatılmış (üstte değil altta)
    borderTopRightRadius: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  activeLabel: {
    color: '#059669',
    fontWeight: '600',
  },
});
