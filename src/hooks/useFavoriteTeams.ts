// useFavoriteTeams Hook - Get user's favorite teams
// ✅ Supabase senkronizasyonu eklendi
// ✅ Bulk data download entegrasyonu eklendi
import { useState, useEffect, useRef, useCallback } from 'react';
import { getFavoriteTeams, setFavoriteTeams as saveFavoriteTeams } from '../utils/storageUtils';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { downloadBulkData, isBulkDataValid, clearBulkData, BulkDownloadProgress } from '../services/bulkDataService';

interface FavoriteTeam {
  id: number;
  name: string;
  logo: string;
  league?: string;
  colors?: string[];
  type?: 'club' | 'national';
}

// Supabase'e kaydetmek için takımları JSON string'e çevir
const teamsToJson = (teams: FavoriteTeam[]): string => {
  return JSON.stringify(teams);
};

// Supabase'den gelen JSON string'i takım array'ine çevir (id string/number normalize)
const jsonToTeams = (json: string | null): FavoriteTeam[] | null => {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const normalized = parsed.map((t: any) => {
      if (!t || typeof t.name !== 'string' || t.name.length === 0) return null;
      const id = typeof t.id === 'number' ? t.id : parseInt(String(t.id), 10);
      if (Number.isNaN(id)) return null;
      return { ...t, id, logo: t.logo ?? '' } as FavoriteTeam;
    }).filter(Boolean);
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
};

  // ✅ GLOBAL flag - tüm hook instance'ları için tek kontrol (session boyunca)
let globalBulkDownloadRunning = false;
let globalBulkDownloadCompletedThisSession = false;

/** Otomatik arka plan yenileme: 6 saatte bir sessizce verileri güncelle (kullanıcıya göstermeden) */
const AUTO_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function useFavoriteTeams() {
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkDownloadProgress, setBulkDownloadProgress] = useState<BulkDownloadProgress | null>(null);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const bulkDownloadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // ✅ Bulk data download - arka planda tüm takım verilerini indir
  const triggerBulkDownload = useCallback(async (teamIds: number[], forceDownload = false) => {
    // ✅ GLOBAL kontrol - session boyunca sadece 1 kez
    if (globalBulkDownloadRunning) {
      logger.debug('Bulk download already running globally, skipping', undefined, 'BULK');
      return;
    }
    
    // ✅ Bu session'da zaten tamamlandıysa ve force değilse skip
    if (globalBulkDownloadCompletedThisSession && !forceDownload) {
      logger.debug('Bulk download already completed this session, skipping', undefined, 'BULK');
      return;
    }

    // Local ref kontrolü
    if (bulkDownloadingRef.current) {
      logger.debug('Bulk download already running (local), skipping', undefined, 'BULK');
      return;
    }

    globalBulkDownloadRunning = true;
    bulkDownloadingRef.current = true;
    setIsBulkDownloading(true);

    try {
      // forceDownload: cache'i temizle, kadro/maç verilerini yeniden indir
      if (forceDownload) {
        await clearBulkData();
      }
      // Cache hala geçerliyse ve takımlar aynıysa skip (forceDownload sonrası cache boş, geçersiz sayılır)
      const cacheValid = await isBulkDataValid(teamIds);
      if (cacheValid) {
        logger.info('📦 Bulk cache still valid, skipping download', { teamIds }, 'BULK');
        globalBulkDownloadCompletedThisSession = true;
        setBulkDownloadProgress({
          phase: 'complete',
          progress: 100,
          message: 'Veriler zaten güncel',
        });
        setTimeout(() => setBulkDownloadProgress(null), 2000);
        return;
      }

      // Eski cache'i temizle (takımlar değişmiş olabilir)
      await clearBulkData();

      logger.info('📦 Starting bulk download for new team selection', { teamIds }, 'BULK');

      const result = await downloadBulkData(teamIds, (p) => {
        setBulkDownloadProgress(p);
      });

      if (result) {
        globalBulkDownloadCompletedThisSession = true;
        logger.info('📦 Bulk download complete!', {
          teams: result.meta?.teamCount,
          matches: result.meta?.totalMatches,
          players: result.meta?.totalPlayers,
          sizeKB: result.meta?.sizeKB,
        }, 'BULK');
      }
    } catch (error: any) {
      logger.error('Bulk download error', { error: error.message }, 'BULK');
      setBulkDownloadProgress({
        phase: 'error',
        progress: 0,
        message: 'Veri indirme hatası (arka plan)',
        error: error.message,
      });
    } finally {
      globalBulkDownloadRunning = false;
      bulkDownloadingRef.current = false;
      setIsBulkDownloading(false);
      // 3 saniye sonra progress'i temizle
      setTimeout(() => setBulkDownloadProgress(null), 3000);
    }
  }, []);

  // ✅ Otomatik arka plan yenileme - 6 saatte bir sessizce verileri güncelle (kullanıcıya göstermeden)
  const teamIdsKey = favoriteTeams?.map(t => t.id).filter(Boolean).sort().join(',') || '';
  useEffect(() => {
    if (!teamIdsKey) return;
    const teamIds = teamIdsKey.split(',').map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (teamIds.length === 0) return;

    const interval = setInterval(() => {
      logger.info('🔄 [AUTO] Arka plan veri yenileme başlatılıyor...', { teamIds }, 'BULK');
      triggerBulkDownload(teamIds, true); // forceDownload = cache temizle, yeniden indir
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [teamIdsKey, triggerBulkDownload]);

  // KİLİTLİ: Supabase sync - updated_at timestamp karşılaştırması ile son güncellenen master
  const syncWithSupabaseInBackground = useCallback(async (localTeams: FavoriteTeam[] | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('favorite_teams_json, updated_at')
        .eq('id', user.id)
        .single();
      
      if (!error && profile?.favorite_teams_json) {
        const supabaseTeams = jsonToTeams(profile.favorite_teams_json);
        const supabaseUpdatedAt = profile.updated_at ? new Date(profile.updated_at).getTime() : 0;
        
        let localUpdatedAt = 0;
        try {
          const AsyncStorageModule = await import('@react-native-async-storage/async-storage');
          const AsyncStorage = AsyncStorageModule.default;
          const localTs = await AsyncStorage.getItem('tacticiq-favorite-teams-updated-at');
          if (localTs) localUpdatedAt = new Date(localTs).getTime();
        } catch (e) { /* ignore */ }
        
        if (supabaseTeams && supabaseTeams.length > 0) {
          if (!localTeams || localTeams.length === 0) {
            setFavoriteTeams(supabaseTeams);
            await saveFavoriteTeams(supabaseTeams);
            try {
              const ASM = await import('@react-native-async-storage/async-storage');
              await ASM.default.setItem('tacticiq-favorite-teams-updated-at', profile.updated_at || new Date().toISOString());
            } catch (e) { /* ignore */ }
            logger.info('Synced favorite teams from Supabase (local empty)', { count: supabaseTeams.length }, 'FAVORITE_TEAMS');
            const ids = supabaseTeams.map(t => t.id).filter(Boolean);
            if (ids.length > 0) triggerBulkDownload(ids);
          } else {
            const localIds = localTeams.map(t => t.id).sort().join(',');
            const supabaseIds = supabaseTeams.map(t => t.id).sort().join(',');
            if (localIds !== supabaseIds) {
              // ✅ Yerel listede daha fazla takım varsa (örn. yeni eklenen 4. takım) Supabase ile ezme – yerel master
              const preferLocal = (localTeams?.length ?? 0) > (supabaseTeams?.length ?? 0);
              if (!preferLocal && supabaseUpdatedAt > localUpdatedAt) {
                logger.info('Supabase is newer, pulling from Supabase', {
                  local: localTeams.map(t => t.name),
                  supabase: supabaseTeams.map(t => t.name),
                  supabaseUpdatedAt: new Date(supabaseUpdatedAt).toISOString(),
                  localUpdatedAt: localUpdatedAt ? new Date(localUpdatedAt).toISOString() : 'none',
                }, 'FAVORITE_TEAMS');
                setFavoriteTeams(supabaseTeams);
                await saveFavoriteTeams(supabaseTeams);
                try {
                  const ASM2 = await import('@react-native-async-storage/async-storage');
                  await ASM2.default.setItem('tacticiq-favorite-teams-updated-at', profile.updated_at || new Date().toISOString());
                } catch (e) { /* ignore */ }
                const ids = supabaseTeams.map(t => t.id).filter(Boolean);
                if (ids.length > 0) triggerBulkDownload(ids);
              } else if (preferLocal) {
                logger.info('Local has more teams, pushing to Supabase (keep local)', {
                  local: localTeams.map(t => t.name),
                  supabase: supabaseTeams.map(t => t.name),
                }, 'FAVORITE_TEAMS');
                await syncToSupabase(localTeams);
              } else {
                logger.info('Local is newer, pushing to Supabase', {
                  local: localTeams.map(t => t.name),
                  supabase: supabaseTeams.map(t => t.name),
                  localUpdatedAt: localUpdatedAt ? new Date(localUpdatedAt).toISOString() : 'none',
                  supabaseUpdatedAt: new Date(supabaseUpdatedAt).toISOString(),
                }, 'FAVORITE_TEAMS');
                await syncToSupabase(localTeams);
              }
            }
          }
        } else if (localTeams && localTeams.length > 0) {
          await syncToSupabase(localTeams);
        }
      } else if (localTeams && localTeams.length > 0) {
        await syncToSupabase(localTeams);
      }
    } catch (supabaseError) {
      logger.debug('Supabase sync skipped', { error: supabaseError }, 'FAVORITE_TEAMS');
    }
  }, [triggerBulkDownload]);
  
  // Supabase'e senkronize et (retry ile)
  const syncToSupabase = async (teams: FavoriteTeam[], retries = 2): Promise<boolean> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        
        const { error } = await supabase
          .from('user_profiles')
          .update({ 
            favorite_teams_json: teamsToJson(teams),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (error) {
          logger.warn('Failed to sync to Supabase', { error: error.message, attempt }, 'FAVORITE_TEAMS');
          if (attempt < retries) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          return false;
        }
        logger.debug('Synced to Supabase', { count: teams.length }, 'FAVORITE_TEAMS');
        return true;
      } catch (err: any) {
        logger.warn('Supabase sync error', { error: err?.message, attempt }, 'FAVORITE_TEAMS');
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return false;
      }
    }
    return false;
  };

  // ✅ Mount'ta sadece 1 kez çalış
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    const load = async () => {
      try {
        const localTeams = await getFavoriteTeams();
        
        if (localTeams && localTeams.length > 0) {
          setFavoriteTeams(localTeams);
          setLoading(false);
          logger.info('Loaded favorite teams from local', { count: localTeams.length }, 'FAVORITE_TEAMS');
          const ids = localTeams.map(t => t.id).filter(Boolean);
          if (ids.length > 0) {
            triggerBulkDownload(ids);
          }
        } else {
          setFavoriteTeams([]);
          setLoading(false);
          logger.debug('No favorite teams found', undefined, 'FAVORITE_TEAMS');
        }
        
        syncWithSupabaseInBackground(localTeams);
      } catch (error) {
        logger.error('Error loading favorite teams', { error }, 'FAVORITE_TEAMS');
        setFavoriteTeams([]);
        setLoading(false);
      }
    };
    
    load();
  }, [triggerBulkDownload, syncWithSupabaseInBackground]);

  const loadFavoriteTeams = useCallback(async () => {
    try {
      const localTeams = await getFavoriteTeams();
      
      if (localTeams && localTeams.length > 0) {
        setFavoriteTeams(localTeams);
        setLoading(false);
        logger.info('Loaded favorite teams from local', { count: localTeams.length }, 'FAVORITE_TEAMS');
        const ids = localTeams.map(t => t.id).filter(Boolean);
        if (ids.length > 0) {
          triggerBulkDownload(ids);
        }
      } else {
        setFavoriteTeams([]);
        setLoading(false);
        logger.debug('No favorite teams found', undefined, 'FAVORITE_TEAMS');
      }
      
      syncWithSupabaseInBackground(localTeams);
      
    } catch (error) {
      logger.error('Error loading favorite teams', { error }, 'FAVORITE_TEAMS');
      setFavoriteTeams([]);
      setLoading(false);
    }
  }, [triggerBulkDownload, syncWithSupabaseInBackground]);

  // ✅ Backend'de takım verilerini hemen sync et (kadro + coach)
  const triggerBackendSync = async (teamId: number, teamName?: string) => {
    try {
      const { API_BASE_URL } = await import('../config/constants');
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName }),
      });
      
      if (response.ok) {
        const result = await response.json();
        logger.info('Backend sync completed', { teamId, result }, 'FAVORITE_TEAMS');
      } else {
        logger.warn('Backend sync failed', { teamId, status: response.status }, 'FAVORITE_TEAMS');
      }
    } catch (error: any) {
      // Backend sync hatası kritik değil, sessizce devam et
      logger.debug('Backend sync error (non-critical)', { teamId, error: error.message }, 'FAVORITE_TEAMS');
    }
  };

  const updateLocalTimestamp = async () => {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem('tacticiq-favorite-teams-updated-at', new Date().toISOString());
    } catch (e) { /* ignore */ }
  };

  const addFavoriteTeam = useCallback(async (team: FavoriteTeam) => {
    try {
      const updated = [...favoriteTeams, team];
      const success = await saveFavoriteTeams(updated);
      if (success) {
        setFavoriteTeams(updated);
        await updateLocalTimestamp();
        const synced = await syncToSupabase(updated);
        logger.info('Added favorite team', { teamName: team.name, teamId: team.id, syncedToSupabase: synced }, 'FAVORITE_TEAMS');
        
        triggerBackendSync(team.id, team.name);
        
        const teamIds = updated.map(t => t.id).filter(Boolean);
        if (teamIds.length > 0) {
          triggerBulkDownload(teamIds);
        }
      }
    } catch (error) {
      logger.error('Error adding favorite team', { error, team }, 'FAVORITE_TEAMS');
    }
  }, [favoriteTeams, triggerBulkDownload]);

  const removeFavoriteTeam = useCallback(async (teamId: number) => {
    try {
      const updated = favoriteTeams.filter(t => t.id !== teamId);
      const success = await saveFavoriteTeams(updated);
      if (success) {
        setFavoriteTeams(updated);
        await updateLocalTimestamp();
        const synced = await syncToSupabase(updated);
        logger.info('Removed favorite team', { teamId, syncedToSupabase: synced }, 'FAVORITE_TEAMS');
      }
    } catch (error) {
      logger.error('Error removing favorite team', { error, teamId }, 'FAVORITE_TEAMS');
    }
  }, [favoriteTeams]);

  // ✅ Tüm takımları bir seferde güncelle (ProfileScreen için)
  const setAllFavoriteTeams = useCallback(async (teams: FavoriteTeam[]) => {
    try {
      const success = await saveFavoriteTeams(teams);
      if (success) {
        setFavoriteTeams(teams);
        await updateLocalTimestamp();
        
        const syncSuccess = await syncToSupabase(teams);
        if (!syncSuccess) {
          logger.warn('Supabase sync failed for setAllFavoriteTeams, will retry on next app open', { count: teams.length }, 'FAVORITE_TEAMS');
        }
        
        logger.info('Set all favorite teams', { count: teams.length, syncedToSupabase: syncSuccess, teams: teams.map(t => ({ name: t.name, type: t.type })) }, 'FAVORITE_TEAMS');
        
        // Backend sync
        const syncPromises = teams.map(t => triggerBackendSync(t.id, t.name));
        Promise.all(syncPromises).catch(() => {});
        
        // Bulk download
        const teamIds = teams.map(t => t.id).filter(Boolean);
        if (teamIds.length > 0) {
          triggerBulkDownload(teamIds);
        }
        
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error setting all favorite teams', { error }, 'FAVORITE_TEAMS');
      return false;
    }
  }, [triggerBulkDownload]);

  const isFavorite = useCallback((teamId: number) => {
    return favoriteTeams.some(t => t.id === teamId);
  }, [favoriteTeams]);

  return {
    favoriteTeams,
    loading,
    addFavoriteTeam,
    removeFavoriteTeam,
    setAllFavoriteTeams,
    isFavorite,
    refetch: loadFavoriteTeams,
    // Bulk data download state
    bulkDownloadProgress,
    isBulkDownloading,
    triggerBulkDownload,
  };
}
