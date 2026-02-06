/**
 * Favori takımların kadrolarını DB'den (Supabase) yükler.
 * Kişi favori takımlarını belirlediğinde bu kadrolar uygulamaya direk yüklenir.
 * App seviyesinde provider ile açılışta yükleme yapılır.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useFavoriteTeams } from '../hooks/useFavoriteTeams';
import { useFavoriteSquads } from '../hooks/useFavoriteSquads';
import type { SquadPlayer } from '../hooks/useFavoriteSquads';

type FavoriteSquadsValue = {
  getSquad: (teamId: number) => SquadPlayer[] | null;
  squads: Record<number, SquadPlayer[]>;
  loading: boolean;
};

const FavoriteSquadsContext = createContext<FavoriteSquadsValue | null>(null);

export function FavoriteSquadsProvider({ children }: { children: ReactNode }) {
  const { favoriteTeams } = useFavoriteTeams();
  const favoriteTeamIds = favoriteTeams?.map((t) => t.id) ?? [];
  const { getSquad, squads, loading } = useFavoriteSquads(favoriteTeamIds);

  const value: FavoriteSquadsValue = {
    getSquad,
    squads,
    loading,
  };

  return (
    <FavoriteSquadsContext.Provider value={value}>
      {children}
    </FavoriteSquadsContext.Provider>
  );
}

export function useFavoriteSquadsContext(): FavoriteSquadsValue | null {
  return useContext(FavoriteSquadsContext);
}
