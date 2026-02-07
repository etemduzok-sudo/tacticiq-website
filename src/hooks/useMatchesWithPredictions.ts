// Hangi maçlara tahmin yapıldığını AsyncStorage'dan tespit eder
// ✅ Hem basit (squad-{matchId}) hem takıma özel (squad-{matchId}-{teamId}) anahtarları kontrol eder
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, LEGACY_STORAGE_KEYS } from '../config/constants';
import { predictionsDb } from '../services/databaseService';

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
      // ✅ Tüm AsyncStorage anahtarlarını al (takıma özel anahtarları da bulmak için)
      const allKeys = await AsyncStorage.getAllKeys();
      
      const set = new Set<number>();
      for (const matchId of matchIds) {
        // 1. Prediction key kontrolü (basit)
        const predKey = `${PREDICTION_KEY_PREFIX}${matchId}`;
        const legacyPredKey = `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}`;
        
        // 2. Squad key kontrolü: hem basit hem takıma özel (squad-{matchId} ve squad-{matchId}-{teamId})
        const squadKeyBase = `${SQUAD_KEY_PREFIX}${matchId}`;
        const legacySquadKeyBase = `${LEGACY_SQUAD_KEY_PREFIX}${matchId}`;
        
        // Tüm olası squad anahtarlarını bul (basit + takıma özel)
        const squadKeys = allKeys.filter(k => 
          k === squadKeyBase || k.startsWith(`${squadKeyBase}-`) ||
          k === legacySquadKeyBase || k.startsWith(`${legacySquadKeyBase}-`)
        );
        
        // Prediction kontrolü
        const predKeys = [predKey, legacyPredKey].filter(k => allKeys.includes(k));
        let hasPred = false;
        if (predKeys.length > 0) {
          const predPairs = await AsyncStorage.multiGet(predKeys);
          hasPred = predPairs.some(([_, v]) => v != null && v.length > 0);
        }
        
        // Squad kontrolü (isCompleted check)
        let hasSquad = false;
        if (squadKeys.length > 0) {
          const squadPairs = await AsyncStorage.multiGet(squadKeys);
          for (const [_, value] of squadPairs) {
            if (value) {
              try {
                const parsed = JSON.parse(value);
                if (parsed?.isCompleted === true) {
                  hasSquad = true;
                  break;
                }
              } catch (_) {}
            }
          }
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

  const clearPredictionForMatch = useCallback(async (matchId: number, teamId?: number) => {
    try {
      // ✅ Eğer teamId verilmişse sadece o takıma özel anahtarları temizle
      // Eğer teamId verilmemişse tüm tahminleri temizle
      const allKeys = await AsyncStorage.getAllKeys();
      let keysToRemove: string[] = [];
      
      if (teamId != null) {
        // ✅ Sadece belirli takıma özel anahtarları temizle
        keysToRemove = allKeys.filter(k =>
          k === `${PREDICTION_KEY_PREFIX}${matchId}-${teamId}` ||
          k === `${SQUAD_KEY_PREFIX}${matchId}-${teamId}` ||
          k === `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}-${teamId}` ||
          k === `${LEGACY_SQUAD_KEY_PREFIX}${matchId}-${teamId}`
        );
      } else {
        // ✅ Tüm tahminleri temizle (hem basit hem takıma özel)
        keysToRemove = allKeys.filter(k =>
          k === `${PREDICTION_KEY_PREFIX}${matchId}` ||
          k === `${SQUAD_KEY_PREFIX}${matchId}` ||
          k.startsWith(`${SQUAD_KEY_PREFIX}${matchId}-`) ||
          k === `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}` ||
          k === `${LEGACY_SQUAD_KEY_PREFIX}${matchId}` ||
          k.startsWith(`${LEGACY_SQUAD_KEY_PREFIX}${matchId}-`)
        );
      }
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      
      // ✅ Veritabanından da tahminleri temizle
      try {
        const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userId = userData?.id;
        if (userId) {
          // ✅ Eğer teamId verilmişse, database'de de filtreleme yapılabilir ama şimdilik tümünü siliyoruz
          // Database'de predictionTeamId bilgisi varsa filtreleme yapılabilir
          await predictionsDb.deletePredictionsByMatch(userId, String(matchId));
        }
      } catch (dbError) {
        console.warn('Database cleanup failed:', dbError);
      }
      
      // ✅ Eğer tüm tahminler silindiyse matchId'yi listeden çıkar
      // Eğer sadece bir takım silindiyse, diğer takım için tahmin varsa listede kalmalı
      if (teamId == null) {
        setMatchIdsWithPredictions(prev => {
          const next = new Set(prev);
          next.delete(matchId);
          return next;
        });
      } else {
        // ✅ Bir takım silindi, diğer takım için tahmin var mı kontrol et
        const remainingKeys = allKeys.filter(k =>
          (k === `${PREDICTION_KEY_PREFIX}${matchId}` || k.startsWith(`${PREDICTION_KEY_PREFIX}${matchId}-`)) &&
          !keysToRemove.includes(k)
        );
        if (remainingKeys.length === 0) {
          setMatchIdsWithPredictions(prev => {
            const next = new Set(prev);
            next.delete(matchId);
            return next;
          });
        }
      }
    } catch (e) {
      console.warn('clearPredictionForMatch error:', e);
    }
  }, []);

  return { matchIdsWithPredictions, refresh, clearPredictionForMatch };
}
