import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function DeleteAccount() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.title, { color: colors.error }]}>
            ⚠️ Hesabı Sil
          </Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </Text>
          <Button
            title="Hesabı Sil"
            onPress={() => {}}
            variant="primary"
            fullWidth
            style={{ backgroundColor: colors.error }}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg },
  title: { ...TYPOGRAPHY.h3, marginBottom: SPACING.md },
  text: { ...TYPOGRAPHY.body, marginBottom: SPACING.lg },
});
