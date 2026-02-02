/**
 * Analiz Odağı ↔ Tahmin Eşlemesi
 * TacticIQ - Tasarım Dokümanına Göre (GÜNCEL & TAM)
 *
 * Kural: Her tahmin en fazla 2 analiz odağına bağlıdır.
 * Bonuslar stack olmaz, en yüksek olan uygulanır.
 *
 * 6 Analiz Odağı:
 * - Savunma (defense): Disiplin, sertlik, savunma baskısı
 * - Hücum (offense): Gol, skor, bitiricilik
 * - Orta Saha (midfield): Oyun kontrolü, pas, merkez hakimiyeti
 * - Fiziksel (physical): Tempo, yorgunluk, fiziksel yük
 * - Taktik (tactical): Maç planı, oyun şekli, senaryo
 * - Oyuncu (player): Bireysel performans ve risk
 *
 * ÖZEL EŞLEŞME NOTLARI:
 * - Tempo → Orta Saha (Birincil) + Fiziksel (Birincil) ✓
 * - Senaryo → SADECE Taktik (Birincil) ✓
 * - Kartlar → Savunma (Birincil) + Fiziksel (İkincil) ✓
 */

export type AnalysisFocusType =
  | 'defense'
  | 'offense'
  | 'midfield'
  | 'physical'
  | 'tactical'
  | 'player';

export type FocusTier = 'primary' | 'secondary';

/** Bir odakta hangi tahminler bonus kazandırır (birincil / ikincil) */
export interface FocusPredictionMapping {
  primary: string[];
  secondary: string[];
}

/**
 * 6 Analiz Odağı → Tahmin Kategorileri Eşlemesi
 * Her tahmin en fazla 2 odağa bağlı (1 birincil + 1 ikincil VEYA 2 birincil)
 */
export const ANALYSIS_FOCUS_PREDICTIONS: Record<AnalysisFocusType, FocusPredictionMapping> = {
  // 🛡️ 1. SAVUNMA ODAKLI - Disiplin, sertlik, savunma baskısı
  defense: {
    primary: [
      'yellowCards',      // Maç: Sarı kart sayısı
      'redCards',         // Maç: Kırmızı kart sayısı
      'yellowCard',       // Oyuncu: Sarı kart görecek
      'redCard',          // Oyuncu: Kırmızı kart görecek
      'secondYellowRed',  // Oyuncu: 2. sarıdan kırmızı
      'directRedCard',    // Oyuncu: Direkt kırmızı
    ],
    secondary: [
      'shotsOnTarget',    // İsabetli şut sayısı
      'totalShots',       // Toplam şut sayısı
    ],
  },

  // ⚔️ 2. HÜCUM ODAKLI - Gol, skor, bitiricilik
  offense: {
    primary: [
      'firstHalfHomeScore',   // İlk yarı ev sahibi skoru
      'firstHalfAwayScore',   // İlk yarı deplasman skoru
      'secondHalfHomeScore',  // Maç sonu ev sahibi skoru
      'secondHalfAwayScore',  // Maç sonu deplasman skoru
      'totalGoals',           // Toplam gol sayısı
      'firstGoalTime',        // İlk gol zamanı
      'goal',                 // Oyuncu: Gol atacak
      'willScore',            // Oyuncu: Gol atacak (alternatif)
    ],
    secondary: [
      'shotsOnTarget',        // İsabetli şut sayısı
    ],
  },

  // 🎯 3. ORTA SAHA ODAKLI - Oyun kontrolü, pas, merkez hakimiyeti
  midfield: {
    primary: [
      'possession',           // Top hakimiyeti
      'tempo',                // Maçın genel temposu (Birincil: Orta Saha)
    ],
    secondary: [
      'totalShots',           // Toplam şut sayısı
    ],
  },

  // 🏃 4. FİZİKSEL ODAKLI - Tempo, yorgunluk, fiziksel yük
  physical: {
    primary: [
      'tempo',                // Maçın genel temposu (Birincil: Fiziksel de!)
      'injuredOut',           // Oyuncu: Sakatlanma riski
      'injurySubstitutePlayer', // Oyuncu: Sakatlık yedeği
      'substitutedOut',       // Oyuncu: Oyundan çıkacak
      'substitutePlayer',     // Oyuncu: Oyuna girecek yedek
    ],
    secondary: [
      'yellowCards',          // Sarı kart sayısı (fiziksel yük → faul)
      'secondYellowRed',      // İkinci sarıdan kırmızı
    ],
  },

  // ♟️ 5. TAKTİK ODAKLI - Maç planı, oyun şekli, senaryo (SADECE TAKTİK!)
  // Senaryo: Kontrollü oyun, Baskılı oyun, Geçiş oyunu, Duran toplar
  tactical: {
    primary: [
      'scenario',             // Maç senaryosu (SADECE TAKTİK!)
      'firstHalfInjuryTime',  // İlk yarı ek tahminler (uzatma)
      'secondHalfInjuryTime', // Maç sonu ek tahminler (uzatma)
    ],
    secondary: [
      'totalCorners',         // Korner sayısı
      'possession',           // Top hakimiyeti
    ],
  },

  // 👤 6. OYUNCU ODAKLI - Bireysel performans ve risk
  player: {
    primary: [
      'manOfTheMatch',        // MVP (Maçın Adamı)
      'goal',                 // Gol atacak oyuncu
      'assist',               // Asist yapacak oyuncu
      'willScore',            // Gol atacak (alternatif)
      'willAssist',           // Asist yapacak (alternatif)
    ],
    secondary: [
      'yellowCard',           // Sarı kart görecek
      'substitutedOut',       // Oyundan çıkacak
      'injuredOut',           // Sakatlanma riski
    ],
  },
};

/** Bir tahmin kategorisinin seçili odağa ait olup olmadığını kontrol et */
export function isCategoryInFocus(
  category: string,
  focus: AnalysisFocusType | null,
  tier?: FocusTier
): boolean {
  if (!focus) return false;
  const mapping = ANALYSIS_FOCUS_PREDICTIONS[focus];
  if (!mapping) return false;
  const inPrimary = mapping.primary.includes(category);
  const inSecondary = mapping.secondary.includes(category);
  if (tier === 'primary') return inPrimary;
  if (tier === 'secondary') return inSecondary;
  return inPrimary || inSecondary;
}

/** Seçili odağa ait tüm kategorileri döndür (birleşik liste) */
export function getCategoriesForFocus(focus: AnalysisFocusType | null): string[] {
  if (!focus) return [];
  const mapping = ANALYSIS_FOCUS_PREDICTIONS[focus];
  if (!mapping) return [];
  return [...new Set([...mapping.primary, ...mapping.secondary])];
}

/** Kategori birincil mi ikincil mi? */
export function getCategoryTierInFocus(
  category: string,
  focus: AnalysisFocusType | null
): FocusTier | null {
  if (!focus) return null;
  const mapping = ANALYSIS_FOCUS_PREDICTIONS[focus];
  if (!mapping) return null;
  if (mapping.primary.includes(category)) return 'primary';
  if (mapping.secondary.includes(category)) return 'secondary';
  return null;
}
