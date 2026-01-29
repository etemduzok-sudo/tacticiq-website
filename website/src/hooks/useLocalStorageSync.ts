import { useEffect, useRef } from 'react';

/**
 * Hook to sync state to localStorage
 * @param key LocalStorage key
 * @param value State value to sync
 */
export function useLocalStorageSync<T>(key: string, value: T) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render to avoid overwriting storage with initial state
    // only if we want to load from storage first (which is usually handled in useState initializer)
    // But here we just want to save updates.
    
    if (value !== undefined && value !== null) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error saving to localStorage [${key}]:`, error);
      }
    }
  }, [key, value]);
}
