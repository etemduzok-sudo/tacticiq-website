import { motion } from "motion/react";
import { Award, TrendingUp, Users, Target, CheckCircle2, XCircle, Clock, Trophy, Zap, Shield } from "lucide-react";
import { useState } from "react";

interface MatchSummaryProps {
  matchData: any;
}

// Mock data - gerçek API'den gelecek
const predictionResults = {
  totalPoints: 128,
  maxPoints: 180,
  successRate: 71,
  breakdown: {
    matchPredictions: 68,
    playerPredictions: 45,
    bonusPoints: 15,
    penalties: 0,
  },
  predictions: [
    {
      name: "Toplam Gol",
      prediction: "2-3 gol",
      actual: "3 gol",
      status: "correct",
      points: 20,
      explanation: "Maç 2-1 bitti, tahmin aralığı tuttu",
    },
    {
      name: "İlk Golü Kim Atar",
      prediction: "Mauro Icardi",
      actual: "Mauro Icardi",
      status: "correct",
      points: 25,
      explanation: "İcardi 3. dakikada golü attı",
    },
    {
      name: "Maçın Adamı",
      prediction: "Mauro Icardi",
      actual: "Wilfried Zaha",
      status: "wrong",
      points: 0,
      explanation: "Zaha 1 gol 2 asist yaptı ve maçın adamı seçildi",
    },
    {
      name: "Sarı Kart Sayısı",
      prediction: "2-3",
      actual: "3",
      status: "correct",
      points: 15,
      explanation: "Toplam 3 sarı kart gösterildi",
    },
    {
      name: "İlk Yarı Skor",
      prediction: "1-1",
      actual: "1-1",
      status: "correct",
      points: 30,
      explanation: "İlk yarı 1-1 beraberlikle tamamlandı",
    },
    {
      name: "Toplam Korner",
      prediction: "8-10",
      actual: "6",
      status: "wrong",
      points: 0,
      explanation: "Maçta toplam 6 korner kullanıldı",
    },
  ],
  timingBonus: {
    predictionTime: "2 saat önce",
    bonusPoints: 10,
    hasBonus: true,
  },
};

const userComparison = {
  betterThan: 68, // %68'inden iyi
  worseThan: 32,
  averagePoints: 95,
  topPoints: 165,
  userRank: 142,
  totalUsers: 2365,
  distribution: [
    { range: "0-30", count: 120 },
    { range: "30-60", count: 285 },
    { range: "60-90", count: 620 },
    { range: "90-120", count: 580 }, // user is here
    { range: "120-150", count: 420 },
    { range: "150-180", count: 340 },
  ],
};

const performanceTags = [
  { label: "Analist Seviye Okuma", icon: "🎯", color: "text-[#059669]" },
  { label: "Oyuncu Tahminlerinde Güçlü", icon: "⭐", color: "text-[#F59E0B]" },
];

const recentMatches = [
  { opponent: "vs Beşiktaş", points: 145, date: "21 Ara" },
  { opponent: "vs Trabzonspor", points: 112, date: "18 Ara" },
  { opponent: "vs Fenerbahçe", points: 98, date: "15 Ara" },
  { opponent: "vs Alanyaspor", points: 133, date: "12 Ara" },
  { opponent: "vs Sivasspor", points: 107, date: "9 Ara" },
];

// Takım lig durumu mock data
const teamStandings = {
  league: "Süper Lig",
  rank: 1,
  totalTeams: 19,
  stats: {
    played: 17,
    won: 12,
    draw: 3,
    lost: 2,
    goalsFor: 38,
    goalsAgainst: 15,
    goalDiff: 23,
    points: 39,
  },
  homeStats: {
    played: 9,
    won: 7,
    draw: 1,
    lost: 1,
    goalsFor: 22,
    goalsAgainst: 7,
  },
  awayStats: {
    played: 8,
    won: 5,
    draw: 2,
    lost: 1,
    goalsFor: 16,
    goalsAgainst: 8,
  },
  form: ["W", "W", "D", "W", "W"], // Son 5 maç (en yeni solda)
  nextOpponent: "Fenerbahçe",
  streakType: "win",
  streakCount: 2,
};

export function MatchSummary({ matchData }: MatchSummaryProps) {
  const [showAllPredictions, setShowAllPredictions] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "standings">("summary");

  const correctCount = predictionResults.predictions.filter(p => p.status === "correct").length;
  const wrongCount = predictionResults.predictions.filter(p => p.status === "wrong").length;
  const averageRecent = Math.round(recentMatches.reduce((sum, m) => sum + m.points, 0) / recentMatches.length);
  const performanceDiff = predictionResults.totalPoints - averageRecent;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 flex items-center bg-card border-b border-border sticky top-0 z-10">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 h-[50px] font-bold text-[10px] transition-all relative ${
            activeTab === "summary"
              ? "text-[#059669]"
              : "text-muted-foreground"
          }`}
        >
          🏆 Tahmin Özeti
          {activeTab === "summary" && (
            <motion.div
              layoutId="summaryTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#059669]"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("standings")}
          className={`flex-1 h-[50px] font-bold text-[10px] transition-all relative ${
            activeTab === "standings"
              ? "text-[#059669]"
              : "text-muted-foreground"
          }`}
        >
          📊 Takım Durumu
          {activeTab === "standings" && (
            <motion.div
              layoutId="summaryTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#059669]"
            />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "summary" ? (
          <div className="px-4 py-6 space-y-4 pb-20">
      {/* 1) BU MAÇTAN ALINAN PUANLAR */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#F59E0B]/20 via-[#F59E0B]/10 to-transparent border-2 border-[#F59E0B] rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="font-bold text-foreground">Bu Maçtan Alınan Puanlar</h3>
        </div>

        {/* Puan Özeti */}
        <div className="bg-card/50 rounded-lg p-4 mb-3">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Toplam Puan</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[#F59E0B]">{predictionResults.totalPoints}</span>
                <span className="text-muted-foreground">/ {predictionResults.maxPoints}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Başarı</p>
              <span className="text-2xl font-bold text-[#059669]">{predictionResults.successRate}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${predictionResults.successRate}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-[#059669] to-[#F59E0B]"
            />
          </div>
        </div>

        {/* Puan Kaynağı Dağılımı */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">{predictionResults.breakdown.matchPredictions}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Maç Tahminleri</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">{predictionResults.breakdown.playerPredictions}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Oyuncu Tahminleri</div>
          </div>
          <div className="bg-[#059669]/10 rounded-lg p-3 text-center border border-[#059669]/20">
            <div className="text-lg font-bold text-[#059669]">+{predictionResults.breakdown.bonusPoints}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Bonus</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">{predictionResults.breakdown.penalties}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Ceza</div>
          </div>
        </div>

        {/* Doğru - Yanlış Özet */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-[#059669]/10 rounded-lg p-2 text-center border border-[#059669]/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
              <span className="text-base font-bold text-[#059669]">{correctCount}</span>
            </div>
            <div className="text-[8px] text-muted-foreground uppercase">Doğru</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="w-3 h-3 text-muted-foreground" />
              <span className="text-base font-bold text-foreground">{wrongCount}</span>
            </div>
            <div className="text-[8px] text-muted-foreground uppercase">Yanlış</div>
          </div>
          <div className="bg-muted/40 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
              <span className="text-base font-bold text-foreground">0</span>
            </div>
            <div className="text-[8px] text-muted-foreground uppercase">Boş</div>
          </div>
        </div>
      </motion.div>

      {/* 2) TAHMİN BAŞARI ANALİZİ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#059669]" />
            <h3 className="font-bold text-foreground">Tahmin Analizi</h3>
          </div>
          {predictionResults.timingBonus.hasBonus && (
            <div className="flex items-center gap-1 bg-[#059669]/10 px-2 py-1 rounded-md">
              <Zap className="w-3 h-3 text-[#059669]" />
              <span className="text-[9px] text-[#059669] font-bold">+{predictionResults.timingBonus.bonusPoints} Erken Bonus</span>
            </div>
          )}
        </div>

        {/* Tahmin Listesi */}
        <div className="space-y-2">
          {predictionResults.predictions
            .slice(0, showAllPredictions ? undefined : 3)
            .map((pred, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-lg p-3 border ${
                  pred.status === "correct"
                    ? "bg-[#059669]/10 border-[#059669]/20"
                    : "bg-muted/40 border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    {pred.status === "correct" ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground mb-1">{pred.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                        <span>Tahmin: <strong className="text-foreground">{pred.prediction}</strong></span>
                        <span>•</span>
                        <span>Sonuç: <strong className="text-foreground">{pred.actual}</strong></span>
                      </div>
                      <p className="text-[9px] text-muted-foreground italic">{pred.explanation}</p>
                    </div>
                  </div>
                  <div className={`font-bold text-base ml-2 ${
                    pred.status === "correct" ? "text-[#F59E0B]" : "text-muted-foreground"
                  }`}>
                    {pred.points > 0 ? `+${pred.points}` : "0"}
                  </div>
                </div>
              </motion.div>
            ))}
        </div>

        {/* Show More Button */}
        {predictionResults.predictions.length > 3 && (
          <button
            onClick={() => setShowAllPredictions(!showAllPredictions)}
            className="w-full mt-3 py-2 text-[10px] text-[#059669] font-bold uppercase tracking-wider hover:bg-[#059669]/5 rounded-lg transition-colors"
          >
            {showAllPredictions ? "Daha Az Göster" : `${predictionResults.predictions.length - 3} Tahmin Daha Göster`}
          </button>
        )}

        {/* Zamanlama Bilgisi */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">
            Tahminler maçtan <strong>{predictionResults.timingBonus.predictionTime}</strong> yapıldı
          </p>
        </div>
      </motion.div>

      {/* 3) DİĞER KULLANICILARLA KARŞILAŞTIRMA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-[#059669]" />
          <h3 className="font-bold text-foreground">Kullanıcı Karşılaştırması</h3>
        </div>

        {/* Genel Karşılaştırma */}
        <div className="bg-gradient-to-br from-[#059669]/10 to-transparent rounded-lg p-4 mb-3 border border-[#059669]/20">
          <p className="text-sm text-foreground mb-3">
            <span className="font-bold text-[#059669] text-lg">{userComparison.betterThan}%</span> kullanıcıdan daha iyi performans gösterdin!
          </p>
          
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Sıralama</p>
              <p className="font-bold text-foreground">#{userComparison.userRank}</p>
              <p className="text-[9px] text-muted-foreground">/ {userComparison.totalUsers.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Ortalama</p>
              <p className="font-bold text-foreground">{userComparison.averagePoints}</p>
              <p className="text-[9px] text-muted-foreground">puan</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">En Yüksek</p>
              <p className="font-bold text-[#F59E0B]">{userComparison.topPoints}</p>
              <p className="text-[9px] text-muted-foreground">puan</p>
            </div>
          </div>

          {/* Distribution Histogram */}
          <div className="space-y-1.5">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-2">Puan Dağılımı</p>
            {userComparison.distribution.map((dist, index) => {
              const maxCount = Math.max(...userComparison.distribution.map(d => d.count));
              const widthPercent = (dist.count / maxCount) * 100;
              const isUserRange = index === 3; // User is in 90-120 range

              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-[9px] text-muted-foreground w-12">{dist.range}</span>
                  <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className={`h-full ${
                        isUserRange
                          ? "bg-gradient-to-r from-[#059669] to-[#047857]"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                    {isUserRange && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-white font-bold">
                        SEN
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground w-8 text-right">{dist.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* 4) PERFORMANS ETİKETLERİ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="font-bold text-foreground">Performans Etiketleri</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {performanceTags.map((tag, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-gradient-to-r from-[#059669]/10 to-[#F59E0B]/10 border border-[#059669]/20 rounded-full px-3 py-2 flex items-center gap-2"
            >
              <span className="text-sm">{tag.icon}</span>
              <span className="text-[10px] font-bold text-foreground">{tag.label}</span>
            </motion.div>
          ))}
        </div>

        <p className="text-[9px] text-muted-foreground mt-3 italic">
          Bu etiketler performansına göre otomatik oluşturuldu ve profil istatistiklerinde görünecek
        </p>
      </motion.div>

      {/* 5) GEÇMİŞE DÖNÜK KIYAS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-[#059669]" />
          <h3 className="font-bold text-foreground">Geçmiş Performans</h3>
        </div>

        {/* Ortalama vs Bu Maç */}
        <div className="bg-muted/40 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Son 5 Maç Ortalaması</span>
            <span className="font-bold text-foreground">{averageRecent} puan</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Bu Maç</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">{predictionResults.totalPoints} puan</span>
              <span className={`text-xs font-bold ${
                performanceDiff > 0 ? "text-[#059669]" : "text-red-500"
              }`}>
                {performanceDiff > 0 ? "+" : ""}{performanceDiff}
              </span>
            </div>
          </div>
        </div>

        {/* Son Maçlar */}
        <div className="space-y-1.5">
          {recentMatches.map((match, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  match.points >= averageRecent ? "bg-[#059669]" : "bg-muted-foreground"
                }`} />
                <span className="text-[11px] text-foreground">{match.opponent}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-muted-foreground">{match.date}</span>
                <span className="text-xs font-bold text-foreground">{match.points}</span>
              </div>
            </div>
          ))}
        </div>

        {/* En İyi / En Kötü */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-[#059669]/10 rounded-lg p-2 text-center border border-[#059669]/20">
            <p className="text-[9px] text-muted-foreground uppercase mb-1">En İyi</p>
            <p className="text-base font-bold text-[#059669]">145</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase mb-1">En Düşük</p>
            <p className="text-base font-bold text-foreground">98</p>
          </div>
        </div>
      </motion.div>

      {/* Privacy Note */}
      <div className="bg-muted/30 border border-dashed border-border rounded-lg p-3">
        <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
          🔒 Gizlilik: Diğer kullanıcıların tahminleri görünmez. Karşılaştırmalar anonim ve istatistikseldir.
        </p>
      </div>
          </div>
        ) : (
          <div className="px-4 py-6 space-y-4 pb-20">
            {/* 1) TAKIM LİG SIRALAMASI - HERO CARD */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#059669] to-[#047857] rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs opacity-80 mb-1">{teamStandings.league}</p>
                  <h2 className="text-4xl font-bold mb-1">{teamStandings.rank}.</h2>
                  <p className="text-sm opacity-90">Sırada • {teamStandings.totalTeams} Takım</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-8 h-8" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">{teamStandings.stats.played}</div>
                  <div className="text-[9px] opacity-80 uppercase tracking-wider mt-0.5">Maç</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{teamStandings.stats.won}</div>
                  <div className="text-[9px] opacity-80 uppercase tracking-wider mt-0.5">Galibiyet</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{teamStandings.stats.draw}</div>
                  <div className="text-[9px] opacity-80 uppercase tracking-wider mt-0.5">Beraberlik</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{teamStandings.stats.lost}</div>
                  <div className="text-[9px] opacity-80 uppercase tracking-wider mt-0.5">Mağlubiyet</div>
                </div>
              </div>

              <div className="h-px bg-white/20 my-4" />

              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-sm opacity-80 mb-1">Atılan</div>
                  <div className="text-2xl font-bold">{teamStandings.stats.goalsFor}</div>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center flex-1">
                  <div className="text-sm opacity-80 mb-1">Averaj</div>
                  <div className="text-2xl font-bold text-[#F59E0B]">+{teamStandings.stats.goalDiff}</div>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center flex-1">
                  <div className="text-sm opacity-80 mb-1">Yenilen</div>
                  <div className="text-2xl font-bold">{teamStandings.stats.goalsAgainst}</div>
                </div>
              </div>
            </motion.div>

            {/* 2) PUAN DURUMU */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="font-bold text-foreground">Puan Durumu</h3>
                </div>
                <div className="bg-[#F59E0B]/10 px-3 py-1.5 rounded-full">
                  <span className="text-lg font-bold text-[#F59E0B]">{teamStandings.stats.points}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">Puan</span>
                </div>
              </div>

              {/* Mini Puan Tablosu */}
              <div className="space-y-1.5">
                {[
                  { rank: 1, team: matchData.homeTeam.name, played: 17, won: 12, draw: 3, lost: 2, gd: 23, points: 39, isUser: true },
                  { rank: 2, team: "Fenerbahçe", played: 17, won: 11, draw: 4, lost: 2, gd: 19, points: 37, isUser: false },
                  { rank: 3, team: "Beşiktaş", played: 17, won: 10, draw: 5, lost: 2, gd: 15, points: 35, isUser: false },
                  { rank: 4, team: "Trabzonspor", played: 17, won: 9, draw: 4, lost: 4, gd: 8, points: 31, isUser: false },
                  { rank: 5, team: "Başakşehir", played: 17, won: 8, draw: 5, lost: 4, gd: 6, points: 29, isUser: false },
                ].map((team, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                      team.isUser
                        ? "bg-gradient-to-r from-[#059669]/20 to-[#059669]/5 border-l-2 border-[#059669]"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                      team.isUser ? "bg-[#059669] text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {team.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${team.isUser ? "font-bold text-[#059669]" : "text-foreground"}`}>
                        {team.team}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="w-6 text-center">{team.played}</span>
                      <span className="w-6 text-center text-foreground font-medium">{team.won}</span>
                      <span className="w-6 text-center">{team.draw}</span>
                      <span className="w-6 text-center">{team.lost}</span>
                      <span className="w-8 text-right font-bold text-[#F59E0B]">{team.points}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tablo Açıklama */}
              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-border">
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">O</div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">G</div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">B</div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">M</div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">P</div>
              </div>
            </motion.div>

            {/* 3) SON 5 MAÇ FORMU */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[#059669]" />
                <h3 className="font-bold text-foreground">Son 5 Maç Formu</h3>
              </div>

              <div className="flex items-center justify-between gap-2 mb-4">
                {teamStandings.form.map((result, index) => {
                  let bgColor = "bg-muted-foreground";
                  let label = "?";
                  let fullLabel = "Bilinmiyor";
                  
                  if (result === "W") {
                    bgColor = "bg-[#059669]";
                    label = "G";
                    fullLabel = "Galibiyet";
                  } else if (result === "D") {
                    bgColor = "bg-[#F59E0B]";
                    label = "B";
                    fullLabel = "Beraberlik";
                  } else if (result === "L") {
                    bgColor = "bg-red-500";
                    label = "M";
                    fullLabel = "Mağlubiyet";
                  }
                  
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex-1"
                    >
                      <div className={`${bgColor} rounded-xl h-14 flex items-center justify-center text-white text-xl font-bold shadow-sm`}>
                        {label}
                      </div>
                      <p className="text-[8px] text-muted-foreground text-center mt-1.5">{fullLabel}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Streak Badge */}
              <div className="bg-gradient-to-r from-[#059669]/10 to-transparent rounded-lg p-3 border border-[#059669]/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#059669] flex items-center justify-center text-2xl">
                    🔥
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Şu Anki Seri</p>
                    <p className="font-bold text-foreground">
                      <span className="text-[#059669] text-lg">{teamStandings.streakCount}</span> {teamStandings.streakType === "win" ? "Maç Galibiyet" : "Maç Yenilmezlik"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 4) EV SAHİBİ VS DEPLASMAN - YENİDEN TASARLANMIŞ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#059669]" />
                <h3 className="font-bold text-foreground">Ev Sahibi / Deplasman</h3>
              </div>

              <div className="space-y-3">
                {/* Home Stats */}
                <div className="bg-gradient-to-br from-[#059669]/10 to-transparent rounded-xl p-4 border border-[#059669]/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#059669]/20 flex items-center justify-center">
                      <span className="text-2xl">🏠</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Ev Sahibi</h4>
                      <p className="text-[10px] text-muted-foreground">{teamStandings.homeStats.played} Maç</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#059669]">{teamStandings.homeStats.won}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Galibiyet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{teamStandings.homeStats.draw}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Beraberlik</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{teamStandings.homeStats.lost}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Mağlubiyet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#059669]">{teamStandings.homeStats.goalsFor}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Atılan</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{teamStandings.homeStats.goalsAgainst}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Yenilen</div>
                    </div>
                  </div>

                  {/* Win Rate Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                      <span>Galibiyet Oranı</span>
                      <span className="font-bold text-[#059669]">{Math.round((teamStandings.homeStats.won / teamStandings.homeStats.played) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(teamStandings.homeStats.won / teamStandings.homeStats.played) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="h-full bg-[#059669]"
                      />
                    </div>
                  </div>
                </div>

                {/* Away Stats */}
                <div className="bg-gradient-to-br from-[#F59E0B]/10 to-transparent rounded-xl p-4 border border-[#F59E0B]/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                      <span className="text-2xl">✈️</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Deplasman</h4>
                      <p className="text-[10px] text-muted-foreground">{teamStandings.awayStats.played} Maç</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#F59E0B]">{teamStandings.awayStats.won}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Galibiyet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{teamStandings.awayStats.draw}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Beraberlik</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{teamStandings.awayStats.lost}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Mağlubiyet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-[#F59E0B]">{teamStandings.awayStats.goalsFor}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Atılan</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-foreground">{teamStandings.awayStats.goalsAgainst}</div>
                      <div className="text-[8px] text-muted-foreground uppercase mt-0.5">Yenilen</div>
                    </div>
                  </div>

                  {/* Win Rate Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                      <span>Galibiyet Oranı</span>
                      <span className="font-bold text-[#F59E0B]">{Math.round((teamStandings.awayStats.won / teamStandings.awayStats.played) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(teamStandings.awayStats.won / teamStandings.awayStats.played) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="h-full bg-[#F59E0B]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 5) SONRAKİ MAÇ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-[#059669]/5 to-[#F59E0B]/5 border border-border rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-[#059669]" />
                <h3 className="font-bold text-foreground">Sıradaki Maç</h3>
              </div>

              <div className="bg-card rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">19. Hafta</p>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-lg font-bold text-foreground">{matchData.homeTeam.name}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-lg font-bold text-foreground">{teamStandings.nextOpponent}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">5 Ocak 2026 • 19:00</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}