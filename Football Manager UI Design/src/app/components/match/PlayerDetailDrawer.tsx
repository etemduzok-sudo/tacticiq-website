import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "../ui/drawer";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";

interface PlayerDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: any | null;
  selectedSlot: number | null;
  onSelectPlayer: (player: any) => void;
}

export function PlayerDetailDrawer({ open, onOpenChange, player, selectedSlot, onSelectPlayer }: PlayerDetailDrawerProps) {
  if (!player) return null;

  // Mock API-Football data (gerçek API'dan gelecek)
  const apiData = {
    // 1) Kimlik & Temel Bilgiler
    age: 25 + Math.floor(Math.random() * 10),
    nationality: player.position === "GK" ? "Uruguay" : ["Türkiye", "Fransa", "Belçika", "Brezilya", "Arjantin"][Math.floor(Math.random() * 5)],
    height: `${175 + Math.floor(Math.random() * 20)} cm`,
    weight: `${70 + Math.floor(Math.random() * 15)} kg`,
    preferredFoot: Math.random() > 0.3 ? "Sağ" : "Sol", // %70 sağ ayaklı
    team: "Galatasaray",
    league: "Süper Lig 2025/26",
    
    // 3) Sezon Performans Özeti
    appearances: Math.floor(player.rating / 3),
    lineups: Math.floor(player.rating / 3.5),
    minutesPlayed: Math.floor(player.rating * 30),
    seasonRating: (player.rating / 10 - 0.5 + Math.random() * 0.4).toFixed(2),
    goals: player.position.includes("ST") || player.position.includes("W") ? Math.floor(player.rating / 10) : Math.floor(player.rating / 20),
    assists: Math.floor(player.rating / 12),
    shotsTotal: Math.floor(player.stats.shooting / 2),
    shotsOn: Math.floor(player.stats.shooting / 3),
    passesTotal: Math.floor(player.stats.passing * 20),
    passesAccuracy: Math.min(95, player.stats.passing + Math.random() * 5),
    dribblesAttempts: Math.floor(player.stats.dribbling / 2),
    dribblesSuccess: Math.floor(player.stats.dribbling / 3),
    tacklesTotal: player.position.includes("B") || player.position.includes("DM") ? Math.floor(player.rating / 2) : Math.floor(player.rating / 4),
    duelsTotal: Math.floor(player.rating * 1.5),
    duelsWon: Math.floor(player.rating),
    foulsCommitted: Math.floor(Math.random() * 15) + 5,
    foulsDrawn: Math.floor(Math.random() * 20) + 10,
    yellowCards: player.status === "yellow_card" ? 5 : Math.floor(Math.random() * 4),
    redCards: player.status === "suspended" ? 1 : 0,
    penaltyScored: 0,
    penaltyMissed: 0,
  };

  // 2) Özet Skorlar (Hesaplanmış)
  const overallRating = player.rating;
  const powerScore = Math.round((player.stats.pace * 0.4 + player.stats.shooting * 0.3 + player.stats.dribbling * 0.3));
  const formScore = player.form;
  
  // 5) Oynanabilirlik Durumu
  const playabilityStatus = {
    status: player.status,
    statusText: player.status === "available" ? "✓ Uygun" : 
               player.status === "injured" ? "🤕 Sakatlık" : 
               player.status === "suspended" ? "🟥 Cezalı" : 
               player.status === "yellow_card" ? "⚠️ Kart Riski (4 Sarı)" : "❓ Bilinmiyor",
    statusColor: player.status === "available" ? "text-emerald-400" : 
                player.status === "injured" ? "text-red-400" : 
                player.status === "suspended" ? "text-red-400" : 
                player.status === "yellow_card" ? "text-yellow-400" : "text-gray-400",
    injuryType: player.status === "injured" ? "Hamstring" : null,
    expectedReturn: player.status === "injured" ? "2 hafta" : null,
  };

  // Calculated percentages
  const shotAccuracy = apiData.shotsTotal > 0 ? ((apiData.shotsOn / apiData.shotsTotal) * 100).toFixed(0) : 0;
  const dribblingSuccess = apiData.dribblesAttempts > 0 ? ((apiData.dribblesSuccess / apiData.dribblesAttempts) * 100).toFixed(0) : 0;
  const duelsWonPct = apiData.duelsTotal > 0 ? ((apiData.duelsWon / apiData.duelsTotal) * 100).toFixed(0) : 0;
  const startingPct = apiData.appearances > 0 ? ((apiData.lineups / apiData.appearances) * 100).toFixed(0) : 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <DrawerTitle>Oyuncu Detayları</DrawerTitle>
          <DrawerDescription>API-Football uyumlu detaylı istatistikler</DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 space-y-6 pb-20">
            {/* 1) 🆔 KİMLİK & TEMEL BİLGİLER */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {/* Oyuncu numarası kutusu */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#059669] to-emerald-700 flex items-center justify-center border-2 border-emerald-600/30 shadow-lg flex-shrink-0">
                  <span className="text-2xl font-black text-white">{player.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-white mb-1 truncate">{player.name}</h2>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="text-gray-300">{player.position}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-300 truncate">{apiData.nationality}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-300">{apiData.age} yaş</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-300 truncate">{apiData.team}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#1E293B]/60 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 mb-1">Boy</p>
                  <p className="text-sm font-bold text-white">{apiData.height.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-500">cm</p>
                </div>
                <div className="bg-[#1E293B]/60 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 mb-1">Kilo</p>
                  <p className="text-sm font-bold text-white">{apiData.weight.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-500">kg</p>
                </div>
                <div className="bg-[#1E293B]/60 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 mb-1">Ayak</p>
                  <p className="text-sm font-bold text-white">{apiData.preferredFoot}</p>
                  <p className="text-[10px] text-gray-500">👟</p>
                </div>
              </div>

              {/* Oynanabilirlik Durumu */}
              <div className={`rounded-xl p-4 border-2 ${
                playabilityStatus.status === "available" ? "bg-emerald-500/10 border-emerald-500/40" :
                playabilityStatus.status === "injured" ? "bg-red-500/10 border-red-500/40" :
                playabilityStatus.status === "suspended" ? "bg-red-500/10 border-red-500/40" :
                "bg-yellow-500/10 border-yellow-500/40"
              }`}>
                <p className="text-xs text-gray-400 mb-2">🩺 Durum</p>
                <p className={`font-bold ${playabilityStatus.statusColor}`}>{playabilityStatus.statusText}</p>
                {playabilityStatus.injuryType && (
                  <p className="text-xs text-gray-400 mt-2">Sakatlık: {playabilityStatus.injuryType} • Dönüş: {playabilityStatus.expectedReturn}</p>
                )}
              </div>
            </div>

            {/* 2) ⭐ ÖZET SKORLAR */}
            <div className="space-y-3">
              <h3 className="font-bold text-white">⭐ Özet Skorlar</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-[#1E293B] to-slate-800 rounded-xl p-4 text-center border-2 border-[#059669]/40">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Overall</p>
                  <div className="text-3xl font-black text-[#059669] mb-1">{overallRating}</div>
                  <p className="text-[10px] text-gray-500">Genel Rating</p>
                </div>

                <div className="bg-gradient-to-br from-[#1E293B] to-slate-800 rounded-xl p-4 text-center border-2 border-[#F59E0B]/40">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Power</p>
                  <div className="text-3xl font-black text-[#F59E0B] mb-1">{powerScore}</div>
                  <p className="text-[10px] text-gray-500">Tempo</p>
                </div>

                <div className="bg-gradient-to-br from-[#1E293B] to-slate-800 rounded-xl p-4 text-center border-2 border-orange-500/40">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Form</p>
                  <div className="text-3xl font-black text-orange-500 mb-1">{formScore}</div>
                  <p className="text-[10px] text-gray-500">Güncel</p>
                </div>
              </div>
            </div>

            {/* 3) 📊 SEZON PERFORMANS ÖZETİ */}
            <div className="space-y-3">
              <h3 className="font-bold text-white">📊 Sezon İstatistikleri</h3>
              
              {/* Maç Bilgileri */}
              <div className="bg-[#1E293B]/40 rounded-xl p-4 border-2 border-border space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Maçlar</p>
                    <p className="text-2xl font-bold text-white">{apiData.appearances}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">İlk 11</p>
                    <p className="text-2xl font-bold text-white">{apiData.lineups}</p>
                    <p className="text-xs text-emerald-400 mt-1">{startingPct}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Dakika</p>
                    <p className="text-2xl font-bold text-white">{apiData.minutesPlayed}'</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-gray-400 mb-2">Sezon Ortalama Rating</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-[#059669]">{apiData.seasonRating}</p>
                    <p className="text-gray-400">/10.00</p>
                  </div>
                </div>
              </div>

              {/* Hücum İstatistikleri */}
              <div className="bg-blue-500/5 rounded-xl p-4 border-2 border-blue-500/20 space-y-3">
                <h4 className="font-bold text-blue-400">⚽ Hücum</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Goller</p>
                    <p className="text-xl font-bold text-white">{apiData.goals}</p>
                  </div>
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Asistler</p>
                    <p className="text-xl font-bold text-white">{apiData.assists}</p>
                  </div>
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Şutlar</p>
                    <p className="text-xl font-bold text-white">{apiData.shotsTotal}</p>
                    <p className="text-xs text-emerald-400 mt-1">{apiData.shotsOn} isabet • {shotAccuracy}%</p>
                  </div>
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Dribling</p>
                    <p className="text-xl font-bold text-white">{apiData.dribblesSuccess}/{apiData.dribblesAttempts}</p>
                    <p className="text-xs text-emerald-400 mt-1">{dribblingSuccess}% başarı</p>
                  </div>
                </div>
              </div>

              {/* Pas & Oyun Kurma */}
              <div className="bg-purple-500/5 rounded-xl p-4 border-2 border-purple-500/20 space-y-3">
                <h4 className="font-bold text-purple-400">🎯 Pas & Oyun Kurma</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Toplam Pas</p>
                    <p className="text-xl font-bold text-white">{apiData.passesTotal}</p>
                  </div>
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">İsabet Oranı</p>
                    <p className="text-xl font-bold text-white">{apiData.passesAccuracy.toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              {/* Savunma & Fizik */}
              <div className="bg-emerald-500/5 rounded-xl p-4 border-2 border-emerald-500/20 space-y-3">
                <h4 className="font-bold text-emerald-400">🛡️ Savunma & Fizik</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Top Çalma</p>
                    <p className="text-xl font-bold text-white">{apiData.tacklesTotal}</p>
                  </div>
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Düellolar</p>
                    <p className="text-xl font-bold text-white">{apiData.duelsWon}/{apiData.duelsTotal}</p>
                    <p className="text-xs text-emerald-400 mt-1">{duelsWonPct}% kazanılan</p>
                  </div>
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Faul (Y/A)</p>
                    <p className="text-xl font-bold text-white">{apiData.foulsCommitted}/{apiData.foulsDrawn}</p>
                  </div>
                  <div className="bg-[#1E293B]/60 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Kartlar</p>
                    <p className="text-xl font-bold text-white">🟨 {apiData.yellowCards} 🟥 {apiData.redCards}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Button */}
        <div className="border-t border-border p-4">
          <Button
            onClick={() => {
              if (player && selectedSlot !== null) {
                onSelectPlayer(player);
                onOpenChange(false);
              }
            }}
            disabled={!player || selectedSlot === null || player.status === "injured" || player.status === "suspended"}
            className="w-full h-[50px] bg-[#059669] hover:bg-[#059669]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold"
          >
            {player.status === "injured" || player.status === "suspended" ? "Oyuncu Oynatılamaz" : "İlk 11'e Seç"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}