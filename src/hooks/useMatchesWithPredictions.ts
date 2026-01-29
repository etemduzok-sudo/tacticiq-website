// Hangi maçlara tahmin yapıldığını AsyncStorage'dan tespit eder
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

const SQUAD_KEY_PREFIX = 'fan-manager-squad-';
const PREDICTION_KEY_PREFIX = STORAGE_KEYS.PREDICTIONS;

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
        keys.push(`${PREDICTION_KEY_PREFIX}${id}`);
        keys.push(`${SQUAD_KEY_PREFIX}${id}`);
      }
      const pairs = await AsyncStorage.multiGet(keys);
      const set = new Set<number>();
      for (let i = 0; i < matchIds.length; i++) {
        const matchId = matchIds[i];
        const predKey = `${PREDICTION_KEY_PREFIX}${matchId}`;
        const squadKey = `${SQUAD_KEY_PREFIX}${matchId}`;
        const predPair = pairs.find(([k]) => k === predKey);
        const squadPair = pairs.find(([k]) => k === squadKey);
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
      await AsyncStorage.multiRemove([
        `${PREDICTION_KEY_PREFIX}${matchId}`,
        `${SQUAD_KEY_PREFIX}${matchId}`,
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
