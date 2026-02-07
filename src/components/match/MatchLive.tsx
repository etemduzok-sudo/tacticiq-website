// src/components/match/MatchLive.tsx
// ✅ Canlı Maç Timeline - TacticIQ Design System v2.1
// Sadece canlı olaylar (gol, kart, değişiklik). Maç istatistikleri İstatistik sekmesinde.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { BRAND, DARK_MODE } from '../../theme/theme';
import { MOCK_MATCH_IDS, isMockTestMatch, getMockMatchEvents, getMatch1Start, getMatch2Start } from '../../data/mockTestData';

const isWeb = Platform.OS === 'web';

// =====================================
// TYPES
// =====================================
interface LiveEvent {
  minute: number;
  extraTime?: number | null;
  type: string;
  team: 'home' | 'away' | null;
  player?: string | null;
  assist?: string | null;
  description: string;
  detail?: string;
  score?: string | null;
  playerOut?: string | null; // ✅ Substitution için: Kim çıktı
  playerIn?: string | null; // ✅ Substitution için: Kim girdi
}

interface MatchLiveScreenProps {
  matchData: any;
  matchId: string;
  events?: any[];
}

// =====================================
// COMPONENT
// =====================================
// Maç başlamadı durumları
const NOT_STARTED_STATUSES = ['NS', 'TBD', 'PST', 'CANC', 'ABD', 'AWD', 'WO'];

export const MatchLive: React.FC<MatchLiveScreenProps> = ({
  matchData,
  matchId,
  events: propEvents,
}) => {
  const { t } = useTranslation();
  
  // ✅ Maç durumunu matchData'dan kontrol et
  // matchData.status direkt olarak MatchDetail'dan geliyor
  const matchStatus = matchData?.status || '';
  const isMatchNotStartedFromData = NOT_STARTED_STATUSES.includes(matchStatus) || matchStatus === '' || matchStatus === 'NS';
  
  // Debug log
  console.log('🔍 MatchLive status check:', { matchStatus, isMatchNotStartedFromData, matchData: !!matchData });
  
  // States – sadece canlı olaylar (istatistikler İstatistik sekmesinde)
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchNotStarted, setMatchNotStarted] = useState(false);
  const matchNotStartedRef = useRef(false);
  matchNotStartedRef.current = matchNotStarted;
  
  // ✅ Mock maçlar için ticker - currentMinute'ın her saniye güncellenmesi için
  // ✅ Maç başlamadan önce de çalışmalı ki maç başladığında hemen algılansın
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const isMockMatch = isMockTestMatch(Number(matchId));
    if (!isMockMatch) return;
    
    const interval = setInterval(() => {
      setTicker(prev => prev + 1);
      
      // ✅ Her saniye maç başlangıç zamanını kontrol et
      const matchStart = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
      const now = Date.now();
      const hasStarted = now >= matchStart;
      
      if (hasStarted && matchNotStartedRef.current) {
        // Maç başladı, state'i güncelle - useEffect tekrar çalışacak ve canlı eventler yüklenecek
        setMatchNotStarted(false);
        matchNotStartedRef.current = false; // ✅ Ref'i de güncelle
      }
    }, 1000); // Her saniye güncelle
    
    return () => clearInterval(interval);
  }, [matchId]);
  
  // ✅ matchData.status değiştiğinde state'leri güncelle (sadece gerçek maçlar için)
  useEffect(() => {
    const isMockMatch = isMockTestMatch(Number(matchId));
    // Mock maçlar için bu kontrolü atla - gerçek zamandan kontrol edilecek
    if (!isMockMatch && isMatchNotStartedFromData) {
      setMatchNotStarted(true);
      setLoading(false);
    }
  }, [isMatchNotStartedFromData, matchId]);

  // Mock maç (999999): 52. dk, skor 5-4, ilk yarı 1 dk uzadı, 45+1 ev sahibi kırmızı kart, en az 8 event
  const MOCK_999999_EVENTS = [
    { time: { elapsed: 0, extra: null }, type: 'Goal', detail: 'Kick Off', team: null, player: null, assist: null, goals: null },
    { time: { elapsed: 10, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'F. Koç' }, assist: null, goals: { home: 1, away: 0 } },
    { time: { elapsed: 20, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'Ö. Kılıç' }, assist: null, goals: { home: 1, away: 1 } },
    { time: { elapsed: 28, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'D. Aksoy' }, assist: { name: 'H. Çelik' }, goals: { home: 2, away: 1 } },
    { time: { elapsed: 35, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'Ç. Yılmaz' }, assist: null, goals: { home: 2, away: 2 } },
    { time: { elapsed: 40, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'B. Arslan' }, assist: null, goals: { home: 3, away: 2 } },
    { time: { elapsed: 45, extra: null }, type: 'Goal', detail: 'First Half Extra Time', team: null, player: null, assist: null, goals: null, comments: '1' },
    { time: { elapsed: 45, extra: 1 }, type: 'Card', detail: 'Red Card', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'C. Şahin' }, assist: null, goals: null },
    { time: { elapsed: 45, extra: 1 }, type: 'Goal', detail: 'Half Time', team: null, player: null, assist: null, goals: null },
    { time: { elapsed: 46, extra: null }, type: 'Goal', detail: 'Second Half Started', team: null, player: null, assist: null, goals: null },
    { time: { elapsed: 47, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'Ş. Aslan' }, assist: null, goals: { home: 3, away: 3 } },
    { time: { elapsed: 49, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'K. Yıldız' }, assist: { name: 'M. Özkan' }, goals: { home: 4, away: 3 } },
    { time: { elapsed: 51, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9999, name: 'Mock Home Team' }, player: { name: 'F. Koç' }, assist: null, goals: { home: 5, away: 3 } },
    { time: { elapsed: 52, extra: null }, type: 'Goal', detail: 'Normal Goal', team: { id: 9998, name: 'Mock Away Team' }, player: { name: 'İ. Koç' }, assist: { name: 'G. Bayrak' }, goals: { home: 5, away: 4 } },
  ];

  // =====================================
  // FETCH LIVE EVENTS
  // =====================================
  useEffect(() => {
    if (!matchId) return;
    
    const isMockMatch = String(matchId) === '999999' || isMockTestMatch(Number(matchId));
    
    // ✅ Mock maçlar için gerçek zamandan kontrol et
    if (isMockMatch) {
      const matchStart = String(matchId) === '999999' 
        ? Date.now() - 52 * 1000 // Mock 999999 için 52. dakikada
        : (Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start());
      const now = Date.now();
      const hasStarted = now >= matchStart;
      
      if (!hasStarted) {
        // Maç henüz başlamadı - sadece state'i güncelle, return etme
        // Çünkü matchNotStarted dependency'de, maç başladığında tekrar çalışacak
        if (!matchNotStarted) {
          setMatchNotStarted(true);
        }
        setLoading(false);
        return;
      }
      // Mock maç başladıysa devam et - matchNotStarted false olmalı
      if (matchNotStarted) {
        setMatchNotStarted(false);
      }
    } else {
      // ✅ Gerçek maçlar için matchData.status kontrolü
      if (isMatchNotStartedFromData) {
        if (!matchNotStarted) {
          setMatchNotStarted(true);
        }
        setLoading(false);
        return;
      }
      // Gerçek maç başladıysa
      if (matchNotStarted) {
        setMatchNotStarted(false);
      }
    }

    const fetchLiveData = async () => {
      try {
        if (!matchNotStartedRef.current) {
          setLoading(true);
        }
        setError(null);

        let events: any[] = [];
        // Mock maç (999999 veya GS-FB 888001): Her zaman tam event listesi (45. dk uzatma, devre arası, 2. yarı) – API yanıtı kullanılmaz
        if (isMockMatch) {
          setMatchNotStarted(false);
          if (String(matchId) === '999999') {
            events = MOCK_999999_EVENTS;
          } else {
            // GS-FB mock maçı için mockTestData'dan eventleri çek
            // Bu eventler dinamik olarak computeLiveState tarafından filtrelenir
            events = await getMockMatchEvents(Number(matchId));
          }
        } else {
          try {
            const response = await api.matches.getMatchEventsLive(matchId);
            if (response?.matchNotStarted) {
              setMatchNotStarted(true);
              setLiveEvents([]);
              setLoading(false);
              return;
            }
            setMatchNotStarted(false);
            events = response?.events || [];
          } catch (apiErr) {
            throw apiErr;
          }
        }

        if (events && events.length > 0) {
          // API-Football event listesi: Kick Off, First Half Extra Time, Half Time, Second Half Started,
          // Match Finished, Normal Goal, Penalty, Own Goal, Yellow/Red Card, Substitution, Var
          const transformedEvents = events
            .filter((event: any) => event && event.time)
            .map((event: any) => {
              const eventType = event.type?.toLowerCase() || 'unknown';
              const detail = (event.detail || '').toLowerCase();
              const detailNorm = detail.replace(/-/g, ' ').trim();
              
              let description = '';
              let displayType = eventType;
              
              // API-Football: Maç / yarı başlangıç ve bitiş
              if (detail === 'match kick off' || detail === 'kick off' || detailNorm === '1st half' || detailNorm === 'first half') {
                description = 'Maç başladı';
                displayType = 'kickoff';
              } else if (detailNorm.includes('first half extra time') && (event.time?.extra == null || event.time?.extra === 0)) {
                // 45. dk'da uzatma bildirimi
                const ex = Number(event.comments) || event.time?.extra || 0;
                description = ex > 0 ? `45. dk'da ilk yarının sonuna +${ex} dk eklendi` : '45. dk uzatma';
                displayType = 'stoppage';
              } else if (detailNorm.includes('first half extra time') && (event.time?.extra != null && event.time.extra > 0)) {
                // 45. dk'da uzatma bildirimi (extraTime ile)
                const ex = event.time?.extra ?? 0;
                description = ex > 0 ? `45. dk'da ilk yarının sonuna +${ex} dk eklendi` : '45. dk uzatma';
                displayType = 'stoppage';
              } else if (event.time?.elapsed === 90 && (event.time?.extra != null && event.time.extra > 0) && detailNorm.includes('second half extra time')) {
                // 90. dk'da uzatma bildirimi
                const ex = event.time.extra;
                description = `90. dk'da maçın sonuna +${ex} dk eklendi`;
                displayType = 'stoppage';
              } else if (detailNorm.includes('second half extra time') || (detailNorm.includes('extra time') && event.time?.elapsed === 90)) {
                // 90. dk'da uzatma bildirimi
                const ex = event.time?.extra ?? 0;
                description = ex > 0 ? `90. dk'da maçın sonuna +${ex} dk eklendi` : '90. dk uzatma';
                displayType = 'stoppage';
              } else if ((detail === 'half time' || detail === 'halftime' || detailNorm === 'half time') && (event.time?.extra != null && event.time.extra > 0)) {
                // ✅ İlk yarı bitiş düdüğü: "İlk yarı bitiş düdüğü" formatında göster
                description = 'İlk yarı bitiş düdüğü';
                displayType = 'halftime';
              } else if (detail === 'half time' || detail === 'halftime' || detailNorm === 'half time') {
                description = 'İlk yarı bitiş düdüğü';
                displayType = 'halftime';
              } else if (detailNorm.includes('second half') || detail === '2nd half' || detail === 'second half started') {
                description = 'İkinci yarı başladı';
                displayType = 'kickoff';
              } else if (detail === 'match finished' || detail === 'full time' || detailNorm.includes('full time')) {
                // ✅ Maç bitti eventi: "Maç bitti" formatında göster
                description = 'Maç bitti';
                displayType = 'fulltime';
              } else if (eventType === 'goal') {
                if (detail.includes('penalty')) {
                  description = 'Penaltı golü';
                } else if (detail.includes('own goal')) {
                  description = 'Kendi kalesine';
                } else if (detail.includes('free kick') || detail.includes('direct free kick') || detailNorm.includes('serbest vuruş')) {
                  description = 'Serbest vuruştan gol';
                } else {
                  description = 'GOL!';
                }
              } else if (eventType === 'card') {
                if (detail.includes('yellow')) {
                  description = 'Sarı kart';
                } else if (detail.includes('red')) {
                  description = 'Kırmızı kart';
                }
              } else if (eventType === 'subst') {
                description = 'Değişiklik'; // Alt satırda Çıkan / Giren ayrı gösterilecek
                displayType = 'substitution';
              } else if (eventType === 'var') {
                description = 'VAR';
              } else {
                description = event.comments || event.detail || '';
              }
              
              // Team matching
              let teamSide: 'home' | 'away' | null = null;
              if (event.team?.id) {
                const homeTeamId = matchData?.teams?.home?.id || matchData?.homeTeam?.id;
                const awayTeamId = matchData?.teams?.away?.id || matchData?.awayTeam?.id;
                if (event.team.id === homeTeamId) teamSide = 'home';
                else if (event.team.id === awayTeamId) teamSide = 'away';
              } else if (event.team?.name) {
                const homeTeamName = matchData?.teams?.home?.name || matchData?.homeTeam?.name || '';
                teamSide = event.team.name.toLowerCase().includes(homeTeamName.toLowerCase()) ? 'home' : 'away';
              }
              
              // ✅ Substitution için playerOut ve playerIn bilgilerini ayrı tut
              let playerOut: string | null = null;
              let playerIn: string | null = null;
              if (displayType === 'substitution') {
                playerOut = typeof event.player === 'string' ? event.player : event.player?.name || null;
                playerIn = event.comments || null;
              }
              
              return {
                minute: event.time?.elapsed || 0,
                extraTime: event.time?.extra || null,
                type: displayType,
                team: teamSide,
                player: displayType === 'substitution' ? playerOut : (typeof event.player === 'string' ? event.player : event.player?.name || null),
                assist: typeof event.assist === 'string' ? event.assist : (event.assist?.name || null),
                description: description,
                detail: event.detail || '',
                score: event.goals ? `${event.goals.home}-${event.goals.away}` : null,
                // ✅ Substitution için ekstra bilgiler
                playerOut: playerOut,
                playerIn: playerIn,
              };
            })
            // Sırala: yüksek dakika üstte. Aynı dakikada (örn. 45+1): önce oyuncu olayları (kırmızı kart, gol), sonra sistem (İlk yarı bitti)
            .sort((a: LiveEvent, b: LiveEvent) => {
              const aTime = a.minute + (a.extraTime || 0) * 0.01;
              const bTime = b.minute + (b.extraTime || 0) * 0.01;
              if (Math.abs(aTime - bTime) > 0.001) return bTime - aTime;
              const sys = ['kickoff', 'halftime', 'fulltime', 'stoppage'];
              const aSys = sys.includes(a.type) ? 0 : 1;
              const bSys = sys.includes(b.type) ? 0 : 1;
              return bSys - aSys;
            });
          
          setLiveEvents(transformedEvents);
        } else {
          setLiveEvents([]);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('❌ Live data fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15000);
    return () => clearInterval(interval);
  }, [matchId, matchData, isMatchNotStartedFromData, matchNotStarted]); // ✅ matchNotStarted: maç başladığında tekrar çalışsın

  // Maçın şu anki dakikası ve uzatma bilgisi (header ile tutarlı – timeline sadece bu dakikaya kadar gösterilir)
  // ✅ Mock maçlar için doğrudan hesapla (matchData.minute senkronize olmayabilir)
  // ✅ useMemo ile hesapla ki her render'da güncel olsun
  const { currentMinute, currentExtraTime } = useMemo(() => {
    const isMockMatch = isMockTestMatch(Number(matchId));
    
    // ✅ Mock maçlarda her zaman gerçek zamandan hesapla (matchData.minute takılı kalmasın)
    if (isMockMatch && matchId) {
      const matchStart = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - matchStart) / 1000);
      const elapsedMinutes = elapsedSeconds; // 1 sn = 1 dk
      
      if (elapsedMinutes < 0) return { currentMinute: 0, currentExtraTime: null };
      if (elapsedMinutes >= 112) return { currentMinute: 90, currentExtraTime: 4 }; // Maç bitti (90+4)
      
      // ✅ İlk yarı: 0-45 dk (normal)
      if (elapsedMinutes < 45) return { currentMinute: elapsedMinutes, currentExtraTime: null };
      
      // ✅ İlk yarı uzatması: 45-48 dk → 45+1, 45+2, 45+3
      if (elapsedMinutes <= 48) {
        const extraTime = elapsedMinutes - 45;
        return { currentMinute: 45, currentExtraTime: extraTime };
      }
      
      // ✅ Devre arası: 48-60 dk (15 dakika simülasyon)
      if (elapsedMinutes < 60) return { currentMinute: 45, currentExtraTime: 3 };
      
      // ✅ İkinci yarı: 60-90 dk → 46. dk'dan başlar
      if (elapsedMinutes < 90) {
        const secondHalfMinute = 46 + (elapsedMinutes - 60);
        return { currentMinute: secondHalfMinute, currentExtraTime: null };
      }
      
      // ✅ İkinci yarı uzatması: 90-94 dk → 90+1, 90+2, 90+3, 90+4
      if (elapsedMinutes <= 94) {
        const extraTime = elapsedMinutes - 90;
        return { currentMinute: 90, currentExtraTime: extraTime };
      }
      
      return { currentMinute: 90, currentExtraTime: 4 };
    }
    
    // Gerçek maçlar için API'den gelen bilgiyi kullan
    const minute = matchData?.minute ?? matchData?.fixture?.status?.elapsed ?? 99;
    const extraTime = matchData?.extraTime ?? matchData?.fixture?.status?.extraTime ?? null;
    return { currentMinute: minute, currentExtraTime: extraTime };
  }, [matchId, matchData?.minute, matchData?.extraTime, matchData?.fixture?.status?.elapsed, matchData?.fixture?.status?.extraTime, ticker]); // ✅ ticker: mock'ta her saniye güncelle
  
  // ✅ eventsUpToNow'u da useMemo ile hesapla
  // ✅ Mock maçlarda gerçek zamandan filtreleme yap
  const eventsUpToNow = useMemo(() => {
    const isMockMatch = isMockTestMatch(Number(matchId));
    
    return liveEvents.filter((e) => {
      if (e.type === 'kickoff') return false;
      
      // ✅ Sistem eventlerini filtrele: stoppage eventleri gösterilmeli (uzatma bildirimleri)
      // stoppage eventleri artık gösterilecek (45. dk +X dk eklendi, 90. dk +X dk eklendi)
      
      // ✅ "Half Time" ve "Match Finished" eventleri gösterilmeli (halftime ve fulltime type'ları)
      // Bu eventler zaten gösterilecek çünkü stoppage değiller
      
      // ✅ Mock maçlarda gerçek zamandan kontrol et
      if (isMockMatch && matchId) {
        const matchStart = Number(matchId) === MOCK_MATCH_IDS.GS_FB ? getMatch1Start() : getMatch2Start();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - matchStart) / 1000);
        const elapsedMinutes = elapsedSeconds; // Gerçek zaman (0-112)
        
        // Event'in maç dakikası ve uzatması (getMockMatchEvents'te zaten çevrilmiş)
        // e.minute artık maç dakikasını gösteriyor (0-45, 46-90)
        const eventMinute = e.minute;
        const eventExtraTime = e.extraTime ?? 0;
        
        // Event'in gerçekleştiği toplam elapsed dakika (gerçek zaman 0-112)
        let eventTotalElapsedMinute: number;
        
        if (eventMinute < 45) {
          // İlk yarı normal dakikaları: 0-45
          eventTotalElapsedMinute = eventMinute;
        } else if (eventMinute === 45) {
          if (eventExtraTime > 0) {
            // İlk yarı uzatması: 45+1, 45+2, 45+3 → elapsed 46, 47, 48
            eventTotalElapsedMinute = 45 + eventExtraTime;
          } else {
            // İlk yarı sonu → elapsed 48
            eventTotalElapsedMinute = 48;
          }
        } else if (eventMinute < 90) {
          // İkinci yarı normal dakikaları: 46-89
          // 46. maç dk = 60. elapsed dk (ikinci yarı başlangıcı)
          // 90. maç dk = 90. elapsed dk
          // Linear: elapsed = 60 + (eventMinute - 46)
          eventTotalElapsedMinute = 60 + (eventMinute - 46);
        } else if (eventMinute === 90) {
          // ✅ "Match Finished" eventi için özel kontrol
          if (e.type === 'fulltime' && eventExtraTime > 0) {
            // Maç bitiş eventi: uzatma dakikası bittikten sonra gösterilmeli
            // Örnek: 90+4'te maç bitti → elapsed 94'te göster (uzatma dakikası bittikten sonra)
            // API'den gelen veri: 90. dakikada, extraTime: 4 → bu 90+4'te gösterilmeli
            eventTotalElapsedMinute = 90 + eventExtraTime;
          } else if (eventExtraTime > 0) {
            // İkinci yarı uzatmasındaki diğer eventler: 90+1, 90+2, 90+3, 90+4 → elapsed 91, 92, 93, 94
            eventTotalElapsedMinute = 90 + eventExtraTime;
          } else if (e.type === 'fulltime') {
            // Maç bitiş düdüğü (extraTime yok) → elapsed 94 (90+4 uzatma varsa)
            eventTotalElapsedMinute = 94; // Maç bitiş düdüğü
          } else {
            // Diğer 90. dakika eventleri
            eventTotalElapsedMinute = 90;
          }
        } else {
          eventTotalElapsedMinute = 94;
        }
        
        // ✅ Maç bittiğinde (elapsedMinutes >= 112) tüm eventleri göster
        if (elapsedMinutes >= 112) {
          return true;
        }
        
        // ✅ Event'in gerçekleştiği zamana kadar göster (eşit veya önceki eventler)
        // ÖNEMLİ: "Match Finished" eventi için, uzatma dakikası bittikten sonra gösterilmeli
        // Örnek: 90+4'te maç bitti → elapsedMinutes >= 94 olduğunda göster
        return elapsedMinutes >= eventTotalElapsedMinute;
      }
      
      // ✅ Gerçek maçlar için mevcut mantık - extraTime'ı da dikkate al
      // Maç bittiğinde (FT status) tüm eventleri göster
      const matchStatus = matchData?.status || matchData?.fixture?.status?.short || '';
      if (matchStatus === 'FT') {
        return true;
      }
      
      // ✅ "Match Finished" eventi için özel kontrol: extraTime varsa, o uzatma dakikası bittikten sonra gösterilmeli
      // API'den gelen veri: "Match Finished" eventi 90. dakikada, extraTime: 4 olarak gelir
      // Bu, uzatma dakikası bittikten sonra gösterilmeli (90+4'te)
      if (e.type === 'fulltime' && e.minute === 90 && e.extraTime != null && e.extraTime > 0) {
        // Maç bitiş eventi: uzatma dakikası bittikten sonra gösterilmeli
        // Örnek: 90+4'te maç bitti → currentMinute 90 ve currentExtraTime >= 4 olduğunda göster
        // Event dakikası: 90 + extraTime (4) = 90.04
        // Current dakika: currentMinute (90) + currentExtraTime (4) = 90.04
        // Event gösterilmeli: currentMinute >= 90 && currentExtraTime >= eventExtraTime
        if (currentMinute < 90) return false;
        if (currentMinute === 90) {
          return (currentExtraTime ?? 0) >= e.extraTime;
        }
        return true; // 90'dan sonra her zaman göster
      }
      
      // ✅ Diğer eventler için normal kontrol
      const eventMin = e.minute + (e.extraTime ?? 0) * 0.01;
      const currentMin = currentMinute + (currentExtraTime ?? 0) * 0.01;
      return eventMin <= currentMin + 0.01;
    });
  }, [liveEvents, currentMinute, currentExtraTime, matchId, ticker]); // ✅ ticker: mock'ta her saniye güncelle

  // Dakika + uzatma metni (örn. 45+2, 90+3)
  const formatMinute = (event: LiveEvent) =>
    event.extraTime != null && event.extraTime > 0
      ? `${event.minute}+${event.extraTime}`
      : String(event.minute);

  // =====================================
  // GET EVENT STYLING
  // =====================================
  const getEventStyle = (event: LiveEvent) => {
    switch (event.type) {
      case 'goal':
        return { icon: 'football', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'card':
        if (event.detail?.toLowerCase().includes('yellow')) {
          return { icon: 'card', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
        }
        return { icon: 'card', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'substitution':
        return { icon: 'swap-horizontal', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
      case 'var':
        return { icon: 'tv', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'kickoff':
      case 'halftime':
      case 'fulltime':
      case 'stoppage':
        return { icon: 'time', color: BRAND.accent, bg: 'rgba(201, 164, 76, 0.15)' };
      default:
        return { icon: 'ellipse', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)' };
    }
  };

  // =====================================
  // RENDER EVENT CARD
  // =====================================
  const renderEventCard = (event: LiveEvent, index: number, totalEvents: number) => {
    const style = getEventStyle(event);
    const isSystemEvent = ['kickoff', 'halftime', 'fulltime', 'stoppage'].includes(event.type);
    const isHome = event.team === 'home';
    const isAway = event.team === 'away';
    
    // Sistem eventleri ortada göster
    if (isSystemEvent) {
      return (
        <Animated.View
          key={index}
          entering={isWeb ? undefined : FadeIn.delay(index * 30)}
          style={styles.timelineRow}
        >
          {/* Sol boşluk */}
          <View style={styles.timelineSide} />
          
          {/* Orta çizgi + dakika */}
          <View style={styles.timelineCenter}>
            <View style={[styles.timelineLine, index === totalEvents - 1 && styles.timelineLineToStart]} />
            <View style={[styles.timelineDot, { backgroundColor: style.color }]}>
              <Ionicons name={style.icon as any} size={12} color="#FFFFFF" />
            </View>
            <View style={styles.timelineMinuteBadge}>
              <Text style={styles.timelineMinuteText}>{formatMinute(event)}'</Text>
            </View>
          </View>
          
          {/* Sağ boşluk */}
          <View style={styles.timelineSide} />
          
          {/* Sistem event kartı - ortada */}
          <View style={[styles.systemEventOverlay]}>
            <View style={[styles.systemEventCard, { borderColor: style.color }]}>
              <Ionicons name={style.icon as any} size={14} color={style.color} />
              <Text style={[styles.systemEventText, { color: style.color }]}>
                {event.description}
              </Text>
            </View>
          </View>
        </Animated.View>
      );
    }
    
    return (
      <Animated.View
        key={index}
        entering={isWeb ? undefined : FadeIn.delay(index * 30)}
        style={styles.timelineRow}
      >
        {/* Sol taraf - Ev sahibi eventleri */}
        <View style={[styles.timelineSide, styles.timelineSideLeft]}>
          {isHome && (
            <View style={[styles.eventCard, styles.eventCardLeft, { borderColor: style.color }]}>
              <View style={styles.eventCardHeader}>
                <View style={[styles.eventIcon, { backgroundColor: style.bg }]}>
                  <Ionicons name={style.icon as any} size={14} color={style.color} />
                </View>
                <Text style={[styles.eventDescription, { color: style.color }]} numberOfLines={1}>
                  {event.description}
                </Text>
              </View>
              {event.type === 'substitution' && (event.playerOut || event.playerIn) ? (
                <>
                  {event.playerOut ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="arrow-down-circle" size={14} color="#EF4444" />
                      <Text style={styles.eventPlayer} numberOfLines={1}>
                        <Text style={{ textDecorationLine: 'line-through', opacity: 0.8 }}>{event.playerOut}</Text>
                      </Text>
                    </View>
                  ) : null}
                  {event.playerIn ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="arrow-up-circle" size={14} color="#10B981" />
                      <Text style={styles.eventPlayer} numberOfLines={1}>
                        <Text style={{ fontWeight: '700' }}>{event.playerIn}</Text>
                      </Text>
                    </View>
                  ) : null}
                </>
              ) : event.player && (
                <Text style={styles.eventPlayer} numberOfLines={1}>{event.player}</Text>
              )}
              {event.assist && (
                <Text style={styles.eventAssist} numberOfLines={1}>⚡ {event.assist}</Text>
              )}
              {event.type === 'goal' && event.score && (
                <Text style={styles.eventScore}>{event.score}</Text>
              )}
            </View>
          )}
        </View>
        
        {/* Orta çizgi + dakika */}
        <View style={styles.timelineCenter}>
          <View style={[styles.timelineLine, index === totalEvents - 1 && styles.timelineLineToStart]} />
          <View style={[styles.timelineDot, { backgroundColor: style.color }]}>
            <Text style={styles.timelineDotText}>{formatMinute(event)}</Text>
          </View>
        </View>
        
        {/* Sağ taraf - Deplasman eventleri */}
        <View style={[styles.timelineSide, styles.timelineSideRight]}>
          {isAway && (
            <View style={[styles.eventCard, styles.eventCardRight, { borderColor: style.color }]}>
              <View style={styles.eventCardHeader}>
                <Text style={[styles.eventDescription, { color: style.color }]} numberOfLines={1}>
                  {event.description}
                </Text>
                <View style={[styles.eventIcon, { backgroundColor: style.bg }]}>
                  <Ionicons name={style.icon as any} size={14} color={style.color} />
                </View>
              </View>
              {event.type === 'substitution' && (event.playerOut || event.playerIn) ? (
                <>
                  {event.playerOut ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
                      <Text style={[styles.eventPlayer, styles.eventPlayerRight]} numberOfLines={1}>
                        <Text style={{ textDecorationLine: 'line-through', opacity: 0.8 }}>{event.playerOut}</Text>
                      </Text>
                      <Ionicons name="arrow-down-circle" size={14} color="#EF4444" />
                    </View>
                  ) : null}
                  {event.playerIn ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
                      <Text style={[styles.eventPlayer, styles.eventPlayerRight]} numberOfLines={1}>
                        <Text style={{ fontWeight: '700' }}>{event.playerIn}</Text>
                      </Text>
                      <Ionicons name="arrow-up-circle" size={14} color="#10B981" />
                    </View>
                  ) : null}
                </>
              ) : event.player && (
                <Text style={[styles.eventPlayer, styles.eventPlayerRight]} numberOfLines={1}>{event.player}</Text>
              )}
              {event.assist && (
                <Text style={[styles.eventAssist, styles.eventAssistRight]} numberOfLines={1}>⚡ {event.assist}</Text>
              )}
              {event.type === 'goal' && event.score && (
                <Text style={[styles.eventScore, styles.eventScoreRight]}>{event.score}</Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  // =====================================
  // RENDER
  // =====================================
  
  // ✅ Maç başlamadıysa önce bu kontrolü yap (loading'den önce)
  // Match not started
  if (matchNotStarted) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        {/* Tab bar benzeri başlık - İstatistik sekmesiyle aynı yükseklik ve görünüm */}
        <View style={styles.liveTabHeader}>
          <View style={styles.liveTabButton}>
            <Text style={styles.liveTabText}>📡 Canlı Olaylar</Text>
          </View>
        </View>
        <View style={styles.notStartedContainer}>
          <View style={styles.notStartedCard}>
            <View style={styles.notStartedIconContainer}>
              <Ionicons name="time-outline" size={48} color={BRAND.accent} />
            </View>
            <Text style={styles.notStartedTitle}>Maç Henüz Başlamadı</Text>
            <Text style={styles.notStartedSubtitle}>
              Maç başladığında canlı olaylar{'\n'}burada görünecek
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state - sadece maç başladıysa göster
  if (loading && liveEvents.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.secondary} />
          <Text style={styles.loadingText}>Canlı veriler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state - API connection failed or other error
  if (error && liveEvents.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <View style={styles.notStartedContainer}>
          <View style={styles.notStartedCard}>
            <View style={styles.notStartedIconContainer}>
              <Ionicons name="cloud-offline-outline" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.notStartedTitle}>Bağlantı Hatası</Text>
            <Text style={styles.notStartedSubtitle}>
              Canlı maç verisi alınamadı.{'\n'}Lütfen internet bağlantınızı kontrol edin.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Canlı olay timeline – Olaylar/İstatistikler tab bar kaldırıldı; istatistikler İstatistik sekmesinde */}
      <ScrollView 
        style={styles.eventsScrollView}
        contentContainerStyle={styles.eventsContent}
        showsVerticalScrollIndicator={false}
      >
        {eventsUpToNow.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="football-outline" size={48} color="#4B5563" />
            <Text style={styles.emptyStateTitle}>Henüz olay yok</Text>
            <Text style={styles.emptyStateSubtitle}>
              Maç devam ederken olaylar burada görünecek
            </Text>
          </View>
        ) : (
          <>
            {/* Sadece mevcut dakikaya kadar olan olaylar (header 65' ise 90+2 gösterilmez) */}
            {/* Devre arası görseli ve eventleri birleştir */}
            {(() => {
              // Eventleri sırala
              const sortedEvents = [...eventsUpToNow].sort((a, b) => {
                const aTime = (a.minute || 0) + (a.extraTime || 0) * 0.01;
                const bTime = (b.minute || 0) + (b.extraTime || 0) * 0.01;
                if (Math.abs(aTime - bTime) > 0.001) return bTime - aTime;
                // Aynı dakikada: sistem olayları (kickoff, halftime, fulltime, stoppage) en sona
                const sys = ['kickoff', 'halftime', 'fulltime', 'stoppage'];
                const aSys = sys.includes(a.type) ? 0 : 1;
                const bSys = sys.includes(b.type) ? 0 : 1;
                return bSys - aSys;
              });
              
              // Devre arası görseli ekle (45+3 ile 46. dakika arasına)
              const halftimeIndex = sortedEvents.findIndex(e => 
                e.type === 'halftime' || (e.minute === 45 && e.extraTime === 3)
              );
              const secondHalfStartIndex = sortedEvents.findIndex(e => 
                e.minute === 46 && e.extraTime === null
              );
              
              // Devre arası görseli için render fonksiyonu
              const renderHalftimeBreak = () => (
                <View key="halftime-break" style={styles.timelineRow}>
                  <View style={styles.timelineSide} />
                  <View style={styles.timelineCenter}>
                    <View style={styles.timelineHalftimeLine} />
                    <View style={styles.timelineHalftimeDot}>
                      <Ionicons name="pause" size={16} color="#EF4444" />
                    </View>
                  </View>
                  <View style={styles.timelineSide} />
                  <View style={styles.timelineHalftimeCard}>
                    <Text style={styles.timelineHalftimeText}>DEVRE ARASI</Text>
                    <Text style={styles.timelineHalftimeSubtext}>15 dakika</Text>
                  </View>
                </View>
              );
              
              // Eventleri render et, devre arası görselini uygun yere ekle
              const result: any[] = [];
              const totalEvents = sortedEvents.length;
              sortedEvents.forEach((event, index) => {
                // Devre arası görseli: Half Time event'inden sonra ve 46. dakika eventinden önce
                if (event.type === 'halftime' || (event.minute === 45 && event.extraTime === 3)) {
                  result.push(renderEventCard(event, index, totalEvents));
                  // Devre arası görselini ekle (eğer 46. dakika eventi varsa)
                  if (sortedEvents.some(e => e.minute === 46 && e.extraTime === null)) {
                    result.push(renderHalftimeBreak());
                  }
                } else {
                  result.push(renderEventCard(event, index, totalEvents));
                }
              });
              
              return result;
            })()}
            <View style={styles.timelineStart}>
              <View style={styles.timelineStartLine} />
              <View style={styles.timelineStartDot}>
                <Text style={styles.timelineStartText}>0'</Text>
              </View>
              <Text style={styles.timelineStartLabel}>Başlangıç</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// =====================================
// STYLES
// =====================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  
  // Not Started - Sabit boyut, tüm sekmelerde aynı görünüm (sıçrama önleme)
  notStartedContainer: {
    flex: 1, // Tüm alanı kapla
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notStartedCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARK_MODE.border,
    width: 300, // Sabit genişlik
    height: 240, // Sabit yükseklik - sıçrama önleme
    justifyContent: 'center',
  },
  notStartedIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 164, 76, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  notStartedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  notStartedSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Tab header - İstatistik sekmesiyle aynı yükseklik ve stil (sıçrama önleme)
  liveTabHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E293B', // Solid arka plan - grid görünmesin
    borderBottomWidth: 1,
    borderBottomColor: DARK_MODE.border,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  liveTabButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1D4044', // Solid arka plan - grid görünmesin (secondary tonu)
    borderWidth: 1,
    borderColor: `${BRAND.secondary}40`,
  },
  liveTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.secondary,
  },
  
  // Events ScrollView
  eventsScrollView: {
    flex: 1,
  },
  eventsContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  
  // Timeline Row
  timelineRow: {
    flexDirection: 'row',
    minHeight: 70,
    position: 'relative',
  },
  timelineSide: {
    flex: 1,
    paddingVertical: 8,
  },
  timelineSideLeft: {
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  timelineSideRight: {
    paddingLeft: 8,
    alignItems: 'flex-start',
  },
  
  // Timeline Center (vertical line)
  timelineCenter: {
    width: 50,
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(31, 162, 166, 0.3)',
  },
  timelineLineToStart: {
    bottom: -2000, // Başlangıca kadar uzat - kesintisiz çizgi
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginTop: 20,
  },
  timelineDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineMinuteBadge: {
    position: 'absolute',
    top: 52,
    backgroundColor: 'rgba(31, 162, 166, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timelineMinuteText: {
    fontSize: 10,
    fontWeight: '700',
    color: BRAND.secondary,
  },
  
  // Event Card
  eventCard: {
    backgroundColor: DARK_MODE.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderLeftWidth: 3,
    maxWidth: '95%',
    minWidth: 120,
  },
  eventCardLeft: {
    borderLeftWidth: 3,
    borderRightWidth: 1,
  },
  eventCardRight: {
    borderRightWidth: 3,
    borderLeftWidth: 1,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDescription: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  eventPlayer: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 4,
  },
  eventPlayerRight: {
    textAlign: 'right',
  },
  eventAssist: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  eventAssistRight: {
    textAlign: 'right',
  },
  eventScore: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 4,
  },
  eventScoreRight: {
    textAlign: 'right',
  },
  
  // System Event (ortada gösterilir)
  systemEventOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
    alignItems: 'center',
    zIndex: 2,
  },
  systemEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: DARK_MODE.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  systemEventText: {
    fontSize: 11,
    fontWeight: '700',
  },
  
  // Devre arası görseli
  timelineHalftimeLine: {
    width: 3,
    flex: 1,
    backgroundColor: '#EF4444', // Kırmızı çizgi - devre arası
    opacity: 0.6,
  },
  timelineHalftimeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  timelineHalftimeCard: {
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  timelineHalftimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  timelineHalftimeSubtext: {
    fontSize: 9,
    color: '#EF4444',
    marginTop: 2,
    opacity: 0.8,
  },
  // Devre Arası Görseli (duplicate kaldırıldı - yukarıda zaten var)
  // Timeline Start (altta)
  timelineStart: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  timelineStartLine: {
    width: 2,
    height: 20,
    backgroundColor: 'rgba(31, 162, 166, 0.3)',
  },
  timelineStartDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DARK_MODE.card,
    borderWidth: 2,
    borderColor: BRAND.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  timelineStartText: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND.secondary,
  },
  timelineStartLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

export default MatchLive;
