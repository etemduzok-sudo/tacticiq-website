import { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Lock, ChevronRight, Calendar, MapPin, Star, Clock, Award, Flame, Target, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { MatchSummaryModal } from "./MatchSummaryModal";

interface MatchListProps {
  onMatchSelect: (matchId: string) => void;
  onProfileClick: () => void;
}

const teams = [
  { id: "all", name: "Tümü", logo: "⚽", color: "linear-gradient(135deg, #059669 0%, #059669 100%)" },
  { id: "gs", name: "Galatasaray", logo: "🦁", color: "linear-gradient(135deg, #FDB913 0%, #E30613 100%)" },
  { id: "fb", name: "Fenerbahçe", logo: "🐤", color: "linear-gradient(135deg, #FCCF1E 0%, #001A70 100%)" },
  { id: "bjk", name: "Beşiktaş", logo: "🦅", color: "linear-gradient(135deg, #000000 0%, #FFFFFF 100%)" },
  { id: "ts", name: "Trabzonspor", logo: "⚡", color: "linear-gradient(135deg, #6C2C91 0%, #76B0E0 100%)" },
];

const badges = [
  { id: "streak", icon: Flame, label: "5 Seri", color: "#EF4444" },
  { id: "master", icon: Trophy, label: "Usta", color: "#F59E0B" },
  { id: "target", icon: Target, label: "%85", color: "#059669" },
  { id: "lightning", icon: Zap, label: "Hızlı", color: "#3B82F6" },
];

const matches = [
  {
    id: "2",
    status: "finished",
    homeTeam: { name: "Beşiktaş", logo: "🦅", color: "linear-gradient(135deg, #000000 0%, #FFFFFF 100%)", score: 1, manager: "Şenol Güneş" },
    awayTeam: { name: "Trabzonspor", logo: "⚡", color: "linear-gradient(135deg, #6C2C91 0%, #76B0E0 100%)", score: 1, manager: "Abdullah Avcı" },
    league: "Süper Lig",
    stadium: "Vodafone Park",
    date: "26 Ara 2025",
    time: "20:00",
  },
  {
    id: "1",
    status: "live",
    homeTeam: { name: "Galatasaray", logo: "🦁", color: "linear-gradient(135deg, #FDB913 0%, #E30613 100%)", score: 2, manager: "Okan Buruk" },
    awayTeam: { name: "Fenerbahçe", logo: "🐤", color: "linear-gradient(135deg, #FCCF1E 0%, #001A70 100%)", score: 1, manager: "İsmail Kartal" },
    league: "Süper Lig",
    stadium: "Ali Sami Yen",
    date: "28 Ara 2025",
    time: "19:00",
    minute: 67,
    period: "2H",
    halftimeScore: "1-0",
    referees: {
      main: "A.Dursun",
      assistant1: "M.Yılmaz",
      assistant2: "E.Kaya",
      fourth: "H.Özkan",
      var: "C.Arslan"
    }
  },
  {
    id: "3",
    status: "upcoming",
    homeTeam: { name: "Galatasaray", logo: "🦁", color: "linear-gradient(135deg, #FDB913 0%, #E30613 100%)", score: null, manager: "Okan Buruk" },
    awayTeam: { name: "Real Madrid", logo: "👑", color: "linear-gradient(135deg, #FFFFFF 0%, #FFD700 100%)", score: null, manager: "Carlo Ancelotti" },
    league: "Şampiyonlar Ligi",
    stadium: "Ali Sami Yen",
    date: "8 Oca 2026",
    time: "22:45",
    countdown: "8 gün",
  },
  {
    id: "4",
    status: "locked",
    homeTeam: { name: "Barcelona", logo: "🔵", color: "linear-gradient(135deg, #A50044 0%, #004D98 100%)", score: null, manager: "Xavi Hernandez" },
    awayTeam: { name: "Bayern Munich", logo: "🔴", color: "linear-gradient(135deg, #DC052D 0%, #0066B2 100%)", score: null, manager: "Thomas Tuchel" },
    league: "Şampiyonlar Ligi",
    stadium: "Camp Nou",
    date: "15 Oca 2026",
    time: "22:45",
    unlockText: "1 hafta kala aktif",
  },
];

export function MatchList({ onMatchSelect, onProfileClick }: MatchListProps) {
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedMatchForSummary, setSelectedMatchForSummary] = useState<any>(null);

  const handleMatchClick = (match: any) => {
    if (match.status === "locked") return;
    
    // Biten veya canlı maçlar için özet göster
    if (match.status === "finished" || match.status === "live") {
      setSelectedMatchForSummary(match);
      setSummaryModalOpen(true);
    } else {
      // Yaklaşan maçlar için normal akış
      onMatchSelect(match.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Summary Modal */}
      <MatchSummaryModal 
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        match={selectedMatchForSummary}
      />

      {/* Sticky Profile Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-lg"
      >
        <div className="px-4 py-4">
          <button
            onClick={onProfileClick}
            className="w-full rounded-xl bg-gradient-to-r from-[#059669]/10 to-transparent hover:from-[#059669]/20 transition-all group"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 border-2 border-[#059669]">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                  <AvatarFallback>FM</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h3 className="text-foreground flex items-center gap-2">
                    Futbol Aşığı
                    <span className="px-2 py-0.5 bg-[#F59E0B] text-[#ffffff] text-xs rounded-full">PRO</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">Level 12 • 2,845 Puan</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Türkiye Sıralaması</p>
                <p className="text-[#059669]">#156 / 2,365</p>
              </div>
            </div>

            {/* Badges & Tags */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 justify-center">
                {badges.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-card/50 backdrop-blur-sm"
                      style={{ 
                        borderColor: `${badge.color}30`,
                        backgroundColor: `${badge.color}10`
                      }}
                    >
                      <Icon className="w-3 h-3" style={{ color: badge.color }} />
                      <span className="text-xs font-medium whitespace-nowrap" style={{ color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </button>
        </div>

        {/* Team Filter */}
        <ScrollArea className="w-full">
          <div className="flex gap-3 px-4 pb-4">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                  selectedTeam === team.id
                    ? "bg-[#059669] border-[#059669] text-white"
                    : "bg-card border-border text-foreground hover:border-[#059669]/50"
                }`}
              >
                <div 
                  className="w-2.5 h-2.5 rounded-full border border-border/20" 
                  style={{ background: team.color }}
                />
                <span className="text-sm">{team.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </motion.div>

      {/* Match Cards */}
      <div className="px-4 py-6 space-y-4">
        {matches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleMatchClick(match)}
            className={`bg-card border border-border rounded-2xl overflow-hidden shadow-lg transition-all ${
              match.status !== "locked" ? "cursor-pointer hover:shadow-xl hover:border-[#059669]/30" : ""
            }`}
          >
            {/* League Badge */}
            <div className="px-3 py-1.5 bg-gradient-to-r from-[#059669]/10 to-transparent border-b border-border">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-[#059669]" />
                <span className="text-xs text-muted-foreground">{match.league}</span>
              </div>
            </div>

            {/* Match Info */}
            <div className="p-4 relative">
              {/* Home Team Color Bar - Left Side */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                style={{ background: match.homeTeam.color }}
              />
              
              {/* Away Team Color Bar - Right Side */}
              <div 
                className="absolute right-0 top-0 bottom-0 w-1.5 rounded-r-xl"
                style={{ background: match.awayTeam.color }}
              />

              {match.status === "live" ? (
                /* LIVE MATCH - NO LOGOS */
                <div className="flex flex-col gap-3">
                  {/* Top Row: CANLI Badge */}
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="px-2.5 py-1 bg-[#059669] rounded-full"
                    >
                      <span className="text-[10px] font-black text-white tracking-wider">CANLI</span>
                    </motion.div>
                  </div>

                  {/* Teams + Scores */}
                  <div className="flex items-start justify-between px-2">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground leading-tight">{match.homeTeam.name}</p>
                        <p className="text-xs text-muted-foreground">{match.homeTeam.manager}</p>
                      </div>
                      <span className="text-3xl font-black text-foreground">{match.homeTeam.score}</span>
                    </div>

                    {/* Center: Minute + Separator + HT */}
                    <div className="flex flex-col items-center justify-center px-3 pt-2">
                      <div className="text-sm font-bold text-[#059669] mb-2">
                        {match.minute}'
                      </div>
                      <span className="text-xl font-black text-muted-foreground mb-2">-</span>
                      {match.halftimeScore && (
                        <div className="text-xs text-muted-foreground">
                          HT: {match.halftimeScore}
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground leading-tight">{match.awayTeam.name}</p>
                        <p className="text-xs text-muted-foreground">{match.awayTeam.manager}</p>
                      </div>
                      <span className="text-3xl font-black text-foreground">{match.awayTeam.score}</span>
                    </div>
                  </div>

                  {/* Bottom: Date, Time, Stadium */}
                  <div className="flex items-center justify-center gap-3 pt-2 border-t border-border/50 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{match.date}</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{match.time}</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{match.stadium}</span>
                    </div>
                  </div>

                  {/* Referee Info */}
                  {match.referees && (
                    <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                      <span>Hakem:</span>
                      <span className="font-medium text-foreground">{match.referees.main}</span>
                      <span className="text-muted-foreground/60">•</span>
                      <span>VAR: {match.referees.var}</span>
                    </div>
                  )}
                </div>
              ) : match.status === "finished" ? (
                /* FINISHED MATCH - SCORES UNDER TEAMS */
                <div className="flex flex-col gap-3">
                  {/* Status Badge */}
                  <div className="flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">Maç Sonu</span>
                  </div>

                  {/* Teams + Scores */}
                  <div className="flex items-start justify-between px-2">
                    {/* Home Team */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground leading-tight">{match.homeTeam.name}</p>
                        <p className="text-xs text-muted-foreground">{match.homeTeam.manager}</p>
                      </div>
                      <span className="text-3xl font-black text-foreground">{match.homeTeam.score}</span>
                    </div>

                    {/* Center: Separator */}
                    <div className="flex items-center justify-center pt-6">
                      <span className="text-xl font-black text-muted-foreground">-</span>
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-center">
                        <p className="text-sm font-bold text-foreground leading-tight">{match.awayTeam.name}</p>
                        <p className="text-xs text-muted-foreground">{match.awayTeam.manager}</p>
                      </div>
                      <span className="text-3xl font-black text-foreground">{match.awayTeam.score}</span>
                    </div>
                  </div>

                  {/* Match Info: Date, Time, Stadium */}
                  <div className="flex items-center justify-center gap-3 pt-2 border-t border-border/50 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{match.date}</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{match.time}</span>
                    </div>
                    <div className="w-px h-3 bg-border" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{match.stadium}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* UPCOMING/LOCKED MATCH - OLD LAYOUT */
                <div className="flex items-center justify-between gap-2 px-2">
                  {/* Home Team */}
                  <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                    <div className="text-right min-w-0 flex-shrink">
                      <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[90px]">{match.homeTeam.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[90px]">{match.homeTeam.manager}</p>
                    </div>
                  </div>

                  {/* Match Details Center Column */}
                  <div className="flex flex-col items-center justify-center gap-1 px-2 flex-shrink-0">
                    <div className="text-xs text-muted-foreground mb-1">VS</div>
                    
                    {/* Date */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                      <Calendar className="w-3 h-3" />
                      <span>{match.date}</span>
                    </div>
                    
                    {/* Time */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{match.time}</span>
                    </div>
                    
                    {/* Stadium */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="text-center leading-tight max-w-[80px] truncate">{match.stadium}</span>
                    </div>
                    
                    {/* Countdown for upcoming */}
                    {match.status === "upcoming" && match.countdown && (
                      <div className="flex items-center gap-1 text-xs text-[#059669] font-medium mt-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{match.countdown}</span>
                      </div>
                    )}
                    
                    {/* Lock for locked matches */}
                    {match.status === "locked" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Lock className="w-3 h-3" />
                        <span className="text-center leading-tight">{match.unlockText}</span>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
                    <div className="text-left min-w-0 flex-shrink">
                      <p className="text-sm font-medium text-foreground leading-tight truncate max-w-[90px]">{match.awayTeam.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[90px]">{match.awayTeam.manager}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}