import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { useState } from "react";

interface MatchStatsProps {
  matchData: any;
}

const detailedStats = [
  { label: "Topla Oynama (%)", home: 58, away: 42 },
  { label: "Toplam Şut", home: 12, away: 8 },
  { label: "İsabetli Şut", home: 5, away: 3 },
  { label: "İsabetsiz Şut", home: 3, away: 2 },
  { label: "Şut Dışı", home: 10, away: 7 },
  { label: "Korner", home: 6, away: 4 },
  { label: "Ofsayt", home: 3, away: 5 },
  { label: "Pas İsabeti (%)", home: 86, away: 81 },
  { label: "Toplam Pas", home: 412, away: 298 },
  { label: "İsabetli Pas", home: 356, away: 241 },
  { label: "Dripling Başarısı", home: 12, away: 8 },
  { label: "Top Kaybı", home: 52, away: 68 },
  { label: "Tehlikeli Atak", home: 28, away: 19 },
  { label: "Toplam Atak", home: 67, away: 52 },
  { label: "Faul", home: 8, away: 11 },
  { label: "Sarı Kart", home: 2, away: 3 },
  { label: "Kırmızı Kart", home: 0, away: 0 },
  { label: "Kaleci Kurtarışı", home: 3, away: 4 },
];

// Mock top players
const topPlayers = {
  home: [
    {
      name: "Mauro Icardi",
      number: 9,
      position: "FW",
      rating: 8.7,
      minutesPlayed: 67,
      isStarting: true,
      // Gol & Şut
      goals: 2,
      assists: 1,
      shots: 5,
      shotsOnTarget: 3,
      shotsInsideBox: 4,
      shotsOutsideBox: 1,
      // Pas & Oyun Kurma
      totalPasses: 23,
      passesCompleted: 20,
      passAccuracy: 87,
      keyPasses: 2,
      longPasses: 3,
      // Dribbling & Hücum
      dribbleAttempts: 8,
      dribbleSuccess: 6,
      dispossessed: 2,
      // Savunma
      tackles: 0,
      interceptions: 0,
      blocks: 0,
      clearances: 0,
      // İkili Mücadele & Fizik
      duelsTotal: 12,
      duelsWon: 8,
      aerialDuels: 5,
      aerialWon: 3,
      // Faul & Disiplin
      foulsCommitted: 1,
      foulsDrawn: 3,
      yellowCard: 0,
      // Kaleci
      saves: 0,
      goalsConceded: 0,
      penaltySaved: 0,
    },
    {
      name: "Wilfried Zaha",
      number: 14,
      position: "LW",
      rating: 8.3,
      minutesPlayed: 90,
      isStarting: true,
      goals: 1,
      assists: 2,
      shots: 4,
      shotsOnTarget: 2,
      shotsInsideBox: 3,
      shotsOutsideBox: 1,
      totalPasses: 45,
      passesCompleted: 38,
      passAccuracy: 84,
      keyPasses: 4,
      longPasses: 2,
      dribbleAttempts: 12,
      dribbleSuccess: 9,
      dispossessed: 3,
      tackles: 2,
      interceptions: 1,
      blocks: 0,
      clearances: 0,
      duelsTotal: 15,
      duelsWon: 11,
      aerialDuels: 3,
      aerialWon: 2,
      foulsCommitted: 2,
      foulsDrawn: 5,
      yellowCard: 1,
      saves: 0,
      goalsConceded: 0,
      penaltySaved: 0,
    },
  ],
  away: [
    {
      name: "Edin Dzeko",
      number: 9,
      position: "ST",
      rating: 7.8,
      minutesPlayed: 90,
      isStarting: true,
      goals: 1,
      assists: 0,
      shots: 6,
      shotsOnTarget: 2,
      shotsInsideBox: 4,
      shotsOutsideBox: 2,
      totalPasses: 18,
      passesCompleted: 14,
      passAccuracy: 78,
      keyPasses: 1,
      longPasses: 2,
      dribbleAttempts: 4,
      dribbleSuccess: 2,
      dispossessed: 3,
      tackles: 1,
      interceptions: 0,
      blocks: 0,
      clearances: 1,
      duelsTotal: 14,
      duelsWon: 8,
      aerialDuels: 8,
      aerialWon: 5,
      foulsCommitted: 3,
      foulsDrawn: 2,
      yellowCard: 1,
      saves: 0,
      goalsConceded: 0,
      penaltySaved: 0,
    },
  ],
};

export function MatchStats({ matchData }: MatchStatsProps) {
  const [activeTab, setActiveTab] = useState<"match" | "players">("match");

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tabs */}
      <div className="flex-shrink-0 flex items-center bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => setActiveTab("match")}
          className={`flex-1 h-[50px] font-bold text-[10px] transition-all relative ${
            activeTab === "match"
              ? "text-[#059669]"
              : "text-muted-foreground"
          }`}
        >
          📊 Maç İstatistikleri
          {activeTab === "match" && (
            <motion.div
              layoutId="statsTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#059669]"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("players")}
          className={`flex-1 h-[50px] font-bold text-[10px] transition-all relative ${
            activeTab === "players"
              ? "text-[#059669]"
              : "text-muted-foreground"
          }`}
        >
          ⭐ Oyuncular
          {activeTab === "players" && (
            <motion.div
              layoutId="statsTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#059669]"
            />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "match" ? (
          // MAÇ İSTATİSTİKLERİ
          <div className="px-4 py-6 space-y-6">
            {detailedStats.map((stat, index) => {
              const total = stat.home + stat.away;
              const homePercent = (stat.home / total) * 100;
              const awayPercent = (stat.away / total) * 100;

              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="space-y-2"
                >
                  {/* 3 Column Layout */}
                  <div className="grid grid-cols-3 items-center gap-4">
                    {/* Left - Home Score */}
                    <div className="text-left">
                      <span className={`text-base font-bold ${stat.home > stat.away ? "text-[#059669]" : "text-foreground"}`}>
                        {stat.home}
                      </span>
                    </div>

                    {/* Center - Label */}
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        {stat.label}
                        {stat.home > stat.away && (
                          <TrendingUp className="w-3 h-3 text-[#059669]" />
                        )}
                      </span>
                    </div>

                    {/* Right - Away Score */}
                    <div className="text-right">
                      <span className={`text-base font-bold ${stat.away > stat.home ? "text-[#F59E0B]" : "text-foreground"}`}>
                        {stat.away}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${homePercent}%` }}
                      transition={{ delay: index * 0.03 + 0.2, duration: 0.6 }}
                      className="bg-[#059669] h-full"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${awayPercent}%` }}
                      transition={{ delay: index * 0.03 + 0.2, duration: 0.6 }}
                      className="bg-[#F59E0B] h-full"
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* Momentum Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-card to-muted/30 border-2 border-dashed border-border rounded-2xl p-8 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-3xl">🔥</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Isı haritası ve pozisyon analizi yakında...
              </p>
            </motion.div>
          </div>
        ) : (
          // OYUNCU PERFORMANSLARI - KOMPAKT & SEMPATİK
          <div className="px-4 py-6 space-y-3 pb-20">
            {/* Home Team Players */}
            <div className="space-y-3">
              {topPlayers.home.map((player, index) => (
                <motion.div
                  key={`home-${player.number}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md hover:border-[#059669]/30 transition-all"
                >
                  {/* Player Header - Compact */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-[#059669] flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-white">
                          {player.number}
                        </span>
                        {/* Badge for star performance */}
                        {player.rating >= 8.5 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#F59E0B] rounded-full flex items-center justify-center">
                            <span className="text-[8px]">⭐</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm">{player.name}</h3>
                          {player.goals >= 2 && <span className="text-xs">🔥</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {player.position} • {player.minutesPlayed}'
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="relative inline-flex items-center justify-center">
                        {/* Rating circle background */}
                        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-muted/20"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="#059669"
                            strokeWidth="2"
                            strokeDasharray={`${(player.rating / 10) * 94.2} 94.2`}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#059669]">{player.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats - Enhanced Compact Grid */}
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    <div className="bg-gradient-to-br from-[#059669]/20 to-[#059669]/5 rounded-lg p-2 text-center border border-[#059669]/10 hover:border-[#059669]/30 transition-colors">
                      <div className="text-base font-bold text-[#059669]">{player.goals}</div>
                      <div className="text-[7px] text-muted-foreground uppercase tracking-wide">Gol</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#059669]/20 to-[#059669]/5 rounded-lg p-2 text-center border border-[#059669]/10 hover:border-[#059669]/30 transition-colors">
                      <div className="text-base font-bold text-[#059669]">{player.assists}</div>
                      <div className="text-[7px] text-muted-foreground uppercase tracking-wide">Asist</div>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/50">
                      <div className="text-base font-bold text-foreground">{player.shots}</div>
                      <div className="text-[7px] text-muted-foreground uppercase tracking-wide">Şut</div>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/50">
                      <div className="text-base font-bold text-foreground">{player.passAccuracy}%</div>
                      <div className="text-[7px] text-muted-foreground uppercase tracking-wide">Pas</div>
                    </div>
                  </div>

                  {/* Detailed Stats - Compact Sections */}
                  <div className="space-y-1.5">
                    {/* Gol & Şut */}
                    {(player.goals > 0 || player.assists > 0 || player.shots > 0) && (
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm">⚽</span>
                          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">
                            Gol & Şut
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.goals}</span>
                            <span className="text-muted-foreground">Gol</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.assists}</span>
                            <span className="text-muted-foreground">Asist</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.shotsOnTarget}</span>
                            <span className="text-muted-foreground">İsabetli Şut</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.shotsInsideBox}</span>
                            <span className="text-muted-foreground">Kale Önü</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pas & Oyun Kurma */}
                    {player.totalPasses > 0 && (
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm">🧠</span>
                          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">
                            Pas & Oyun Kurma
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.passAccuracy}%</span>
                            <span className="text-muted-foreground">İsabet</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.keyPasses}</span>
                            <span className="text-muted-foreground">Kilit Pas</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.longPasses}</span>
                            <span className="text-muted-foreground">Uzun Pas</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.totalPasses}</span>
                            <span className="text-muted-foreground">Toplam</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dribbling & Hücum */}
                    {player.dribbleAttempts > 0 && (
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm">🏃</span>
                          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">
                            Dribling & Hücum
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">
                              {player.dribbleSuccess}/{player.dribbleAttempts}
                            </span>
                            <span className="text-muted-foreground">Dribling</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.dispossessed}</span>
                            <span className="text-muted-foreground">Top Kaybı</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* İkili Mücadele - Sadece varsa göster */}
                    {player.duelsTotal > 0 && (
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm">⚔️</span>
                          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">
                            Mücadele
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">
                              {player.duelsWon}/{player.duelsTotal}
                            </span>
                            <span className="text-muted-foreground">İkili</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">
                              {player.aerialWon}/{player.aerialDuels}
                            </span>
                            <span className="text-muted-foreground">Hava</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Away Team Players */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Deplasman</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              
              {topPlayers.away.map((player, index) => (
                <motion.div
                  key={`away-${player.number}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md hover:border-[#F59E0B]/30 transition-all"
                >
                  {/* Player Header - Enhanced */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-[#F59E0B] flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-white">
                          {player.number}
                        </span>
                        {player.rating >= 8.5 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#059669] rounded-full flex items-center justify-center">
                            <span className="text-[8px]">⭐</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-sm">{player.name}</h3>
                          {player.goals >= 2 && <span className="text-xs">🔥</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {player.position} • {player.minutesPlayed}'
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="relative inline-flex items-center justify-center">
                        {/* Rating circle background */}
                        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-muted/20"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="2"
                            strokeDasharray={`${(player.rating / 10) * 94.2} 94.2`}
                            strokeLinecap="round"
                            className="transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#F59E0B]">{player.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats - Enhanced */}
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    <div className="bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/5 rounded-lg p-2 text-center border border-[#F59E0B]/10 hover:border-[#F59E0B]/30 transition-colors">
                      <div className="text-base font-bold text-[#F59E0B]">{player.goals}</div>
                      <div className="text-[7px] text-muted-foreground uppercase tracking-wide">Gol</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#F59E0B]/20 to-[#F59E0B]/5 rounded-lg p-2 text-center border border-[#F59E0B]/10 hover:border-[#F59E0B]/30 transition-colors">
                      <div className="text-base font-bold text-[#F59E0B]">{player.assists}</div>
                      <div className="text-[7px] text-muted-foreground uppercase tracking-wide">Asist</div>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/50">
                      <div className="text-base font-bold text-foreground">{player.shots}</div>
                      <div className="text-[7px] text-muted-foreground uppercase tracking-wide">Şut</div>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/50">
                      <div className="text-base font-bold text-foreground">{player.passAccuracy}%</div>
                      <div className="text-[7px] text-muted-foreground uppercase tracking-wide">Pas</div>
                    </div>
                  </div>

                  {/* Detailed Stats - Same as home */}
                  <div className="space-y-1.5">
                    {/* Gol & Şut */}
                    {(player.goals > 0 || player.assists > 0 || player.shots > 0) && (
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm">⚽</span>
                          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">
                            Gol & Şut
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.goals}</span>
                            <span className="text-muted-foreground">Gol</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.assists}</span>
                            <span className="text-muted-foreground">Asist</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.shotsOnTarget}</span>
                            <span className="text-muted-foreground">İsabetli Şut</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.shotsInsideBox}</span>
                            <span className="text-muted-foreground">Kale Önü</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pas & Oyun Kurma */}
                    {player.totalPasses > 0 && (
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm">🧠</span>
                          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">
                            Pas & Oyun Kurma
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.passAccuracy}%</span>
                            <span className="text-muted-foreground">İsabet</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.keyPasses}</span>
                            <span className="text-muted-foreground">Kilit Pas</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.longPasses}</span>
                            <span className="text-muted-foreground">Uzun Pas</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.totalPasses}</span>
                            <span className="text-muted-foreground">Toplam</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dribbling & Hücum */}
                    {player.dribbleAttempts > 0 && (
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm">🏃</span>
                          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">
                            Dribling & Hücum
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">
                              {player.dribbleSuccess}/{player.dribbleAttempts}
                            </span>
                            <span className="text-muted-foreground">Dribling</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">{player.dispossessed}</span>
                            <span className="text-muted-foreground">Top Kaybı</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* İkili Mücadele - Sadece varsa göster */}
                    {player.duelsTotal > 0 && (
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-sm">⚔️</span>
                          <span className="text-[9px] font-bold text-foreground uppercase tracking-wider">
                            Mücadele
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">
                              {player.duelsWon}/{player.duelsTotal}
                            </span>
                            <span className="text-muted-foreground">İkili</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-foreground">
                              {player.aerialWon}/{player.aerialDuels}
                            </span>
                            <span className="text-muted-foreground">Hava</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}