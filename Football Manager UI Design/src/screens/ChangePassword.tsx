import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../constants/theme';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function ChangePassword() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Input
            label="Mevcut Şifre"
            placeholder="Mevcut şifrenizi girin"
            secureTextEntry
          />
          <Input
            label="Yeni Şifre"
            placeholder="Yeni şifrenizi girin"
            secureTextEntry
          />
          <Input
            label="Yeni Şifre Tekrar"
            placeholder="Yeni şifrenizi tekrar girin"
            secureTextEntry
          />
          <Button title="Şifreyi Değiştir" onPress={() => {}} fullWidth />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg },
});
