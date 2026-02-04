// TacticIQ - Database Service
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
          logo: null, // ⚠️ TELİF HAKKI: Organizasyon logo'ları (UEFA, FIFA) ASLA kullanılmaz
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
      const team = teamData.team || teamData;
      
      // Extract colors and flag from team data if available
      const colors = teamData.colors || team.colors || null;
      const flag = teamData.flag || team.flag || null;
      
      // Build update object - only include colors/flag if they exist in schema
      // ⚠️ TELİF HAKKI: Kulüp armaları ve lig logo'ları ASLA kullanılmaz, sadece renkler
      const updateData = {
        id: team.id,
        name: team.name,
        code: team.code,
        country: team.country,
        logo: null, // ⚠️ TELİF HAKKI: Kulüp armaları ASLA kaydedilmez (sadece renkler kullanılır)
        founded: team.founded,
        venue_name: teamData.venue?.name,
        venue_capacity: teamData.venue?.capacity,
      };
      
      // Only add colors/flag/national if schema supports them (to avoid errors)
      // These columns will be added via migration script: supabase/004_teams_colors_flag.sql
      if (colors) {
        updateData.colors = JSON.stringify(colors);
      }
      if (flag) {
        updateData.flag = flag;
      }
      if (team.national !== undefined) {
        updateData.national = team.national;
      }
      
      const { data, error } = await supabase
        .from('teams')
        .upsert(updateData, { onConflict: 'id' });

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
          fixture_date: new Date(matchData.fixture.date),
          fixture_timestamp: matchData.fixture.timestamp,
          timezone: matchData.fixture.timezone,
          venue_name: matchData.fixture.venue?.name,
          venue_city: matchData.fixture.venue?.city,
          referee: matchData.fixture.referee,
          
          // Status (matching Supabase schema)
          status: matchData.fixture.status.short,
          status_long: matchData.fixture.status.long,
          elapsed: matchData.fixture.status.elapsed,
          
          // Teams
          home_team_id: matchData.teams?.home?.id,
          away_team_id: matchData.teams?.away?.id,
          
          // Score (matching Supabase schema)
          home_score: matchData.goals?.home,
          away_score: matchData.goals?.away,
          halftime_home: matchData.score?.halftime?.home,
          halftime_away: matchData.score?.halftime?.away,
          fulltime_home: matchData.score?.fulltime?.home,
          fulltime_away: matchData.score?.fulltime?.away,
          extratime_home: matchData.score?.extratime?.home,
          extratime_away: matchData.score?.extratime?.away,
          penalty_home: matchData.score?.penalty?.home,
          penalty_away: matchData.score?.penalty?.away,
          
          // Additional Data flags (matching Supabase schema)
          has_lineups: matchData.lineups ? true : false,
          has_statistics: matchData.statistics ? true : false,
          has_events: matchData.events ? true : false,
        }, { onConflict: 'id' });

      if (error) throw error;
      
      if (!matchData._quiet) {
        console.log(`💾 Synced match to DB: ${matchData.teams?.home?.name} vs ${matchData.teams?.away?.name}`);
      }
      return data;
    } catch (error) {
      console.error('❌ Error upserting match:', error.message);
      return null;
    }
  }

  // Bulk upsert matches (opts.quiet = true: no per-match log)
  // opts.bulk = true: fast batch upsert (teams/leagues/matches in batches)
  async upsertMatches(matchesArray, opts = {}) {
    if (!this.enabled) return [];

    if (opts.bulk && matchesArray.length > 10) {
      return this._bulkUpsertMatches(matchesArray, opts);
    }

    const results = [];
    for (const match of matchesArray) {
      if (opts.quiet) match._quiet = true;
      const result = await this.upsertMatch(match);
      if (result) results.push(result);
    }
    
    if (!opts.quiet || results.length > 0) {
      console.log(`💾 Synced ${results.length}/${matchesArray.length} matches to database`);
    }
    return results;
  }

  async _bulkUpsertMatches(fixtures, opts = {}) {
    const teamsMap = new Map();
    const leaguesMap = new Map();
    for (const f of fixtures) {
      if (f.teams?.home) teamsMap.set(f.teams.home.id, f.teams.home);
      if (f.teams?.away) teamsMap.set(f.teams.away.id, f.teams.away);
      if (f.league) leaguesMap.set(f.league.id, { league: f.league, country: { name: f.league.country || 'Unknown' }, seasons: [{ year: f.league.season }] });
    }
    for (const [, t] of teamsMap) {
      await this.upsertTeam({ team: t });
    }
    for (const [, l] of leaguesMap) {
      await this.upsertLeague(l);
    }
    const BATCH = 80;
    let saved = 0;
    for (let i = 0; i < fixtures.length; i += BATCH) {
      const batch = fixtures.slice(i, i + BATCH);
      const rows = batch.map(f => ({
        id: f.fixture?.id,
        league_id: f.league?.id,
        season: f.league?.season,
        round: f.league?.round,
        fixture_date: f.fixture?.date ? new Date(f.fixture.date) : null,
        fixture_timestamp: f.fixture?.timestamp,
        timezone: f.fixture?.timezone,
        venue_name: f.fixture?.venue?.name,
        venue_city: f.fixture?.venue?.city,
        referee: f.fixture?.referee,
        status: f.fixture?.status?.short,
        status_long: f.fixture?.status?.long,
        elapsed: f.fixture?.status?.elapsed,
        home_team_id: f.teams?.home?.id,
        away_team_id: f.teams?.away?.id,
        home_score: f.goals?.home,
        away_score: f.goals?.away,
        halftime_home: f.score?.halftime?.home,
        halftime_away: f.score?.halftime?.away,
        fulltime_home: f.score?.fulltime?.home,
        fulltime_away: f.score?.fulltime?.away,
        extratime_home: f.score?.extratime?.home,
        extratime_away: f.score?.extratime?.away,
        penalty_home: f.score?.penalty?.home,
        penalty_away: f.score?.penalty?.away,
      })).filter(r => r.id);
      const { data, error } = await supabase.from('matches').upsert(rows, { onConflict: 'id' });
      if (!error) saved += rows.length;
    }
    if (!opts.quiet) console.log(`💾 Synced ${saved}/${fixtures.length} matches to database`);
    return Array(saved).fill({});
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
        .gte('fixture_date', startOfDay.toISOString())
        .lte('fixture_date', endOfDay.toISOString())
        .order('fixture_date', { ascending: true });

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
        .order('fixture_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting matches by team from DB:', error.message);
      return [];
    }
  }

  // Get all matches for a team in a season (for favorites feed - past + upcoming)
  async getTeamMatches(teamId, season) {
    if (!this.enabled) return [];

    try {
      const seasonNum = parseInt(String(season), 10);
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          league:leagues(*),
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .eq('season', seasonNum)
        .order('fixture_timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error getting team season matches from DB:', error.message);
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
