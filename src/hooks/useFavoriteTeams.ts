// useFavoriteTeams Hook - Get user's favorite teams
import { useState, useEffect } from 'react';
import { getFavoriteTeams, setFavoriteTeams as saveFavoriteTeams, validateFavoriteTeams } from '../utils/storageUtils';
import { logger } from '../utils/logger';

interface FavoriteTeam {
  id: number;
  name: string;
  logo: string;
  league?: string;
  colors?: string[];
}

export function useFavoriteTeams() {
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoriteTeams();
  }, []);

  const loadFavoriteTeams = async () => {
    try {
      // ✅ getFavoriteTeams now includes migration logic
      const teams = await getFavoriteTeams();
      
      if (teams && teams.length > 0) {
        setFavoriteTeams(teams);
        logger.info('Loaded favorite teams', { count: teams.length, teams: teams.map(t => ({ name: t.name, id: t.id })) }, 'FAVORITE_TEAMS');
      } else {
        setFavoriteTeams([]);
        logger.debug('No favorite teams found', undefined, 'FAVORITE_TEAMS');
      }
    } catch (error) {
      logger.error('Error loading favorite teams', { error }, 'FAVORITE_TEAMS');
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
        logger.info('Added favorite team', { teamName: team.name, teamId: team.id }, 'FAVORITE_TEAMS');
      }
    } catch (error) {
      logger.error('Error adding favorite team', { error, team }, 'FAVORITE_TEAMS');
    }
  };

  const removeFavoriteTeam = async (teamId: number) => {
    try {
      const updated = favoriteTeams.filter(t => t.id !== teamId);
      const success = await saveFavoriteTeams(updated);
      if (success) {
        setFavoriteTeams(updated);
        logger.info('Removed favorite team', { teamId }, 'FAVORITE_TEAMS');
      }
    } catch (error) {
      logger.error('Error removing favorite team', { error, teamId }, 'FAVORITE_TEAMS');
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
