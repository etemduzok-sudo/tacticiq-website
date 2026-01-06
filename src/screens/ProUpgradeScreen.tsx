import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import SafeIcon from '../components/SafeIcon';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme/theme';
import { Header } from '../components/organisms';
import { Button, Card } from '../components/atoms';

export default function ProUpgradeScreen() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const features = [
    'Sınırsız tahmin',
    'Gelişmiş istatistikler',
    'Reklamsız deneyim',
    'Özel rozetler',
    'Öncelikli destek',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Pro Üyelik" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <SafeIcon name="star" size={80} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Pro'ya Yükselt</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tüm özelliklere sınırsız erişim
          </Text>
        </View>

        <Card variant="elevated" padding="large" style={styles.featuresCard}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <SafeIcon name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
            </View>
          ))}
        </Card>

        <Button title="Aylık ₺49.99" onPress={() => {}} variant="pro" fullWidth />
        <Button
          title="Yıllık ₺399.99 (2 ay bedava)"
          onPress={() => {}}
          variant="pro"
          fullWidth
          style={styles.yearlyButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.base },
  hero: { alignItems: 'center', marginVertical: SPACING.xxxl },
  title: { ...TYPOGRAPHY.h1, marginTop: SPACING.lg },
  subtitle: { ...TYPOGRAPHY.bodyLarge, marginTop: SPACING.sm, textAlign: 'center' },
  featuresCard: { marginVertical: SPACING.xl },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.base },
  featureText: { ...TYPOGRAPHY.bodyLargeSemibold, flex: 1 },
  yearlyButton: { marginTop: SPACING.md },
});
