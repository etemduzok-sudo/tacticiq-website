import { motion } from "motion/react";
import { useState } from "react";

interface MatchRatingsProps {
  matchData: any;
}

// Coach Rating Categories
const coachCategories = [
  { 
    id: 1,
    emoji: "⚽",
    title: "Sonuç & Beklenti Yönetimi", 
    weight: 20,
    description: "Maç sonucu, favori-underdog farkı, skor yönetimi",
    color: "#059669" // Emerald Green
  },
  { 
    id: 2,
    emoji: "🧩",
    title: "İlk 11 & Diziliş Kararı", 
    weight: 18,
    description: "Pozisyon, oyuncu-rol uyumu, rakibe göre diziliş",
    color: "#3B82F6" // Blue
  },
  { 
    id: 3,
    emoji: "🔁",
    title: "Oyuncu Değişiklikleri", 
    weight: 17,
    description: "Zamanlama, giren oyuncunun katkısı, skora etki",
    color: "#A855F7" // Purple
  },
  { 
    id: 4,
    emoji: "⏱️",
    title: "Maç İçi Reaksiyon", 
    weight: 15,
    description: "Gole tepki, tempo kontrolü, kritik anlar",
    color: "#F97316" // Orange
  },
  { 
    id: 5,
    emoji: "🟨",
    title: "Disiplin & Takım Kontrolü", 
    weight: 10,
    description: "Kart sayısı, gereksiz kartlar, oyun kontrolü",
    color: "#EAB308" // Yellow
  },
  { 
    id: 6,
    emoji: "🧠",
    title: "Maç Sonu Yönetimi", 
    weight: 10,
    description: "Skoru koruma, son dakika hamleleri, risk dengesi",
    color: "#6366F1" // Indigo
  },
  { 
    id: 7,
    emoji: "🎤",
    title: "Basınla İlişkiler & Sempati", 
    weight: 10,
    description: "Basın toplantısı, röportaj tavrı, kamuoyu yönetimi",
    color: "#14B8A6" // Teal
  },
];

export function MatchRatings({ matchData }: MatchRatingsProps) {
  // Coach rating state - each category rated 0-10
  const [coachRatings, setCoachRatings] = useState({
    1: 7.5,
    2: 8.0,
    3: 6.5,
    4: 7.0,
    5: 8.5,
    6: 7.5,
    7: 8.0,
  });

  // Community average ratings (mock data)
  const communityRatings = {
    1: 8.2,
    2: 7.3,
    3: 7.8,
    4: 6.9,
    5: 7.5,
    6: 8.1,
    7: 7.7,
  };

  const totalVoters = 1247; // Mock data

  // Calculate total weighted score
  const calculateTotalScore = () => {
    let total = 0;
    coachCategories.forEach((category) => {
      total += (coachRatings[category.id as keyof typeof coachRatings] * category.weight) / 100;
    });
    return total.toFixed(1);
  };

  // Calculate community total score
  const calculateCommunityScore = () => {
    let total = 0;
    coachCategories.forEach((category) => {
      total += (communityRatings[category.id as keyof typeof communityRatings] * category.weight) / 100;
    });
    return total.toFixed(1);
  };

  // Get rating text
  const getRatingText = (score: number) => {
    if (score >= 9) return "Muhteşem";
    if (score >= 8) return "Harika";
    if (score >= 7) return "İyi";
    if (score >= 6) return "Orta";
    if (score >= 5) return "Zayıf";
    return "Kötü";
  };

  const totalScore = parseFloat(calculateTotalScore());
  const communityScore = parseFloat(calculateCommunityScore());

  return (
    <div className="px-4 py-6 space-y-4 pb-20">
      {/* Header */}
      <div className="mb-2">
        <h1 className="font-bold text-foreground mb-1">Teknik Direktörü Değerlendirin</h1>
        <p className="text-xs text-muted-foreground">
          Her kategoriyi puanlayarak TD performansını değerlendirin
        </p>
      </div>

      {/* Total Score Card - Minimal & Clean */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#059669] to-[#047857] rounded-2xl p-5 shadow-sm"
      >
        <div className="text-center mb-4">
          <p className="text-[10px] uppercase tracking-wider text-white/70 mb-2">
            Sizin Puanınız
          </p>
          
          <div className="mb-3">
            <div className="text-5xl font-bold text-white mb-1">
              {calculateTotalScore()}
            </div>
            <p className="text-xs text-white/80">{getRatingText(totalScore)} / 10.0</p>
          </div>
          
          {/* Progress Bar - Minimal */}
          <div className="flex items-center justify-center gap-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-all ${
                  i < Math.floor(totalScore)
                    ? "bg-white shadow-sm"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Community Average */}
        <div className="pt-4 border-t border-white/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">👥</span>
              <p className="text-[10px] text-white/70">Topluluk Ortalaması</p>
            </div>
            <p className="text-[9px] text-white/60">{totalVoters.toLocaleString()} oy</p>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white">
              {calculateCommunityScore()}
            </div>
            <div className="text-xs text-white/70">
              {getRatingText(communityScore)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rating Categories - Clean & Minimal */}
      <div className="space-y-3">
        {coachCategories.map((category, index) => {
          const currentRating = coachRatings[category.id as keyof typeof coachRatings];
          const communityRating = communityRatings[category.id as keyof typeof communityRatings];
          
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-card border border-border rounded-xl p-4 shadow-sm"
            >
              {/* Category Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{category.emoji}</span>
                    <h3 className="text-sm font-bold text-foreground">
                      {category.title}
                    </h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                </div>
                <div className="ml-3 text-right flex-shrink-0">
                  <div className="text-[9px] text-muted-foreground mb-0.5 uppercase tracking-wider">Ağırlık</div>
                  <div className="text-sm font-bold text-[#059669]">
                    %{category.weight}
                  </div>
                </div>
              </div>

              {/* Rating Display - User vs Community */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {/* User Rating */}
                  <div>
                    <div className="text-[9px] text-muted-foreground mb-1">Sizin Puanınız</div>
                    <div className="text-xl font-bold" style={{ color: category.color }}>
                      {currentRating.toFixed(1)}
                    </div>
                  </div>
                  {/* Community Rating */}
                  <div>
                    <div className="text-[9px] text-muted-foreground mb-1 flex items-center gap-1">
                      <span>👥</span>
                      <span>Topluluk</span>
                    </div>
                    <div className="text-xl font-bold text-muted-foreground">
                      {communityRating.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Bar */}
              <div className="mb-3">
                <div className="relative w-full h-8 bg-muted rounded-lg overflow-hidden">
                  {/* User Progress */}
                  <div 
                    className="absolute left-0 top-0 h-full rounded-lg transition-all duration-300"
                    style={{ 
                      width: `${(currentRating / 10) * 100}%`,
                      backgroundColor: category.color,
                      opacity: 0.4
                    }}
                  />
                  {/* Community Indicator */}
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-foreground transition-all duration-300"
                    style={{ 
                      left: `${(communityRating / 10) * 100}%`,
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px]">
                      👥
                    </div>
                  </div>
                  {/* Scale markers */}
                  <div className="absolute inset-0 flex items-center justify-between px-2">
                    {[0, 2, 4, 6, 8, 10].map((num) => (
                      <div key={num} className="text-[8px] text-muted-foreground/40 font-medium">
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground">
                    {currentRating > communityRating 
                      ? `+${(currentRating - communityRating).toFixed(1)} yukarıda`
                      : currentRating < communityRating
                      ? `-${(communityRating - currentRating).toFixed(1)} aşağıda`
                      : 'Toplulukla aynı'}
                  </span>
                </div>
              </div>

              {/* Slider - Clean */}
              <div className="relative mb-3">
                <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                  {/* Filled Track */}
                  <div 
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
                    style={{ 
                      width: `${(currentRating / 10) * 100}%`,
                      backgroundColor: category.color,
                      opacity: 0.3
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={currentRating}
                  onChange={(e) => {
                    setCoachRatings({
                      ...coachRatings,
                      [category.id]: parseFloat(e.target.value),
                    });
                  }}
                  style={{
                    // @ts-ignore
                    '--slider-color': category.color,
                  }}
                  className="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-background
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:active:scale-110
                    [&::-moz-range-thumb]:w-5
                    [&::-moz-range-thumb]:h-5
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:shadow-md
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-background
                    [&::-moz-range-thumb]:border-0"
                />
                <style>
                  {`
                    input[type="range"]::-webkit-slider-thumb {
                      background: ${category.color};
                    }
                    input[type="range"]::-moz-range-thumb {
                      background: ${category.color};
                    }
                  `}
                </style>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[9px] text-muted-foreground">0</span>
                  <span className="text-[9px] text-muted-foreground">10</span>
                </div>
              </div>

              {/* Quick Rating Buttons - Minimal */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider mr-1">Hızlı:</span>
                {[5, 7, 8, 9, 10].map((quickRating) => (
                  <button
                    key={quickRating}
                    onClick={() => {
                      setCoachRatings({
                        ...coachRatings,
                        [category.id]: quickRating,
                      });
                    }}
                    className="flex-1 h-8 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: currentRating === quickRating ? category.color : 'hsl(var(--muted))',
                      color: currentRating === quickRating ? 'white' : 'hsl(var(--muted-foreground))'
                    }}
                  >
                    {quickRating}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bonus Info - Clean */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-dashed border-border rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">⭐</span>
          <h3 className="text-sm font-bold text-foreground">Bonus Faktörler</h3>
          <span className="ml-auto text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            Ağırlık dışı
          </span>
        </div>
        <div className="space-y-2 text-[10px] text-muted-foreground">
          <p>• Kırmızı karta rağmen direniş</p>
          <p>• Eksik kadro yönetimi</p>
          <p>• Genç oyuncu katkısı</p>
          <p>• Kriz anı liderliği</p>
        </div>
      </motion.div>
    </div>
  );
}