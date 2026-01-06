import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme/theme';
import { Header } from '../components/organisms';

export default function DeleteAccountScreen() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }]}>
      <Header title="Hesabı Sil" showBack />
      <View style={{ padding: SPACING.base }}>
        <Text style={{ color: colors.textSecondary }}>Hesap silme ekranı</Text>
      </View>
    </SafeAreaView>
  );
}
