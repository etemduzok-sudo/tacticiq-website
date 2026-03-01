// ============================================
// LIVE MATCH SERVICE
// ============================================
// Canlı maç güncelleme ve polling sistemi
// ============================================

const footballApi = require('./footballApi');
const { finalizeMatch } = require('./scoringService');
const { supabase } = require('../config/supabase');

// ============================================
// CONFIGURATION
// ============================================

const POLLING_INTERVAL = 8000; // 8 seconds - PRO plan: 75K/day → daha hızlı güncelleme
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

// ✅ YENİ: Zamanı geçmiş ama hala NS statüsünde olan maçları bul
// Bu maçlar muhtemelen başlamış ama API henüz güncellememiş
async function getStaleNsMatches() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 saat önce
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 saat önce
  
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'NS')
      .gte('fixture_timestamp', Math.floor(threeHoursAgo.getTime() / 1000)) // Son 3 saat içinde başlaması gerekiyordu
      .lte('fixture_timestamp', Math.floor(now.getTime() / 1000)); // Şu andan önce başlaması gerekiyordu

    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log(`⚠️ Found ${data.length} stale NS matches (should have started but still NS)`);
      data.forEach(m => {
        const startTime = new Date(m.fixture_timestamp * 1000);
        const minutesAgo = Math.floor((now.getTime() - startTime.getTime()) / 60000);
        console.log(`   - Match ${m.id}: Started ${minutesAgo} minutes ago, still NS`);
      });
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching stale NS matches:', error);
    return [];
  }
}

// ✅ YENİ: Fixture ID ile direkt API'den maç statüsünü güncelle
async function refreshMatchByFixtureId(fixtureId) {
  try {
    console.log(`🔄 Refreshing match ${fixtureId} by fixture ID...`);
    
    const fixtureData = await footballApi.getFixtureDetails(fixtureId, true); // skipCache = true
    
    if (!fixtureData.response || fixtureData.response.length === 0) {
      console.log(`⚠️ No data returned for fixture ${fixtureId}`);
      return null;
    }
    
    const match = fixtureData.response[0];
    const newStatus = match.fixture.status.short;
    
    console.log(`📊 Fixture ${fixtureId} status from API: ${newStatus}`);
    
    // DB'yi güncelle
    const updated = await updateMatchInDatabase(match);
    
    if (updated) {
      console.log(`✅ Match ${fixtureId} updated: status=${newStatus}, elapsed=${match.fixture.status.elapsed}`);
    }
    
    return match;
  } catch (error) {
    console.error(`❌ Error refreshing match ${fixtureId}:`, error.message);
    return null;
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

// Snapshot: Sadece API-Football bitiş düdüğü (FT) anında alınır; başka snapshot yok.
async function saveMatchEndSnapshot(matchId, fullMatchPayload) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('match_end_snapshots')
      .upsert(
        {
          match_id: matchId,
          snapshot: fullMatchPayload,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'match_id' }
      );
    if (error) throw error;
    console.log(`📸 Match end snapshot saved for match ${matchId}`);
  } catch (err) {
    console.error('Error saving match end snapshot:', err);
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
    // ✅ 0. STALE NS MAÇLARI KONTROL ET (zamanı geçmiş ama hala NS)
    // Bu maçları fixture ID ile direkt API'den sorgula
    const staleMatches = await getStaleNsMatches();
    if (staleMatches.length > 0) {
      console.log(`🔍 Checking ${staleMatches.length} stale NS matches by fixture ID...`);
      for (const staleMatch of staleMatches) {
        await refreshMatchByFixtureId(staleMatch.id);
        // Rate limit: Her istek arasında 200ms bekle
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
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

    // ✅ EVENT'LERİ KAYDET: API-Football /fixtures?live=all endpoint'i event'leri de içeriyor!
    const timelineService = require('./timelineService');
    let totalEventsSaved = 0;
    let matchesWithEvents = 0;

    // 3. Update each live match
    for (const liveMatch of liveMatches) {
      const dbMatch = dbMatches.find(m => m.id === liveMatch.fixture.id);
      
      // ✅ Event'leri kaydet (API response'unda varsa)
      if (liveMatch.events && Array.isArray(liveMatch.events) && liveMatch.events.length > 0) {
        const matchData = {
          fixture: liveMatch.fixture,
          events: liveMatch.events,
          goals: liveMatch.goals,
          teams: liveMatch.teams,
          league: liveMatch.league,
        };
        
        const savedCount = await timelineService.saveMatchEvents(matchData);
        if (savedCount > 0) {
          totalEventsSaved += savedCount;
          matchesWithEvents++;
        }
      }
      
      // Her canlı maç için DB'yi güncelle (status değişmese bile elapsed güncellensin)
      await updateMatchInDatabase(liveMatch);

      if (dbMatch) {
        const changes = detectScoreChanges(dbMatch, {
          home_score: liveMatch.goals.home,
          away_score: liveMatch.goals.away,
          status: liveMatch.fixture.status.short
        });

        if (changes.length > 0) {
          console.log(`🎯 Match ${liveMatch.fixture.id} changes:`, changes);
          
          // If match finished, create result and finalize
          if (['FT', 'AET', 'PEN'].includes(liveMatch.fixture.status.short)) {
            console.log(`🏁 Match ${liveMatch.fixture.id} finished!`);
            
            // ✅ Event'ler zaten liveMatch'te varsa kullan, yoksa ayrı çek
            let events = liveMatch.events || [];
            if (events.length === 0) {
              // Fallback: Ayrı çek (eski yöntem)
              const eventsData = await footballApi.getFixtureEvents(liveMatch.fixture.id);
              events = eventsData.response || [];
            }
            
            // Fetch full match data (with statistics)
            const fullMatchData = await footballApi.getFixtureDetails(liveMatch.fixture.id);
            const fullMatch = fullMatchData.response[0] || liveMatch;
            fullMatch.events = events;
            
            // Fetch statistics
            const statsData = await footballApi.getFixtureStatistics(liveMatch.fixture.id);
            fullMatch.statistics = statsData.response;
            
            // Create match result
            await createMatchResult(fullMatch);
            
            // Snapshot: Sadece bitiş düdüğü (API FT) ile birlikte bu anda alınır; tek snapshot.
            await saveMatchEndSnapshot(liveMatch.fixture.id, fullMatch);
            
            // Schedule finalization (after 1 minute)
            setTimeout(async () => {
              console.log(`🎯 Finalizing match ${liveMatch.fixture.id}...`);
              await finalizeMatch(liveMatch.fixture.id);
            }, FINALIZATION_DELAY);
          }
        }
      }
    }
    
    if (totalEventsSaved > 0) {
      console.log(`✅ [LIVE] Saved ${totalEventsSaved} events from ${matchesWithEvents} matches`);
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
  createMatchResult,
  // ✅ YENİ: Fixture ID bazlı güncelleme
  getStaleNsMatches,
  refreshMatchByFixtureId
};
