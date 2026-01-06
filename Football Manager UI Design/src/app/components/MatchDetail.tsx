import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Trophy, Calendar, MapPin, Users, Target, Activity, BarChart3, Star, FileText, Clock, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MatchSquad } from "./match/MatchSquad";
import { MatchPrediction } from "./match/MatchPrediction";
import { MatchLive } from "./match/MatchLive";
import { MatchStats } from "./match/MatchStats";
import { MatchRatings } from "./match/MatchRatings";
import { MatchSummary } from "./match/MatchSummary";

interface MatchDetailProps {
  matchId: string;
  onBack: () => void;
}

const matchData = {
  id: "2",
  homeTeam: { name: "Galatasaray", logo: "🦁", color: "linear-gradient(135deg, #FDB913 0%, #E30613 100%)", manager: "Okan Buruk" },
  awayTeam: { name: "Fenerbahçe", logo: "🐤", color: "linear-gradient(135deg, #FCCF1E 0%, #001A70 100%)", manager: "İsmail Kartal" },
  league: "Süper Lig",
  stadium: "Ali Sami Yen",
  date: "2 Oca 2026",
  time: "20:00",
  // For testing countdown: set match time to 5 days from now
  matchTimestamp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).getTime(),
};

export function MatchDetail({ matchId, onBack }: MatchDetailProps) {
  const [activeTab, setActiveTab] = useState("squad");
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = matchData.matchTimestamp - now;
      
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds, total: diff });
      } else {
        setCountdown({ hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate countdown color based on time remaining
  const getCountdownColor = () => {
    const hoursRemaining = countdown.total / (1000 * 60 * 60);
    if (hoursRemaining > 24) return "#059669"; // Green
    if (hoursRemaining > 12) return "#F59E0B"; // Yellow/Orange
    if (hoursRemaining > 0) return "#EF4444"; // Red
    return "#6B7280"; // Gray (expired)
  };

  const getCountdownText = () => {
    if (countdown.total <= 0) return "Tahmin süresi doldu";
    if (countdown.hours >= 24) {
      const days = Math.floor(countdown.hours / 24);
      const remainingHours = countdown.hours % 24;
      return `${days} gün ${remainingHours} saat`;
    }
    return `${countdown.hours} saat ${countdown.minutes} dk`;
  };

  const isPredictionDisabled = countdown.total <= 0;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Sticky Match Card - Container Style */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-background pt-[22px] pb-2 px-4"
      >
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
          {/* League Badge with Back Button - Top Center */}
          <div className="px-3 py-1.5 bg-gradient-to-r from-[#059669]/10 to-transparent border-b border-border relative">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-[#059669]" />
              <span className="text-xs text-muted-foreground">{matchData.league}</span>
            </div>
            
            {/* Back Button - Absolute Left */}
            <button 
              onClick={onBack} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground hover:text-[#059669] transition-colors p-0.5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Match Info */}
          <div className="p-2 relative">
            {/* Home Team Color Bar - Left Side */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
              style={{ background: matchData.homeTeam.color }}
            />
            
            {/* Away Team Color Bar - Right Side */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-1 rounded-r-2xl"
              style={{ background: matchData.awayTeam.color }}
            />

            <div className="flex items-center justify-between gap-2 px-1">
              {/* Home Team */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-sm text-foreground font-bold text-center leading-tight">{matchData.homeTeam.name}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{matchData.homeTeam.manager}</span>
              </div>

              {/* Match Details Center Column */}
              <div className="flex-1 flex flex-col items-center justify-center gap-0 px-2">
                <div className="text-[10px] text-muted-foreground mb-0.5">VS</div>
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{matchData.date}</span>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{matchData.time}</span>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <MapPin className="w-2.5 h-2.5" />
                  <span className="text-center leading-tight">{matchData.stadium}</span>
                </div>
                
                {/* Countdown Timer with Dynamic Color */}
                <motion.div 
                  className="flex items-center gap-0.5 text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded-md"
                  style={{ 
                    backgroundColor: `${getCountdownColor()}15`,
                    color: getCountdownColor(),
                  }}
                  animate={{ 
                    scale: countdown.total > 0 && countdown.total < 12 * 60 * 60 * 1000 ? [1, 1.05, 1] : 1 
                  }}
                  transition={{ duration: 1, repeat: countdown.total > 0 && countdown.total < 12 * 60 * 60 * 1000 ? Infinity : 0 }}
                >
                  {countdown.total > 0 ? (
                    <>
                      <Clock className="w-2.5 h-2.5" />
                      <span>{getCountdownText()}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-2.5 h-2.5" />
                      <span>{getCountdownText()}</span>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-sm text-foreground font-bold text-center leading-tight">{matchData.awayTeam.name}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">{matchData.awayTeam.manager}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          <TabsContent value="squad" className="m-0 h-full">
            <MatchSquad matchData={matchData} onComplete={() => setActiveTab("prediction")} />
          </TabsContent>

          <TabsContent value="prediction" className="m-0 h-full">
            {isPredictionDisabled ? (
              <div className="p-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-6 text-center"
                >
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-2">Tahmin Yapılamaz</h3>
                  <p className="text-sm text-muted-foreground">
                    Maça çok az süre kaldığı için artık tahmin yapamazsınız.
                  </p>
                </motion.div>
              </div>
            ) : (
              <MatchPrediction matchData={matchData} />
            )}
          </TabsContent>

          <TabsContent value="live" className="m-0">
            <MatchLive matchData={matchData} />
          </TabsContent>

          <TabsContent value="stats" className="m-0">
            <MatchStats matchData={matchData} />
          </TabsContent>

          <TabsContent value="ratings" className="m-0">
            <MatchRatings matchData={matchData} />
          </TabsContent>

          <TabsContent value="summary" className="m-0">
            <MatchSummary matchData={matchData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation - 6 Tabs */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg"
      >
        <div className="grid grid-cols-6">
          <button
            onClick={() => setActiveTab("squad")}
            className={`flex flex-col items-center gap-0.5 py-2 transition-colors ${
              activeTab === "squad" 
                ? "text-[#059669] bg-[#059669]/10 border-t-2 border-[#059669]" 
                : "text-muted-foreground border-t-2 border-transparent"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px]">Kadro</span>
          </button>

          <button
            onClick={() => setActiveTab("prediction")}
            className={`flex flex-col items-center gap-0.5 py-2 transition-colors ${
              activeTab === "prediction" 
                ? "text-[#059669] bg-[#059669]/10 border-t-2 border-[#059669]" 
                : "text-muted-foreground border-t-2 border-transparent"
            }`}
          >
            <Target className="w-4 h-4" />
            <span className="text-[10px]">Tahmin</span>
          </button>

          <button
            onClick={() => setActiveTab("live")}
            className={`flex flex-col items-center gap-0.5 py-2 transition-colors ${
              activeTab === "live" 
                ? "text-[#059669] bg-[#059669]/10 border-t-2 border-[#059669]" 
                : "text-muted-foreground border-t-2 border-transparent"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-[10px]">Canlı</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center gap-0.5 py-2 transition-colors ${
              activeTab === "stats" 
                ? "text-[#059669] bg-[#059669]/10 border-t-2 border-[#059669]" 
                : "text-muted-foreground border-t-2 border-transparent"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px]">İstatistik</span>
          </button>

          <button
            onClick={() => setActiveTab("ratings")}
            className={`flex flex-col items-center gap-0.5 py-2 transition-colors ${
              activeTab === "ratings" 
                ? "text-[#059669] bg-[#059669]/10 border-t-2 border-[#059669]" 
                : "text-muted-foreground border-t-2 border-transparent"
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="text-[10px]">Reyting</span>
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            className={`flex flex-col items-center gap-0.5 py-2 transition-colors ${
              activeTab === "summary" 
                ? "text-[#059669] bg-[#059669]/10 border-t-2 border-[#059669]" 
                : "text-muted-foreground border-t-2 border-transparent"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px]">Özet</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}