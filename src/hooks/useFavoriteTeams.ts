// useFavoriteTeams Hook - Get user's favorite teams
import { useState, useEffect } from 'react';
import { getFavoriteTeams, setFavoriteTeams as saveFavoriteTeams, validateFavoriteTeams } from '../utils/storageUtils';

interface FavoriteTeam {
  id: number;
  name: string;
  logo: string;
  league?: string;
}

export function useFavoriteTeams() {
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteTeams();
  }, []);

  const loadFavoriteTeams = async () => {
    try {
      const teams = await getFavoriteTeams();
      
      if (teams && teams.length > 0) {
        setFavoriteTeams(teams);
        console.log('✅ Loaded favorite teams:', teams.length, teams);
      } else {
        setFavoriteTeams([]);
        console.log('⚠️ No favorite teams found');
      }
    } catch (error) {
      console.error('Error loading favorite teams:', error);
      setFavoriteTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const addFavoriteTeam = async (team: FavoriteTeam) => {
    try {
      const updated = [...favoriteTeams, team];
      const success = await saveFavoriteTeams(updated);
      if (success) {
        setFavoriteTeams(updated);
        console.log('✅ Added favorite team:', team.name);
      }
    } catch (error) {
      console.error('Error adding favorite team:', error);
    }
  };

  const removeFavoriteTeam = async (teamId: number) => {
    try {
      const updated = favoriteTeams.filter(t => t.id !== teamId);
      const success = await saveFavoriteTeams(updated);
      if (success) {
        setFavoriteTeams(updated);
        console.log('✅ Removed favorite team:', teamId);
      }
    } catch (error) {
      console.error('Error removing favorite team:', error);
    }
  };

  const isFavorite = (teamId: number) => {
    return favoriteTeams.some(t => t.id === teamId);
  };

  return {
    favoriteTeams,
    loading,
    addFavoriteTeam,
    removeFavoriteTeam,
    isFavorite,
    refetch: loadFavoriteTeams,
  };
}
