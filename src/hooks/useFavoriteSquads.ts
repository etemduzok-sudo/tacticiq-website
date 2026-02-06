/**
 * Favori takımların kadrolarını Supabase (team_squads) üzerinden yükler.
 * Favori takımlar belirlendiğinde kadrolar uygulamaya direk yüklenir.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

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
      console.log('📥 [FavSquads] Supabase sorgusu:', ids);
      
      try {
        const { data, error } = await supabase
          .from('team_squads')
          .select('team_id, team_name, players')
          .in('team_id', ids)
          .eq('season', 2025);
        
        if (cancelled) return;
        
        if (error) {
          console.error('❌ [FavSquads] Hata:', error.message);
          setLoading(false);
          setVersion(v => v + 1);
          return;
        }
        
        const next: Record<number, SquadPlayer[]> = {};
        if (data && data.length > 0) {
          data.forEach((row: any) => {
            if (row.players?.length > 0) {
              next[row.team_id] = normalizePlayers(row.players);
              console.log(`✅ [FavSquads] ${row.team_name}: ${row.players.length} oyuncu`);
            }
          });
        }
        
        console.log('✅ [FavSquads] Toplam:', Object.keys(next).length, 'takım yüklendi');
        setSquads(next);
      } catch (e: any) {
        console.error('❌ [FavSquads] Exception:', e?.message);
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
