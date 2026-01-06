import React from 'react';
import { View, Text, Platform } from 'react-native';

interface SafeIconProps {
  name: any;
  size?: number;
  color?: string;
  style?: any;
}

/**
 * Safe Icon Component - Ionicons yerine emoji fallback kullanır
 * Font yükleme sorunlarını tamamen bypass eder
 */
const SafeIcon: React.FC<SafeIconProps> = ({ name, size = 24, color = '#000', style }) => {
  // Font yükleme sorunlarını bypass etmek için direkt emoji kullan
    const fallbackEmojis: Record<string, string> = {
      'home': '🏠',
      'football': '⚽',
      'stats-chart': '📊',
      'person': '👤',
      'notifications': '🔔',
      'settings': '⚙️',
      'arrow-back': '←',
      'shield': '🛡️',
      'mail': '📧',
      'lock-closed': '🔒',
      'eye': '👁️',
      'eye-off': '👁️',
      'search': '🔍',
      'filter': '🏷️',
      'star': '⭐',
      'trophy': '🏆',
      'checkmark': '✓',
      'close': '✕',
      'add': '+',
      'heart': '❤️',
      'chevron-forward': '›',
      'radio': '📡',
      'time': '⏰',
      'checkmark-circle': '✅',
    };

    const emoji = fallbackEmojis[name] || '⚪';

    return (
      <View
        style={[
          {
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Text style={{ fontSize: size * 0.7, color }}>{emoji}</Text>
      </View>
    );
};

export default SafeIcon;
