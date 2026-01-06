import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import SafeIcon from '../SafeIcon';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SIZES, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightIcon?: any;
  onRightIconPress?: () => void;
  transparent?: boolean;
}

const Header = React.memo(function Header({
  title,
  showBack = false,
  rightIcon,
  onRightIconPress,
  transparent = false,
}: HeaderProps) {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : colors.background}
        translucent={transparent}
      />
      <View
        style={[
          styles.container,
          {
            backgroundColor: transparent ? 'transparent' : colors.surface,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 0 + SPACING.sm,
          },
          !transparent && SHADOWS.small,
        ]}
      >
        <View style={styles.content}>
          {showBack && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <SafeIcon name="arrow-back" size={SIZES.iconLg} color={colors.text} />
            </TouchableOpacity>
          )}

          {title && (
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}

          <View style={styles.spacer} />

          {rightIcon && onRightIconPress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onRightIconPress}
              activeOpacity={0.7}
            >
              <SafeIcon name={rightIcon} size={SIZES.iconLg} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
});

export default Header;

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    height: SIZES.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h3,
    marginLeft: SPACING.md,
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
});
