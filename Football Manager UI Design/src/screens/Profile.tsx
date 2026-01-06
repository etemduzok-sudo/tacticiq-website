import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING, SIZES } from '../constants/theme';
import Card from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function Profile() {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const menuItems = [
    { icon: 'settings-outline', label: 'Ayarlar', screen: 'ProfileSettings' as const },
    { icon: 'trophy-outline', label: 'Rozetlerim', screen: 'ProfileBadges' as const },
    { icon: 'notifications-outline', label: 'Bildirimler', screen: 'Notifications' as const },
    { icon: 'star-outline', label: 'Pro Üyelik', screen: 'ProUpgrade' as const },
    { icon: 'document-text-outline', label: 'Yasal', screen: 'LegalDocuments' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>FM</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>Fan Manager</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>fan@manager.com</Text>
          
          {/* Level & XP */}
          <View style={styles.levelContainer}>
            <View style={[styles.levelBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.levelText}>Seviye 12</Text>
            </View>
            <Text style={[styles.xpText, { color: colors.textSecondary }]}>
              2,450 / 3,000 XP
            </Text>
          </View>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                },
              ]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon as any} size={24} color={colors.text} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + 20,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
  },
  content: {
    padding: SPACING.lg,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
  },
  name: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.xs,
  },
  email: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.md,
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    marginBottom: SPACING.xs,
  },
  levelText: {
    ...TYPOGRAPHY.captionMedium,
    color: '#FFFFFF',
  },
  xpText: {
    ...TYPOGRAPHY.caption,
  },
  menuContainer: {
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  menuLabel: {
    ...TYPOGRAPHY.body,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: SIZES.buttonHeight,
    borderRadius: SIZES.borderRadius,
  },
  logoutText: {
    ...TYPOGRAPHY.button,
    color: '#FFFFFF',
  },
});
