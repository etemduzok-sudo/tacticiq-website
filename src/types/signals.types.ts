/**
 * TACTICIQ - CANLI MAÇ SİNYALLERİ TİPLERİ
 * Community Signals System
 * Version: 1.0.0
 */

// ============================================
// SİNYAL TÜRLERİ
// ============================================

/**
 * Saha oyuncuları için sinyal türleri
 */
export type FieldPlayerSignalType = 
  | 'substitution'    // Oyundan çıkacak
  | 'yellowCard'      // Sarı kart görecek
  | 'secondYellow'    // 2. sarıdan atılacak
  | 'redCard'         // Direkt kırmızı kart
  | 'injury'          // Sakatlanacak
  | 'goal'            // Gol atacak
  | 'assist';         // Asist yapacak

/**
 * Kaleci için özel sinyal türleri
 */
export type GoalkeeperSignalType = 
  | 'concede'         // Gol yiyecek
  | 'penaltySave'     // Penaltı kurtaracak
  | 'redCard'         // Kırmızı kart
  | 'injury';         // Sakatlanacak

/**
 * Tüm sinyal türleri (birleşik)
 */
export type SignalType = FieldPlayerSignalType | GoalkeeperSignalType;

// ============================================
// SİNYAL RENKLERİ
// ============================================

export const SIGNAL_COLORS: Record<SignalType, string> = {
  // Saha oyuncuları
  substitution: '#F59E0B',    // Turuncu
  yellowCard: '#FBBF24',      // Sarı
  secondYellow: '#EF4444',    // Kırmızı (gradient için)
  redCard: '#EF4444',         // Kırmızı
  injury: '#8B5CF6',          // Mor
  goal: '#10B981',            // Yeşil
  assist: '#1FA2A6',          // Cyan/Turkuaz
  // Kaleci özel
  concede: '#EC4899',         // Pembe
  penaltySave: '#06B6D4',     // Açık mavi
};

/**
 * İkinci sarı kart için gradient renkleri
 */
export const SECOND_YELLOW_GRADIENT = ['#FBBF24', '#EF4444'];

// ============================================
// SİNYAL ÖNCELİK SIRASI
// ============================================

/**
 * Sinyal öncelik sırası (düşük değer = yüksek öncelik)
 * Birden fazla sinyal varsa, en yüksek öncelikli çerçeve rengini belirler
 */
export const SIGNAL_PRIORITY: Record<SignalType, number> = {
  redCard: 1,
  secondYellow: 2,
  injury: 3,
  substitution: 4,
  concede: 5,
  yellowCard: 6,
  goal: 7,
  assist: 8,
  penaltySave: 9,
};

// ============================================
// SİNYAL EMOJİLERİ
// ============================================

export const SIGNAL_EMOJIS: Record<SignalType, string> = {
  substitution: '🔄',
  yellowCard: '🟨',
  secondYellow: '🟨🟨',
  redCard: '🟥',
  injury: '🏥',
  goal: '⚽',
  assist: '🅰️',
  concede: '😰',
  penaltySave: '🧤',
};

// ============================================
// SİNYAL ETİKETLERİ (TÜRKÇE)
// ============================================

export const SIGNAL_LABELS: Record<SignalType, string> = {
  substitution: 'Oyundan Çıksın',
  yellowCard: 'Sarı Kart Görecek',
  secondYellow: '2. Sarıdan Atılacak',
  redCard: 'Kırmızı Kart Görecek',
  injury: 'Sakatlanacak',
  goal: 'Gol Atacak',
  assist: 'Asist Yapacak',
  concede: 'Gol Yiyecek',
  penaltySave: 'Penaltı Kurtaracak',
};

// ============================================
// SİNYAL ÇELİŞKİLERİ
// ============================================

/**
 * Mantıksal olarak birlikte seçilemeyecek sinyal çiftleri
 * [sinyal1, sinyal2, uyarı mesajı, engellensin mi]
 */
export const SIGNAL_CONFLICTS: Array<[SignalType, SignalType, string, boolean]> = [
  ['substitution', 'goal', 'Oyuncu çıkarsa gol atamaz', false],
  ['substitution', 'assist', 'Oyuncu çıkarsa asist yapamaz', false],
  ['redCard', 'goal', 'Kırmızı kart görürse gol atamaz', true],
  ['redCard', 'assist', 'Kırmızı kart görürse asist yapamaz', true],
  ['injury', 'goal', 'Sakatlanırsa gol atamaz', false],
  ['injury', 'assist', 'Sakatlanırsa asist yapamaz', false],
  ['secondYellow', 'goal', '2. sarıdan atılırsa gol atamaz', true],
  ['secondYellow', 'assist', '2. sarıdan atılırsa asist yapamaz', true],
];

/**
 * Çelişki kontrolü yap
 */
export const checkSignalConflict = (
  signal1: SignalType, 
  signal2: SignalType
): { hasConflict: boolean; message: string; blocked: boolean } | null => {
  for (const [s1, s2, message, blocked] of SIGNAL_CONFLICTS) {
    if ((s1 === signal1 && s2 === signal2) || (s1 === signal2 && s2 === signal1)) {
      return { hasConflict: true, message, blocked };
    }
  }
  return null;
};

// ============================================
// SİNYAL ÇERÇEVE KALINLIĞI
// ============================================

/**
 * Sinyal yoğunluğuna göre çerçeve kalınlığı
 * ✅ GÜNCELLEME: Daha ince, şık çerçeveler (1-2.5px arası)
 */
export const getSignalBorderWidth = (percentage: number): number => {
  if (percentage >= 70) return 2.5;
  if (percentage >= 50) return 2;
  if (percentage >= 30) return 1.5;
  return 1;
};

/**
 * %50+ sinyal için pulse animasyonu gerekli mi?
 */
export const shouldPulse = (percentage: number): boolean => {
  return percentage >= 50;
};

// ============================================
// SİNYAL VERİ YAPISI
// ============================================

export interface PlayerSignal {
  type: SignalType;
  percentage: number;           // 0-100 arası yüzde
  percentageLast15Min: number;  // Son 15 dakikadaki yüzde
  totalVotes: number;           // Toplam oy sayısı
  userParticipated: boolean;    // Kullanıcı katıldı mı?
  isRealized?: boolean;         // Gerçekleşti mi?
  realizedAt?: string;          // Gerçekleşme zamanı (ISO string)
}

export interface SubstitutionSignal extends PlayerSignal {
  type: 'substitution';
  replacementCandidates: Array<{
    playerId: number;
    playerName: string;
    percentage: number;
  }>;
}

export interface PlayerSignals {
  playerId: number;
  playerName: string;
  isGoalkeeper: boolean;
  signals: PlayerSignal[];
  dominantSignal?: PlayerSignal;  // En yüksek yüzdeli sinyal
}

// ============================================
// TOPLULUK VERİSİ EŞİK DEĞERLERİ
// ============================================

/**
 * Minimum kullanıcı sayısı - bunun altında yüzde gösterilmez
 */
export const MIN_USERS_FOR_PERCENTAGE = 50;

/**
 * Mock/test modu için düşük eşik
 */
export const MIN_USERS_FOR_PERCENTAGE_MOCK = 5;

/**
 * Sinyal zaman aşımı (dakika)
 */
export const SIGNAL_EXPIRY_MINUTES = 15;

// ============================================
// BONUS PUAN SİSTEMİ
// ============================================

/**
 * Doğru sinyal tahmini için verilen puanlar
 */
export const SIGNAL_BONUS_POINTS: Record<SignalType, number> = {
  goal: 15,
  assist: 12,
  yellowCard: 8,
  redCard: 20,
  secondYellow: 18,
  substitution: 10,  // Dakika doğruysa (+/-5 dk)
  injury: 15,
  concede: 8,
  penaltySave: 25,
};

/**
 * Çıkış dakikası tahmini toleransı (dakika)
 */
export const SUBSTITUTION_MINUTE_TOLERANCE = 5;

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

/**
 * Oyuncunun pozisyonuna göre uygun sinyal listesini döndür
 */
export const getAvailableSignals = (isGoalkeeper: boolean): SignalType[] => {
  if (isGoalkeeper) {
    return ['concede', 'penaltySave', 'redCard', 'injury'];
  }
  return ['goal', 'assist', 'yellowCard', 'secondYellow', 'redCard', 'substitution', 'injury'];
};

/**
 * Birden fazla sinyalden en yüksek öncelikli olanı bul
 */
export const getDominantSignal = (signals: PlayerSignal[]): PlayerSignal | undefined => {
  if (signals.length === 0) return undefined;
  
  return signals.reduce((dominant, current) => {
    const dominantPriority = SIGNAL_PRIORITY[dominant.type];
    const currentPriority = SIGNAL_PRIORITY[current.type];
    
    // Önce öncelik sırasına bak
    if (currentPriority < dominantPriority) return current;
    if (currentPriority > dominantPriority) return dominant;
    
    // Aynı öncelikte yüzdeye bak
    return current.percentage > dominant.percentage ? current : dominant;
  });
};

/**
 * Sinyal çerçeve stili oluştur
 * ✅ GÜNCELLEME: Şık, ince çerçeveler + subtle glow efekti
 */
export const getSignalBorderStyle = (signal: PlayerSignal | undefined) => {
  if (!signal || signal.percentage < 10) {
    return null;
  }
  
  const color = SIGNAL_COLORS[signal.type];
  const borderWidth = getSignalBorderWidth(signal.percentage);
  
  return {
    borderColor: color,
    borderWidth: borderWidth,
    shouldPulse: shouldPulse(signal.percentage),
    // ✅ Subtle glow efekti (web için boxShadow, native için shadowColor)
    glowColor: color + '40', // 25% opacity
    glowRadius: borderWidth >= 2 ? 8 : 4,
  };
};
