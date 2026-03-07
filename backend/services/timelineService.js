// ============================================
// TIMELINE SERVICE
// ============================================
// Maç akışını (goller, kartlar, değişiklikler) kaydeder
// Her 12 saniyede bir API'den gelen eventleri DB'ye yazar
// ============================================

require('dotenv').config();
const { supabase } = require('../config/supabase');

// Daha önce kaydedilmiş eventleri takip et (duplicate önleme)
const processedEvents = new Map(); // match_id -> { events: Set, lastAccess: timestamp }

// ============================================
// EVENT KEY OLUŞTURMA
// ============================================
function createEventKey(event, matchId) {
  const elapsed = event.time?.elapsed || 0;
  const extra = event.time?.extra || 0;
  const type = event.type || 'unknown';
  const playerId = event.player?.id || 0;
  
  return `${matchId}-${elapsed}-${extra}-${type}-${playerId}`;
}

// ============================================
// EVENT TİPİNİ NORMALİZE ET
// ============================================
function normalizeEventType(apiType) {
  const typeMap = {
    'Goal': 'goal',
    'Card': 'card',
    'subst': 'substitution',
    'Var': 'var',
    'Penalty': 'penalty', // Penalty kick (during match)
  };
  
  return typeMap[apiType] || apiType?.toLowerCase() || 'unknown';
}

// ============================================
// TEK EVENT KAYDET
// ============================================
async function saveTimelineEvent(matchId, event, currentScore) {
  try {
    const eventKey = createEventKey(event, matchId);
    
    // Daha önce işlendiyse atla
    if (!processedEvents.has(matchId)) {
      processedEvents.set(matchId, { events: new Set(), lastAccess: Date.now() });
    }

    const entry = processedEvents.get(matchId);
    entry.lastAccess = Date.now();

    if (entry.events.has(eventKey)) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('match_timeline')
      .upsert({
        match_id: matchId,
        elapsed: event.time?.elapsed || 0,
        elapsed_extra: event.time?.extra || 0,
        event_type: normalizeEventType(event.type),
        event_detail: event.detail || null,
        team_id: event.team?.id || null,
        team_name: event.team?.name || null,
        player_id: event.player?.id || null,
        player_name: event.player?.name || null,
        assist_id: event.assist?.id || null,
        assist_name: event.assist?.name || null,
        score_home: currentScore?.home || 0,
        score_away: currentScore?.away || 0,
        comments: event.comments || null,
      }, {
        onConflict: 'match_id,elapsed,elapsed_extra,event_type,player_id',
        ignoreDuplicates: true,
      });
    
    if (error) {
      // Duplicate key hatası değilse logla
      if (!error.message?.includes('duplicate')) {
        console.error(`❌ Timeline event save error:`, error.message);
      }
      return null;
    }
    
    // İşlenmiş olarak işaretle
    entry.events.add(eventKey);
    
    return data;
  } catch (error) {
    console.error(`❌ Timeline save error:`, error.message);
    return null;
  }
}

// ============================================
// MAÇ EVENTLARINI KAYDET
// ============================================
async function saveMatchEvents(matchData) {
  if (!matchData || !matchData.fixture?.id) return 0;
  
  const matchId = matchData.fixture.id;
  const events = matchData.events || [];
  const currentScore = {
    home: matchData.goals?.home || 0,
    away: matchData.goals?.away || 0,
  };
  
  if (events.length === 0) return 0;
  
  let savedCount = 0;
  
  for (const event of events) {
    const result = await saveTimelineEvent(matchId, event, currentScore);
    if (result) savedCount++;
  }
  
  return savedCount;
}

// ============================================
// CANLI MAÇ DURUMU KAYDET (opsiyonel)
// ============================================
async function saveLiveStatus(matchData) {
  if (!matchData || !matchData.fixture?.id) return null;
  
  const status = matchData.fixture?.status?.short;
  
  // Sadece canlı maçları kaydet
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'];
  if (!liveStatuses.includes(status)) return null;
  
  try {
    const { data, error } = await supabase
      .from('match_live_status')
      .insert({
        match_id: matchData.fixture.id,
        status: status,
        elapsed: matchData.fixture?.status?.elapsed || 0,
        score_home: matchData.goals?.home || 0,
        score_away: matchData.goals?.away || 0,
      });
    
    if (error && !error.message?.includes('duplicate')) {
      console.error('❌ Live status save error:', error.message);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Live status error:', error.message);
    return null;
  }
}

// ============================================
// MAÇ BİTTİĞİNDE ÖZET OLUŞTUR
// ============================================
async function createMatchSummary(matchData) {
  if (!matchData || !matchData.fixture?.id) return null;
  
  const matchId = matchData.fixture.id;
  const status = matchData.fixture?.status?.short;
  
  // Sadece biten maçlar için
  if (status !== 'FT' && status !== 'AET' && status !== 'PEN') return null;
  
  try {
    // Timeline'dan önemli anları çek
    const { data: timelineEvents } = await supabase
      .from('match_timeline')
      .select('*')
      .eq('match_id', matchId)
      .order('elapsed', { ascending: true });
    
    // Key moments oluştur
    const keyMoments = (timelineEvents || [])
      .filter(e => e.event_type === 'goal' || (e.event_type === 'card' && e.event_detail === 'Red Card'))
      .map(e => ({
        elapsed: e.elapsed,
        type: e.event_type,
        player: e.player_name,
        team: e.team_name,
        detail: e.event_detail,
      }));
    
    // Türkçe özet oluştur
    const homeTeam = matchData.teams?.home?.name || 'Ev Sahibi';
    const awayTeam = matchData.teams?.away?.name || 'Deplasman';
    const homeScore = matchData.goals?.home || 0;
    const awayScore = matchData.goals?.away || 0;
    
    let summaryTr = `${homeTeam} ${homeScore}-${awayScore} ${awayTeam}. `;
    
    if (homeScore > awayScore) {
      summaryTr += `${homeTeam} galip ayrıldı.`;
    } else if (awayScore > homeScore) {
      summaryTr += `${awayTeam} deplasmanda 3 puanı aldı.`;
    } else {
      summaryTr += `Maç berabere tamamlandı.`;
    }
    
    // Gol atanları ekle
    const goals = keyMoments.filter(m => m.type === 'goal');
    if (goals.length > 0) {
      const scorers = goals.map(g => `${g.player} (${g.elapsed}')`).join(', ');
      summaryTr += ` Goller: ${scorers}.`;
    }
    
    // Özeti kaydet
    const { data, error } = await supabase
      .from('match_summaries')
      .upsert({
        match_id: matchId,
        home_team_name: homeTeam,
        away_team_name: awayTeam,
        final_score_home: homeScore,
        final_score_away: awayScore,
        summary_tr: summaryTr,
        key_moments: keyMoments,
        league_name: matchData.league?.name || null,
        match_date: matchData.fixture?.date || new Date().toISOString(),
      }, {
        onConflict: 'match_id',
      });
    
    if (error) {
      console.error('❌ Match summary save error:', error.message);
      return null;
    }
    
    console.log(`📝 Match summary created: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`);
    return data;
  } catch (error) {
    console.error('❌ Match summary error:', error.message);
    return null;
  }
}

// ============================================
// TÜM CANLI MAÇLARI İŞLE
// ============================================
async function processLiveMatches(matches) {
  if (!matches || !Array.isArray(matches)) return { events: 0, summaries: 0 };
  
  let totalEvents = 0;
  let totalSummaries = 0;
  
  for (const match of matches) {
    // Eventleri kaydet
    const eventCount = await saveMatchEvents(match);
    totalEvents += eventCount;
    
    // Canlı durumu kaydet (opsiyonel)
    await saveLiveStatus(match);
    
    // Maç bittiyse özet oluştur
    const summary = await createMatchSummary(match);
    if (summary) totalSummaries++;
  }
  
  if (totalEvents > 0) {
    console.log(`📊 Timeline: ${totalEvents} new events saved`);
  }
  
  if (totalSummaries > 0) {
    console.log(`📝 Summaries: ${totalSummaries} match summaries created`);
  }
  
  return { events: totalEvents, summaries: totalSummaries };
}

// ============================================
// BELLEK TEMİZLİĞİ
// ============================================
function cleanupProcessedEvents() {
  const now = Date.now();
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  let removed = 0;

  for (const [matchId, entry] of processedEvents.entries()) {
    if ((now - entry.lastAccess) > THREE_HOURS || entry.events.size > 1000) {
      processedEvents.delete(matchId);
      removed++;
    }
  }

  if (processedEvents.size > 500) {
    const sorted = [...processedEvents.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    const toRemove = sorted.slice(0, 200);
    toRemove.forEach(([k]) => processedEvents.delete(k));
    removed += toRemove.length;
  }

  if (removed > 0) {
    console.log(`🧹 Cleaned up ${removed} old match event caches (remaining: ${processedEvents.size})`);
  }
}

// Her 10 dakikada bir temizlik
setInterval(cleanupProcessedEvents, 10 * 60 * 1000);

// ============================================
// EXPORTS
// ============================================
module.exports = {
  processLiveMatches,
  saveMatchEvents,
  createMatchSummary,
  saveLiveStatus,
};
