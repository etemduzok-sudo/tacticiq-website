// Bulk Data Routes - Favori takımların TÜM verilerini tek seferde döndür
// Maçlar + Kadro + Teknik Direktör + Takım bilgisi
// ~10MB altında kalır, mobil uygulama offline çalışabilir
const express = require('express');
const router = express.Router();
const footballApi = require('../services/footballApi');
const databaseService = require('../services/databaseService');
const { supabase } = require('../config/supabase');

if (!supabase) {
  console.warn('⚠️ Supabase not configured in routes/bulkData.js');
}

// Helper: DB row -> API format (matches.js'deki ile aynı)
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
    league: {
      id: league.id,
      name: league.name,
      country: league.country || '',
      logo: league.logo,
      season: row.season,
      round: row.round,
    },
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

// POST /api/bulk-data/download
// Body: { teamIds: [541, 645, ...], season?: 2025 }
// Response: { teams: { [teamId]: { info, coach, squad, matches } } }
router.post('/download', async (req, res) => {
  const startTime = Date.now();
  try {
    const { teamIds, season: requestedSeason } = req.body;
    
    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'teamIds array is required',
      });
    }

    // Max 6 takım (1 milli + 5 kulüp)
    if (teamIds.length > 7) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 7 teams allowed',
      });
    }

    const currentSeason = requestedSeason || 2025;
    const results = {};
    let totalMatches = 0;
    let totalPlayers = 0;

    console.log(`\n📦 [BULK] Starting bulk download for ${teamIds.length} teams: [${teamIds.join(', ')}]`);

    // Tüm takımlar için PARALEL veri çekimi
    const teamPromises = teamIds.map(async (teamId) => {
      const teamData = {
        info: null,
        coach: null,
        squad: [],
        matches: [],
      };

      const tid = parseInt(teamId, 10);
      if (!tid) return { teamId, data: teamData };

      // Milli takım kontrolü
      const nationalTeamIds = [777, 25, 6, 26, 1, 2, 3, 4, 5, 10, 15, 16, 21, 27, 1105, 1118, 1530, 2382, 2384];
      const isNational = nationalTeamIds.includes(tid);

      // --- 1. MAÇLAR (en büyük veri) ---
      try {
        if (isNational) {
          // Milli takım: 2025, 2026 sezonları paralel (2024 artık eski)
          const seasonPromises = [2025, 2026].map(async (s) => {
            try {
              if (databaseService.enabled) {
                const dbRows = await databaseService.getTeamMatches(tid, s);
                if (dbRows && dbRows.length > 0) {
                  return dbRows.map(dbRowToApiMatch).filter(Boolean);
                }
              }
              // DB boşsa API fallback
              const apiData = await footballApi.getFixturesByTeam(tid, s);
              if (apiData.response && apiData.response.length > 0) {
                // DB'ye kaydet (gelecek istekler için)
                if (databaseService.enabled) {
                  await databaseService.upsertMatches(apiData.response).catch(() => {});
                }
                return apiData.response;
              }
              return [];
            } catch (e) {
              console.warn(`⚠️ [BULK] Season ${s} failed for team ${tid}:`, e.message);
              return [];
            }
          });
          const seasonResults = await Promise.all(seasonPromises);
          seasonResults.forEach(matches => teamData.matches.push(...matches));
        } else {
          // Kulüp: sadece mevcut sezon
          try {
            if (databaseService.enabled) {
              const dbRows = await databaseService.getTeamMatches(tid, currentSeason);
              if (dbRows && dbRows.length > 0) {
                teamData.matches = dbRows.map(dbRowToApiMatch).filter(Boolean);
              }
            }
            // DB boşsa API fallback
            if (teamData.matches.length === 0) {
              const apiData = await footballApi.getFixturesByTeam(tid, currentSeason);
              if (apiData.response && apiData.response.length > 0) {
                teamData.matches = apiData.response;
                if (databaseService.enabled) {
                  await databaseService.upsertMatches(apiData.response).catch(() => {});
                }
              }
            }
          } catch (e) {
            console.warn(`⚠️ [BULK] Matches failed for team ${tid}:`, e.message);
          }
        }

        // Tekil maçlar (duplikasyon temizle)
        const seenIds = new Set();
        teamData.matches = teamData.matches.filter(m => {
          const fid = m.fixture?.id;
          if (!fid || seenIds.has(fid)) return false;
          seenIds.add(fid);
          return true;
        });

        totalMatches += teamData.matches.length;
        console.log(`  ✅ Team ${tid}: ${teamData.matches.length} matches`);
      } catch (e) {
        console.warn(`  ⚠️ Team ${tid} matches error:`, e.message);
      }

      // --- 2. KADRO (squad) ---
      try {
        if (supabase) {
          const { data: squadRow, error } = await supabase
            .from('team_squads')
            .select('team_id, team_name, team_data, players, updated_at')
            .eq('team_id', tid)
            .eq('season', currentSeason)
            .maybeSingle();

          if (!error && squadRow && squadRow.players && squadRow.players.length > 0) {
            teamData.squad = squadRow.players;
            console.log(`  ✅ Team ${tid}: ${squadRow.players.length} players from DB`);
          } else {
            // On-demand sync
            try {
              const squadSyncService = require('../services/squadSyncService');
              const result = await squadSyncService.syncOneTeamSquad(tid, null);
              if (result.ok) {
                const { data: newRow } = await supabase
                  .from('team_squads')
                  .select('players')
                  .eq('team_id', tid)
                  .eq('season', currentSeason)
                  .maybeSingle();
                if (newRow?.players?.length > 0) {
                  teamData.squad = newRow.players;
                  console.log(`  ✅ Team ${tid}: ${newRow.players.length} players (synced)`);
                }
              }
            } catch (syncErr) {
              console.warn(`  ⚠️ Team ${tid} squad sync failed:`, syncErr.message);
            }
          }
        }
        totalPlayers += teamData.squad.length;
      } catch (e) {
        console.warn(`  ⚠️ Team ${tid} squad error:`, e.message);
      }

      // --- 3. TEKNİK DİREKTÖR (coach) ---
      try {
        const coachData = await footballApi.getTeamCoach(tid);
        if (coachData.response && coachData.response.length > 0) {
          const { selectActiveCoach } = require('../utils/selectActiveCoach');
          const selected = selectActiveCoach(coachData.response, tid);
          const currentCoach = selected && coachData.response.find((c) => c.id === selected.id);
          
          if (currentCoach) {
            teamData.coach = {
              id: currentCoach.id,
              name: selected.name,
              firstName: currentCoach.firstname,
              lastName: currentCoach.lastname,
              age: currentCoach.age,
              nationality: currentCoach.nationality,
            };
            console.log(`  ✅ Team ${tid}: Coach ${selected.name}`);
          }
        }
      } catch (e) {
        console.warn(`  ⚠️ Team ${tid} coach error:`, e.message);
      }

      // --- 4. TAKIM BİLGİSİ ---
      try {
        const teamInfo = await footballApi.getTeamInfo(tid);
        if (teamInfo.response && teamInfo.response.length > 0) {
          const t = teamInfo.response[0];
          const team = t.team || t;
          teamData.info = {
            id: team.id,
            name: team.name,
            code: team.code,
            country: team.country,
            founded: team.founded,
            national: team.national || false,
            venue: t.venue ? {
              name: t.venue.name,
              city: t.venue.city,
              capacity: t.venue.capacity,
            } : null,
          };
        }
      } catch (e) {
        console.warn(`  ⚠️ Team ${tid} info error:`, e.message);
      }

      return { teamId: tid, data: teamData };
    });

    // Tüm takımları paralel çek
    const teamResults = await Promise.allSettled(teamPromises);
    
    teamResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const { teamId, data } = result.value;
        results[teamId] = data;
      }
    });

    // ✅ Rakip takımların koçlarını da ekle (maçlarda gördüğümüz tüm takımlar – favori + rakip)
    const favSet = new Set(teamIds.map((id) => parseInt(id, 10)));
    const opponentIds = new Set();
    Object.values(results).forEach((data) => {
      (data.matches || []).forEach((m) => {
        const homeId = m.teams?.home?.id != null ? parseInt(m.teams.home.id, 10) : null;
        const awayId = m.teams?.away?.id != null ? parseInt(m.teams.away.id, 10) : null;
        if (homeId && !favSet.has(homeId)) opponentIds.add(homeId);
        if (awayId && !favSet.has(awayId)) opponentIds.add(awayId);
      });
    });
    const opponentList = Array.from(opponentIds).filter(Boolean).slice(0, 80);

    if (opponentList.length > 0 && supabase) {
      const { data: opponentRows } = await supabase
        .from('static_teams')
        .select('api_football_id, coach, name')
        .in('api_football_id', opponentList);

      const coachByOpponent = (opponentRows || []).reduce((acc, row) => {
        if (row.coach) acc[row.api_football_id] = row.coach;
        return acc;
      }, {});

      const missingCoachIds = opponentList.filter((id) => !coachByOpponent[id]);
      const { selectActiveCoach } = require('../utils/selectActiveCoach');
      const maxApiOpponents = 20;
      for (let i = 0; i < Math.min(missingCoachIds.length, maxApiOpponents); i++) {
        const oid = missingCoachIds[i];
        try {
          const coachData = await footballApi.getTeamCoach(oid);
          if (coachData.response && coachData.response.length > 0) {
            const selected = selectActiveCoach(coachData.response, oid);
            const currentCoach = selected && coachData.response.find((c) => c.id === selected.id);
            if (currentCoach && selected) {
              coachByOpponent[oid] = selected.name;
            }
          }
        } catch (e) {
          // skip
        }
      }

      opponentList.forEach((oid) => {
        const coachName = coachByOpponent[oid];
        if (coachName && !results[oid]) {
          results[oid] = {
            info: null,
            coach: { id: null, name: coachName },
            squad: [],
            matches: [],
          };
        }
      });
      if (opponentList.length > 0) {
        console.log(`  ✅ [BULK] Rakip koçları eklendi: ${Object.keys(results).length - teamIds.length} takım`);
      }
    }

    const elapsed = Date.now() - startTime;
    const responseJson = JSON.stringify({ success: true, data: results });
    const sizeKB = Math.round(responseJson.length / 1024);
    const sizeMB = (sizeKB / 1024).toFixed(2);

    console.log(`\n📦 [BULK] Complete! ${teamIds.length} teams, ${totalMatches} matches, ${totalPlayers} players`);
    console.log(`📦 [BULK] Response size: ${sizeKB} KB (${sizeMB} MB), Time: ${elapsed}ms\n`);

    res.json({
      success: true,
      data: results,
      meta: {
        teamCount: Object.keys(results).length,
        totalMatches,
        totalPlayers,
        sizeKB,
        elapsedMs: elapsed,
        season: currentSeason,
        downloadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ [BULK] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/bulk-data/status - Cache durumunu kontrol et
router.get('/status', async (req, res) => {
  const { teamIds } = req.query;
  if (!teamIds) {
    return res.json({ success: true, data: { available: false } });
  }

  const ids = teamIds.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean);
  const status = {};

  for (const tid of ids) {
    const teamStatus = { matches: 0, squad: 0, coach: false };

    try {
      if (databaseService.enabled) {
        const dbRows = await databaseService.getTeamMatches(tid, 2025);
        teamStatus.matches = dbRows ? dbRows.length : 0;
      }

      if (supabase) {
        const { data: squadRow } = await supabase
          .from('team_squads')
          .select('players')
          .eq('team_id', tid)
          .eq('season', 2025)
          .maybeSingle();
        teamStatus.squad = squadRow?.players?.length || 0;
      }
    } catch (e) {
      // ignore
    }

    status[tid] = teamStatus;
  }

  res.json({ success: true, data: status });
});

module.exports = router;
