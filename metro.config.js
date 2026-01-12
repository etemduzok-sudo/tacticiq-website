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

// Web için server middleware - URL parametrelerini temizle ve MIME type düzelt
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // server.bundle isteklerini handle et (Expo Router olmadan gerekli değil)
      if (req.url && req.url.includes('server.bundle')) {
        // Boş bir JavaScript dosyası döndür (Expo Router kullanmıyoruz)
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        res.end('// server.bundle not needed (Expo Router disabled)');
        return;
      }
      
      // URL parametrelerini temizle (regex ile)
      if (req.url) {
        // Hermes ve router parametrelerini kaldır
        req.url = req.url
          .replace(/[&?]transform\.routerRoot=[^&]*/g, '')
          .replace(/[&?]transform\.engine=hermes/g, '')
          .replace(/[&?]unstable_transformProfile=[^&]*/g, '')
          .replace(/\?&/, '?') // Çift ?& temizle
          .replace(/&$/, '') // Sondaki & temizle
          .replace(/\?$/, ''); // Sondaki ? temizle
      }
      
      // Bundle için MIME type ayarla
      if (req.url && req.url.includes('.bundle')) {
        // Response'un setHeader metodunu override et
        const originalSetHeader = res.setHeader;
        res.setHeader = function(name, value) {
          if (name.toLowerCase() === 'content-type') {
            return originalSetHeader.call(this, 'Content-Type', 'application/javascript; charset=utf-8');
          }
          return originalSetHeader.call(this, name, value);
        };
        
        // Response'un writeHead metodunu override et
        const originalWriteHead = res.writeHead;
        res.writeHead = function(statusCode, statusMessage, headers) {
          if (headers && typeof headers === 'object') {
            headers['Content-Type'] = 'application/javascript; charset=utf-8';
          } else if (!headers) {
            headers = { 'Content-Type': 'application/javascript; charset=utf-8' };
          }
          return originalWriteHead.call(this, statusCode, statusMessage, headers);
        };
      }
      
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
