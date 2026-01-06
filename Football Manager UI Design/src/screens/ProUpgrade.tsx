import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function ProUpgrade() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ backgroundColor: colors.accent }}>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>
            ⭐ Pro Üyelik
          </Text>
          <Text style={[styles.text, { color: '#FFFFFF' }]}>
            Premium özelliklere erişim sağlayın!
          </Text>
          <Button
            title="Şimdi Yükselt - ₺49.99/ay"
            onPress={() => {}}
            variant="pro"
            style={styles.button}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg },
  title: { ...TYPOGRAPHY.h2, marginBottom: SPACING.md },
  text: { ...TYPOGRAPHY.body, marginBottom: SPACING.lg },
  button: { marginTop: SPACING.md },
});
