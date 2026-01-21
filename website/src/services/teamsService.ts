/**
 * Teams Service
 * Backend API üzerinden takım arama ve bilgi servisi
 * Mobil ile aynı backend'i kullanır - API limiti aşılmaz
 */

import { apiService, ApiResponse } from './apiService';
import { API_ENDPOINTS } from '@/config/api.config';

// Team type
export interface Team {
  id: number;
  name: string;
  country: string;
  league: string;
  colors: string[];
  flag?: string;
  logo?: string;
  national: boolean;
  coach?: string;
}

// Search result type
export interface TeamSearchResult {
  team: {
    id: number;
    name: string;
    country: string;
    logo?: string;
    national: boolean;
  };
  league?: {
    id: number;
    name: string;
    country: string;
  };
  colors?: string[];
  flag?: string;
}

// Cache for search results (5 dakika)
const searchCache = new Map<string, { data: TeamSearchResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

class TeamsService {
  /**
   * Takım ara - Backend API üzerinden
   * Backend API-Football'dan veri çeker ve Supabase'e yazar
   * Bu sayede günlük 7500 API limiti aşılmaz
   */
  async searchTeams(query: string, type: 'club' | 'national' = 'club'): Promise<TeamSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `${query.toLowerCase()}_${type}`;
    
    // Cache kontrolü
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[TeamsService] Cache hit for: ${query}`);
      return cached.data;
    }

    try {
      console.log(`[TeamsService] Searching teams: ${query} (${type})`);
      
      const response = await apiService.get<TeamSearchResult[]>(
        `${API_ENDPOINTS.TEAMS.SEARCH}/${encodeURIComponent(query)}`
      );

      if (response.success && response.data) {
        // Tip'e göre filtrele
        const filteredResults = (response.data as any[]).filter((item: any) => {
          const team = item.team || item;
          const isNational = team.national === true;
          return type === 'national' ? isNational : !isNational;
        }).map((item: any) => {
          const team = item.team || item;
          const league = item.league || {};
          return {
            team: {
              id: team.id,
              name: team.name,
              country: team.country || 'Unknown',
              logo: team.logo,
              national: team.national || false,
            },
            league: league.id ? {
              id: league.id,
              name: league.name,
              country: league.country,
            } : undefined,
            colors: item.colors || this.getDefaultColors(team.name),
            flag: item.flag,
          };
        });

        // Cache'e kaydet
        searchCache.set(cacheKey, {
          data: filteredResults,
          timestamp: Date.now(),
        });

        console.log(`[TeamsService] Found ${filteredResults.length} ${type} teams`);
        return filteredResults;
      }

      return [];
    } catch (error) {
      console.error('[TeamsService] Search error:', error);
      // Hata durumunda boş array dön
      return [];
    }
  }

  /**
   * Takım bilgisi getir
   */
  async getTeamInfo(teamId: number): Promise<Team | null> {
    try {
      const response = await apiService.get<Team>(
        API_ENDPOINTS.TEAMS.GET.replace(':id', teamId.toString())
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('[TeamsService] Get team error:', error);
      return null;
    }
  }

  /**
   * Takım renkleri getir
   */
  async getTeamColors(teamId: number): Promise<string[]> {
    try {
      const response = await apiService.get<{ colors: string[] }>(
        API_ENDPOINTS.TEAMS.COLORS.replace(':id', teamId.toString())
      );

      if (response.success && response.data?.colors) {
        return response.data.colors;
      }

      return ['#1E40AF', '#FFFFFF'];
    } catch (error) {
      console.error('[TeamsService] Get colors error:', error);
      return ['#1E40AF', '#FFFFFF'];
    }
  }

  /**
   * Default renkler (takım adına göre)
   */
  private getDefaultColors(teamName: string): string[] {
    const name = teamName.toLowerCase();
    
    // Türk takımları
    if (name.includes('galatasaray')) return ['#FFA500', '#FF0000'];
    if (name.includes('fenerbahçe') || name.includes('fenerbahce')) return ['#FFFF00', '#000080'];
    if (name.includes('beşiktaş') || name.includes('besiktas')) return ['#000000', '#FFFFFF'];
    if (name.includes('trabzonspor')) return ['#800020', '#0000FF'];
    
    // İspanya
    if (name.includes('real madrid')) return ['#FFFFFF', '#FFD700'];
    if (name.includes('barcelona')) return ['#A50044', '#004D98'];
    if (name.includes('atletico')) return ['#CB3524', '#FFFFFF'];
    
    // İngiltere
    if (name.includes('manchester united')) return ['#DA291C', '#FFE500'];
    if (name.includes('manchester city')) return ['#6CABDD', '#FFFFFF'];
    if (name.includes('liverpool')) return ['#C8102E', '#FFFFFF'];
    if (name.includes('chelsea')) return ['#034694', '#FFFFFF'];
    if (name.includes('arsenal')) return ['#EF0107', '#FFFFFF'];
    if (name.includes('tottenham')) return ['#132257', '#FFFFFF'];
    
    // Almanya
    if (name.includes('bayern')) return ['#DC052D', '#FFFFFF'];
    if (name.includes('dortmund')) return ['#FDE100', '#000000'];
    
    // İtalya
    if (name.includes('juventus')) return ['#000000', '#FFFFFF'];
    if (name.includes('ac milan') || name.includes('milan')) return ['#FB090B', '#000000'];
    if (name.includes('inter')) return ['#0068A8', '#000000'];
    if (name.includes('napoli')) return ['#12A0D7', '#FFFFFF'];
    if (name.includes('roma')) return ['#8E1F2F', '#F0BC42'];
    
    // Fransa
    if (name.includes('psg') || name.includes('paris')) return ['#004170', '#DA291C'];
    if (name.includes('marseille')) return ['#2FAEE0', '#FFFFFF'];
    if (name.includes('lyon')) return ['#FFFFFF', '#DA291C'];
    
    // Milli takımlar
    if (name.includes('türkiye') || name.includes('turkey')) return ['#E30A17', '#FFFFFF'];
    if (name.includes('germany') || name.includes('almanya')) return ['#000000', '#DD0000', '#FFCE00'];
    if (name.includes('france') || name.includes('fransa')) return ['#002654', '#FFFFFF', '#ED2939'];
    if (name.includes('spain') || name.includes('ispanya')) return ['#AA151B', '#F1BF00'];
    if (name.includes('italy') || name.includes('italya')) return ['#009246', '#FFFFFF', '#CE2B37'];
    if (name.includes('england') || name.includes('ingiltere')) return ['#FFFFFF', '#C8102E'];
    if (name.includes('brazil') || name.includes('brezilya')) return ['#009739', '#FEDD00'];
    if (name.includes('argentina') || name.includes('arjantin')) return ['#74ACDF', '#FFFFFF'];
    
    // Default
    return ['#1E40AF', '#FFFFFF'];
  }

  /**
   * Cache temizle
   */
  clearCache(): void {
    searchCache.clear();
    console.log('[TeamsService] Cache cleared');
  }
}

// Singleton export
export const teamsService = new TeamsService();
export default teamsService;
