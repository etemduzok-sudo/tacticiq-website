// Hangi maçlara tahmin yapıldığını AsyncStorage'dan tespit eder
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from '../config/constants';

const SQUAD_KEY_PREFIX = STORAGE_KEYS.SQUAD;
const LEGACY_SQUAD_KEY_PREFIX = LEGACY_STORAGE_KEYS.SQUAD;
const PREDICTION_KEY_PREFIX = STORAGE_KEYS.PREDICTIONS;
const LEGACY_PREDICTION_KEY_PREFIX = LEGACY_STORAGE_KEYS.PREDICTIONS;

export function useMatchesWithPredictions(matchIds: number[]) {
  const [matchIdsWithPredictions, setMatchIdsWithPredictions] = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    if (!matchIds.length) {
      setMatchIdsWithPredictions(new Set());
      return;
    }
    try {
      const keys: string[] = [];
      for (const id of matchIds) {
        // New keys
        keys.push(`${PREDICTION_KEY_PREFIX}${id}`);
        keys.push(`${SQUAD_KEY_PREFIX}${id}`);
        // Legacy keys for backward compatibility
        keys.push(`${LEGACY_PREDICTION_KEY_PREFIX}${id}`);
        keys.push(`${LEGACY_SQUAD_KEY_PREFIX}${id}`);
      }
      const pairs = await AsyncStorage.multiGet(keys);
      const set = new Set<number>();
      for (let i = 0; i < matchIds.length; i++) {
        const matchId = matchIds[i];
        // Check both new and legacy keys
        const predKey = `${PREDICTION_KEY_PREFIX}${matchId}`;
        const legacyPredKey = `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}`;
        const squadKey = `${SQUAD_KEY_PREFIX}${matchId}`;
        const legacySquadKey = `${LEGACY_SQUAD_KEY_PREFIX}${matchId}`;
        
        const predPair = pairs.find(([k]) => k === predKey) || pairs.find(([k]) => k === legacyPredKey);
        const squadPair = pairs.find(([k]) => k === squadKey) || pairs.find(([k]) => k === legacySquadKey);
        
        const hasPred = predPair?.[1] != null && predPair[1].length > 0;
        let hasSquad = false;
        if (squadPair?.[1]) {
          try {
            const parsed = JSON.parse(squadPair[1]);
            hasSquad = parsed?.isCompleted === true;
          } catch (_) {}
        }
        if (hasPred || hasSquad) set.add(matchId);
      }
      setMatchIdsWithPredictions(set);
    } catch (e) {
      console.warn('useMatchesWithPredictions refresh error:', e);
      setMatchIdsWithPredictions(new Set());
    }
  }, [matchIds.join(',')]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clearPredictionForMatch = useCallback(async (matchId: number) => {
    try {
      // Remove both new and legacy keys
      await AsyncStorage.multiRemove([
        `${PREDICTION_KEY_PREFIX}${matchId}`,
        `${SQUAD_KEY_PREFIX}${matchId}`,
        `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}`,
        `${LEGACY_SQUAD_KEY_PREFIX}${matchId}`,
      ]);
      setMatchIdsWithPredictions(prev => {
        const next = new Set(prev);
        next.delete(matchId);
        return next;
      });
    } catch (e) {
      console.warn('clearPredictionForMatch error:', e);
    }
  }, []);

  return { matchIdsWithPredictions, refresh, clearPredictionForMatch };
}
