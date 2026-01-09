// Image Caching Utility - CDN and Local Caching
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = `${FileSystem.cacheDirectory}images/`;
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  uri: string;
  timestamp: number;
  size: number;
}

class ImageCacheManager {
  private static instance: ImageCacheManager;
  private cacheMap: Map<string, CacheEntry> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // Load cache map from AsyncStorage
      const cacheData = await AsyncStorage.getItem('image-cache-map');
      if (cacheData) {
        const entries = JSON.parse(cacheData);
        this.cacheMap = new Map(Object.entries(entries));
      }

      this.initialized = true;
      console.log('✅ Image cache initialized');
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  private getCacheKey(url: string): string {
    return url.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private getCachePath(key: string): string {
    return `${CACHE_DIR}${key}`;
  }

  async getCachedImage(url: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Web doesn't need caching (browser handles it)
      return url;
    }

    await this.initialize();

    const key = this.getCacheKey(url);
    const cached = this.cacheMap.get(key);

    if (cached) {
      // Check if cache is expired
      if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
        await this.removeCachedImage(url);
        return null;
      }

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(cached.uri);
      if (fileInfo.exists) {
        return cached.uri;
      } else {
        // File was deleted, remove from cache map
        this.cacheMap.delete(key);
        await this.saveCacheMap();
      }
    }

    return null;
  }

  async cacheImage(url: string): Promise<string> {
    if (Platform.OS === 'web') {
      return url;
    }

    await this.initialize();

    // Check if already cached
    const cached = await this.getCachedImage(url);
    if (cached) {
      return cached;
    }

    try {
      const key = this.getCacheKey(url);
      const cachePath = this.getCachePath(key);

      // Download image
      const downloadResult = await FileSystem.downloadAsync(url, cachePath);

      if (downloadResult.status === 200) {
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        
        // Add to cache map
        this.cacheMap.set(key, {
          uri: downloadResult.uri,
          timestamp: Date.now(),
          size: fileInfo.size || 0,
        });

        await this.saveCacheMap();
        return downloadResult.uri;
      }

      return url;
    } catch (error) {
      console.error('Failed to cache image:', error);
      return url;
    }
  }

  async removeCachedImage(url: string): Promise<void> {
    const key = this.getCacheKey(url);
    const cached = this.cacheMap.get(key);

    if (cached) {
      try {
        await FileSystem.deleteAsync(cached.uri, { idempotent: true });
        this.cacheMap.delete(key);
        await this.saveCacheMap();
      } catch (error) {
        console.error('Failed to remove cached image:', error);
      }
    }
  }

  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      this.cacheMap.clear();
      await this.saveCacheMap();
      console.log('✅ Image cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    let totalSize = 0;
    for (const entry of this.cacheMap.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private async saveCacheMap(): Promise<void> {
    try {
      const entries = Object.fromEntries(this.cacheMap);
      await AsyncStorage.setItem('image-cache-map', JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save cache map:', error);
    }
  }
}

export const imageCacheManager = ImageCacheManager.getInstance();

// Hook for cached images
export function useCachedImage(url: string | undefined): string | undefined {
  const [cachedUri, setCachedUri] = React.useState<string | undefined>(url);

  React.useEffect(() => {
    if (!url) return;

    let isMounted = true;

    const loadImage = async () => {
      try {
        const cached = await imageCacheManager.getCachedImage(url);
        if (isMounted) {
          if (cached) {
            setCachedUri(cached);
          } else {
            // Cache in background
            imageCacheManager.cacheImage(url).then((uri) => {
              if (isMounted) {
                setCachedUri(uri);
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to load cached image:', error);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return cachedUri;
}

import React from 'react';
