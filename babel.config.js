module.exports = function(api) {
  api.cache(true);
  
  // Web için reanimated plugin'ini devre dışı bırak
  const plugins = [];
  if (process.env.EXPO_PUBLIC_PLATFORM !== 'web') {
    plugins.push('react-native-reanimated/plugin');
  }
  
  return {
    presets: ['babel-preset-expo'],
    plugins: plugins,
  };
};
