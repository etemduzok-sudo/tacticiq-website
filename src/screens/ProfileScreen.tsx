import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import SafeIcon from '../components/SafeIcon';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, SIZES, SHADOWS } from '../theme/theme';
import { Card, Avatar, Badge } from '../components/atoms';

interface ProfileScreenProps {
  onSettingsClick: () => void;
  onBack: () => void;
}

export default function ProfileScreen({ onSettingsClick, onBack }: ProfileScreenProps) {
  const { theme, toggleTheme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const menuItems = [
    {
      icon: 'settings-outline' as const,
      title: 'Ayarlar',
      onPress: onSettingsClick,
    },
    {
      icon: 'notifications-outline' as const,
      title: 'Bildirimler',
      badge: '3',
      onPress: () => {}, // Placeholder
    },
    {
      icon: 'star-outline' as const,
      title: 'Pro Üyelik',
      badge: 'PRO',
      badgeColor: colors.accent,
      onPress: () => {}, // Placeholder
    },
    {
      icon: theme === 'dark' ? ('sunny-outline' as const) : ('moon-outline' as const),
      title: 'Tema',
      subtitle: theme === 'dark' ? 'Açık Mod' : 'Koyu Mod',
      onPress: toggleTheme,
    },
    {
      icon: 'document-text-outline' as const,
      title: 'Yasal Dökümanlar',
      onPress: () => {}, // Placeholder
    },
    {
      icon: 'log-out-outline' as const,
      title: 'Çıkış Yap',
      textColor: colors.error,
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.profileInfo}>
            <Avatar name="Fan Manager" size="large" />
            <View style={styles.profileText}>
              <Text style={[styles.name, { color: colors.text }]}>Fan Manager</Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>
                fan@manager.com
              </Text>
            </View>
          </View>
          <Badge label="FREE" variant="neutral" />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Card variant="elevated" padding="medium" style={styles.statsCard}>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>12</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Tahmin
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>8</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Doğru
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>67%</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Başarı
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceLight }]}>
                  <SafeIcon
                    name={item.icon}
                    size={22}
                    color={item.textColor || colors.text}
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.menuTitle,
                      { color: item.textColor || colors.text },
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.menuRight}>
                {item.badge && (
                  <Badge
                    label={item.badge}
                    variant={item.badgeColor ? 'pro' : 'neutral'}
                    size="small"
                  />
                )}
                <SafeIcon
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.base,
    paddingTop: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.base,
    flex: 1,
  },
  profileText: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  email: {
    ...TYPOGRAPHY.bodyMedium,
  },
  statsContainer: {
    padding: SPACING.base,
  },
  statsCard: {
    ...SHADOWS.medium,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    ...TYPOGRAPHY.bodySmall,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  menuContainer: {
    padding: SPACING.base,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    ...TYPOGRAPHY.bodyLargeSemibold,
  },
  menuSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    marginTop: SPACING.xs,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});
