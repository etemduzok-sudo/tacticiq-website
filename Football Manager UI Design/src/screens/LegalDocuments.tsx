import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import Card from '../components/ui/Card';
import { Ionicons } from '@expo/vector-icons';

type LegalNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LegalDocuments() {
  const navigation = useNavigation<LegalNavigationProp>();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const documents = [
    { type: 'terms' as const, title: 'Kullanım Koşulları', icon: 'document-text-outline' },
    { type: 'privacy' as const, title: 'Gizlilik Politikası', icon: 'shield-checkmark-outline' },
    { type: 'cookies' as const, title: 'Çerez Politikası', icon: 'information-circle-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {documents.map((doc) => (
          <TouchableOpacity
            key={doc.type}
            onPress={() => navigation.navigate('LegalDocument', { type: doc.type })}
          >
            <Card variant="elevated" style={styles.card}>
              <View style={styles.row}>
                <Ionicons name={doc.icon as any} size={24} color={colors.text} />
                <Text style={[styles.title, { color: colors.text }]}>{doc.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg },
  card: { marginBottom: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  title: { ...TYPOGRAPHY.body, flex: 1 },
});
