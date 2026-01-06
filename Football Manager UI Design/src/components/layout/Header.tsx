import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBackPress,
  rightComponent,
}) => {
  return (
    <SafeAreaView edges={['top']} className="bg-background-dark">
      <View className="h-[60px] flex-row items-center justify-between px-6 border-b border-white/10">
        {onBackPress ? (
          <TouchableOpacity
            onPress={onBackPress}
            className="w-[40px] h-[40px] justify-center items-start"
            activeOpacity={0.8}
          >
            <Text className="text-emerald text-2xl">←</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-[40px]" />
        )}

        <Text className="text-white font-bold text-lg">{title}</Text>

        <View className="w-[40px]">{rightComponent}</View>
      </View>
    </SafeAreaView>
  );
};
