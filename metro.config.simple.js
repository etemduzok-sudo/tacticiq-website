// Basitleştirilmiş Metro config - Web için Expo Router olmadan
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Web için resolver ayarları
config.resolver = {
  ...config.resolver,
  assetExts: [...(config.resolver?.assetExts || []), 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
  sourceExts: [...(config.resolver?.sourceExts || []), 'jsx', 'js', 'ts', 'tsx', 'json'],
  resolveRequest: (context, moduleName, platform) => {
    // Web için expo-router'ı ignore et
    if (platform === 'web') {
      if (moduleName.includes('expo-router') || 
          moduleName.includes('/app/') || 
          moduleName.includes('\\app\\') ||
          moduleName === 'app') {
        return { type: 'empty' };
      }
    }

    try {
      return resolve(context, moduleName, platform);
    } catch (error) {
      if (moduleName.includes('logo') || moduleName.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        return { type: 'empty' };
      }
      throw error;
    }
  },
};

// Web için transformer - Hermes devre dışı
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
  unstable_allowRequireContext: true,
};

// Web için server middleware
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // URL'den routerRoot ve Hermes parametrelerini kaldır
      if (req.url) {
        req.url = req.url
          .replace(/[&?]transform\.routerRoot=app/g, '')
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
