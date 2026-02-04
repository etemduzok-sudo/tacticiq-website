// TacticIQ - Tahmin Zamanlama & Etki Sistemi (LOCK-FREE)
// Tahminler ASLA kilitlenmez, sadece etki katsayısı değişir

/**
 * Tahmin Durumu (UI Etiketleri)
 * YASAK: "Locked / Closed / Unavailable"
 */
export type PredictionTimingStatus = 
  | 'live'      // 🟢 Canlı tahmin - tam etki
  | 'late'      // 🟡 Geç yapıldı – etki azaldı
  | 'post_event'; // 🔵 Olay sonrası tahmin (düşük etki)

/**
 * Etki katsayıları
 */
export const TIMING_EFFECT_MULTIPLIERS = {
  live: 1.0,       // Tam etki
  late: 0.5,       // Yarı etki
  post_event: 0.1, // Sembolik etki (asla 0 değil!)
} as const;

/**
 * UI Etiketleri (Türkçe)
 */
export const TIMING_LABELS = {
  live: {
    emoji: '🟢',
    text: 'Canlı tahmin',
    color: '#10B981', // green-500
  },
  late: {
    emoji: '🟡',
    text: 'Geç yapıldı – etki azaldı',
    color: '#F59E0B', // amber-500
  },
  post_event: {
    emoji: '🔵',
    text: 'Olay sonrası tahmin (düşük etki)',
    color: '#3B82F6', // blue-500
  },
} as const;

/**
 * Maç durumu enum
 */
export type MatchPhase = 
  | 'not_started'  // Maç başlamadı
  | 'first_half'   // İlk yarı
  | 'halftime'     // Devre arası
  | 'second_half'  // İkinci yarı
  | 'extra_time'   // Uzatma
  | 'finished';    // Maç bitti

/**
 * Maç olayları (soft constraint için)
 */
export type MatchEvent = 
  | 'kickoff'           // Maç başladı
  | 'first_goal'        // İlk gol atıldı
  | 'halftime_whistle'  // Devre bitti
  | 'second_half_start' // İkinci yarı başladı
  | 'any_goal'          // Herhangi bir gol
  | 'any_card'          // Herhangi bir kart
  | 'any_substitution'  // Herhangi bir değişiklik
  | 'final_whistle';    // Maç bitti

/**
 * Tahmin kategorisi ve ilgili olaylar
 * Bu olaylar gerçekleşince, ilgili tahmin kategorisinin etkisi düşer
 */
export const PREDICTION_EVENT_MAPPING: Record<string, MatchEvent[]> = {
  // Skor tahminleri - maç bitince düşük etki
  'firstHalfHomeScore': ['halftime_whistle'],
  'firstHalfAwayScore': ['halftime_whistle'],
  'secondHalfHomeScore': ['final_whistle'],
  'secondHalfAwayScore': ['final_whistle'],
  'totalGoals': ['final_whistle'],
  
  // İlk gol - ilk gol atılınca düşük etki
  'firstGoalTime': ['first_goal'],
  'firstGoalScorer': ['first_goal'],
  
  // Kart tahminleri - ilgili kart verilince düşük etki
  'yellowCard': ['any_card'],
  'redCard': ['any_card'],
  'yellowCards': ['final_whistle'],
  'redCards': ['final_whistle'],
  
  // Oyuncu tahminleri - maç bitince düşük etki (ama asla kapalı değil!)
  'manOfTheMatch': ['final_whistle'],
  'goal': ['any_goal'],
  'assist': ['any_goal'],
  'willScore': ['final_whistle'],
  'willAssist': ['final_whistle'],
  
  // Değişiklik tahminleri
  'substitutedOut': ['any_substitution'],
  'substitutePlayer': ['any_substitution'],
  'injuredOut': ['any_substitution'],
  
  // Uzatma tahminleri
  'firstHalfInjuryTime': ['halftime_whistle'],
  'secondHalfInjuryTime': ['final_whistle'],
  
  // Senaryo/Tempo - maç boyunca değişir
  'scenario': ['final_whistle'],
  'tempo': ['final_whistle'],
  'possession': ['final_whistle'],
};

/**
 * Tahmin zamanlama durumunu hesapla
 * @param category Tahmin kategorisi
 * @param matchPhase Maç aşaması
 * @param occurredEvents Gerçekleşen olaylar
 * @returns Tahmin durumu ve etki katsayısı
 */
export function calculatePredictionTiming(
  category: string,
  matchPhase: MatchPhase,
  occurredEvents: MatchEvent[]
): { status: PredictionTimingStatus; multiplier: number; label: typeof TIMING_LABELS[keyof typeof TIMING_LABELS] } {
  // Maç başlamadıysa - tam etki
  if (matchPhase === 'not_started') {
    return {
      status: 'live',
      multiplier: TIMING_EFFECT_MULTIPLIERS.live,
      label: TIMING_LABELS.live,
    };
  }

  // İlgili olaylar gerçekleşti mi kontrol et
  const relevantEvents = PREDICTION_EVENT_MAPPING[category] || [];
  const eventOccurred = relevantEvents.some(event => occurredEvents.includes(event));

  // Olay gerçekleştiyse - düşük etki (ama asla kapalı değil!)
  if (eventOccurred) {
    return {
      status: 'post_event',
      multiplier: TIMING_EFFECT_MULTIPLIERS.post_event,
      label: TIMING_LABELS.post_event,
    };
  }

  // Maç devam ediyor ve olay henüz gerçekleşmedi
  // Maçın ilerleyen dakikalarında geç sayılır
  if (matchPhase === 'second_half' || matchPhase === 'extra_time') {
    // İkinci yarıda yapılan tahminler "geç" sayılır (ama yine de kabul edilir!)
    return {
      status: 'late',
      multiplier: TIMING_EFFECT_MULTIPLIERS.late,
      label: TIMING_LABELS.late,
    };
  }

  // İlk yarı veya devre arası - hala tam etki
  return {
    status: 'live',
    multiplier: TIMING_EFFECT_MULTIPLIERS.live,
    label: TIMING_LABELS.live,
  };
}

/**
 * Maç durumunu phase'e çevir
 */
export function getMatchPhase(status: string, elapsed: number | null): MatchPhase {
  const normalizedStatus = (status || '').toUpperCase();
  
  if (['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(normalizedStatus)) {
    return 'not_started';
  }
  
  if (['FT', 'AET', 'PEN'].includes(normalizedStatus)) {
    return 'finished';
  }
  
  if (normalizedStatus === 'HT') {
    return 'halftime';
  }
  
  if (normalizedStatus === '1H' || (normalizedStatus === 'LIVE' && (elapsed || 0) <= 45)) {
    return 'first_half';
  }
  
  if (['ET', 'BT', 'P'].includes(normalizedStatus)) {
    return 'extra_time';
  }
  
  if (normalizedStatus === '2H' || (normalizedStatus === 'LIVE' && (elapsed || 0) > 45)) {
    return 'second_half';
  }
  
  return 'first_half'; // Default
}

/**
 * Gerçekleşen olayları belirle
 */
export function getOccurredEvents(
  events: Array<{ type: string; detail?: string }>,
  matchPhase: MatchPhase
): MatchEvent[] {
  const occurred: MatchEvent[] = [];
  
  // Maç başladı mı?
  if (matchPhase !== 'not_started') {
    occurred.push('kickoff');
  }
  
  // Devre bitti mi?
  if (['halftime', 'second_half', 'extra_time', 'finished'].includes(matchPhase)) {
    occurred.push('halftime_whistle');
  }
  
  // İkinci yarı başladı mı?
  if (['second_half', 'extra_time', 'finished'].includes(matchPhase)) {
    occurred.push('second_half_start');
  }
  
  // Maç bitti mi?
  if (matchPhase === 'finished') {
    occurred.push('final_whistle');
  }
  
  // Olayları kontrol et
  let hasGoal = false;
  let isFirstGoal = true;
  
  for (const event of events) {
    const eventType = (event.type || '').toLowerCase();
    
    if (eventType === 'goal') {
      if (isFirstGoal) {
        occurred.push('first_goal');
        isFirstGoal = false;
      }
      occurred.push('any_goal');
      hasGoal = true;
    }
    
    if (eventType === 'card') {
      occurred.push('any_card');
    }
    
    if (eventType === 'subst' || eventType === 'substitution') {
      occurred.push('any_substitution');
    }
  }
  
  return [...new Set(occurred)]; // Tekrarları kaldır
}

/**
 * Kullanıcıya gösterilecek timing badge komponenti için props
 */
export interface TimingBadgeProps {
  status: PredictionTimingStatus;
  emoji: string;
  text: string;
  color: string;
  multiplier: number;
}

export function getTimingBadgeProps(
  category: string,
  matchPhase: MatchPhase,
  occurredEvents: MatchEvent[]
): TimingBadgeProps {
  const { status, multiplier, label } = calculatePredictionTiming(category, matchPhase, occurredEvents);
  
  return {
    status,
    emoji: label.emoji,
    text: label.text,
    color: label.color,
    multiplier,
  };
}
