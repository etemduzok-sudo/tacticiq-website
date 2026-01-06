import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Badge } from '../ui/Badge';

interface MatchCardProps {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'finished' | 'upcoming';
  date: string;
  minute?: number;
  league: string;
  onPress: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  date,
  minute,
  league,
  onPress,
}) => {
  const statusConfig = {
    live: { badge: 'LIVE', variant: 'success' as const, showMinute: true },
    finished: { badge: 'FT', variant: 'info' as const, showMinute: false },
    upcoming: { badge: date, variant: 'warning' as const, showMinute: false },
  };

  const config = statusConfig[status];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-card-dark border border-white/10 rounded-lg p-4 mb-3"
      activeOpacity={0.8}
    >
      {/* Status Badge */}
      <View className="flex-row justify-between items-center mb-3">
        <Badge text={config.badge} variant={config.variant} size="small" />
        {config.showMinute && minute && (
          <Text className="text-emerald font-bold">{minute}'</Text>
        )}
      </View>

      {/* League */}
      <Text className="text-gray-400 text-xs mb-2">{league}</Text>

      {/* Teams and Scores */}
      <View className="gap-2">
        {/* Home Team */}
        <View className="flex-row justify-between items-center">
          <Text className="text-white font-medium text-base flex-1">
            {homeTeam}
          </Text>
          {homeScore !== undefined && (
            <Text className="text-white font-bold text-xl ml-4">
              {homeScore}
            </Text>
          )}
        </View>

        {/* Away Team */}
        <View className="flex-row justify-between items-center">
          <Text className="text-white font-medium text-base flex-1">
            {awayTeam}
          </Text>
          {awayScore !== undefined && (
            <Text className="text-white font-bold text-xl ml-4">
              {awayScore}
            </Text>
          )}
        </View>
      </View>

      {/* Match Stats Preview */}
      {status === 'live' && (
        <View className="flex-row justify-around mt-3 pt-3 border-t border-white/10">
          <View className="items-center">
            <Text className="text-gray-400 text-xs">Şutlar</Text>
            <Text className="text-white font-bold">12</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-400 text-xs">Top Hâkimiyeti</Text>
            <Text className="text-emerald font-bold">58%</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-400 text-xs">Kornerler</Text>
            <Text className="text-white font-bold">7</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};
