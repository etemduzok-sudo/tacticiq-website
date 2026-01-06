import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SIZES, TYPOGRAPHY } from '../../theme/theme';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
}

const Avatar = React.memo(function Avatar({ uri, name, size = 'medium', style }: AvatarProps) {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  const getSize = () => {
    switch (size) {
      case 'small':
        return SIZES.avatarSm;
      case 'large':
        return SIZES.avatarLg;
      case 'xlarge':
        return SIZES.avatarXl;
      default:
        return SIZES.avatarMd;
    }
  };

  const avatarSize = getSize();
  const fontSize = avatarSize / 2.5;

  const getInitials = () => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: uri ? 'transparent' : colors.primary,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
          ]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize, color: '#FFFFFF' }]}>
          {getInitials()}
        </Text>
      )}
    </View>
  );
});

export default Avatar;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontWeight: '600',
  },
});
