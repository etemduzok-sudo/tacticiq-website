// useFavoriteTeams Hook - Get user's favorite teams
// ✅ Supabase senkronizasyonu eklendi
// ✅ Bulk data download entegrasyonu eklendi
import { useState, useEffect, useRef, useCallback } from 'react';
import { getFavoriteTeams, setFavoriteTeams as saveFavoriteTeams, validateFavoriteTeams } from '../utils/storageUtils';
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

// Supabase'den gelen JSON string'i takım array'ine çevir
const jsonToTeams = (json: string | null): FavoriteTeam[] | null => {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && validateFavoriteTeams(parsed)) {
      return parsed;
    }
    return null;
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

  // ✅ Supabase senkronizasyonu arka planda - UI'ı bloklamaz
  const syncWithSupabaseInBackground = useCallback(async (localTeams: FavoriteTeam[] | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('favorite_teams_json')
        .eq('id', user.id)
        .single();
      
      if (!error && profile?.favorite_teams_json) {
        const supabaseTeams = jsonToTeams(profile.favorite_teams_json);
        
        if (supabaseTeams && supabaseTeams.length > 0) {
          // Supabase'den gelen takımlar varsa ve lokal boşsa, Supabase'i kullan
          if (!localTeams || localTeams.length === 0) {
            setFavoriteTeams(supabaseTeams);
            await saveFavoriteTeams(supabaseTeams);
            logger.info('Synced favorite teams from Supabase', { count: supabaseTeams.length }, 'FAVORITE_TEAMS');
            // ✅ Kadrolar dahil tüm veriyi hemen uygulama belleğine çek
            const ids = supabaseTeams.map(t => t.id).filter(Boolean);
            if (ids.length > 0) triggerBulkDownload(ids);
          } else {
            // İkisinde de takım varsa, lokali ana kaynak olarak tut ama Supabase'i güncelle
            await syncToSupabase(localTeams);
          }
        } else if (localTeams && localTeams.length > 0) {
          await syncToSupabase(localTeams);
        }
      } else if (localTeams && localTeams.length > 0) {
        await syncToSupabase(localTeams);
      }
    } catch (supabaseError) {
      // Supabase hatası - sessizce devam et
      logger.debug('Supabase sync skipped', { error: supabaseError }, 'FAVORITE_TEAMS');
    }
  }, [triggerBulkDownload]);
  
  // Supabase'e senkronize et
  const syncToSupabase = async (teams: FavoriteTeam[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          favorite_teams_json: teamsToJson(teams),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        logger.warn('Failed to sync to Supabase', { error: error.message }, 'FAVORITE_TEAMS');
      } else {
        logger.debug('Synced to Supabase', { count: teams.length }, 'FAVORITE_TEAMS');
      }
    } catch (err) {
      logger.debug('Supabase sync error', { error: err }, 'FAVORITE_TEAMS');
    }
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

  const addFavoriteTeam = useCallback(async (team: FavoriteTeam) => {
    try {
      const updated = [...favoriteTeams, team];
      const success = await saveFavoriteTeams(updated);
      if (success) {
        setFavoriteTeams(updated);
        await syncToSupabase(updated);
        logger.info('Added favorite team', { teamName: team.name, teamId: team.id }, 'FAVORITE_TEAMS');
        
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
        await syncToSupabase(updated);
        logger.info('Removed favorite team', { teamId }, 'FAVORITE_TEAMS');
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
        await syncToSupabase(teams);
        logger.info('Set all favorite teams', { count: teams.length, teams: teams.map(t => ({ name: t.name, type: t.type })) }, 'FAVORITE_TEAMS');
        
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
