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

/** Bildirim gösterilecek zaman (maç başlamadan 1 dakika önce) */
const NOTIFICATION_DELAY_MINUTES = START_DELAY_MINUTES - 1; // 1 dakika

/**
 * Maç 1 başlangıç zamanı - UYGULAMA BAŞLANGICINDA BİR KEZ SABİTLENİR
 * Böylece geri sayım 60'tan 0'a düzgün iner (her render'da yeni zaman üretilmez)
 */
let _match1StartTimeMs: number | null = null;

function getMatchStartTime(): number {
  return Date.now() + START_DELAY_MINUTES * 60 * 1000;
}

/** Maç 1 başlangıç zamanı - ilk çağrıda sabitlenir, sonra hep aynı değer döner */
export function getMatch1Start(): number {
  if (_match1StartTimeMs === null) {
    _match1StartTimeMs = Date.now() + START_DELAY_MINUTES * 60 * 1000;
  }
  return _match1StartTimeMs;
}

/** Sabitlenmiş maç 1 başlangıç zamanını sıfırla (test için sayfa yenilendiğinde yeni zaman) */
export function resetMockMatch1StartTime(): void {
  _match1StartTimeMs = null;
}

/** Maçı 1 dakika sonra tekrar başlat (test için) */
export function restartMatch1In1Minute(): void {
  _match1StartTimeMs = Date.now() + START_DELAY_MINUTES * 60 * 1000;
  console.log('🔄 Maç 1 dakika sonra tekrar başlatıldı:', new Date(_match1StartTimeMs).toISOString());
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
  coach: { id: 901, name: 'Okan Buruk', nationality: 'Turkey' },
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
  coach: { id: 902, name: 'José Mourinho', nationality: 'Portugal' },
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

/** Maç 2 olayları: Real vs Barça */
export const MATCH_2_EVENTS: MockEvent[] = [
  { minuteOffset: 5, type: 'Goal', detail: 'Normal Goal', teamSide: 'home', playerName: 'K. Mbappé', assistName: 'J. Bellingham' },
  { minuteOffset: 10, type: 'Card', detail: 'Yellow Card', teamSide: 'away', playerName: 'R. Araújo' },
  { minuteOffset: 15, type: 'Goal', detail: 'Normal Goal', teamSide: 'away', playerName: 'R. Lewandowski', assistName: 'L. Yamal' },
  { minuteOffset: 20, type: 'Goal', detail: 'Normal Goal', teamSide: 'home', playerName: 'Vinícius Jr.', assistName: 'L. Modrić' },
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
    const homeGoals = allEvents.filter(e => e.type === 'Goal' && e.teamSide === 'home').length;
    const awayGoals = allEvents.filter(e => e.type === 'Goal' && e.teamSide === 'away').length;
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

  const homeGoals = occurredEvents.filter(e => e.type === 'Goal' && e.teamSide === 'home').length;
  const awayGoals = occurredEvents.filter(e => e.type === 'Goal' && e.teamSide === 'away').length;

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

  // ✅ Her çağrıda güncel başlangıç zamanlarını hesapla
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
        halftime: { home: state1.status !== 'NS' && state1.elapsed != null && state1.elapsed >= 45 ? state1.homeGoals : null, away: state1.status !== 'NS' && state1.elapsed != null && state1.elapsed >= 45 ? state1.awayGoals : null },
        fulltime: { home: null, away: null },
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
          long: state2.status === 'NS' ? 'Not Started' : state2.status === 'HT' ? 'Halftime' : state2.status === '2H' ? 'Second Half' : 'First Half',
          elapsed: state2.elapsed,
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
        halftime: { home: state2.status !== 'NS' && state2.elapsed != null && state2.elapsed >= 45 ? state2.homeGoals : null, away: state2.status !== 'NS' && state2.elapsed != null && state2.elapsed >= 45 ? state2.awayGoals : null },
        fulltime: { home: null, away: null },
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
    if (event.type === 'Goal' && event.teamSide) {
      if (event.teamSide === 'home') {
        currentHomeGoals++;
      } else {
        currentAwayGoals++;
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
