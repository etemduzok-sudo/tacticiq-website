import { motion } from "motion/react";
import { ChevronLeft, Trophy, Award, Lock, BarChart, Heart, Sparkles, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Switch } from "./ui/switch";
import { useState, useEffect } from "react";

interface ProfileBadgesProps {
  onBack: () => void;
}

const badges = [
  {
    id: 1,
    name: "İlk Tahmin",
    description: "İlk tahminini yaptın!",
    icon: "🎯",
    unlocked: true,
    color: "from-[#059669] to-emerald-700",
  },
  {
    id: 2,
    name: "Şampiyon Menajer",
    description: "10 maç üst üste doğru tahmin!",
    icon: "🏆",
    unlocked: true,
    color: "from-[#F59E0B] to-amber-700",
  },
  {
    id: 3,
    name: "Taktik Dehası",
    description: "5 farklı formasyon kullandın",
    icon: "🧠",
    unlocked: true,
    color: "from-purple-500 to-purple-700",
  },
  {
    id: 4,
    name: "Analiz Uzmanı",
    description: "100 oyuncu analizi yaptın",
    icon: "📊",
    unlocked: false,
    color: "from-gray-400 to-gray-600",
  },
  {
    id: 5,
    name: "Süper Lig Kralı",
    description: "Tüm Süper Lig maçlarını tahmin et",
    icon: "👑",
    unlocked: false,
    color: "from-gray-400 to-gray-600",
  },
  {
    id: 6,
    name: "Global Yıldız",
    description: "Dünya sıralamasında Top 100'e gir",
    icon: "⭐",
    unlocked: false,
    color: "from-gray-400 to-gray-600",
  },
];

const analysisStyles = [
  {
    id: "data",
    name: "Veri Odaklı",
    description: "İstatistiklere ve sayılara güvenirsin",
    icon: BarChart,
    color: "#059669",
  },
  {
    id: "balanced",
    name: "Dengeli",
    description: "Hem veriyi hem de sezgiyi kullanırsın",
    icon: Sparkles,
    color: "#F59E0B",
  },
  {
    id: "intuitive",
    name: "Sezgisel",
    description: "İçgüdülerine ve tecrübene dayanırsın",
    icon: Heart,
    color: "#8B5CF6",
  },
];

export function ProfileBadges({ onBack }: ProfileBadgesProps) {
  const [selectedStyle, setSelectedStyle] = useState("balanced");
  const [theme, setTheme] = useState<"light" | "dark" | "auto">(() => {
    const saved = localStorage.getItem("fan-manager-theme");
    return (saved as "light" | "dark" | "auto") || "dark";
  });
  const [autoSignOut, setAutoSignOut] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "auto") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem("fan-manager-theme", theme);
  }, [theme]);

  const favoriteTeams = [
    { id: 1, name: "Galatasaray", logo: "🦁", selected: true },
    { id: 2, name: "Fenerbahçe", logo: "🐤", selected: true },
    { id: 3, name: "Beşiktaş", logo: "🦅", selected: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-foreground hover:text-[#059669] transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-foreground">Profil & Ayarlar</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#059669]/20 to-transparent border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20 border-4 border-[#059669]">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
              <AvatarFallback>FM</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl text-foreground">Futbol Aşığı</h2>
                <span className="px-2 py-0.5 bg-[#F59E0B] text-white text-xs rounded-full">PRO</span>
              </div>
              <p className="text-muted-foreground">Level 12 • 2,845 Puan</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-card/50 rounded-xl">
              <p className="text-2xl text-[#059669]">156</p>
              <p className="text-xs text-muted-foreground mt-1">Türkiye Sırası</p>
            </div>
            <div className="text-center p-3 bg-card/50 rounded-xl">
              <p className="text-2xl text-[#059669]">45</p>
              <p className="text-xs text-muted-foreground mt-1">Doğru Tahmin</p>
            </div>
            <div className="text-center p-3 bg-card/50 rounded-xl">
              <p className="text-2xl text-[#059669]">78%</p>
              <p className="text-xs text-muted-foreground mt-1">Başarı Oranı</p>
            </div>
          </div>
        </motion.div>

        {/* Badges Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-[#059669]" />
            <h3 className="text-foreground">Başarı Rozetleri</h3>
            <span className="text-sm text-muted-foreground">({badges.filter(b => b.unlocked).length}/{badges.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 rounded-xl border-2 ${
                  badge.unlocked
                    ? "bg-gradient-to-br " + badge.color + " border-transparent shadow-lg"
                    : "bg-muted/50 border-dashed border-border"
                }`}
              >
                {!badge.unlocked && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h4 className={`text-sm mb-1 ${badge.unlocked ? "text-white" : "text-muted-foreground"}`}>
                  {badge.name}
                </h4>
                <p className={`text-xs ${badge.unlocked ? "text-white/80" : "text-muted-foreground"}`}>
                  {badge.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Analysis Style */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-5 h-5 text-[#059669]" />
            <h3 className="text-foreground">Analiz Yaklaşımın</h3>
          </div>
          <div className="space-y-3">
            {analysisStyles.map((style) => {
              const Icon = style.icon;
              return (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    selectedStyle === style.id
                      ? "border-[#059669] bg-[#059669]/10"
                      : "border-border bg-card hover:border-[#059669]/50"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${style.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: style.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-foreground">{style.name}</h4>
                    <p className="text-sm text-muted-foreground">{style.description}</p>
                  </div>
                  {selectedStyle === style.id && (
                    <div className="w-6 h-6 rounded-full bg-[#059669] flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Favorite Teams */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-[#059669]" />
            <h3 className="text-foreground">Favori Takımlar</h3>
          </div>
          <div className="p-4 bg-gradient-to-r from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/30 rounded-xl mb-3">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-[#F59E0B]" />
              <span className="text-sm text-foreground">Pro Özellik</span>
            </div>
            <p className="text-sm text-muted-foreground">Pro üyeler 3 favori takım ekleyebilir!</p>
          </div>
          <div className="space-y-2">
            {favoriteTeams.map((team) => (
              <div
                key={team.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  team.selected ? "bg-[#059669]/10 border-2 border-[#059669]" : "bg-card border-2 border-border"
                }`}
              >
                <span className="text-3xl">{team.logo}</span>
                <span className="text-foreground flex-1">{team.name}</span>
                {team.selected && <div className="w-2 h-2 bg-[#059669] rounded-full" />}
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div>
          <h3 className="text-foreground mb-4">Hesap Ayarları</h3>
          <div className="space-y-3">
            {/* Theme Selection */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h4 className="text-foreground mb-3">Tema</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    theme === "light" ? "border-[#059669] bg-[#059669]/10" : "border-border"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-sm">Açık</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    theme === "dark" ? "border-[#059669] bg-[#059669]/10" : "border-border"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-sm">Koyu</span>
                </button>
                <button
                  onClick={() => setTheme("auto")}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    theme === "auto" ? "border-[#059669] bg-[#059669]/10" : "border-border"
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm">Otomatik</span>
                </button>
              </div>
            </div>

            {/* Auto Sign Out */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-foreground">Otomatik Çıkış</h4>
                <p className="text-sm text-muted-foreground">30 gün hareketsizlik sonrası</p>
              </div>
              <Switch checked={autoSignOut} onCheckedChange={setAutoSignOut} />
            </div>

            {/* Sign Out Button */}
            <Button
              variant="destructive"
              className="w-full h-12 rounded-xl"
            >
              Oturumu Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}