import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Search, X, Lock, CheckCircle2, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";

interface FavoriteTeamsProps {
  onComplete: () => void;
  onBack?: () => void;
  fromSettings?: boolean;
}

interface Team {
  id: string;
  name: string;
  country: string;
  league: string;
  type: "club" | "national";
  color1: string;
  color2: string;
  popular?: boolean;
}

const teams: Team[] = [
  // Clubs
  { id: "gs", name: "Galatasaray", country: "Türkiye", league: "Süper Lig", type: "club", color1: "#FDB913", color2: "#C8102E", popular: true },
  { id: "fb", name: "Fenerbahçe", country: "Türkiye", league: "Süper Lig", type: "club", color1: "#FCCF1E", color2: "#054098", popular: true },
  { id: "bjk", name: "Beşiktaş", country: "Türkiye", league: "Süper Lig", type: "club", color1: "#000000", color2: "#FFFFFF", popular: true },
  { id: "ts", name: "Trabzonspor", country: "Türkiye", league: "Süper Lig", type: "club", color1: "#7E2B3E", color2: "#00B5E2", popular: true },
  { id: "rm", name: "Real Madrid", country: "İspanya", league: "La Liga", type: "club", color1: "#FFFFFF", color2: "#00529F", popular: true },
  { id: "fcb", name: "Barcelona", country: "İspanya", league: "La Liga", type: "club", color1: "#A50044", color2: "#004D98", popular: true },
  { id: "mufc", name: "Manchester United", country: "İngiltere", league: "Premier League", type: "club", color1: "#DA291C", color2: "#FBE122", popular: true },
  { id: "mcfc", name: "Manchester City", country: "İngiltere", league: "Premier League", type: "club", color1: "#6CABDD", color2: "#1C2C5B", popular: true },
  { id: "lfc", name: "Liverpool", country: "İngiltere", league: "Premier League", type: "club", color1: "#C8102E", color2: "#00B2A9", popular: true },
  { id: "cfc", name: "Chelsea", country: "İngiltere", league: "Premier League", type: "club", color1: "#034694", color2: "#DBA111", popular: true },
  { id: "psg", name: "Paris Saint-Germain", country: "Fransa", league: "Ligue 1", type: "club", color1: "#004170", color2: "#DA291C", popular: true },
  { id: "fcb-de", name: "Bayern Munich", country: "Almanya", league: "Bundesliga", type: "club", color1: "#DC052D", color2: "#0066B2", popular: true },
  { id: "juve", name: "Juventus", country: "İtalya", league: "Serie A", type: "club", color1: "#000000", color2: "#FFFFFF", popular: true },
  { id: "inter", name: "Inter Milan", country: "İtalya", league: "Serie A", type: "club", color1: "#0068A8", color2: "#000000", popular: true },
  { id: "acm", name: "AC Milan", country: "İtalya", league: "Serie A", type: "club", color1: "#FB090B", color2: "#000000", popular: true },
  
  // National Teams
  { id: "tr-nat", name: "Türkiye", country: "Türkiye", league: "UEFA", type: "national", color1: "#E30A17", color2: "#FFFFFF", popular: true },
  { id: "de-nat", name: "Almanya", country: "Almanya", league: "UEFA", type: "national", color1: "#000000", color2: "#FFFFFF", popular: true },
  { id: "br-nat", name: "Brezilya", country: "Brezilya", league: "CONMEBOL", type: "national", color1: "#009B3A", color2: "#FEDF00", popular: true },
  { id: "ar-nat", name: "Arjantin", country: "Arjantin", league: "CONMEBOL", type: "national", color1: "#74ACDF", color2: "#FFFFFF", popular: true },
  { id: "fr-nat", name: "Fransa", country: "Fransa", league: "UEFA", type: "national", color1: "#002395", color2: "#ED2939", popular: true },
  { id: "es-nat", name: "İspanya", country: "İspanya", league: "UEFA", type: "national", color1: "#AA151B", color2: "#F1BF00", popular: true },
  { id: "en-nat", name: "İngiltere", country: "İngiltere", league: "UEFA", type: "national", color1: "#FFFFFF", color2: "#C8102E", popular: true },
  { id: "it-nat", name: "İtalya", country: "İtalya", league: "UEFA", type: "national", color1: "#009246", color2: "#FFFFFF", popular: true },
];

export function FavoriteTeams({ onComplete, onBack, fromSettings = false }: FavoriteTeamsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [selectedNational, setSelectedNational] = useState<string | null>(null);
  const [isPro] = useState(false); // Change to true for PRO users

  const clubLimit = isPro ? 3 : 1;

  const filteredTeams = useMemo(() => {
    if (searchQuery.length < 3) {
      return teams.filter(t => t.popular);
    }
    return teams.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.league.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const clubs = filteredTeams.filter(t => t.type === "club");
  const nationals = filteredTeams.filter(t => t.type === "national");

  const handleClubToggle = (teamId: string) => {
    if (selectedClubs.includes(teamId)) {
      setSelectedClubs(selectedClubs.filter(id => id !== teamId));
    } else {
      if (selectedClubs.length >= clubLimit) {
        toast.error("Limit doldu!", {
          description: isPro 
            ? "En fazla 3 kulüp seçebilirsiniz."
            : "Free planda en fazla 1 kulüp seçebilirsiniz. PRO'ya geçin!",
        });
        return;
      }
      setSelectedClubs([...selectedClubs, teamId]);
    }
  };

  const handleNationalToggle = (teamId: string) => {
    if (selectedNational === teamId) {
      setSelectedNational(null);
    } else {
      setSelectedNational(teamId);
    }
  };

  const handleComplete = () => {
    if (selectedClubs.length === 0) {
      toast.error("En az 1 kulüp seçmelisiniz", {
        description: "Devam etmek için favori kulübünüzü seçin.",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem("fan-manager-favorite-clubs", JSON.stringify(selectedClubs));
    if (selectedNational) {
      localStorage.setItem("fan-manager-favorite-national", selectedNational);
    }

    toast.success("Favori takımlar kaydedildi! 🎉");
    onComplete();
  };

  const selectedNationalTeam = teams.find(t => t.id === selectedNational);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-foreground hover:text-[#059669] transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg font-semibold text-foreground">Favori Takımlarınız</h1>
        </div>

        {/* Info Section */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground mb-1">Takımlarınızı Seçin</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Favori kulüplerinizi ve milli takımınızı belirleyin
          </p>
          
          {/* Counter Badges */}
          <div className="flex gap-2">
            <div className="bg-[#059669]/10 border border-[#059669]/20 rounded-lg px-3 py-1.5 text-sm">
              <span className="text-foreground">Kulüp: </span>
              <span className="text-[#059669] font-medium">
                {selectedClubs.length}/{clubLimit}
              </span>
            </div>
            <div className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm">
              <span className="text-foreground">Milli: </span>
              <span className="text-muted-foreground font-medium">
                {selectedNational ? "1/1" : "0/1"} (opsiyonel)
              </span>
            </div>
            {!isPro && (
              <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg px-3 py-1.5 text-sm flex items-center gap-1">
                <Crown className="w-3 h-3 text-[#F59E0B]" />
                <span className="text-[#F59E0B] font-medium">Free Plan</span>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="En az 3 karakter yazın..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="text-xs text-muted-foreground mt-2">
            En az 3 karakter girin veya popüler takımları görüntüleyin
          </p>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-24">
          {/* Clubs Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Kulüpler</h3>
              <span className="text-sm text-muted-foreground">
                {selectedClubs.length}/{clubLimit} seçili
              </span>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {clubs.map((team) => {
                  const isSelected = selectedClubs.includes(team.id);
                  const isLimitReached = selectedClubs.length >= clubLimit && !isSelected;

                  return (
                    <motion.button
                      key={team.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => handleClubToggle(team.id)}
                      disabled={isLimitReached}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-[#059669] bg-[#059669]/10"
                          : isLimitReached
                          ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                          : "border-border bg-card hover:border-[#059669]/50"
                      }`}
                    >
                      {/* Color Stripes */}
                      <div className="flex gap-1">
                        <div
                          className="w-1 h-12 rounded-full"
                          style={{ background: `linear-gradient(to bottom, ${team.color1}, ${team.color2})` }}
                        />
                      </div>

                      {/* Team Info */}
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-1">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.country} • {team.league}
                        </p>
                      </div>

                      {/* Selection Icon */}
                      {isLimitReached ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground" />
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* National Teams Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Milli Takım</h3>
              <div className="flex items-center gap-2">
                {selectedNational && (
                  <button
                    onClick={() => setSelectedNational(null)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Kaldır
                  </button>
                )}
                <span className="text-sm text-muted-foreground">
                  {selectedNationalTeam ? selectedNationalTeam.name : "Opsiyonel"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {nationals.map((team) => {
                  const isSelected = selectedNational === team.id;

                  return (
                    <motion.button
                      key={team.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onClick={() => handleNationalToggle(team.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-[#059669] bg-[#059669]/10"
                          : "border-border bg-card hover:border-[#059669]/50"
                      }`}
                    >
                      {/* Color Stripes */}
                      <div className="flex gap-1">
                        <div
                          className="w-1 h-12 rounded-full"
                          style={{ background: `linear-gradient(to bottom, ${team.color1}, ${team.color2})` }}
                        />
                      </div>

                      {/* Team Info */}
                      <div className="flex-1">
                        <p className="font-medium text-foreground mb-1">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Milli Takım • {team.league}
                        </p>
                      </div>

                      {/* Selection Icon */}
                      {isSelected ? (
                        <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-muted-foreground" />
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Button */}
      <div className="sticky bottom-0 z-50 bg-card/95 backdrop-blur-md border-t border-border p-4">
        <Button
          onClick={handleComplete}
          disabled={selectedClubs.length === 0}
          className="w-full bg-[#059669] hover:bg-[#059669]/90 text-white h-14 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {fromSettings ? "Kaydet" : "Devam Et"}
        </Button>
      </div>
    </div>
  );
}
