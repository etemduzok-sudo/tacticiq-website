import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import Card from '../components/ui/Card';

type MatchDetailRouteProp = RouteProp<RootStackParamList, 'MatchDetail'>;

export default function MatchDetail() {
  const route = useRoute<MatchDetailRouteProp>();
  const { matchId } = route.params;
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="elevated">
          <Text style={[styles.title, { color: colors.text }]}>Maç Detayı</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Match ID: {matchId}
          </Text>
          
          {/* Match Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Maç Bilgisi
            </Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>
              Maç detayları buraya gelecek...
            </Text>
          </View>

          {/* Tabs: Özet, Kadro, İstatistikler, Canlı */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Sekmeler
            </Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>
              • Özet{'\n'}
              • Kadro{'\n'}
              • İstatistikler{'\n'}
              • Canlı{'\n'}
              • Tahmin{'\n'}
              • Oyuncu Puanları
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    marginBottom: SPACING.lg,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.sm,
  },
  text: {
    ...TYPOGRAPHY.body,
    lineHeight: 24,
  },
});
