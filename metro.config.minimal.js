// Minimal Metro config - Sadece gerekli ayarlar
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Web için expo-router'ı tamamen ignore et
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Web için expo-router'ı tamamen ignore et
    if (platform === 'web') {
      if (moduleName.includes('expo-router') || 
          moduleName.includes('/app/') || 
          moduleName.includes('\\app\\') ||
          moduleName === 'app' ||
          moduleName.includes('expo-router/_error')) {
        console.warn(`⚠️ [METRO] Expo Router bypassed for web: ${moduleName}`);
        return { type: 'empty' };
      }
    }
    
    // Default resolve
    try {
      return resolve(context, moduleName, platform);
    } catch (error) {
      throw error;
    }
  },
};

// Web için sadece Hermes'i devre dışı bırak
config.transformer = {
  ...config.transformer,
  getTransformOptions: async (entryPoints, options) => {
    if (options?.platform === 'web') {
      return {
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
        unstable_transformProfile: 'default',
      };
    }
    return {
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    };
  },
};

module.exports = config;
