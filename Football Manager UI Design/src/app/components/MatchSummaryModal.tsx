import { motion, AnimatePresence } from "motion/react";
import { X, Trophy, Clock, User, Target, AlertCircle, Calendar, MapPin } from "lucide-react";

interface MatchSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any;
}

// Mock maç özet verisi
const getMatchSummary = (matchId: string) => {
  const summaries: Record<string, any> = {
    "1": {
      goals: [
        { minute: 23, team: "home", player: "Mauro Icardi", assist: "Dries Mertens", type: "goal" },
        { minute: 34, team: "away", player: "Edin Džeko", assist: null, type: "goal" },
        { minute: 67, team: "home", player: "Wilfried Zaha", assist: "Icardi", type: "goal" },
      ],
      cards: [
        { minute: 18, team: "away", player: "Bright Osayi-Samuel", type: "yellow" },
        { minute: 45, team: "home", player: "Lucas Torreira", type: "yellow" },
        { minute: 78, team: "away", player: "Ferdi Kadıoğlu", type: "yellow" },
      ],
      substitutions: [
        { minute: 56, team: "home", playerOut: "Kerem Aktürkoğlu", playerIn: "Barış Alper Yılmaz" },
        { minute: 62, team: "away", playerOut: "İrfan Can Kahveci", playerIn: "Michy Batshuayi" },
        { minute: 74, team: "home", playerOut: "Dries Mertens", playerIn: "Kerem Demirbay" },
      ],
      stats: {
        possession: { home: 58, away: 42 },
        shots: { home: 16, away: 11 },
        shotsOnTarget: { home: 7, away: 4 },
        corners: { home: 7, away: 5 },
        fouls: { home: 12, away: 14 },
      }
    },
    "2": {
      goals: [
        { minute: 12, team: "home", player: "Vincent Aboubakar", assist: "Rashica", type: "goal" },
        { minute: 56, team: "away", player: "Trezeguet", assist: "Mahmoud Trezeguet", type: "goal" },
      ],
      cards: [
        { minute: 34, team: "away", player: "Eren Elmalı", type: "yellow" },
        { minute: 67, team: "home", player: "Gedson Fernandes", type: "yellow" },
      ],
      substitutions: [
        { minute: 60, team: "home", playerOut: "Necip Uysal", playerIn: "Salih Uçan" },
        { minute: 68, team: "away", playerOut: "Vitor Hugo", playerIn: "Enis Bardhi" },
      ],
      stats: {
        possession: { home: 52, away: 48 },
        shots: { home: 13, away: 10 },
        shotsOnTarget: { home: 5, away: 4 },
        corners: { home: 6, away: 4 },
        fouls: { home: 11, away: 13 },
      }
    }
  };

  return summaries[matchId] || summaries["1"];
};

export function MatchSummaryModal({ isOpen, onClose, match }: MatchSummaryModalProps) {
  if (!match) return null;

  const summary = getMatchSummary(match.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-lg h-[calc(100vh-25px)] flex flex-col overflow-hidden shadow-2xl pointer-events-auto relative"
            >
              {/* Close Button - Absolute Positioned */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>

              {/* Header */}
              <div className="flex-shrink-0 bg-gradient-to-br from-[#059669] to-[#047857] px-5 pt-2 pb-2">
                <div className="mb-1">
                  <h2 className="text-white font-bold text-sm">Maç Özeti</h2>
                </div>

                {/* Match Header */}
                <div className="flex items-center justify-between text-white mb-1">
                  <div className="text-center flex-1">
                    <p className="text-[11px] opacity-90 mb-0.5">{match.homeTeam.name}</p>
                    <p className="text-2xl font-bold">{match.homeTeam.score}</p>
                  </div>
                  <div className="px-3">
                    <p className="text-lg font-bold opacity-80">-</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[11px] opacity-90 mb-0.5">{match.awayTeam.name}</p>
                    <p className="text-2xl font-bold">{match.awayTeam.score}</p>
                  </div>
                </div>

                {/* Match Info */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-white/80">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{match.date}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{match.time}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">{match.stadium}</span>
                  </div>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                {/* Goller */}
                {summary.goals && summary.goals.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-[#059669]" />
                      <h3 className="font-bold text-foreground text-sm">Goller</h3>
                    </div>
                    {summary.goals.map((goal: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg ${
                          goal.team === "home"
                            ? "bg-[#059669]/10 border-l-2 border-[#059669]"
                            : "bg-[#F59E0B]/10 border-l-2 border-[#F59E0B]"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                          goal.team === "home" ? "bg-[#059669]" : "bg-[#F59E0B]"
                        }`}>
                          {goal.minute}'
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-xs">⚽ {goal.player}</p>
                          {goal.assist && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Asist: {goal.assist}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Kartlar */}
                {summary.cards && summary.cards.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
                      <h3 className="font-bold text-foreground text-sm">Kartlar</h3>
                    </div>
                    {summary.cards.map((card: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40"
                      >
                        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0">
                          {card.type === "yellow" ? "🟨" : "🟥"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-xs">{card.player}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {card.team === "home" ? match.homeTeam.name : match.awayTeam.name}
                          </p>
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground">
                          {card.minute}'
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Oyuncu Değişiklikleri */}
                {summary.substitutions && summary.substitutions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-[#059669]" />
                      <h3 className="font-bold text-foreground text-sm">Oyuncu Değişiklikleri</h3>
                    </div>
                    {summary.substitutions.map((sub: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#059669] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                          {sub.minute}'
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs mb-0.5">
                            <span className="text-red-500">↓</span>
                            <span className="text-foreground truncate">{sub.playerOut}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-[#059669]">↑</span>
                            <span className="text-foreground font-medium truncate">{sub.playerIn}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Maç İstatistikleri */}
                {summary.stats && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-[#059669]" />
                      <h3 className="font-bold text-foreground text-sm">Maç İstatistikleri</h3>
                    </div>

                    {/* Possession */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{match.homeTeam.name}</span>
                        <span>Top Kontrolü</span>
                        <span>{match.awayTeam.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground w-8">{summary.stats.possession.home}%</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
                          <div
                            className="bg-[#059669]"
                            style={{ width: `${summary.stats.possession.home}%` }}
                          />
                          <div
                            className="bg-[#F59E0B]"
                            style={{ width: `${summary.stats.possession.away}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground w-8 text-right">{summary.stats.possession.away}%</span>
                      </div>
                    </div>

                    {/* Other Stats */}
                    <div className="space-y-1.5">
                      {[
                        { label: "Şutlar", home: summary.stats.shots.home, away: summary.stats.shots.away },
                        { label: "İsabetli Şutlar", home: summary.stats.shotsOnTarget.home, away: summary.stats.shotsOnTarget.away },
                        { label: "Kornerler", home: summary.stats.corners.home, away: summary.stats.corners.away },
                        { label: "Faul", home: summary.stats.fouls.home, away: summary.stats.fouls.away },
                      ].map((stat, index) => (
                        <div key={index} className="flex items-center justify-between py-1.5 px-2 bg-muted/30 rounded-lg">
                          <span className="text-xs font-bold text-foreground w-10 text-center">{stat.home}</span>
                          <span className="text-[10px] text-muted-foreground flex-1 text-center">{stat.label}</span>
                          <span className="text-xs font-bold text-foreground w-10 text-center">{stat.away}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}