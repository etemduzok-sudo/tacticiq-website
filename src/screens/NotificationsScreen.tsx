import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme/theme';
import { Header } from '../components/organisms';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Bildirimler" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
          Bildirimler içeriği buraya gelecek
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.base },
  placeholder: { ...TYPOGRAPHY.bodyLarge, textAlign: 'center', paddingVertical: SPACING.xxxl },
});
