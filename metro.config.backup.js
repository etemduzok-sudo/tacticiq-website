// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Web için expo-router plugin'ini devre dışı bırak
if (process.env.EXPO_PLATFORM === 'web' || process.argv.includes('--web')) {
  // expo-router plugin'ini ignore et
  if (config.transformer && config.transformer.getTransformOptions) {
    const originalGetTransformOptions = config.transformer.getTransformOptions;
    config.transformer.getTransformOptions = async (...args) => {
      const result = await originalGetTransformOptions(...args);
      // Web için routerRoot ve Hermes parametrelerini kaldır
      if (result && typeof result === 'object') {
        delete result.routerRoot;
        delete result.transform?.engine;
        if (result.unstable_transformProfile === 'hermes-stable') {
          result.unstable_transformProfile = 'default';
        }
      }
      return result;
    };
  }
}

// Web için Expo Router'ı tamamen devre dışı bırak
// Metro'nun entry point detection'ını override et
// NOT: Serializer override'ı kaldırıldı - Metro'nun kendi entry point detection'ını kullan
// Bunun yerine package.json'da "web": "index.web.js" kullanılıyor

// Web için resolver ayarları
config.resolver = {
  ...config.resolver,
  assetExts: [...(config.resolver?.assetExts || []), 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'],
  sourceExts: [...(config.resolver?.sourceExts || []), 'jsx', 'js', 'ts', 'tsx', 'json'],
  resolveRequest: (context, moduleName, platform) => {
    // Web için Expo Router'ı tamamen bypass et
    if (platform === 'web') {
      // app/ dizinini web için ignore et
      if (moduleName.includes('/app/') || moduleName.includes('\\app\\') || moduleName === 'app' || moduleName.startsWith('app/')) {
        console.warn(`⚠️ Expo Router bypassed for web: ${moduleName}`);
        return { type: 'empty' };
      }

      // expo-router modüllerini web için ignore et
      if (moduleName.includes('expo-router') || 
          moduleName.includes('@expo/metro-runtime') ||
          moduleName.includes('expo-router') ||
          moduleName === 'expo-router') {
        console.warn(`⚠️ Expo Router module bypassed for web: ${moduleName}`);
        return { type: 'empty' };
      }
      
      // app/ dizini referanslarını web için ignore et
      if (moduleName.includes('app/_layout') || 
          moduleName.includes('app/index') ||
          moduleName.includes('app\\_layout') ||
          moduleName.includes('app\\index')) {
        console.warn(`⚠️ Expo Router app/ reference bypassed for web: ${moduleName}`);
        return { type: 'empty' };
      }

      const internalModules = [
        'Utilities/Platform',
        'PlatformColorValueTypes',
        'BaseViewConfig',
        'NativeComponent',
        'ReactNativeViewViewConfig',
        'BridgelessUIManager',
        'UIManager',
      ];

      const isInternalModule = internalModules.some((mod) => moduleName.includes(mod));
      if (isInternalModule) {
        return { type: 'empty' };
      }
    }

    // Missing asset handling - try to resolve, if fails return empty
    try {
      return resolve(context, moduleName, platform);
    } catch (error) {
      // If it's an asset error (logo, image), return empty module to prevent bundle failure
      if (moduleName.includes('logo') || moduleName.includes('fan_manager_shield') || moduleName.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        console.warn(`⚠️ Asset not found: ${moduleName}. Please add the file.`);
        return { type: 'empty' };
      }
      throw error;
    }
  },
};

// Web için transformer ayarları
config.transformer = {
  ...config.transformer,
  getTransformOptions: async (entryPoints, options) => {
    // Web için Hermes'i devre dışı bırak
    if (options?.platform === 'web') {
      const transformOptions = {
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
        // Web için Hermes kullanma - ZORLA devre dışı
        unstable_transformProfile: 'default',
        // Hermes engine'i devre dışı bırak
        engine: undefined,
      };
      
      // routerRoot parametresini kaldır
      if (transformOptions.routerRoot) {
        delete transformOptions.routerRoot;
      }
      
      return transformOptions;
    }
    return {
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    };
  },
  unstable_allowRequireContext: true,
  // Web için Hermes'i tamamen devre dışı bırak
  unstable_hermesParser: false,
};

// Web için server middleware - MIME type düzeltmesi ve routerRoot kaldırma
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // URL'den routerRoot parametresini kaldır (Expo Router bypass)
      if (req.url && req.url.includes('transform.routerRoot=app')) {
        req.url = req.url.replace(/[&?]transform\.routerRoot=app/g, '');
        console.log('🔧 [METRO] routerRoot parametresi URL\'den kaldırıldı');
      }
      
      // Hermes parametrelerini kaldır
      if (req.url && req.url.includes('transform.engine=hermes')) {
        req.url = req.url.replace(/[&?]transform\.engine=hermes/g, '');
        console.log('🔧 [METRO] Hermes engine parametresi URL\'den kaldırıldı');
      }
      
      if (req.url && req.url.includes('unstable_transformProfile=hermes-stable')) {
        req.url = req.url.replace(/[&?]unstable_transformProfile=hermes-stable/g, '');
        console.log('🔧 [METRO] Hermes transform profile parametresi URL\'den kaldırıldı');
      }
      
      // Bundle dosyaları için doğru MIME type
      if (req.url && req.url.includes('.bundle')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
