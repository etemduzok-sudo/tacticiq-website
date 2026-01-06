import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Avatar } from '../ui/Avatar';

interface PlayerCardProps {
  name: string;
  position: string;
  number: number;
  rating?: number;
  photo?: string;
  onPress?: () => void;
  isSelected?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  position,
  number,
  rating,
  photo,
  onPress,
  isSelected,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`bg-card-dark border-2 ${
        isSelected ? 'border-emerald' : 'border-white/10'
      } rounded-lg p-3 mb-3`}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View className="flex-row items-center gap-3">
        {/* Jersey Number */}
        <View className="w-[40px] h-[40px] bg-emerald/20 rounded-lg justify-center items-center">
          <Text className="text-emerald font-bold text-lg">{number}</Text>
        </View>

        {/* Player Avatar */}
        <Avatar source={photo} name={name} size="small" />

        {/* Player Info */}
        <View className="flex-1">
          <Text className="text-white font-medium text-base">{name}</Text>
          <Text className="text-gray-400 text-sm">{position}</Text>
        </View>

        {/* Rating */}
        {rating && (
          <View
            className={`w-[36px] h-[36px] rounded-lg justify-center items-center ${
              rating >= 8
                ? 'bg-emerald'
                : rating >= 7
                ? 'bg-gold'
                : 'bg-gray-600'
            }`}
          >
            <Text className="text-white font-bold text-sm">
              {rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
