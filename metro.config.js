// Metro config - Simplified for Expo SDK 52
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Web için özel ayarlar
config.resolver.sourceExts.push('web.js', 'web.jsx', 'web.ts', 'web.tsx');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');

// Web için react-native-reanimated mock'u
const path = require('path');
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Web platformunda react-native-reanimated'i mock ile değiştir
  if (platform === 'web' && moduleName === 'react-native-reanimated') {
    const mockPath = path.resolve(__dirname, 'src/utils/reanimated.web.js');
    return {
      filePath: mockPath,
      type: 'sourceFile',
    };
  }
  
  // Default resolver'ı kullan
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  // Fallback
  return context.resolveRequest(context, moduleName, platform);
};

// Web için transformer ayarları
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;
