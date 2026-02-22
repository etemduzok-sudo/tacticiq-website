// Hangi maçlara tahmin yapıldığını AsyncStorage + Supabase'den tespit eder
// ✅ OAuth girişi sonrası Supabase'deki tahminler de gösterilir
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
      const set = new Set<number>();
      const matchIdsSet = new Set(matchIds);

      const allKeys = await AsyncStorage.getAllKeys();
      const predRelatedKeys = allKeys.filter(k => 
        k.startsWith(PREDICTION_KEY_PREFIX) || k.startsWith(LEGACY_PREDICTION_KEY_PREFIX) || 
        k.startsWith(SQUAD_KEY_PREFIX) || k.startsWith(LEGACY_SQUAD_KEY_PREFIX)
      );
      console.log(`🔄 [PREDICTIONS] Checking ${matchIds.length} matches, prediction/squad keys: ${predRelatedKeys.length}`, predRelatedKeys);

      for (const matchId of matchIds) {
        const predKeyBase = `${PREDICTION_KEY_PREFIX}${matchId}`;
        const legacyPredKeyBase = `${LEGACY_PREDICTION_KEY_PREFIX}${matchId}`;
        const squadKeyBase = `${SQUAD_KEY_PREFIX}${matchId}`;
        const legacySquadKeyBase = `${LEGACY_SQUAD_KEY_PREFIX}${matchId}`;
        
        const predKeys = predRelatedKeys.filter(k => 
          k === predKeyBase || k.startsWith(`${predKeyBase}-`) ||
          k === legacyPredKeyBase || k.startsWith(`${legacyPredKeyBase}-`)
        );
        
        const squadKeys = predRelatedKeys.filter(k => 
          k === squadKeyBase || k.startsWith(`${squadKeyBase}-`) ||
          k === legacySquadKeyBase || k.startsWith(`${legacySquadKeyBase}-`)
        );
        
        let hasPred = false;
        if (predKeys.length > 0) {
          for (const key of predKeys) {
            try {
              const val = await AsyncStorage.getItem(key);
              if (val != null && val.length > 2) {
                hasPred = true;
                break;
              }
            } catch (_) {}
          }
          if (hasPred) {
            console.log(`🏷️ [PREDICTIONS] Match ${matchId} has prediction keys:`, predKeys);
          }
        }
        
        let hasSquad = false;
        if (!hasPred && squadKeys.length > 0) {
          for (const key of squadKeys) {
            try {
              const value = await AsyncStorage.getItem(key);
              if (value) {
                const parsed = JSON.parse(value);
                const parsedMatchId = parsed?.matchId != null ? Number(parsed.matchId) : null;
                const isValidSquad = parsed?.isCompleted === true && 
                                    (parsedMatchId == null || parsedMatchId === matchId) &&
                                    parsed?.attackPlayersArray &&
                                    parsed.attackPlayersArray.length >= 11;
                if (isValidSquad) {
                  hasSquad = true;
                  break;
                }
              }
            } catch (_) {}
          }
        }
        
        if (hasPred || hasSquad) set.add(matchId);
      }

      console.log(`✅ [PREDICTIONS] Found ${set.size} matches with predictions (local):`, Array.from(set));
      setMatchIdsWithPredictions(set);

      // Supabase check in background (non-blocking)
      (async () => {
        try {
          const userDataStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
          const userData = userDataStr ? JSON.parse(userDataStr) : null;
          const userId = userData?.id;
          if (userId) {
            const timeoutPromise = new Promise<{success: false}>((resolve) => 
              setTimeout(() => resolve({ success: false }), 5000)
            );
            const res = await Promise.race([
              predictionsDb.getUserPredictions(userId, 200),
              timeoutPromise
            ]);
            if (res.success && (res as any).data?.length) {
              let added = false;
              for (const p of (res as any).data) {
                const mid = p.match_id != null ? Number(p.match_id) : NaN;
                if (!Number.isNaN(mid) && matchIdsSet.has(mid) && !set.has(mid)) {
                  set.add(mid);
                  added = true;
                }
              }
              if (added) {
                console.log(`✅ [PREDICTIONS] Updated with Supabase data, now ${set.size} matches`);
                setMatchIdsWithPredictions(new Set(set));
              }
            }
          }
        } catch (_) {}
      })();
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
