// src/components/layouts/ScreenLayout.tsx
// Standardized Screen Layout Component
import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../../theme/theme';
import { containerStyles } from '../../utils/styleHelpers';

interface ScreenLayoutProps {
  children: React.ReactNode;
  safeArea?: boolean;
  scrollable?: boolean;
  gradient?: boolean;
  gradientColors?: string[];
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
}

/**
 * Standardized Screen Layout Component
 * 
 * Provides consistent screen structure across the app:
 * - SafeAreaView support
 * - ScrollView support
 * - Gradient background option
 * - Consistent padding and spacing
 */
export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  safeArea = true,
  scrollable = false,
  gradient = false,
  gradientColors = ['#0F172A', '#1E293B', '#0F172A'],
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
}) => {
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

  if (gradient) {
    return (
      <Container style={[containerStyle, style]}>
        <LinearGradient
          colors={gradientColors}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      </Container>
    );
  }

  return (
    <Container style={[containerStyle, style]}>
      {content}
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.base,
  },
  gradient: {
    flex: 1,
  },
});

export default ScreenLayout;
