import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('LanguageSelection');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryLight]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Ionicons name="football" size={80} color="#FFFFFF" />
        <Text style={styles.title}>Fan Manager</Text>
        <Text style={styles.subtitle}>2026</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: '#FFFFFF',
    marginTop: 24,
  },
  subtitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 8,
  },
});
