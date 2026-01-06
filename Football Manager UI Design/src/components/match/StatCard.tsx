import React from 'react';
import { View, Text } from 'react-native';

interface StatCardProps {
  homeValue: number;
  awayValue: number;
  label: string;
  isPercentage?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  homeValue,
  awayValue,
  label,
  isPercentage,
}) => {
  const total = homeValue + awayValue;
  const homePercentage = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercentage = total > 0 ? (awayValue / total) * 100 : 50;

  return (
    <View className="mb-4">
      {/* Values */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold text-base">
          {isPercentage ? `${homeValue}%` : homeValue}
        </Text>
        <Text className="text-gray-400 text-sm">{label}</Text>
        <Text className="text-white font-bold text-base">
          {isPercentage ? `${awayValue}%` : awayValue}
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="flex-row h-[6px] bg-white/10 rounded-full overflow-hidden">
        <View
          className="bg-emerald h-full"
          style={{ width: `${homePercentage}%` }}
        />
        <View
          className="bg-gray-400 h-full"
          style={{ width: `${awayPercentage}%` }}
        />
      </View>
    </View>
  );
};
