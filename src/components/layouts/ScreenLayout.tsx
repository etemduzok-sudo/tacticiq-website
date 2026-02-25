// src/components/layouts/ScreenLayout.tsx
// Standardized Screen Layout Component
import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../theme/theme';
import { containerStyles } from '../../utils/styleHelpers';
import { useTheme } from '../../contexts/ThemeContext';

interface ScreenLayoutProps {
  children: React.ReactNode;
  safeArea?: boolean;
  scrollable?: boolean;
  gradient?: boolean;
  gradientColors?: string[];
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
  showGridPattern?: boolean;
}

/**
 * Standardized Screen Layout Component
 * 
 * Provides consistent screen structure across the app:
 * - SafeAreaView support
 * - ScrollView support
 * - Gradient background option (dark) / solid background (light)
 * - Grid pattern (hero style) option
 * - Consistent padding and spacing
 */
export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  safeArea = true,
  scrollable = false,
  gradient = true,
  gradientColors = ['#0a1612', '#0F2A24', '#0a1612'],
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  showGridPattern = true,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const themeColors = isLight ? COLORS.light : COLORS.dark;

  const Container = safeArea ? SafeAreaView : View;
  const containerStyle = safeArea ? containerStyles.safeArea : containerStyles.screen;

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        containerStyles.scrollContent,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentContainerStyle]}>
      {children}
    </View>
  );

  if (isLight) {
    return (
      <Container style={[containerStyle, style, { backgroundColor: themeColors.background }]}>
        {showGridPattern && (
          <View
            style={[
              styles.gridPattern,
              { backgroundColor: themeColors.background },
              Platform.OS === 'web' && {
                backgroundImage: `linear-gradient(to right, rgba(15, 42, 36, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 42, 36, 0.08) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              },
            ]}
          />
        )}
        {content}
      </Container>
    );
  }

  return (
    <Container style={[containerStyle, style]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {showGridPattern && <View style={styles.gridPattern} />}
        {content}
      </LinearGradient>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.base,
    zIndex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 1,
    zIndex: 0,
    ...Platform.select({
      web: {
        backgroundImage: `
          linear-gradient(to right, rgba(31, 162, 166, 0.12) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(31, 162, 166, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
});

export default ScreenLayout;
