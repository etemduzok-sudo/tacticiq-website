/**
 * useBulkDataDownload Hook
 * 
 * Favori takımlar seçildikten sonra TÜM verileri (maçlar, kadro, koç)
 * tek seferde indirip cihaza kaydeder.
 * 
 * Kullanım:
 *   const { downloadData, progress, isDownloading, lastDownload } = useBulkDataDownload();
 *   // Takım seçimi sonrası:
 *   await downloadData([541, 645, 549]);
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  downloadBulkData,
  isBulkDataValid,
  clearBulkData,
  getBulkDataMeta,
  BulkDownloadProgress,
  BulkDataResponse,
} from '../services/bulkDataService';
import { logger } from '../utils/logger';

interface UseBulkDataDownloadReturn {
  /** Bulk veri indirme fonksiyonu */
  downloadData: (teamIds: number[]) => Promise<BulkDataResponse | null>;
  /** İndirme durumu ve ilerleme */
  progress: BulkDownloadProgress | null;
  /** İndirme devam ediyor mu? */
  isDownloading: boolean;
  /** Son indirme tarihi */
  lastDownload: number | null;
  /** Bulk cache geçerli mi? */
  isCacheValid: boolean;
  /** Cache'i sıfırla */
  resetCache: () => Promise<void>;
}

export function useBulkDataDownload(): UseBulkDataDownloadReturn {
  const [progress, setProgress] = useState<BulkDownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastDownload, setLastDownload] = useState<number | null>(null);
  const [isCacheValidState, setIsCacheValid] = useState(false);
  const downloadingRef = useRef(false);

  // Component mount'ta cache durumunu kontrol et
  useEffect(() => {
    checkCacheStatus();
  }, []);

  const checkCacheStatus = async () => {
    try {
      const meta = await getBulkDataMeta();
      if (meta) {
        setLastDownload(meta.downloadedAt);
        setIsCacheValid(meta.isValid);
      }
    } catch {
      // ignore
    }
  };

  /**
   * Favori takımlar için bulk data indir
   * Eğer cache geçerliyse ve aynı takımlarsa tekrar indirmez
   */
  const downloadData = useCallback(async (
    teamIds: number[]
  ): Promise<BulkDataResponse | null> => {
    // Concurrent download engelle
    if (downloadingRef.current) {
      logger.warn('Bulk download already in progress', undefined, 'BULK');
      return null;
    }

    if (!teamIds || teamIds.length === 0) {
      logger.warn('No team IDs for bulk download', undefined, 'BULK');
      return null;
    }

    // Cache hala geçerliyse ve takımlar aynıysa skip
    const cacheValid = await isBulkDataValid(teamIds);
    if (cacheValid) {
      logger.info('📦 Bulk cache still valid, skipping download', { teamIds }, 'BULK');
      setIsCacheValid(true);
      
      setProgress({
        phase: 'complete',
        progress: 100,
        message: 'Veriler zaten güncel',
      });
      
      // 2 saniye sonra progress'i temizle
      setTimeout(() => setProgress(null), 2000);
      return null;
    }

    downloadingRef.current = true;
    setIsDownloading(true);

    try {
      const result = await downloadBulkData(teamIds, (p) => {
        setProgress(p);
      });

      if (result) {
        setLastDownload(Date.now());
        setIsCacheValid(true);
        
        logger.info('📦 Bulk download successful via hook', {
          teams: result.meta?.teamCount,
          matches: result.meta?.totalMatches,
          players: result.meta?.totalPlayers,
        }, 'BULK');
      }

      return result;
    } catch (error: any) {
      logger.error('Bulk download hook error', { error: error.message }, 'BULK');
      
      setProgress({
        phase: 'error',
        progress: 0,
        message: 'İndirme hatası',
        error: error.message,
      });
      
      return null;
    } finally {
      downloadingRef.current = false;
      setIsDownloading(false);
      
      // 3 saniye sonra progress'i temizle (kullanıcı görsün)
      setTimeout(() => setProgress(null), 3000);
    }
  }, []);

  /**
   * Bulk cache'i sıfırla
   */
  const resetCache = useCallback(async () => {
    await clearBulkData();
    setLastDownload(null);
    setIsCacheValid(false);
    setProgress(null);
    logger.info('Bulk cache reset via hook', undefined, 'BULK');
  }, []);

  return {
    downloadData,
    progress,
    isDownloading,
    lastDownload,
    isCacheValid: isCacheValidState,
    resetCache,
  };
}
