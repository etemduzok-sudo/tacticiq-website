/**
 * API-Football oyuncu istatistiklerinden PowerScore ve 6 öznitelik (0–100).
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

function parseNum(val) {
  if (val == null) return 0;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const n = parseFloat(String(val).replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
}

/** 50–99 aralığına clamp (FIFA benzeri) */
function clamp0_100(n) {
  return Math.max(50, Math.min(99, Math.round(n)));
}

/**
 * Ham istatistiklerden 6 özniteliği 0–100 hesaplar (min-max proxy; lig+pozisyon batch’te yapılabilir).
 * Shooting: goals, shots on target, total shots, shot accuracy proxy
 * Passing: passes, key passes, pass accuracy, assists
 * Dribbling: dribbles attempts/success, duels won (ground)
 * Defense: tackles, interceptions, blocks, duels won
 * Physical: duels total/won, fouls drawn/committed balance, minutes
 * Pace: minutes + dribbles + duels tempo proxy (düşük ağırlık)
 */
function rawAttributesFromStats(latestStats) {
  const games = latestStats?.games || {};
  const goalsObj = latestStats?.goals || {};
  const passesObj = latestStats?.passes || {};
  const dribblesObj = latestStats?.dribbles || {};
  const tacklesObj = latestStats?.tackles || {};
  const duelsObj = latestStats?.duels || {};
  const shotsObj = latestStats?.shots || {};
  const foulsObj = latestStats?.fouls || {};
  const cardsObj = latestStats?.cards || {};
  // API bazen interceptions/blocks ayrı vermeyebilir
  const interceptions = parseNum(latestStats?.interceptions?.total ?? latestStats?.interceptions ?? 0);
  const blocks = parseNum(latestStats?.blocks?.total ?? latestStats?.blocks ?? 0);

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
  const foulsBalance = Math.max(-50, Math.min(50, foulsDrawn - foulsCommitted)); // -50..+50 proxy

  const yellow = parseNum(cardsObj.yellow ?? 0);
  const red = parseNum(cardsObj.red ?? 0);
  const cardsTotal = yellow + red * 2;
  const minutesPer90 = Math.max(1, minutes / 90);
  const cardsPer90 = cardsTotal / minutesPer90;
  const foulsPer90 = foulsCommitted / minutesPer90;

  // —— Shooting 50–99: gol/maç oranı ana faktör (FIFA benzeri)
  const goalsPerGame = goals / appearances;
  const shootingBase = goalsPerGame >= 0.8 ? 90 : goalsPerGame >= 0.5 ? 82 : goalsPerGame >= 0.3 ? 75 : goalsPerGame >= 0.1 ? 68 : 58;
  const shotAccBonus = Math.min(8, shotAccuracy * 0.08);
  const shootingRaw = shootingBase + shotAccBonus;

  // —— Passing 50–99: pas isabeti ana faktör
  const passBase = passAccuracy >= 90 ? 88 : passAccuracy >= 85 ? 82 : passAccuracy >= 80 ? 78 : passAccuracy >= 75 ? 72 : passAccuracy >= 70 ? 68 : 62;
  const keyPassBonus = Math.min(8, (keyPasses / appearances) * 2);
  const assistBonus = Math.min(6, (assists / appearances) * 6);
  const passingRaw = passBase + keyPassBonus + assistBonus;

  // —— Dribbling 50–99: dribling başarı oranı ana faktör
  const dribBase = dribbleRate >= 70 ? 85 : dribbleRate >= 60 ? 78 : dribbleRate >= 50 ? 72 : dribbleRate >= 40 ? 66 : 58;
  const dribVolumeBonus = Math.min(10, (dribbleSuccess / appearances) * 2);
  const dribblingRaw = dribBase + dribVolumeBonus;

  // —— Defense 50–99: tackle + duels ana faktör
  const tacklesPerGame = tacklesTotal / appearances;
  const defBase = tacklesPerGame >= 4 ? 88 : tacklesPerGame >= 3 ? 82 : tacklesPerGame >= 2 ? 75 : tacklesPerGame >= 1 ? 68 : 58;
  const defDuelsBonus = Math.min(10, duelsRate * 0.1);
  const defenseRaw = defBase + defDuelsBonus;

  // —— Physical 50–99: duels oranı ana faktör
  const physBase = duelsRate >= 60 ? 85 : duelsRate >= 55 ? 80 : duelsRate >= 50 ? 75 : duelsRate >= 45 ? 70 : 65;
  const physMinutesBonus = Math.min(10, (minutes / Math.max(1, appearances)) / 9);
  const physicalRaw = physBase + physMinutesBonus;

  // —— Pace 50–99: dribling hacmi + aktivite (proxy, gerçek hız yok)
  const paceBase = 70; // Orta baz (gerçek hız verisi yok)
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
    // Disiplin: kart + faul az = yüksek
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
  'GK': { defense: 0.50, physical: 0.20, form: 0.15, passing: 0.15 }, // GK stats ayrı eklenebilir
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

/**
 * 6 öznitelik + form ile pozisyona göre PowerScore (0–100).
 * @param {object} attrs - { shooting, passing, dribbling, defense, physical, pace, form? }
 * @param {string} position - API position string
 * @param {string} fitnessStatus - 'fit' | 'doubtful' | 'injured'
 * @param {object} options - { disciplineBonus?: number } DM/CB için +0.05 gibi
 */
function calculatePowerScore(attrs, position, fitnessStatus = 'fit', options = {}) {
  const w = POWER_WEIGHTS[normalizePositionForWeights(position)] || POWER_WEIGHTS.default;
  const form = typeof attrs.form === 'number' ? attrs.form : 50;
  let score = 0;
  if (w.shooting != null) score += (attrs.shooting ?? 50) * w.shooting;
  if (w.passing != null) score += (attrs.passing ?? 50) * w.passing;
  if (w.dribbling != null) score += (attrs.dribbling ?? 50) * w.dribbling;
  if (w.defense != null) score += (attrs.defense ?? 50) * w.defense;
  if (w.physical != null) score += (attrs.physical ?? 50) * w.physical;
  if (w.form != null) score += form * w.form;
  // DM/CB için disiplin bonusu: +0.05 etkisi → skora en fazla +5 (discipline 0–100)
  if (options.disciplineBonus != null) score += options.disciplineBonus;
  const fitnessMultiplier = fitnessStatus === 'injured' ? 0.75 : fitnessStatus === 'doubtful' ? 0.90 : 1;
  return clamp0_100(score * fitnessMultiplier);
}

/**
 * Disiplin skoru: 100 - normalize(cards_per_90 + fouls_per_90). Yüksek = daha az kart/faul.
 */
function calculateDiscipline(cardsPer90, foulsPer90) {
  const raw = (cardsPer90 || 0) * 10 + (foulsPer90 || 0) * 2;
  return clamp0_100(100 - Math.min(100, raw * 5));
}

/**
 * Son 5 maç ortalamasından Form 0–100. Veri yoksa 50 döner.
 * @param {Array<{ shooting, passing, dribbling, defense, physical }>} attributesLast5
 */
function calculateForm(attributesLast5) {
  if (!attributesLast5 || attributesLast5.length === 0) return 50;
  const n = attributesLast5.length;
  const sum = (key) => attributesLast5.reduce((s, a) => s + (a[key] ?? 50), 0);
  const avg = (key) => sum(key) / n;
  const form = (avg('shooting') + avg('passing') + avg('dribbling') + avg('defense') + avg('physical')) / 5;
  return clamp0_100(form);
}

/**
 * API-Football statistics[0] ile 6 öznitelik (0–100) + rating (geri uyumluluk 65–95) + PowerScore hazırlığı.
 * Tek sezonluk stats için; Form = 50 (batch job’da son 5 maç ile doldurulur).
 */
function calculatePlayerAttributesFromStats(latestStats, playerData = {}) {
  const position = (playerData.position || playerData.pos || (latestStats?.games && latestStats.games.position) || 'Midfielder') + '';
  const raw = rawAttributesFromStats(latestStats || {});

  const attrs = {
    shooting: raw.shooting,
    passing: raw.passing,
    dribbling: raw.dribbling,
    defense: raw.defense,
    physical: raw.physical,
    pace: raw.pace,
    form: 50, // batch’te son 5 maç ile güncellenir
  };

  const discipline = calculateDiscipline(raw.cardsPer90, raw.foulsPer90);
  const posNorm = normalizePositionForWeights(position);
  const disciplineBonus = (posNorm === 'DM' || posNorm === 'CB') ? (discipline / 100) * 5 : 0; // +0.05 etkisi → max +5
  const powerScore = calculatePowerScore(attrs, position, 'fit', { disciplineBonus });

  // Rating: 6 özniteliğin ağırlıklı ortalaması (65–95 bandı, FIFA benzeri)
  const avgAttrs = (attrs.shooting + attrs.passing + attrs.dribbling + attrs.defense + attrs.physical + attrs.pace) / 6;
  const rating = Math.max(65, Math.min(95, Math.round(avgAttrs)));

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

/**
 * Sakatlık durumuna göre PowerScore çarpanı.
 * Injured: 0.75, Doubtful: 0.90, Fit: 1
 */
function getFitnessMultiplier(fitnessStatus) {
  const s = (fitnessStatus || 'fit').toLowerCase();
  if (s.includes('injured')) return 0.75;
  if (s.includes('doubtful')) return 0.90;
  return 1;
}

/**
 * Eski calculateRatingFromStats: geri uyumluluk için (65–95).
 */
function calculateRatingFromStats(latestStats, playerData = {}) {
  const out = calculatePlayerAttributesFromStats(latestStats, playerData);
  return out.rating;
}

module.exports = {
  calculateRatingFromStats,
  calculatePlayerAttributesFromStats,
  rawAttributesFromStats,
  calculatePowerScore,
  calculateForm,
  calculateDiscipline,
  getFitnessMultiplier,
  normalizePositionForWeights,
  parseNum,
  clamp0_100,
};
