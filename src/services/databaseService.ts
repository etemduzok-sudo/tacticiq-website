// Database Service - Frontend
// Direct Supabase queries for real-time data

import { supabase } from '../config/supabase';

// ==========================================
// MATCHES
// ==========================================

export const matchesDb = {
  /**
   * Get live matches from database
   */
  getLiveMatches: async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, logo),
          away_team:teams!matches_away_team_id_fkey(id, name, logo),
          league:leagues(id, name, country, logo)
        `)
        .in('status_short', ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'])
        .order('date', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching live matches from DB:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get matches by date
   */
  getMatchesByDate: async (date: string) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, logo),
          away_team:teams!matches_away_team_id_fkey(id, name, logo),
          league:leagues(id, name, country, logo)
        `)
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching matches by date from DB:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get matches by team
   */
  getMatchesByTeam: async (teamId: number) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, logo),
          away_team:teams!matches_away_team_id_fkey(id, name, logo),
          league:leagues(id, name, country, logo)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching matches by team from DB:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get match by ID
   */
  getMatchById: async (matchId: number) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(id, name, logo, code),
          away_team:teams!matches_away_team_id_fkey(id, name, logo, code),
          league:leagues(id, name, country, logo)
        `)
        .eq('id', matchId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching match by ID from DB:', error.message);
      return { success: false, error: error.message, data: null };
    }
  },

  /**
   * Subscribe to live match updates
   */
  subscribeToMatch: (matchId: number, callback: (payload: any) => void) => {
    return supabase
      .channel(`match:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        callback
      )
      .subscribe();
  },
};

// ==========================================
// TEAMS
// ==========================================

export const teamsDb = {
  /**
   * Get team by ID
   */
  getTeamById: async (teamId: number) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching team from DB:', error.message);
      return { success: false, error: error.message, data: null };
    }
  },

  /**
   * Search teams by name
   */
  searchTeams: async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error searching teams from DB:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },
};

// ==========================================
// LEAGUES
// ==========================================

export const leaguesDb = {
  /**
   * Get all leagues
   */
  getAllLeagues: async () => {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching leagues from DB:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get league by ID
   */
  getLeagueById: async (leagueId: number) => {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', leagueId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching league from DB:', error.message);
      return { success: false, error: error.message, data: null };
    }
  },
};

// ==========================================
// PREDICTIONS
// ==========================================

export const predictionsDb = {
  /**
   * Create a new prediction
   */
  createPrediction: async (prediction: {
    user_id: string;
    match_id: string;
    prediction_type: string;
    prediction_value: any;
  }) => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .insert(prediction)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error creating prediction:', error.message);
      return { success: false, error: error.message, data: null };
    }
  },

  /**
   * Get user's predictions for a match
   */
  getUserMatchPredictions: async (userId: string, matchId: string) => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('match_id', matchId);

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching predictions:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Get user's all predictions
   */
  getUserPredictions: async (userId: string, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching user predictions:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },
};

// ==========================================
// USERS
// ==========================================

export const usersDb = {
  /**
   * Create a new user
   */
  createUser: async (userData: {
    id: string;
    username: string;
    email: string;
    is_pro?: boolean;
    avatar_url?: string;
  }) => {
    try {
      // Check which columns exist in users table
      const insertData: any = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatar_url: userData.avatar_url || null,
        total_points: 0,
        accuracy: 0,
        rank: 0,
        current_streak: 0,
        created_at: new Date().toISOString(),
      };
      
      // Add is_pro only if column exists (check by trying without it first)
      if (userData.is_pro !== undefined) {
        insertData.is_pro = userData.is_pro;
      }
      
      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ User created in database:', data.username);
      return { success: true, data };
    } catch (error: any) {
      // If user already exists, return existing user
      if (error.code === '23505') {
        console.log('⚠️ User already exists, fetching existing user...');
        return await usersDb.getUserById(userData.id);
      }
      console.error('❌ Error creating user:', error.message);
      return { success: false, error: error.message, data: null };
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching user:', error.message);
      return { success: false, error: error.message, data: null };
    }
  },

  /**
   * Get leaderboard (top users by points)
   */
  getLeaderboard: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url, total_points, accuracy, rank, current_streak')
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error fetching leaderboard:', error.message);
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (userId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('❌ Error updating user profile:', error.message);
      return { success: false, error: error.message, data: null };
    }
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if database is reachable
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('leagues').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Database connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Get database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const [matchesCount, teamsCount, leaguesCount, usersCount] = await Promise.all([
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('leagues').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ]);

    return {
      matches: matchesCount.count || 0,
      teams: teamsCount.count || 0,
      leagues: leaguesCount.count || 0,
      users: usersCount.count || 0,
    };
  } catch (error: any) {
    console.error('❌ Error fetching database stats:', error.message);
    return { matches: 0, teams: 0, leagues: 0, users: 0 };
  }
};
