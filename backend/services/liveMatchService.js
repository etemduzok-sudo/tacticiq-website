// ============================================
// LIVE MATCH SERVICE
// ============================================
// Canlı maç güncelleme ve polling sistemi
// ============================================

const { createClient } = require('@supabase/supabase-js');
const footballApi = require('./footballApi');
const { finalizeMatch } = require('./scoringService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// CONFIGURATION
// ============================================

const POLLING_INTERVAL = 12000; // 12 seconds (günde 7400 defa = 86400 / 12)
const FINALIZATION_DELAY = 60000; // 1 minute after match ends

let pollingTimer = null;
let isPolling = false;

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get today's matches that are live or about to start
async function getTodayMatches() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .gte('fixture_date', `${today}T00:00:00`)
      .lte('fixture_date', `${tomorrow}T23:59:59`)
      .in('status', ['NS', 'LIVE', '1H', '2H', 'HT', 'ET', 'P', 'BT']);

    if (error) throw error;
    
    console.log(`📋 Found ${data?.length || 0} matches to monitor`);
    return data || [];
  } catch (error) {
    console.error('Error fetching today matches:', error);
    return [];
  }
}

// Detect score changes
function detectScoreChanges(oldMatch, newMatch) {
  const changes = [];

  if (!oldMatch || !newMatch) return changes;

  // Score change
  if (oldMatch.home_score !== newMatch.home_score || 
      oldMatch.away_score !== newMatch.away_score) {
    changes.push({
      type: 'SCORE_CHANGE',
      old: { home: oldMatch.home_score, away: oldMatch.away_score },
      new: { home: newMatch.home_score, away: newMatch.away_score }
    });
  }

  // Status change
  if (oldMatch.status !== newMatch.status) {
    changes.push({
      type: 'STATUS_CHANGE',
      old: oldMatch.status,
      new: newMatch.status
    });
  }

  return changes;
}

// Update match in database
async function updateMatchInDatabase(matchData) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .upsert({
        id: matchData.fixture.id,
        fixture_date: matchData.fixture.date,
        fixture_timestamp: matchData.fixture.timestamp,
        status: matchData.fixture.status.short,
        status_long: matchData.fixture.status.long,
        elapsed: matchData.fixture.status.elapsed,
        home_team_id: matchData.teams.home.id,
        away_team_id: matchData.teams.away.id,
        home_score: matchData.goals.home,
        away_score: matchData.goals.away,
        halftime_home: matchData.score?.halftime?.home,
        halftime_away: matchData.score?.halftime?.away,
        fulltime_home: matchData.score?.fulltime?.home,
        fulltime_away: matchData.score?.fulltime?.away,
        league_id: matchData.league.id,
        season: matchData.league.season,
        round: matchData.league.round,
        venue_name: matchData.fixture.venue?.name,
        venue_city: matchData.fixture.venue?.city,
        referee: matchData.fixture.referee,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating match in database:', error);
    return null;
  }
}

// Create match result when match finishes
async function createMatchResult(matchData) {
  try {
    // Calculate first goal
    const events = matchData.events || [];
    const firstGoalEvent = events.find(e => e.type === 'Goal');
    const firstGoal = firstGoalEvent 
      ? (firstGoalEvent.team.id === matchData.teams.home.id ? 'home' : 'away')
      : 'none';

    // Calculate total goals category
    const totalGoals = matchData.goals.home + matchData.goals.away;
    const totalGoalsCategory = totalGoals <= 1 ? '0-1' : totalGoals <= 3 ? '2-3' : '4+';

    // Count cards
    const yellowCards = events.filter(e => e.type === 'Card' && e.detail === 'Yellow Card').length;
    const redCards = events.filter(e => e.type === 'Card' && e.detail === 'Red Card').length;

    // Count corners (if available in statistics)
    let corners = 0;
    if (matchData.statistics) {
      const homeCorners = matchData.statistics.find(s => s.team.id === matchData.teams.home.id)
        ?.statistics.find(stat => stat.type === 'Corner Kicks')?.value || 0;
      const awayCorners = matchData.statistics.find(s => s.team.id === matchData.teams.away.id)
        ?.statistics.find(stat => stat.type === 'Corner Kicks')?.value || 0;
      corners = parseInt(homeCorners) + parseInt(awayCorners);
    }

    // Insert match result
    const { data, error } = await supabase
      .from('match_results')
      .upsert({
        match_id: matchData.fixture.id,
        home_score: matchData.goals.home,
        away_score: matchData.goals.away,
        first_goal: firstGoal,
        total_goals: totalGoalsCategory,
        yellow_cards: yellowCards,
        red_cards: redCards,
        corners: corners,
        events: events
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Match result created for match ${matchData.fixture.id}`);
    return data;
  } catch (error) {
    console.error('Error creating match result:', error);
    return null;
  }
}

// ============================================
// MAIN POLLING FUNCTION
// ============================================

async function pollLiveMatches() {
  if (isPolling) {
    console.log('⏳ Polling already in progress, skipping...');
    return;
  }

  isPolling = true;
  console.log('🔄 Polling live matches...');

  try {
    // 1. Get today's live/upcoming matches from database
    const dbMatches = await getTodayMatches();
    
    if (dbMatches.length === 0) {
      console.log('📭 No live matches to poll');
      isPolling = false;
      return;
    }

    console.log(`📊 Found ${dbMatches.length} matches to check`);

    // 2. Fetch live data from API-Football
    const apiData = await footballApi.getLiveMatches();
    const liveMatches = apiData.response || [];

    console.log(`🔴 ${liveMatches.length} matches currently live`);

    // 3. Update each live match
    for (const liveMatch of liveMatches) {
      const dbMatch = dbMatches.find(m => m.id === liveMatch.fixture.id);
      
      if (dbMatch) {
        // Detect changes
        const changes = detectScoreChanges(dbMatch, {
          home_score: liveMatch.goals.home,
          away_score: liveMatch.goals.away,
          status: liveMatch.fixture.status.short
        });

        if (changes.length > 0) {
          console.log(`🎯 Match ${liveMatch.fixture.id} changes:`, changes);
          
          // Update database
          await updateMatchInDatabase(liveMatch);
          
          // If match finished, create result and finalize
          if (['FT', 'AET', 'PEN'].includes(liveMatch.fixture.status.short)) {
            console.log(`🏁 Match ${liveMatch.fixture.id} finished!`);
            
            // Fetch full match data (with events and statistics)
            const fullMatchData = await footballApi.getFixtureDetails(liveMatch.fixture.id);
            const fullMatch = fullMatchData.response[0];
            
            // Fetch events
            const eventsData = await footballApi.getFixtureEvents(liveMatch.fixture.id);
            fullMatch.events = eventsData.response;
            
            // Fetch statistics
            const statsData = await footballApi.getFixtureStatistics(liveMatch.fixture.id);
            fullMatch.statistics = statsData.response;
            
            // Create match result
            await createMatchResult(fullMatch);
            
            // Schedule finalization (after 1 minute)
            setTimeout(async () => {
              console.log(`🎯 Finalizing match ${liveMatch.fixture.id}...`);
              await finalizeMatch(liveMatch.fixture.id);
            }, FINALIZATION_DELAY);
          }
        }
      }
    }

    console.log('✅ Polling complete');
  } catch (error) {
    console.error('❌ Error in polling:', error);
  } finally {
    isPolling = false;
  }
}

// ============================================
// POLLING CONTROL
// ============================================

// Start polling
function startPolling() {
  if (pollingTimer) {
    console.log('⚠️ Polling already running');
    return;
  }

  console.log(`🚀 Starting live match polling (interval: ${POLLING_INTERVAL}ms)`);
  
  // Run immediately
  pollLiveMatches();
  
  // Then run on interval
  pollingTimer = setInterval(pollLiveMatches, POLLING_INTERVAL);
}

// Stop polling
function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
    console.log('⏹️ Polling stopped');
  }
}

// Get polling status
function getPollingStatus() {
  return {
    isRunning: pollingTimer !== null,
    isPolling,
    interval: POLLING_INTERVAL,
    finalizationDelay: FINALIZATION_DELAY
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  pollLiveMatches,
  startPolling,
  stopPolling,
  getPollingStatus,
  detectScoreChanges,
  createMatchResult
};
