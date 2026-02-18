/**
 * 🧪 MOCK TEST DATA - Canlı Maç Geçişi Testi
 * 
 * Bu dosya 2 mock maç oluşturur:
 *   1. Galatasaray vs Fenerbahçe (Süper Lig Derbisi)
 *   2. Real Madrid vs Barcelona (El Clásico)
 * 
 * Maçlar uygulama başladığında 5 dakika sonra canlıya geçer.
 * Geri sayım, kadro, tahmin, canlı istatistik tüm akışı test edebilirsiniz.
 * 
 * ⚠️ TEST SONRASI: MOCK_TEST_ENABLED = false yaparak devre dışı bırakın
 */

// ============================================================
// ⚡ ANA SWITCH - Test bitince false yap
// ============================================================
export const MOCK_TEST_ENABLED = true;

// ============================================================
// ⏱️ ZAMANLAMA
// ============================================================
/** Maçlar kaç dakika sonra başlasın (canlıya geçsin) — 1 dakika sonra başlayacak */
const START_DELAY_MINUTES = 1;

/** 🧪 TEST: Maç hemen canlı başlasın (ikinci yarı 5. dk) - simülasyonda 1 sn = 1 dk */
const MOCK_START_IMMEDIATELY_LIVE = true; // true = maç 65 sn önce başlamış (simülasyonda 2H 5. dk), false = 1 dk sonra başlar

/** Bildirim gösterilecek zaman (maç başlamadan 1 dakika önce) */
const NOTIFICATION_DELAY_MINUTES = START_DELAY_MINUTES - 1; // 1 dakika

/**
 * Maç 1 başlangıç zamanı - UYGULAMA BAŞLANGICINDA BİR KEZ SABİTLENİR
 * Böylece geri sayım 60'tan 0'a düzgün iner (her render'da yeni zaman üretilmez)
 */
let _match1StartTimeMs: number | null = null;

/** Maç 1 başlangıç zamanı - ilk çağrıda sabitlenir, sonra hep aynı değer döner (dakika oyun sonuna kadar ilerler) */
export function getMatch1Start(): number {
  // ✅ MOCK_START_IMMEDIATELY_LIVE: İlk çağrıda 120 sn önce sabitle = MAÇ BİTMİŞ (FT) - Rating açık!
  if (MOCK_START_IMMEDIATELY_LIVE) {
    if (_match1StartTimeMs === null) {
      _match1StartTimeMs = Date.now() - 120 * 1000; // 120 sn önce = simülasyonda FT (maç bitti, 24 saat rating açık)
    }
    return _match1StartTimeMs;
  }
  if (_match1StartTimeMs === null) {
    _match1StartTimeMs = Date.now() + START_DELAY_MINUTES * 60 * 1000;
  }
  return _match1StartTimeMs;
}

/** Sabitlenmiş maç 1 başlangıç zamanını sıfırla (test için sayfa yenilendiğinde yeni zaman) */
export function resetMockMatch1StartTime(): void {
  _match1StartTimeMs = null;
}

/** Maçı yeniden başlat (test için) - MOCK_START_IMMEDIATELY_LIVE true ise maç bitmiş (FT) */
export function restartMatch1In1Minute(): void {
  _match1StartTimeMs = MOCK_START_IMMEDIATELY_LIVE
    ? Date.now() - 120 * 1000  // 120 SANİYE önce = simülasyonda FT (maç bitti, rating açık)
    : Date.now() + START_DELAY_MINUTES * 60 * 1000;
  console.log('🔄 Maç yeniden başlatıldı:', new Date(_match1StartTimeMs).toISOString(), MOCK_START_IMMEDIATELY_LIVE ? '(FT - Rating Açık)' : '(1 dk sonra)');
}

/** Maç 1 başlangıç zamanını doğrudan ayarla (session restore için) */
export function setMockMatch1StartTime(timestamp: number): void {
  _match1StartTimeMs = timestamp;
}

function getMatchNotificationTime(): number {
  return Date.now() + NOTIFICATION_DELAY_MINUTES * 60 * 1000;
}

/** Maç 1 bildirim zamanı (başlamadan 1 dakika önce) */
export function getMatch1NotificationTime(): number {
  return getMatchNotificationTime();
}

/** Maç 2 başlangıç zamanı (30 saniye sonra) - maç 1 sabitlendikten sonra hesaplanır */
export function getMatch2Start(): number {
  return getMatch1Start() + 30 * 1000;
}

/** Maç 2 bildirim zamanı (başlamadan 1 dakika önce) */
export function getMatch2NotificationTime(): number {
  return getMatch2Start() - 60 * 1000;
}

// ============================================================
// 🆔 FIXTURE ID'LERİ (gerçek API ile çakışmasın)
// ============================================================
export const MOCK_MATCH_IDS = {
  GS_FB: 888001,
  REAL_BARCA: 888002,
} as const;

// ============================================================
// ⚽ TAKIM KADROLARI
// ============================================================

/** Galatasaray Kadrosu */
const GS_SQUAD = {
  coach: { id: 901, name: 'O. Buruk', nationality: 'Turkey' },
  startXI: [
    { player: { id: 50001, name: 'F. Muslera', number: 1, pos: 'G', grid: '1:1' } },
    { player: { id: 50002, name: 'S. Boey', number: 20, pos: 'D', grid: '2:4' } },
    { player: { id: 50003, name: 'D. Nelsson', number: 4, pos: 'D', grid: '2:3' } },
    { player: { id: 50004, name: 'A. Bardakcı', number: 42, pos: 'D', grid: '2:2' } },
    { player: { id: 50005, name: 'A. Kurzawa', number: 12, pos: 'D', grid: '2:1' } },
    { player: { id: 50006, name: 'L. Torreira', number: 34, pos: 'M', grid: '3:3' } },
    { player: { id: 50007, name: 'K. Aktürkoğlu', number: 7, pos: 'M', grid: '3:2' } },
    { player: { id: 50008, name: 'D. Mertens', number: 14, pos: 'M', grid: '3:1' } },
    { player: { id: 50009, name: 'B. Yılmaz', number: 17, pos: 'F', grid: '4:3' } },
    { player: { id: 50010, name: 'M. Icardi', number: 9, pos: 'F', grid: '4:2' } },
    { player: { id: 50011, name: 'V. Osimhen', number: 45, pos: 'F', grid: '4:1' } },
  ],
  substitutes: [
    { player: { id: 50012, name: 'O. Bayram', number: 88, pos: 'G', grid: null } },
    { player: { id: 50013, name: 'K. Seri', number: 6, pos: 'M', grid: null } },
    { player: { id: 50014, name: 'Y. Bakasetas', number: 10, pos: 'M', grid: null } },
    { player: { id: 50015, name: 'E. Kılınç', number: 11, pos: 'F', grid: null } },
    { player: { id: 50016, name: 'H. Dervişoğlu', number: 99, pos: 'F', grid: null } },
  ],
};

/** Fenerbahçe Kadrosu */
const FB_SQUAD = {
  coach: { id: 902, name: 'D. Tedesco', nationality: 'Germany' },
  startXI: [
    { player: { id: 50101, name: 'D. Livakovic', number: 1, pos: 'G', grid: '1:1' } },
    { player: { id: 50102, name: 'B. Osayi-Samuel', number: 2, pos: 'D', grid: '2:4' } },
    { player: { id: 50103, name: 'A. Djiku', number: 4, pos: 'D', grid: '2:3' } },
    { player: { id: 50104, name: 'Ç. Söyüncü', number: 3, pos: 'D', grid: '2:2' } },
    { player: { id: 50105, name: 'F. Kadıoğlu', number: 5, pos: 'D', grid: '2:1' } },
    { player: { id: 50106, name: 'İ. Kahveci', number: 6, pos: 'M', grid: '3:3' } },
    { player: { id: 50107, name: 'F. Amrabat', number: 8, pos: 'M', grid: '3:2' } },
    { player: { id: 50108, name: 'S. Szymanski', number: 10, pos: 'M', grid: '3:1' } },
    { player: { id: 50109, name: 'D. Tadic', number: 11, pos: 'F', grid: '4:3' } },
    { player: { id: 50110, name: 'E. Dzeko', number: 9, pos: 'F', grid: '4:2' } },
    { player: { id: 50111, name: 'Ç. Ünder', number: 17, pos: 'F', grid: '4:1' } },
  ],
  substitutes: [
    { player: { id: 50112, name: 'İ. Bayındır', number: 12, pos: 'G', grid: null } },
    { player: { id: 50113, name: 'J. Oosterwolde', number: 23, pos: 'D', grid: null } },
    { player: { id: 50114, name: 'M. Crespo', number: 7, pos: 'M', grid: null } },
    { player: { id: 50115, name: 'R. Batshuayi', number: 20, pos: 'F', grid: null } },
    { player: { id: 50116, name: 'E. Valencia', number: 18, pos: 'F', grid: null } },
  ],
};

/** Real Madrid Kadrosu */
const REAL_SQUAD = {
  coach: { id: 903, name: 'Carlo Ancelotti', nationality: 'Italy' },
  startXI: [
    { player: { id: 50201, name: 'T. Courtois', number: 1, pos: 'G', grid: '1:1' } },
    { player: { id: 50202, name: 'D. Carvajal', number: 2, pos: 'D', grid: '2:4' } },
    { player: { id: 50203, name: 'A. Rüdiger', number: 22, pos: 'D', grid: '2:3' } },
    { player: { id: 50204, name: 'D. Alaba', number: 4, pos: 'D', grid: '2:2' } },
    { player: { id: 50205, name: 'F. Mendy', number: 23, pos: 'D', grid: '2:1' } },
    { player: { id: 50206, name: 'T. Kroos', number: 8, pos: 'M', grid: '3:3' } },
    { player: { id: 50207, name: 'L. Modrić', number: 10, pos: 'M', grid: '3:2' } },
    { player: { id: 50208, name: 'J. Bellingham', number: 5, pos: 'M', grid: '3:1' } },
    { player: { id: 50209, name: 'Vinícius Jr.', number: 7, pos: 'F', grid: '4:3' } },
    { player: { id: 50210, name: 'K. Mbappé', number: 9, pos: 'F', grid: '4:2' } },
    { player: { id: 50211, name: 'Rodrygo', number: 11, pos: 'F', grid: '4:1' } },
  ],
  substitutes: [
    { player: { id: 50212, name: 'A. Lunin', number: 13, pos: 'G', grid: null } },
    { player: { id: 50213, name: 'E. Militão', number: 3, pos: 'D', grid: null } },
    { player: { id: 50214, name: 'E. Camavinga', number: 12, pos: 'M', grid: null } },
    { player: { id: 50215, name: 'F. Valverde', number: 15, pos: 'M', grid: null } },
    { player: { id: 50216, name: 'E. Hazard', number: 7, pos: 'F', grid: null } },
  ],
};

/** Barcelona Kadrosu */
const BARCA_SQUAD = {
  coach: { id: 904, name: 'Hansi Flick', nationality: 'Germany' },
  startXI: [
    { player: { id: 50301, name: 'M. ter Stegen', number: 1, pos: 'G', grid: '1:1' } },
    { player: { id: 50302, name: 'J. Cancelo', number: 2, pos: 'D', grid: '2:4' } },
    { player: { id: 50303, name: 'R. Araújo', number: 4, pos: 'D', grid: '2:3' } },
    { player: { id: 50304, name: 'A. Christensen', number: 15, pos: 'D', grid: '2:2' } },
    { player: { id: 50305, name: 'A. Baldé', number: 3, pos: 'D', grid: '2:1' } },
    { player: { id: 50306, name: 'Pedri', number: 8, pos: 'M', grid: '3:3' } },
    { player: { id: 50307, name: 'F. de Jong', number: 21, pos: 'M', grid: '3:2' } },
    { player: { id: 50308, name: 'Gavi', number: 6, pos: 'M', grid: '3:1' } },
    { player: { id: 50309, name: 'L. Yamal', number: 19, pos: 'F', grid: '4:3' } },
    { player: { id: 50310, name: 'R. Lewandowski', number: 9, pos: 'F', grid: '4:2' } },
    { player: { id: 50311, name: 'Raphinha', number: 11, pos: 'F', grid: '4:1' } },
  ],
  substitutes: [
    { player: { id: 50312, name: 'İ. Peña', number: 13, pos: 'G', grid: null } },
    { player: { id: 50313, name: 'J. Koundé', number: 23, pos: 'D', grid: null } },
    { player: { id: 50314, name: 'İ. Gündoğan', number: 22, pos: 'M', grid: null } },
    { player: { id: 50315, name: 'F. Torres', number: 17, pos: 'M', grid: null } },
    { player: { id: 50316, name: 'A. Fati', number: 10, pos: 'F', grid: null } },
  ],
};

// ============================================================
// 🏟️ CANLI MAÇ SİMÜLASYONU (skor + olaylar zamanla değişir)
// ============================================================

interface MockEvent {
  minuteOffset: number; // Maç başlangıcından kaç dakika sonra (gerçek zaman - her saniye 1 dakika ilerler)
  extraTime?: number; // Uzatma dakikası (ilk yarı 3 dk, ikinci yarı 4 dk)
  type: 'Goal' | 'Card' | 'Subst' | 'Var' | 'Penalty' | 'OwnGoal' | 'System';
  detail: string;
  teamSide: 'home' | 'away' | null;
  playerName: string;
  assistName?: string;
  playerOut?: string; // Değişiklik için çıkan oyuncu
  playerIn?: string; // Değişiklik için giren oyuncu
}

/** Maç 1 olayları: GS vs FB - Tüm event tipleri için mock eventler */
export const MATCH_1_EVENTS: MockEvent[] = [
  // İlk Yarı (0-45 dk)
  { minuteOffset: 0, type: 'System', detail: 'Kick Off', teamSide: null, playerName: '' },
  { minuteOffset: 5, type: 'Goal', detail: 'Normal Goal', teamSide: 'home', playerName: 'V. Osimhen', assistName: 'K. Aktürkoğlu' },
  { minuteOffset: 8, type: 'Card', detail: 'Yellow Card', teamSide: 'away', playerName: 'F. Amrabat' },
  { minuteOffset: 12, type: 'Goal', detail: 'Normal Goal', teamSide: 'away', playerName: 'E. Dzeko', assistName: 'S. Szymanski' },
  { minuteOffset: 18, type: 'Goal', detail: 'Normal Goal', teamSide: 'home', playerName: 'M. Icardi' },
  { minuteOffset: 22, type: 'Card', detail: 'Yellow Card', teamSide: 'home', playerName: 'L. Torreira' },
  { minuteOffset: 28, type: 'Subst', detail: 'Substitution', teamSide: 'away', playerName: '', playerOut: 'Ç. Ünder', playerIn: 'R. Batshuayi' },
  { minuteOffset: 32, type: 'Goal', detail: 'Penalty', teamSide: 'home', playerName: 'M. Icardi' },
  { minuteOffset: 35, type: 'Card', detail: 'Red Card', teamSide: 'away', playerName: 'A. Djiku' },
  { minuteOffset: 40, type: 'Subst', detail: 'Substitution', teamSide: 'home', playerName: '', playerOut: 'B. Yılmaz', playerIn: 'E. Kılınç' },
  { minuteOffset: 42, type: 'Goal', detail: 'Own Goal', teamSide: 'away', playerName: 'Ç. Söyüncü' },
  { minuteOffset: 45, type: 'System', detail: 'First Half Extra Time', teamSide: null, playerName: '', extraTime: 3 },
  { minuteOffset: 45, extraTime: 1, type: 'Card', detail: 'Yellow Card', teamSide: 'home', playerName: 'D. Nelsson' },
  { minuteOffset: 45, extraTime: 2, type: 'Goal', detail: 'Normal Goal', teamSide: 'away', playerName: 'D. Tadic', assistName: 'E. Dzeko' },
  { minuteOffset: 48, type: 'System', detail: 'Half Time', teamSide: null, playerName: '' },
  
  // Devre Arası (15 saniye - 15 dakika yerine)
  
  // İkinci Yarı (60-105 dk, gerçek zaman 60-105 sn)
  { minuteOffset: 60, type: 'System', detail: 'Second Half Started', teamSide: null, playerName: '' },
  { minuteOffset: 65, type: 'Goal', detail: 'Normal Goal', teamSide: 'home', playerName: 'K. Aktürkoğlu', assistName: 'M. Icardi' },
  { minuteOffset: 70, type: 'Subst', detail: 'Substitution', teamSide: 'away', playerName: '', playerOut: 'İ. Kahveci', playerIn: 'M. Crespo' },
  { minuteOffset: 72, type: 'Card', detail: 'Yellow Card', teamSide: 'home', playerName: 'S. Boey' },
  { minuteOffset: 75, type: 'Goal', detail: 'Normal Goal', teamSide: 'away', playerName: 'R. Batshuayi', assistName: 'D. Tadic' },
  { minuteOffset: 78, type: 'Var', detail: 'VAR', teamSide: null, playerName: 'VAR Check' },
  { minuteOffset: 80, type: 'Subst', detail: 'Substitution', teamSide: 'home', playerName: '', playerOut: 'V. Osimhen', playerIn: 'H. Dervişoğlu' },
  { minuteOffset: 82, type: 'Goal', detail: 'Normal Goal', teamSide: 'home', playerName: 'D. Mertens' },
  { minuteOffset: 85, type: 'Card', detail: 'Yellow Card', teamSide: 'away', playerName: 'F. Kadıoğlu' },
  { minuteOffset: 88, type: 'Subst', detail: 'Substitution', teamSide: 'away', playerName: '', playerOut: 'F. Amrabat', playerIn: 'J. Oosterwolde' },
  { minuteOffset: 90, type: 'System', detail: 'Second Half Extra Time', teamSide: null, playerName: '', extraTime: 4 },
  { minuteOffset: 90, extraTime: 1, type: 'Goal', detail: 'Normal Goal', teamSide: 'away', playerName: 'E. Valencia', assistName: 'M. Crespo' },
  { minuteOffset: 90, extraTime: 2, type: 'Card', detail: 'Red Card', teamSide: 'home', playerName: 'A. Kurzawa' },
  { minuteOffset: 90, extraTime: 3, type: 'Goal', detail: 'Normal Goal', teamSide: 'home', playerName: 'E. Kılınç' },
  { minuteOffset: 94, type: 'System', detail: 'Match Finished', teamSide: null, playerName: '' },
];

/** Maç 2 olayları: Real vs Barça - Tam timeline (0-94 dk) */
export const MATCH_2_EVENTS: MockEvent[] = [
  // Maç Başlangıcı
  { minuteOffset: 0, type: 'System', detail: 'Kick Off', teamSide: null, playerName: '' },
  
  // İlk Yarı (0-45 dk)
  { minuteOffset: 5, type: 'Goal', detail: 'Normal Goal', teamSide: 'home', playerName: 'K. Mbappé', assistName: 'J. Bellingham' },
  { minuteOffset: 10, type: 'Card', detail: 'Yellow Card', teamSide: 'away', playerName: 'R. Araújo' },
  { minuteOffset: 15, type: 'Goal', detail: 'Normal Goal', teamSide: 'away', playerName: 'R. Lewandowski', assistName: 'L. Yamal' },
  { minuteOffset: 20, type: 'Goal', detail: 'Normal Goal', teamSide: 'home', playerName: 'Vinícius Jr.', assistName: 'L. Modrić' },
  { minuteOffset: 28, type: 'Card', detail: 'Yellow Card', teamSide: 'home', playerName: 'A. Tchouaméni' },
  { minuteOffset: 35, type: 'Card', detail: 'Yellow Card', teamSide: 'away', playerName: 'Pedri' },
  { minuteOffset: 42, type: 'Subst', detail: 'Substitution', teamSide: 'away', playerName: 'F. de Jong', playerIn: 'F. de Jong', playerOut: 'Gavi' },
  { minuteOffset: 45, extraTime: 2, type: 'System', detail: 'Half Time', teamSide: null, playerName: '' },
  
  // İkinci Yarı (45-90 dk)
  { minuteOffset: 46, type: 'System', detail: 'Second Half Started', teamSide: null, playerName: '' },
  { minuteOffset: 52, type: 'Card', detail: 'Yellow Card', teamSide: 'home', playerName: 'E. Camavinga' },
  { minuteOffset: 58, type: 'Subst', detail: 'Substitution', teamSide: 'home', playerName: 'Rodrygo', playerIn: 'Rodrygo', playerOut: 'Brahim Díaz' },
  { minuteOffset: 63, type: 'Subst', detail: 'Substitution', teamSide: 'away', playerName: 'Ferran Torres', playerIn: 'Ferran Torres', playerOut: 'R. Lewandowski' },
  { minuteOffset: 70, type: 'Card', detail: 'Yellow Card', teamSide: 'home', playerName: 'D. Rüdiger' },
  { minuteOffset: 75, type: 'Subst', detail: 'Substitution', teamSide: 'home', playerName: 'L. Vázquez', playerIn: 'L. Vázquez', playerOut: 'D. Carvajal' },
  { minuteOffset: 78, type: 'Subst', detail: 'Substitution', teamSide: 'away', playerName: 'Ansu Fati', playerIn: 'Ansu Fati', playerOut: 'L. Yamal' },
  { minuteOffset: 82, type: 'Card', detail: 'Yellow Card', teamSide: 'away', playerName: 'Ansu Fati' },
  { minuteOffset: 85, type: 'Subst', detail: 'Substitution', teamSide: 'home', playerName: 'Joselu', playerIn: 'Joselu', playerOut: 'K. Mbappé' },
  { minuteOffset: 88, type: 'Card', detail: 'Yellow Card', teamSide: 'home', playerName: 'J. Bellingham' },
  
  // Uzatma Dakikaları ve Maç Sonu
  { minuteOffset: 90, extraTime: 0, type: 'System', detail: 'Added Time', teamSide: null, playerName: '' },
  { minuteOffset: 90, extraTime: 4, type: 'System', detail: 'Match Finished', teamSide: null, playerName: '' },
];

export function computeLiveState(matchStartTime: number, events: MockEvent[]) {
  const now = Date.now();
  // ✅ Her saniye 1 dakika ilerlesin: (now - matchStartTime) / 1000 = geçen saniye = geçen dakika
  const elapsedSeconds = Math.floor((now - matchStartTime) / 1000);
  const elapsedMinutes = elapsedSeconds; // 1 sn = 1 dk
  const isLive = now >= matchStartTime;
  
  // ✅ Maç henüz başlamadıysa NS döndür
  if (!isLive) {
    return { status: 'NS', elapsed: null, extraTime: null, homeGoals: null, awayGoals: null, events: [] };
  }

  // ✅ Maç bitti mi? (112 dakika = 112 saniye)
  if (elapsedMinutes >= 112) {
    const allEvents = events.filter(e => e.minuteOffset <= 112);
    // ✅ Own goal düzeltmesi: kendi kalesine gol rakibe yazılır
    const homeGoals = allEvents.filter(e => {
      if (e.type !== 'Goal') return false;
      if (e.detail === 'Own Goal') return e.teamSide === 'away'; // Rakip takımın OG'si ev sahibine yazılır
      return e.teamSide === 'home';
    }).length;
    const awayGoals = allEvents.filter(e => {
      if (e.type !== 'Goal') return false;
      if (e.detail === 'Own Goal') return e.teamSide === 'home'; // Ev sahibinin OG'si deplasmana yazılır
      return e.teamSide === 'away';
    }).length;
    return {
      status: 'FT',
      elapsed: 90,
      extraTime: 4,
      homeGoals,
      awayGoals,
      events: allEvents,
    };
  }

  // Geçen süreye göre gerçekleşen olayları hesapla
  // Event dakikası + extraTime kontrolü
  const occurredEvents = events.filter(e => {
    // Normal eventler (extraTime yok)
    if (e.extraTime == null) {
      return e.minuteOffset <= elapsedMinutes;
    }
    
    // ExtraTime'lı eventler
    // İlk yarı uzatması: 45. dk + extraTime (1, 2, 3)
    if (e.minuteOffset === 45) {
      if (elapsedMinutes < 45) return false;
      if (elapsedMinutes >= 45 && elapsedMinutes <= 48) {
        // Uzatma dakikası kontrolü
        return elapsedMinutes >= (45 + e.extraTime);
      }
      // 48'den sonra tüm uzatma eventleri gösterilir
      return true;
    }
    
    // İkinci yarı uzatması: 90. dk + extraTime (1, 2, 3, 4)
    if (e.minuteOffset === 90) {
      if (elapsedMinutes < 90) return false;
      if (elapsedMinutes >= 90 && elapsedMinutes <= 94) {
        // Uzatma dakikası kontrolü
        return elapsedMinutes >= (90 + e.extraTime);
      }
      // 94'ten sonra tüm uzatma eventleri gösterilir
      return true;
    }
    
    return false;
  });

  // ✅ Skor hesaplama: Kendi kalesine gol durumunda teamSide tersine çevrilir
  const homeGoals = occurredEvents.filter(e => {
    if (e.type !== 'Goal') return false;
    // ✅ Kendi kalesine gol: teamSide tersine çevrilir (away takımından gol atıldıysa home'a yazılır)
    if (e.detail === 'Own Goal') {
      return e.teamSide === 'away'; // Away takımından own goal = home takımına gol
    }
    return e.teamSide === 'home';
  }).length;
  
  const awayGoals = occurredEvents.filter(e => {
    if (e.type !== 'Goal') return false;
    // ✅ Kendi kalesine gol: teamSide tersine çevrilir (home takımından gol atıldıysa away'a yazılır)
    if (e.detail === 'Own Goal') {
      return e.teamSide === 'home'; // Home takımından own goal = away takımına gol
    }
    return e.teamSide === 'away';
  }).length;

  // ✅ İlk yarı: 0-48 dk (45+3 uzatma)
  // ✅ Devre arası: 48-60 dk (15 saniye = 15 dakika simülasyon)
  // ✅ İkinci yarı: 60-94 dk (45+4 uzatma)
  let status = '1H';
  let actualElapsed = elapsedMinutes;
  let extraTime: number | null = null;
  
  if (elapsedMinutes < 45) {
    status = '1H';
    actualElapsed = elapsedMinutes;
  } else if (elapsedMinutes >= 45 && elapsedMinutes <= 48) {
    status = '1H';
    actualElapsed = 45;
    extraTime = elapsedMinutes - 45;
  } else if (elapsedMinutes > 48 && elapsedMinutes < 60) {
    status = 'HT';
    actualElapsed = 45;
    extraTime = 3;
  } else if (elapsedMinutes >= 60 && elapsedMinutes < 90) {
    status = '2H';
    actualElapsed = 45 + (elapsedMinutes - 60);
  } else if (elapsedMinutes >= 90 && elapsedMinutes <= 94) {
    status = '2H';
    actualElapsed = 90;
    extraTime = elapsedMinutes - 90;
  }

  return {
    status,
    elapsed: actualElapsed,
    extraTime,
    homeGoals,
    awayGoals,
    events: occurredEvents,
  };
}

// ============================================================
// 🔄 DİNAMİK MOCK MAÇ ÜRETİCİ
// Her çağrıda güncel zamana göre durum hesaplar
// ============================================================

export function getMockTestMatches(): any[] {
  if (!MOCK_TEST_ENABLED) return [];

  // ✅ Aynı sabit başlangıç (getMatch1Start) kullanılsın ki dakika maç sonuna kadar ilerlesin
  const match1Start = getMatch1Start();
  const match2Start = getMatch2Start();
  
  const state1 = computeLiveState(match1Start, MATCH_1_EVENTS);
  const state2 = computeLiveState(match2Start, MATCH_2_EVENTS);

  return [
    // ── Maç 1: Galatasaray vs Fenerbahçe ──
    {
      fixture: {
        id: MOCK_MATCH_IDS.GS_FB,
        date: new Date(match1Start).toISOString(),
        timestamp: Math.floor(match1Start / 1000),
        status: {
          short: state1.status,
          long: state1.status === 'NS' ? 'Not Started' : state1.status === 'HT' ? 'Halftime' : state1.status === '2H' ? 'Second Half' : state1.status === 'FT' ? 'Match Finished' : 'First Half',
          elapsed: state1.elapsed,
          extra: state1.extraTime,
        },
        venue: { name: 'Rams Park', city: 'İstanbul' },
        referee: 'C. Çakır',
      },
      league: { id: 203, name: 'Süper Lig', country: 'Turkey', logo: null, season: 2025, round: 'Regular Season - 25' },
      teams: {
        home: { id: 645, name: 'Galatasaray', logo: null },
        away: { id: 611, name: 'Fenerbahçe', logo: null },
      },
      goals: { home: state1.homeGoals, away: state1.awayGoals },
      score: {
        // ✅ Halftime skoru: İlk yarıdaki gollerden hesapla (donmuş skor)
        halftime: (() => {
          if (state1.status === 'NS' || state1.elapsed == null || state1.elapsed < 45) return { home: null, away: null };
          const htEvents = MATCH_1_EVENTS.filter(e => e.type === 'Goal' && e.minuteOffset <= 55); // 55 = ~45+HT
          let htHome = 0, htAway = 0;
          for (const e of htEvents) {
            if (e.detail === 'Own Goal') { if (e.teamSide === 'home') htAway++; else htHome++; }
            else { if (e.teamSide === 'home') htHome++; else htAway++; }
          }
          return { home: htHome, away: htAway };
        })(),
        fulltime: state1.status === 'FT' ? { home: state1.homeGoals, away: state1.awayGoals } : { home: null, away: null },
      },
    },
    // ── Maç 2: Real Madrid vs Barcelona ──
    {
      fixture: {
        id: MOCK_MATCH_IDS.REAL_BARCA,
        date: new Date(match2Start).toISOString(),
        timestamp: Math.floor(match2Start / 1000),
        status: {
          short: state2.status,
          long: state2.status === 'NS' ? 'Not Started' : state2.status === 'HT' ? 'Halftime' : state2.status === '2H' ? 'Second Half' : state2.status === 'FT' ? 'Match Finished' : 'First Half',
          elapsed: state2.elapsed,
          extra: state2.extraTime,
        },
        venue: { name: 'Santiago Bernabéu', city: 'Madrid' },
        referee: 'F. Brych',
      },
      league: { id: 140, name: 'La Liga', country: 'Spain', logo: null, season: 2025, round: 'Regular Season - 30' },
      teams: {
        home: { id: 541, name: 'Real Madrid', logo: null },
        away: { id: 529, name: 'Barcelona', logo: null },
      },
      goals: { home: state2.homeGoals, away: state2.awayGoals },
      score: {
        // ✅ Halftime skoru: İlk yarıdaki gollerden hesapla (donmuş skor)
        halftime: (() => {
          if (state2.status === 'NS' || state2.elapsed == null || state2.elapsed < 45) return { home: null, away: null };
          const htEvents = MATCH_2_EVENTS.filter(e => e.type === 'Goal' && e.minuteOffset <= 55);
          let htHome = 0, htAway = 0;
          for (const e of htEvents) {
            if (e.detail === 'Own Goal') { if (e.teamSide === 'home') htAway++; else htHome++; }
            else { if (e.teamSide === 'home') htHome++; else htAway++; }
          }
          return { home: htHome, away: htAway };
        })(),
        fulltime: state2.status === 'FT' ? { home: state2.homeGoals, away: state2.awayGoals } : { home: null, away: null },
      },
    },
  ];
}

/**
 * Belirli bir mock maçın lineup verisini döndür
 * MatchDetail ekranında kadro yüklenirken kullanılır
 */
export function getMockLineup(fixtureId: number): any[] | null {
  if (!MOCK_TEST_ENABLED) return null;

  if (fixtureId === MOCK_MATCH_IDS.GS_FB) {
    return [
      {
        team: { id: 645, name: 'Galatasaray', logo: null, colors: { primary: '#E30613', secondary: '#FDB913' } },
        coach: GS_SQUAD.coach,
        formation: '4-3-3',
        startXI: GS_SQUAD.startXI.map(p => ({
          player: { ...p.player, rating: 78 + Math.floor(Math.random() * 10), stats: { pace: 75, shooting: 72, passing: 78, dribbling: 74, defending: 68, physical: 76 } },
        })),
        substitutes: GS_SQUAD.substitutes.map(p => ({
          player: { ...p.player, rating: 72 + Math.floor(Math.random() * 8), stats: { pace: 72, shooting: 68, passing: 74, dribbling: 70, defending: 65, physical: 72 } },
        })),
      },
      {
        team: { id: 611, name: 'Fenerbahçe', logo: null, colors: { primary: '#FFED00', secondary: '#00205B' } },
        coach: FB_SQUAD.coach,
        formation: '4-3-3',
        startXI: FB_SQUAD.startXI.map(p => ({
          player: { ...p.player, rating: 77 + Math.floor(Math.random() * 10), stats: { pace: 74, shooting: 71, passing: 77, dribbling: 73, defending: 70, physical: 75 } },
        })),
        substitutes: FB_SQUAD.substitutes.map(p => ({
          player: { ...p.player, rating: 71 + Math.floor(Math.random() * 8), stats: { pace: 71, shooting: 67, passing: 72, dribbling: 68, defending: 64, physical: 71 } },
        })),
      },
    ];
  }

  if (fixtureId === MOCK_MATCH_IDS.REAL_BARCA) {
    return [
      {
        team: { id: 541, name: 'Real Madrid', logo: null, colors: { primary: '#FFFFFF', secondary: '#00529F' } },
        coach: REAL_SQUAD.coach,
        formation: '4-3-3',
        startXI: REAL_SQUAD.startXI.map(p => ({
          player: { ...p.player, rating: 82 + Math.floor(Math.random() * 10), stats: { pace: 82, shooting: 80, passing: 84, dribbling: 82, defending: 72, physical: 80 } },
        })),
        substitutes: REAL_SQUAD.substitutes.map(p => ({
          player: { ...p.player, rating: 76 + Math.floor(Math.random() * 8), stats: { pace: 76, shooting: 74, passing: 78, dribbling: 75, defending: 70, physical: 76 } },
        })),
      },
      {
        team: { id: 529, name: 'Barcelona', logo: null, colors: { primary: '#004D98', secondary: '#A50044' } },
        coach: BARCA_SQUAD.coach,
        formation: '4-3-3',
        startXI: BARCA_SQUAD.startXI.map(p => ({
          player: { ...p.player, rating: 81 + Math.floor(Math.random() * 10), stats: { pace: 80, shooting: 78, passing: 86, dribbling: 84, defending: 70, physical: 76 } },
        })),
        substitutes: BARCA_SQUAD.substitutes.map(p => ({
          player: { ...p.player, rating: 75 + Math.floor(Math.random() * 8), stats: { pace: 75, shooting: 72, passing: 78, dribbling: 76, defending: 68, physical: 74 } },
        })),
      },
    ];
  }

  return null;
}

/**
 * Mock maç ID mi kontrol et
 */
export function isMockTestMatch(fixtureId: number): boolean {
  return MOCK_TEST_ENABLED && (fixtureId === MOCK_MATCH_IDS.GS_FB || fixtureId === MOCK_MATCH_IDS.REAL_BARCA);
}

/**
 * Mock maçlarda "kullanıcının takımı": 888001 → Fenerbahçe (611), 888002 → Real Madrid (541)
 * Kadro seçimi ve kayıt bu takıma göre yapılır.
 */
export function getMockUserTeamId(fixtureId: number): number | undefined {
  if (!MOCK_TEST_ENABLED) return undefined;
  if (fixtureId === MOCK_MATCH_IDS.GS_FB) return 611;   // FB
  if (fixtureId === MOCK_MATCH_IDS.REAL_BARCA) return 541; // Real
  return undefined;
}

/**
 * Bir sonraki mock maç başlangıç zamanı (ms cinsinden)
 * Timer ayarlamak için kullanılır
 */
export function getNextMockMatchStartTime(): number | null {
  if (!MOCK_TEST_ENABLED) return null;
  const match1Start = getMatch1Start();
  const match2Start = getMatch2Start();
  const now = Date.now();
  if (now < match1Start) return match1Start;
  if (now < match2Start) return match2Start;
  return null;
}

/**
 * Mock maçlardan herhangi biri henüz başlamadı mı?
 */
export function hasPendingMockMatches(): boolean {
  if (!MOCK_TEST_ENABLED) return false;
  const match2Start = getMatch2Start();
  return Date.now() < match2Start;
}

/**
 * Mock maç için event listesini API-Football formatına dönüştür
 */
export async function getMockMatchEvents(fixtureId: number): Promise<any[]> {
  if (!MOCK_TEST_ENABLED) return [];
  
  let events: MockEvent[] = [];
  if (fixtureId === MOCK_MATCH_IDS.GS_FB) {
    events = MATCH_1_EVENTS;
  } else if (fixtureId === MOCK_MATCH_IDS.REAL_BARCA) {
    events = MATCH_2_EVENTS;
  } else {
    return [];
  }
  
  const matchStart = fixtureId === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
  const state = computeLiveState(matchStart, events);
  
  // ✅ TÜM eventleri döndür (filtreleme MatchLive.tsx'de yapılacak)
  // computeLiveState sadece status ve gol sayısı için kullanılıyor
  // Event filtrelemesi MatchLive.tsx'deki currentMinute ile yapılacak
  // Gol sayısını sırayla hesapla (tüm eventler için)
  let currentHomeGoals = 0;
  let currentAwayGoals = 0;
  
  // ✅ Tüm eventleri döndür, filtreleme MatchLive.tsx'de yapılacak
  return events.map((event: MockEvent) => {
    const team = event.teamSide === 'home' 
      ? (fixtureId === MOCK_MATCH_IDS.GS_FB ? { id: 645, name: 'Galatasaray' } : { id: 541, name: 'Real Madrid' })
      : event.teamSide === 'away'
      ? (fixtureId === MOCK_MATCH_IDS.GS_FB ? { id: 611, name: 'Fenerbahçe' } : { id: 529, name: 'Barcelona' })
      : null;
    
    let type = event.type;
    let detail = event.detail;
    
    // Gol sayısını hesapla (sırayla)
    // ✅ Own goal düzeltmesi: kendi kalesine gol rakibe yazılır
    if (event.type === 'Goal' && event.teamSide) {
      if (event.detail === 'Own Goal') {
        // Own goal: atan takımın rakibine yazılır
        if (event.teamSide === 'home') currentAwayGoals++;
        else currentHomeGoals++;
      } else {
        if (event.teamSide === 'home') currentHomeGoals++;
        else currentAwayGoals++;
      }
    }
    
    // System eventlerini Goal type'ına çevir (API-Football formatı)
    if (event.type === 'System') {
      type = 'Goal';
      if (event.detail === 'Kick Off') detail = 'Match Kick Off';
      else if (event.detail === 'First Half Extra Time') detail = 'First Half Extra Time';
      else if (event.detail === 'Half Time') detail = 'Half Time';
      else if (event.detail === 'Second Half Started') detail = 'Second Half Started';
      else if (event.detail === 'Second Half Extra Time') detail = 'Second Half Extra Time';
      else if (event.detail === 'Match Finished') detail = 'Match Finished';
    }
    
    // Substitution eventlerini düzelt
    if (event.type === 'Subst') {
      type = 'Subst';
      detail = 'Substitution';
    }
    
    // VAR eventlerini düzelt
    if (event.type === 'Var') {
      type = 'Var';
      detail = 'VAR';
    }
    
    // ✅ elapsed değerini maç dakikasına çevir
    // minuteOffset: gerçek zaman (0-112 arası)
    // elapsed: maç dakikası (0-45, 45+1-3, 46-90, 90+1-4)
    let elapsed: number;
    if (event.minuteOffset <= 45) {
      // İlk yarı normal dakikaları
      elapsed = event.minuteOffset;
    } else if (event.minuteOffset <= 48) {
      // İlk yarı uzatması: 45+1, 45+2, 45+3
      elapsed = 45; // elapsed 45, extraTime ile gösterilir
    } else if (event.minuteOffset < 60) {
      // Devre arası: elapsed 45, extraTime 3
      elapsed = 45;
    } else if (event.minuteOffset < 90) {
      // İkinci yarı normal dakikaları: 60. elapsed dk = 46. maç dk
      elapsed = 46 + (event.minuteOffset - 60);
    } else if (event.minuteOffset <= 94) {
      // İkinci yarı uzatması: 90+1, 90+2, 90+3, 90+4
      elapsed = 90; // elapsed 90, extraTime ile gösterilir
    } else {
      // Maç bitti (94. dakikada)
      elapsed = 90;
    }
    
    // ✅ "Half Time" ve "Match Finished" için extraTime - ilk yarı 45+3'te, maç 90+4'te biter
    let extraTime = event.extraTime ?? null;
    if (event.detail === 'Half Time' && event.minuteOffset === 48) {
      extraTime = 3; // İlk yarı 45+3 dk sonunda biter (45+1, 45+2 eventlerinden sonra)
    }
    if (event.detail === 'Match Finished' && event.minuteOffset === 94) {
      extraTime = 4; // İkinci yarı 90+4 dk sonunda biter
    }
    
    return {
      time: {
        elapsed: elapsed,
        extra: extraTime,
      },
      type,
      detail,
      team,
      player: event.playerName ? { name: event.playerName } : (event.type === 'Subst' && event.playerOut ? { name: event.playerOut } : null),
      assist: event.assistName ? { name: event.assistName } : null,
      goals: event.type === 'Goal' && event.teamSide 
        ? { home: currentHomeGoals, away: currentAwayGoals }
        : null,
      comments: event.extraTime ? String(event.extraTime) : (event.type === 'Subst' && event.playerIn ? event.playerIn : null),
    };
  });
}

/**
 * Mock maç başlamadan 1 dakika önce bildirim gösterilmeli mi?
 */
export function shouldShowMatchNotification(matchId: number): boolean {
  if (!MOCK_TEST_ENABLED) return false;
  const now = Date.now();
  
  if (matchId === MOCK_MATCH_IDS.GS_FB) {
    const match1Start = getMatch1Start();
    const notificationTime = getMatch1NotificationTime();
    // Bildirim zamanı geçti mi ve maç henüz başlamadı mı?
    return now >= notificationTime && now < match1Start;
  }
  
  if (matchId === MOCK_MATCH_IDS.REAL_BARCA) {
    const match2Start = getMatch2Start();
    const notificationTime = getMatch2NotificationTime();
    // Bildirim zamanı geçti mi ve maç henüz başlamadı mı?
    return now >= notificationTime && now < match2Start;
  }
  
  return false;
}

/**
 * Mock maç bildirim mesajı
 */
export function getMatchNotificationMessage(matchId: number): string | null {
  if (!MOCK_TEST_ENABLED) return null;
  
  if (matchId === MOCK_MATCH_IDS.GS_FB) {
    return 'Galatasaray vs Fenerbahçe maçı 1 dakika sonra başlayacak!';
  }
  
  if (matchId === MOCK_MATCH_IDS.REAL_BARCA) {
    return 'Real Madrid vs Barcelona maçı 1 dakika sonra başlayacak!';
  }
  
  return null;
}

/** Konsola mock test bilgisi yaz */
export function logMockTestInfo(): void {
  if (!MOCK_TEST_ENABLED) return;
  const now = Date.now();
  const match1Start = getMatch1Start();
  const match2Start = getMatch2Start();
  const match1NotificationTime = getMatch1NotificationTime();
  const match2NotificationTime = getMatch2NotificationTime();
  
  const m1Remaining = Math.max(0, Math.ceil((match1Start - now) / 1000));
  const m2Remaining = Math.max(0, Math.ceil((match2Start - now) / 1000));
  const m1NotificationRemaining = Math.max(0, Math.ceil((match1NotificationTime - now) / 1000));
  const m2NotificationRemaining = Math.max(0, Math.ceil((match2NotificationTime - now) / 1000));
  
  console.log(`\n🧪 ═══════════════════════════════════════════`);
  console.log(`🧪 MOCK TEST AKTİF`);
  console.log(`🧪 ───────────────────────────────────────────`);
  console.log(`🧪 Maç 1: GS vs FB`);
  console.log(`🧪   Bildirim: ${m1NotificationRemaining > 0 ? `${Math.floor(m1NotificationRemaining / 60)}:${String(m1NotificationRemaining % 60).padStart(2, '0')} sonra` : (now >= match1NotificationTime && now < match1Start ? '🔔 ŞİMDİ!' : 'Geçti')}`);
  console.log(`🧪   Başlangıç: ${m1Remaining > 0 ? `${Math.floor(m1Remaining / 60)}:${String(m1Remaining % 60).padStart(2, '0')} kaldı` : '🔴 CANLI!'}`);
  console.log(`🧪 Maç 2: Real vs Barça`);
  console.log(`🧪   Bildirim: ${m2NotificationRemaining > 0 ? `${Math.floor(m2NotificationRemaining / 60)}:${String(m2NotificationRemaining % 60).padStart(2, '0')} sonra` : (now >= match2NotificationTime && now < match2Start ? '🔔 ŞİMDİ!' : 'Geçti')}`);
  console.log(`🧪   Başlangıç: ${m2Remaining > 0 ? `${Math.floor(m2Remaining / 60)}:${String(m2Remaining % 60).padStart(2, '0')} kaldı` : '🔴 CANLI!'}`);
  console.log(`🧪 ═══════════════════════════════════════════\n`);
}

// ============================================================
// 🎯 KULLANICI TERCİH İSTATİSTİKLERİ (Tahmin yapmayan kullanıcılar için)
// Real Madrid - Barcelona maçı için mock veri
// ============================================================

/**
 * Kullanıcı tercih istatistikleri veri yapısı
 * Maç başlamadan önce tahmin yapmayan kullanıcılar için
 * sistem bu verileri kullanarak otomatik kadro oluşturur
 */
export interface UserPreferenceStats {
  matchId: number;
  teamId: number;
  teamName: string;
  totalUsers: number; // Toplam tahmin yapan kullanıcı sayısı
  attackFormation: {
    selected: string; // En çok tercih edilen formasyon
    stats: { formation: string; percentage: number; count: number }[];
  };
  defenseFormation: {
    selected: string; // En çok tercih edilen formasyon
    stats: { formation: string; percentage: number; count: number }[];
  };
  playerPositions: {
    position: string; // 'GK', 'LB', 'CB1', 'CB2', 'RB', 'CM1', 'CM2', 'CM3', 'LW', 'ST', 'RW'
    positionLabel: string; // 'Kaleci', 'Sol Bek', vb.
    selectedPlayer: { id: number; name: string; percentage: number } | null;
    preferences: { 
      playerId: number; 
      playerName: string; 
      percentage: number; 
      count: number;
      isInStartingXI: boolean; // İlk 11'de mi?
    }[];
  }[];
}

/**
 * Galatasaray taraftarlarının tercih istatistikleri
 * Maç: Galatasaray vs Fenerbahçe (888001)
 */
export const GALATASARAY_USER_PREFERENCES: UserPreferenceStats = {
  matchId: MOCK_MATCH_IDS.GS_FB,
  teamId: 645,
  teamName: 'Galatasaray',
  totalUsers: 18432, // Toplam tahmin yapan kullanıcı sayısı
  attackFormation: {
    selected: '4-3-3',
    stats: [
      { formation: '4-3-3', percentage: 45, count: 8294 },
      { formation: '4-2-3-1', percentage: 28, count: 5161 },
      { formation: '3-5-2', percentage: 18, count: 3318 },
      { formation: '4-4-2', percentage: 9, count: 1659 },
    ],
  },
  defenseFormation: {
    selected: '4-4-2',
    stats: [
      { formation: '4-4-2', percentage: 38, count: 7004 },
      { formation: '4-5-1', percentage: 32, count: 5898 },
      { formation: '5-3-2', percentage: 20, count: 3686 },
      { formation: '5-4-1', percentage: 10, count: 1844 },
    ],
  },
  playerPositions: [
    {
      position: 'GK',
      positionLabel: 'Kaleci',
      selectedPlayer: { id: 50001, name: 'F. Muslera', percentage: 96 },
      preferences: [
        { playerId: 50001, playerName: 'F. Muslera', percentage: 96, count: 17695, isInStartingXI: true },
        { playerId: 50012, playerName: 'G. Güvenç', percentage: 4, count: 737, isInStartingXI: false },
      ],
    },
    {
      position: 'RB',
      positionLabel: 'Sağ Bek',
      selectedPlayer: { id: 50002, name: 'S. Boey', percentage: 89 },
      preferences: [
        { playerId: 50002, playerName: 'S. Boey', percentage: 89, count: 16405, isInStartingXI: true },
        { playerId: 50013, playerName: 'K. Ayhan', percentage: 11, count: 2027, isInStartingXI: false },
      ],
    },
    {
      position: 'CB1',
      positionLabel: 'Stoper (Sağ)',
      selectedPlayer: { id: 50003, name: 'D. Nelsson', percentage: 82 },
      preferences: [
        { playerId: 50003, playerName: 'D. Nelsson', percentage: 82, count: 15114, isInStartingXI: true },
        { playerId: 50004, playerName: 'A. Bardakcı', percentage: 18, count: 3318, isInStartingXI: true },
      ],
    },
    {
      position: 'CB2',
      positionLabel: 'Stoper (Sol)',
      selectedPlayer: { id: 50004, name: 'A. Bardakcı', percentage: 75 },
      preferences: [
        { playerId: 50004, playerName: 'A. Bardakcı', percentage: 75, count: 13824, isInStartingXI: true },
        { playerId: 50003, playerName: 'D. Nelsson', percentage: 25, count: 4608, isInStartingXI: true },
      ],
    },
    {
      position: 'LB',
      positionLabel: 'Sol Bek',
      selectedPlayer: { id: 50005, name: 'B. Yılmaz', percentage: 88 },
      preferences: [
        { playerId: 50005, playerName: 'B. Yılmaz', percentage: 88, count: 16220, isInStartingXI: true },
        { playerId: 50014, playerName: 'K. Kökçü', percentage: 12, count: 2212, isInStartingXI: false },
      ],
    },
    {
      position: 'CM1',
      positionLabel: 'Merkez Orta Saha (Sağ)',
      selectedPlayer: { id: 50006, name: 'L. Torreira', percentage: 91 },
      preferences: [
        { playerId: 50006, playerName: 'L. Torreira', percentage: 91, count: 16773, isInStartingXI: true },
        { playerId: 50007, playerName: 'K. Ayhan', percentage: 6, count: 1106, isInStartingXI: true },
        { playerId: 50015, playerName: 'E. Kılınç', percentage: 3, count: 553, isInStartingXI: false },
      ],
    },
    {
      position: 'CM2',
      positionLabel: 'Merkez Orta Saha (Orta)',
      selectedPlayer: { id: 50007, name: 'K. Ayhan', percentage: 78 },
      preferences: [
        { playerId: 50007, playerName: 'K. Ayhan', percentage: 78, count: 14377, isInStartingXI: true },
        { playerId: 50006, playerName: 'L. Torreira', percentage: 15, count: 2765, isInStartingXI: true },
        { playerId: 50008, playerName: 'L. Demirbay', percentage: 7, count: 1290, isInStartingXI: true },
      ],
    },
    {
      position: 'CM3',
      positionLabel: 'Merkez Orta Saha (Sol)',
      selectedPlayer: { id: 50008, name: 'L. Demirbay', percentage: 72 },
      preferences: [
        { playerId: 50008, playerName: 'L. Demirbay', percentage: 72, count: 13271, isInStartingXI: true },
        { playerId: 50007, playerName: 'K. Ayhan', percentage: 20, count: 3686, isInStartingXI: true },
        { playerId: 50015, playerName: 'E. Kılınç', percentage: 8, count: 1475, isInStartingXI: false },
      ],
    },
    {
      position: 'LW',
      positionLabel: 'Sol Kanat',
      selectedPlayer: { id: 50009, name: 'K. Aktürkoğlu', percentage: 94 },
      preferences: [
        { playerId: 50009, playerName: 'K. Aktürkoğlu', percentage: 94, count: 17326, isInStartingXI: true },
        { playerId: 50010, playerName: 'M. Icardi', percentage: 4, count: 737, isInStartingXI: true },
        { playerId: 50016, playerName: 'H. Dervişoğlu', percentage: 2, count: 369, isInStartingXI: false },
      ],
    },
    {
      position: 'ST',
      positionLabel: 'Santrafor',
      selectedPlayer: { id: 50010, name: 'M. Icardi', percentage: 97 },
      preferences: [
        { playerId: 50010, playerName: 'M. Icardi', percentage: 97, count: 17879, isInStartingXI: true },
        { playerId: 50009, playerName: 'K. Aktürkoğlu', percentage: 2, count: 369, isInStartingXI: true },
        { playerId: 50016, playerName: 'H. Dervişoğlu', percentage: 1, count: 184, isInStartingXI: false },
      ],
    },
    {
      position: 'RW',
      positionLabel: 'Sağ Kanat',
      selectedPlayer: { id: 50011, name: 'Y. Akgün', percentage: 85 },
      preferences: [
        { playerId: 50011, playerName: 'Y. Akgün', percentage: 85, count: 15667, isInStartingXI: true },
        { playerId: 50009, playerName: 'K. Aktürkoğlu', percentage: 10, count: 1843, isInStartingXI: true },
        { playerId: 50015, playerName: 'E. Kılınç', percentage: 5, count: 922, isInStartingXI: false },
      ],
    },
  ],
};

/**
 * Fenerbahçe taraftarlarının tercih istatistikleri
 * Maç: Galatasaray vs Fenerbahçe (888001)
 */
export const FENERBAHCE_USER_PREFERENCES: UserPreferenceStats = {
  matchId: MOCK_MATCH_IDS.GS_FB,
  teamId: 611,
  teamName: 'Fenerbahçe',
  totalUsers: 21568, // Toplam tahmin yapan kullanıcı sayısı
  attackFormation: {
    selected: '4-2-3-1',
    stats: [
      { formation: '4-2-3-1', percentage: 52, count: 11215 },
      { formation: '4-3-3', percentage: 28, count: 6039 },
      { formation: '3-4-3', percentage: 15, count: 3235 },
      { formation: '4-4-2', percentage: 5, count: 1079 },
    ],
  },
  defenseFormation: {
    selected: '4-5-1',
    stats: [
      { formation: '4-5-1', percentage: 42, count: 9059 },
      { formation: '4-4-2', percentage: 35, count: 7549 },
      { formation: '5-3-2', percentage: 18, count: 3882 },
      { formation: '5-4-1', percentage: 5, count: 1078 },
    ],
  },
  playerPositions: [
    {
      position: 'GK',
      positionLabel: 'Kaleci',
      selectedPlayer: { id: 50101, name: 'D. Livakovic', percentage: 98 },
      preferences: [
        { playerId: 50101, playerName: 'D. Livakovic', percentage: 98, count: 21137, isInStartingXI: true },
        { playerId: 50112, playerName: 'İ. Egribayat', percentage: 2, count: 431, isInStartingXI: false },
      ],
    },
    {
      position: 'RB',
      positionLabel: 'Sağ Bek',
      selectedPlayer: { id: 50102, name: 'B. Osayi-Samuel', percentage: 92 },
      preferences: [
        { playerId: 50102, playerName: 'B. Osayi-Samuel', percentage: 92, count: 19843, isInStartingXI: true },
        { playerId: 50113, playerName: 'F. Kadıoğlu', percentage: 8, count: 1725, isInStartingXI: true },
      ],
    },
    {
      position: 'CB1',
      positionLabel: 'Stoper (Sağ)',
      selectedPlayer: { id: 50103, name: 'A. Djiku', percentage: 88 },
      preferences: [
        { playerId: 50103, playerName: 'A. Djiku', percentage: 88, count: 18980, isInStartingXI: true },
        { playerId: 50104, playerName: 'S. Aziz', percentage: 12, count: 2588, isInStartingXI: true },
      ],
    },
    {
      position: 'CB2',
      positionLabel: 'Stoper (Sol)',
      selectedPlayer: { id: 50104, name: 'S. Aziz', percentage: 85 },
      preferences: [
        { playerId: 50104, playerName: 'S. Aziz', percentage: 85, count: 18333, isInStartingXI: true },
        { playerId: 50103, playerName: 'A. Djiku', percentage: 15, count: 3235, isInStartingXI: true },
      ],
    },
    {
      position: 'LB',
      positionLabel: 'Sol Bek',
      selectedPlayer: { id: 50105, name: 'F. Kadıoğlu', percentage: 95 },
      preferences: [
        { playerId: 50105, playerName: 'F. Kadıoğlu', percentage: 95, count: 20490, isInStartingXI: true },
        { playerId: 50113, playerName: 'J. King', percentage: 5, count: 1078, isInStartingXI: false },
      ],
    },
    {
      position: 'CM1',
      positionLabel: 'Merkez Orta Saha (Sağ)',
      selectedPlayer: { id: 50106, name: 'İ. Yüksek', percentage: 86 },
      preferences: [
        { playerId: 50106, playerName: 'İ. Yüksek', percentage: 86, count: 18548, isInStartingXI: true },
        { playerId: 50107, playerName: 'F. Özil', percentage: 10, count: 2157, isInStartingXI: true },
        { playerId: 50114, playerName: 'M. Zajc', percentage: 4, count: 863, isInStartingXI: false },
      ],
    },
    {
      position: 'CM2',
      positionLabel: 'Merkez Orta Saha (Sol)',
      selectedPlayer: { id: 50107, name: 'F. Özil', percentage: 82 },
      preferences: [
        { playerId: 50107, playerName: 'F. Özil', percentage: 82, count: 17686, isInStartingXI: true },
        { playerId: 50106, playerName: 'İ. Yüksek', percentage: 12, count: 2588, isInStartingXI: true },
        { playerId: 50114, playerName: 'M. Zajc', percentage: 6, count: 1294, isInStartingXI: false },
      ],
    },
    {
      position: 'AM',
      positionLabel: 'Ofansif Orta Saha',
      selectedPlayer: { id: 50108, name: 'S. Szymanski', percentage: 89 },
      preferences: [
        { playerId: 50108, playerName: 'S. Szymanski', percentage: 89, count: 19196, isInStartingXI: true },
        { playerId: 50109, playerName: 'E. Dzeko', percentage: 7, count: 1510, isInStartingXI: true },
        { playerId: 50115, playerName: 'M. Batshuayi', percentage: 4, count: 863, isInStartingXI: false },
      ],
    },
    {
      position: 'LW',
      positionLabel: 'Sol Kanat',
      selectedPlayer: { id: 50109, name: 'E. Dzeko', percentage: 78 },
      preferences: [
        { playerId: 50109, playerName: 'E. Dzeko', percentage: 78, count: 16823, isInStartingXI: true },
        { playerId: 50110, playerName: 'S. Ünder', percentage: 15, count: 3235, isInStartingXI: true },
        { playerId: 50115, playerName: 'M. Batshuayi', percentage: 7, count: 1510, isInStartingXI: false },
      ],
    },
    {
      position: 'ST',
      positionLabel: 'Santrafor',
      selectedPlayer: { id: 50110, name: 'S. Ünder', percentage: 91 },
      preferences: [
        { playerId: 50110, playerName: 'S. Ünder', percentage: 91, count: 19627, isInStartingXI: true },
        { playerId: 50109, playerName: 'E. Dzeko', percentage: 6, count: 1294, isInStartingXI: true },
        { playerId: 50115, playerName: 'M. Batshuayi', percentage: 3, count: 647, isInStartingXI: false },
      ],
    },
    {
      position: 'RW',
      positionLabel: 'Sağ Kanat',
      selectedPlayer: { id: 50111, name: 'J. King', percentage: 88 },
      preferences: [
        { playerId: 50111, playerName: 'J. King', percentage: 88, count: 18980, isInStartingXI: true },
        { playerId: 50110, playerName: 'S. Ünder', percentage: 8, count: 1725, isInStartingXI: true },
        { playerId: 50115, playerName: 'M. Batshuayi', percentage: 4, count: 863, isInStartingXI: false },
      ],
    },
  ],
};

/**
 * Real Madrid taraftarlarının tercih istatistikleri
 * Maç: Real Madrid vs Barcelona (888002)
 */
export const REAL_MADRID_USER_PREFERENCES: UserPreferenceStats = {
  matchId: MOCK_MATCH_IDS.REAL_BARCA,
  teamId: 541,
  teamName: 'Real Madrid',
  totalUsers: 12847, // Toplam tahmin yapan kullanıcı sayısı
  attackFormation: {
    selected: '4-3-3',
    stats: [
      { formation: '4-3-3', percentage: 42, count: 5396 },
      { formation: '4-4-2', percentage: 28, count: 3597 },
      { formation: '3-5-2', percentage: 18, count: 2312 },
      { formation: '4-2-3-1', percentage: 12, count: 1542 },
    ],
  },
  defenseFormation: {
    selected: '4-4-2',
    stats: [
      { formation: '4-4-2', percentage: 35, count: 4496 },
      { formation: '4-5-1', percentage: 28, count: 3597 },
      { formation: '5-4-1', percentage: 22, count: 2826 },
      { formation: '5-3-2', percentage: 15, count: 1928 },
    ],
  },
  playerPositions: [
    {
      position: 'GK',
      positionLabel: 'Kaleci',
      selectedPlayer: { id: 50201, name: 'T. Courtois', percentage: 94 },
      preferences: [
        { playerId: 50201, playerName: 'T. Courtois', percentage: 94, count: 12076, isInStartingXI: true },
        { playerId: 50212, playerName: 'A. Lunin', percentage: 6, count: 771, isInStartingXI: false },
      ],
    },
    {
      position: 'RB',
      positionLabel: 'Sağ Bek',
      selectedPlayer: { id: 50202, name: 'D. Carvajal', percentage: 87 },
      preferences: [
        { playerId: 50202, playerName: 'D. Carvajal', percentage: 87, count: 11177, isInStartingXI: true },
        { playerId: 50213, playerName: 'E. Militão', percentage: 13, count: 1670, isInStartingXI: false },
      ],
    },
    {
      position: 'CB1',
      positionLabel: 'Stoper (Sağ)',
      selectedPlayer: { id: 50203, name: 'A. Rüdiger', percentage: 78 },
      preferences: [
        { playerId: 50203, playerName: 'A. Rüdiger', percentage: 78, count: 10021, isInStartingXI: true },
        { playerId: 50213, playerName: 'E. Militão', percentage: 22, count: 2826, isInStartingXI: false },
      ],
    },
    {
      position: 'CB2',
      positionLabel: 'Stoper (Sol)',
      selectedPlayer: { id: 50204, name: 'D. Alaba', percentage: 68 },
      preferences: [
        { playerId: 50204, playerName: 'D. Alaba', percentage: 68, count: 8736, isInStartingXI: true },
        { playerId: 50203, playerName: 'A. Rüdiger', percentage: 22, count: 2826, isInStartingXI: true },
        { playerId: 50213, playerName: 'E. Militão', percentage: 10, count: 1285, isInStartingXI: false },
      ],
    },
    {
      position: 'LB',
      positionLabel: 'Sol Bek',
      selectedPlayer: { id: 50205, name: 'F. Mendy', percentage: 91 },
      preferences: [
        { playerId: 50205, playerName: 'F. Mendy', percentage: 91, count: 11691, isInStartingXI: true },
        { playerId: 50204, playerName: 'D. Alaba', percentage: 9, count: 1156, isInStartingXI: true },
      ],
    },
    {
      position: 'CM1',
      positionLabel: 'Merkez Orta Saha (Sağ)',
      selectedPlayer: { id: 50206, name: 'T. Kroos', percentage: 62 },
      preferences: [
        { playerId: 50206, playerName: 'T. Kroos', percentage: 62, count: 7965, isInStartingXI: true },
        { playerId: 50215, playerName: 'F. Valverde', percentage: 23, count: 2955, isInStartingXI: false },
        { playerId: 50214, playerName: 'E. Camavinga', percentage: 15, count: 1927, isInStartingXI: false },
      ],
    },
    {
      position: 'CM2',
      positionLabel: 'Merkez Orta Saha (Orta)',
      selectedPlayer: { id: 50207, name: 'L. Modrić', percentage: 55 },
      preferences: [
        { playerId: 50207, playerName: 'L. Modrić', percentage: 55, count: 7066, isInStartingXI: true },
        { playerId: 50215, playerName: 'F. Valverde', percentage: 28, count: 3597, isInStartingXI: false },
        { playerId: 50214, playerName: 'E. Camavinga', percentage: 17, count: 2184, isInStartingXI: false },
      ],
    },
    {
      position: 'CM3',
      positionLabel: 'Merkez Orta Saha (Sol)',
      selectedPlayer: { id: 50208, name: 'J. Bellingham', percentage: 89 },
      preferences: [
        { playerId: 50208, playerName: 'J. Bellingham', percentage: 89, count: 11434, isInStartingXI: true },
        { playerId: 50207, playerName: 'L. Modrić', percentage: 7, count: 899, isInStartingXI: true },
        { playerId: 50214, playerName: 'E. Camavinga', percentage: 4, count: 514, isInStartingXI: false },
      ],
    },
    {
      position: 'LW',
      positionLabel: 'Sol Kanat',
      selectedPlayer: { id: 50209, name: 'Vinícius Jr.', percentage: 95 },
      preferences: [
        { playerId: 50209, playerName: 'Vinícius Jr.', percentage: 95, count: 12205, isInStartingXI: true },
        { playerId: 50211, playerName: 'Rodrygo', percentage: 3, count: 385, isInStartingXI: true },
        { playerId: 50216, playerName: 'E. Hazard', percentage: 2, count: 257, isInStartingXI: false },
      ],
    },
    {
      position: 'ST',
      positionLabel: 'Santrafor',
      selectedPlayer: { id: 50210, name: 'K. Mbappé', percentage: 88 },
      preferences: [
        { playerId: 50210, playerName: 'K. Mbappé', percentage: 88, count: 11305, isInStartingXI: true },
        { playerId: 50209, playerName: 'Vinícius Jr.', percentage: 8, count: 1028, isInStartingXI: true },
        { playerId: 50211, playerName: 'Rodrygo', percentage: 4, count: 514, isInStartingXI: true },
      ],
    },
    {
      position: 'RW',
      positionLabel: 'Sağ Kanat',
      selectedPlayer: { id: 50211, name: 'Rodrygo', percentage: 76 },
      preferences: [
        { playerId: 50211, playerName: 'Rodrygo', percentage: 76, count: 9764, isInStartingXI: true },
        { playerId: 50210, playerName: 'K. Mbappé', percentage: 15, count: 1927, isInStartingXI: true },
        { playerId: 50216, playerName: 'E. Hazard', percentage: 9, count: 1156, isInStartingXI: false },
      ],
    },
  ],
};

/**
 * Barcelona taraftarlarının tercih istatistikleri
 * Maç: Real Madrid vs Barcelona (888002)
 */
export const BARCELONA_USER_PREFERENCES: UserPreferenceStats = {
  matchId: MOCK_MATCH_IDS.REAL_BARCA,
  teamId: 529,
  teamName: 'Barcelona',
  totalUsers: 15632, // Toplam tahmin yapan kullanıcı sayısı
  attackFormation: {
    selected: '4-3-3',
    stats: [
      { formation: '4-3-3', percentage: 48, count: 7503 },
      { formation: '4-2-3-1', percentage: 25, count: 3908 },
      { formation: '3-4-3', percentage: 18, count: 2814 },
      { formation: '4-4-2', percentage: 9, count: 1407 },
    ],
  },
  defenseFormation: {
    selected: '4-5-1',
    stats: [
      { formation: '4-5-1', percentage: 38, count: 5940 },
      { formation: '4-4-2', percentage: 32, count: 5002 },
      { formation: '5-3-2', percentage: 18, count: 2814 },
      { formation: '5-4-1', percentage: 12, count: 1876 },
    ],
  },
  playerPositions: [
    {
      position: 'GK',
      positionLabel: 'Kaleci',
      selectedPlayer: { id: 50301, name: 'M. ter Stegen', percentage: 97 },
      preferences: [
        { playerId: 50301, playerName: 'M. ter Stegen', percentage: 97, count: 15163, isInStartingXI: true },
        { playerId: 50312, playerName: 'İ. Peña', percentage: 3, count: 469, isInStartingXI: false },
      ],
    },
    {
      position: 'RB',
      positionLabel: 'Sağ Bek',
      selectedPlayer: { id: 50302, name: 'J. Cancelo', percentage: 72 },
      preferences: [
        { playerId: 50302, playerName: 'J. Cancelo', percentage: 72, count: 11255, isInStartingXI: true },
        { playerId: 50313, playerName: 'J. Koundé', percentage: 28, count: 4377, isInStartingXI: false },
      ],
    },
    {
      position: 'CB1',
      positionLabel: 'Stoper (Sağ)',
      selectedPlayer: { id: 50303, name: 'R. Araújo', percentage: 85 },
      preferences: [
        { playerId: 50303, playerName: 'R. Araújo', percentage: 85, count: 13287, isInStartingXI: true },
        { playerId: 50313, playerName: 'J. Koundé', percentage: 15, count: 2345, isInStartingXI: false },
      ],
    },
    {
      position: 'CB2',
      positionLabel: 'Stoper (Sol)',
      selectedPlayer: { id: 50304, name: 'A. Christensen', percentage: 65 },
      preferences: [
        { playerId: 50304, playerName: 'A. Christensen', percentage: 65, count: 10161, isInStartingXI: true },
        { playerId: 50303, playerName: 'R. Araújo', percentage: 25, count: 3908, isInStartingXI: true },
        { playerId: 50313, playerName: 'J. Koundé', percentage: 10, count: 1563, isInStartingXI: false },
      ],
    },
    {
      position: 'LB',
      positionLabel: 'Sol Bek',
      selectedPlayer: { id: 50305, name: 'A. Baldé', percentage: 88 },
      preferences: [
        { playerId: 50305, playerName: 'A. Baldé', percentage: 88, count: 13756, isInStartingXI: true },
        { playerId: 50302, playerName: 'J. Cancelo', percentage: 12, count: 1876, isInStartingXI: true },
      ],
    },
    {
      position: 'CM1',
      positionLabel: 'Merkez Orta Saha (Sağ)',
      selectedPlayer: { id: 50306, name: 'Pedri', percentage: 78 },
      preferences: [
        { playerId: 50306, playerName: 'Pedri', percentage: 78, count: 12193, isInStartingXI: true },
        { playerId: 50314, playerName: 'İ. Gündoğan', percentage: 15, count: 2345, isInStartingXI: false },
        { playerId: 50315, playerName: 'F. Torres', percentage: 7, count: 1094, isInStartingXI: false },
      ],
    },
    {
      position: 'CM2',
      positionLabel: 'Merkez Orta Saha (Orta)',
      selectedPlayer: { id: 50307, name: 'F. de Jong', percentage: 68 },
      preferences: [
        { playerId: 50307, playerName: 'F. de Jong', percentage: 68, count: 10630, isInStartingXI: true },
        { playerId: 50314, playerName: 'İ. Gündoğan', percentage: 22, count: 3439, isInStartingXI: false },
        { playerId: 50306, playerName: 'Pedri', percentage: 10, count: 1563, isInStartingXI: true },
      ],
    },
    {
      position: 'CM3',
      positionLabel: 'Merkez Orta Saha (Sol)',
      selectedPlayer: { id: 50308, name: 'Gavi', percentage: 82 },
      preferences: [
        { playerId: 50308, playerName: 'Gavi', percentage: 82, count: 12818, isInStartingXI: true },
        { playerId: 50315, playerName: 'F. Torres', percentage: 12, count: 1876, isInStartingXI: false },
        { playerId: 50314, playerName: 'İ. Gündoğan', percentage: 6, count: 938, isInStartingXI: false },
      ],
    },
    {
      position: 'LW',
      positionLabel: 'Sol Kanat',
      selectedPlayer: { id: 50311, name: 'Raphinha', percentage: 72 },
      preferences: [
        { playerId: 50311, playerName: 'Raphinha', percentage: 72, count: 11255, isInStartingXI: true },
        { playerId: 50316, playerName: 'A. Fati', percentage: 18, count: 2814, isInStartingXI: false },
        { playerId: 50309, playerName: 'L. Yamal', percentage: 10, count: 1563, isInStartingXI: true },
      ],
    },
    {
      position: 'ST',
      positionLabel: 'Santrafor',
      selectedPlayer: { id: 50310, name: 'R. Lewandowski', percentage: 92 },
      preferences: [
        { playerId: 50310, playerName: 'R. Lewandowski', percentage: 92, count: 14381, isInStartingXI: true },
        { playerId: 50316, playerName: 'A. Fati', percentage: 5, count: 782, isInStartingXI: false },
        { playerId: 50315, playerName: 'F. Torres', percentage: 3, count: 469, isInStartingXI: false },
      ],
    },
    {
      position: 'RW',
      positionLabel: 'Sağ Kanat',
      selectedPlayer: { id: 50309, name: 'L. Yamal', percentage: 94 },
      preferences: [
        { playerId: 50309, playerName: 'L. Yamal', percentage: 94, count: 14694, isInStartingXI: true },
        { playerId: 50311, playerName: 'Raphinha', percentage: 4, count: 625, isInStartingXI: true },
        { playerId: 50316, playerName: 'A. Fati', percentage: 2, count: 313, isInStartingXI: false },
      ],
    },
  ],
};

/**
 * Maç ID'sine göre kullanıcı tercih istatistiklerini getir
 * @param matchId Maç ID
 * @param teamId Takım ID
 * @returns Kullanıcı tercih istatistikleri veya null
 */
export function getUserPreferenceStats(matchId: number, teamId: number): UserPreferenceStats | null {
  if (!MOCK_TEST_ENABLED) return null;
  
  // ✅ GS-FB maçı
  if (matchId === MOCK_MATCH_IDS.GS_FB) {
    if (teamId === 645) return GALATASARAY_USER_PREFERENCES;
    if (teamId === 611) return FENERBAHCE_USER_PREFERENCES;
  }
  
  // ✅ Real Madrid - Barcelona maçı
  if (matchId === MOCK_MATCH_IDS.REAL_BARCA) {
    if (teamId === 541) return REAL_MADRID_USER_PREFERENCES;
    if (teamId === 529) return BARCELONA_USER_PREFERENCES;
  }
  
  return null;
}

/**
 * İlk 11'de olmayan oyuncuları filtrele ve geçerli tercihleri döndür
 * @param preferences Tüm tercihler
 * @param startingXI İlk 11 oyuncu ID'leri
 * @returns Sadece ilk 11'deki oyuncuların tercihleri
 */
export function filterValidPreferences(
  preferences: { playerId: number; playerName: string; percentage: number; count: number; isInStartingXI: boolean }[],
  startingXIIds: number[]
): { playerId: number; playerName: string; percentage: number; count: number; isInStartingXI: boolean }[] {
  const startingSet = new Set(startingXIIds);
  const validPrefs = preferences.filter(p => startingSet.has(p.playerId));
  
  if (validPrefs.length === 0) return [];
  
  // Yüzdeleri yeniden hesapla (sadece geçerli oyuncular için)
  const totalPercentage = validPrefs.reduce((sum, p) => sum + p.percentage, 0);
  return validPrefs.map(p => ({
    ...p,
    percentage: Math.round((p.percentage / totalPercentage) * 100),
  }));
}

/**
 * Otomatik kadro oluştur (tahmin yapmayan kullanıcılar için)
 * Maç başladığında tetiklenir
 * @param matchId Maç ID
 * @param teamId Takım ID
 * @param startingXI API'den gelen ilk 11 oyuncuları
 * @returns Otomatik oluşturulan kadro
 */
export interface AutoGeneratedSquad {
  matchId: number;
  teamId: number;
  teamName: string;
  attackFormation: { formation: string; percentage: number };
  defenseFormation: { formation: string; percentage: number };
  totalUsers: number;
  positions: {
    position: string;
    positionLabel: string;
    player: { id: number; name: string; number: number };
    preferencePercentage: number;
    totalPreferences: number;
    allPreferences: { playerId: number; playerName: string; percentage: number; count: number }[];
  }[];
}

export function generateAutoSquad(
  matchId: number,
  teamId: number,
  startingXI: { player: { id: number; name: string; number: number; pos: string } }[]
): AutoGeneratedSquad | null {
  const prefs = getUserPreferenceStats(matchId, teamId);
  if (!prefs) return null;
  
  const startingXIIds = startingXI.map(p => p.player.id);
  const startingXIMap = new Map(startingXI.map(p => [p.player.id, p.player]));
  
  const positions = prefs.playerPositions.map(pos => {
    // İlk 11'de olmayan oyuncuları filtrele
    const validPrefs = filterValidPreferences(pos.preferences, startingXIIds);
    
    // En yüksek yüzdeli oyuncuyu seç
    const selectedPref = validPrefs.length > 0 
      ? validPrefs.reduce((a, b) => a.percentage > b.percentage ? a : b)
      : null;
    
    const selectedPlayer = selectedPref 
      ? startingXIMap.get(selectedPref.playerId)
      : null;
    
    return {
      position: pos.position,
      positionLabel: pos.positionLabel,
      player: selectedPlayer || { id: 0, name: 'Bilinmiyor', number: 0 },
      preferencePercentage: selectedPref?.percentage || 0,
      totalPreferences: validPrefs.reduce((sum, p) => sum + p.count, 0),
      allPreferences: validPrefs.map(p => ({
        playerId: p.playerId,
        playerName: p.playerName,
        percentage: p.percentage,
        count: p.count,
      })),
    };
  });
  
  return {
    matchId,
    teamId,
    teamName: prefs.teamName,
    attackFormation: {
      formation: prefs.attackFormation.selected,
      percentage: prefs.attackFormation.stats.find(s => s.formation === prefs.attackFormation.selected)?.percentage || 0,
    },
    defenseFormation: {
      formation: prefs.defenseFormation.selected,
      percentage: prefs.defenseFormation.stats.find(s => s.formation === prefs.defenseFormation.selected)?.percentage || 0,
    },
    totalUsers: prefs.totalUsers,
    positions,
  };
}

/**
 * Tercih yüzdesine göre çerçeve rengi ve kalınlığı hesapla
 * @param percentage Tercih yüzdesi (0-100)
 * @returns Çerçeve stili
 */
export function getPreferenceBorderStyle(percentage: number): { color: string; width: number; opacity: number } {
  // ✅ Daha ince ve şık çerçeveler - sadece kalınlık ile % gösterimi
  if (percentage >= 90) {
    // Çok yüksek tercih - Turkuaz (marka rengi)
    return { color: '#1FA2A6', width: 2.5, opacity: 1 };
  } else if (percentage >= 75) {
    // Yüksek tercih - Yeşil
    return { color: '#10B981', width: 2, opacity: 0.95 };
  } else if (percentage >= 60) {
    // Orta-yüksek tercih - Açık yeşil
    return { color: '#34D399', width: 1.5, opacity: 0.9 };
  } else if (percentage >= 40) {
    // Orta tercih - Varsayılan (görünmez)
    return { color: 'rgba(100, 116, 139, 0.3)', width: 2, opacity: 0.8 };
  } else {
    // Düşük tercih - Varsayılan
    return { color: 'rgba(100, 116, 139, 0.3)', width: 2, opacity: 0.7 };
  }
}

/**
 * Pozisyon grubuna göre renk şeması
 * ✅ ELİT RENK PALETİ - Koyu yeşil-turkuaz tema ile uyumlu
 * Daha soft ve profesyonel görünüm
 */
export function getPositionGroupColor(position: string): { 
  primary: string; 
  secondary: string; 
  background: string;
  text: string;
  name: string;
} {
  const pos = position.toUpperCase();
  
  // Kaleci - Altın/Bronz tonu (elit)
  if (pos === 'GK' || pos === 'G') {
    return {
      primary: '#C9A44C',      // Koyu altın
      secondary: '#D4AF61',
      background: 'rgba(201, 164, 76, 0.08)',
      text: '#D4AF61',
      name: 'Kaleci'
    };
  }
  
  // Defans (CB, RB, LB, RWB, LWB) - Deniz mavisi/Slate
  if (['CB', 'RB', 'LB', 'RWB', 'LWB', 'SW', 'DEF'].some(p => pos.includes(p))) {
    return {
      primary: '#64748B',      // Slate
      secondary: '#94A3B8',
      background: 'rgba(100, 116, 139, 0.08)',
      text: '#94A3B8',
      name: 'Defans'
    };
  }
  
  // Defansif Orta Saha (CDM, DM) - Mor/Lavanta tonu (soft)
  if (['CDM', 'DM', 'DMF'].some(p => pos.includes(p))) {
    return {
      primary: '#7C7A9C',      // Soft mor
      secondary: '#9795B5',
      background: 'rgba(124, 122, 156, 0.08)',
      text: '#9795B5',
      name: 'D. Orta Saha'
    };
  }
  
  // Merkez Orta Saha (CM, MF) - Turkuaz (marka rengi, soft)
  if (['CM', 'MF', 'CMF'].some(p => pos.includes(p))) {
    return {
      primary: '#1FA2A6',      // Turkuaz (marka rengi)
      secondary: '#5BBDC0',
      background: 'rgba(31, 162, 166, 0.08)',
      text: '#5BBDC0',
      name: 'Orta Saha'
    };
  }
  
  // Ofansif Orta Saha (CAM, AM, RM, LM) - Yeşil/Zümrüt (soft)
  if (['CAM', 'AM', 'AMF', 'RM', 'LM', 'RMF', 'LMF'].some(p => pos.includes(p))) {
    return {
      primary: '#4CAF7C',      // Soft yeşil
      secondary: '#6BC294',
      background: 'rgba(76, 175, 124, 0.08)',
      text: '#6BC294',
      name: 'O. Orta Saha'
    };
  }
  
  // Kanatlar (RW, LW, WF) - Soft turuncu/Coral
  if (['RW', 'LW', 'WF', 'RWF', 'LWF'].some(p => pos.includes(p))) {
    return {
      primary: '#D97B5C',      // Soft coral
      secondary: '#E69B82',
      background: 'rgba(217, 123, 92, 0.08)',
      text: '#E69B82',
      name: 'Kanat'
    };
  }
  
  // Forvet (ST, CF, FW, SS) - Koyu kırmızı/Bordo (soft)
  if (['ST', 'CF', 'FW', 'SS', 'ATT'].some(p => pos.includes(p))) {
    return {
      primary: '#C75B5B',      // Soft kırmızı/bordo
      secondary: '#D88484',
      background: 'rgba(199, 91, 91, 0.08)',
      text: '#D88484',
      name: 'Forvet'
    };
  }
  
  // Varsayılan - Nötr gri
  return {
    primary: '#5A6575',
    secondary: '#7A8699',
    background: 'rgba(90, 101, 117, 0.08)',
    text: '#7A8699',
    name: 'Oyuncu'
  };
}

// ============================================================
// 📊 MOCK MAÇ İSTATİSTİKLERİ
// ============================================================

/**
 * Maç istatistikleri (API formatında)
 */
export interface MockMatchStatistic {
  type: string;
  home: number | string | null;
  away: number | string | null;
}

/**
 * Oyuncu istatistikleri
 */
export interface MockPlayerStats {
  name: string;
  number: number;
  position: string;
  rating: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  shotsInsideBox: number;
  totalPasses: number;
  passesCompleted: number;
  passAccuracy: number;
  keyPasses: number;
  longPasses: number;
  dribbleAttempts: number;
  dribbleSuccess: number;
  dispossessed: number;
  tackles: number;
  duelsTotal: number;
  duelsWon: number;
  aerialDuels: number;
  aerialWon: number;
}

/**
 * GS vs FB maçı istatistikleri
 * Maç başladığında ve devam ederken dinamik olarak güncellenir
 */
export function getMockMatchStatistics(fixtureId: number): MockMatchStatistic[] | null {
  if (!MOCK_TEST_ENABLED) return null;
  
  const matchStart = fixtureId === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : 
                     fixtureId === MOCK_MATCH_IDS.REAL_BARCA ? getMatch2Start() : null;
  
  if (!matchStart) return null;
  
  const now = Date.now();
  const elapsedMs = now - matchStart;
  
  // Maç başlamadıysa null döndür
  if (elapsedMs < 0) return null;
  
  const elapsedMinutes = Math.min(90, Math.floor(elapsedMs / 60000));
  
  // İstatistikler maç süresine göre artıyor
  const progressFactor = elapsedMinutes / 90;
  
  if (fixtureId === MOCK_MATCH_IDS.GS_FB) {
    // GS 7-4 FB (veya 5-2 gibi yüksek skorlu derbi)
    // Minimum değerler + progress'e göre artış
    const minProgress = Math.max(0.3, progressFactor); // En az %30 göster
    const homeGoals = elapsedMinutes >= 85 ? 7 : elapsedMinutes >= 70 ? 6 : elapsedMinutes >= 55 ? 5 : elapsedMinutes >= 35 ? 4 : elapsedMinutes >= 20 ? 3 : 2;
    const awayGoals = elapsedMinutes >= 80 ? 4 : elapsedMinutes >= 60 ? 3 : elapsedMinutes >= 40 ? 2 : 1;
    
    return [
      { type: 'Ball Possession', home: `${Math.round(56 + Math.random() * 4)}%`, away: `${Math.round(44 - Math.random() * 4)}%` },
      { type: 'Total Shots', home: Math.max(8, Math.round(18 * minProgress)), away: Math.max(5, Math.round(12 * minProgress)) },
      { type: 'Shots on Goal', home: Math.max(5, Math.round(9 * minProgress)), away: Math.max(3, Math.round(6 * minProgress)) },
      { type: 'Shots off Goal', home: Math.max(2, Math.round(6 * minProgress)), away: Math.max(1, Math.round(4 * minProgress)) },
      { type: 'Blocked Shots', home: Math.max(1, Math.round(3 * minProgress)), away: Math.max(1, Math.round(2 * minProgress)) },
      { type: 'Corner Kicks', home: Math.max(4, Math.round(9 * minProgress)), away: Math.max(2, Math.round(6 * minProgress)) },
      { type: 'Offsides', home: Math.max(1, Math.round(4 * minProgress)), away: Math.max(2, Math.round(5 * minProgress)) },
      { type: 'Fouls', home: Math.max(5, Math.round(14 * minProgress)), away: Math.max(6, Math.round(16 * minProgress)) },
      { type: 'Yellow Cards', home: elapsedMinutes >= 60 ? 3 : 2, away: elapsedMinutes >= 45 ? 4 : 3 },
      { type: 'Red Cards', home: 0, away: elapsedMinutes >= 75 ? 1 : 0 },
      { type: 'Goalkeeper Saves', home: Math.max(2, Math.round(4 * minProgress)), away: Math.max(4, Math.round(7 * minProgress)) },
      { type: 'Total Passes', home: Math.max(180, Math.round(520 * minProgress)), away: Math.max(140, Math.round(420 * minProgress)) },
      { type: 'Passes Accurate', home: Math.max(155, Math.round(450 * minProgress)), away: Math.max(110, Math.round(340 * minProgress)) },
      { type: 'Passes %', home: '87%', away: '81%' },
    ];
  }
  
  if (fixtureId === MOCK_MATCH_IDS.REAL_BARCA) {
    // Real 2-3 Barca (El Clasico)
    const minProgress = Math.max(0.3, progressFactor);
    
    return [
      { type: 'Ball Possession', home: `${Math.round(46 + Math.random() * 4)}%`, away: `${Math.round(54 - Math.random() * 4)}%` },
      { type: 'Total Shots', home: Math.max(6, Math.round(14 * minProgress)), away: Math.max(8, Math.round(17 * minProgress)) },
      { type: 'Shots on Goal', home: Math.max(3, Math.round(6 * minProgress)), away: Math.max(5, Math.round(9 * minProgress)) },
      { type: 'Shots off Goal', home: Math.max(2, Math.round(5 * minProgress)), away: Math.max(2, Math.round(5 * minProgress)) },
      { type: 'Blocked Shots', home: Math.max(1, Math.round(3 * minProgress)), away: Math.max(1, Math.round(3 * minProgress)) },
      { type: 'Corner Kicks', home: Math.max(3, Math.round(6 * minProgress)), away: Math.max(5, Math.round(10 * minProgress)) },
      { type: 'Offsides', home: Math.max(1, Math.round(3 * minProgress)), away: Math.max(1, Math.round(4 * minProgress)) },
      { type: 'Fouls', home: Math.max(4, Math.round(12 * minProgress)), away: Math.max(5, Math.round(13 * minProgress)) },
      { type: 'Yellow Cards', home: elapsedMinutes >= 50 ? 2 : 1, away: elapsedMinutes >= 40 ? 3 : 2 },
      { type: 'Red Cards', home: 0, away: 0 },
      { type: 'Goalkeeper Saves', home: Math.max(4, Math.round(7 * minProgress)), away: Math.max(2, Math.round(5 * minProgress)) },
      { type: 'Total Passes', home: Math.max(160, Math.round(460 * minProgress)), away: Math.max(200, Math.round(540 * minProgress)) },
      { type: 'Passes Accurate', home: Math.max(135, Math.round(395 * minProgress)), away: Math.max(175, Math.round(475 * minProgress)) },
      { type: 'Passes %', home: '86%', away: '88%' },
    ];
  }
  
  return null;
}

/**
 * Mock maç oyuncu istatistikleri
 */
export function getMockPlayerStatistics(fixtureId: number): { home: MockPlayerStats[], away: MockPlayerStats[] } | null {
  if (!MOCK_TEST_ENABLED) return null;
  
  const matchStart = fixtureId === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : 
                     fixtureId === MOCK_MATCH_IDS.REAL_BARCA ? getMatch2Start() : null;
  
  if (!matchStart) return null;
  
  const now = Date.now();
  const elapsedMs = now - matchStart;
  
  // Maç başlamadıysa null döndür
  if (elapsedMs < 0) return null;
  
  const elapsedMinutes = Math.min(90, Math.floor(elapsedMs / 60000));
  
  if (fixtureId === MOCK_MATCH_IDS.GS_FB) {
    return {
      home: [
        {
          name: 'Mauro Icardi',
          number: 9,
          position: 'ST',
          rating: 8.7,
          minutesPlayed: elapsedMinutes,
          goals: 2,
          assists: 1,
          shots: 5,
          shotsOnTarget: 3,
          shotsInsideBox: 4,
          totalPasses: Math.round(25 * (elapsedMinutes / 90)),
          passesCompleted: Math.round(21 * (elapsedMinutes / 90)),
          passAccuracy: 84,
          keyPasses: 2,
          longPasses: 1,
          dribbleAttempts: 6,
          dribbleSuccess: 4,
          dispossessed: 2,
          tackles: 0,
          duelsTotal: 10,
          duelsWon: 7,
          aerialDuels: 4,
          aerialWon: 3,
        },
        {
          name: 'Wilfried Zaha',
          number: 14,
          position: 'LW',
          rating: 8.2,
          minutesPlayed: elapsedMinutes,
          goals: 1,
          assists: 1,
          shots: 4,
          shotsOnTarget: 2,
          shotsInsideBox: 3,
          totalPasses: Math.round(38 * (elapsedMinutes / 90)),
          passesCompleted: Math.round(32 * (elapsedMinutes / 90)),
          passAccuracy: 84,
          keyPasses: 3,
          longPasses: 2,
          dribbleAttempts: 10,
          dribbleSuccess: 7,
          dispossessed: 3,
          tackles: 2,
          duelsTotal: 14,
          duelsWon: 9,
          aerialDuels: 2,
          aerialWon: 1,
        },
        {
          name: 'Barış Alper Yılmaz',
          number: 7,
          position: 'RW',
          rating: 7.8,
          minutesPlayed: elapsedMinutes,
          goals: 0,
          assists: 2,
          shots: 3,
          shotsOnTarget: 1,
          shotsInsideBox: 2,
          totalPasses: Math.round(42 * (elapsedMinutes / 90)),
          passesCompleted: Math.round(36 * (elapsedMinutes / 90)),
          passAccuracy: 86,
          keyPasses: 4,
          longPasses: 3,
          dribbleAttempts: 8,
          dribbleSuccess: 5,
          dispossessed: 3,
          tackles: 1,
          duelsTotal: 12,
          duelsWon: 7,
          aerialDuels: 1,
          aerialWon: 0,
        },
      ],
      away: [
        {
          name: 'Edin Dzeko',
          number: 9,
          position: 'ST',
          rating: 7.5,
          minutesPlayed: elapsedMinutes,
          goals: 1,
          assists: 0,
          shots: 6,
          shotsOnTarget: 2,
          shotsInsideBox: 4,
          totalPasses: Math.round(20 * (elapsedMinutes / 90)),
          passesCompleted: Math.round(15 * (elapsedMinutes / 90)),
          passAccuracy: 75,
          keyPasses: 1,
          longPasses: 2,
          dribbleAttempts: 4,
          dribbleSuccess: 2,
          dispossessed: 2,
          tackles: 0,
          duelsTotal: 12,
          duelsWon: 5,
          aerialDuels: 8,
          aerialWon: 5,
        },
        {
          name: 'Dusan Tadic',
          number: 10,
          position: 'CAM',
          rating: 7.2,
          minutesPlayed: elapsedMinutes,
          goals: 0,
          assists: 1,
          shots: 2,
          shotsOnTarget: 1,
          shotsInsideBox: 1,
          totalPasses: Math.round(55 * (elapsedMinutes / 90)),
          passesCompleted: Math.round(48 * (elapsedMinutes / 90)),
          passAccuracy: 87,
          keyPasses: 3,
          longPasses: 5,
          dribbleAttempts: 5,
          dribbleSuccess: 3,
          dispossessed: 2,
          tackles: 2,
          duelsTotal: 10,
          duelsWon: 5,
          aerialDuels: 2,
          aerialWon: 1,
        },
        {
          name: 'Ferdi Kadıoğlu',
          number: 2,
          position: 'LB',
          rating: 7.0,
          minutesPlayed: elapsedMinutes,
          goals: 0,
          assists: 0,
          shots: 1,
          shotsOnTarget: 0,
          shotsInsideBox: 0,
          totalPasses: Math.round(48 * (elapsedMinutes / 90)),
          passesCompleted: Math.round(42 * (elapsedMinutes / 90)),
          passAccuracy: 88,
          keyPasses: 2,
          longPasses: 6,
          dribbleAttempts: 3,
          dribbleSuccess: 2,
          dispossessed: 1,
          tackles: 4,
          duelsTotal: 8,
          duelsWon: 5,
          aerialDuels: 1,
          aerialWon: 1,
        },
      ],
    };
  }
  
  // Real vs Barcelona için de benzer yapı
  if (fixtureId === MOCK_MATCH_IDS.REAL_BARCA) {
    return {
      home: [
        {
          name: 'Vinicius Jr',
          number: 7,
          position: 'LW',
          rating: 8.5,
          minutesPlayed: elapsedMinutes,
          goals: 1,
          assists: 1,
          shots: 4,
          shotsOnTarget: 2,
          shotsInsideBox: 3,
          totalPasses: Math.round(35 * (elapsedMinutes / 90)),
          passesCompleted: Math.round(28 * (elapsedMinutes / 90)),
          passAccuracy: 80,
          keyPasses: 3,
          longPasses: 1,
          dribbleAttempts: 12,
          dribbleSuccess: 8,
          dispossessed: 4,
          tackles: 1,
          duelsTotal: 16,
          duelsWon: 10,
          aerialDuels: 2,
          aerialWon: 1,
        },
      ],
      away: [
        {
          name: 'Robert Lewandowski',
          number: 9,
          position: 'ST',
          rating: 8.3,
          minutesPlayed: elapsedMinutes,
          goals: 2,
          assists: 0,
          shots: 5,
          shotsOnTarget: 3,
          shotsInsideBox: 4,
          totalPasses: Math.round(22 * (elapsedMinutes / 90)),
          passesCompleted: Math.round(18 * (elapsedMinutes / 90)),
          passAccuracy: 82,
          keyPasses: 1,
          longPasses: 1,
          dribbleAttempts: 4,
          dribbleSuccess: 2,
          dispossessed: 2,
          tackles: 0,
          duelsTotal: 10,
          duelsWon: 6,
          aerialDuels: 6,
          aerialWon: 4,
        },
      ],
    };
  }
  
  return null;
}

// ============================================================
// 📊 CANLI MAÇ SİNYALLERİ (Community Signals)
// ============================================================

import {
  SignalType,
  PlayerSignal,
  PlayerSignals,
  SubstitutionSignal,
  getAvailableSignals,
  getDominantSignal,
  MIN_USERS_FOR_PERCENTAGE_MOCK,
} from '../types/signals.types';

/**
 * Mock yedek oyuncular listesi (çıksın sinyali için)
 */
const MOCK_SUBSTITUTES: Record<number, Array<{ playerId: number; playerName: string }>> = {
  // Fenerbahçe yedekleri
  611: [
    { playerId: 60101, playerName: 'Irfan Kahveci' },
    { playerId: 60102, playerName: 'Cengiz Under' },
    { playerId: 60103, playerName: 'Michy Batshuayi' },
    { playerId: 60104, playerName: 'Sebastian Szymanski' },
    { playerId: 60105, playerName: 'Emre Mor' },
  ],
  // Galatasaray yedekleri
  645: [
    { playerId: 50101, playerName: 'Y. Akgun' },
    { playerId: 50102, playerName: 'H. Dervisoglu' },
    { playerId: 50103, playerName: 'Zaha' },
    { playerId: 50104, playerName: 'Sallai' },
    { playerId: 50105, playerName: 'Berkan' },
  ],
};

/**
 * Rastgele yüzde üret (belirli aralıkta)
 */
function randomPercentage(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Son 15 dakikadaki yüzdeyi hesapla (maç genelinden biraz farklı)
 */
function getLast15MinPercentage(overallPercentage: number): number {
  const variance = randomPercentage(-15, 25);
  return Math.max(0, Math.min(100, overallPercentage + variance));
}

/**
 * Mock oyuncu sinyalleri üret
 */
export function getMockCommunitySignals(
  playerId: number,
  playerName: string,
  isGoalkeeper: boolean,
  teamId: number,
  matchMinute: number = 45
): PlayerSignals {
  const availableSignals = getAvailableSignals(isGoalkeeper);
  const signals: PlayerSignal[] = [];
  
  // Her sinyal türü için rastgele veri üret
  availableSignals.forEach((signalType) => {
    // Bazı sinyaller düşük, bazıları yüksek olsun
    const basePercentage = randomPercentage(5, 70);
    const percentage = basePercentage;
    const percentageLast15Min = getLast15MinPercentage(percentage);
    
    // Eşik değeri kontrolü - düşük yüzdeler gösterilmez
    if (percentage < 10) return;
    
    const signal: PlayerSignal = {
      type: signalType,
      percentage,
      percentageLast15Min,
      totalVotes: randomPercentage(50, 500),
      userParticipated: Math.random() > 0.7, // %30 ihtimalle katılmış
      isRealized: false,
    };
    
    // Substitution sinyali için yedek oyuncular ekle
    if (signalType === 'substitution') {
      const substitutes = MOCK_SUBSTITUTES[teamId] || MOCK_SUBSTITUTES[611];
      const subSignal = signal as SubstitutionSignal;
      subSignal.replacementCandidates = substitutes.map((sub) => ({
        playerId: sub.playerId,
        playerName: sub.playerName,
        percentage: randomPercentage(10, 50),
      })).sort((a, b) => b.percentage - a.percentage);
    }
    
    signals.push(signal);
  });
  
  // En yüksek yüzdeli sinyali bul
  const dominantSignal = getDominantSignal(signals);
  
  return {
    playerId,
    playerName,
    isGoalkeeper,
    signals,
    dominantSignal,
  };
}

/**
 * Bir maçtaki tüm oyuncular için sinyal verisi üret
 */
export function getMockMatchSignals(
  fixtureId: number,
  matchMinute: number = 45
): Map<number, PlayerSignals> {
  const signalsMap = new Map<number, PlayerSignals>();
  
  if (fixtureId === MOCK_MATCH_IDS.GS_FB) {
    // Fenerbahçe oyuncuları
    const fbPlayers = [
      { id: 60001, name: 'D. Livakovic', isGK: true },
      { id: 60002, name: 'Osayi-Samuel', isGK: false },
      { id: 60003, name: 'A. Djiku', isGK: false },
      { id: 60004, name: 'C. Söyüncü', isGK: false },
      { id: 60005, name: 'F. Kadıoğlu', isGK: false },
      { id: 60006, name: 'I. Kahveci', isGK: false },
      { id: 60007, name: 'F. Amrabat', isGK: false },
      { id: 60008, name: 'S. Szymanski', isGK: false },
      { id: 60009, name: 'E. Dzeko', isGK: false },
      { id: 60010, name: 'D. Tadic', isGK: false },
      { id: 60011, name: 'C. Ünder', isGK: false },
    ];
    
    fbPlayers.forEach((player) => {
      signalsMap.set(
        player.id,
        getMockCommunitySignals(player.id, player.name, player.isGK, 611, matchMinute)
      );
    });
    
    // Galatasaray oyuncuları
    const gsPlayers = [
      { id: 50001, name: 'F. Muslera', isGK: true },
      { id: 50002, name: 'S. Boey', isGK: false },
      { id: 50003, name: 'D. Nelsson', isGK: false },
      { id: 50004, name: 'A. Bardakcı', isGK: false },
      { id: 50005, name: 'A. Kurzawa', isGK: false },
      { id: 50006, name: 'L. Torreira', isGK: false },
      { id: 50007, name: 'K. Aktürkoğlu', isGK: false },
      { id: 50008, name: 'D. Mertens', isGK: false },
      { id: 50009, name: 'B. Yılmaz', isGK: false },
      { id: 50010, name: 'M. Icardi', isGK: false },
      { id: 50011, name: 'V. Osimhen', isGK: false },
    ];
    
    gsPlayers.forEach((player) => {
      signalsMap.set(
        player.id,
        getMockCommunitySignals(player.id, player.name, player.isGK, 645, matchMinute)
      );
    });
  }
  
  return signalsMap;
}

/**
 * Belirli bir oyuncu için gerçekleşen olayı işaretle
 */
export function markSignalAsRealized(
  signals: PlayerSignals,
  signalType: SignalType,
  realizedAt: string
): PlayerSignals {
  const updatedSignals = signals.signals.map((signal) => {
    if (signal.type === signalType) {
      return {
        ...signal,
        isRealized: true,
        realizedAt,
      };
    }
    return signal;
  });
  
  return {
    ...signals,
    signals: updatedSignals,
    dominantSignal: getDominantSignal(updatedSignals),
  };
}

/**
 * Topluluk verisi yeterli mi kontrol et (mock için düşük eşik)
 */
export function hasEnoughCommunityData(totalVotes: number): boolean {
  return totalVotes >= MIN_USERS_FOR_PERCENTAGE_MOCK;
}

/**
 * Sinyal zamanlaması kontrolü - son 15 dakikadaki veriler geçerli mi?
 */
export function isSignalRecent(matchMinute: number, signalMinute: number): boolean {
  return matchMinute - signalMinute <= 15;
}
