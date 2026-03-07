/**
 * API-Football oyuncu istatistiklerinden PowerScore ve 6 öznitelik (0-100).
 * Pozisyona göre ağırlıklı PowerScore + sakatlık cezası + isteğe bağlı disiplin.
 *
 * API-Football statistics[0]: games, goals, passes, dribbles, tackles, duels, shots, fouls, cards.
 */

const POSITION_BASE = {
  Goalkeeper: 72,
  Defender: 70,
  Midfielder: 71,
  Attacker: 72,
};

// Rating tier bonusu: Top5 lig +3, Kıta kulüp turnuvaları +5
const TOP5_LEAGUE_IDS = new Set([39, 140, 78, 135, 61]);
const CONTINENTAL_LEAGUE_IDS = new Set([2, 3, 848, 13, 15]);

function parseNum(val) {
  if (val == null) return 0;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const n = parseFloat(String(val).replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
}

/** 50-99 aralığına clamp (FIFA benzeri) */
function clamp0_100(n) {
  return Math.max(50, Math.min(99, Math.round(n)));
}

/**
 * Kaleciye özel 6 öznitelik (FIFA GK: Reflexes, Kicking, Passing, Handling, Positioning, Diving).
 * Frontend aynı 6 alanı (pace,shooting,passing,dribbling,defending,physical) bekliyor:
 *   pace=Reflexes, shooting=Kicking, passing=Passing, dribbling=Handling, defense=Positioning, physical=Diving
 */
function rawGkAttributesFromStats(latestStats) {
  const games = latestStats?.games || {};
  const goalsObj = latestStats?.goals || {};
  const passesObj = latestStats?.passes || {};
  const penaltyObj = latestStats?.penalty || {};
  const cardsObj = latestStats?.cards || {};
  const foulsObj = latestStats?.fouls || {};

  const appearances = Math.max(1, parseNum(games.appearences) || parseNum(games.appearance));
  const minutes = parseNum(games.minutes);

  const saves = parseNum(goalsObj.saves);
  const conceded = parseNum(goalsObj.conceded);
  const penaltySaved = parseNum(penaltyObj.saved);

  const passesTotal = parseNum(passesObj.total);
  let passAccuracy = 0;
  if (passesObj.accuracy != null) passAccuracy = parseNum(passesObj.accuracy);

  const savesPerGame = saves / appearances;
  const savePct = (saves + conceded) > 0 ? (saves / (saves + conceded)) * 100 : 50;
  const concededPerGame = conceded / appearances;
  const cleanSheetRate = concededPerGame <= 0.5 ? 90 : concededPerGame <= 0.8 ? 82 : concededPerGame <= 1.0 ? 75 : concededPerGame <= 1.5 ? 68 : 60;

  // Reflexes (pace slot): kurtarış yüzdesi + kurtarış hacmi
  const reflexBase = savePct >= 80 ? 88 : savePct >= 75 ? 84 : savePct >= 70 ? 78 : savePct >= 65 ? 72 : 65;
  const reflexBonus = Math.min(8, savesPerGame * 2);
  const reflexes = reflexBase + reflexBonus;

  // Kicking (shooting slot): pas dağıtımı uzun mesafe proxy
  const kickBase = passAccuracy >= 80 ? 80 : passAccuracy >= 70 ? 74 : passAccuracy >= 60 ? 68 : 62;
  const kickVolume = Math.min(8, (passesTotal / appearances) / 4);
  const kicking = kickBase + kickVolume;

  // Passing (passing slot): kısa pas isabeti
  const passingGk = passAccuracy >= 85 ? 85 : passAccuracy >= 75 ? 78 : passAccuracy >= 65 ? 72 : 65;

  // Handling (dribbling slot): kurtarış temizliği + penaltı kurtarışları
  const handlingBase = savePct >= 78 ? 85 : savePct >= 72 ? 78 : savePct >= 65 ? 72 : 65;
  const penaltyBonus = Math.min(10, penaltySaved * 5);
  const handling = handlingBase + penaltyBonus;

  // Positioning (defense slot): gol yeme oranına dayalı
  const positioning = cleanSheetRate;

  // Diving (physical slot): atletizm proxy (dakika + kurtarış hacmi)
  const divingBase = savesPerGame >= 4 ? 88 : savesPerGame >= 3 ? 82 : savesPerGame >= 2 ? 76 : 68;
  const divingMinutes = Math.min(8, (minutes / Math.max(1, appearances)) / 10);
  const diving = divingBase + divingMinutes;

  const yellow = parseNum(cardsObj.yellow ?? 0);
  const red = parseNum(cardsObj.red ?? 0);
  const cardsTotal = yellow + red * 2;
  const minutesPer90 = Math.max(1, minutes / 90);
  const foulsCommitted = parseNum(foulsObj.committed ?? 0);

  return {
    shooting: clamp0_100(kicking),
    passing: clamp0_100(passingGk),
    dribbling: clamp0_100(handling),
    defense: clamp0_100(positioning),
    physical: clamp0_100(diving),
    pace: clamp0_100(reflexes),
    cardsPer90: cardsTotal / minutesPer90,
    foulsPer90: foulsCommitted / minutesPer90,
    minutes,
    appearances,
  };
}

function isGoalkeeperPosition(position) {
  const p = (position || '').toLowerCase();
  return p.includes('goalkeeper') || p === 'gk' || p === 'g';
}

/**
 * Ham istatistiklerden 6 özniteliği 0-100 hesaplar.
 * Kaleciler için otomatik olarak GK-özel formül kullanılır.
 */
function rawAttributesFromStats(latestStats, position) {
  if (isGoalkeeperPosition(position || latestStats?.games?.position)) {
    return rawGkAttributesFromStats(latestStats);
  }
  const games = latestStats?.games || {};
  const goalsObj = latestStats?.goals || {};
  const passesObj = latestStats?.passes || {};
  const dribblesObj = latestStats?.dribbles || {};
  const tacklesObj = latestStats?.tackles || {};
  const duelsObj = latestStats?.duels || {};
  const shotsObj = latestStats?.shots || {};
  const foulsObj = latestStats?.fouls || {};
  const cardsObj = latestStats?.cards || {};

  const appearances = Math.max(1, parseNum(games.appearences) || parseNum(games.appearance));
  const minutes = parseNum(games.minutes);
  const goals = parseNum(goalsObj.total);
  const assists = parseNum(goalsObj.assists);

  const passesTotal = parseNum(passesObj.total);
  const passesSuccess = parseNum(passesObj.success);
  let passAccuracy = 0;
  if (passesObj.accuracy != null) passAccuracy = parseNum(passesObj.accuracy);
  else if (passesTotal > 0 && passesSuccess > 0) passAccuracy = (passesSuccess / passesTotal) * 100;
  const keyPasses = parseNum(passesObj.key ?? 0);

  const dribbleAttempts = parseNum(dribblesObj.attempts);
  const dribbleSuccess = parseNum(dribblesObj.success);
  const dribbleRate = dribbleAttempts > 0 ? (dribbleSuccess / dribbleAttempts) * 100 : 0;

  const tacklesTotal = parseNum(tacklesObj.total);
  const duelsWon = parseNum(duelsObj.won);
  const duelsTotal = parseNum(duelsObj.total);
  const duelsRate = duelsTotal > 0 ? (duelsWon / duelsTotal) * 100 : 0;

  const shotsOn = parseNum(shotsObj.on);
  const shotsTotal = parseNum(shotsObj.total);
  const shotAccuracy = shotsTotal > 0 ? (shotsOn / shotsTotal) * 100 : 0;

  const foulsDrawn = parseNum(foulsObj.drawn ?? 0);
  const foulsCommitted = parseNum(foulsObj.committed ?? foulsObj ?? 0);

  const yellow = parseNum(cardsObj.yellow ?? 0);
  const red = parseNum(cardsObj.red ?? 0);
  const cardsTotal = yellow + red * 2;
  const minutesPer90 = Math.max(1, minutes / 90);
  const cardsPer90 = cardsTotal / minutesPer90;
  const foulsPer90 = foulsCommitted / minutesPer90;

  const goalsPerGame = goals / appearances;
  const shootingBase = goalsPerGame >= 0.8 ? 90 : goalsPerGame >= 0.5 ? 82 : goalsPerGame >= 0.3 ? 75 : goalsPerGame >= 0.1 ? 68 : 58;
  const shotAccBonus = Math.min(8, shotAccuracy * 0.08);
  const shootingRaw = shootingBase + shotAccBonus;

  const passBase = passAccuracy >= 90 ? 88 : passAccuracy >= 85 ? 82 : passAccuracy >= 80 ? 78 : passAccuracy >= 75 ? 72 : passAccuracy >= 70 ? 68 : 62;
  const keyPassBonus = Math.min(8, (keyPasses / appearances) * 2);
  const assistBonus = Math.min(6, (assists / appearances) * 6);
  const passingRaw = passBase + keyPassBonus + assistBonus;

  const dribBase = dribbleRate >= 70 ? 85 : dribbleRate >= 60 ? 78 : dribbleRate >= 50 ? 72 : dribbleRate >= 40 ? 66 : 58;
  const dribVolumeBonus = Math.min(10, (dribbleSuccess / appearances) * 2);
  const dribblingRaw = dribBase + dribVolumeBonus;

  const tacklesPerGame = tacklesTotal / appearances;
  const defBase = tacklesPerGame >= 4 ? 88 : tacklesPerGame >= 3 ? 82 : tacklesPerGame >= 2 ? 75 : tacklesPerGame >= 1 ? 68 : 58;
  const defDuelsBonus = Math.min(10, duelsRate * 0.1);
  const defenseRaw = defBase + defDuelsBonus;

  const physBase = duelsRate >= 60 ? 85 : duelsRate >= 55 ? 80 : duelsRate >= 50 ? 75 : duelsRate >= 45 ? 70 : 65;
  const physMinutesBonus = Math.min(10, (minutes / Math.max(1, appearances)) / 9);
  const physicalRaw = physBase + physMinutesBonus;

  const paceBase = 70;
  const paceDribBonus = Math.min(15, (dribbleAttempts / appearances) * 2);
  const paceActivityBonus = Math.min(10, (duelsTotal / appearances) * 0.5);
  const paceRaw = paceBase + paceDribBonus + paceActivityBonus;

  return {
    shooting: clamp0_100(shootingRaw),
    passing: clamp0_100(passingRaw),
    dribbling: clamp0_100(dribblingRaw),
    defense: clamp0_100(defenseRaw),
    physical: clamp0_100(physicalRaw),
    pace: clamp0_100(paceRaw),
    cardsPer90,
    foulsPer90,
    minutes,
    appearances,
  };
}

/** Pozisyona göre PowerScore ağırlıkları (Form dahil). */
const POWER_WEIGHTS = {
  'ST': { shooting: 0.45, dribbling: 0.20, physical: 0.15, passing: 0.10, form: 0.10 },
  'WF': { shooting: 0.45, dribbling: 0.20, physical: 0.15, passing: 0.10, form: 0.10 },
  'AM': { passing: 0.30, dribbling: 0.25, shooting: 0.20, form: 0.15, physical: 0.10 },
  'W': { passing: 0.30, dribbling: 0.25, shooting: 0.20, form: 0.15, physical: 0.10 },
  'CM': { passing: 0.30, defense: 0.25, physical: 0.15, form: 0.15, dribbling: 0.15 },
  'DM': { passing: 0.30, defense: 0.25, physical: 0.15, form: 0.15, dribbling: 0.15 },
  'CB': { defense: 0.45, physical: 0.25, form: 0.15, passing: 0.15 },
  'FB': { defense: 0.25, passing: 0.20, dribbling: 0.20, physical: 0.20, form: 0.15 },
  'WB': { defense: 0.25, passing: 0.20, dribbling: 0.20, physical: 0.20, form: 0.15 },
  'GK': { defense: 0.30, physical: 0.20, pace: 0.25, dribbling: 0.10, passing: 0.05, form: 0.10 },
  default: { passing: 0.25, dribbling: 0.20, shooting: 0.15, defense: 0.15, physical: 0.15, form: 0.10 },
};

function normalizePositionForWeights(position) {
  const p = (position || '').toLowerCase();
  if (p.includes('striker') || p === 'st') return 'ST';
  if (p.includes('forward') && p.includes('wing')) return 'WF';
  if (p.includes('wing')) return 'WF';
  if (p.includes('attacking') && p.includes('mid')) return 'AM';
  if (p.includes('midfielder') && !p.includes('defensive') && !p.includes('central')) return 'AM';
  if (p.includes('central') && p.includes('mid')) return 'CM';
  if (p.includes('defensive') && p.includes('mid')) return 'DM';
  if (p.includes('centre') && p.includes('back') || p.includes('center') && p.includes('back')) return 'CB';
  if (p.includes('back') && (p.includes('full') || p.includes('wing'))) return p.includes('wing') ? 'WB' : 'FB';
  if (p.includes('goalkeeper')) return 'GK';
  if (p.includes('defender')) return 'CB';
  if (p.includes('midfielder')) return 'CM';
  if (p.includes('attacker')) return 'ST';
  return 'default';
}

function calculatePowerScore(attrs, position, fitnessStatus = 'fit', options = {}) {
  const w = POWER_WEIGHTS[normalizePositionForWeights(position)] || POWER_WEIGHTS.default;
  const form = typeof attrs.form === 'number' ? attrs.form : 50;
  let score = 0;
  if (w.shooting != null) score += (attrs.shooting ?? 50) * w.shooting;
  if (w.passing != null) score += (attrs.passing ?? 50) * w.passing;
  if (w.dribbling != null) score += (attrs.dribbling ?? 50) * w.dribbling;
  if (w.defense != null) score += (attrs.defense ?? 50) * w.defense;
  if (w.physical != null) score += (attrs.physical ?? 50) * w.physical;
  if (w.pace != null) score += (attrs.pace ?? 50) * w.pace;
  if (w.form != null) score += form * w.form;
  if (options.disciplineBonus != null) score += options.disciplineBonus;
  const fitnessMultiplier = fitnessStatus === 'injured' ? 0.75 : fitnessStatus === 'doubtful' ? 0.90 : 1;
  return clamp0_100(score * fitnessMultiplier);
}

function calculateDiscipline(cardsPer90, foulsPer90) {
  const raw = (cardsPer90 || 0) * 10 + (foulsPer90 || 0) * 2;
  return clamp0_100(100 - Math.min(100, raw * 5));
}

function calculateForm(attributesLast5) {
  if (!attributesLast5 || attributesLast5.length === 0) return 50;
  const n = attributesLast5.length;
  const sum = (key) => attributesLast5.reduce((s, a) => s + (a[key] ?? 50), 0);
  const avg = (key) => sum(key) / n;
  const form = (avg('shooting') + avg('passing') + avg('dribbling') + avg('defense') + avg('physical')) / 5;
  return clamp0_100(form);
}

/**
 * API-Football statistics[0] ile 6 öznitelik + rating + PowerScore.
 *
 * Rating hesaplama:
 *   1. API-Football games.rating (6.0-10.0) varsa -> x10 + lig tier bonusu
 *   2. Yoksa -> pozisyon ağırlıklı PowerScore (basit ortalama yerine)
 */
function calculatePlayerAttributesFromStats(latestStats, playerData = {}) {
  const position = (playerData.position || playerData.pos || (latestStats?.games && latestStats.games.position) || 'Midfielder') + '';
  const raw = rawAttributesFromStats(latestStats || {}, position);

  const attrs = {
    shooting: raw.shooting,
    passing: raw.passing,
    dribbling: raw.dribbling,
    defense: raw.defense,
    physical: raw.physical,
    pace: raw.pace,
    form: 50,
  };

  const discipline = calculateDiscipline(raw.cardsPer90, raw.foulsPer90);
  const posNorm = normalizePositionForWeights(position);
  const disciplineBonus = (posNorm === 'DM' || posNorm === 'CB') ? (discipline / 100) * 5 : 0;
  const powerScore = calculatePowerScore(attrs, position, 'fit', { disciplineBonus });

  const apiRating = latestStats?.games?.rating ? parseFloat(latestStats.games.rating) : null;

  let rating;
  if (apiRating && apiRating >= 5.0 && apiRating <= 10.0) {
    const leagueId = latestStats?.league?.id || playerData?.leagueId;
    let tierBonus = 0;
    if (leagueId && CONTINENTAL_LEAGUE_IDS.has(Number(leagueId))) tierBonus = 5;
    else if (leagueId && TOP5_LEAGUE_IDS.has(Number(leagueId))) tierBonus = 3;
    rating = Math.round(apiRating * 10) + tierBonus;
  } else {
    rating = Math.round(powerScore);
  }

  rating = Math.max(60, Math.min(95, rating));

  return {
    rating,
    powerScore,
    pace: attrs.pace,
    shooting: attrs.shooting,
    passing: attrs.passing,
    dribbling: attrs.dribbling,
    defending: attrs.defense,
    physical: attrs.physical,
    defense: attrs.defense,
    form: attrs.form,
    discipline,
    fitnessStatus: 'fit',
  };
}

function getFitnessMultiplier(fitnessStatus) {
  const s = (fitnessStatus || 'fit').toLowerCase();
  if (s.includes('injured')) return 0.75;
  if (s.includes('doubtful')) return 0.90;
  return 1;
}

function calculateRatingFromStats(latestStats, playerData = {}) {
  const out = calculatePlayerAttributesFromStats(latestStats, playerData);
  return out.rating;
}

function getDefaultRatingByPosition(position) {
  const pos = (position || '').toLowerCase();
  if (pos.includes('goalkeeper') || pos === 'gk' || pos === 'g') return POSITION_BASE.Goalkeeper;
  if (pos.includes('defender') || pos.includes('back') || /cb|lb|rb|lwb|rwb/i.test(pos)) return POSITION_BASE.Defender;
  if (pos.includes('midfielder') || pos.includes('mid') || /cm|cdm|cam|lm|rm|dm|am/i.test(pos)) return POSITION_BASE.Midfielder;
  if (pos.includes('attacker') || pos.includes('forward') || pos.includes('striker') || /st|cf|lw|rw|w/i.test(pos)) return POSITION_BASE.Attacker;
  return 71;
}

module.exports = {
  calculateRatingFromStats,
  calculatePlayerAttributesFromStats,
  rawAttributesFromStats,
  calculatePowerScore,
  calculateForm,
  calculateDiscipline,
  getFitnessMultiplier,
  getDefaultRatingByPosition,
  normalizePositionForWeights,
  parseNum,
  clamp0_100,
  POSITION_BASE,
  TOP5_LEAGUE_IDS,
  CONTINENTAL_LEAGUE_IDS,
};
