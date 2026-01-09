// src/components/layouts/StandardHeader.tsx
// Standardized Header Component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headerStyles, textStyles } from '../../utils/styleHelpers';
import { SPACING, SIZES } from '../../theme/theme';
import { COLORS } from '../../theme/theme';

interface StandardHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
    badge?: number;
  };
  showBorder?: boolean;
}

/**
 * Standardized Header Component
 * 
 * Provides consistent header structure:
 * - Back button (optional)
 * - Title
 * - Right action button (optional)
 * - Consistent styling
 */
export const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  onBack,
  rightAction,
  showBorder = true,
}) => {
  return (
    <View style={[
      headerStyles.header,
      !showBorder && styles.noBorder,
    ]}>
      {/* Left: Back Button */}
      <View style={styles.leftSection}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={headerStyles.headerButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={SIZES.iconMd} color={COLORS.dark.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={headerStyles.headerButton} />
        )}
      </View>

      {/* Center: Title */}
      <View style={styles.centerSection}>
        <Text style={headerStyles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Right: Action Button */}
      <View style={styles.rightSection}>
        {rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={headerStyles.headerButton}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={rightAction.icon as any} 
              size={SIZES.iconMd} 
              color={COLORS.dark.foreground} 
            />
            {rightAction.badge !== undefined && rightAction.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{rightAction.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={headerStyles.headerButton} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  leftSection: {
    width: SIZES.buttonIconSize,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  rightSection: {
    width: SIZES.buttonIconSize,
    alignItems: 'flex-end',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.dark.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.dark.background,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.dark.foreground,
  },
});

export default StandardHeader;
