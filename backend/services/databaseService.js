// Fan Manager 2026 - Database Service
// Handles syncing API data to Supabase
const { supabase, isConfigured } = require('../config/supabase');

class DatabaseService {
  constructor() {
    this.enabled = isConfigured;
    if (!this.enabled) {
      console.log('💾 Database service disabled (Supabase not configured)');
    } else {
      console.log('💾 Database service enabled');
    }
  }

  // ==========================================
  // LEAGUES
  // ==========================================
  async upsertLeague(leagueData) {
    if (!this.enabled) return null;

    try {
      const { data, error } = await supabase
        .from('leagues')
        .upsert({
          id: leagueData.league.id,
          name: leagueData.league.name,
          country: leagueData.country.name,
          logo: leagueData.league.logo,
          season: leagueData.seasons?.[0]?.year || new Date().getFullYear(),
          type: leagueData.league.type,
        }, { onConflict: 'id' });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error upserting league:', error.message);
      return null;
    }
  }

  // ==========================================
  // TEAMS
  // ==========================================
  async upsertTeam(teamData) {
    if (!this.enabled) return null;

    try {
      const { data, error } = await supabase
        .from('teams')
        .upsert({
          id: teamData.team.id,
          name: teamData.team.name,
          code: teamData.team.code,
          country: teamData.team.country,
          logo: teamData.team.logo,
          founded: teamData.team.founded,
          venue_name: teamData.venue?.name,
          venue_capacity: teamData.venue?.capacity,
        }, { onConflict: 'id' });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error upserting team:', error.message);
      return null;
    }
  }

  // ==========================================
  // MATCHES
  // ==========================================
  async upsertMatch(matchData) {
    if (!this.enabled) return null;

    try {
      // First, ensure teams and league exist
      if (matchData.teams?.home) {
        await this.upsertTeam({ team: matchData.teams.home });
      }
      if (matchData.teams?.away) {
        await this.upsertTeam({ team: matchData.teams.away });
      }
      if (matchData.league) {
        await this.upsertLeague({ 
          league: matchData.league,
          country: { name: matchData.league.country || 'Unknown' },
          seasons: [{ year: matchData.league.season }]
        });
      }

      // Insert/Update match
      const { data, error } = await supabase
        .from('matches')
        .upsert({
          id: matchData.fixture.id,
          league_id: matchData.league?.id,
          season: matchData.league?.season,
          round: matchData.league?.round,
          date: new Date(matchData.fixture.date),
          timestamp: matchData.fixture.timestamp,
          timezone: matchData.fixture.timezone,
          venue: matchData.fixture.venue?.name,
          referee: matchData.fixture.referee,
          
          // Status
          status_long: matchData.fixture.status.long,
          status_short: matchData.fixture.status.short,
          status_elapsed: matchData.fixture.status.elapsed,
          
          // Teams
          home_team_id: matchData.teams?.home?.id,
          away_team_id: matchData.teams?.away?.id,
          
          // Score
          home_goals: matchData.goals?.home,
          away_goals: matchData.goals?.away,
          home_halftime_goals: matchData.score?.halftime?.home,
          away_halftime_goals: matchData.score?.halftime?.away,
          home_fulltime_goals: matchData.score?.fulltime?.home,
          away_fulltime_goals: matchData.score?.fulltime?.away,
          
          // Additional Data
          events: matchData.events || null,
          lineups: matchData.lineups || null,
          statistics: matchData.statistics || null,
          
          last_synced_at: new Date(),
        }, { onConflict: 'id' });

      if (error) throw error;
      
      console.log(`💾 Synced match to DB: ${matchData.teams?.home?.name} vs ${matchData.teams?.away?.name}`);
      return data;
    } catch (error) {
      console.error('❌ Error upserting match:', error.message);
      return null;
    }
  }

  // Bulk upsert matches
  async upsertMatches(matchesArray) {
    if (!this.enabled) return [];

    const results = [];
    for (const match of matchesArray) {
      const result = await this.upsertMatch(match);
      if (result) results.push(result);
    }
    
    console.log(`💾 Synced ${results.length}/${matchesArray.length} matches to database`);
    return results;
  }

  // ==========================================
  // PLAYERS
  // ==========================================
  async upsertPlayer(playerData) {
    if (!this.enabled) return null;

    try {
      const { data, error } = await supabase
        .from('players')
        .upsert({
          id: playerData.player.id,
          name: playerData.player.name,
          firstname: playerData.player.firstname,
          lastname: playerData.player.lastname,
          age: playerData.player.age,
          nationality: playerData.player.nationality,
          photo: playerData.player.photo,
          height: playerData.player.height,
          weight: playerData.player.weight,
          position: playerData.statistics?.[0]?.games?.position,
          team_id: playerData.statistics?.[0]?.team?.id,
        }, { onConflict: 'id' });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error upserting player:', error.message);
      return null;
    }
  }

  // ==========================================
  // QUERIES
  // ==========================================
  
  // Get live matches from database
  async getLiveMatches() {
    if (!this.enabled) return [];

    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          league:leagues(*),
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*)
        `)
        .in('status_short', ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting live matches from DB:', error.message);
      return [];
    }
  }

  // Get matches by date
  async getMatchesByDate(date) {
    if (!this.enabled) return [];

    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          league:leagues(*),
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*)
        `)
        .gte('date', startOfDay.toISOString())
        .lte('date', endOfDay.toISOString())
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting matches by date from DB:', error.message);
      return [];
    }
  }

  // Get matches by team
  async getMatchesByTeam(teamId, limit = 10) {
    if (!this.enabled) return [];

    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          league:leagues(*),
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting matches by team from DB:', error.message);
      return [];
    }
  }

  // Get match by ID
  async getMatchById(matchId) {
    if (!this.enabled) return null;

    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          league:leagues(*),
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*)
        `)
        .eq('id', matchId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error getting match by ID from DB:', error.message);
      return null;
    }
  }

  // ==========================================
  // STATISTICS
  // ==========================================
  
  async getStats() {
    if (!this.enabled) return null;

    try {
      const { count: matchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true });

      const { count: teamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      const { count: leagueCount } = await supabase
        .from('leagues')
        .select('*', { count: 'exact', head: true });

      const { count: liveCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .in('status_short', ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']);

      return {
        matches: matchCount || 0,
        teams: teamCount || 0,
        leagues: leagueCount || 0,
        liveMatches: liveCount || 0,
      };
    } catch (error) {
      console.error('❌ Error getting stats from DB:', error.message);
      return null;
    }
  }
}

module.exports = new DatabaseService();
