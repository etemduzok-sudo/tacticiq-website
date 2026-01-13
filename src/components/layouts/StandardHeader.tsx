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
 * Simple, working header structure
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
      <View style={styles.leftContainer}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center: Title */}
      <View style={styles.titleContainer}>
        <Text style={headerStyles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Right: Action Button */}
      <View style={styles.rightContainer}>
        {rightAction ? (
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={rightAction.icon as any} 
              size={24} 
              color="#FFFFFF" 
            />
            {rightAction.badge !== undefined && rightAction.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{rightAction.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  leftContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  rightContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
