// Metro config - Expo Router'ı web için tamamen devre dışı bırak
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Web için sadece expo-router'ı ignore et - @expo/metro-runtime gerekli!
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Web için sadece expo-router ile ilgili modülleri ignore et
    if (platform === 'web') {
      // Sadece expo-router ve app/ dizinini ignore et
      // @expo/metro-runtime GEREKLİ, ignore etme!
      if (moduleName.includes('expo-router') || 
          moduleName.includes('/app/') || 
          moduleName.includes('\\app\\') ||
          moduleName === 'app' ||
          moduleName.includes('expo-router/_error') ||
          moduleName.includes('expo-router\\_error') ||
          moduleName.startsWith('app/') ||
          moduleName.startsWith('app\\')) {
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

// Web için Hermes'i devre dışı bırak
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

// Web için server middleware - URL parametrelerini temizle
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url) {
        // routerRoot ve Hermes parametrelerini kaldır
        req.url = req.url
          .replace(/[&?]transform\.routerRoot=[^&]*/g, '')
          .replace(/[&?]transform\.engine=hermes/g, '')
          .replace(/[&?]unstable_transformProfile=hermes-stable/g, '');
      }
      
      // Bundle için MIME type
      if (req.url && req.url.includes('.bundle')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
