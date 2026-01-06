import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TabItem {
  label: string;
  icon: string;
  onPress: () => void;
  isActive?: boolean;
}

interface BottomBarProps {
  tabs: TabItem[];
}

export const BottomBar: React.FC<BottomBarProps> = ({ tabs }) => {
  return (
    <SafeAreaView edges={['bottom']} className="bg-card-dark">
      <View className="h-[52px] flex-row border-t border-white/10">
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            onPress={tab.onPress}
            className="flex-1 justify-center items-center"
            activeOpacity={0.8}
          >
            <Text className="text-2xl mb-1">{tab.icon}</Text>
            <Text
              className={`text-xs ${
                tab.isActive ? 'text-emerald font-bold' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};
