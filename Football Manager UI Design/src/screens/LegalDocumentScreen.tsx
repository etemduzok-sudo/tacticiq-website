import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import Card from '../components/ui/Card';

type LegalDocumentRouteProp = RouteProp<RootStackParamList, 'LegalDocument'>;

export default function LegalDocumentScreen() {
  const route = useRoute<LegalDocumentRouteProp>();
  const { type } = route.params;
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const titles = {
    terms: 'Kullanım Koşulları',
    privacy: 'Gizlilik Politikası',
    cookies: 'Çerez Politikası',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.title, { color: colors.text }]}>
            {titles[type]}
          </Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            Yasal döküman içeriği buraya gelecek...
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg },
  title: { ...TYPOGRAPHY.h3, marginBottom: SPACING.md },
  text: { ...TYPOGRAPHY.body },
});
