/**
 * Community Signal Service
 * Topluluk verilerine dayalı kadro önerileri ve uyumluluk skorları
 */

import { supabase } from '../config/supabase';

// Minimum örnek boyutu - bu sayının altında "Yeterli veri yok" gösterilir
const MIN_SAMPLE_SIZE = 10;

// Önbellek süresi (5 dakika)
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedData {
  data: any;
  timestamp: number;
}

const cache: Map<string, CachedData> = new Map();

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export interface CommunitySignalData {
  // Kadro uyumluluk skoru (0-100)
  compatibilityScore: number;
  // Örnek boyutu yeterli mi?
  hasSufficientData: boolean;
  // Toplam örnek sayısı
  sampleSize: number;
  // Bu oyuncu için önerilen değişiklik yüzdesi
  replacementPercentage: number;
  // En popüler değişiklik önerileri
  topReplacements: Array<{
    player: {
      id: number;
      name: string;
      position: string;
      number?: number;
      rating?: number;
    };
    percentage: number;
    count: number;
  }>;
}

/**
 * Kullanıcının kadrosunun topluluk kadrolarıyla uyumluluğunu hesapla
 */
export async function calculateLineupCompatibility(
  matchId: number | string,
  teamId: number,
  userLineup: Record<number, any>, // slot -> player
  formationId: string
): Promise<{ score: number; sampleSize: number; hasSufficientData: boolean }> {
  const cacheKey = `compat-${matchId}-${teamId}-${formationId}`;
  const cached = getCached<{ score: number; sampleSize: number; hasSufficientData: boolean }>(cacheKey);
  if (cached) return cached;

  try {
    // Topluluk kadrolarını çek
    const { data: communityLineups, error } = await supabase
      .from('squad_predictions')
      .select('attack_players, attack_formation')
      .eq('match_id', matchId)
      .eq('team_id', teamId);

    if (error || !communityLineups) {
      return { score: 0, sampleSize: 0, hasSufficientData: false };
    }

    const sampleSize = communityLineups.length;
    
    if (sampleSize < MIN_SAMPLE_SIZE) {
      return { score: 0, sampleSize, hasSufficientData: false };
    }

    // Kullanıcının kadrosundaki oyuncu ID'leri
    const userPlayerIds = new Set(
      Object.values(userLineup)
        .filter(Boolean)
        .map((p: any) => p.id)
    );

    // Her topluluk kadrosuyla karşılaştır ve benzerlik hesapla
    let totalSimilarity = 0;
    
    for (const lineup of communityLineups) {
      const communityPlayers = lineup.attack_players || {};
      const communityPlayerIds = new Set(
        Object.values(communityPlayers)
          .filter(Boolean)
          .map((p: any) => p.id)
      );

      // Jaccard benzerliği: kesişim / birleşim
      const intersection = [...userPlayerIds].filter(id => communityPlayerIds.has(id)).length;
      const union = new Set([...userPlayerIds, ...communityPlayerIds]).size;
      
      const similarity = union > 0 ? intersection / union : 0;
      totalSimilarity += similarity;
    }

    const avgSimilarity = totalSimilarity / sampleSize;
    const score = Math.round(avgSimilarity * 100);

    const result = { score, sampleSize, hasSufficientData: true };
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('Community compatibility calculation error:', error);
    return { score: 0, sampleSize: 0, hasSufficientData: false };
  }
}

/**
 * Belirli bir oyuncu için topluluk değişiklik önerilerini al
 */
export async function getReplacementSuggestions(
  matchId: number | string,
  teamId: number,
  currentPlayerId: number,
  position: string,
  availablePlayers: any[]
): Promise<CommunitySignalData> {
  const cacheKey = `replace-${matchId}-${teamId}-${currentPlayerId}`;
  const cached = getCached<CommunitySignalData>(cacheKey);
  if (cached) return cached;

  try {
    // Topluluk kadrolarını çek
    const { data: communityLineups, error } = await supabase
      .from('squad_predictions')
      .select('attack_players, attack_formation, defense_players')
      .eq('match_id', matchId)
      .eq('team_id', teamId);

    if (error || !communityLineups) {
      return createEmptySignal();
    }

    const sampleSize = communityLineups.length;
    
    if (sampleSize < MIN_SAMPLE_SIZE) {
      return {
        compatibilityScore: 0,
        hasSufficientData: false,
        sampleSize,
        replacementPercentage: 0,
        topReplacements: []
      };
    }

    // Bu oyuncunun yerine kimlerin konulduğunu say
    const replacementCounts: Map<number, { player: any; count: number }> = new Map();
    let totalLineupsWithoutPlayer = 0;

    for (const lineup of communityLineups) {
      const players = { ...lineup.attack_players, ...lineup.defense_players };
      const playerIds = Object.values(players)
        .filter(Boolean)
        .map((p: any) => p.id);

      // Bu kadro mevcut oyuncuyu içermiyor mu?
      if (!playerIds.includes(currentPlayerId)) {
        totalLineupsWithoutPlayer++;

        // Aynı pozisyondaki oyuncuları bul
        for (const [_, player] of Object.entries(players)) {
          if (player && (player as any).position === position && (player as any).id !== currentPlayerId) {
            const pid = (player as any).id;
            const existing = replacementCounts.get(pid);
            if (existing) {
              existing.count++;
            } else {
              replacementCounts.set(pid, { player, count: 1 });
            }
          }
        }
      }
    }

    // En popüler değişiklikleri sırala
    const sortedReplacements = [...replacementCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([id, data]) => {
        const availablePlayer = availablePlayers.find(p => p.id === id);
        return {
          player: {
            id,
            name: data.player?.name || availablePlayer?.name || 'Bilinmiyor',
            position: data.player?.position || availablePlayer?.position || position,
            number: data.player?.number || availablePlayer?.number,
            rating: data.player?.rating || availablePlayer?.rating
          },
          percentage: Math.round((data.count / sampleSize) * 100),
          count: data.count
        };
      });

    const replacementPercentage = sampleSize > 0 
      ? Math.round((totalLineupsWithoutPlayer / sampleSize) * 100)
      : 0;

    // Genel uyumluluk skoru (basit hesaplama)
    const avgOverlap = sortedReplacements.length > 0
      ? sortedReplacements.reduce((sum, r) => sum + r.percentage, 0) / sortedReplacements.length
      : 0;

    const result: CommunitySignalData = {
      compatibilityScore: 100 - replacementPercentage, // Oyuncu ne kadar az değiştiriliyorsa o kadar uyumlu
      hasSufficientData: true,
      sampleSize,
      replacementPercentage,
      topReplacements: sortedReplacements
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('Replacement suggestions error:', error);
    return createEmptySignal();
  }
}

function createEmptySignal(): CommunitySignalData {
  return {
    compatibilityScore: 0,
    hasSufficientData: false,
    sampleSize: 0,
    replacementPercentage: 0,
    topReplacements: []
  };
}

/**
 * Mock maç için mock community signal verisi oluştur
 */
function generateMockCommunitySignal(
  currentPlayerId: number,
  position: string,
  availablePlayers: any[]
): CommunitySignalData & { lineupCompatibility: number } {
  // Aynı pozisyondaki oyuncuları bul
  const samePositionPlayers = availablePlayers.filter(
    p => p.id !== currentPlayerId && (p.position === position || getPositionCategory(p.position) === getPositionCategory(position))
  );
  
  // Mock replacement önerileri oluştur
  const topReplacements = samePositionPlayers.slice(0, 3).map((player, index) => ({
    player: {
      id: player.id,
      name: player.name,
      position: player.position,
      number: player.number,
      rating: player.rating || 75 + Math.floor(Math.random() * 10)
    },
    percentage: Math.max(15, 45 - (index * 12) + Math.floor(Math.random() * 8)),
    count: Math.max(5, 25 - (index * 6) + Math.floor(Math.random() * 5))
  }));
  
  const mockSampleSize = 47 + Math.floor(Math.random() * 30); // 47-77 arası
  const lineupCompatibility = 62 + Math.floor(Math.random() * 25); // 62-87 arası
  const replacementPercentage = topReplacements.length > 0 
    ? Math.min(75, topReplacements.reduce((sum, r) => sum + r.percentage, 0))
    : 35;
  
  return {
    compatibilityScore: 100 - replacementPercentage,
    hasSufficientData: true,
    sampleSize: mockSampleSize,
    replacementPercentage,
    topReplacements,
    lineupCompatibility
  };
}

/**
 * Pozisyon kategorisini belirle (benzer pozisyonları grupla)
 */
function getPositionCategory(position: string): string {
  const pos = position?.toUpperCase() || '';
  if (pos === 'GK' || pos === 'G') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'D'].some(p => pos.includes(p))) return 'DEF';
  if (['CM', 'CDM', 'CAM', 'LM', 'RM', 'DM', 'AM', 'M'].some(p => pos.includes(p))) return 'MID';
  if (['ST', 'CF', 'LW', 'RW', 'SS', 'F', 'A'].some(p => pos.includes(p))) return 'ATT';
  return 'MID'; // varsayılan
}

/**
 * Topluluk sinyali verilerini tek seferde al
 */
export async function getCommunitySignal(
  matchId: number | string,
  teamId: number,
  currentPlayerId: number,
  position: string,
  userLineup: Record<number, any>,
  formationId: string,
  availablePlayers: any[]
): Promise<CommunitySignalData & { lineupCompatibility: number }> {
  const [compatibility, replacements] = await Promise.all([
    calculateLineupCompatibility(matchId, teamId, userLineup, formationId),
    getReplacementSuggestions(matchId, teamId, currentPlayerId, position, availablePlayers)
  ]);

  return {
    ...replacements,
    compatibilityScore: replacements.hasSufficientData ? replacements.compatibilityScore : 0,
    lineupCompatibility: compatibility.score,
    hasSufficientData: compatibility.hasSufficientData || replacements.hasSufficientData,
    sampleSize: Math.max(compatibility.sampleSize, replacements.sampleSize)
  };
}

export default {
  calculateLineupCompatibility,
  getReplacementSuggestions,
  getCommunitySignal
};
