// Matches Routes
// DB-ONLY for app: Uygulama sadece DB'den veri alır; API-Football'dan doğrudan uygulamaya veri dönülmez.
// Sync script'leri (sync-planned-matches, sync-all-teams-matches vb.) DB'yi doldurur.
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const databaseService = require('../services/databaseService');
const { filterTopLeagueMatches } = require('../utils/liveMatchFilter');
const { calculateRatingFromStats, calculatePlayerAttributesFromStats, getDefaultRatingByPosition } = require('../utils/playerRatingFromStats');
const { getDisplayRatingsMap } = require('../utils/displayRating');
const { supabase } = require('../config/supabase');

if (!supabase) {
  console.warn('⚠️ Supabase not configured in routes/matches.js - some features will be disabled');
}

// 🔥 CACHE MEKANIZMASI - API kullanımını azaltmak için
const API_CACHE = {
  liveMatches: { data: null, timestamp: 0 },
  teamMatches: new Map(), // teamId_season -> { data, timestamp }
};

const CACHE_DURATION = {
  liveMatches: 12 * 1000, // 12 saniye (canlı maçlar için)
  teamMatches: 6 * 60 * 60 * 1000, // 6 saat (geçmiş/gelecek maçlar için)
};

// Helper: Check if cache is valid
function isCacheValid(timestamp, duration) {
  return Date.now() - timestamp < duration;
}

// ✅ Rating ve pozisyona göre 6 özniteliği türet (API bu alanları sağlamıyor)
function derivePlayerStats(rating, positionStr) {
  const pos = (positionStr || '').toLowerCase();
  let base = { pace: 70, shooting: 70, passing: 70, dribbling: 70, defending: 70, physical: 70 };
  if (pos.includes('goalkeeper') || pos === 'gk' || pos === 'g') {
    base = { pace: 48, shooting: 28, passing: 58, dribbling: 42, defending: 92, physical: 88 };
  } else if (pos.includes('defender') || pos.includes('back') || /cb|lb|rb|lwb|rwb/i.test(pos)) {
    base = { pace: 72, shooting: 42, passing: 68, dribbling: 58, defending: 92, physical: 88 };
  } else if (pos.includes('midfielder') || pos.includes('mid') || /cm|cdm|cam|lm|rm|dm|am/i.test(pos)) {
    base = { pace: 76, shooting: 68, passing: 92, dribbling: 88, defending: 68, physical: 72 };
  } else if (pos.includes('attacker') || pos.includes('forward') || pos.includes('striker') || /st|cf|lw|rw|w/i.test(pos)) {
    base = { pace: 90, shooting: 90, passing: 72, dribbling: 88, defending: 38, physical: 72 };
  }
  const avgBase = (base.pace + base.shooting + base.passing + base.dribbling + base.defending + base.physical) / 6;
  const scale = (rating || 75) / avgBase;
  const clamp = (n) => Math.min(99, Math.max(65, Math.round(n)));
  return {
    pace: clamp(base.pace * scale),
    shooting: clamp(base.shooting * scale),
    passing: clamp(base.passing * scale),
    dribbling: clamp(base.dribbling * scale),
    defending: clamp(base.defending * scale),
    physical: clamp(base.physical * scale),
  };
}

// Helper: Get date range
function getDateRange(days) {
  const today = new Date();
  const dates = [];
  for (let i = -days; i <= days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

// Helper: Update match from API response
async function updateMatchFromApi(fixture) {
  try {
    const matchData = {
      id: fixture.fixture.id,
      league_id: fixture.league.id,
      season: fixture.league.season,
      round: fixture.league.round,
      home_team_id: fixture.teams.home.id,
      away_team_id: fixture.teams.away.id,
      fixture_date: new Date(fixture.fixture.date),
      fixture_timestamp: fixture.fixture.timestamp,
      timezone: fixture.fixture.timezone,
      status: fixture.fixture.status.short,
      status_long: fixture.fixture.status.long,
      elapsed: fixture.fixture.status.elapsed,
      home_score: fixture.goals.home,
      away_score: fixture.goals.away,
      halftime_home: fixture.score.halftime.home,
      halftime_away: fixture.score.halftime.away,
      fulltime_home: fixture.score.fulltime.home,
      fulltime_away: fixture.score.fulltime.away,
      extratime_home: fixture.score.extratime.home,
      extratime_away: fixture.score.extratime.away,
      penalty_home: fixture.score.penalty.home,
      penalty_away: fixture.score.penalty.away,
      venue_name: fixture.fixture.venue?.name,
      venue_city: fixture.fixture.venue?.city,
      referee: fixture.fixture.referee
    };

    // Upsert match
    const { error } = await supabase
      .from('matches')
      .upsert(matchData, { onConflict: 'id' });

    if (error) throw error;

    // Upsert teams if not exists
    await upsertTeam(fixture.teams.home);
    await upsertTeam(fixture.teams.away);

    // Upsert league if not exists
    await upsertLeague(fixture.league);

    return true;
  } catch (error) {
    console.error('Error updating match:', error);
    return false;
  }
}

// Helper: Upsert team
async function upsertTeam(team) {
  try {
    const teamData = {
      id: team.id,
      name: team.name,
      code: team.code,
      country: team.country,
      logo: null // ⚠️ TELİF HAKKI: Kulüp armaları telifli - ASLA döndürülmez (sadece renkler kullanılır)
    };

    await supabase
      .from('teams')
      .upsert(teamData, { onConflict: 'id' });
  } catch (error) {
    console.error('Error upserting team:', error);
  }
}

// Helper: Upsert league
async function upsertLeague(league) {
  try {
    const leagueData = {
      id: league.id,
      name: league.name,
      country: league.country,
      logo: null, // ⚠️ TELİF HAKKI: UEFA, FIFA gibi organizasyon logo'ları ASLA kullanılmaz
      flag: league.flag,
      season: league.season
    };

    await supabase
      .from('leagues')
      .upsert(leagueData, { onConflict: 'id' });
  } catch (error) {
    console.error('Error upserting league:', error);
  }
}

// Helper: Update match statistics from API
async function updateMatchStatisticsFromApi(matchId, statistics) {
  try {
    for (const stat of statistics) {
      const statsData = {
        match_id: matchId,
        team_id: stat.team.id,
        shots_on_goal: getStatValue(stat.statistics, 'Shots on Goal'),
        shots_off_goal: getStatValue(stat.statistics, 'Shots off Goal'),
        total_shots: getStatValue(stat.statistics, 'Total Shots'),
        blocked_shots: getStatValue(stat.statistics, 'Blocked Shots'),
        shots_inside_box: getStatValue(stat.statistics, 'Shots insidebox'),
        shots_outside_box: getStatValue(stat.statistics, 'Shots outsidebox'),
        fouls: getStatValue(stat.statistics, 'Fouls'),
        corner_kicks: getStatValue(stat.statistics, 'Corner Kicks'),
        offsides: getStatValue(stat.statistics, 'Offsides'),
        ball_possession: parseInt(getStatValue(stat.statistics, 'Ball Possession') || 0),
        yellow_cards: getStatValue(stat.statistics, 'Yellow Cards'),
        red_cards: getStatValue(stat.statistics, 'Red Cards'),
        goalkeeper_saves: getStatValue(stat.statistics, 'Goalkeeper Saves'),
        total_passes: getStatValue(stat.statistics, 'Total passes'),
        passes_accurate: getStatValue(stat.statistics, 'Passes accurate'),
        passes_percentage: parseInt(getStatValue(stat.statistics, 'Passes %') || 0)
      };

      await supabase
        .from('match_statistics')
        .upsert(statsData, { onConflict: 'match_id,team_id' });
    }
    return true;
  } catch (error) {
    console.error('Error updating match statistics:', error);
    return false;
  }
}

// Helper: Get stat value
function getStatValue(statistics, type) {
  const stat = statistics.find(s => s.type === type);
  return stat ? (parseInt(stat.value) || 0) : 0;
}

// GET /api/matches/live - Get live matches
router.get('/live', async (req, res) => {
  try {
    const favIdsParam = req.query.favoriteTeamIds || req.query.favorite_team_ids;
    const hasFavIds = favIdsParam && typeof favIdsParam === 'string' && favIdsParam.trim().length > 0;
    // 🔥 1. CHECK CACHE FIRST (12 saniye) – favori takım ID’si varsa cache atlanır (kişiye özel liste gerekir)
    if (!hasFavIds && isCacheValid(API_CACHE.liveMatches.timestamp, CACHE_DURATION.liveMatches)) {
      console.log('✅ [LIVE] Returning from MEMORY CACHE (age:', Math.round((Date.now() - API_CACHE.liveMatches.timestamp) / 1000), 'seconds)');
      return res.json({
        success: true,
        data: API_CACHE.liveMatches.data,
        source: 'memory-cache',
        cached: true,
      });
    }

    // 2. Try database first (mock maçı da dahil et)
    const { data: dbMatches, error: dbError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues(id, name, logo, country)
      `)
      .in('status', ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P'])
      .order('fixture_date', { ascending: true });

    // 3. If API key exists, try to get fresh data (ONLY if cache expired)
    // ✅ AKTİF: Canlı maç verileri için API çağrısı yapılıyor
    if (process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_API_KEY) {
      try {
        console.log('🌐 [LIVE] Fetching from API-FOOTBALL (cache expired)');
        const data = await footballApi.getLiveMatches();
        
        // 🔥 DEDUPLİKASYON: fixture.id bazında tekil maçlar
        const seenIds = new Set();
        let uniqueMatches = (data.response || []).filter(match => {
          const fixtureId = match.fixture?.id;
          if (!fixtureId || seenIds.has(fixtureId)) return false;
          seenIds.add(fixtureId);
          return true;
        });
        // Favori takım maçlarını eklemek için filtre öncesi listeyi sakla (Celta Vigo vb. kaybolmasın)
        const rawUniqueMatches = [...uniqueMatches];
        // 🔥 SADECE ÜST LİG: Kadın, 2. lig vb. hariç
        const beforeFilter = uniqueMatches.length;
        uniqueMatches = filterTopLeagueMatches(uniqueMatches);
        if (beforeFilter !== uniqueMatches.length) {
          console.log('✅ [LIVE] Top-league filter:', beforeFilter, '->', uniqueMatches.length, 'matches');
        }
        // Favori eklemeden önce sadece filtrelenmiş listeyi cache için sakla
        const filteredOnlyForCache = [...uniqueMatches];
        // ✅ Favori takım ID'leri verilmişse, üst ligde olmasa bile o maçları listeye ekle (Celta Vigo vb.)
        if (hasFavIds) {
          const favIds = new Set(favIdsParam.split(',').map(s => parseInt(s, 10)).filter(n => !Number.isNaN(n)));
          const existingIds = new Set(uniqueMatches.map(m => m.fixture?.id));
          for (const m of rawUniqueMatches) {
            if (existingIds.has(m.fixture?.id)) continue;
            const homeId = m.teams?.home?.id;
            const awayId = m.teams?.away?.id;
            if ((homeId != null && favIds.has(homeId)) || (awayId != null && favIds.has(awayId))) {
              uniqueMatches.push(m);
              existingIds.add(m.fixture?.id);
            }
          }
          if (favIds.size > 0) {
            console.log('✅ [LIVE] Added favorite-team live matches', { favoriteTeamIds: favIds.size, totalNow: uniqueMatches.length });
          }
        }
        
        // ✅ EVENT'LERİ KAYDET: API-Football /fixtures?live=all endpoint'i event'leri de içeriyor!
        const timelineService = require('../services/timelineService');
        let totalEventsSaved = 0;
        let matchesWithEvents = 0;
        
        for (const match of uniqueMatches) {
          // Event'ler match.events array'inde geliyor (API-Football v3)
          if (match.events && Array.isArray(match.events) && match.events.length > 0) {
            const matchData = {
              fixture: match.fixture,
              events: match.events,
              goals: match.goals,
              teams: match.teams,
              league: match.league,
            };
            
            const savedCount = await timelineService.saveMatchEvents(matchData);
            if (savedCount > 0) {
              totalEventsSaved += savedCount;
              matchesWithEvents++;
            }
          }
        }
        
        if (totalEventsSaved > 0) {
          console.log(`✅ [LIVE] Saved ${totalEventsSaved} events from ${matchesWithEvents} matches`);
        }
        
        // ✅ Mock maç ekleme DEVRE DIŞI - gerçek maçlar için

        // Cache'e sadece üst lig listesini yaz (favori eklemesi kullanıcıya özel)
        API_CACHE.liveMatches = {
          data: filteredOnlyForCache,
          timestamp: Date.now(),
        };
        console.log('💾 [LIVE] Cached', filteredOnlyForCache.length, 'unique matches for 12 seconds');
        
        // Sync to database if enabled (use full list including favorites)
        if (databaseService.enabled && uniqueMatches && uniqueMatches.length > 0) {
          await databaseService.upsertMatches(uniqueMatches);
        }
        
        return res.json({
          success: true,
          data: uniqueMatches,
          source: 'api',
          cached: false,
        });
      } catch (apiError) {
        console.error('API error:', apiError);
        // Continue to fallback
      }
    }

    // 4. DB'den gelen canlı maçları döndür (mock maç DEVRE DIŞI)
    let finalMatches = (!dbError && dbMatches) ? dbMatches : [];

    res.json({
      success: true,
      data: finalMatches,
      source: finalMatches.length > 0 ? 'database' : 'empty',
      message: finalMatches.length === 0 ? 'No live matches at the moment' : undefined
    });

  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.json({
      success: true,
      data: [],
      source: 'empty',
      message: 'No live matches available'
    });
  }
});

// GET /api/matches/api-status - API kotası / günlük kalan istek (maç 77 dk'da takılıyorsa kontrol için)
router.get('/api-status', async (req, res) => {
  try {
    const status = footballApi.getApiStatus();
    const remaining = status.remaining != null ? parseInt(status.remaining, 10) : null;
    const limit = status.limit != null ? parseInt(status.limit, 10) : null;
    res.json({
      success: true,
      api: {
        remaining,
        limit,
        updatedAt: status.updatedAt,
        internalRequestCount: status.internalRequestCount,
      },
      message: remaining === 0 ? 'API günlük kotası bitti. Güncelleme yarın sıfırlanır.' : (remaining != null ? `${remaining} istek kaldı.` : 'Henüz API çağrısı yapılmadı; bir maç açın veya liste yenileyin.'),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/matches/date/:date - Get matches by date (format: YYYY-MM-DD)
// DB-FIRST: Önce DB'den çek (sync-planned-matches ile doldurulur), boşsa API fallback
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // 1. Önce DB'den dene (planlanmış maçlar buradan gelir)
    if (databaseService.enabled) {
      try {
        const dbRows = await databaseService.getMatchesByDate(date);
        if (dbRows && dbRows.length > 0) {
          const dbMatches = dbRows.map(dbRowToApiMatch).filter(Boolean);
          return res.json({
            success: true,
            data: dbMatches,
            cached: true,
            source: 'database',
          });
        }
      } catch (dbErr) {
        console.warn('DB lookup failed for date:', date, dbErr.message);
      }
    }
    
    // 2. DB boşsa API'den çek ve kaydet
    const data = await footballApi.getFixturesByDate(date);
    if (databaseService.enabled && data.response && data.response.length > 0) {
      await databaseService.upsertMatches(data.response);
    }
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      source: 'api',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Helper: Transform DB match row to API-Football format (frontend expects this)
function dbRowToApiMatch(row) {
  if (!row) return null;
  const home = row.home_team || { id: row.home_team_id, name: '', logo: null };
  const away = row.away_team || { id: row.away_team_id, name: '', logo: null };
  const league = row.league || { id: row.league_id, name: '', country: '', logo: null };
  const date = row.fixture_date ? new Date(row.fixture_date) : new Date(row.fixture_timestamp * 1000);
  return {
    fixture: {
      id: row.id,
      date: date.toISOString(),
      timestamp: row.fixture_timestamp || Math.floor(date.getTime() / 1000),
      timezone: row.timezone || 'UTC',
      status: {
        short: row.status || 'NS',
        long: row.status_long || 'Not Started',
        elapsed: row.elapsed ?? null,
      },
      venue: row.venue_name ? { name: row.venue_name, city: row.venue_city } : null,
      referee: row.referee,
    },
    league: { id: league.id, name: league.name, country: league.country || '', logo: league.logo, season: row.season, round: row.round },
    teams: {
      home: { id: home.id, name: home.name, logo: home.logo },
      away: { id: away.id, name: away.name, logo: away.logo },
    },
    goals: { home: row.home_score ?? null, away: row.away_score ?? null },
    score: {
      halftime: { home: row.halftime_home ?? null, away: row.halftime_away ?? null },
      fulltime: { home: row.fulltime_home ?? null, away: row.fulltime_away ?? null },
      extratime: { home: row.extratime_home ?? null, away: row.extratime_away ?? null },
      penalty: { home: row.penalty_home ?? null, away: row.penalty_away ?? null },
    },
  };
}

// GET /api/matches/team/:teamId/season/:season - Get all matches for a team in a season
// DB-FIRST: Memory cache → DB (sync-all-teams-matches / sync-planned-matches ile dolu) → API fallback
router.get('/team/:teamId/season/:season', async (req, res) => {
  try {
    const { teamId, season } = req.params;
    const cacheKey = `${teamId}_${season}`;
    
    console.log(`📅 Fetching all matches for team ${teamId} in season ${season}`);
    
    // 🔥 1. CHECK MEMORY CACHE FIRST (6 saat)
    if (API_CACHE.teamMatches.has(cacheKey)) {
      const cached = API_CACHE.teamMatches.get(cacheKey);
      if (isCacheValid(cached.timestamp, CACHE_DURATION.teamMatches)) {
        console.log(`✅ [TEAM] Returning from MEMORY CACHE (age: ${Math.round((Date.now() - cached.timestamp) / 1000 / 60)} minutes)`);
        return res.json({
          success: true,
          data: cached.data,
          source: 'memory-cache',
          cached: true,
          count: cached.data.length
        });
      }
    }
    
    // 2. TRY DATABASE ONLY – uygulama sadece DB'den veri alır, API-Football'a doğrudan gidilmez
    if (databaseService.enabled) {
      try {
        const dbRows = await databaseService.getTeamMatches(teamId, season);
        const dbMatches = (dbRows && dbRows.length > 0)
          ? dbRows.map(dbRowToApiMatch).filter(Boolean)
          : [];
        if (dbMatches.length > 0) {
          console.log(`✅ Found ${dbMatches.length} matches in DATABASE`);
          API_CACHE.teamMatches.set(cacheKey, { data: dbMatches, timestamp: Date.now() });
          return res.json({
            success: true,
            data: dbMatches,
            source: 'database',
            cached: true,
            count: dbMatches.length
          });
        }
        // DB boş: boş dizi dön, API'ye fallback YOK (veri sync scriptleri ile DB'ye yazılır)
        console.log(`📭 No matches in DB for team ${teamId} season ${season} (sync scripts will populate)`);
        return res.json({
          success: true,
          data: [],
          source: 'database',
          cached: false,
          count: 0
        });
      } catch (dbError) {
        console.warn('Database lookup failed:', dbError.message);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          data: []
        });
      }
    }
    
    // DB servisi kapalıysa boş dön (API'ye doğrudan gidilmez)
    res.json({
      success: true,
      data: [],
      source: 'none',
      cached: false,
      count: 0
    });
  } catch (error) {
    console.error('❌ Error fetching team season matches:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/league/:leagueId - Get matches by league
router.get('/league/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { season } = req.query;
    const data = await footballApi.getFixturesByLeague(leagueId, season);
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/:id - Get match details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);
    
    // 🧪 MOCK TEST: 888001 ve 888002 icin match detail
    if (matchId === 888001 || matchId === 888002) {
      const now = new Date();
      const isGsFb = matchId === 888001;
      return res.json({
        success: true,
        data: {
          fixture: {
            id: matchId,
            referee: isGsFb ? 'C. Çakır' : 'F. Brych',
            timezone: 'UTC',
            date: now.toISOString(),
            timestamp: Math.floor(now.getTime() / 1000),
            venue: isGsFb 
              ? { id: 888, name: 'Rams Park', city: 'İstanbul' }
              : { id: 889, name: 'Santiago Bernabéu', city: 'Madrid' },
            status: { long: 'Not Started', short: 'NS', elapsed: null },
          },
          league: isGsFb
            ? { id: 203, name: 'Süper Lig', country: 'Turkey', logo: null, season: 2025 }
            : { id: 140, name: 'La Liga', country: 'Spain', logo: null, season: 2025 },
          teams: isGsFb
            ? { home: { id: 645, name: 'Galatasaray', logo: null }, away: { id: 611, name: 'Fenerbahçe', logo: null } }
            : { home: { id: 541, name: 'Real Madrid', logo: null }, away: { id: 529, name: 'Barcelona', logo: null } },
          goals: { home: null, away: null },
          score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null }, extratime: { home: null, away: null }, penalty: { home: null, away: null } },
          events: [],
          lineups: [],
          statistics: [],
        },
        source: 'mock-test',
        cached: false,
      });
    }

    // ✅ MOCK MATCH: ID 999999 için özel veri döndür (API çağrısı yapma)
    if (matchId === 999999) {
      const now = new Date();
      return res.json({
        success: true,
        data: {
          fixture: {
            id: 999999,
            referee: 'Mock Referee',
            timezone: 'UTC',
            date: now.toISOString(),
            timestamp: Math.floor(now.getTime() / 1000) - 67 * 60,
            venue: { id: 999, name: 'Mock Stadium', city: 'Mock City' },
            status: { long: 'Second Half', short: '2H', elapsed: 67 }
          },
          league: { id: 999, name: 'Mock League', country: 'Mock Country', logo: null, flag: null, season: 2025, round: 'Round 1' },
          teams: {
            home: { id: 9999, name: 'Mock Home Team', logo: null, winner: true },
            away: { id: 9998, name: 'Mock Away Team', logo: null, winner: false }
          },
          goals: { home: 2, away: 1 },
          score: {
            halftime: { home: 1, away: 0 },
            fulltime: { home: null, away: null },
            extratime: { home: null, away: null },
            penalty: { home: null, away: null }
          },
          events: [
            { time: { elapsed: 12, extra: null }, team: { id: 9999, name: 'Mock Home Team' }, player: { id: 1001, name: 'A. Yıldız' }, assist: { id: null, name: null }, type: 'Goal', detail: 'Normal Goal', comments: null },
            { time: { elapsed: 38, extra: null }, team: { id: 9998, name: 'Mock Away Team' }, player: { id: 2003, name: 'C. Demir' }, assist: { id: null, name: null }, type: 'Card', detail: 'Yellow Card', comments: 'Foul' },
            { time: { elapsed: 55, extra: null }, team: { id: 9998, name: 'Mock Away Team' }, player: { id: 2001, name: 'M. Kaya' }, assist: { id: 2002, name: 'E. Şahin' }, type: 'Goal', detail: 'Normal Goal', comments: null },
            { time: { elapsed: 62, extra: null }, team: { id: 9999, name: 'Mock Home Team' }, player: { id: 1002, name: 'B. Öztürk' }, assist: { id: 1001, name: 'A. Yıldız' }, type: 'Goal', detail: 'Normal Goal', comments: null }
          ],
          lineups: [
            {
              team: { id: 9999, name: 'Mock Home Team', logo: null },
              coach: { id: 101, name: 'Mock Coach A', photo: null },
              formation: '4-3-3',
              startXI: [
                { player: { id: 1000, name: 'K. Kaleci', number: 1, pos: 'G', grid: '1:1' } },
                { player: { id: 1010, name: 'S. Sağbek', number: 2, pos: 'D', grid: '2:4' } },
                { player: { id: 1011, name: 'D. Stoper1', number: 4, pos: 'D', grid: '2:3' } },
                { player: { id: 1012, name: 'D. Stoper2', number: 5, pos: 'D', grid: '2:2' } },
                { player: { id: 1013, name: 'S. Solbek', number: 3, pos: 'D', grid: '2:1' } },
                { player: { id: 1020, name: 'O. Sağ', number: 8, pos: 'M', grid: '3:3' } },
                { player: { id: 1021, name: 'O. Merkez', number: 6, pos: 'M', grid: '3:2' } },
                { player: { id: 1022, name: 'O. Sol', number: 10, pos: 'M', grid: '3:1' } },
                { player: { id: 1001, name: 'A. Yıldız', number: 7, pos: 'F', grid: '4:3' } },
                { player: { id: 1031, name: 'F. Santrafor', number: 9, pos: 'F', grid: '4:2' } },
                { player: { id: 1002, name: 'B. Öztürk', number: 11, pos: 'F', grid: '4:1' } }
              ],
              substitutes: [
                { player: { id: 1100, name: 'Y. Kaleci', number: 12, pos: 'G', grid: null } },
                { player: { id: 1101, name: 'Y. Defans', number: 14, pos: 'D', grid: null } },
                { player: { id: 1102, name: 'Y. Orta', number: 15, pos: 'M', grid: null } }
              ]
            },
            {
              team: { id: 9998, name: 'Mock Away Team', logo: null },
              coach: { id: 102, name: 'Mock Coach B', photo: null },
              formation: '4-4-2',
              startXI: [
                { player: { id: 2000, name: 'G. Kaleci', number: 1, pos: 'G', grid: '1:1' } },
                { player: { id: 2010, name: 'D. Sağbek', number: 2, pos: 'D', grid: '2:4' } },
                { player: { id: 2011, name: 'D. Stoper1', number: 4, pos: 'D', grid: '2:3' } },
                { player: { id: 2012, name: 'D. Stoper2', number: 5, pos: 'D', grid: '2:2' } },
                { player: { id: 2013, name: 'D. Solbek', number: 3, pos: 'D', grid: '2:1' } },
                { player: { id: 2020, name: 'O. Sağkanat', number: 7, pos: 'M', grid: '3:4' } },
                { player: { id: 2002, name: 'E. Şahin', number: 8, pos: 'M', grid: '3:3' } },
                { player: { id: 2022, name: 'O. Merkez', number: 6, pos: 'M', grid: '3:2' } },
                { player: { id: 2023, name: 'O. Solkanat', number: 11, pos: 'M', grid: '3:1' } },
                { player: { id: 2001, name: 'M. Kaya', number: 9, pos: 'F', grid: '4:2' } },
                { player: { id: 2003, name: 'C. Demir', number: 10, pos: 'F', grid: '4:1' } }
              ],
              substitutes: [
                { player: { id: 2100, name: 'Y. Kaleci2', number: 12, pos: 'G', grid: null } },
                { player: { id: 2101, name: 'Y. Defans2', number: 14, pos: 'D', grid: null } }
              ]
            }
          ],
          statistics: [
            { team: { id: 9999, name: 'Mock Home Team' }, statistics: [
              { type: 'Shots on Goal', value: 5 }, { type: 'Shots off Goal', value: 3 }, { type: 'Total Shots', value: 12 },
              { type: 'Ball Possession', value: '58%' }, { type: 'Corner Kicks', value: 6 }, { type: 'Fouls', value: 9 },
              { type: 'Yellow Cards', value: 1 }, { type: 'Red Cards', value: 0 }, { type: 'Total passes', value: 412 },
              { type: 'Passes accurate', value: 356 }, { type: 'Passes %', value: '86%' }
            ]},
            { team: { id: 9998, name: 'Mock Away Team' }, statistics: [
              { type: 'Shots on Goal', value: 3 }, { type: 'Shots off Goal', value: 4 }, { type: 'Total Shots', value: 9 },
              { type: 'Ball Possession', value: '42%' }, { type: 'Corner Kicks', value: 3 }, { type: 'Fouls', value: 12 },
              { type: 'Yellow Cards', value: 2 }, { type: 'Red Cards', value: 0 }, { type: 'Total passes', value: 298 },
              { type: 'Passes accurate', value: 241 }, { type: 'Passes %', value: '81%' }
            ]}
          ]
        },
        source: 'mock',
        cached: false
      });
    }
    
    // 1. Try to get from database first
    const { data: dbMatch, error: dbError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name, logo),
        away_team:teams!matches_away_team_id_fkey(id, name, logo),
        league:leagues(id, name, logo, country)
      `)
      .eq('id', id)
      .single();

    const skipCache = req.query.refresh === '1' || req.query.refresh === 'true';
    const dbStatus = dbMatch?.status || '';
    const isLiveByStatus = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'].includes(dbStatus);
    const fixtureDate = dbMatch?.fixture_date ? new Date(dbMatch.fixture_date).getTime() : 0;
    const now = Date.now();
    const startedByTime = fixtureDate > 0 && now >= fixtureDate - 60000;
    const withinMatchWindow = fixtureDate > 0 && (now - fixtureDate) < 3.5 * 60 * 60 * 1000;
    const possiblyLive = startedByTime && withinMatchWindow && !['FT', 'AET', 'PEN'].includes(dbStatus);

    // 2. If found in DB and not live and not refresh → return cached (biten maçta snapshot varsa onu döndür)
    if (!dbError && dbMatch && !skipCache) {
      if (!isLiveByStatus) {
        const isFinished = ['FT', 'AET', 'PEN'].includes(dbStatus);
        if (isFinished && supabase) {
          const { data: snapshotRow } = await supabase
            .from('match_end_snapshots')
            .select('snapshot')
            .eq('match_id', matchId)
            .single();
          if (snapshotRow?.snapshot) {
            return res.json({
              success: true,
              data: snapshotRow.snapshot,
              source: 'snapshot',
              cached: true
            });
          }
        }
        return res.json({
          success: true,
          data: dbMatch,
          source: 'database',
          cached: true
        });
      }
    }

    // 3. If live, possibly live (start time passed), or refresh=1 → fetch from API for fresh data
    if (process.env.API_FOOTBALL_KEY && (isLiveByStatus || possiblyLive || skipCache)) {
      try {
        const apiData = await footballApi.getFixtureDetails(id, skipCache);
        
        if (apiData && apiData.response && apiData.response[0]) {
          const fixture = apiData.response[0];
          
          // Update/insert into database
          await updateMatchFromApi(fixture);
          
          return res.json({
            success: true,
            data: fixture,
            source: 'api',
            cached: apiData.cached || false
          });
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Continue to fallback
      }
    }

    // 4. Fallback: return DB data if exists (biten maçta snapshot varsa onu döndür)
    if (!dbError && dbMatch) {
      const isFinishedFallback = ['FT', 'AET', 'PEN'].includes(dbMatch.status || '');
      if (isFinishedFallback && supabase) {
        const { data: snapshotRow } = await supabase
          .from('match_end_snapshots')
          .select('snapshot')
          .eq('match_id', matchId)
          .single();
        if (snapshotRow?.snapshot) {
          return res.json({
            success: true,
            data: snapshotRow.snapshot,
            source: 'snapshot',
            cached: true,
            warning: 'API unavailable, showing snapshot'
          });
        }
      }
      return res.json({
        success: true,
        data: dbMatch,
        source: 'database',
        cached: true,
        warning: 'API unavailable, showing cached data'
      });
    }

    // 5. Return mock data as last resort
    res.json({
      success: true,
      data: {
        id: parseInt(id),
        status: 'NS',
        home_team: { id: 1, name: 'Home Team', logo: null },
        away_team: { id: 2, name: 'Away Team', logo: null },
        league: { id: 1, name: 'Mock League', logo: null },
        home_score: null,
        away_score: null,
        fixture_date: new Date().toISOString()
      },
      source: 'mock',
      message: 'No API key or database entry. Using mock data.'
    });

  } catch (error) {
    console.error('Error fetching match details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/matches/:id/statistics - Get match statistics
// ?refresh=1 ile cache atlanır
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);
    const skipCache = req.query.refresh === '1' || req.query.refresh === 'true';
    
    // ✅ MOCK MATCH: ID 999999 için özel istatistik döndür
    if (matchId === 999999) {
      return res.json({
        success: true,
        data: [
          { team: { id: 9999, name: 'Mock Home Team' }, statistics: [
            { type: 'Shots on Goal', value: 5 }, { type: 'Shots off Goal', value: 3 }, { type: 'Total Shots', value: 12 },
            { type: 'Ball Possession', value: '58%' }, { type: 'Corner Kicks', value: 6 }, { type: 'Fouls', value: 9 },
            { type: 'Yellow Cards', value: 1 }, { type: 'Red Cards', value: 0 }, { type: 'Total passes', value: 412 },
            { type: 'Passes accurate', value: 356 }, { type: 'Passes %', value: '86%' }
          ]},
          { team: { id: 9998, name: 'Mock Away Team' }, statistics: [
            { type: 'Shots on Goal', value: 3 }, { type: 'Shots off Goal', value: 4 }, { type: 'Total Shots', value: 9 },
            { type: 'Ball Possession', value: '42%' }, { type: 'Corner Kicks', value: 3 }, { type: 'Fouls', value: 12 },
            { type: 'Yellow Cards', value: 2 }, { type: 'Red Cards', value: 0 }, { type: 'Total passes', value: 298 },
            { type: 'Passes accurate', value: 241 }, { type: 'Passes %', value: '81%' }
          ]}
        ],
        source: 'mock',
        cached: false
      });
    }
    
    // 1. Try database first
    const { data: dbStats, error: dbError } = await supabase
      .from('match_statistics')
      .select(`
        *,
        team:teams(id, name, logo)
      `)
      .eq('match_id', id);

    // 2. If match is finished and stats exist, return DB data (unless refresh=1)
    // ✅ skipCache=true ise DB'yi atla ve API'den taze veri çek
    if (!skipCache && !dbError && dbStats && dbStats.length > 0) {
      const { data: match } = await supabase
        .from('matches')
        .select('status')
        .eq('id', id)
        .single();

      // ✅ DB'deki statistics array'i dolu olmalı
      const hasValidStats = dbStats.some(s => s.statistics && s.statistics.length > 0);
      
      if (match && ['FT', 'AET', 'PEN'].includes(match.status) && hasValidStats) {
        return res.json({
          success: true,
          data: dbStats,
          source: 'database',
          cached: true
        });
      }
    }

    // 3. Fetch from API if available
    if (process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_API_KEY) {
      try {
        const apiData = await footballApi.getFixtureStatistics(id, skipCache);
        
        if (apiData && apiData.response) {
          // Update database
          await updateMatchStatisticsFromApi(id, apiData.response);
          
          return res.json({
            success: true,
            data: apiData.response,
            source: 'api',
            cached: apiData.cached || false
          });
        }
      } catch (apiError) {
        console.error('API error:', apiError);
      }
    }

    // 4. Fallback to DB data
    if (!dbError && dbStats) {
      return res.json({
        success: true,
        data: dbStats,
        source: 'database',
        cached: true
      });
    }

    // 5. No data
    res.json({
      success: true,
      data: [],
      message: 'No statistics available'
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/matches/:id/players - Get player statistics from fixtures/players endpoint
// Returns detailed player stats for both teams
// API-Football endpoint: fixtures/players?fixture={id}
router.get('/:id/players', async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id, 10);

    // Mock match check
    if (matchId === 999999 || matchId === 888001 || matchId === 888002) {
      return res.json({
        success: true,
        data: getMockPlayerStats(matchId),
        source: 'mock'
      });
    }

    // Try to fetch from API-Football
    try {
      const playersData = await footballApi.getFixturePlayers(matchId);
      
      if (!playersData?.response || playersData.response.length === 0) {
        return res.json({
          success: true,
          data: null,
          message: 'Player statistics not available for this match'
        });
      }

      // Transform API response to frontend format
      const transformedData = transformPlayerStats(playersData.response);
      
      return res.json({
        success: true,
        data: transformedData,
        source: 'api'
      });
    } catch (apiError) {
      console.error(`API error fetching player stats for match ${matchId}:`, apiError.message);
      return res.json({
        success: true,
        data: null,
        message: 'Player statistics temporarily unavailable'
      });
    }
  } catch (error) {
    console.error('Error in /matches/:id/players:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper: Transform API-Football player stats to frontend format
function transformPlayerStats(apiResponse) {
  const result = {
    home: [],
    away: []
  };

  apiResponse.forEach((teamData, index) => {
    const teamKey = index === 0 ? 'home' : 'away';
    const teamId = teamData.team?.id;
    const teamName = teamData.team?.name;

    if (teamData.players && Array.isArray(teamData.players)) {
      result[teamKey] = teamData.players.map(playerData => {
        const player = playerData.player || {};
        const stats = playerData.statistics?.[0] || {};
        const games = stats.games || {};
        const shots = stats.shots || {};
        const goals = stats.goals || {};
        const passes = stats.passes || {};
        const tackles = stats.tackles || {};
        const duels = stats.duels || {};
        const dribbles = stats.dribbles || {};
        const fouls = stats.fouls || {};
        const cards = stats.cards || {};
        const penalty = stats.penalty || {};

        // Calculate derived stats (API bazen 'G', 'GK' veya 'Goalkeeper' döner)
        const posStr = String(games.position || '').toUpperCase();
        const isGoalkeeper = posStr === 'G' || posStr === 'GK' || String(games.position || '').toLowerCase().includes('goalkeeper');
        const passAccuracy = passes.total > 0
          ? Math.round((passes.accuracy || 0))
          : 0;

        // Kaleci istatistikleri: API-Football farklı path'lerde dönebiliyor (goalkeeper.saves, goals.saves, saves)
        const rawSaves = stats.goalkeeper?.saves ?? stats.goals?.saves ?? stats.saves;
        const gkSaves = isGoalkeeper ? (parseInt(rawSaves, 10) || 0) : 0;
        const rawConceded = goals.conceded ?? stats.goals?.conceded;
        const gkConceded = isGoalkeeper ? (parseInt(rawConceded, 10) || 0) : 0;
        const savePct = (gkSaves + gkConceded) > 0
          ? Math.round((100 * gkSaves) / (gkSaves + gkConceded))
          : 0;

        return {
          // Player info
          id: player.id,
          name: player.name,
          photo: player.photo,
          number: games.number,
          position: games.position || 'MF',

          // Game stats
          rating: parseFloat(games.rating) || 0,
          minutesPlayed: games.minutes || 0,

          // Goals & Assists
          goals: goals.total || 0,
          assists: goals.assists || 0,

          // Shots
          shots: shots.total || 0,
          shotsOnTarget: shots.on || 0,
          shotsInsideBox: 0,

          // Passes
          totalPasses: passes.total || 0,
          passesCompleted: passes.accuracy ? Math.round((passes.total || 0) * (passes.accuracy / 100)) : 0,
          passAccuracy: passAccuracy,
          keyPasses: passes.key || 0,
          longPasses: 0,

          // Dribbling
          dribbleAttempts: dribbles.attempts || 0,
          dribbleSuccess: dribbles.success || 0,
          dispossessed: 0,

          // Defending
          tackles: tackles.total || 0,
          blocks: tackles.blocks || 0,
          interceptions: tackles.interceptions || 0,

          // Duels
          duelsTotal: duels.total || 0,
          duelsWon: duels.won || 0,
          aerialDuels: 0,
          aerialWon: 0,

          // Fouls & Cards
          foulsDrawn: fouls.drawn || 0,
          foulsCommitted: fouls.committed || 0,
          yellowCards: cards.yellow || 0,
          redCards: cards.red || 0,

          // Penalty
          penaltyWon: penalty.won || 0,
          penaltyScored: penalty.scored || 0,
          penaltyMissed: penalty.missed || 0,
          penaltySaved: penalty.saved || 0,

          // Goalkeeper specific
          isGoalkeeper: isGoalkeeper,
          saves: gkSaves,
          goalsAgainst: gkConceded,
          savePercentage: isGoalkeeper ? savePct : undefined,

          // Team info
          teamId: teamId,
          teamName: teamName
        };
      });
    }
  });

  return result;
}

// Helper: Get mock player stats for test matches
function getMockPlayerStats(matchId) {
  // Return null - actual mock data is in frontend mockTestData.ts
  // This ensures consistent behavior with real API when no data available
  return null;
}

// GET /api/matches/:id/heatmaps - Get player and team heatmaps
// Estimated from player stats and positions (real tracking data requires additional API)
router.get('/:id/heatmaps', async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id, 10);

    // Mock match check
    if (matchId === 999999 || matchId === 888001 || matchId === 888002) {
      return res.json({
        success: true,
        data: null,
        message: 'Heatmap data not available for mock matches',
        source: 'mock'
      });
    }

    // Try to get lineup data for player positions
    let lineupsData = null;
    let playersData = null;

    try {
      // Fetch lineups and player stats in parallel
      const [lineups, players] = await Promise.all([
        footballApi.getFixtureLineups(matchId).catch(() => ({ response: [] })),
        footballApi.getFixturePlayers(matchId).catch(() => ({ response: [] }))
      ]);
      lineupsData = lineups?.response || [];
      playersData = players?.response || [];
    } catch (apiError) {
      console.error(`API error fetching heatmap data for match ${matchId}:`, apiError.message);
    }

    // If no data available, return null
    if ((!lineupsData || lineupsData.length === 0) && (!playersData || playersData.length === 0)) {
      return res.json({
        success: true,
        data: null,
        message: 'Heatmap data not available for this match',
        source: 'none'
      });
    }

    // Generate estimated heatmaps from lineups + player stats
    const heatmapData = generateEstimatedHeatmaps(lineupsData, playersData);

    return res.json({
      success: true,
      data: heatmapData,
      source: 'estimated'
    });
  } catch (error) {
    console.error('Error in /matches/:id/heatmaps:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper: Generate estimated heatmaps from lineups and player stats
function generateEstimatedHeatmaps(lineupsData, playersData) {
  const result = {
    home: null,
    away: null,
    source: 'estimated'
  };

  // Process each team
  lineupsData.forEach((teamLineup, teamIndex) => {
    const teamKey = teamIndex === 0 ? 'home' : 'away';
    const teamId = teamLineup.team?.id;
    const teamName = teamLineup.team?.name;
    const formation = teamLineup.formation || '4-3-3';

    // Find matching player stats
    const teamPlayerStats = playersData.find(p => p.team?.id === teamId)?.players || [];

    // Generate player heatmaps
    const playerHeatmaps = [];

    // Process starting XI
    const startXI = teamLineup.startXI || [];
    startXI.forEach(playerEntry => {
      const player = playerEntry.player || {};
      const playerId = player.id;
      const playerName = player.name;
      const position = player.pos || player.position || 'M';
      const gridPos = player.grid; // e.g., "1:1", "2:3"

      // Find player stats
      const playerStat = teamPlayerStats.find(p => p.player?.id === playerId);
      const stats = playerStat?.statistics?.[0] || {};

      // Generate heatmap points based on position and stats
      const points = generatePlayerHeatPoints(position, gridPos, stats, teamIndex === 0);

      // Calculate zone percentages
      const zones = calculatePlayerZones(position, stats);

      playerHeatmaps.push({
        playerId,
        playerName,
        position,
        points,
        zones
      });
    });

    // Calculate aggregated team zones
    const aggregatedZones = calculateTeamZones(playerHeatmaps, formation);

    result[teamKey] = {
      teamId,
      teamName,
      isHome: teamIndex === 0,
      players: playerHeatmaps,
      aggregatedZones
    };
  });

  return result;
}

// Helper: Generate heat points for a player based on position and stats
function generatePlayerHeatPoints(position, gridPos, stats, isHomeTeam) {
  const points = [];
  const pos = (position || 'M').toUpperCase();
  const isGK = pos === 'G' || pos === 'GK' || String(position || '').toLowerCase().includes('goalkeeper');

  // Goalkeeper: gerçekçi ısı haritası – ceza sahasında dağınık noktalar, kale çizgisine yakın yoğun, dışarı doğru yumuşak geçiş
  if (isGK) {
    const centerX = 50;
    const penaltyDepth = 18;   // ceza sahası derinliği (%)
    const boxWidth = 52;       // x: 24-76
    const goalLineHome = 3;
    const goalLineAway = 97;
    const numPoints = 140;     // grid değil, dağınık nokta sayısı

    for (let i = 0; i < numPoints; i++) {
      // Ceza sahası içinde rastgele konum (biraz 6 yard kutusu ağırlıklı)
      const x = 24 + Math.random() * 52;
      const yRel = Math.random() * penaltyDepth;
      const y = isHomeTeam ? goalLineHome + yRel : goalLineAway - yRel;

      // Kale çizgisine yakın = daha sıcak; merkeze (x=50) yakın hafif fazla
      const distFromGoal = yRel / penaltyDepth;  // 0 = kale, 1 = ceza noktası
      const centerBias = 1 - 0.25 * Math.abs(x - centerX) / (boxWidth / 2);
      let intensity = (1 - distFromGoal * 0.85) * centerBias;
      intensity = Math.max(0.12, Math.min(0.98, intensity + (Math.random() - 0.5) * 0.15));
      points.push({ x, y, intensity, type: 'position' });
    }
    return points;
  }

  // Base position from grid (e.g., "2:3" = row 2, column 3)
  let baseX = 50;
  let baseY = 50;

  if (gridPos) {
    const [row, col] = gridPos.split(':').map(Number);
    baseY = (row / 5) * 100;
    baseX = (col / 5) * 100;
  }

  const positionAdjustments = {
    'D': { baseY: 20, spreadX: 25, spreadY: 15 },
    'M': { baseY: 50, spreadX: 30, spreadY: 25 },
    'F': { baseY: 80, spreadX: 20, spreadY: 15 }
  };

  const adj = positionAdjustments[pos] || positionAdjustments['M'];

  points.push({
    x: baseX,
    y: isHomeTeam ? adj.baseY : (100 - adj.baseY),
    intensity: 0.9,
    type: 'position'
  });

  const passActivity = (stats.passes?.total || 0) / 100;
  const tackleActivity = (stats.tackles?.total || 0) / 10;
  const shotActivity = (stats.shots?.total || 0) / 5;

  if (passActivity > 0) {
    points.push({
      x: baseX + (Math.random() - 0.5) * adj.spreadX,
      y: isHomeTeam ? adj.baseY + (Math.random() * adj.spreadY) : (100 - adj.baseY - Math.random() * adj.spreadY),
      intensity: Math.min(0.7, passActivity),
      type: 'pass'
    });
  }

  if (tackleActivity > 0 && pos !== 'F') {
    points.push({
      x: baseX + (Math.random() - 0.5) * adj.spreadX,
      y: isHomeTeam ? adj.baseY - (Math.random() * 10) : (100 - adj.baseY + Math.random() * 10),
      intensity: Math.min(0.6, tackleActivity),
      type: 'tackle'
    });
  }

  if (shotActivity > 0 && pos !== 'D') {
    points.push({
      x: baseX + (Math.random() - 0.5) * 15,
      y: isHomeTeam ? 85 + Math.random() * 10 : 5 + Math.random() * 10,
      intensity: Math.min(0.8, shotActivity),
      type: 'shot'
    });
  }

  return points;
}

// Helper: Activity weight from API-Football stats (passes, shots, tackles, duels)
// So high-involvement players count more in team heatmap
function playerActivityWeight(stats) {
  const passes = Number(stats.passes?.total) || 0;
  const tackles = Number(stats.tackles?.total) || 0;
  const shots = Number(stats.shots?.total) || 0;
  const duelsTotal = Number(stats.duels?.total) || 0;
  const duelsWon = Number(stats.duels?.won) || 0;
  const minutes = Number(stats.games?.minutes) || 90;
  const scale = Math.min(1, minutes / 90);
  const raw = (passes / 60) * 0.35 + (tackles / 5) * 0.25 + (shots / 2) * 0.2 + (Math.max(duelsTotal, duelsWon) / 12) * 0.2;
  const weight = 0.4 + 0.6 * Math.min(1, raw);
  return scale * weight;
}

// Helper: Calculate player zone contributions (9 zones), weighted by position + API stats
function calculatePlayerZones(position, stats) {
  const pos = (position || 'M').toUpperCase();
  const isGK = pos === 'G' || pos === 'GK' || String(position || '').toLowerCase().includes('goalkeeper');

  const zoneTemplates = {
    'G': { defense: 95, midfield: 5, attack: 0, left: 20, center: 60, right: 20 },
    'D': { defense: 70, midfield: 25, attack: 5, left: 30, center: 40, right: 30 },
    'M': { defense: 20, midfield: 60, attack: 20, left: 30, center: 40, right: 30 },
    'F': { defense: 5, midfield: 30, attack: 65, left: 25, center: 50, right: 25 }
  };

  const template = zoneTemplates[isGK ? 'G' : pos] || zoneTemplates['M'];
  const w = playerActivityWeight(stats || {});

  const dL = template.defense * (template.left / 100) * w;
  const dC = template.defense * (template.center / 100) * w;
  const dR = template.defense * (template.right / 100) * w;
  const mL = template.midfield * (template.left / 100) * w;
  const mC = template.midfield * (template.center / 100) * w;
  const mR = template.midfield * (template.right / 100) * w;
  const aL = template.attack * (template.left / 100) * w;
  const aC = template.attack * (template.center / 100) * w;
  const aR = template.attack * (template.right / 100) * w;

  return {
    defenseLeft: dL,
    defenseCenter: dC,
    defenseRight: dR,
    midfieldLeft: mL,
    midfieldCenter: mC,
    midfieldRight: mR,
    attackLeft: aL,
    attackCenter: aC,
    attackRight: aR
  };
}

// Helper: Aggregate team zones from all players' zone contributions (API-Football driven)
function calculateTeamZones(playerHeatmaps, formation) {
  const fallback = () => {
    const zones = { defense: 33, midfield: 34, attack: 33, leftFlank: 30, center: 40, rightFlank: 30 };
    const parts = formation.split('-').map(Number);
    if (parts.length >= 3) {
      const [def, mid, att] = parts;
      const total = def + mid + att;
      zones.defense = Math.round((def / total) * 100);
      zones.midfield = Math.round((mid / total) * 100);
      zones.attack = Math.round((att / total) * 100);
    }
    return zones;
  };

  if (!Array.isArray(playerHeatmaps) || playerHeatmaps.length === 0) return fallback();

  let defense = 0, midfield = 0, attack = 0;
  let leftFlank = 0, center = 0, rightFlank = 0;

  for (const p of playerHeatmaps) {
    const z = p.zones || {};
    defense += (z.defenseLeft || 0) + (z.defenseCenter || 0) + (z.defenseRight || 0);
    midfield += (z.midfieldLeft || 0) + (z.midfieldCenter || 0) + (z.midfieldRight || 0);
    attack += (z.attackLeft || 0) + (z.attackCenter || 0) + (z.attackRight || 0);
    leftFlank += (z.defenseLeft || 0) + (z.midfieldLeft || 0) + (z.attackLeft || 0);
    center += (z.defenseCenter || 0) + (z.midfieldCenter || 0) + (z.attackCenter || 0);
    rightFlank += (z.defenseRight || 0) + (z.midfieldRight || 0) + (z.attackRight || 0);
  }

  const totalV = defense + midfield + attack;
  const totalH = leftFlank + center + rightFlank;
  if (totalV < 1e-6 || totalH < 1e-6) return fallback();

  return {
    defense: Math.round((defense / totalV) * 100),
    midfield: Math.round((midfield / totalV) * 100),
    attack: Math.round((attack / totalV) * 100),
    leftFlank: Math.round((leftFlank / totalH) * 100),
    center: Math.round((center / totalH) * 100),
    rightFlank: Math.round((rightFlank / totalH) * 100)
  };
}

// GET /api/matches/:id/prediction-data - Get prediction data from API-Football
router.get('/:id/prediction-data', async (req, res) => {
  try {
    const { id } = req.params;
    
    // API-Football'dan statistics ve events çek
    const [statsData, eventsData] = await Promise.all([
      footballApi.getFixtureStatistics(id).catch(() => ({ response: [] })),
      footballApi.getFixtureEvents(id).catch(() => ({ response: [] })),
    ]);
    
    const statistics = statsData.response || [];
    const events = eventsData.response || [];
    
    // Statistics'ten verileri çıkar
    const homeStats = statistics.find(s => s.team?.id) || {};
    const awayStats = statistics.find(s => s.team?.id && s.team.id !== homeStats.team?.id) || {};
    
    const getStatValue = (stats, type) => {
      const stat = stats.statistics?.find(s => s.type === type);
      return stat ? parseInt(stat.value) || 0 : 0;
    };
    
    // Events'ten verileri çıkar
    const goals = events.filter(e => e.type === 'Goal');
    const yellowCards = events.filter(e => e.type === 'Card' && e.detail === 'Yellow Card');
    const redCards = events.filter(e => e.type === 'Card' && e.detail === 'Red Card');
    const firstGoal = goals.length > 0 ? goals[0] : null;
    
    // Prediction data'yı oluştur
    const predictionData = {
      // Cards
      yellowCards: {
        home: getStatValue(homeStats, 'Yellow Cards'),
        away: getStatValue(awayStats, 'Yellow Cards'),
        total: yellowCards.length,
      },
      redCards: {
        home: getStatValue(homeStats, 'Red Cards'),
        away: getStatValue(awayStats, 'Red Cards'),
        total: redCards.length,
      },
      
      // Possession
      possession: {
        home: getStatValue(homeStats, 'Ball Possession'),
        away: getStatValue(awayStats, 'Ball Possession'),
      },
      
      // Shots
      totalShots: {
        home: getStatValue(homeStats, 'Total Shots'),
        away: getStatValue(awayStats, 'Total Shots'),
        total: getStatValue(homeStats, 'Total Shots') + getStatValue(awayStats, 'Total Shots'),
      },
      shotsOnTarget: {
        home: getStatValue(homeStats, 'Shots on Goal'),
        away: getStatValue(awayStats, 'Shots on Goal'),
        total: getStatValue(homeStats, 'Shots on Goal') + getStatValue(awayStats, 'Shots on Goal'),
      },
      
      // Corners
      corners: {
        home: getStatValue(homeStats, 'Corner Kicks'),
        away: getStatValue(awayStats, 'Corner Kicks'),
        total: getStatValue(homeStats, 'Corner Kicks') + getStatValue(awayStats, 'Corner Kicks'),
      },
      
      // First Goal Time
      firstGoalTime: firstGoal ? firstGoal.time?.elapsed : null,
      
      // Goals
      goals: {
        home: goals.filter(g => g.team?.id === homeStats.team?.id).length,
        away: goals.filter(g => g.team?.id === awayStats.team?.id).length,
        total: goals.length,
      },
    };
    
    res.json({
      success: true,
      data: predictionData,
      source: 'api',
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching prediction data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/:id/events - Get match events (goals, cards, etc.)
// ?refresh=1 ile cache atlanır
// ✅ Status-based sentetik eventler eklenir (Half Time, Match Finished)
router.get('/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const skipCache = req.query.refresh === '1' || req.query.refresh === 'true';
    
    // Paralel olarak events ve fixture details çek
    const [eventsData, fixtureData] = await Promise.all([
      footballApi.getFixtureEvents(id, skipCache),
      footballApi.getFixtureDetails(id, skipCache)
    ]);
    
    const events = eventsData.response || [];
    const fixture = fixtureData.response?.[0];
    const matchStatus = fixture?.fixture?.status?.short || '';
    const halftimeScore = fixture?.score?.halftime || { home: null, away: null };
    const fulltimeScore = fixture?.goals || { home: null, away: null };
    
    // ✅ Status-based sentetik eventler ekle (API bu eventleri vermiyor)
    const syntheticEvents = [];
    
    // Devre arası veya sonrası için "Half Time" eventi
    if (['HT', '2H', 'FT', 'AET', 'PEN'].includes(matchStatus)) {
      const hasHalfTimeEvent = events.some(e => 
        (e.detail?.toLowerCase() === 'half time' || e.detail?.toLowerCase() === 'halftime')
      );
      
      if (!hasHalfTimeEvent) {
        // Son ilk yarı eventinin uzatma dakikasını bul
        const firstHalfEvents = events.filter(e => (e.time?.elapsed || 0) <= 45);
        const maxExtra = firstHalfEvents.reduce((max, e) => Math.max(max, e.time?.extra || 0), 0);
        
        syntheticEvents.push({
          time: { elapsed: 45, extra: maxExtra > 0 ? maxExtra : null },
          type: 'status',
          detail: 'Half Time',
          team: null,
          player: null,
          assist: null,
          goals: halftimeScore,
          comments: 'İlk yarı bitiş düdüğü',
          isSynthetic: true
        });
      }
    }
    
    // Maç bitti için "Match Finished" eventi
    if (['FT', 'AET', 'PEN'].includes(matchStatus)) {
      const hasFullTimeEvent = events.some(e => 
        (e.detail?.toLowerCase() === 'match finished' || e.detail?.toLowerCase() === 'full time')
      );
      
      if (!hasFullTimeEvent) {
        // Son eventin uzatma dakikasını bul
        const secondHalfEvents = events.filter(e => (e.time?.elapsed || 0) >= 45);
        const maxExtra = secondHalfEvents.reduce((max, e) => {
          if ((e.time?.elapsed || 0) >= 90) return Math.max(max, e.time?.extra || 0);
          return max;
        }, 0);
        
        syntheticEvents.push({
          time: { elapsed: 90, extra: maxExtra > 0 ? maxExtra : 4 },
          type: 'status',
          detail: 'Match Finished',
          team: null,
          player: null,
          assist: null,
          goals: fulltimeScore,
          comments: 'Maç bitiş düdüğü',
          isSynthetic: true
        });
      }
    }
    
    // Tüm eventleri birleştir ve sırala
    const allEvents = [...events, ...syntheticEvents].sort((a, b) => {
      const aTime = (a.time?.elapsed || 0) + (a.time?.extra || 0) * 0.01;
      const bTime = (b.time?.elapsed || 0) + (b.time?.extra || 0) * 0.01;
      return aTime - bTime;
    });
    
    res.json({
      success: true,
      data: allEvents,
      status: matchStatus,
      halftimeScore,
      fulltimeScore,
      cached: eventsData.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/:id/community-stats - Topluluk tahmin istatistikleri
router.get('/:id/community-stats', async (req, res) => {
  try {
    const matchId = parseInt(req.params.id, 10);
    
    // Mock maç için özel veri
    if (matchId === 999999) {
      const { MOCK_COMMUNITY_DATA } = require('../scripts/create-mock-community-data');
      return res.json({
        success: true,
        data: MOCK_COMMUNITY_DATA,
        source: 'mock'
      });
    }
    
    // Gerçek maçlar için veritabanından topluluk verilerini çek
    // TODO: Gerçek implementasyon - predictions tablosundan istatistikler
    res.json({
      success: true,
      data: {
        totalUsers: 0,
        scorePredictions: {},
        totalGoalsPredictions: {},
        firstGoalPredictions: {},
        cardPredictions: {},
        playerPredictions: {}
      },
      source: 'database',
      message: 'Community stats not yet implemented for real matches'
    });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/matches/:id/events/live - Hybrid: DB + API, 15sn güncelleme için
// Maç henüz başlamadıysa status: NS döner
router.get('/:id/events/live', async (req, res) => {
  try {
    const matchId = parseInt(req.params.id, 10);
    if (!matchId) {
      return res.status(400).json({ success: false, error: 'Invalid match ID' });
    }

    // ✅ MOCK MATCH: ID 999999 – 52. dk, skor 5-4, ilk yarı 1 dk uzadı, 45+1 ev sahibi kırmızı kart
    if (matchId === 999999) {
      return res.json({
        success: true,
        status: '2H',
        matchNotStarted: false,
        minute: 52,
        score: { home: 5, away: 4 },
        halftimeScore: { home: 3, away: 2 },
        events: [
          { time: { elapsed: 0, extra: null }, type: 'Goal', detail: 'Kick Off', team: null, player: null, assist: null, goals: null },
          { time: { elapsed: 10, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'F. Koç' }, assist: null, goals: { home: 1, away: 0 } },
          { time: { elapsed: 20, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'Ö. Kılıç' }, assist: null, goals: { home: 1, away: 1 } },
          { time: { elapsed: 28, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'D. Aksoy' }, assist: { name: 'H. Çelik' }, goals: { home: 2, away: 1 } },
          { time: { elapsed: 35, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'Ç. Yılmaz' }, assist: null, goals: { home: 2, away: 2 } },
          { time: { elapsed: 40, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'B. Arslan' }, assist: null, goals: { home: 3, away: 2 } },
          { time: { elapsed: 45, extra: null }, type: 'Goal', detail: 'First Half Extra Time', team: null, player: null, assist: null, goals: null, comments: '1' },
          { time: { elapsed: 45, extra: 1 }, type: 'Card', detail: 'Red Card', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'C. Şahin' }, assist: null, goals: null },
          { time: { elapsed: 45, extra: 1 }, type: 'Goal', detail: 'Half Time', team: null, player: null, assist: null, goals: null },
          { time: { elapsed: 46, extra: null }, type: 'Goal', detail: 'Second Half Started', team: null, player: null, assist: null, goals: null },
          { time: { elapsed: 47, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'Ş. Aslan' }, assist: null, goals: { home: 3, away: 3 } },
          { time: { elapsed: 49, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'K. Yıldız' }, assist: { name: 'M. Özkan' }, goals: { home: 4, away: 3 } },
          { time: { elapsed: 51, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'F. Koç' }, assist: null, goals: { home: 5, away: 3 } },
          { time: { elapsed: 52, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'İ. Koç' }, assist: { name: 'G. Bayrak' }, goals: { home: 5, away: 4 } },
        ],
        source: 'mock'
      });
    }

    // 1. Maç durumunu al (DB veya API)
    let matchStatus = 'NS';
    let matchMinute = 0;
    let score = { home: 0, away: 0 };
    let halftimeScore = { home: 0, away: 0 };

    let dbMatch = null;
    if (supabase) {
      const r = await supabase.from('matches')
        .select('status, elapsed, home_score, away_score, halftime_home, halftime_away')
        .eq('id', matchId)
        .single();
      dbMatch = r.data;
    }

    if (dbMatch) {
      matchStatus = dbMatch.status || 'NS';
      matchMinute = dbMatch.elapsed || 0;
      score = { home: dbMatch.home_score || 0, away: dbMatch.away_score || 0 };
      halftimeScore = { home: dbMatch.halftime_home || 0, away: dbMatch.halftime_away || 0 };
    }

    // Maç henüz başlamadıysa hemen dön
    if (matchStatus === 'NS' || matchStatus === 'TBD' || matchStatus === 'PST') {
      return res.json({
        success: true,
        status: matchStatus,
        matchNotStarted: true,
        events: [],
        minute: 0,
        score,
        halftimeScore,
      });
    }

    // 2. Önce DB'den eventleri al (match_events veya match_timeline)
    let events = [];
    if (supabase) {
      // Önce match_events'i kontrol et (mock maçlar için)
      const { data: matchEvents } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', matchId)
        .order('elapsed', { ascending: true });

      if (matchEvents && matchEvents.length > 0) {
        // Takım isimlerini al
        const teamIds = [...new Set(matchEvents.map(e => e.team_id).filter(Boolean))];
        const teamMap = new Map();
        if (teamIds.length > 0) {
          const { data: teams } = await supabase
            .from('teams')
            .select('id, name')
            .in('id', teamIds);
          if (teams) {
            teams.forEach(t => teamMap.set(t.id, t.name));
          }
        }

        // match_events formatını API formatına çevir
        events = matchEvents.map(e => ({
          time: { elapsed: e.elapsed, extra: e.elapsed_plus || null },
          type: e.type === 'Card' ? 'Card' : e.type === 'Goal' ? 'Goal' : e.type === 'subst' ? 'subst' : e.type,
          detail: e.detail || null,
          team: e.team_id ? { id: e.team_id, name: teamMap.get(e.team_id) || 'Team' } : null,
          player: e.player_name ? { name: e.player_name } : null,
          assist: e.assist_name ? { name: e.assist_name } : null,
          comments: e.comments || null
        }));
      } else {
        // match_timeline'ı kontrol et
        const { data: dbEvents } = await supabase
          .from('match_timeline')
          .select('*')
          .eq('match_id', matchId)
          .order('elapsed', { ascending: true })
          .order('elapsed_extra', { ascending: true });

        if (dbEvents && dbEvents.length > 0) {
          events = dbEvents.map(e => ({
            time: { elapsed: e.elapsed, extra: e.elapsed_extra },
            type: e.event_type,
            detail: e.event_detail,
            team: e.team_id ? { id: e.team_id, name: e.team_name } : null,
            player: e.player_id ? { id: e.player_id, name: e.player_name } : null,
            assist: e.assist_id ? { id: e.assist_id, name: e.assist_name } : null,
            goals: { home: e.score_home, away: e.score_away },
            comments: e.comments,
          }));
        }
      }
    }

    // 3. Canlı maçlarda API'den güncel veri çek ve DB'ye yaz (mock maçlar hariç)
    // ✅ Canlı maçta her zaman taze event çek (skipCache=true) – güncelleme gecikmesini önler
    const skipCache = req.query.refresh === '1' || req.query.refresh === 'true';
    const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT'].includes(matchStatus);
    const isMockMatch = matchId === 999999; // Mock maç için API çağrısı yapma
    const forceFreshForLive = isLive && !isMockMatch; // Canlı maçta cache atla
    if (isLive && !isMockMatch) {
      try {
        const [fixtureData, eventsData] = await Promise.all([
          footballApi.getFixtureDetails(matchId, skipCache || forceFreshForLive),
          footballApi.getFixtureEvents(matchId, skipCache || forceFreshForLive),  // ✅ Canlıda her zaman taze
        ]);
        const apiMatch = fixtureData?.response?.[0];
        const apiEvents = eventsData?.response || [];

        if (apiMatch) {
          matchStatus = apiMatch.fixture?.status?.short || matchStatus;
          matchMinute = apiMatch.fixture?.status?.elapsed || matchMinute;
          score = { home: apiMatch.goals?.home || 0, away: apiMatch.goals?.away || 0 };
          halftimeScore = apiMatch.score?.halftime || halftimeScore;
        }

        if (apiEvents.length > 0) {
          const timelineService = require('../services/timelineService');
          const mergedMatch = {
            fixture: apiMatch?.fixture || { id: matchId, status: { short: matchStatus, elapsed: matchMinute } },
            events: apiEvents,
            goals: score,
            teams: apiMatch?.teams || {},
          };
          await timelineService.saveMatchEvents(mergedMatch);
          events = apiEvents.map(e => ({
            time: e.time || {},
            type: e.type,
            detail: e.detail,
            team: e.team,
            player: e.player,
            assist: e.assist,
            goals: e.goals || {},
            comments: e.comments,
          }));
        }
      } catch (apiErr) {
        console.warn('Live events API fallback failed:', apiErr?.message);
      }
    }

    // ✅ Status-based sentetik eventler ekle (API bu eventleri vermiyor)
    // Half Time, Match Finished gibi eventler API'nin fixture.status alanından geliyor
    // Bu bilgileri events listesine sentetik event olarak ekliyoruz
    const syntheticEvents = [];
    
    // ✅ Devre arası (HT) veya ikinci yarı/maç bitti durumunda "Half Time" eventi ekle
    if (['HT', '2H', 'FT', 'AET', 'PEN'].includes(matchStatus)) {
      // İlk yarı bitti eventi - 45. dakikada (veya son ilk yarı eventi dakikasında)
      const firstHalfEvents = events.filter(e => (e.time?.elapsed || 0) <= 45);
      const lastFirstHalfEvent = firstHalfEvents.length > 0 
        ? firstHalfEvents.reduce((max, e) => (e.time?.elapsed || 0) > (max.time?.elapsed || 0) ? e : max, firstHalfEvents[0])
        : null;
      const htMinute = lastFirstHalfEvent?.time?.elapsed || 45;
      const htExtra = lastFirstHalfEvent?.time?.extra || 0;
      
      // Zaten Half Time eventi var mı kontrol et
      const hasHalfTimeEvent = events.some(e => 
        (e.detail?.toLowerCase() === 'half time' || e.detail?.toLowerCase() === 'halftime') ||
        (e.type?.toLowerCase() === 'halftime')
      );
      
      if (!hasHalfTimeEvent) {
        syntheticEvents.push({
          time: { elapsed: 45, extra: htExtra > 0 ? htExtra : null },
          type: 'status',
          detail: 'Half Time',
          team: null,
          player: null,
          assist: null,
          goals: halftimeScore,
          comments: 'Sentetik event - maç durumundan oluşturuldu',
          isSynthetic: true
        });
      }
    }
    
    // ✅ Maç bitti (FT/AET/PEN) durumunda "Match Finished" eventi ekle
    if (['FT', 'AET', 'PEN'].includes(matchStatus)) {
      // Son event dakikasını bul
      const lastEvent = events.length > 0 
        ? events.reduce((max, e) => (e.time?.elapsed || 0) > (max.time?.elapsed || 0) ? e : max, events[0])
        : null;
      const ftMinute = lastEvent?.time?.elapsed || 90;
      const ftExtra = lastEvent?.time?.extra || 0;
      
      // Zaten Match Finished eventi var mı kontrol et
      const hasFullTimeEvent = events.some(e => 
        (e.detail?.toLowerCase() === 'match finished' || e.detail?.toLowerCase() === 'full time') ||
        (e.type?.toLowerCase() === 'fulltime')
      );
      
      if (!hasFullTimeEvent) {
        syntheticEvents.push({
          time: { elapsed: 90, extra: ftExtra > 0 ? ftExtra : 4 }, // Varsayılan +4 dk uzatma
          type: 'status',
          detail: 'Match Finished',
          team: null,
          player: null,
          assist: null,
          goals: score,
          comments: 'Sentetik event - maç durumundan oluşturuldu',
          isSynthetic: true
        });
      }
    }
    
    // ✅ Sentetik eventleri ana listeye ekle
    let allEvents = [...events, ...syntheticEvents];
    // ✅ Tekrarlayan kart eventlerini kaldır (aynı oyuncu + aynı renk, 2 dk içinde)
    allEvents = allEvents.sort((a, b) => {
      const at = (a.time?.elapsed || 0) + (a.time?.extra || 0) * 0.01;
      const bt = (b.time?.elapsed || 0) + (b.time?.extra || 0) * 0.01;
      return at - bt;
    }).filter((e, i, arr) => {
      const type = (e.type || '').toLowerCase();
      const detail = (e.detail || '').toLowerCase();
      if (type !== 'card' || !e.player) return true;
      const playerKey = String(e.player?.id ?? e.player?.name ?? '').trim();
      const color = detail.includes('red') ? 'red' : 'yellow';
      const t = (e.time?.elapsed || 0) + (e.time?.extra || 0) * 0.01;
      let duplicate = false;
      for (let j = i - 1; j >= 0; j--) {
        const prev = arr[j];
        const pt = (prev.time?.elapsed || 0) + (prev.time?.extra || 0) * 0.01;
        if (t - pt > 2.01) break;
        if ((prev.type || '').toLowerCase() !== 'card' || !prev.player) continue;
        const pKey = String(prev.player?.id ?? prev.player?.name ?? '').trim();
        const pColor = (prev.detail || '').toLowerCase().includes('red') ? 'red' : 'yellow';
        if (pKey === playerKey && pColor === color) {
          duplicate = true;
          break;
        }
      }
      return !duplicate;
    });
    // Kronolojik sırayı koru
    allEvents.sort((a, b) => {
      const at = (a.time?.elapsed || 0) + (a.time?.extra || 0) * 0.01;
      const bt = (b.time?.elapsed || 0) + (b.time?.extra || 0) * 0.01;
      return at - bt;
    });

    res.json({
      success: true,
      status: matchStatus,
      matchNotStarted: false,
      events: allEvents,
      minute: matchMinute,
      score,
      halftimeScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Helper: fixtures/players yanıtından sentetik lineups üret (lineups API boş döndüğünde fallback)
const GRID_433 = ['1:1', '2:1', '2:2', '2:3', '2:4', '3:1', '3:2', '3:3', '4:1', '4:2', '4:3'];
function positionOrder(pos) {
  const p = (pos || '').toUpperCase();
  if (p === 'G' || p === 'GK') return 0;
  if (p.startsWith('D') || p === 'CB' || p === 'LB' || p === 'RB' || p === 'LWB' || p === 'RWB') return 1;
  if (p.startsWith('M') || p === 'CM' || p === 'CDM' || p === 'CAM' || p === 'LM' || p === 'RM') return 2;
  return 3; // F, FW, ST, etc.
}
function buildLineupsFromFixturePlayers(playersApiResponse) {
  if (!playersApiResponse || !Array.isArray(playersApiResponse) || playersApiResponse.length < 2) return null;
  const result = [];
  for (const teamData of playersApiResponse) {
    const teamId = teamData.team?.id;
    const teamName = teamData.team?.name;
    if (!teamId || !teamData.players || !Array.isArray(teamData.players)) continue;
    const withStats = teamData.players
      .map((p) => {
        const player = p.player || {};
        const stats = p.statistics?.[0] || {};
        const games = stats.games || {};
        const pos = (games.position || player.position || 'M').toString().toUpperCase();
        const num = games.number != null ? games.number : player.number;
        const minutes = parseInt(games.minutes, 10) || 0;
        const rating = parseFloat(games.rating) || null;
        return { player, pos, num, minutes, rating };
      })
      .filter((x) => x.player && x.player.id);
    const sorted = withStats.sort((a, b) => {
      const orderA = positionOrder(a.pos);
      const orderB = positionOrder(b.pos);
      if (orderA !== orderB) return orderA - orderB;
      return (b.minutes || 0) - (a.minutes || 0);
    });
    const startXI = sorted.slice(0, 11).map((item, idx) => ({
      player: {
        id: item.player.id,
        name: item.player.name || 'Unknown',
        number: item.num != null ? item.num : idx + 1,
        pos: item.pos || 'M',
        grid: GRID_433[idx] || '2:2',
        rating: item.rating != null ? item.rating : 75,
      },
    }));
    if (startXI.length < 11) continue;
    const substitutes = sorted.slice(11).map((item, idx) => ({
      player: {
        id: item.player.id,
        name: item.player.name || 'Unknown',
        number: item.num != null ? item.num : 12 + idx,
        pos: item.pos || 'M',
        grid: null,
        rating: item.rating != null ? item.rating : 75,
      },
    }));
    result.push({
      team: { id: teamId, name: teamName },
      formation: '4-3-3',
      startXI,
      substitutes,
    });
  }
  return result.length >= 2 ? result : null;
}

// Helper: Takım kadrolarından (players/squads) sentetik ilk 11 – 1 GK, 4 DEF, 3 MID, 3 FWD
function squadPlayerPosOrder(p) {
  const pos = (p.position || '').toString().toLowerCase();
  if (pos === 'goalkeeper' || pos === 'g' || pos === 'gk') return 0;
  if (pos.includes('defender') || pos === 'd' || pos === 'cb' || pos === 'lb' || pos === 'rb' || pos === 'lwb' || pos === 'rwb') return 1;
  if (pos.includes('midfielder') || pos === 'm' || pos === 'cm' || pos === 'cdm' || pos === 'cam' || pos === 'lm' || pos === 'rm') return 2;
  return 3;
}
function buildLineupsFromTeamSquads(homeSquadData, awaySquadData, homeTeamId, homeTeamName, awayTeamId, awayTeamName) {
  const posChar = (p) => {
    const pos = (p.position || 'M').toString().toLowerCase();
    if (pos.startsWith('g') || pos === 'goalkeeper') return 'G';
    if (pos.startsWith('d') || pos.includes('defender')) return 'D';
    if (pos.startsWith('m') || pos.includes('midfielder')) return 'M';
    if (pos.startsWith('a') || pos.startsWith('f') || pos.includes('forward') || pos.includes('attacker')) return 'F';
    return 'M';
  };
  const buildOne = (squadData, teamId, teamName) => {
    const players = squadData?.players || squadData?.response?.[0]?.players;
    if (!players || !Array.isArray(players) || players.length < 11) return null;
    const sorted = [...players].sort((a, b) => squadPlayerPosOrder(a) - squadPlayerPosOrder(b));
    const gk = sorted.filter(p => squadPlayerPosOrder(p) === 0);
    const def = sorted.filter(p => squadPlayerPosOrder(p) === 1);
    const mid = sorted.filter(p => squadPlayerPosOrder(p) === 2);
    const fwd = sorted.filter(p => squadPlayerPosOrder(p) === 3);
    const pick = [
      ...(gk.slice(0, 1)),
      ...(def.slice(0, 4)),
      ...(mid.slice(0, 3)),
      ...(fwd.slice(0, 3)),
    ];
    if (pick.length < 11) return null;
    const startXI = pick.slice(0, 11).map((pl, idx) => ({
      player: {
        id: pl.id,
        name: pl.name || 'Unknown',
        number: pl.number != null ? pl.number : idx + 1,
        pos: posChar(pl),
        grid: GRID_433[idx] || '2:2',
        rating: pl.rating != null ? pl.rating : 75,
      },
    }));
    const subs = sorted.slice(11, 18);
    const substitutes = subs.map((pl, idx) => ({
      player: {
        id: pl.id,
        name: pl.name || 'Unknown',
        number: pl.number != null ? pl.number : 12 + idx,
        pos: posChar(pl),
        grid: null,
        rating: pl.rating != null ? pl.rating : 75,
      },
    }));
    return { team: { id: teamId, name: teamName }, formation: '4-3-3', startXI, substitutes };
  };
  const homeLineup = buildOne(homeSquadData, homeTeamId, homeTeamName);
  const awayLineup = buildOne(awaySquadData, awayTeamId, awayTeamName);
  if (!homeLineup || !awayLineup || homeLineup.startXI.length < 11 || awayLineup.startXI.length < 11) return null;
  return [homeLineup, awayLineup];
}

// GET /api/matches/:id/lineups - Get match lineups with team colors and player details
// ?refresh=1 ile DB + NodeCache atlanır, API'den taze çekilir. skipCache mutlaka getFixtureLineups'a geçirilmeli.
router.get('/:id/lineups', async (req, res) => {
  try {
    const { id } = req.params;
    const matchId = parseInt(id);
    const skipCache = req.query.refresh === '1' || req.query.refresh === 'true';
    
    // 🧪 MOCK TEST: GS vs FB (888001) ve Real vs Barça (888002) lineup
    if (matchId === 888001) {
      return res.json({
        success: true,
        data: [
          {
            team: { id: 645, name: 'Galatasaray', logo: null, colors: { primary: '#E30613', secondary: '#FDB913' } },
            coach: { id: 901, name: 'O. Buruk', photo: null },
            formation: '4-3-3',
            startXI: [
              { player: { id: 50001, name: 'F. Muslera', number: 1, pos: 'G', grid: '1:1', rating: 83, stats: { pace: 48, shooting: 28, passing: 62, dribbling: 42, defending: 88, physical: 82 } } },
              { player: { id: 50002, name: 'S. Boey', number: 20, pos: 'D', grid: '2:4', rating: 78, stats: { pace: 85, shooting: 45, passing: 68, dribbling: 62, defending: 80, physical: 78 } } },
              { player: { id: 50003, name: 'D. Nelsson', number: 4, pos: 'D', grid: '2:3', rating: 81, stats: { pace: 68, shooting: 35, passing: 65, dribbling: 52, defending: 86, physical: 84 } } },
              { player: { id: 50004, name: 'A. Bardakcı', number: 42, pos: 'D', grid: '2:2', rating: 79, stats: { pace: 65, shooting: 32, passing: 62, dribbling: 48, defending: 84, physical: 82 } } },
              { player: { id: 50005, name: 'A. Kurzawa', number: 12, pos: 'D', grid: '2:1', rating: 76, stats: { pace: 78, shooting: 42, passing: 72, dribbling: 68, defending: 78, physical: 75 } } },
              { player: { id: 50006, name: 'L. Torreira', number: 34, pos: 'M', grid: '3:3', rating: 82, stats: { pace: 72, shooting: 65, passing: 85, dribbling: 78, defending: 80, physical: 76 } } },
              { player: { id: 50007, name: 'K. Aktürkoğlu', number: 7, pos: 'M', grid: '3:2', rating: 80, stats: { pace: 88, shooting: 75, passing: 78, dribbling: 85, defending: 45, physical: 72 } } },
              { player: { id: 50008, name: 'D. Mertens', number: 14, pos: 'M', grid: '3:1', rating: 83, stats: { pace: 72, shooting: 82, passing: 86, dribbling: 84, defending: 42, physical: 65 } } },
              { player: { id: 50009, name: 'B. Yılmaz', number: 17, pos: 'F', grid: '4:3', rating: 79, stats: { pace: 85, shooting: 80, passing: 72, dribbling: 82, defending: 35, physical: 78 } } },
              { player: { id: 50010, name: 'M. Icardi', number: 9, pos: 'F', grid: '4:2', rating: 85, stats: { pace: 78, shooting: 90, passing: 68, dribbling: 82, defending: 32, physical: 82 } } },
              { player: { id: 50011, name: 'V. Osimhen', number: 45, pos: 'F', grid: '4:1', rating: 88, stats: { pace: 92, shooting: 88, passing: 65, dribbling: 84, defending: 35, physical: 85 } } },
            ],
            substitutes: [
              { player: { id: 50012, name: 'O. Bayram', number: 88, pos: 'G', grid: null, rating: 74, stats: { pace: 45, shooting: 25, passing: 58, dribbling: 38, defending: 82, physical: 78 } } },
              { player: { id: 50013, name: 'K. Seri', number: 6, pos: 'M', grid: null, rating: 77, stats: { pace: 70, shooting: 62, passing: 82, dribbling: 76, defending: 72, physical: 74 } } },
              { player: { id: 50014, name: 'Y. Bakasetas', number: 10, pos: 'M', grid: null, rating: 76, stats: { pace: 68, shooting: 78, passing: 80, dribbling: 75, defending: 48, physical: 70 } } },
              { player: { id: 50015, name: 'E. Kılınç', number: 11, pos: 'F', grid: null, rating: 75, stats: { pace: 82, shooting: 72, passing: 70, dribbling: 78, defending: 38, physical: 72 } } },
              { player: { id: 50016, name: 'H. Dervişoğlu', number: 99, pos: 'F', grid: null, rating: 74, stats: { pace: 80, shooting: 75, passing: 68, dribbling: 76, defending: 35, physical: 70 } } },
            ],
          },
          {
            team: { id: 611, name: 'Fenerbahçe', logo: null, colors: { primary: '#FFED00', secondary: '#00205B' } },
            coach: { id: 902, name: 'D. Tedesco', photo: null },
            formation: '4-3-3',
            startXI: [
              { player: { id: 50101, name: 'D. Livakovic', number: 1, pos: 'G', grid: '1:1', rating: 84, stats: { pace: 48, shooting: 28, passing: 60, dribbling: 40, defending: 88, physical: 84 } } },
              { player: { id: 50102, name: 'B. Osayi-Samuel', number: 2, pos: 'D', grid: '2:4', rating: 78, stats: { pace: 90, shooting: 52, passing: 68, dribbling: 72, defending: 76, physical: 80 } } },
              { player: { id: 50103, name: 'A. Djiku', number: 4, pos: 'D', grid: '2:3', rating: 80, stats: { pace: 72, shooting: 35, passing: 62, dribbling: 50, defending: 85, physical: 84 } } },
              { player: { id: 50104, name: 'Ç. Söyüncü', number: 3, pos: 'D', grid: '2:2', rating: 79, stats: { pace: 78, shooting: 38, passing: 65, dribbling: 52, defending: 84, physical: 82 } } },
              { player: { id: 50105, name: 'F. Kadıoğlu', number: 5, pos: 'D', grid: '2:1', rating: 81, stats: { pace: 85, shooting: 58, passing: 78, dribbling: 78, defending: 80, physical: 76 } } },
              { player: { id: 50106, name: 'İ. Kahveci', number: 6, pos: 'M', grid: '3:3', rating: 80, stats: { pace: 72, shooting: 82, passing: 80, dribbling: 78, defending: 55, physical: 72 } } },
              { player: { id: 50107, name: 'F. Amrabat', number: 8, pos: 'M', grid: '3:2', rating: 79, stats: { pace: 74, shooting: 58, passing: 78, dribbling: 72, defending: 82, physical: 80 } } },
              { player: { id: 50108, name: 'S. Szymanski', number: 10, pos: 'M', grid: '3:1', rating: 82, stats: { pace: 76, shooting: 78, passing: 85, dribbling: 82, defending: 48, physical: 70 } } },
              { player: { id: 50109, name: 'D. Tadic', number: 11, pos: 'F', grid: '4:3', rating: 83, stats: { pace: 72, shooting: 82, passing: 86, dribbling: 84, defending: 42, physical: 68 } } },
              { player: { id: 50110, name: 'E. Dzeko', number: 9, pos: 'F', grid: '4:2', rating: 82, stats: { pace: 68, shooting: 86, passing: 72, dribbling: 78, defending: 38, physical: 85 } } },
              { player: { id: 50111, name: 'Ç. Ünder', number: 17, pos: 'F', grid: '4:1', rating: 80, stats: { pace: 88, shooting: 80, passing: 72, dribbling: 84, defending: 35, physical: 68 } } },
            ],
            substitutes: [
              { player: { id: 50112, name: 'İ. Bayındır', number: 12, pos: 'G', grid: null, rating: 78, stats: { pace: 45, shooting: 25, passing: 55, dribbling: 38, defending: 85, physical: 80 } } },
              { player: { id: 50113, name: 'J. Oosterwolde', number: 23, pos: 'D', grid: null, rating: 76, stats: { pace: 82, shooting: 48, passing: 70, dribbling: 68, defending: 78, physical: 76 } } },
              { player: { id: 50114, name: 'M. Crespo', number: 7, pos: 'M', grid: null, rating: 75, stats: { pace: 72, shooting: 65, passing: 76, dribbling: 72, defending: 68, physical: 74 } } },
              { player: { id: 50115, name: 'R. Batshuayi', number: 20, pos: 'F', grid: null, rating: 77, stats: { pace: 80, shooting: 82, passing: 62, dribbling: 74, defending: 32, physical: 78 } } },
              { player: { id: 50116, name: 'E. Valencia', number: 18, pos: 'F', grid: null, rating: 76, stats: { pace: 85, shooting: 78, passing: 65, dribbling: 80, defending: 35, physical: 75 } } },
            ],
          },
        ],
        cached: false,
        source: 'mock-test',
      });
    }
    
    if (matchId === 888002) {
      return res.json({
        success: true,
        data: [
          {
            team: { id: 541, name: 'Real Madrid', logo: null, colors: { primary: '#FFFFFF', secondary: '#00529F' } },
            coach: { id: 903, name: 'Carlo Ancelotti', photo: null },
            formation: '4-3-3',
            startXI: [
              { player: { id: 50201, name: 'T. Courtois', number: 1, pos: 'G', grid: '1:1', rating: 89, stats: { pace: 50, shooting: 28, passing: 62, dribbling: 42, defending: 92, physical: 88 } } },
              { player: { id: 50202, name: 'D. Carvajal', number: 2, pos: 'D', grid: '2:4', rating: 85, stats: { pace: 82, shooting: 58, passing: 78, dribbling: 72, defending: 84, physical: 80 } } },
              { player: { id: 50203, name: 'A. Rüdiger', number: 22, pos: 'D', grid: '2:3', rating: 86, stats: { pace: 82, shooting: 42, passing: 65, dribbling: 55, defending: 88, physical: 88 } } },
              { player: { id: 50204, name: 'D. Alaba', number: 4, pos: 'D', grid: '2:2', rating: 84, stats: { pace: 72, shooting: 55, passing: 78, dribbling: 68, defending: 86, physical: 82 } } },
              { player: { id: 50205, name: 'F. Mendy', number: 23, pos: 'D', grid: '2:1', rating: 83, stats: { pace: 88, shooting: 48, passing: 72, dribbling: 72, defending: 82, physical: 84 } } },
              { player: { id: 50206, name: 'T. Kroos', number: 8, pos: 'M', grid: '3:3', rating: 88, stats: { pace: 55, shooting: 78, passing: 92, dribbling: 82, defending: 72, physical: 72 } } },
              { player: { id: 50207, name: 'L. Modrić', number: 10, pos: 'M', grid: '3:2', rating: 87, stats: { pace: 68, shooting: 76, passing: 90, dribbling: 88, defending: 72, physical: 68 } } },
              { player: { id: 50208, name: 'J. Bellingham', number: 5, pos: 'M', grid: '3:1', rating: 88, stats: { pace: 82, shooting: 85, passing: 82, dribbling: 85, defending: 68, physical: 82 } } },
              { player: { id: 50209, name: 'Vinícius Jr.', number: 7, pos: 'F', grid: '4:3', rating: 90, stats: { pace: 95, shooting: 82, passing: 78, dribbling: 92, defending: 32, physical: 72 } } },
              { player: { id: 50210, name: 'K. Mbappé', number: 9, pos: 'F', grid: '4:2', rating: 91, stats: { pace: 97, shooting: 90, passing: 78, dribbling: 92, defending: 35, physical: 78 } } },
              { player: { id: 50211, name: 'Rodrygo', number: 11, pos: 'F', grid: '4:1', rating: 85, stats: { pace: 88, shooting: 82, passing: 78, dribbling: 86, defending: 38, physical: 72 } } },
            ],
            substitutes: [
              { player: { id: 50212, name: 'A. Lunin', number: 13, pos: 'G', grid: null, rating: 78, stats: { pace: 48, shooting: 25, passing: 58, dribbling: 38, defending: 84, physical: 80 } } },
              { player: { id: 50213, name: 'E. Militão', number: 3, pos: 'D', grid: null, rating: 83, stats: { pace: 82, shooting: 42, passing: 62, dribbling: 55, defending: 85, physical: 85 } } },
              { player: { id: 50214, name: 'E. Camavinga', number: 12, pos: 'M', grid: null, rating: 82, stats: { pace: 80, shooting: 68, passing: 80, dribbling: 80, defending: 75, physical: 82 } } },
              { player: { id: 50215, name: 'F. Valverde', number: 15, pos: 'M', grid: null, rating: 86, stats: { pace: 88, shooting: 78, passing: 82, dribbling: 80, defending: 78, physical: 85 } } },
            ],
          },
          {
            team: { id: 529, name: 'Barcelona', logo: null, colors: { primary: '#004D98', secondary: '#A50044' } },
            coach: { id: 904, name: 'Hansi Flick', photo: null },
            formation: '4-3-3',
            startXI: [
              { player: { id: 50301, name: 'M. ter Stegen', number: 1, pos: 'G', grid: '1:1', rating: 88, stats: { pace: 48, shooting: 28, passing: 82, dribbling: 52, defending: 88, physical: 82 } } },
              { player: { id: 50302, name: 'J. Cancelo', number: 2, pos: 'D', grid: '2:4', rating: 84, stats: { pace: 82, shooting: 68, passing: 85, dribbling: 82, defending: 78, physical: 76 } } },
              { player: { id: 50303, name: 'R. Araújo', number: 4, pos: 'D', grid: '2:3', rating: 83, stats: { pace: 82, shooting: 38, passing: 62, dribbling: 52, defending: 86, physical: 88 } } },
              { player: { id: 50304, name: 'A. Christensen', number: 15, pos: 'D', grid: '2:2', rating: 80, stats: { pace: 65, shooting: 35, passing: 72, dribbling: 58, defending: 84, physical: 80 } } },
              { player: { id: 50305, name: 'A. Baldé', number: 3, pos: 'D', grid: '2:1', rating: 79, stats: { pace: 88, shooting: 52, passing: 72, dribbling: 78, defending: 76, physical: 78 } } },
              { player: { id: 50306, name: 'Pedri', number: 8, pos: 'M', grid: '3:3', rating: 87, stats: { pace: 72, shooting: 72, passing: 90, dribbling: 90, defending: 65, physical: 68 } } },
              { player: { id: 50307, name: 'F. de Jong', number: 21, pos: 'M', grid: '3:2', rating: 85, stats: { pace: 78, shooting: 68, passing: 88, dribbling: 86, defending: 72, physical: 78 } } },
              { player: { id: 50308, name: 'Gavi', number: 6, pos: 'M', grid: '3:1', rating: 82, stats: { pace: 78, shooting: 72, passing: 82, dribbling: 82, defending: 72, physical: 78 } } },
              { player: { id: 50309, name: 'L. Yamal', number: 19, pos: 'F', grid: '4:3', rating: 84, stats: { pace: 92, shooting: 78, passing: 82, dribbling: 90, defending: 32, physical: 62 } } },
              { player: { id: 50310, name: 'R. Lewandowski', number: 9, pos: 'F', grid: '4:2', rating: 88, stats: { pace: 72, shooting: 92, passing: 78, dribbling: 82, defending: 42, physical: 82 } } },
              { player: { id: 50311, name: 'Raphinha', number: 11, pos: 'F', grid: '4:1', rating: 84, stats: { pace: 88, shooting: 80, passing: 78, dribbling: 86, defending: 42, physical: 72 } } },
            ],
            substitutes: [
              { player: { id: 50312, name: 'İ. Peña', number: 13, pos: 'G', grid: null, rating: 75, stats: { pace: 45, shooting: 22, passing: 55, dribbling: 38, defending: 80, physical: 76 } } },
              { player: { id: 50313, name: 'J. Koundé', number: 23, pos: 'D', grid: null, rating: 84, stats: { pace: 85, shooting: 52, passing: 72, dribbling: 72, defending: 84, physical: 80 } } },
              { player: { id: 50314, name: 'İ. Gündoğan', number: 22, pos: 'M', grid: null, rating: 84, stats: { pace: 65, shooting: 78, passing: 86, dribbling: 82, defending: 68, physical: 72 } } },
              { player: { id: 50315, name: 'F. Torres', number: 17, pos: 'M', grid: null, rating: 80, stats: { pace: 78, shooting: 75, passing: 78, dribbling: 82, defending: 55, physical: 72 } } },
              { player: { id: 50316, name: 'A. Fati', number: 10, pos: 'F', grid: null, rating: 78, stats: { pace: 85, shooting: 80, passing: 72, dribbling: 82, defending: 32, physical: 68 } } },
            ],
          },
        ],
        cached: false,
        source: 'mock-test',
      });
    }

    // ✅ MOCK MATCH: ID 999999 için özel lineup döndür
    if (matchId === 999999) {
      return res.json({
        success: true,
        data: [
          {
            team: { id: 9999, name: 'Mock Home Team', logo: null, colors: { player: { primary: '#FF0000', number: '#FFFFFF', border: '#CC0000' }, goalkeeper: { primary: '#00FF00', number: '#000000', border: '#00CC00' } } },
            coach: { id: 101, name: 'Mock Coach A', photo: null },
            formation: '4-3-3',
            startXI: [
              { player: { id: 1000, name: 'K. Kaleci', number: 1, pos: 'G', grid: '1:1', rating: 82, stats: { pace: 48, shooting: 28, passing: 58, dribbling: 42, defending: 92, physical: 88 } } },
              { player: { id: 1010, name: 'S. Sağbek', number: 2, pos: 'D', grid: '2:4', rating: 78, stats: { pace: 82, shooting: 42, passing: 68, dribbling: 58, defending: 85, physical: 78 } } },
              { player: { id: 1011, name: 'D. Stoper1', number: 4, pos: 'D', grid: '2:3', rating: 80, stats: { pace: 65, shooting: 35, passing: 62, dribbling: 52, defending: 88, physical: 85 } } },
              { player: { id: 1012, name: 'D. Stoper2', number: 5, pos: 'D', grid: '2:2', rating: 79, stats: { pace: 62, shooting: 32, passing: 65, dribbling: 48, defending: 86, physical: 82 } } },
              { player: { id: 1013, name: 'S. Solbek', number: 3, pos: 'D', grid: '2:1', rating: 77, stats: { pace: 80, shooting: 45, passing: 72, dribbling: 68, defending: 82, physical: 75 } } },
              { player: { id: 1020, name: 'O. Sağ', number: 8, pos: 'M', grid: '3:3', rating: 81, stats: { pace: 76, shooting: 68, passing: 85, dribbling: 82, defending: 68, physical: 72 } } },
              { player: { id: 1021, name: 'O. Merkez', number: 6, pos: 'M', grid: '3:2', rating: 83, stats: { pace: 72, shooting: 62, passing: 88, dribbling: 78, defending: 75, physical: 78 } } },
              { player: { id: 1022, name: 'O. Sol', number: 10, pos: 'M', grid: '3:1', rating: 85, stats: { pace: 78, shooting: 75, passing: 90, dribbling: 88, defending: 58, physical: 68 } } },
              { player: { id: 1001, name: 'A. Yıldız', number: 7, pos: 'F', grid: '4:3', rating: 86, stats: { pace: 92, shooting: 85, passing: 78, dribbling: 90, defending: 35, physical: 68 } } },
              { player: { id: 1031, name: 'F. Santrafor', number: 9, pos: 'F', grid: '4:2', rating: 84, stats: { pace: 85, shooting: 88, passing: 68, dribbling: 82, defending: 32, physical: 80 } } },
              { player: { id: 1002, name: 'B. Öztürk', number: 11, pos: 'F', grid: '4:1', rating: 82, stats: { pace: 90, shooting: 82, passing: 72, dribbling: 85, defending: 38, physical: 72 } } }
            ],
            substitutes: [
              { player: { id: 1100, name: 'Y. Kaleci', number: 12, pos: 'G', grid: null, rating: 75, stats: { pace: 45, shooting: 25, passing: 55, dribbling: 38, defending: 85, physical: 80 } } },
              { player: { id: 1101, name: 'Y. Defans', number: 14, pos: 'D', grid: null, rating: 74, stats: { pace: 72, shooting: 38, passing: 62, dribbling: 55, defending: 78, physical: 75 } } },
              { player: { id: 1102, name: 'Y. Orta', number: 15, pos: 'M', grid: null, rating: 76, stats: { pace: 74, shooting: 65, passing: 78, dribbling: 75, defending: 62, physical: 68 } } }
            ]
          },
          {
            team: { id: 9998, name: 'Mock Away Team', logo: null, colors: { player: { primary: '#0000FF', number: '#FFFFFF', border: '#0000CC' }, goalkeeper: { primary: '#FFFF00', number: '#000000', border: '#CCCC00' } } },
            coach: { id: 102, name: 'Mock Coach B', photo: null },
            formation: '4-4-2',
            startXI: [
              { player: { id: 2000, name: 'G. Kaleci', number: 1, pos: 'G', grid: '1:1', rating: 80, stats: { pace: 45, shooting: 25, passing: 55, dribbling: 40, defending: 88, physical: 85 } } },
              { player: { id: 2010, name: 'D. Sağbek', number: 2, pos: 'D', grid: '2:4', rating: 76, stats: { pace: 78, shooting: 40, passing: 65, dribbling: 55, defending: 82, physical: 75 } } },
              { player: { id: 2011, name: 'D. Stoper1', number: 4, pos: 'D', grid: '2:3', rating: 78, stats: { pace: 62, shooting: 32, passing: 60, dribbling: 48, defending: 85, physical: 82 } } },
              { player: { id: 2012, name: 'D. Stoper2', number: 5, pos: 'D', grid: '2:2', rating: 77, stats: { pace: 60, shooting: 30, passing: 58, dribbling: 45, defending: 84, physical: 80 } } },
              { player: { id: 2013, name: 'D. Solbek', number: 3, pos: 'D', grid: '2:1', rating: 75, stats: { pace: 75, shooting: 42, passing: 68, dribbling: 62, defending: 80, physical: 72 } } },
              { player: { id: 2020, name: 'O. Sağkanat', number: 7, pos: 'M', grid: '3:4', rating: 79, stats: { pace: 85, shooting: 72, passing: 75, dribbling: 82, defending: 55, physical: 68 } } },
              { player: { id: 2002, name: 'E. Şahin', number: 8, pos: 'M', grid: '3:3', rating: 82, stats: { pace: 74, shooting: 65, passing: 86, dribbling: 80, defending: 70, physical: 75 } } },
              { player: { id: 2022, name: 'O. Merkez', number: 6, pos: 'M', grid: '3:2', rating: 80, stats: { pace: 70, shooting: 58, passing: 82, dribbling: 75, defending: 72, physical: 78 } } },
              { player: { id: 2023, name: 'O. Solkanat', number: 11, pos: 'M', grid: '3:1', rating: 78, stats: { pace: 82, shooting: 70, passing: 72, dribbling: 78, defending: 52, physical: 65 } } },
              { player: { id: 2001, name: 'M. Kaya', number: 9, pos: 'F', grid: '4:2', rating: 83, stats: { pace: 88, shooting: 85, passing: 65, dribbling: 80, defending: 30, physical: 78 } } },
              { player: { id: 2003, name: 'C. Demir', number: 10, pos: 'F', grid: '4:1', rating: 81, stats: { pace: 82, shooting: 82, passing: 75, dribbling: 85, defending: 35, physical: 72 } } }
            ],
            substitutes: [
              { player: { id: 2100, name: 'Y. Kaleci2', number: 12, pos: 'G', grid: null, rating: 73, stats: { pace: 42, shooting: 22, passing: 52, dribbling: 35, defending: 82, physical: 78 } } },
              { player: { id: 2101, name: 'Y. Defans2', number: 14, pos: 'D', grid: null, rating: 72, stats: { pace: 70, shooting: 35, passing: 58, dribbling: 52, defending: 75, physical: 72 } } }
            ]
          }
        ],
        cached: false,
        source: 'mock'
      });
    }
    
    // 1. Önce DB'den cache kontrol et (refresh=1 ise atla)
    const { data: cachedMatch, error: cacheError } = skipCache ? { data: null, error: null } : await supabase
      .from('matches')
      .select('lineups, home_team_id, away_team_id')
      .eq('id', matchId)
      .single();
    
    // Eğer DB'de lineups varsa, rating'leri players tablosundan doldurup döndür
    if (cachedMatch?.lineups && Array.isArray(cachedMatch.lineups) && cachedMatch.lineups.length > 0) {
      console.log(`✅ [Lineups] Cache hit for match ${matchId}, enriching with ratings from DB...`);
      const playerIds = [];
      for (const lineup of cachedMatch.lineups) {
        for (const item of (lineup.startXI || [])) {
          const p = item.player || item;
          if (p && p.id) playerIds.push(p.id);
        }
        for (const item of (lineup.substitutes || [])) {
          const p = item.player || item;
          if (p && p.id) playerIds.push(p.id);
        }
      }
      let ratingsMap = {};
      if (playerIds.length > 0) {
        try {
          const { data: playersRows } = await supabase
            .from('players')
            .select('id, rating')
            .in('id', [...new Set(playerIds)]);
          if (playersRows) {
            ratingsMap = playersRows.reduce((acc, row) => {
              if (row.rating != null) acc[row.id] = row.rating;
              return acc;
            }, {});
          }
        } catch (e) {
          console.warn('⚠️ [Lineups] Failed to fetch ratings for cached lineups:', e.message);
        }
      }
      const displayRatingsMap = await getDisplayRatingsMap(playerIds, ratingsMap, supabase);
      const applyRating = (list) => (list || []).map((item) => {
        const p = item.player || item;
        const id = p && p.id;
        const dbRating = id ? (displayRatingsMap.get(id) ?? ratingsMap[id]) : null;
        const raw = dbRating != null ? dbRating : (p && (p.rating != null && p.rating !== undefined) ? p.rating : 75);
        const rating = Math.round(Number(raw)) || 75;
        const positionStr = p && (p.position || p.pos) || '';
        const stats = derivePlayerStats(rating, positionStr);
        if (item.player) {
          return { ...item, player: { ...item.player, rating, stats } };
        }
        return { ...item, rating, stats };
      });
      const enrichedCached = cachedMatch.lineups.map((lineup) => ({
        ...lineup,
        startXI: applyRating(lineup.startXI),
        substitutes: applyRating(lineup.substitutes),
      }));
      return res.json({
        success: true,
        data: enrichedCached,
        cached: true,
        source: 'database',
      });
    }
    
    // 2. API'den çek (refresh=1 ise NodeCache atlanır, API'ye gerçekten tekrar istek gider)
    console.log(`📡 [Lineups] Fetching from API for match ${matchId}${skipCache ? ' (refresh=1, cache bypass)' : ''}`);
    let data = await footballApi.getFixtureLineups(matchId, skipCache);

    // 2b. Fallback: lineups boşsa fixtures/players ile ilk 11 türet
    if (!data.response || data.response.length === 0) {
      try {
        const playersData = await footballApi.getFixturePlayers(matchId, skipCache);
        if (playersData?.response && playersData.response.length >= 2) {
          const built = buildLineupsFromFixturePlayers(playersData.response);
          if (built && built.length >= 2 && built.every(l => l.startXI && l.startXI.length >= 11)) {
            console.log(`📋 [Lineups] Fallback: fixtures/players ile ilk 11 türetildi (match ${matchId})`);
            data = { response: built };
          }
        }
      } catch (e) {
        console.warn('⚠️ [Lineups] Fallback fixtures/players failed:', e.message);
      }
    }

    // 2c. Fallback: Hâlâ boşsa takım kadrolarından (players/squads) sentetik ilk 11
    if (!data.response || data.response.length === 0) {
      try {
        let homeTeamId = cachedMatch?.home_team_id;
        let awayTeamId = cachedMatch?.away_team_id;
        if ((!homeTeamId || !awayTeamId) && skipCache) {
          const fixtureRes = await footballApi.getFixtureDetails(matchId, true);
          const fixture = fixtureRes?.response?.[0];
          if (fixture?.teams?.home?.id) homeTeamId = fixture.teams.home.id;
          if (fixture?.teams?.away?.id) awayTeamId = fixture.teams.away.id;
        }
        if (!homeTeamId || !awayTeamId) {
          const { data: matchRow } = await supabase.from('matches').select('home_team_id, away_team_id').eq('id', matchId).single();
          if (matchRow) {
            homeTeamId = homeTeamId || matchRow.home_team_id;
            awayTeamId = awayTeamId || matchRow.away_team_id;
          }
        }
        if (homeTeamId && awayTeamId) {
          const season = new Date().getFullYear();
          const [homeSquad, awaySquad] = await Promise.all([
            footballApi.getTeamSquad(homeTeamId, season, true).catch(() => ({ response: [] })),
            footballApi.getTeamSquad(awayTeamId, season, true).catch(() => ({ response: [] })),
          ]);
          const homeData = homeSquad?.response?.[0];
          const awayData = awaySquad?.response?.[0];
          const homeName = homeData?.team?.name || 'Home';
          const awayName = awayData?.team?.name || 'Away';
          const built = buildLineupsFromTeamSquads(homeData, awayData, homeTeamId, homeName, awayTeamId, awayName);
          if (built && built.length >= 2) {
            console.log(`📋 [Lineups] Fallback: takım kadrolarından ilk 11 türetildi (match ${matchId})`);
            data = { response: built };
          }
        }
      } catch (e) {
        console.warn('⚠️ [Lineups] Fallback team squads failed:', e.message);
      }
    }

    if (!data.response || data.response.length === 0) {
      return res.json({
        success: true,
        data: [],
        cached: false,
        message: 'Lineups not available yet',
      });
    }
    
    // ✅ Fallback renk listesi (static_teams'de yoksa)
    const FALLBACK_COLORS = {
      // Türkiye
      611: ['#FFED00', '#00205B'], // Fenerbahçe
      645: ['#E30613', '#FDB913'], // Galatasaray
      549: ['#000000', '#FFFFFF'], // Beşiktaş
      551: ['#632134', '#00BFFF'], // Trabzonspor
      // UEFA
      2594: ['#E30613', '#00205B'], // FCSB
      194: ['#D2122E', '#FFFFFF'], // Ajax
      212: ['#003399', '#FFFFFF'], // Porto
      // Premier League
      50: ['#6CABDD', '#1C2C5B'], // Man City
      33: ['#DA291C', '#FBE122'], // Man United
      40: ['#C8102E', '#00B2A9'], // Liverpool
      42: ['#EF0107', '#FFFFFF'], // Arsenal
      49: ['#034694', '#FFFFFF'], // Chelsea
      66: ['#95BFE5', '#670E36'], // Aston Villa
      // La Liga
      541: ['#FFFFFF', '#00529F'], // Real Madrid
      529: ['#004D98', '#A50044'], // Barcelona
      530: ['#CB3524', '#FFFFFF'], // Atletico
      // Bundesliga
      157: ['#DC052D', '#FFFFFF'], // Bayern
      165: ['#FDE100', '#000000'], // Dortmund
      // Serie A
      489: ['#AC1818', '#000000'], // AC Milan
      505: ['#010E80', '#000000'], // Inter
      496: ['#000000', '#FFFFFF'], // Juventus
      // Ligue 1
      85: ['#004170', '#DA291C'], // PSG
    };
    
    // 3. Team colors'ı static_teams'den al ve lineups'ı zenginleştir
    const enrichedLineups = await Promise.all(data.response.map(async (lineup) => {
      const teamId = lineup.team?.id;
      const teamName = (lineup.team?.name || '').toLowerCase();
      
      // Static teams'den renkleri al
      let teamColors = null;
      if (teamId) {
        try {
          const { data: staticTeam } = await supabase
            .from('static_teams')
            .select('colors_primary, colors_secondary, colors')
            .eq('api_football_id', teamId)
            .single();
          
          if (staticTeam && (staticTeam.colors_primary || staticTeam.colors)) {
            teamColors = {
              primary: staticTeam.colors_primary,
              secondary: staticTeam.colors_secondary,
              all: staticTeam.colors,
            };
          }
        } catch (dbError) {
          console.warn(`⚠️ DB lookup failed for team ${teamId}:`, dbError.message);
        }
      }
      
      // ✅ Fallback: Hardcoded renklerden al
      if (!teamColors && teamId && FALLBACK_COLORS[teamId]) {
        const [primary, secondary] = FALLBACK_COLORS[teamId];
        teamColors = { primary, secondary, all: [primary, secondary] };
      }
      
      // ✅ Son fallback: İsimden tahmin et
      if (!teamColors) {
        let primary = '#1E40AF';
        let secondary = '#FFFFFF';
        
        // Yaygın takım isimlerini kontrol et
        if (teamName.includes('fenerbahce') || teamName.includes('fenerbahçe')) {
          primary = '#FFED00'; secondary = '#00205B';
        } else if (teamName.includes('galatasaray')) {
          primary = '#E30613'; secondary = '#FDB913';
        } else if (teamName.includes('fcsb') || teamName.includes('steaua')) {
          primary = '#E30613'; secondary = '#00205B';
        }
        
        teamColors = { primary, secondary, all: [primary, secondary] };
      }
      
      // ✅ Oyuncuları zenginleştir - API-Football'dan gerçek verilerle
      const enrichPlayers = async (players, teamId, season = 2025) => {
        if (!players || !Array.isArray(players)) return [];
        
        // Rate limiting için batch'ler halinde işle (her batch'te max 5 oyuncu)
        const batchSize = 5;
        const batches = [];
        for (let i = 0; i < players.length; i += batchSize) {
          batches.push(players.slice(i, i + batchSize));
        }
        
        let enriched = [];
        for (const batch of batches) {
          const batchResults = await Promise.all(batch.map(async (item) => {
          const player = item.player || item;
          const playerId = player.id;
          
          if (!playerId) {
            // Fallback: Eğer player ID yoksa pozisyona göre gerçekçi varsayılan
            const posStr = player.pos || player.position || 'Midfielder';
            return {
              id: null,
              name: player.name,
              number: player.number,
              position: player.pos || player.position,
              grid: item.player?.grid || player.grid,
              rating: getDefaultRatingByPosition(posStr),
              age: player.age || null,
              nationality: player.nationality || null,
            };
          }
          
          // 1. Önce veritabanından kontrol et
          let dbPlayer = null;
          try {
            const { data, error } = await supabase
              .from('players')
              .select('*')
              .eq('id', playerId)
              .single();
            
            if (!error && data) {
              dbPlayer = data;
            }
          } catch (dbError) {
            console.warn(`⚠️ DB check failed for player ${playerId}:`, dbError.message);
          }
          
          // 2. Eğer DB'de yoksa veya güncel değilse API'den çek
          const positionStr = player.pos || player.position || dbPlayer?.position || '';
          let playerStats = null;
          let calculatedRating = getDefaultRatingByPosition(positionStr); // Pozisyona göre gerçekçi varsayılan (70/72 değil)
          let statsFromApi = null; // API'den gelen 6 öznitelik (pace, shooting, ...)
          
          if (!dbPlayer || !dbPlayer.rating) {
            try {
              // API-Football'dan oyuncu bilgilerini çek (sezon bazlı istatistiklerle)
              // Rate limiting için timeout ekle
              const apiData = await Promise.race([
                footballApi.getPlayerInfo(playerId, season),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('API timeout')), 5000)
                )
              ]).catch((err) => {
                console.warn(`⚠️ Player API timeout/failed for ${playerId}:`, err.message);
                return null;
              });
              
              if (apiData && apiData.response && apiData.response.length > 0 && apiData.response[0]) {
                const apiPlayer = apiData.response[0];
                const playerData = apiPlayer.player || {};
                const statistics = apiPlayer.statistics || [];
                
                // En son sezonun istatistiklerini kullan
                const latestStats = statistics.length > 0 ? statistics[0] : null;
                
                // Kendi reyting + 6 öznitelik (hız, şut, pas, dribling, defans, fizik) API istatistiklerinden
                if (latestStats && latestStats.games) {
                  const games = latestStats.games;
                  const attrs = calculatePlayerAttributesFromStats(latestStats, playerData);
                  calculatedRating = attrs.rating;
                  playerStats = {
                    rating: calculatedRating,
                    games: games.appearences || 0,
                    goals: latestStats.goals?.total || 0,
                    assists: latestStats.goals?.assists || 0,
                    minutes: games.minutes || 0,
                  };
                  // 6 öznitelik (stats) aşağıda attrs'tan alınacak
                  statsFromApi = {
                    pace: attrs.pace,
                    shooting: attrs.shooting,
                    passing: attrs.passing,
                    dribbling: attrs.dribbling,
                    defending: attrs.defending,
                    physical: attrs.physical,
                  };
                  console.log(`✅ Player ${playerId} (${playerData.name || player.name}): Rating=${calculatedRating}, Stats from API`);
                } else {
                  console.warn(`⚠️ Player ${playerId} (${playerData.name || player.name}): No stats from API, will use fallback`);
                }
                
                  // Veritabanına kaydet/güncelle
                try {
                  const playerRecord = {
                    id: playerId,
                    name: playerData.name || player.name,
                    firstname: playerData.firstname || null,
                    lastname: playerData.lastname || null,
                    age: playerData.age || player.age || null,
                    nationality: playerData.nationality || player.nationality || null,
                    position: playerData.position || player.pos || player.position || null,
                    height: playerData.height || null,
                    weight: playerData.weight || null,
                    rating: calculatedRating, // ✅ Rating'i kaydet
                    team_id: teamId,
                    updated_at: new Date().toISOString(),
                  };
                  
                  await supabase
                    .from('players')
                    .upsert(playerRecord, { onConflict: 'id' });
                  
                  console.log(`✅ Saved player ${playerId} (${playerData.name || player.name}) with rating ${calculatedRating}`);
                } catch (saveError) {
                  console.warn(`⚠️ Failed to save player ${playerId} to DB:`, saveError.message);
                }
              }
            } catch (apiError) {
              console.warn(`⚠️ API fetch failed for player ${playerId}:`, apiError.message);
              // Fallback: DB'deki rating'i kullan veya default
              if (dbPlayer && dbPlayer.rating) {
                calculatedRating = dbPlayer.rating;
              }
            }
          } else {
            // DB'de varsa onu kullan
            calculatedRating = dbPlayer.rating || getDefaultRatingByPosition(positionStr);
          }
          
          // ✅ Rating'i clamp et: minimum 65, maximum 95 (FIFA benzeri)
          let finalRating = Math.round(Number(calculatedRating)) || getDefaultRatingByPosition(positionStr);
          if (finalRating < 65) {
            console.warn(`⚠️ Rating too low for player ${playerId}: ${finalRating}, clamping to 65`);
            finalRating = 65;
          }
          if (finalRating > 95) {
            finalRating = 95;
          }
          
          // positionStr zaten 1427. satırda tanımlı - tekrar tanımlamıyoruz
          
          // ✅ Stats: API'den gelmediyse derivePlayerStats kullan, ama rating düşükse bile pozisyona göre mantıklı değerler üret
          let stats = statsFromApi;
          if (!stats) {
            stats = derivePlayerStats(finalRating, positionStr);
            // Eğer rating çok düşükse (65-70), stats'ları pozisyona göre minimum değerlere ayarla
            if (finalRating < 70) {
              const pos = (positionStr || '').toLowerCase();
              if (pos.includes('goalkeeper') || pos === 'gk' || pos === 'g') {
                stats = { pace: 48, shooting: 28, passing: 58, dribbling: 42, defending: 85, physical: 80 };
              } else if (pos.includes('defender') || pos.includes('back') || /cb|lb|rb|lwb|rwb/i.test(pos)) {
                stats = { pace: 65, shooting: 40, passing: 65, dribbling: 55, defending: 85, physical: 80 };
              } else if (pos.includes('midfielder') || pos.includes('mid') || /cm|cdm|cam|lm|rm|dm|am/i.test(pos)) {
                stats = { pace: 70, shooting: 65, passing: 85, dribbling: 80, defending: 65, physical: 70 };
              } else if (pos.includes('attacker') || pos.includes('forward') || pos.includes('striker') || /st|cf|lw|rw|w/i.test(pos)) {
                stats = { pace: 80, shooting: 80, passing: 70, dribbling: 80, defending: 40, physical: 70 };
              }
            }
          }
          return {
            id: playerId,
            name: player.name,
            number: player.number,
            position: player.pos || player.position,
            grid: item.player?.grid || player.grid,
            rating: finalRating,
            age: player.age || dbPlayer?.age || null,
            nationality: player.nationality || dbPlayer?.nationality || null,
            stats,
          };
          }));
          
          enriched.push(...batchResults);
          
          // Batch'ler arasında kısa bir delay (rate limiting)
          if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
        
        // Topluluk blend: n >= 2 ise R = (10*R_api + n*avg)/(10+n); yoksa API rating
        const ids = enriched.map((p) => p.id).filter(Boolean);
        const apiMap = enriched.reduce((acc, p) => { acc[p.id] = p.rating; return acc; }, {});
        const displayMap = await getDisplayRatingsMap(ids, apiMap, supabase);
        enriched = enriched.map((p) => ({ ...p, rating: displayMap.get(p.id) ?? p.rating }));
        return enriched;
      };
      
      // ✅ Gerçek oyuncu verilerini kullan
      const season = new Date().getFullYear(); // Mevcut sezon
      const enrichedStartXI = await enrichPlayers(lineup.startXI, teamId, season);
      const enrichedSubstitutes = await enrichPlayers(lineup.substitutes, teamId, season);
      
      return {
        team: {
          id: lineup.team?.id,
          name: lineup.team?.name,
          colors: teamColors,
        },
        formation: lineup.formation,
        startXI: enrichedStartXI,
        substitutes: enrichedSubstitutes,
        coach: lineup.coach,
      };
    }));
    
    // 4. DB'ye cache'le
    if (enrichedLineups.length > 0) {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          lineups: enrichedLineups,
          has_lineups: true,
        })
        .eq('id', matchId);
      
      if (updateError) {
        console.warn(`⚠️ [Lineups] Failed to cache lineups for match ${matchId}:`, updateError.message);
      } else {
        console.log(`💾 [Lineups] Cached lineups for match ${matchId}`);
      }
    }
    
    res.json({
      success: true,
      data: enrichedLineups,
      cached: false,
      source: 'api',
    });
  } catch (error) {
    console.error(`❌ [Lineups] Error for match ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/h2h/:team1/:team2 - Get head to head
router.get('/h2h/:team1/:team2', async (req, res) => {
  try {
    const { team1, team2 } = req.params;
    const data = await footballApi.getHeadToHead(team1, team2);
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/team/:teamId/last - Get team's last matches
router.get('/team/:teamId/last', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 10 } = req.query;
    
    console.log(`📥 Fetching ${limit} past matches for team ${teamId}`);
    
    const data = await footballApi.getTeamLastMatches(teamId, limit);
    
    // Sync to database
    if (databaseService.enabled && data.response && data.response.length > 0) {
      await databaseService.upsertMatches(data.response);
    }
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      source: 'api'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/team/:teamId/upcoming - Get team's upcoming matches
router.get('/team/:teamId/upcoming', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 15 } = req.query; // Increased to 15 for better UX
    
    console.log(`📥 Fetching ${limit} upcoming matches for team ${teamId}`);
    
    const data = await footballApi.getTeamUpcomingMatches(teamId, limit);
    
    // Sync to database
    if (databaseService.enabled && data.response && data.response.length > 0) {
      await databaseService.upsertMatches(data.response);
    }
    
    res.json({
      success: true,
      data: data.response,
      cached: data.cached || false,
      source: 'api'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/matches/favorites - Get matches for favorite teams
router.get('/favorites', async (req, res) => {
  try {
    const { teamIds } = req.query; // Comma-separated team IDs
    
    if (!teamIds) {
      return res.status(400).json({
        success: false,
        error: 'teamIds parameter is required',
      });
    }

    const ids = teamIds.split(',').map(id => parseInt(id.trim()));
    const allMatches = [];

    // Fetch last 5, live, and next 5 matches for each team
    for (const teamId of ids) {
      try {
        const [lastMatches, upcomingMatches] = await Promise.all([
          footballApi.getTeamLastMatches(teamId, 5),
          footballApi.getTeamUpcomingMatches(teamId, 5),
        ]);

        if (lastMatches.response) {
          allMatches.push(...lastMatches.response);
        }
        if (upcomingMatches.response) {
          allMatches.push(...upcomingMatches.response);
        }
      } catch (err) {
        console.warn(`Failed to fetch matches for team ${teamId}:`, err.message);
      }
    }

    // Remove duplicates and sort by date
    const uniqueMatches = Array.from(
      new Map(allMatches.map(m => [m.fixture.id, m])).values()
    ).sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

    res.json({
      success: true,
      data: uniqueMatches,
      cached: false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
