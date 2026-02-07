/**
 * Favori takımların kadrolarını yükler.
 * ✅ Öncelik sırası: Bulk cache → Supabase (team_squads)
 * Bulk cache varsa anında yükler (offline mod desteği)
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { getBulkSquad, isBulkDataValid } from '../services/bulkDataService';
import { logger } from '../utils/logger';

export interface SquadPlayer {
  id: number;
  number: number;
  name: string;
  position: string;
  photo?: string | null;
}

const POSITION_MAP: Record<string, string> = {
  Goalkeeper: 'GK',
  Defender: 'DF',
  Midfielder: 'MF',
  Attacker: 'FW',
};

function normalizePlayers(players: any[]): SquadPlayer[] {
  if (!Array.isArray(players) || players.length === 0) return [];
  return players.map((p: any, idx: number) => ({
    id: p.id ?? idx + 1,
    number: p.number ?? idx + 1,
    name: p.name ?? 'Bilinmiyor',
    position: POSITION_MAP[p.position] || p.position || 'MF',
    photo: p.photo ?? null,
  }));
}

export function useFavoriteSquads(favoriteTeamIds: number[]) {
  const [squads, setSquads] = useState<Record<number, SquadPlayer[]>>({});
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const idsKey = favoriteTeamIds.filter(Boolean).sort().join(',');

  useEffect(() => {
    const ids = idsKey.split(',').filter(Boolean).map(Number);
    if (ids.length === 0) {
      setSquads({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    
    const load = async () => {
      setLoading(true);
      
      // ✅ 1. Önce BULK CACHE'den dene (anında yükleme, offline desteği)
      try {
        const bulkValid = await isBulkDataValid(ids);
        if (bulkValid) {
          const next: Record<number, SquadPlayer[]> = {};
          let foundFromBulk = 0;
          
          for (const teamId of ids) {
            const bulkSquad = await getBulkSquad(teamId);
            if (bulkSquad && bulkSquad.length > 0) {
              next[teamId] = normalizePlayers(bulkSquad);
              foundFromBulk++;
            }
          }
          
          if (foundFromBulk > 0 && !cancelled) {
            logger.info('⚡ [FavSquads] Loaded from BULK cache', {
              teams: foundFromBulk,
              total: Object.values(next).reduce((acc, p) => acc + p.length, 0),
            }, 'BULK_CACHE');
            setSquads(next);
            
            // Tüm takımlar bulk'tan geldiyse, Supabase'e gitmeye gerek yok
            if (foundFromBulk === ids.length) {
              if (!cancelled) {
                setLoading(false);
                setVersion(v => v + 1);
              }
              return;
            }
          }
        }
      } catch (e) {
        logger.debug('Bulk squad cache failed, falling back to Supabase', { error: e }, 'BULK_CACHE');
      }
      
      // ✅ 2. Supabase'den çek (fallback veya bulk'ta olmayan takımlar için)
      logger.debug('[FavSquads] Supabase sorgusu', { ids }, 'SQUADS');
      
      try {
        const { data, error } = await supabase
          .from('team_squads')
          .select('team_id, team_name, players')
          .in('team_id', ids)
          .eq('season', 2025);
        
        if (cancelled) return;
        
        if (error) {
          logger.error('[FavSquads] Supabase hata', { error: error.message }, 'SQUADS');
          setLoading(false);
          setVersion(v => v + 1);
          return;
        }
        
        const next: Record<number, SquadPlayer[]> = {};
        
        // Bulk'tan gelen verileri koru
        const currentSquads = squads;
        for (const [teamIdStr, players] of Object.entries(currentSquads)) {
          if (players.length > 0) {
            next[parseInt(teamIdStr, 10)] = players;
          }
        }
        
        // Supabase'den gelenleri ekle/güncelle
        if (data && data.length > 0) {
          data.forEach((row: any) => {
            if (row.players?.length > 0) {
              next[row.team_id] = normalizePlayers(row.players);
              logger.debug(`[FavSquads] ${row.team_name}: ${row.players.length} oyuncu`, undefined, 'SQUADS');
            }
          });
        }
        
        logger.info('[FavSquads] Toplam: ' + Object.keys(next).length + ' takım yüklendi', undefined, 'SQUADS');
        setSquads(next);
      } catch (e: any) {
        logger.error('[FavSquads] Exception', { error: e?.message }, 'SQUADS');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setVersion(v => v + 1);
        }
      }
    };
    
    load();
    return () => { cancelled = true; };
  }, [idsKey]);

  const getSquad = useCallback((teamId: number): SquadPlayer[] | null => {
    return squads[teamId] ?? null;
  }, [squads]);

  return { squads, getSquad, loading, version };
}
