/**
 * PowerScore aylık batch job taslağı.
 * Cron: 0 03 1 * * (her ayın 1'i 03:00)
 *
 * Kullanım: node scripts/power-score-batch.js [--league=39] [--season=2025]
 * .env: SUPABASE_URL, SUPABASE_SERVICE_KEY, FOOTBALL_API_KEY
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const footballApi = require('../services/footballApi');
const {
  calculatePlayerAttributesFromStats,
  calculateForm,
  getFitnessMultiplier,
} = require('../utils/playerRatingFromStats');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DEFAULT_LEAGUE = 39;
const DEFAULT_SEASON = 2025;

async function getTeamsToProcess(leagueId, season) {
  const { data, error } = await supabase
    .from('matches')
    .select('home_team_id')
    .eq('league_id', leagueId)
    .eq('season', season)
    .not('home_team_id', 'is', null);
  if (error) return [];
  const ids = [...new Set((data || []).map((r) => r.home_team_id))];
  return ids.map((team_id) => ({ team_id, league_id: leagueId, season }));
}

async function getSquadPlayerIds(teamId) {
  const data = await footballApi.getTeamSquad(teamId);
  const players = data?.response?.[0]?.players || data?.response || [];
  return players.map((p) => p.id).filter(Boolean);
}

async function runBatch(options = {}) {
  const leagueId = options.league ?? DEFAULT_LEAGUE;
  const season = options.season ?? DEFAULT_SEASON;
  console.log(`PowerScore batch: league=${leagueId} season=${season}`);

  const teams = await getTeamsToProcess(leagueId, season);
  if (teams.length === 0) {
    console.log('No teams found for this league/season.');
    return;
  }

  let processed = 0;
  let errors = 0;
  for (const { team_id, league_id, season: s } of teams) {
    try {
      const playerIds = await getSquadPlayerIds(team_id);
      for (const playerId of playerIds) {
        try {
          const apiData = await footballApi.getPlayerInfo(playerId, s);
          const apiPlayer = apiData?.response?.[0];
          if (!apiPlayer?.statistics?.length) continue;
          const latestStats = apiPlayer.statistics[0];
          const playerData = apiPlayer.player || {};
          const attrs = calculatePlayerAttributesFromStats(latestStats, playerData);
          const fitnessStatus = 'fit'; // TODO: API-Football /injuries ile doldur
          const powerScore = attrs.powerScore ?? 50;
          const row = {
            player_id: playerId,
            team_id,
            league_id,
            season: s,
            position: playerData.position || latestStats.games?.position,
            power_score: powerScore,
            shooting: attrs.shooting,
            passing: attrs.passing,
            dribbling: attrs.dribbling,
            defense: attrs.defense,
            physical: attrs.physical,
            pace: attrs.pace,
            form: attrs.form ?? 50,
            discipline: attrs.discipline ?? null,
            fitness_status: fitnessStatus,
            updated_at: new Date().toISOString(),
          };
          await supabase.from('player_power_scores').upsert(row, {
            onConflict: 'player_id,team_id,league_id,season',
          });
          processed++;
        } catch (e) {
          errors++;
          console.warn(`Player ${playerId}:`, e.message);
        }
        await new Promise((r) => setTimeout(r, 150));
      }
    } catch (e) {
      console.warn(`Team ${team_id}:`, e.message);
    }
  }
  console.log(`Done. Processed=${processed} errors=${errors}`);
}

const args = process.argv.slice(2);
let league = DEFAULT_LEAGUE;
let season = DEFAULT_SEASON;
args.forEach((a) => {
  if (a.startsWith('--league=')) league = parseInt(a.split('=')[1], 10);
  if (a.startsWith('--season=')) season = parseInt(a.split('=')[1], 10);
});

runBatch({ league, season }).catch((err) => {
  console.error(err);
  process.exit(1);
});
