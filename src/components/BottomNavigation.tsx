// components/BottomNavigation.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabConfig = [
  { id: 'home', labelKey: 'navigation.home', icon: 'home-outline', activeIcon: 'home' },
  { id: 'leaderboard', labelKey: 'navigation.leaderboard', icon: 'trophy-outline', activeIcon: 'trophy' },
  { id: 'badges', labelKey: 'navigation.badges', icon: 'ribbon-outline', activeIcon: 'ribbon' },
  { id: 'profile', labelKey: 'navigation.profile', icon: 'person-outline', activeIcon: 'person' },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.id;

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
              {/* Icon */}
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={20}
                color={isActive ? '#059669' : '#64748B'}
              />

              {/* Label - Çeviri ile */}
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {t(tab.labelKey)}
              </Text>

              {/* Active Indicator - Yazının altında */}
              {isActive && <View style={styles.activeIndicator} />}
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
