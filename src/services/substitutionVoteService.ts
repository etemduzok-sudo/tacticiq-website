/**
 * Substitution Vote Service
 * Canlı maçlarda topluluk değişiklik oylaması
 */

import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL_MS = 30 * 1000; // 30 saniye - canlı maçlar için daha sık güncelleme

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

export interface PlayerVoteSummary {
  playerId: number;
  outVotes: number;
  inVotes: number;
  netSentiment: number; // outVotes - inVotes (pozitif = çıkması isteniyor)
}

export interface SubstitutionVote {
  matchId: number;
  teamId: number;
  userId: string;
  playerOutId: number;
  playerInId?: number;
  voteType: 'out' | 'in';
}

/**
 * Kullanıcının oy kullanıp kullanmadığını kontrol et
 */
export async function hasUserVoted(
  matchId: number,
  userId: string,
  playerId: number,
  voteType: 'out' | 'in'
): Promise<boolean> {
  const cacheKey = `vote_check_${matchId}_${userId}_${playerId}_${voteType}`;
  const cached = getCached<boolean>(cacheKey);
  if (cached !== null) return cached;

  try {
    const { data, error } = await supabase
      .from('substitution_votes')
      .select('id')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .eq('player_out_id', playerId)
      .eq('vote_type', voteType)
      .single();

    const hasVoted = !!data && !error;
    setCache(cacheKey, hasVoted);
    return hasVoted;
  } catch {
    return false;
  }
}

/**
 * Oyuncu için oy kullan
 */
export async function submitVote(vote: SubstitutionVote): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('substitution_votes')
      .upsert({
        match_id: vote.matchId,
        team_id: vote.teamId,
        user_id: vote.userId,
        player_out_id: vote.playerOutId,
        player_in_id: vote.playerInId || null,
        vote_type: vote.voteType,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'match_id,user_id,player_out_id,vote_type',
      });

    if (error) {
      console.error('❌ Vote submission error:', error);
      return { success: false, error: error.message };
    }

    // Cache'i temizle
    cache.clear();
    
    return { success: true };
  } catch (err: any) {
    console.error('❌ Vote submission exception:', err);
    return { success: false, error: err.message || 'Bilinmeyen hata' };
  }
}

/**
 * Oyuncu için oyu geri çek
 */
export async function removeVote(
  matchId: number,
  userId: string,
  playerId: number,
  voteType: 'out' | 'in'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('substitution_votes')
      .delete()
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .eq('player_out_id', playerId)
      .eq('vote_type', voteType);

    if (error) {
      console.error('❌ Vote removal error:', error);
      return { success: false, error: error.message };
    }

    // Cache'i temizle
    cache.clear();
    
    return { success: true };
  } catch (err: any) {
    console.error('❌ Vote removal exception:', err);
    return { success: false, error: err.message || 'Bilinmeyen hata' };
  }
}

/**
 * Maç ve takım için tüm oyuncu oy özetlerini getir
 */
export async function getMatchVoteSummary(
  matchId: number,
  teamId: number
): Promise<PlayerVoteSummary[]> {
  const cacheKey = `vote_summary_${matchId}_${teamId}`;
  const cached = getCached<PlayerVoteSummary[]>(cacheKey);
  if (cached) return cached;

  try {
    // Supabase function veya view kullan
    const { data, error } = await supabase
      .rpc('get_player_vote_summary', { 
        p_match_id: matchId, 
        p_team_id: teamId 
      });

    if (error) {
      console.error('❌ Vote summary error:', error);
      return [];
    }

    const summary: PlayerVoteSummary[] = (data || []).map((row: any) => ({
      playerId: row.player_id,
      outVotes: row.out_votes || 0,
      inVotes: row.in_votes || 0,
      netSentiment: (row.out_votes || 0) - (row.in_votes || 0),
    }));

    setCache(cacheKey, summary);
    return summary;
  } catch (err) {
    console.error('❌ Vote summary exception:', err);
    return [];
  }
}

/**
 * Belirli bir oyuncu için oy özetini getir
 */
export async function getPlayerVoteSummary(
  matchId: number,
  teamId: number,
  playerId: number
): Promise<PlayerVoteSummary | null> {
  const allSummaries = await getMatchVoteSummary(matchId, teamId);
  return allSummaries.find(s => s.playerId === playerId) || null;
}

/**
 * En çok çıkması istenen oyuncuları getir
 */
export async function getMostWantedSubstitutions(
  matchId: number,
  teamId: number,
  limit: number = 3
): Promise<PlayerVoteSummary[]> {
  const allSummaries = await getMatchVoteSummary(matchId, teamId);
  return allSummaries
    .filter(s => s.netSentiment > 0) // Sadece çıkması istenenler
    .sort((a, b) => b.netSentiment - a.netSentiment)
    .slice(0, limit);
}

/**
 * Kullanıcının bu maçtaki oylarını getir
 */
export async function getUserVotesForMatch(
  matchId: number,
  userId: string
): Promise<Array<{ playerId: number; voteType: 'out' | 'in' }>> {
  const cacheKey = `user_votes_${matchId}_${userId}`;
  const cached = getCached<Array<{ playerId: number; voteType: 'out' | 'in' }>>(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase
      .from('substitution_votes')
      .select('player_out_id, vote_type')
      .eq('match_id', matchId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ User votes error:', error);
      return [];
    }

    const votes = (data || []).map((row: any) => ({
      playerId: row.player_out_id,
      voteType: row.vote_type as 'out' | 'in',
    }));

    setCache(cacheKey, votes);
    return votes;
  } catch (err) {
    console.error('❌ User votes exception:', err);
    return [];
  }
}

/**
 * Oylama verilerini oyuncu kartlarında göstermek için renk hesapla
 * Kırmızı: Çıkması isteniyor, Yeşil: Girmesi isteniyor
 */
export function getVoteIndicatorColor(summary: PlayerVoteSummary | null): string | null {
  if (!summary) return null;
  
  const MIN_VOTES_TO_SHOW = 3; // En az 3 oy gerekli
  const totalVotes = summary.outVotes + summary.inVotes;
  
  if (totalVotes < MIN_VOTES_TO_SHOW) return null;
  
  if (summary.netSentiment > 5) {
    return 'rgba(239, 68, 68, 0.6)'; // Kırmızı - çıkması isteniyor
  } else if (summary.netSentiment < -5) {
    return 'rgba(16, 185, 129, 0.6)'; // Yeşil - girmesi isteniyor
  }
  
  return null;
}

/**
 * Local storage'dan geçici oy verisi (Supabase bağlantısı yokken)
 */
export async function saveLocalVote(vote: SubstitutionVote): Promise<void> {
  const key = `local_votes_${vote.matchId}`;
  const existing = await AsyncStorage.getItem(key);
  const votes: SubstitutionVote[] = existing ? JSON.parse(existing) : [];
  
  const existingIndex = votes.findIndex(
    v => v.playerOutId === vote.playerOutId && v.voteType === vote.voteType
  );
  
  if (existingIndex >= 0) {
    votes[existingIndex] = vote;
  } else {
    votes.push(vote);
  }
  
  await AsyncStorage.setItem(key, JSON.stringify(votes));
}

/**
 * Local vote'ları Supabase'e sync et
 */
export async function syncLocalVotes(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const voteKeys = keys.filter(k => k.startsWith('local_votes_'));
  
  for (const key of voteKeys) {
    const data = await AsyncStorage.getItem(key);
    if (!data) continue;
    
    const votes: SubstitutionVote[] = JSON.parse(data);
    for (const vote of votes) {
      await submitVote(vote);
    }
    
    await AsyncStorage.removeItem(key);
  }
}
