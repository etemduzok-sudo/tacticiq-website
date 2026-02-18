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
        // 1. Prediction key kontrolü: hem basit hem takıma özel
        const predKeyBase = `${PREDICTION_KEY_PREFIX}${matchId}`;
        const legacyPredKeyBase = `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}`;
        
        // 2. Squad key kontrolü: hem basit hem takıma özel (squad-{matchId} ve squad-{matchId}-{teamId})
        const squadKeyBase = `${SQUAD_KEY_PREFIX}${matchId}`;
        const legacySquadKeyBase = `${LEGACY_SQUAD_KEY_PREFIX}${matchId}`;
        
        // ✅ Tüm olası prediction anahtarlarını bul (basit + takıma özel)
        const predKeys = allKeys.filter(k => 
          k === predKeyBase || k.startsWith(`${predKeyBase}-`) ||
          k === legacyPredKeyBase || k.startsWith(`${legacyPredKeyBase}-`)
        );
        
        // Tüm olası squad anahtarlarını bul (basit + takıma özel)
        const squadKeys = allKeys.filter(k => 
          k === squadKeyBase || k.startsWith(`${squadKeyBase}-`) ||
          k === legacySquadKeyBase || k.startsWith(`${legacySquadKeyBase}-`)
        );
        
        // Prediction kontrolü
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
                // ✅ matchId karşılaştırması: hem string hem number olabilir, Number() ile normalize et
                const parsedMatchId = parsed?.matchId != null ? Number(parsed.matchId) : null;
                const isValidSquad = parsed?.isCompleted === true && 
                                    (parsedMatchId == null || parsedMatchId === matchId) &&
                                    parsed?.attackPlayersArray &&
                                    parsed.attackPlayersArray.length >= 11;
                if (isValidSquad) {
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
      let predictionKeys: string[] = [];
      
      if (teamId != null) {
        // ✅ Sadece belirli takıma özel anahtarları temizle
        keysToRemove = allKeys.filter(k =>
          k === `${PREDICTION_KEY_PREFIX}${matchId}-${teamId}` ||
          k === `${SQUAD_KEY_PREFIX}${matchId}-${teamId}` ||
          k === `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}-${teamId}` ||
          k === `${LEGACY_SQUAD_KEY_PREFIX}${matchId}-${teamId}`
        );
        predictionKeys = allKeys.filter(k =>
          k === `${PREDICTION_KEY_PREFIX}${matchId}-${teamId}` ||
          k === `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}-${teamId}`
        );
      } else {
        // ✅ Tüm tahminleri temizle (hem basit hem takıma özel)
        keysToRemove = allKeys.filter(k =>
          k === `${PREDICTION_KEY_PREFIX}${matchId}` ||
          k.startsWith(`${PREDICTION_KEY_PREFIX}${matchId}-`) ||
          k === `${SQUAD_KEY_PREFIX}${matchId}` ||
          k.startsWith(`${SQUAD_KEY_PREFIX}${matchId}-`) ||
          k === `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}` ||
          k.startsWith(`${LEGACY_PREDICTION_KEY_PREFIX}${matchId}-`) ||
          k === `${LEGACY_SQUAD_KEY_PREFIX}${matchId}` ||
          k.startsWith(`${LEGACY_SQUAD_KEY_PREFIX}${matchId}-`)
        );
        predictionKeys = allKeys.filter(k =>
          k === `${PREDICTION_KEY_PREFIX}${matchId}` ||
          k.startsWith(`${PREDICTION_KEY_PREFIX}${matchId}-`) ||
          k === `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}` ||
          k.startsWith(`${LEGACY_PREDICTION_KEY_PREFIX}${matchId}-`)
        );
      }
      
      // ✅ TOPLULUK VERİLERİNİ GÖRDÜKTEN SONRA SİLME - Bu durumu kaydet
      // Eğer kullanıcı topluluk verilerini görmüşse ve tahmini siliyorsa,
      // yeni tahmin yaptığında %80 puan kaybı olacak
      let hadViewedCommunityData = false;
      if (predictionKeys.length > 0) {
        const predPairs = await AsyncStorage.multiGet(predictionKeys);
        for (const [_, value] of predPairs) {
          if (value) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.hasViewedCommunityData === true) {
                hadViewedCommunityData = true;
                break;
              }
            } catch (_) {}
          }
        }
      }
      
      // ✅ Eğer topluluk verilerini görmüşse, bu durumu ayrı bir key'de sakla
      // Böylece yeni tahmin yaptığında madeAfterCommunityViewed = true olacak
      if (hadViewedCommunityData) {
        const communityViewedKey = `community_viewed_${matchId}${teamId != null ? `-${teamId}` : ''}`;
        await AsyncStorage.setItem(communityViewedKey, JSON.stringify({ 
          hadViewedCommunityData: true, 
          deletedAt: new Date().toISOString() 
        }));
        console.log('⚠️ Topluluk verileri görülmüş tahmin silindi - yeni tahmin %80 puan kaybı olacak');
      }
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log('✅ Tahmin silindi:', keysToRemove.length, 'anahtar temizlendi', keysToRemove);
      } else {
        console.log('⚠️ Silinecek anahtar bulunamadı, matchId:', matchId, 'teamId:', teamId);
      }
      
      // ✅ Veritabanından da tahminleri temizle - arka planda, beklemeden
      // UI'ı bloklamadan async olarak çalıştır
      (async () => {
        try {
          const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          const userData = userDataStr ? JSON.parse(userDataStr) : null;
          const userId = userData?.id;
          if (userId) {
            await predictionsDb.deletePredictionsByMatch(userId, String(matchId));
            console.log('✅ Veritabanından tahmin silindi');
          }
        } catch (dbError) {
          console.warn('Database cleanup failed (non-blocking):', dbError);
        }
      })();
      
      // ✅ State güncelleme stratejisi:
      // - teamId verilmişse: diğer takımın tahmini hala olabilir, refresh() ile kontrol et
      // - teamId verilmemişse: tümü silinmiş, doğrudan state'ten kaldır
      if (teamId != null) {
        // ✅ Diğer takımın tahmini olabilir, yeniden kontrol et
        await refresh();
      } else {
        // ✅ Tüm tahminler silinmiş, doğrudan kaldır (hızlı UI güncelleme)
        setMatchIdsWithPredictions(prev => {
          const next = new Set(prev);
          next.delete(matchId);
          return next;
        });
      }
      
      console.log('✅ clearPredictionForMatch tamamlandı, matchId:', matchId);
    } catch (e) {
      console.error('❌ clearPredictionForMatch error:', e);
      throw e;
    }
  }, [refresh]);

  return { matchIdsWithPredictions, refresh, clearPredictionForMatch };
}
