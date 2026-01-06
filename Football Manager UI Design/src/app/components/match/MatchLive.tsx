import { motion } from "motion/react";

interface MatchLiveProps {
  matchData: any;
}

// Mock match metadata
const matchMetadata = {
  status: "2H", // 1H, HT, 2H, ET, P, FT
  minute: 67,
  addedTime: null,
  halfTimeScore: { home: 1, away: 0 },
  currentScore: { home: 2, away: 1 },
};

// Mock maç akışı olayları
const matchEvents = [
  { minute: 67, type: "goal", team: "home", player: "Icardi", assist: "Zaha", score: "2-1" },
  { minute: 65, type: "var-check", description: "VAR İncelemesi", result: "Gol onayla" },
  { minute: 63, type: "substitution", team: "away", playerOut: "Valencia", playerIn: "Dzeko" },
  { minute: 58, type: "yellow", team: "home", player: "Nelsson" },
  { minute: 55, type: "penalty-missed", team: "away", player: "Mertens" },
  { minute: 52, type: "goal", team: "away", player: "Rossi", assist: "Mertens", score: "1-1" },
  { minute: 48, type: "injury", team: "home", player: "Zaha", description: "Sakatlık tedavisi" },
  { minute: 46, type: "kickoff", description: "İkinci yarı başladı" },
  { minute: 45, type: "half-time", description: "İlk yarı sona erdi" },
  { minute: 40, type: "var-check", description: "VAR İncelemesi", result: "Penaltı reddedildi" },
  { minute: 34, type: "yellow", team: "away", player: "Toreira" },
  { minute: 28, type: "goal", team: "home", player: "Icardi", assist: null, score: "1-0" },
  { minute: 22, type: "red", team: "away", player: "Torreira", reason: "Direkt kırmızı" },
  { minute: 19, type: "penalty-saved", team: "home", player: "Muslera", penaltyTaker: "Rossi" },
  { minute: 15, type: "own-goal", team: "away", player: "Nelsson", score: "1-0" },
  { minute: 12, type: "substitution", team: "home", playerOut: "Mertens", playerIn: "Aktürkoğlu" },
  { minute: 8, type: "second-yellow", team: "away", player: "Fernandes" },
  { minute: 3, type: "goal-cancelled", team: "home", player: "Icardi", reason: "Ofsayt" },
  { minute: 1, type: "kickoff", description: "Maç başladı" },
];

export function MatchLive({ matchData }: MatchLiveProps) {
  return (
    <div className="flex flex-col h-full bg-background pb-20">
      {/* Compact Score Banner - Half Height of Match Card */}
      <div className="flex-shrink-0 bg-card border-b border-border">
        <div className="px-4 py-2.5 flex items-center justify-between gap-2.5">
          {/* Home Score - Left */}
          <div className="flex-1 flex justify-end">
            <span className="text-2xl font-black text-foreground">{matchMetadata.currentScore.home}</span>
          </div>

          {/* Center: CANLI + Minute + HT */}
          <div className="flex flex-col items-center gap-0.5 px-3">
            {/* CANLI Badge */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="px-2 py-0.5 bg-[#059669] rounded-full"
            >
              <span className="text-[9px] font-black text-white tracking-wider">CANLI</span>
            </motion.div>

            {/* Minute */}
            <div className="text-sm font-bold text-[#059669]">
              {matchMetadata.minute}'
            </div>

            {/* HT Score */}
            <div className="text-[10px] text-muted-foreground">
              HT: {matchMetadata.halfTimeScore.home}-{matchMetadata.halfTimeScore.away}
            </div>
          </div>

          {/* Away Score - Right */}
          <div className="flex-1 flex justify-start">
            <span className="text-2xl font-black text-foreground">{matchMetadata.currentScore.away}</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Match Events Timeline */}
        <div className="relative">
          {/* Center Timeline Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />

          {/* Events */}
          <div className="space-y-6">
            {matchEvents.map((event, index) => {
              // Determine if this is a centered event (no team specific)
              const isCentered = !event.team || event.type === "kickoff" || event.type === "half-time" || event.type === "var-check";
              const isHome = event.team === "home";

              if (isCentered) {
                return (
                  <div key={index} className="flex items-center justify-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card border border-border rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-sm"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted">
                        {event.type === "kickoff" && <span className="text-xl">⚽</span>}
                        {event.type === "half-time" && <span className="text-xl">⏸️</span>}
                        {event.type === "var-check" && <span className="text-xl">📺</span>}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#059669]">{event.minute}'</div>
                        <div className="text-sm text-foreground font-medium">{event.description}</div>
                        {event.result && (
                          <div className="text-xs text-muted-foreground mt-0.5">{event.result}</div>
                        )}
                      </div>
                    </motion.div>
                  </div>
                );
              }

              return (
                <div key={index} className="relative">
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#059669] border-2 border-background z-10" />

                  {/* Event Card - Left or Right */}
                  <div className={`flex ${isHome ? "justify-start" : "justify-end"}`}>
                    <motion.div
                      initial={{ opacity: 0, x: isHome ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`bg-card border border-border rounded-lg px-3 py-2.5 w-[47%] shadow-sm ${isHome ? "text-left" : "text-right"}`}
                    >
                      {/* Header: Minute + Icon */}
                      <div className={`flex items-center gap-2 mb-1.5 ${isHome ? "" : "flex-row-reverse"}`}>
                        <div className="text-xs font-bold text-[#059669]">{event.minute}'</div>
                        <div className="text-base">
                          {event.type === "goal" && "⚽"}
                          {event.type === "own-goal" && "⚽"}
                          {event.type === "goal-cancelled" && "❌"}
                          {event.type === "penalty-missed" && "🚫"}
                          {event.type === "penalty-saved" && "🧤"}
                          {event.type === "yellow" && "🟨"}
                          {event.type === "red" && "🟥"}
                          {event.type === "second-yellow" && "🟨🟥"}
                          {event.type === "substitution" && "🔁"}
                          {event.type === "injury" && "🤕"}
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-1">
                        {/* Goal Event */}
                        {event.type === "goal" && (
                          <>
                            <div className="text-xs font-bold text-foreground">⚽ GOL!</div>
                            <div className="text-xs text-foreground">{event.player}</div>
                            {event.assist && (
                              <div className="text-[10px] text-muted-foreground">Asist: {event.assist}</div>
                            )}
                            <div className="text-[10px] font-bold text-[#059669]">{event.score}</div>
                          </>
                        )}

                        {/* Own Goal */}
                        {event.type === "own-goal" && (
                          <>
                            <div className="text-xs font-bold text-red-500">KENDI KALESİNE GOL</div>
                            <div className="text-xs text-foreground">{event.player}</div>
                            <div className="text-[10px] font-bold text-[#059669]">{event.score}</div>
                          </>
                        )}

                        {/* Goal Cancelled */}
                        {event.type === "goal-cancelled" && (
                          <>
                            <div className="text-xs font-bold text-red-500">GOL İPTAL</div>
                            <div className="text-xs text-foreground line-through">{event.player}</div>
                            <div className="text-[10px] text-red-500">{event.reason}</div>
                          </>
                        )}

                        {/* Penalty Events */}
                        {event.type === "penalty-missed" && (
                          <>
                            <div className="text-xs font-bold text-red-500">PENALTI KAÇTI</div>
                            <div className="text-xs text-foreground">{event.player}</div>
                          </>
                        )}

                        {event.type === "penalty-saved" && (
                          <>
                            <div className="text-xs font-bold text-[#059669]">PENALTI KURTARILDI</div>
                            <div className="text-xs text-foreground">{event.player}</div>
                            <div className="text-[10px] text-muted-foreground">Atan: {event.penaltyTaker}</div>
                          </>
                        )}

                        {/* Yellow Card */}
                        {event.type === "yellow" && (
                          <>
                            <div className="text-xs font-bold text-yellow-600">SARI KART</div>
                            <div className="text-xs text-foreground">{event.player}</div>
                          </>
                        )}

                        {/* Red Cards */}
                        {event.type === "red" && (
                          <>
                            <div className="text-xs font-bold text-red-500">KIRMIZI KART</div>
                            <div className="text-xs text-foreground">{event.player}</div>
                            {event.reason && (
                              <div className="text-[10px] text-red-500">{event.reason}</div>
                            )}
                          </>
                        )}

                        {event.type === "second-yellow" && (
                          <>
                            <div className="text-xs font-bold text-red-500">İKİNCİ SARI KART</div>
                            <div className="text-xs text-foreground">{event.player}</div>
                          </>
                        )}

                        {/* Substitution */}
                        {event.type === "substitution" && (
                          <>
                            <div className="text-xs font-bold text-foreground">OYUNCU DEĞİŞİKLİĞİ</div>
                            <div className="text-[10px] text-red-500">↓ {event.playerOut}</div>
                            <div className="text-[10px] text-green-500">↑ {event.playerIn}</div>
                          </>
                        )}

                        {/* Injury */}
                        {event.type === "injury" && (
                          <>
                            <div className="text-xs font-bold text-orange-500">SAKATLIK</div>
                            <div className="text-xs text-foreground">{event.player}</div>
                            <div className="text-[10px] text-muted-foreground">{event.description}</div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}